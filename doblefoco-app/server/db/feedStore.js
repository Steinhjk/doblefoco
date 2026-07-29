/**
 * LECTURA DEL FEED DESDE LA BASE — sin estado en memoria.
 *
 * POR QUÉ EXISTE
 * --------------
 * Hasta aquí, el feed se servía desde un array en memoria que el proceso
 * construía al arrancar: rehidrataba ~1 800 artículos y los reagrupaba. Eso
 * obligaba a un proceso persistente y, con él, a un servidor aparte del sitio.
 *
 * Esa obligación era una HERENCIA, no una necesidad. Cuando la ingesta corría
 * dentro del servidor tenía sentido; desde que la ejecuta GitHub Actions, los
 * grupos ya vienen calculados en la base y el proceso solo tiene que leerlos.
 *
 * Sin estado en memoria, la API puede vivir junto al sitio bajo el mismo
 * dominio. Y eso hace desaparecer CORS entero —lista blanca de orígenes,
 * `credentials: true`, una variable que hay que acertar—, porque deja de haber
 * dos orígenes. Lo que no se configura no se puede desconfigurar mal.
 *
 * QUÉ SE RECALCULA Y QUÉ NO
 * -------------------------
 * La cobertura se RECALCULA en cada lectura a partir de los medios actuales, no
 * se lee de las columnas guardadas. Es a propósito y conserva el comportamiento
 * anterior: si mañana una revisión editorial corrige el sesgo de un medio
 * (F1-13), el feed debe reflejar la clasificación vigente.
 *
 * Las columnas `coverage_*`, `mean_bias` y demás de la tabla `stories` siguen
 * siendo el registro histórico —qué medición se le mostró al lector y cuándo—,
 * que es justamente para lo que se guardaron calculadas. Sirven para auditar,
 * no para servir.
 */

import { analyzeCoverage, averageFactuality, classifySpectrum, SPECTRUM } from '../../shared/biasAnalysis.js';
import { buildCoverageTimeline } from '../../shared/coverageTimeline.js';
import { safeQuery } from './pool.js';

/**
 * Trae historias con sus artículos en DOS consultas, no en N+1.
 *
 * Primero la página de historias, después todos sus artículos de una vez. La
 * alternativa —una consulta de artículos por historia— serían 21 idas y vueltas
 * por red para una página de 20, y contra un Postgres gestionado el coste es la
 * latencia, no la base.
 */
async function leerHistorias({ where = '', params = [], limit = 20, offset = 0 }) {
    const historias = await safeQuery(
        `
        SELECT s.id, s.title, s.category, s.published_at, s.first_seen_at,
               s.title_source_id, s.title_url,
               src.name AS title_outlet,
               count(DISTINCT a.source_id)::int AS medios,
               max(a.published_at) AS ultimo_articulo
          FROM stories s
          JOIN story_articles sa ON sa.story_id = s.id
          JOIN articles a        ON a.id = sa.article_id
          LEFT JOIN sources src  ON src.id = s.title_source_id
          -- Las rechazadas por moderación no salen del feed público (F2-02).
          -- Se filtra en SQL y no en memoria: es la única forma de que la
          -- paginación cuadre. Descartarlas después dejaría páginas cortas.
          LEFT JOIN moderation m ON m.story_id = s.id
         WHERE (m.state IS NULL OR m.state <> 'rechazada')
           ${where}
         GROUP BY s.id, src.name
         ORDER BY medios DESC, s.published_at DESC NULLS LAST
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `,
        [...params, limit, offset],
        'lectura de historias'
    );

    if (!historias || !historias.rows.length) return [];

    const ids = historias.rows.map((r) => r.id);

    const articulos = await safeQuery(
        `
        SELECT sa.story_id, a.id, a.headline, a.canonical_url, a.snippet,
               a.tone, a.published_at,
               s.id AS source_id, s.name AS outlet, s.domain, s.bias, s.factuality
          FROM story_articles sa
          JOIN articles a ON a.id = sa.article_id
          JOIN sources  s ON s.id = a.source_id
         WHERE sa.story_id = ANY($1::text[])
         ORDER BY a.published_at DESC NULLS LAST
        `,
        [ids],
        'lectura de artículos de historias'
    );

    if (!articulos) return [];

    const porHistoria = new Map(ids.map((id) => [id, []]));
    for (const fila of articulos.rows) porHistoria.get(fila.story_id)?.push(fila);

    return historias.rows.map((h) => componerHistoria(h, porHistoria.get(h.id) ?? []));
}

/**
 * Elige el artículo representativo de un espectro.
 *
 * Réplica exacta de `pickPerspective` del motor, y devuelve `null` con la misma
 * intención: cuando ningún medio de ese espectro cubrió el hecho, la ausencia
 * ES el resultado y la interfaz debe declararla. Rellenarla sería fabricar una
 * cita.
 */
function elegirPerspectiva(articulos, espectro) {
    const candidatos = articulos.filter((a) => classifySpectrum(a.bias) === espectro);
    if (!candidatos.length) return null;

    const mejor = [...candidatos].sort((a, b) => {
        const fechaA = a.published_at ? Date.parse(a.published_at) : 0;
        const fechaB = b.published_at ? Date.parse(b.published_at) : 0;
        if (fechaB !== fechaA) return fechaB - fechaA;
        return (b.factuality ?? 0) - (a.factuality ?? 0);
    })[0];

    return {
        outlet: mejor.outlet,
        domain: mejor.domain,
        bias: mejor.bias,
        headline: mejor.headline,   // literal del medio, sin añadidos
        snippet: mejor.snippet,     // real o null, nunca redactado
        url: mejor.canonical_url,
        publishedAt: mejor.published_at,
        tone: mejor.tone,
        otherOutletsInSpectrum: new Set(candidatos.map((c) => c.source_id)).size - 1,
    };
}

/** Arma la historia con la misma forma que producía el motor en memoria. */
function componerHistoria(fila, articulos) {
    // Un medio, una entrada: si publicó tres notas, no cuenta triple.
    const porMedio = new Map();
    for (const a of articulos) {
        if (!porMedio.has(a.source_id)) {
            porMedio.set(a.source_id, {
                name: a.outlet,
                domain: a.domain,
                bias: a.bias,
                factuality: a.factuality,
                url: a.canonical_url,
                publishedAt: a.published_at,
            });
        }
    }

    const sources = [...porMedio.values()];
    const coverage = analyzeCoverage(sources);

    return {
        id: fila.id,
        title: fila.title,
        titleOutlet: fila.title_outlet,
        titleOutletId: fila.title_source_id,
        titleUrl: fila.title_url,
        category: fila.category,

        publishedAt: fila.published_at,
        firstSeenAt: fila.first_seen_at,

        meanBias: coverage.meanBias,
        polarization: coverage.polarization,
        coverage: coverage.counts,
        coveragePercentages: coverage.percentages,
        dominantSpectrum: coverage.dominantSpectrum,
        insufficientCoverage: coverage.insufficientCoverage,
        blindspot: coverage.blindspot,

        factuality: averageFactuality(sources),

        sources,
        articleCount: articulos.length,

        /**
         * Cronología de quién entró y cuándo (F3-08).
         *
         * Se calcula aquí, junto a los artículos, y no en el navegador: el
         * cliente solo recibe un medio por fuente en `sources`, con la fecha de
         * su artículo MÁS RECIENTE. Para ordenar entradas hace falta la más
         * antigua de cada uno, y eso solo está disponible con la lista completa.
         */
        timeline: buildCoverageTimeline(articulos),

        perspectives: {
            left: elegirPerspectiva(articulos, SPECTRUM.LEFT),
            center: elegirPerspectiva(articulos, SPECTRUM.CENTER),
            right: elegirPerspectiva(articulos, SPECTRUM.RIGHT),
        },

        articles: articulos.map((a) => ({
            id: a.id,
            outlet: a.outlet,
            headline: a.headline,
            url: a.canonical_url,
            snippet: a.snippet,
            publishedAt: a.published_at,
            bias: a.bias,
            tone: a.tone,
        })),
    };
}

/** Página del feed público. */
export async function readFeed({ limit = 20, offset = 0 } = {}) {
    return leerHistorias({ limit, offset });
}

/** Una historia por su id. `null` si no existe o si está retirada. */
export async function readStory(id) {
    const historias = await leerHistorias({
        where: 'AND s.id = $1',
        params: [id],
        limit: 1,
        offset: 0,
    });

    return historias[0] ?? null;
}

/** Cuántas historias visibles hay. Para la paginación. */
/**
 * Historias para el sitemap: solo id y fecha de modificación.
 *
 * MISMO FILTRO QUE EL FEED, y no es un detalle. Un sitemap que anuncia páginas
 * que el sitio no muestra —una historia retirada por moderación, por ejemplo—
 * le está pidiendo a Google que indexe algo que decidimos no publicar. Eso no
 * es un descuido técnico: es contradecir una decisión editorial desde otro
 * archivo.
 *
 * `lastmod` sale de la fecha más reciente entre publicación y primera vez que
 * la vimos. Importa que sea honesta: un sitemap que dice que todo cambió hoy
 * pierde credibilidad para el rastreador y deja de guiar nada.
 *
 * El tope de 50 000 lo fija el protocolo de sitemaps. Hoy hay ~2 400 historias,
 * así que sobra; cuando no sobre habrá que partirlo en un índice de sitemaps, y
 * conviene que el límite falle por corte antes que por generar un XML inválido.
 */
export async function readSitemapEntries({ limit = 50_000 } = {}) {
    const resultado = await safeQuery(
        `
        SELECT s.id,
               GREATEST(
                   COALESCE(s.published_at, s.first_seen_at),
                   COALESCE(s.first_seen_at, s.published_at)
               ) AS lastmod
          FROM stories s
          LEFT JOIN moderation m ON m.story_id = s.id
         WHERE (m.state IS NULL OR m.state <> 'rechazada')
           AND s.source_count > 0
         ORDER BY lastmod DESC NULLS LAST
         LIMIT $1
        `,
        [limit],
        'sitemap'
    );

    return (resultado?.rows ?? []).map((fila) => ({
        id: fila.id,
        lastmod: fila.lastmod instanceof Date ? fila.lastmod.toISOString() : fila.lastmod,
    }));
}

export async function countFeed() {
    const resultado = await safeQuery(
        `
        SELECT count(*)::int AS total
          FROM stories s
          LEFT JOIN moderation m ON m.story_id = s.id
         WHERE (m.state IS NULL OR m.state <> 'rechazada')
           AND EXISTS (SELECT 1 FROM story_articles sa WHERE sa.story_id = s.id)
        `,
        [],
        'conteo del feed'
    );

    return resultado?.rows[0]?.total ?? 0;
}
