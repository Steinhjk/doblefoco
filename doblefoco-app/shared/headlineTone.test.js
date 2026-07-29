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
import { analyzeHeadlineTone, analyzeArticleTone, TONE_LEXICON } from './headlineTone.js';

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

describe('analyzeArticleTone — titular y entradilla (F3-09)', () => {
    it('detecta carga en la entradilla aunque el titular esté limpio', () => {
        // Es la forma de sesgo que justifica la tarea: un medio puede titular
        // de forma impecable y cargar la valoración en la primera línea, que
        // también se lee de un vistazo.
        const r = analyzeArticleTone({
            headline: 'Congreso aprueba la reforma en segundo debate',
            snippet: 'La escandalosa votación se dio tras un debate brutal entre bancadas.',
        });

        expect(r.isNeutral).toBe(false);
        expect(r.soloEnEntradilla).toBe(true);
        expect(r.terminos.map((t) => t.termino).sort()).toEqual(['brutal', 'escandaloso']);
        for (const t of r.terminos) expect(t.donde).toEqual(['entradilla']);
    });

    it('distingue dónde apareció cada término', () => {
        const r = analyzeArticleTone({
            headline: 'Polemico fallo del tribunal',
            snippet: 'Una decision brutal segun los juristas.',
        });

        const porTermino = Object.fromEntries(r.terminos.map((t) => [t.termino, t.donde]));
        expect(porTermino.polemico).toEqual(['titular']);
        expect(porTermino.brutal).toEqual(['entradilla']);
        expect(r.soloEnEntradilla).toBe(false);
    });

    it('un término en ambos sitios se reporta UNA vez, con los dos lugares', () => {
        const r = analyzeArticleTone({
            headline: 'Un fallo brutal',
            snippet: 'El brutal fallo sorprendio a todos.',
        });
        expect(r.terminos).toHaveLength(1);
        expect(r.terminos[0].donde).toEqual(['titular', 'entradilla']);
    });

    it('declara si NO pudo analizar la entradilla, en vez de fingir que estaba limpia', () => {
        // 823 de 3 481 artículos no traen entradilla (Semana y El País Cali no
        // publican ninguna). Decir «no hay carga» sin haber podido mirar sería
        // afirmar algo que no se comprobó.
        const sin = analyzeArticleTone({ headline: 'Titular normal' });
        expect(sin.analizoEntradilla).toBe(false);
        expect(sin.isNeutral).toBe(true);

        const con = analyzeArticleTone({ headline: 'Titular normal', snippet: 'Texto cualquiera.' });
        expect(con.analizoEntradilla).toBe(true);
    });

    it('es neutro cuando no hay nada cargado', () => {
        const r = analyzeArticleTone({
            headline: 'Cámara aprueba el traslado de la sede',
            snippet: 'La votación fue de 98 a favor y 12 en contra.',
        });
        expect(r.isNeutral).toBe(true);
        expect(r.terminos).toEqual([]);
        expect(r.soloEnEntradilla).toBe(false);
    });

    it('no revienta sin argumentos', () => {
        expect(analyzeArticleTone().isNeutral).toBe(true);
        expect(analyzeArticleTone({ headline: null, snippet: null }).isNeutral).toBe(true);
    });

    it('clasifica el tipo de cada término', () => {
        const r = analyzeArticleTone({ headline: 'La dictadura y la represion', snippet: null });
        const tipos = Object.fromEntries(r.terminos.map((t) => [t.termino, t.tipo]));
        expect(tipos.dictadura).toBe('derecha');
        expect(tipos.represion).toBe('izquierda');
    });
});

describe('flexión del español en el léxico (F3-09)', () => {
    // El léxico se escribe en masculino singular, pero el español flexiona.
    // Sin esto se perdía más de la mitad de las coincidencias en silencio: el
    // detector no fallaba, simplemente no encontraba.
    const detecta = (texto) => !analyzeHeadlineTone(texto).isNeutral;

    it('reconoce femenino y plural de los adjetivos en -o', () => {
        for (const t of ['un hecho escandaloso', 'una votacion escandalosa',
                         'unos hechos escandalosos', 'unas cifras escandalosas']) {
            expect(detecta(t), t).toBe(true);
        }
    });

    it('reconoce el plural de los adjetivos en -l', () => {
        expect(detecta('un ataque brutal')).toBe(true);
        expect(detecta('unos ataques brutales')).toBe(true);
    });

    it('reconoce el plural de los adjetivos en -z', () => {
        expect(detecta('un debate feroz')).toBe(true);
        expect(detecta('unos debates feroces')).toBe(true);
    });

    it('reconoce el plural de los sustantivos en -a', () => {
        expect(detecta('la dictadura')).toBe(true);
        expect(detecta('las dictaduras')).toBe(true);
    });

    it('flexiona la ÚLTIMA palabra de un término compuesto', () => {
        expect(detecta('el colapso fiscal')).toBe(true);
        expect(detecta('los colapso fiscales')).toBe(true);
    });

    it('NO flexiona los adverbios en -mente', () => {
        expect(detecta('crecio brutalmente')).toBe(true);
    });

    it('sigue exigiendo palabra completa: no coincide dentro de otra', () => {
        // Prefiere no encontrar algo a encontrar lo que no es. Por eso no se
        // usa stemming: confundiría «represión» con «represivo» y «reprimir».
        expect(detecta('brutalidad policial')).toBe(false);
        expect(detecta('polemizar sobre el tema')).toBe(false);
    });
});
