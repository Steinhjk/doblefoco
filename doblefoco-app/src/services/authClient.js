/**
 * Cliente de sesión del panel — tarea F2-04.
 *
 * Este archivo no guarda nada. No hay testigo en localStorage, ni en
 * sessionStorage, ni en una variable del módulo: la sesión vive en una cookie
 * httpOnly que el navegador adjunta sola y que este código no puede leer.
 *
 * Es la diferencia que hace que un XSS en cualquier página del sitio no pueda
 * robar la sesión de moderación. Guardar un testigo en localStorage —lo que
 * hacen por defecto la mayoría de las bibliotecas de autenticación— lo dejaría
 * al alcance de cualquier script inyectado.
 *
 * `credentials: 'include'` es obligatorio en todas las llamadas: sin él el
 * navegador no envía la cookie a otro origen, y la API vive en un dominio
 * distinto del sitio.
 */

const RAW_BASE = import.meta.env.VITE_API_URL ?? '';
const API_BASE = RAW_BASE.replace(/\/+$/, '');

const TIMEOUT_MS = 10_000;

async function request(path, options = {}) {
    if (!API_BASE) {
        return {
            ok: false,
            unavailable: true,
            error: 'Este despliegue no tiene API configurada (falta VITE_API_URL).',
        };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(`${API_BASE}${path}`, {
            ...options,
            credentials: 'include',
            signal: controller.signal,
            headers: {
                Accept: 'application/json',
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...options.headers,
            },
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                // Un 503 significa que el panel no puede funcionar en este
                // despliegue (falta base de datos). Se distingue de un 401,
                // que solo significa que hay que entrar.
                unavailable: response.status === 503,
                error: payload?.error ?? `La API respondió ${response.status}`,
            };
        }

        return { ok: true, data: payload };
    } catch (error) {
        return {
            ok: false,
            unavailable: true,
            error:
                error.name === 'AbortError'
                    ? 'La API no respondió a tiempo.'
                    : 'No se pudo contactar con la API.',
        };
    } finally {
        clearTimeout(timer);
    }
}

/** ¿Hay sesión abierta? Se llama al montar el panel. */
export async function fetchSession() {
    const result = await request('/api/auth/me');
    if (!result.ok) return result;
    return { ok: true, user: result.data?.user ?? null };
}

/** Inicia sesión. La contraseña sale de aquí y no vuelve a tocarse. */
export async function login(email, password) {
    const result = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    if (!result.ok) return result;
    return { ok: true, user: result.data?.user ?? null };
}

/** Cierra la sesión en el servidor y borra la cookie. */
export async function logout() {
    return request('/api/auth/logout', { method: 'POST' });
}
