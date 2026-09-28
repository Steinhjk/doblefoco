import { describe, it, expect } from 'vitest';
import { urlSinDatosDelLector } from './analitica.js';

describe('urlSinDatosDelLector', () => {
    it('no manda lo que el lector buscó', () => {
        expect(urlSinDatosDelLector('https://doblefoco.co/buscar?q=Petro%20Uribe')).toBe(
            'https://doblefoco.co/buscar'
        );
    });

    it('quita filtros y ancla, y conserva los utm_*', () => {
        expect(
            urlSinDatosDelLector(
                'https://doblefoco.co/?ambito=regional&utm_source=whatsapp&utm_medium=compartir#x'
            )
        ).toBe('https://doblefoco.co/?utm_source=whatsapp&utm_medium=compartir');
    });

    it('deja intacta la ruta de una noticia', () => {
        const url = 'https://doblefoco.co/noticia/iniciaron-los-conciertos-1yiwah7';
        expect(urlSinDatosDelLector(url)).toBe(url);
    });
});
