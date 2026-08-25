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
 * EL PUNTO CIEGO LO DECIDE EL SERVIDOR, Y ES EL ÚNICO CAMPO ASÍ (2026-08-21).
 *
 * `analyzeCoverage` calcula todo con las fuentes de la historia. Desde el
 * 2026-08-25 la prueba de «¿sorprende esta ausencia?» ya NO depende de que
 * nadie pase tasas: la nula es de catálogo y `biasAnalysis` lo lee solo. Lo que
 * el cliente sigue sin poder tener es el CONTEXTO —cada cuánto falta cada
 * espectro— porque solo se ha descargado un puñado de historias y el servidor
 * lo mide sobre el corpus entero. Una frecuencia estimada sobre lo descargado
 * cambiaría al desplazar la lista, y ese número es justo el que impide que el
 * veredicto se lea como hallazgo.
 *
 * Así que el veredicto del servidor se sigue trasplantando en vez de
 * recalcularlo: no porque el cliente no sepa calcularlo, sino porque el
 * servidor lo calcula con la frase que lo acompaña.
 *
 * QUÉ ESTABA ROTO. Aquí se llamaba `analyzeCoverage(sources)` sin tasas, así que
 * el punto ciego salía `null` SIEMPRE, y además este normalizador construye un
 * objeto nuevo que no copiaba `raw.blindspot`: el veredicto que el servidor sí
 * manda se tiraba por el camino. `MobileSidebar` tiene una pestaña «Puntos
 * ciegos» que por eso solo podía enseñar su estado vacío.
 *
 * Es literalmente el fallo que esta misma función advierte más abajo a propósito
 * de la imagen —«un campo que no se copie aquí desaparece sin error»—, repetido.
 *
 * Los conteos de los dos lados coinciden, comprobado sobre las 100 historias del
 * feed: por eso se puede trasplantar el veredicto sin que los números que lleva
 * dentro su descripción contradigan la barra que se pinta al lado.
 *
 * El tipo se ata al de `analyzeCoverage` en vez de repetir la forma a mano: si
 * algún día se añade una rama —o cambia la etiqueta de una—, esto tiene que
 * dejar de compilar en lugar de aceptar en silencio algo que la interfaz no sabe
 * pintar.
 *
 * @param {Record<string, any>} raw historia tal como la manda la API
 * @returns {ReturnType<typeof analyzeCoverage>['blindspot']} el veredicto del
 *   servidor, o `null` si no lo hay
 */
export function puntoCiegoDelServidor(raw) {
    const delServidor = raw?.blindspot;

    /*
     * `undefined` y `null` acaban los dos en `null`, pero NO significan lo
     * mismo y conviene tenerlo presente: `null` es «el servidor miró y no hay»,
     * `undefined` es «esta API no manda el campo» —un despliegue anterior a que
     * existiera—. En los dos casos lo correcto es callar, así que se colapsan
     * aquí; si algún día hubiera que distinguirlos, este es el sitio.
     */
    if (!delServidor || typeof delServidor !== 'object') return null;
    if (!delServidor.spectrum || !delServidor.label) return null;

    return delServidor;
}

/**
 * Convierte cualquiera de las dos formas en la forma canónica.
 * Devuelve null si la entrada no es utilizable, para que la UI pueda
 * descartarla en lugar de reventar al acceder a un campo ausente.
 */
export function normalizeStory(raw) {
    if (!raw || typeof raw !== 'object' || !raw.id || !raw.title) return null;

    const sources = resolveSources(raw.sources);

    /*
     * Todo lo local sale de las fuentes; el punto ciego viene del servidor. Ver
     * `puntoCiegoDelServidor`: es el ÚNICO campo de `analyzeCoverage` que
     * depende de las tasas base del corpus —`sorprende()` solo se usa dentro de
     * las tres ramas del punto ciego—, y por eso el énfasis, la polarización y
     * los porcentajes sí se pueden calcular aquí sin perder nada.
     */
    const coverage = {
        ...analyzeCoverage(sources),
        blindspot: puntoCiegoDelServidor(raw),
    };

    return {
        id: String(raw.id),
        title: raw.title,

        /**
         * Categoría HEREDADA DEL FEED por el que entró el artículo. Se conserva
         * por trazabilidad —qué se le mostró al lector y cuándo— y porque
         * mientras la API desplegada no mande `topics` es el único asidero que
         * tiene la pantalla de secciones. No es el tema de la pieza.
         */
        category: raw.category ?? 'Sin categoría',

        /**
         * Los dos ejes que `category` tenía colapsados, ya separados en la base.
         *
         * `null` NO ES LO MISMO QUE VACÍO, y la diferencia es la que permite
         * desplegar el cliente antes que la API. `null` significa «este
         * despliegue de la API todavía no clasifica», y quien lo lea debe
         * recurrir al campo heredado; `[]` significa «clasificó y no encontró
         * tema», que es un hecho sobre la pieza. Si se colapsaran en `[]` la
         * pantalla de secciones mostraría catorce ceros y parecería una avería.
         *
         * Este normalizador construye un objeto NUEVO: un campo que no se copie
         * aquí desaparece sin error, que es exactamente cómo se perdió la imagen
         * en su día. Por eso están escritos.
         *
         * @see server/db/feedStore.js — «`topics` y `ambito` son lo que la
         *      interfaz debe leer».
         */
        topics: Array.isArray(raw.topics) ? raw.topics : null,
        ambito: raw.ambito === 'internacional' || raw.ambito === 'nacional' ? raw.ambito : null,

        summary: raw.summary ?? null,

        publishedAt: raw.publishedAt ?? null,

        /**
         * Imagen que publicó el medio, con el medio al lado para acreditarla.
         * `null` cuando ninguno de los que cubren el hecho trae foto, que es lo
         * más frecuente: de los 31 feeds del catálogo solo 12 la incluyen.
         *
         * Este normalizador construye un objeto NUEVO, así que un campo que no
         * se copie aquí desaparece sin error. Es lo que pasó al añadir la
         * imagen: llegaba en la respuesta, se perdía en esta función y la
         * pantalla no pintaba nada — un fallo silencioso, sin traza.
         */
        image: raw.image ?? null,

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
 * @property {string[]|null} topics
 * @property {'nacional'|'internacional'|null} ambito
 * @property {string|null} summary
 * @property {string|null} publishedAt
 * @property {{url: string, outlet: string|null, outletId: string|null}|null} image
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
