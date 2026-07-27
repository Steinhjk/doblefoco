/**
 * UN CICLO DE INGESTA Y SALIR.   Uso: npm run ingest:once
 *
 * Es lo que ejecuta .github/workflows/ingest.yml cada 30 minutos. El motor no
 * necesita estar vivo entre ciclos: lee los feeds, agrupa, escribe en Postgres
 * y muere. Eso es exactamente lo que sabe hacer un cron, y evita pagar un
 * servidor encendido las 24 horas solo para que despierte cada media hora.
 *
 * La rehidratación NO es opcional aquí, y conviene entender por qué.
 * Cada ejecución arranca con la memoria vacía. Sin recuperar antes lo ya
 * ingerido, el agrupamiento solo vería los 15 titulares que trae cada feed en
 * ESA pasada, y el solapamiento acumulado de la ventana de 72 horas —que es
 * justo lo que F1-01 tiene que medir— no aparecería nunca. La serie saldría
 * plana y la conclusión sería falsa.
 *
 * CÓDIGOS DE SALIDA
 *   0  el ciclo terminó y se persistió
 *   1  no se pudo persistir
 *
 * Que falle es intencional. Una ejecución que lee 36 feeds y no guarda nada es
 * un fallo silencioso: en GitHub Actions saldría en verde y la serie se
 * quedaría con un agujero que nadie notaría hasta ir a analizarla, cuando ya no
 * se puede reconstruir.
 *
 * Los feeds caídos NO fallan la ejecución. Que un medio no responda es un hecho
 * normal del que ya se deja constancia en `ingest_runs.feeds_failed`; tratarlo
 * como error convertiría las notificaciones en ruido que se acaba ignorando.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// En local lee .env.local; en GitHub Actions no existe y las variables llegan
// del entorno. `dotenv` no pisa lo que ya esté definido, así que el orden es
// seguro en los dos casos.
dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { prepareStorage } = await import('../server/bootstrap.js');
const { runIngestionBatch } = await import('../server/services/ingestDaemon.js');
const { closePool } = await import('../server/db/pool.js');
const { countStored } = await import('../server/db/contentStore.js');

const log = (message) => console.log(`  ${message}`);

async function main() {
    console.log('\n  CICLO DE INGESTA — DobleFoco\n');

    const storage = await prepareStorage(log);

    if (!storage.persistent) {
        console.error(`\n  ✗ Sin persistencia: ${storage.reason}`);
        console.error('    El ciclo no se ejecuta: leer 36 feeds para tirar el resultado');
        console.error('    solo molestaría a los medios sin producir ningún dato.\n');
        process.exitCode = 1;
        return;
    }

    const report = await runIngestionBatch();

    if (report.skipped) {
        console.error(`\n  ✗ ${report.reason}\n`);
        process.exitCode = 1;
        return;
    }

    const stored = await countStored();

    console.log('');
    log(`${report.newArticles} artículos nuevos · ${report.totalStories} historias`);
    log(
        `${report.multiSourceStories} multifuente · ${report.crossSpectrumStories} cruzan espectros · ` +
        `${report.blindspotStories} con cobertura para afirmar un punto ciego`
    );
    log(`${report.feedsOk} feeds respondieron · ${report.durationMs} ms`);

    if (report.feedsFailed.length) {
        log(`feeds caídos (${report.feedsFailed.length}), no es motivo de fallo:`);
        for (const failure of report.feedsFailed) {
            log(`  · ${failure.feed}: ${failure.error}`);
        }
    }

    if (stored) {
        log(`en la base: ${stored.articles} artículos · ${stored.stories} historias · ${stored.runs} ciclos`);
    }

    console.log('');
}

try {
    await main();
} catch (error) {
    console.error(`\n  ✗ ${error.message}\n`);
    if (process.env.DEBUG) console.error(error);
    process.exitCode = 1;
} finally {
    await closePool();
}
