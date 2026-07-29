// @ts-check
/**
 * TELEMETRÍA DE ERRORES EN PRODUCCIÓN (F2-11)
 *
 * POR QUÉ EN LA BASE Y NO EN UN SERVICIO
 * --------------------------------------
 * Sentry o similares harían esto mejor, pero meten a un tercero más a ver el
 * tráfico del proyecto. DobleFoco retiró deliberadamente a Google del navegador
 * de sus lectores (fuentes y logos, 2026-07-29); añadir otro observador externo
 * a cambio de comodidad iría en contra de esa misma decisión. Ya hay Postgres
 * y ya está al lado de la API: una tabla basta.
 *
 * SE AGREGA POR HUELLA, y esto es lo que hace la diferencia entre una
 * herramienta y un problema nuevo. Un fallo dentro del ciclo de ingesta —que
 * recorre 2 600 artículos— escribiría miles de filas idénticas: el incidente
 * original más una base llena. Aquí el mismo error incrementa un contador.
 *
 * NADA DE LO QUE HAY AQUÍ PUEDE LANZAR. Un fallo registrando un fallo dejaría
 * al proceso peor que sin telemetría: se perdería el error original y se
 * añadiría uno nuevo, encima dentro de un manejador de errores.
 */

import { createHash } from 'node:crypto';
import { safeQuery } from './pool.js';

/** Recortes. Un mensaje enorme no aporta y sí ocupa. */
const MAX_MENSAJE = 500;
const MAX_PILA = 2_000;
const MAX_RUTA = 300;

/**
 * Cuántos errores distintos se aceptan por minuto.
 *
 * Un bucle de fallos podría intentar una escritura por iteración. Como se
 * agrega por huella, repetir el MISMO error es barato; lo que hay que acotar es
 * una avalancha de errores DISTINTOS, que sí produciría filas nuevas.
 */
const MAX_POR_MINUTO = 60;
let ventana = { inicio: 0, cuenta: 0 };

/**
 * Quita de un texto cualquier cosa que parezca una credencial.
 *
 * NO ES OPCIONAL. Los errores de `pg` incluyen la cadena de conexión, y esta
 * tabla se muestra en el panel: sin esto, la contraseña de Supabase acabaría
 * en pantalla —y en cualquier captura que alguien comparta para pedir ayuda.
 *
 * @param {string} texto
 */
export function redactar(texto) {
    return String(texto ?? '')
        // postgres://usuario:contraseña@host  →  se tapa solo la contraseña
        .replace(/(\b[a-z+]+:\/\/[^:/\s]+:)[^@\s]+(@)/gi, '$1***$2')
        // password=xxx, PGPASSWORD=xxx, token=xxx, apikey=xxx
        .replace(/\b(pass(?:word)?|pgpassword|token|api[_-]?key|secret)\s*[=:]\s*\S+/gi, '$1=***');
}

const recortar = (texto, max) => {
    const limpio = redactar(texto);
    return limpio.length > max ? `${limpio.slice(0, max)}…` : limpio;
};

/**
 * Huella de una clase de error.
 *
 * Se calcula SIN la pila y sin números variables del mensaje, porque si no cada
 * ocurrencia tendría huella distinta y volveríamos a una fila por ocurrencia,
 * que es justo lo que se quiere evitar.
 *
 * @param {{proceso: string, tipo: string, mensaje: string, ruta?: string|null}} datos
 */
export function calcularHuella({ proceso, tipo, mensaje, ruta }) {
    // Se reemplaza CUALQUIER token que contenga un dígito por '#'.
    //
    // Identificadores y cifras cambian entre ocurrencias del mismo fallo:
    // «story_12flvrc no existe» y «story_9xk2ab no existe» son el mismo error,
    // igual que «timeout tras 8000 ms» y «tras 12000 ms». Sin esto, cada
    // ocurrencia tendría su propia huella y volveríamos a una fila por
    // ocurrencia, que es exactamente lo que la agregación existe para evitar.
    //
    // Un patrón más fino —solo cifras sueltas, solo hexadecimal— no vale: el
    // guion bajo de `story_12flvrc` es carácter de palabra, así que \b no
    // encuentra frontera y el identificador se cuela entero. Está medido en las
    // pruebas.
    //
    // Agrupa de más en casos como «file1.js» y «file2.js», y se acepta: `tipo`
    // y `ruta` entran también en la huella y bastan para separar fallos que de
    // verdad son distintos.
    const normalizado = String(mensaje ?? '').replace(/\b\w*\d\w*\b/g, '#');

    return createHash('sha256')
        .update(`${proceso}|${tipo}|${normalizado}|${ruta ?? ''}`)
        .digest('hex')
        .slice(0, 32);
}

/**
 * Registra un error. Nunca lanza, nunca bloquea al llamante.
 *
 * @param {object} datos
 * @param {unknown} datos.error
 * @param {'api'|'motor'} datos.proceso
 * @param {'peticion'|'promesa'|'excepcion'|'tarea'} datos.origen
 * @param {string|null} [datos.ruta]
 * @returns {Promise<boolean>} si se llegó a registrar
 */
export async function registrarError({ error, proceso, origen, ruta = null }) {
    try {
        const ahora = Date.now();
        const minuto = Math.floor(ahora / 60_000);
        if (ventana.inicio !== minuto) ventana = { inicio: minuto, cuenta: 0 };
        if (ventana.cuenta >= MAX_POR_MINUTO) return false;
        ventana.cuenta += 1;

        const err = /** @type {any} */ (error);
        const tipo = err?.name ?? typeof error;
        const mensaje = recortar(err?.message ?? String(error), MAX_MENSAJE);
        const rutaLimpia = ruta ? recortar(ruta, MAX_RUTA) : null;
        const huella = calcularHuella({ proceso, tipo, mensaje, ruta: rutaLimpia });

        const resultado = await safeQuery(
            `
            INSERT INTO errores (huella, proceso, origen, tipo, mensaje, ruta, pila)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (huella) DO UPDATE
               SET veces       = errores.veces + 1,
                   ultima_vez  = now(),
                   -- Si volvió a ocurrir, deja de estar resuelto. Marcarlo en el
                   -- panel y que reaparezca en silencio sería el peor resultado.
                   resuelto_en = NULL
            `,
            [
                huella,
                proceso,
                origen,
                String(tipo).slice(0, 100),
                mensaje,
                rutaLimpia,
                err?.stack ? recortar(err.stack, MAX_PILA) : null,
            ],
            'registro de error'
        );

        return Boolean(resultado);
    } catch {
        // Deliberadamente mudo. Si registrar el error falla, avisar por consola
        // dentro de un manejador de errores puede realimentar el bucle que se
        // intentaba diagnosticar.
        return false;
    }
}

/**
 * Los errores vivos, lo más reciente primero.
 *
 * @param {{limite?: number, incluirResueltos?: boolean}} [opciones]
 */
export async function erroresRecientes({ limite = 50, incluirResueltos = false } = {}) {
    const resultado = await safeQuery(
        `
        SELECT huella, proceso, origen, tipo, mensaje, ruta, pila,
               veces, primera_vez, ultima_vez, resuelto_en
          FROM errores
         WHERE ($2::boolean OR resuelto_en IS NULL)
         ORDER BY ultima_vez DESC
         LIMIT $1
        `,
        [Math.min(Math.max(1, limite), 200), incluirResueltos],
        'lectura de errores'
    );

    return resultado?.rows ?? [];
}

/**
 * Marca un error como atendido. No lo borra: el historial de qué falló y
 * cuándo se arregló vale más que una tabla limpia.
 *
 * @param {string} huella
 */
export async function marcarResuelto(huella) {
    const resultado = await safeQuery(
        `UPDATE errores SET resuelto_en = now() WHERE huella = $1 AND resuelto_en IS NULL`,
        [huella],
        'resolución de error'
    );
    return (resultado?.rowCount ?? 0) > 0;
}

/** Cuántos errores sin atender hay ahora mismo. Para el indicador del panel. */
export async function contarSinResolver() {
    const resultado = await safeQuery(
        `SELECT count(*)::int AS total, coalesce(sum(veces), 0)::int AS ocurrencias
           FROM errores WHERE resuelto_en IS NULL`,
        [],
        'conteo de errores'
    );
    return resultado?.rows?.[0] ?? { total: 0, ocurrencias: 0 };
}
