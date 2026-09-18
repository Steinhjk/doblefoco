// @ts-check
import { describe, it, expect } from 'vitest';
import { MEDIA_REGISTRY } from './mediaRegistry.js';
import {
    analyzeCoverage,
    calcularTasasBase,
    calcularTasasDeAusencia,
    catalogoDelModelo,
    classifySpectrum,
    describirOrientacionMedia,
    etiquetaDeEspectro,
    sesgoMedido,
    BLINDSPOT_MIN_SOURCES,
} from './biasAnalysis.js';

/**
 * EL «SIN MEDIR» DEL SESGO (decisión de Jose, 2026-09-16; en código el
 * 2026-09-18).
 *
 * Lo que estas pruebas defienden no es el valor de cuatro medios: es que la
 * ausencia de medición no se convierta otra vez en una afirmación. El defecto
 * que había —`typeof bias === 'number' ? bias : 0`— no fallaba nunca, no
 * escribía nada en ningún registro y colocaba al medio sin medir en la banda
 * mixta, que es la única posición que este proyecto se niega a regalar.
 *
 * Por eso casi todas miran lo mismo desde sitios distintos: si alguien vuelve
 * a poner un `?? 0` en cualquiera de los consumidores, aquí se ve.
 */

const SIN_MEDIR_DECIDIDOS = ['voragine', 'cuestion-publica', 'revista-raya', 'rtvc'];

/** Una fuente con sesgo medido, y otra sin él. */
const medida = (bias, name = `m${bias}`) => ({ name, bias });
const sinMedir = (name) => ({ name, bias: null });

describe('el catálogo declara cuatro medios sin sesgo medido', () => {
    it('son exactamente los cuatro decididos', () => {
        const nulos = MEDIA_REGISTRY.filter((m) => !sesgoMedido(m.bias)).map((m) => m.id);
        expect(nulos.sort()).toEqual([...SIN_MEDIR_DECIDIDOS].sort());
    });

    it('siguen ingiriendo: no medir no es callar', () => {
        for (const id of SIN_MEDIR_DECIDIDOS) {
            const medio = MEDIA_REGISTRY.find((m) => m.id === id);
            expect(medio?.feed?.url, `${id} sin feed`).toBeTruthy();
        }
    });

    it('cada uno dice en su justificación que está sin medir', () => {
        for (const id of SIN_MEDIR_DECIDIDOS) {
            const medio = MEDIA_REGISTRY.find((m) => m.id === id);
            expect(medio?.biasRationale, `${id}`).toContain('SIN MEDIR');
        }
    });

    it('el catálogo del modelo los cuenta aparte, y dentro del total', () => {
        const cat = catalogoDelModelo();
        expect(cat.sinMedir).toBe(SIN_MEDIR_DECIDIDOS.length);
        // En el total porque PUEDEN cubrir: son competidores reales de la nula.
        expect(cat.left + cat.center + cat.right + cat.sinMedir).toBe(cat.total);
    });
});

describe('ningún consumidor los trata como banda mixta', () => {
    it('classifySpectrum devuelve null, no «center»', () => {
        expect(classifySpectrum(null)).toBeNull();
        expect(classifySpectrum(0)).toBe('center');
    });

    it('la etiqueta de pantalla existe y dice lo que es', () => {
        expect(etiquetaDeEspectro(null)).toBe('Sin medir');
        expect(describirOrientacionMedia(null)).toBe('Orientación sin medir');
    });

    it('no suman en el reparto de una historia, pero sí en su cobertura', () => {
        const c = analyzeCoverage([medida(-0.5), medida(0.4), sinMedir('a'), sinMedir('b')]);

        expect(c.total).toBe(4);          // cuatro medios cubren el hecho
        expect(c.medidos).toBe(2);        // dos tienen orientación medida
        expect(c.sinMedir).toBe(2);
        expect(c.counts.center).toBe(0);  // y NINGUNO cayó en la banda mixta
        expect(c.percentages.left + c.percentages.center + c.percentages.right).toBe(100);
    });

    it('la media es null y no 0 cuando nadie aporta sesgo', () => {
        const c = analyzeCoverage([sinMedir('a'), sinMedir('b')]);
        expect(c.meanBias).toBeNull();
        expect(c.polarization).toBe(0);
        expect(c.dominantSpectrum).toBeNull();
    });

    it('no sirven para alcanzar el mínimo con el que se afirma una ausencia', () => {
        const medidas = Array.from({ length: BLINDSPOT_MIN_SOURCES - 1 }, (_, i) =>
            medida(0.3 + i * 0.05, `d${i}`)
        );
        const conRelleno = analyzeCoverage([...medidas, sinMedir('x'), sinMedir('y')]);

        expect(conRelleno.total).toBeGreaterThanOrEqual(BLINDSPOT_MIN_SOURCES);
        expect(conRelleno.insufficientCoverage).toBe(true);
        expect(conRelleno.ausencia).toBeNull();
    });

    it('«solo medios de izquierda y derecha» se calla si alguno está sin medir', () => {
        const ejes = [medida(-0.5, 'i1'), medida(-0.4, 'i2'), medida(0.5, 'd1'), medida(0.4, 'd2'),
            medida(-0.6, 'i3'), medida(0.6, 'd3')];

        const limpia = analyzeCoverage(ejes);
        expect(limpia.ausencia?.label).toBe('Solo medios de izquierda y derecha');

        // El mismo hecho con un medio sin medir: el «solo» sería falso, porque
        // ese medio no es de izquierda ni de derecha.
        const conSinMedir = analyzeCoverage([...ejes, sinMedir('x')]);
        expect(conSinMedir.ausencia?.label).toBe('Sin medios de orientación mixta');
    });

    it('las frases dicen sobre cuántos se cuenta cuando no son todos', () => {
        const ejes = [medida(-0.5, 'i1'), medida(-0.4, 'i2'), medida(0.5, 'd1'), medida(0.4, 'd2'),
            medida(-0.6, 'i3'), medida(0.6, 'd3')];

        // Sin ninguno sin medir, la frase no cambia ni una letra.
        expect(analyzeCoverage(ejes).ausencia?.description)
            .toContain('de 6 medios que cubren el hecho');
        // Con alguno, el denominador es otro y hay que decir cuál: si no, «6 de
        // 7» invita a restar y a creer que el séptimo es de la banda que falta.
        expect(analyzeCoverage([...ejes, sinMedir('x')]).ausencia?.description)
            .toContain('de 6 medios con orientación medida');
    });

    it('las tasas del corpus no los cuentan ni arriba ni abajo', () => {
        const historias = [{ sources: [medida(-0.5), medida(0.4), sinMedir('a')] }];
        const base = calcularTasasBase(historias);
        expect(base.left + base.center + base.right).toBe(1);
        expect(base.center).toBe(0);

        // Y una historia que solo llega al mínimo gracias a ellos no es
        // evaluable: es la misma unidad que `insufficientCoverage`.
        const justas = Array.from({ length: BLINDSPOT_MIN_SOURCES - 1 }, (_, i) =>
            medida(0.3 + i * 0.05, `d${i}`)
        );
        const tasas = calcularTasasDeAusencia([{ sources: [...justas, sinMedir('x')] }]);
        expect(tasas.evaluables).toBe(0);
    });
});
