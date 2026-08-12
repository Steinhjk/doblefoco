/**
 * CONDUCTA MEDIDA POR MEDIO — el insumo de nivel 2 de las fichas de orientación.
 *
 *     npm run conducta                  → el tramo prioritario de audiencia
 *     npm run conducta -- --todos       → los 65 medios del catálogo
 *     npm run conducta -- <id> <id>…    → solo esos
 *
 * SOLO LEE. No escribe en la base ni en el registro.
 *
 * QUÉ MIDE, Y QUÉ NO
 * ------------------
 * Tres cifras por medio, las mismas que llevaba a mano la ficha de El Espectador:
 *
 *   · agenda propia   historias suyas en las que es el único medio del catálogo
 *   · compañía media  sesgo medio de los OTROS medios con los que comparte historia
 *   · coincide con    los tres con los que más historias comparte
 *
 * NINGUNA mide el contenido de lo que publica. Miden con quién coincide, que es
 * observable y no depende de que nadie declare el sesgo de nadie — el mismo
 * razonamiento de coCoverage.mjs.
 *
 * POR QUÉ EXISTE COMO SCRIPT Y NO COMO CONSULTA A MANO. Estas cifras acaban
 * copiadas dentro de fichas que alguien va a auditar meses después, y una cifra
 * en un expediente que no se puede recalcular no es evidencia: es una
 * afirmación. Con esto, cualquiera reproduce la medición y ve si cambió.
 *
 * ADVERTENCIA QUE VA CON EL RESULTADO. La ventana de retención son 72 h, así que
 * esto mide tres días, y el protocolo pide 90. Además la compañía media está
 * saturada: si la izquierda es el 22,6 % de los medios y el 3,3 % del volumen,
 * coincidir con el catálogo se parece a coincidir con la derecha para
 * cualquiera. Ver revision-externa/CONDUCTA-MEDIDA.md, que lo explica con los
 * números del 2026-08-12. Usar la compañía media para mover un valor de sesgo es
 * un error, y está escrito allí para que el revisor externo pueda objetarlo.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { checkConnection, query, closePool } = await import('../server/db/pool.js');
const { MEDIA_REGISTRY } = await import('../shared/mediaRegistry.js');
const { tramoPrioritario } = await import('../shared/audiencia.js');

const args = process.argv.slice(2);
const TODOS = args.includes('--todos');
const IDS = args.filter((a) => !a.startsWith('--'));

const sesgo = new Map(MEDIA_REGISTRY.map((m) => [m.id, m.bias]));
const nombre = new Map(MEDIA_REGISTRY.map((m) => [m.id, m.shortName ?? m.name]));

async function main() {
    const estado = await checkConnection();
    if (!estado.enabled) {
        console.error(`\n  ✗ No se pudo conectar: ${estado.reason}\n`);
        process.exitCode = 1;
        return;
    }

    const { rows: ventana } = await query(`
        SELECT min(published_at) AS desde,
               max(published_at) AS hasta,
               count(*)::int     AS articulos
          FROM articles
    `);
    const { desde, hasta, articulos } = ventana[0];

    // Un par (historia, medio) por fila: si un medio publicó tres piezas de la
    // misma historia cuenta una vez, porque lo que se mide es coincidencia de
    // medios y no de artículos.
    const { rows: pares } = await query(`
        SELECT sa.story_id, a.source_id
          FROM story_articles sa
          JOIN articles a ON a.id = sa.article_id
         GROUP BY sa.story_id, a.source_id
    `);

    /** @type {Map<string, Set<string>>} */
    const porHistoria = new Map();
    for (const { story_id, source_id } of pares) {
        if (!porHistoria.has(story_id)) porHistoria.set(story_id, new Set());
        porHistoria.get(story_id).add(source_id);
    }

    const { rows: conteos } = await query(
        'SELECT source_id, count(*)::int AS n FROM articles GROUP BY source_id'
    );
    const porMedio = new Map(conteos.map((r) => [r.source_id, r.n]));

    const objetivo = IDS.length
        ? IDS
        : (TODOS ? MEDIA_REGISTRY.map((m) => m.id) : tramoPrioritario(MEDIA_REGISTRY).map((m) => m.id));

    console.log(`\n  CONDUCTA MEDIDA · ${objetivo.length} medios`);
    console.log(`  Corpus: ${articulos} artículos · ${porHistoria.size} historias`);
    console.log(`  Ventana: ${String(desde).slice(0, 10)} → ${String(hasta).slice(0, 10)} (retención de 72 h)`);
    console.log('  ⚠ Tres días. El protocolo pide 90 y la compañía media está saturada:');
    console.log('    ver revision-externa/CONDUCTA-MEDIDA.md antes de usar estas cifras.\n');

    console.log('  medio                  art.  hist.  propia  multi  compañía  coincide con');
    console.log('  ' + '─'.repeat(96));

    for (const id of objetivo) {
        let historias = 0;
        let solo = 0;
        let suma = 0;
        let apariciones = 0;
        /** @type {Map<string, number>} */
        const conQuien = new Map();

        for (const medios of porHistoria.values()) {
            if (!medios.has(id)) continue;
            historias += 1;
            if (medios.size === 1) { solo += 1; continue; }
            for (const otro of medios) {
                if (otro === id) continue;
                const s = sesgo.get(otro);
                if (typeof s === 'number') { suma += s; apariciones += 1; }
                conQuien.set(otro, (conQuien.get(otro) ?? 0) + 1);
            }
        }

        const propia = historias ? `${Math.round((solo / historias) * 100)} %` : '—';
        const compania = apariciones ? (suma / apariciones).toFixed(3).padStart(6) : '     —';
        const top = [...conQuien.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([k, v]) => `${nombre.get(k) ?? k} ${v}`)
            .join(' · ');

        console.log(
            `  ${String(nombre.get(id) ?? id).padEnd(22)}` +
            `${String(porMedio.get(id) ?? 0).padStart(5)}` +
            `${String(historias).padStart(7)}` +
            `${propia.padStart(8)}` +
            `${String(historias - solo).padStart(7)}` +
            `${compania.padStart(10)}  ${top}`
        );
    }

    console.log('');
}

try {
    await main();
} finally {
    await closePool();
}
