// @ts-check

/**
 * LA MISMA RESPUESTA NO SE CALCULA DOS VECES EN UN MINUTO.
 *
 * POR QUÉ EXISTE (2026-09-22, M1.4 del plan del MVP)
 * --------------------------------------------------
 * El simulacro de tráfico de ese día (SIMULACRO_TRAFICO.md) encontró que el
 * sitio se saturaba hacia las 2 visitas por segundo, y no por falta de máquina:
 * cada visita volvía a leer 100 historias de la base, contar el corpus,
 * calcular el vocabulario y reagrupar sucesos, y el pooler de Supabase admite
 * 15 conexiones para todo. Los datos, mientras tanto, cambian cada 30 minutos,
 * con el ciclo del motor. Era el mismo trabajo, idéntico, repetido para cada
 * visitante.
 *
 * QUÉ HACE. Guarda en memoria el resultado de `calcular` durante `ttlMs`. Y lo
 * que importa bajo carga: si llegan cien peticiones a la vez con la entrada
 * caducada, **calcula una sola** y las otras noventa y nueve esperan esa misma
 * promesa. Sin eso, cada caducidad sería una estampida contra la base, que es
 * justo la avería que se quería quitar.
 *
 * QUÉ NO HACE. No guarda errores: si `calcular` lanza, la siguiente petición lo
 * vuelve a intentar. No sustituye a la base como fuente de verdad: cada máquina
 * tiene su copia y puede ir hasta `ttlMs` por detrás, lo cual es invisible con
 * datos que cambian cada media hora.
 *
 * `ttlMs = 0` lo apaga entero (se calcula siempre). Es lo que usan las pruebas
 * que necesitan ver la base, y lo que permite medir el antes y el después con
 * el mismo binario.
 */

/**
 * @template T
 * @typedef {{ expira: number, valor: T } | { expira: 0, enCurso: Promise<T> }} Entrada
 */

/**
 * @param {{ ttlMs: number, maxEntradas?: number, ahora?: () => number }} opciones
 */
export function crearCache({ ttlMs, maxEntradas = 500, ahora = Date.now }) {
    /** @type {Map<string, any>} */
    const entradas = new Map();

    /**
     * @template T
     * @param {string} clave
     * @param {() => Promise<T>} calcular
     * @param {number} [ttlPropio] para las entradas que caducan antes que el resto
     * @returns {Promise<T>}
     */
    async function obtener(clave, calcular, ttlPropio = ttlMs) {
        if (ttlPropio <= 0) return calcular();

        const actual = entradas.get(clave);
        if (actual?.enCurso) return actual.enCurso;
        if (actual && actual.expira > ahora()) return actual.valor;

        const enCurso = calcular().then(
            (valor) => {
                entradas.set(clave, { expira: ahora() + ttlPropio, valor });
                return valor;
            },
            (error) => {
                entradas.delete(clave);
                throw error;
            },
        );
        entradas.set(clave, { expira: 0, enCurso });

        // Un techo, para que una lista de claves sin fin (combinaciones de
        // filtros en la URL) no haga crecer la memoria sin límite. Se tira lo
        // más viejo: el Map recuerda el orden de inserción.
        if (entradas.size > maxEntradas) {
            const masVieja = entradas.keys().next().value;
            if (masVieja !== undefined && masVieja !== clave) entradas.delete(masVieja);
        }

        return enCurso;
    }

    return { obtener, tamano: () => entradas.size, vaciar: () => entradas.clear() };
}
