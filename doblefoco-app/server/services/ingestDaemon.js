/**
 * Motor de ingesta de DobleFoco.co
 *
 * REGLA INVIOLABLE DE ESTE ARCHIVO
 * --------------------------------
 * Nunca se genera, completa ni parafrasea un titular atribuido a un medio.
 * Cada titular que sale de aquí fue publicado literalmente por el medio al que
 * se le atribuye, y viene acompañado del enlace donde se puede verificar.
 * Cuando un espectro político no tiene cobertura real, se devuelve `null` y la
 * interfaz debe declarar la ausencia. La ausencia de cobertura es información
 * valiosa; rellenarla es fabricar una cita.
 *
 * La versión anterior de este archivo construía las perspectivas concatenando
 * texto inventado al titular real ("— Enfoque en garantías sociales e impacto
 * comunitario") y lo describía como "Titular auténtico reportado por la
 * redacción de El Espectador". Cuando no encontraba fuente de izquierda o
 * derecha, atribuía el hecho a El Espectador o a Semana por defecto, aunque
 * nunca lo hubieran cubierto. Eso se eliminó por completo.
 */

import Parser from 'rss-parser';
import {
    analyzeCoverage,
    averageFactuality,
    classifySpectrum,
    SPECTRUM,
} from '../../shared/biasAnalysis.js';
import {
    articleId,
    clusterArticles,
    storyId,
} from '../../shared/clustering.js';
import { analyzeHeadlineTone } from '../../shared/headlineTone.js';
import { assessArticle } from '../../shared/contentQuality.js';
import { getIngestFeeds } from '../../shared/mediaRegistry.js';
import { recordIngestRun } from './metricsStore.js';
import { isDatabaseEnabled } from '../db/pool.js';
import {
    hydrateArticles,
    persistArticles,
    persistStories,
    pruneExpiredArticles,
    recordRun,
} from '../db/contentStore.js';

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

const FEED_TIMEOUT_MS = 12_000;
const FEED_RETRIES = 2;
const FEED_CONCURRENCY = 4;
const ITEMS_PER_FEED = 15;

/** Ventana de retención. Más allá de esto los artículos se descartan. */
const RETENTION_MS = 72 * 60 * 60 * 1000; // 72 horas

/** Techo duro de artículos en memoria, para que el proceso no crezca sin fin. */
const MAX_ARTICLES = 5_000;

/**
 * User-Agent identificable con URL de contacto.
 *
 * El anterior se disfrazaba de Chrome con "SincuentoBot/1.0" pegado al final
 * (el proyecto se llamaba Sincuento.co antes del cambio de nombre).
 * Si vamos a leer los feeds de medios ajenos, que sepan quiénes somos y cómo
 * pedirnos que paremos.
 */
const USER_AGENT =
    'DobleFocoBot/1.0 (+https://doblefoco.co/transparencia; agregador de cobertura periodística)';

const parser = new Parser({
    headers: { 'User-Agent': USER_AGENT },
    timeout: FEED_TIMEOUT_MS,
});

/**
 * Catálogo de feeds. `bias` y `factuality` provienen de la metodología
 * publicada en src/docs/metodologia.txt y deben mantenerse sincronizados con
 * ella: hoy el catálogo del frontend y este difieren en varios medios, y esa
 * reconciliación está agendada en el ROADMAP (Fase 1, tarea F1-04).
 */
/**
 * Los feeds se derivan del catálogo, no se declaran aquí.
 *
 * Antes este archivo tenía su propia tabla con el sesgo y la factualidad de
 * cada medio, que divergía de la de mediaLogos.js y de la de mockData.js: el
 * mismo medio tenía hasta tres valores distintos. Ahora shared/mediaRegistry.js
 * es la única fuente de verdad y aquí solo se consume.
 */
export const RSS_FEEDS_CONFIG = getIngestFeeds();

// ---------------------------------------------------------------------------
// Conjunto de trabajo en memoria
//
// Sigue habiendo un Map, y es intencional: el agrupamiento compara cada
// artículo con todos los demás y necesita el conjunto completo a mano. Lo que
// cambió con F2-01 es que ya no es el único sitio donde viven los datos. La
// base los respalda: `hydrate()` reconstruye este Map al arrancar y cada ciclo
// los vuelca a Postgres.
//
// Sin DATABASE_URL todo esto se comporta como antes —memoria pura, un reinicio
// lo borra— y el arranque lo advierte en vez de disimularlo.
// ---------------------------------------------------------------------------

/** @type {Map<string, object>} clave: enlace canónico */
const articlesByLink = new Map();

/** @type {Array<object>} */
let storiesFeed = [];

/** @type {Map<string, object>} clave: id de historia */
let storiesById = new Map();

let ingestionInProgress = false;
let lastRunAt = null;
let lastRunReport = null;

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Limpia el titular SIN alterar lo que escribió el medio.
 *
 * Lo único que se elimina es el sufijo " - Nombre del Medio" que Google News
 * añade por su cuenta a los títulos de su RSS. Ese texto no lo escribió la
 * redacción, así que quitarlo no altera la cita.
 *
 * Deliberadamente NO se eliminan adjetivos, prefijos tipo "URGENTE:" ni
 * palabras del léxico sensacionalista. La versión anterior lo hacía, y eso
 * convertía la cita en una edición silenciosa de contenido ajeno. La carga
 * emocional se MIDE y se anota aparte; no se corrige el titular.
 */
function cleanHeadline(rawTitle, outletName) {
    if (!rawTitle || typeof rawTitle !== 'string') return '';

    let clean = rawTitle.replace(/\s+/g, ' ').trim();

    if (outletName) {
        const suffix = ` - ${outletName}`;
        if (clean.toLowerCase().endsWith(suffix.toLowerCase())) {
            clean = clean.slice(0, -suffix.length).trim();
        }
    }

    return clean;
}

/** Normaliza el enlace para deduplicar: quita parámetros de campaña y hash. */
function canonicalizeLink(link) {
    if (!link || typeof link !== 'string') return '';
    try {
        const url = new URL(link);
        for (const key of [...url.searchParams.keys()]) {
            if (/^(utm_|fbclid|gclid|mc_|ref)/i.test(key)) url.searchParams.delete(key);
        }
        url.hash = '';
        return url.toString();
    } catch {
        return link.trim();
    }
}

/** Fecha de publicación real en ISO-8601, o null si el feed no la trae. */
function parsePublishedAt(item) {
    const raw = item?.isoDate || item?.pubDate;
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Extracto real del feed. Devuelve null si no hay contenido, en lugar de
 * inventar una frase de relleno.
 */
function extractSnippet(item) {
    const raw = item?.contentSnippet || item?.summary || item?.content || '';
    if (typeof raw !== 'string') return null;

    const text = raw
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (text.length < 30) return null;
    return text.length > 400 ? `${text.slice(0, 397)}…` : text;
}

/** Ejecuta tareas con concurrencia limitada. */
async function mapWithConcurrency(items, limit, worker) {
    const results = [];
    let cursor = 0;

    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (cursor < items.length) {
            const index = cursor;
            cursor += 1;
            results[index] = await worker(items[index], index);
        }
    });

    await Promise.all(runners);
    return results;
}

/** Lee un feed con reintentos y espera exponencial. */
async function fetchFeed(feedConfig) {
    let lastError = null;

    for (let attempt = 0; attempt <= FEED_RETRIES; attempt += 1) {
        try {
            const feed = await parser.parseURL(feedConfig.url);
            return { ok: true, items: feed?.items ?? [] };
        } catch (error) {
            lastError = error;
            if (attempt < FEED_RETRIES) {
                await sleep(500 * 2 ** attempt);
            }
        }
    }

    return { ok: false, error: lastError?.message ?? 'error desconocido', items: [] };
}

/** Descarta artículos viejos y aplica el techo de tamaño. */
function pruneArticles() {
    const cutoff = Date.now() - RETENTION_MS;

    for (const [link, article] of articlesByLink) {
        const stamp = article.publishedAt ? Date.parse(article.publishedAt) : article.ingestedAtMs;
        if (Number.isFinite(stamp) && stamp < cutoff) {
            articlesByLink.delete(link);
        }
    }

    if (articlesByLink.size > MAX_ARTICLES) {
        const sorted = [...articlesByLink.entries()].sort(
            (a, b) => (b[1].ingestedAtMs ?? 0) - (a[1].ingestedAtMs ?? 0)
        );
        articlesByLink.clear();
        for (const [link, article] of sorted.slice(0, MAX_ARTICLES)) {
            articlesByLink.set(link, article);
        }
    }
}

// ---------------------------------------------------------------------------
// Persistencia (F2-01)
// ---------------------------------------------------------------------------

/**
 * Vuelca a Postgres lo que acaba de producir el ciclo.
 *
 * Devuelve un fragmento para la línea de registro, o cadena vacía si no hay
 * base. Nunca lanza: sin persistencia el producto vuelve a ser lo que era ayer;
 * con una excepción sin capturar, se apaga.
 *
 * @param {Array<object>} fresh artículos nuevos de este ciclo
 */
async function persistToDatabase(fresh) {
    if (!isDatabaseEnabled()) return '';

    // La poda va PRIMERO. Así los artículos de este ciclo se insertan después
    // de que el borrado por retención haya pasado, y no al revés: guardar y
    // borrar acto seguido lo que se acaba de guardar sería trabajo perdido y
    // una ventana más ancha para la carrera que filtra `persistStories`.
    const expired = await pruneExpiredArticles(RETENTION_MS);
    const saved = await persistArticles(fresh);
    const stories = await persistStories(storiesFeed);

    const parts = [`db: +${saved} art.`];
    if (stories) parts.push(`${stories.stories} hist.`);
    if (stories?.removed) parts.push(`−${stories.removed} obsoletas`);
    if (expired) parts.push(`−${expired} caducadas`);

    return parts.join(' · ');
}

/**
 * Reconstruye el conjunto de trabajo desde la base, una vez, al arrancar.
 *
 * Esto es lo que hace que F2-01 signifique algo: sin esta función la base sería
 * un archivo de solo escritura, y el sitio seguiría apareciendo vacío tras cada
 * despliegue hasta el primer ciclo.
 *
 * Se llama antes de la primera ingesta. Si no hay base, o si la lectura falla,
 * devuelve 0 y el motor arranca igual: en frío, como hasta ahora.
 *
 * @returns {Promise<number>} artículos recuperados
 */
export async function hydrate() {
    if (!isDatabaseEnabled()) return 0;

    const recovered = await hydrateArticles({ retentionMs: RETENTION_MS, max: MAX_ARTICLES });
    if (!recovered.length) return 0;

    for (const article of recovered) {
        articlesByLink.set(article.link, article);
    }

    // Se agrupan de inmediato: el sitio debe poder servir contenido desde el
    // primer segundo, sin esperar a que termine el ciclo de ingesta.
    buildMultisourceStories();

    return recovered.length;
}

// ---------------------------------------------------------------------------
// Ingesta
// ---------------------------------------------------------------------------

/**
 * Ejecuta un ciclo completo de ingesta.
 * Si ya hay uno en curso, no se solapa: se rechaza y se informa.
 */
export async function runIngestionBatch() {
    if (ingestionInProgress) {
        return { skipped: true, reason: 'Ya hay un ciclo de ingesta en curso' };
    }

    ingestionInProgress = true;
    const startedAt = Date.now();

    try {
        const perFeed = await mapWithConcurrency(
            RSS_FEEDS_CONFIG,
            FEED_CONCURRENCY,
            async (feedConfig) => {
                const result = await fetchFeed(feedConfig);

                if (!result.ok) {
                    console.warn(
                        `[ingesta] feed inaccesible: ${feedConfig.name} (${feedConfig.url}) — ${result.error}`
                    );
                    return { feed: feedConfig.name, url: feedConfig.url, ok: false, added: 0, error: result.error };
                }

                const fresh = [];
                const discarded = {};

                for (const item of result.items.slice(0, ITEMS_PER_FEED)) {
                    const link = canonicalizeLink(item?.link);
                    if (!link) continue;

                    const headline = cleanHeadline(item?.title, feedConfig.name);
                    if (!headline) continue;

                    // La clave es el enlace: deduplicación O(1) e idempotente
                    // entre ejecuciones. Antes era un .some() sobre todo el
                    // array, con coste cuadrático.
                    if (articlesByLink.has(link)) continue;

                    // Formatos sin encuadre que comparar: sorteos, horóscopos,
                    // la TRM del día. Cuatro medios publicando el mismo número
                    // ganador es una historia multifuente perfecta y no
                    // significa nada. Se descarta antes de indexar y se cuenta
                    // por motivo, para poder vigilar que el filtro no se vuelva
                    // goloso (F1-14).
                    const quality = assessArticle({ headline });
                    if (!quality.indexable) {
                        discarded[quality.ruleId] = (discarded[quality.ruleId] ?? 0) + 1;
                        continue;
                    }

                    const article = {
                        id: articleId(link, headline),
                        headline,                       // literal del medio
                        rawTitle: item?.title ?? headline,
                        link,                           // enlace verificable
                        snippet: extractSnippet(item),  // real o null
                        // El tono se ANOTA sobre el titular literal; el
                        // titular no se modifica en ningún momento.
                        tone: analyzeHeadlineTone(headline),
                        publishedAt: parsePublishedAt(item),
                        ingestedAtMs: Date.now(),
                        outlet: {
                            // El id del registro es lo que enlaza el artículo
                            // con su medio en la base (articles.source_id).
                            id: feedConfig.mediaId,
                            name: feedConfig.name,
                            domain: feedConfig.domain,
                            bias: feedConfig.bias,
                            factuality: feedConfig.factuality,
                            spectrum: classifySpectrum(feedConfig.bias),
                        },
                        category: feedConfig.category,
                    };

                    articlesByLink.set(link, article);
                    fresh.push(article);
                }

                return {
                    feed: feedConfig.name,
                    url: feedConfig.url,
                    ok: true,
                    added: fresh.length,
                    fresh,
                    discarded,
                };
            }
        );

        pruneArticles();
        buildMultisourceStories();

        // La persistencia va DESPUÉS de construir las historias y antes de
        // informar: si algo aquí falla, el ciclo ya sirvió su función y lo
        // único que se pierde es la copia duradera. Ninguna de estas llamadas
        // lanza (ver server/db/contentStore.js).
        // Solo se guarda lo que sobrevivió a la poda.
        //
        // Un feed puede traer artículos publicados hace más de 72 horas, y
        // `pruneArticles()` acaba de sacarlos del Map. Persistirlos igual metía
        // en la base filas que el motor ya había descartado —quedaban ahí,
        // huérfanas y sin historia, hasta el borrado del ciclo siguiente— y
        // hacía que /api/health y la base dieran cifras distintas sin que
        // ninguna de las dos estuviera mal. La ventana de retención tiene que
        // significar lo mismo en los dos sitios.
        const fresh = perFeed
            .flatMap((f) => f.fresh ?? [])
            .filter((article) => articlesByLink.has(article.link));

        const persisted = await persistToDatabase(fresh);

        const shape = measureStoryShape();

        // Descartes agregados por motivo. Se publican en el informe del ciclo y
        // en la serie: un filtro editorial que trabaja en silencio es la forma
        // más discreta de perder noticias.
        const discardedByRule = {};
        for (const feed of perFeed) {
            for (const [rule, count] of Object.entries(feed.discarded ?? {})) {
                discardedByRule[rule] = (discardedByRule[rule] ?? 0) + count;
            }
        }
        const filteredArticles = Object.values(discardedByRule).reduce((a, b) => a + b, 0);

        const report = {
            startedAt: new Date(startedAt).toISOString(),
            durationMs: Date.now() - startedAt,
            newArticles: perFeed.reduce((sum, f) => sum + f.added, 0),
            filteredArticles,
            discardedByRule,
            totalArticles: articlesByLink.size,
            totalStories: storiesFeed.length,
            feedsOk: perFeed.filter((f) => f.ok).length,
            feedsFailed: perFeed.filter((f) => !f.ok).map((f) => ({ feed: f.feed, error: f.error })),
            ...shape,
        };

        lastRunAt = report.startedAt;
        lastRunReport = report;

        const runRow = {
            at: report.startedAt,
            durationMs: report.durationMs,
            feedsOk: report.feedsOk,
            feedsFailed: report.feedsFailed.length,
            activeFeeds: RSS_FEEDS_CONFIG.length,
            newArticles: report.newArticles,
            filteredArticles: report.filteredArticles,
            totalArticles: report.totalArticles,
            totalStories: report.totalStories,
            ...shape,
        };

        // La serie que pide F1-01, por duplicado y a propósito.
        //
        // El JSONL no se retira ahora que hay base: añadir una línea al final de
        // un archivo local sobrevive a que Postgres no responda, y esta serie no
        // se puede reconstruir hacia atrás porque los artículos se descartan a
        // las 72 horas. Cada ciclo no registrado es un dato que no vuelve.
        // Cuestan cinco campos; el seguro es barato.
        recordIngestRun({ ...report, ...runRow });
        if (isDatabaseEnabled()) recordRun(runRow);

        console.log(
            `[ingesta] ${report.newArticles} artículos nuevos · ${report.totalStories} historias ` +
            `(${shape.multiSourceStories} multifuente, ${shape.crossSpectrumStories} cruzan espectros) · ` +
            `${report.feedsOk}/${RSS_FEEDS_CONFIG.length} feeds OK · ${report.durationMs} ms` +
            (report.filteredArticles
                ? ` · ${report.filteredArticles} filtrados (${Object.entries(report.discardedByRule)
                    .map(([rule, n]) => `${rule}:${n}`)
                    .join(', ')})`
                : '') +
            (persisted ? ` · ${persisted}` : '')
        );

        return report;
    } finally {
        ingestionInProgress = false;
    }
}

/**
 * Elige el artículo representativo de un espectro.
 *
 * Devuelve `null` cuando ningún medio de ese espectro cubrió el hecho. Ese
 * null es el resultado correcto y la UI debe mostrarlo como "sin cobertura
 * registrada": es justamente la señal que hace valioso al producto.
 */
function pickPerspective(articles, spectrum) {
    const candidates = articles.filter((a) => a.outlet.spectrum === spectrum);
    if (!candidates.length) return null;

    // El más reciente; ante empate, el de mayor factualidad declarada.
    const best = candidates.sort((a, b) => {
        const dateA = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const dateB = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        if (dateB !== dateA) return dateB - dateA;
        return (b.outlet.factuality ?? 0) - (a.outlet.factuality ?? 0);
    })[0];

    return {
        outlet: best.outlet.name,
        domain: best.outlet.domain,
        bias: best.outlet.bias,
        // Literal, tal como lo publicó el medio. Sin prefijos, sin añadidos.
        headline: best.headline,
        // Extracto real del feed, o null. Nunca redactado por nosotros.
        snippet: best.snippet,
        url: best.link,
        publishedAt: best.publishedAt,
        tone: best.tone,
        otherOutletsInSpectrum: candidates.length - 1,
    };
}

/**
 * Mide la forma del feed de historias.
 *
 * Las tres cifras que decide F1-01, y por qué cada una:
 *   · multiSourceStories   → cuántas historias tienen más de un medio. Si son
 *                            pocas, el agrupamiento no está encontrando
 *                            coincidencias reales (F1-05).
 *   · crossSpectrumStories → cuántas reúnen medios de bloques distintos. Es LA
 *                            cifra del producto: sin ella no hay comparación de
 *                            encuadres, solo un lector de RSS.
 *   · blindspotStories     → cuántas tienen cobertura suficiente para poder
 *                            afirmar un punto ciego. Si es cero, el catálogo no
 *                            da para la función principal (F1-12).
 */
function measureStoryShape() {
    let multiSourceStories = 0;
    let crossSpectrumStories = 0;
    let blindspotStories = 0;

    for (const story of storiesFeed) {
        if (story.sources.length > 1) multiSourceStories += 1;

        const blocks = ['left', 'center', 'right'].filter((k) => (story.coverage?.[k] ?? 0) > 0);
        if (blocks.length > 1) crossSpectrumStories += 1;

        if (story.blindspot) blindspotStories += 1;
    }

    return { multiSourceStories, crossSpectrumStories, blindspotStories };
}

/** Agrupa los artículos ingeridos en historias multifuente. */
function buildMultisourceStories() {
    const articles = [...articlesByLink.values()].sort((a, b) => {
        const dateA = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const dateB = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        return dateB - dateA;
    });

    const clusters = clusterArticles(
        articles.map((a) => ({ ...a, cleanTitle: a.headline }))
    );

    storiesFeed = clusters.map((cluster) => {
        const items = cluster.articles;

        // Titular representativo: el del medio más cercano al centro, para no
        // adoptar el encuadre de un extremo como titular de la historia.
        const representative = [...items].sort(
            (a, b) => Math.abs(a.outlet.bias) - Math.abs(b.outlet.bias)
        )[0];

        // Un medio, una entrada: si un medio publicó tres notas, no cuenta triple.
        const outletsByName = new Map();
        for (const item of items) {
            if (!outletsByName.has(item.outlet.name)) {
                outletsByName.set(item.outlet.name, {
                    name: item.outlet.name,
                    domain: item.outlet.domain,
                    bias: item.outlet.bias,
                    factuality: item.outlet.factuality,
                    url: item.link,
                    publishedAt: item.publishedAt,
                });
            }
        }

        const sources = [...outletsByName.values()];
        const coverage = analyzeCoverage(sources);

        const publishedDates = items
            .map((a) => (a.publishedAt ? Date.parse(a.publishedAt) : null))
            .filter((d) => Number.isFinite(d));

        return {
            id: storyId(representative.headline),
            title: representative.headline,
            titleOutlet: representative.outlet.name,
            // El id, además del nombre: es la clave foránea hacia `sources`.
            titleOutletId: representative.outlet.id ?? null,
            titleUrl: representative.link,
            category: representative.category,

            // Fechas reales, no cadenas fijas. El texto relativo ("hace 2
            // horas") lo calcula el frontend en cada render.
            publishedAt: publishedDates.length
                ? new Date(Math.max(...publishedDates)).toISOString()
                : null,
            firstSeenAt: publishedDates.length
                ? new Date(Math.min(...publishedDates)).toISOString()
                : null,

            // Métricas separadas, no un solo número que las cancela.
            meanBias: coverage.meanBias,
            polarization: coverage.polarization,
            coverage: coverage.counts,
            coveragePercentages: coverage.percentages,
            dominantSpectrum: coverage.dominantSpectrum,
            insufficientCoverage: coverage.insufficientCoverage,
            blindspot: coverage.blindspot,

            // Media real de las fuentes, o null. Nunca la constante 0.88.
            factuality: averageFactuality(sources),

            sources,
            articleCount: items.length,

            // Cada perspectiva es un artículo real o null.
            perspectives: {
                left: pickPerspective(items, SPECTRUM.LEFT),
                center: pickPerspective(items, SPECTRUM.CENTER),
                right: pickPerspective(items, SPECTRUM.RIGHT),
            },

            // Lista verificable: titular literal + medio + enlace.
            articles: items.map((a) => ({
                id: a.id,
                outlet: a.outlet.name,
                headline: a.headline,
                url: a.link,
                snippet: a.snippet,
                publishedAt: a.publishedAt,
                bias: a.outlet.bias,
                tone: a.tone,
            })),
        };
    });

    // Primero las historias con más medios distintos; luego, las más recientes.
    storiesFeed.sort((a, b) => {
        if (b.sources.length !== a.sources.length) return b.sources.length - a.sources.length;
        return Date.parse(b.publishedAt ?? 0) - Date.parse(a.publishedAt ?? 0);
    });

    storiesById = new Map(storiesFeed.map((s) => [s.id, s]));
}

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

export const getLatestFeed = () => storiesFeed;

export const getStoryById = (id) => storiesById.get(id) ?? null;

export const getDatabaseStats = () => ({
    totalArticles: articlesByLink.size,
    totalStories: storiesFeed.length,
    activeFeeds: RSS_FEEDS_CONFIG.length,
    storiesWithBlindspot: storiesFeed.filter((s) => s.blindspot).length,
    storiesWithSufficientCoverage: storiesFeed.filter((s) => !s.insufficientCoverage).length,
    retentionHours: RETENTION_MS / 3_600_000,
    lastRunAt,
    lastRunReport,
    ingestionInProgress,
});
