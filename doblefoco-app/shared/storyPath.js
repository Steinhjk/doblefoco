// @ts-check
/**
 * RUTAS LEGIBLES PARA LAS NOTICIAS
 *
 * Antes: /noticia/story_12flvrc
 * Ahora: /noticia/camara-aprueba-la-posesion-12flvrc
 *
 * POR QUÉ, y no es solo estética:
 *   · `story_12flvrc` parece el identificador de algo turbio. Un enlace que no
 *     dice nada de su contenido se comparte menos, y en WhatsApp o Telegram
 *     —donde a menudo no hay previsualización— es lo único que se ve.
 *   · Las palabras de la URL son señal de relevancia para los buscadores.
 *     Modesta, pero real, y en un agregador donde el SEO es EL canal de
 *     adquisición no se desprecia.
 *   · «story» era la única palabra en inglés que veía un lector.
 *
 * EL IDENTIFICADOR SIGUE EN LA URL, y esto no es negociable. Con solo el titular
 * pasarían dos cosas malas: dos noticias parecidas colisionarían, y —peor— al
 * cambiar el titular representativo del grupo cambiaría la URL, perdiendo todo
 * lo ya indexado. El id manda en la búsqueda; el titular es decoración legible.
 *
 * SE QUITA EL PREFIJO `story_` DE LA URL PERO NO DE LA BASE. Comprobado sobre
 * las 3 397 historias: sin el prefijo no hay ni una colisión, así que la URL
 * puede prescindir de él. Migrar los ids en la base sería otra cosa —arrastraría
 * story_articles y moderation— y no aporta nada: el identificador es asunto del
 * almacenamiento, la URL lo es de quien la lee.
 */

const PREFIJO = 'story_';

/** Tope del titular en la URL. Más allá no aporta y estorba al compartir. */
const MAX_SLUG = 60;

/**
 * Convierte un titular en texto apto para una URL.
 *
 * @param {string} titulo
 * @returns {string}
 */
export function slugify(titulo) {
    const base = String(titulo ?? '')
        .normalize('NFD')
        // Quita diacríticos: «Cámara» → «camara». Sin esto la URL se codifica en
        // porcentajes y vuelve a ser ilegible, que es justo lo que se evita.
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        // La ñ no es una n con tilde en Unicode compuesto, así que va aparte.
        .replace(/ñ/g, 'n')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    if (base.length <= MAX_SLUG) return base;

    // Se corta en la última palabra completa: partir una palabra por la mitad
    // se lee como un enlace truncado o roto.
    const cortado = base.slice(0, MAX_SLUG);
    const ultimoGuion = cortado.lastIndexOf('-');
    return (ultimoGuion > MAX_SLUG / 2 ? cortado.slice(0, ultimoGuion) : cortado)
        .replace(/-+$/g, '');
}

/** El id sin el prefijo, que es lo que va en la URL. */
export function idCorto(id) {
    return String(id ?? '').replace(new RegExp(`^${PREFIJO}`), '');
}

/**
 * Ruta canónica de una historia. Es LA dirección: cualquier otra redirige aquí.
 *
 * @param {{id: string, title?: string|null}} story
 * @returns {string}
 */
export function rutaDeHistoria(story) {
    const corto = idCorto(story?.id);
    if (!corto) return '/';

    const slug = slugify(story?.title ?? '');
    return slug ? `/noticia/${slug}-${corto}` : `/noticia/${corto}`;
}

/**
 * Saca el id de la base a partir de lo que venga en la URL.
 *
 * Acepta las tres formas que pueden llegar:
 *   camara-aprueba-12flvrc  →  story_12flvrc   (canónica)
 *   12flvrc                 →  story_12flvrc   (sin titular)
 *   story_12flvrc           →  story_12flvrc   (la antigua, ya indexada)
 *
 * El id es el ÚLTIMO segmento. Puede confundirse con una palabra del titular
 * —«camara-aprueba» leería «aprueba» como id—, y se acepta a propósito: la
 * consulta a la base no encontrará nada y la ruta responderá 404, que es lo
 * correcto para una URL inventada. Validar por forma sería adivinar; validar
 * contra la base es saber.
 *
 * @param {string} parametro
 * @returns {string} id para buscar en la base
 */
export function idDesdeRuta(parametro) {
    const bruto = String(parametro ?? '').trim();
    if (!bruto) return '';

    if (bruto.startsWith(PREFIJO)) return bruto;

    const ultimo = bruto.split('-').filter(Boolean).pop() ?? '';
    return ultimo ? `${PREFIJO}${ultimo}` : '';
}

/**
 * ¿La URL que pidieron ya es la canónica?
 *
 * Se usa para decidir si redirigir con 301. Importa para el SEO: dos direcciones
 * que sirven la misma página se penalizan como contenido duplicado, y las 2 636
 * URLs del sitemap salieron publicadas con el formato antiguo.
 *
 * @param {string} parametro - lo que llegó en la URL
 * @param {{id: string, title?: string|null}} story
 */
export function esRutaCanonica(parametro, story) {
    return `/noticia/${parametro}` === rutaDeHistoria(story);
}
