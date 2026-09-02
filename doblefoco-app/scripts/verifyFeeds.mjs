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
import { ITEMS_PER_FEED, RETENTION_MS, techoDelFeed } from '../server/services/ingestDaemon.js';

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
import { USER_AGENT } from '../shared/userAgent.js';

const parser = new Parser({
    headers: { 'User-Agent': USER_AGENT },
    timeout: TIMEOUT_MS,
    // Los mismos campos que pide el motor. Sin esto, `media:*` no llega y todos
    // los feeds parecerían no traer imagen.
    customFields: {
        item: [
            ['media:content', 'mediaContent', { keepArray: true }],
            ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
            ['content:encoded', 'contentEncoded'],
        ],
    },
});

/**
 * RESPONDER NO ES ALIMENTAR — lo que este archivo aprendió el 2026-08-08.
 *
 * Hasta ese día un feed se daba por bueno con `items.length > 0`. Con ese
 * criterio, el feed de W Radio estuvo MESES en verde sirviendo piezas cuya
 * mediana de edad era de 32 551 horas —casi cuatro años—: devolvía 100 ítems y
 * ninguno entraba en la ventana de retención. El indicador decía «✓» sobre un
 * medio que no aportaba nada.
 *
 * Lo que de verdad predice si un medio alimenta el corpus son estas cuatro
 * cosas, medidas SOBRE LOS 15 ÍTEMS QUE EL MOTOR TOMA y no sobre el feed entero:
 *
 *   frescos   cuántos caen dentro de la ventana. Cero = el feed responde y el
 *             medio queda mudo igual.
 *   mediana   la edad típica de lo que tomamos.
 *   orden     SI LA MEDIANA ES ALTA, esto dice por qué, y son dos cosas muy
 *             distintas. Un feed CRONOLÓGICO con ítems viejos es un medio que
 *             publica despacio —Vorágine saca una pieza cada 74,7 h, y eso es
 *             su oficio, no una avería—. Un feed DESORDENADO con ítems viejos
 *             está ordenado por relevancia: existen piezas más nuevas que no nos
 *             está dando, cada sondeo devuelve casi lo mismo, se deduplica y no
 *             se acumula nada. Sin esta distinción el informe acusaría de estar
 *             roto al periodismo de investigación, que es justo al revés.
 *   imagen    cuántos traen `media:*`. NO es fatal que sea cero: el enriquecedor
 *             rescata la `og:image` después —El Tiempo trae 0 en el feed y tiene
 *             foto en todos sus artículos—. Es una dependencia, no una condena.
 *   dominio   si el enlace no apunta al medio —el caso de news.google.com— se
 *             pierde la URL canónica y el lector acaba en un intermediario.
 */
const edadMs = (item, ahora) => {
    const fecha = item.isoDate ?? item.pubDate;
    const t = fecha ? new Date(fecha).getTime() : NaN;
    return Number.isFinite(t) ? ahora - t : NaN;
};

const mediana = (valores) => {
    if (!valores.length) return NaN;
    const orden = [...valores].sort((a, b) => a - b);
    return orden[Math.floor(orden.length / 2)];
};

/**
 * ¿Vienen los ítems de más nuevo a más viejo?
 *
 * Se admite algún desorden —muchos gestores publican con minutos de desfase—
 * pero un feed por relevancia falla esto de forma escandalosa. Con menos de
 * cuatro fechas no se afirma nada: devuelve `null`, que la interfaz trata como
 * «no se sabe» y no como «desordenado».
 */
const esCronologico = (edades) => {
    if (edades.length < 4) return null;
    let enOrden = 0;
    for (let i = 1; i < edades.length; i += 1) {
        if (edades[i] >= edades[i - 1]) enOrden += 1;
    }
    return enOrden / (edades.length - 1) >= 0.8;
};

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
        const ahora = Date.now();
        // Solo los que el motor tomaría. Ver la nota «RESPONDER NO ES ALIMENTAR».
        const tomados = items.slice(0, techoDelFeed(feed));
        // Sin `filter` aquí el orden se rompería al quitar los que no tienen
        // fecha, y `esCronologico` mediría un orden que el feed no tiene.
        const edades = tomados.map((i) => edadMs(i, ahora)).filter(Number.isFinite);
        const frescos = edades.filter((ms) => ms < RETENTION_MS).length;
        const cronologico = esCronologico(edades);
        const conImagen = tomados.filter(
            (i) => i.mediaContent || i.mediaThumbnail || i.contentEncoded
        ).length;

        let dominioEnlace = null;
        for (const item of tomados) {
            try { dominioEnlace = new URL(item.link).hostname.replace(/^www\./, ''); break; } catch { /* siguiente */ }
        }
        const dominioAjeno = Boolean(
            dominioEnlace && feed.domain && !dominioEnlace.endsWith(feed.domain.replace(/^www\./, ''))
        );

        return {
            ...feed,
            ok: frescos > 0,
            items: items.length,
            tomados: tomados.length,
            frescos,
            conImagen,
            sinFecha: tomados.length - edades.length,
            medianaHoras: edades.length ? mediana(edades) / 3_600_000 : NaN,
            cronologico,
            dominioEnlace,
            dominioAjeno,
            ms: Date.now() - startedAt,
            error: items.length === 0
                ? 'respondió sin artículos'
                : frescos === 0
                    ? `responde pero NADA entra: los ${tomados.length} ítems que tomamos están fuera de la ventana`
                    : null,
            sample: items[0]?.title ?? null,
        };
    } catch (error) {
        return {
            ...feed,
            ok: false,
            items: 0,
            tomados: 0,
            frescos: 0,
            conImagen: 0,
            sinFecha: 0,
            medianaHoras: NaN,
            cronologico: null,
            dominioEnlace: null,
            dominioAjeno: false,
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

console.log('FEEDS  —  «frescos» y «foto» se miden sobre los ' + ITEMS_PER_FEED + ' ítems que toma el motor (o el techo propio del feed)');
console.log('─'.repeat(78));
console.log('   medio                  vía      ítems  frescos  foto   mediana  orden');
console.log('─'.repeat(78));

for (const entry of byMedia.values()) {
    const mark = entry.ok ? '✓' : '✗';
    const via = entry.feeds.every((f) => f.via === 'gnews') ? 'gnews' : 'directo';
    const frescos = entry.feeds.reduce((s, f) => s + f.frescos, 0);
    const tomados = entry.feeds.reduce((s, f) => s + f.tomados, 0);
    const foto = entry.feeds.reduce((s, f) => s + f.conImagen, 0);
    const medianas = entry.feeds.map((f) => f.medianaHoras).filter(Number.isFinite);
    const med = medianas.length ? `${mediana(medianas).toFixed(1)} h` : '—';
    /*
     * «fecha»  viene ordenado: lo viejo, si lo hay, es la cadencia del medio.
     * «RELEV»  desordenado Y viejo — hay piezas nuevas que no nos está dando.
     * «mezcl.» desordenado pero todo fresco. Se dice, y no se alarma: si lo que
     *          llega es de hace una hora, da igual en qué orden venga.
     */
    const ordenes = entry.feeds.map((f) => f.cronologico).filter((v) => v !== null);
    const medianaGrupo = medianas.length ? mediana(medianas) : 0;
    const orden = !ordenes.length
        ? '—'
        : ordenes.every(Boolean)
            ? 'fecha'
            : medianaGrupo > 24
                ? 'RELEV'
                : 'mezcl.';

    console.log(
        `${mark}  ${entry.name.padEnd(22)} ${via.padEnd(8)} ` +
        `${String(entry.items).padStart(5)}  ${String(frescos).padStart(4)}/${String(tomados).padEnd(3)} ` +
        `${String(foto).padStart(4)}   ${med.padStart(8)}  ${orden}`
    );

    for (const feed of entry.feeds) {
        if (feed.ok) continue;
        console.log(`      · ${feed.via === 'gnews' ? 'gnews' : 'directo'} ${feed.url}`);
        console.log(`        ${feed.error} (${feed.ms} ms)`);
    }
}

// ── Los tres fallos que «items.length > 0» no veía ───────────────────────────

const mudosQueResponden = results.filter((r) => r.items > 0 && r.frescos === 0);
const ajenos = results.filter((r) => r.dominioAjeno);
// Viejo Y desordenado. Si viene en orden, es cadencia del medio y no un fallo.
const desordenados = results.filter(
    (r) => r.items > 0 && r.medianaHoras > 24 && r.cronologico === false
);
const lentosPeroSanos = results.filter(
    (r) => r.frescos > 0 && r.medianaHoras > 72 && r.cronologico === true
);

if (mudosQueResponden.length || ajenos.length || desordenados.length) {
    console.log();
    console.log('AVISOS QUE «RESPONDE O NO RESPONDE» NO DABA');
    console.log('─'.repeat(78));

    for (const r of mudosQueResponden) {
        console.log(`  ✗ ${r.name}: responde con ${r.items} ítems y NINGUNO entra en la ventana.`);
        if (Number.isFinite(r.medianaHoras)) {
            console.log(`     mediana ${(r.medianaHoras / 24).toFixed(0)} días — sirve archivo, no actualidad.`);
        }
    }
    for (const r of desordenados) {
        console.log(
            `  ⚠ ${r.name}: mediana de ${r.medianaHoras.toFixed(0)} h y los ítems NO vienen por fecha.`
        );
        console.log('     Orden por relevancia: hay piezas más nuevas que este feed no nos da.');
    }
    for (const r of ajenos) {
        console.log(`  ⚠ ${r.name}: los enlaces apuntan a ${r.dominioEnlace}, no a ${r.domain}.`);
    }
}

if (lentosPeroSanos.length) {
    console.log();
    console.log('PUBLICAN DESPACIO, Y NO ES UN FALLO');
    console.log('─'.repeat(78));
    console.log('  Feeds en orden cronológico correcto: lo que devuelven ES lo último que');
    console.log('  publicaron. Aparecen aquí para que su silencio no se lea como avería.');
    for (const r of lentosPeroSanos) {
        console.log(`  · ${r.name.padEnd(22)} pieza más reciente hace ${r.medianaHoras.toFixed(0)} h (mediana)`);
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
