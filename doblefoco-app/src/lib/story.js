// @ts-check
/**
 * Normalización de historias y formato de fechas.
 *
 * Existía para reconciliar DOS formas de historia: la del backend de ingesta y
 * la del fixture de desarrollo, que traía `timestamp` como texto fijo y
 * perspectivas siempre presentes. Al retirar el fixture (F2-03) queda una sola
 * forma, y con ella se fueron `legacyTimestamp` e `isFixture`, que eran esa
 * capa de compatibilidad. El comentario anterior anunciaba justo esto.
 *
 * Sigue teniendo sentido que todo entre por aquí: es donde las fuentes se
 * resuelven contra el catálogo y donde se calcula la cobertura, de modo que
 * ningún componente pueda inventarse su propia versión de esas cifras.
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
            // El id del catálogo, además del nombre: es lo que permite mirar la
            // ficha de propiedad. Sin él, saber quién es el dueño exigiría
            // resolver otra vez por nombre en cada sitio que lo necesite.
            id: media.id,
            name: media.name,
            bias: media.bias,
            factuality: media.factuality,
            url: source?.url ?? `https://${media.domain}`,
            isKnown: true,
        };
    });
}

const rtf = new Intl.RelativeTimeFormat('es-CO', { numeric: 'auto' });

/**
 * Escalones de tiempo, del mayor al menor.
 *
 * La anotación no es adorno: sin ella se infiere `(string | number)[][]` y al
 * desestructurar `[unit, ms]` ambos quedan como `string | number`. Con la tupla
 * explícita, una unidad mal escrita —`'dya'` en vez de `'day'`— la detecta el
 * chequeo en vez de lanzar `Intl.RelativeTimeFormat` en el navegador del lector.
 *
 * @type {Array<[Intl.RelativeTimeFormatUnit, number]>}
 */
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

        publishedAt: raw.publishedAt ?? null,

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

        // Cronología de cobertura (F3-08). La calcula el servidor, que es quien
        // ve todos los artículos; aquí solo se deja pasar. `null` cuando la
        // historia no la trae —una respuesta antigua de caché, por ejemplo— y
        // la interfaz simplemente no pinta la sección.
        timeline: raw.timeline ?? null,

        // Resumen de lenguaje valorativo en toda la cobertura (F3-09).
        toneSummary: raw.toneSummary ?? null,
    };
}

/**
 * Forma de una historia normalizada.
 *
 * Es el contrato entre el motor y toda la interfaz: si un campo no está aquí,
 * ningún componente puede leerlo. Escribirlo no es documentación decorativa —
 * es lo que permite que `tsc` detecte un acceso a un campo inexistente, que es
 * exactamente el fallo que se coló el 2026-07-28 al retirar `body` y dejar un
 * `story.body.length` vivo en NewsDetail.
 *
 * @typedef {Object} Story
 * @property {string} id
 * @property {string} title
 * @property {string} category
 * @property {string|null} summary
 * @property {string|null} publishedAt
 * @property {Array<{name: string, bias: number, url?: string, factuality?: number}>} sources
 * @property {ReturnType<typeof import('../../shared/biasAnalysis.js').analyzeCoverage>} coverage
 * @property {number|null} factuality
 * @property {{left: object|null, center: object|null, right: object|null}} perspectives
 * @property {Array<object>} articles
 */

/**
 * Normaliza una lista descartando entradas inválidas.
 * @param {Array<object>} list
 * @returns {Story[]}
 */
export function normalizeStories(list) {
    return (Array.isArray(list) ? list : [])
        .map(normalizeStory)
        .filter(Boolean);
}

/** Etiqueta de tiempo lista para pintar, venga de donde venga. */
export function storyTimeLabel(story) {
    return formatRelativeTime(story.publishedAt);
}

/**
 * Los hechos con más cobertura simultánea — tarea F2-03.
 *
 * Sustituye a `trendingTopics` del fixture, que eran ocho temas escritos a mano
 * con contadores de artículos INVENTADOS ("42 artículos", "38 artículos")
 * presentados como cifras reales. Misma clase de dato falso que el "84 % de
 * validación comunitaria" que retiró F0-08.
 *
 * Lo que se cuenta ahora son MEDIOS DISTINTOS sobre un mismo hecho, no
 * artículos, y sale de la cobertura real. Es además lo que promete el
 * encabezado de la página: "los temas con más cobertura simultánea".
 */
export function topCoveredStories(stories, limit = 8) {
    return [...stories]
        .filter((s) => (s.coverage?.total ?? 0) > 1)
        .sort((a, b) => {
            if (b.coverage.total !== a.coverage.total) return b.coverage.total - a.coverage.total;
            return Date.parse(b.publishedAt ?? 0) - Date.parse(a.publishedAt ?? 0);
        })
        .slice(0, limit);
}

/**
 * Selecciona puntos ciegos garantizando diversidad ideológica.
 * Si existe al menos un punto ciego de la derecha (o de la izquierda),
 * asegura que aparezca representado en el panel de puntos ciegos.
 *
 * @param {Story[]} stories
 * @param {number} limit
 * @returns {Story[]}
 */
export function selectDiverseBlindspots(stories, limit = 3) {
    const blindspots = (Array.isArray(stories) ? stories : [])
        .filter((s) => s?.coverage?.blindspot);

    if (!blindspots.length) return [];

    const rightBlindspots = blindspots.filter((s) => s.coverage.blindspot.spectrum === 'right');
    const leftBlindspots = blindspots.filter((s) => s.coverage.blindspot.spectrum === 'left');

    const result = [];

    // Forzar al menos un punto ciego de la derecha si está disponible
    if (rightBlindspots.length > 0) {
        result.push(rightBlindspots[0]);
    }

    // Forzar al menos un punto ciego de la izquierda si está disponible y hay cupo
    if (leftBlindspots.length > 0 && result.length < limit) {
        if (!result.some((s) => s.id === leftBlindspots[0].id)) {
            result.push(leftBlindspots[0]);
        }
    }

    // Rellenar con los demás puntos ciegos respetando el orden
    for (const story of blindspots) {
        if (result.length >= limit) break;
        if (!result.some((s) => s.id === story.id)) {
            result.push(story);
        }
    }

    return result;
}

