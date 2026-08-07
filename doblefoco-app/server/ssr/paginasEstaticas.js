// @ts-check
/**
 * RENDERIZADO EN SERVIDOR DE LAS PÁGINAS QUE NO DEPENDEN DE LA BASE
 *
 * QUÉ PROBLEMA RESUELVE. Hasta ahora solo `/noticia/:id` se renderizaba en el
 * servidor. Todo lo demás lo servía Vercel como la plantilla vacía de la SPA:
 * 2 300 bytes con un `<div id="root">` sin nada dentro. Medido el 2026-08-06
 * contra el sitio publicado, `/`, `/categorias`, `/mapa-medios` y
 * `/transparencia` devolvían exactamente eso.
 *
 * Para una persona da igual: su navegador ejecuta el JavaScript y la página
 * aparece. Para un rastreador no. Google ejecuta JavaScript, con retraso y de
 * forma incompleta; Bing y Yandex mucho menos; y los rastreadores de las IA
 * —que ya son una vía real de descubrimiento— no lo ejecutan en absoluto. Lo
 * que veían todos ellos era un título genérico y ninguna palabra del contenido.
 *
 * POR QUÉ ESTAS TRES Y NO TODAS. Estas se construyen enteras desde
 * `shared/mediaRegistry.js` y `shared/mediaOwnership.js`, que viajan dentro del
 * propio código: no piden nada a la base ni a la red, así que `render(url)` las
 * produce completas sin pasarles ningún dato. `/`, `/categorias` y
 * `/tendencias` necesitan las historias, y eso pide precargarlas y pasarlas por
 * `DatosInicialesContext` como hace la ruta de noticia; es más trabajo y va
 * aparte.
 *
 * Y son, además, las que más se juegan en un buscador: contienen lo único que
 * este proyecto publica y nadie más tiene reunido —la propiedad de los medios
 * colombianos, con fuentes—, mientras que la portada compite por titulares que
 * ya publicaron otros.
 *
 * LAS CIFRAS NO SE ESCRIBEN A MANO. La descripción del mapa dice cuántos medios
 * hay y de cuántos está documentada la propiedad, y los dos números salen del
 * registro en cada arranque. Escritos a mano envejecerían en silencio: dirían
 * 43 el día que sean 47, y una descripción que miente sobre el propio contenido
 * es peor que una genérica.
 */

import { MEDIA_REGISTRY } from '../../shared/mediaRegistry.js';
import { hasDocumentedOwnership } from '../../shared/mediaOwnership.js';
import { escaparHtml } from './metadatos.js';

/**
 * Los medios que la página describe: solo los colombianos.
 *
 * Tiene que coincidir con lo que MediaMap.jsx pinta desde el 2026-08-07, o la
 * descripción del buscador prometería un número de medios que la página no
 * enseña. Ese desajuste es de los que nadie nota hasta que alguien cuenta.
 */
const COLOMBIANOS = MEDIA_REGISTRY.filter((medio) => medio.country === 'CO');

/** Medios con propiedad documentada, contados del registro y no a mano. */
function contarDocumentados() {
    return COLOMBIANOS.filter((medio) => hasDocumentedOwnership(medio.id)).length;
}

/**
 * Las páginas que este módulo sabe renderizar, con su ficha para el buscador.
 *
 * `descripcion` se escribe pensando en lo que aparece bajo el título en los
 * resultados: dice qué hay en la página, no qué queremos que la gente sienta.
 * Un texto promocional ahí lo reescribe el buscador por su cuenta.
 */
export const PAGINAS_ESTATICAS = {
    '/mapa-medios': {
        titulo: () => 'Mapa mediático de Colombia: quién es dueño de cada medio',
        descripcion: () =>
            `Quién controla los ${COLOMBIANOS.length} medios colombianos que seguimos: ` +
            `propiedad documentada con fuentes en ${contarDocumentados()} de ellos, ` +
            'grupos económicos y posición en el espectro político.',
        tipoSchema: 'CollectionPage',
    },
    '/transparencia': {
        titulo: () => 'Transparencia: cómo clasificamos el sesgo y de dónde sale el dinero',
        descripcion: () =>
            'Para qué existe DobleFoco, qué significan izquierda y derecha en nuestra ' +
            'escala, cómo se financia el proyecto, qué hacemos con sus datos y qué ' +
            'todavía no funciona.',
        tipoSchema: 'WebPage',
    },
    '/sobre-nosotros': {
        titulo: () => 'Sobre DobleFoco.co: comparar cómo cubre cada medio la misma noticia',
        descripcion: () =>
            'Qué hace DobleFoco, cómo agrupa una misma noticia entre varios medios y ' +
            'con qué metodología sitúa a cada uno en el espectro político colombiano.',
        tipoSchema: 'AboutPage',
    },
};

/**
 * Las rutas, para registrarlas en Express.
 *
 * NO se llama RUTAS_ESTATICAS: ese nombre ya existe en index.js y es otra cosa
 * —la lista de rutas fijas del sitemap, que incluye la portada y las que aquí
 * no se renderizan—. Dos listas parecidas con el mismo nombre serían una
 * confusión garantizada el día que una de las dos cambie.
 */
export const RUTAS_RENDERIZADAS = Object.keys(PAGINAS_ESTATICAS);

/**
 * Construye el bloque de metadatos que se inyecta en el `<head>`.
 *
 * Mismo contrato que `construirMetadatos` para las noticias: devuelve una
 * cadena de etiquetas ya escapadas, lista para `montarPagina`.
 *
 * @param {string} ruta - una de RUTAS_ESTATICAS
 * @param {string} siteUrl
 * @returns {string}
 */
export function metadatosDePagina(ruta, siteUrl) {
    const ficha = PAGINAS_ESTATICAS[ruta];
    if (!ficha) throw new Error(`No hay ficha para la ruta ${ruta}`);

    const base = String(siteUrl).replace(/\/+$/, '');
    const canonica = `${base}${ruta}`;
    const imagen = `${base}/og-image.png`;
    const titulo = `${ficha.titulo()} · DobleFoco.co`;
    const descripcion = ficha.descripcion();

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': ficha.tipoSchema,
        name: ficha.titulo(),
        description: descripcion,
        url: canonica,
        mainEntityOfPage: canonica,
        isPartOf: {
            '@type': 'WebSite',
            name: 'DobleFoco.co',
            url: base,
        },
        publisher: {
            '@type': 'Organization',
            name: 'DobleFoco.co',
            url: base,
            logo: { '@type': 'ImageObject', url: imagen },
        },
    };

    const t = escaparHtml(titulo);
    const d = escaparHtml(descripcion);
    const c = escaparHtml(canonica);
    const i = escaparHtml(imagen);

    return [
        `<title>${t}</title>`,
        `<meta name="description" content="${d}" />`,
        `<link rel="canonical" href="${c}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:title" content="${t}" />`,
        `<meta property="og:description" content="${d}" />`,
        `<meta property="og:url" content="${c}" />`,
        `<meta property="og:image" content="${i}" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${t}" />`,
        `<meta name="twitter:description" content="${d}" />`,
        // Sin escapar: es JSON dentro de un <script>, no un atributo, y
        // `serializarParaScript` no aplica porque aquí no entra texto de
        // terceros — todo lo de arriba lo escribimos nosotros o sale de contar
        // el registro. Aun así se neutraliza `<` por si eso cambiara.
        `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
    ].join('\n    ');
}
