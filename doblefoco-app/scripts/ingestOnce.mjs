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
 *   0  el ciclo terminó y se persistió, O lo estaba haciendo otro proceso
 *   1  no se pudo persistir
 *
 * Que falle es intencional. Una ejecución que lee 36 feeds y no guarda nada es
 * un fallo silencioso: en GitHub Actions saldría en verde y la serie se
 * quedaría con un agujero que nadie notaría hasta ir a analizarla, cuando ya no
 * se puede reconstruir.
 *
 * Encontrar el cerrojo tomado NO es ese caso, y por eso sale con 0. El motor de
 * Fly y este cron corren los dos cada media hora; cuando se cruzan, el cerrojo
 * consultivo hace que uno se salte el ciclo — que es justo lo que debe pasar, y
 * el ciclo lo hizo el otro. Salir con 1 ahí mandaba un correo de fallo por algo
 * que funcionó como estaba diseñado, y un aviso que grita cuando no pasa nada
 * es peor que no tener aviso: enseña a ignorarlos, y el día que la serie sí se
 * rompa el correo llegará al mismo sitio donde ya no se mira.
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

    // Sin `process.exitCode`: esto es una salida en verde. El texto lo dice en
    // voz alta para que quien mire el registro no tenga que deducirlo del
    // código de salida.
    if (report.skipped) {
        console.log(`\n  ↷ ${report.reason}`);
        console.log('    No es un fallo: el ciclo lo está haciendo el otro proceso.\n');
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

/**
 * SALIDA EXPLÍCITA. No sobra, y esto es lo que costó averiguarlo.
 *
 * Node no termina cuando el programa acaba: termina cuando no le queda ningún
 * manejador abierto. Aquí el trabajo acababa y el proceso se quedaba vivo sin
 * hacer nada. Medido contra el registro de GitHub Actions, comparando la última
 * línea de trabajo con el fin del job:
 *
 *   31101439478 ....... 51 s de más
 *   30967792725 ..... 4m 17s de más
 *   31005326763 ..... 4m 20s de más
 *   31072710963 ..... 9m 14s, y ahí lo mató el `timeout-minutes: 10`
 *
 * Cuatro ejecuciones acabaron en «cancelled» por esto en 36 horas. El dato ya
 * estaba guardado —la cancelación llegaba mucho después de persistir—, así que
 * no se perdió ninguna serie, pero el historial quedaba en rojo por un ciclo
 * que había ido bien, y una cancelación a destiempo sí podría cortar una
 * escritura algún día.
 *
 * Qué queda abierto: sockets HTTP, no la base — `closePool()` ya cerró
 * Postgres. El sospechoso es el keep-alive de `fetch` en el enriquecido de
 * og:image, que honra el `Keep-Alive` que anuncie el servidor del medio hasta
 * 600 s; ese techo coincide con los 10 minutos observados, y explica por qué el
 * retraso varía tanto de una ejecución a otra: depende de a qué medios se les
 * pidió la portada del artículo en esa pasada.
 *
 * Se podría perseguir cada socket, pero para un script de una sola pasada la
 * respuesta correcta es más simple: el trabajo terminó, no hay nada más que
 * esperar. Antes se vacía la salida, porque `process.exit()` con stdout hacia
 * una tubería —que es lo que es en Actions— trunca lo que quede sin escribir, y
 * perder las últimas líneas del informe sería cambiar un problema por otro.
 */
await new Promise((resolve) => process.stdout.write('', resolve));
process.exit(process.exitCode ?? 0);
