/**
 * Normalización de historias y formato de fechas.
 *
 * Conviven dos formas de historia:
 *   · la del backend de ingesta (perspectivas reales o null, `publishedAt` ISO)
 *   · la del fixture de desarrollo mockData.js (`timestamp` como texto fijo,
 *     perspectivas siempre presentes)
 *
 * En lugar de repartir condicionales por toda la UI, todo entra por aquí y los
 * componentes consumen una sola forma. Cuando mockData desaparezca, se borra
 * la rama heredada y nada más cambia.
 */

import { analyzeCoverage, averageFactuality } from '../../shared/biasAnalysis.js';
import { findMediaByName } from '../../shared/mediaRegistry.js';

/**
 * Resuelve las fuentes contra el catálogo.
 *
 * El sesgo SIEMPRE sale del registro cuando el medio está catalogado, incluso
 * si el dato trae otro valor. Es lo que convierte a shared/mediaRegistry.js en
 * fuente única de verdad de hecho y no solo de intención: da igual que un
 * fixture antiguo o una respuesta obsoleta del backend traigan un sesgo
 * distinto, en pantalla se usa el del catálogo.
 *
 * Sin esto, el catálogo sería "la fuente de verdad salvo cuando los datos digan
 * otra cosa", que es exactamente la situación que provocó las divergencias.
 */
function resolveSources(rawSources) {
    return (Array.isArray(rawSources) ? rawSources : []).map((source) => {
        const media = findMediaByName(source?.name);

        if (!media) {
            return {
                name: source?.name ?? 'Fuente sin identificar',
                bias: typeof source?.bias === 'number' ? source.bias : 0,
                factuality: typeof source?.factuality === 'number' ? source.factuality : null,
                url: source?.url ?? null,
                isKnown: false,
            };
        }

        return {
            name: media.name,
            bias: media.bias,
            factuality: media.factuality,
            url: source?.url ?? `https://${media.domain}`,
            isKnown: true,
        };
    });
}

const rtf = new Intl.RelativeTimeFormat('es-CO', { numeric: 'auto' });

const UNITS = [
    ['year', 365 * 24 * 60 * 60 * 1000],
    ['month', 30 * 24 * 60 * 60 * 1000],
    ['day', 24 * 60 * 60 * 1000],
    ['hour', 60 * 60 * 1000],
    ['minute', 60 * 1000],
];

/**
 * Texto relativo calculado en cada render a partir de una fecha real.
 *
 * El catálogo anterior guardaba cadenas fijas ("Hace 45 mins", "Ayer") que
 * nunca envejecían: el sitio decía "Hace 45 mins" indefinidamente. Cuando hay
 * una fecha real, el texto se deriva de ella.
 */
export function formatRelativeTime(isoDate) {
    if (!isoDate) return null;

    const timestamp = Date.parse(isoDate);
    if (!Number.isFinite(timestamp)) return null;

    const diff = timestamp - Date.now();
    const absDiff = Math.abs(diff);

    if (absDiff < 60_000) return 'hace instantes';

    for (const [unit, ms] of UNITS) {
        if (absDiff >= ms) {
            return rtf.format(Math.round(diff / ms), unit);
        }
    }

    return 'hace instantes';
}

/** Fecha absoluta para el atributo `dateTime` y el tooltip. */
export function formatAbsoluteTime(isoDate) {
    if (!isoDate) return null;
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(date);
}

/** Normaliza una perspectiva a `{outlet, headline, snippet, url, bias}` o null. */
function normalizePerspective(raw) {
    if (!raw) return null;

    const outlet = raw.outlet ?? raw.source ?? null;
    const headline = raw.headline ?? null;
    if (!outlet || !headline) return null;

    return {
        outlet,
        headline,
        snippet: raw.snippet ?? null,
        url: raw.url ?? null,
        bias: typeof raw.bias === 'number' ? raw.bias : null,
        tone: raw.tone ?? null,
        otherOutletsInSpectrum: raw.otherOutletsInSpectrum ?? 0,
    };
}

/**
 * Convierte cualquiera de las dos formas en la forma canónica.
 * Devuelve null si la entrada no es utilizable, para que la UI pueda
 * descartarla en lugar de reventar al acceder a un campo ausente.
 */
export function normalizeStory(raw) {
    if (!raw || typeof raw !== 'object' || !raw.id || !raw.title) return null;

    const sources = resolveSources(raw.sources);
    const coverage = analyzeCoverage(sources);

    return {
        id: String(raw.id),
        title: raw.title,
        category: raw.category ?? 'Sin categoría',
        summary: raw.summary ?? null,

        // Fecha real si existe; si no, la etiqueta heredada del fixture.
        publishedAt: raw.publishedAt ?? null,
        legacyTimestamp: raw.publishedAt ? null : (raw.timestamp ?? null),

        sources,
        coverage,

        // Media real de las fuentes. `null` cuando no se puede calcular:
        // preferible a mostrar una constante disfrazada de medición.
        factuality:
            typeof raw.factuality === 'number' ? raw.factuality : averageFactuality(sources),

        perspectives: {
            left: normalizePerspective(raw.perspectives?.left),
            center: normalizePerspective(raw.perspectives?.center),
            right: normalizePerspective(raw.perspectives?.right),
        },

        articles: Array.isArray(raw.articles) ? raw.articles : [],
        body: Array.isArray(raw.body) ? raw.body : [],

        // Marca de procedencia: permite advertir en la UI cuando lo que se ve
        // es el fixture de desarrollo y no cobertura ingerida de verdad.
        isFixture: !raw.publishedAt,
    };
}

/** Normaliza una lista descartando entradas inválidas. */
export function normalizeStories(list) {
    return (Array.isArray(list) ? list : [])
        .map(normalizeStory)
        .filter(Boolean);
}

/** Etiqueta de tiempo lista para pintar, venga de donde venga. */
export function storyTimeLabel(story) {
    return formatRelativeTime(story.publishedAt) ?? story.legacyTimestamp ?? null;
}
