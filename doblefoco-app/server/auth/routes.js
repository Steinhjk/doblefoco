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
import { hit, reset } from '../db/rateLimitStore.js';
import {
    SESSION_COOKIE,
    cookieOptions,
    createSession,
    destroySession,
    readSessionCookie,
    verifySession,
} from './sessions.js';

/**
 * Límite de intentos de inicio de sesión, EN LA BASE (F2-06).
 *
 * El límite general de la API (120 por minuto) no sirve aquí: 120 contraseñas
 * por minuto es un ataque de diccionario cómodo. Se cuenta por IP Y por correo,
 * porque cada uno frena un ataque distinto —una IP probando muchas cuentas, o
 * muchas IP probando una sola—.
 *
 * Vivía en un Map del proceso. Con la API sin estado eso deja de limitar: cada
 * invocación arrancaría con su propio Map, y bastaría con dejar que te tocara
 * otra para seguir probando. Es el único sitio donde la diferencia entre
 * memoria y base es la diferencia entre proteger y aparentar que se protege.
 */
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

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

    // Se cuenta ANTES de mirar las credenciales. Contar solo los fallos
    // permitiría sondear a ritmo libre enviando peticiones malformadas.
    const porIp = await hit(ipKey, MAX_ATTEMPTS, ATTEMPT_WINDOW_MS);
    const porCorreo = email
        ? await hit(emailKey, MAX_ATTEMPTS, ATTEMPT_WINDOW_MS)
        : { allowed: true, retryAfterSeconds: 0 };

    if (!porIp.allowed || !porCorreo.allowed) {
        const espera = Math.max(porIp.retryAfterSeconds, porCorreo.retryAfterSeconds);
        res.setHeader('Retry-After', String(espera));
        return res.status(429).json({
            success: false,
            error: 'Demasiados intentos. Espera unos minutos.',
        });
    }

    if (!email || !password) {
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

        // Un acceso correcto limpia el contador: quien acierta no arrastra los
        // intentos fallidos de antes.
        await Promise.all([reset(ipKey), reset(emailKey)]);
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
