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

import express from 'express';
import cors from 'cors';
import { runIngestionBatch, getDatabaseStats } from './services/ingestDaemon.js';
import { countFeed, readFeed, readStory } from './db/feedStore.js';
import { dailySummary } from './services/metricsStore.js';
import { isDatabaseEnabled } from './db/pool.js';
import { dailySummaryFromDb } from './db/contentStore.js';
import { prepareStorage } from './bootstrap.js';
import authRoutes, { requireSession } from './auth/routes.js';
import moderationRoutes from './moderationRoutes.js';
import { recordReport, REPORT_KINDS } from './db/reportStore.js';

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
 * Límite de peticiones por IP, en memoria y con ventana deslizante.
 *
 * Sin dependencias nuevas a propósito. Cuando haya varias instancias hará
 * falta un contador compartido (Redis); mientras el despliegue sea de un solo
 * proceso, esto cumple. Tarea F2-06 del ROADMAP.
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

/** Estado real del servicio: qué se ingirió, cuándo y qué feeds fallaron. */
app.get('/api/health', (req, res) => {
    const stats = getDatabaseStats();
    const staleAfterMs = INGEST_INTERVAL_MS * 3;
    const lastRunMs = stats.lastRunAt ? Date.parse(stats.lastRunAt) : null;
    const isStale = !lastRunMs || Date.now() - lastRunMs > staleAfterMs;

    res.status(isStale ? 503 : 200).json({
        status: isStale ? 'degradado' : 'ok',
        service: 'DobleFoco API',
        ingestion: {
            lastRunAt: stats.lastRunAt,
            inProgress: stats.ingestionInProgress,
            intervalMs: INGEST_INTERVAL_MS,
            failedFeeds: stats.lastRunReport?.feedsFailed ?? [],
        },
        database: {
            articles: stats.totalArticles,
            stories: stats.totalStories,
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
const reportHits = new Map();

function limitarReportes(req, res, next) {
    const key = req.ip ?? 'desconocida';
    const now = Date.now();
    const recent = (reportHits.get(key) ?? []).filter((t) => t > now - REPORT_WINDOW_MS);

    if (recent.length >= REPORT_MAX) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({
            success: false,
            error: 'Demasiados reportes seguidos. Intenta de nuevo en un minuto.',
        });
    }

    recent.push(now);
    reportHits.set(key, recent);

    if (reportHits.size > 10_000) {
        for (const [ip, stamps] of reportHits) {
            if (!stamps.some((t) => t > now - REPORT_WINDOW_MS)) reportHits.delete(ip);
        }
    }

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

        const [stories, total] = await Promise.all([readFeed({ limit, offset }), countFeed()]);

        res.json({ success: true, total, limit, offset, stories });
    } catch (error) {
        console.error('[api] fallo en /api/feed', error);
        res.status(500).json({ success: false, error: 'Error interno' });
    }
});

app.get('/api/story/:id', async (req, res) => {
    try {
        const story = await readStory(req.params.id);
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
 * Dispara un ciclo de ingesta. Requiere sesión (F2-05).
 *
 * Antes exigía un Bearer token que venía de VITE_INGEST_TOKEN, o sea, del
 * bundle: público por construcción. Servía para que el endpoint no quedara
 * abierto de par en par, no para autorizar a nadie. Ahora lo autoriza la sesión
 * del panel, y esa variable desapareció del proyecto.
 */
app.post('/api/ingest/run', requireSession, async (req, res) => {
    try {
        const result = await runIngestionBatch();

        if (result.skipped) {
            return res.status(409).json({ success: false, error: result.reason });
        }

        return res.json({ success: true, report: result });
    } catch (error) {
        console.error('[api] fallo en /api/ingest/run', error);
        return res.status(500).json({ success: false, error: 'Error interno' });
    }
});

// Los mensajes de error internos no se filtran al cliente.
app.use((error, req, res, _next) => {
    console.error('[api] error no controlado', error);
    res.status(500).json({ success: false, error: 'Error interno' });
});

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

    if (!INGEST_IN_PROCESS) {
        console.log(
            '[servidor] ingesta en proceso DESACTIVADA. La ejecuta GitHub Actions cada 30 min. ' +
            'Para ingerir desde aquí: INGEST_IN_PROCESS=true'
        );
        return;
    }

    runIngestionBatch().catch((error) =>
        console.error('[servidor] fallo en la ingesta inicial', error)
    );

    // runIngestionBatch() se autoprotege del solapamiento, así que un ciclo
    // lento ya no puede acumular ejecuciones encima.
    setInterval(() => {
        runIngestionBatch().catch((error) =>
            console.error('[servidor] fallo en la ingesta programada', error)
        );
    }, INGEST_INTERVAL_MS);
});
