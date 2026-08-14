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
 * TODAVÍA no se usa prensaescrita.com, que tiene el mejor listado de prensa
 * regional colombiana por ciudad — y la razón que estaba escrita aquí era
 * FALSA. Decía: «devuelve 403 a nuestro bot y 200 a un navegador: es un bloqueo
 * deliberado y se respeta». **Nunca nos bloqueó.** El 403 lo causaba nuestro
 * propio User-Agent, que llevaba una tilde —«periodística»— cuando una cabecera
 * HTTP solo admite ASCII, y los cortafuegos lo rechazaban por inválido.
 *
 * Comprobado el 2026-08-12 con el User-Agent ya corregido: **responde 200**,
 * 32 KB de HTML, con Colombia dentro.
 *
 * Así que no hay bloqueo que respetar, y este sigue siendo el mejor listado que
 * existe para el hueco regional. Lo que queda es integrarlo: hay que leer su
 * estructura por ciudad y decidir cómo se cosecha. Es trabajo, no un veto.
 *
 * CÓMO SE COSECHA, ya averiguado a mano el 2026-08-13:
 *
 *   · La ruta es **`/america/colombia.php`** (con `www.`, sin él redirige).
 *   · Es HTML plano, no hay API. Los medios salen como enlaces absolutos, así
 *     que basta extraer los `https?://dominio` del cuerpo y quitar el ruido.
 *   · Rinde **145 dominios**, de los que 109 no estaban en el catálogo y **73
 *     tienen feed fresco**. Compárese con Wikidata el día 12: 40 vivos de 103.
 *     Es la fuente más productiva del proyecto y la única buena para lo regional.
 *
 * AVISO PARA QUIEN LO INTEGRE, porque ya mordió: al filtrar el ruido —prensa
 * deportiva y extranjera— hay que **anclar los patrones al dominio completo**.
 * Un filtro con `as.com` sin anclar se come `sucrenoticias.com`,
 * `quindionoticias.com` y `araucanoticias.com.co` por la subcadena «as.com», y
 * esos eran justo los candidatos de los departamentos que faltaban. Un filtro de
 * ruido mal escrito no falla al azar: se lleva los nombres largos y
 * descriptivos, que en Colombia son los regionales.
 *
 * Resultados completos en `BARRIDO_2026-08-13.md`.
 *
 * Se conserva el párrafo del error a la vista, y no se borra, porque la lección
 * es la que importa: **cuando un servicio ajeno falla solo con nosotros, el
 * primer sospechoso somos nosotros.** La misma semana pasó con los 502 y 504 de
 * Wikidata, que eran nuestra consulta y no su servicio.
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

import { USER_AGENT as UA } from '../shared/userAgent.js';
const SOLO_LISTA = process.argv.includes('--lista');

const decir = (...a) => { if (!SOLO_LISTA) console.log(...a); };

async function json(url, cabeceras = {}) {
    const r = await fetch(url, { headers: { 'User-Agent': UA, ...cabeceras } });
    if (!r.ok) throw new Error(`${r.status} en ${url}`);
    return r.json();
}

/**
 * REINTENTO CON ESPERA, para los 502 y 504 del endpoint de Wikidata.
 *
 * No es tolerancia a fallos por costumbre: es que `query.wikidata.org` es un
 * servicio público con límite de tiempo por consulta y devuelve **504 cuando la
 * consulta tarda demasiado, no cuando está caído**. El barrido del 2026-08-11 se
 * quedó a medias por esto y se anotó como «Wikidata devolvía 502», que hacía
 * pensar en una avería ajena y en esperar. No era eso.
 */
async function jsonConReintento(url, cabeceras = {}, intentos = 4) {
    let ultimo;
    for (let i = 1; i <= intentos; i += 1) {
        try {
            return await json(url, cabeceras);
        } catch (e) {
            ultimo = e;
            const recuperable = /\b(429|500|502|503|504)\b/.test(String(e.message));
            if (!recuperable || i === intentos) throw e;
            const espera = 2000 * i;
            decir(`  · ${e.message.slice(0, 24)}… reintento ${i + 1}/${intentos} en ${espera / 1000} s`);
            await new Promise((r) => setTimeout(r, espera));
        }
    }
    throw ultimo;
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
const TIPOS = [
    'wd:Q11032',    // periódico
    'wd:Q1002697',  // publicación periódica
    'wd:Q1616075',  // emisora de radio
    'wd:Q15265344', // cadena de televisión
    'wd:Q17232649', // periódico digital
    'wd:Q1110794',  // diario
    'wd:Q11033',    // medio de comunicación
];

/**
 * UNA CONSULTA POR TIPO, Y NO LAS SIETE JUNTAS.
 *
 * La versión de una sola consulta con `VALUES ?tipo { … }` y las siete clases
 * devolvía **504 sistemáticamente** el 2026-08-12 —cuatro intentos seguidos—,
 * porque `wdt:P31/wdt:P279*` sobre siete jerarquías más dos OPTIONAL no cabe en
 * el límite de tiempo del endpoint público. Partida por tipo, cada consulta es
 * pequeña y entra. Es la misma pregunta hecha en siete trozos.
 *
 * Se tolera que un tipo falle: se avisa y se sigue con los demás. Perder una
 * clase es un barrido incompleto y declarado; abortar los siete por una es
 * quedarse sin nada, que es lo que pasó el día 11.
 */
const sparqlDeTipo = (tipo) => `
SELECT DISTINCT ?item ?itemLabel ?web ?lugarLabel WHERE {
  ?item wdt:P31/wdt:P279* ${tipo} .
  ?item wdt:P17 wd:Q739 .
  OPTIONAL { ?item wdt:P856 ?web . }
  OPTIONAL { ?item wdt:P131 ?lugar . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
}
LIMIT 2000`;

const ES_ACADEMICO = /\.edu(\.co)?$|revistas?\.|journals?\.|elsevier|scielo|redalyc|openedition|dialnet|latindex|banrepcultural/i;
const NOMBRE_ACADEMICO = /^(revista|anuario|bolet[ií]n|estudios|cuadernos|acta|archivos|papeles|memorias)\b|revista de|journal/i;
const NO_ES_MEDIO = /facebook|twitter|instagram|youtube|blogspot|wordpress\.com|wikipedia/i;

decir('· preguntando a Wikidata, un tipo por consulta…');

/** @type {Map<string, {nombre: string, dominio: string, lugar: string|null, fuente: string}>} */
const cosecha = new Map();
const tiposFallidos = [];

for (const tipo of TIPOS) {
    let sparql;
    try {
        sparql = await jsonConReintento(
            'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(sparqlDeTipo(tipo)),
            { Accept: 'application/sparql-results+json' }
        );
    } catch (e) {
        tiposFallidos.push(`${tipo} (${e.message.slice(0, 40)})`);
        decir(`  ✗ ${tipo}: ${e.message.slice(0, 60)}`);
        continue;
    }

    let nuevos = 0;
    for (const fila of sparql.results.bindings) {
        const nombre = fila.itemLabel?.value;
        const dominio = fila.web?.value ? dominioDe(fila.web.value) : null;
        if (!nombre || !dominio || /^Q\d+$/.test(nombre)) continue;
        if (!cosecha.has(dominio)) {
            cosecha.set(dominio, { nombre, dominio, lugar: fila.lugarLabel?.value ?? null, fuente: 'wikidata' });
            nuevos += 1;
        }
    }
    decir(`  ${tipo}: +${nuevos}`);
}

decir(`  ${cosecha.size} medios con sitio web oficial`);
if (tiposFallidos.length) {
    decir(`  ⚠ BARRIDO INCOMPLETO: ${tiposFallidos.length} de ${TIPOS.length} tipos no respondieron`);
    for (const t of tiposFallidos) decir(`    · ${t}`);
}

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
