/**
 * GRAFO DE CO-COBERTURA — análisis exploratorio para F1-12 y F1-13.
 *
 *   npm run analyze:cocoverage
 *
 * QUÉ PREGUNTA RESPONDE
 * ---------------------
 * ¿El ecosistema mediático colombiano se parte en bloques, y por dónde?
 *
 * Y sobre todo: responderlo SIN que nadie declare el sesgo de nadie. La única
 * entrada es qué medios cubrieron los mismos hechos. Si hay bloques, emergen
 * solos; si no los hay, eso también es un hallazgo, y contradiría un supuesto
 * central del producto.
 *
 * POR QUÉ ESTE CAMINO Y NO PROMEDIAR TITULARES
 * --------------------------------------------
 * Deducir el sesgo de un medio promediando la carga de sus titulares es
 * circular: el léxico de shared/headlineTone.js lo escribimos nosotros, así que
 * el resultado hereda nuestras suposiciones y las disfraza de medición. La
 * co-cobertura no: "estos dos medios publicaron sobre el mismo hecho" es un
 * dato observable que no depende de la opinión política de nadie.
 *
 * LO QUE ESTE ANÁLISIS *NO* PUEDE DECIR
 * -------------------------------------
 * Si aparecen bloques, el grafo dice QUÉ medios van juntos. NO dice cuál es de
 * izquierda y cuál de derecha: eso sigue siendo interpretación, y ponerle
 * etiqueta al bloque es volver al punto de partida. Lo que aporta es que el
 * AGRUPAMIENTO deje de ser una opinión.
 *
 * SESGO CONOCIDO DE LA MEDICIÓN
 * -----------------------------
 * Se calcula sobre las historias que produce shared/clustering.js, y sabemos
 * que parte hechos: "De la Espriella nombra…" y "De la Espriella designó…"
 * quedaron como dos historias de 7 medios cada una en vez de una de 14. Cada
 * hecho partido son medios que SÍ coincidieron y aquí aparecen como que no.
 * Esta medición SUBESTIMA la co-cobertura, sistemáticamente y en una dirección
 * conocida. Arreglar F1-05 cambiaría los números hacia arriba.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { checkConnection, query, closePool } = await import('../server/db/pool.js');

/** Mínimo de historias compartidas para que un par no sea ruido. */
const MIN_SHARED = 2;

const status = await checkConnection();

if (!status.enabled) {
    console.error(`\n  ✗ Sin base de datos: ${status.reason}\n`);
    process.exitCode = 1;
    await closePool();
    process.exit();
}

// ---------------------------------------------------------------------------
// Datos: qué medio cubrió qué historia
// ---------------------------------------------------------------------------

const { rows } = await query(`
    SELECT sa.story_id, a.source_id, s.name, s.bias
      FROM story_articles sa
      JOIN articles a ON a.id = sa.article_id
      JOIN sources  s ON s.id = a.source_id
     GROUP BY sa.story_id, a.source_id, s.name, s.bias
`);

/** @type {Map<string, Set<string>>} medio → historias que cubrió */
const storiesByOutlet = new Map();
/** @type {Map<string, Set<string>>} historia → medios que la cubrieron */
const outletsByStory = new Map();
const outletName = new Map();
const outletBias = new Map();

for (const row of rows) {
    if (!storiesByOutlet.has(row.source_id)) storiesByOutlet.set(row.source_id, new Set());
    if (!outletsByStory.has(row.story_id)) outletsByStory.set(row.story_id, new Set());

    storiesByOutlet.get(row.source_id).add(row.story_id);
    outletsByStory.get(row.story_id).add(row.source_id);
    outletName.set(row.source_id, row.name);
    outletBias.set(row.source_id, row.bias);
}

const outlets = [...storiesByOutlet.keys()];
const multiSource = [...outletsByStory.values()].filter((set) => set.size > 1);

console.log('\n  GRAFO DE CO-COBERTURA — DobleFoco\n');
console.log(`  Historias analizadas ....... ${outletsByStory.size}`);
console.log(`  Multifuente (≥2 medios) .... ${multiSource.length}`);
console.log(`  Medios con cobertura ....... ${outlets.length}`);

// ---------------------------------------------------------------------------
// 1. Suficiencia de datos
//
// Se comprueba ANTES de calcular nada. Un grafo sobre datos insuficientes
// produce bloques igualmente —siempre se puede partir un conjunto en dos— y
// esos bloques serían ruido con aspecto de hallazgo.
// ---------------------------------------------------------------------------

const pairCount = new Map();
const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

for (const set of multiSource) {
    const list = [...set];
    for (let i = 0; i < list.length; i += 1) {
        for (let j = i + 1; j < list.length; j += 1) {
            const k = key(list[i], list[j]);
            pairCount.set(k, (pairCount.get(k) ?? 0) + 1);
        }
    }
}

const possiblePairs = (outlets.length * (outlets.length - 1)) / 2;
const observedPairs = pairCount.size;
const solidPairs = [...pairCount.values()].filter((n) => n >= MIN_SHARED).length;
const density = possiblePairs ? observedPairs / possiblePairs : 0;

console.log(`\n  Pares de medios posibles ... ${possiblePairs}`);
console.log(`  Pares que coinciden ≥1 vez . ${observedPairs} (${(density * 100).toFixed(1)} % de densidad)`);
console.log(`  Pares que coinciden ≥${MIN_SHARED} veces  ${solidPairs}`);

const suficiente = density >= 0.25 && solidPairs >= outlets.length;

console.log(
    suficiente
        ? '\n  → Datos suficientes para intentar una partición.'
        : '\n  → DATOS INSUFICIENTES para afirmar bloques. Se muestran los pares\n' +
          '    observados como material en bruto, pero cualquier partición sobre\n' +
          '    esta densidad sería ruido con aspecto de hallazgo.'
);

// ---------------------------------------------------------------------------
// 2. Pares que más coinciden
// ---------------------------------------------------------------------------

/**
 * Elevación (lift): coincidencias observadas dividido por las esperables si
 * los dos medios eligieran qué cubrir de forma independiente.
 *
 *   esperadas = (historias de A × historias de B) / total de historias
 *
 * Sin esto el ranking mide VOLUMEN, no coincidencia. La primera versión de
 * este script lo demostró sin querer: el par más frecuente era Semana con todo
 * el mundo, simplemente porque Semana publica mucho, y colocaba juntos a El
 * Espectador y Semana —polos opuestos del catálogo— como si fueran afines.
 *
 * lift > 1 → coinciden más de lo que el azar explicaría
 * lift ≈ 1 → coinciden lo esperable: no dice nada
 */
const totalStories = outletsByStory.size;

function lift(a, b, observed) {
    const expected = (storiesByOutlet.get(a).size * storiesByOutlet.get(b).size) / totalStories;
    return expected > 0 ? observed / expected : 0;
}

const scoredPairs = [...pairCount.entries()]
    .filter(([, n]) => n >= MIN_SHARED)
    .map(([pair, n]) => {
        const [a, b] = pair.split('|');
        return { a, b, n, lift: lift(a, b, n) };
    })
    .sort((x, y) => y.lift - x.lift);

if (scoredPairs.length) {
    console.log('\n  PARES QUE COINCIDEN MÁS DE LO ESPERABLE (ordenado por elevación)\n');
    console.log('    lift  común  medios (sesgo declarado)');

    for (const p of scoredPairs.slice(0, 20)) {
        // El sesgo declarado se imprime SOLO para contrastar, nunca como
        // entrada del cálculo: si dos medios que el catálogo sitúa en polos
        // opuestos coinciden mucho más de lo esperable, o el catálogo está mal
        // o la coincidencia no significa afinidad ideológica.
        const ba = outletBias.get(p.a)?.toFixed(2) ?? '?';
        const bb = outletBias.get(p.b)?.toFixed(2) ?? '?';
        console.log(
            `    ${p.lift.toFixed(1).padStart(4)}  ${String(p.n).padStart(5)}  ` +
            `${outletName.get(p.a)} (${ba})  ·  ${outletName.get(p.b)} (${bb})`
        );
    }

    console.log(
        '\n    Una elevación alta significa que esos dos medios cubren los mismos\n' +
        '    hechos MÁS de lo que su volumen explicaría. Es lo más cercano a una\n' +
        '    señal de agenda compartida que dan estos datos.'
    );
}

// ---------------------------------------------------------------------------
// 3. Aislamiento: quién nunca coincide con nadie
//
// Un medio que publica mucho y nunca coincide es la señal más fuerte de este
// análisis. Puede significar que cubre una agenda propia —el caso interesante—
// o que el agrupamiento no está reconociendo sus titulares, que es un defecto
// nuestro y no un hallazgo sobre el medio.
// ---------------------------------------------------------------------------

const partners = new Map(outlets.map((o) => [o, new Set()]));
for (const [pair] of pairCount) {
    const [a, b] = pair.split('|');
    partners.get(a)?.add(b);
    partners.get(b)?.add(a);
}

const isolation = outlets
    .map((id) => ({
        id,
        name: outletName.get(id),
        bias: outletBias.get(id),
        stories: storiesByOutlet.get(id).size,
        partners: partners.get(id).size,
    }))
    .sort((a, b) => a.partners - b.partners || b.stories - a.stories);

console.log('\n  AISLAMIENTO — medios ordenados por cuántos socios de cobertura tienen\n');
console.log('    socios  historias  sesgo   medio');
for (const o of isolation) {
    const marca = o.partners === 0 && o.stories >= 20 ? '  ←' : '';
    console.log(
        `    ${String(o.partners).padStart(6)}  ${String(o.stories).padStart(9)}  ` +
        `${(o.bias ?? 0).toFixed(2).padStart(5)}   ${o.name}${marca}`
    );
}

const aislados = isolation.filter((o) => o.partners === 0 && o.stories >= 20);
if (aislados.length) {
    console.log(
        `\n    Los marcados con ← publican bastante y NUNCA coinciden con nadie.\n` +
        `    Antes de concluir nada sobre su agenda hay que descartar que sea el\n` +
        `    agrupamiento el que no reconoce sus titulares (F1-05).`
    );
}

// ---------------------------------------------------------------------------
// 4. Partición, solo si los datos dan
// ---------------------------------------------------------------------------

if (suficiente) {
    // Similitud de Jaccard sobre los conjuntos de historias.
    const similarity = (a, b) => {
        const A = storiesByOutlet.get(a);
        const B = storiesByOutlet.get(b);
        let shared = 0;
        for (const s of A) if (B.has(s)) shared += 1;
        const union = A.size + B.size - shared;
        return union ? shared / union : 0;
    };

    // Aglomerativo con enlace promedio. Sin dependencias: son 40 nodos.
    let clusters = outlets.map((o) => [o]);

    const linkage = (c1, c2) => {
        let sum = 0;
        for (const a of c1) for (const b of c2) sum += similarity(a, b);
        return sum / (c1.length * c2.length);
    };

    while (clusters.length > 2) {
        let best = null;
        let bestScore = -1;

        for (let i = 0; i < clusters.length; i += 1) {
            for (let j = i + 1; j < clusters.length; j += 1) {
                const score = linkage(clusters[i], clusters[j]);
                if (score > bestScore) {
                    bestScore = score;
                    best = [i, j];
                }
            }
        }

        if (!best || bestScore <= 0) break;
        const [i, j] = best;
        clusters = clusters.filter((_, idx) => idx !== i && idx !== j).concat([[...clusters[i], ...clusters[j]]]);
    }

    console.log('\n  PARTICIÓN EMPÍRICA (sin usar el sesgo declarado)\n');
    clusters.forEach((cluster, index) => {
        const biases = cluster.map((o) => outletBias.get(o) ?? 0);
        const media = biases.reduce((a, b) => a + b, 0) / biases.length;
        console.log(`    Bloque ${index + 1} — ${cluster.length} medios · sesgo declarado medio ${media.toFixed(2)}`);
        for (const o of cluster) console.log(`        ${outletName.get(o)}`);
        console.log('');
    });

    console.log(
        '    El "sesgo declarado medio" NO entró en el cálculo: se imprime para\n' +
        '    contrastar. Si los bloques empíricos coinciden con el catálogo, el\n' +
        '    catálogo tiene respaldo. Si no coinciden, uno de los dos está mal y\n' +
        '    hay que averiguar cuál.'
    );
}

console.log(
    '\n  RECORDATORIO: esta medición subestima la co-cobertura. Se calcula sobre\n' +
    '  las historias que produce el agrupamiento, y sabemos que parte hechos\n' +
    '  (F1-05). Cada hecho partido son medios que sí coincidieron y aquí no\n' +
    '  aparecen juntos.\n'
);

await closePool();
