/* global __ENV */
/**
 * SIMULACRO DE TRÁFICO — cuántas visitas aguanta el sitio antes de romperse.
 *
 *   k6 run -e BASE=https://doblefoco-carga.fly.dev -e RATE=8 scripts/simulacro.k6.js
 *
 * Una corrida por escalón (RATE = visitas por segundo, sostenidas DURACION),
 * para que cada nivel de tráfico tenga su propio resumen. El bucle que sube de
 * escalón en escalón y se detiene al primer fallo vive fuera, en la orden que
 * lanza la máquina generadora (ver la entrada de la minuta del 2026-09-22).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PARA QUÉ (M1.4 del plan del MVP, 2026-09-22)
 * ─────────────────────────────────────────────────────────────────────────────
 * Antes de promocionar el sitio hay que saber qué número lo rompe, qué pieza
 * cede primero y qué se hace ese día. Sin esto se descubre en medio de la
 * campaña. Lo pidió el estudio de mercadeo del 2026-08-31 («lo sexto: qué pasa
 * si un tuit funciona»), y Jose lo autorizó el 2026-09-22.
 *
 * UNA «VISITA» ES LO QUE HACE UN NAVEGADOR DE VERDAD, medido ese día contra
 * producción, y no una petición suelta:
 *   · portada (70 %): /api/health, /api/feed?limit=100, /api/portada?limit=100,
 *     /api/panorama y /api/departamentos, las cinco a la vez;
 *   · noticia (30 %): la página renderizada en el servidor, y /api/health y
 *     /api/feed?limit=100.
 * Con compresión, como un navegador: el servidor comprime con Brotli y ese
 * trabajo de CPU es parte de lo que se mide.
 *
 * CONTRA QUÉ. Contra una COPIA de la API (`doblefoco-carga`) con el límite por
 * IP relajado (`RATE_LIMIT_MAX`), porque el generador sale de una sola IP. La
 * copia lee la base de producción, que es lo que de verdad recibirá el tráfico.
 *
 * SE DETIENE SOLO si más del 10 % de las peticiones falla, o si el p95 pasa de
 * 8 s: seguir más allá no enseña nada y carga la base de producción de balde.
 */
import http from 'k6/http';
import { check } from 'k6';

const BASE = __ENV.BASE;
const RATE = Number(__ENV.RATE ?? 1);
const DURACION = __ENV.DURACION ?? '2m';

export const options = {
    scenarios: {
        visitas: {
            executor: 'constant-arrival-rate',
            rate: RATE,
            timeUnit: '1s',
            duration: DURACION,
            preAllocatedVUs: Math.max(10, RATE * 8),
            maxVUs: Math.max(50, RATE * 40),
        },
    },
    thresholds: {
        // MAX_FALLOS: 0,10 por defecto. Contra producción se baja (0,01 el 2026-09-22).
        http_req_failed: [{ threshold: `rate<${Number(__ENV.MAX_FALLOS ?? 0.10)}`, abortOnFail: true, delayAbortEval: '20s' }],
        http_req_duration: [{ threshold: 'p(95)<8000', abortOnFail: true, delayAbortEval: '20s' }],
    },
    summaryTrendStats: ['med', 'p(95)', 'p(99)', 'max'],
};

const params = (tipo) => ({ tags: { tipo }, headers: { 'Accept-Encoding': 'br, gzip' } });

/** Noticias reales, para que las visitas no pidan siempre la misma. */
export function setup() {
    const r = http.get(`${BASE}/api/feed?limit=40`, params('setup'));
    const ids = (r.json('stories') ?? []).map((s) => s.id);
    if (!ids.length) throw new Error('la API no devolvió historias: no hay simulacro que hacer');
    return { ids };
}

export default function ({ ids }) {
    if (Math.random() < 0.7) {
        const respuestas = http.batch([
            ['GET', `${BASE}/api/health`, null, params('portada')],
            ['GET', `${BASE}/api/feed?limit=100&offset=0`, null, params('portada')],
            ['GET', `${BASE}/api/portada?limit=100`, null, params('portada')],
            ['GET', `${BASE}/api/panorama`, null, params('portada')],
            ['GET', `${BASE}/api/departamentos`, null, params('portada')],
        ]);
        for (const r of respuestas) check(r, { 'portada 200': (x) => x.status === 200 });
    } else {
        const id = ids[Math.floor(Math.random() * ids.length)];
        const respuestas = http.batch([
            ['GET', `${BASE}/noticia/${id}`, null, params('noticia')],
            ['GET', `${BASE}/api/health`, null, params('noticia')],
            ['GET', `${BASE}/api/feed?limit=100&offset=0`, null, params('noticia')],
        ]);
        for (const r of respuestas) check(r, { 'noticia 200': (x) => x.status === 200 });
    }
}

/** Una línea por escalón, fácil de leer en los registros de la máquina. */
export function handleSummary(data) {
    const m = data.metrics;
    const d = m.http_req_duration?.values ?? {};
    const linea = {
        escalon_visitas_por_s: RATE,
        peticiones: m.http_reqs?.values?.count ?? 0,
        peticiones_por_s: Number((m.http_reqs?.values?.rate ?? 0).toFixed(1)),
        fallidas_pct: Number(((m.http_req_failed?.values?.rate ?? 0) * 100).toFixed(2)),
        mediana_ms: Math.round(d.med ?? 0),
        p95_ms: Math.round(d['p(95)'] ?? 0),
        p99_ms: Math.round(d['p(99)'] ?? 0),
        max_ms: Math.round(d.max ?? 0),
        visitas_descartadas: m.dropped_iterations?.values?.count ?? 0,
    };
    return { stdout: `\nRESULTADO ${JSON.stringify(linea)}\n` };
}
