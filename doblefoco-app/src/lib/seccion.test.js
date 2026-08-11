/**
 * Lo que tiene que seguir siendo cierto en la pantalla de secciones.
 *
 * DOS CLASES DE COMPROBACIÓN, y las dos existen por el mismo fallo real: la
 * baldosa de Justicia mostraba «0 noticias» con cinco historias dentro, porque
 * los feeds las etiquetaban `Judicial` y la interfaz comparaba contra
 * `Justicia`. Ese defecto no lo ve el lint, ni `tsc`, ni el build. La página se
 * pinta perfecta; simplemente miente.
 *
 *   1. La REGLA DE PERTENENCIA, incluidos sus dos caminos —el bueno por ids y
 *      el de respaldo por nombre— porque el respaldo solo se ejercita contra la
 *      API antigua y esa desaparecerá; sin prueba, nadie volvería a mirarlo
 *      hasta que hiciera falta otra vez.
 *
 *   2. La INTEGRIDAD DEL CATÁLOGO de secciones contra el clasificador. Un id de
 *      tema que no exista en `TEMAS` produce una baldosa que no puede contar
 *      nada, y no hay error en ninguna parte: solo un cero permanente.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { perteneceA, nombreDeSeccion } from './seccion.js';
import { categories } from '../data/categories.js';
import { TEMAS } from '../../shared/topicClassifier.js';

const AQUI = dirname(fileURLToPath(import.meta.url));

const seccion = (id) => categories.find((c) => c.id === id);

/** Historia mínima con los tres campos que mira la regla. */
const historia = ({ category = 'Sin categoría', topics = null, ambito = null } = {}) => ({
    category,
    topics,
    ambito,
});

describe('pertenencia a una sección', () => {
    it('«Últimas» acepta todo, incluso lo que no está clasificado', () => {
        expect(perteneceA(historia(), seccion('ultimas'))).toBe(true);
        expect(perteneceA(historia({ topics: [] }), seccion('ultimas'))).toBe(true);
    });

    describe('con la API que clasifica', () => {
        it('el tema se decide por id y no por el nombre visible', () => {
            const s = historia({ topics: ['justicia'], category: 'Judicial' });
            expect(perteneceA(s, seccion('justicia'))).toBe(true);
        });

        it('una historia multietiqueta sale en todas sus secciones', () => {
            const s = historia({ topics: ['deportes', 'economia', 'politica'] });
            expect(perteneceA(s, seccion('deportes'))).toBe(true);
            expect(perteneceA(s, seccion('economia'))).toBe(true);
            expect(perteneceA(s, seccion('politica'))).toBe(true);
            expect(perteneceA(s, seccion('salud'))).toBe(false);
        });

        it('clasificada y sin tema no es lo mismo que sin clasificar: no entra en ninguna', () => {
            const s = historia({ topics: [] });
            expect(perteneceA(s, seccion('politica'))).toBe(false);
        });

        /**
         * El motivo por el que ámbito y tema tuvieron que separarse: mientras
         * compartían la columna `category`, una historia no podía ser
         * internacional Y deportiva.
         */
        it('el ámbito es un eje independiente del tema', () => {
            const s = historia({ topics: ['deportes'], ambito: 'internacional' });
            expect(perteneceA(s, seccion('internacional'))).toBe(true);
            expect(perteneceA(s, seccion('deportes'))).toBe(true);
        });

        it('lo nacional no entra en Internacional', () => {
            const s = historia({ topics: ['politica'], ambito: 'nacional' });
            expect(perteneceA(s, seccion('internacional'))).toBe(false);
        });

        /**
         * La categoría heredada del feed deja de mandar en cuanto hay temas. Si
         * siguiera contando, una pieza reclasificada aparecería a la vez en la
         * sección nueva y en la vieja.
         */
        it('el campo heredado ya no cuenta cuando hay clasificación', () => {
            const s = historia({ topics: ['salud'], category: 'Deportes' });
            expect(perteneceA(s, seccion('deportes'))).toBe(false);
            expect(perteneceA(s, seccion('salud'))).toBe(true);
        });
    });

    describe('con la API antigua, que no clasifica', () => {
        it('cae al nombre heredado del feed', () => {
            const s = historia({ category: 'Economía' });
            expect(perteneceA(s, seccion('economia'))).toBe(true);
            expect(perteneceA(s, seccion('salud'))).toBe(false);
        });

        it('Internacional cae al literal que usaba la columna vieja', () => {
            expect(perteneceA(historia({ category: 'Internacional' }), seccion('internacional'))).toBe(true);
            expect(perteneceA(historia({ category: 'Política' }), seccion('internacional'))).toBe(false);
        });
    });
});

describe('catálogo de secciones', () => {
    it('cada sección de tema existe en el clasificador', () => {
        const conocidos = new Set(TEMAS.map((t) => t.id));
        const huerfanas = categories
            .filter((c) => c.tipo === 'tema')
            .map((c) => c.id)
            .filter((id) => !conocidos.has(id));

        expect(huerfanas).toEqual([]);
    });

    it('el nombre visible coincide con el del clasificador', () => {
        // El respaldo por nombre depende de esta coincidencia, y un nombre
        // reescrito en un solo archivo la rompe en silencio.
        const porId = new Map(TEMAS.map((t) => [t.id, t.nombre]));
        const desajustes = categories
            .filter((c) => c.tipo === 'tema' && porId.get(c.id) !== c.name)
            .map((c) => `${c.id}: «${c.name}» vs «${porId.get(c.id)}»`);

        expect(desajustes).toEqual([]);
    });

    /**
     * LA ETIQUETA Y LA PERTENENCIA NO PUEDEN CONTRADECIRSE. El día del terremoto
     * del Chocó el destacado salía marcado «Política» —así llegó del feed—
     * mientras la historia vivía en Desastres y accidentes. Dos respuestas
     * distintas a la misma pregunta en la misma pantalla.
     */
    describe('nombreDeSeccion', () => {
        const historia = { category: 'Política', topics: ['desastres', 'politica'] };

        it('etiqueta por el tema, no por la sección heredada del feed', () => {
            expect(nombreDeSeccion(historia, categories)).toBe('Desastres y accidentes');
        });

        it('la etiqueta coincide con una sección a la que la historia pertenece', () => {
            const nombre = nombreDeSeccion(historia, categories);
            const seccion = categories.find((c) => c.name === nombre);
            expect(perteneceA({ ...historia, ambito: null }, seccion)).toBe(true);
        });

        /** Mientras la API vigente no mande `topics`, el respaldo sigue siendo el feed. */
        it('cae a la categoría del feed cuando no hay temas', () => {
            expect(nombreDeSeccion({ category: 'Política', topics: null }, categories))
                .toBe('Política');
            expect(nombreDeSeccion({ category: 'Política', topics: [] }, categories))
                .toBe('Política');
        });

        it('no inventa nada si no hay ni temas ni categoría', () => {
            expect(nombreDeSeccion({}, categories)).toBe('');
            expect(nombreDeSeccion(null, categories)).toBe('');
        });

        /** Un tema que el clasificador escribe pero que no tiene baldosa no se enseña. */
        it('ignora un tema sin sección declarada', () => {
            expect(nombreDeSeccion({ category: 'Política', topics: ['inventado'] }, categories))
                .toBe('Política');
        });
    });

    it('no hay ids repetidos', () => {
        const ids = categories.map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    /**
     * Se lee el fuente como texto, igual que NewsDetail.layout.test.js con su
     * CSS: montar el componente exigiría un renderizador, y lo que se quiere
     * garantizar —que ninguna baldosa se quede sin dibujo— está en el fuente.
     */
    it('cada sección tiene su lámina dibujada', () => {
        const fuente = readFileSync(resolve(AQUI, '../components/CategoryMark.jsx'), 'utf8');
        const bloque = fuente.slice(fuente.indexOf('const LAMINAS'));

        const sinLamina = categories
            .map((c) => c.id)
            .filter((id) => !new RegExp(`^\\s{4}${id}:`, 'm').test(bloque));

        expect(sinLamina).toEqual([]);
    });
});
