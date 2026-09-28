// @ts-check
import { inject } from '@vercel/analytics';

/**
 * ANALÍTICA — M1.2 del plan del MVP, decidida por Jose el 2026-09-28.
 *
 * Es la de Vercel: sin cookies y sin perfil del lector. El script y sus envíos
 * van a `/_vercel/insights/…`, en el mismo origen, así que la CSP
 * (`script-src 'self'`, `connect-src 'self'`) no se abre a nadie.
 *
 * LO QUE NO SE MANDA: la parte de la URL después del `?`, salvo los `utm_*`.
 * Una búsqueda (`/buscar?q=…`) puede llevar un nombre propio o algo que el
 * lector no quiere dejar en un panel ajeno, y los filtros no dicen nada que
 * haga falta medir. Los `utm_*` sí se conservan porque son lo único para lo que
 * se quería la analítica al compartir (decisión del 2026-09-15).
 *
 * Lo que se mide está declarado en `/transparencia/datos`. Si se cambia aquí,
 * se cambia allí.
 */

/**
 * La URL que se manda: la misma, sin parámetros salvo los `utm_*`, y sin `#`.
 *
 * @param {string} url
 * @returns {string}
 */
export function urlSinDatosDelLector(url) {
    const u = new URL(url);
    for (const clave of [...u.searchParams.keys()]) {
        if (!clave.startsWith('utm_')) u.searchParams.delete(clave);
    }
    u.hash = '';
    return u.toString();
}

/** Arranca la analítica. Solo en producción: en local no se mide nada. */
export function iniciarAnalitica() {
    inject({
        mode: 'production',
        beforeSend: (evento) => ({ ...evento, url: urlSinDatosDelLector(evento.url) }),
    });
}
