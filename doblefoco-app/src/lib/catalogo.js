// @ts-check
import { MEDIA_REGISTRY } from '../../shared/mediaRegistry.js';
import { OWNERSHIP_PROFILES } from '../../shared/mediaOwnership.js';

/**
 * LAS CUATRO CIFRAS QUE EL SITIO DICE SOBRE SÍ MISMO, CONTADAS EN UN SOLO SITIO.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO (2026-08-31)
 * ----------------------------------------
 * Porque la página de transparencia estaba mintiendo, en dos sitios a la vez, y
 * de la peor forma posible: **con una frase escrita a mano al lado de un número
 * que se movía solo.**
 *
 *   · `/transparencia/limitaciones` decía, literal y en la misma línea:
 *     «Ninguna de las 78 clasificaciones está firmada. 5 han pasado por revisión
 *     editorial formal.» El «Ninguna» era texto fijo de cuando el 5 era 0.
 *   · `/transparencia/sobre-nosotros` decía «Ninguna de las 78 clasificaciones
 *     ha pasado aún por revisión editorial formal», que ya era falso.
 *
 * Es exactamente el defecto que este repositorio persigue en el código —una
 * afirmación que describe una intención que dejó de ocurrir— pero en la prosa, y
 * en la página que existe para prometer que no lo hacemos. La cifra ya se
 * calculaba; lo que estaba escrito a mano era **la frase que la interpreta**, y
 * una frase también envejece.
 *
 * ASÍ QUE AQUÍ NO SE EXPORTAN SOLO NÚMEROS, SE EXPORTAN LAS FRASES. Mientras la
 * redacción viva en cada página, cada página puede quedarse atrás por su cuenta.
 *
 * LO QUE ESTE ARCHIVO NO HACE: no juzga si el estado es bueno o malo. «73 sin
 * firmar» es un hecho; si eso es poco o mucho lo dice el texto que lo rodea, y
 * eso sí es criterio editorial.
 */

/** Todos los medios del catálogo. */
export const TOTAL = MEDIA_REGISTRY.length;

/**
 * Firmadas: las que llevan `reviewedAt`. Es la marca que dice que una persona
 * revisó el valor y responde por él — ver `PROTOCOLO_JUICIO_EDITORIAL.md`.
 */
export const FIRMADAS = MEDIA_REGISTRY.filter((m) => m.reviewedAt).length;

/** El resto. Se publican marcadas como provisionales. */
export const SIN_FIRMAR = TOTAL - FIRMADAS;

/**
 * Medios cuya propiedad NO consta. `ownerType: null` es un estado de primera
 * clase, no una ficha a medias: exige declarar dónde y cuándo se buscó, y
 * `npm run check:registry` lo obliga.
 */
export const SIN_DUENO_COMPROBADO = Object.values(OWNERSHIP_PROFILES)
    .filter((f) => !f.ownerType).length;

/** Los que sí. */
export const CON_DUENO_COMPROBADO = TOTAL - SIN_DUENO_COMPROBADO;

/**
 * Cómo se dice el estado de las firmas, en una frase que es cierta con
 * cualquier número — incluido el cero, que es de donde venimos, y el total, que
 * es adonde se va.
 *
 * @returns {string}
 */
export function fraseDeFirmas() {
    if (FIRMADAS === 0) {
        return `Ninguna de las ${TOTAL} clasificaciones está firmada.`;
    }
    if (FIRMADAS === TOTAL) {
        return `Las ${TOTAL} clasificaciones están firmadas.`;
    }
    return `${FIRMADAS} de las ${TOTAL} clasificaciones están firmadas; las otras ${SIN_FIRMAR}, no.`;
}

/**
 * Y cómo se dice el estado de la propiedad. Misma regla: cierta con cualquier
 * número. La versión escrita a mano afirmaba que constaba la de **todos** los
 * medios «con una excepción», cuando eran quince.
 *
 * @returns {string}
 */
export function fraseDePropiedad() {
    if (SIN_DUENO_COMPROBADO === 0) {
        return `De los ${TOTAL} medios del catálogo consta quién los controla, con la fuente al lado.`;
    }
    return (
        `De ${CON_DUENO_COMPROBADO} de los ${TOTAL} medios consta quién los controla, con la fuente ` +
        `al lado. De los otros ${SIN_DUENO_COMPROBADO} no consta, y publicamos la búsqueda en su lugar: ` +
        `dónde se miró, cuándo, y qué documento cerraría el hueco.`
    );
}
