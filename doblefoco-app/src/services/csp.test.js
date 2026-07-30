// @ts-check
/**
 * LA CSP DE PRODUCCIÓN PERMITE LAS IMÁGENES QUE EL MOTOR ACEPTA.
 *
 * POR QUÉ EXISTE ESTA PRUEBA. Al añadir las imágenes reales de los medios, el
 * `img-src` de vercel.json seguía diciendo `https://images.unsplash.com` y nada
 * más. O sea: el motor guardaba la foto de El Tiempo, el servidor la servía en
 * el HTML, y el navegador del lector la bloqueaba. Nada fallaba en el servidor,
 * nada aparecía en los registros y una petición con `curl` —que no aplica CSP—
 * pasaba la verificación sin enterarse. El síntoma habría sido «las imágenes no
 * salen» sin ninguna traza de por qué.
 *
 * Es la misma clase de problema que motivó server/db/schema.test.js: el mismo
 * hecho declarado en dos sitios que pueden divergir en silencio. Se resuelve
 * igual, con una comprobación automática en vez de con cuidado.
 *
 * Se lee el JSON como archivo a propósito: lo que se quiere comprobar es lo que
 * está ESCRITO en la configuración que Vercel lee al desplegar.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MEDIA_REGISTRY } from '../../shared/mediaRegistry.js';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const vercel = JSON.parse(readFileSync(resolve(RAIZ, 'vercel.json'), 'utf8'));

/** El CSP que se aplica a todas las rutas. */
const csp = vercel.headers
    .flatMap((/** @type {any} */ h) => h.headers ?? [])
    .find((/** @type {any} */ h) => h.key === 'Content-Security-Policy')?.value ?? '';

const imgSrc = csp.split(';').map((/** @type {string} */ d) => d.trim())
    .find((/** @type {string} */ d) => d.startsWith('img-src')) ?? '';

const conFeed = Object.values(MEDIA_REGISTRY).filter((/** @type {any} */ m) => m.feed?.url);

describe('CSP de producción e imágenes de los medios', () => {
    it('existe una directiva img-src', () => {
        expect(imgSrc).not.toBe('');
    });

    it('cubre el dominio de todo medio que puede traer imagen en su feed', () => {
        // Un medio nuevo con feed puede empezar a publicar fotos cualquier día.
        // Si su dominio no está aquí, sus imágenes se bloquean en el navegador y
        // no hay ningún otro sitio donde eso se note.
        const faltan = conFeed
            .map((/** @type {any} */ m) => m.domain.replace(/^www\./, ''))
            .filter((d) => !imgSrc.includes(`https://*.${d}`) || !imgSrc.includes(`https://${d}`));

        expect(faltan).toEqual([]);
    });

    it('cubre cada host de imagen declarado en el registro', () => {
        // Los hosts de CDN —Arc Publishing para Semana y El País de Cali, ichef
        // para BBC Mundo— no se deducen del dominio del medio.
        const declarados = conFeed.flatMap((/** @type {any} */ m) => m.imageHosts ?? []);
        expect(declarados.length).toBeGreaterThan(0);

        const faltan = declarados.filter((h) => !imgSrc.includes(`https://${h}`));
        expect(faltan).toEqual([]);
    });

    it('NO permite ya el banco de fotos de archivo', () => {
        // Se retiró el motor que ilustraba cada noticia con una foto de Unsplash
        // elegida por hash del titular. Dejar el host permitido invitaría a que
        // volviera sin que nada se opusiera.
        expect(csp).not.toContain('unsplash');

        // Se busca una etiqueta <link> de verdad, no la palabra: el comentario
        // que explica por qué se quitó el preconnect menciona el host, y una
        // regla que se disparase con él castigaría documentar la decisión.
        expect(readFileSync(resolve(RAIZ, 'index.html'), 'utf8')).not.toMatch(
            /<link[^>]*unsplash/i
        );
    });

    it('sigue restringiendo los scripts a nuestro propio origen', () => {
        // Que este archivo hable de imágenes no debe servir para relajar lo demás
        // sin que se note.
        expect(csp).toContain("script-src 'self'");
        expect(csp).toContain("default-src 'self'");
    });
});
