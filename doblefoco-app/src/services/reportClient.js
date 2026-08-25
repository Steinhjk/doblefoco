/**
 * Envío de reportes del lector — tarea F2-07.
 *
 * Deliberadamente minúsculo y silencioso.
 *
 * No lanza, no reintenta y no devuelve nada útil. Un reporte es una pista para
 * la revisión editorial, no una transacción del lector: si el servidor no
 * responde, quien está leyendo la noticia no tiene nada que hacer al respecto,
 * y mostrarle un error sobre un mecanismo interno sería convertir un detalle
 * nuestro en un problema suyo.
 *
 * Perder un reporte es asumible. Interrumpir la lectura, no.
 */

import { API_BASE, HAY_API } from './apiBase.js';



/**
 * @param {string} storyId
 * @param {string} kind 'preciso' | 'falta-izquierda' | 'falta-derecha' |
 *   'medio-mal-clasificado' | 'historias-distintas'
 */
export function sendReport(storyId, kind) {
    if (!HAY_API || !storyId || !kind) return;

    // Sin `await` a propósito: el componente no espera. `keepalive` permite que
    // la petición sobreviva si el lector navega a otra página justo después de
    // pulsar, que es exactamente cuando más probable es que lo haga.
    fetch(`${API_BASE}/api/report/${encodeURIComponent(storyId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
        keepalive: true,
    }).catch(() => {
        /* silencio intencional: ver la cabecera del archivo */
    });
}
