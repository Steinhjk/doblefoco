// @ts-check
/**
 * CÓMO SE DICE EL REPARTO DE UNA COBERTURA, EN UN SOLO SITIO.
 *
 * POR QUÉ EXISTE ESTE FICHERO. La frase «N de izquierda, M de orientación
 * mixta, K de derecha» se escribía en tres sitios distintos: la barra de cada
 * tarjeta (`CoverageBar`), el diálogo de compartir (`ShareModal`) y la
 * descripción de Open Graph (`server/ssr/metadatos.js`). Tres copias de la
 * misma frase es una invitación a que se separen, y **se separaron**:
 *
 *   · `CoverageBar` decía «de orientación mixta», con un comentario que avisaba
 *     de que era «el sitio donde más se nota si un renombrado se queda a medias».
 *   · `metadatos.js` seguía diciendo **«de centro»**.
 *
 * Y la copia que se quedó atrás era la peor de las tres: la descripción de Open
 * Graph es el texto que viaja en CADA enlace compartido y el que lee Google.
 * Durante meses el sitio enseñaba una palabra por dentro y mandaba otra por
 * fuera.
 *
 * NO EXISTE EL CENTRO POLÍTICO, y por eso la banda media no se llama así. Un
 * medio de esa banda no es neutral ni está «sin línea»: es uno cuya orientación
 * no se agrupa limpiamente a un lado. «Centro» afirma una posición; «orientación
 * mixta» describe lo que se midió. La distinción es del proyecto, no de estilo.
 *
 * LO QUE ESTE MÓDULO NO HACE. No compone la frase entera, solo el reparto. Cada
 * sitio tiene su propio envoltorio —la barra dice «Cobertura de N medios:», el
 * metadato dice «N medios cubren este hecho:»— y forzar una sola frase para los
 * tres obligaría a que ninguno dijera lo que necesita. Lo que no puede volver a
 * divergir es cómo se nombran las bandas y en qué orden van.
 */

/** Los nombres de las tres bandas. Cambiar uno aquí lo cambia en todas partes. */
export const NOMBRE_DE_BANDA = /** @type {const} */ ({
    left: 'izquierda',
    center: 'orientación mixta',
    right: 'derecha',
});

/**
 * «2 de izquierda, 6 de orientación mixta, 5 de derecha».
 *
 * Acepta las dos formas en que el reparto viaja por el proyecto: el servidor lo
 * lleva en `story.coverage.left`, y el cliente en `coverage.counts.left`.
 *
 * @param {{left?: number, center?: number, right?: number}} conteo
 * @returns {string}
 */
export function repartoEnPalabras(conteo) {
    const n = (valor) => Number(valor ?? 0);
    return (
        `${n(conteo?.left)} de ${NOMBRE_DE_BANDA.left}, ` +
        `${n(conteo?.center)} de ${NOMBRE_DE_BANDA.center}, ` +
        `${n(conteo?.right)} de ${NOMBRE_DE_BANDA.right}`
    );
}

/**
 * «22 medios cubren este hecho: 1 de izquierda, 10 de orientación mixta, 11 de
 * derecha».
 *
 * Es la frase que el proyecto dice de sí mismo en los dos sitios donde sale del
 * sitio: la descripción de Open Graph —lo que ve quien recibe un enlace— y el
 * texto que el lector manda al compartir. **Tienen que ser la misma frase**: si
 * el mensaje de WhatsApp dice una cosa y la tarjeta que se despliega debajo
 * dice otra, el que pierde credibilidad es el sitio.
 *
 * EL VERBO CAMBIA CON LA HISTORIA. Una archivada descrita en presente se lee
 * como la noticia de hoy, y para mucha gente esa línea es lo único que va a
 * leer de la página. `pasado` es para ellas.
 *
 * @param {{left?: number, center?: number, right?: number}} conteo
 * @param {{pasado?: boolean}} [opciones]
 * @returns {string} frase sin punto final: quien la use decide cómo sigue
 */
export function fraseDeCobertura(conteo, opciones = {}) {
    const n = (valor) => Number(valor ?? 0);
    const total = n(conteo?.left) + n(conteo?.center) + n(conteo?.right);
    const verbo = opciones.pasado ? 'cubrió' : 'cubre';
    const verboPlural = opciones.pasado ? 'cubrieron' : 'cubren';
    const sujeto = total === 1 ? `1 medio ${verbo}` : `${total} medios ${verboPlural}`;
    return `${sujeto} este hecho: ${repartoEnPalabras(conteo)}`;
}
