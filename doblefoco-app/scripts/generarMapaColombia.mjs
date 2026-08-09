/**
 * GENERA `src/data/mapaColombia.js` — se corre a mano, su salida se versiona.
 *
 *     npm run mapa:generar
 *
 * POR QUÉ SE VERSIONA LA SALIDA Y NO SE DESCARGA EN CADA COMPILACIÓN: son 40 kB
 * que no cambian nunca —las fronteras departamentales llevan décadas quietas— y
 * a cambio la compilación deja de depender de que GitHub responda. Lo mismo que
 * ya se hace con las fuentes y los logotipos.
 *
 * DE DÓNDE SALE LA GEOMETRÍA: Natural Earth, `ne_10m_admin_1_states_provinces`,
 * dominio público. Se eligió por poder CITARSE, que es la regla del resto del
 * proyecto: ningún dato entra sin procedencia. Los límites oficiales son los del
 * DANE, y no son estos; para pintar quién publica qué, Natural Earth basta.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, '..');
const DESTINO = path.join(RAIZ, 'src', 'data', 'mapaColombia.js');
const CACHE = path.join(RAIZ, 'node_modules', '.cache', 'ne_10m_admin_1.geojson');

const ORIGEN =
    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';

/** Douglas-Peucker, en grados. ~1 unidad del lienzo de 1000 de ancho. */
const TOLERANCIA = 0.012;

/** Anillos por debajo de esta área (grados²) no llegan a un píxel. */
const AREA_MINIMA = 0.004;

/** Ancho del lienzo. El alto sale de la proporción real del país. */
const ANCHO = 1000;

/** ISO 3166-2 → el nombre exacto que usa `shared/geografia.js`. */
const ISO_A_NOMBRE = {
    'CO-AMA': 'Amazonas',
    'CO-ANT': 'Antioquia',
    'CO-ARA': 'Arauca',
    'CO-ATL': 'Atlántico',
    'CO-BOL': 'Bolívar',
    'CO-BOY': 'Boyacá',
    'CO-CAL': 'Caldas',
    'CO-CAQ': 'Caquetá',
    'CO-CAS': 'Casanare',
    'CO-CAU': 'Cauca',
    'CO-CES': 'Cesar',
    'CO-CHO': 'Chocó',
    'CO-COR': 'Córdoba',
    'CO-GUA': 'Guainía',
    'CO-GUV': 'Guaviare',
    'CO-HUI': 'Huila',
    'CO-LAG': 'La Guajira',
    'CO-MAG': 'Magdalena',
    'CO-MET': 'Meta',
    'CO-NAR': 'Nariño',
    'CO-NSA': 'Norte de Santander',
    'CO-PUT': 'Putumayo',
    'CO-QUI': 'Quindío',
    'CO-RIS': 'Risaralda',
    'CO-SAN': 'Santander',
    'CO-SAP': 'Archipiélago de San Andrés',
    'CO-SUC': 'Sucre',
    'CO-TOL': 'Tolima',
    'CO-VAC': 'Valle del Cauca',
    'CO-VAU': 'Vaupés',
    'CO-VID': 'Vichada',
};

/**
 * Bogotá y Cundinamarca comparten el código `CO-CUN` en Natural Earth, así que
 * el ISO no basta para separarlas. El campo `name` sí las separa.
 */
const POR_NOMBRE = { Bogota: 'Bogotá D.C.', Cundinamarca: 'Cundinamarca' };

/** El archipiélago va en recuadro aparte: a escala nacional mide un píxel. */
const INSULAR = 'Archipiélago de San Andrés';

// ── Descarga ─────────────────────────────────────────────────────────────────

async function obtenerGeoJson() {
    if (fs.existsSync(CACHE)) {
        console.log(`· usando la copia en caché (${(fs.statSync(CACHE).size / 1e6).toFixed(1)} MB)`);
        return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
    }

    console.log('· descargando Natural Earth (~40 MB, una sola vez)…');
    const respuesta = await fetch(ORIGEN);
    if (!respuesta.ok) throw new Error(`Natural Earth respondió ${respuesta.status}`);

    const texto = await respuesta.text();
    fs.mkdirSync(path.dirname(CACHE), { recursive: true });
    fs.writeFileSync(CACHE, texto);
    return JSON.parse(texto);
}

// ── Geometría ────────────────────────────────────────────────────────────────

/** @param {any} f */
function nombreDe(f) {
    const { iso_3166_2: iso, name } = f.properties;
    if (iso === 'CO-CUN') return POR_NOMBRE[name] ?? null;
    return ISO_A_NOMBRE[iso] ?? null;
}

/**
 * Anillos exteriores de un feature, sea `Polygon` o `MultiPolygon`. Los anillos
 * interiores (huecos) se ignoran: las lagunas de Colombia miden menos de un
 * píxel a esta escala y sus agujeros solo aportarían ruido al trazado.
 *
 * @param {any} f
 */
function anillosDe(f) {
    const g = f.geometry;
    const polis = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
    return polis.map((p) => p[0]);
}

/** Área con la fórmula del cordón de zapato, en grados². */
function areaAnillo(anillo) {
    let doble = 0;
    for (let i = 0, n = anillo.length; i < n; i++) {
        const [x1, y1] = anillo[i];
        const [x2, y2] = anillo[(i + 1) % n];
        doble += x1 * y2 - x2 * y1;
    }
    return Math.abs(doble) / 2;
}

/** Douglas-Peucker recursivo. */
function simplificar(puntos, tol) {
    if (puntos.length < 3) return puntos;

    const [ax, ay] = puntos[0];
    const [bx, by] = puntos[puntos.length - 1];
    const dx = bx - ax;
    const dy = by - ay;
    const largo = Math.hypot(dx, dy);

    let peor = 0;
    let indice = 0;

    for (let i = 1; i < puntos.length - 1; i++) {
        const [px, py] = puntos[i];
        const d = largo === 0
            ? Math.hypot(px - ax, py - ay)
            : Math.abs(dy * px - dx * py + bx * ay - by * ax) / largo;
        if (d > peor) {
            peor = d;
            indice = i;
        }
    }

    if (peor <= tol) return [puntos[0], puntos[puntos.length - 1]];

    return [
        ...simplificar(puntos.slice(0, indice + 1), tol).slice(0, -1),
        ...simplificar(puntos.slice(indice), tol),
    ];
}

// ── Programa ─────────────────────────────────────────────────────────────────

const geo = await obtenerGeoJson();
const colombianas = geo.features.filter((f) => f.properties.adm0_a3 === 'COL');

const piezas = [];
const descartados = [];

for (const f of colombianas) {
    const nombre = nombreDe(f);

    if (!nombre) {
        descartados.push(f.properties.note ?? f.properties.iso_3166_2);
        continue;
    }
    if (nombre === INSULAR) continue;

    const anillos = anillosDe(f)
        .filter((a) => areaAnillo(a) >= AREA_MINIMA)
        .map((a) => simplificar(a, TOLERANCIA));

    if (!anillos.length) throw new Error(`${nombre} se quedó sin geometría`);
    piezas.push({ nombre, anillos });
}

// Una comprobación y no un aviso: si Natural Earth renumera un código, el
// departamento desaparecería del mapa en silencio y el filtro seguiría
// ofreciéndolo. Mejor que la generación se caiga.
if (piezas.length !== 32) {
    throw new Error(`se esperaban 32 piezas continentales y hay ${piezas.length}`);
}

// Proyección: equirectangular con corrección por el coseno de la latitud media.
// Colombia está sobre el ecuador (latitud media ≈ 4°), así que la corrección
// vale un 0,3 %: cualquier proyección conforme daría lo mismo a ojo, y esta no
// arrastra dependencias.
let minLon = Infinity;
let maxLon = -Infinity;
let minLat = Infinity;
let maxLat = -Infinity;

for (const { anillos } of piezas) {
    for (const anillo of anillos) {
        for (const [lon, lat] of anillo) {
            if (lon < minLon) minLon = lon;
            if (lon > maxLon) maxLon = lon;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
        }
    }
}

const k = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
const escala = ANCHO / ((maxLon - minLon) * k);
const ALTO = Math.round((maxLat - minLat) * escala);

const px = (lon) => (lon - minLon) * k * escala;
const py = (lat) => (maxLat - lat) * escala;
const redondear = (n) => Math.round(n * 10) / 10;

function aTrazado(anillos) {
    return anillos
        .map((anillo) => {
            const inicio = `M${redondear(px(anillo[0][0]))} ${redondear(py(anillo[0][1]))}`;
            const resto = anillo
                .slice(1)
                .map(([lon, lat]) => `${redondear(px(lon))} ${redondear(py(lat))}`)
                .join('L');
            return `${inicio}L${resto}Z`;
        })
        .join('');
}

piezas.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

const filas = piezas
    .map(({ nombre, anillos }) => `    ['${nombre}', '${aTrazado(anillos)}'],`)
    .join('\n');

const contenido = `// @ts-check
/**
 * GEOMETRÍA DE LOS DEPARTAMENTOS — GENERADO, no se edita a mano.
 *
 * Se regenera con \`npm run mapa:generar\` (scripts/generarMapaColombia.mjs).
 *
 * FUENTE: Natural Earth, \`ne_10m_admin_1_states_provinces\`, dominio público.
 * https://www.naturalearthdata.com/downloads/10m-cultural-vectors/
 *
 * QUÉ SE PERDIÓ POR EL CAMINO, y hay que saberlo antes de leer este mapa como
 * si fuera un documento cartográfico:
 *
 *   · **Simplificación Douglas-Peucker a ${TOLERANCIA}°**, algo menos de una unidad de
 *     este lienzo. Las fronteras son fieles al tamaño al que se dibujan y a
 *     ningún otro; ampliadas, no valen.
 *   · **Fuera los islotes de menos de ${AREA_MINIMA} grados²**. Malpelo entre ellos, que
 *     en Natural Earth ni siquiera trae departamento asignado.
 *   · **El archipiélago de San Andrés va en recuadro aparte**, no en su sitio.
 *     Está a 700 km de la costa: o es un píxel perdido o encoge el continente a
 *     la mitad. El recuadro es la convención cartográfica de siempre, pero es
 *     una convención, y la distancia real deja de verse.
 *   · **Bogotá se separa de Cundinamarca por el nombre, no por el código**:
 *     Natural Earth le da \`CO-CUN\` a las dos.
 *
 * Los límites NO son los oficiales del DANE. Para pintar cuántas noticias
 * hablan de cada departamento sobran; para cualquier afirmación sobre
 * territorio, no sirven.
 */

/** El lienzo en el que están proyectados los trazados. */
export const VISTA = { ancho: ${ANCHO}, alto: ${ALTO} };

/**
 * Los 32 departamentos continentales como \`[nombre, trazado]\`, alfabéticos.
 * El nombre es la clave que comparten con \`shared/geografia.js\`.
 */
export const TRAZADOS = /** @type {ReadonlyArray<readonly [string, string]>} */ ([
${filas}
]);

/**
 * El 33.º. Va en su propio recuadro, y va nombrado aquí para que la vista pueda
 * decir en voz alta que lo dibuja fuera de sitio en vez de disimularlo.
 */
export const INSULAR = '${INSULAR}';
`;

fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
fs.writeFileSync(DESTINO, contenido);

console.log(`✓ ${piezas.length} departamentos continentales + 1 insular`);
console.log(`  descartado: ${descartados.join(', ') || 'nada'}`);
console.log(`  lienzo ${ANCHO}×${ALTO}, ${(contenido.length / 1024).toFixed(1)} kB`);
console.log(`  → ${path.relative(RAIZ, DESTINO)}`);
