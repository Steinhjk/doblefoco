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
     * ESTA PRUEBA CAMBIÓ DE FORMA EL 2026-09-09, Y CONVIENE DECIR POR QUÉ.
     *
     * Comprobaba, leyendo el texto del archivo, tres cosas: que el mapeo
     * devolviera campos, que la consulta los pidiera y que el `INSERT` los
     * escribiera. Eran tres listas escritas a mano en tres sitios, y la prueba
     * existía justamente porque podían separarse —así se perdieron `topics` y
     * `ambito`, y con ellos la pantalla de Categorías—.
     *
     * Desde 2.4 las tres salen de una sola lista, `contratoDeArticulo.js`, que
     * GENERA el `INSERT`, sus parámetros, las columnas que pide la
     * rehidratación y el objeto que vuelve. Ya no se pueden separar, así que
     * comprobar que coinciden es comprobar que `map` funciona.
     *
     * Lo que sí sigue haciendo falta es que contentStore USE el contrato en vez
     * de volver a escribir el SQL a mano, y de eso se encarga
     * `contratoDeArticulo.test.js`. Aquí queda el otro sentido, que el contrato
     * no puede saber: que las columnas del JOIN —las del medio— siguen pedidas.
     */
    const fuente = readFileSync(fileURLToPath(new URL('./contentStore.js', import.meta.url)), 'utf8');

    const consulta = fuente
        .slice(fuente.indexOf('export async function hydrateArticles'))
        .slice(0, fuente.slice(fuente.indexOf('export async function hydrateArticles')).indexOf('`,'));

    it.each(['source_name', 'source_domain', 'bias', 'factuality'])(
        'la consulta sigue trayendo «%s», que viene del medio y no del contrato',
        (columna) => {
            expect(consulta).toContain(columna);
        },
    );

    it('las columnas del artículo las pone el contrato', () => {
        expect(consulta).toContain("columnasParaLeer('a')");
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

/**
 * EL CUARTO SENTIDO DE LA COSTURA: memoria -> RESPUESTA.
 *
 * Las tres pruebas de arriba cierran base <-> memoria. Falta el tramo que va de
 * la memoria al navegador, y tiene un defecto propio: las dos listas que
 * componen la respuesta —`ingestDaemon` para el motor y `feedStore` para lo que
 * se lee de la base— ENUMERAN LOS CAMPOS A MANO. Un campo que no se escriba en
 * ellas llega `undefined` al cliente y no produce ningún error.
 *
 * Pasó el 2026-08-25 con `ausencia`, el mismo día que se estrenó: estaba
 * calculada en `analyzeCoverage`, probada, y trasplantada en `normalizeStory`.
 * El sitio la enseñaba vacía porque ninguna de las dos listas la nombraba. Y no
 * lo cazó nada, porque la comprobación con navegador INYECTABA el campo en la
 * respuesta y así se saltaba justo la capa rota.
 *
 * Se leen los dos archivos como texto por el mismo motivo que las pruebas de
 * arriba: el defecto vive en la lista, no en un valor inspeccionable.
 */
describe('la respuesta nombra todo lo que el cliente trasplanta', () => {
    /**
     * Campos de `coverage` que el cliente NO puede recalcular y por tanto
     * espera recibir. Ver `puntoCiegoDelServidor` en `src/lib/story.js`.
     */
    const DEL_SERVIDOR = ['blindspot', 'ausencia'];

    const leer = (ruta) => readFileSync(fileURLToPath(new URL(ruta, import.meta.url)), 'utf8');
    const COMPOSITORES = {
        'ingestDaemon.js': leer('../services/ingestDaemon.js'),
        'feedStore.js': leer('./feedStore.js'),
    };

    for (const [nombre, fuente] of Object.entries(COMPOSITORES)) {
        it.each(DEL_SERVIDOR)(`${nombre} escribe «%s» en la respuesta`, (campo) => {
            expect(fuente).toContain(`${campo}: coverage.${campo},`);
        });
    }
});

/**
 * H4: SOLO SE ESCRIBE LO QUE CAMBIÓ, Y ESO CREA UNA LISTA QUE PUEDE ENVEJECER.
 *
 * El `ON CONFLICT DO UPDATE` de `stories` lleva desde el 2026-09-08 un `WHERE`
 * que compara los valores viejos con los nuevos y se salta la fila si son
 * iguales. El ahorro está medido —unas 1 010 000 filas escritas al día para un
 * corpus que se mueve en los bordes— pero abre una puerta nueva:
 *
 *   **una columna que se añada al SET y no al WHERE deja de actualizarse.** Sin
 *   error, sin aviso: la fila se considera igual, no se escribe, y el valor
 *   viejo se queda. Es el mismo fallo silencioso que `topics` y `ambito`, con
 *   el añadido de que esta vez lo habríamos construido nosotros.
 *
 * Así que las dos listas tienen que decir lo mismo, y esto lo obliga. Las dos
 * excepciones van nombradas y con motivo:
 *
 *   `computed_at`  cambia siempre (now()); compararla haría que ninguna fila
 *                  se considerara nunca igual y el WHERE no serviría de nada.
 *   `first_seen_at` en el SET va con `LEAST(...)`, así que en el WHERE se
 *                  compara contra ese mismo `LEAST` y no contra EXCLUDED a
 *                  secas: si no, una historia recompuesta con una fecha más
 *                  nueva se escribiría para no cambiar nada.
 */
describe('el WHERE que evita reescribir lo idéntico', () => {
    const FUENTE = readFileSync(fileURLToPath(new URL('./contentStore.js', import.meta.url)), 'utf8');

    /*
     * Los dos trozos se recortan DESDE el `ON CONFLICT` de `stories` y no desde
     * el principio del fichero: hay otros `WHERE (` antes —la poda, sin ir más
     * lejos— y anclar en el primero hacía que esta prueba mirara una consulta
     * que no es la suya. Acusaba a dieciséis columnas inocentes.
     */
    const conflicto = FUENTE.indexOf('ON CONFLICT (id) DO UPDATE SET');
    const inicioWhere = FUENTE.indexOf('WHERE (', conflicto);
    // Después del WHERE, no después del ON CONFLICT: el comentario que hay en
    // medio explica por qué se usa `IS DISTINCT FROM`, y anclar en él dejaba
    // los dos recortes cruzados.
    const distinto = FUENTE.indexOf('IS DISTINCT FROM', inicioWhere);

    /** El cuerpo del SET: del DO UPDATE al WHERE. */
    const bloque = FUENTE.slice(conflicto, inicioWhere);
    /** El WHERE entero: las columnas viejas y las nuevas, que hacen falta las dos. */
    const where = FUENTE.slice(inicioWhere, distinto + 1200);

    const SIN_COMPARAR = ['computed_at'];

    it('cada columna del SET se compara también en el WHERE', () => {
        const delSet = [...bloque.matchAll(/^\s{24}(\w+)\s+=\s+EXCLUDED\./gm)].map((m) => m[1]);
        expect(delSet.length, 'no se encontraron columnas en el SET').toBeGreaterThan(10);

        const olvidadas = delSet
            .filter((col) => !SIN_COMPARAR.includes(col))
            .filter((col) => !where.includes(`stories.${col}`));

        expect(
            olvidadas,
            'columnas que se actualizarían pero no se comparan: la fila se daría por igual y el valor viejo se quedaría'
        ).toEqual([]);
    });

    it('`first_seen_at` se compara contra su LEAST, no contra EXCLUDED a secas', () => {
        expect(where).toMatch(/LEAST\(stories\.first_seen_at, EXCLUDED\.first_seen_at\)/);
    });

    it('`computed_at` queda fuera de la comparación, o el WHERE no serviría de nada', () => {
        expect(where).not.toContain('stories.computed_at');
    });

    it('el ciclo informa de cuántas escribió de verdad, no solo de cuántas produjo', () => {
        const DAEMON = readFileSync(
            fileURLToPath(new URL('../services/ingestDaemon.js', import.meta.url)),
            'utf8'
        );
        expect(FUENTE).toMatch(/return \{ stories: stories\.length, escritas,/);
        expect(DAEMON).toContain('escritas)`');
    });
});
