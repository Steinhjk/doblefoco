// @ts-check
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
 * BAJADO DE 6 A 4 el 2026-07-30 por decisión de Jose, con una condición que
 * compensa la rebaja y que él mismo formuló: «2 de izquierda y 2 de derecha».
 *
 * La rebaja sola habría sido peor método. Con 4 fuentes, una sola mueve la
 * proporción 25 puntos, así que «0 de derecha entre 4» podría ser la decisión de
 * un único jefe de redacción y no un patrón. Lo que lo sostiene es la
 * composición: para decir que un lado calla hace falta que el OTRO lado hable
 * con más de una voz — ver BLINDSPOT_MIN_COBERTURA_LADO.
 *
 * El efecto buscado es que la señal deje de ser tan rara que no sirva: con el
 * umbral en 6 solo 16 historias de 4 000 alcanzaban a evaluarse.
 */
export const BLINDSPOT_MIN_SOURCES = 4;

/**
 * Cuántos medios tiene que aportar el lado que SÍ cubre.
 *
 * Es la mitad de «2 de izquierda y 2 de derecha» que se puede exigir: un punto
 * ciego significa por definición que un lado está en cero, así que lo único
 * comprobable es que el otro no sea uno solo. Con un único medio cubriendo, lo
 * que se estaría publicando no es «un lado omite esto» sino «un periódico
 * decidió cubrirlo», que es otra afirmación y mucho más débil.
 */
export const BLINDSPOT_MIN_COBERTURA_LADO = 2;

/** Un espectro se considera omitido si tiene esta cobertura o menos. */
export const BLINDSPOT_MAX_RATIO = 0.15;

/**
 * Desde qué proporción un espectro concentra tanto la cobertura que deja de ser
 * cobertura y pasa a ser énfasis.
 *
 * PEDIDO POR JOSE (2026-07-30): «no solo mostrar ausencia sino exceso o
 * insistencia en divulgación». El punto ciego dice quién NO está contando algo;
 * esto dice quién lo está contando con una intensidad que no comparte nadie más.
 *
 * MEDIDO SOBRE EL CORPUS REAL, y el resultado obliga a ser honesto sobre lo que
 * esta señal aporta. Sobre las 39 historias con 4 medios o más:
 *
 *     umbral   con énfasis   de esos SIN punto ciego
 *      0,40         37                 5
 *      0,50         35                 3
 *      0,60         25                 1
 *      0,70         19                 0
 *
 * Es decir: con 4 a 6 medios por historia, «un lado concentra la cobertura» y
 * «el otro lado está ausente» son casi la misma frase. El énfasis por historia
 * NO es una señal muy independiente del punto ciego, y conviene no venderla como
 * si lo fuera.
 *
 * Se deja en 0,60 porque el caso existe, es correcto y crecerá cuando las
 * historias reúnan más medios. Pero la versión de la idea de Jose que de verdad
 * aporta —«insistencia en divulgación»— no es por historia sino a lo largo del
 * tiempo: un bloque que vuelve una y otra vez sobre el mismo tema. Eso es F1-17
 * y necesita otra medición, no un umbral distinto aquí.
 */
export const ENFASIS_MIN_RATIO = 0.6;

/** Desviación estándar a partir de la cual una historia se marca polarizada. */
export const HIGH_POLARIZATION_STDDEV = 0.25;

export const SPECTRUM = {
    LEFT: 'left',
    CENTER: 'center',
    RIGHT: 'right',
};

/**
 * LA BANDA DEL MEDIO NO SE LLAMA «CENTRO», Y ES UNA DECISIÓN EDITORIAL.
 *
 * Decisión de Jose (2026-07-30): no da por sentado que exista un centro
 * político, y llamar «Centro» a esa banda le atribuye una posición que nadie ha
 * demostrado que exista.
 *
 * También descarta «Objetivo» o «Sin sesgo», que fueron las primeras candidatas,
 * por el motivo contrario: afirman una cualidad que esta medición NO puede
 * sostener. Un valor cerca de cero significa que no detectamos una inclinación
 * consistente, y eso admite lecturas muy distintas —cobertura equilibrada, señal
 * insuficiente, sesgos que se cancelan entre temas, o alineamiento con el poder
 * institucional que no cabe en el eje izquierda-derecha—. Certificar a un medio
 * como «sin sesgo» sería la afirmación más fuerte del sitio y la menos
 * defendible.
 *
 * «Sin línea marcada» dice exactamente lo medido y nada más.
 */
export const SPECTRUM_LABEL = {
    left: 'Izquierda',
    center: 'Sin línea marcada',
    right: 'Derecha',
};

/**
 * Versión corta para donde no cabe la larga: botones de filtro, el eje del
 * panel lateral, leyendas de gráficos. Se declara aquí y no en cada pantalla
 * para que no acabe habiendo cuatro abreviaturas distintas.
 */
export const SPECTRUM_LABEL_SHORT = {
    left: 'Izquierda',
    center: 'Sin línea',
    right: 'Derecha',
};

/** Clasifica un sesgo numérico en uno de los tres espectros. */
export function classifySpectrum(bias) {
    const value = typeof bias === 'number' && Number.isFinite(bias) ? bias : 0;
    if (value <= -SPECTRUM_THRESHOLD) return SPECTRUM.LEFT;
    if (value >= SPECTRUM_THRESHOLD) return SPECTRUM.RIGHT;
    return SPECTRUM.CENTER;
}

/**
 * Etiqueta legible para el sesgo agregado de una historia.
 *
 * «Centro-izquierda» y «Centro-derecha» pasan a «Izquierda moderada» y «Derecha
 * moderada». No es cosmética: si se retira «Centro» como posición, nombrar otras
 * dos bandas EN RELACIÓN a ella la reintroduce por la puerta de atrás. Lo que
 * esas bandas miden es intensidad —una inclinación leve—, y así se dicen.
 */
export function describeBias(bias) {
    const value = typeof bias === 'number' && Number.isFinite(bias) ? bias : 0;
    if (value <= -0.3) return 'Inclinación izquierda';
    if (value < -0.1) return 'Izquierda moderada';
    if (value <= 0.1) return 'Sin línea marcada';
    if (value < 0.3) return 'Derecha moderada';
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
 *   blindspot: null | {spectrum: 'left'|'right', label: string, description: string},
 *   enfasis: null | {spectrum: 'left'|'right', label: string, description: string}
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

    const leftRatio = total ? counts.left / total : 0;
    const rightRatio = total ? counts.right / total : 0;

    let blindspot = null;
    if (!insufficientCoverage) {
        /**
         * La condición que sostiene el umbral de 4: el lado que SÍ cubre tiene
         * que aportar al menos dos medios. Con uno solo, lo que hay no es «un
         * lado omite esto» sino «un periódico decidió cubrirlo».
         */
        if (
            rightRatio <= BLINDSPOT_MAX_RATIO &&
            leftRatio > BLINDSPOT_MAX_RATIO &&
            counts.left >= BLINDSPOT_MIN_COBERTURA_LADO
        ) {
            blindspot = {
                spectrum: SPECTRUM.RIGHT,
                label: 'Punto ciego de la derecha',
                description:
                    `${counts.left + counts.center} de ${total} medios que cubren el hecho ` +
                    `son de izquierda o sin línea marcada. Solo ${counts.right} de derecha lo reportan.`,
            };
        } else if (
            leftRatio <= BLINDSPOT_MAX_RATIO &&
            rightRatio > BLINDSPOT_MAX_RATIO &&
            counts.right >= BLINDSPOT_MIN_COBERTURA_LADO
        ) {
            blindspot = {
                spectrum: SPECTRUM.LEFT,
                label: 'Punto ciego de la izquierda',
                description:
                    `${counts.right + counts.center} de ${total} medios que cubren el hecho ` +
                    `son de derecha o sin línea marcada. Solo ${counts.left} de izquierda lo reportan.`,
            };
        }
    }

    /**
     * PUNTO DE ÉNFASIS: quién cuenta esto con una intensidad que no comparte
     * nadie más.
     *
     * Es el reverso del punto ciego y NO su sinónimo. El punto ciego mira la
     * ausencia; esto mira la concentración. Un hecho cubierto por cuatro medios
     * de derecha y dos de centro tiene énfasis marcado sin que la izquierda esté
     * técnicamente ausente — y ese caso, que es frecuente, no lo veía nadie.
     *
     * Solo se calcula sobre los extremos. Que la mayoría de medios que cubren un
     * hecho no tengan línea marcada es lo normal en este catálogo y no dice nada
     * sobre el hecho; anunciarlo como «énfasis» sería ruido con formato de
     * hallazgo.
     */
    let enfasis = null;
    if (!insufficientCoverage) {
        for (const { espectro, ratio, n } of [
            { espectro: SPECTRUM.LEFT, ratio: leftRatio, n: counts.left },
            { espectro: SPECTRUM.RIGHT, ratio: rightRatio, n: counts.right },
        ]) {
            if (ratio >= ENFASIS_MIN_RATIO && n >= BLINDSPOT_MIN_COBERTURA_LADO) {
                enfasis = {
                    spectrum: espectro,
                    label:
                        espectro === SPECTRUM.LEFT
                            ? 'Énfasis de la izquierda'
                            : 'Énfasis de la derecha',
                    description:
                        `${n} de ${total} medios que cubren el hecho son de ` +
                        `${espectro === SPECTRUM.LEFT ? 'izquierda' : 'derecha'} ` +
                        `(${Math.round(ratio * 100)} %). La cobertura se concentra en un solo lado.`,
                };
                break;
            }
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
        enfasis,
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
