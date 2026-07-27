/**
 * PREPARACIÓN DE LA PERSISTENCIA — compartida por el servidor y por el cron.
 *
 * Vive aparte de server/index.js porque hay dos formas de ejecutar el motor y
 * las dos necesitan exactamente esta secuencia:
 *
 *   · el servidor de larga duración (server/index.js), que además sirve la API;
 *   · el ciclo aislado que dispara GitHub Actions (scripts/ingestOnce.mjs),
 *     que arranca, ingiere una vez y muere.
 *
 * Duplicar estos tres pasos habría sido la manera segura de que se
 * desincronizaran, y el que se quedara atrás sería justo el que corre
 * desatendido y sin nadie mirando la consola.
 */

import { checkConnection, sslWarning } from './db/pool.js';
import { syncSources } from './db/sourceSync.js';
import { hydrate } from './services/ingestDaemon.js';

/**
 * Deja la persistencia lista para ingerir.
 *
 * El orden importa y no es arbitrario:
 *   1. Comprobar la conexión. Si falla, el pool queda marcado y todo lo demás
 *      degrada solo a memoria.
 *   2. Proyectar el catálogo sobre `sources`. Si se añadió un medio al registro
 *      y se desplegó sin migrar, sin este paso la primera ingesta insertaría
 *      artículos con un `source_id` inexistente y la clave foránea rechazaría
 *      el lote entero.
 *   3. Rehidratar. Esto es lo que convierte la base en algo más que un archivo
 *      de solo escritura. En el servidor significa que el sitio sirve contenido
 *      desde el primer segundo; en el cron significa algo más importante
 *      todavía: sin rehidratar, cada ejecución agruparía solo sus propios 15
 *      titulares por feed y no vería NUNCA el solapamiento acumulado de las 72
 *      horas, que es precisamente lo que F1-01 tiene que medir.
 *
 * No lanza. Devuelve qué pasó para que quien llama decida si eso es aceptable:
 * el servidor sigue adelante en memoria, el cron falla la ejecución.
 *
 * @param {(message: string) => void} log
 * @returns {Promise<{persistent: boolean, reason?: string, recovered: number}>}
 */
export async function prepareStorage(log = console.log) {
    const status = await checkConnection();

    if (!status.enabled) {
        return { persistent: false, reason: status.reason, recovered: 0 };
    }

    log(`base de datos: ${status.database} · ${status.version}`);

    const warning = sslWarning();
    if (warning) console.warn(`[aviso] ${warning}`);

    try {
        const sources = await syncSources();
        log(`catálogo proyectado: ${sources.inserted} medios nuevos, ${sources.updated} actualizados`);
    } catch (error) {
        return {
            persistent: false,
            reason: `no se pudo proyectar el catálogo: ${error.message}. ¿Corriste \`npm run db:migrate\`?`,
            recovered: 0,
        };
    }

    const recovered = await hydrate();
    log(
        recovered
            ? `${recovered} artículos recuperados de la base`
            : 'la base está vacía: se llena con este ciclo'
    );

    return { persistent: true, recovered };
}
