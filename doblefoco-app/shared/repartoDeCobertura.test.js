import { describe, it, expect } from 'vitest';
import { fraseDeCobertura, repartoEnPalabras, NOMBRE_DE_BANDA } from './repartoDeCobertura.js';
import { describirCobertura } from '../server/ssr/metadatos.js';
import { textoDeCompartir } from '../src/lib/compartir.js';

describe('reparto de cobertura', () => {
    it('nombra la banda media como el resto del sitio', () => {
        expect(NOMBRE_DE_BANDA.center).toBe('orientación mixta');
        expect(repartoEnPalabras({ left: 2, center: 3, right: 4 })).toBe(
            '2 de izquierda, 3 de orientación mixta, 4 de derecha'
        );
    });

    it('un solo medio va en singular, y el pasado cambia el verbo', () => {
        expect(fraseDeCobertura({ left: 1 })).toBe(
            '1 medio cubre este hecho: 1 de izquierda, 0 de orientación mixta, 0 de derecha'
        );
        expect(fraseDeCobertura({ left: 1, right: 1 }, { pasado: true })).toContain(
            '2 medios cubrieron este hecho'
        );
    });
});

/*
 * LA COSTURA QUE ESTA PRUEBA VIGILA. Quien recibe un enlace lee dos textos a la
 * vez: el mensaje que escribió quien se lo mandó y la tarjeta que se despliega
 * debajo. El primero lo compone el cliente y el segundo el servidor, y hasta el
 * 2026-09-15 no decían lo mismo — uno «de orientación mixta» y otro «de
 * centro»—. Que diverjan no rompe ninguna página, así que solo lo caza una
 * prueba que los ponga uno al lado del otro.
 */
describe('la tarjeta y el mensaje cuentan lo mismo', () => {
    const conteo = { left: 1, center: 10, right: 11 };

    it('el servidor y el cliente describen igual la misma cobertura', () => {
        const delServidor = describirCobertura({ coverage: conteo });
        const delCliente = textoDeCompartir({
            title: 'Da igual el titular',
            coverage: { counts: conteo, total: 22 },
        });

        const frase = fraseDeCobertura(conteo);
        expect(delServidor).toContain(frase);
        expect(delCliente).toContain(frase);
    });

    it('y también cuando la historia está archivada', () => {
        const delServidor = describirCobertura({
            coverage: conteo,
            archivadaEl: '2026-09-01T00:00:00Z',
        });
        const delCliente = textoDeCompartir({
            title: 'Da igual el titular',
            coverage: { counts: conteo, total: 22 },
            archivadaEl: '2026-09-01T00:00:00Z',
        });

        const frase = fraseDeCobertura(conteo, { pasado: true });
        expect(delServidor).toContain(frase);
        expect(delCliente).toContain(frase);
    });
});
