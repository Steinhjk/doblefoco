/**
 * ¿HAY ALGÚN COMENTARIO QUE NOMBRE ALGO QUE NO EXISTE?
 *
 *     npm run check:comentarios
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Este repositorio comenta mucho y a propósito: la mitad del valor de un archivo
 * está en el párrafo que dice por qué. Eso tiene una avería propia, y una
 * revisión externa le puso nombre el 2026-08-25: **el comentario-aspiración**.
 * Alguien escribe «`porMedios` cuenta cabezas» describiendo un diseño que se
 * quedó a medias, el código sale con otros nombres, y el comentario se queda ahí
 * afirmando en presente algo que nunca llegó a ser verdad.
 *
 * No lo ve nadie. No lo ve el lint, que no lee comentarios. No lo ven los tipos.
 * No lo ven las pruebas. Y es peor que un comentario ausente: uno ausente hace
 * mirar el código, y uno que miente hace confiar.
 *
 * En la primera pasada encontró tres, y ninguno era reciente.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA REGLA, Y POR QUÉ ES TAN ESTRECHA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Se acusa una cita entre acentos graves solo si cumple LAS TRES:
 *
 *   1. Tiene forma de identificador y **una mayúscula interior** —`porMedios`,
 *      `initialInView`—. Es lo que separa un nombre del código de una palabra:
 *      la prosa, en español o en inglés, no va en camello. Sin esta condición
 *      saltaban `nasa`, `marte`, `feminicidio` y `destacadas`, que son entradas
 *      de un léxico y están bien escritas así. Bajó el ruido de 29 a 9.
 *
 *   2. No aparece en NINGÚN sitio del código del proyecto. El vocabulario se
 *      saca de los archivos con los comentarios quitados —si no, una mentira
 *      repetida dos veces se avalaría sola— pero CON las cadenas dentro, porque
 *      ahí viven los nombres de columna y las clases CSS que los comentarios
 *      citan con toda la razón.
 *
 *   3. El párrafo no dice ya que eso se fue. «SE LLAMABA `describeBias` y era un
 *      nombre engañoso» es documentación buena: nombra lo ausente **diciendo que
 *      está ausente**. Sin esta condición la comprobación castigaría justo la
 *      clase de comentario que este proyecto quiere. Bajó el ruido de 9 a 4.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LO QUE NO HACE, DICHO ANTES DE QUE DECEPCIONE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * No entiende el código: no sabe si un nombre está exportado, ni si el
 * comentario está encima de lo que nombra. Solo sabe que ese nombre no está
 * escrito en ninguna parte, y eso ya basta para que la frase sea falsa.
 *
 * Tampoco caza el caso contrario —el comentario que describe mal algo que sí
 * existe— y ese es el más común de los dos. Esto es el 10 % del problema por el
 * 1 % del trabajo, y conviene no confundirlo con haberlo resuelto.
 *
 * Y **se puede callar**, con `AJENOS` de abajo, que es una lista corta con un
 * motivo escrito al lado de cada entrada. Es a propósito: un vigilante que no se
 * puede callar se acaba borrando entero, y entonces no queda nada.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const NO_ENTRAR = new Set(['node_modules', 'dist', 'dist-server', '.git', 'capturas', 'coverage']);

/** Dónde se busca vocabulario. Cuanto más ancho, menos falsos positivos. */
const VOCABULARIO = new Set([
    '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx',
    '.css', '.sql', '.json', '.yml', '.yaml', '.html',
]);

/** Dónde se buscan comentarios. Solo JavaScript: el resto se parte distinto. */
const CON_COMENTARIOS = new Set(['.js', '.jsx', '.mjs', '.cjs']);

/**
 * Nombres de fuera que este código cita con razón y nunca va a declarar.
 *
 * CADA ENTRADA LLEVA SU MOTIVO. Una lista de excepciones sin explicación se
 * convierte en el sitio donde se entierran los hallazgos incómodos.
 */
const AJENOS = new Map([
    ['renderToString', 'API de react-dom/server, citada para decir que NO se usa'],
    ['MultiPolygon', 'tipo de GeoJSON: vive en los datos, no en nuestro código'],
]);

/**
 * Palabras que ponen la cita en pasado o en ausencia.
 *
 * Se buscan en el MISMO BLOQUE de comentario, no en la línea: la frase que
 * explica que algo se retiró suele empezar dos renglones antes.
 *
 * Es deliberadamente generosa. Un falso negativo aquí deja pasar un comentario
 * malo; un falso positivo hace que alguien borre la comprobación entera.
 */
const MARCAS_DE_AUSENCIA = [
    'se llamaba', 'se llamaban', 'se llamó', 'llamaba',
    'ya no', 'antes se', 'se fue', 'se fueron', 'se retir', 'se borr',
    'se quitó', 'se eliminó', 'se sustituy', 'sustituye a', 'reemplaz',
    'desapareci', 'no existe', 'no existía', 'nunca existió', 'dejó de',
    'era un', 'eran ', 'existía', 'se cambió', 'renombr', 'se descartó',
];

function* archivos(dir) {
    for (const entrada of readdirSync(dir)) {
        if (NO_ENTRAR.has(entrada)) continue;
        const p = join(dir, entrada);
        if (statSync(p).isDirectory()) yield* archivos(p);
        else yield p;
    }
}

/** Número de línea de una posición. Solo se calcula para lo que se va a acusar. */
function lineaDe(texto, pos) {
    let n = 1;
    for (let i = 0; i < pos; i++) if (texto[i] === '\n') n++;
    return n;
}

/**
 * Separa un archivo en código y comentarios.
 *
 * Es un recorrido a mano y no una expresión regular porque hay que llevar cuenta
 * de las cadenas: un `//` dentro de 'https://...' no abre comentario, y ese caso
 * está en casi todos los archivos de este repositorio.
 *
 * Las CADENAS se copian al lado del CÓDIGO, no al de los comentarios. Ahí viven
 * los nombres de columna y las clases CSS que los comentarios nombran con razón,
 * y perderlas sería fabricar acusaciones.
 */
function partir(texto) {
    const codigo = [];
    const comentarios = [];
    let i = 0;
    while (i < texto.length) {
        const c = texto[i];
        const d = texto[i + 1];
        if (c === '/' && d === '*') {
            const fin = texto.indexOf('*/', i + 2);
            const hasta = fin === -1 ? texto.length : fin + 2;
            comentarios.push({ texto: texto.slice(i, hasta), desde: i });
            i = hasta;
        } else if (c === '/' && d === '/') {
            let fin = texto.indexOf('\n', i);
            if (fin === -1) fin = texto.length;
            comentarios.push({ texto: texto.slice(i, fin), desde: i });
            i = fin;
        } else if (c === '"' || c === "'" || c === '`') {
            let j = i + 1;
            while (j < texto.length && texto[j] !== c) {
                // Barra invertida: se salta lo que escapa.
                if (texto.charCodeAt(j) === 92) j++;
                j++;
            }
            codigo.push(texto.slice(i, Math.min(j + 1, texto.length)));
            i = j + 1;
        } else {
            codigo.push(c);
            i++;
        }
    }
    return { codigo: codigo.join(''), comentarios };
}

const TOKEN = /[A-Za-z_$][A-Za-z0-9_$-]*/g;
const FORMA_DE_IDENTIFICADOR = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const MAYUSCULA_INTERIOR = /[a-z0-9_$][A-Z]/;
const CITA = /`([^`\n]{2,60})`/g;

const vocabulario = new Set();
const porRevisar = [];

for (const ruta of archivos(RAIZ)) {
    const ext = extname(ruta);
    if (!VOCABULARIO.has(ext)) continue;
    const texto = readFileSync(ruta, 'utf8');

    if (CON_COMENTARIOS.has(ext)) {
        const { codigo, comentarios } = partir(texto);
        for (const t of codigo.match(TOKEN) ?? []) vocabulario.add(t);
        if (comentarios.length) porRevisar.push({ ruta, texto, comentarios });
    } else {
        for (const t of texto.match(TOKEN) ?? []) vocabulario.add(t);
    }
}

const acusaciones = [];
for (const { ruta, texto, comentarios } of porRevisar) {
    for (const bloque of comentarios) {
        const enMinusculas = bloque.texto.toLowerCase();
        const dicePasado = MARCAS_DE_AUSENCIA.some((m) => enMinusculas.includes(m));
        if (dicePasado) continue;
        for (const m of bloque.texto.matchAll(CITA)) {
            const cita = m[1].trim();
            if (!FORMA_DE_IDENTIFICADOR.test(cita)) continue;
            if (!MAYUSCULA_INTERIOR.test(cita)) continue;
            if (vocabulario.has(cita)) continue;
            if (AJENOS.has(cita)) continue;
            acusaciones.push({
                ruta: relative(RAIZ, ruta),
                linea: lineaDe(texto, bloque.desde + m.index),
                cita,
                bloque: bloque.texto,
            });
        }
    }
}

/** Una acusación por nombre y archivo: un mismo error citado tres veces es uno. */
const unicas = [...new Map(acusaciones.map((a) => [`${a.ruta}:${a.cita}`, a])).values()];

console.log(`vocabulario: ${vocabulario.size} nombres escritos en el código`);
console.log(`comentarios revisados en ${porRevisar.length} archivos\n`);

if (!unicas.length) {
    console.log('Ningún comentario nombra algo que no exista.');
    process.exit(0);
}

for (const a of unicas) {
    const frase = a.bloque
        .split('\n')
        .find((l) => l.includes('`' + a.cita + '`'))
        ?.replace(/^\s*\*?\s?/, '')
        .trim();
    console.log(`${a.ruta}:${a.linea}`);
    console.log(`  «${a.cita}» no está escrito en ninguna parte del código.`);
    if (frase) console.log(`  dice: ${frase}`);
    console.log('');
}

const n = unicas.length;
console.log(`${n} comentario${n === 1 ? '' : 's'} nombra${n === 1 ? '' : 'n'} algo que no existe.`);
console.log('');
console.log('Cuatro arreglos, por orden de probabilidad:');
console.log('  · corregir el nombre, que es lo que suele pasar;');
console.log('  · escribirlo sin acentos graves, si era prosa y no un nombre;');
console.log('  · decir en la misma frase que se retiró —«se llamaba», «ya no»—;');
console.log('  · añadirlo a AJENOS con su motivo, si es un nombre de fuera.');
process.exit(1);
