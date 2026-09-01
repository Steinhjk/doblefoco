/**
 * LA COSTURA JSX↔CSS DE «SOBRE NOSOTROS», que se rompió dos veces a la vez.
 *
 * QUÉ PASÓ (2026-09-01, mirando la página)
 * ----------------------------------------
 * 1. `.about-hero` fijaba `color: white` sobre un degradado que en el tema
 *    CLARO vale #f8fafc → #f1f5f9. Blanco sobre casi blanco: 1,03:1. El título
 *    y el lema de la página eran invisibles para quien no usa el tema oscuro.
 * 2. La hoja estilaba `.about-hero h1` y el JSX renderiza
 *    `<h2 className="sn-titulo">`. La regla no se aplicó nunca.
 *
 * El segundo es el MISMO defecto que ya costó los puntos del mapa (2026-08-19) y
 * el titular de Tendencias (2026-08-21): CSS y JSX hablando de elementos
 * distintos, sin que falle nada. Tres veces es un patrón, no mala suerte, y la
 * defensa es la misma: **apuntar a clases, no a etiquetas.** Una etiqueta cambia
 * cuando alguien reordena los encabezados por accesibilidad; una clase, no.
 *
 * Se lee el fuente como texto, igual que las otras pruebas de costura.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const JSX = readFileSync(resolve(aqui, 'SobreNosotros.jsx'), 'utf8');
const CSS = readFileSync(resolve(aqui, 'SobreNosotros.css'), 'utf8');

/** Sin comentarios: en este repositorio la prosa cita el código que se retiró. */
const codigo = JSX
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/^\s*\/\/.*$/gm, '');
const hoja = CSS.replace(/\/\*[\s\S]*?\*\//g, '');

describe('Sobre nosotros · la costura del encabezado', () => {
    it('el CSS estiliza la clase que el JSX pinta de verdad', () => {
        expect(codigo).toContain('className="sn-titulo"');
        expect(hoja).toMatch(/\.about-hero \.sn-titulo\s*\{/);
    });

    it('no estiliza una etiqueta que el JSX no usa', () => {
        // `.about-hero h1` fue la regla que no se aplicó durante meses.
        expect(hoja).not.toMatch(/\.about-hero h1\s*\{/);
    });

    it('el encabezado no fija un color que ignore el tema', () => {
        const bloque = hoja.match(/\.about-hero\s*\{[^}]*\}/)?.[0] ?? '';
        expect(bloque).not.toMatch(/color:\s*(white|#fff)/i);
        expect(bloque).toMatch(/color:\s*var\(--/);
    });

    it('el lema se apaga con un color del sistema, no con opacidad', () => {
        // Sobre un fondo claro, bajar la opacidad de un texto blanco solo lo
        // acerca más al fondo. No es lo mismo apagar que desaparecer.
        const bloque = hoja.match(/\.about-hero \.tagline\s*\{[^}]*\}/)?.[0] ?? '';
        expect(bloque).toMatch(/color:\s*var\(--text-muted\)/);
        expect(bloque).not.toMatch(/opacity:/);
    });
});

describe('Sobre nosotros · lo que la página afirma', () => {
    it('no proclama ninguna virtud', () => {
        const texto = codigo.toLowerCase();
        for (const raiz of ['objetiv', 'imparcial', 'sin sesgos']) {
            expect(texto).not.toContain(raiz);
        }
    });

    it('las cifras de firmas salen de `lib/catalogo`, no escritas a mano', () => {
        expect(codigo).toContain('fraseDeFirmas()');
        // La frase fija que se desincronizó de su propio contador.
        expect(codigo).not.toContain('ha pasado aún por revisión');
    });
});
