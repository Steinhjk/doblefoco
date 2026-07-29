// @ts-check
import { describe, it, expect } from 'vitest';
import { esRutaCanonica, idCorto, idDesdeRuta, rutaDeHistoria, slugify } from './storyPath.js';

describe('slugify', () => {
    it('quita los diacríticos en vez de codificarlos', () => {
        // Sin esto la URL se codifica en porcentajes («C%C3%A1mara») y vuelve a
        // ser ilegible, que es justo lo que este cambio evita.
        expect(slugify('Cámara aprueba la posesión')).toBe('camara-aprueba-la-posesion');
    });

    it('traduce la ñ, que no es una n con diacrítico', () => {
        expect(slugify('El año de España')).toBe('el-ano-de-espana');
    });

    it('colapsa signos y espacios en un solo guion', () => {
        expect(slugify('¿Qué pasó?  ¡Nadie lo sabe!')).toBe('que-paso-nadie-lo-sabe');
    });

    it('no deja guiones al principio ni al final', () => {
        expect(slugify('  «Comillas»  ')).toBe('comillas');
        expect(slugify('---')).toBe('');
    });

    it('conserva las cifras, que a veces son el dato', () => {
        expect(slugify('Reforma 2026 aprobada')).toBe('reforma-2026-aprobada');
    });

    it('corta en palabra completa, no por la mitad', () => {
        const largo = 'Cámara de Representantes aprueba en segundo debate la reforma tributaria presentada';
        const s = slugify(largo);
        expect(s.length).toBeLessThanOrEqual(60);
        // La última palabra tiene que estar entera: un enlace cortado a mitad de
        // palabra se lee como roto.
        expect(s.endsWith('-')).toBe(false);
        expect(largo.toLowerCase()).toContain(s.split('-').pop());
    });

    it('sobrevive a un titular vacío o ausente', () => {
        expect(slugify('')).toBe('');
        expect(slugify(/** @type {any} */ (null))).toBe('');
    });
});

describe('rutaDeHistoria', () => {
    it('arma la ruta con titular y el id sin prefijo', () => {
        expect(rutaDeHistoria({ id: 'story_12flvrc', title: 'Cámara aprueba la posesión' }))
            .toBe('/noticia/camara-aprueba-la-posesion-12flvrc');
    });

    it('sin titular usable, deja solo el id corto', () => {
        expect(rutaDeHistoria({ id: 'story_12flvrc', title: '¿?' })).toBe('/noticia/12flvrc');
        expect(rutaDeHistoria({ id: 'story_12flvrc', title: null })).toBe('/noticia/12flvrc');
    });

    it('nunca deja «story» en la URL', () => {
        const r = rutaDeHistoria({ id: 'story_abc', title: 'Una noticia' });
        expect(r).not.toContain('story');
    });

    it('sin id devuelve la portada en vez de una ruta inválida', () => {
        expect(rutaDeHistoria(/** @type {any} */ ({}))).toBe('/');
    });
});

describe('idDesdeRuta', () => {
    it('acepta la forma canónica', () => {
        expect(idDesdeRuta('camara-aprueba-la-posesion-12flvrc')).toBe('story_12flvrc');
    });

    it('acepta el id corto suelto', () => {
        expect(idDesdeRuta('12flvrc')).toBe('story_12flvrc');
    });

    it('acepta la forma ANTIGUA, que ya está indexada', () => {
        // Las 2 636 URLs del sitemap se publicaron con este formato: si dejaran
        // de resolver, se perdería todo lo que Google ya hubiera visto.
        expect(idDesdeRuta('story_12flvrc')).toBe('story_12flvrc');
    });

    it('un titular con cifras no confunde al extractor', () => {
        expect(idDesdeRuta('reforma-2026-aprobada-9xk2ab')).toBe('story_9xk2ab');
    });

    it('devuelve cadena vacía sin parámetro', () => {
        expect(idDesdeRuta('')).toBe('');
        expect(idDesdeRuta(/** @type {any} */ (null))).toBe('');
    });

    it('ida y vuelta: la ruta que genera se puede volver a leer', () => {
        const story = { id: 'story_1tzzmku', title: 'De la Espriella nombra embajador' };
        const ruta = rutaDeHistoria(story).replace('/noticia/', '');
        expect(idDesdeRuta(ruta)).toBe(story.id);
    });
});

describe('esRutaCanonica', () => {
    const story = { id: 'story_12flvrc', title: 'Cámara aprueba la posesión' };

    it('reconoce la canónica', () => {
        expect(esRutaCanonica('camara-aprueba-la-posesion-12flvrc', story)).toBe(true);
    });

    it('marca como NO canónicas las formas que hay que redirigir', () => {
        // Dos direcciones que sirven la misma página se penalizan como contenido
        // duplicado, así que estas tienen que responder 301.
        expect(esRutaCanonica('story_12flvrc', story)).toBe(false);
        expect(esRutaCanonica('12flvrc', story)).toBe(false);
        expect(esRutaCanonica('otro-titular-12flvrc', story)).toBe(false);
    });
});

describe('idCorto', () => {
    it('quita el prefijo y deja intacto lo que no lo tiene', () => {
        expect(idCorto('story_abc')).toBe('abc');
        expect(idCorto('abc')).toBe('abc');
    });
});
