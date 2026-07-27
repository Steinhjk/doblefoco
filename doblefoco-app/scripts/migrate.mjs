/**
 * MIGRACIÓN — tarea F2-01.   Uso: npm run db:migrate
 *
 * Hace tres cosas, en este orden y por esta razón:
 *
 *   1. Aplica server/db/schema.sql. Todo el esquema es CREATE ... IF NOT EXISTS,
 *      así que correrlo dos veces no rompe nada.
 *   2. Proyecta shared/mediaRegistry.js sobre la tabla `sources`. La palabra es
 *      PROYECCIÓN, no copia: el registro sigue siendo la única fuente de verdad
 *      del sesgo (tarea F1-04, que costó descubrir cuatro documentos
 *      contradictorios). Esta tabla existe solo para que `articles.source_id`
 *      tenga a qué apuntar, y se regenera desde el registro cada vez.
 *   3. Importa data/ingest_runs.jsonl a `ingest_runs`. Sin duplicar: la columna
 *      `at` es UNIQUE, así que reejecutar la migración no infla la serie.
 *
 * El JSONL NO se borra tras importarlo. Sigue siendo el registro que sobrevive
 * a que la base no esté disponible, y es más resistente a un corte de luz que
 * cualquier cosa que hagamos por red.
 *
 * Es idempotente entera. Se puede correr en cada despliegue.
 */

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// Se carga antes de importar cualquier módulo que lea process.env al evaluarse
// (pool.js lee DATABASE_URL en su nivel superior).
dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { checkConnection, query, withTransaction, closePool, sslWarning } = await import(
    '../server/db/pool.js'
);
const { syncSources } = await import('../server/db/sourceSync.js');
const { MEDIA_REGISTRY } = await import('../shared/mediaRegistry.js');
const { readIngestRuns, METRICS_FILE } = await import('../server/services/metricsStore.js');

const SCHEMA_FILE = resolve(ROOT, 'server/db/schema.sql');

/** Sale con un mensaje útil en vez de con una traza de pila. */
function fail(message, hint = null) {
    console.error(`\n  ✗ ${message}`);
    if (hint) console.error(`    ${hint}`);
    console.error('');
    process.exitCode = 1;
}

// ---------------------------------------------------------------------------
// 1. Esquema
// ---------------------------------------------------------------------------

async function applySchema() {
    const sql = await readFile(SCHEMA_FILE, 'utf8');

    // Una sola sentencia con todo el archivo: pg lo envía en modo "simple
    // query", que admite varias sentencias y las ejecuta en una transacción
    // implícita. Si una falla, no queda un esquema a medias.
    await query(sql);

    const { rows } = await query(`
        SELECT table_name
          FROM information_schema.tables
         WHERE table_schema = 'public'
         ORDER BY table_name
    `);

    return rows.map((r) => r.table_name);
}

// ---------------------------------------------------------------------------
// 2. Medios — la proyección vive en server/db/sourceSync.js porque el servidor
//    la ejecuta también al arrancar.
// 3. Serie de ingesta
// ---------------------------------------------------------------------------

async function importMetrics() {
    const { runs, corrupt } = await readIngestRuns();
    if (!runs.length) return { imported: 0, skipped: 0, corrupt, total: 0 };

    let imported = 0;

    await withTransaction(async (client) => {
        for (const run of runs) {
            // Una línea sin marca de tiempo válida no se puede desduplicar ni
            // ubicar en la serie: se cuenta como corrupta y se salta.
            if (!Number.isFinite(Date.parse(run.at))) continue;

            const { rowCount } = await client.query(
                `
                INSERT INTO ingest_runs
                    (at, duration_ms, feeds_ok, feeds_failed, active_feeds, new_articles,
                     total_articles, total_stories, multi_source_stories,
                     cross_spectrum_stories, blindspot_stories)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (at) DO NOTHING
                `,
                [
                    run.at,
                    run.durationMs ?? null,
                    run.feedsOk ?? 0,
                    run.feedsFailed ?? 0,
                    run.activeFeeds ?? 0,
                    run.newArticles ?? 0,
                    run.totalArticles ?? 0,
                    run.totalStories ?? 0,
                    run.multiSourceStories ?? 0,
                    run.crossSpectrumStories ?? 0,
                    run.blindspotStories ?? 0,
                ]
            );

            imported += rowCount;
        }
    });

    return {
        imported,
        skipped: runs.length - imported,
        corrupt,
        total: runs.length,
    };
}

// ---------------------------------------------------------------------------

async function main() {
    console.log('\n  MIGRACIÓN DE DOBLEFOCO — F2-01\n');

    const status = await checkConnection();

    if (!status.enabled) {
        fail(
            `No se pudo conectar: ${status.reason}`,
            'Completa DATABASE_URL en .env.local. Supabase → Project Settings →\n' +
            '    Database → Connection string → URI, la de "Session pooler".'
        );
        return;
    }

    console.log(`  Conectado a ${status.database} · ${status.version}`);

    const warning = sslWarning();
    if (warning) console.log(`  ⚠ ${warning}`);
    console.log('');

    const tables = await applySchema();
    console.log(`  1. Esquema aplicado · ${tables.length} tablas: ${tables.join(', ')}`);

    const sources = await syncSources();
    console.log(
        `  2. Medios proyectados · ${sources.inserted} nuevos, ${sources.updated} actualizados ` +
        `(${MEDIA_REGISTRY.length} en el registro)`
    );

    if (sources.orphans.length) {
        console.log(
            `     ⚠ ${sources.orphans.length} en la base que ya no están en el registro, ` +
            'conservados por trazabilidad:'
        );
        for (const orphan of sources.orphans) {
            console.log(`       · ${orphan.name} (${orphan.id})`);
        }
    }

    const metrics = await importMetrics();
    console.log(
        `  3. Serie de ingesta · ${metrics.imported} ciclos importados, ` +
        `${metrics.skipped} ya estaban (${metrics.total} en el JSONL)`
    );

    if (metrics.corrupt) {
        console.log(`     ⚠ ${metrics.corrupt} líneas ilegibles en ${METRICS_FILE}, saltadas`);
    }

    const { rows: counts } = await query(`
        SELECT
            (SELECT count(*) FROM sources)        AS sources,
            (SELECT count(*) FROM ingest_runs)    AS ingest_runs,
            (SELECT count(*) FROM articles)       AS articles,
            (SELECT count(*) FROM stories)        AS stories
    `);

    const total = counts[0];
    console.log(
        `\n  Estado: ${total.sources} medios · ${total.ingest_runs} ciclos · ` +
        `${total.articles} artículos · ${total.stories} historias\n`
    );
}

try {
    await main();
} catch (error) {
    fail(error.message, error.hint ?? null);
    if (process.env.DEBUG) console.error(error);
} finally {
    await closePool();
}
