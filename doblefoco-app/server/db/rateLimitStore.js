/**
 * Límite de peticiones compartido — tarea F2-06.
 *
 * POR QUÉ DEJÓ DE SER OPCIONAL
 * ----------------------------
 * El contador vivía en un Map de cada proceso. Con una sola instancia servía;
 * con la API sin estado, cada invocación arrancaría con su propio Map y el
 * límite de ocho intentos de acceso no limitaría absolutamente nada. Quien
 * quisiera probar contraseñas solo tendría que dejar que le tocara otra
 * invocación.
 *
 * SIN DATOS PERSONALES
 * --------------------
 * Se guarda el HASH de la clave, no la clave. Un limitador por IP normalmente
 * almacena la IP, que es dato personal bajo la Ley 1581. Aquí la fila contiene
 * sha256('login:ip:190.…') y no hay manera de recuperar la dirección desde la
 * tabla; el conteo funciona igual porque solo se necesita distinguir claves,
 * no leerlas. Mismo criterio que en `reader_reports`: quedar fuera del alcance
 * de la ley por construcción y no por política.
 *
 * QUÉ PASA SI LA BASE NO RESPONDE
 * -------------------------------
 * Se deja pasar. Suena mal hasta ver que TODOS los endpoints limitados
 * necesitan la base para hacer su trabajo: el acceso tiene que verificar la
 * contraseña contra `admin_users` y el reporte tiene que insertar una fila. Si
 * la base está caída, la petición va a fallar de todas formas unos milisegundos
 * después. Cerrar aquí no protegería de nada y convertiría un fallo de la base
 * en un mensaje engañoso sobre demasiadas peticiones.
 */

import { createHash } from 'node:crypto';
import { safeQuery } from './pool.js';

/** Hash de la clave. Lo único que llega a la tabla. */
function hashBucket(key) {
    return createHash('sha256').update(key).digest('hex');
}

/**
 * Cuenta un intento y dice si hay que rechazarlo.
 *
 * @param {string} key      identificador lógico, p.ej. `login:ip:1.2.3.4`
 * @param {number} max      intentos permitidos por ventana
 * @param {number} windowMs duración de la ventana
 * @returns {Promise<{allowed: boolean, hits: number, retryAfterSeconds: number}>}
 */
export async function hit(key, max, windowMs) {
    const seconds = Math.max(1, Math.round(windowMs / 1000));

    /**
     * El inicio de ventana se calcula EN LA BASE, no en el proceso.
     *
     * Si cada instancia usara su propio reloj, dos que difirieran unos segundos
     * escribirían en ventanas distintas y cada una llevaría su propia cuenta:
     * exactamente el problema que esta tabla viene a resolver. Con `now()` de
     * Postgres todas coinciden aunque sus relojes no.
     */
    const result = await safeQuery(
        `
        INSERT INTO rate_limits (bucket, window_start, hits)
        VALUES ($1, to_timestamp(floor(extract(epoch FROM now()) / $2) * $2), 1)
        ON CONFLICT (bucket, window_start)
        DO UPDATE SET hits = rate_limits.hits + 1
        RETURNING hits, extract(epoch FROM (window_start + ($2 * interval '1 second') - now()))::int AS restante
        `,
        [hashBucket(key), seconds],
        'límite de peticiones'
    );

    // Sin base se deja pasar: ver la cabecera del archivo.
    if (!result) return { allowed: true, hits: 0, retryAfterSeconds: 0 };

    const { hits, restante } = result.rows[0];
    return {
        allowed: hits <= max,
        hits,
        retryAfterSeconds: Math.max(1, restante ?? seconds),
    };
}

/** Borra el contador de una clave. Se usa tras un acceso correcto. */
export async function reset(key) {
    await safeQuery('DELETE FROM rate_limits WHERE bucket = $1', [hashBucket(key)], 'reinicio de límite');
}

/**
 * Barre ventanas viejas. Se llama de vez en cuando desde el propio camino de
 * escritura en vez de con una tarea programada: si nadie usa el sistema,
 * tampoco hay basura de la que preocuparse.
 */
export async function sweep() {
    await safeQuery(
        `DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`,
        [],
        'barrido de límites'
    );
}
