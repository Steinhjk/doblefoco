/**
 * MOTOR DE INGESTA — proceso propio, con su propio reloj.   npm run worker
 *
 * POR QUÉ UN PROCESO Y NO UN CRON DE PLATAFORMA
 * ---------------------------------------------
 * Un ciclo tarda entre uno y tres minutos. Las plataformas sin servidor cortan
 * a los 10 segundos (Vercel Hobby) o 60 (Pro), así que ni sus funciones ni sus
 * crons pueden ejecutarlo: forzar un trabajo de minutos dentro de funciones de
 * segundos es de donde salía toda la fragilidad.
 *
 * GitHub Actions sí podía, y funcionó como puente, pero se midió y dispara cada
 * ~2,5 horas en vez de cada 30 minutos —02:01, 04:56, 07:35, 10:25—; se
 * desactiva tras 60 días sin actividad en el repositorio; no tiene SLA; y acopla
 * el motor del producto al alojamiento de su código. Vuelve a ser solo
 * integración continua, que es para lo que existe.
 *
 * Aquí el reloj es una constante de este archivo. Cambiar la cadencia es
 * cambiar un número, no migrar de plataforma.
 *
 * SIN CONECTIVIDAD ENTRANTE
 * -------------------------
 * No escucha en ningún puerto. Para pedirle un ciclo inmediato, el panel
 * escribe una fila en `ingest_requests` y este bucle la mira. Nadie puede
 * alcanzarlo por red: no hay puerto, ni autenticación propia, ni superficie.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { prepareStorage } = await import('../server/bootstrap.js');
const { runIngestionBatch } = await import('../server/services/ingestDaemon.js');
const { claimCycleRequest, finishCycleRequest } = await import('../server/db/requestStore.js');
const { closePool } = await import('../server/db/pool.js');

/** Cada cuánto se ingiere. Media hora: cada feed solo expone sus últimos 15
 *  titulares y un medio activo puede publicar más de 15 en una hora. */
const INTERVALO_MS = Number(process.env.INGEST_INTERVAL_MS) || 30 * 60 * 1000;

/** Cada cuánto se mira si el panel pidió un ciclo inmediato. */
const SONDEO_MS = 20_000;

const log = (m) => console.log(`[motor] ${new Date().toISOString()} ${m}`);

let parando = false;
let ultimoCiclo = 0;

/**
 * Cierre ordenado. Sin esto, un despliegue mata el proceso a mitad de un ciclo
 * y deja una transacción abierta reteniendo bloqueos sobre `stories` hasta que
 * la base la descarta sola.
 */
for (const senal of ['SIGTERM', 'SIGINT']) {
    process.on(senal, () => {
        if (parando) process.exit(1);   // segunda señal: salida inmediata
        parando = true;
        log(`${senal} recibida; se cierra al terminar el ciclo en curso`);
    });
}

async function ciclo(motivo, solicitudId = null) {
    log(`ciclo (${motivo})`);
    const inicio = Date.now();

    try {
        const informe = await runIngestionBatch();

        const resumen = informe.skipped
            ? `saltado: ${informe.reason}`
            : `${informe.newArticles} artículos nuevos · ${informe.totalStories} historias · ` +
              `${informe.feedsOk} feeds · ${Math.round((Date.now() - inicio) / 1000)} s`;

        log(resumen);
        if (solicitudId) await finishCycleRequest(solicitudId, resumen);
    } catch (error) {
        // Un ciclo que falla NO tumba el motor: la próxima vuelta lo reintenta.
        // Los feeds caídos, un corte de red o un fallo puntual de la base son
        // sucesos normales, no motivo para dejar de ingerir para siempre.
        log(`fallo: ${error.message}`);
        if (solicitudId) await finishCycleRequest(solicitudId, `fallo: ${error.message}`);
    }

    ultimoCiclo = Date.now();
}

const estado = await prepareStorage((m) => log(m));

if (!estado.persistent) {
    console.error(`[motor] sin base de datos: ${estado.reason}`);
    await closePool();
    process.exit(1);
}

log(`en marcha · cada ${Math.round(INTERVALO_MS / 60000)} min · sondeo de solicitudes cada ${SONDEO_MS / 1000} s`);
await ciclo('arranque');

while (!parando) {
    await new Promise((r) => setTimeout(r, SONDEO_MS));
    if (parando) break;

    const solicitud = await claimCycleRequest();
    if (solicitud) {
        await ciclo('solicitado desde el panel', solicitud.id);
        continue;
    }

    if (Date.now() - ultimoCiclo >= INTERVALO_MS) await ciclo('programado');
}

log('cerrando');
await closePool();
