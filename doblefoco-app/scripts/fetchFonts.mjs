/**
 * Descarga las tipografías para servirlas desde nuestro dominio.
 *
 *   npm run fonts:fetch
 *
 * POR QUÉ NO ENLAZAR A GOOGLE FONTS
 * ---------------------------------
 * El enlace directo hace que el navegador de CADA LECTOR pida los archivos a
 * fonts.gstatic.com. Eso entrega a un tercero la IP de quien lee y el momento
 * exacto en que lo hace, en cada visita. Para un sitio con una página de
 * transparencia sobre tratamiento de datos, es una contradicción difícil de
 * defender — y nadie la eligió: viene del andamiaje inicial.
 *
 * Además es MÁS LENTO: dos dominios extra que resolver, con su handshake TLS,
 * antes de poder pintar texto.
 *
 * Este script existe en vez de un "descargué unos archivos" porque los pesos
 * cambian: si mañana se añade uno, se ejecuta otra vez y queda todo coherente.
 *
 * Solo se traen los subconjuntos `latin` y `latin-ext`: el sitio es en español
 * y cargar cirílico o griego sería peso muerto en cada visita.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = resolve(ROOT, 'public/fonts');

/** Lo mismo que pedía el <link> de index.html. */
const FAMILIAS =
    'family=Outfit:wght@400;500;600;700;800' +
    '&family=Playfair+Display:ital,wght@0,600;0,800;0,900;1,600' +
    '&family=Plus+Jakarta+Sans:wght@500;700;800';

// Con User-Agent de navegador moderno, Google devuelve woff2. Con otro,
// devuelve formatos antiguos y mucho más pesados.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const SUBCONJUNTOS = new Set(['latin', 'latin-ext']);

const css = await fetch(`https://fonts.googleapis.com/css2?${FAMILIAS}&display=swap`, {
    headers: { 'User-Agent': UA },
}).then((r) => r.text());

await mkdir(DESTINO, { recursive: true });

const bloques = css.split('/*').slice(1);
const reglas = [];
let descargados = 0;

for (const bloque of bloques) {
    const subconjunto = bloque.slice(0, bloque.indexOf('*/')).trim();
    if (!SUBCONJUNTOS.has(subconjunto)) continue;

    const url = bloque.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1];
    const familia = bloque.match(/font-family:\s*'([^']+)'/)?.[1];
    const peso = bloque.match(/font-weight:\s*(\d+)/)?.[1];
    const estilo = bloque.match(/font-style:\s*(\w+)/)?.[1] ?? 'normal';
    const rango = bloque.match(/unicode-range:\s*([^;]+);/)?.[1];

    if (!url || !familia || !peso) continue;

    const nombre = `${familia.toLowerCase().replace(/\s+/g, '-')}-${peso}${estilo === 'italic' ? '-italic' : ''}-${subconjunto}.woff2`;
    const datos = Buffer.from(await fetch(url, { headers: { 'User-Agent': UA } }).then((r) => r.arrayBuffer()));

    await writeFile(resolve(DESTINO, nombre), datos);
    descargados += 1;

    reglas.push(
        `@font-face {\n` +
        `    font-family: '${familia}';\n` +
        `    font-style: ${estilo};\n` +
        `    font-weight: ${peso};\n` +
        // `swap` para que el texto se lea con la tipografía del sistema mientras
        // llega la nuestra, en vez de quedarse invisible.
        `    font-display: swap;\n` +
        `    src: url('/fonts/${nombre}') format('woff2');\n` +
        (rango ? `    unicode-range: ${rango};\n` : '') +
        `}`
    );
}

const cabecera =
    `/*\n` +
    ` * Tipografías servidas desde nuestro dominio.\n` +
    ` *\n` +
    ` * GENERADO POR scripts/fetchFonts.mjs — no editar a mano.\n` +
    ` *\n` +
    ` * Antes se enlazaban a fonts.googleapis.com, lo que hacía que el navegador de\n` +
    ` * cada lector pidiera los archivos a Google: su IP y el momento de la visita,\n` +
    ` * entregados a un tercero en cada carga. Incoherente con la página de\n` +
    ` * transparencia, y además más lento por los dos handshakes TLS extra.\n` +
    ` */\n\n`;

await writeFile(resolve(DESTINO, 'fonts.css'), cabecera + reglas.join('\n\n') + '\n');

console.log(`  ${descargados} archivos en public/fonts/ · ${reglas.length} reglas @font-face`);
