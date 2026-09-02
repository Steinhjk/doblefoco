/**
 * ELEGIR UNA SECCIÓN TIENE QUE LLEVAR A ALGÚN SITIO.
 *
 * QUÉ PASÓ (2026-08-31). Jose lo reportó como «al clickear cualquier categoría
 * no lleva a ningún lado». El clic funcionaba —`aria-pressed="true"`, la lista
 * pintada con sus historias reales— pero aparecía debajo de una rejilla de
 * diecisiete tarjetas y la página no se movía. Medido en producción:
 *
 *     escritorio (1280×900) → los resultados a 1,6 pantallas de distancia
 *     móvil      (390×844)  → a 5,3 pantallas
 *
 * Desde el lado del visitante eso no es una lista lejana: es un botón que no
 * hace nada. Y no falló nada —ni la consola, ni el build, ni 714 pruebas—,
 * porque la página se pinta; solo que no sirve.
 *
 * QUÉ PUEDE Y QUÉ NO PUEDE PROBAR ESTO. Se lee el fuente como texto, igual que
 * `Trending.layout.test.js` y `NewsDetail.layout.test.js`. Medir de verdad un
 * desplazamiento exige un navegador; lo que aquí se garantiza es que **las
 * piezas que lo producen sigan puestas**, que es lo que se pierde en la
 * siguiente refactorización sin que nada chille.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const JSX = readFileSync(resolve(aqui, 'Categories.jsx'), 'utf8');
const CSS = readFileSync(resolve(aqui, 'Categories.css'), 'utf8');

/**
 * El fuente SIN COMENTARIOS. Los comentarios de este repositorio citan el
 * código —incluido el que se quitó—, así que una prueba que lee texto tiene que
 * leer el código y no la prosa. Es la misma corrección que hubo que hacerle a
 * las pruebas de Tendencias.
 */
const codigo = JSX
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

describe('Categorías · elegir una sección lleva a los resultados', () => {
    it('el contenedor de resultados tiene una referencia a la que ir', () => {
        expect(codigo).toMatch(/className="category-results"[^>]*ref=\{resultados\}/);
    });

    it('hay un efecto que reacciona al cambio de sección', () => {
        expect(codigo).toMatch(/useEffect\([\s\S]*?\}, \[active\]\)/);
    });

    it('desplaza la vista hasta los resultados', () => {
        expect(codigo).toContain('scrollIntoView');
    });

    it('no desplaza nada al deseleccionar', () => {
        // `active` vuelve a null y no hay resultados a los que ir; arrastrar la
        // vista sin motivo sería peor que dejarla quieta.
        expect(codigo).toMatch(/if \(!active[\s\S]{0,60}?\) return;/);
    });

    it('respeta a quien pidió que no hubiera movimiento', () => {
        expect(codigo).toContain('prefers-reduced-motion: reduce');
    });

    it('lleva también el foco, que es lo único que oye un lector de pantalla', () => {
        expect(codigo).toMatch(/focus\(\{ preventScroll: true \}\)/);
        expect(codigo).toMatch(/<h2 ref=\{titulo\} tabIndex=\{-1\}>/);
    });

    it('y el encabezado que recibe el foco no enseña un anillo suelto', () => {
        // Nunca llega ahí un foco de teclado: no está en el orden de tabulación.
        expect(CSS).toMatch(/\.category-results-header h2:focus \{\s*outline: none;/);
    });
});
