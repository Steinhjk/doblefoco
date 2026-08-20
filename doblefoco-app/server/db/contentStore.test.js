// @ts-check
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { articuloDesdeFila } from './contentStore.js';

/**
 * LO QUE LA REHIDRATACIÓN PIERDE NO LO CAZA NADA.
 *
 * El motor guarda los artículos en Postgres y los vuelve a leer en cada
 * arranque. Si esa lectura olvida una columna, no hay error de SQL ni de tipos:
 * el campo llega `undefined` y todo aguas abajo lo trata como «este artículo no
 * tenía eso». El fallo aparece semanas después y en otra pantalla.
 *
 * Pasó con `topics` y `ambito`: se escribían bien, no se leían nunca, y como las
 * historias se construyen con la unión de los temas de sus artículos, la unión
 * de nada dejó 99 de 100 historias sin tema y el catálogo entero marcado como
 * nacional. Estas pruebas son el cerrojo de esa puerta.
 */

const fila = {
    id: 'a1',
    canonical_url: 'https://ejemplo.co/nota',
    headline: 'Titular literal del medio',
    raw_title: null,
    snippet: null,
    category: 'Política',
    tone: null,
    published_at: '2026-08-19T10:00:00.000Z',
    ingested_at: '2026-08-19T10:05:00.000Z',
    image_url: null,
    topics: ['justicia', 'politica'],
    ambito: 'internacional',
    source_id: 'el-tiempo',
    source_name: 'El Tiempo',
    source_domain: 'eltiempo.com',
    bias: 0.2,
    factuality: 0.8,
};

describe('articuloDesdeFila', () => {
    it('devuelve los temas, que es lo que da tema a la historia', () => {
        expect(articuloDesdeFila(fila).topics).toEqual(['justicia', 'politica']);
    });

    it('devuelve el ámbito, que es lo que hace que exista lo internacional', () => {
        expect(articuloDesdeFila(fila).ambito).toBe('internacional');
    });

    it('un artículo anterior a la columna aporta cero temas, y no rompe su historia', () => {
        /*
         * `?? []` y no `?? null`: aguas abajo esto se recorre con `flatMap`. Un
         * `null` ahí tumbaría la construcción de la historia entera por culpa de
         * un artículo viejo.
         */
        const viejo = articuloDesdeFila({ ...fila, topics: null, ambito: null });
        expect(viejo.topics).toEqual([]);
        expect(viejo.ambito).toBeNull();
        expect(() => [viejo].flatMap((a) => a.topics ?? [])).not.toThrow();
    });

    it('sigue trayendo lo de antes: medio, espectro y foto', () => {
        const a = articuloDesdeFila(fila);
        expect(a.outlet.name).toBe('El Tiempo');
        expect(a.outlet.spectrum).toBeTruthy();
        expect(a.link).toBe('https://ejemplo.co/nota');
        expect(a.rawTitle).toBe('Titular literal del medio');
    });
});

describe('la consulta trae todo lo que el mapeo lee', () => {
    /*
     * EL OTRO SENTIDO DEL MISMO FALLO. La prueba de arriba comprueba que el
     * mapeo devuelve los campos; esta comprueba que la CONSULTA los pide. Leer
     * `row.topics` de una fila que nunca seleccionó `a.topics` da `undefined` sin
     * quejarse, y ese silencio es exactamente lo que costó la pantalla de
     * Categorías. Se lee el archivo porque el defecto vive en el texto del SQL,
     * no en ningún valor que se pueda inspeccionar en tiempo de ejecución.
     */
    const fuente = readFileSync(fileURLToPath(new URL('./contentStore.js', import.meta.url)), 'utf8');

    const consulta = fuente
        .slice(fuente.indexOf('export async function hydrateArticles'))
        .slice(0, fuente.slice(fuente.indexOf('export async function hydrateArticles')).indexOf('`,'));

    const mapeo = fuente.slice(
        fuente.indexOf('export function articuloDesdeFila'),
        fuente.indexOf('export async function hydrateArticles'),
    );

    /** Las columnas de `articles` que el mapeo lee, sin las que trae el JOIN. */
    const DEL_JOIN = new Set(['source_id', 'source_name', 'source_domain', 'bias', 'factuality']);
    const leidas = [...new Set([...mapeo.matchAll(/row\.(\w+)/g)].map((m) => m[1]))].filter(
        (c) => !DEL_JOIN.has(c),
    );

    it('el mapeo lee columnas de verdad, no está vacío', () => {
        expect(leidas.length).toBeGreaterThan(8);
    });

    it.each(leidas)('la consulta selecciona «%s»', (columna) => {
        expect(consulta).toContain(`a.${columna}`);
    });
});
