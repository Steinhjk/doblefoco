/**
 * Cliente de moderación — tarea F2-02.
 *
 * Sustituye a storageService para todo lo editorial. Aquello guardaba las
 * aprobaciones en el localStorage del navegador: dos personas del equipo veían
 * colas distintas, un borrado de datos perdía el trabajo y los visitantes no
 * veían nada. Ahora las decisiones viven en la base, se comparten y quedan
 * firmadas con quién las tomó.
 *
 * Todas las llamadas van con la cookie de sesión (`credentials: 'include'`) y
 * el servidor las rechaza sin ella.
 */

const RAW_BASE = import.meta.env.VITE_API_URL ?? '';
const API_BASE = RAW_BASE.replace(/\/+$/, '');

export const isModerationAvailable = Boolean(API_BASE);

async function request(path, options = {}) {
    if (!API_BASE) {
        return { ok: false, error: 'Este despliegue no tiene API configurada.' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);

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
                // Un 401 aquí significa que la sesión caducó mientras el panel
                // estaba abierto. Quien llama debe mandar a volver a entrar, no
                // mostrar "error desconocido".
                expired: response.status === 401,
                error: payload?.error ?? `La API respondió ${response.status}`,
            };
        }

        return { ok: true, data: payload };
    } catch (error) {
        return {
            ok: false,
            error:
                error.name === 'AbortError'
                    ? 'La API no respondió a tiempo.'
                    : 'No se pudo contactar con la API.',
        };
    } finally {
        clearTimeout(timer);
    }
}

/** Historias sin decidir. */
export async function fetchPending({ limit = 50 } = {}) {
    const result = await request(`/api/moderation/pending?limit=${limit}`);
    if (!result.ok) return result;
    return { ok: true, stories: result.data?.stories ?? [] };
}

/** Historias ya decididas, con su firma. */
export async function fetchDecided({ state = null, limit = 50 } = {}) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (state) params.set('state', state);

    const result = await request(`/api/moderation/decided?${params}`);
    if (!result.ok) return result;
    return { ok: true, stories: result.data?.stories ?? [] };
}

/** Cifras por estado. */
export async function fetchCounts() {
    const result = await request('/api/moderation/counts');
    if (!result.ok) return result;
    return { ok: true, counts: result.data?.counts ?? null };
}

/**
 * Lo que reportaron los lectores (F2-07). Solo el panel lo ve.
 */
export async function fetchReports({ days = 14, limit = 20 } = {}) {
    const result = await request(`/api/moderation/reports?days=${days}&limit=${limit}`);
    if (!result.ok) return result;
    return { ok: true, totals: result.data?.totals ?? null, stories: result.data?.stories ?? [] };
}

/**
 * Registra una decisión.
 * `state` puede ser 'aprobada', 'rechazada' o 'pendiente' (retira la decisión).
 */
export async function decideStory(storyId, state, reason = null) {
    return request(`/api/moderation/${encodeURIComponent(storyId)}`, {
        method: 'POST',
        body: JSON.stringify({ state, reason }),
    });
}
