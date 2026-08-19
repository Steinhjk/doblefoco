/**
 * SERVICE WORKER — caché offline.
 *
 * LA REGLA QUE MANDA AQUÍ: EL CACHÉ NO PUEDE MENTIR SOBRE LA FECHA.
 *
 * Este sitio no sirve contenido que envejece bien. Su corpus se purga a las 72
 * horas, sus recuentos de cobertura se calculan sobre la ventana viva y sus
 * valores de sesgo cambian cuando una ficha se corrige —el 2026-08-18 El
 * Espectador pasó de −0,20 a 0,00—. Un artículo cacheado ayer viene con su
 * número de medios y su pastilla de sesgo congelados, y el lector no tiene forma
 * de saberlo.
 *
 * POR QUÉ SE CAMBIÓ (2026-08-18). La primera versión usaba
 * *stale-while-revalidate* para `/api/`: devolvía lo cacheado primero y
 * refrescaba después, sin fecha de caducidad. Eso significa que quien vuelve al
 * sitio ve la portada de la última visita —aunque sea de hace tres días— y que
 * una corrección de sesgo puede tardar indefinidamente en llegarle. En un
 * producto cuyo argumento entero es la verificabilidad, un caché invisible es el
 * peor sitio donde puede envejecer un dato.
 *
 * LO QUE HACE AHORA:
 *
 *   · `/api/`  → RED PRIMERO. Con red, el lector ve siempre lo de ahora. Sin
 *     red, se sirve la última copia **solo si es reciente**; pasada la ventana
 *     se deja fallar, y la aplicación muestra su propio estado de error en vez
 *     de una portada que miente sobre su fecha.
 *   · estáticos y tipografías → CACHÉ PRIMERO. Sus URL llevan hash, así que un
 *     archivo cacheado no puede quedar obsoleto: si cambia, cambia su nombre.
 *   · navegación → RED PRIMERO con la cáscara cacheada como respaldo.
 *
 * LO QUE FALTA, Y NO LO ARREGLA EL SERVICE WORKER. Si algún día la interfaz
 * muestra «datos de las HH:MM» cuando viene de caché, esta ventana se puede
 * ampliar sin riesgo: el problema no es servir algo viejo, es servirlo sin
 * decirlo. Mientras eso no exista, la ventana se queda corta a propósito.
 */

const CACHE_NAME = 'doblefoco-cache-v2';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/favicon.svg',
    '/fonts/fonts.css',
    '/manifest.json',
];

/**
 * Cuánto puede tener una respuesta de `/api/` para servirse sin red.
 *
 * Dos horas cubre el caso real del offline —se cae la señal en el metro y la
 * página se recarga— y no llega a cubrir «vuelvo mañana», que es cuando una
 * portada cacheada pasa de ser útil a ser falsa.
 */
const MAX_EDAD_API_MS = 2 * 60 * 60 * 1000;

/** Cabecera propia con el momento del guardado. El caché no la trae de serie. */
const CABECERA_FECHA = 'x-doblefoco-cacheado-el';

/** Copia la respuesta añadiéndole la marca de tiempo, para poder caducarla. */
async function guardarConFecha(cache, request, response) {
    const cuerpo = await response.clone().blob();
    const cabeceras = new Headers(response.headers);
    cabeceras.set(CABECERA_FECHA, String(Date.now()));

    await cache.put(
        request,
        new Response(cuerpo, {
            status: response.status,
            statusText: response.statusText,
            headers: cabeceras,
        })
    );
}

/** true si la copia cacheada sigue dentro de la ventana admisible. */
function siguePudiendoServirse(response) {
    if (!response) return false;
    const marca = Number(response.headers.get(CABECERA_FECHA));
    // Sin marca no se puede saber la edad, y lo que no se puede fechar no se
    // sirve: es la misma regla que el resto del proyecto aplica a la evidencia.
    if (!Number.isFinite(marca) || marca <= 0) return false;
    return Date.now() - marca < MAX_EDAD_API_MS;
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) =>
                cache.addAll(STATIC_ASSETS).catch((err) => {
                    console.warn('[SW] Error al precachear estáticos:', err);
                })
            )
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;

    // ── Datos: red primero, y la copia solo si es reciente ───────────────────
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(CACHE_NAME);

                try {
                    const respuesta = await fetch(request);
                    if (respuesta && respuesta.status === 200) {
                        await guardarConFecha(cache, request, respuesta);
                    }
                    return respuesta;
                } catch (error) {
                    const cacheada = await cache.match(request);
                    if (siguePudiendoServirse(cacheada)) return cacheada;

                    // Se deja fallar a propósito: la aplicación sabe mostrar que
                    // no hay datos, y eso es más honesto que una portada de
                    // anteayer presentada como la de ahora.
                    throw error;
                }
            })()
        );
        return;
    }

    // ── Estáticos con hash en la URL: caché primero, sin caducidad ───────────
    if (
        url.pathname.startsWith('/fonts/') ||
        url.pathname.startsWith('/assets/') ||
        url.pathname.startsWith('/logos/')
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response && response.status === 200) {
                        const copia = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
                    }
                    return response;
                });
            })
        );
        return;
    }

    // ── Navegación: red primero, cáscara cacheada como respaldo ──────────────
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copia = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
                    }
                    return response;
                })
                .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
        );
        return;
    }
});
