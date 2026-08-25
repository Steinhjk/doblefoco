// @ts-check
/**
 * EL ESPACIO MEDIÁTICO POR DUEÑO Y POR VOLUMEN — tarea F3-16.
 *
 * QUÉ PREGUNTA RESPONDE, y no la responde ninguna otra pantalla del sitio:
 * ¿cuántos dueños hay detrás de lo que leo?
 *
 * POR QUÉ EL MAPA CARTESIANO NO PUEDE RESPONDERLA. Ese mapa sitúa cada medio por
 * sesgo y factualidad, y da UN PUNTO POR MEDIO. Todos los puntos pesan igual, así
 * que Semana y Colombia Informa ocupan el mismo espacio en pantalla publicando
 * 474 y 1 artículos. La asimetría de volumen —el hallazgo central de F1-12, y la
 * razón de ser del producto según su propósito editorial— queda invisible por
 * construcción, no por descuido.
 *
 * LAS DOS COSAS QUE ESTE MÓDULO CALCULA:
 *
 *   1. Reparto por DUEÑO. Agrupa los medios por su grupo de control (F3-15) y
 *      los pesa por lo que publican. Once medios del catálogo responden ante
 *      cinco dueños, y esto lo pone en proporciones.
 *
 *   2. El espectro contado de DOS formas: por número de medios y por volumen
 *      publicado. Es el corazón del asunto. Contar medios dice «6 de 33 son de
 *      izquierda o centro-izquierda», que suena a catálogo casi equilibrado.
 *      Pesar por volumen dice que esos 6 son el 0,9 % de lo que se publica.
 *      La misma realidad, y la primera lectura la esconde.
 *
 * LÍMITE QUE HAY QUE DECLARAR EN PANTALLA, no solo aquí: el volumen sale del RSS
 * de cada medio, no de su audiencia. Un medio que expone poco en su feed parece
 * pequeño sin serlo —El Espectador aparece con 34 artículos frente a 474 de
 * Semana— así que esto mide PRESENCIA EN NUESTRO CORPUS y no cuota de mercado.
 * Una vista que no lo diga estaría afirmando más de lo que el dato aguanta, que
 * es exactamente lo que este proyecto no hace.
 */

import { CONTROL_GROUPS, getOwnership } from './mediaOwnership.js';
import { classifySpectrum, SPECTRUM_LABEL } from './biasAnalysis.js';

/** Medios sin propiedad documentada. No se inventa un dueño para ellos. */
export const SIN_DUENO = 'sin-documentar';

/**
 * Reparto del volumen publicado por grupo de control.
 *
 * Los medios sin ficha de propiedad NO se reparten ni se ocultan: van a un
 * bloque propio y visible. Repartirlos entre los conocidos inflaría la
 * concentración; ocultarlos haría que los porcentajes no sumaran y nadie sabría
 * por qué.
 *
 * @param {Array<{sourceId: string, articulos: number}>} conteos
 * @param {Array<{id: string, name: string, shortName?: string, bias: number}>} registro
 */
export function repartoPorDueno(conteos, registro) {
    const porMedio = new Map(
        (Array.isArray(conteos) ? conteos : []).map((c) => [c.sourceId, c.articulos ?? 0])
    );

    const grupos = new Map();
    let total = 0;

    for (const medio of Array.isArray(registro) ? registro : []) {
        const articulos = porMedio.get(medio.id) ?? 0;
        if (articulos <= 0) continue;

        total += articulos;

        const grupoId = getOwnership(medio.id)?.controlGroup ?? SIN_DUENO;
        const etiqueta = CONTROL_GROUPS[grupoId]?.label ?? 'Propiedad sin documentar';

        if (!grupos.has(grupoId)) {
            grupos.set(grupoId, { grupoId, label: etiqueta, articulos: 0, medios: [] });
        }

        const grupo = grupos.get(grupoId);
        grupo.articulos += articulos;
        grupo.medios.push({
            id: medio.id,
            nombre: medio.shortName ?? medio.name,
            articulos,
            espectro: classifySpectrum(medio.bias),
        });
    }

    const lista = [...grupos.values()]
        .map((g) => ({
            ...g,
            // Se ordenan los medios dentro del grupo para que el que más pesa
            // salga primero: es el que explica por qué el grupo está donde está.
            medios: g.medios.sort((a, b) => b.articulos - a.articulos),
            porcentaje: total > 0 ? (g.articulos / total) * 100 : 0,
        }))
        .sort((a, b) => b.articulos - a.articulos);

    return { total, grupos: lista };
}

/**
 * El espectro contado de dos formas, que es el argumento de esta vista.
 *
 * Cada banda vuelve con las dos cuentas: `medios` y `pctMedios` cuentan cabezas
 * —cuántos medios hay de esa orientación—, y `articulos` y `pctVolumen` pesan
 * —cuánto publican—.
 *
 * Cuando las dos cifras difieren mucho, la primera está escondiendo algo. Por
 * eso van juntas en el mismo objeto y no en dos llamadas: mostrar solo una de
 * las dos es lo que hace que un catálogo desigual parezca equilibrado. En este
 * catálogo difieren tanto que son el argumento de la vista entera —la izquierda
 * es el 22,6 % de los medios y el 3,3 % del volumen—.
 *
 * @param {Array<{sourceId: string, articulos: number}>} conteos
 * @param {Array<{id: string, bias: number}>} registro
 */
export function repartoPorEspectro(conteos, registro) {
    const porMedio = new Map(
        (Array.isArray(conteos) ? conteos : []).map((c) => [c.sourceId, c.articulos ?? 0])
    );

    const bandas = { left: { medios: 0, articulos: 0 }, center: { medios: 0, articulos: 0 }, right: { medios: 0, articulos: 0 } };
    let totalMedios = 0;
    let totalArticulos = 0;

    for (const medio of Array.isArray(registro) ? registro : []) {
        const articulos = porMedio.get(medio.id) ?? 0;
        // Un medio que no publicó nada no cuenta como voz en ninguna de las dos
        // medidas. Contarlo en «medios» y no en «volumen» haría que la primera
        // columna dijera algo que la segunda no puede sostener.
        if (articulos <= 0) continue;

        const espectro = classifySpectrum(medio.bias);
        bandas[espectro].medios += 1;
        bandas[espectro].articulos += articulos;
        totalMedios += 1;
        totalArticulos += articulos;
    }

    return ['left', 'center', 'right'].map((id) => ({
        id,
        label: SPECTRUM_LABEL[id],
        medios: bandas[id].medios,
        articulos: bandas[id].articulos,
        pctMedios: totalMedios > 0 ? (bandas[id].medios / totalMedios) * 100 : 0,
        pctVolumen: totalArticulos > 0 ? (bandas[id].articulos / totalArticulos) * 100 : 0,
    }));
}

/**
 * ¿Cuántos dueños hacen la mitad de lo que se publica?
 *
 * Una sola cifra para la respuesta de cinco segundos. Es más honesta que un
 * índice de concentración al uso (Herfindahl y compañía): se entiende sin
 * explicación y no sugiere una precisión que este corpus no tiene.
 *
 * @param {{total: number, grupos: Array<{articulos: number}>}} reparto
 */
export function duenosParaLaMitad(reparto) {
    if (!reparto?.total) return 0;

    let acumulado = 0;
    let n = 0;

    for (const grupo of reparto.grupos) {
        acumulado += grupo.articulos;
        n += 1;
        if (acumulado >= reparto.total / 2) break;
    }

    return n;
}
