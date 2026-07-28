/**
 * Pruebas de la anotación de tono — tarea F2-09.
 *
 * La primera prueba de este archivo no comprueba una función: comprueba un
 * principio. El módulo al que sustituye, headlineNeutralizerService.js, borraba
 * los adjetivos del titular original por expresión regular y publicaba el
 * resultado atribuido al medio: "Un dramático rescate en el Chocó" salía como
 * "Un rescate en el Chocó", firmado por quien nunca escribió esa frase.
 *
 * La regla que lo reemplazó es que el titular NO SE TOCA: se mide y se anota.
 * Es la clase de regla que se reintroduce sola cuando alguien, con buena
 * intención, quiere "limpiar un poco" el texto antes de mostrarlo. El
 * ROADMAP la marca como no reconsiderable; esta prueba la hace exigible.
 */

import { describe, it, expect } from 'vitest';
import { analyzeHeadlineTone, TONE_LEXICON } from './headlineTone.js';

const LEXICON_TERMS = new Set([
    ...TONE_LEXICON.left,
    ...TONE_LEXICON.right,
    ...TONE_LEXICON.sensational,
]);

/** Todas las cadenas que aparecen en el resultado, a cualquier profundidad. */
function collectStrings(value, found = []) {
    if (typeof value === 'string') found.push(value);
    else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, found));
    else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, found));
    return found;
}

describe('el titular no se toca — el principio, no la implementación', () => {
    const titulares = [
        'Un dramático rescate en el Chocó deja 12 sobrevivientes',
        'ESCANDALOSO: el alarmante despilfarro que nadie quiere explicar',
        'La represión policial durante la protesta, según el informe',
        'Corte Constitucional tumba la reforma pensional',
    ];

    it('no devuelve NINGUNA cadena que no venga del léxico', () => {
        // Es la formulación fuerte del principio. Si alguien añadiera un campo
        // `cleanHeadline`, `neutralized` o similar —da igual cómo lo llame—,
        // esta prueba falla, porque devolvería texto que no está en el léxico.
        for (const titular of titulares) {
            for (const cadena of collectStrings(analyzeHeadlineTone(titular))) {
                expect(LEXICON_TERMS.has(cadena), `"${cadena}" no está en el léxico`).toBe(true);
            }
        }
    });

    it('no devuelve el titular, ni entero ni recortado', () => {
        for (const titular of titulares) {
            const cadenas = collectStrings(analyzeHeadlineTone(titular));
            expect(cadenas).not.toContain(titular);
            // Ni ninguna cadena larga que se le parezca: los términos del
            // léxico son palabras sueltas o pares, nunca una frase.
            for (const cadena of cadenas) {
                expect(cadena.split(/\s+/).length).toBeLessThanOrEqual(2);
            }
        }
    });
});

describe('analyzeHeadlineTone', () => {
    it('detecta carga sensacionalista pese a las tildes y las mayúsculas', () => {
        const resultado = analyzeHeadlineTone('Un DRAMÁTICO y catastrófico giro');

        expect(resultado.sensationalTerms).toContain('dramatico');
        expect(resultado.sensationalTerms).toContain('catastrofico');
        expect(resultado.isNeutral).toBe(false);
        expect(resultado.sensationalScore).toBeGreaterThan(0);
    });

    it('marca como neutro un titular sin términos del léxico', () => {
        const resultado = analyzeHeadlineTone('El Banco de la República mantiene la tasa de interés');

        expect(resultado.isNeutral).toBe(true);
        expect(resultado.ideologicalLean).toBe(0);
        expect(resultado.sensationalScore).toBe(0);
        expect(resultado.leftTerms).toEqual([]);
        expect(resultado.rightTerms).toEqual([]);
    });

    it('orienta la inclinación según el léxico, no según el medio', () => {
        // La señal describe la carga de ESTA frase. Un medio de derecha puede
        // publicar un titular con léxico de izquierda y viceversa; mezclarlo
        // con el sesgo del medio sería contar dos veces la misma cosa.
        expect(analyzeHeadlineTone('El saqueo neoliberal del sistema').ideologicalLean).toBeLessThan(0);
        expect(analyzeHeadlineTone('El populismo y el despilfarro del gobierno').ideologicalLean).toBeGreaterThan(0);
    });

    it('se compensa cuando el titular trae carga de los dos lados', () => {
        const resultado = analyzeHeadlineTone('El populismo responde al saqueo neoliberal');

        expect(resultado.leftTerms.length).toBeGreaterThan(0);
        expect(resultado.rightTerms.length).toBeGreaterThan(0);
        expect(resultado.isNeutral).toBe(false);
    });

    it('mantiene las señales dentro de su rango', () => {
        const cargado = analyzeHeadlineTone(
            'Alarmante, escandaloso, dramatico, desastroso, catastrofico y brutal'
        );

        expect(cargado.sensationalScore).toBeLessThanOrEqual(1);
        expect(cargado.ideologicalLean).toBeGreaterThanOrEqual(-1);
        expect(cargado.ideologicalLean).toBeLessThanOrEqual(1);
    });

    it('devuelve el resultado neutro ante entradas inválidas', () => {
        for (const value of ['', null, undefined, 42, {}]) {
            const resultado = analyzeHeadlineTone(value);
            expect(resultado.isNeutral).toBe(true);
            expect(resultado.sensationalTerms).toEqual([]);
        }
    });

    it('solo coincide con palabras completas', () => {
        // "dictadura" está en el léxico; "dictaduras" o "predictadura" dentro
        // de otra palabra no deben disparar una señal sobre el medio.
        expect(analyzeHeadlineTone('La dictadura del proletariado').rightTerms).toContain('dictadura');
        expect(analyzeHeadlineTone('Un texto sobre lexicografia').isNeutral).toBe(true);
    });
});
