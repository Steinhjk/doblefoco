/**
 * Capa de PRESENTACIÓN de los medios.
 *
 * Ya no contiene datos: el sesgo, la factualidad y el dominio viven en
 * shared/mediaRegistry.js. Antes este archivo declaraba sus propios valores y
 * divergía de los otros dos lugares donde también estaban declarados (hasta
 * 0.25 de diferencia en El Nuevo Siglo).
 *
 * Aquí solo se decide cómo se ve un medio: logo, color y nombre corto.
 */

import {
    MEDIA_REGISTRY,
    findMediaByName,
    getMediaByDomain,
} from '../../shared/mediaRegistry.js';
import { classifySpectrum } from '../../shared/biasAnalysis.js';

/** Logo derivado del dominio real, no del nombre. */
function logoFor(domain) {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

/**
 * Color del borde según el espectro.
 *
 * El centro devolvía '#ffffff', que en tema claro coincide con --bg-card:
 * el borde quedaba literalmente invisible. Ahora usa una variable de tema.
 */
export function getBiasSpectrumColor(bias) {
    const spectrum = classifySpectrum(typeof bias === 'number' ? bias : 0);
    if (spectrum === 'left') return 'var(--bias-left)';
    if (spectrum === 'right') return 'var(--bias-right)';
    return 'var(--text-muted)';
}

function toPresentation(media) {
    return {
        id: media.id,
        name: media.name,
        shortName: media.shortName,
        domain: media.domain,
        bias: media.bias,
        factuality: media.factuality,
        country: media.country,
        url: `https://${media.domain}`,
        logo: logoFor(media.domain),
        color: getBiasSpectrumColor(media.bias),
        isKnown: true,
    };
}

/**
 * Resuelve un medio para mostrarlo. SIEMPRE devuelve un objeto pintable.
 *
 * Dos correcciones respecto a la versión anterior:
 *
 *  1. La búsqueda es exacta (nombre normalizado o alias explícito), nunca
 *     parcial. La coincidencia difusa con `.includes()` en ambos sentidos
 *     hacía que "El País (España)" resolviera a "El País (Cali)" y que "La
 *     Vanguardia" de Barcelona resolviera a "Vanguardia" de Bucaramanga:
 *     medios distintos mostrados con el logo, el dominio y el sesgo de otro.
 *
 *  2. Nunca devuelve `null`. Antes lo hacía con nombre vacío, y los seis
 *     lugares que la consumen acceden directo a `.logo` o `.url`, así que un
 *     dato incompleto tumbaba la pantalla entera contra el ErrorBoundary.
 */
export function getMediaByName(name) {
    const known = findMediaByName(name);
    if (known) return toPresentation(known);

    const label = String(name ?? '').trim() || 'Fuente sin identificar';

    // Medio no catalogado: se muestra tal cual, sin inventar dominio ni logo.
    // El respaldo anterior construía la URL del icono a partir del nombre con
    // espacios incluidos (…?domain=the%20new%20york%20times.com), lo que
    // producía iconos rotos en las 100 noticias internacionales.
    return {
        id: null,
        name: label,
        shortName: label.length > 18 ? `${label.slice(0, 17)}…` : label,
        domain: null,
        bias: 0,
        factuality: null,
        country: null,
        url: `https://www.google.com/search?q=${encodeURIComponent(`${label} noticias`)}`,
        logo: null,
        color: 'var(--text-muted)',
        isKnown: false,
    };
}

export function getMediaByDomainName(domain) {
    const media = getMediaByDomain(domain);
    return media ? toPresentation(media) : null;
}

/** Catálogo completo en forma de presentación. */
export const COLOMBIAN_MEDIA = MEDIA_REGISTRY.filter((m) => m.country === 'CO').map(toPresentation);
export const ALL_MEDIA = MEDIA_REGISTRY.map(toPresentation);
