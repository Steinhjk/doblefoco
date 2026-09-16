// @ts-check
import { rutaDeHistoria } from '../../shared/storyPath.js';
import { fraseDeCobertura } from '../../shared/repartoDeCobertura.js';

/**
 * LO QUE SE MANDA CUANDO ALGUIEN COMPARTE UNA HISTORIA.
 *
 * POR QUÉ NO SE LEE LA BARRA DE DIRECCIONES. El diálogo de compartir usaba
 * `window.location.href`. En la página de la noticia acertaba por casualidad
 * —esa ES la URL de la historia—, pero el mismo diálogo abierto desde una
 * tarjeta de la portada habría compartido **la portada**, y con los filtros del
 * lector pegados detrás (`?ambito=…`). La URL sale de la historia, siempre.
 *
 * Y NO SE AÑADEN PARÁMETROS DE RASTREO. Decidido el 2026-09-15: sin analítica no
 * medirían nada, y ponerle `utm_*` al lector es precisamente la decisión de
 * coherencia que este proyecto tiene abierta en `PLANEACION.md`. Si algún día se
 * decide medir, este es el sitio donde se añadirían — y el único.
 */

/** Dominio de producción. Solo se usa si no hay navegador, o sea al renderizar. */
const ORIGEN_POR_DEFECTO = 'https://doblefoco.co';

/**
 * La URL absoluta de una historia.
 *
 * @param {any} story
 * @param {string} [origen] para las pruebas; en el navegador sale solo
 * @returns {string}
 */
export function urlDeHistoria(story, origen) {
    const base =
        origen ?? (typeof window === 'undefined' ? ORIGEN_POR_DEFECTO : window.location.origin);
    return new URL(rutaDeHistoria(story), base).toString();
}

/**
 * El texto que acompaña al enlace.
 *
 * ES LA MISMA FRASE QUE LA DESCRIPCIÓN DE OPEN GRAPH, y tiene que serlo: el
 * mensaje que escribe el lector y la tarjeta que se despliega debajo se leen
 * juntos. Si dijeran cosas distintas, el que queda raro es el sitio.
 *
 * NO LLEVA ADJETIVOS. Decía «Cobertura contrastada: …», y «contrastada» afirma
 * una cualidad que la medición no sostiene — es la misma razón por la que el
 * 2026-09-01 se retiró «Información Objetiva y Moderna» del `twitter:title`. Lo
 * que sí sostiene la medición es el reparto, y el reparto además es el producto.
 *
 * SIN COBERTURA MEDIDA, SOLO EL TITULAR. Inventar una frase para una historia
 * cuyo reparto no conocemos sería decir de ella algo que no sabemos.
 *
 * @param {any} story
 * @returns {string}
 */
export function textoDeCompartir(story) {
    const titulo = String(story?.title ?? '').trim();
    const conteo = story?.coverage?.counts;
    const total = Number(story?.coverage?.total ?? 0);

    if (!conteo || !total) return titulo;

    const frase = fraseDeCobertura(conteo, { pasado: Boolean(story?.archivadaEl) });
    return `${titulo}\n\n${frase}.`;
}

/**
 * Solo la frase de la cobertura, sin el titular, para la vista previa.
 *
 * @param {any} story
 * @returns {string} cadena vacía si la historia no tiene reparto medido
 */
export function fraseDeCoberturaDeHistoria(story) {
    const conteo = story?.coverage?.counts;
    const total = Number(story?.coverage?.total ?? 0);
    if (!conteo || !total) return '';
    return `${fraseDeCobertura(conteo, { pasado: Boolean(story?.archivadaEl) })}.`;
}

/**
 * El mensaje entero: texto y enlace, separados por una línea en blanco.
 *
 * Es lo que se manda por los canales que reciben UN solo campo de texto
 * —WhatsApp, o la hoja nativa del sistema—. X y LinkedIn llevan el enlace en su
 * propio parámetro, así que allí no se usa: repetido saldría dos veces.
 *
 * @param {any} story
 * @param {string} [origen]
 * @returns {string}
 */
export function mensajeConEnlace(story, origen) {
    return `${textoDeCompartir(story)}\n\n${urlDeHistoria(story, origen)}`;
}
