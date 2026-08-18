/**
 * ARCHIVO DE CONDUCTA — lo único del corpus que no se puede reconstruir después.
 *
 *     npm run archivo:conducta            → archiva la ventana viva
 *     npm run archivo:conducta -- --seco  → dice qué archivaría, sin escribir
 *
 * QUÉ PROBLEMA RESUELVE, Y NO ES TEÓRICO
 * --------------------------------------
 * Los artículos se borran a las 72 horas. Es una decisión tomada y esto NO la
 * toca: aquí no se guarda ni un titular, ni un enlace, ni un fragmento.
 *
 * Lo que sí se llevaba por delante esa purga, sin que nadie lo declarara, es la
 * CONDUCTA MEDIDA. Cuarenta fichas de orientación prometen «la medición a los 90
 * días (2026-11-10)», y comprobado el 2026-08-18 no puede ocurrir: ninguna tabla
 * acumulaba con quién coincide cada medio, así que el 10 de noviembre habría
 * exactamente lo de hoy —tres días— y la espera no habría producido nada.
 *
 * Cada día sin esto es corpus perdido para siempre. Y el que se está perdiendo
 * ahora es el de la campaña y el cambio de gobierno, que es el período más
 * informativo que va a tener este catálogo en años.
 *
 * QUÉ GUARDA
 * ----------
 * El par (historia, medio) con la fecha de la historia. Dos identificadores y
 * una fecha. Con eso se recalcula cualquier métrica de nivel 2 sobre cualquier
 * ventana —agenda propia, compañía media, coincidencias, y las que aún no se han
 * inventado— sin decidir hoy cuáles importarán dentro de un año.
 *
 * POR QUÉ NO GUARDA EL AGREGADO YA CALCULADO. Porque suma mal: una historia viva
 * tres días entraría tres veces en el conteo. La clave primaria (story_id,
 * source_id) desduplica sola, así que ejecutarlo dos veces el mismo día, o tres
 * días seguidos sobre la misma historia, da el mismo resultado.
 *
 * ES IDEMPOTENTE. Se puede correr en cada despliegue, a mano, o dos veces
 * seguidas. Lo único que cambia es cuántos pares eran nuevos.
 *
 * LOS HUECOS SE DECLARAN
 * ----------------------
 * Cada ejecución deja fila en `conducta_archivo_runs`. Sin eso, un archivador
 * que no corrió en tres días sería indistinguible de tres días sin noticias, y
 * la ventana de 90 días leería un agujero de datos como si fuera silencio
 * editorial. Es la misma regla que el proyecto aplica a las fichas: un hueco
 * declarado se puede leer; uno escondido vuelve como objeción.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// Antes de importar pool.js, que lee DATABASE_URL al evaluarse.
dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { checkConnection, query, withTransaction, closePool } = await import('../server/db/pool.js');

const SECO = process.argv.slice(2).includes('--seco');

/**
 * Un par por (historia, medio): si un medio publicó tres piezas de la misma
 * historia cuenta una vez, porque lo que se archiva es coincidencia de medios y
 * no de artículos. Es el mismo criterio de `conductaPorMedio.mjs`, y tiene que
 * seguir siéndolo o las cifras de las fichas dejarían de reproducirse.
 *
 * La fecha es la de la historia —la más antigua de sus piezas— y no la del
 * archivado: así una ventana de 90 días se reconstruye igual aunque el
 * archivador se haya ejecutado a deshora o se haya saltado un día.
 */
const CONSULTA_PARES = `
    SELECT sa.story_id,
           a.source_id,
           min(COALESCE(a.published_at, a.ingested_at))::date AS dia
      FROM story_articles sa
      JOIN articles a ON a.id = sa.article_id
     GROUP BY sa.story_id, a.source_id
`;

async function main() {
    const estado = await checkConnection();
    if (!estado.enabled) {
        console.error(`\n  ✗ No se pudo conectar: ${estado.reason}`);
        console.error('    Completa DATABASE_URL en .env.local.\n');
        process.exitCode = 1;
        return;
    }

    const { rows: pares } = await query(CONSULTA_PARES);

    if (!pares.length) {
        // Sin corpus no hay nada que archivar, y eso NO es un fallo: puede ser
        // un domingo de madrugada. Pero se deja constancia igual, porque la fila
        // vacía es justamente lo que distingue «no corrió» de «corrió y no había
        // nada».
        console.log('\n  El corpus está vacío. No hay pares que archivar.\n');
        if (!SECO) {
            await query(
                `INSERT INTO conducta_archivo_runs
                     (at, pares_vistos, pares_nuevos, historias, medios, ventana_desde, ventana_hasta)
                 VALUES (now(), 0, 0, 0, 0, NULL, NULL)
                 ON CONFLICT (at) DO NOTHING`
            );
        }
        return;
    }

    const historias = new Set(pares.map((p) => p.story_id)).size;
    const medios = new Set(pares.map((p) => p.source_id)).size;
    const dias = pares.map((p) => String(p.dia).slice(0, 10)).sort();
    const desde = dias[0];
    const hasta = dias[dias.length - 1];

    console.log('\n  ARCHIVO DE CONDUCTA');
    console.log(`  Ventana viva: ${desde} → ${hasta}`);
    console.log(`  ${pares.length} pares (historia, medio) · ${historias} historias · ${medios} medios`);

    if (SECO) {
        const { rows: ya } = await query('SELECT count(*)::int AS n FROM conducta_archivo');
        console.log(`  En seco: no se escribe nada. El archivo tiene hoy ${ya[0].n} pares.\n`);
        return;
    }

    let nuevos = 0;

    await withTransaction(async (client) => {
        /**
         * POR LOTES Y NO FILA A FILA. Son ~6 600 pares por ejecución, y la base
         * está al otro lado de la red: insertarlos de uno en uno serían 6 600
         * viajes de ida y vuelta, varios minutos, y un cron que empieza a rozar
         * su propio tiempo límite. Con UNNEST va en una sentencia por lote.
         *
         * El tamaño lo fija el techo de parámetros de Postgres (65 535): con
         * tres columnas caben 21 845 filas por sentencia, así que 5 000 deja
         * margen de sobra y mantiene los mensajes pequeños.
         */
        const LOTE = 5000;

        for (let i = 0; i < pares.length; i += LOTE) {
            const trozo = pares.slice(i, i + LOTE);
            const { rowCount } = await client.query(
                `INSERT INTO conducta_archivo (story_id, source_id, dia)
                 SELECT * FROM unnest($1::text[], $2::text[], $3::date[])
                 ON CONFLICT (story_id, source_id) DO NOTHING`,
                [
                    trozo.map((p) => p.story_id),
                    trozo.map((p) => p.source_id),
                    trozo.map((p) => p.dia),
                ]
            );
            nuevos += rowCount;
        }

        await client.query(
            `INSERT INTO conducta_archivo_runs
                 (at, pares_vistos, pares_nuevos, historias, medios, ventana_desde, ventana_hasta)
             VALUES (now(), $1, $2, $3, $4, $5, $6)
             ON CONFLICT (at) DO NOTHING`,
            [pares.length, nuevos, historias, medios, desde, hasta]
        );
    });

    const { rows: total } = await query(`
        SELECT count(*)::int                 AS pares,
               count(DISTINCT story_id)::int AS historias,
               min(dia)                      AS desde,
               max(dia)                      AS hasta
          FROM conducta_archivo
    `);
    const t = total[0];
    const diasCubiertos =
        t.desde && t.hasta
            ? Math.round((new Date(t.hasta) - new Date(t.desde)) / 86400000) + 1
            : 0;

    console.log(`  ${nuevos} pares nuevos · ${pares.length - nuevos} ya estaban`);
    console.log(
        `\n  ARCHIVO TOTAL: ${t.pares} pares · ${t.historias} historias · ` +
        `${String(t.desde).slice(0, 10)} → ${String(t.hasta).slice(0, 10)} (${diasCubiertos} días)`
    );

    // La promesa que hacen las fichas. Mientras no se cumpla, conviene verla en
    // cada ejecución en vez de descubrirla en noviembre.
    if (diasCubiertos < 90) {
        console.log(`  Faltan ${90 - diasCubiertos} días para la ventana de 90 que piden las fichas.\n`);
    } else {
        console.log('  Ya hay 90 días archivados: la medición del protocolo es posible.\n');
    }
}

try {
    await main();
} finally {
    await closePool();
}
