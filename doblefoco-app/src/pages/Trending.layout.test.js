/**
 * LA COSTURA JSX↔CSS DE TENDENCIAS — y por qué merece pruebas propias.
 *
 * QUÉ PASÓ (2026-08-21)
 * ---------------------
 * `Trending.css` estilizaba `.topic-info h3` y el JSX renderizaba un `<h2>`. La
 * regla no se aplicó nunca, el titular cayó al tamaño por defecto del navegador
 * —`1.5em`— y se veía enorme dentro de una tarjeta estrecha. Lo reportó Jose
 * mirando la página; **no lo vio el lint, ni `tsc`, ni el build, ni ninguna de
 * las 621 pruebas**, porque nada de eso falla: la página se pinta, solo que fea.
 *
 * Es la SEGUNDA vez que este proyecto pierde estilos en la misma costura. La
 * primera fue el 2026-08-19, cuando `.map-point` fijaba `stroke` en la hoja de
 * estilos y el JSX lo confiaba a un atributo de presentación: los puntos del
 * mapa salieron invisibles y así estuvieron semanas.
 *
 * QUÉ SE COMPRUEBA, Y POR QUÉ ASÍ
 * -------------------------------
 * Se lee el fuente como texto, igual que `NewsDetail.layout.test.js` con su
 * `subgrid` y `schema.test.js` con el `.sql`. Comprobar esto de verdad exigiría
 * un navegador midiendo píxeles; lo que se quiere garantizar es que **el CSS y
 * el JSX hablen del mismo elemento**, y eso está en el fuente.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const JSX = readFileSync(resolve(aqui, 'Trending.jsx'), 'utf8');
const CSS = readFileSync(resolve(aqui, 'Trending.css'), 'utf8');

/**
 * El JSX SIN COMENTARIOS, y esto no es un detalle.
 *
 * La primera versión de estas pruebas falló contra la página ya arreglada,
 * porque los comentarios que explican el diseño viejo **citan** el código viejo:
 * el encabezado dice que había un «Historias con mayor cobertura» y menciona
 * `topCoveredStories(stories, 8)`. Una prueba que lee el fuente como texto tiene
 * que leer el CÓDIGO, no la prosa que lo rodea — o prohíbe documentar lo que se
 * quitó, que en este repositorio es justo lo que más se escribe.
 */
const codigo = JSX
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '') // comentarios JSX: {/* … */}
    .replace(/\/\*[\s\S]*?\*\//g, '') //           comentarios de bloque
    .replace(/^\s*\/\/.*$/gm, ''); //              comentarios de línea sueltos

/** Los selectores del archivo, sin cuerpos, sin comentarios y sin at-rules. */
const selectores = CSS
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('}')
    .map((bloque) => bloque.slice(bloque.lastIndexOf('{') === -1 ? 0 : 0, bloque.indexOf('{')))
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.startsWith('@'))
    .flatMap((s) => s.split(',').map((x) => x.trim()))
    .filter(Boolean);

describe('los estilos de Tendencias apuntan a algo que existe', () => {
    it('el archivo tiene selectores que leer, o esta prueba no prueba nada', () => {
        expect(selectores.length).toBeGreaterThan(8);
    });

    /*
     * LA REGLA QUE CIERRA LA PUERTA DEL FALLO ORIGINAL.
     *
     * Un selector por etiqueta —`h2`, `.algo h3`, `span`— depende de qué
     * etiqueta eligió el JSX, y esa elección cambia por razones que no tienen
     * nada que ver con el estilo: accesibilidad, semántica, un encabezado que
     * baja de nivel. Colgado de una clase, el estilo sobrevive a ese cambio; y
     * si la clase desaparece, la prueba de más abajo lo caza.
     */
    it.each(selectores)('«%s» no estiliza por etiqueta', (selector) => {
        const piezas = selector.split(/[\s>+~]+/).filter(Boolean);
        for (const pieza of piezas) {
            expect(
                pieza.startsWith('.'),
                `«${pieza}» selecciona por etiqueta. Ver la cabecera de Trending.css: ` +
                'el titular se vio enorme durante semanas porque el CSS decía `h3` y el JSX ' +
                'renderizaba `h2`.',
            ).toBe(true);
        }
    });

    /*
     * Clases propias de esta página. Las de fuera —`page-header` (index.css),
     * `coverage-bar-box` (CoverageBar), `animate-in` (AnimateIn)— no se
     * comprueban aquí porque su dueño es otro archivo.
     */
    const propias = [...new Set([...CSS.matchAll(/\.(trend[\w-]*)/g)].map((m) => m[1]))];

    it('se encontraron clases propias que comprobar', () => {
        expect(propias.length).toBeGreaterThan(5);
    });

    it.each(propias)('la clase «%s» la usa alguien en el JSX', (clase) => {
        expect(
            codigo.includes(clase),
            `Trending.css estiliza «.${clase}» y Trending.jsx no la usa: es estilo muerto, ` +
            'o el nombre dejó de coincidir.',
        ).toBe(true);
    });
});

describe('el titular no puede volver a quedarse sin tamaño', () => {
    it('`.trend-title` fija su propio font-size', () => {
        /*
         * El fallo no fue que el tamaño estuviera mal: fue que NO HABÍA tamaño y
         * el navegador puso el suyo. `h2` no tiene tamaño en index.css —solo
         * familia, peso y altura de línea—, así que cualquier encabezado sin
         * clase propia hereda el `1.5em` del agente de usuario.
         */
        const regla = CSS.slice(CSS.indexOf('.trend-title {'));
        const cuerpo = regla.slice(0, regla.indexOf('}'));
        expect(cuerpo).toMatch(/font-size:/);
    });

    it('el titular del JSX lleva esa clase', () => {
        expect(codigo).toMatch(/className="trend-title"/);
    });
});

describe('la página dejó de repetirse a sí misma', () => {
    /*
     * Había dos bloques bajo dos encabezados distintos alimentados por la misma
     * consulta: contra el feed de producción, 8 de las 10 historias del segundo
     * eran exactamente las 8 tarjetas del primero. Dos títulos distintos sobre
     * el mismo dato le dicen al lector que ve dos medidas cuando ve una.
     */
    it('solo se consulta el ranking una vez', () => {
        expect(codigo.match(/topCoveredStories\(/g) ?? []).toHaveLength(1);
    });

    it('ya no hay una segunda lista ordenada por cobertura', () => {
        expect(codigo).not.toMatch(/coverage\.total\s*-\s*[ab]\.coverage\.total/);
        expect(codigo).not.toContain('Historias con mayor cobertura');
    });
});

describe('el ranking es una lista ordenada de verdad', () => {
    it('usa <ol> y <li>, que es lo que anuncia la posición sin leerla', () => {
        expect(codigo).toContain('<ol');
        expect(codigo).toContain('<li');
    });

    it('el numeral pintado a mano es decorativo, para no leerse dos veces', () => {
        const bloque = codigo.slice(codigo.indexOf('trend-rank'));
        expect(bloque.slice(0, 120)).toContain('aria-hidden');
    });

    it('AnimateIn va dentro del <li>: envolverlo daría `<ol> > <div> > <li>`', () => {
        expect(codigo).toMatch(/<li[^>]*>\s*<AnimateIn/);
    });
});
