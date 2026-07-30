/**
 * API de DobleFoco.co
 *
 * Cambios de seguridad respecto a la versión anterior:
 *   · CORS con lista blanca de orígenes en lugar de `cors()` abierto a todo
 *     internet.
 *   · POST /api/ingest/run exige un token. Antes era público, y como lanza un
 *     ciclo completo de scraping contra 14 medios, cualquiera podía invocarlo
 *     en bucle y convertir este servidor en un ataque de amplificación contra
 *     terceros.
 *   · Límite de peticiones por IP en el servidor. El anterior vivía en el
 *     navegador (securityService.checkRateLimit), donde no limita nada: se
 *     reinicia con cada recarga de página.
 *   · Cabeceras de seguridad básicas y /api/health que reporta el estado real
 *     de la ingesta en lugar de un "ok" fijo.
 */

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import cors from 'cors';
import { getDatabaseStats } from './services/ingestDaemon.js';
import { countArticlesBySource, countFeed, readFeed, readSitemapEntries, readStory } from './db/feedStore.js';
import { dailySummary } from './services/metricsStore.js';
import { isDatabaseEnabled } from './db/pool.js';
import { countStored, dailySummaryFromDb, lastRunFromDb } from './db/contentStore.js';
import { prepareStorage } from './bootstrap.js';
import authRoutes, { requireSession } from './auth/routes.js';
import moderationRoutes from './moderationRoutes.js';
import { recordReport, REPORT_KINDS } from './db/reportStore.js';
import { hit, sweep } from './db/rateLimitStore.js';
import { recentRequests, requestCycle } from './db/requestStore.js';
import { construirMetadatos, montarPagina } from './ssr/metadatos.js';
import { esRutaCanonica, idDesdeRuta, rutaDeHistoria } from '../shared/storyPath.js';
import { contarSinResolver, erroresRecientes, marcarResuelto, registrarError } from './db/errorStore.js';
import { instalarCapturaDeErrores, middlewareDeErrores } from './observabilidad.js';

// Lo primero de todo: si algo revienta durante el arranque, que quede escrito.
instalarCapturaDeErrores('api');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const INGEST_INTERVAL_MS = Number(process.env.INGEST_INTERVAL_MS) || 10 * 60 * 1000;

/**
 * ¿Debe este proceso ingerir por su cuenta?
 *
 * POR DEFECTO NO, y la elección del valor por omisión es lo importante.
 *
 * Desde F1-01 la ingesta la ejecuta GitHub Actions cada 30 minutos. Si además
 * la hiciera el servidor desplegado —al arrancar y cada 10 minutos— estaríamos
 * pidiendo los feeds de 34 medios desde dos sitios a la vez. No es solo
 * derroche: este proyecto se presenta ante esos medios con un User-Agent
 * propio y una URL de transparencia, y duplicarles el tráfico contradice esa
 * postura. Uno ya nos responde 403.
 *
 * Por eso el valor por omisión es `false` en vez de `true`. Olvidarse de
 * ponerlo produce que NO se ingiera, y eso se ve enseguida: el feed se queda
 * viejo y /api/health responde "degradado". Al revés, olvidarse de apagarlo
 * produciría el doble de peticiones a terceros sin que nada avisara.
 * Entre dos olvidos posibles, se elige el que no daña a nadie más.
 *
 * En local se activa con INGEST_IN_PROCESS=true.
 */
const INGEST_IN_PROCESS = process.env.INGEST_IN_PROCESS === 'true';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.disable('x-powered-by');

app.use(
    cors({
        origin(origin, callback) {
            // Sin cabecera Origin (curl, health checks del hosting): se permite.
            if (!origin) return callback(null, true);
            if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
            return callback(new Error(`Origen no permitido: ${origin}`));
        },
        methods: ['GET', 'POST'],
        // La sesión viaja en cookie httpOnly, y el navegador no la envía a otro
        // origen sin esto. Exige lista blanca de orígenes —nunca '*'— y por eso
        // ALLOWED_ORIGINS es explícita.
        credentials: true,
        maxAge: 86_400,
    })
);

// Necesario para que req.ip sea la IP real detrás del proxy del hosting y no la
// del propio proxy. Sin esto, el límite de intentos de inicio de sesión contaría
// todo el tráfico como una sola IP y bastarían ocho intentos de cualquiera para
// bloquear a todo el mundo.
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 1);

app.use(express.json({ limit: '32kb' }));

/**
 * Cabeceras de seguridad de la API.
 *
 * El sitio estático ya las lleva en vercel.json y public/_headers, pero la API
 * es un origen distinto y sirve las suyas: una cabecera puesta en el frontend
 * no protege las respuestas del backend.
 */
app.use((req, res, next) => {
    // No adivinar el tipo de contenido: evita que una respuesta JSON acabe
    // interpretada como HTML o script.
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Ninguna URL nuestra viaja como referente a terceros. Importa más de lo
    // que parece: /noticia/:id revela qué está leyendo alguien.
    res.setHeader('Referrer-Policy', 'no-referrer');

    // La API no se pinta en ninguna página: nada debe poder incrustarla.
    res.setHeader('X-Frame-Options', 'DENY');

    // Sin funciones del navegador. La API no las usa y así una respuesta
    // manipulada tampoco podría pedirlas.
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    /**
     * HSTS: obliga al navegador a usar HTTPS en las siguientes visitas.
     *
     * Solo se envía cuando la petición YA llegó por HTTPS. Mandarlo por HTTP
     * simple no sirve de nada y, si algún día se sirviera en local por http,
     * dejaría el navegador del desarrollador con la regla puesta durante un
     * año para todo localhost.
     */
    if (req.secure || req.get('x-forwarded-proto') === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
});

/**
 * Límite general de peticiones por IP. EN MEMORIA, y a propósito (F2-06).
 *
 * Los límites que protegen algo valioso —intentos de acceso y escritura de
 * reportes— sí se movieron a la base, porque ahí la diferencia entre memoria y
 * base es la diferencia entre proteger y aparentar que se protege.
 *
 * Este no. Cubre las LECTURAS, y compartirlo significaría una escritura en la
 * base por cada lectura: el remedio costaría más que la enfermedad, y
 * convertiría un pico de tráfico legítimo en un pico de escrituras.
 *
 * Lo que sí hace, incluso por instancia, es evitar que un solo cliente sature
 * un proceso concreto. La protección de verdad contra un ataque distribuido de
 * lecturas no es este contador: es la capa del hosting, delante de la
 * aplicación. Conviene no confundir una cosa con la otra.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120;
const hits = new Map();

app.use((req, res, next) => {
    const key = req.ip ?? 'desconocida';
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => t > now - RATE_LIMIT_WINDOW_MS);

    if (recent.length >= RATE_LIMIT_MAX) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({
            success: false,
            error: 'Demasiadas peticiones. Intenta de nuevo en un minuto.',
        });
    }

    recent.push(now);
    hits.set(key, recent);

    // Poda periódica para que el Map no crezca indefinidamente.
    if (hits.size > 10_000) {
        for (const [ip, stamps] of hits) {
            if (!stamps.some((t) => t > now - RATE_LIMIT_WINDOW_MS)) hits.delete(ip);
        }
    }

    next();
});

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------

/**
 * Acceso al panel (F2-04).
 *
 * Antes esto lo resolvía AdminGate comparando una passphrase incrustada en el
 * bundle, es decir: pública, y comprobada en la máquina de quien intentaba
 * entrar. Ahora la contraseña no llega nunca al navegador y la sesión viaja en
 * una cookie httpOnly que el JavaScript de la página no puede leer.
 */
app.use('/api/auth', authRoutes);

/**
 * Moderación (F2-02). Exige sesión en todo el router.
 *
 * Las decisiones dejan de vivir en el localStorage de un navegador: se
 * comparten con el equipo, sobreviven al reinicio y quedan firmadas con quién
 * las tomó.
 */
app.use('/api/moderation', moderationRoutes);

/**
 * Señal de vida. Responde 200 mientras el proceso pueda atender peticiones.
 *
 * Existe separada de /api/health por un motivo operativo concreto: health
 * devuelve 503 cuando la ingesta está OBSOLETA, que es información valiosa para
 * una persona pero venenosa como comprobación de salud del hosting.
 *
 * Con la ingesta en proceso desactivada —lo normal en producción, porque la
 * ejecuta GitHub Actions— `lastRunAt` es null al arrancar y health responde
 * 503. Un orquestador que use health para decidir si la máquina está viva la
 * mataría y la reiniciaría, y la nueva volvería a responder 503: bucle de
 * reinicios permanente con un servicio que en realidad funciona.
 *
 * Aquí se responde solo a "¿puedes servir?". Si los datos están frescos o no es
 * otra pregunta, y la responde /api/health.
 */
app.get('/api/live', (req, res) => {
    res.json({ status: 'vivo', timestamp: new Date().toISOString() });
});

/**
 * Estado real del servicio: qué se ingirió, cuándo y qué feeds fallaron.
 *
 * El «cuándo» se lee de la BASE, no de la memoria de este proceso, y esa
 * distinción es la diferencia entre una alarma útil y una inútil. Desde F2-12
 * el motor es un proceso aparte: esta API no ingiere jamás, así que su
 * `lastRunAt` en memoria es null para siempre. Medido en producción — health
 * respondía 503 con el motor trabajando cada 30 minutos sin un solo fallo.
 *
 * Una alarma permanentemente encendida no avisa de nada; solo enseña a
 * ignorarla, y entonces el día que la ingesta se pare de verdad no lo dirá
 * nadie. Por eso se pregunta a `ingest_runs`, que es donde el motor deja
 * constancia, y solo se cae al estado en memoria si no hay base —el caso de
 * quien arranca en local sin Postgres.
 */
app.get('/api/health', async (req, res) => {
    const stats = getDatabaseStats();

    // Nunca lanza: un fallo al leer la base es en sí mismo señal de degradado,
    // y health tiene que poder responder precisamente cuando algo va mal.
    const [ultimoCiclo, conteos] = isDatabaseEnabled()
        ? await Promise.all([
            lastRunFromDb().catch(() => null),
            countStored().catch(() => null),
        ])
        : [null, null];

    const lastRunAt = ultimoCiclo?.at ?? stats.lastRunAt;
    const staleAfterMs = INGEST_INTERVAL_MS * 3;
    const lastRunMs = lastRunAt ? Date.parse(lastRunAt) : null;
    const isStale = !lastRunMs || Date.now() - lastRunMs > staleAfterMs;

    res.status(isStale ? 503 : 200).json({
        status: isStale ? 'degradado' : 'ok',
        service: 'DobleFoco API',
        ingestion: {
            lastRunAt,
            // De dónde sale la fecha. En producción siempre 'base': si aquí
            // aparece 'memoria' con la base configurada, la consulta falló.
            lastRunSource: ultimoCiclo ? 'base' : 'memoria',
            inProgress: stats.ingestionInProgress,
            intervalMs: INGEST_INTERVAL_MS,
            feedsOk: ultimoCiclo?.feedsOk ?? null,
            failedFeeds: stats.lastRunReport?.feedsFailed ?? [],
        },
        database: {
            // Los conteos también salen de la base, por lo mismo que la fecha:
            // este proceso no hidrata nada, así que sus contadores en memoria
            // valen 0. Publicaban «0 artículos, 0 historias» con 2 371
            // historias servidas — una cifra falsa es peor que ninguna, porque
            // invita a buscar una avería que no existe.
            articles: conteos?.articles ?? stats.totalArticles,
            stories: conteos?.stories ?? stats.totalStories,
            // Qué respalda esos números. `false` significa que un reinicio los
            // pone a cero: es información operativa, no un detalle interno.
            persistent: isDatabaseEnabled(),
            // El feed se sirve desde la base y filtra las retiradas en la
            // propia consulta, así que ya no hay un contador en memoria que
            // publicar aquí. La cifra vive en el panel, junto a las decisiones.
        },
        timestamp: new Date().toISOString(),
    });
});

// ---------------------------------------------------------------------------
// Descubrimiento para buscadores (F3-03)
// ---------------------------------------------------------------------------

/**
 * Dominio PÚBLICO del sitio, que no es el de esta API.
 *
 * Un sitemap declara URLs canónicas, y las canónicas son las que ve el lector:
 * doblefococo.vercel.app. Si aquí se colara el dominio de la API, estaríamos
 * pidiéndole a Google que indexe un servidor que devuelve JSON — y peor, que
 * trate ese dominio como el sitio real, partiendo la autoridad entre dos.
 */
const SITE_URL = (process.env.SITE_URL ?? 'https://doblefococo.vercel.app').replace(/\/+$/, '');

/** Rutas fijas del sitio. Las de contenido salen de la base. */
const RUTAS_ESTATICAS = [
    { ruta: '/', prioridad: '1.0', frecuencia: 'hourly' },
    { ruta: '/tendencias', prioridad: '0.8', frecuencia: 'hourly' },
    { ruta: '/categorias', prioridad: '0.6', frecuencia: 'daily' },
    { ruta: '/mapa-medios', prioridad: '0.6', frecuencia: 'weekly' },
    { ruta: '/transparencia', prioridad: '0.5', frecuencia: 'monthly' },
    { ruta: '/sobre-nosotros', prioridad: '0.4', frecuencia: 'monthly' },
];

const escaparXml = (texto) =>
    String(texto).replace(/[<>&'"]/g, (c) =>
        ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]
    );

/**
 * sitemap.xml generado desde la base en cada petición.
 *
 * NO se genera en el build, y esa es la decisión de fondo. El contenido cambia
 * cada 30 minutos: un sitemap construido al desplegar nacería obsoleto y habría
 * que reconstruir el sitio entero para refrescarlo. Generarlo aquí, junto a los
 * datos, cuesta una consulta de milisegundos.
 *
 * El coste de servirlo a cada rastreador lo absorbe la CDN, no esta máquina:
 * `s-maxage` hace que Vercel lo cachee media hora, y `stale-while-revalidate`
 * que durante la hora siguiente sirva la copia vieja al instante mientras pide
 * una nueva por detrás. Ese par de directivas es el estándar RFC 5861, y es el
 * mismo mecanismo que Next.js vende como ISR — con la diferencia de que
 * funciona en cualquier CDN y no nos ata a un proveedor.
 */
app.get('/sitemap.xml', async (req, res) => {
    try {
        const historias = await readSitemapEntries();

        const urls = [
            ...RUTAS_ESTATICAS.map(
                ({ ruta, prioridad, frecuencia }) =>
                    `  <url>\n    <loc>${escaparXml(SITE_URL + ruta)}</loc>\n` +
                    `    <changefreq>${frecuencia}</changefreq>\n` +
                    `    <priority>${prioridad}</priority>\n  </url>`
            ),
            ...historias.map(
                ({ id, title, lastmod }) =>
                    // La canónica, no la forma antigua: un sitemap que anuncia
                    // direcciones que redirigen gasta presupuesto de rastreo en
                    // balde y da señales contradictorias sobre cuál es la buena.
                    `  <url>
    <loc>${escaparXml(SITE_URL + rutaDeHistoria({ id, title }))}</loc>
` +
                    (lastmod ? `    <lastmod>${escaparXml(lastmod)}</lastmod>\n` : '') +
                    `    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>`
            ),
        ];

        res.type('application/xml');
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=1800, stale-while-revalidate=3600');
        res.send(
            `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
        );
    } catch (error) {
        console.error('[api] fallo generando el sitemap', error);
        res.status(500).type('text/plain').send('Error generando el sitemap');
    }
});

/**
 * robots.txt
 *
 * Se sirve desde aquí y no como archivo estático para que el enlace al sitemap
 * y el dominio salgan de la MISMA constante: dos archivos que hay que acordarse
 * de cambiar a la vez acaban divergiendo, y el síntoma sería un sitemap que
 * nadie encuentra.
 *
 * /admin va en Disallow. No es una medida de seguridad —quien quiera entrar no
 * consulta robots.txt, y la puerta la guarda la sesión de F2-04— sino de
 * higiene: que el panel no aparezca en resultados de búsqueda.
 */
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800');
    res.send(
        [
            'User-agent: *',
            'Allow: /',
            'Disallow: /admin',
            'Disallow: /buscar',
            '',
            `Sitemap: ${SITE_URL}/sitemap.xml`,
            '',
        ].join('\n')
    );
});

/**
 * Límite específico del único endpoint público que ESCRIBE en la base.
 *
 * El límite general (120/min) sirve para lecturas, pero aplicado a escrituras
 * permite 172 800 filas diarias desde una sola IP. Con eso se inunda la cola de
 * revisión del panel y, peor, se vuelve inútil la detección de ráfagas de
 * F2-07: si todo parece una ráfaga, la señal deja de distinguir nada.
 *
 * Diez por minuto es holgado para una persona —un lector reporta una o dos
 * historias por sesión, no diez— y hace que inundar la tabla deje de ser
 * gratis. No pretende frenar a una botnet: para eso hace falta un contador
 * compartido (F2-06), y aquí lo que se protege es una señal editorial, no un
 * dato crítico.
 */
const REPORT_WINDOW_MS = 60_000;
const REPORT_MAX = 10;

async function limitarReportes(req, res, next) {
    const { allowed, retryAfterSeconds } = await hit(
        `report:ip:${req.ip}`,
        REPORT_MAX,
        REPORT_WINDOW_MS
    );

    if (!allowed) {
        res.setHeader('Retry-After', String(retryAfterSeconds));
        return res.status(429).json({
            success: false,
            error: 'Demasiados reportes seguidos. Intenta de nuevo en un minuto.',
        });
    }

    // Barrido oportunista de ventanas viejas: una de cada cien escrituras.
    // Colgarlo del propio camino de escritura evita una tarea programada, y si
    // nadie usa el sistema tampoco hay basura de la que preocuparse.
    if (Math.random() < 0.01) sweep();

    return next();
}

/**
 * Reporte del lector sobre una historia (F2-07).
 *
 * PÚBLICO y sin sesión a propósito: pedir cuenta para señalar un defecto
 * garantiza que casi nadie lo señale, y lo que se recoge aquí no es una
 * opinión que haya que atribuir a nadie sino una PISTA sobre dónde mirar.
 *
 * No se guarda IP, ni identificador de sesión, ni nada que identifique a quien
 * reporta: solo qué, sobre qué historia y cuándo. El abuso lo contiene el
 * límite de peticiones general, que vive en memoria y no persiste nada. Así la
 * tabla queda fuera del alcance de la Ley 1581 por construcción.
 *
 * Como contrapartida asumida, un mismo lector puede reportar más de una vez.
 * Es tolerable porque estos datos son una pista para revisión editorial, no un
 * veredicto: el coste de un reporte de más es mirar una historia que estaba
 * bien.
 */
app.post('/api/report/:storyId', limitarReportes, async (req, res) => {
    const { storyId } = req.params;
    const kind = req.body?.kind;

    if (!REPORT_KINDS.includes(kind)) {
        return res.status(400).json({
            success: false,
            error: `Tipo no válido. Debe ser uno de: ${REPORT_KINDS.join(', ')}`,
        });
    }

    if (!isDatabaseEnabled()) {
        return res.status(503).json({ success: false, error: 'Servicio no disponible' });
    }

    try {
        const ok = await recordReport(storyId, kind);
        if (!ok) return res.status(404).json({ success: false, error: 'La historia no existe' });
        return res.json({ success: true });
    } catch (error) {
        console.error('[api] fallo en /api/report', error);
        return res.status(500).json({ success: false, error: 'Error interno' });
    }
});

/**
 * Feed paginado, leído de la base.
 *
 * Antes se servía desde un array en memoria que el proceso reconstruía al
 * arrancar, rehidratando ~1 800 artículos y reagrupándolos. Además de obligar a
 * un proceso persistente, eso tenía un efecto que nadie había medido: el
 * agrupamiento es codicioso y depende del orden, así que REAGRUPAR AL ARRANCAR
 * daba resultados distintos a los que el ciclo de ingesta había calculado y
 * guardado. El feed cambiaba sin que se hubiera ingerido nada — bastaba con
 * reiniciar.
 *
 * Medido sobre 196 historias comparables: 191 idénticas y 5 con reparto
 * distinto de medios, en ambas direcciones. Servir desde la base devuelve
 * exactamente lo que el ciclo calculó, siempre igual.
 */
app.get('/api/feed', async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const offset = Math.max(Number(req.query.offset) || 0, 0);

        // Lista blanca: el ámbito acaba en una cláusula SQL, así que no puede
        // salir de lo que llegue por la URL sin comprobarlo.
        const ambito = ['nacional', 'internacional'].includes(String(req.query.ambito))
            ? String(req.query.ambito)
            : 'all';

        const [stories, counts] = await Promise.all([
            readFeed({ limit, offset, ambito }),
            countFeed(),
        ]);

        // `total` se conserva como campo suelto por compatibilidad con lo ya
        // desplegado; `counts` es lo que necesita la portada para no confundir
        // el tamaño de la página con el del catálogo.
        res.json({ success: true, total: counts.total, counts, limit, offset, stories });
    } catch (error) {
        console.error('[api] fallo en /api/feed', error);
        res.status(500).json({ success: false, error: 'Error interno' });
    }
});

app.get('/api/story/:id', async (req, res) => {
    try {
        // Acepta tanto el id de la base como la forma legible de la URL. AQUÍ NO
        // SE REDIRIGE: esto lo llama `fetch`, y una redirección a /noticia/... le
        // devolvería HTML donde espera JSON. La canonicalización es asunto de la
        // ruta de página, que es la que ve un buscador.
        const story = await readStory(idDesdeRuta(req.params.id));

        if (!story) {
            // También 404 si está retirada por moderación: el filtro va en la
            // consulta, así que una historia rechazada simplemente no existe
            // para el público.
            return res.status(404).json({ success: false, error: 'Noticia no encontrada' });
        }
        return res.json({ success: true, story });
    } catch (error) {
        console.error('[api] fallo en /api/story', error);
        return res.status(500).json({ success: false, error: 'Error interno' });
    }
});

/**
 * Volumen publicado por medio, para la vista del espacio mediático (F3-16).
 *
 * Devuelve conteos en bruto y NADA agregado: la agrupación por dueño y el
 * reparto por espectro se calculan en shared/panorama.js, que es código
 * compartido y probado. Si esta ruta devolviera ya agrupado habría dos sitios
 * donde vive la misma lógica.
 */
app.get('/api/panorama', async (req, res) => {
    try {
        const medios = await countArticlesBySource();
        res.json({ success: true, medios, retentionHours: 72 });
    } catch (error) {
        console.error('[api] fallo en /api/panorama', error);
        res.status(500).json({ success: false, error: 'Error interno' });
    }
});

app.get('/api/stats', (req, res) => {
    try {
        res.json({ success: true, stats: getDatabaseStats() });
    } catch (error) {
        console.error('[api] fallo en /api/stats', error);
        res.status(500).json({ success: false, error: 'Error interno' });
    }
});

/**
 * Serie de ingesta agregada por día (tarea F1-01).
 *
 * Pública y de solo lectura: son cifras sobre nuestro propio funcionamiento,
 * exactamente el tipo de dato que un sitio sobre transparencia no debería
 * esconder. No expone titulares, enlaces ni nada de terceros.
 */
app.get('/api/metrics/daily', async (req, res) => {
    try {
        const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);

        // La base manda cuando está: acumula la serie de todos los despliegues,
        // mientras que el JSONL solo tiene la de esta instancia. Si la lectura
        // falla, se responde con el archivo local en vez de con un error: media
        // serie es mejor que ninguna.
        const summary =
            (isDatabaseEnabled() ? await dailySummaryFromDb({ days }) : null) ??
            (await dailySummary({ days }));

        res.json({
            success: true,
            days: summary.days,
            totalCycles: summary.totalCycles,
            // Se informa de las líneas ilegibles en vez de callarlas: un
            // contador de errores silencioso es un error que nadie arregla.
            corruptRows: summary.corrupt,
            source: summary.source ?? 'jsonl',
        });
    } catch (error) {
        console.error('[api] fallo en /api/metrics/daily', error);
        res.status(500).json({ success: false, error: 'Error interno' });
    }
});

/**
 * RENDERIZADO EN SERVIDOR DE /noticia/:id — F3-01 y F3-02
 *
 * Se carga UNA vez y se guarda. La versión anterior hacía dos existsSync y un
 * readFileSync sincrónicos en CADA petición: entrada/salida bloqueante dentro
 * del bucle de eventos, en la ruta que precisamente se quiere que aguante el
 * tráfico de los buscadores.
 *
 * `pathToFileURL` no es adorno: en Windows, `import()` de una ruta absoluta
 * falla con ERR_UNSUPPORTED_ESM_URL_SCHEME. Sin esto la ruta devuelve 500 en
 * desarrollo local aunque funcione en el contenedor, y el fallo se descubre en
 * producción.
 */
const RAIZ_APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * LA PLANTILLA SE PIDE AL SITIO, NO SE USA LA DE ESTA IMAGEN.
 *
 * Y es la decisión menos evidente de todo F3-01. El HTML lo sirve Fly, pero los
 * `/assets/index-XXXX.js` que ese HTML referencia los sirve VERCEL, desde su
 * propia compilación. Son dos construcciones independientes: en cuanto sus
 * hashes divergen —y divergen con cualquier cambio de código—, la página pide
 * un archivo que Vercel no tiene.
 *
 * MEDIDO, y por eso importa tanto: Vercel NO responde 404 a un asset que le
 * falta. El comodín `/(.*)` → /index.html le hace devolver «200 OK,
 * Content-Type: text/html». El navegador recibiría HTML donde espera
 * JavaScript, la página quedaría sin hidratar y sin interactividad, y no habría
 * un solo código de error en ningún registro.
 *
 * Pidiendo la plantilla al propio sitio, las referencias son por construcción
 * las que Vercel sirve en ese momento. Se refresca cada pocos minutos para que
 * un despliegue nuevo se recoja solo, y si el sitio no responde se cae a la
 * plantilla de la imagen, que al menos permite servir la página.
 */
const PLANTILLA_TTL_MS = 60 * 1000;
let plantillaCache = { html: null, cuando: 0 };

async function obtenerPlantilla() {
    const ahora = Date.now();
    if (plantillaCache.html && ahora - plantillaCache.cuando < PLANTILLA_TTL_MS) {
        return plantillaCache.html;
    }

    try {
        // Se pide la RAÍZ, nunca una ruta /noticia/*: esas las redirige Vercel
        // de vuelta aquí y el servidor se llamaría a sí mismo en bucle.
        const respuesta = await fetch(`${SITE_URL}/`, {
            signal: AbortSignal.timeout(5_000),
            headers: { Accept: 'text/html' },
        });

        if (respuesta.ok) {
            const html = await respuesta.text();
            // Comprobación de forma: si el sitio devolviera una página de error
            // con 200, usarla como plantilla produciría noticias en blanco.
            if (html.includes('<div id="root"></div>') && html.includes('</head>')) {
                plantillaCache = { html, cuando: ahora };
                return html;
            }
            console.warn('[ssr] el sitio devolvió algo que no parece la plantilla');
        }
    } catch (error) {
        console.warn(`[ssr] no se pudo leer la plantilla del sitio: ${error.message}`);
    }

    const local = await readFile(resolve(RAIZ_APP, 'dist/index.html'), 'utf8');
    plantillaCache = { html: local, cuando: ahora };
    return local;
}

let ssr = null;
let ssrFallido = false;

async function prepararSsr() {
    if (ssr) return ssr;
    if (ssrFallido) return null;

    try {
        const rutaEntrada = resolve(RAIZ_APP, 'dist-server/entry-server.js');
        const modulo = await import(pathToFileURL(rutaEntrada).href);
        ssr = { render: modulo.render };
        console.log('[ssr] renderizado en servidor listo');
        return ssr;
    } catch (error) {
        // Se marca para no reintentar en cada petición, y se avisa UNA vez con
        // claridad. Sin dist/ y dist-server/ en la imagen esto es lo que pasa;
        // el síntoma sería SEO silenciosamente muerto, así que conviene que el
        // registro lo diga con todas las letras.
        ssrFallido = true;
        console.error(
            `[ssr] NO se pudo cargar el renderizado en servidor: ${error.message}
` +
            '      Las noticias se servirán como SPA: funcionan para personas, ' +
            'pero los rastreadores no verán contenido. Revisa que dist/ y ' +
            'dist-server/ estén en la imagen.'
        );
        return null;
    }
}

app.get('/noticia/:id', async (req, res) => {
    try {
        // El parámetro ya no es el id de la base: es «titular-legible-abc123».
        const story = await readStory(idDesdeRuta(req.params.id));

        /**
         * UNA SOLA DIRECCIÓN POR NOTICIA, con 301 hacia ella.
         *
         * Llegan tres formas: la canónica, el id corto suelto y la antigua
         * `story_abc123` —la que salió en las 2 636 URLs del sitemap ya
         * publicado—. Servir la misma página en varias direcciones se penaliza
         * como contenido duplicado y reparte entre ellas la autoridad que
         * debería acumular una sola.
         *
         * 301 y no 302: le dice al buscador que la mudanza es definitiva y que
         * traslade a la nueva lo que tenía de la vieja. Con 302 mantendría la
         * antigua indexada indefinidamente.
         *
         * Se redirige ANTES de renderizar: no tiene sentido pagar el renderizado
         * de una página que no se va a entregar. Se cachea una hora en la CDN
         * —no dos minutos como el HTML— porque una redirección no referencia
         * ningún /assets/*.js que un despliegue pueda dejar muerto.
         */
        if (story && !esRutaCanonica(req.params.id, story)) {
            res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600');
            return res.redirect(301, rutaDeHistoria(story));
        }

        const motor = await prepararSsr();
        const plantilla = motor ? await obtenerPlantilla() : null;

        // Sin motor de renderizado se entrega la SPA tal cual. Es peor para el
        // buscador pero la página sigue funcionando para quien la visita, y
        // romper el sitio entero por un fallo de SEO sería desproporcionado.
        // NUNCA devolver JSON aquí: es una URL de HTML, y un rastreador que
        // reciba JSON lo indexaría como el contenido de la página.
        if (!motor) {
            if (!story) res.status(404);
            res.type('html');
            return res.send(await readFile(resolve(RAIZ_APP, 'dist/index.html'), 'utf8'));
        }

        if (!story) {
            // 404 de verdad, con su código: una historia retirada por moderación
            // o un id inventado no deben quedarse indexados como página válida.
            res.status(404).type('html');
            return res.send(
                montarPagina({
                    plantilla,
                    html: (await motor.render(req.originalUrl, null)).html,
                    metadatos:
                        '<title>Noticia no encontrada · DobleFoco.co</title>' +
                        '\n    <meta name="robots" content="noindex" />',
                    datos: { story: null },
                })
            );
        }

        const { html } = await motor.render(req.originalUrl, { story });

        // Mismo par de directivas que el sitemap (F3-03), por la misma razón:
        // el coste de servir a cada rastreador lo absorbe la CDN, no esta
        // máquina. Es el estándar RFC 5861, equivalente al ISR de Next.js.
        // DOS MINUTOS, no media hora como el sitemap, y la diferencia tiene
        // motivo medido: este HTML referencia los /assets/*.js que compila
        // VERCEL, y un despliegue suyo los sustituye por otros hashes. Vercel
        // NO purga las respuestas cacheadas de una redirección —comprobado—,
        // así que todo lo que la CDN tenga guardado apunta a archivos que ya no
        // existen y la página se queda sin hidratar.
        //
        // Con s-maxage corto, esa ventana baja de ~30 min a ~2, y
        // stale-while-revalidate hace que la primera petición pasada la ventana
        // ya dispare el refresco sin que nadie espere. Sigue absorbiendo el
        // tráfico de rastreadores, que es para lo que estaba.
        //
        // La solución de fondo —que Fly sirva su propio bundle bajo su propia
        // base, y no dependa del de Vercel— está descrita en el ROADMAP.
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=120, stale-while-revalidate=600');
        res.type('html');

        return res.send(
            montarPagina({
                plantilla,
                html,
                metadatos: construirMetadatos(story, SITE_URL),
                datos: { story },
            })
        );
    } catch (error) {
        console.error('[ssr] fallo al renderizar la noticia', error);
        // Esta ruta atiende su propio error para poder responder con HTML, así
        // que nunca llega al middleware: se registra aquí a mano. Es además el
        // sitio donde más importa, porque un fallo del renderizado no rompe la
        // página —se sirve igual— y por tanto nadie lo notaría.
        void registrarError({
            error,
            proceso: 'api',
            origen: 'peticion',
            ruta: `GET /noticia/:id`,
        });
        // Que no se cachee un error: sin esto, la CDN guardaría media hora una
        // página rota para todo el mundo.
        res.setHeader('Cache-Control', 'no-store');
        return res.status(500).type('html').send(
            '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
            '<title>Error · DobleFoco.co</title><meta name="robots" content="noindex">' +
            '</head><body><h1>No se pudo mostrar la noticia</h1>' +
            '<p><a href="/">Volver al inicio</a></p></body></html>'
        );
    }
});

/**
 * Pide un ciclo de ingesta. Requiere sesión (F2-05).
 *
 * NO INGIERE: encola una solicitud y responde de inmediato.
 *
 * Antes ejecutaba el ciclo completo aquí. Funcionaba en un servidor propio y es
 * imposible en una función sin servidor: un ciclo tarda entre uno y tres
 * minutos y el límite de ejecución son 10 segundos en Vercel Hobby, 60 en Pro.
 * La petición moriría a mitad, dejando una transacción abierta con bloqueos
 * sobre `stories` hasta que la base la descartara sola.
 *
 * El motor vive en su propia máquina, sin puerto abierto ni conectividad
 * entrante, y mira esta tabla en cada vuelta. El panel no necesita saber dónde
 * está alojado —cambiar de proveedor no toca una línea de aquí— y el motor no
 * expone ninguna superficie de ataque.
 */
app.post('/api/ingest/run', requireSession, async (req, res) => {
    try {
        const { created, pendingSince } = await requestCycle(req.user.id);

        return res.json({
            success: true,
            queued: created,
            pendingSince,
            message: created
                ? 'Ciclo solicitado. El motor lo tomará en menos de un minuto.'
                : 'Ya había una solicitud sin atender; no se encola otra.',
        });
    } catch (error) {
        console.error('[api] fallo al solicitar ciclo', error);
        return res.status(500).json({ success: false, error: 'Error interno' });
    }
});

/** Últimas solicitudes y cómo terminaron, para que el panel dé señal de vida. */
app.get('/api/ingest/requests', requireSession, async (req, res) => {
    try {
        return res.json({ success: true, requests: await recentRequests(5) });
    } catch (error) {
        console.error('[api] fallo al listar solicitudes', error);
        return res.status(500).json({ success: false, error: 'Error interno' });
    }
});

// Los mensajes de error internos no se filtran al cliente.
// ---------------------------------------------------------------------------
// Errores de producción (F2-11) — solo con sesión
// ---------------------------------------------------------------------------

/**
 * Los fallos vivos, para el panel.
 *
 * EXIGE SESIÓN, y no por costumbre: los mensajes de error describen la
 * estructura interna del sistema —nombres de tabla, rutas de archivo, versiones
 * de biblioteca— y eso es material de reconocimiento para quien quiera atacarlo.
 * El contenido de esta tabla ya va redactado para no filtrar credenciales, pero
 * eso es una segunda línea, no la primera.
 */
app.get('/api/errors', requireSession, async (req, res, next) => {
    try {
        const incluirResueltos = req.query.todos === '1';
        const [errores, resumen] = await Promise.all([
            erroresRecientes({ limite: Number(req.query.limit) || 50, incluirResueltos }),
            contarSinResolver(),
        ]);
        res.json({ success: true, errores, resumen });
    } catch (error) {
        next(error);
    }
});

/** Marca un fallo como atendido. No lo borra: el historial vale más. */
app.post('/api/errors/:huella/resolver', requireSession, async (req, res, next) => {
    try {
        const cambiado = await marcarResuelto(req.params.huella);
        if (!cambiado) {
            return res.status(404).json({ success: false, error: 'No existe o ya estaba resuelto' });
        }
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

// El manejador de errores va SIEMPRE el último: Express solo le pasa lo que no
// atendió ninguna ruta anterior.
app.use(middlewareDeErrores());

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------

app.listen(PORT, async () => {
    console.log(`[servidor] escuchando en http://localhost:${PORT}`);
    console.log(`[servidor] orígenes permitidos: ${ALLOWED_ORIGINS.join(', ')}`);

    // Solo se rehidrata si este proceso va a ingerir. Para servir el feed no
    // hace falta nada en memoria.
    const storage = await prepareStorage(
        (message) => console.log(`[servidor] ${message}`),
        { hydrateWorkingSet: INGEST_IN_PROCESS }
    );

    if (!storage.persistent) {
        console.warn(
            `[servidor] sin persistencia (${storage.reason}). Los artículos viven en memoria ` +
            'y un reinicio los borra. Configura DATABASE_URL y corre `npm run db:migrate`.'
        );
    }

    /**
     * Este servidor YA NO INGIERE, ni siquiera opcionalmente.
     *
     * Un ciclo tarda entre uno y tres minutos, y este proceso está pensado para
     * poder correr como función sin servidor, donde el límite de ejecución son
     * segundos. Mantener aquí un `setInterval` de ingesta sería dejar una
     * trampa: funcionaría en local y moriría a mitad en producción.
     *
     * La ingesta vive en `npm run worker`, un proceso propio con su propio
     * reloj y sin conectividad entrante.
     */
    if (INGEST_IN_PROCESS) {
        console.warn(
            '[servidor] INGEST_IN_PROCESS=true ya no hace nada aquí. La ingesta corre en su ' +
            'propio proceso: `npm run worker`.'
        );
    }
});
