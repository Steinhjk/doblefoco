// @ts-check
/**
 * Agrupamiento de artículos en historias multifuente e identificadores estables.
 *
 * Reemplaza dos implementaciones divergentes:
 *   · server: agrupaba por las 3 primeras palabras de más de 3 letras del
 *     titular. Dos hechos distintos que empezaban igual ("Gobierno anuncia
 *     nueva...") se fusionaban en una sola historia, y el mismo hecho titulado
 *     distinto por dos medios quedaba separado.
 *   · frontend: solapamiento de palabras con umbral fijo del 40%, sin
 *     normalizar tildes ni descartar palabras vacías.
 *
 * Aquí se usa similitud de Jaccard sobre tokens normalizados, descartando
 * palabras vacías del español. No es state of the art (TF-IDF + coseno o
 * MinHash escalan mejor), pero es determinista, auditable y suficiente para
 * el volumen actual. El umbral vive en una constante para poder calibrarlo.
 */

/**
 * Umbral calibrado, no adivinado. Medido sobre 195 titulares reales de 15
 * medios colombianos capturados en un mismo instante, contando los pares que
 * emparejan artículos de MEDIOS DISTINTOS (que es lo que interesa agrupar):
 *
 *   0.20 → 24 pares cruzados   ·  0.30 →  7 pares cruzados
 *   0.25 → 16 pares cruzados   ·  0.34 →  6 pares cruzados
 *                              ·  0.40 →  3 pares cruzados
 *
 * Entre 0.30 y 0.25 el número se dobla, y la inspección manual de esos pares
 * nuevos muestra fusiones incorrectas (hechos distintos sobre un mismo
 * personaje). Fusionar dos hechos en una historia es peor que dejarlos
 * separados: inventa una cobertura que no existe. Por eso el umbral se queda
 * en el lado conservador.
 */
export const SIMILARITY_THRESHOLD = 0.34;

/** Mínimo de tokens compartidos, para que títulos muy cortos no se fusionen. */
export const MIN_SHARED_TOKENS = 2;

const STOPWORDS = new Set([
    'a', 'al', 'ante', 'con', 'contra', 'de', 'del', 'desde', 'durante', 'en',
    'entre', 'hacia', 'hasta', 'mediante', 'para', 'por', 'segun', 'sin',
    'sobre', 'tras', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'lo', 'y', 'e', 'o', 'u', 'ni', 'que', 'se', 'su', 'sus', 'este', 'esta',
    'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'como', 'mas', 'pero',
    'ya', 'no', 'si', 'es', 'son', 'fue', 'fueron', 'ser', 'sera', 'han',
    'hay', 'tiene', 'tienen', 'tras', 'donde', 'cuando', 'quien', 'cual',
    'todo', 'toda', 'todos', 'todas', 'otro', 'otra', 'muy', 'tambien',
]);

/** Quita tildes y diacríticos para que "Bogotá" y "Bogota" sean el mismo token. */
function stripDiacritics(text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Convierte un texto en un conjunto de tokens significativos.
 * Conserva números (fechas, cifras, "2026") porque distinguen hechos.
 */
export function tokenize(text) {
    if (!text || typeof text !== 'string') return new Set();

    const normalized = stripDiacritics(text.toLowerCase());
    const words = normalized
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOPWORDS.has(w));

    return new Set(words);
}

/**
 * Similitud de Jaccard: intersección sobre unión. Rango [0, 1].
 * Se devuelve también el número de tokens compartidos para poder exigir un
 * mínimo absoluto además de la proporción.
 */
export function similarity(tokensA, tokensB) {
    if (!tokensA.size || !tokensB.size) return { score: 0, shared: 0 };

    let shared = 0;
    // Iterar el conjunto menor: la intersección es simétrica.
    const [small, large] =
        tokensA.size <= tokensB.size ? [tokensA, tokensB] : [tokensB, tokensA];

    for (const token of small) {
        if (large.has(token)) shared += 1;
    }

    const union = tokensA.size + tokensB.size - shared;
    return { score: union ? shared / union : 0, shared };
}

/** ¿Tratan estos dos textos el mismo hecho? */
export function isSameStory(titleA, titleB) {
    const { score, shared } = similarity(tokenize(titleA), tokenize(titleB));
    return shared >= MIN_SHARED_TOKENS && score >= SIMILARITY_THRESHOLD;
}

// ---------------------------------------------------------------------------
// TF-IDF + coseno (tarea F1-05)
//
// El problema de Jaccard: trata todos los tokens por igual. "colombia",
// "gobierno" y "presidente" pesan lo mismo que "Gaona" o "Potosí", cuando son
// los nombres propios raros los que identifican un hecho concreto. Un titular
// largo lleno de palabras comunes diluye la puntuación y separa hechos que sí
// son el mismo.
//
// El caso que lo destapó: "De la Espriella NOMBRA a Mauricio Gaona embajador" y
// "De la Espriella DESIGNÓ al jurista Mauricio Gaona" quedaron en 0,33 con
// Jaccard —justo por debajo del umbral de 0,34— y se partieron en dos historias
// de 7 medios cada una. Juntas eran 14, muy por encima del umbral de punto
// ciego. La función principal del producto se perdió por una centésima.
// ---------------------------------------------------------------------------

/**
 * Frecuencia inversa de documento sobre un corpus de conjuntos de tokens.
 *
 * Suavizada y siempre positiva: un token presente en TODOS los documentos
 * conserva un peso mínimo en vez de anularse. Anularlo haría que dos titulares
 * que solo comparten palabras comunes dieran coseno 0 y división por cero.
 *
 * @param {Array<Set<string>>} documents
 * @returns {Map<string, number>}
 */
export function buildIdf(documents) {
    const total = documents.length || 1;
    const df = new Map();

    for (const tokens of documents) {
        for (const token of tokens) df.set(token, (df.get(token) ?? 0) + 1);
    }

    const idf = new Map();
    for (const [token, count] of df) {
        idf.set(token, Math.log(total / (1 + count)) + 1);
    }

    return idf;
}

/** Peso de un token desconocido: se trata como si apareciera una sola vez. */
function weightOf(token, idf, fallback) {
    return idf.get(token) ?? fallback;
}

/**
 * Similitud coseno sobre vectores ponderados por IDF.
 *
 * Los titulares son textos muy cortos, así que la frecuencia de término es
 * prácticamente siempre 1 y `tokenize` ya devuelve un conjunto. El vector es
 * por tanto binario ponderado por IDF, y el coseno se reduce a:
 *
 *     Σ idf² sobre la intersección / (‖A‖ · ‖B‖)
 *
 * @returns {{score: number, shared: number}}
 */
export function cosineSimilarity(tokensA, tokensB, idf) {
    if (!tokensA.size || !tokensB.size) return { score: 0, shared: 0 };

    // Un token que no está en el corpus de referencia es, por definición, raro:
    // se le da el peso máximo observado en vez de descartarlo.
    const fallback = Math.log((idf.size || 1) / 2) + 1;

    let dot = 0;
    let shared = 0;
    let normA = 0;
    let normB = 0;

    for (const token of tokensA) {
        const w = weightOf(token, idf, fallback);
        normA += w * w;
        if (tokensB.has(token)) {
            dot += w * w;
            shared += 1;
        }
    }

    for (const token of tokensB) {
        const w = weightOf(token, idf, fallback);
        normB += w * w;
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return { score: denom ? dot / denom : 0, shared };
}

/**
 * Agrupa artículos en clústeres. Cada clúster acumula sus tokens para que la
 * comparación se haga contra el vocabulario completo del grupo, no solo contra
 * el titular del primer artículo que llegó.
 *
 * @param {Array<{cleanTitle?: string, title?: string}>} articles
 * @param {{merge?: boolean}} [options] `merge: false` devuelve el resultado de
 *   la pasada única, sin fusionar grupos. Existe para poder MEDIR el efecto de
 *   la fusión contra la línea base, no para usarse en producción.
 * @returns {Array<{articles: Array, tokens: Set<string>}>}
 */
export function clusterArticles(articles, { merge = true } = {}) {
    const list = Array.isArray(articles) ? articles : [];
    const clusters = [];

    for (const article of list) {
        const title = article?.cleanTitle || article?.title || '';
        const tokens = tokenize(title);
        if (!tokens.size) continue;

        let best = null;
        let bestScore = 0;

        for (const cluster of clusters) {
            const { score, shared } = similarity(tokens, cluster.tokens);
            if (shared >= MIN_SHARED_TOKENS && score >= SIMILARITY_THRESHOLD && score > bestScore) {
                best = cluster;
                bestScore = score;
            }
        }

        if (best) {
            best.articles.push(article);
            for (const token of tokens) best.tokens.add(token);
        } else {
            clusters.push({ articles: [article], tokens: new Set(tokens) });
        }
    }

    return merge ? mergeSimilarClusters(clusters) : clusters;
}

/**
 * Fusiona grupos que quedaron separados pese a superar el umbral entre sí.
 *
 * POR QUÉ HACE FALTA (tarea F1-05)
 * --------------------------------
 * La asignación de arriba es una sola pasada: cada artículo entra en el mejor
 * grupo que exista EN ESE MOMENTO. Nada vuelve a mirar los grupos después, así
 * que dos grupos pueden acabar siendo casi el mismo tema sin que nadie los
 * compare nunca.
 *
 * No es hipotético. Con 13 titulares reales sobre el nombramiento de Mauricio
 * Gaona como embajador ante la ONU, el resultado eran DOS historias —una de 8
 * medios y otra de 5— cuya similitud entre sí era 0,455, muy por encima del
 * umbral de 0,34. Juntas son 13 medios sobre un mismo hecho, muy por encima de
 * los 6 que exige afirmar un punto ciego (F1-03); separadas, ninguna llegaba.
 *
 * Cómo ocurre: el primer artículo abre el grupo A. Los siguientes se le suman y
 * los tokens de A se acumulan, así que su vocabulario crece y la similitud de
 * Jaccard con un titular nuevo BAJA (la unión crece más rápido que la
 * intersección). Llega un artículo que ya no supera el umbral contra A
 * engordado, abre el grupo B, y a partir de ahí los demás se reparten entre los
 * dos. A y B nunca se comparan.
 *
 * Esto no era un problema de la métrica de similitud —cambiar Jaccard por
 * TF-IDF no lo arregla— sino de que faltaba un paso.
 *
 * Se itera porque una fusión cambia el vocabulario del grupo resultante y puede
 * habilitar otra. El tope evita que un caso patológico se lleve el ciclo de
 * ingesta por delante; en la práctica converge en dos o tres pasadas.
 */
export const MAX_MERGE_PASSES = 5;

export function mergeSimilarClusters(input) {
    let clusters = input;

    for (let pass = 0; pass < MAX_MERGE_PASSES; pass += 1) {
        /**
         * Índice invertido token → grupos que lo contienen.
         *
         * Sin esto la fusión es cuadrática en número de grupos, y el número de
         * grupos crece con el corpus: medido, 2,1 s con 1 384 artículos y unos
         * 1 240 grupos. Con el techo de 5 000 artículos serían del orden de
         * 4 500 grupos y unos 20 millones de comparaciones POR PASADA, es decir
         * medio minuto largo añadido a cada ciclo de ingesta.
         *
         * La observación que lo evita: dos grupos que no comparten NINGÚN token
         * tienen similitud cero, así que compararlos es trabajo tirado. Y la
         * inmensa mayoría de los pares no comparte nada. El índice deja solo
         * los candidatos con al menos MIN_SHARED_TOKENS tokens en común, que
         * son los únicos que pueden llegar a fusionarse.
         */
        const byToken = new Map();
        clusters.forEach((cluster, index) => {
            for (const token of cluster.tokens) {
                if (!byToken.has(token)) byToken.set(token, []);
                byToken.get(token).push(index);
            }
        });

        const merged = [];
        const absorbed = new Set();
        let didMerge = false;

        for (let i = 0; i < clusters.length; i += 1) {
            if (absorbed.has(i)) continue;

            const target = {
                articles: [...clusters[i].articles],
                tokens: new Set(clusters[i].tokens),
            };

            // Candidatos: grupos posteriores que comparten tokens con este.
            // Se recuenta en cada vuelta del bucle porque `target.tokens` crece
            // con cada absorción y puede alcanzar a grupos que antes no tocaba.
            let changed = true;

            while (changed) {
                changed = false;
                const sharedCount = new Map();

                for (const token of target.tokens) {
                    for (const j of byToken.get(token) ?? []) {
                        if (j <= i || absorbed.has(j)) continue;
                        sharedCount.set(j, (sharedCount.get(j) ?? 0) + 1);
                    }
                }

                for (const [j, shared] of sharedCount) {
                    if (shared < MIN_SHARED_TOKENS) continue;

                    const { score } = similarity(target.tokens, clusters[j].tokens);
                    if (score < SIMILARITY_THRESHOLD) continue;

                    target.articles.push(...clusters[j].articles);
                    for (const token of clusters[j].tokens) target.tokens.add(token);
                    absorbed.add(j);
                    didMerge = true;
                    changed = true;
                }
            }

            merged.push(target);
        }

        clusters = merged;
        if (!didMerge) break;
    }

    return clusters;
}

/**
 * Hash determinista FNV-1a de 32 bits, en base 36.
 *
 * Se usa para derivar identificadores del CONTENIDO, no del reloj. Los ids
 * anteriores (`Date.now() + idx`, `art-${Date.now()}-${random(1000)}`)
 * colisionaban dentro del mismo milisegundo y cambiaban en cada ejecución, así
 * que la misma noticia recibía un id distinto en cada ciclo de ingesta y las
 * URLs /noticia/:id no eran estables.
 *
 * No es criptográfico y no pretende serlo: solo necesita ser estable y estar
 * bien distribuido.
 */
export function contentHash(...parts) {
    const input = parts.filter(Boolean).join(' ');
    let hash = 0x811c9dc5;

    for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }

    return (hash >>> 0).toString(36);
}

/** Id estable de artículo, derivado de su enlace canónico. */
export function articleId(link, fallbackTitle = '') {
    return `art_${contentHash(link || fallbackTitle)}`;
}

/** Id estable de historia, derivado del titular representativo del clúster. */
export function storyId(representativeTitle) {
    return `story_${contentHash(representativeTitle)}`;
}
