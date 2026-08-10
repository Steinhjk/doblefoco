/**
 * COSECHA DE CANDIDATOS — la primera mitad del barrido nacional.
 *
 *     npm run medios:cosechar            → imprime el informe
 *     npm run medios:cosechar -- --lista → solo los dominios, para encadenar:
 *
 *     npm run medios:cosechar -- --lista > /tmp/d.txt
 *     npm run feed:descubrir -- /tmp/d.txt
 *
 * QUÉ HACE: reúne medios colombianos de fuentes estructuradas, les saca el
 * dominio y descarta los que ya están en el catálogo. Lo que NO hace es
 * decidir si sirven: eso lo dice `descubrirFeed.mjs` probando la red, y
 * después una ficha de propiedad.
 *
 * ── LAS FUENTES, Y POR QUÉ ESTAS ────────────────────────────────────────────
 *
 * · **Wikidata por SPARQL.** Es la buena: sabe de los 33 departamentos, guarda
 *   el sitio web oficial (P856) y se consulta con una sola pregunta.
 * · **API de MediaWiki** para el árbol de categorías por departamento, que da
 *   algo que Wikidata casi nunca tiene relleno: en qué departamento está el
 *   medio.
 *
 * NO se usa prensaescrita.com, que tiene el mejor listado de prensa regional
 * colombiana por ciudad. Devuelve **403 a nuestro bot y 200 a un navegador**:
 * es un bloqueo deliberado y se respeta. Cambiar el User-Agent para saltarlo
 * contradiría lo que el motor declara de sí mismo —«si nos bloquean, que sepan
 * a quién»— y sería incoherente con lo que hacemos cuando nos bloquea un medio,
 * que es escribirle. Si algún día hace falta ese listado, se pide permiso.
 *
 * La FLIP publica «Cartografías de la Información», que mapea los medios de 141
 * municipios y es la mejor fuente que existe para lo regional. Su web devolvía
 * 502 el 2026-08-09. Queda pendiente y merece un intento.
 *
 * ── LO QUE ESTE BARRIDO DEMOSTRÓ, Y NO ES LO QUE SE BUSCABA ─────────────────
 *
 * De 468 medios colombianos en Wikidata, **19 tienen departamento**. El árbol
 * de Wikipedia cubre **15 de los 33**. Casi todo lo que sale es de Bogotá,
 * Medellín y Cali.
 *
 * Es decir: **la prensa regional colombiana no está en las bases de datos
 * estructuradas**. El hueco del mapa departamental no es solo de nuestro
 * catálogo; es de todo el registro público. Buscar medio por medio, a mano y
 * por departamento, no fue una torpeza del método: es que no hay atajo.
 */

import fs from 'node:fs';
import { MEDIA_REGISTRY } from '../shared/mediaRegistry.js';

const UA = 'DobleFocoBot/1.0 (+https://doblefoco.co/transparencia; agregador de cobertura periodística)';
const SOLO_LISTA = process.argv.includes('--lista');

const decir = (...a) => { if (!SOLO_LISTA) console.log(...a); };

async function json(url, cabeceras = {}) {
    const r = await fetch(url, { headers: { 'User-Agent': UA, ...cabeceras } });
    if (!r.ok) throw new Error(`${r.status} en ${url}`);
    return r.json();
}

const dominioDe = (web) => {
    try { return new URL(web).hostname.replace(/^www\./, ''); } catch { return null; }
};

// ── 1. Wikidata ──────────────────────────────────────────────────────────────

/**
 * `Q1002697` (publicación periódica) arrastra los journals universitarios
 * colombianos —un centenar largo— porque técnicamente lo son. Se filtran
 * después por dominio y por nombre; quitar el tipo dejaría fuera revistas de
 * información general que sí interesan.
 */
const SPARQL = `
SELECT DISTINCT ?item ?itemLabel ?web ?lugarLabel WHERE {
  VALUES ?tipo {
    wd:Q11032 wd:Q1002697 wd:Q1616075 wd:Q15265344 wd:Q17232649 wd:Q1110794 wd:Q11033
  }
  ?item wdt:P31/wdt:P279* ?tipo .
  ?item wdt:P17 wd:Q739 .
  OPTIONAL { ?item wdt:P856 ?web . }
  OPTIONAL { ?item wdt:P131 ?lugar . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
}
LIMIT 2000`;

const ES_ACADEMICO = /\.edu(\.co)?$|revistas?\.|journals?\.|elsevier|scielo|redalyc|openedition|dialnet|latindex|banrepcultural/i;
const NOMBRE_ACADEMICO = /^(revista|anuario|bolet[ií]n|estudios|cuadernos|acta|archivos|papeles|memorias)\b|revista de|journal/i;
const NO_ES_MEDIO = /facebook|twitter|instagram|youtube|blogspot|wordpress\.com|wikipedia/i;

decir('· preguntando a Wikidata…');
const sparql = await json(
    'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(SPARQL),
    { Accept: 'application/sparql-results+json' }
);

/** @type {Map<string, {nombre: string, dominio: string, lugar: string|null, fuente: string}>} */
const cosecha = new Map();

for (const fila of sparql.results.bindings) {
    const nombre = fila.itemLabel?.value;
    const dominio = fila.web?.value ? dominioDe(fila.web.value) : null;
    if (!nombre || !dominio || /^Q\d+$/.test(nombre)) continue;
    if (!cosecha.has(dominio)) {
        cosecha.set(dominio, { nombre, dominio, lugar: fila.lugarLabel?.value ?? null, fuente: 'wikidata' });
    }
}
decir(`  ${cosecha.size} medios con sitio web oficial`);

// ── 2. Categorías por departamento en Wikipedia ──────────────────────────────

const API = 'https://es.wikipedia.org/w/api.php';

async function miembros(categoria, tipo) {
    const j = await json(
        `${API}?action=query&list=categorymembers&cmtitle=${encodeURIComponent(categoria)}`
        + `&cmlimit=500&cmtype=${tipo}&format=json`
    );
    return (j.query?.categorymembers ?? []).map((m) => m.title);
}

const EQUIVALENCIAS = {
    'Bogotá': 'Bogotá D.C.',
    'San Andrés y Providencia': 'Archipiélago de San Andrés',
};

decir('· recorriendo el árbol de categorías…');
const subcats = await miembros('Categoría:Medios de comunicación de Colombia por departamento', 'subcat');
decir(`  ${subcats.length} de los 33 departamentos tienen categoría propia`);

/** @type {Map<string, string>} título de artículo → departamento */
const deptoPorArticulo = new Map();

for (const sub of subcats) {
    const bruto = sub.replace(/^Categoría:Medios de comunicación de[l]? /, '').replace(/\s*\(Colombia\)$/, '').trim();
    const depto = EQUIVALENCIAS[bruto] ?? bruto;
    for (const p of await miembros(sub, 'page')) deptoPorArticulo.set(p, depto);
    for (const nieta of await miembros(sub, 'subcat')) {
        for (const p of await miembros(nieta, 'page')) if (!deptoPorArticulo.has(p)) deptoPorArticulo.set(p, depto);
    }
}
decir(`  ${deptoPorArticulo.size} artículos con departamento`);

// El sitio oficial de esos artículos, para poder cruzarlo con la cosecha.
const titulos = [...deptoPorArticulo.keys()].filter((t) => !t.startsWith('Anexo:'));

for (let i = 0; i < titulos.length; i += 40) {
    const lote = titulos.slice(i, i + 40);
    const pags = await json(
        `${API}?action=query&prop=pageprops&ppprop=wikibase_item&titles=${encodeURIComponent(lote.join('|'))}&format=json`
    );
    const qids = Object.values(pags.query?.pages ?? {})
        .map((p) => ({ titulo: p.title, qid: p.pageprops?.wikibase_item }))
        .filter((x) => x.qid);
    if (!qids.length) continue;

    const wd = await json(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qids.map((q) => q.qid).join('|')}&props=claims&format=json`
    );

    for (const { titulo, qid } of qids) {
        const web = wd.entities?.[qid]?.claims?.P856?.[0]?.mainsnak?.datavalue?.value;
        const dominio = web ? dominioDe(web) : null;
        if (!dominio) continue;
        const depto = deptoPorArticulo.get(titulo) ?? null;
        const previo = cosecha.get(dominio);
        if (previo) previo.lugar = previo.lugar ?? depto;
        else cosecha.set(dominio, { nombre: titulo, dominio, lugar: depto, fuente: 'wikipedia' });
    }
}

// ── 3. Filtrar y restar lo que ya tenemos ───────────────────────────────────

const enCatalogo = new Set(MEDIA_REGISTRY.map((m) => m.domain.replace(/^www\./, '')));

const candidatos = [...cosecha.values()].filter((m) =>
    !enCatalogo.has(m.dominio)
    && !ES_ACADEMICO.test(m.dominio)
    && !NOMBRE_ACADEMICO.test(m.nombre)
    && !NO_ES_MEDIO.test(m.dominio)
);

if (SOLO_LISTA) {
    console.log(candidatos.map((m) => m.dominio).join('\n'));
} else {
    console.log(`\n${cosecha.size} cosechados · ${candidatos.length} candidatos nuevos tras descartar catálogo y revistas académicas\n`);

    const conDepto = candidatos.filter((m) => m.lugar);
    console.log(`Con departamento o ciudad: ${conDepto.length}. Sin él: ${candidatos.length - conDepto.length}.`);
    console.log('Esa proporción ES el hallazgo: la prensa regional no está en las bases estructuradas.\n');

    for (const m of candidatos) {
        console.log(`  ${m.dominio.padEnd(34)} ${(m.lugar ?? '—').padEnd(22)} ${m.nombre}`);
    }
    console.log('\nSiguiente paso:  npm run medios:cosechar -- --lista > d.txt  &&  npm run feed:descubrir -- d.txt');
}

if (!SOLO_LISTA && process.argv.includes('--json')) {
    fs.writeFileSync('candidatos.json', JSON.stringify(candidatos, null, 1));
    console.log('→ candidatos.json');
}
