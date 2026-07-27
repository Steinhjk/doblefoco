/**
 * Análisis de sesgo y cobertura — ÚNICA FUENTE DE VERDAD.
 *
 * Este módulo lo consumen tanto el frontend (src/) como el motor de ingesta
 * (server/). Antes de que existiera, la misma lógica estaba duplicada en 6
 * archivos con umbrales ya divergentes (65% en las tarjetas, 60% en el
 * sidebar), de modo que una noticia podía ser "punto ciego" en un sitio y no
 * en otro. No duplicar esta lógica: importarla.
 *
 * Decisión de diseño importante
 * -----------------------------
 * La versión anterior resumía una historia en la MEDIA de los sesgos de sus
 * fuentes. Promediar fuentes de espectros opuestos no mide polarización: la
 * cancela. Medido sobre el catálogo real del repositorio, esa media dejaba
 * las 200 noticias en el rango [-0.20, +0.16], así que el filtro "Derecha"
 * devolvía 0 resultados y el de "Izquierda" devolvía 1.
 *
 * Aquí se separan tres señales que antes estaban colapsadas en un número:
 *   · coverage      → CUÁNTOS medios de cada espectro cubren el hecho
 *   · polarization  → DESVIACIÓN de los sesgos (esto sí mide polarización)
 *   · blindspot     → ausencia de cobertura en un espectro, y solo se afirma
 *                     cuando hay suficientes fuentes para poder afirmarlo
 */

/** Frontera entre centro y los extremos, en la escala [-1, 1]. */
export const SPECTRUM_THRESHOLD = 0.2;

/**
 * Mínimo de fuentes para poder afirmar que existe un punto ciego.
 *
 * Con 3 o 4 fuentes cualquier proporción es ruido: una sola fuente mueve la
 * cobertura de un espectro del 0% al 33%. Afirmar "la derecha está omitiendo
 * esta noticia" con esa muestra es inventar una conclusión. Por debajo de
 * este umbral la respuesta honesta es `insufficientCoverage: true`, y la UI
 * debe decir que no hay datos suficientes en lugar de mostrar una lista vacía.
 */
export const BLINDSPOT_MIN_SOURCES = 6;

/** Un espectro se considera omitido si tiene esta cobertura o menos. */
export const BLINDSPOT_MAX_RATIO = 0.15;

/** Desviación estándar a partir de la cual una historia se marca polarizada. */
export const HIGH_POLARIZATION_STDDEV = 0.25;

export const SPECTRUM = {
    LEFT: 'left',
    CENTER: 'center',
    RIGHT: 'right',
};

export const SPECTRUM_LABEL = {
    left: 'Izquierda',
    center: 'Centro',
    right: 'Derecha',
};

/** Clasifica un sesgo numérico en uno de los tres espectros. */
export function classifySpectrum(bias) {
    const value = typeof bias === 'number' && Number.isFinite(bias) ? bias : 0;
    if (value <= -SPECTRUM_THRESHOLD) return SPECTRUM.LEFT;
    if (value >= SPECTRUM_THRESHOLD) return SPECTRUM.RIGHT;
    return SPECTRUM.CENTER;
}

/** Etiqueta legible para el sesgo agregado de una historia. */
export function describeBias(bias) {
    const value = typeof bias === 'number' && Number.isFinite(bias) ? bias : 0;
    if (value <= -0.3) return 'Inclinación izquierda';
    if (value < -0.1) return 'Centro-izquierda';
    if (value <= 0.1) return 'Centro';
    if (value < 0.3) return 'Centro-derecha';
    return 'Inclinación derecha';
}

/** Desviación estándar poblacional. Devuelve 0 con menos de dos valores. */
function stddev(values) {
    if (!Array.isArray(values) || values.length < 2) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
        values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
}

/**
 * Reparte 100 puntos porcentuales entre los espectros sin que la suma se
 * desvíe por redondeo. Redondear cada parte por separado produce totales de
 * 99 o 101, que es la razón por la que el código anterior calculaba el tercer
 * porcentaje como `100 - a - b` y ocasionalmente obtenía valores negativos.
 */
function distributePercentages(counts, total) {
    if (!total) return { left: 0, center: 0, right: 0 };

    const exact = {
        left: (counts.left / total) * 100,
        center: (counts.center / total) * 100,
        right: (counts.right / total) * 100,
    };

    const floored = {
        left: Math.floor(exact.left),
        center: Math.floor(exact.center),
        right: Math.floor(exact.right),
    };

    let remainder =
        100 - (floored.left + floored.center + floored.right);

    // Los puntos sobrantes van a los espectros con mayor parte fraccionaria.
    const byFraction = ['left', 'center', 'right'].sort(
        (a, b) => (exact[b] - floored[b]) - (exact[a] - floored[a])
    );

    for (const key of byFraction) {
        if (remainder <= 0) break;
        floored[key] += 1;
        remainder -= 1;
    }

    return floored;
}

/**
 * Analiza la cobertura de una historia a partir de sus fuentes.
 *
 * @param {Array<{name?: string, bias?: number}>} sources
 * @returns {{
 *   total: number,
 *   counts: {left: number, center: number, right: number},
 *   percentages: {left: number, center: number, right: number},
 *   meanBias: number,
 *   polarization: number,
 *   isHighlyPolarized: boolean,
 *   dominantSpectrum: 'left'|'center'|'right'|null,
 *   insufficientCoverage: boolean,
 *   blindspot: null | {spectrum: 'left'|'right', label: string, description: string}
 * }}
 */
export function analyzeCoverage(sources) {
    const list = Array.isArray(sources) ? sources : [];
    const biases = list
        .map((s) => (typeof s?.bias === 'number' && Number.isFinite(s.bias) ? s.bias : 0));

    const counts = { left: 0, center: 0, right: 0 };
    for (const bias of biases) {
        counts[classifySpectrum(bias)] += 1;
    }

    const total = list.length;
    const percentages = distributePercentages(counts, total);

    const meanBias = total
        ? Number((biases.reduce((sum, b) => sum + b, 0) / total).toFixed(3))
        : 0;

    const polarization = Number(stddev(biases).toFixed(3));

    // Espectro dominante: solo si supera estrictamente a los otros dos.
    let dominantSpectrum = null;
    const ordered = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (ordered[0][1] > 0 && ordered[0][1] > ordered[1][1]) {
        dominantSpectrum = ordered[0][0];
    }

    const insufficientCoverage = total < BLINDSPOT_MIN_SOURCES;

    let blindspot = null;
    if (!insufficientCoverage) {
        const leftRatio = counts.left / total;
        const rightRatio = counts.right / total;

        if (rightRatio <= BLINDSPOT_MAX_RATIO && leftRatio > BLINDSPOT_MAX_RATIO) {
            blindspot = {
                spectrum: SPECTRUM.RIGHT,
                label: 'Punto ciego de la derecha',
                description:
                    `${counts.left + counts.center} de ${total} medios que cubren el hecho ` +
                    `son de izquierda o centro. Solo ${counts.right} de derecha lo reportan.`,
            };
        } else if (leftRatio <= BLINDSPOT_MAX_RATIO && rightRatio > BLINDSPOT_MAX_RATIO) {
            blindspot = {
                spectrum: SPECTRUM.LEFT,
                label: 'Punto ciego de la izquierda',
                description:
                    `${counts.right + counts.center} de ${total} medios que cubren el hecho ` +
                    `son de derecha o centro. Solo ${counts.left} de izquierda lo reportan.`,
            };
        }
    }

    return {
        total,
        counts,
        percentages,
        meanBias,
        polarization,
        isHighlyPolarized: polarization >= HIGH_POLARIZATION_STDDEV,
        dominantSpectrum,
        insufficientCoverage,
        blindspot,
    };
}

/**
 * Factualidad media ponderada de las fuentes de una historia.
 *
 * Devuelve `null` cuando ninguna fuente aporta el dato, en lugar de inventar
 * un valor por defecto. El motor anterior fijaba 0.88 para TODAS las
 * historias y la UI lo mostraba como "Factualidad IA: 88%", presentando una
 * constante como si fuera una medición.
 */
export function averageFactuality(sources) {
    const values = (Array.isArray(sources) ? sources : [])
        .map((s) => s?.factuality)
        .filter((f) => typeof f === 'number' && Number.isFinite(f) && f > 0);

    if (!values.length) return null;
    return Number((values.reduce((sum, f) => sum + f, 0) / values.length).toFixed(3));
}
