/**
 * ¿Hay algún medio con feed que lleve demasiado tiempo sin aportar nada?
 * Y ¿responde el sitio? Lo ejecuta .github/workflows/vigilancia.yml desde
 * doblefoco-app/, para que `pg` y el registro resuelvan por la vía normal del
 * proyecto: NODE_PATH no sirve, los módulos ESM lo ignoran.
 *
 * EL UMBRAL ES GENEROSO A PROPÓSITO: 14 DÍAS.
 *
 * El catálogo tiene medios que publican poco POR OFICIO, no por avería. Medido
 * el 2026-08-07: Vorágine saca una pieza cada 74,7 horas —más despacio que la
 * propia ventana de retención— y Noticias Uno es un noticiero de fin de semana
 * que publica en ráfagas. Un umbral de dos o tres días los marcaría cada semana,
 * y un aviso que grita cuando no pasa nada enseña a ignorarlo: es exactamente el
 * fallo que costó los correos falsos de Actions.
 *
 * Catorce días no detecta una caída de un día, y no pretende. Detecta lo que
 * importa y hoy no se ve: un feed que se rompió y ya no vuelve.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

// En local lee .env.local; en Actions no existe y DATABASE_URL llega del
// entorno. `dotenv` no pisa lo que ya esté definido, así que sirve para ambos.
dotenv.config({
    path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local'),
    quiet: true,
});

const DIAS_MUDO = 14;
const SITIOS = [
    { nombre: 'sitio', url: 'https://doblefoco.co' },
    { nombre: 'API', url: 'https://doblefoco.fly.dev/api/health' },
];

const problemas = [];

// ── 1. ¿Responde lo que se sirve al público? ───────────────────────────────
console.log('\n  DISPONIBILIDAD\n');
for (const s of SITIOS) {
    try {
        const r = await fetch(s.url, { signal: AbortSignal.timeout(25_000) });
        const ok = r.status === 200;
        console.log(`  ${ok ? '✓' : '✗'} ${s.nombre.padEnd(6)} HTTP ${r.status}  ${s.url}`);
        if (!ok) problemas.push(`${s.nombre} responde HTTP ${r.status}`);

        if (s.nombre === 'API' && ok) {
            const salud = await r.json();
            if (salud.status !== 'ok') {
                problemas.push(
                    `La API se declara «${salud.status}»: la ingesta lleva demasiado sin correr.`
                );
            }
        }
    } catch (error) {
        console.log(`  ✗ ${s.nombre.padEnd(6)} ${error.message}`);
        problemas.push(`${s.nombre} no respondió: ${error.message}`);
    }
}

// ── 2. Medios mudos ────────────────────────────────────────────────────────
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

/**
 * Se refresca la marca desde lo que queda en la ventana de retención.
 *
 * `greatest` para que solo suba: un medio que hoy no publicó conserva la fecha
 * que ya tenía. Sin eso, la marca se borraría cada vez que el medio pasa un día
 * en silencio y el aviso no saltaría nunca.
 */
await pool.query(`
    UPDATE sources s
       SET last_article_at = greatest(
             coalesce(s.last_article_at, '-infinity'::timestamptz),
             v.ultimo
           )
      FROM (
        SELECT source_id, max(coalesce(published_at, ingested_at)) AS ultimo
          FROM articles GROUP BY source_id
      ) v
     WHERE v.source_id = s.id
`);

const { rows } = await pool.query(
    `SELECT name, last_article_at,
            extract(day from now() - last_article_at)::int AS dias
       FROM sources ORDER BY last_article_at NULLS FIRST`
);

const { getIngestFeeds } = await import(
    new URL('../shared/mediaRegistry.js', import.meta.url).href
);
const conFeed = new Set(getIngestFeeds().map((f) => f.name));

const mudos = rows.filter((r) => conFeed.has(r.name) && (r.dias === null || r.dias >= DIAS_MUDO));
const nunca = mudos.filter((r) => !r.last_article_at);
const callados = mudos.filter((r) => r.last_article_at);

console.log(`\n  MEDIOS CON FEED SIN APORTAR EN ${DIAS_MUDO} DÍAS\n`);
if (!mudos.length) {
    console.log('  ✓ Ninguno.');
} else {
    for (const m of callados) console.log(`  ✗ ${m.name.padEnd(24)} ${m.dias} días`);
    for (const m of nunca) console.log(`  ? ${m.name.padEnd(24)} sin registro todavía`);
}

if (callados.length) {
    problemas.push(
        `${callados.length} medio(s) con feed llevan ${DIAS_MUDO}+ días sin aportar: ` +
        callados.map((m) => `${m.name} (${m.dias}d)`).join(', ')
    );
}

/**
 * Los «sin registro» NO cuentan como problema, y es deliberado.
 *
 * La columna se creó el 2026-08-07 y solo se rellena con lo que haya en la
 * ventana de 72 h, así que un medio que llevaba días callado en ese momento
 * aparece sin fecha sin que eso signifique avería. En cuanto publique una vez,
 * queda con marca y pasa a vigilarse como los demás. Tratarlos como fallo desde
 * el primer día habría hecho que el aviso naciera en rojo — y un aviso que nace
 * en rojo se ignora desde el primer día.
 */

await pool.end();

if (!problemas.length) {
    console.log('\n  ✓ Todo en orden.\n');
    process.exit(0);
}

console.error('\n  ✗ HAY QUE MIRAR ESTO\n');
for (const p of problemas) console.error(`    · ${p}`);
console.error('');
process.exit(1);
