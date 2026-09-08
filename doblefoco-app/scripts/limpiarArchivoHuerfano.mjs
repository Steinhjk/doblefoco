/**
 * Retira del archivo las historias que nunca debieron entrar — las que el
 * agrupamiento recompuso, no las que envejecieron.
 *
 *   npm run archivo:huerfanas            muestra qué borraría, sin tocar nada
 *   npm run archivo:huerfanas -- --apply lo borra
 *
 * QUÉ PASÓ, Y POR QUÉ HACE FALTA ESTO UNA VEZ
 * -------------------------------------------
 * La Etapa A del archivo (2026-09-02) sellaba TODA historia multifuente que el
 * ciclo dejara de producir. Pero una historia deja de producirse por dos
 * motivos que no se parecen en nada:
 *
 *   · sus artículos salieron de la ventana — el hecho envejeció. Eso es archivo.
 *   · el agrupamiento la recompuso — sus artículos siguen vivos, colgando ahora
 *     de otra historia con otro id. Eso no es archivo: es la misma noticia con
 *     otro nombre, y con su propia URL en el sitemap.
 *
 * Medido el 2026-09-08, con seis días del criterio viejo corriendo: de 1 975
 * archivadas, 1 554 (79 %) se sellaron teniendo artículos de menos de 48 h.
 * El motor ya no las produce —eso se arregló el mismo día—, pero las que ya
 * están siguen publicadas.
 *
 * Y DE ESAS 1 554, 864 COMPARTEN ARTÍCULO CON OTRA HISTORIA: son recomposición
 * demostrada, el mismo artículo colgando de dos páginas. Las otras 690 dejaron
 * de producirse sin que sus artículos aparezcan en ninguna otra historia —el
 * techo de `MAX_ARTICLES` los expulsa por comparabilidad, y el filtro de
 * formatos también retira piezas—. No son archivo tampoco: su cobertura se
 * quedó a medias mientras el hecho seguía fresco, que es justo lo que una
 * página archivada promete que NO le pasó. El criterio nuevo tampoco las
 * archivaría, así que borrarlas es lo que deja el archivo coherente con lo que
 * el motor hará de ahora en adelante.
 *
 * LAS HORAS NEGATIVAS DEL INFORME NO SON UN ERROR: significan que el artículo
 * más nuevo de la historia es POSTERIOR al sello. Sus piezas siguieron vivas
 * después de archivarla, que es la forma más clara de no haber envejecido.
 *
 * EL CRITERIO ES EL MISMO QUE EL DEL MOTOR, aplicado hacia atrás: se mira la
 * edad que tenía el artículo MÁS NUEVO de la historia en el momento en que se
 * la selló. Si no llegaba a dos tercios de la ventana de agrupamiento —48 h de
 * 72—, la historia no envejeció: se recompuso.
 *
 * POR QUÉ NO SE HACE SOLO, Y POR QUÉ NO SE «DESARCHIVA»
 * ----------------------------------------------------
 * Borrar es la misma asimetría de `clean:filtered`: se mira la lista y después
 * se ejecuta. Y desarchivar no sirve —se midió antes de decidirlo—: sus
 * artículos acabarán madurando, y entonces el ciclo las archivaría igual,
 * duplicando otra vez la historia viva que las absorbió.
 *
 * LA SALVAGUARDA DE MODERACIÓN se respeta, como en el borrado del ciclo: una
 * historia sobre la que alguien decidió algo no se borra por una limpieza.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { checkConnection, query, closePool } = await import('../server/db/pool.js');
const { MADUREZ_PARA_ARCHIVAR } = await import('../server/db/contentStore.js');

const apply = process.argv.includes('--apply');

/** La ventana de agrupamiento, la misma que usa el motor. */
const VENTANA_H = 72;
const CORTE_H = VENTANA_H * MADUREZ_PARA_ARCHIVAR;

const status = await checkConnection();

if (!status.enabled) {
    console.error(`\n  ✗ Sin base de datos: ${status.reason}\n`);
    process.exitCode = 1;
} else {
    /*
     * `horas` es la edad del artículo más nuevo EN EL MOMENTO DEL SELLADO, no
     * ahora: preguntado hoy, todo lo archivado hace días parecería maduro y la
     * limpieza no borraría nada.
     */
    const { rows } = await query(
        `
        SELECT s.id,
               s.title,
               s.source_count,
               s.archivada_el,
               EXTRACT(EPOCH FROM (
                   s.archivada_el - max(COALESCE(a.published_at, a.ingested_at))
               )) / 3600                                        AS horas,
               EXISTS (SELECT 1 FROM moderation m WHERE m.story_id = s.id) AS moderada
          FROM stories s
          JOIN story_articles sa ON sa.story_id = s.id
          JOIN articles a        ON a.id = sa.article_id
         WHERE s.archivada_el IS NOT NULL
         GROUP BY s.id, s.title, s.source_count, s.archivada_el
         ORDER BY s.archivada_el
        `,
    );

    const huerfanas = rows.filter((r) => Number(r.horas) < CORTE_H && !r.moderada);
    const protegidas = rows.filter((r) => Number(r.horas) < CORTE_H && r.moderada);
    const legitimas = rows.length - huerfanas.length - protegidas.length;

    console.log('');
    console.log(`  ARCHIVO: ${rows.length} historias selladas`);
    console.log('  ' + '─'.repeat(68));
    console.log(`  envejecieron de verdad (≥ ${CORTE_H} h)      ${String(legitimas).padStart(6)}`);
    console.log(`  recompuestas, a borrar                  ${String(huerfanas.length).padStart(6)}`);
    if (protegidas.length) {
        console.log(`  recompuestas pero moderadas, se quedan  ${String(protegidas.length).padStart(6)}`);
    }
    console.log('');

    // Una muestra, no la lista entera: son más de mil y nadie lee mil líneas.
    // Se enseñan las más jóvenes, que son las más claramente recompuestas.
    const muestra = [...huerfanas].sort((a, b) => Number(a.horas) - Number(b.horas)).slice(0, 15);
    if (muestra.length) {
        console.log('  LAS QUINCE MÁS JÓVENES DE LO QUE SE BORRARÍA');
        console.log('  ' + '─'.repeat(68));
        for (const h of muestra) {
            console.log(`    ${Number(h.horas).toFixed(1).padStart(5)} h  ${String(h.title ?? '').slice(0, 60)}`);
        }
        console.log('');
    }

    if (!huerfanas.length) {
        console.log('  Nada que limpiar.\n');
    } else if (!apply) {
        console.log('  No se ha borrado nada. Revisa la lista de arriba y, si es correcta:');
        console.log('    npm run archivo:huerfanas -- --apply\n');
    } else {
        // `story_articles` cae en cascada. Los artículos NO se borran: pueden
        // seguir colgando de la historia viva que absorbió el grupo.
        // ARCHIVO A PROPÓSITO: aquí se borra archivo, y solo archivo. Los ids
        // salen de la consulta de arriba, que solo mira `archivada_el IS NOT
        // NULL`; ninguna historia viva puede estar en esta lista.
        const { rowCount } = await query('DELETE FROM stories WHERE id = ANY($1::text[])', [
            huerfanas.map((h) => h.id),
        ]);
        console.log(`  ${rowCount} historias huérfanas borradas del archivo.`);
        console.log('  El sitemap deja de anunciarlas en la próxima petición.\n');
    }
}

await closePool();
