// @ts-check
/**
 * DE QUÉ DEPARTAMENTO HABLA CADA HISTORIA DEL FEED.
 *
 * Capa fina entre `shared/geografia.js` —que sabe leer un titular— y el mapa,
 * que necesita además el reparto y su lectura honesta. Vive aparte del
 * componente para poder probarse sin montar React.
 *
 * SE CALCULA EN EL NAVEGADOR, SOBRE LO DESCARGADO
 * -----------------------------------------------
 * El departamento todavía NO está en la base: no hay columna `articles.departamento`
 * ni índice por el que consultar. El detector es una función pura sobre el
 * titular, así que puede correrse aquí sin tocar la ingesta.
 *
 * La consecuencia hay que decirla y no esconderla: **los conteos son de las
 * historias cargadas, no del catálogo**. Cargar más los hace crecer. Es lo
 * contrario de lo que hacen las cifras de las pestañas de ámbito, que sí son
 * del catálogo porque las cuenta el servidor, y por eso la vista lo declara en
 * vez de dejar que se confundan.
 *
 * LO INTERNACIONAL NO SE ETIQUETA
 * -------------------------------
 * Y no es un detalle: «Santander» es un departamento colombiano y también un
 * banco y una ciudad de España; «Córdoba» ya estaba excluido por ambiguo, pero
 * «Santander» no. Sin este corte, la portada de un medio español mandaría
 * noticias a Bucaramanga. Se excluye por el campo `ambito`, que lo decide el
 * servidor. Cuando viene `null` —un despliegue de la API que aún no clasifica—
 * se etiqueta igual: negarse dejaría el mapa entero en blanco, y en ese
 * despliegue las pestañas de ámbito ya están en cero, así que el hueco se ve.
 */

import { DEPARTAMENTOS, detectarDepartamento } from '../../shared/geografia.js';

/**
 * El departamento de una historia, o `null` si el titular no lo dice.
 *
 * Mira SOLO el titular de la historia, no los titulares de cada medio que la
 * cubre. Sumarlos subiría la cobertura, pero un grupo con ocho titulares podría
 * nombrar tres departamentos distintos y habría que elegir uno por votación:
 * más recall a cambio de una etiqueta que ya no se puede justificar leyendo una
 * sola frase. El detector es corto de vista a propósito y esto lo respeta.
 *
 * @param {{title?: string, ambito?: string|null}} historia
 * @returns {string|null}
 */
export function departamentoDe(historia) {
    if (historia?.ambito === 'internacional') return null;
    return detectarDepartamento(historia?.title).departamento;
}

/**
 * @typedef {Object} RepartoGeografico
 * @property {Record<string, number>} conteos - los 33, incluidos los que van a cero
 * @property {Map<string, string|null>} porHistoria - id → departamento, para filtrar sin volver a detectar
 * @property {number} etiquetadas - cuántas recibieron departamento
 * @property {number} total - cuántas se miraron
 * @property {number} maximo - el conteo más alto, para escalar el color
 * @property {number} vacios - cuántos de los 33 se quedaron en cero
 */

/**
 * Reparto por departamento de una tanda de historias.
 *
 * LOS 33 SALEN SIEMPRE, incluidos los que valen cero. Omitirlos convertiría el
 * mapa en «los departamentos de los que hablamos» y quien viva en Vaupés
 * simplemente no se encontraría en el filtro. Un cero se puede leer; una
 * ausencia, no.
 *
 * @param {Array<{id?: string, title?: string, ambito?: string|null}>} historias
 * @returns {RepartoGeografico}
 */
export function repartoGeografico(historias) {
    const lista = Array.isArray(historias) ? historias : [];

    /** @type {Record<string, number>} */
    const conteos = Object.fromEntries(DEPARTAMENTOS.map((d) => [d, 0]));
    /** @type {Map<string, string|null>} */
    const porHistoria = new Map();

    let etiquetadas = 0;

    for (const historia of lista) {
        const departamento = departamentoDe(historia);
        porHistoria.set(String(historia?.id), departamento);

        if (departamento === null) continue;
        conteos[departamento] += 1;
        etiquetadas += 1;
    }

    const valores = Object.values(conteos);

    return {
        conteos,
        porHistoria,
        etiquetadas,
        total: lista.length,
        maximo: valores.reduce((a, b) => Math.max(a, b), 0),
        vacios: valores.filter((n) => n === 0).length,
    };
}

/** Cuántos escalones tiene la rampa de color, sin contar el cero. */
export const ESCALONES = 5;

/**
 * En qué escalón cae un conteo: 0 para «ninguna», 1..5 de menos a más.
 *
 * RAÍZ CUADRADA Y NO LINEAL, porque el reparto está torcidísimo. Valle del
 * Cauca acumula el triple que el segundo —El País de Cali nombra Cali en casi
 * cada titular—, así que en una escala lineal Valle se lleva el tono fuerte y
 * los otros treinta y dos quedan indistinguibles en el primer escalón: un mapa
 * de un solo departamento. La raíz reparte los tonos donde están los datos sin
 * alterar el orden, que es lo único que el color promete.
 *
 * LA ESCALA SE ANCLA EN 1, NO EN 0, y eso no es una sutileza. Anclada en cero,
 * con un máximo pequeño —sobre 100 historias cargadas el máximo real es 12, no
 * 219— una sola historia ya caía en el segundo tono y el primero no lo
 * alcanzaba nadie nunca: cinco tonos declarados en la leyenda y cuatro usados.
 * Anclada en 1, el departamento con una historia estrena la rampa y el que más
 * tiene la cierra, con cualquier máximo.
 *
 * @param {number} n - historias de ese departamento
 * @param {number} maximo - el conteo más alto del reparto
 */
export function escalonDe(n, maximo) {
    if (!n || n <= 0 || maximo <= 0) return 0;

    // Un solo nivel poblado: quien lo ocupa ES el máximo, y le toca el tono
    // fuerte. La alternativa —pintarlo del más flojo— diría lo contrario.
    if (maximo <= 1) return ESCALONES;

    const proporcion = Math.min(1, (n - 1) / (maximo - 1));
    return Math.min(ESCALONES, 1 + Math.round((ESCALONES - 1) * Math.sqrt(proporcion)));
}
