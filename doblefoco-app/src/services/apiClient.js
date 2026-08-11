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
export async function fetchFeed({ limit = 20, offset = 0, ambito = 'all' } = {}) {
    const alcance = ambito && ambito !== 'all' ? `&ambito=${encodeURIComponent(ambito)}` : '';
    const result = await request(`/api/feed?limit=${limit}&offset=${offset}${alcance}`);
    if (!result.ok) return result;

    return {
        ok: true,
        stories: Array.isArray(result.data?.stories) ? result.data.stories : [],
        total: result.data?.total ?? 0,
        // Cifras del catálogo entero, no de esta página. Un despliegue anterior
        // de la API no las manda: se degrada a ceros y la portada se calla en vez
        // de inventarse un total.
        counts: {
            total: result.data?.counts?.total ?? 0,
            multifuente: result.data?.counts?.multifuente ?? 0,
            nacional: result.data?.counts?.nacional ?? 0,
            internacional: result.data?.counts?.internacional ?? 0,
        },
    };
}

/**
 * La portada agrupada en sucesos.
 *
 * DEGRADA EN SILENCIO Y A PROPÓSITO. El cliente se publica en Vercel y la API en
 * Fly, y empujar a `main` solo despliega el primero: hay una ventana en la que
 * este código ya está en producción y `/api/portada` todavía no existe. Un 404
 * ahí no es un fallo, es el orden normal de los dos despliegues.
 *
 * Por eso devuelve `sucesos: []` en vez de un error, y la portada se queda con
 * el orden por historias hasta que la API se ponga al día. Lo que no puede pasar
 * es que la portada se vea rota durante esa ventana.
 */
export async function fetchPortada({ limit = 100 } = {}) {
    const result = await request(`/api/portada?limit=${limit}`);
    if (!result.ok) return { ok: false, sucesos: [], error: result.error };

    return {
        ok: true,
        sucesos: Array.isArray(result.data?.sucesos) ? result.data.sucesos : [],
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

/**
 * Errores de producción para el panel (F2-11).
 *
 * Antes de esto, los fallos solo iban a los registros de Fly: nadie los mira y
 * no se conservan. El 2026-07-29 se encontraron tres fallos en producción
 * sondeando a mano y ninguno había avisado.
 *
 * Exige sesión, como todo lo del panel: los mensajes de error describen la
 * estructura interna del sistema.
 */
export async function fetchErrors({ todos = false } = {}) {
    const result = await request(`/api/errors${todos ? '?todos=1' : ''}`, {
        credentials: 'include',
    });
    if (!result.ok) return result;
    return {
        ok: true,
        errores: result.data?.errores ?? [],
        resumen: result.data?.resumen ?? { total: 0, ocurrencias: 0 },
    };
}

/** Marca un error como atendido. No lo borra: el historial vale más. */
export async function resolveError(huella) {
    return request(`/api/errors/${encodeURIComponent(huella)}/resolver`, {
        method: 'POST',
        credentials: 'include',
    });
}

/**
 * Volumen publicado por medio, para la vista del espacio mediático (F3-16).
 * Devuelve conteos en bruto; la agregación vive en shared/panorama.js.
 */
export async function fetchPanorama() {
    const result = await request('/api/panorama');
    if (!result.ok) return result;

    return {
        ok: true,
        medios: Array.isArray(result.data?.medios) ? result.data.medios : [],
        retentionHours: result.data?.retentionHours ?? 72,
    };
}

/**
 * Reporta si la ficha de propiedad de un medio está bien o mal.
 *
 * NO cambia la ficha: es una pista para saber dónde mirar. Corregirla exige
 * producir la fuente donde consta lo contrario.
 */
export async function reportarPropiedad(mediaId, veredicto) {
    return request(`/api/propiedad/${encodeURIComponent(mediaId)}/reporte`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ veredicto }),
    });
}

/** Resumen de reportes de propiedad, para el panel. Exige sesión. */
export async function fetchReportesPropiedad() {
    const result = await request('/api/propiedad/reportes', { credentials: 'include' });
    if (!result.ok) return result;
    return { ok: true, medios: result.data?.medios ?? [] };
}
