// @ts-check
import { describe, it, expect } from 'vitest';
import { MEDIA_REGISTRY } from '../../shared/mediaRegistry.js';
import { PAGINAS_ESTATICAS, RUTAS_RENDERIZADAS, metadatosDePagina } from './paginasEstaticas.js';

const SITIO = 'https://doblefoco.co';

describe('RUTAS_RENDERIZADAS', () => {
    it('son las tres que no dependen de la base', () => {
        expect(RUTAS_RENDERIZADAS).toEqual(['/mapa-medios', '/transparencia', '/sobre-nosotros']);
    });

    it('NO incluye la portada', () => {
        // Renderizar `/` aquí rompería obtenerPlantilla(), que pide la raíz al
        // sitio: el servidor se llamaría a sí mismo en bucle. Cuando llegue el
        // turno de la portada hay que cambiar antes de dónde sale la plantilla.
        expect(RUTAS_RENDERIZADAS).not.toContain('/');
    });
});

describe('metadatosDePagina', () => {
    it('cada ruta tiene un título distinto', () => {
        // Tres páginas con el mismo <title> compiten entre sí en el buscador y
        // ninguna gana. Era exactamente el estado anterior: las tres servían la
        // plantilla genérica.
        const titulos = RUTAS_RENDERIZADAS.map(
            (ruta) => metadatosDePagina(ruta, SITIO).match(/<title>([^<]*)<\/title>/)?.[1]
        );
        expect(new Set(titulos).size).toBe(RUTAS_RENDERIZADAS.length);
    });

    it('la canónica apunta al dominio público, no al de la API', () => {
        const html = metadatosDePagina('/mapa-medios', SITIO);
        expect(html).toContain('<link rel="canonical" href="https://doblefoco.co/mapa-medios" />');
        expect(html).not.toContain('fly.dev');
    });

    it('la barra final del sitio no produce una canónica con doble barra', () => {
        const html = metadatosDePagina('/transparencia', 'https://doblefoco.co/');
        expect(html).toContain('href="https://doblefoco.co/transparencia"');
    });

    it('el recuento de medios sale del registro y no está escrito a mano', () => {
        // Si alguien añade un medio, la descripción tiene que moverse sola.
        const html = metadatosDePagina('/mapa-medios', SITIO);
        expect(html).toContain(`${MEDIA_REGISTRY.length} medios colombianos`);
    });

    it('los documentados nunca superan al total', () => {
        const html = metadatosDePagina('/mapa-medios', SITIO);
        const documentados = Number(html.match(/fuentes en (\d+) de ellos/)?.[1]);
        expect(documentados).toBeGreaterThan(0);
        expect(documentados).toBeLessThanOrEqual(MEDIA_REGISTRY.length);
    });

    it('lleva JSON-LD válido y con el tipo de cada página', () => {
        for (const ruta of RUTAS_RENDERIZADAS) {
            const crudo = metadatosDePagina(ruta, SITIO).match(
                /<script type="application\/ld\+json">(.*?)<\/script>/s
            )?.[1];
            expect(crudo).toBeTruthy();
            const datos = JSON.parse(String(crudo).replace(/\\u003c/g, '<'));
            expect(datos['@type']).toBe(PAGINAS_ESTATICAS[ruta].tipoSchema);
            expect(datos.url).toBe(`${SITIO}${ruta}`);
        }
    });

    it('ninguna se marca noindex: son las que queremos que se indexen', () => {
        for (const ruta of RUTAS_RENDERIZADAS) {
            expect(metadatosDePagina(ruta, SITIO)).not.toContain('noindex');
        }
    });

    it('una ruta desconocida falla en vez de servir metadatos vacíos', () => {
        expect(() => metadatosDePagina('/inventada', SITIO)).toThrow(/ficha/);
    });
});
