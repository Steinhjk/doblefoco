// @ts-check
import { describe, it, expect } from 'vitest';
import { hashDelRegistro } from './registroHash.js';
import { MEDIA_REGISTRY } from './mediaRegistry.js';

describe('hashDelRegistro', () => {
    it('es determinista sobre el registro real', () => {
        expect(hashDelRegistro(MEDIA_REGISTRY)).toBe(hashDelRegistro(MEDIA_REGISTRY));
    });

    it('tiene la forma prometida: 12 caracteres hexadecimales', () => {
        expect(hashDelRegistro(MEDIA_REGISTRY)).toMatch(/^[0-9a-f]{12}$/);
    });

    it('cambia si el registro cambia en cualquier cosa', () => {
        // Una copia con UNA propiedad alterada tiene que dar otra huella: si no,
        // el handshake daría por iguales dos catálogos distintos, que es
        // exactamente el desfase que existe para detectar.
        const copia = structuredClone(MEDIA_REGISTRY);
        copia[0].name = copia[0].name + ' (alterado)';
        expect(hashDelRegistro(copia)).not.toBe(hashDelRegistro(MEDIA_REGISTRY));
    });

    it('no depende de la identidad del objeto, solo de su contenido', () => {
        expect(hashDelRegistro(structuredClone(MEDIA_REGISTRY)))
            .toBe(hashDelRegistro(MEDIA_REGISTRY));
    });
});
