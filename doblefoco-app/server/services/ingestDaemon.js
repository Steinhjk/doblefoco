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
    calcularTasasDeAusencia,
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
import { detectarOpinion } from '../../shared/opinion.js';
import { classifyTopics } from '../../shared/topicClassifier.js';
import { getIngestFeeds } from '../../shared/mediaRegistry.js';
import { porRelevancia } from '../../shared/relevancia.js';
import { detectarDepartamento } from '../../shared/geografia.js';
import { USER_AGENT } from '../../shared/userAgent.js';
import { recordIngestRun } from './metricsStore.js';
import { getPool, isDatabaseEnabled } from '../db/pool.js';
import {
    hydrateArticles,
    backfillImages,
    persistArticles,
    persistStories,
    pruneExpiredArticles,
    recordRun,
} from '../db/contentStore.js';
import { rejectedStoryIds } from '../db/moderationStore.js';
import { enriquecerImagenes } from './imageEnricher.js';

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

const FEED_TIMEOUT_MS = 12_000;
const FEED_RETRIES = 2;
const FEED_CONCURRENCY = 4;

/**
 * Cuántos ítems se toman de cada feed por ciclo.
 *
 * SE EXPORTA para que `check:feeds` mida sobre los mismos 15 que entran de
 * verdad. Comprobar la frescura del feed entero engañaría: un feed puede traer
 * 100 ítems recientes y aun así no aportar nada si los 15 primeros son viejos,
 * que es exactamente lo que pasaba con los de Google News.
 */
export const ITEMS_PER_FEED = 15;

/**
 * Ventana de retención. Más allá de esto los artículos se descartan.
 *
 * Se exporta por el mismo motivo: la comprobación de feeds necesita saber qué
 * cuenta como «fresco», y una copia del número en el script se desincronizaría
 * el día que este cambie.
 */
export const RETENTION_MS = 72 * 60 * 60 * 1000; // 72 horas

/**
 * Techo duro de artículos en memoria, para que el proceso no crezca sin fin.
 *
 * SUBIDO DE 5 000 A 8 000 EL 2026-08-07, y el motivo es el hallazgo de F1-01.
 *
 * A 5 000 el techo mordía antes que la ventana de retención, y eso convertía una
 * constante de protección en el límite real del producto sin que nadie lo
 * decidiera. Medido sobre los 595 ciclos de la serie:
 *
 *   · El corpus tocó 5 000 el 2026-07-30 a las 14:25 y se quedó clavado ahí
 *     348 ciclos seguidos.
 *   · La tasa multifuente se aplanó EL MISMO DÍA: 34 → 150 → 302 → 346, y a
 *     partir de ahí once días oscilando entre 330 y 351 sin subir.
 *   · Con el techo puesto, 790 artículos (13,6 %) estaban dentro de las 72 h de
 *     retención y NO participaban en el agrupamiento. La ventana efectiva era
 *     de ~62 h, no de 72.
 *   · Segundo síntoma, visible en cada ciclo: «152 artículos nuevos» contra
 *     «db: +16 art.». Los ~136 de diferencia ya estaban en la base y volvían a
 *     entrar porque el techo los había expulsado del conjunto de trabajo.
 *
 * El corte no lo fijaba una decisión editorial sino el volumen de un solo medio:
 * Infobae publica 1 889 artículos en 72 h, el 32,5 % del corpus. A más publique
 * él, más corta se vuelve la ventana para todos los demás — y los que se quedan
 * fuera son siempre los medios pequeños, que son los que hacen falta para que
 * una historia cruce espectros.
 *
 * POR QUÉ 8 000 Y NO 6 000. Cubrir las 72 h reales pide 5 786 hoy. 8 000 deja
 * un 38 % de margen para que el techo no vuelva a morder solo porque un medio
 * suba su cadencia; volver a topar sin enterarse es exactamente lo que se está
 * corrigiendo.
 *
 * LO QUE CUESTA, medido antes de subirlo: el ciclo tarda 19,3 s de media con
 * 5 000 artículos, contra una cadencia de 30 minutos y un `timeout-minutes: 10`
 * en el workflow. La memoria del worker es de 512 MB para un conjunto que ocupa
 * del orden de 10 MB. Hay margen de sobra por los dos lados.
 *
 * QUÉ VIGILAR: `duration_ms` en la serie. Si el ciclo se acercara a los minutos,
 * el cuello sería el agrupamiento y la respuesta ya no es subir el techo.
 */
const MAX_ARTICLES = 8_000;

/*
 * El User-Agent vive en `shared/userAgent.js`, en un solo sitio.
 *
 * Sigue siendo identificable y con URL de contacto —el anterior se disfrazaba de
 * Chrome, y si vamos a leer los feeds de medios ajenos que sepan quiénes somos y
 * cómo pedirnos que paremos—. Lo que cambió el 2026-08-11 es que llevaba una
 * tilde, y una cabecera HTTP con caracteres no ASCII es inválida: nos devolvían
 * 403 servidores que no nos bloqueaban en absoluto. Ver la nota de ese archivo.
 */

const parser = new Parser({
    headers: { 'User-Agent': USER_AGENT },
    timeout: FEED_TIMEOUT_MS,
    // `media:*` no son campos estándar de RSS, así que rss-parser los ignora
    // salvo que se pidan. `keepArray` porque un item suele traer varias
    // resoluciones de la misma foto y hay que poder elegir.
    customFields: {
        item: [
            ['media:content', 'mediaContent', { keepArray: true }],
            ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
            // Varios medios no declaran media:content pero sí incrustan la foto
            // en el HTML del contenido. Pedirlo no cuesta ninguna petición extra.
            ['content:encoded', 'contentEncoded'],
        ],
    },
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

/**
 * Historias retiradas por moderación (F2-02).
 *
 * El modelo editorial es publicar todo y moderar para RETIRAR, no aprobar para
 * publicar: con ~1 000 historias y 140 nuevas por ciclo, una cola de aprobación
 * previa dejaría el sitio permanentemente desactualizado o se despacharía en
 * bloque sin mirar. Las garantías del producto las da el motor.
 *
 * Se mantiene en memoria porque el conjunto es pequeño y se consulta en cada
 * petición del feed. Se refresca al arrancar, tras cada ciclo y en cuanto
 * alguien decide algo en el panel.
 *
 * @type {Set<string>}
 */
let rejected = new Set();

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
export function cleanHeadline(rawTitle, outletName, outletDomain) {
    if (!rawTitle || typeof rawTitle !== 'string') return '';

    let clean = rawTitle.replace(/\s+/g, ' ').trim();

    /**
     * Google News añade « - <medio>» al final de cada titular. Quitarlo no
     * modifica el titular del medio: lo DEVUELVE a lo que era, porque el sufijo
     * lo puso Google.
     *
     * Se prueban el nombre y el DOMINIO. El dominio hizo falta al reactivar
     * W Radio (2026-07-30): en las búsquedas `site:` Google rotula la fuente con
     * el dominio y no con el nombre, así que quedaban titulares como «Noticias y
     * Radio Online - wradio.com.co». Medido sobre la base, afectaba a 6
     * artículos de cuatro medios —poco, pero cada uno es un titular que no es
     * literal—. Y sin quitar el sufijo, la regla `no-es-articulo` de
     * contentQuality no puede anclar al titular completo, que es lo que la
     * mantiene estrecha.
     */
    for (const candidato of [outletName, outletDomain, `www.${outletDomain}`]) {
        if (!candidato) continue;

        /**
         * Varios separadores, no solo el guion. Noticias Uno cierra sus
         * titulares con « | Noticias UNO» y El Tiempo con « - El Tiempo»: es el
         * mismo sufijo de marca con distinto signo, y ninguno lo escribió la
         * redacción como parte de la frase.
         *
         * La comparación sigue siendo por el NOMBRE del medio y anclada al
         * final. Quitar todo lo que venga tras una barra recortaría titulares
         * legítimos —«Petro | La entrevista completa» perdería la mitad—, que es
         * el error que este bucle existe para no cometer.
         */
        const cortado = [' - ', ' | ', ' — ', ' – ']
            .map((sep) => `${sep}${candidato}`)
            .find((suffix) => clean.toLowerCase().endsWith(suffix.toLowerCase()));

        if (cortado) {
            clean = clean.slice(0, -cortado.length).trim();
            break;
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

/**
 * Margen que se le concede al reloj de un medio antes de considerar que su
 * fecha miente. Los relojes de servidores distintos no coinciden al segundo y
 * media hora absorbe esa deriva sin dejar pasar una publicación programada.
 */
const MARGEN_FUTURO_MS = 30 * 60 * 1000;

/**
 * Fecha de publicación real en ISO-8601, o null si el feed no trae una usable.
 *
 * UNA FECHA EN EL FUTURO NO ES UNA FECHA DE PUBLICACIÓN. El 2026-07-29 La
 * Opinión entregó dos artículos fechados a las 09:00 del día siguiente —casi
 * diez horas por delante—, y como el feed ordena por `published_at DESC` se
 * quedaron clavados encabezando la portada hasta que el reloj los alcanzara.
 * Eran además las dos primeras URLs del sitemap. Suele ser un gestor de
 * contenidos que publica con fecha programada, o una zona horaria mal aplicada;
 * en cualquier caso es un dato que el medio afirma y que no se sostiene.
 *
 * Se devuelve null, que es el mismo caso que un feed sin fecha: la ausencia ya
 * está contemplada en todo el recorrido y el artículo se ordena por el momento
 * en que lo vimos, que sí es verificable. No se recorta la fecha a «ahora»
 * porque eso guardaría en la base una fecha que nadie ha declarado.
 *
 * @param {any} item
 * @param {number} [ahoraMs] - inyectable para poder probarlo sin depender del reloj
 */
export function parsePublishedAt(item, ahoraMs = Date.now()) {
    const raw = item?.isoDate || item?.pubDate;
    if (!raw) return null;

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    if (date.getTime() > ahoraMs + MARGEN_FUTURO_MS) return null;

    return date.toISOString();
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

/** Extensiones que aceptamos cuando el feed no declara un tipo MIME. */
const EXTENSIONES_DE_IMAGEN = /\.(jpe?g|png|webp|avif|gif)(?:$|\?)/i;

/**
 * La primera `<img>` del HTML del item, si la hay.
 *
 * Se devuelve como lista con la misma forma que un enclosure —`{url}`— para que
 * el bucle de `extractImage` la trate igual que a los demás candidatos y no haya
 * dos caminos distintos de validación. Lista vacía si no hay ninguna.
 *
 * Sin `type`, así que dependerá de la extensión del archivo para ser aceptada.
 * Es deliberado: una <img> del cuerpo tiene menos respaldo que una foto
 * declarada por el medio, y conviene que pase el listón más alto.
 */
function primeraImagenDelContenido(item) {
    for (const campo of ['contentEncoded', 'content', 'summary', 'description']) {
        const html = item?.[campo];
        if (typeof html !== 'string') continue;

        const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (match?.[1]) return [{ url: match[1] }];
    }

    return [];
}

/**
 * La imagen que el medio publicó con la pieza. `null` si no trae ninguna.
 *
 * REGLA: la imagen tiene que venir del MEDIO. No se busca una alternativa, no se
 * deriva del titular y no se sustituye por una foto de archivo. Antes sí se
 * hacía: la portada elegía una foto de Unsplash con `hash(titular) % 21`, de modo
 * que una condena por corrupción se ilustraba con «Indicadores Económicos». Una
 * imagen junto a un titular se lee como documental; poner ahí una que no lo es es
 * la misma fabricación que la Fase 0 quitó del texto.
 *
 * SE EXIGE HTTPS Y QUE EL HOST SEA DEL MEDIO. Lo primero porque una imagen por
 * http en una página https no se carga y además degrada la conexión. Lo segundo
 * es la parte que importa: sin comprobarlo, cualquier feed podría hacer que el
 * sitio incruste una URL de un tercero —un rastreador, un contador de visitas
 * disfrazado de imagen— y quien la pediría sería el navegador del lector. El
 * medio ya sabe que publicó la pieza; un tercero no tiene por qué.
 *
 * «Del medio» es su dominio O un host declarado en `imageHosts` del registro.
 * Hizo falta al medirlo: de los 12 feeds que traen imagen, 9 la sirven desde su
 * propio dominio y 3 desde la infraestructura de su gestor de contenidos
 * —Semana y El País de Cali desde la CDN de Arc Publishing, BBC Mundo desde
 * ichef.bbci.co.uk—. Sin declararlos se perdían las fotos de esos tres.
 *
 * SE DECLARAN UNO A UNO Y NO POR PATRÓN a propósito. Un comodín tipo
 * `*.arc-cdn.net` aceptaría cualquier cliente de Arc, que son cientos de medios
 * ajenos a este catálogo. Y si un medio cambia de CDN, sus imágenes DEJAN de
 * aparecer en vez de abrirse un agujero: falla cerrado.
 *
 * @param {any} item  item del RSS
 * @param {string} link  enlace canónico del artículo, ya normalizado
 * @param {string[]} [imageHosts]  hosts extra declarados por el medio
 * @returns {string|null}
 */
/**
 * ¿Esta URL de imagen es del medio, y se puede servir?
 *
 * UNA SOLA REGLA PARA LOS DOS CAMINOS. La imagen puede llegar del RSS
 * (`extractImage`) o de la etiqueta og:image de la página (`imageEnricher`), y
 * si cada camino validara por su cuenta acabarían divergiendo: uno aceptaría lo
 * que el otro rechaza y nadie se enteraría hasta ver una petición a un tercero
 * en la pestaña de red de un lector.
 *
 * @param {string} url
 * @param {string} dominioDelArticulo  ya sin `www.`
 * @param {string[]} imageHosts  hosts extra declarados por el medio
 * @returns {string|null} la URL normalizada, o null si no pasa
 */
export function urlDeImagenValida(url, dominioDelArticulo, imageHosts = []) {
    if (typeof url !== 'string' || !url) return null;

    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return null;
    }

    // http en una página https no carga y además degrada la conexión.
    if (parsed.protocol !== 'https:') return null;

    const host = parsed.hostname.replace(/^www\./, '');
    const delMedio =
        host === dominioDelArticulo ||
        host.endsWith(`.${dominioDelArticulo}`) ||
        dominioDelArticulo.endsWith(`.${host}`) ||
        // Coincidencia EXACTA con lo declarado, sin comodines.
        imageHosts.some((permitido) => host === String(permitido).replace(/^www\./, ''));

    return delMedio ? parsed.toString() : null;
}

export function extractImage(item, link, imageHosts = []) {
    const candidatos = [
        ...(Array.isArray(item?.mediaContent) ? item.mediaContent : []),
        ...(Array.isArray(item?.mediaThumbnail) ? item.mediaThumbnail : []),
        item?.enclosure,
        /**
         * Último recurso: la primera <img> incrustada en el HTML del contenido.
         *
         * MEDIDO EL 2026-07-30: de los 21 feeds que no declaran `media:content`,
         * tres sí llevan la foto ahí dentro —La Silla Vacía, La Opinión y El
         * Nuevo Siglo, unos 333 artículos—. Leerla no cuesta ninguna petición
         * extra porque el contenido ya viene descargado.
         *
         * Va la ÚLTIMA de la lista a propósito: `media:content` es la foto que
         * el medio designó para la pieza, mientras que la primera <img> del
         * cuerpo puede ser un logo o un banner. Solo se usa si no hay nada mejor,
         * y sigue pasando por las mismas comprobaciones de host y protocolo.
         */
        ...primeraImagenDelContenido(item),
    ];

    let dominioDelArticulo;
    try {
        dominioDelArticulo = new URL(link).hostname.replace(/^www\./, '');
    } catch {
        return null;
    }

    for (const candidato of candidatos) {
        // rss-parser deja los atributos en `$` y el enclosure los trae planos.
        const url = candidato?.$?.url ?? candidato?.url;
        const tipo = candidato?.$?.type ?? candidato?.type ?? '';
        const medium = candidato?.$?.medium ?? '';

        if (typeof url !== 'string' || !url) continue;

        // Un enclosure puede ser un audio o un PDF. Si el feed declara tipo, se
        // respeta; si no lo declara, se cae en la extensión.
        const declaraImagen = tipo.startsWith('image/') || medium === 'image';
        const pareceImagen = declaraImagen || (!tipo && EXTENSIONES_DE_IMAGEN.test(url));
        if (!pareceImagen) continue;

        const valida = urlDeImagenValida(url, dominioDelArticulo, imageHosts);
        if (valida) return valida;
    }

    return null;
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

/**
 * Enlaces que el ÚLTIMO agrupamiento colocó en una historia de dos o más medios.
 *
 * Lo rellena `buildMultisourceStories`, y lo lee `pruneArticles` en el ciclo
 * siguiente. Es información del ciclo anterior a propósito: la poda corre ANTES
 * de agrupar, así que en ese momento el agrupamiento de este ciclo no existe
 * todavía. Usar el del anterior es una aproximación buena —un artículo que ya
 * encontró pareja rara vez la pierde— y es la única disponible sin agrupar dos
 * veces por ciclo.
 *
 * @type {Set<string>}
 */
let enlacesComparables = new Set();

/**
 * Margen antes de que un artículo pueda considerarse «no comparable».
 *
 * Sin esto la regla se muerde la cola: un artículo recién ingerido todavía no ha
 * tenido ocasión de encontrar a nadie que cubra lo mismo, así que parecería
 * prescindible justo cuando más falta hace conservarlo. Doce horas es holgado
 * frente a los 30 minutos de cadencia.
 */
const GRACIA_MS = 12 * 60 * 60 * 1000;

/**
 * Descarta artículos viejos y aplica el techo de tamaño.
 *
 * EL TECHO YA NO EXPULSA A CIEGAS POR EDAD (2026-08-07, decisión de Jose).
 *
 * Antes se quedaba con los MAX_ARTICLES más recientes y punto. Medido sobre el
 * corpus real, eso repartía el castigo al revés de lo que interesa:
 *
 *   · 42,8 % del corpus era noticia INTERNACIONAL, y 39,8 % era internacional
 *     que ningún otro medio del catálogo cubrió: 2 305 artículos que no pueden
 *     compararse jamás, no por malos sino porque no hay con qué contrastarlos.
 *   · Infobae Colombia publica 1 897 piezas en 72 h y el 89,2 % son
 *     internacionales —España, Argentina, México, Perú, Brasil—. Su feed sirve
 *     el cable panhispánico, no noticia colombiana. Solo el 5 % de lo suyo llega
 *     a compararse, frente al 25 % de El Tiempo o El Colombiano.
 *   · Y los que caían fuera por edad eran los medios lentos: Vorágine publica
 *     una pieza cada 74,7 h, más despacio que la propia ventana, así que quedaba
 *     excluido de forma sistemática.
 *
 * O sea: el cable extranjero de un solo medio estaba desalojando al periodismo
 * de investigación colombiano. Ahora el orden de expulsión es explícito —primero
 * lo internacional sin cobertura, después por edad— y con eso el corpus
 * comparable baja a ~3 489 artículos, muy por debajo del techo: deja de morder
 * y la ventana se alarga sola para todo lo que sí se compara. No hace falta
 * ninguna regla especial para los medios lentos; se arregla como efecto.
 *
 * SE APLICA A TODOS POR IGUAL, incluidos Euronews, DW, France 24 y El País de
 * España, que son internacionales por definición. Decidido así a propósito: lo
 * que sobrevive de ellos es exactamente lo internacional RELEVANTE —lo que un
 * medio colombiano también cubrió—, que es lo que pide F1-16. Una excepción por
 * medio habría sido una regla sobre quién publica y no sobre qué se puede
 * comparar.
 *
 * NO ES UN FILTRO DE CALIDAD ni de tema, y por eso vive aquí y no en
 * contentQuality.js: no dice que estas piezas sean peores, dice que cuando no
 * cabe todo hay que elegir, y se elige por comparabilidad. Mientras el corpus
 * quepa bajo el techo, no se expulsa nada.
 */
function pruneArticles() {
    const cutoff = Date.now() - RETENTION_MS;

    for (const [link, article] of articlesByLink) {
        const stamp = article.publishedAt ? Date.parse(article.publishedAt) : article.ingestedAtMs;
        if (Number.isFinite(stamp) && stamp < cutoff) {
            articlesByLink.delete(link);
        }
    }

    if (articlesByLink.size <= MAX_ARTICLES) return;

    const ahora = Date.now();

    /**
     * `true` = se conserva con prioridad. La duda SIEMPRE protege: un artículo
     * sin `ambito` —los rehidratados de antes de que existiera la columna— no se
     * considera prescindible. Equivocarse hacia conservar cuesta un hueco;
     * equivocarse hacia expulsar borra una noticia sin dejar rastro.
     */
    const prioritario = (link, article) => {
        if (article.ambito !== 'internacional') return true;
        if (enlacesComparables.has(link)) return true;
        return ahora - (article.ingestedAtMs ?? 0) < GRACIA_MS;
    };

    const sorted = [...articlesByLink.entries()].sort((a, b) => {
        const pa = prioritario(a[0], a[1]) ? 1 : 0;
        const pb = prioritario(b[0], b[1]) ? 1 : 0;
        if (pa !== pb) return pb - pa;
        return (b[1].ingestedAtMs ?? 0) - (a[1].ingestedAtMs ?? 0);
    });

    articlesByLink.clear();
    for (const [link, article] of sorted.slice(0, MAX_ARTICLES)) {
        articlesByLink.set(link, article);
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
    await refreshModeration();

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
    await refreshModeration();

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

    /**
     * Cerrojo a nivel de BASE, no solo de proceso.
     *
     * `ingestionInProgress` impide que un ciclo se solape consigo mismo dentro
     * de este proceso. No impide nada entre procesos: el motor desplegado y una
     * ejecución de GitHub Actions, o dos motores durante un despliegue, pedirían
     * los feeds de 34 medios a la vez.
     *
     * Eso importa por encima de la eficiencia. El proyecto se presenta ante esos
     * medios con un User-Agent propio y una URL de transparencia; duplicarles el
     * tráfico contradice esa postura, y uno ya nos responde 403.
     *
     * Un cerrojo consultivo de Postgres lo resuelve para SIEMPRE y sin
     * coordinación: da igual cuántos planificadores existan ni dónde vivan, solo
     * uno entra. Se libera solo si el proceso muere, porque va atado a la
     * conexión — no hay estado que limpiar a mano.
     *
     * El número es arbitrario pero fijo: identifica a "el ciclo de ingesta".
     */
    const CERROJO = 872_301_455;
    let conexionCerrojo = null;

    if (isDatabaseEnabled()) {
        const pool = getPool();
        conexionCerrojo = await pool.connect();
        const { rows } = await conexionCerrojo.query('SELECT pg_try_advisory_lock($1) AS tomado', [CERROJO]);

        if (!rows[0].tomado) {
            conexionCerrojo.release();
            return {
                skipped: true,
                reason: 'Otro proceso está ejecutando un ciclo de ingesta ahora mismo',
            };
        }
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
                /** Artículos ya guardados a los que el feed acaba de dar imagen. */
                const imagenesRecuperadas = [];

                for (const item of result.items.slice(0, ITEMS_PER_FEED)) {
                    const link = canonicalizeLink(item?.link);
                    if (!link) continue;

                    const headline = cleanHeadline(item?.title, feedConfig.name, feedConfig.domain);
                    if (!headline) continue;

                    // La clave es el enlace: deduplicación O(1) e idempotente
                    // entre ejecuciones. Antes era un .some() sobre todo el
                    // array, con coste cuadrático.
                    if (articlesByLink.has(link)) {
                        /**
                         * Antes de descartarlo: si el artículo ya está guardado
                         * SIN imagen y el feed ahora trae una, se recoge. Es la
                         * única vía para los artículos anteriores a que existiera
                         * la columna, porque este `continue` los deja fuera del
                         * INSERT para siempre. Sin esto, 1 de las 100 historias
                         * de la portada tenía foto.
                         */
                        const conocido = articlesByLink.get(link);
                        if (conocido && !conocido.imageUrl) {
                            const img = extractImage(item, link, feedConfig.imageHosts);
                            if (img) {
                                conocido.imageUrl = img;
                                imagenesRecuperadas.push({ link, imageUrl: img });
                            }
                        }
                        continue;
                    }

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

                    const snippet = extractSnippet(item);

                    /**
                     * El tema sale del CONTENIDO, no del feed.
                     *
                     * Antes esta línea era `category: feedConfig.category`, que
                     * describía nuestra configuración de ingesta y no la
                     * noticia: 24 de los 39 feeds están declarados como
                     * «Política», así que casi todo era política por
                     * definición y seis de las once categorías de la interfaz
                     * no podían llenarse nunca.
                     *
                     * Las etiquetas del propio ítem RSS y la sección de su URL
                     * entran como refuerzo. Solo el 32 % de los artículos trae
                     * `<category>` y un 37 % llega por Google News sin sección
                     * utilizable, así que ninguna de las dos puede ser la
                     * fuente: lo son el titular y la entradilla, que existen
                     * siempre.
                     */
                    const clasificacion = classifyTopics({
                        headline,
                        snippet,
                        link,
                        feedCategories: (item?.categories ?? []).map((c) =>
                            typeof c === 'string' ? c : c?._ ?? ''
                        ),
                        paisDelMedio: feedConfig.country,
                    });

                    const article = {
                        id: articleId(link, headline),
                        headline,                       // literal del medio
                        rawTitle: item?.title ?? headline,
                        link,                           // enlace verificable
                        snippet,                        // real o null
                        // Del medio o null. Nunca una foto de archivo.
                        imageUrl: extractImage(item, link, feedConfig.imageHosts),
                        // El tono se ANOTA sobre el titular literal; el
                        // titular no se modifica en ningún momento.
                        tone: analyzeHeadlineTone(headline),
                        publishedAt: parsePublishedAt(item),
                        ingestedAtMs: Date.now(),
                        /**
                         * OPINIÓN: se marca, se guarda y NO se agrupa.
                         *
                         * Decisión de Jose (2026-08-09). Una columna no es el
                         * reporte de un hecho: si tres medios opinan del mismo
                         * tema, el agrupador ve una historia multifuente
                         * perfecta donde no hubo un hecho reportado.
                         *
                         * No se descarta —es el mejor indicio de la orientación
                         * de un medio, porque a quién le das una columna es una
                         * decisión deliberada y repetida— sino que se marca y se
                         * deja fuera del agrupamiento. Eso es TODO lo que ocurre
                         * hoy con la marca: no hay ningún agregado detrás. El
                         * detalle, en `shared/opinion.js`.
                         */
                        opinion: detectarOpinion(link),
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
                        // Se conserva para no perder lo que se le mostró al
                        // lector antes de que existiera el clasificador. No lo
                        // lee nada nuevo.
                        category: feedConfig.category,
                        topics: clasificacion.temas,
                        ambito: clasificacion.ambito,
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
                    imagenesRecuperadas,
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

        /**
         * Relleno de imágenes de artículos ya guardados. Va aquí, junto a la
         * persistencia, y no dentro del bucle de feeds: una sola sentencia para
         * todo el ciclo en vez de una por feed.
         */
        const imagenesRecuperadas = perFeed.flatMap((f) => f.imagenesRecuperadas ?? []);
        const imagenesRellenadas = imagenesRecuperadas.length
            ? await backfillImages(imagenesRecuperadas)
            : 0;

        /**
         * Y para los 18 feeds que no publican imagen en su RSS de ninguna forma,
         * la etiqueta og:image de la página. Va al final del ciclo a propósito:
         * si tarda o falla, el ciclo ya hizo su trabajo. Nunca lanza.
         */
        const enriquecidas = await enriquecerImagenes();

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

        /**
         * CUÁNTAS HORAS DE HISTORIA CUBRE DE VERDAD EL CORPUS.
         *
         * La retención DECLARADA son 72 horas. La efectiva es la edad del
         * artículo más antiguo que sobrevivió a la poda, y las dos coinciden
         * solo mientras el techo no muerda.
         *
         * POR QUÉ SE PUBLICA. Del 2026-07-30 al 2026-08-07 el corpus estuvo
         * clavado en 5 000 artículos y la ventana real bajó a ~62 h sin que
         * nada lo dijera. La tasa multifuente dejó de crecer el mismo día y
         * pasaron once días antes de que alguien fuera a mirar por qué. Ese
         * número, publicado desde el principio, lo habría delatado en el primer
         * ciclo.
         *
         * Va también a la serie: así el estrechamiento se ve venir a lo largo
         * de semanas en vez de descubrirse cuando ya pasó.
         */
        const masAntiguo = Math.min(
            ...[...articlesByLink.values()].map((a) => {
                const marca = a.publishedAt ? Date.parse(a.publishedAt) : a.ingestedAtMs;
                return Number.isFinite(marca) ? marca : Date.now();
            })
        );
        const ventanaHoras = Number.isFinite(masAntiguo)
            ? Math.round(((Date.now() - masAntiguo) / 3_600_000) * 10) / 10
            : null;
        const ventanaRecortada =
            ventanaHoras !== null && ventanaHoras < (RETENTION_MS / 3_600_000) - 1;

        const report = {
            startedAt: new Date(startedAt).toISOString(),
            durationMs: Date.now() - startedAt,
            ventanaHoras,
            ventanaRecortada,
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
            ventanaHoras: report.ventanaHoras,
            // Quién corre este proceso lo declara el punto de entrada
            // (ingestWorker → 'motor', ingestOnce → 'manual' salvo que
            // Actions diga 'red-de-seguridad'). El daemon no lo adivina.
            actor: process.env.INGEST_ACTOR ?? null,
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
            // Se registra para poder ver si el relleno avanza o se ha quedado
            // atascado: un relleno que nunca sube es un feed que dejó de traer
            // imágenes y no habría otra forma de notarlo.
            (imagenesRellenadas ? ` · ${imagenesRellenadas} imágenes rellenadas` : '') +
            (enriquecidas.mirados
                ? ` · og:image ${enriquecidas.conImagen}/${enriquecidas.mirados}`
                : '') +
            (persisted ? ` · ${persisted}` : '') +
            // Se dice SIEMPRE, no solo cuando hay problema: un número que solo
            // aparece al fallar no deja línea base con la que comparar, y
            // encontrárselo por primera vez el día malo obliga a averiguar
            // entonces si es raro o normal.
            (report.ventanaHoras !== null
                ? ` · ventana ${report.ventanaHoras} h${report.ventanaRecortada ? ' ⚠ RECORTADA POR EL TECHO' : ''}`
                : '')
        );

        return report;
    } finally {
        ingestionInProgress = false;

        if (conexionCerrojo) {
            try {
                await conexionCerrojo.query('SELECT pg_advisory_unlock($1)', [CERROJO]);
            } catch {
                // Si la conexión ya murió, el cerrojo se liberó con ella.
            }
            conexionCerrojo.release();
        }
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

/**
 * Cuánto puede retrasarse el titular respecto al artículo más nuevo de su
 * historia, en horas.
 *
 * CALIBRADO, NO ELEGIDO. Medido sobre las 505 historias de más de un artículo
 * que había en la base el 2026-08-11, comparando el retraso medio del titular
 * con lo que cuesta en centralidad —el |sesgo| medio del medio elegido—:
 *
 *   ventana    retraso medio   con más de 6 h   |sesgo| del elegido
 *   sin vent.       4,24 h           94              0,113   ← lo que había
 *      24 h        3,07 h           78              0,118
 *      12 h        1,10 h           21              0,140
 *       6 h        0,75 h            0              0,146
 *       3 h        0,33 h            0              0,163
 *       1 h        0,06 h            0              0,188
 *
 * SEIS HORAS es donde el tramo de «más de seis horas de retraso» se vacía y el
 * retraso medio baja de 4,24 h a 45 minutos, pagando tres centésimas de sesgo.
 * Apretar más apenas gana frescura y empuja al elegido hacia el borde del
 * centro: a 1 h el |sesgo| medio queda en 0,188, y la frontera con los extremos
 * está en 0,2 (`SPECTRUM_THRESHOLD`). Es decir, una ventana muy corta acabaría
 * titulando con medios que ya no son del centro, que es exactamente lo que esta
 * elección existe para evitar.
 */
const VENTANA_TITULAR_HORAS = 6;

/**
 * El titular que se enseña: el del medio más cercano al centro DE ENTRE LOS
 * QUE CUENTAN EL ESTADO ACTUAL del hecho.
 *
 * Devuelve `null` si no hay ninguno con fecha utilizable, y quien llama cae al
 * ancla. Sin fechas no se puede hablar de reciente, y negarse a titular sería
 * peor que titular como antes.
 *
 * @param {Array<any>} items
 * @returns {any|null}
 */
export function elegirTitularReciente(items, ventanaHoras = VENTANA_TITULAR_HORAS) {
    const lista = Array.isArray(items) ? items : [];
    if (!lista.length) return null;

    const fechados = lista.filter((a) => Number.isFinite(Date.parse(a?.publishedAt ?? '')));
    if (!fechados.length) return null;

    const masNuevo = Math.max(...fechados.map((a) => Date.parse(a.publishedAt)));
    const corte = masNuevo - ventanaHoras * 3_600_000;

    const recientes = fechados.filter((a) => Date.parse(a.publishedAt) >= corte);

    // Entre los recientes, el más cercano al centro. El desempate por fecha
    // importa poco pero evita que el orden de llegada decida.
    return [...recientes].sort((a, b) => {
        const centro = Math.abs(a.outlet.bias) - Math.abs(b.outlet.bias);
        if (centro !== 0) return centro;
        return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    })[0] ?? null;
}

/** Agrupa los artículos ingeridos en historias multifuente. */
function buildMultisourceStories() {
    /*
     * LA OPINIÓN NO ENTRA AQUÍ (2026-08-09). Ver la nota de `opinion` en la
     * construcción del artículo: agrupar columnas con noticias mezcla «quién
     * informó de esto» con «quién opinó de esto». Medido ese día, 105 de 2 749
     * artículos colombianos eran opinión y estaban entrando al agrupamiento.
     *
     * Siguen en `articlesByLink`, así que se guardan y alimentan el índice de
     * columnistas. Lo único que no hacen es formar historias.
     */
    const articles = [...articlesByLink.values()]
        .filter((a) => !a.opinion?.esOpinion)
        .sort((a, b) => {
        const dateA = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const dateB = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        return dateB - dateA;
    });

    const clusters = clusterArticles(
        articles.map((a) => ({ ...a, cleanTitle: a.headline }))
    );

    // Se acumula aparte y se publica al final: si el agrupamiento fallara a
    // medias, `enlacesComparables` conservaría el del ciclo anterior entero en
    // vez de quedarse con la mitad y hacer que la poda expulse lo que no debe.
    const comparablesDeEsteCiclo = new Set();

    /**
     * Cada cuánto aparece cada espectro EN ESTE CORPUS. Hace falta antes de
     * analizar ninguna historia, porque un punto ciego solo se afirma cuando la
     * ausencia es improbable dada esa frecuencia (ver UMBRAL_SORPRESA).
     *
     * Se recalcula en cada ciclo y no se guarda: describe el corpus vivo, y un
     * valor fijo envejecería en silencio hasta afirmar puntos ciegos con la
     * frecuencia de hace meses.
     *
     * Se construye desde los grupos ya formados —una entrada por medio y grupo—
     * y no desde `articlesByLink`, para que un medio que publica cinco notas
     * sobre el mismo hecho cuente una vez. Contarlas cinco daría a los medios de
     * mucho volumen una frecuencia inflada y haría su ausencia artificialmente
     * más sorprendente.
     */
    /*
     * CADA CUÁNTO FALTA CADA ESPECTRO, medido sobre los grupos ya formados.
     *
     * Antes aquí se calculaban las TASAS BASE —cuota de apariciones— porque
     * alimentaban la prueba `(1−q)^n`. Esa prueba se retiró el 2026-08-25: la
     * nula pasó a ser de catálogo y la lee `biasAnalysis` por su cuenta, así
     * que ya no hay nada que acordarse de pasar para que el punto ciego exista.
     *
     * Lo que se mide ahora no decide, describe: acompaña al veredicto con la
     * frecuencia con la que ese espectro falta, para que señalar una historia
     * concreta no se lea como hallazgo cuando es la norma.
     *
     * Se construye desde los grupos ya formados —una entrada por medio y
     * grupo— y no desde `articlesByLink`, para que un medio que publica cinco
     * notas sobre el mismo hecho cuente una vez.
     */
    const tasasDeAusencia = calcularTasasDeAusencia(
        clusters.map((c) => ({
            sources: [...new Map(
                c.articles.map((a) => [a.outlet.name, { bias: a.outlet.bias }])
            ).values()],
        }))
    );

    storiesFeed = clusters.map((cluster) => {
        const items = cluster.articles;

        /**
         * EL ANCLA DEL ID: el medio más cercano al centro, sin mirar la hora.
         *
         * No se toca, y conviene saber por qué: `storyId()` deriva el id del
         * titular de este artículo, y ese id es la URL `/noticia/:id`. Cambiar
         * quién es el ancla renombra la historia, rompe los enlaces que ya
         * circulan y reinicia su `first_seen_at`.
         */
        const representative = [...items].sort(
            (a, b) => Math.abs(a.outlet.bias) - Math.abs(b.outlet.bias)
        )[0];

        /**
         * EL TITULAR QUE SE ENSEÑA, que ya no es el mismo (2026-08-11).
         *
         * Se elegía el del medio más cercano al centro sea cual sea su hora, y
         * en un hecho en desarrollo eso CONGELA el titular: la historia sigue
         * absorbiendo artículos con datos nuevos mientras su titular repite lo
         * que dijo ese medio la primera vez. Jose lo vio en el terremoto del
         * Chocó —la portada decía «71 muertos» cuando las piezas de esa misma
         * historia ya iban por 111— y no era un caso aislado: medido sobre 528
         * historias multifuente, el 40 % llevaba un titular más de una hora más
         * viejo que su artículo más nuevo, el 18 % más de seis horas y la peor
         * acumulaba 58,8 horas de desfase.
         *
         * Ahora se elige el más cercano al centro DE ENTRE LOS RECIENTES. El
         * principio no cambia —sigue sin adoptarse el encuadre de un extremo—;
         * lo que cambia es que el centro se busca entre los que cuentan el
         * estado actual del hecho y no entre todos los que lo contaron alguna
         * vez.
         *
         * DESACOPLADO DEL ID a propósito. Si el titular arrastrara el id, cada
         * actualización renombraría la historia. El id sigue anclado arriba; lo
         * que se mueve es solo lo que lee el visitante.
         */
        const titular = elegirTitularReciente(items) ?? representative;

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
        const coverage = analyzeCoverage(sources, tasasDeAusencia);

        /**
         * Se anota qué artículos encontraron pareja, para que la poda del ciclo
         * siguiente sepa a quién NO expulsar. Se anotan todos los del grupo, no
         * solo el representativo de cada medio: el artículo que no se eligió
         * como representativo sigue siendo parte de la comparación y expulsarlo
         * rompería la historia desde abajo.
         */
        if (outletsByName.size >= 2) {
            for (const item of items) comparablesDeEsteCiclo.add(item.link);
        }

        /**
         * Sin fecha del medio se usa la de ingesta, igual que hace pruneArticles.
         *
         * No es un detalle: el feed ordena por `published_at DESC NULLS LAST`, así
         * que una historia sin fecha no queda «sin ordenar», queda LA ÚLTIMA de su
         * grupo. Antes solo pasaba con feeds que no fechan; desde que se descartan
         * las fechas futuras pasaría también con ellas, y arreglar que una noticia
         * encabezara la portada indebidamente para hundirla al fondo no sería
         * arreglarla. El momento en que la vimos es peor dato que el del medio,
         * pero es un dato real y aproxima bien la actualidad.
         */
        const publishedDates = items
            .map((a) => (a.publishedAt ? Date.parse(a.publishedAt) : a.ingestedAtMs))
            .filter((d) => Number.isFinite(d));

        /**
         * El ámbito por MAYORÍA, no por el representante.
         *
         * El artículo representativo es el del medio de mayor factualidad, y esa
         * elección no tiene nada que ver con si el hecho es colombiano. Con el
         * empate a favor de lo nacional, por lo mismo que dentro del
         * clasificador: «Petro se reunió con Lula» es una noticia colombiana con
         * contexto exterior.
         *
         * Se saca del literal porque el departamento lo necesita.
         */
        const ambito =
            items.filter((a) => a.ambito === 'internacional').length > items.length / 2
                ? 'internacional'
                : 'nacional';

        return {
            id: storyId(representative.headline),
            // Todo lo que se ENSEÑA viene del titular reciente; el `id` de
            // arriba sigue viniendo del ancla. Ver la nota de las dos
            // elecciones.
            title: titular.headline,
            titleOutlet: titular.outlet.name,
            // El id, además del nombre: es la clave foránea hacia `sources`.
            titleOutletId: titular.outlet.id ?? null,
            titleUrl: titular.link,
            category: titular.category,

            /**
             * UNIÓN de los temas de los artículos, no intersección.
             *
             * Si El Tiempo titula por el lado sanitario y Semana por el
             * político, la historia es las dos cosas. Quedarse con lo que
             * ambos comparten borraría justo la diferencia de encuadre que
             * este sitio existe para enseñar, y además dejaría sin tema a casi
             * cualquier historia multifuente: basta un medio que no clasifique
             * para vaciar la intersección.
             */
            topics: [...new Set(items.flatMap((a) => a.topics ?? []))],

            ambito,

            /**
             * De qué departamento habla. Se calcula AQUÍ y se guarda desde el
             * 2026-08-11; antes lo hacía el navegador sobre lo descargado, así
             * que los conteos del mapa eran de las historias cargadas y crecían
             * al pulsar «cargar más». Un número que cambia según cuánto hayas
             * bajado no se puede leer.
             *
             * SOLO EL TITULAR DE LA HISTORIA, no los de cada medio. Es la misma
             * decisión que tomaba el cálculo en el navegador y se conserva al
             * moverlo: ocho titulares podrían nombrar tres departamentos y
             * habría que elegir por votación — más recall a cambio de una
             * etiqueta que ya no se justifica leyendo una sola frase.
             *
             * Lo internacional no se etiqueta. «Santander» es un departamento
             * colombiano y también un banco y una ciudad española; sin este
             * corte, la portada de un medio español mandaría noticias a
             * Bucaramanga.
             */
            departamento:
                ambito === 'internacional'
                    ? null
                    : detectarDepartamento(representative.headline).departamento,

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
            /*
             * LOS DOS CAMPOS, Y HAY QUE ENUMERAR LOS DOS.
             *
             * `blindspot` afirma que una ausencia sorprende; `ausencia` solo
             * dice que ese lado no está. Esta lista es a mano, así que un campo
             * que no se escriba aquí NO llega al cliente y no da ningún error:
             * llega `undefined`, el filtro cuenta cero y la función desaparece
             * en silencio.
             *
             * Pasó el 2026-08-25 con `ausencia`, recién estrenada: estaba
             * calculada, probada y trasplantada en el cliente, y aun así el
             * sitio la enseñaba vacía porque estas dos listas —esta y la de
             * `feedStore`— no la nombraban. La prueba de contrato de
             * `contentStore.test.js` existe para que no vuelva a pasar.
             */
            blindspot: coverage.blindspot,
            ausencia: coverage.ausencia,

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

    // Medios distintos con vida media de 24 h, la misma fórmula que usa la base
    // en su ORDER BY. Antes la fecha solo desempataba, y eso dejaba historias de
    // hace dos días por delante de las del día. Ver `shared/relevancia.js`.
    storiesFeed.sort(porRelevancia());

    storiesById = new Map(storiesFeed.map((s) => [s.id, s]));

    // Ya está completo: se publica de una vez para la poda del ciclo siguiente.
    enlacesComparables = comparablesDeEsteCiclo;
}

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

/**
 * Refresca la lista de historias retiradas. Nunca lanza: si la base no
 * responde, se conserva la última lista conocida en vez de dejar de ocultar lo
 * que ya estaba retirado.
 */
export async function refreshModeration() {
    if (!isDatabaseEnabled()) return 0;

    try {
        rejected = await rejectedStoryIds();
    } catch (error) {
        console.warn(`[moderación] no se pudo refrescar la lista de retiradas: ${error.message}`);
    }

    return rejected.size;
}

/** Feed público: sin las historias retiradas por el equipo editorial. */
export const getLatestFeed = () => storiesFeed.filter((s) => !rejected.has(s.id));

export const getStoryById = (id) => (rejected.has(id) ? null : storiesById.get(id) ?? null);

/** Cuántas historias está ocultando la moderación ahora mismo. */
export const getRejectedCount = () => rejected.size;

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
