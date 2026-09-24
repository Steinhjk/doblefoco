import { describe, expect, it } from 'vitest';
import { crearCache } from './cacheDeRespuestas.js';

describe('crearCache', () => {
    it('calcula una vez y sirve la copia mientras no caduca', async () => {
        let t = 0;
        const cache = crearCache({ ttlMs: 60_000, ahora: () => t });
        let llamadas = 0;
        const calcular = async () => ++llamadas;

        expect(await cache.obtener('feed', calcular)).toBe(1);
        t = 59_999;
        expect(await cache.obtener('feed', calcular)).toBe(1);
        t = 60_001;
        expect(await cache.obtener('feed', calcular)).toBe(2);
    });

    it('cien peticiones a la vez con la entrada vacía calculan UNA sola vez', async () => {
        // Es la propiedad que importa bajo carga: sin ella, cada caducidad es
        // una estampida contra la base (SIMULACRO_TRAFICO.md).
        const cache = crearCache({ ttlMs: 60_000 });
        let llamadas = 0;
        let soltar;
        const puerta = new Promise((r) => { soltar = r; });
        const calcular = async () => { llamadas += 1; await puerta; return 'datos'; };

        const todas = Array.from({ length: 100 }, () => cache.obtener('portada', calcular));
        soltar();
        const valores = await Promise.all(todas);

        expect(llamadas).toBe(1);
        expect(new Set(valores)).toEqual(new Set(['datos']));
    });

    it('no guarda los errores: la siguiente petición lo vuelve a intentar', async () => {
        const cache = crearCache({ ttlMs: 60_000 });
        let intento = 0;
        const calcular = async () => {
            intento += 1;
            if (intento === 1) throw new Error('la base no contestó');
            return 'bien';
        };

        await expect(cache.obtener('feed', calcular)).rejects.toThrow('la base no contestó');
        expect(await cache.obtener('feed', calcular)).toBe('bien');
    });

    it('con ttlMs = 0 no guarda nada', async () => {
        const cache = crearCache({ ttlMs: 0 });
        let llamadas = 0;
        await cache.obtener('x', async () => ++llamadas);
        await cache.obtener('x', async () => ++llamadas);
        expect(llamadas).toBe(2);
        expect(cache.tamano()).toBe(0);
    });

    it('claves distintas no se pisan', async () => {
        const cache = crearCache({ ttlMs: 60_000 });
        expect(await cache.obtener('feed:100', async () => 'cien')).toBe('cien');
        expect(await cache.obtener('feed:20', async () => 'veinte')).toBe('veinte');
        expect(await cache.obtener('feed:100', async () => 'otra')).toBe('cien');
    });

    it('no crece sin límite con claves sin fin', async () => {
        const cache = crearCache({ ttlMs: 60_000, maxEntradas: 10 });
        for (let i = 0; i < 50; i += 1) await cache.obtener(`k${i}`, async () => i);
        expect(cache.tamano()).toBeLessThanOrEqual(10);
    });

    it('un ttl propio más corto caduca antes', async () => {
        let t = 0;
        const cache = crearCache({ ttlMs: 60_000, ahora: () => t });
        let n = 0;
        await cache.obtener('salud', async () => ++n, 15_000);
        t = 16_000;
        expect(await cache.obtener('salud', async () => ++n, 15_000)).toBe(2);
    });
});
