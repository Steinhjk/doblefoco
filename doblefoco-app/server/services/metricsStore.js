/**
 * SERIE DE MEDICIÓN DE LA INGESTA — primera pieza persistente del sistema.
 *
 * Por qué esto antes que la base de datos de artículos
 * ----------------------------------------------------
 * La tarea F1-01 pide una serie de 7 días (artículos, historias, historias
 * multifuente, cuántas cruzan espectros) para decidir si hay que ampliar
 * medios, ampliar la ventana de retención o cambiar el agrupamiento. Sin esa
 * serie, F1-05 y F1-12 se decidirían a ojo.
 *
 * Migrar los artículos a Postgres es un trabajo grande. Registrar cada ciclo
 * son cinco campos. Y mientras tanto, cada día sin registrar es un día de datos
 * que no se recupera: la medición no se puede hacer retroactivamente porque los
 * artículos se descartan a las 72 horas.
 *
 * Por eso lo barato va primero. Esto no sustituye a F2-01; es la parte de F2-01
 * que ya no puede esperar.
 *
 * Formato
 * -------
 * JSONL: una línea de JSON por ciclo, añadida al final. Elegido sobre SQLite o
 * Postgres a propósito:
 *   · Añadir al final es la operación más resistente a un corte: un proceso que
 *     muere a mitad de escritura corrompe UNA línea, no el archivo.
 *   · Una línea corrupta se salta y se cuenta; no tumba la lectura.
 *   · Se lee con `tail` y se migra a Postgres con un INSERT por línea.
 * Cuando exista F2-01, esto se vuelca a la tabla `ingest_runs` (el esquema está
 * en server/db/schema.sql) y este archivo queda como respaldo local.
 */

import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

/**
 * Directorio de datos. Configurable porque en un contenedor el disco escribible
 * casi nunca es el del código.
 */
const DATA_DIR = process.env.DATA_DIR
    ? resolve(process.env.DATA_DIR)
    : resolve(process.cwd(), 'data');

const RUNS_FILE = resolve(DATA_DIR, 'ingest_runs.jsonl');

let writeQueue = Promise.resolve();

/**
 * Registra un ciclo. Nunca lanza.
 *
 * Un fallo al escribir la métrica no puede tumbar la ingesta: el dato que
 * importa es la noticia, no la estadística sobre la noticia. Se avisa por
 * consola y se sigue.
 */
export function recordIngestRun(record) {
    const row = {
        at: record.startedAt ?? new Date().toISOString(),
        durationMs: record.durationMs ?? null,
        feedsOk: record.feedsOk ?? 0,
        feedsFailed: record.feedsFailed ?? 0,
        newArticles: record.newArticles ?? 0,
        filteredArticles: record.filteredArticles ?? 0,
        totalArticles: record.totalArticles ?? 0,
        totalStories: record.totalStories ?? 0,
        multiSourceStories: record.multiSourceStories ?? 0,
        crossSpectrumStories: record.crossSpectrumStories ?? 0,
        blindspotStories: record.blindspotStories ?? 0,
        activeFeeds: record.activeFeeds ?? 0,
        cadenciaNuevas: record.cadenciaNuevas ?? null,
    };

    // Encolado: dos ciclos solapados no pueden entrelazar sus escrituras.
    writeQueue = writeQueue.then(async () => {
        try {
            await mkdir(dirname(RUNS_FILE), { recursive: true });
            await appendFile(RUNS_FILE, `${JSON.stringify(row)}\n`, 'utf8');
        } catch (error) {
            console.warn(`[métricas] no se pudo registrar el ciclo: ${error.message}`);
        }
    });

    return writeQueue;
}

/**
 * Lee la serie completa.
 * Devuelve también cuántas líneas se descartaron por ilegibles, porque un
 * contador de errores silencioso es un error que nadie arregla.
 */
export async function readIngestRuns({ sinceMs = null } = {}) {
    let raw;

    try {
        raw = await readFile(RUNS_FILE, 'utf8');
    } catch (error) {
        if (error.code === 'ENOENT') return { runs: [], corrupt: 0 };
        throw error;
    }

    const runs = [];
    let corrupt = 0;

    for (const line of raw.split('\n')) {
        if (!line.trim()) continue;
        try {
            const parsed = JSON.parse(line);
            const stamp = Date.parse(parsed.at);
            if (sinceMs && Number.isFinite(stamp) && stamp < sinceMs) continue;
            runs.push(parsed);
        } catch {
            corrupt += 1;
        }
    }

    return { runs, corrupt };
}

/**
 * Agrega la serie por día natural.
 *
 * `totalArticles` y `totalStories` son fotos del estado en cada momento, no
 * cantidades acumulables: sumarlas a lo largo del día no significa nada. De
 * esas se toma el máximo del día; de las que sí son incrementos
 * (`newArticles`), la suma.
 */
export async function dailySummary({ days = 7 } = {}) {
    const sinceMs = Date.now() - days * 24 * 60 * 60 * 1000;
    const { runs, corrupt } = await readIngestRuns({ sinceMs });

    const byDay = new Map();

    for (const run of runs) {
        const day = String(run.at).slice(0, 10);

        const entry = byDay.get(day) ?? {
            day,
            cycles: 0,
            newArticles: 0,
            filteredArticles: 0,
            peakArticles: 0,
            peakStories: 0,
            peakMultiSource: 0,
            peakCrossSpectrum: 0,
            peakBlindspots: 0,
            feedFailures: 0,
        };

        entry.cycles += 1;
        entry.newArticles += run.newArticles ?? 0;
        entry.filteredArticles += run.filteredArticles ?? 0;
        entry.feedFailures += run.feedsFailed ?? 0;
        entry.peakArticles = Math.max(entry.peakArticles, run.totalArticles ?? 0);
        entry.peakStories = Math.max(entry.peakStories, run.totalStories ?? 0);
        entry.peakMultiSource = Math.max(entry.peakMultiSource, run.multiSourceStories ?? 0);
        entry.peakCrossSpectrum = Math.max(entry.peakCrossSpectrum, run.crossSpectrumStories ?? 0);
        entry.peakBlindspots = Math.max(entry.peakBlindspots, run.blindspotStories ?? 0);

        byDay.set(day, entry);
    }

    return {
        days: [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day)),
        totalCycles: runs.length,
        corrupt,
        file: RUNS_FILE,
    };
}

export const METRICS_FILE = RUNS_FILE;
