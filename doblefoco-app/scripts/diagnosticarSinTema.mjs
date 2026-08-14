/**
 * ¿POR QUÉ SE QUEDA SIN TEMA EL 30 % DEL CORPUS?  —  Uso: npm run diag:sintema
 *
 * SOLO LEE. No escribe una línea en la base.
 *
 * POR QUÉ EXISTE. `recategorizar` publica dos cifras de salud —«sin tema» y
 * «rescatados por señal débil»— y llevan días anotadas sin que nadie las mire.
 * Un porcentaje no dice qué hacer: 30 % de artículos sin clasificar puede ser
 * léxico corto, puede ser corpus raro, o puede ser correcto. Este script
 * distingue los tres casos antes de que a nadie le tiente añadir palabras.
 *
 * LO QUE PREGUNTA, EN ESTE ORDEN:
 *
 *   1. ¿Puntúan CERO, o se quedan a un pelo del umbral? Es la pregunta que
 *      decide todo lo demás. Si puntúan cero, al léxico le falta vocabulario.
 *      Si se quedan en 1,4 con el rescate en 1,5, lo que sobra es umbral.
 *   2. ¿De qué medios vienen? Un medio deportivo entero sin clasificar es un
 *      problema de mapeo de secciones, no de léxico.
 *   3. ¿Qué palabras se repiten en sus titulares y NO están en ningún léxico?
 *      Es la lista de candidatos a término, ordenada por lo que rendiría.
 *
 * LO QUE NO HACE, A PROPÓSITO: no propone cambios ni toca `TEMAS`. La forma de
 * descubrir que un léxico está mal no puede ser mirar la portada después.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { checkConnection, query, closePool } = await import('../server/db/pool.js');
const { classifyTopics, UMBRAL_ASIGNA, UMBRAL_RESCATE } = await import(
    '../shared/topicClassifier.js'
);
const { MEDIA_REGISTRY } = await import('../shared/mediaRegistry.js');

const LOTE = 500;
const paisPorMedio = new Map(MEDIA_REGISTRY.map((m) => [m.id, m.country]));
const nombrePorMedio = new Map(MEDIA_REGISTRY.map((m) => [m.id, m.shortName ?? m.name]));

/** Palabras que no distinguen nada y sobran en cualquier recuento. */
const VACIAS = new Set(
    ('de la el en y a los las un una que se del por con para al es su sus como mas más ' +
     'este esta estos estas lo le les ya no ni o u si sí sobre entre tras desde hasta ' +
     'fue son ser han ha hay dos tres millones mil año años dia dias día días hoy ayer ' +
     'tambien también solo sólo asi así donde cuando quien quienes cual cuales muy todo ' +
     'todos toda todas otro otra otros otras cada mismo misma parte vez veces gran grande ' +
     'nuevo nueva nuevos nuevas primer primera segundo tras luego pero porque aunque ' +
     'sera será seran serán esta estan están estar tiene tienen tener hacer hace hizo ' +
     'dice dijo dijeron segun según durante contra sin nos me te lo').split(/\s+/)
);

const norm = (t) =>
    (t ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9ñ\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

async function main() {
    const estado = await checkConnection();
    if (!estado.enabled) {
        console.error(`\n  ✗ No se pudo conectar: ${estado.reason}\n`);
        process.exitCode = 1;
        return;
    }

    console.log(`\n  DIAGNÓSTICO DE «SIN TEMA»  (solo lectura)`);
    console.log(`  Conectado a ${estado.database}`);
    console.log(`  Umbrales: asigna ≥ ${UMBRAL_ASIGNA} · rescata ≥ ${UMBRAL_RESCATE}\n`);

    let total = 0;
    let sinTema = 0;
    let rescatados = 0;

    /** Distribución del MEJOR puntaje entre los que se quedan sin tema. */
    const franjas = { 'cero (ninguna señal)': 0, '0 < p < 1': 0, '1 ≤ p < 1,5 (rozan)': 0, 'p ≥ 1,5 sin contexto': 0 };
    const porMedio = new Map();
    const palabras = new Map();
    const muestras = [];

    let offset = 0;
    for (;;) {
        const { rows } = await query(
            `SELECT a.headline, a.snippet, a.canonical_url, a.source_id
               FROM articles a ORDER BY a.id LIMIT $1 OFFSET $2`,
            [LOTE, offset]
        );
        if (!rows.length) break;

        for (const f of rows) {
            total += 1;
            const r = classifyTopics({
                headline: f.headline,
                snippet: f.snippet ?? '',
                link: f.canonical_url,
                paisDelMedio: paisPorMedio.get(f.source_id) ?? 'CO',
            });

            if (r.rescatado) rescatados += 1;
            if (r.temas.length > 0) continue;

            sinTema += 1;

            const mejor = Math.max(0, ...Object.values(r.puntajes));
            if (mejor === 0) franjas['cero (ninguna señal)'] += 1;
            else if (mejor < 1) franjas['0 < p < 1'] += 1;
            else if (mejor < UMBRAL_RESCATE) franjas['1 ≤ p < 1,5 (rozan)'] += 1;
            else franjas['p ≥ 1,5 sin contexto'] += 1;

            const medio = nombrePorMedio.get(f.source_id) ?? f.source_id ?? '(?)';
            porMedio.set(medio, (porMedio.get(medio) ?? 0) + 1);

            for (const w of norm(f.headline).split(' ')) {
                if (w.length < 4 || VACIAS.has(w) || /^\d+$/.test(w)) continue;
                palabras.set(w, (palabras.get(w) ?? 0) + 1);
            }

            if (muestras.length < 25 && mejor === 0) muestras.push(f.headline);
        }

        offset += LOTE;
    }

    const pc = (n) => `${((n / total) * 100).toFixed(1)} %`.padStart(7);

    console.log(`  ${total} artículos · ${sinTema} sin tema (${pc(sinTema).trim()}) · ${rescatados} rescatados (${pc(rescatados).trim()})\n`);

    console.log('  1. ¿CERO SEÑAL, O ROZANDO EL UMBRAL?');
    console.log('  ' + '─'.repeat(66));
    for (const [k, v] of Object.entries(franjas)) {
        const cuota = sinTema ? ((v / sinTema) * 100).toFixed(1) : '0.0';
        console.log(`    ${k.padEnd(24)} ${String(v).padStart(5)}  ${String(cuota).padStart(5)} % de los sin tema`);
    }

    console.log('\n  2. DE QUÉ MEDIOS VIENEN  (top 15, y su cuota del propio medio)');
    console.log('  ' + '─'.repeat(66));
    const { rows: totalPorMedio } = await query(
        `SELECT source_id, count(*)::int AS n FROM articles GROUP BY source_id`
    );
    const totPorMedio = new Map(
        totalPorMedio.map((r) => [nombrePorMedio.get(r.source_id) ?? r.source_id ?? '(?)', r.n])
    );
    const top = [...porMedio.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
    for (const [medio, n] of top) {
        const t = totPorMedio.get(medio) ?? n;
        const cuota = ((n / t) * 100).toFixed(0);
        console.log(`    ${medio.padEnd(24)} ${String(n).padStart(5)} de ${String(t).padStart(5)}  (${String(cuota).padStart(3)} % de lo suyo)`);
    }

    console.log('\n  3. PALABRAS FRECUENTES EN SUS TITULARES  (candidatas a término)');
    console.log('  ' + '─'.repeat(66));
    const topPal = [...palabras.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
    for (let i = 0; i < topPal.length; i += 4) {
        console.log(
            '    ' +
                topPal
                    .slice(i, i + 4)
                    .map(([w, n]) => `${w} ${n}`.padEnd(24))
                    .join('')
        );
    }

    console.log('\n  4. MUESTRA DE TITULARES CON CERO SEÑAL');
    console.log('  ' + '─'.repeat(66));
    for (const h of muestras) console.log(`    · ${(h ?? '').slice(0, 96)}`);

    console.log('\n  Solo lectura: no se escribió nada.\n');
}

try {
    await main();
} finally {
    await closePool();
}
