// @ts-check
/**
 * Medición de carga emocional e ideológica en titulares.
 *
 * Este módulo sustituye a headlineNeutralizerService.js, cuya premisa era
 * equivocada: BORRABA por expresión regular los adjetivos del titular original
 * ("Un dramático rescate en el Chocó" → "Un rescate en el Chocó") y presentaba
 * el resultado como titular del medio. Eso es editar una cita ajena en
 * silencio.
 *
 * El enfoque correcto es el inverso: NO se toca el titular, se ANOTA. El
 * lector ve la frase literal que publicó el medio y, al lado, la señal de qué
 * carga tiene. Así el dato es verificable y la interpretación es explícita.
 */

/**
 * Léxico de términos con carga. Es deliberadamente conservador y auditable:
 * un diccionario que cualquiera puede revisar y discutir, no un modelo opaco.
 *
 * Limitación conocida y asumida: la coincidencia es léxica, no semántica. No
 * detecta ironía ni contexto, y una cita textual dentro del titular cuenta
 * igual que la voz del medio. Por eso el resultado se presenta como "señal",
 * nunca como veredicto.
 */
export const TONE_LEXICON = {
    left: [
        'neoliberal', 'oligarquia', 'saqueo', 'represion', 'precarizacion',
        'pueblo oprimido', 'hegemonia', 'opresion', 'despojo', 'privatizacion',
    ],
    right: [
        'populismo', 'castrochavista', 'despilfarro', 'expropiacion',
        'injerencia', 'dictadura', 'desgobierno', 'colapso fiscal',
        'mermelada', 'clientelismo',
    ],
    /**
     * Registro sensacionalista: adjetivos y adverbios EVALUATIVOS.
     *
     * Esta lista sí se amplió (2026-07-29) y las dos ideológicas NO, y la
     * asimetría es deliberada. Calificar un hecho de «escalofriante» es una
     * elección de registro que cualquiera puede reconocer sin compartir una
     * postura política. Decidir qué palabra es «de izquierda» o «de derecha»
     * es precisamente el juicio que este proyecto no debe imponer: ampliarlas
     * por nuestra cuenta metería nuestro propio sesgo en la herramienta que
     * mide el sesgo ajeno. Se quedan cortas a propósito, hasta que las revise
     * un editor (F1-13).
     *
     * Solo adjetivos y adverbios, NO verbos. «Arremete», «fulmina» o «destroza»
     * son frecuentísimos en titulares colombianos, pero muchas veces describen
     * literalmente lo que pasó. Un adjetivo evaluativo es una opinión del medio;
     * un verbo de acción, a menudo, un hecho.
     *
     * MEDIDO antes de ampliar: el léxico anterior se disparaba en el 0,9% de
     * 3 481 titulares. Un detector que casi nunca detecta no informa de nada, y
     * uno que salta en todo se vuelve ruido que se aprende a ignorar. La cifra
     * después de ampliar está en el ROADMAP (F3-09).
     */
    sensational: [
        'alarmante', 'escandaloso', 'dramatico', 'desastroso', 'catastrofico',
        'demoledor', 'polemico', 'brutal', 'insolito', 'caotico', 'devastador',
        'fulminante', 'lapidario', 'contundente',
        // Añadidos 2026-07-29, mismo criterio: evaluativos, no descriptivos.
        'escalofriante', 'estremecedor', 'aterrador', 'espeluznante', 'macabro',
        'atroz', 'indignante', 'vergonzoso', 'bochornoso', 'inaudito',
        'impactante', 'apabullante', 'arrasador', 'feroz', 'implacable',
        'durisimo', 'tremendo', 'rotundo', 'histerico', 'delirante',
        'escandalosamente', 'brutalmente', 'dramaticamente',
    ],
};

function normalize(text) {
    return text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
}

/**
 * Convierte un término del léxico en un patrón que reconoce sus flexiones.
 *
 * SIN ESTO SE PERDÍA MÁS DE LA MITAD DE LAS COINCIDENCIAS, y en silencio.
 * El léxico está escrito en masculino singular, pero el español flexiona: una
 * «votación escandalosA», unos «hechos brutalES» o unas «cifras devastadorAS»
 * no coincidían con «escandaloso», «brutal» ni «devastador». El detector
 * parecía funcionar —no fallaba, simplemente no encontraba— que es la clase de
 * error más difícil de ver.
 *
 * Las reglas son las de la flexión regular del español, aplicadas a la ÚLTIMA
 * palabra en los términos compuestos («colapso fiscal» → «colapsos fiscales»
 * no; «colapso fiscalES» sí, que es como aparece).
 *
 * Deliberadamente NO se usa lematización ni stemming: un stemmer agresivo
 * confundiría «represión» con «represivo» y con «reprimir», y este léxico se
 * quiere auditable palabra por palabra. Prefiere no encontrar algo a encontrar
 * lo que no es.
 */
function patronDeTermino(term) {
    const partes = term.trim().split(/\s+/);
    const ultima = partes.pop() ?? '';

    let flexionada;
    if (/mente$/.test(ultima)) {
        // Los adverbios en -mente no flexionan.
        flexionada = ultima;
    } else if (/o$/.test(ultima)) {
        flexionada = `${ultima.slice(0, -1)}(?:o|a|os|as)`;
    } else if (/z$/.test(ultima)) {
        // feroz → feroces
        flexionada = `${ultima.slice(0, -1)}(?:z|ces)`;
    } else if (/[aeé]$/.test(ultima)) {
        flexionada = `${ultima}s?`;
    } else if (/[lnrds]$/.test(ultima)) {
        // brutal → brutales, desgobierno ya cubierto arriba
        flexionada = `${ultima}(?:es)?`;
    } else {
        flexionada = ultima;
    }

    return [...partes, flexionada].join('\\s+');
}

function findMatches(haystack, terms) {
    return terms.filter((term) => {
        const pattern = new RegExp(`\\b${patronDeTermino(term)}\\b`, 'i');
        return pattern.test(haystack);
    });
}

/**
 * Analiza la carga de un titular sin modificarlo.
 *
 * @param {string} headline Titular literal del medio.
 * @returns {{
 *   leftTerms: string[],
 *   rightTerms: string[],
 *   sensationalTerms: string[],
 *   ideologicalLean: number,   // [-1, 1] aportado por el LÉXICO, no por el medio
 *   sensationalScore: number,  // [0, 1]
 *   isNeutral: boolean
 * }}
 */
export function analyzeHeadlineTone(headline) {
    const empty = {
        leftTerms: [],
        rightTerms: [],
        sensationalTerms: [],
        ideologicalLean: 0,
        sensationalScore: 0,
        isNeutral: true,
    };

    if (!headline || typeof headline !== 'string') return empty;

    const text = normalize(headline);

    const leftTerms = findMatches(text, TONE_LEXICON.left);
    const rightTerms = findMatches(text, TONE_LEXICON.right);
    const sensationalTerms = findMatches(text, TONE_LEXICON.sensational);

    const lean = Math.max(
        -1,
        Math.min(1, (rightTerms.length - leftTerms.length) * 0.2)
    );

    // A diferencia de la versión anterior, la carga sensacionalista se
    // conserva en el resultado en lugar de calcularse y descartarse.
    const sensationalScore = Math.min(1, sensationalTerms.length * 0.25);

    return {
        leftTerms,
        rightTerms,
        sensationalTerms,
        ideologicalLean: Number(lean.toFixed(2)),
        sensationalScore: Number(sensationalScore.toFixed(2)),
        isNeutral:
            leftTerms.length === 0 &&
            rightTerms.length === 0 &&
            sensationalTerms.length === 0,
    };
}

/**
 * Analiza el titular Y LA ENTRADILLA, diciendo dónde apareció cada término.
 *
 * POR QUÉ HACE FALTA: un medio puede dar un titular impecable y cargar la
 * valoración en la primera línea, que es la que también se lee de un vistazo.
 * Analizar solo el titular deja fuera exactamente esa forma de sesgo — la de
 * cómo se cuenta, no la de qué se titula.
 *
 * Tenemos la entradilla del 76% de los artículos (~194 caracteres): es lo que
 * cada medio publica en su propio canal. NO es el cuerpo del artículo, y no lo
 * será: copiarlo sería redistribuir trabajo ajeno, chocaría con sus términos de
 * uso y contradiría cómo nos presentamos ante ellos.
 *
 * SABER DÓNDE aparece el término no es adorno. «Escandaloso» en el titular es
 * una decisión de portada; en la entradilla, una de redacción. Presentarlas
 * como lo mismo perdería la observación más interesante.
 *
 * @param {{headline?: string|null, snippet?: string|null}} articulo
 */
export function analyzeArticleTone({ headline, snippet } = {}) {
    const enTitular = analyzeHeadlineTone(headline ?? '');
    const enEntradilla = analyzeHeadlineTone(snippet ?? '');

    /** Términos únicos, con dónde se vieron. Uno puede estar en ambos sitios. */
    const porTermino = new Map();
    const registrar = (terminos, tipo, donde) => {
        for (const termino of terminos) {
            const previo = porTermino.get(termino) ?? { termino, tipo, donde: [] };
            if (!previo.donde.includes(donde)) previo.donde.push(donde);
            porTermino.set(termino, previo);
        }
    };

    registrar(enTitular.sensationalTerms, 'sensacional', 'titular');
    registrar(enTitular.leftTerms, 'izquierda', 'titular');
    registrar(enTitular.rightTerms, 'derecha', 'titular');
    registrar(enEntradilla.sensationalTerms, 'sensacional', 'entradilla');
    registrar(enEntradilla.leftTerms, 'izquierda', 'entradilla');
    registrar(enEntradilla.rightTerms, 'derecha', 'entradilla');

    const terminos = [...porTermino.values()];

    return {
        terminos,
        isNeutral: terminos.length === 0,
        /** El titular está limpio pero la entradilla no: el caso interesante. */
        soloEnEntradilla: enTitular.isNeutral && !enEntradilla.isNeutral,
        /** Si no había entradilla, esto NO es un análisis completo y hay que decirlo. */
        analizoEntradilla: Boolean(snippet && String(snippet).trim()),
        titular: enTitular,
        entradilla: enEntradilla,
    };
}
