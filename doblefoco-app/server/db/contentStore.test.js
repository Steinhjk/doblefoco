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

    it('marca la opinión, que es lo que la mantiene fuera del agrupamiento', () => {
        const columna = articuloDesdeFila({
            ...fila,
            canonical_url:
                'https://www.vanguardia.com/opinion/columnistas/luis-ernesto-ruiz/2026/08/06/el-reto-apenas-comienza/',
        });
        expect(columna.opinion).toEqual({
            esOpinion: true,
            tipo: 'columna',
            columnista: 'Luis Ernesto Ruiz',
        });
    });

    it('una noticia normal no queda marcada como opinión', () => {
        /*
         * El daño de un falso positivo es peor que el de un falso negativo:
         * marcar una noticia real como opinión la saca del agrupamiento, que es
         * la función central del sitio. Por eso se comprueba en los dos sentidos.
         */
        expect(articuloDesdeFila(fila).opinion.esOpinion).toBe(false);
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

    /*
     * EL TERCER SENTIDO, Y EL QUE FALTABA: que la ESCRITURA guarde todo lo que
     * la lectura pide.
     *
     * Las dos pruebas de arriba cierran el camino base -> memoria: el mapeo
     * devuelve los campos, y la consulta los selecciona. Pero las dos dan por
     * bueno que la columna EXISTE con algo dentro. Si el INSERT nunca la
     * escribe, la consulta la selecciona vacía, el mapeo la mapea a null y las
     * tres pruebas pasan mientras el producto enseña un hueco.
     *
     * Es la misma forma del fallo de `topics` —se escribía y no se leía—, vista
     * desde el otro lado. Hoy no falta ninguna: 12 leídas, 13 escritas, cero
     * huecos. Lo que no había era nada que lo vigilara, así que el día que
     * alguien añada un campo al mapeo y olvide el INSERT, vuelve la pantalla de
     * Categorías con sus ceros y nadie se entera hasta mirarla.
     *
     * Se lee el texto del SQL por el mismo motivo que la prueba de arriba: el
     * defecto vive en la lista de columnas, no en ningún valor inspeccionable.
     */
    const insert = fuente.slice(fuente.indexOf('INSERT INTO articles'));
    const columnasEscritas = insert
        .slice(insert.indexOf('(') + 1, insert.indexOf(')'))
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

    it('el INSERT declara columnas de verdad, no está vacío', () => {
        expect(columnasEscritas.length).toBeGreaterThan(8);
    });

    it.each(leidas)('el INSERT escribe «%s», que el mapeo lee', (columna) => {
        expect(columnasEscritas).toContain(columna);
    });
});

describe('la costura con el agrupamiento', () => {
    /*
     * EL SENTIDO QUE FALTABA, Y ES EL QUE DE VERDAD IMPORTA.
     *
     * Que el mapeo devuelva `opinion` no prueba nada por sí solo: lo que se
     * decidió el 2026-08-09 es que la opinión NO forme historias, y quien lo
     * cumple es un filtro que vive en otro archivo. Esa costura —base↔memoria
     * aquí, memoria↔agrupamiento allá— es el punto ciego del proyecto: los
     * cuatro fallos del 2026-08-19 vivían todos en una.
     *
     * Medido el 2026-08-21 contra producción: 71 de los 4 000 artículos
     * rehidratados eran opinión y entraban al agrupamiento en cada arranque,
     * porque `undefined?.esOpinion` es `undefined` y `!undefined` es `true`.
     */
    const daemon = readFileSync(
        fileURLToPath(new URL('../services/ingestDaemon.js', import.meta.url)),
        'utf8',
    );

    it('el agrupamiento sigue filtrando por `opinion.esOpinion`', () => {
        /*
         * Si alguien cambia la forma del filtro, esta prueba cae y obliga a
         * volver aquí. Sin esto, el mapeo podría seguir devolviendo un campo que
         * ya no lee nadie —que es, literalmente, el fallo inverso del que se
         * está cerrando—.
         */
        expect(daemon).toContain('!a.opinion?.esOpinion');
    });

    it('un artículo rehidratado de opinión NO pasa el filtro del agrupamiento', () => {
        const columna = articuloDesdeFila({
            ...fila,
            canonical_url: 'https://www.elespectador.com/opinion/columnistas/alguien/algo/',
        });
        const noticia = articuloDesdeFila(fila);

        // El predicado literal de buildMultisourceStories.
        const entranAlAgrupamiento = [columna, noticia].filter((a) => !a.opinion?.esOpinion);

        expect(entranAlAgrupamiento).toEqual([noticia]);
    });

    it('el editorial tampoco, aunque no traiga columnista', () => {
        const editorial = articuloDesdeFila({
            ...fila,
            canonical_url: 'https://www.elespectador.com/opinion/editorial/lo-que-sea/',
        });
        expect(editorial.opinion.tipo).toBe('editorial');
        expect(editorial.opinion.columnista).toBeNull();
        expect([editorial].filter((a) => !a.opinion?.esOpinion)).toEqual([]);
    });
});
