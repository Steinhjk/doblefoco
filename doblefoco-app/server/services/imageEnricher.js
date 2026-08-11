// @ts-check
/**
 * LA IMAGEN QUE EL MEDIO DESIGNÓ PARA COMPARTIR SU PIEZA.
 *
 * POR QUÉ EXISTE. De los 33 feeds del catálogo, 18 no publican imagen en su RSS
 * de ninguna forma —ni `media:content`, ni `enclosure`, ni una `<img>` en el
 * cuerpo—. La República, Euronews, Caracol Radio, DW y KienyKe suman cientos de
 * artículos y ninguno tenía foto. Con solo el RSS, la portada se quedaba en 27
 * historias con imagen de cada 100 y no había forma de subir de ahí.
 *
 * QUÉ SE LEE, Y POR QUÉ ESTO NO ES RASPADO. Únicamente la etiqueta `og:image`
 * del `<head>`. Esa etiqueta existe precisamente para que un tercero muestre una
 * previsualización de la pieza: es lo que usan WhatsApp, X y Telegram cuando
 * alguien pega el enlace. Usarla para exactamente eso es su función declarada,
 * no un desvío. No se lee el cuerpo del artículo, no se guarda su texto y no se
 * toca nada más de la página.
 *
 * MEDIDO ANTES DE CONSTRUIRLO, sobre 30 artículos reales de los medios sin
 * imagen: 27 tenían og:image (90 %), con una mediana de 47 kB leídos por página
 * porque la lectura se corta en `</head>`.
 *
 * LOS LÍMITES SON PARTE DEL DISEÑO, no una precaución añadida. Este proyecto se
 * presenta ante esos medios con un User-Agent propio y una URL de transparencia,
 * y uno de ellos ya nos responde 403. Por eso:
 *   · un tope por ciclo, para que la carga sea predecible;
 *   · concurrencia baja y separación por dominio, para no ráfagas contra nadie;
 *   · la lectura se aborta en cuanto aparece `</head>` o al superar el tope de
 *     bytes: no se descarga el artículo entero;
 *   · CADA artículo se consulta UNA vez en su vida, gracias a `image_checked_at`.
 *     Sin esa marca, cada ciclo repetiría las mismas miles de peticiones.
 */

import { articulosSinImagen, guardarImagenesEnriquecidas } from '../db/contentStore.js';
import { getIngestFeeds } from '../../shared/mediaRegistry.js';
import { urlDeImagenValida } from './ingestDaemon.js';

import { USER_AGENT } from '../../shared/userAgent.js';

/** Tope de artículos por ciclo. Con ~100 nuevos por ciclo, esto además desatasca. */
const POR_CICLO = 150;

/** Peticiones simultáneas. Baja a propósito: son servidores de otros. */
const CONCURRENCIA = 4;

/** Separación mínima entre dos peticiones al MISMO dominio. */
const PAUSA_POR_DOMINIO_MS = 400;

/** Nunca se leen más bytes que esto de una página, aunque no aparezca </head>. */
const MAX_BYTES = 150_000;

const TIMEOUT_MS = 10_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * og:image, o twitter:image como respaldo. Los dos órdenes de atributos, porque
 * no todos los gestores de contenido los emiten igual.
 */
function extraerOgImage(html) {
    const patrones = [
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
        /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ];

    for (const patron of patrones) {
        const m = html.match(patron);
        if (m?.[1]) return m[1];
    }

    return null;
}

/**
 * Descarga solo la cabecera de una página y devuelve su og:image sin validar.
 *
 * `fetchImpl` se inyecta para poder probar esto sin red. Va tipado como una
 * función que devuelve algo con `ok` y `body`, y no como el `Response` completo:
 * lo que aquí se usa son esas dos cosas, y exigir un Response de verdad obligaría
 * a las pruebas a fabricar quince propiedades que no intervienen en nada.
 *
 * @param {string} url
 * @param {{fetchImpl?: (url: string, opciones?: any) => Promise<any>}} [opciones]
 * @returns {Promise<string|null>}
 */
export async function leerOgImage(url, { fetchImpl = fetch } = {}) {
    const respuesta = await fetchImpl(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'follow',
    });

    if (!respuesta.ok || !respuesta.body) return null;

    const lector = respuesta.body.getReader();
    const decodificador = new TextDecoder();
    let html = '';

    try {
        while (html.length < MAX_BYTES) {
            const { done, value } = await lector.read();
            if (done) break;
            html += decodificador.decode(value, { stream: true });
            // Todo lo que interesa está en el <head>. Seguir leyendo sería
            // descargarle el artículo entero a un servidor ajeno para nada.
            if (html.includes('</head>')) break;
        }
    } finally {
        lector.cancel().catch(() => {});
    }

    const bruta = extraerOgImage(html);
    if (!bruta) return null;

    // Alguna og:image viene relativa. Se resuelve contra la propia página.
    try {
        return new URL(bruta, url).toString();
    } catch {
        return null;
    }
}

/**
 * Busca imagen en la página de los artículos que no la tienen.
 *
 * NUNCA LANZA: un fallo aquí no puede tumbar el ciclo de ingesta, que ya cumplió
 * su función antes de llegar a esto. Un artículo que falle queda marcado igual y
 * no se reintenta: preferimos una foto de menos a repetir peticiones a terceros.
 *
 * @returns {Promise<{mirados: number, conImagen: number}>}
 */
export async function enriquecerImagenes(
    /** @type {{limit?: number, fetchImpl?: (url: string, opciones?: any) => Promise<any>}} */
    { limit = POR_CICLO, fetchImpl = fetch } = {}
) {
    let candidatos = [];

    try {
        candidatos = await articulosSinImagen({ limit });
    } catch {
        return { mirados: 0, conImagen: 0 };
    }

    if (!candidatos.length) return { mirados: 0, conImagen: 0 };

    // Dominio e `imageHosts` por medio, para validar con la MISMA regla que usa
    // la extracción desde el RSS.
    const porMedio = new Map();
    for (const feed of getIngestFeeds()) {
        if (!porMedio.has(feed.mediaId)) {
            porMedio.set(feed.mediaId, {
                dominio: String(feed.domain).replace(/^www\./, ''),
                imageHosts: feed.imageHosts ?? [],
            });
        }
    }

    const ultimaPeticion = new Map();
    const resultados = [];

    const trabajador = async (cola) => {
        for (const articulo of cola) {
            const medio = porMedio.get(articulo.sourceId);
            if (!medio) {
                resultados.push({ id: articulo.id, imageUrl: null });
                continue;
            }

            // Separación por dominio: nada de ráfagas contra un mismo servidor.
            const espera = (ultimaPeticion.get(medio.dominio) ?? 0) + PAUSA_POR_DOMINIO_MS - Date.now();
            if (espera > 0) await sleep(espera);
            ultimaPeticion.set(medio.dominio, Date.now());

            let imagen = null;
            try {
                const bruta = await leerOgImage(articulo.url, { fetchImpl });
                if (bruta) {
                    imagen = urlDeImagenValida(bruta, medio.dominio, medio.imageHosts);
                }
            } catch {
                // Se marca igual. Reintentar indefinidamente sería peor.
            }

            resultados.push({ id: articulo.id, imageUrl: imagen });
        }
    };

    // Reparto en tantas colas como concurrencia, en vez de un pool: mantiene
    // juntos los artículos del mismo medio y hace efectiva la pausa por dominio.
    const colas = Array.from({ length: CONCURRENCIA }, () => []);
    candidatos.forEach((a, i) => colas[i % CONCURRENCIA].push(a));
    await Promise.all(colas.map(trabajador));

    let conImagen = 0;
    try {
        conImagen = await guardarImagenesEnriquecidas(resultados);
    } catch {
        return { mirados: resultados.length, conImagen: 0 };
    }

    return { mirados: resultados.length, conImagen };
}
