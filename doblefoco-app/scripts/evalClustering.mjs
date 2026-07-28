/**
 * EVALUACIÓN DEL AGRUPAMIENTO — tarea F1-05.
 *
 *   npm run eval:clustering
 *
 * Mide Jaccard (lo que hay hoy) contra TF-IDF + coseno sobre el conjunto de
 * prueba etiquetado a mano de shared/fixtures/clusteringPairs.js, y barre el
 * umbral de los dos para encontrar su mejor punto.
 *
 * LOS DOS ERRORES NO CUESTAN LO MISMO, y el informe lo refleja:
 *
 *   FUSIÓN INCORRECTA (falso positivo) — juntar dos hechos distintos. Inventa
 *   una cobertura que no existe: la historia aparece con más medios de los que
 *   realmente la cubrieron, y sobre esa cifra inflada se calcula después si hay
 *   un punto ciego. Es el error grave.
 *
 *   SEPARACIÓN INCORRECTA (falso negativo) — dejar separado un mismo hecho. Se
 *   pierde una comparación de encuadres. Es una oportunidad perdida, no una
 *   afirmación falsa.
 *
 * Por eso el criterio de adopción del ROADMAP no es "mejor F1" sino "no
 * aumentar las fusiones incorrectas". Un método con más aciertos totales pero
 * más fusiones NO se adopta.
 *
 * El IDF se calcula sobre el corpus real de la base cuando está disponible: es
 * el mismo escenario en el que va a operar. Sin base, cae al propio conjunto de
 * prueba y lo advierte, porque un IDF sobre 144 titulares no dice lo mismo.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { CLUSTERING_PAIRS } = await import('../shared/fixtures/clusteringPairs.js');
const { tokenize, similarity, cosineSimilarity, buildIdf, MIN_SHARED_TOKENS, SIMILARITY_THRESHOLD } =
    await import('../shared/clustering.js');

// ---------------------------------------------------------------------------
// Corpus para el IDF
// ---------------------------------------------------------------------------

let corpus = [];
let corpusOrigen = 'conjunto de prueba';

try {
    const { checkConnection, query, closePool } = await import('../server/db/pool.js');
    const status = await checkConnection();

    if (status.enabled) {
        const { rows } = await query('SELECT headline FROM articles');
        corpus = rows.map((r) => tokenize(r.headline));
        corpusOrigen = `corpus real (${rows.length} titulares)`;
    }
    await closePool();
} catch {
    // Sin base se sigue: el informe advierte que el IDF es más pobre.
}

if (!corpus.length) {
    corpus = CLUSTERING_PAIRS.flatMap((p) => [tokenize(p.a), tokenize(p.b)]);
}

const idf = buildIdf(corpus);

// ---------------------------------------------------------------------------
// Métricas
// ---------------------------------------------------------------------------

const pairs = CLUSTERING_PAIRS.map((p) => ({
    ...p,
    tokensA: tokenize(p.a),
    tokensB: tokenize(p.b),
}));

/** @param {(p:object)=>{score:number, shared:number}} scorer */
function evaluate(scorer, threshold) {
    let tp = 0;   // agrupadas y era el mismo hecho
    let fp = 0;   // agrupadas y NO era el mismo hecho  ← el error grave
    let fn = 0;   // separadas y sí era el mismo hecho
    let tn = 0;

    const merges = [];

    for (const p of pairs) {
        const { score, shared } = scorer(p);
        const agrupa = shared >= MIN_SHARED_TOKENS && score >= threshold;

        if (agrupa && p.mismoHecho) tp += 1;
        else if (agrupa && !p.mismoHecho) { fp += 1; merges.push(p); }
        else if (!agrupa && p.mismoHecho) fn += 1;
        else tn += 1;
    }

    const precision = tp + fp ? tp / (tp + fp) : 1;
    const recall = tp + fn ? tp / (tp + fn) : 1;
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;

    return { threshold, tp, fp, fn, tn, precision, recall, f1, merges };
}

const jaccard = (p) => similarity(p.tokensA, p.tokensB);
const cosine = (p) => cosineSimilarity(p.tokensA, p.tokensB, idf);

// ---------------------------------------------------------------------------

console.log('\n  EVALUACIÓN DEL AGRUPAMIENTO — F1-05\n');
console.log(`  Pares etiquetados: ${pairs.length} · ${pairs.filter((p) => p.mismoHecho).length} mismo hecho · ${pairs.filter((p) => !p.mismoHecho).length} distintos`);
console.log(`  IDF calculado sobre: ${corpusOrigen}`);
if (corpusOrigen === 'conjunto de prueba') {
    console.log('  ⚠ Sin base de datos: el IDF se calculó sobre 144 titulares y no');
    console.log('    representa el escenario real. Los números de coseno son orientativos.');
}

function tabla(nombre, scorer, umbrales) {
    console.log(`\n  ${nombre}`);
    console.log('    umbral   fusiones✗   separaciones✗   precisión   exhaust.   F1');

    const filas = umbrales.map((t) => evaluate(scorer, t));
    for (const r of filas) {
        console.log(
            `     ${r.threshold.toFixed(2)}   ` +
            `${String(r.fp).padStart(8)}   ${String(r.fn).padStart(13)}   ` +
            `${(r.precision * 100).toFixed(1).padStart(8)}%   ${(r.recall * 100).toFixed(1).padStart(7)}%   ${r.f1.toFixed(3)}`
        );
    }
    return filas;
}

const umbralesJ = [0.25, 0.28, 0.30, 0.32, 0.34, 0.38, 0.42];
const umbralesC = [0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65];

const filasJ = tabla('JACCARD (actual)', jaccard, umbralesJ);
const filasC = tabla('TF-IDF + COSENO', cosine, umbralesC);

// ---------------------------------------------------------------------------
// Comparación bajo el criterio del ROADMAP
// ---------------------------------------------------------------------------

const base = filasJ.find((r) => Math.abs(r.threshold - SIMILARITY_THRESHOLD) < 1e-9) ?? filasJ[0];

console.log('\n  ─────────────────────────────────────────────────────────────');
console.log(`  LÍNEA BASE — Jaccard a ${base.threshold.toFixed(2)} (lo que corre hoy)`);
console.log(`    fusiones incorrectas: ${base.fp} · separaciones incorrectas: ${base.fn}`);
console.log(`    precisión ${(base.precision * 100).toFixed(1)} % · exhaustividad ${(base.recall * 100).toFixed(1)} %`);

// Criterio de adopción: NO aumentar las fusiones. Entre los que cumplen, el de
// mayor exhaustividad; a igualdad, el umbral más alto (más conservador).
const admisibles = filasC.filter((r) => r.fp <= base.fp);
const mejor = admisibles.sort((a, b) => b.recall - a.recall || b.threshold - a.threshold)[0];

if (!mejor) {
    console.log('\n  TF-IDF NO CUMPLE EL CRITERIO en ningún umbral probado: todos');
    console.log(`  producen más de ${base.fp} fusiones incorrectas. No se adopta.`);
} else {
    console.log(`\n  MEJOR TF-IDF QUE CUMPLE EL CRITERIO — umbral ${mejor.threshold.toFixed(2)}`);
    console.log(`    fusiones incorrectas: ${mejor.fp} (base: ${base.fp})`);
    console.log(`    separaciones incorrectas: ${mejor.fn} (base: ${base.fn})`);
    console.log(`    precisión ${(mejor.precision * 100).toFixed(1)} % · exhaustividad ${(mejor.recall * 100).toFixed(1)} %`);

    const rescatadas = base.fn - mejor.fn;
    console.log(
        rescatadas > 0
            ? `\n  → Recupera ${rescatadas} hechos que hoy se parten, sin fusionar de más.`
            : '\n  → No recupera separaciones respecto a la base. No hay razón para cambiar.'
    );

    if (mejor.merges.length) {
        console.log('\n  Fusiones incorrectas que seguiría cometiendo:');
        for (const m of mejor.merges) {
            console.log(`    · ${m.a.slice(0, 62)}`);
            console.log(`      ${m.b.slice(0, 62)}`);
        }
    }
}

console.log('');
