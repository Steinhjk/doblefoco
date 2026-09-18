// @ts-check
import { describe, it, expect } from 'vitest';
import { MEDIA_REGISTRY } from './mediaRegistry.js';

/**
 * El tipo «no noticioso» (decisión de Jose, 2026-09-16) tiene dos mitades y
 * las dos son fáciles de romper por descuido: quién lo lleva, y qué NO les
 * quita. Salen del mapa mediático porque su producto no es la noticia diaria,
 * pero SIGUEN en la ingesta y en el agrupamiento — quitarle el feed a uno de
 * ellos al editar el registro sería silenciarlo, que es justo lo que la
 * decisión no hace. Las2Orillas y Cambio quedaron FUERA del tipo a propósito.
 */

const NO_NOTICIOSOS_DECIDIDOS = [
    'casa-macondo',
    'volcanicas',
    'revista-raya',
    'voragine',
    'cuestion-publica',
    'razon-publica',
];

describe('el tipo no noticioso', () => {
    const marcados = MEDIA_REGISTRY.filter((m) => m.noNoticioso).map((m) => m.id);

    it('lo llevan exactamente los seis decididos', () => {
        expect(marcados.sort()).toEqual([...NO_NOTICIOSOS_DECIDIDOS].sort());
    });

    it('ninguno de los seis pierde su ingesta: salir del mapa no es callar', () => {
        for (const id of NO_NOTICIOSOS_DECIDIDOS) {
            const medio = MEDIA_REGISTRY.find((m) => m.id === id);
            expect(medio?.feed?.url, `${id} sin feed`).toBeTruthy();
        }
    });

    it('Las2Orillas y Cambio siguen en el mapa a propósito', () => {
        expect(marcados).not.toContain('las2orillas');
        expect(marcados).not.toContain('cambio');
    });
});
