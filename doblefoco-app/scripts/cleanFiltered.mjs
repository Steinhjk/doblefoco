/**
 * Retira del corpus lo que el filtro de formatos descartaría hoy — tarea F1-14.
 *
 *   npm run clean:filtered            muestra qué borraría, sin tocar nada
 *   npm run clean:filtered -- --apply lo borra
 *
 * POR QUÉ NO SE HACE SOLO
 * -----------------------
 * Sería fácil colgar esto del ciclo de ingesta y que el corpus se limpiara en
 * cada pasada. No se hace, y la razón es la asimetría del daño: añadir una regla
 * demasiado amplia borraría retroactivamente noticias reales de toda la ventana
 * de retención, sin que apareciera nada en ninguna pantalla. El filtro ya
 * cometió un falso positivo el primer día que se ejecutó —una noticia de obras
 * públicas descartada porque el centro se llamaba "El Dorado", como la
 * lotería—, y eso fue con el filtro mirando solo artículos nuevos.
 *
 * Así que el borrado retroactivo es un acto deliberado: se mira la lista, se
 * decide, y entonces se ejecuta.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { checkConnection, query, closePool } = await import('../server/db/pool.js');
const { assessArticle } = await import('../shared/contentQuality.js');

const apply = process.argv.includes('--apply');

const status = await checkConnection();

if (!status.enabled) {
    console.error(`\n  ✗ Sin base de datos: ${status.reason}\n`);
    process.exitCode = 1;
} else {
    const { rows } = await query('SELECT id, headline FROM articles ORDER BY ingested_at DESC');

    const byRule = new Map();

    for (const row of rows) {
        const verdict = assessArticle({ headline: row.headline });
        if (verdict.indexable) continue;

        if (!byRule.has(verdict.ruleId)) byRule.set(verdict.ruleId, { reason: verdict.reason, items: [] });
        byRule.get(verdict.ruleId).items.push(row);
    }

    const doomed = [...byRule.values()].flatMap((g) => g.items);

    console.log(`\n  ${apply ? 'LIMPIEZA' : 'SIMULACIÓN'} DEL CORPUS — F1-14\n`);
    console.log(`  Artículos almacenados: ${rows.length}`);
    console.log(`  Que el filtro descartaría hoy: ${doomed.length} (${((100 * doomed.length) / (rows.length || 1)).toFixed(1)} %)\n`);

    for (const [ruleId, group] of [...byRule.entries()].sort((a, b) => b[1].items.length - a[1].items.length)) {
        console.log(`  ${ruleId} — ${group.reason}: ${group.items.length}`);
        // Se listan TODOS, no una muestra: quien decide borrar tiene que poder
        // leer lo que va a borrar. Con estas cifras cabe en pantalla; si algún
        // día no cupiera, sería señal de que el filtro se pasó de ancho.
        for (const item of group.items) {
            console.log(`      · ${item.headline.slice(0, 88)}`);
        }
        console.log('');
    }

    if (!doomed.length) {
        console.log('  Nada que limpiar.\n');
    } else if (!apply) {
        console.log('  No se ha borrado nada. Revisa la lista de arriba y, si es correcta:');
        console.log('    npm run clean:filtered -- --apply\n');
    } else {
        // El borrado arrastra story_articles en cascada; las historias que
        // queden sin artículos las recalcula el siguiente ciclo.
        const { rowCount } = await query('DELETE FROM articles WHERE id = ANY($1::text[])', [
            doomed.map((d) => d.id),
        ]);

        const { rows: huerfanas } = await query(`
            SELECT count(*)::int AS n
              FROM stories s
             WHERE NOT EXISTS (SELECT 1 FROM story_articles sa WHERE sa.story_id = s.id)
        `);

        console.log(`  ${rowCount} artículos borrados.`);
        console.log(`  ${huerfanas[0].n} historias quedaron sin artículos; el próximo ciclo las retira.`);
        console.log('');
    }
}

await closePool();
