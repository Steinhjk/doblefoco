// @ts-check
/**
 * El handshake de versión entre el cliente y el motor (I-7 / 2-B).
 *
 * QUÉ COMPARA, Y POR QUÉ NO COMPARA COMMITS. El cliente lleva incrustada la
 * huella del registro de medios con el que se construyó
 * (`__REGISTRO_HASH_ESPERADO__`, puesta por `vite.config.js`); el motor publica
 * la suya en `/api/health` (`version.registroHash`). Si difieren, el sitio y su
 * motor están sirviendo CATÁLOGOS distintos — que es el desfase que el lector
 * sufre, y el que ya mordió dos veces: 37 feeds contra 39, tres secciones
 * contando en cero. Un commit distinto, en cambio, no prueba nada: los commits
 * de prosa nunca llegan a la imagen del motor, y acusar por ellos es la alarma
 * falsa que enseña a ignorar el aviso. El commit se reporta como diagnóstico en
 * la consola, no como veredicto en la pantalla.
 *
 * CUÁNDO NO ACUSA, Y ES DELIBERADO. Sin datos no hay veredicto: si la API no
 * responde (eso ya lo grita el propio feed), si el motor todavía no publica la
 * huella (versión anterior a esta función: el arranque de la función no puede
 * nacer acusando), o si el bundle no la lleva (pruebas, SSR). La regla es la
 * de siempre: acusar sin poder comprobar es peor que callar.
 */

import { fetchHealth } from './apiClient.js';

/**
 * La huella que este bundle espera del motor, leída con guarda: en las pruebas
 * y en el servidor el `define` de Vite no existe.
 *
 * @returns {string | null}
 */
export function hashEsperadoDelBundle() {
    try {
        return typeof __REGISTRO_HASH_ESPERADO__ === 'string'
            ? __REGISTRO_HASH_ESPERADO__
            : null;
    } catch {
        return null;
    }
}

/**
 * @typedef {Object} Veredicto
 * @property {'coinciden' | 'desfase' | 'sin-datos'} estado
 * @property {string | null} motorHash    La huella que publicó el motor.
 * @property {string | null} esperadoHash La huella de este bundle.
 * @property {number | null} motorFeeds   Feeds que lee el motor, para el detalle.
 * @property {string | null} motorCommit  Diagnóstico para la consola, no veredicto.
 */

/**
 * Compara las dos huellas. Función pura: todo lo que necesita entra por
 * parámetros, para que las pruebas no dependan del `define` ni de la red.
 *
 * @param {string | null} esperadoHash
 * @param {{ version?: { registroHash?: string, feeds?: number, commit?: string } } | null | undefined} salud
 * @returns {Veredicto}
 */
export function evaluarHandshake(esperadoHash, salud) {
    const version = salud?.version;
    const motorHash = typeof version?.registroHash === 'string' ? version.registroHash : null;
    const base = {
        motorHash,
        esperadoHash,
        motorFeeds: typeof version?.feeds === 'number' ? version.feeds : null,
        motorCommit: typeof version?.commit === 'string' ? version.commit : null,
    };

    if (!esperadoHash || !motorHash) return { estado: 'sin-datos', ...base };
    if (motorHash === esperadoHash) return { estado: 'coinciden', ...base };
    return { estado: 'desfase', ...base };
}

/**
 * Pregunta al motor y evalúa. Nunca lanza: sin respuesta es `sin-datos`.
 *
 * @returns {Promise<Veredicto>}
 */
export async function comprobarDesfaseConElMotor() {
    const esperado = hashEsperadoDelBundle();
    if (!esperado) return evaluarHandshake(null, null);

    const result = await fetchHealth();
    return evaluarHandshake(esperado, result.ok ? result.health : null);
}
