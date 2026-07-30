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
        // Con 3 fuentes cualquier proporción es ruido: una sola mueve la
        // cobertura de un espectro 33 puntos.
        const result = analyzeCoverage(sources(-0.6, -0.5, 0));

        expect(result.total).toBe(3);
        expect(result.insufficientCoverage).toBe(true);
        expect(result.blindspot).toBeNull();
    });

    it(`afirma el punto ciego a partir de ${BLINDSPOT_MIN_SOURCES} fuentes`, () => {
        // Cuatro medios: tres de izquierda y uno sin línea marcada. La derecha
        // está en cero y el lado que cubre aporta más de una voz.
        const result = analyzeCoverage(sources(-0.6, -0.5, -0.4, 0));

        expect(result.total).toBe(4);
        expect(result.insufficientCoverage).toBe(false);
        expect(result.blindspot).not.toBeNull();
        expect(result.blindspot.spectrum).toBe('right');
    });

    it('NO lo afirma si el lado que cubre es UN SOLO medio', () => {
        // Es la condición que sostiene el umbral de 4, y la que Jose formuló
        // como «2 de izquierda y 2 de derecha». Un medio de izquierda y tres
        // sin línea marcada: la derecha está en cero, pero lo que hay no es
        // «la derecha omite esto», es «un periódico decidió cubrirlo».
        const result = analyzeCoverage(sources(-0.6, 0, 0.1, -0.05));

        expect(result.total).toBe(4);
        expect(result.insufficientCoverage).toBe(false);
        expect(result.counts.left).toBe(1);
        expect(result.blindspot).toBeNull();
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

/**
 * PUNTOS DE ÉNFASIS — pedidos por Jose el 2026-07-30: «no solo mostrar ausencia
 * sino exceso o insistencia en divulgación».
 *
 * Lo que estas pruebas fijan es que énfasis y punto ciego son señales DISTINTAS
 * y no dos nombres de lo mismo. Si acabaran coincidiendo siempre, la señal nueva
 * no aportaría nada y valdría más retirarla que mantenerla.
 */
describe('analyzeCoverage — puntos de énfasis', () => {
    it('marca énfasis cuando un lado concentra la cobertura', () => {
        // Cuatro de derecha y uno sin línea: el 80 % en un solo lado.
        const result = analyzeCoverage(sources(0.5, 0.4, 0.6, 0.3, 0));

        expect(result.enfasis).not.toBeNull();
        expect(result.enfasis.spectrum).toBe('right');
        expect(result.enfasis.description).toContain('80 %');
    });

    it('HAY énfasis sin que haya punto ciego, y ese es el caso que faltaba', () => {
        // Siete medios: cinco de derecha, uno de izquierda, uno sin línea. La
        // izquierda NO está ausente —cubre el 14 %—, así que no hay punto ciego
        // por poco; pero la cobertura está claramente concentrada.
        const result = analyzeCoverage(sources(0.5, 0.4, 0.6, 0.3, 0.7, -0.5, 0));

        expect(result.counts).toEqual({ left: 1, center: 1, right: 5 });
        expect(result.enfasis?.spectrum).toBe('right');
    });

    it('no marca énfasis cuando la cobertura está repartida', () => {
        const result = analyzeCoverage(sources(-0.5, -0.4, 0, 0.4, 0.5, 0.1));
        expect(result.enfasis).toBeNull();
    });

    it('no marca énfasis del lado «sin línea marcada»', () => {
        // Que la mayoría de medios que cubren un hecho no tengan línea marcada
        // es lo normal en este catálogo y no dice nada sobre el hecho.
        // Anunciarlo sería ruido con formato de hallazgo.
        const result = analyzeCoverage(sources(0, 0.1, -0.1, 0.05, -0.05, 0));
        expect(result.enfasis).toBeNull();
    });

    it('no marca énfasis por debajo del umbral de fuentes', () => {
        const result = analyzeCoverage(sources(0.5, 0.4, 0.6));
        expect(result.insufficientCoverage).toBe(true);
        expect(result.enfasis).toBeNull();
    });

    it('un lado que copa TODO es a la vez énfasis y punto ciego', () => {
        // Las dos señales pueden coincidir, y cuando lo hacen es correcto que
        // las dos se disparen: son afirmaciones distintas sobre el mismo hecho.
        const result = analyzeCoverage(sources(0.5, 0.4, 0.6, 0.3));

        expect(result.enfasis?.spectrum).toBe('right');
        expect(result.blindspot?.spectrum).toBe('left');
    });
});
