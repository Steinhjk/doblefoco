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
    SOLO_LINEA_MARCADA_MIN_SOURCES,
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

/**
 * Tasas base de referencia para las pruebas del punto ciego.
 *
 * Desde 2026-08-08 un punto ciego solo se afirma cuando la ausencia es
 * improbable DADA la frecuencia con la que ese espectro aparece en el corpus.
 * Estas pruebas usan un corpus imaginario equilibrado —un tercio cada
 * espectro— para comprobar la lógica del umbral sin que la mida el
 * desequilibrio real. El comportamiento con el corpus REAL se prueba aparte,
 * más abajo, y es el que importa para el producto.
 */
const EQUILIBRADO = { left: 1 / 3, center: 1 / 3, right: 1 / 3 };

describe('analyzeCoverage — el umbral de F1-03', () => {
    it(`no afirma un punto ciego por debajo de ${BLINDSPOT_MIN_SOURCES} fuentes`, () => {
        // Con 3 fuentes cualquier proporción es ruido: una sola mueve la
        // cobertura de un espectro 33 puntos.
        const result = analyzeCoverage(sources(-0.6, -0.5, 0));

        expect(result.total).toBe(3);
        expect(result.insufficientCoverage).toBe(true);
        expect(result.blindspot).toBeNull();
    });

    it(`${BLINDSPOT_MIN_SOURCES} fuentes ya no bastan: la ausencia tiene que sorprender`, () => {
        // Cuatro medios: tres de izquierda y uno sin línea marcada. Cumple todas
        // las condiciones ANTERIORES —cuatro fuentes, la derecha en cero, el
        // lado que cubre con más de una voz— y aun así NO se afirma nada.
        //
        // Con los tres espectros a un tercio cada uno, que falte uno entre
        // cuatro medios ocurre por azar el 20 % de las veces: (2/3)⁴ = 0,198.
        // Llamar «punto ciego» a algo que pasa una de cada cinco veces es acusar
        // a alguien de omitir cuando lo que hubo fue una moneda.
        const result = analyzeCoverage(sources(-0.6, -0.5, -0.4, 0), EQUILIBRADO);

        expect(result.total).toBe(4);
        expect(result.insufficientCoverage).toBe(false);
        expect(result.blindspot).toBeNull();
    });

    it('lo afirma cuando hay medios suficientes para que la ausencia sea rara', () => {
        // Ocho medios y ninguno de derecha. Con un tercio de tasa base,
        // (2/3)⁸ = 0,039: por debajo del 5 %. Ahí sí se puede afirmar.
        const result = analyzeCoverage(
            sources(-0.6, -0.5, -0.4, -0.3, 0, 0.1, -0.05, 0.05),
            EQUILIBRADO
        );

        expect(result.counts.right).toBe(0);
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

    it('detecta el punto ciego de la izquierda cuando la ausencia es improbable', () => {
        const result = analyzeCoverage(
            sources(0.6, 0.5, 0.4, 0.3, 0.35, 0.45, 0, 0),
            EQUILIBRADO
        );

        expect(result.blindspot.spectrum).toBe('left');
        expect(result.blindspot.description).toContain('8');
    });
});

/**
 * EL CORPUS REAL, QUE ES LO QUE DECIDE SI EL PRODUCTO MIENTE.
 *
 * Medido el 2026-08-08 sobre 4 807 historias: la izquierda aparece en el 3,1 %
 * de ellas, el centro en el 58,5 % y la derecha en el 42,9 %. Con ese reparto,
 * el sitio llevaba declarados 30 puntos ciegos de izquierda y CERO de derecha.
 *
 * Estas pruebas fijan la corrección para que no se pueda deshacer sin darse
 * cuenta: son la diferencia entre señalar un silencio y publicar una acusación
 * que solo refleja cuánto publica cada quien.
 */
describe('analyzeCoverage — el punto ciego contra el desequilibrio real', () => {
    const REAL = { left: 0.031, center: 0.585, right: 0.429 };

    it('NO acusa a la izquierda de omitir: con el 3 % su ausencia es lo normal', () => {
        // Ocho medios, ninguno de izquierda. Antes esto era un punto ciego.
        // Ahora no: con la izquierda apareciendo en el 3 % de las historias,
        // (1−0,031)⁸ = 0,78. Su ausencia es lo esperable en cuatro de cada cinco
        // historias, así que no dice nada sobre lo que la izquierda decidió.
        const result = analyzeCoverage(
            sources(0.6, 0.5, 0.4, 0.3, 0.35, 0.45, 0, 0),
            REAL
        );

        expect(result.counts.left).toBe(0);
        expect(result.blindspot).toBeNull();
    });

    it('SÍ puede acusar a la derecha, que aparece en el 43 %', () => {
        // Seis medios y ninguno de derecha: (1−0,429)⁶ = 0,035, por debajo del
        // 5 %. Aquí la ausencia sí es rara y merece señalarse. Que el aviso
        // pueda apuntar a los dos lados es lo que lo convierte en una medición
        // en vez de en una constante.
        const result = analyzeCoverage(sources(-0.6, -0.5, -0.4, -0.3, 0, 0), REAL);

        expect(result.counts.right).toBe(0);
        expect(result.blindspot).not.toBeNull();
        expect(result.blindspot.spectrum).toBe('right');
    });

    it('señala cuando SOLO cubrieron medios con línea marcada', () => {
        // Siete medios de derecha y ninguno sin línea. Es el caso real que la
        // motivó: «Uribe llegó a Cali para la investidura», 7 medios, 0 sin
        // línea marcada.
        //
        // No afirma que nadie omitiera nada: describe que el hecho solo interesó
        // a medios con posición declarada.
        const result = analyzeCoverage(sources(0.6, 0.5, 0.4, 0.3, 0.35, 0.45, 0.55), REAL);

        expect(result.counts.center).toBe(0);
        expect(result.blindspot?.spectrum).toBe('center');
        expect(result.blindspot.label).toBe('Solo medios con línea marcada');
    });

    it(`no la señala por debajo de ${SOLO_LINEA_MARCADA_MIN_SOURCES} medios`, () => {
        // Cuatro medios de derecha: cumple la prueba estadística —(1−0,585)⁴ =
        // 0,029— y aun así no se afirma. Con cuatro, la señal disparaba en
        // noticias de fútbol donde la composición no dice nada del encuadre.
        //
        // OJO: no se excluye el deporte, se exige más evidencia. Estos mismos
        // cuatro medios con dos más habrían disparado la señal.
        const result = analyzeCoverage(sources(0.6, 0.5, 0.4, 0.3), REAL);

        expect(result.counts.center).toBe(0);
        expect(result.blindspot).toBeNull();
    });

    it('el umbral de 4 sigue en pie para izquierda y derecha', () => {
        // La constante de esta señal es APARTE a propósito: BLINDSPOT_MIN_SOURCES
        // vale 4 por decisión del 2026-07-30 y no se toca. Con seis medios de
        // izquierda y ninguno de derecha, el punto ciego de derecha se afirma
        // sin necesitar el umbral más alto.
        const result = analyzeCoverage(sources(-0.6, -0.5, -0.4, -0.3, 0, 0), REAL);

        expect(BLINDSPOT_MIN_SOURCES).toBe(4);
        expect(result.blindspot?.spectrum).toBe('right');
    });

    it('sin tasas base no afirma nada, en vez de suponerlas', () => {
        // Fallar cerrado: quien llame sin decir cada cuánto aparece cada
        // espectro no obtiene una acusación por omisión.
        const result = analyzeCoverage(sources(0.6, 0.5, 0.4, 0.3, 0.35, 0.45, 0, 0));

        expect(result.blindspot).toBeNull();
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
        const result = analyzeCoverage(sources(0.5, 0.4, 0.6, 0.3, 0), EQUILIBRADO);

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
        //
        // Hacen falta ocho medios y no cuatro desde que el punto ciego exige que
        // la ausencia sea improbable. El énfasis NO cambió: con cuatro de un
        // solo lado ya se dispara. Que una señal necesite más pruebas que la
        // otra es correcto —el énfasis describe lo que hay, el punto ciego acusa
        // de lo que falta— y es justamente por qué conviene no confundirlas.
        const result = analyzeCoverage(
            sources(0.5, 0.4, 0.6, 0.3, 0.55, 0.45, 0.35, 0.25),
            EQUILIBRADO
        );

        expect(result.enfasis?.spectrum).toBe('right');
        expect(result.blindspot?.spectrum).toBe('left');
    });
});
