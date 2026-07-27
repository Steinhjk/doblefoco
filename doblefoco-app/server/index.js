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
import {
    runIngestionBatch,
    getLatestFeed,
    getStoryById,
    getDatabaseStats,
} from './services/ingestDaemon.js';
import { dailySummary } from './services/metricsStore.js';
import { isDatabaseEnabled } from './db/pool.js';
import { dailySummaryFromDb } from './db/contentStore.js';
import { prepareStorage } from './bootstrap.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const INGEST_TOKEN = process.env.INGEST_TOKEN;
const INGEST_INTERVAL_MS = Number(process.env.INGEST_INTERVAL_MS) || 10 * 60 * 1000;

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
        maxAge: 86_400,
    })
);

app.use(express.json({ limit: '32kb' }));

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
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

/** Exige el token de ingesta mediante cabecera Authorization: Bearer <token>. */
function requireIngestToken(req, res, next) {
    if (!INGEST_TOKEN) {
        // Negarse por defecto: es preferible una función deshabilitada a una
        // función de escritura abierta porque falta configurar una variable.
        return res.status(503).json({
            success: false,
            error: 'Ingesta manual deshabilitada: falta configurar INGEST_TOKEN en el servidor.',
        });
    }

    const header = req.get('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token || token !== INGEST_TOKEN) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    return next();
}

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------

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
        },
        timestamp: new Date().toISOString(),
    });
});

/** Feed paginado. */
app.get('/api/feed', (req, res) => {
    try {
        const all = getLatestFeed();
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const offset = Math.max(Number(req.query.offset) || 0, 0);

        res.json({
            success: true,
            total: all.length,
            limit,
            offset,
            stories: all.slice(offset, offset + limit),
        });
    } catch (error) {
        console.error('[api] fallo en /api/feed', error);
        res.status(500).json({ success: false, error: 'Error interno' });
    }
});

app.get('/api/story/:id', (req, res) => {
    try {
        const story = getStoryById(req.params.id);
        if (!story) {
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

/** Dispara un ciclo de ingesta. Requiere token. */
app.post('/api/ingest/run', requireIngestToken, async (req, res) => {
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

    if (!INGEST_TOKEN) {
        console.warn(
            '[servidor] INGEST_TOKEN sin definir: POST /api/ingest/run responderá 503. ' +
            'La ingesta programada sí funciona.'
        );
    }

    const storage = await prepareStorage((message) => console.log(`[servidor] ${message}`));

    if (!storage.persistent) {
        console.warn(
            `[servidor] sin persistencia (${storage.reason}). Los artículos viven en memoria ` +
            'y un reinicio los borra. Configura DATABASE_URL y corre `npm run db:migrate`.'
        );
    } else if (storage.recovered) {
        console.log('[servidor] el feed ya sirve contenido');
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
