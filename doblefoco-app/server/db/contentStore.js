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
import { detectarOpinion } from '../../shared/opinion.js';
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
/**
 * Una fila de `articles` con la forma que el Map en memoria espera.
 *
 * ESTÁ FUERA DE LA CONSULTA PARA PODER PROBARLA. Lo que aquí se olvide no lo
 * caza nada: no es un error de SQL ni de tipos, es un campo que llega
 * `undefined` y que el resto del motor trata como «este artículo no tenía eso».
 * Y así fue como pasó lo de abajo.
 *
 * LO QUE FALTABA, Y LO QUE COSTÓ (2026-08-19)
 * -------------------------------------------
 * `topics` y `ambito` estaban en la tabla, se escribían bien en cada ingesta y
 * NO SE VOLVÍAN A LEER NUNCA. Cada arranque del motor rehidrata hasta 4 000
 * artículos desde la base, y todos volvían sin tema y sin ámbito. Como las
 * historias se construyen con la UNIÓN de los temas de sus artículos, la unión
 * de nada es nada: **99 de las 100 historias de la portada tenían `topics: []`**
 * y la pantalla de Categorías enseñaba catorce ceros sobre un catálogo de 6 400
 * historias que sí estaban clasificadas.
 *
 * El ámbito cayó por lo mismo y de forma más silenciosa: sin `ambito` en los
 * artículos, el recuento de «cuántos son internacionales» daba cero en todas las
 * historias y **todo el catálogo quedaba marcado como nacional**. La API decía
 * `internacional: 0` mientras servía piezas cuya sección heredada era
 * literalmente «Internacional».
 *
 * Los dos se curan solos en el siguiente ciclo —las historias se reconstruyen y
 * se vuelven a guardar—, pero solo con esta lectura arreglada.
 *
 * @param {Record<string, any>} row
 */
export function articuloDesdeFila(row) {
    return {
        id: row.id,
        headline: row.headline,
        rawTitle: row.raw_title ?? row.headline,
        link: row.canonical_url,
        snippet: row.snippet,
        tone: row.tone,
        publishedAt: row.published_at,
        ingestedAtMs: Date.parse(row.ingested_at),
        // Sin esto la memoria no sabría qué artículos ya tienen foto y el relleno
        // de imágenes intentaría rellenar los 4 000 en cada ciclo.
        imageUrl: row.image_url,
        /*
         * `?? []` y no `?? null`: aguas abajo esto se recorre con `flatMap`, y un
         * artículo viejo de antes de que existiera la columna tiene que aportar
         * cero temas, no reventar la construcción de su historia.
         */
        topics: row.topics ?? [],
        ambito: row.ambito ?? null,
        /*
         * LA OPINIÓN SE DERIVA, NO SE GUARDA (2026-08-21), y conviene decir por
         * qué no es un atajo.
         *
         * El fallo era el mismo que el de `topics`: sin esto, el artículo
         * rehidratado vuelve sin marca, y como el filtro de
         * `buildMultisourceStories` pregunta `!a.opinion?.esOpinion`, un
         * `undefined` responde «no es opinión». Medido el 2026-08-21: **71 de
         * los 4 000 artículos en memoria eran opinión y reentraban al
         * agrupamiento en cada arranque** —62 columnas, 7 editoriales, 2
         * caricaturas—, deshaciendo la decisión del 2026-08-09.
         *
         * La cura del hermano fue una columna. Aquí NO hace falta, y no por
         * ahorrar trabajo:
         *
         *   1. `detectarOpinion` es función PURA de la URL —tres expresiones
         *      regulares sobre el pathname, sin registro ni estado— y la URL ya
         *      es permanente: `canonical_url` es la clave del ON CONFLICT y no
         *      se reescribe nunca. Guardar el veredicto sería duplicar un dato
         *      que ya está, no conservar uno que se perdería.
         *   2. Por eso NO se cierra ninguna puerta. El día que haga falta
         *      consultarlo en SQL —el índice de columnistas, que hoy los
         *      comentarios prometen y no existe— la columna se puede añadir y
         *      rellenar entera desde `canonical_url`, sin haber perdido nada por
         *      el camino.
         *   3. Y se cura sola. La detección está declarada incompleta: el día
         *      que se añada un patrón, un valor guardado seguiría mintiendo
         *      sobre los artículos viejos, mientras que este se corrige en el
         *      siguiente arranque.
         *
         * Cuesta 6,3 ms para los 4 000, medido, contra una consulta que tarda
         * órdenes de magnitud más.
         */
        opinion: detectarOpinion(row.canonical_url),
        outlet: {
            id: row.source_id,
            name: row.source_name,
            domain: row.source_domain,
            bias: row.bias,
            factuality: row.factuality,
            spectrum: classifySpectrum(row.bias),
        },
        category: row.category,
    };
}

export async function hydrateArticles({ retentionMs, max }) {
    const result = await safeQuery(
        `
        SELECT a.id, a.canonical_url, a.headline, a.raw_title, a.snippet,
               a.category, a.tone, a.published_at, a.ingested_at, a.image_url,
               a.topics, a.ambito,
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

    return result.rows.map(articuloDesdeFila);
}

// ---------------------------------------------------------------------------
// Escritura: artículos
// ---------------------------------------------------------------------------

/**
 * Rellena la imagen de artículos YA guardados que no tenían ninguna.
 *
 * POR QUÉ ES UNA FUNCIÓN APARTE y no basta el ON CONFLICT del INSERT: el motor
 * descarta el item ANTES de llegar a guardar. `if (articlesByLink.has(link))
 * continue` es lo que hace la ingesta idempotente, y con ello un artículo que
 * reaparece en el feed no vuelve a pasar por el INSERT nunca. Así que la foto de
 * los 4 313 artículos guardados antes de que existiera la columna era
 * irrecuperable por esa vía: 1 de las 100 historias de la portada tenía imagen.
 *
 * `WHERE image_url IS NULL` en la sentencia, no solo en la comprobación previa:
 * lo ya guardado gana siempre, así que esto rellena huecos y no sobrescribe. Que
 * la foto que un lector vio no cambie por un ciclo posterior es parte del trato.
 *
 * @param {Array<{link: string, imageUrl: string}>} imagenes
 * @returns {Promise<number>} cuántas filas se rellenaron
 */
export async function backfillImages(imagenes) {
    if (!imagenes.length) return 0;

    const result = await safeQuery(
        `
        UPDATE articles a
           SET image_url = v.image_url
          FROM unnest($1::text[], $2::text[]) AS v(canonical_url, image_url)
         WHERE a.canonical_url = v.canonical_url
           AND a.image_url IS NULL
        `,
        [imagenes.map((i) => i.link), imagenes.map((i) => i.imageUrl)],
        'relleno de imágenes'
    );

    return result?.rowCount ?? 0;
}

/**
 * Artículos a los que todavía no se les ha buscado imagen en su página.
 *
 * LOS MÁS RECIENTES PRIMERO, y no es un detalle de eficiencia: son los que están
 * arriba en la portada, así que resolverlos primero es lo que el lector nota. El
 * resto se alcanza ciclo a ciclo.
 *
 * `image_checked_at IS NULL` es lo que impide volver a pedir una página que ya
 * se miró y no tenía nada. Sin esa condición, cada ciclo repetiría miles de
 * peticiones a medios ajenos para siempre.
 *
 * @param {{limit: number}} opciones
 * @returns {Promise<Array<{id: string, url: string, sourceId: string}>>}
 */
export async function articulosSinImagen({ limit }) {
    const result = await safeQuery(
        `
        SELECT a.id, a.canonical_url AS url, a.source_id AS "sourceId"
          FROM articles a
         WHERE a.image_url IS NULL
           AND a.image_checked_at IS NULL
         ORDER BY a.published_at DESC NULLS LAST
         LIMIT $1
        `,
        [limit],
        'artículos sin imagen'
    );

    return result?.rows ?? [];
}

/**
 * Guarda el resultado de haber mirado la página: la imagen si la había, y en
 * todo caso la marca de que ya se miró.
 *
 * SE MARCAN TAMBIÉN LOS QUE NO TENÍAN, que es justamente el punto. Un artículo
 * sin og:image al que no se le pusiera la marca volvería a la cola en el ciclo
 * siguiente, y el trabajo no terminaría nunca.
 *
 * @param {Array<{id: string, imageUrl: string|null}>} resultados
 * @returns {Promise<number>} cuántos quedaron CON imagen
 */
export async function guardarImagenesEnriquecidas(resultados) {
    if (!resultados.length) return 0;

    const result = await safeQuery(
        `
        UPDATE articles a
           SET image_url = COALESCE(a.image_url, v.image_url),
               image_checked_at = now()
          FROM unnest($1::text[], $2::text[]) AS v(id, image_url)
         WHERE a.id = v.id
        `,
        [resultados.map((r) => r.id), resultados.map((r) => r.imageUrl ?? null)],
        'guardado de imágenes enriquecidas'
    );

    if (!result) return 0;
    return resultados.filter((r) => r.imageUrl).length;
}

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

    /**
     * SIGUE SIENDO «NO TOQUES NADA», CON UNA EXCEPCIÓN: la imagen, y solo cuando
     * todavía no hay ninguna.
     *
     * POR QUÉ HIZO FALTA. Al añadir la columna de imagen había 4 313 artículos ya
     * guardados sin ella. Con ON CONFLICT DO NOTHING, un artículo que vuelve a
     * aparecer en el feed —y los feeds reexponen sus últimas piezas en cada
     * ciclo— descartaba su foto para siempre.
     *
     * COALESCE(articles.image_url, EXCLUDED.image_url) tiene ese orden a
     * propósito: lo ya guardado gana. Así esto RELLENA huecos y nunca
     * sobrescribe, de modo que un feed que empiece a devolver una imagen
     * distinta no cambia la que el lector ya vio.
     *
     * El titular, el extracto y el tono NO se actualizan. Reescribir un titular
     * ya publicado es justamente lo que este proyecto no hace, y la fecha
     * tampoco se toca porque el orden de la portada depende de ella.
     *
     * OJO: esto NO cubre a los artículos que el motor descarta antes de llegar
     * aquí por estar ya en memoria, que son la mayoría. De esos se encarga
     * backfillImages().
     */
    const result = await safeQuery(
        `
        INSERT INTO articles
            (id, canonical_url, source_id, headline, raw_title, snippet,
             category, tone, published_at, ingested_at, image_url, topics, ambito)
        -- Los temas llegan como cadena separada por comas y se parten aquí.
        -- unnest no admite un array de arrays irregulares: aplana los
        -- multidimensionales y exigiría el mismo número de temas en cada fila,
        -- que es justo lo que la clasificación multietiqueta no garantiza.
        SELECT id, url, src, titular, crudo, extracto, categoria, tono, publicado,
               ingerido, imagen,
               CASE WHEN temas = '' THEN '{}'::text[] ELSE string_to_array(temas, ',') END,
               ambito
          FROM unnest(
            $1::text[], $2::text[], $3::text[], $4::text[], $5::text[],
            $6::text[], $7::text[], $8::jsonb[], $9::timestamptz[], $10::timestamptz[],
            $11::text[], $12::text[], $13::text[]
        ) AS t(id, url, src, titular, crudo, extracto, categoria, tono, publicado,
               ingerido, imagen, temas, ambito)
        -- Ver el comentario de arriba: se rellena la imagen y nada más.
        ON CONFLICT (canonical_url) DO UPDATE
            SET image_url = COALESCE(articles.image_url, EXCLUDED.image_url)
          WHERE articles.image_url IS NULL
            AND EXCLUDED.image_url IS NOT NULL
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
            // null cuando el feed no trae imagen, que es lo más frecuente. No se
            // sustituye por nada: o es la del medio, o no hay.
            usable.map((a) => a.imageUrl ?? null),
            // Array vacío y NULL no son lo mismo aquí, y la diferencia la usa
            // el recategorizador: NULL es «nunca se clasificó» y `{}` es «se
            // clasificó y no dio tema». Sin distinguirlas, cada pasada volvería
            // a intentar los mismos artículos inclasificables para siempre.
            usable.map((a) => (a.topics ?? []).join(',')),
            usable.map((a) => a.ambito ?? null),
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
                         source_count, topics, ambito, departamento, computed_at)
                    -- Mismo motivo que en el guardado de artículos: los temas
                    -- viajan como cadena porque unnest no admite arrays de
                    -- longitud desigual.
                    SELECT id, titulo, src, url, categoria, publicado, visto,
                           sesgo, polar, izq, centro, der, dominante,
                           insuficiente, punto_ciego, factual, medios,
                           CASE WHEN temas = '' THEN '{}'::text[]
                                ELSE string_to_array(temas, ',') END,
                           ambito, departamento, now()
                      FROM unnest(
                        $1::text[], $2::text[], $3::text[], $4::text[], $5::text[],
                        $6::timestamptz[], $7::timestamptz[], $8::real[], $9::real[],
                        $10::smallint[], $11::smallint[], $12::smallint[], $13::text[],
                        $14::boolean[], $15::text[], $16::real[], $17::int[],
                        $18::text[], $19::text[], $20::text[]
                    ) AS t(id, titulo, src, url, categoria, publicado, visto,
                           sesgo, polar, izq, centro, der, dominante,
                           insuficiente, punto_ciego, factual, medios, temas, ambito,
                           departamento)
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
                        -- Se recalculan en cada ciclo, como el resto de
                        -- métricas: la historia puede haber ganado artículos
                        -- de otro medio y con ellos un tema que antes no tenía.
                        topics                = EXCLUDED.topics,
                        ambito                = EXCLUDED.ambito,
                        departamento          = EXCLUDED.departamento,
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
                        stories.map((s) => (s.topics ?? []).join(',')),
                        stories.map((s) => s.ambito ?? null),
                        stories.map((s) => s.departamento ?? null),
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

/**
 * El último ciclo registrado, leído de la base. `null` si no hay ninguno.
 *
 * /api/health dejó de poder usar el estado en memoria cuando el motor pasó a
 * ser un proceso aparte (F2-12). La API no ingiere nunca, así que su
 * `lastRunAt` es null para siempre y health respondía 503 de forma PERMANENTE
 * en producción, con el motor ingiriendo cada 30 minutos sin fallo alguno.
 *
 * Una alarma que nunca se apaga es peor que no tener alarma: el panel mostraba
 * "degradado" de continuo, y a las pocas semanas nadie mira un indicador que
 * siempre está en rojo. Justo cuando la ingesta se pare de verdad, no lo dirá
 * nadie.
 *
 * `at` tiene índice único —lo impone el ON CONFLICT de recordRun— así que este
 * ORDER BY ... LIMIT 1 lo resuelve el índice sin recorrer la tabla.
 */
export async function lastRunFromDb() {
    const result = await safeQuery(
        `
        SELECT at, duration_ms, feeds_ok, feeds_failed, new_articles, total_stories, actor
          FROM ingest_runs
         ORDER BY at DESC
         LIMIT 1
        `,
        [],
        'último ciclo'
    );

    if (!result?.rows?.length) return null;

    const fila = result.rows[0];
    return {
        at: fila.at instanceof Date ? fila.at.toISOString() : fila.at,
        durationMs: fila.duration_ms,
        feedsOk: fila.feeds_ok,
        feedsFailed: fila.feeds_failed,
        newArticles: fila.new_articles,
        totalStories: fila.total_stories,
        actor: fila.actor ?? null,
    };
}

/** Registra un ciclo en `ingest_runs`. Espejo de la línea del JSONL. */
export async function recordRun(row) {
    return safeQuery(
        `
        INSERT INTO ingest_runs
            (at, duration_ms, feeds_ok, feeds_failed, active_feeds, new_articles,
             total_articles, total_stories, multi_source_stories,
             cross_spectrum_stories, blindspot_stories, filtered_articles,
             ventana_horas, actor)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
            row.ventanaHoras ?? null,
            row.actor ?? null,
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
