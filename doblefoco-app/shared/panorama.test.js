// @ts-check
import { describe, it, expect } from 'vitest';
import {
    repartoPorDueno,
    repartoPorEspectro,
    duenosParaLaMitad,
    SIN_DUENO,
} from './panorama.js';

/**
 * Medios reales del catálogo, para que las pruebas usen los grupos de control
 * de verdad y no un doble que podría divergir de ellos en silencio.
 */
const REGISTRO = [
    { id: 'semana', name: 'Semana', shortName: 'Semana', bias: 0.45 },
    { id: 'el-pais-cali', name: 'El País (Cali)', shortName: 'El País Cali', bias: 0.30 },
    { id: 'el-tiempo', name: 'El Tiempo', shortName: 'El Tiempo', bias: 0.05 },
    { id: 'portafolio', name: 'Portafolio', shortName: 'Portafolio', bias: 0.05 },
    { id: 'colombia-informa', name: 'Colombia Informa', shortName: 'Col. Informa', bias: -0.65 },
    // Este NO es real, y por eso está aquí: hace falta un medio sin dueño
    // documentado para probar ese camino, y desde el 2026-08-08 el catálogo ya no
    // tiene ninguno. Antes se usaba `colombia-informa`, que sí lo estaba; atarlo a
    // un medio de verdad hacía que documentarlo rompiera una prueba que no
    // hablaba de él sino del reparto.
    { id: 'medio-sin-ficha', name: 'Medio sin ficha', shortName: 'Sin ficha', bias: 0 },
];

describe('repartoPorDueno', () => {
    it('agrupa los medios por su dueño y los pesa por lo que publican', () => {
        const r = repartoPorDueno(
            [
                { sourceId: 'semana', articulos: 400 },
                { sourceId: 'el-pais-cali', articulos: 200 },
                { sourceId: 'el-tiempo', articulos: 300 },
                { sourceId: 'portafolio', articulos: 100 },
            ],
            REGISTRO
        );

        expect(r.total).toBe(1000);
        expect(r.grupos[0].grupoId).toBe('gilinski');
        expect(r.grupos[0].articulos).toBe(600);
        expect(r.grupos[0].porcentaje).toBe(60);
        expect(r.grupos[0].medios.map((m) => m.id)).toEqual(['semana', 'el-pais-cali']);

        expect(r.grupos[1].grupoId).toBe('sarmiento-aval');
        expect(r.grupos[1].articulos).toBe(400);
    });

    it('NO reparte ni esconde los medios sin propiedad documentada', () => {
        // Repartirlos entre los conocidos inflaría la concentración; ocultarlos
        // haría que los porcentajes no sumaran y nadie sabría por qué.
        const r = repartoPorDueno(
            [
                { sourceId: 'semana', articulos: 50 },
                { sourceId: 'medio-sin-ficha', articulos: 50 },
            ],
            REGISTRO
        );

        expect(r.total).toBe(100);
        const sinDocumentar = r.grupos.find((g) => g.grupoId === SIN_DUENO);
        expect(sinDocumentar).toBeDefined();
        expect(sinDocumentar.articulos).toBe(50);
        expect(r.grupos.reduce((s, g) => s + g.porcentaje, 0)).toBeCloseTo(100);
    });

    it('un medio que no publicó nada no aparece', () => {
        // Aparecer con 0 lo haría contar como voz presente, que es justo lo que
        // el producto tiene que distinguir.
        const r = repartoPorDueno([{ sourceId: 'semana', articulos: 10 }], REGISTRO);
        expect(r.grupos).toHaveLength(1);
        expect(r.grupos[0].medios).toHaveLength(1);
    });

    it('ordena los medios dentro del grupo por peso', () => {
        const r = repartoPorDueno(
            [
                { sourceId: 'semana', articulos: 10 },
                { sourceId: 'el-pais-cali', articulos: 90 },
            ],
            REGISTRO
        );
        expect(r.grupos[0].medios.map((m) => m.id)).toEqual(['el-pais-cali', 'semana']);
    });

    it('aguanta entradas vacías', () => {
        expect(repartoPorDueno([], REGISTRO).total).toBe(0);
        expect(repartoPorDueno(/** @type {any} */ (null), REGISTRO).grupos).toEqual([]);
    });
});

describe('repartoPorEspectro', () => {
    it('contar medios y pesar volumen dan retratos distintos, y ese es el punto', () => {
        // Cifras con la forma de las reales: la izquierda es 1 de 3 medios —un
        // 33 % que suena a catálogo casi equilibrado— y el 1 % de lo publicado.
        const r = repartoPorEspectro(
            [
                { sourceId: 'colombia-informa', articulos: 10 },
                { sourceId: 'semana', articulos: 500 },
                { sourceId: 'el-pais-cali', articulos: 490 },
            ],
            REGISTRO
        );

        const izquierda = r.find((b) => b.id === 'left');
        expect(izquierda.medios).toBe(1);
        expect(izquierda.pctMedios).toBeCloseTo(33.3, 0);
        expect(izquierda.pctVolumen).toBeCloseTo(1, 0);

        const derecha = r.find((b) => b.id === 'right');
        expect(derecha.pctMedios).toBeCloseTo(66.7, 0);
        expect(derecha.pctVolumen).toBeCloseTo(99, 0);
    });

    it('un medio que no publicó no cuenta como voz en ninguna de las dos medidas', () => {
        const r = repartoPorEspectro([{ sourceId: 'semana', articulos: 5 }], REGISTRO);
        expect(r.find((b) => b.id === 'left').medios).toBe(0);
        expect(r.find((b) => b.id === 'right').medios).toBe(1);
    });

    it('devuelve siempre las tres bandas, aunque estén vacías', () => {
        // Una banda que desaparece del gráfico se lee como que no existe, y lo
        // que hay que mostrar es justamente que está vacía.
        const r = repartoPorEspectro([], REGISTRO);
        expect(r.map((b) => b.id)).toEqual(['left', 'center', 'right']);
        expect(r.every((b) => b.articulos === 0)).toBe(true);
    });
});

describe('duenosParaLaMitad', () => {
    it('cuenta cuántos dueños hacen la mitad de lo publicado', () => {
        const reparto = {
            total: 100,
            grupos: [{ articulos: 40 }, { articulos: 30 }, { articulos: 20 }, { articulos: 10 }],
        };
        expect(duenosParaLaMitad(reparto)).toBe(2);
    });

    it('un solo dueño que ya pasa de la mitad devuelve 1', () => {
        expect(duenosParaLaMitad({ total: 100, grupos: [{ articulos: 60 }, { articulos: 40 }] })).toBe(1);
    });

    it('sin datos devuelve 0 en vez de fingir una cifra', () => {
        expect(duenosParaLaMitad({ total: 0, grupos: [] })).toBe(0);
        expect(duenosParaLaMitad(/** @type {any} */ (null))).toBe(0);
    });
});
