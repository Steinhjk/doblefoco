// @ts-check
/**
 * LÍNEA DE TIEMPO DE COBERTURA (F3-08)
 *
 * Responde a una pregunta que ningún otro agregador del mercado local contesta:
 * ¿en qué ORDEN entró cada espectro a cubrir un hecho? Saber que trece medios
 * cubrieron algo es un dato; saber que la derecha lo publicó cuatro horas antes
 * que el centro y que la izquierda no ha entrado todavía es una observación
 * sobre cómo circula la información.
 *
 * DE DÓNDE SALE LA HORA, y esto condiciona todo lo que se puede afirmar. Es la
 * que cada medio DECLARA en su propio feed RSS, no la que nosotros medimos.
 * Tiene dos consecuencias que la interfaz está obligada a admitir:
 *   · un medio puede declarar mal su hora, y no tenemos forma de contrastarlo;
 *   · nosotros solo miramos cada 30 minutos, así que nuestra detección no
 *     distingue nada por debajo de esa resolución.
 * Por eso esto NO dice «X dio la exclusiva». Dice «según la hora que cada medio
 * declara, este fue el orden». La diferencia no es un matiz legal: afirmar una
 * primicia con un dato que no podemos verificar sería exactamente lo que el
 * principio rector del proyecto prohíbe.
 *
 * UN MEDIO ENTRA UNA VEZ: la de su artículo MÁS ANTIGUO sobre el hecho. Si
 * publicó una nota a las 8 y una ampliación a las 14, entró a las 8. Usar la
 * más reciente —que es lo que guarda `sources` para otras cosas— daría un orden
 * al revés: los medios que más siguen un tema aparecerían como los últimos en
 * llegar.
 */

import { classifySpectrum, SPECTRUM } from './biasAnalysis.js';

/** Convierte a milisegundos, o null si no hay fecha utilizable. */
function aMilis(valor) {
    if (!valor) return null;
    const t = valor instanceof Date ? valor.getTime() : Date.parse(valor);
    return Number.isFinite(t) ? t : null;
}

/**
 * Construye la línea de tiempo a partir de los artículos de una historia.
 *
 * @param {Array<{source_id?: string, outlet?: string, name?: string, domain?: string,
 *                bias?: number, headline?: string, canonical_url?: string,
 *                published_at?: string|Date|null}>} articulos
 * @returns {{
 *   entradas: Array<{sourceId: string, outlet: string, domain: string|null, bias: number,
 *                    spectrum: string, at: string, headline: string|null, url: string|null}>,
 *   porEspectro: Record<string, string|null>,
 *   ordenEspectros: string[],
 *   primeraAt: string|null,
 *   ultimaAt: string|null,
 *   duracionHoras: number|null,
 *   mediosSinFecha: number
 * } | null}
 */
export function buildCoverageTimeline(articulos) {
    if (!Array.isArray(articulos) || articulos.length === 0) return null;

    /** @type {Map<string, any>} */
    const primeroPorMedio = new Map();
    const sinFecha = new Set();

    for (const a of articulos) {
        const id = String(a.source_id ?? a.outlet ?? a.name ?? '');
        if (!id) continue;

        const t = aMilis(a.published_at);
        if (t === null) {
            // Se cuentan aparte y NO se colocan en la línea. Ponerlos «al final»
            // o «al principio» inventaría un orden que no conocemos, y el orden
            // es justo lo único que esta vista afirma.
            sinFecha.add(id);
            continue;
        }

        const previo = primeroPorMedio.get(id);
        if (!previo || t < previo.t) {
            primeroPorMedio.set(id, {
                t,
                sourceId: id,
                outlet: a.outlet ?? a.name ?? id,
                domain: a.domain ?? null,
                bias: Number(a.bias ?? 0),
                headline: a.headline ?? null,
                url: a.canonical_url ?? null,
            });
        }
    }

    // Un medio con fecha en un artículo y sin ella en otro sí está situado.
    for (const id of primeroPorMedio.keys()) sinFecha.delete(id);

    const entradas = [...primeroPorMedio.values()]
        .sort((a, b) => a.t - b.t)
        .map((e) => ({
            sourceId: e.sourceId,
            outlet: e.outlet,
            domain: e.domain,
            bias: e.bias,
            spectrum: classifySpectrum(e.bias),
            at: new Date(e.t).toISOString(),
            headline: e.headline,
            url: e.url,
        }));

    if (entradas.length === 0) {
        return {
            entradas: [],
            porEspectro: { [SPECTRUM.LEFT]: null, [SPECTRUM.CENTER]: null, [SPECTRUM.RIGHT]: null },
            ordenEspectros: [],
            primeraAt: null,
            ultimaAt: null,
            duracionHoras: null,
            mediosSinFecha: sinFecha.size,
        };
    }

    /** Primera entrada de cada espectro. `null` significa que NO ha entrado. */
    const porEspectro = {
        [SPECTRUM.LEFT]: /** @type {string|null} */ (null),
        [SPECTRUM.CENTER]: /** @type {string|null} */ (null),
        [SPECTRUM.RIGHT]: /** @type {string|null} */ (null),
    };
    for (const e of entradas) {
        if (!porEspectro[e.spectrum]) porEspectro[e.spectrum] = e.at;
    }

    const ordenEspectros = Object.entries(porEspectro)
        .filter(([, at]) => at)
        .sort((a, b) => Date.parse(String(a[1])) - Date.parse(String(b[1])))
        .map(([espectro]) => espectro);

    const primera = Date.parse(entradas[0].at);
    const ultima = Date.parse(entradas[entradas.length - 1].at);

    return {
        entradas,
        porEspectro,
        ordenEspectros,
        primeraAt: entradas[0].at,
        ultimaAt: entradas[entradas.length - 1].at,
        duracionHoras: Math.round(((ultima - primera) / 3_600_000) * 10) / 10,
        mediosSinFecha: sinFecha.size,
    };
}

/**
 * Cuánto tardó un espectro en entrar respecto al primero que lo hizo.
 *
 * Devuelve null si ese espectro no ha entrado — y ese null es información, no
 * un hueco: significa que nadie de esa banda ha cubierto el hecho.
 *
 * @param {{porEspectro: Record<string, string|null>, primeraAt: string|null}} linea
 * @param {string} espectro
 * @returns {number|null} horas de retraso, o null
 */
export function retrasoDelEspectro(linea, espectro) {
    const at = linea?.porEspectro?.[espectro];
    if (!at || !linea.primeraAt) return null;
    const horas = (Date.parse(at) - Date.parse(linea.primeraAt)) / 3_600_000;
    return Math.round(horas * 10) / 10;
}
