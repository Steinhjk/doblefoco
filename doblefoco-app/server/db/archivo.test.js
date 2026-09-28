// @ts-check
import { describe, it, expect } from 'vitest';
import { globSync, readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * EL ARCHIVO CAMBIA LO QUE SIGNIFICA `stories`, Y ESTO ES LA RED.
 *
 * Desde el 2026-09-02 una historia que el ciclo ya no produce no se borra: se
 * sella con `archivada_el`. La tabla pasó de ser «lo que hay ahora» a «todo lo
 * que hubo», y ese cambio no rompe nada — que es justo el problema. Una
 * consulta que sirva la portada, un conteo o el vocabulario y se olvide del
 * filtro empezará a mezclar noticias de hace meses con las de hoy, sin lanzar
 * un error, sin fallar una prueba de las otras, y sin que nadie lo note hasta
 * que un lector vea un titular viejo en la portada.
 *
 * Se lee el fuente como texto, igual que `schema.test.js` con el .sql y que la
 * prueba de rutas con `vercel.json`: lo que se quiere garantizar es una
 * propiedad de lo ESCRITO, y comprobarla contra una base real exigiría
 * credenciales en CI para cazar un olvido que ya está a la vista aquí.
 *
 * CÓMO SE DECLARA UNA EXCEPCIÓN: escribiendo en la misma consulta un comentario
 * que empiece por «ARCHIVO A PROPÓSITO». Hay una hoy —el sitemap—, y tiene que
 * seguir siendo una decisión escrita y no un descuido.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const FEED = readFileSync(resolve(AQUI, 'feedStore.js'), 'utf8');
const CONTENT = readFileSync(resolve(AQUI, 'contentStore.js'), 'utf8');
const SCHEMA = readFileSync(resolve(AQUI, 'schema.sql'), 'utf8');

/**
 * LA RED TENÍA AGUJEROS, Y SE VIERON EL 2026-09-08.
 *
 * Esta prueba nació mirando dos ficheros —`feedStore` y `contentStore`—, que
 * eran los que sirven la portada. Seis días después del estreno del archivo,
 * seis consultas de FUERA de esos dos seguían leyendo `stories` como si la
 * tabla siguiera significando «lo que hay ahora»: el invariante de la unión,
 * que acusaba, la recategorización, que REESCRIBÍA historias congeladas, y
 * cuatro más. Ninguna falló ninguna prueba.
 *
 * Así que el barrido es ahora de todo el servidor y de todos los programas.
 * Un fichero nuevo que consulte `stories` entra en la red sin que nadie se
 * acuerde de añadirlo, que es la única forma de que una red aguante.
 */
const RAIZ = resolve(AQUI, '..', '..');
const FUENTES = [...globSync('server/**/*.js', { cwd: RAIZ }), ...globSync('scripts/**/*.mjs', { cwd: RAIZ })]
    .filter((f) => !/\.test\.[jm]s$/.test(f))
    .map((f) => ({ fichero: f.split(sep).join('/'), texto: readFileSync(resolve(RAIZ, f), 'utf8') }));

/**
 * Cada consulta del fuente que toca `stories`, con el texto que la rodea.
 *
 * VENTANA FIJA, y no los límites del literal: los comentarios de estas
 * consultas citan nombres entre comillas invertidas, y usarlas como delimitador
 * partía la consulta por la mitad —la primera versión de esta prueba acusó a
 * `leerHistorias`, que sí lleva el filtro—. Mil caracteres cubren de sobra el
 * WHERE de la consulta más larga del archivo.
 */
function consultasSobreStories(fuente) {
    const trozos = [];
    const re = /(FROM|JOIN|UPDATE)\s+stories\b/g;
    let m;
    while ((m = re.exec(fuente))) {
        trozos.push(fuente.slice(Math.max(0, m.index - 800), m.index + 1000));
    }
    return trozos;
}

describe('el archivo de historias', () => {
    it('la columna y su índice parcial existen en el esquema', () => {
        expect(SCHEMA).toMatch(/ALTER TABLE stories ADD COLUMN IF NOT EXISTS archivada_el/);
        expect(SCHEMA).toMatch(/CREATE INDEX IF NOT EXISTS stories_vivas_idx[\s\S]*archivada_el IS NULL/);
    });

    it('toda consulta de feedStore que lea historias filtra lo archivado, o lo declara', () => {
        const sinFiltro = consultasSobreStories(FEED).filter(
            (q) => !q.includes('archivada_el') && !q.includes('ARCHIVO A PROPÓSITO')
        );

        expect(
            sinFiltro.map((q) => q.replace(/\s+/g, ' ').slice(0, 120)),
            'una consulta sobre `stories` sin filtro de archivo ni excepción declarada'
        ).toEqual([]);
    });

    it('el sitemap es la excepción, y está escrita', () => {
        // Una historia sellada conserva su página y su URL: anunciarla es
        // exactamente para lo que se archiva.
        expect(FEED).toMatch(/ARCHIVO A PROPÓSITO/);
    });

    it('ninguna consulta del proyecto lee `stories` sin filtrar el archivo o declararlo', () => {
        const culpables = [];
        for (const { fichero, texto } of FUENTES) {
            for (const q of consultasSobreStories(texto)) {
                if (q.includes('archivada_el') || q.includes('ARCHIVO A PROPÓSITO')) continue;
                culpables.push(`${fichero}: ${q.replace(/\s+/g, ' ').slice(0, 100)}`);
            }
        }

        expect(
            culpables,
            'una consulta sobre `stories` sin filtro de archivo ni excepción declarada'
        ).toEqual([]);
    });

    it('el barrido mira de verdad todo el proyecto, y no una lista corta', () => {
        // Sin esto, un `globSync` que dejara de encontrar ficheros haría que la
        // prueba de arriba pasara siempre: cero consultas, cero culpables.
        const ficheros = FUENTES.map((f) => f.fichero);
        expect(ficheros).toContain('server/db/feedStore.js');
        expect(ficheros).toContain('scripts/invariantes.mjs');
        expect(ficheros).toContain('scripts/recategorizar.mjs');
        expect(FUENTES.filter((f) => /(FROM|JOIN|UPDATE)\s+stories\b/.test(f.texto)).length)
            .toBeGreaterThanOrEqual(8);
    });

    it('solo `readStory` pide ver lo archivado', () => {
        expect((FEED.match(/incluirArchivadas: true/g) ?? []).length).toBe(1);
        const antes = FEED.slice(0, FEED.indexOf('incluirArchivadas: true'));
        expect(antes).toMatch(/export async function readStory/);
    });

    it('el ciclo sella las multifuente maduras, y borra todo lo demás que dejó de producir', () => {
        expect(CONTENT).toMatch(/UPDATE stories[\s\S]*SET archivada_el = now\(\)[\s\S]*source_count > 1/);

        /*
         * El borrado NO puede filtrar por número de medios (2026-09-24). Con
         * `source_count <= 1` una multifuente recompuesta no se sellaba ni se
         * borraba: se quedaba viva y duplicada junto a su sucesora, y el
         * 2026-09-24 eran 82 de las 100 primeras del feed. Lo maduro ya está
         * fuera porque el sellado va antes y el borrado exige `archivada_el IS
         * NULL`: el orden es parte del arreglo, y también se comprueba.
         */
        const borrado = CONTENT.slice(CONTENT.indexOf('DELETE FROM stories'));
        const sentencia = borrado.slice(0, borrado.indexOf('`'));
        expect(sentencia).toMatch(/archivada_el IS NULL/);
        expect(sentencia).not.toMatch(/source_count/);
        expect(CONTENT.indexOf('SET archivada_el = now()')).toBeLessThan(CONTENT.indexOf('DELETE FROM stories'));
        // La salvaguarda de moderación sigue en el borrado.
        expect(sentencia).toMatch(/NOT IN \(SELECT story_id FROM moderation\)/);
    });

    it('solo sella lo que envejeció: una historia con artículos frescos se borra, no se archiva', () => {
        /*
         * Es la corrección del 2026-09-02, y sin esta prueba se pierde: una
         * historia deja de producirse porque su hecho envejeció (archivo) o
         * porque el agrupamiento la recompuso con otro id (basura con URL).
         * Medido en producción el 2026-09-08: de 1 975 archivadas, 1 554
         * tenían artículos de menos de 48 h, o sea que eran huérfanas.
         */
        expect(CONTENT).toMatch(
            /UPDATE stories s[\s\S]*SET archivada_el = now\(\)[\s\S]*NOT EXISTS[\s\S]*story_articles sa[\s\S]*COALESCE\(a\.published_at, a\.ingested_at\)[\s\S]*now\(\) - /
        );
        // La madurez es una FRACCIÓN de la ventana, no un número de horas: si
        // la ventana cambia, el corte sigue significando lo mismo.
        expect(CONTENT).toMatch(/export const MADUREZ_PARA_ARCHIVAR = 2 \/ 3;/);
        expect(CONTENT).toMatch(/ventanaMs \* MADUREZ_PARA_ARCHIVAR/);
    });

    it('el ciclo le pasa la ventana de agrupamiento, no la de la base', () => {
        // `RETENCION_BASE_MS` son 30 días: usarla aquí archivaría solo lo que
        // ya no existe, y el archivo se quedaría vacío para siempre.
        const DAEMON = readFileSync(resolve(AQUI, '../services/ingestDaemon.js'), 'utf8');
        expect(DAEMON).toMatch(/persistStories\(storiesFeed, RETENTION_MS\)/);
    });

    it('la poda no se lleva por delante los artículos de una historia archivada', () => {
        // `story_articles` cae en cascada con el artículo: sin esto, una
        // historia sellada perdería todos sus enlaces al cumplir los 30 días.
        expect(CONTENT).toMatch(
            /DELETE FROM articles a[\s\S]*NOT EXISTS[\s\S]*story_articles sa[\s\S]*s\.archivada_el IS NOT NULL/
        );
    });
});

describe('la historia recompuesta redirige a su sucesora (2026-09-24)', () => {
    const INDEX = readFileSync(resolve(AQUI, '../index.js'), 'utf8');
    const BACKUP = readFileSync(resolve(AQUI, '../../scripts/backup.mjs'), 'utf8');

    it('la tabla existe en el esquema, antes de cerrar la API de Supabase', () => {
        const cierre = SCHEMA.indexOf('Cerrar la API pública de Supabase');
        expect(SCHEMA.indexOf('CREATE TABLE IF NOT EXISTS historias_sucesoras')).toBeGreaterThan(0);
        expect(SCHEMA.indexOf('CREATE TABLE IF NOT EXISTS historias_sucesoras')).toBeLessThan(cierre);
    });

    it('la sucesora se apunta ANTES de borrar: después ya no quedan vínculos que comparar', () => {
        expect(CONTENT.indexOf('INSERT INTO historias_sucesoras')).toBeGreaterThan(0);
        expect(CONTENT.indexOf('INSERT INTO historias_sucesoras')).toBeLessThan(CONTENT.indexOf('DELETE FROM stories'));
    });

    it('sin la migración, el ciclo no se cae: pregunta si la tabla existe antes de escribir', () => {
        expect(CONTENT).toMatch(/to_regclass\('historias_sucesoras'\)/);
        expect(CONTENT).toMatch(/ROLLBACK TO SAVEPOINT sucesoras/);
    });

    it('la página redirige con 301 y la API sirve la sucesora', () => {
        expect(INDEX).toMatch(/leerSucesora\(idDesdeRuta\(req\.params\.id\)\)[\s\S]{0,200}res\.redirect\(301, rutaDeHistoria\(sucesora\)\)/);
        expect(INDEX).toMatch(/\(await leerHistoria\(id\)\) \?\? \(await leerSucesora\(id\)\)/);
    });

    it('la sucesora pasa por readStory, que es donde está el filtro de moderación', () => {
        // Redirigir a una historia retirada sería publicarla por la puerta de atrás.
        expect(FEED).toMatch(/return sucesora \? readStory\(sucesora\) : null;/);
    });

    it('la copia de seguridad sabe qué hacer con la tabla', () => {
        expect(BACKUP).toMatch(/historias_sucesoras: '/);
    });
});
