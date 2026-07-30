/**
 * Pruebas de la medición de sesgo y cobertura — tarea F2-09.
 *
 * Este módulo es la afirmación más discutible que hace el sitio: decide si una
 * historia tiene un punto ciego, es decir, si acusa a media prensa colombiana
 * de estar omitiendo un hecho. Una regresión aquí no rompe una pantalla:
 * publica una acusación falsa sobre organizaciones reales.
 *
 * Por eso las pruebas no persiguen cobertura de líneas. Persiguen las reglas
 * que costaron caras de aprender, cada una atada a su tarea del ROADMAP.
 */

import { describe, it, expect } from 'vitest';
import {
    analyzeCoverage,
    averageFactuality,
    classifySpectrum,
    describeBias,
    BLINDSPOT_MIN_SOURCES,
    SPECTRUM_THRESHOLD,
} from './biasAnalysis.js';

/** Atajo: construye fuentes con los sesgos dados. */
const sources = (...biases) => biases.map((bias, i) => ({ name: `Medio ${i}`, bias }));

describe('classifySpectrum', () => {
    it('clasifica los tres bloques', () => {
        expect(classifySpectrum(-0.7)).toBe('left');
        expect(classifySpectrum(0)).toBe('center');
        expect(classifySpectrum(0.7)).toBe('right');
    });

    it('trata el umbral como inclusivo hacia los extremos', () => {
        // Exactamente en la frontera cuenta como extremo, no como centro. Es
        // una decisión, no un accidente: si cambia, cambia la clasificación de
        // todos los medios que están justo en ±0.2 y con ella la cobertura de
        // sus historias.
        expect(classifySpectrum(-SPECTRUM_THRESHOLD)).toBe('left');
        expect(classifySpectrum(SPECTRUM_THRESHOLD)).toBe('right');
        expect(classifySpectrum(-SPECTRUM_THRESHOLD + 0.01)).toBe('center');
        expect(classifySpectrum(SPECTRUM_THRESHOLD - 0.01)).toBe('center');
    });

    it('trata como centro cualquier valor que no sea un número finito', () => {
        // El catálogo no debería producir estos valores, pero un feed nuevo o
        // un medio sin clasificar sí. Caer al centro es la degradación
        // correcta: no atribuye una inclinación que nadie ha establecido.
        for (const value of [null, undefined, NaN, Infinity, 'izquierda', {}]) {
            expect(classifySpectrum(value)).toBe('center');
        }
    });
});

describe('analyzeCoverage — el umbral de F1-03', () => {
    it(`no afirma un punto ciego por debajo de ${BLINDSPOT_MIN_SOURCES} fuentes`, () => {
        // Con 5 fuentes, cuatro de izquierda y una de centro, la tentación de
        // gritar "punto ciego de la derecha" es máxima. Y sería ruido: una sola
        // fuente más movería la proporción 20 puntos.
        const result = analyzeCoverage(sources(-0.6, -0.5, -0.4, -0.3, 0));

        expect(result.total).toBe(5);
        expect(result.insufficientCoverage).toBe(true);
        expect(result.blindspot).toBeNull();
    });

    it(`afirma el punto ciego a partir de ${BLINDSPOT_MIN_SOURCES} fuentes`, () => {
        const result = analyzeCoverage(sources(-0.6, -0.5, -0.4, -0.3, 0, 0));

        expect(result.total).toBe(6);
        expect(result.insufficientCoverage).toBe(false);
        expect(result.blindspot).not.toBeNull();
        expect(result.blindspot.spectrum).toBe('right');
    });

    it('no inventa un punto ciego cuando faltan LOS DOS extremos', () => {
        // Seis medios de centro. Ni la izquierda ni la derecha cubren el hecho.
        // Sería falso decir que uno de los dos lo está omitiendo: no hay
        // asimetría, hay un hecho que solo interesó al centro.
        const result = analyzeCoverage(sources(0, 0.1, -0.1, 0, 0.05, -0.05));

        expect(result.insufficientCoverage).toBe(false);
        expect(result.blindspot).toBeNull();
    });

    it('detecta el punto ciego de la izquierda', () => {
        const result = analyzeCoverage(sources(0.6, 0.5, 0.4, 0.3, 0, 0));

        expect(result.blindspot.spectrum).toBe('left');
        expect(result.blindspot.description).toContain('6');
    });
});

describe('analyzeCoverage — separar polarización de media (F1-02)', () => {
    it('no cancela los extremos al medir polarización', () => {
        // ESTE es el fallo que motivó F1-02. La versión anterior resumía la
        // historia en la media de los sesgos: seis medios en polos opuestos
        // daban media ~0, la historia se etiquetaba "Centro" y el filtro
        // "Derecha" devolvía cero resultados sobre 200 noticias.
        const polarizada = analyzeCoverage(sources(-0.8, -0.7, -0.75, 0.8, 0.7, 0.75));

        expect(Math.abs(polarizada.meanBias)).toBeLessThan(0.05);
        expect(polarizada.isHighlyPolarized).toBe(true);
        expect(polarizada.polarization).toBeGreaterThan(0.7);
    });

    it('distingue el consenso real de la polarización', () => {
        // Seis medios de centro también dan media ~0. La diferencia con el caso
        // anterior no está en la media —es la misma— sino en la dispersión.
        const consenso = analyzeCoverage(sources(0, 0.05, -0.05, 0.1, -0.1, 0));

        expect(Math.abs(consenso.meanBias)).toBeLessThan(0.05);
        expect(consenso.isHighlyPolarized).toBe(false);
    });
});

describe('analyzeCoverage — porcentajes', () => {
    it('reparte exactamente 100 puntos, sin sobrantes por redondeo', () => {
        // Tres fuentes reparten 33,33% cada una. Redondear por separado da 99;
        // calcular la tercera como 100−a−b llegó a dar negativos.
        const tercios = analyzeCoverage(sources(-0.5, 0, 0.5));
        const suma = tercios.percentages.left + tercios.percentages.center + tercios.percentages.right;

        expect(suma).toBe(100);
    });

    it('mantiene la suma en repartos irregulares', () => {
        for (const total of [3, 6, 7, 9, 11, 13]) {
            const biases = Array.from({ length: total }, (_, i) => (i % 3 === 0 ? -0.5 : i % 3 === 1 ? 0 : 0.5));
            const { percentages } = analyzeCoverage(sources(...biases));
            const suma = percentages.left + percentages.center + percentages.right;

            expect(suma, `con ${total} fuentes`).toBe(100);
        }
    });

    it('no divide por cero sin fuentes', () => {
        const vacio = analyzeCoverage([]);

        expect(vacio.total).toBe(0);
        expect(vacio.percentages).toEqual({ left: 0, center: 0, right: 0 });
        expect(vacio.dominantSpectrum).toBeNull();
        expect(vacio.blindspot).toBeNull();
        expect(vacio.insufficientCoverage).toBe(true);
    });
});

describe('analyzeCoverage — espectro dominante', () => {
    it('no declara dominante un empate', () => {
        // Empate entre izquierda y derecha: no hay encuadre predominante, y
        // decir que sí lo hay sería elegir uno por desempate arbitrario.
        const empate = analyzeCoverage(sources(-0.5, -0.6, 0.5, 0.6));

        expect(empate.dominantSpectrum).toBeNull();
    });

    it('declara dominante solo al que supera estrictamente a los demás', () => {
        expect(analyzeCoverage(sources(-0.5, -0.6, -0.7, 0.5)).dominantSpectrum).toBe('left');
    });
});

describe('averageFactuality — la constante 0.88 no vuelve (F0-09)', () => {
    it('devuelve null cuando ninguna fuente aporta el dato', () => {
        // El motor anterior fijaba 0.88 para TODAS las historias y la interfaz
        // lo mostraba como "Factualidad IA: 88%": una constante presentada como
        // medición. Ante la ausencia de dato, la respuesta honesta es null.
        expect(averageFactuality([])).toBeNull();
        expect(averageFactuality([{ name: 'Medio' }])).toBeNull();
        expect(averageFactuality([{ factuality: 0 }])).toBeNull();
        expect(averageFactuality([{ factuality: 'alta' }])).toBeNull();
    });

    it('promedia solo las fuentes que sí lo traen', () => {
        expect(averageFactuality([{ factuality: 0.9 }, { factuality: 0.7 }])).toBe(0.8);
        expect(averageFactuality([{ factuality: 0.9 }, { name: 'sin dato' }])).toBe(0.9);
    });
});

describe('describeBias', () => {
    it('cubre la escala sin dejar huecos', () => {
        expect(describeBias(-0.8)).toBe('Inclinación izquierda');
        expect(describeBias(-0.2)).toBe('Izquierda moderada');
        expect(describeBias(0)).toBe('Sin línea marcada');
        expect(describeBias(0.2)).toBe('Derecha moderada');
        expect(describeBias(0.8)).toBe('Inclinación derecha');
    });
});
