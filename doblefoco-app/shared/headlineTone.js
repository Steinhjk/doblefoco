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
    sensational: [
        'alarmante', 'escandaloso', 'dramatico', 'desastroso', 'catastrofico',
        'demoledor', 'polemico', 'brutal', 'insolito', 'caotico', 'devastador',
        'fulminante', 'lapidario', 'contundente',
    ],
};

function normalize(text) {
    return text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
}

function findMatches(haystack, terms) {
    return terms.filter((term) => {
        const pattern = new RegExp(`\\b${term.replace(/\s+/g, '\\s+')}\\b`, 'i');
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
