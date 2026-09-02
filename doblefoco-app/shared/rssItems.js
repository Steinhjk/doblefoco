// @ts-check
/**
 * LO QUE HAY QUE PEDIRLE A UN ÍTEM DE RSS, EN UN SOLO SITIO.
 *
 * POR QUÉ EXISTE (2026-09-02). Tres archivos construían su propio `new Parser`
 * repitiendo la misma lista de `customFields` a mano —el motor de ingesta, la
 * auditoría y `check:feeds`— y dos de ellos leían la fecha con su propia
 * expresión. Tres copias de la misma decisión es la enfermedad que este
 * repositorio lleva persiguiendo desde F1-04, y esta vez ya había mordido:
 *
 *   `npm run feed:descubrir` decía de Telecafé «10 artículos, el último hace
 *   70 h» y la auditoría decía «responde, pero ninguna pieza trae fecha». Las
 *   dos herramientas eran nuestras y se contradecían sobre el mismo feed.
 *
 * LA CAUSA, Y ES DE MANUAL. El feed de Telecafé emite `<pubdate>` en
 * minúsculas. XML distingue mayúsculas de minúsculas, así que un parser
 * conforme —el nuestro— no lo reconoce como el `<pubDate>` de RSS 2.0 y lo
 * descarta. El descubridor no usa parser: busca la fecha con una expresión
 * regular insensible a la caja, y por eso sí la veía. Medido el 2026-09-02
 * sobre los 76 feeds del catálogo: Telecafé es el único así, y sus diez piezas
 * entraban sin fecha, ordenándose por el momento en que las vimos —es decir,
 * publicando como de hoy piezas de hace tres días—.
 *
 * NO SE NORMALIZA EL XML ENTERO a minúsculas para arreglar esto. Sería tocar
 * el parseo de los 76 feeds por culpa de uno, y lo que se gana en un medio se
 * arriesga en todos. Se pide el campo con su caja rara, explícitamente, y se
 * lee como respaldo.
 */

/**
 * Los campos no estándar que los parsers tienen que pedir.
 *
 * `media:*` y `content:encoded` no son RSS 2.0, así que rss-parser los ignora
 * salvo que se pidan; `keepArray` porque un ítem suele traer varias
 * resoluciones de la misma foto y hay que poder elegir.
 */
export const CAMPOS_ITEM_RSS = /** @type {const} */ ([
    ['media:content', 'mediaContent', { keepArray: true }],
    ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
    ['content:encoded', 'contentEncoded'],
    // La variante en minúsculas de `pubDate`. Ver la cabecera: Telecafé.
    ['pubdate', 'pubDateEnMinusculas'],
]);

/**
 * La fecha que DECLARA el medio, tal cual viene, o `undefined` si no hay
 * ninguna. No la interpreta ni la valida: de eso se encarga
 * `parsePublishedAt`, que además descarta las que no se sostienen.
 *
 * El orden es el de confianza: `isoDate` lo normaliza el propio parser cuando
 * reconoce el campo; `pubDate` es el crudo estándar; la variante en minúsculas
 * va la última porque es una rareza de un solo medio.
 *
 * @param {any} item
 * @returns {string | undefined}
 */
export function fechaDeclarada(item) {
    return item?.isoDate || item?.pubDate || item?.pubDateEnMinusculas || undefined;
}
