// @ts-check
import { describe, it, expect } from 'vitest';
import { resumenDelFeed } from './resumenDelFeed.js';

describe('resumenDelFeed', () => {
    it('el techo de la petición NO se presenta como el total', () => {
        // El fallo original, con las cifras reales del 2026-07-30: se pedían 100
        // y la portada escribía «100 historias con cobertura multifuente».
        const r = resumenDelFeed({ total: 3671, multifuente: 301 }, 100);
        expect(r.multifuente).toBe(301);
        expect(r.seguidas).toBe(3671);
        expect(r.mostradas).toBe(100);
    });

    it('no menciona cuántas se muestran si se muestran todas', () => {
        // Con 12 multifuente y 12 descargadas, «se muestran las 12» es ruido.
        const r = resumenDelFeed({ total: 400, multifuente: 12 }, 12);
        expect(r.mostradas).toBeNull();
        expect(r.multifuente).toBe(12);
    });

    it('no menciona el catálogo cuando todo lo seguido es multifuente', () => {
        // Si coinciden, «301 de 301 seguidas» no añade nada.
        const r = resumenDelFeed({ total: 301, multifuente: 301 }, 100);
        expect(r.seguidas).toBeNull();
    });

    it('sin cifras de la API no se inventa un total', () => {
        // Una API desplegada antes de este cambio no manda `counts`. Se dice solo
        // lo que se sabe: cuántas se descargaron.
        const r = resumenDelFeed({ total: 0, multifuente: 0 }, 100);
        expect(r.hayConteoReal).toBe(false);
        expect(r.multifuente).toBe(100);
        expect(r.seguidas).toBeNull();
        expect(r.mostradas).toBeNull();
    });

    it('aguanta que no llegue nada', () => {
        const r = resumenDelFeed(/** @type {any} */ (undefined), 0);
        expect(r.multifuente).toBe(0);
        expect(r.seguidas).toBeNull();
        expect(r.mostradas).toBeNull();
    });
});
