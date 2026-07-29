// @ts-check
import { describe, it, expect } from 'vitest';
import { parsePublishedAt } from './ingestDaemon.js';

/**
 * La fecha del feed es un dato que declara el medio y que nadie comprueba. Estas
 * pruebas fijan qué se acepta de él, porque de ese valor depende el orden de la
 * portada entera.
 */
describe('parsePublishedAt', () => {
    const AHORA = Date.parse('2026-07-29T23:00:00.000Z');

    it('acepta la fecha del feed cuando es plausible', () => {
        expect(parsePublishedAt({ isoDate: '2026-07-29T22:00:00.000Z' }, AHORA))
            .toBe('2026-07-29T22:00:00.000Z');
    });

    it('prefiere isoDate a pubDate cuando vienen los dos', () => {
        const item = { isoDate: '2026-07-29T22:00:00.000Z', pubDate: 'Wed, 29 Jul 2026 12:00:00 GMT' };
        expect(parsePublishedAt(item, AHORA)).toBe('2026-07-29T22:00:00.000Z');
    });

    it('DESCARTA una fecha en el futuro', () => {
        // El caso real: La Opinión entregó el 2026-07-29 dos artículos fechados
        // a las 09:00 del día siguiente. El feed ordena por published_at DESC, y
        // se quedaron encabezando la portada hasta que el reloj los alcanzara.
        expect(parsePublishedAt({ isoDate: '2026-07-30T09:00:00.000Z' }, AHORA)).toBeNull();
    });

    it('tolera la deriva razonable entre relojes', () => {
        // Diez minutos por delante es un reloj mal puesto, no una publicación
        // programada. Descartarlo perdería fechas buenas sin motivo.
        const diezMinutos = new Date(AHORA + 10 * 60 * 1000).toISOString();
        expect(parsePublishedAt({ isoDate: diezMinutos }, AHORA)).toBe(diezMinutos);
    });

    it('corta pasado el margen de media hora', () => {
        const treintaYUno = new Date(AHORA + 31 * 60 * 1000).toISOString();
        expect(parsePublishedAt({ isoDate: treintaYUno }, AHORA)).toBeNull();
    });

    it('devuelve null sin fecha o con una ilegible', () => {
        expect(parsePublishedAt({}, AHORA)).toBeNull();
        expect(parsePublishedAt({ pubDate: 'el martes pasado' }, AHORA)).toBeNull();
        expect(parsePublishedAt(null, AHORA)).toBeNull();
    });

    it('acepta una fecha vieja: la retención es asunto de otro sitio', () => {
        // Descartar aquí lo antiguo escondería el motivo real por el que un
        // artículo desaparece. De la ventana de 72 h se encarga pruneArticles.
        expect(parsePublishedAt({ isoDate: '2020-01-01T00:00:00.000Z' }, AHORA))
            .toBe('2020-01-01T00:00:00.000Z');
    });
});
