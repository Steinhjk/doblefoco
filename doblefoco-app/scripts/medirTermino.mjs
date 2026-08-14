/**
 * ¿CUÁNTO RENDIRÍA ESTE TÉRMINO, Y A QUIÉN SE LLEVARÍA POR DELANTE?
 *
 *     npm run medir:termino -- "incendi(o|os|arse)" escombros
 *
 * SOLO LEE. Para cada patrón informa, sobre el corpus real:
 *
 *   · cuántos artículos SIN TEMA lo contienen en el titular — lo que ganaría;
 *   · cuántos artículos YA CLASIFICADOS lo contienen, y en qué temas — que es
 *     la prueba de ambigüedad: si un candidato a «desastres» aparece sobre todo
 *     en piezas ya clasificadas como deportes, el término no es lo que parece;
 *   · una muestra de titulares de cada grupo, para leerlos antes de decidir.
 *
 * POR QUÉ ASÍ. El precedente está escrito en `contentQuality` y en el propio
 * `topicClassifier`: un patrón de lotería descartó «obras de rehabilitación del
 * CDI El Dorado» porque buscaba la subcadena, y «Huracán» es un equipo de fútbol
 * argentino. Añadir vocabulario a ojo es exactamente cómo se cuelan esos fallos,
 * y no se ven hasta que alguien mira la portada. Aquí se ven antes.
 *
 * NO MODIFICA EL LÉXICO. Mide un candidato; meterlo sigue siendo una decisión.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { checkConnection, query, closePool } = await import('../server/db/pool.js');
const { classifyTopics, TEMAS } = await import('../shared/topicClassifier.js');
const { MEDIA_REGISTRY } = await import('../shared/mediaRegistry.js');

const patrones = process.argv.slice(2).filter((a) => !a.startsWith('--'));

if (!patrones.length) {
    console.error('\n  Uso: npm run medir:termino -- "incendi(o|os)" escombros\n');
    process.exit(1);
}

const paisPorMedio = new Map(MEDIA_REGISTRY.map((m) => [m.id, m.country]));
const nombreTema = new Map(TEMAS.map((t) => [t.id, t.nombre]));

const norm = (t) =>
    (t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

async function main() {
    const estado = await checkConnection();
    if (!estado.enabled) {
        console.error(`\n  ✗ No se pudo conectar: ${estado.reason}\n`);
        process.exitCode = 1;
        return;
    }

    console.log(`\n  MEDIDA DE TÉRMINOS CANDIDATOS  (solo lectura)`);
    console.log(`  Conectado a ${estado.database}\n`);

    // Se carga una vez y se reutiliza para todos los patrones.
    const articulos = [];
    let offset = 0;
    for (;;) {
        const { rows } = await query(
            `SELECT a.headline, a.snippet, a.canonical_url, a.source_id
               FROM articles a ORDER BY a.id LIMIT 500 OFFSET $1`,
            [offset]
        );
        if (!rows.length) break;
        for (const f of rows) {
            const r = classifyTopics({
                headline: f.headline,
                snippet: f.snippet ?? '',
                link: f.canonical_url,
                paisDelMedio: paisPorMedio.get(f.source_id) ?? 'CO',
            });
            articulos.push({ h: f.headline ?? '', hn: norm(f.headline), temas: r.temas });
        }
        offset += 500;
    }

    console.log(`  Corpus: ${articulos.length} artículos\n`);

    for (const crudo of patrones) {
        let rx;
        try {
            rx = new RegExp(crudo, 'i');
        } catch (e) {
            console.log(`  ✗ "${crudo}" no es una expresión válida: ${e.message}\n`);
            continue;
        }

        const gana = [];
        const yaClasificados = new Map();
        const muestraYa = new Map();

        for (const a of articulos) {
            if (!rx.test(a.hn)) continue;
            if (a.temas.length === 0) {
                gana.push(a.h);
            } else {
                for (const t of a.temas) {
                    yaClasificados.set(t, (yaClasificados.get(t) ?? 0) + 1);
                    if (!muestraYa.has(t)) muestraYa.set(t, a.h);
                }
            }
        }

        const yaTotal = [...yaClasificados.values()].reduce((s, n) => s + n, 0);

        console.log(`  ── /${crudo}/ ` + '─'.repeat(Math.max(0, 56 - crudo.length)));
        console.log(`     GANARÍA  ${String(gana.length).padStart(5)} artículos hoy sin tema`);
        console.log(`     ya tienen tema  ${String(yaTotal).padStart(5)}  ${
            yaTotal
                ? [...yaClasificados.entries()]
                      .sort((a, b) => b[1] - a[1])
                      .map(([t, n]) => `${nombreTema.get(t) ?? t} ${n}`)
                      .join(' · ')
                : '—'
        }`);

        if (gana.length) {
            console.log('     muestra de lo que ganaría:');
            for (const h of gana.slice(0, 6)) console.log(`       + ${h.slice(0, 88)}`);
        }
        if (muestraYa.size) {
            console.log('     dónde cae ya (una por tema, para ver la ambigüedad):');
            for (const [t, h] of [...muestraYa.entries()].slice(0, 6)) {
                console.log(`       ~ [${(nombreTema.get(t) ?? t).padEnd(12)}] ${h.slice(0, 74)}`);
            }
        }
        console.log('');
    }

    console.log('  Solo lectura: no se escribió nada, ni se tocó el léxico.\n');
}

try {
    await main();
} finally {
    await closePool();
}
