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

import { MEDIA_REGISTRY } from './mediaRegistry.js';

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
 * LA AUSENCIA TIENE QUE SER SORPRENDENTE, NO SOLO UNA AUSENCIA (2026-08-08).
 *
 * POR QUÉ SE AÑADE ESTO. Medido sobre 4 807 historias, la función insignia del
 * producto solo sabía decir una cosa:
 *
 *   puntos ciegos declarados ...... 30 de izquierda, 0 de derecha
 *   tasa base de aparición ........ centro 58,5 % · derecha 42,9 % · izquierda 3,1 %
 *   de las 35 historias con 4+ medios: 33 sin izquierda, 1 sin derecha
 *
 * Es decir: la izquierda falta en el 94 % de las historias evaluables porque
 * publica el 3 % del volumen, no porque decida callar. El aviso estaba midiendo
 * cadencia de publicación y presentándolo como comportamiento editorial. Un
 * lector que ve treinta «punto ciego de la izquierda» y ninguno de la derecha
 * concluye algo que estos datos no sostienen.
 *
 * QUÉ HACE LA CORRECCIÓN. Un espectro ausente solo se señala cuando esa ausencia
 * es IMPROBABLE dada la frecuencia con la que ese espectro aparece en el corpus.
 * Si un espectro está en la fracción `q` de las apariciones, la probabilidad de
 * que no aparezca en una historia cubierta por `n` medios es aproximadamente
 * (1 − q)^n. Se exige que esa probabilidad sea menor que este umbral.
 *
 * CONSECUENCIA, DICHA SIN ADORNOS: con la izquierda en el 3 %, su ausencia no
 * será improbable casi nunca y esos treinta avisos desaparecen. La función pasa
 * a disparar muy poco, y algunos días nada. Es correcto: un punto ciego que se
 * afirma siempre no es un hallazgo, es una constante.
 *
 * El 0,05 es el convenio habitual para «esto no parece azar». No tiene nada de
 * sagrado y está aquí, en una constante, para poder discutirlo.
 */
export const UMBRAL_SORPRESA = 0.05;

/**
 * Medios mínimos para la señal «solo medios con línea marcada».
 *
 * ES UNA CONSTANTE APARTE, Y ESO ES LO IMPORTANTE. `BLINDSPOT_MIN_SOURCES` vale
 * 4 porque Jose lo bajó de 6 el 2026-07-30, y esa decisión sigue en pie para el
 * punto ciego de izquierda y de derecha. Subir aquel a 6 para arreglar esta
 * señal habría deshecho aquella decisión de paso y en silencio.
 *
 * POR QUÉ 6 (2026-08-08, decisión de Jose). Con 4 medios la señal disparó seis
 * veces y dos eran fútbol: un gol de Luis Díaz cubierto por cuatro medios de
 * derecha. Es cierto que solo lo cubrieron medios situados en el eje, y no
 * significa nada: revela qué medios tienen sección de deportes, no un encuadre
 * político. Con 7 medios, en cambio, «Uribe llegó a Cali para la investidura»
 * —todos de derecha, ninguno de orientación mixta— sí dice algo.
 *
 * NO SE EXCLUYE NINGÚN TEMA, Y ESA ES LA GRACIA. La alternativa era restringir
 * la señal a temas políticos, y Jose la descartó por una razón que comparto: un
 * hecho deportivo puede reflejar algo interesante el día menos pensado, y
 * excluirlo por categoría lo dejaría fuera para siempre. Subir el listón de
 * evidencia no excluye al deporte: exige que traiga más pruebas. Si algún día
 * una noticia deportiva reúne seis medios y todos están en el eje, la
 * señal aparecerá.
 */
export const SOLO_EJE_MIN_SOURCES = 6;

/**
 * Probabilidad de que un espectro con frecuencia `q` no aparezca entre `n`
 * medios, si los medios que cubren un hecho fueran independientes de su línea.
 *
 * Es un modelo deliberadamente simple —y por tanto conservador—: supone
 * independencia, que es justo lo que un punto ciego niega. Al suponerla, el
 * modelo hace MÁS difícil declarar un punto ciego, nunca más fácil. Errar hacia
 * callar es lo correcto cuando lo que se afirma es que alguien omitió algo.
 *
 * @param {number} q  fracción de apariciones del espectro en el corpus, [0,1]
 * @param {number} n  medios distintos que cubren el hecho
 */
export function probabilidadDeAusencia(q, n) {
    if (!(q > 0) || !(n > 0)) return 1;
    return (1 - Math.min(q, 1)) ** n;
}

/**
 * MEDIOS DEL CATÁLOGO QUE PODRÍAN HABER CUBIERTO, por espectro.
 *
 * Se cuentan solo los que tienen feed: un medio sin feed no puede aparecer en
 * ninguna historia, así que meterlo en el denominador inventa competidores que
 * no compiten.
 *
 * POR QUÉ ESTE MÓDULO LEE EL REGISTRO EN VEZ DE RECIBIRLO. Rompe la pureza, y
 * se hace a propósito. El fallo que este repositorio ha cometido DOS VECES es
 * un sitio que llama a `analyzeCoverage(sources)` sin pasarle las tasas, con lo
 * que el punto ciego se apaga en silencio y nadie se entera. Un dato que hay
 * que acordarse de pasar es un dato que algún día no se pasa. El catálogo es
 * estático y conocido en tiempo de compilación: no hay razón para pedírselo a
 * quien llama.
 */
let catalogoCache = null;

function catalogo() {
    // PEREZOSO A PROPÓSITO: `classifySpectrum` y `SPECTRUM` se declaran más
    // abajo en este mismo archivo, así que contar al cargar el módulo reventaba
    // con «Cannot access 'SPECTRUM' before initialization». Se cuenta la
    // primera vez que hace falta y se guarda.
    if (catalogoCache) return catalogoCache;
    const conteo = { left: 0, center: 0, right: 0, total: 0 };
    for (const medio of MEDIA_REGISTRY) {
        if (!medio?.feed?.url) continue;
        conteo[classifySpectrum(medio.bias)] += 1;
        conteo.total += 1;
    }
    catalogoCache = conteo;
    return conteo;
}

/** Solo para las pruebas y el panel: qué catálogo está usando el modelo. */
export function catalogoDelModelo() {
    return { ...catalogo() };
}

/**
 * Probabilidad de que NINGÚN medio de un espectro esté entre los `n` que cubren
 * un hecho, si los medios eligieran qué cubrir con independencia de su línea.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUÉ ESTO SUSTITUYE A `(1 − q)^n` (2026-08-25)
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Lo señaló una revisión externa y al comprobarlo tenía razón. La hipótesis
 * nula que este módulo DECLARA es «los medios eligen qué cubrir con
 * independencia de su línea». **Quien elige es el medio, no la aparición.**
 * Pero `q` se estimaba como cuota de APARICIONES en el corpus, y eso mete
 * dentro de la nula dos cosas que no son elección editorial: la cadencia de
 * publicación de cada medio y nuestra propia ventana de retención de 72 h. Un
 * medio que publica dos piezas por semana pesaba órdenes de magnitud menos que
 * uno que publica cien al día, aunque los dos eligieran igual.
 *
 * Con la nula sobre MEDIOS es un sorteo sin reposición: de `total` medios que
 * podían cubrir, `n` cubrieron; ¿qué probabilidad hay de que ninguno de los
 * `delEspectro` esté entre ellos? Es la hipergeométrica:
 *
 *     C(total − delEspectro, n) / C(total, n)
 *
 * QUÉ CAMBIA EN LA PRÁCTICA, medido el 2026-08-25: con la izquierda al 3,29 %
 * de las apariciones, la fórmula vieja exigía **90 medios en una sola historia**
 * y la mayor del corpus tiene 16 — o sea, inalcanzable. Con la nula de catálogo
 * —14 medios de izquierda de 78— el umbral cae a **14 medios**, que sí ocurre.
 *
 * Y ESO NO ES UNA BUENA NOTICIA POR SÍ SOLO, que es lo importante. Está medido
 * que en historias de 10+ medios la izquierda falta el **78 %** de las veces:
 * hacer que la señal dispare sin decir eso convierte la situación por defecto
 * en un titular. Por eso el veredicto viaja con su frecuencia al lado, y por
 * eso el producto declara la rama «no medible» aunque enseñe los casos. La
 * decisión es de Jose, del 2026-08-25: «que diga no medible pero que también
 * muestre los puntos ciegos, puede haber cosas interesantes».
 *
 * @param {number} delEspectro  medios de ese espectro que podían cubrir
 * @param {number} total        medios del catálogo que podían cubrir
 * @param {number} n            medios que efectivamente cubrieron
 */
export function probabilidadDeAusenciaEnCatalogo(delEspectro, total, n) {
    if (!(delEspectro > 0) || !(n > 0) || !(total > 0)) return 1;
    if (n > total - delEspectro) return 0;

    // Se calcula como producto y no con factoriales: C(78, 16) desborda el
    // entero seguro de JavaScript, y con el producto nunca se sale de [0, 1].
    let p = 1;
    for (let i = 0; i < n; i += 1) {
        p *= (total - delEspectro - i) / (total - i);
    }
    return p;
}

/**
 * Cada cuánto falta cada espectro, MEDIDO, en las historias evaluables.
 *
 * Es el número que impide que un punto ciego mienta. Si la izquierda falta en
 * el 78 % de las historias grandes, señalar una concreta no es un hallazgo: es
 * enseñar la norma con nombre propio. Va junto al veredicto para que el lector
 * lo vea a la vez y no en una nota al pie.
 *
 * @param {Array<{sources?: Array<{bias?: number}>}>} historias
 */
export function calcularTasasDeAusencia(historias) {
    const ausente = { left: 0, center: 0, right: 0 };
    let evaluables = 0;

    for (const historia of Array.isArray(historias) ? historias : []) {
        const fuentes = historia?.sources ?? [];
        if (fuentes.length < BLINDSPOT_MIN_SOURCES) continue;
        evaluables += 1;
        const presentes = new Set(fuentes.map((f) => classifySpectrum(f?.bias)));
        for (const espectro of ['left', 'center', 'right']) {
            if (!presentes.has(espectro)) ausente[espectro] += 1;
        }
    }

    if (!evaluables) return { left: null, center: null, right: null, evaluables: 0 };
    return {
        left: ausente.left / evaluables,
        center: ausente.center / evaluables,
        right: ausente.right / evaluables,
        evaluables,
    };
}

/**
 * Con qué frecuencia aparece cada espectro en el corpus.
 *
 * Se cuenta sobre APARICIONES medio-historia, no sobre historias ni sobre
 * medios del catálogo, y la diferencia importa:
 *
 *   · por historias, un espectro que cubre pocas historias pero muchas veces
 *     cada una saldría infravalorado;
 *   · por medios del catálogo daría la composición del registro —la izquierda
 *     es el 23 % de los medios— y no la del material que de verdad circula,
 *     que es el 3 %. La segunda es la que determina si una ausencia sorprende.
 *
 * @param {Array<{sources?: Array<{bias?: number}>}>} historias
 * @returns {{left: number, center: number, right: number}}
 */
export function calcularTasasBase(historias) {
    const conteo = { left: 0, center: 0, right: 0 };
    let total = 0;

    for (const historia of Array.isArray(historias) ? historias : []) {
        for (const fuente of historia?.sources ?? []) {
            const espectro = classifySpectrum(fuente?.bias);
            conteo[espectro] += 1;
            total += 1;
        }
    }

    if (!total) return { left: 0, center: 0, right: 0 };
    return {
        left: conteo.left / total,
        center: conteo.center / total,
        right: conteo.right / total,
    };
}

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
 * ORIENTACIÓN Y SESGO SON DOS COSAS, Y ESTE ARCHIVO SOLO MIDE LA PRIMERA.
 *
 * Decisión de Jose (2026-08-08), y no es un cambio de vocabulario: es la
 * separación de dos conceptos que compartían una palabra y no podían.
 *
 *   ORIENTACIÓN  Propiedad del MEDIO. De dónde viene, a quién responde, qué
 *                considera noticia. Es estructural y permanente. No se mide
 *                contando adjetivos: se documenta. Es lo único que hay hoy.
 *   SESGO        Propiedad de una PIEZA. Qué palabras elige, a quién cita, qué
 *                llama «disturbios» y qué «protesta». Se demuestra frase por
 *                frase — y TODAVÍA NO SE MIDE. Ver DISENO_ALGORITMO_SESGO.md.
 *
 * QUÉ ARREGLA, porque no era solo estética. La interfaz decía «sesgo medio de
 * la cobertura» sobre un número que promedia LA ORIENTACIÓN DECLARADA DE LOS
 * MEDIOS QUE PUBLICARON. Eso afirmaba haber analizado la cobertura cuando lo
 * que hicimos fue promediar quién la firmaba. Dos afirmaciones distintas, y la
 * que se mostraba era la más fuerte de las dos.
 *
 * LA BANDA DEL MEDIO NO SE LLAMA «CENTRO», y esa decisión de Jose (2026-07-30)
 * sigue en pie: no se da por sentado que exista un centro político, y llamar
 * «Centro» a esa banda le atribuye una posición que nadie ha demostrado.
 * Descartadas por el motivo contrario, «Objetivo» y «Sin sesgo»: afirman una
 * cualidad que la medición no sostiene.
 *
 * «SIN LÍNEA MARCADA» PASA A «ORIENTACIÓN MIXTA», y el motivo es que la primera
 * era falsa. Medido el 2026-08-08, seis de los siete medios de esa banda
 * pertenecen a grupos económicos: El Tiempo y Portafolio son de Sarmiento
 * Angulo, Noticias Caracol de los Santo Domingo, La República de Ardila Lülle,
 * Caracol Radio y W Radio de Prisa. **Portafolio y La República son diarios
 * económicos: su línea editorial es el capital, declarada y evidente.** Decir
 * que no tienen línea marcada es el falso balance que este proyecto existe para
 * no hacer.
 *
 * Lo que el número dice de verdad es que su orientación no se sitúa en el eje
 * izquierda-derecha, no que no exista. «Mixta» describe eso. «Sin línea» lo
 * negaba.
 */
export const SPECTRUM_LABEL = {
    left: 'Izquierda',
    center: 'Orientación mixta',
    right: 'Derecha',
};

/**
 * Versión corta para donde no cabe la larga: botones de filtro, el eje del
 * panel lateral, leyendas de gráficos. Se declara aquí y no en cada pantalla
 * para que no acabe habiendo cuatro abreviaturas distintas.
 */
export const SPECTRUM_LABEL_SHORT = {
    left: 'Izquierda',
    center: 'Mixta',
    right: 'Derecha',
};

/** Clasifica una orientación numérica en uno de los tres espectros. */
export function classifySpectrum(bias) {
    const value = typeof bias === 'number' && Number.isFinite(bias) ? bias : 0;
    if (value <= -SPECTRUM_THRESHOLD) return SPECTRUM.LEFT;
    if (value >= SPECTRUM_THRESHOLD) return SPECTRUM.RIGHT;
    return SPECTRUM.CENTER;
}

/**
 * Etiqueta legible para la orientación MEDIA DE LOS MEDIOS que cubrieron una
 * historia.
 *
 * SE LLAMABA `describeBias` Y ERA UN NOMBRE ENGAÑOSO. No describe el sesgo de
 * la historia: promedia la orientación declarada de quienes la publicaron. Con
 * el nombre viejo, un lector del código —y la interfaz, que decía «sesgo medio
 * de la cobertura»— entendía que habíamos analizado los textos. No los
 * analizamos. Mantener el nombre habría dejado la confusión viva en el código
 * después de quitarla de la pantalla.
 *
 * «Centro-izquierda» y «Centro-derecha» pasan a «Izquierda moderada» y «Derecha
 * moderada». No es cosmética: si se retira «Centro» como posición, nombrar otras
 * dos bandas EN RELACIÓN a ella la reintroduce por la puerta de atrás. Lo que
 * esas bandas miden es intensidad —una inclinación leve—, y así se dicen.
 */
export function describirOrientacionMedia(bias) {
    const value = typeof bias === 'number' && Number.isFinite(bias) ? bias : 0;
    if (value <= -0.3) return 'Inclinación izquierda';
    if (value < -0.1) return 'Izquierda moderada';
    if (value <= 0.1) return 'Orientación mixta';
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
export function analyzeCoverage(sources, tasasDeAusencia = null) {
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
    const centerRatio = total ? counts.center / total : 0;

    /**
     * ¿Sorprende que falte este espectro bajo la nula de catálogo?
     *
     * ANTES DEPENDÍA DE QUE QUIEN LLAMA PASARA LAS TASAS, y si no las pasaba el
     * punto ciego se apagaba en silencio. Pasó dos veces. Ya no: el catálogo lo
     * lee este módulo, así que la respuesta no depende de la memoria de nadie.
     *
     * Lo que sigue siendo opcional es el CONTEXTO —cada cuánto falta ese
     * espectro, medido—, y ahí sí se calla cuando no se sabe: una frecuencia
     * inventada sería peor que ninguna.
     */
    const cat = catalogo();
    const sorprende = (espectro) => {
        // NULA DE CATÁLOGO, no de apariciones. El porqué está en
        // `probabilidadDeAusenciaEnCatalogo`. Ya no depende de que quien llama
        // se acuerde de pasar nada: el catálogo lo lee este módulo.
        if (!(cat[espectro] > 0)) return false;
        return probabilidadDeAusenciaEnCatalogo(cat[espectro], cat.total, total) < UMBRAL_SORPRESA;
    };

    /**
     * La frase que impide que el veredicto mienta.
     *
     * Un punto ciego de un espectro minoritario es, casi siempre, la situación
     * por defecto con nombre propio. Enseñarlo sin decir cada cuánto pasa es
     * convertir la norma en titular. Si no hay medida, no se dice nada: una
     * cifra inventada sería peor que el silencio.
     */
    const contextoDe = (espectro) => {
        const tasa = tasasDeAusencia?.[espectro];
        if (typeof tasa !== 'number' || !(tasasDeAusencia?.evaluables > 0)) return null;
        return {
            frecuencia: tasa,
            evaluables: tasasDeAusencia.evaluables,
            /* `esLoNormal` es lo que el producto usa para NO llamarlo hallazgo. */
            esLoNormal: tasa >= 0.5,
        };
    };

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
            counts.left >= BLINDSPOT_MIN_COBERTURA_LADO &&
            sorprende(SPECTRUM.RIGHT)
        ) {
            blindspot = {
                spectrum: SPECTRUM.RIGHT,
                contexto: contextoDe(SPECTRUM.RIGHT),
                label: 'Punto ciego de la derecha',
                description:
                    `${counts.left + counts.center} de ${total} medios que cubren el hecho ` +
                    `son de izquierda o de orientación mixta. Solo ${counts.right} de derecha lo reportan.`,
            };
        } else if (
            leftRatio <= BLINDSPOT_MAX_RATIO &&
            rightRatio > BLINDSPOT_MAX_RATIO &&
            counts.right >= BLINDSPOT_MIN_COBERTURA_LADO &&
            sorprende(SPECTRUM.LEFT)
        ) {
            blindspot = {
                spectrum: SPECTRUM.LEFT,
                contexto: contextoDe(SPECTRUM.LEFT),
                label: 'Punto ciego de la izquierda',
                description:
                    `${counts.right + counts.center} de ${total} medios que cubren el hecho ` +
                    `son de derecha o de orientación mixta. Solo ${counts.left} de izquierda lo reportan.`,
            };
        } else if (
            /**
             * SOLO MEDIOS DE IZQUIERDA Y DERECHA (2026-08-08, decisión de Jose).
             *
             * SE LLAMABA «Solo medios con línea marcada», y ese nombre murió con
             * la separación entre orientación y sesgo: ahora se afirma que TODOS
             * los medios tienen línea editorial, así que distinguir a unos como
             * «los que la tienen» se contradice con el resto del sitio.
             *
             * Lo que la señal dice, dicho bien: el hecho solo interesó a medios
             * cuya orientación SÍ se sitúa en el eje izquierda-derecha, y ninguno
             * de orientación mixta lo cubrió. Con esos en el 54 % de las
             * apariciones, que falten todos es raro y dice algo del hecho.
             *
             * No es un punto ciego y por eso no se llama así: NO afirma que nadie
             * omitiera nada. Y va la ÚLTIMA de las tres a propósito: si alguna
             * vez se pudiera afirmar un punto ciego de izquierda o de derecha,
             * esa afirmación es más fuerte y tiene prioridad.
             */
            total >= SOLO_EJE_MIN_SOURCES &&
            centerRatio <= BLINDSPOT_MAX_RATIO &&
            counts.left + counts.right >= BLINDSPOT_MIN_COBERTURA_LADO &&
            sorprende(SPECTRUM.CENTER)
        ) {
            blindspot = {
                spectrum: SPECTRUM.CENTER,
                contexto: contextoDe(SPECTRUM.CENTER),
                label: 'Solo medios de izquierda y derecha',
                description:
                    `Los ${counts.left + counts.right} de ${total} medios que cubren el hecho ` +
                    'se sitúan en el eje izquierda-derecha. Ninguno de orientación mixta lo reportó.',
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
