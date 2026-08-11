// Fase 2, prueba de viabilidad: ¿cuántos actores con posición externa
// documentada aparecen de verdad en nuestros titulares? Solo lectura.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';
import { CABECERAS } from '../shared/userAgent.js';

const APP = 'C:/Users/geren/OneDrive/Documentos/Proyectos antigravity/doblefoco/doblefoco-app';
const TMP = 'C:/Users/geren/.claude/jobs/ba8780a5/tmp';
dotenv.config({ path: resolve(APP, '.env.local'), quiet: true });

// ── 1. Actores desde Wikidata (cacheado en disco) ───────────────────────────
const CACHE = `${TMP}/wikidata_actores.json`;
let actores;
if (existsSync(CACHE)) {
    actores = JSON.parse(readFileSync(CACHE, 'utf8'));
} else {
    const q = `SELECT ?personaLabel ?partidoLabel WHERE {
      ?persona wdt:P27 wd:Q739 ; wdt:P102 ?partido .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". } }`;
    const r = await fetch(
        `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(q)}`,
        { headers: CABECERAS }
    );
    const j = await r.json();
    actores = j.results.bindings.map((b) => ({
        nombre: b.personaLabel.value, partido: b.partidoLabel.value,
    }));
    writeFileSync(CACHE, JSON.stringify(actores));
}

// ── 2. Posición del partido, desde CHES y V-Party ───────────────────────────
// Emparejamiento a mano entre el nombre de Wikidata y el registro externo.
// A la vista porque es la decisión más discutible.
const POSICION = {
    'Partido Liberal Colombiano':        { ches: 5.93, vparty: -0.28 },
    'Partido Conservador Colombiano':    { ches: 8.43, vparty: 2.36 },
    'Centro Democrático':                { ches: 9.21, vparty: 2.68 },
    'Partido Cambio Radical':            { ches: 7.64, vparty: 1.57 },
    'Partido Social de Unidad Nacional': { ches: 6.50, vparty: 0.58 },
    'Partido de la U':                   { ches: 6.50, vparty: 0.58 },
    'Alianza Verde':                     { ches: 3.86, vparty: -0.64 },
    'Partido Alianza Verde':             { ches: 3.86, vparty: -0.64 },
    'Polo Democrático Alternativo':      { ches: 2.36, vparty: null },
    'MIRA':                              { ches: 9.07, vparty: null },
    'Movimiento MIRA':                   { ches: 9.07, vparty: null },
};

const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Un actor puede tener varios partidos (militancia histórica). Se conserva el
// primero con posición conocida; NO se promedia: promediar partidos de épocas
// distintas produciría una posición que el actor nunca tuvo.
const porNombre = new Map();
for (const a of actores) {
    if (!porNombre.has(a.nombre)) porNombre.set(a.nombre, { nombre: a.nombre, partidos: [] });
    porNombre.get(a.nombre).partidos.push(a.partido);
}
const conPosicion = [...porNombre.values()]
    .map((p) => ({ ...p, pos: p.partidos.map((x) => POSICION[x]).find(Boolean) ?? null }))
    .filter((p) => p.nombre && !/^Q\d+$/.test(p.nombre));

console.log(`\nActores en Wikidata: ${conPosicion.length}`);
console.log(`Con partido de posición conocida: ${conPosicion.filter((p) => p.pos).length}`);

// ── 3. ¿Aparecen en nuestros titulares? ─────────────────────────────────────
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const { rows } = await pool.query(`
    SELECT a.headline, s.name AS medio
      FROM articles a JOIN sources s ON s.id = a.source_id
     WHERE coalesce(a.published_at, a.ingested_at) > now() - interval '72 hours'
`);
console.log(`Titulares analizados: ${rows.length}\n`);

const titulares = rows.map((r) => ({ t: norm(r.headline), medio: r.medio }));
const hallazgos = [];

for (const actor of conPosicion) {
    const n = norm(actor.nombre);
    // Solo nombres de dos o más palabras: un apellido suelto produce falsos
    // positivos en masa («Santos», «Duque», «Barreras» son palabras comunes).
    if (n.split(/\s+/).length < 2) continue;
    let veces = 0;
    const medios = new Set();
    for (const { t, medio } of titulares) {
        if (t.includes(n)) { veces += 1; medios.add(medio); }
    }
    if (veces) hallazgos.push({ ...actor, veces, medios: medios.size });
}

hallazgos.sort((a, b) => b.veces - a.veces);
const conPos = hallazgos.filter((h) => h.pos);

console.log(`Actores detectados en titulares: ${hallazgos.length}`);
console.log(`  · de ellos, CON posición de partido conocida: ${conPos.length}`);
console.log(`  · menciones totales: ${hallazgos.reduce((s, h) => s + h.veces, 0)}`);
console.log(`  · menciones con posición: ${conPos.reduce((s, h) => s + h.veces, 0)}\n`);

console.log('LOS 20 MÁS MENCIONADOS');
console.log('  veces  medios  posición  actor');
for (const h of hallazgos.slice(0, 20)) {
    const p = h.pos ? h.pos.ches.toFixed(1).padStart(8) : '       —';
    console.log(`  ${String(h.veces).padStart(5)}  ${String(h.medios).padStart(6)}${p}  ${h.nombre} ${h.pos ? '' : `(${h.partidos[0] ?? '?'})`}`);
}

await pool.end();
