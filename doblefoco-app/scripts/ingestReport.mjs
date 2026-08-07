/**
 * Informe de la serie de ingesta — el entregable de la tarea F1-01.
 *
 * Ejecutar con: npm run report:ingest [-- --days 14]
 *
 * F1-01 pide "una tabla de 7 días y una decisión escrita". Esto imprime la
 * tabla. La decisión la escribe una persona en el ROADMAP, porque decidir si
 * hay que ampliar medios o cambiar el algoritmo de agrupamiento no es algo que
 * deba salir automatizado de un script.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Antes de importar nada que lea process.env al evaluarse (pool.js lo hace).
dotenv.config({
    path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local'),
    quiet: true,
});

const { dailySummary } = await import('../server/services/metricsStore.js');
const { dailySummaryFromDb } = await import('../server/db/contentStore.js');
const { isDatabaseEnabled } = await import('../server/db/pool.js');
const { closePool } = await import('../server/db/pool.js');

const daysArg = process.argv.indexOf('--days');
const days = daysArg !== -1 ? Number(process.argv[daysArg + 1]) || 7 : 7;

/**
 * LA BASE PRIMERO, EL JSONL DESPUÉS — misma precedencia que /api/metrics/daily.
 *
 * Este script leía SOLO el JSONL, y eso lo dejaba ciego justo para lo que
 * existe. El JSONL es local a cada máquina: en el portátil tiene los ciclos que
 * alguien corrió a mano, y la serie de verdad —la que acumulan el motor de Fly
 * y GitHub Actions— vive en `ingest_runs`. Comprobado el 2026-08-07: la
 * herramienta imprimía «2 ciclos registrados · AVISO: hay 2 día(s) de datos»
 * cuando en la base había 595 ciclos y 11 días. Es decir, el entregable de
 * F1-01 no veía los datos de F1-01, y el aviso decía que no se podía decidir
 * cuando sí se podía.
 *
 * El JSONL se conserva como respaldo y no como fuente principal, que es
 * exactamente el papel que le da el ROADMAP: sobrevive a que la base no
 * responda.
 */
const deLaBase = isDatabaseEnabled() ? await dailySummaryFromDb({ days }) : null;
const delArchivo = deLaBase ? null : await dailySummary({ days });

const rows = deLaBase?.days ?? delArchivo?.days ?? [];
const totalCycles = deLaBase?.totalCycles ?? delArchivo?.totalCycles ?? 0;
const corrupt = delArchivo?.corrupt ?? 0;
const origen = deLaBase ? 'base de datos (ingest_runs)' : `archivo: ${delArchivo?.file}`;

console.log(`SERIE DE INGESTA — últimos ${days} días`);
console.log('─'.repeat(78));
console.log(`origen: ${origen}`);
console.log();

if (!rows.length) {
    console.log('Todavía no hay ningún ciclo registrado.');
    console.log();
    console.log('La serie se llena sola cuando el motor corre: cada ciclo de ingesta');
    console.log('añade una línea. Arranque el servidor con `npm run dev:server` y');
    console.log('vuelva a ejecutar esto pasadas unas horas.');
    console.log();
    console.log('Nada de esto es recuperable hacia atrás: los artículos se descartan a');
    console.log('las 72 horas, así que los días que el motor no corra son días que no');
    console.log('van a estar en la tabla.');
    process.exit(0);
}

const head =
    'día'.padEnd(12) +
    'ciclos'.padStart(7) +
    'art. nuevos'.padStart(13) +
    'histor.'.padStart(9) +
    'multif.'.padStart(9) +
    'cruzan'.padStart(8) +
    'p.ciegos'.padStart(10) +
    'fallos'.padStart(8);

console.log(head);
console.log('─'.repeat(78));

for (const row of rows) {
    console.log(
        row.day.padEnd(12) +
        String(row.cycles).padStart(7) +
        String(row.newArticles).padStart(13) +
        String(row.peakStories).padStart(9) +
        String(row.peakMultiSource).padStart(9) +
        String(row.peakCrossSpectrum).padStart(8) +
        String(row.peakBlindspots).padStart(10) +
        String(row.feedFailures).padStart(8)
    );
}

console.log('─'.repeat(78));
console.log();
console.log('Cómo leer esto:');
console.log('  · "art. nuevos" se suma a lo largo del día (son incrementos).');
console.log('  · el resto son máximos del día: el estado del feed es una foto en cada');
console.log('    momento, no una cantidad que se acumule. Sumarlos no significaría nada.');
console.log('  · "cruzan" son las historias con medios de más de un bloque del espectro.');
console.log('    Es la cifra que decide si el producto funciona: sin ella no hay');
console.log('    comparación de encuadres, solo un lector de RSS.');
console.log();
console.log(`${totalCycles} ciclos registrados${corrupt ? ` · ${corrupt} líneas ilegibles descartadas` : ''}`);

if (rows.length < 7) {
    console.log();
    console.log(`AVISO: hay ${rows.length} día(s) de datos. F1-01 pide 7 antes de decidir nada.`);
}

// Sin esto el proceso se queda vivo con la conexión abierta.
await closePool();
