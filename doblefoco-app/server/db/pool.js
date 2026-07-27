/**
 * CONEXIÓN A POSTGRES — tarea F2-01.
 *
 * Principio de este archivo: la base de datos es una MEJORA, no un requisito.
 *
 * Sin DATABASE_URL el sistema arranca y funciona exactamente como antes, con
 * los artículos en memoria. Eso permite que alguien clone el repositorio y
 * levante el proyecto sin credenciales, y evita que un fallo de la base tumbe
 * la ingesta: el dato que importa es la noticia; guardarla importa mucho, pero
 * no más que servirla.
 *
 * La consecuencia se declara en voz alta y no se disimula: con la base
 * desconectada, un reinicio borra todo lo ingerido, y el arranque lo advierte.
 */

import { readFileSync } from 'node:fs';
import pg from 'pg';

const { Pool, types } = pg;

/**
 * Las marcas de tiempo se leen como cadena ISO, no como Date de JavaScript.
 *
 * `pg` convierte TIMESTAMPTZ usando la zona horaria del proceso, y todo el
 * sistema —la serie de métricas, las fechas de publicación, el frontend— habla
 * ISO-8601 en UTC. Dejarlo al huso del servidor significaría que el mismo dato
 * se lee distinto en Bogotá y en el contenedor donde corra el despliegue.
 */
types.setTypeParser(types.builtins.TIMESTAMPTZ, (value) =>
    value === null ? null : new Date(value).toISOString()
);

/** DATE se queda como 'YYYY-MM-DD'. Es lo que guarda `reviewedAt` del registro. */
types.setTypeParser(types.builtins.DATE, (value) => value);

/** BIGINT como número: los contadores de este proyecto no rozan 2^53. */
types.setTypeParser(types.builtins.INT8, (value) => (value === null ? null : Number(value)));

const CONNECTION_STRING = process.env.DATABASE_URL?.trim() || null;

/** @type {import('pg').Pool | null} */
let pool = null;
let poolFailed = false;

/** ¿La cadena de conexión apunta a la propia máquina? */
function isLocalConnection(connectionString) {
    try {
        const { hostname } = new URL(connectionString);
        return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    } catch {
        return false;
    }
}

/**
 * Configuración de TLS.
 *
 * En local no se exige. Contra un Postgres gestionado sí, y ahí aparece un
 * detalle incómodo que conviene dejar escrito: Supabase presenta un certificado
 * de su propia autoridad, que no está en el almacén de Node. La salida fácil es
 * `rejectUnauthorized: false`, que cifra el tránsito pero deja de verificar con
 * quién se está hablando: protege del espionaje pasivo, no de un intermediario
 * activo.
 *
 * Es el valor por omisión porque sin él no hay conexión, pero no se esconde:
 *   · `sslWarning()` lo reporta en cada arranque;
 *   · DATABASE_CA_CERT, con la ruta al certificado de la autoridad, activa la
 *     verificación completa. Así debe quedar en producción.
 */
function sslConfig(connectionString) {
    if (isLocalConnection(connectionString)) return false;

    const caPath = process.env.DATABASE_CA_CERT?.trim();
    if (!caPath) return { rejectUnauthorized: false };

    // Lectura síncrona a propósito: ocurre una vez, en el arranque. Si el
    // certificado no está, es mejor fallar aquí que más tarde con un error de
    // red que no se parece en nada a la causa real.
    return { ca: readFileSync(caPath, 'utf8'), rejectUnauthorized: true };
}

/** Mensaje de aviso si la conexión va cifrada pero sin verificar. `null` si todo bien. */
export function sslWarning() {
    if (!CONNECTION_STRING || isLocalConnection(CONNECTION_STRING)) return null;
    if (process.env.DATABASE_CA_CERT?.trim()) return null;
    return 'TLS sin verificación de certificado (falta DATABASE_CA_CERT): el tránsito va cifrado, pero no se comprueba la identidad del servidor.';
}

/** ¿Hay base de datos utilizable? */
export function isDatabaseEnabled() {
    return Boolean(CONNECTION_STRING) && !poolFailed;
}

/** Devuelve el pool, creándolo la primera vez. `null` si no hay base. */
export function getPool() {
    if (!CONNECTION_STRING || poolFailed) return null;
    if (pool) return pool;

    pool = new Pool({
        connectionString: CONNECTION_STRING,
        ssl: sslConfig(CONNECTION_STRING),
        max: Number(process.env.DATABASE_POOL_MAX) || 8,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
        application_name: 'doblefoco',
    });

    /**
     * Un error en una conexión ociosa (la base se reinició, la red se cayó) no
     * puede tumbar el proceso. `pg` emite 'error' en el pool y, sin este
     * manejador, Node lo trata como excepción no capturada y mata el servidor.
     */
    pool.on('error', (error) => {
        console.warn(`[db] error en conexión ociosa: ${error.message}`);
    });

    return pool;
}

/**
 * Ejecuta una consulta. Lanza si falla: quien llama decide si eso es fatal.
 */
export async function query(text, params = []) {
    const client = getPool();
    if (!client) throw new Error('No hay base de datos configurada (falta DATABASE_URL)');
    return client.query(text, params);
}

/**
 * Igual que `query`, pero nunca lanza: devuelve `null` y avisa.
 *
 * Es la variante que usa el motor de ingesta, con el mismo criterio que
 * metricsStore: un fallo al guardar no puede impedir que el ciclo termine y
 * sirva las noticias que ya tiene.
 */
export async function safeQuery(text, params = [], context = 'consulta') {
    try {
        return await query(text, params);
    } catch (error) {
        console.warn(`[db] ${context} falló: ${error.message}`);
        return null;
    }
}

/**
 * Ejecuta una función dentro de una transacción: confirma si termina bien,
 * revierte si lanza, y siempre devuelve la conexión al pool.
 */
export async function withTransaction(fn) {
    const client = getPool();
    if (!client) throw new Error('No hay base de datos configurada (falta DATABASE_URL)');

    const connection = await client.connect();

    try {
        await connection.query('BEGIN');
        const result = await fn(connection);
        await connection.query('COMMIT');
        return result;
    } catch (error) {
        try {
            await connection.query('ROLLBACK');
        } catch (rollbackError) {
            console.warn(`[db] fallo al revertir: ${rollbackError.message}`);
        }
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Comprueba la conexión una vez, al arrancar.
 *
 * Devuelve el estado en lugar de lanzar, porque el servidor debe poder arrancar
 * en modo memoria si la base no responde. Si falla, el pool queda marcado como
 * caído y el resto del sistema degrada solo.
 */
export async function checkConnection() {
    if (!CONNECTION_STRING) {
        return { enabled: false, reason: 'DATABASE_URL sin definir' };
    }

    try {
        const { rows } = await query('SELECT current_database() AS db, version() AS version');
        return {
            enabled: true,
            database: rows[0].db,
            version: String(rows[0].version).split(' ').slice(0, 2).join(' '),
        };
    } catch (error) {
        poolFailed = true;
        return { enabled: false, reason: error.message };
    }
}

/** Cierra el pool. Para los scripts, que si no se quedan colgados al terminar. */
export async function closePool() {
    if (!pool) return;
    await pool.end();
    pool = null;
}

export const DATABASE_URL_PRESENT = Boolean(CONNECTION_STRING);
