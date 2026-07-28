/**
 * Rutas de acceso al panel y guardia de sesión — tareas F2-04 y F2-05.
 *
 * Lo que sustituye: AdminGate comparaba `value === import.meta.env
 * .VITE_ADMIN_PASSPHRASE` dentro del navegador. Todo lo que empieza por VITE_
 * se incrusta en el bundle, así que la clave era pública y la comprobación
 * ocurría en la máquina de quien intentaba entrar, que es exactamente donde no
 * debe ocurrir. Aquí la contraseña no llega nunca al cliente y la decisión la
 * toma el servidor.
 */

import { Router } from 'express';
import { isDatabaseEnabled, query } from '../db/pool.js';
import { verifyPassword } from './passwords.js';
import {
    SESSION_COOKIE,
    cookieOptions,
    createSession,
    destroySession,
    readSessionCookie,
    verifySession,
} from './sessions.js';

/**
 * Límite de intentos de inicio de sesión.
 *
 * El límite general de la API (120 por minuto) no sirve aquí: 120 contraseñas
 * por minuto es un ataque de diccionario cómodo. Se cuenta por IP Y por correo,
 * porque cada uno frena un ataque distinto —una IP probando muchas cuentas, o
 * muchas IP probando una sola—.
 *
 * En memoria, como el otro. Con varias instancias hará falta un contador
 * compartido: es la misma tarea F2-06 y aquí importa más.
 */
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map();

function tooManyAttempts(...keys) {
    const now = Date.now();
    return keys.some((key) => {
        const recent = (attempts.get(key) ?? []).filter((t) => t > now - ATTEMPT_WINDOW_MS);
        attempts.set(key, recent);
        return recent.length >= MAX_ATTEMPTS;
    });
}

function recordAttempt(...keys) {
    const now = Date.now();
    for (const key of keys) {
        attempts.set(key, [...(attempts.get(key) ?? []), now]);
    }

    if (attempts.size > 5_000) {
        for (const [key, stamps] of attempts) {
            if (!stamps.some((t) => t > now - ATTEMPT_WINDOW_MS)) attempts.delete(key);
        }
    }
}

function clearAttempts(...keys) {
    for (const key of keys) attempts.delete(key);
}

/**
 * Hash de descarte, con el formato real, para gastar el mismo tiempo cuando el
 * correo no existe que cuando existe.
 *
 * Sin esto, un inicio de sesión fallido tarda ~1 ms con un correo desconocido y
 * ~100 ms con uno conocido, y esa diferencia es un oráculo: permite averiguar
 * qué cuentas existen sin acertar ni una contraseña.
 */
const DUMMY_HASH =
    'scrypt$65536$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

/** ¿Está el acceso operativo? Sin base de datos no hay cuentas ni sesiones. */
function requireDatabase(req, res, next) {
    if (!isDatabaseEnabled()) {
        return res.status(503).json({
            success: false,
            error: 'El acceso al panel requiere base de datos. Configura DATABASE_URL y corre `npm run db:migrate`.',
        });
    }
    return next();
}

/**
 * Guardia de sesión. Reemplaza a requireIngestToken (F2-05): el disparo de
 * ingesta pasa a autorizarse con la sesión, y VITE_INGEST_TOKEN deja de existir.
 */
export async function requireSession(req, res, next) {
    if (!isDatabaseEnabled()) {
        return res.status(503).json({ success: false, error: 'Servicio no disponible' });
    }

    try {
        const user = await verifySession(readSessionCookie(req));
        if (!user) {
            return res.status(401).json({ success: false, error: 'No autorizado' });
        }

        req.user = user;
        return next();
    } catch (error) {
        console.error('[auth] fallo al validar la sesión', error);
        return res.status(500).json({ success: false, error: 'Error interno' });
    }
}

const router = Router();

/** Quién soy. La usa el panel al cargar para saber si ya hay sesión. */
router.get('/me', async (req, res) => {
    if (!isDatabaseEnabled()) {
        return res.status(503).json({ success: false, error: 'Servicio no disponible' });
    }

    try {
        const user = await verifySession(readSessionCookie(req));
        if (!user) return res.status(401).json({ success: false, error: 'Sin sesión' });
        return res.json({ success: true, user });
    } catch (error) {
        console.error('[auth] fallo en /me', error);
        return res.status(500).json({ success: false, error: 'Error interno' });
    }
});

router.post('/login', requireDatabase, async (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    const ipKey = `ip:${req.ip}`;
    const emailKey = `email:${email}`;

    if (tooManyAttempts(ipKey, emailKey)) {
        res.setHeader('Retry-After', '900');
        return res.status(429).json({
            success: false,
            error: 'Demasiados intentos. Espera quince minutos.',
        });
    }

    if (!email || !password) {
        recordAttempt(ipKey);
        return res.status(400).json({ success: false, error: 'Faltan credenciales' });
    }

    try {
        const { rows } = await query(
            `SELECT id, email, display_name, password_hash
               FROM admin_users
              WHERE email = $1 AND disabled_at IS NULL`,
            [email]
        );

        const user = rows[0] ?? null;
        const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);

        if (!user || !ok) {
            recordAttempt(ipKey, emailKey);
            // Un solo mensaje para las dos causas. Distinguir "ese correo no
            // existe" de "esa contraseña no es" regala la mitad del trabajo a
            // quien esté probando.
            return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
        }

        const { token } = await createSession(user.id, {
            userAgent: req.get('user-agent'),
            ip: req.ip,
        });

        await query('UPDATE admin_users SET last_login_at = now() WHERE id = $1', [user.id]);

        clearAttempts(ipKey, emailKey);
        res.cookie(SESSION_COOKIE, token, cookieOptions());

        return res.json({
            success: true,
            user: { id: user.id, email: user.email, displayName: user.display_name },
        });
    } catch (error) {
        console.error('[auth] fallo en /login', error);
        return res.status(500).json({ success: false, error: 'Error interno' });
    }
});

router.post('/logout', async (req, res) => {
    try {
        await destroySession(readSessionCookie(req));
    } catch (error) {
        // Si la base no responde, la cookie se borra igual: dejar al usuario
        // "dentro" porque falló el borrado del servidor es lo peor de los dos
        // mundos.
        console.warn(`[auth] no se pudo borrar la sesión: ${error.message}`);
    }

    res.clearCookie(SESSION_COOKIE, { ...cookieOptions(), maxAge: undefined });
    return res.json({ success: true });
});

export default router;
