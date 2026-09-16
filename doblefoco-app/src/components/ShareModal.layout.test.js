/**
 * EL DIÁLOGO DE COMPARTIR TIENE QUE SALIRSE DE LA TARJETA.
 *
 * QUÉ PASÓ (2026-09-15), al ponerle a cada tarjeta su botón de compartir. El
 * velo del diálogo es `position: fixed` con las cuatro esquinas a cero, que
 * debería cubrir la pantalla. Y no la cubría: aparecía encajado dentro de la
 * tarjeta, empujando la página.
 *
 * LA CAUSA es una regla del navegador que no se ve leyendo el componente: si
 * algún ancestro tiene `transform`, el «fijo» se posiciona respecto a ESE
 * ancestro y no a la ventana. `.news-card:hover` lleva
 * `transform: translateY(-2px)`.
 *
 * Y DE AHÍ SALE LO PEOR DEL DEFECTO: como el `transform` solo existe mientras el
 * puntero está encima, fallaba **exactamente cuando alguien pulsa el botón** y
 * no cuando se comprueba sin pasar por encima. Lo cazó abrir la captura; ni el
 * lint, ni `tsc`, ni las 872 pruebas dijeron nada.
 *
 * QUÉ GARANTIZA ESTA PRUEBA Y QUÉ NO. Se lee el fuente como texto, igual que
 * `Categories.layout.test.js`. No mide posiciones —eso pide un navegador—: lo
 * que asegura es que **la pieza que lo arregla siga puesta**, porque quitar un
 * `createPortal` en una refactorización parece inofensivo y aquí devuelve el
 * fallo entero.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const JSX = readFileSync(resolve(aqui, 'ShareModal.jsx'), 'utf8');
const CSS = readFileSync(resolve(aqui, 'ShareModal.css'), 'utf8');
const CARD_CSS = readFileSync(resolve(aqui, 'NewsCard.css'), 'utf8');

describe('ShareModal · se pinta fuera del árbol de la tarjeta', () => {
    it('usa un portal a document.body', () => {
        expect(JSX).toContain("import { createPortal } from 'react-dom'");
        expect(JSX).toContain('return createPortal(');
        expect(JSX).toContain('document.body');
    });

    it('el velo sigue siendo fijo, que es lo que el portal hace funcionar', () => {
        expect(CSS).toMatch(/\.share-modal-overlay\s*\{[^}]*position:\s*fixed/);
    });

    /*
     * Si alguien quita el `transform` del hover, esta prueba no falla y no debe:
     * el portal sigue siendo lo correcto. Está aquí para que quien lea el fallo
     * encuentre la prueba de que la causa era real.
     */
    it('la tarjeta que lo contenía sigue teniendo el transform que lo causaba', () => {
        expect(CARD_CSS).toMatch(/transform:\s*translateY/);
    });
});

describe('ShareModal · manda lo que enseña', () => {
    it('no compone la URL desde la barra de direcciones', () => {
        expect(JSX).not.toContain('window.location.href');
        expect(JSX).toContain('urlDeHistoria(story)');
    });

    it('ofrece WhatsApp por enlace y no por SDK', () => {
        expect(JSX).toContain('https://wa.me/?text=');
        expect(JSX).not.toMatch(/<script|cdn\./);
    });
});
