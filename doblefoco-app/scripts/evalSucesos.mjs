/**
 * EVALUACIÓN DE LA CAPA DE SUCESO.
 *
 *   npm run eval:sucesos
 *
 * Barre el umbral y el mínimo de tokens sobre las historias reales de la base, y
 * vuelca las agrupaciones para que se revisen A OJO. No hay conjunto etiquetado
 * y no se finge que lo haya: si dos titulares forman un suceso o no es un juicio
 * editorial, y el informe existe para que alguien lo firme, no para dar un F1.
 *
 * LOS DOS ERRORES NO CUESTAN LO MISMO, igual que en `evalClustering.mjs`, pero
 * aquí el reparto cambia:
 *
 *   FUSIÓN INCORRECTA — presentar dos hechos distintos como el mismo suceso.
 *   Sigue siendo el error grave: es visible en portada y es una afirmación
 *   falsa. Lo que NO hace, a diferencia de la capa de abajo, es inflar el
 *   recuento de medios de una historia: cada historia conserva el suyo.
 *
 *   SEPARACIÓN INCORRECTA — dejar dos ángulos del mismo suceso en dos entradas.
 *   Es el estado anterior a que esta capa existiera. Se pierde tamaño, no se
 *   afirma nada falso.
 *
 * Por eso el criterio es el mismo: no adoptar un ajuste que aumente las
 * fusiones, aunque agrupe más.
 *
 * EL VOCABULARIO PESA MÁS QUE EL UMBRAL, y el informe lo enseña en dos columnas.
 * Con el IDF de una página de cien historias, seis de diecinueve agrupaciones
 * eran falsas; con el IDF del corpus completo desaparecen sin tocar el umbral.
 * Es la misma advertencia que ya llevaba `evalClustering.mjs` —«un IDF sobre 144
 * titulares no dice lo mismo»— ahora con la medida al lado.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { agruparEnSucesos, porRelevanciaDeSuceso, UMBRAL_SUCESO, MIN_TOKENS_SUCESO } =
    await import('../shared/sucesos.js');

// ---------------------------------------------------------------------------
// Corpus
// ---------------------------------------------------------------------------

let historias = [];
let vocabulario = [];

try {
    const { checkConnection, query, closePool } = await import('../server/db/pool.js');
    const status = await checkConnection();

    if (status.enabled) {
        // Vocabulario: TODO lo que la base conozca. Es lo que se quiere medir.
        const todos = await query('SELECT title FROM stories WHERE title IS NOT NULL');
        vocabulario = todos.rows.map((r) => r.title);

        /*
         * Historias a agrupar: las más cubiertas de las últimas 72 h, que es la
         * escala a la que opera la portada. No todo el corpus: agrupar miles
         * daría un informe que nadie puede revisar a ojo, y revisarlo a ojo es
         * justo para lo que existe este script. El vocabulario sí es completo.
         */
        const cuantas = Number(process.env.HISTORIAS ?? 100);
        const recientes = await query(`
            SELECT s.id, s.title, s.published_at,
                   array_agg(DISTINCT src.name) AS medios,
                   count(DISTINCT a.id)::int    AS articulos
              FROM stories s
              JOIN story_articles sa ON sa.story_id = s.id
              JOIN articles a        ON a.id = sa.article_id
              JOIN sources src       ON src.id = a.source_id
             WHERE s.published_at > now() - interval '72 hours'
             GROUP BY s.id
             ORDER BY count(DISTINCT a.source_id) DESC, s.published_at DESC
             LIMIT $1`, [cuantas]);

        historias = recientes.rows.map((r) => ({
            id: r.id,
            title: r.title,
            publishedAt: r.published_at,
            articleCount: r.articulos,
            sources: (r.medios ?? []).filter(Boolean).map((name) => ({ name, bias: 0 })),
        }));
    }
    await closePool();
} catch (error) {
    console.error(`No se pudo leer la base: ${error.message}`);
}

if (!historias.length) {
    console.error('Sin historias que evaluar. Hace falta DATABASE_URL con datos.');
    process.exit(1);
}

console.log(`Historias de las últimas 72 h: ${historias.length}`);
console.log(`Vocabulario del corpus completo: ${vocabulario.length} titulares\n`);

// ---------------------------------------------------------------------------
// Barrido
// ---------------------------------------------------------------------------

const UMBRALES = [0.14, 0.18, 0.22, 0.26, 0.30, 0.34];

console.log('Grupos con más de un ángulo, por umbral:\n');
console.log('  minTok |  ' + UMBRALES.map((u) => u.toFixed(2)).join('   ') + '   vocabulario');

for (const vocab of [null, vocabulario]) {
    for (const minTokens of [2, 3, 4]) {
        const celdas = UMBRALES.map((umbral) => {
            const s = agruparEnSucesos(historias, { umbral, minTokens, vocabulario: vocab });
            return String(s.filter((x) => x.angulos > 1).length).padStart(4);
        });
        const origen = vocab ? `corpus (${vocabulario.length})` : `página (${historias.length})`;
        console.log(`     ${minTokens}   |${celdas.join('  ')}   ${origen}`);
    }
}

// ---------------------------------------------------------------------------
// Volcado para revisión a ojo
// ---------------------------------------------------------------------------

const umbral = Number(process.env.UMBRAL ?? UMBRAL_SUCESO);
const minTokens = Number(process.env.MIN_TOKENS ?? MIN_TOKENS_SUCESO);

console.log(`\n${'='.repeat(78)}`);
console.log(`AGRUPACIONES con umbral ${umbral} y minTokens ${minTokens}, IDF del corpus completo.`);
console.log('Revísalas a ojo: cada bloque debe ser reconocible como UN suceso.');
console.log('='.repeat(78));

const sucesos = agruparEnSucesos(historias, { umbral, minTokens, vocabulario })
    .sort(porRelevanciaDeSuceso());

for (const s of sucesos.filter((x) => x.angulos > 1)) {
    console.log(`\n[${s.medios} medios · ${s.articulos} artículos · ${s.angulos} ángulos]`);
    console.log(`  ${s.titular}`);
    for (const h of s.historias.slice(1)) console.log(`    · ${h.title}`);
}

const solos = sucesos.filter((x) => x.angulos === 1).length;
console.log(`\n${sucesos.length} sucesos en total; ${solos} de un solo ángulo.`);
