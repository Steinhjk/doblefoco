// @ts-check
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MarcadorSinImagen from './MarcadorSinImagen';

/**
 * EL MARCADOR NO ES UNA IMAGEN, Y ESTAS PRUEBAS FIJAN LO QUE SÍ ES.
 *
 * La regla del 2026-07-30 —nunca una foto «relacionada»— se rompería en
 * silencio si alguien, con buena intención, metiera aquí un `<img>` de
 * archivo. Lo que se comprueba: que lo único que se pinta como imagen es el
 * logo del medio del catálogo, que lleva el texto que lo declara, y que sin
 * medio conocido sigue habiendo aviso y no hueco.
 */
describe('MarcadorSinImagen', () => {
    it('con un medio del catálogo pinta su logo y dice que no hay imagen', () => {
        const html = renderToStaticMarkup(
            <MarcadorSinImagen story={{ sources: [{ name: 'El Tiempo', bias: 0.2 }] }} />
        );
        expect(html).toContain('/logos/el-tiempo.png');
        expect(html).toContain('Sin imagen del medio');
        expect(html).toContain('role="img"');
        expect(html).toContain('Abre El Tiempo');
    });

    it('lo único que puede ser un <img> es el logo del medio', () => {
        const html = renderToStaticMarkup(
            <MarcadorSinImagen story={{ sources: [{ name: 'El Tiempo', bias: 0.2 }] }} />
        );
        const imgs = html.match(/<img[^>]*>/g) ?? [];
        expect(imgs).toHaveLength(1);
        expect(imgs[0]).toContain('/logos/');
    });

    it('sin fuente conocida no inventa logo: aviso y nada más', () => {
        const html = renderToStaticMarkup(<MarcadorSinImagen story={{ sources: [] }} />);
        expect(html).not.toContain('<img');
        expect(html).toContain('Sin imagen del medio');
    });

    it('la versión compacta lleva el logo y calla el texto', () => {
        const html = renderToStaticMarkup(
            <MarcadorSinImagen story={{ sources: [{ name: 'El Tiempo', bias: 0.2 }] }} compacto />
        );
        expect(html).toContain('/logos/el-tiempo.png');
        // El texto visible se calla; la etiqueta accesible sigue diciéndolo.
        expect(html).not.toContain('marcador-sin-imagen-texto');
        expect(html).toContain('aria-label="Sin imagen del medio');
        expect(html).toContain('marcador-sin-imagen--compacto');
    });
});
