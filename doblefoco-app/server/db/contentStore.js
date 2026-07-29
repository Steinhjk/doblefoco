/**
 * PERSISTENCIA DE ARTÍCULOS E HISTORIAS — tarea F2-01.
 *
 * Lo que resuelve
 * ---------------
 * Hasta aquí, todo lo que el motor ingería vivía en un Map del proceso. Un
 * reinicio —un despliegue, un fallo, `Ctrl+C`— dejaba el sitio en blanco hasta
 * el siguiente ciclo, y la ventana de retención de 72 horas nunca llegaba a
 * llenarse de verdad. Eso no es solo una molestia operativa: F1-01 necesita
 * medir el solapamiento ACUMULADO en esa ventana para decidir si los puntos
 * ciegos son alcanzables, y sobre memoria volátil esa medición no existe.
 *
 * Cómo encaja con la memoria
 * --------------------------
 * La memoria NO desaparece. El agrupamiento (shared/clustering.js) compara cada
 * artículo con todos los demás y necesita el conjunto completo a mano; hacerlo
 * a golpe de consultas sería más lento y no más correcto. La base es el
 * respaldo duradero del conjunto de trabajo:
 *
 *     arranque  →  hydrateArticles()  →  Map en memoria
 *     ciclo     →  Map en memoria     →  persistArticles() / persistStories()
 *
 * Ninguna función de este archivo lanza hacia el motor de ingesta. Si la base
 * falla, se avisa y el ciclo continúa sirviendo lo que tiene en memoria: mismo
 * criterio que en metricsStore.js. Una base caída degrada el producto a lo que
 * era ayer; una excepción sin capturar lo apaga.
 */

import { classifySpectrum } from '../../shared/biasAnalysis.js';
import { safeQuery, withTransaction } from './pool.js';

// ---------------------------------------------------------------------------
// Lectura: rehidratación del conjunto de trabajo
// ---------------------------------------------------------------------------

/**
 * Recupera los artículos vigentes y los devuelve con la forma exacta que usa el
 * Map en memoria, para que el motor no tenga que distinguir entre un artículo
 * recién ingerido y uno recuperado del disco.
 *
 * Los datos del medio se leen de `sources` (JOIN) y no de lo que se guardó con
 * el artículo. Es deliberado: si mañana una revisión editorial corrige el sesgo
 * de un medio (F1-13), los artículos vigentes deben reflejar la clasificación
 * vigente. Lo que sí queda congelado es la medición de cobertura de cada
 * historia, que se guarda calculada justamente para poder auditar qué dijo el
 * sitio y cuándo.
 *
 * @param {{retentionMs:number, max:number}} options
 * @returns {Promise<Array<object>>} vacío si no hay base o si falla la lectura
 */
export async function hydrateArticles({ retentionMs, max }) {
    const result = await safeQuery(
        `
        SELECT a.id, a.canonical_url, a.headline, a.raw_title, a.snippet,
               a.category, a.tone, a.published_at, a.ingested_at,
               s.id AS source_id, s.name AS source_name, s.domain AS source_domain,
               s.bias, s.factuality
          FROM articles a
          JOIN sources s ON s.id = a.source_id
         WHERE COALESCE(a.published_at, a.ingested_at) > now() - ($1::bigint * interval '1 millisecond')
         ORDER BY COALESCE(a.published_at, a.ingested_at) DESC
         LIMIT $2
        `,
        [retentionMs, max],
        'rehidratación de artículos'
    );

    if (!result) return [];

    return result.rows.map((row) => ({
        id: row.id,
        headline: row.headline,
        rawTitle: row.raw_title ?? row.headline,
        link: row.canonical_url,
        snippet: row.snippet,
        tone: row.tone,
        publishedAt: row.published_at,
        ingestedAtMs: Date.parse(row.ingested_at),
        outlet: {
            id: row.source_id,
            name: row.source_name,
            domain: row.source_domain,
            bias: row.bias,
            factuality: row.factuality,
            spectrum: classifySpectrum(row.bias),
        },
        category: row.category,
    }));
}

// ---------------------------------------------------------------------------
// Escritura: artículos
// ---------------------------------------------------------------------------

/**
 * Guarda un lote de artículos.
 *
 * Un solo INSERT con UNNEST en vez de N sentencias: 500 artículos por ciclo
 * contra un Postgres gestionado son 500 idas y vueltas por red, y ahí el coste
 * es la latencia, no la base.
 *
 * `ON CONFLICT DO NOTHING` sin especificar columna, a propósito: cubre a la vez
 * la clave primaria y el UNIQUE del enlace canónico. Un artículo ya guardado no
 * se reescribe —su titular es una cita literal y no tiene por qué cambiar—, y
 * la ingesta se vuelve idempotente entre ciclos.
 *
 * @param {Array<object>} articles
 * @returns {Promise<number>} cuántos se insertaron; 0 si no hay base o falla
 */
export async function persistArticles(articles) {
    if (!articles.length) return 0;

    // Un artículo cuyo medio no esté en `sources` haría fallar la clave foránea
    // y con ella el lote entero. No debería ocurrir —el servidor proyecta el
    // registro al arrancar— pero un lote perdido por un medio recién añadido
    // sería un fallo silencioso y difícil de ver.
    const usable = articles.filter((a) => a.outlet?.id);
    const withoutSource = articles.length - usable.length;

    if (withoutSource) {
        console.warn(
            `[db] ${withoutSource} artículos sin id de medio: no se guardan. ` +
            'Revisa que el feed derive de shared/mediaRegistry.js.'
        );
    }

    if (!usable.length) return 0;

    const result = await safeQuery(
        `
        INSERT INTO articles
            (id, canonical_url, source_id, headline, raw_title, snippet,
             category, tone, published_at, ingested_at)
        SELECT * FROM unnest(
            $1::text[], $2::text[], $3::text[], $4::text[], $5::text[],
            $6::text[], $7::text[], $8::jsonb[], $9::timestamptz[], $10::timestamptz[]
        )
        ON CONFLICT DO NOTHING
        `,
        [
            usable.map((a) => a.id),
            usable.map((a) => a.link),
            usable.map((a) => a.outlet.id),
            usable.map((a) => a.headline),
            usable.map((a) => a.rawTitle ?? null),
            usable.map((a) => a.snippet ?? null),
            usable.map((a) => a.category ?? null),
            usable.map((a) => (a.tone ? JSON.stringify(a.tone) : null)),
            usable.map((a) => a.publishedAt ?? null),
            usable.map((a) => new Date(a.ingestedAtMs ?? Date.now()).toISOString()),
        ],
        'guardado de artículos'
    );

    return result?.rowCount ?? 0;
}

/**
 * Aplica la ventana de retención en SQL.
 *
 * Antes era un barrido sobre el Map; ahora la base es la que manda, porque es
 * la que sobrevive al reinicio. El borrado arrastra `story_articles` en cascada.
 *
 * @returns {Promise<number>} artículos borrados
 */
export async function pruneExpiredArticles(retentionMs) {
    const result = await safeQuery(
        `
        DELETE FROM articles
         WHERE COALESCE(published_at, ingested_at) < now() - ($1::bigint * interval '1 millisecond')
        `,
        [retentionMs],
        'poda por retención'
    );

    return result?.rowCount ?? 0;
}

// ---------------------------------------------------------------------------
// Escritura: historias
// ---------------------------------------------------------------------------

/**
 * Reemplaza el conjunto de historias por el que acaba de calcular el motor.
 *
 * Las historias son una PROYECCIÓN de los artículos vigentes: cada ciclo las
 * recalcula enteras, porque un artículo nuevo puede unir dos grupos que antes
 * estaban separados. Por eso esto es un reemplazo y no una acumulación.
 *
 * Las métricas de cobertura se guardan CALCULADAS, no derivadas al leer. Si
 * mañana se revisa el sesgo de un medio (F1-13), las historias conservan la
 * medición que se le mostró al lector: se puede auditar qué afirmó el sitio y
 * en qué momento.
 *
 * Todo va en una transacción. Un fallo a mitad dejaría historias sin sus
 * artículos, que es peor que no haber guardado nada.
 *
 * @returns {Promise<{stories:number, links:number, removed:number}|null>}
 */
export async function persistStories(entrada) {
    let stories = entrada;
    try {
        /**
         * Deduplicar por id ANTES de escribir.
         *
         * El id de una historia deriva del titular de su medio representativo
         * (`storyId(headline)`), así que dos grupos distintos con el mismo
         * titular producen el mismo id. Ocurre con titulares que no son
         * titulares: cuatro artículos llamados "EMPLEO" —cabeceras de sección
         * que los feeds publican como si fueran piezas— forman cuatro grupos de
         * uno y los cuatro colisionan.
         *
         * El bucle anterior lo OCULTABA: cada INSERT iba por separado y el
         * segundo simplemente pisaba al primero, descartando un grupo entero en
         * silencio en cada ciclo. Un solo INSERT no lo permite —Postgres
         * responde "ON CONFLICT DO UPDATE command cannot affect row a second
         * time"— y por eso el fallo salió a la luz al agrupar la escritura.
         *
         * Se conserva el grupo con MÁS medios: entre dos que van a compartir
         * id, el que más cobertura aporta. Medido hoy: 1 909 grupos, 1 906 ids
         * distintos, tres descartes y todos de una sola fuente.
         */
        const porId = new Map();
        for (const story of stories) {
            const previo = porId.get(story.id);
            if (!previo || (story.sources?.length ?? 0) > (previo.sources?.length ?? 0)) {
                porId.set(story.id, story);
            }
        }

        const colisiones = stories.length - porId.size;
        if (colisiones) {
            console.warn(
                `[db] ${colisiones} grupo(s) comparten id con otro y no se guardan. ` +
                'Suele indicar titulares que no son titulares (cabeceras de sección).'
            );
        }

        stories = [...porId.values()];

        return await withTransaction(async (client) => {
            const ids = stories.map((s) => s.id);

            /**
             * UN SOLO INSERT para todas las historias, con UNNEST.
             *
             * Antes era un `await client.query()` por historia dentro de la
             * misma transacción: con ~1 800 historias, 1 800 idas y vueltas a
             * São Paulo manteniendo los bloqueos de fila abiertos de principio
             * a fin. Decenas de segundos en los que NADA más puede tocar
             * `stories`.
             *
             * No es teórico: intentando rellenar una columna nueva mientras
             * corría el ciclo, el UPDATE se quedó esperando y murió por tiempo
             * de espera agotado. Dos veces. Y el coste crece linealmente con el
             * número de historias, así que es exactamente la clase de cosa que
             * obliga a migrar más adelante.
             *
             * Mismo patrón que ya usaba `persistArticles`. Aquí importa más,
             * porque estas filas se reescriben ENTERAS en cada ciclo.
             */
            if (stories.length) {
                await client.query(
                    `
                    INSERT INTO stories
                        (id, title, title_source_id, title_url, category, published_at,
                         first_seen_at, mean_bias, polarization, coverage_left,
                         coverage_center, coverage_right, dominant_spectrum,
                         insufficient_coverage, blindspot_spectrum, factuality,
                         source_count, computed_at)
                    SELECT * , now() FROM unnest(
                        $1::text[], $2::text[], $3::text[], $4::text[], $5::text[],
                        $6::timestamptz[], $7::timestamptz[], $8::real[], $9::real[],
                        $10::smallint[], $11::smallint[], $12::smallint[], $13::text[],
                        $14::boolean[], $15::text[], $16::real[], $17::int[]
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        title                 = EXCLUDED.title,
                        title_source_id       = EXCLUDED.title_source_id,
                        title_url             = EXCLUDED.title_url,
                        category              = EXCLUDED.category,
                        published_at          = EXCLUDED.published_at,
                        -- first_seen_at NO se pisa: es cuándo apareció el hecho
                        -- por primera vez, y solo puede ir hacia atrás.
                        first_seen_at         = LEAST(stories.first_seen_at, EXCLUDED.first_seen_at),
                        mean_bias             = EXCLUDED.mean_bias,
                        polarization          = EXCLUDED.polarization,
                        coverage_left         = EXCLUDED.coverage_left,
                        coverage_center       = EXCLUDED.coverage_center,
                        coverage_right        = EXCLUDED.coverage_right,
                        dominant_spectrum     = EXCLUDED.dominant_spectrum,
                        insufficient_coverage = EXCLUDED.insufficient_coverage,
                        blindspot_spectrum    = EXCLUDED.blindspot_spectrum,
                        factuality            = EXCLUDED.factuality,
                        source_count          = EXCLUDED.source_count,
                        computed_at           = now()
                    `,
                    [
                        stories.map((s) => s.id),
                        stories.map((s) => s.title),
                        stories.map((s) => s.titleOutletId ?? null),
                        stories.map((s) => s.titleUrl ?? null),
                        stories.map((s) => s.category ?? null),
                        stories.map((s) => s.publishedAt ?? null),
                        stories.map((s) => s.firstSeenAt ?? null),
                        stories.map((s) => s.meanBias ?? null),
                        stories.map((s) => s.polarization ?? null),
                        stories.map((s) => s.coverage?.left ?? 0),
                        stories.map((s) => s.coverage?.center ?? 0),
                        stories.map((s) => s.coverage?.right ?? 0),
                        stories.map((s) => s.dominantSpectrum ?? null),
                        stories.map((s) => s.insufficientCoverage ?? true),
                        // `blindspot` es un objeto {spectrum, label, description}
                        // o null. A la base va solo el espectro: la etiqueta y
                        // la explicación se redactan al mostrarlas.
                        stories.map((s) => s.blindspot?.spectrum ?? null),
                        stories.map((s) => s.factuality ?? null),
                        // Medios DISTINTOS, no artículos: si un medio publicó
                        // tres notas sobre el mismo hecho, cuenta una vez.
                        stories.map((s) => s.sources?.length ?? 0),
                    ]
                );
            }

            // Se reconstruyen los vínculos de las historias de este ciclo: un
            // artículo puede haber cambiado de grupo desde la última vez.
            if (ids.length) {
                await client.query(`DELETE FROM story_articles WHERE story_id = ANY($1::text[])`, [ids]);
            }

            const storyIds = [];
            const articleIds = [];

            for (const story of stories) {
                for (const article of story.articles ?? []) {
                    storyIds.push(story.id);
                    articleIds.push(article.id);
                }
            }

            let links = 0;

            if (storyIds.length) {
                /**
                 * Solo se enlaza lo que existe de verdad en `articles`.
                 *
                 * Sin este filtro hay una carrera real: la memoria y la base
                 * aplican la ventana de 72 horas con relojes distintos, así que
                 * un artículo justo en el límite puede seguir en el Map —y por
                 * tanto dentro de una historia— y estar ya borrado de la base.
                 * La clave foránea rechazaría ese vínculo, y como todo esto va
                 * en una transacción, un solo artículo caducado tiraría el
                 * guardado de las 350 historias del ciclo.
                 *
                 * Se pierde un vínculo en vez de perderlo todo.
                 */
                const { rowCount } = await client.query(
                    `
                    INSERT INTO story_articles (story_id, article_id)
                    SELECT t.story_id, t.article_id
                      FROM unnest($1::text[], $2::text[]) AS t(story_id, article_id)
                     WHERE EXISTS (SELECT 1 FROM articles a WHERE a.id = t.article_id)
                    ON CONFLICT DO NOTHING
                    `,
                    [storyIds, articleIds]
                );
                links = rowCount;
            }

            /**
             * Las historias que este ciclo ya no produce se retiran, EXCEPTO
             * las que tengan una decisión de moderación.
             *
             * Sin esa excepción, un cambio de agrupamiento borraría en silencio
             * el trabajo editorial de alguien —una historia aprobada o
             * rechazada— y nadie se enteraría. La excepción es una salvaguarda
             * provisional: F2-02 tiene que decidir de verdad qué significa
             * moderar una historia cuyo agrupamiento cambió.
             */
            const { rowCount: removed } = await client.query(
                `
                DELETE FROM stories
                 WHERE id <> ALL($1::text[])
                   AND id NOT IN (SELECT story_id FROM moderation)
                `,
                [ids]
            );

            return { stories: stories.length, links, removed };
        });
    } catch (error) {
        console.warn(`[db] guardado de historias falló: ${error.message}`);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Diagnóstico
// ---------------------------------------------------------------------------

/** Conteos para /api/health y para los scripts. `null` si no hay base. */
export async function countStored() {
    const result = await safeQuery(
        `
        SELECT
            (SELECT count(*) FROM articles)    AS articles,
            (SELECT count(*) FROM stories)     AS stories,
            (SELECT count(*) FROM ingest_runs) AS runs
        `,
        [],
        'conteo'
    );

    if (!result) return null;

    const { articles, stories, runs } = result.rows[0];
    return { articles, stories, runs };
}

/** Registra un ciclo en `ingest_runs`. Espejo de la línea del JSONL. */
export async function recordRun(row) {
    return safeQuery(
        `
        INSERT INTO ingest_runs
            (at, duration_ms, feeds_ok, feeds_failed, active_feeds, new_articles,
             total_articles, total_stories, multi_source_stories,
             cross_spectrum_stories, blindspot_stories, filtered_articles)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (at) DO NOTHING
        `,
        [
            row.at,
            row.durationMs ?? null,
            row.feedsOk ?? 0,
            row.feedsFailed ?? 0,
            row.activeFeeds ?? 0,
            row.newArticles ?? 0,
            row.totalArticles ?? 0,
            row.totalStories ?? 0,
            row.multiSourceStories ?? 0,
            row.crossSpectrumStories ?? 0,
            row.blindspotStories ?? 0,
            row.filteredArticles ?? 0,
        ],
        'registro del ciclo'
    );
}

/** Serie agregada por día, leída de la base. `null` si no hay base. */
export async function dailySummaryFromDb({ days = 7 } = {}) {
    const result = await safeQuery(
        `
        SELECT to_char(at, 'YYYY-MM-DD')     AS day,
               count(*)::int                 AS cycles,
               sum(new_articles)::int        AS "newArticles",
               sum(filtered_articles)::int   AS "filteredArticles",
               max(total_articles)::int      AS "peakArticles",
               max(total_stories)::int       AS "peakStories",
               max(multi_source_stories)::int   AS "peakMultiSource",
               max(cross_spectrum_stories)::int AS "peakCrossSpectrum",
               max(blindspot_stories)::int   AS "peakBlindspots",
               sum(feeds_failed)::int        AS "feedFailures"
          FROM ingest_runs
         WHERE at > now() - ($1::int * interval '1 day')
         GROUP BY day
         ORDER BY day
        `,
        [days],
        'resumen diario'
    );

    if (!result) return null;

    return {
        days: result.rows,
        totalCycles: result.rows.reduce((sum, d) => sum + d.cycles, 0),
        corrupt: 0,
        source: 'postgres',
    };
}
