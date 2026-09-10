// @ts-check
import { describe, it, expect } from 'vitest';
import { MEDIA_REGISTRY } from '../../shared/mediaRegistry.js';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    PAGINAS_ESTATICAS,
    REDIRECCIONES_PERMANENTES,
    RUTAS_RENDERIZADAS,
    metadatosDePagina,
} from './paginasEstaticas.js';

const SITIO = 'https://doblefoco.co';
const COLOMBIANOS = MEDIA_REGISTRY.filter((m) => m.country === 'CO');

describe('RUTAS_RENDERIZADAS', () => {
    it('son las que no dependen de la base', () => {
        expect(RUTAS_RENDERIZADAS).toEqual([
            '/mapa-medios',
            '/transparencia',
            '/transparencia/sobre-nosotros',
            '/transparencia/clasificacion',
            '/transparencia/dinero',
            '/transparencia/datos',
            '/transparencia/limitaciones',
        ]);
    });

    it('NO renderiza la ruta vieja de sobre-nosotros', () => {
        // Es una redirección permanente desde el 2026-08-09. Si el servidor la
        // renderizara además, el mismo contenido viviría en dos direcciones y el
        // buscador tendría que elegir una — que es justo lo que penaliza.
        expect(RUTAS_RENDERIZADAS).not.toContain('/sobre-nosotros');
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
        expect(html).toContain(`${COLOMBIANOS.length} medios colombianos`);
    });

    it('cuenta SOLO los colombianos, que es lo que la página enseña', () => {
        // Desde el 2026-08-07 MediaMap pinta únicamente medios de Colombia. Si
        // la descripción contara los 43 del registro, prometería en el buscador
        // un mapa más grande que el que se ve al entrar.
        expect(COLOMBIANOS.length).toBeLessThan(MEDIA_REGISTRY.length);
        expect(metadatosDePagina('/mapa-medios', SITIO))
            .not.toContain(`${MEDIA_REGISTRY.length} medios colombianos`);
    });

    it('los documentados nunca superan al total', () => {
        const html = metadatosDePagina('/mapa-medios', SITIO);
        const documentados = Number(html.match(/fuentes en (\d+) de ellos/)?.[1]);
        expect(documentados).toBeGreaterThan(0);
        expect(documentados).toBeLessThanOrEqual(COLOMBIANOS.length);
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


/**
 * LO QUE EL SERVIDOR RENDERIZA TIENE QUE LLEGARLE, Y ESO LO DECIDE OTRO ARCHIVO.
 *
 * POR QUÉ EXISTE ESTA PRUEBA (2026-09-02). El 2026-08-09 se partió
 * `/transparencia` en cinco sub-páginas «para que cada tema gane su propio
 * título y su propia descripción, que es lo que un buscador puede mostrar a
 * quien pregunta justo por eso» —el comentario sigue ahí—. El servidor las
 * renderizaba, el sitemap las anunciaba… y `vercel.json` nunca se las pedía:
 * caían en el catch-all y se servían con el título genérico del sitio. Medido
 * en producción el 2026-09-02, las cinco. Casi un mes sirviendo la página
 * correcta con la etiqueta equivocada, sin que nada fallara.
 *
 * Dos artefactos declarativos nuestros que pueden divergir en silencio: el
 * mismo caso que `schema.test.js` con el .sql, y se comprueba igual, leyendo
 * los dos y comparándolos.
 */
describe('el enrutamiento de Vercel y las rutas que el servidor renderiza', () => {
    const vercel = JSON.parse(
        readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../vercel.json'), 'utf8')
    );

    /** Qué hace Vercel con una ruta: gana el PRIMER rewrite que casa, como allí. */
    const destinoDe = (ruta) => {
        for (const r of vercel.rewrites) {
            if (new RegExp(`^${r.source}$`).test(ruta)) return r.destination;
        }
        return null;
    };

    it('cada ruta renderizada llega al motor y no al index.html', () => {
        for (const ruta of RUTAS_RENDERIZADAS) {
            expect(destinoDe(ruta), `«${ruta}» no llega al motor`).toMatch(/^https:\/\/api\.doblefoco\.co/);
        }
    });

    it('el catch-all va el último: si subiera, se comería todo lo anterior', () => {
        const ultimo = vercel.rewrites[vercel.rewrites.length - 1];
        expect(ultimo.destination).toBe('/index.html');
    });

    it('cada dirección vieja redirige de forma permanente y NO se reescribe al motor', () => {
        // Se retiró de las páginas renderizadas el 2026-08-09 y el rewrite se
        // quedó apuntando al motor: el visitante recibía un 404 mientras el
        // cliente creía estar redirigiendo. La redirección la tiene que hacer
        // quien atiende la petición, no el JavaScript que nunca llega a correr.
        //
        // Se recorre la TABLA y no una ruta escrita a mano: la lista de
        // direcciones viejas solo crece, y una prueba que nombra una sola deja
        // de vigilar en cuanto se añada la segunda.
        for (const [vieja, nueva] of Object.entries(REDIRECCIONES_PERMANENTES)) {
            expect(RUTAS_RENDERIZADAS).not.toContain(vieja);
            expect(destinoDe(vieja)).toBe('/index.html');

            const redir = (vercel.redirects ?? []).find((r) => r.source === vieja);
            expect(redir, `falta la redirección de ${vieja} en vercel.json`).toBeDefined();
            expect(redir.destination).toBe(nueva);
            expect(redir.permanent).toBe(true);
        }
    });

    it('el motor contesta lo mismo que Vercel, y no un 404', () => {
        /*
         * MEDIDO EL 2026-09-08, y la minuta lo contaba peor de lo que era: la
         * ruta del lector —`doblefoco.co/sobre-nosotros`— nunca estuvo rota,
         * daba 308 y luego 200. El 404 era del hostname del motor,
         * `api.doblefoco.co/sobre-nosotros`, que es público desde que existe.
         *
         * Dos artefactos nuestros no pueden contestar cosas distintas a la
         * misma pregunta, así que ahora la tabla la sirven los dos.
         */
        const servidor = readFileSync(
            resolve(dirname(fileURLToPath(import.meta.url)), '../index.js'),
            'utf8'
        );
        expect(servidor).toMatch(/REDIRECCIONES_PERMANENTES/);
        expect(servidor).toMatch(/res\.redirect\(308, nueva\)/);

        // Delante de las renderizadas: si una dirección vieja volviera a la
        // tabla de páginas, la redirección tiene que seguir mandando.
        expect(servidor.indexOf('REDIRECCIONES_PERMANENTES)) {'))
            .toBeLessThan(servidor.indexOf('app.get(RUTAS_RENDERIZADAS'));
    });

    it('una sub-página inventada la atiende el motor, que responde 404 con la aplicación', () => {
        // El precio de mandar /transparencia/* entero al motor en vez de
        // enumerar las rutas —enumerarlas sería la lista que diverge—. El
        // manejador vive en server/index.js, justo después de las renderizadas.
        expect(destinoDe('/transparencia/inventada')).toMatch(/^https:\/\/api\.doblefoco\.co/);

        const servidor = readFileSync(
            resolve(dirname(fileURLToPath(import.meta.url)), '../index.js'),
            'utf8'
        );
        expect(servidor).toMatch(/app\.get\(\/\^\\\/transparencia\\\/\//);
        expect(servidor.indexOf('app.get(RUTAS_RENDERIZADAS'))
            .toBeLessThan(servidor.indexOf('app.get(/^\\/transparencia\\//'));
    });
});
