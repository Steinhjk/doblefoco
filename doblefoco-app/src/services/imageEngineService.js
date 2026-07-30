/**
 * LA IMAGEN DE UNA NOTICIA ES LA QUE PUBLICÓ EL MEDIO, O NO HAY IMAGEN.
 *
 * QUÉ HABÍA AQUÍ ANTES, porque explica por qué esto es tan corto ahora. Un
 * «motor de gestión de imágenes» con un banco de 21 fotos de archivo de Unsplash
 * y esta lógica:
 *
 *     const seedIndex = hashString(`${article.id}-${article.title}`);
 *     return EXPANDED_PHOTO_GALLERY[seedIndex % EXPANDED_PHOTO_GALLERY.length];
 *
 * Tres cosas estaban mal, y ninguna era visible leyendo los comentarios:
 *
 *   1. El comentario decía «genera una URL de búsqueda contextual basada en las
 *      palabras clave del titular». No analizaba ninguna palabra: era un hash
 *      módulo 21, es decir, una foto al azar estable. «Condenan a Carlos Caicedo
 *      a cerca de 10 años de cárcel por corrupción» salía con la foto que el
 *      propio archivo etiquetaba «Indicadores Económicos».
 *
 *   2. La rama que priorizaba la imagen real del artículo NUNCA se ejecutaba: no
 *      había columna de imagen en la base ni extracción en el motor de ingesta,
 *      así que `article.image` no existía en ningún caso. Era código muerto que
 *      hacía parecer que el sistema usaba imágenes reales.
 *
 *   3. Cada tarjeta cargaba desde images.unsplash.com. Es el mismo problema de
 *      privacidad que ya se había arreglado con los logos de los medios: cada
 *      petición a un tercero revela QUÉ está leyendo esa persona, y en un sitio
 *      sobre pluralismo informativo eso dice bastante.
 *
 * Una imagen junto a un titular se lee como documental. Poner ahí una que no lo
 * es era la misma fabricación que la Fase 0 eliminó del texto, sobreviviendo en
 * el apartado visual. Ahora la imagen sale de `story.image`, que el motor extrae
 * del RSS del propio medio (media:content, media:thumbnail o enclosure) y que es
 * null la mayoría de las veces. Cuando es null, no se pinta nada.
 */

/**
 * Imagen real de la historia, o `null`.
 *
 * @param {{image?: {url: string, outlet?: string, outletId?: string}|null}|null|undefined} story
 * @returns {{url: string, outlet: string|null, outletId: string|null}|null}
 */
export function getStoryImage(story) {
    const url = story?.image?.url;
    if (typeof url !== 'string' || !url.startsWith('https://')) return null;

    return {
        url,
        // El medio va con la foto para poder acreditarla. Mostrar la imagen de un
        // medio bajo el titular de otro sin decirlo es atribuir material ajeno.
        outlet: story.image?.outlet ?? null,
        outletId: story.image?.outletId ?? null,
    };
}

/**
 * ¿Tiene esta historia una imagen que mostrar?
 *
 * Lo preguntan las pantallas ANTES de decidir el layout, no después: sin imagen
 * la tarjeta no deja la columna vacía, el texto ocupa el ancho entero. Como la
 * mayoría de los feeds no traen foto, ese es el caso normal y no el borde.
 */
export const tieneImagen = (story) => getStoryImage(story) !== null;
