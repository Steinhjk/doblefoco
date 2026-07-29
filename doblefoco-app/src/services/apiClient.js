/**
 * Cliente de la API de DobleFoco.co
 *
 * Sustituye dos cosas que estaban mal:
 *
 *  1. La URL "http://localhost:5000" escrita a mano dentro de NewsFeed.jsx y
 *     NewsDetail.jsx. En producción esa dirección está bloqueada por la propia
 *     CSP del proyecto y por la regla de contenido mixto, así que el 100% de
 *     las peticiones fallaba y cada carga de página gastaba una petición
 *     condenada. Ahora la base sale de VITE_API_URL.
 *
 *  2. El scraping desde el navegador a través de tres proxies CORS públicos
 *     (allorigins / corsproxy.io / thingproxy). Un agregador no puede depender
 *     de servicios gratuitos de terceros sin SLA para su función principal, y
 *     CORS no existe cuando la petición sale del servidor. La ingesta vive
 *     ahora en el backend y el panel solo la dispara.
 *
 * Si VITE_API_URL no está definida, `isApiConfigured` es false y los llamantes
 * deben usar su respaldo local SIN intentar la petición.
 */

const RAW_BASE = import.meta.env.VITE_API_URL ?? '';
const API_BASE = RAW_BASE.replace(/\/+$/, '');

/** ¿Hay backend configurado para este build? */
export const isApiConfigured = Boolean(API_BASE);

const DEFAULT_TIMEOUT_MS = 8_000;

/**
 * Envoltura de fetch con timeout y errores normalizados.
 * Nunca lanza: devuelve `{ ok, data, error }` para que la UI decida.
 */
async function request(path, { timeoutMs = DEFAULT_TIMEOUT_MS, ...options } = {}) {
    if (!isApiConfigured) {
        return { ok: false, error: 'API no configurada (falta VITE_API_URL)', offline: true };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${API_BASE}${path}`, {
            ...options,
            signal: controller.signal,
            headers: { Accept: 'application/json', ...options.headers },
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                error: payload?.error ?? `La API respondió ${response.status}`,
            };
        }

        return { ok: true, data: payload };
    } catch (error) {
        return {
            ok: false,
            error: error.name === 'AbortError' ? 'La API no respondió a tiempo' : 'No se pudo contactar la API',
            offline: true,
        };
    } finally {
        clearTimeout(timer);
    }
}

/** Feed paginado de historias multifuente. */
export async function fetchFeed({ limit = 20, offset = 0 } = {}) {
    const result = await request(`/api/feed?limit=${limit}&offset=${offset}`);
    if (!result.ok) return result;

    return {
        ok: true,
        stories: Array.isArray(result.data?.stories) ? result.data.stories : [],
        total: result.data?.total ?? 0,
    };
}

/** Detalle de una historia. */
export async function fetchStory(id) {
    const result = await request(`/api/story/${encodeURIComponent(id)}`);
    if (!result.ok) return result;
    return { ok: true, story: result.data?.story ?? null };
}

/** Estado real del servicio de ingesta, para el panel de moderación. */
export async function fetchHealth() {
    const result = await request('/api/health', { timeoutMs: 4_000 });
    // /api/health devuelve 503 cuando la ingesta está obsoleta: ese cuerpo sí
    // interesa mostrarlo, así que se rescata del error.
    if (!result.ok && result.status === 503) {
        return { ok: true, health: { status: 'degradado' }, degraded: true };
    }
    if (!result.ok) return result;
    return { ok: true, health: result.data };
}

/**
 * Pide un ciclo de ingesta. NO espera a que termine.
 *
 * Un ciclo tarda entre uno y tres minutos, así que ya no lo ejecuta la API:
 * encola una solicitud que recoge el motor, un proceso aparte con su propio
 * reloj. Por eso la espera bajó de dos minutos a diez segundos — solo se
 * aguarda el acuse.
 *
 * Lo autoriza la SESIÓN (F2-05). `credentials: 'include'` adjunta la cookie
 * httpOnly, que este código no puede leer.
 */
export async function requestIngestion() {
    const result = await request('/api/ingest/run', {
        method: 'POST',
        credentials: 'include',
        timeoutMs: 10_000,
    });

    if (!result.ok) return result;
    return { ok: true, queued: result.data?.queued, message: result.data?.message };
}

/** Últimas solicitudes y cómo terminaron. Es la señal de vida del motor. */
export async function fetchIngestRequests() {
    const result = await request('/api/ingest/requests', { credentials: 'include' });
    if (!result.ok) return result;
    return { ok: true, requests: result.data?.requests ?? [] };
}
