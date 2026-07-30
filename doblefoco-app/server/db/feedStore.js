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
import { analyzeArticleTone } from '../../shared/headlineTone.js';
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
               a.tone, a.published_at, a.image_url,
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

        /**
         * El tono se calcula AQUÍ, al leer, y no se usa el que quedó guardado
         * al ingerir (F3-09). Dos razones:
         *   · la columna `tone` solo mira el titular; esto mira también la
         *     entradilla, que es donde un medio puede cargar la valoración
         *     manteniendo un titular impecable;
         *   · el léxico cambia. Guardado, un término añadido hoy no se vería
         *     nunca en los 3 481 artículos ya ingeridos, y habría que
         *     reprocesarlos a mano cada vez que se ajusta una palabra.
         * Cuesta una comparación contra ~40 términos sobre 300 caracteres:
         * irrelevante al lado de la ida y vuelta a la base.
         */
        tone: analyzeArticleTone({ headline: mejor.headline, snippet: mejor.snippet }),
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

    /**
     * LA IMAGEN ES DEL MEDIO QUE PONE EL TITULAR, o de ninguno.
     *
     * Se prefiere el artículo cuyo titular representa la historia: es el que el
     * lector ve arriba, así que su foto es la que le corresponde. Si ese no trae
     * imagen se cae al primer artículo que sí la tenga, y con él viaja el nombre
     * del medio — sin eso, la foto de El Tiempo aparecería bajo el titular de
     * Semana sin decirlo, que es atribuir material ajeno.
     *
     * `null` cuando ningún medio publicó imagen. No se sustituye por nada:
     * antes se rellenaba con una foto de archivo de Unsplash elegida por hash
     * del titular, y una condena por corrupción salía ilustrada con
     * «Indicadores Económicos».
     */
    const conImagen = articulos.find((a) => a.image_url && a.source_id === fila.title_source_id)
        ?? articulos.find((a) => a.image_url);

    const image = conImagen
        ? { url: conImagen.image_url, outlet: conImagen.outlet, outletId: conImagen.source_id }
        : null;

    return {
        id: fila.id,
        title: fila.title,
        titleOutlet: fila.title_outlet,
        titleOutletId: fila.title_source_id,
        titleUrl: fila.title_url,
        category: fila.category,
        image,

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

        /**
         * Resumen de lenguaje valorativo en TODA la cobertura (F3-09).
         *
         * Hace falta porque la anotación por perspectiva casi nunca se ve: solo
         * se muestran tres artículos de los diez u once que cubren un hecho, y
         * la carga aparece en el 3,1% de ellos. La probabilidad de que el
         * cargado sea justo uno de los tres elegidos es baja.
         *
         * Y NO se resuelve eligiendo como representante al artículo con más
         * carga: eso sacaría a propósito el titular más sensacionalista de cada
         * espectro y distorsionaría la comparación, que es lo único que esta
         * pantalla existe para hacer bien. Se elige por recencia, como siempre,
         * y la carga se reporta aparte.
         */
        toneSummary: (() => {
            const conCarga = articulos
                .map((a) => ({
                    outlet: a.outlet,
                    spectrum: classifySpectrum(a.bias),
                    headline: a.headline,
                    url: a.canonical_url,
                    tone: analyzeArticleTone({ headline: a.headline, snippet: a.snippet }),
                }))
                .filter((a) => !a.tone.isNeutral);

            return {
                totalArticulos: articulos.length,
                // Un medio puede publicar varias notas: lo que se cuenta son
                // MEDIOS distintos, no artículos, para no inflar la cifra.
                mediosConCarga: new Set(conCarga.map((a) => a.outlet)).size,
                totalMedios: new Set(articulos.map((a) => a.outlet)).size,
                articulos: conCarga,
            };
        })(),

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
            tone: analyzeArticleTone({ headline: a.headline, snippet: a.snippet }),
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
        SELECT s.id, s.title,
               GREATEST(
                   COALESCE(s.published_at, s.first_seen_at),
                   COALESCE(s.first_seen_at, s.published_at)
               ) AS lastmod
          FROM stories s
          LEFT JOIN moderation m ON m.story_id = s.id
         WHERE (m.state IS NULL OR m.state <> 'rechazada')
           -- DOS MEDIOS COMO MÍNIMO, el mismo umbral que decide el noindex de
           -- la página (ver esIndexable en server/ssr/metadatos.js). Un sitemap
           -- que anuncia lo que la propia página pide no indexar se contradice,
           -- y el buscador resuelve la contradicción a su manera.
           --
           -- Medido el 2026-07-29: reduce el sitemap de 3 413 URLs a ~285. No es
           -- una pérdida; es dejar de reclamar como obra propia 3 178 páginas que
           -- son un titular y un enlace al medio que sí lo escribió.
           AND s.source_count >= 2
         ORDER BY lastmod DESC NULLS LAST
         LIMIT $1
        `,
        [limit],
        'sitemap'
    );

    return (resultado?.rows ?? []).map((fila) => ({
        id: fila.id,
        // Necesario para armar el slug de la ruta canónica.
        title: fila.title,
        lastmod: fila.lastmod instanceof Date ? fila.lastmod.toISOString() : fila.lastmod,
    }));
}

/**
 * Cuántos artículos ha publicado cada medio en la ventana vigente.
 *
 * ES LA CIFRA QUE EL MAPA CARTESIANO NO PUEDE MOSTRAR. Ese mapa da un punto por
 * medio y todos los puntos pesan igual, así que Semana y Colombia Informa ocupan
 * el mismo espacio publicando 474 y 1 artículos. La asimetría —que es el
 * hallazgo central del producto— queda invisible por construcción.
 *
 * MIDE PRESENCIA EN NUESTRO CORPUS, NO CUOTA DE MERCADO, y quien lo pinte está
 * obligado a decirlo. El volumen sale de lo que cada medio expone en su RSS: El
 * Espectador aparece con 34 artículos frente a los 474 de Semana y ese no es su
 * tamaño real, es lo que su feed publica.
 *
 * @returns {Promise<Array<{sourceId: string, articulos: number}>>}
 */
export async function countArticlesBySource() {
    const resultado = await safeQuery(
        `
        SELECT a.source_id                AS "sourceId",
               count(*)::int              AS articulos
          FROM articles a
         GROUP BY a.source_id
         ORDER BY articulos DESC
        `,
        [],
        'conteo de artículos por medio'
    );

    return resultado?.rows ?? [];
}

/**
 * Cuántas historias hay, de verdad.
 *
 * POR QUÉ DEVUELVE CUATRO CIFRAS Y NO UNA. La portada pedía 100 historias y
 * escribía «100 historias con cobertura multifuente», repartidas entre Colombia
 * e Internacional. Las tres cifras salían de `length` sobre lo que se había
 * descargado, así que la pantalla presentaba el TECHO DE LA PETICIÓN como si
 * fuera el universo: con 298 historias multifuente y 3 644 en total, un lector
 * concluía que el sitio sigue trescientas menos de las que sigue.
 *
 * No era una cifra falsa —el feed ordena por número de medios, así que esas 100
 * sí eran multifuente— y por eso es peor: una ventana presentada como si fuera
 * el total no se delata nunca. La cifra tiene que venir de un `count`, que es lo
 * único que sabe cuántas hay, y no de la longitud de una página.
 *
 * El desglose se calcula aquí y no en el cliente por el mismo motivo: el cliente
 * solo puede contar lo que le llegó.
 *
 * `COALESCE(category, '')` para que una historia sin categoría cuente como
 * nacional, igual que hace el filtro del feed (`category !== 'Internacional'`).
 * Sin el COALESCE la comparación da NULL y la historia no entra en ninguno de
 * los dos lados: los sumandos no cuadrarían con el total.
 *
 * @returns {Promise<{total: number, multifuente: number, nacional: number, internacional: number}>}
 */
export async function countFeed() {
    const resultado = await safeQuery(
        `
        SELECT count(*)::int                                       AS total,
               count(*) FILTER (WHERE medios > 1)::int             AS multifuente,
               count(*) FILTER (
                   WHERE medios > 1 AND COALESCE(categoria, '') <> 'Internacional'
               )::int                                              AS nacional,
               count(*) FILTER (
                   WHERE medios > 1 AND categoria = 'Internacional'
               )::int                                              AS internacional
          FROM (
            SELECT s.id,
                   s.category                        AS categoria,
                   count(DISTINCT a.source_id)::int  AS medios
              FROM stories s
              JOIN story_articles sa ON sa.story_id = s.id
              JOIN articles a        ON a.id = sa.article_id
              LEFT JOIN moderation m ON m.story_id = s.id
             WHERE (m.state IS NULL OR m.state <> 'rechazada')
             GROUP BY s.id, s.category
          ) AS historias
        `,
        [],
        'conteo del feed'
    );

    const fila = resultado?.rows[0];

    // Sin base de datos se devuelven ceros y no `null`: quien lo consume pinta
    // cifras, y un cero se lee como «no hay» mientras que un null se colaría en
    // la pantalla como «NaN historias».
    return {
        total: fila?.total ?? 0,
        multifuente: fila?.multifuente ?? 0,
        nacional: fila?.nacional ?? 0,
        internacional: fila?.internacional ?? 0,
    };
}
