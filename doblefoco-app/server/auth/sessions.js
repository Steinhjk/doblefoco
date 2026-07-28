/**
 * Sesiones del panel de moderación — tarea F2-04.
 *
 * Por qué una tabla y no un testigo firmado (JWT)
 * ----------------------------------------------
 * Un JWT no se puede revocar: es válido hasta que caduca, y punto. Para un
 * panel donde alguien puede aprobar historias y descargar correos de
 * suscriptores, poder cerrar una sesión AHORA —porque se perdió un portátil o
 * porque alguien deja el equipo— vale más que ahorrarse una consulta. Con la
 * tabla, `DELETE` es el botón de pánico.
 *
 * Qué se guarda: el HASH del testigo, nunca el testigo. Un volcado de esta
 * tabla no le da a nadie una sesión utilizable; tendría que invertir un
 * SHA-256 sobre 32 bytes aleatorios. Es el mismo razonamiento de no guardar
 * contraseñas en claro, aplicado a las sesiones.
 *
 * Por qué SHA-256 aquí y scrypt para las contraseñas: no es una incoherencia.
 * scrypt es lento a propósito porque las contraseñas las eligen personas y hay
 * que encarecer el diccionario. Un testigo son 256 bits de aleatoriedad
 * criptográfica: no hay diccionario que probar, así que un hash rápido basta y
 * evita 100 ms de scrypt en CADA petición autenticada.
 */

import { createHash, randomBytes } from 'node:crypto';
import { query } from '../db/pool.js';

/** Nombre de la cookie. */
export const SESSION_COOKIE = 'df_session';

/**
 * Duración. Fija, no deslizante: una pestaña olvidada y abierta no debe
 * mantener viva una sesión de moderación indefinidamente. Doce horas cubren una
 * jornada completa y obligan a volver a entrar al día siguiente.
 */
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

/** Hash del testigo, tal como se almacena. */
function hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
}

/** Opciones de la cookie. */
export function cookieOptions() {
    return {
        httpOnly: true,          // el JavaScript de la página no puede leerla
        sameSite: 'lax',         // no se envía en peticiones cruzadas de terceros
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_TTL_MS,
        path: '/',
    };
}

/**
 * Crea una sesión y devuelve el testigo EN CLARO.
 *
 * Es la única vez que existe fuera de la cookie del navegador: no se registra,
 * no se devuelve en ningún otro sitio y la base solo conoce su hash.
 *
 * @returns {Promise<{token: string, expiresAt: string}>}
 */
export async function createSession(userId, { userAgent = null, ip = null } = {}) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

    await query(
        `INSERT INTO admin_sessions (token_hash, user_id, expires_at, user_agent, ip)
         VALUES ($1, $2, $3, $4, $5)`,
        [hashToken(token), userId, expiresAt, userAgent?.slice(0, 300) ?? null, ip]
    );

    return { token, expiresAt };
}

/**
 * Valida un testigo y devuelve la persona, o `null`.
 *
 * De paso barre las sesiones caducadas. Hacerlo aquí y no con una tarea
 * programada mantiene la limpieza atada a algo que ocurre de todos modos: si
 * nadie entra, tampoco hay basura que preocupe.
 *
 * @returns {Promise<{id: string, email: string, displayName: string|null}|null>}
 */
export async function verifySession(token) {
    if (!token || typeof token !== 'string') return null;

    await query('DELETE FROM admin_sessions WHERE expires_at < now()');

    const { rows } = await query(
        `UPDATE admin_sessions s
            SET last_seen_at = now()
           FROM admin_users u
          WHERE s.token_hash = $1
            AND s.user_id = u.id
            AND s.expires_at > now()
            AND u.disabled_at IS NULL
      RETURNING u.id, u.email, u.display_name`,
        [hashToken(token)]
    );

    if (!rows.length) return null;

    return {
        id: rows[0].id,
        email: rows[0].email,
        displayName: rows[0].display_name,
    };
}

/** Cierra una sesión concreta. Idempotente. */
export async function destroySession(token) {
    if (!token) return 0;
    const { rowCount } = await query('DELETE FROM admin_sessions WHERE token_hash = $1', [
        hashToken(token),
    ]);
    return rowCount;
}

/**
 * Cierra TODAS las sesiones de una persona.
 * Es lo que hay que ejecutar tras cambiar una contraseña o ante una sospecha.
 */
export async function destroyAllSessions(userId) {
    const { rowCount } = await query('DELETE FROM admin_sessions WHERE user_id = $1', [userId]);
    return rowCount;
}

/**
 * Lee la cookie de sesión de la petición.
 *
 * Se analiza la cabecera a mano en vez de añadir cookie-parser: son diez líneas
 * y `res.cookie()` para escribirlas ya viene en Express.
 */
export function readSessionCookie(req) {
    const header = req.headers?.cookie;
    if (!header) return null;

    for (const part of header.split(';')) {
        const index = part.indexOf('=');
        if (index === -1) continue;
        if (part.slice(0, index).trim() !== SESSION_COOKIE) continue;
        return decodeURIComponent(part.slice(index + 1).trim());
    }

    return null;
}
