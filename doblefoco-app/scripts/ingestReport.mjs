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

import { dailySummary } from '../server/services/metricsStore.js';

const daysArg = process.argv.indexOf('--days');
const days = daysArg !== -1 ? Number(process.argv[daysArg + 1]) || 7 : 7;

const { days: rows, totalCycles, corrupt, file } = await dailySummary({ days });

console.log(`SERIE DE INGESTA — últimos ${days} días`);
console.log('─'.repeat(78));
console.log(`archivo: ${file}`);
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
