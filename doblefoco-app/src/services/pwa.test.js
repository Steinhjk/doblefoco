// @ts-check
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SW_PATH = resolve(RAIZ, 'public/sw.js');

/**
 * POR QUÉ ESTE ARCHIVO SE REESCRIBIÓ (2026-08-18).
 *
 * Comprobaba que `sw.js` contuviera la cadena «addEventListener('install'» y
 * que el manifest tuviera ciertas claves. Eso no prueba comportamiento: pasaría
 * igual con un service worker roto, o con uno que sirviera datos de hace una
 * semana como si fueran de ahora.
 *
 * El proyecto ya tenía escrito el estándar, en `.github/workflows/desfase.yml`:
 * «una comprobación que calla cuando no puede comprobar es peor que no tenerla:
 * da confianza sin respaldo».
 *
 * Así que aquí se CARGA el service worker en un entorno falso y se le disparan
 * peticiones, que es la única forma de comprobar lo que de verdad importa: que
 * no sirva datos caducados.
 */

// ── Un entorno de service worker de mentira, con lo justo ────────────────────

/** Caché en memoria con la misma superficie que la CacheStorage real. */
class CacheFalso {
    constructor() {
        this.entradas = new Map();
    }

    async put(request, response) {
        this.entradas.set(claveDe(request), response);
    }

    async match(request) {
        return this.entradas.get(claveDe(request));
    }

    async addAll() {
        /* el precacheo no es lo que se está probando */
    }
}

const claveDe = (request) => (typeof request === 'string' ? request : request.url);

function montarEntorno({ redResponde }) {
    const cache = new CacheFalso();
    const oyentes = {};

    const self = {
        addEventListener: (tipo, fn) => {
            oyentes[tipo] = fn;
        },
        skipWaiting: async () => {},
        clients: { claim: async () => {} },
        caches: {
            open: async () => cache,
            match: async (r) => cache.match(r),
            keys: async () => [],
            delete: async () => true,
        },
    };

    const fetchFalso = async () => {
        if (!redResponde) throw new Error('sin red');
        return new Response(JSON.stringify({ fresco: true }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });
    };

    // El service worker es un script clásico: se evalúa con `self`, `caches` y
    // `fetch` inyectados, igual que hace el navegador.
    const codigo = readFileSync(SW_PATH, 'utf8');
    const cargar = new Function('self', 'caches', 'fetch', 'Response', 'Headers', 'URL', codigo);
    cargar(self, self.caches, fetchFalso, Response, Headers, URL);

    /** Dispara un `fetch` contra el worker y devuelve lo que responde. */
    const pedir = async (url) => {
        let respuesta;
        const evento = {
            request: new Request(url, { method: 'GET' }),
            respondWith: (p) => {
                respuesta = p;
            },
        };
        oyentes.fetch(evento);
        return respuesta;
    };

    return { cache, pedir, oyentes };
}

// ── Las pruebas ──────────────────────────────────────────────────────────────

describe('service worker: el caché no puede mentir sobre la fecha', () => {
    let SW;

    beforeEach(() => {
        SW = readFileSync(SW_PATH, 'utf8');
    });

    it('registra los tres oyentes del ciclo de vida', () => {
        const { oyentes } = montarEntorno({ redResponde: true });
        expect(typeof oyentes.install).toBe('function');
        expect(typeof oyentes.activate).toBe('function');
        expect(typeof oyentes.fetch).toBe('function');
    });

    it('con red, una petición a /api/ va a la red y NO devuelve lo cacheado', async () => {
        const { pedir, cache } = montarEntorno({ redResponde: true });

        await cache.put(
            new Request('https://x.test/api/stories'),
            new Response(JSON.stringify({ viejo: true }), { status: 200 })
        );

        const res = await pedir('https://x.test/api/stories');
        expect(await res.json()).toEqual({ fresco: true });
    });

    it('sin red, sirve la copia reciente', async () => {
        const { pedir, cache } = montarEntorno({ redResponde: false });

        await cache.put(
            new Request('https://x.test/api/stories'),
            new Response(JSON.stringify({ deHaceUnRato: true }), {
                status: 200,
                headers: { 'x-doblefoco-cacheado-el': String(Date.now() - 60_000) },
            })
        );

        const res = await pedir('https://x.test/api/stories');
        expect(await res.json()).toEqual({ deHaceUnRato: true });
    });

    it('SIN RED Y CON LA COPIA CADUCADA, falla en vez de servir datos viejos', async () => {
        // Es la prueba que da sentido al archivo: un agregador que sirve la
        // portada de anteayer como si fuera la de ahora miente sobre lo único
        // que promete.
        const { pedir, cache } = montarEntorno({ redResponde: false });

        await cache.put(
            new Request('https://x.test/api/stories'),
            new Response(JSON.stringify({ deAnteayer: true }), {
                status: 200,
                headers: {
                    'x-doblefoco-cacheado-el': String(Date.now() - 72 * 60 * 60 * 1000),
                },
            })
        );

        await expect(pedir('https://x.test/api/stories')).rejects.toThrow();
    });

    it('una copia SIN fecha tampoco se sirve: lo que no se puede fechar no se publica', async () => {
        const { pedir, cache } = montarEntorno({ redResponde: false });

        await cache.put(
            new Request('https://x.test/api/stories'),
            new Response(JSON.stringify({ sinMarca: true }), { status: 200 })
        );

        await expect(pedir('https://x.test/api/stories')).rejects.toThrow();
    });

    it('guarda con marca de tiempo, para poder caducar la copia después', async () => {
        const { pedir, cache } = montarEntorno({ redResponde: true });

        await pedir('https://x.test/api/panorama');
        const guardada = await cache.match(new Request('https://x.test/api/panorama'));

        expect(guardada).toBeDefined();
        const marca = Number(guardada.headers.get('x-doblefoco-cacheado-el'));
        expect(Number.isFinite(marca)).toBe(true);
        expect(Date.now() - marca).toBeLessThan(5_000);
    });

    it('la ventana de caducidad es explícita y no supera la retención del corpus', () => {
        // El corpus se purga a las 72 h: un caché que durara más serviría piezas
        // que la propia base ya borró.
        const m = SW.match(/MAX_EDAD_API_MS\s*=\s*([^;]+);/);
        expect(m).toBeTruthy();
        // Se multiplican los factores en vez de evaluar la expresión: leer el
        // valor de una constante no justifica ejecutar texto del archivo.
        const factores = m[1].split('*').map((t) => Number(t.trim()));
        expect(factores.every(Number.isFinite)).toBe(true);
        const ventana = factores.reduce((a, b) => a * b, 1);
        expect(ventana).toBeGreaterThan(0);
        expect(ventana).toBeLessThanOrEqual(72 * 60 * 60 * 1000);
    });

    it('el caché cambia de nombre cuando cambia la estrategia', () => {
        // Si la estrategia cambia y el nombre no, los navegadores que ya tienen
        // la versión anterior se quedan con ella: `activate` solo borra las
        // cachés cuyo nombre NO coincide.
        expect(SW).toMatch(/CACHE_NAME\s*=\s*'doblefoco-cache-v[2-9]\d*'/);
    });
});

describe('manifest y enlace en el HTML', () => {
    it('el manifest declara lo que una PWA necesita', () => {
        const manifestPath = resolve(RAIZ, 'public/manifest.json');
        expect(existsSync(manifestPath)).toBe(true);

        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        expect(manifest.name).toContain('DobleFoco');
        expect(manifest.short_name).toBe('DobleFoco');
        expect(manifest.start_url).toBe('/');
        expect(manifest.display).toBe('standalone');
        expect(Array.isArray(manifest.icons)).toBe(true);
        expect(manifest.icons.length).toBeGreaterThan(0);
    });

    it('index.html enlaza el manifest', () => {
        const html = readFileSync(resolve(RAIZ, 'index.html'), 'utf8');
        expect(html).toContain('rel="manifest"');
        expect(html).toContain('href="/manifest.json"');
    });
});
