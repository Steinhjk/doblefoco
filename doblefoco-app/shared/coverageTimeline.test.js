// @ts-check
import { describe, it, expect } from 'vitest';
import { buildCoverageTimeline, retrasoDelEspectro } from './coverageTimeline.js';

const art = (source_id, bias, hora, extra = {}) => ({
    source_id,
    outlet: source_id,
    domain: `${source_id}.com`,
    bias,
    headline: `titular de ${source_id}`,
    canonical_url: `https://${source_id}.com/n`,
    published_at: hora,
    ...extra,
});

// Sesgos: -0.5 izquierda, 0 centro, 0.5 derecha (umbral 0.2).
const T = (h) => `2026-07-29T${String(h).padStart(2, '0')}:00:00.000Z`;

describe('buildCoverageTimeline (F3-08)', () => {
    it('ordena los medios por su primera publicación', () => {
        const l = buildCoverageTimeline([
            art('semana', 0.5, T(14)),
            art('eltiempo', 0, T(9)),
            art('elespectador', -0.5, T(11)),
        ]);
        expect(l?.entradas.map((e) => e.outlet)).toEqual(['eltiempo', 'elespectador', 'semana']);
    });

    it('un medio entra con su artículo MÁS ANTIGUO, no con el último', () => {
        // Si publicó a las 8 y amplió a las 20, entró a las 8. Usar el más
        // reciente daría el orden al revés: los medios que más siguen un tema
        // aparecerían como los últimos en llegar.
        const l = buildCoverageTimeline([
            art('eltiempo', 0, T(20)),
            art('eltiempo', 0, T(8)),
            art('semana', 0.5, T(12)),
        ]);
        expect(l?.entradas[0].outlet).toBe('eltiempo');
        expect(l?.entradas[0].at).toBe(T(8));
        expect(l?.entradas).toHaveLength(2);
    });

    it('registra cuándo entró cada espectro', () => {
        const l = buildCoverageTimeline([
            art('semana', 0.5, T(9)),
            art('eltiempo', 0, T(13)),
            art('elespectador', -0.5, T(17)),
        ]);
        expect(l?.porEspectro).toEqual({ right: T(9), center: T(13), left: T(17) });
        expect(l?.ordenEspectros).toEqual(['right', 'center', 'left']);
    });

    it('deja en null el espectro que NO ha cubierto el hecho', () => {
        // El null es información, no un hueco: significa que nadie de esa banda
        // lo ha cubierto. Es el producto.
        const l = buildCoverageTimeline([art('semana', 0.5, T(9)), art('eltiempo', 0, T(10))]);
        expect(l?.porEspectro.left).toBeNull();
        expect(l?.ordenEspectros).not.toContain('left');
    });

    it('NO coloca en la línea a los medios sin fecha: los cuenta aparte', () => {
        // Ponerlos «al principio» o «al final» inventaría un orden que no
        // conocemos, y el orden es lo único que esta vista afirma.
        const l = buildCoverageTimeline([
            art('eltiempo', 0, T(9)),
            art('sinhora', 0.5, null),
            art('otrosinhora', -0.5, 'fecha inválida'),
        ]);
        expect(l?.entradas).toHaveLength(1);
        expect(l?.mediosSinFecha).toBe(2);
    });

    it('un medio con fecha en un artículo y sin ella en otro SÍ queda situado', () => {
        const l = buildCoverageTimeline([
            art('eltiempo', 0, null),
            art('eltiempo', 0, T(9)),
        ]);
        expect(l?.entradas).toHaveLength(1);
        expect(l?.mediosSinFecha).toBe(0);
    });

    it('calcula la duración de la cobertura en horas', () => {
        const l = buildCoverageTimeline([art('a', 0, T(9)), art('b', 0, T(15))]);
        expect(l?.duracionHoras).toBe(6);
    });

    it('devuelve null sin artículos', () => {
        expect(buildCoverageTimeline([])).toBeNull();
        expect(buildCoverageTimeline(/** @type {any} */ (null))).toBeNull();
    });

    it('sobrevive a que NINGÚN artículo tenga fecha', () => {
        const l = buildCoverageTimeline([art('a', 0, null), art('b', 0.5, null)]);
        expect(l?.entradas).toEqual([]);
        expect(l?.primeraAt).toBeNull();
        expect(l?.mediosSinFecha).toBe(2);
    });

    it('acepta objetos con `name` en vez de `outlet`', () => {
        const l = buildCoverageTimeline([
            { source_id: 'x', name: 'El Tiempo', bias: 0, published_at: T(9) },
        ]);
        expect(l?.entradas[0].outlet).toBe('El Tiempo');
    });
});

describe('retrasoDelEspectro (F3-08)', () => {
    const linea = buildCoverageTimeline([
        art('semana', 0.5, T(9)),
        art('eltiempo', 0, T(13)),
    ]);

    it('mide el retraso respecto al primero que entró', () => {
        expect(retrasoDelEspectro(/** @type {any} */ (linea), 'right')).toBe(0);
        expect(retrasoDelEspectro(/** @type {any} */ (linea), 'center')).toBe(4);
    });

    it('devuelve null para un espectro que no ha entrado', () => {
        expect(retrasoDelEspectro(/** @type {any} */ (linea), 'left')).toBeNull();
    });
});
