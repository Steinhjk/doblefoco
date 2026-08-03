/**
 * Verificación de los feeds del catálogo CONTRA LA RED.
 *
 * Ejecutar con: npm run check:feeds        (informe)
 *               npm run check:feeds -- --strict   (sale 1 si no se cumple F1-06)
 *
 * Por qué existe
 * --------------
 * shared/mediaRegistry.js afirma que "todos los feeds fueron verificados contra
 * la red". Esa frase es exactamente el tipo de afirmación que el roadmap
 * anterior daba por buena sin poder demostrarla. Aquí se comprueba: se pide
 * cada feed, se cuenta lo que devuelve y se imprime el resultado.
 *
 * El criterio de F1-06 es "25 medios activos con al menos 6 por espectro".
 * ACTIVO significa que respondió AHORA con al menos un artículo, no que esté
 * escrito en el catálogo.
 *
 * Este script toca la red: es lento (decenas de segundos) y puede fallar por
 * causas ajenas al código. Por eso no gatea nada por defecto.
 */

import Parser from 'rss-parser';
import { MEDIA_REGISTRY, SPECTRUM_BANDS, getIngestFeeds, getBand } from '../shared/mediaRegistry.js';

const STRICT = process.argv.includes('--strict');

const TIMEOUT_MS = 12_000;
const CONCURRENCY = 6;

/**
 * El mismo User-Agent identificable que usa el motor de ingesta.
 *
 * Se quedó anunciando «SincuentoBot/2.0 (+https://sincuento.co/…)» tras el
 * cambio de nombre: un dominio que ya no es nuestro y una página de contacto
 * que no existe. Justo lo contrario de para qué sirve identificarse.
 */
const USER_AGENT =
    'DobleFocoBot/1.0 (+https://doblefoco.co/transparencia; agregador de cobertura periodística)';

const parser = new Parser({ headers: { 'User-Agent': USER_AGENT }, timeout: TIMEOUT_MS });

async function mapWithConcurrency(items, limit, worker) {
    const results = new Array(items.length);
    let cursor = 0;

    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (cursor < items.length) {
            const index = cursor;
            cursor += 1;
            results[index] = await worker(items[index]);
        }
    });

    await Promise.all(runners);
    return results;
}

/**
 * Una sola pasada, sin reintentos.
 * El motor reintenta dos veces; aquí no, a propósito: interesa saber qué feeds
 * responden a la primera y cuáles son frágiles.
 */
async function probe(feed) {
    const startedAt = Date.now();

    try {
        const parsed = await parser.parseURL(feed.url);
        const items = parsed?.items ?? [];
        return {
            ...feed,
            ok: items.length > 0,
            items: items.length,
            ms: Date.now() - startedAt,
            error: items.length ? null : 'respondió sin artículos',
            sample: items[0]?.title ?? null,
        };
    } catch (error) {
        return {
            ...feed,
            ok: false,
            items: 0,
            ms: Date.now() - startedAt,
            error: error?.message ?? 'error desconocido',
            sample: null,
        };
    }
}

const feeds = getIngestFeeds();

console.log(`Sondeando ${feeds.length} feeds de ${new Set(feeds.map((f) => f.mediaId)).size} medios…`);
console.log(`Fecha: ${new Date().toISOString()}`);
console.log();

const results = await mapWithConcurrency(feeds, CONCURRENCY, probe);

// ── Estado por medio: activo si al menos uno de sus feeds trajo artículos ────

const byMedia = new Map();

for (const result of results) {
    const entry = byMedia.get(result.mediaId) ?? { name: result.name, feeds: [], items: 0, ok: false };
    entry.feeds.push(result);
    entry.items += result.items;
    entry.ok = entry.ok || result.ok;
    byMedia.set(result.mediaId, entry);
}

const registryById = new Map(MEDIA_REGISTRY.map((m) => [m.id, m]));

console.log('FEEDS');
console.log('─'.repeat(78));

for (const [mediaId, entry] of byMedia) {
    const media = registryById.get(mediaId);
    const band = getBand(media.bias).label;
    const mark = entry.ok ? '✓' : '✗';
    console.log(`${mark} ${entry.name.padEnd(22)} ${band.padEnd(17)} ${String(entry.items).padStart(3)} art.`);

    for (const feed of entry.feeds) {
        if (feed.ok) continue;
        const via = feed.via === 'gnews' ? 'gnews' : 'directo';
        console.log(`    · ${via} ${feed.url}`);
        console.log(`      ${feed.error} (${feed.ms} ms)`);
    }
}

// ── Cobertura por banda, contando SOLO medios activos ────────────────────────

const activeMedia = [...byMedia.entries()].filter(([, entry]) => entry.ok);
const perBand = {};

for (const [mediaId] of activeMedia) {
    const band = getBand(registryById.get(mediaId).bias).id;
    perBand[band] = (perBand[band] ?? 0) + 1;
}

const leftish = (perBand.left ?? 0) + (perBand['center-left'] ?? 0);
const rightish = (perBand.right ?? 0) + (perBand['center-right'] ?? 0);
const totalArticles = results.reduce((sum, r) => sum + r.items, 0);

console.log();
console.log('MEDIOS ACTIVOS POR BANDA');
console.log('─'.repeat(78));
for (const band of SPECTRUM_BANDS) {
    const count = perBand[band.id] ?? 0;
    console.log(`  ${band.label.padEnd(17)} ${String(count).padStart(2)}  ${'▇'.repeat(count)}`);
}

console.log();
console.log('CRITERIO F1-06');
console.log('─'.repeat(78));

const checks = [
    ['25 medios activos', activeMedia.length, 25],
    ['6 medios izquierda/centro-izquierda', leftish, 6],
    ['6 medios derecha/centro-derecha', rightish, 6],
];

let failed = false;

for (const [label, value, target] of checks) {
    const pass = value >= target;
    if (!pass) failed = true;
    console.log(`  ${pass ? '✓' : '✗'} ${label.padEnd(38)} ${value}/${target}`);
}

console.log();
console.log(
    `${activeMedia.length}/${byMedia.size} medios respondieron · ` +
    `${results.filter((r) => r.ok).length}/${results.length} feeds · ` +
    `${totalArticles} artículos disponibles en esta pasada`
);

if (failed && STRICT) process.exit(1);
