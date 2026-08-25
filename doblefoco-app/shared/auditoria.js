// @ts-check

import { decimal } from './numeros.js';

/**
 * EL VOCABULARIO DE LA AUDITORÍA — lo único que el script y el panel comparten.
 *
 * Por qué existe este archivo, y por qué está en `shared/`
 * -------------------------------------------------------
 * `scripts/auditoria.mjs` toca la red y escribe `auditoria/estado.json`. El
 * panel de administración lee ese archivo y lo pinta. Si cada uno decidiera por
 * su cuenta qué es «sano» y qué es «revisar», acabarían discrepando en silencio:
 * el informe de la terminal diría una cosa y la pantalla otra sobre los mismos
 * números. Es exactamente la duplicación que este proyecto ya pagó cara con el
 * User-Agent copiado en cinco archivos.
 *
 * Así que aquí vive **lo que no toca la red**: las medidas derivadas y los
 * umbrales, con su porqué. Nada de `fetch`, nada de `node:fs` — esto se empaqueta
 * con el cliente.
 *
 * LO QUE ESTE ARCHIVO NO HACE, Y ES DELIBERADO
 * --------------------------------------------
 * No inventa un umbral de caducidad para las fichas de propiedad. Ya se decidió
 * que no lo hay: la ficha de EL DIARIO de Boyacá caducó en tres días y la de La
 * Libertad cambió entera en otros tres. Los días desde la última comprobación se
 * enseñan y se ordenan; el juicio lo pone quien mira. Los umbrales que sí están
 * aquí son los del FEED, que sí se pueden medir contra el motor.
 */

/**
 * Versión del formato de `auditoria/estado.json`.
 *
 * El panel la comprueba antes de fiarse del archivo. Un archivo que escribe un
 * bot cada semana y que se lee sin mirar es la manera de que un cambio de
 * formato reviente la pantalla de administración y solo se descubra al abrirla.
 */
export const VERSION_AUDITORIA = 1;

/**
 * Cada cuánto sondea el motor, en horas, y cuántos ítems toma de cada feed.
 *
 * Se declaran aquí y no se importan de `server/services/ingestDaemon.js` a
 * propósito: ese módulo arrastra el motor entero —y con él la base de datos— y
 * esto se empaqueta con el CLIENTE. Hay una prueba que comprueba que los dos
 * números siguen coincidiendo, que es la manera de tener la copia sin tener la
 * divergencia.
 */
export const CICLO_HORAS = 0.5;
export const ITEMS_POR_CICLO = 15;

/**
 * Cada cuánto pasa la RED DE SEGURIDAD, que es un reloj distinto y peor.
 *
 * El motor tiene el suyo propio cada media hora, pero si el motor se cae lo
 * único que queda alimentando es el cron de `ingest.yml`, cada dos horas. Y ese
 * margen es otro: La Libertad publica 122 piezas al día, cabe 5,9 veces en un
 * sondeo de media hora y solo 1,5 en uno de dos. **Mientras el motor viva no
 * pasa nada; el día que se caiga, empezaríamos a perder piezas sin que nada lo
 * dijera** — y esto es lo que lo dice.
 */
export const RED_HORAS = 2;

/**
 * Los estados de un chequeo, **en palabras y no en colores**.
 *
 * En este proyecto el rojo y el azul están tomados por el espectro político: un
 * feed pintado de rojo se leería como un medio de izquierda. Todo lo que aquí se
 * afirma va con una palabra, y el color —si lo hay— solo la acompaña.
 *
 *   sano            respondió y sirve para lo que lo usamos.
 *   revisar         responde, pero algo no cuadra y merece que alguien mire.
 *   roto            no sirve: la afirmación que sostenía ya no se sostiene.
 *   no-comprobable  no se puede saber DESDE AQUÍ. No es un aprobado ni un
 *                   suspenso, y confundirlo con cualquiera de los dos es el
 *                   error que este proyecto ya cometió dando por muertos a
 *                   Vorágine y Razón Pública, que responden desde casa.
 */
export const ESTADOS = /** @type {const} */ (['sano', 'revisar', 'roto', 'no-comprobable']);

/** De peor a mejor, para ordenar una tabla por lo que más urge mirar. */
const ORDEN_GRAVEDAD = { roto: 0, revisar: 1, 'no-comprobable': 2, sano: 3 };

/** Comparador para `Array.prototype.sort`: primero lo roto, al final lo sano. */
export const porGravedad = (a, b) =>
    (ORDEN_GRAVEDAD[a] ?? 99) - (ORDEN_GRAVEDAD[b] ?? 99);

/**
 * El peor estado de un conjunto. Un medio con el feed sano y una fuente rota
 * está roto: el resumen de una fila no puede ser más benévolo que su peor parte.
 */
export function peorEstado(estados) {
    const validos = estados.filter((e) => e in ORDEN_GRAVEDAD);
    if (!validos.length) return 'no-comprobable';
    return validos.reduce((peor, e) => (porGravedad(e, peor) < 0 ? e : peor));
}

const HORA_MS = 3_600_000;

/**
 * LA VENTANA REAL DE UN FEED, que es la medida que faltaba.
 *
 * `check:feeds` contaba «50 ítems» y se quedaba tranquilo. Pero cincuenta ítems
 * que cubren nueve horas y cincuenta que cubren tres semanas son dos medios
 * distintos, y solo uno de los dos se nos puede escapar entre sondeo y sondeo.
 *
 * La ventana es cuánto tiempo abarca lo que el feed acaba de devolver: del ítem
 * más nuevo al más viejo. Con menos de dos fechas no hay ventana —no se afirma
 * nada, se devuelve `null`—, y con todos los ítems publicados en el mismo minuto
 * tampoco: una ventana de cero no permite dividir.
 *
 * @param {number[]} fechasMs Marcas de tiempo de los ítems, en cualquier orden.
 */
export function ventanaYRitmo(fechasMs) {
    const validas = fechasMs.filter((t) => Number.isFinite(t));
    if (validas.length < 2) return { ventanaHoras: null, piezasPorDia: null };

    const ventanaHoras = (Math.max(...validas) - Math.min(...validas)) / HORA_MS;
    if (ventanaHoras <= 0) return { ventanaHoras: 0, piezasPorDia: null };

    /*
     * `n - 1` y no `n`: entre cincuenta ítems hay cuarenta y nueve huecos. Con
     * `n` el ritmo sale inflado justo en los feeds cortos, que son los que peor
     * se miden y de los que más se sospecha.
     */
    return { ventanaHoras, piezasPorDia: ((validas.length - 1) / ventanaHoras) * 24 };
}

/**
 * ¿CABE EN UN SONDEO LO QUE EL MEDIO PUBLICA ENTRE DOS SONDEOS?
 *
 * El motor toma 15 ítems cada media hora. Un medio que publica 122 piezas al día
 * saca 2,5 en esa media hora: caben de sobra. Uno que publicara 800 al día no
 * cabría, y perderíamos piezas sin que nada avisara — el feed respondería «✓» y
 * el corpus estaría incompleto.
 *
 * El margen es cuántas veces cabe. Por debajo de 1 se pierde contenido; por
 * debajo de 2 se pierde en cuanto el medio tenga una hora movida, que es lo que
 * pasa el día de una noticia grande. **Y sirve para responder qué cadencia
 * aguanta un barrido**: con `cicloHoras = 24`, ese mismo medio de 122 piezas
 * diarias da margen 0,12 — un barrido diario perdería el 88 % de lo que publica.
 *
 * @returns {number|null} veces que cabe, o `null` si no se conoce el ritmo.
 */
export function margenDeSondeo(piezasPorDia, cicloHoras = CICLO_HORAS, itemsPorCiclo = ITEMS_POR_CICLO) {
    if (!Number.isFinite(piezasPorDia) || piezasPorDia === null || piezasPorDia <= 0) return null;
    const piezasEnUnCiclo = (piezasPorDia / 24) * cicloHoras;
    if (piezasEnUnCiclo <= 0) return null;
    return itemsPorCiclo / piezasEnUnCiclo;
}

/**
 * CUÁNTOS HUECOS DE SILENCIO SE TOLERAN ANTES DE DECIR QUE UN FEED ESTÁ PARADO.
 *
 * Tres, y el número sale de los datos y no del gusto. Vorágine publica una pieza
 * cada ~80 h: con dos huecos, un mes tranquilo suyo lo declararía roto. Con tres
 * hay margen para su cadencia real y sigue sobrando para cazar a Telemedellín,
 * que publica cada media hora y lleva días callado — ahí el silencio son cientos
 * de huecos, no tres.
 */
const HUECOS_ANTES_DE_PARADO = 3;

/**
 * QUE UN FEED NO CONTESTE NO ES SIEMPRE UN DEFECTO DEL CATÁLOGO.
 *
 * Esta distinción ya gobernaba las FUENTES desde el primer día —un 403 sale «no
 * comprobable» y no «roto», porque la URL puede estar viva para un lector—, y yo
 * no se la había aplicado a los feeds. La primera pasada del libro de hallazgos
 * lo puso delante: fichó a **Razón Pública** como defecto del catálogo por un
 * «Client network socket disconnected before secure TLS connection», que es
 * literalmente el caso que este proyecto tiene documentado como *falla por la
 * red, no por el feed*.
 *
 * Y con el libro la confusión se paga más cara que antes: un tropiezo de red se
 * convertía en una entrada con antigüedad, que la semana siguiente se marcaba
 * resuelta y a la otra reaparecía como crónica. Ruido con memoria.
 *
 *   NO COMPROBABLE   no llegamos: TLS, DNS, timeout, socket, o su servidor
 *                    devolvió 5xx o nos rechazó. Se dice y se pide repetir en
 *                    local, igual que con las fuentes.
 *   ROTO             llegamos y lo que hay no sirve: 404, o responde algo que no
 *                    es un feed. Eso sí es nuestro, y hay que cambiar la URL.
 */
function noRespondio(v) {
    const error = v.error ?? 'no respondió';
    const texto = String(error).toLowerCase();

    /*
     * Solo dos códigos significan «esto no existe», y son los únicos que se
     * cobran como defecto nuestro. Un 403, un 429 o un 500 son el servidor del
     * medio diciendo algo sobre sí mismo o sobre nosotros, no sobre la URL.
     */
    if (/status code (404|410)/.test(texto)) return { estado: 'roto', motivo: error };

    // Llegamos y lo que sirve no es un feed.
    if (/not recognized|invalid|unexpected (close tag|end)|non-whitespace/.test(texto))
        return { estado: 'roto', motivo: `no devuelve un feed válido: ${error}` };

    return {
        estado: 'no-comprobable',
        motivo: `no se pudo llegar (${error}). Repetir en local antes de darlo por roto`,
    };
}

/**
 * CERO PIEZAS FRESCAS SON DOS COSAS DISTINTAS, Y CONFUNDIRLAS ACUSA AL INOCENTE.
 *
 * Este es el fallo que los datos reales destaparon en la primera pasada. La
 * versión anterior decía «roto» en cuanto ningún ítem entraba en la ventana de
 * retención, y con eso metía en el mismo saco a:
 *
 *   VORÁGINE, que saca una pieza cada 80 horas. Que nada suyo entre en una
 *   ventana de 72 h no es una avería: es su oficio. Es periodismo de
 *   investigación, y llamarlo roto es exactamente el error contra el que ya
 *   avisaba `verifyFeeds.mjs`.
 *
 *   TELEMEDELLÍN, que publica 51 piezas al día —una cada media hora— y tampoco
 *   tiene ninguna fresca. Eso sí está roto: su feed se quedó congelado en un
 *   rato de hace días.
 *
 * Lo que los separa no es el ritmo ni el número de frescos: es **la edad de la
 * pieza más nueva, medida contra el propio ritmo del medio**. Un feed sano está
 * como mucho a un hueco de haber publicado. A tres huecos de silencio, algo pasa.
 */
function sinNadaFresco(v) {
    if (v.edadMasNuevoHoras === null || v.edadMasNuevoHoras === undefined)
        return { estado: 'roto', motivo: 'responde, pero ninguna pieza trae fecha: no se puede saber' };

    // Sin ritmo conocido no se puede comparar contra nada. Se dice el hecho y no
    // se firma la causa: «no comprobable» es la respuesta honesta.
    if (!v.piezasPorDia)
        return {
            estado: 'no-comprobable',
            motivo: `nada entra en la ventana y no se le puede medir el ritmo (lo más nuevo, de hace ${Math.round(v.edadMasNuevoHoras)} h)`,
        };

    const huecoHoras = 24 / v.piezasPorDia;
    const huecos = v.edadMasNuevoHoras / huecoHoras;

    if (huecos > HUECOS_ANTES_DE_PARADO)
        return {
            estado: 'roto',
            motivo: `el feed está parado: publica una pieza cada ${decimal(huecoHoras, 1)} h y lo más nuevo es de hace ${Math.round(v.edadMasNuevoHoras)} h`,
        };

    return {
        estado: 'revisar',
        motivo: `publica despacio —una pieza cada ${decimal(huecoHoras, 1)} h— y por eso nada suyo entra en la ventana. Es su cadencia, no una avería: aporta poco y no está roto`,
    };
}

/**
 * El estado de un feed, con el motivo escrito para que nadie tenga que deducirlo.
 *
 * EL ORDEN DE LAS PREGUNTAS ES EL ARGUMENTO. Primero si contestó, luego si lo
 * que trae entra en la ventana de retención —«responder no es alimentar», la
 * lección que costó meses de W Radio en verde—, y solo después el ritmo. Un feed
 * que no entrega nada no necesita que además le midamos la holgura.
 *
 * @param {{
 *   respondio: boolean, items: number, frescos: number, tomados: number,
 *   margen: number|null, cronologico: boolean|null, error?: string|null,
 *   piezasPorDia?: number|null, edadMasNuevoHoras?: number|null
 * }} v
 */
export function clasificarFeed(v) {
    if (!v.respondio) return noRespondio(v);
    if (v.items === 0) return { estado: 'roto', motivo: 'respondió sin artículos' };
    if (v.frescos === 0) return sinNadaFresco(v);

    if (v.margen !== null && v.margen < 1)
        return {
            estado: 'revisar',
            motivo: `publica más de lo que cabe en un sondeo (margen ${decimal(v.margen, 2)}×): se pierden piezas`,
        };
    if (v.margen !== null && v.margen < 2)
        return {
            estado: 'revisar',
            motivo: `margen estrecho (${decimal(v.margen, 1)}×): un día movido desborda el sondeo`,
        };

    /*
     * Desordenado Y viejo es un feed por relevancia: existen piezas más nuevas
     * que no nos está dando. Desordenado y fresco da igual —si todo lo que llega
     * es de hace una hora, el orden no cambia nada— y por eso no se avisa.
     */
    if (v.cronologico === false && v.frescos < v.tomados)
        return { estado: 'revisar', motivo: 'ordenado por relevancia: hay piezas nuevas que no nos da' };

    return { estado: 'sano', motivo: null };
}

/**
 * Recuento del estado guardado, para la cabecera del panel.
 *
 * Vive aquí y no en el componente porque la misma cuenta la imprime el script al
 * terminar, y dos cuentas del mismo archivo que puedan no coincidir es peor que
 * no contar.
 *
 * @param {{ medios?: Record<string, any> }|null|undefined} estado
 */
export function resumirAuditoria(estado) {
    const medios = Object.values(estado?.medios ?? {});
    const cuenta = (predicado) => medios.filter(predicado).length;

    return {
        medios: medios.length,
        feedsRotos: cuenta((m) => m.feed?.estado === 'roto'),
        feedsARevisar: cuenta((m) => m.feed?.estado === 'revisar'),
        fuentesRotas: medios.reduce(
            (n, m) => n + (m.fuentes ?? []).filter((f) => f.estado === 'roto').length,
            0,
        ),
        rutasTrampa: cuenta((m) => m.rutas?.respondeATodo === true),
        rescatadosPorUa: cuenta((m) => m.reintentoUaLimpio === true),
        noComprobables: cuenta((m) => peorEstado(estadosDe(m)) === 'no-comprobable'),
        conDefecto: cuenta((m) => {
            const peor = peorEstado(estadosDe(m));
            return peor === 'roto' || peor === 'revisar';
        }),
    };
}

/** Los estados que una fila de medio aporta al resumen de esa fila. */
export function estadosDe(medio) {
    return [
        medio?.feed?.estado,
        ...(medio?.fuentes ?? []).map((f) => f.estado),
        medio?.rutas?.estado,
    ].filter(Boolean);
}
