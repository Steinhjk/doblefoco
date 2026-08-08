/**
 * CODIFICACIÓN CIEGA — separa cada documento de su procedencia antes de leerlo.
 *
 *   node scripts/cegarProgramas.mjs preparar   descarga, extrae y ciega
 *   node scripts/cegarProgramas.mjs revelar    abre el sobre, DESPUÉS de codificar
 *
 * POR QUÉ EXISTE
 * --------------
 * El piloto del 2026-08-08 codificó cuatro documentos sabiendo de qué partido
 * era cada uno. Es la objeción más seria que se le puede hacer a esa tanda, y
 * **el tamaño de la muestra no la arregla**: codificar 21 documentos con el
 * mismo defecto produce el mismo defecto, veintiún veces.
 *
 * El sesgo no exige mala fe. Al codificar un texto sabiendo que es del Centro
 * Democrático, una frase ambigua sobre seguridad tiende a leerse como 605 (ley y
 * orden); la misma frase en un texto de Alianza Verde tiende a leerse como
 * asistencia social. Nadie lo hace a propósito y por eso hay que impedirlo
 * mecánicamente, no prometiendo cuidado.
 *
 * CÓMO
 * ----
 * A cada documento se le asigna un identificador opaco —`doc-01`…`doc-21`— en un
 * orden barajado con semilla propia, distinta de la del muestreo. La
 * correspondencia se guarda en un fichero SEPARADO, `sobre-cerrado.json`, que no
 * hay que abrir hasta terminar de codificar.
 *
 * QUÉ NO PUEDE GARANTIZAR, y conviene decirlo
 * -------------------------------------------
 * Un ciego imperfecto: el texto puede delatarse solo. Un programa que menciona
 * al partido en su portada, o que arranca con «en concordancia con la plataforma
 * ideológica del partido», se identifica sin necesidad del sobre. Se retira el
 * nombre de los partidos del texto para reducirlo, pero un lector atento puede
 * inferir la procedencia por el contenido — que es justamente lo que estamos
 * midiendo.
 *
 * Es una limitación REAL y se declara en el resultado. Sigue siendo mucho mejor
 * que codificar con la etiqueta a la vista.
 *
 * LA SUSTITUCIÓN DE ESCANEOS TAMBIÉN TIENE QUE SER CIEGA
 * ------------------------------------------------------
 * Parte de lo radicado son escaneos sin capa de texto. La regla dice sustituirlos
 * por el siguiente del orden barajado DEL MISMO PARTIDO — pero aplicar esa regla
 * a mano obliga a mirar de qué partido era el que falló, y ahí se acabó el ciego.
 *
 * Por eso la sustitución la hace este script, en la misma pasada y sin
 * imprimirlo: se pide al muestreo un excedente por partido, se descarga en orden
 * y se toman los N primeros legibles de cada uno. Quien codifica nunca ve qué se
 * descartó ni de dónde salió el reemplazo.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TRABAJO = 'C:/Users/geren/.claude/jobs/ba8780a5/tmp/ciego';

/** Semilla PROPIA. Si fuera la del muestreo, el orden ciego sería deducible. */
const SEMILLA_CIEGO = 7314;

/** Nombres que delatan la procedencia y se tachan del texto. */
const DELATORES = [
    /partido\s+(centro\s+democr[aá]tico|conservador(?:\s+colombiano)?|liberal(?:\s+colombiano)?|alianza\s+verde|cambio\s+radical|de\s+la\s+u|social\s+de\s+unidad\s+nacional|colombia\s+justa\s+libres)/gi,
    /centro\s+democr[aá]tico/gi,
    /alianza\s+verde/gi,
    /cambio\s+radical/gi,
    /colombia\s+justa\s+libres/gi,
    /partido\s+de\s+la\s+u\b/gi,
];

function mulberry32(a) {
    return function siguiente() {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const accion = process.argv[2] ?? 'preparar';

if (accion === 'revelar') {
    const sobre = JSON.parse(readFileSync(`${TRABAJO}/sobre-cerrado.json`, 'utf8'));
    console.log('\n  SOBRE ABIERTO\n');
    for (const d of sobre.correspondencia) {
        console.log(`  ${d.opaco}  ${d.partido.replace(/^PARTIDO /, '').padEnd(28)} ${d.municipio ?? d.departamento}`);
    }
    console.log();
    process.exit(0);
}

// ── preparar ────────────────────────────────────────────────────────────────

const muestra = JSON.parse(
    readFileSync(resolve(ROOT, 'programas/muestra-calibracion.json'), 'utf8')
);

if (!existsSync(TRABAJO)) mkdirSync(TRABAJO, { recursive: true });

/** Cuántos documentos legibles se quieren por partido. */
const POR_PARTIDO = Number(process.argv[3]) || 3;
const MINIMO_PALABRAS = 200;

/** Descarga y extrae. Devuelve el texto, o null si no hay capa de texto. */
function extraer(url, destinoBase) {
    try {
        execFileSync('curl', [
            '-s', '-L', '--max-time', '60',
            '-A', 'DobleFocoBot/1.0 (+https://doblefoco.co/transparencia)',
            url, '-o', `${destinoBase}.pdf`,
        ]);
        execFileSync('pdftotext', ['-enc', 'UTF-8', `${destinoBase}.pdf`, `${destinoBase}.txt`], {
            stdio: ['ignore', 'ignore', 'ignore'],
        });
        const texto = readFileSync(`${destinoBase}.txt`, 'utf8');
        const palabras = texto.split(/\s+/).filter(Boolean).length;
        return palabras < MINIMO_PALABRAS ? null : { texto, palabras };
    } catch {
        return null;
    }
}

// PRIMERO se eligen los legibles, partido por partido y en el orden del
// muestreo. Este bucle SÍ conoce los partidos; quien codifica no ve su salida.
const porPartido = new Map();
for (const doc of muestra.documentos) {
    if (!porPartido.has(doc.partido)) porPartido.set(doc.partido, []);
    porPartido.get(doc.partido).push(doc);
}

const elegidos = [];
const descartados = [];

for (const [partido, docs] of porPartido) {
    let tomados = 0;
    for (const doc of docs) {
        if (tomados >= POR_PARTIDO) break;
        const tmp = `${TRABAJO}/_tmp`;
        const r = extraer(doc.url, tmp);
        if (!r) {
            descartados.push({ partido, url: doc.url, motivo: 'sin capa de texto (escaneo)' });
            continue;
        }
        elegidos.push({ ...doc, texto: r.texto, palabras: r.palabras });
        tomados += 1;
    }
    if (tomados < POR_PARTIDO) {
        console.log(`  aviso: ${partido.replace(/^PARTIDO /, '')} solo aportó ${tomados} legibles`);
    }
}

// DESPUÉS se baraja el conjunto entero y se asignan los identificadores opacos:
// así ni el orden de los ficheros en disco ni su numeración agrupan por partido.
const azar = mulberry32(SEMILLA_CIEGO);
for (let i = elegidos.length - 1; i > 0; i -= 1) {
    const j = Math.floor(azar() * (i + 1));
    [elegidos[i], elegidos[j]] = [elegidos[j], elegidos[i]];
}

const correspondencia = [];
const fallos = descartados;

for (let i = 0; i < elegidos.length; i += 1) {
    const doc = elegidos[i];
    const opaco = `doc-${String(i + 1).padStart(2, '0')}`;

    let texto = doc.texto;
    for (const patron of DELATORES) texto = texto.replace(patron, '[PARTIDO]');
    writeFileSync(`${TRABAJO}/${opaco}.txt`, texto, 'utf8');

    correspondencia.push({
        opaco,
        partido: doc.partido,
        ancla: doc.ancla,
        departamento: doc.departamento,
        municipio: doc.municipio,
        elegido: doc.elegido,
        url: doc.url,
        palabras: doc.palabras,
    });
    console.log(`  ${opaco}  ${String(doc.palabras).padStart(6)} palabras`);
}

writeFileSync(
    `${TRABAJO}/sobre-cerrado.json`,
    `${JSON.stringify({
        aviso: 'NO ABRIR hasta terminar de codificar. Abrirlo antes invalida el ciego.',
        semillaCiego: SEMILLA_CIEGO,
        generadoEl: new Date().toISOString().slice(0, 10),
        fallos,
        correspondencia,
    }, null, 2)}\n`,
    'utf8'
);

console.log(`\n  ${correspondencia.length} documentos cegados en ${TRABAJO}`);
console.log(`  ${fallos.length} sin capa de texto o con fallo de descarga`);
console.log('  correspondencia en sobre-cerrado.json — no abrir hasta codificar\n');
