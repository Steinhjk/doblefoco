// @ts-check
import { describe, it, expect } from 'vitest';
import {
    VIDA_MEDIA_HORAS,
    factorDeAntiguedad,
    puntuacionDeRelevancia,
    mediosDeHistoria,
    porRelevancia,
    ordenPorRelevanciaSQL,
} from './relevancia.js';

/** Instante fijo para que las pruebas no dependan del reloj. */
const AHORA = Date.parse('2026-08-10T20:00:00Z');
const haceHoras = (h) => new Date(AHORA - h * 3_600_000).toISOString();

describe('factorDeAntiguedad', () => {
    it('vale 1 al publicarse y la mitad tras una vida media', () => {
        expect(factorDeAntiguedad(haceHoras(0), AHORA)).toBe(1);
        expect(factorDeAntiguedad(haceHoras(VIDA_MEDIA_HORAS), AHORA)).toBeCloseTo(0.5, 6);
        expect(factorDeAntiguedad(haceHoras(VIDA_MEDIA_HORAS * 2), AHORA)).toBeCloseTo(0.25, 6);
    });

    it('decae de forma monótona: nada rejuvenece', () => {
        const factores = [0, 1, 6, 24, 48, 96].map((h) => factorDeAntiguedad(haceHoras(h), AHORA));
        for (let i = 1; i < factores.length; i += 1) {
            expect(factores[i]).toBeLessThan(factores[i - 1]);
        }
    });

    /**
     * Una historia sin fecha es un fallo del feed de origen, no una historia
     * vieja. Hundirla la castigaría por un defecto del medio que la publicó.
     */
    it('trata como nueva la historia sin fecha o con fecha ilegible', () => {
        expect(factorDeAntiguedad(null, AHORA)).toBe(1);
        expect(factorDeAntiguedad(undefined, AHORA)).toBe(1);
        expect(factorDeAntiguedad('el martes pasado', AHORA)).toBe(1);
    });

    /**
     * Los feeds traen fechas futuras —husos mal declarados, embargos—. Un
     * exponente negativo convertiría ese error en un empujón hacia la portada.
     */
    it('no premia una fecha en el futuro', () => {
        expect(factorDeAntiguedad(haceHoras(-48), AHORA)).toBe(1);
    });
});

describe('puntuacionDeRelevancia', () => {
    it('conserva el recuento de medios como factor principal', () => {
        expect(puntuacionDeRelevancia({ medios: 8, publishedAt: haceHoras(0) }, AHORA)).toBeCloseTo(8, 6);
        expect(puntuacionDeRelevancia({ medios: 8, publishedAt: haceHoras(24) }, AHORA)).toBeCloseTo(4, 6);
    });

    it('sin medios no hay puntuación, aunque acabe de publicarse', () => {
        expect(puntuacionDeRelevancia({ medios: 0, publishedAt: haceHoras(0) }, AHORA)).toBe(0);
    });

    /**
     * EL CASO QUE MOTIVÓ EL MÓDULO. El 2026-08-10 el radar de la portada
     * mostraba la muerte de Jorge Messi (8 medios, 8 de agosto) por delante del
     * terremoto del Chocó del mismo día. Con vida media de 24 h deja de pasar.
     */
    it('una historia de hace dos días no le gana a la de hoy por un medio más', () => {
        const messi = puntuacionDeRelevancia({ medios: 8, publishedAt: haceHoras(49) }, AHORA);
        const terremoto = puntuacionDeRelevancia({ medios: 7, publishedAt: haceHoras(2) }, AHORA);
        expect(terremoto).toBeGreaterThan(messi);
    });

    /**
     * Y el contrapeso: el decaimiento no puede convertir el sitio en un teletipo.
     * Un solo medio recién publicado no adelanta a ocho de esta mañana.
     */
    it('un medio recién publicado no adelanta a ocho de hace seis horas', () => {
        const suelta = puntuacionDeRelevancia({ medios: 1, publishedAt: haceHoras(0) }, AHORA);
        const cubierta = puntuacionDeRelevancia({ medios: 8, publishedAt: haceHoras(6) }, AHORA);
        expect(cubierta).toBeGreaterThan(suelta);
    });
});

describe('mediosDeHistoria', () => {
    /**
     * Tres caminos traen la historia con tres formas distintas: el motor en
     * memoria con `sources`, la base con `medios` ya agregado, y el cliente
     * normalizado con `coverage.total`. El orden no puede depender del camino.
     */
    it('cuenta lo mismo venga del motor, de la base o del cliente', () => {
        expect(mediosDeHistoria({ sources: [{}, {}, {}] })).toBe(3);
        expect(mediosDeHistoria({ medios: 3 })).toBe(3);
        expect(mediosDeHistoria({ coverage: { total: 3 } })).toBe(3);
    });

    it('devuelve 0 y no revienta con lo que no reconoce', () => {
        expect(mediosDeHistoria(null)).toBe(0);
        expect(mediosDeHistoria({})).toBe(0);
    });
});

describe('porRelevancia', () => {
    it('ordena de más a menos relevante', () => {
        const historias = [
            { id: 'vieja-muy-cubierta', sources: Array(8).fill({}), publishedAt: haceHoras(49) },
            { id: 'nueva-cubierta', sources: Array(7).fill({}), publishedAt: haceHoras(2) },
            { id: 'nueva-suelta', sources: [{}], publishedAt: haceHoras(1) },
        ];

        expect([...historias].sort(porRelevancia(AHORA)).map((h) => h.id))
            .toEqual(['nueva-cubierta', 'vieja-muy-cubierta', 'nueva-suelta']);
    });

    /**
     * Empatadas en cobertura y en hora, gana la que reparte su cobertura entre
     * espectros opuestos: es lo que este sitio existe para enseñar.
     */
    it('desempata por polarización de la cobertura', () => {
        const historias = [
            { id: 'plana', sources: Array(6).fill({}), publishedAt: haceHoras(3), coverage: { polarization: 0.1 } },
            { id: 'partida', sources: Array(6).fill({}), publishedAt: haceHoras(3), coverage: { polarization: 0.6 } },
        ];

        expect([...historias].sort(porRelevancia(AHORA))[0].id).toBe('partida');
    });
});

describe('ordenPorRelevanciaSQL', () => {
    /**
     * No se puede ejecutar Postgres aquí, así que lo que se comprueba es que la
     * expresión lleve la misma vida media que el módulo. Si alguien ajusta la
     * constante y la SQL se queda con la vieja, la base y el cliente ordenarían
     * distinto y la paginación mostraría saltos que nadie sabría explicar.
     */
    it('lleva la misma vida media que la fórmula en JavaScript', () => {
        const sql = ordenPorRelevanciaSQL('count(DISTINCT a.source_id)', 's.published_at');
        expect(sql).toContain(String(VIDA_MEDIA_HORAS));
        expect(sql).toContain('power');
        expect(sql).toContain('count(DISTINCT a.source_id)');
        expect(sql).toContain('s.published_at');
    });

    it('protege la fecha futura igual que la fórmula en JavaScript', () => {
        expect(ordenPorRelevanciaSQL('m', 'f')).toContain('GREATEST');
    });
});
