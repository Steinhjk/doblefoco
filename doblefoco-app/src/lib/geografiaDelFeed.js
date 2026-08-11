// @ts-check
/**
 * DE QUÉ DEPARTAMENTO HABLA CADA HISTORIA DEL FEED.
 *
 * Capa fina entre `shared/geografia.js` —que sabe leer un titular— y el mapa,
 * que necesita además el reparto y su lectura honesta. Vive aparte del
 * componente para poder probarse sin montar React.
 *
 * YA VIENE DE LA BASE (2026-08-11)
 * --------------------------------
 * `stories.departamento` lo calcula la ingesta y lo sirve la API, y los conteos
 * del mapa salen de `/api/departamentos`, que cuenta el CATÁLOGO ENTERO.
 *
 * Antes se calculaba aquí sobre lo descargado, y la consecuencia era que los
 * conteos crecían al pulsar «cargar más»: un coropleto cuyo color cambia según
 * cuánto hayas bajado no dice nada, porque la intensidad tiene que significar
 * «cuánto se habla de aquí» y no «cuánto has cargado». Era lo contrario de lo
 * que ya hacían las pestañas de ámbito, que siempre contaron el catálogo.
 *
 * EL DETECTOR SIGUE AQUÍ, y no por inercia: mientras la API desplegada no mande
 * el campo —el cliente sale en Vercel y la API en Fly, por separado— hay que
 * seguir diciendo algo cierto en vez de dejar el mapa en blanco. Es el mismo
 * respaldo que `perteneceA` mantiene para `topics`, y desaparece solo en cuanto
 * el campo llega.
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
 * PREFIERE LO QUE MANDA LA API. Es el mismo valor calculado con esta misma
 * función, pero en la ingesta: preferirlo no cambia el resultado y evita
 * recalcular en cada render lo que ya viene resuelto. Se cae a la detección
 * local solo mientras la API desplegada no traiga el campo.
 *
 * @param {{title?: string, ambito?: string|null, departamento?: string|null}} historia
 * @returns {string|null}
 */
export function departamentoDe(historia) {
    if (historia?.ambito === 'internacional') return null;
    if (historia?.departamento !== undefined) return historia.departamento;
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
 * @property {boolean} [delCatalogo] - si los conteos son del catálogo o de lo descargado
 */

/**
 * Reparto por departamento de una tanda de historias.
 *
 * LOS 33 SALEN SIEMPRE, incluidos los que valen cero. Omitirlos convertiría el
 * mapa en «los departamentos de los que hablamos» y quien viva en Vaupés
 * simplemente no se encontraría en el filtro. Un cero se puede leer; una
 * ausencia, no.
 *
 * LOS CONTEOS SON DEL CATÁLOGO; `porHistoria` ES DE LO DESCARGADO, y son dos
 * cosas distintas a propósito:
 *
 *   · `conteos` pinta el mapa, y tiene que responder «cuánto se habla de aquí».
 *     Sale de `/api/departamentos`, que cuenta el catálogo entero.
 *   · `porHistoria` filtra la lista de abajo, que solo puede mostrar lo que se
 *     ha descargado.
 *
 * Confundirlas ya produjo el fallo que esto arregla: el color del mapa crecía al
 * pulsar «cargar más». Es la misma distinción que `useStories` documenta entre
 * `counts` y `stories`.
 *
 * Sin `conteosDelCatalogo` se cuenta lo descargado, como antes. Pasa mientras la
 * API desplegada no tenga la ruta, y es peor pero sigue siendo cierto para lo
 * que hay a la vista.
 *
 * @param {Array<{id?: string, title?: string, ambito?: string|null, departamento?: string|null}>} historias
 * @param {Record<string, number>|null} [conteosDelCatalogo]
 * @returns {RepartoGeografico}
 */
export function repartoGeografico(historias, conteosDelCatalogo = null) {
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

    const delCatalogo = conteosDelCatalogo && Object.keys(conteosDelCatalogo).length;

    if (delCatalogo) {
        // Solo los 33 conocidos: un nombre que no esté en la lista canónica no
        // tiene silueta en el mapa y aparecería como un conteo huérfano.
        for (const departamento of DEPARTAMENTOS) {
            conteos[departamento] = conteosDelCatalogo[departamento] ?? 0;
        }
    }

    const valores = Object.values(conteos);
    const totalEtiquetadas = delCatalogo
        ? valores.reduce((a, b) => a + b, 0)
        : etiquetadas;

    return {
        conteos,
        porHistoria,
        etiquetadas: totalEtiquetadas,
        total: lista.length,
        maximo: valores.reduce((a, b) => Math.max(a, b), 0),
        vacios: valores.filter((n) => n === 0).length,
        delCatalogo: Boolean(delCatalogo),
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
