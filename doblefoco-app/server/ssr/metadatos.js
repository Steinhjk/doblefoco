// @ts-check
/**
 * METADATOS DE UNA NOTICIA PARA EL HTML RENDERIZADO (F3-02)
 *
 * Vive aparte de index.js por una razón concreta: para poder probarlo. La
 * versión anterior de esta lógica estaba incrustada en la ruta, y su única
 * prueba comprobaba que index.html contiene la cadena "<title>" —algo cierto
 * desde enero y que no toca este código.
 *
 * TODO LO QUE SALE DE AQUÍ VIENE DE TERCEROS. Los titulares los publican 34
 * medios sobre los que no tenemos control ninguno, y acaban dentro de atributos
 * HTML. Sin escapar, una comilla doble en un titular —cosa corriente en
 * español, que cita mucho— parte el atributo y produce HTML roto; y un titular
 * construido a propósito con `"><script>` inyectaría código en nuestro dominio.
 * No es un riesgo teórico: es la superficie más obvia que tiene este proyecto.
 */

/**
 * Escapa texto para meterlo dentro de un atributo HTML entre comillas dobles.
 *
 * Se escapan también `<` y `>` aunque dentro de un atributo no sean
 * ejecutables: si el valor se moviera algún día fuera del atributo, seguiría
 * siendo seguro. Es más barato escapar de más que auditar cada uso.
 *
 * @param {unknown} valor
 * @returns {string}
 */
export function escaparHtml(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Serializa un objeto para incrustarlo dentro de una etiqueta <script>.
 *
 * El peligro no es el JSON: es la secuencia `</script>`. Un titular que la
 * contenga cerraría la etiqueta antes de tiempo y lo que siguiera se
 * interpretaría como HTML. Escapar `<` como < lo impide sin alterar el
 * valor: JSON.parse devuelve exactamente la misma cadena.
 *
 * @param {any} datos
 * @returns {string}
 */
export function serializarParaScript(datos) {
    return JSON.stringify(datos).replace(/</g, '\\u003c');
}

/**
 * Reparto de cobertura por espectro.
 *
 * SE LEE DE `story.coverage`, que ya viene calculado por el clasificador único
 * de F1-04, en lugar de recalcularlo aquí con umbrales propios. Tener dos
 * definiciones del sesgo es exactamente lo que F1-04 existe para impedir: el
 * día que una revisión editorial mueva un medio de banda (F1-13), la página
 * mostraría una cifra y su propia etiqueta de Open Graph, otra.
 *
 * @param {any} story
 */
function repartoDeCobertura(story) {
    const cobertura = story?.coverage ?? {};
    const izquierda = Number(cobertura.left ?? 0);
    const centro = Number(cobertura.center ?? 0);
    const derecha = Number(cobertura.right ?? 0);
    return { izquierda, centro, derecha, total: izquierda + centro + derecha };
}

/**
 * La descripción que verán Google y las tarjetas al compartir.
 *
 * DESCRIBE LA COBERTURA, NO RESUME LA NOTICIA, y la distinción es el principio
 * rector del proyecto: resumir el hecho sería producir texto sobre algo que no
 * hemos verificado. El reparto entre espectros sí es un dato nuestro, medido, y
 * además es el producto — es la razón por la que alguien usaría DobleFoco en
 * vez de ir directo a un periódico.
 *
 * @param {any} story
 */
export function describirCobertura(story) {
    const { izquierda, centro, derecha, total } = repartoDeCobertura(story);

    if (total === 0) {
        return 'Cobertura periodística contrastada de la actualidad colombiana en DobleFoco.co.';
    }

    const medios = total === 1 ? '1 medio cubre' : `${total} medios cubren`;
    return (
        `${medios} este hecho: ${izquierda} de izquierda, ${centro} de centro, ` +
        `${derecha} de derecha. Compara las coberturas en DobleFoco.co.`
    );
}

/**
 * Etiquetas de <head> para una historia.
 *
 * @param {any} story
 * @param {string} siteUrl - Dominio PÚBLICO del sitio, nunca el de la API.
 * @returns {string}
 */
export function construirMetadatos(story, siteUrl) {
    const base = String(siteUrl).replace(/\/+$/, '');
    const canonica = `${base}/noticia/${encodeURIComponent(story.id)}`;
    const imagen = `${base}/og-image.png`;
    const titulo = `${story.title} · DobleFoco.co`;
    const descripcion = describirCobertura(story);
    const publicado = story.publishedAt ?? story.firstSeenAt ?? null;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: story.title,
        description: descripcion,
        mainEntityOfPage: canonica,
        url: canonica,
        ...(publicado ? { datePublished: publicado } : {}),
        publisher: {
            '@type': 'Organization',
            name: 'DobleFoco.co',
            url: base,
            logo: { '@type': 'ImageObject', url: imagen },
        },
        // Los medios que cubren el hecho, con su URL original. Es la forma
        // estándar de decir «esto no lo escribimos nosotros, lo agregamos».
        citation: Array.isArray(story.sources)
            ? story.sources.filter((f) => f?.url).map((f) => ({
                '@type': 'CreativeWork',
                name: f.name ?? undefined,
                url: f.url,
            }))
            : [],
    };

    const t = escaparHtml(titulo);
    const d = escaparHtml(descripcion);
    const c = escaparHtml(canonica);
    const i = escaparHtml(imagen);

    return [
        `<title>${t}</title>`,
        `<meta name="description" content="${d}" />`,
        `<link rel="canonical" href="${c}" />`,
        `<meta property="og:type" content="article" />`,
        `<meta property="og:title" content="${t}" />`,
        `<meta property="og:description" content="${d}" />`,
        `<meta property="og:url" content="${c}" />`,
        `<meta property="og:image" content="${i}" />`,
        `<meta property="og:site_name" content="DobleFoco.co" />`,
        `<meta property="og:locale" content="es_CO" />`,
        ...(publicado
            ? [`<meta property="article:published_time" content="${escaparHtml(publicado)}" />`]
            : []),
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${t}" />`,
        `<meta name="twitter:description" content="${d}" />`,
        `<meta name="twitter:image" content="${i}" />`,
        `<script type="application/ld+json">${serializarParaScript(jsonLd)}</script>`,
    ].join('\n    ');
}

/**
 * Quita del <head> las etiquetas genéricas que index.html trae de fábrica.
 *
 * SIN ESTO LA PÁGINA ACABA CON DOS DE CADA UNA. index.html declara su propio
 * title, description, og:* y twitter:*, pensados para la portada. Añadir las de
 * la noticia sin retirar aquellas deja duplicados, y ante og:title repetido
 * cada red social elige por su cuenta cuál usar: la tarjeta al compartir sale
 * unas veces con el titular y otras con el texto genérico del sitio, sin
 * patrón aparente y sin que nada falle.
 *
 * @param {string} plantilla
 * @returns {string}
 */
export function limpiarMetadatosGenericos(plantilla) {
    return plantilla
        .replace(/<title>[\s\S]*?<\/title>/i, '')
        .replace(/<meta\s+name=["']description["'][^>]*>/gi, '')
        .replace(/<meta\s+property=["']og:[^"']*["'][^>]*>/gi, '')
        .replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, '')
        .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '');
}

/**
 * Monta el HTML final: plantilla + árbol renderizado + metadatos + datos.
 *
 * @param {object} opciones
 * @param {string} opciones.plantilla - dist/index.html tal cual
 * @param {string} opciones.html - el árbol de React ya renderizado
 * @param {string} opciones.metadatos - lo que devuelve construirMetadatos
 * @param {any} opciones.datos - lo que el cliente no tendrá que volver a pedir
 * @returns {string}
 */
export function montarPagina({ plantilla, html, metadatos, datos }) {
    const guion =
        `<script type="application/json" id="datos-iniciales">` +
        `${serializarParaScript(datos)}</script>`;

    const limpia = limpiarMetadatosGenericos(plantilla);

    if (!limpia.includes('</head>') || !limpia.includes('<div id="root"></div>')) {
        throw new Error(
            'dist/index.html no tiene la forma esperada (falta </head> o #root vacío)'
        );
    }

    return limpia
        .replace('</head>', `  ${metadatos}\n  </head>`)
        .replace('<div id="root"></div>', `<div id="root">${html}</div>\n    ${guion}`);
}
