/**
 * Verificación de integridad del catálogo de medios.
 *
 * Ejecutar con: npm run check:registry
 *
 * Existe para que la divergencia que motivó la tarea F1-04 no pueda repetirse
 * en silencio. El mismo medio llegó a tener tres sesgos distintos según el
 * archivo que se consultara, y nadie se dio cuenta durante meses porque nada
 * lo comprobaba.
 *
 * Sale con código 1 si algo falla, para poder colgarlo de la integración
 * continua (tarea F2-10).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';
import {
    MEDIA_REGISTRY,
    SPECTRUM_BANDS,
    findMediaByName,
    getIngestFeeds,
    getBand,
} from '../shared/mediaRegistry.js';
import { renderCatalog, OUTPUT, GENERATED_LINE } from './generateCatalogDoc.mjs';
import { OWNERSHIP_PROFILES, OWNER_TYPES } from '../shared/mediaOwnership.js';

const problems = [];
const warnings = [];

function fail(message) { problems.push(message); }
function warn(message) { warnings.push(message); }

// ── 1. Integridad del propio registro ───────────────────────────────────────

const ids = new Set();
const domains = new Set();

for (const media of MEDIA_REGISTRY) {
    if (ids.has(media.id)) fail(`id duplicado: ${media.id}`);
    ids.add(media.id);

    if (domains.has(media.domain)) fail(`dominio duplicado: ${media.domain}`);
    domains.add(media.domain);

    for (const field of ['name', 'shortName', 'domain', 'biasRationale']) {
        if (!media[field]) fail(`${media.id}: falta "${field}"`);
    }

    if (typeof media.bias !== 'number' || media.bias < -1 || media.bias > 1) {
        fail(`${media.id}: sesgo fuera de rango (${media.bias})`);
    }

    if (typeof media.factuality !== 'number' || media.factuality <= 0 || media.factuality > 1) {
        fail(`${media.id}: factualidad fuera de rango (${media.factuality})`);
    }

    if (media.domain.includes(' ') || media.domain.includes('/')) {
        fail(`${media.id}: dominio mal formado "${media.domain}"`);
    }

    /**
     * El sesgo es un juicio sobre una organización real: debe estar firmado.
     * Mientras no lo esté, el catálogo público lo marca como PROVISIONAL.
     */
    if (!media.reviewedAt) {
        warn(`${media.id}: sesgo ${media.bias >= 0 ? '+' : ''}${media.bias} SIN revisión editorial`);
        continue;
    }

    /**
     * FIRMAR EXIGE CITAR. Esta es la defensa estructural contra que la
     * clasificación se mueva desde fuera.
     *
     * Los reportes del lector (F2-07) señalan medios posiblemente mal
     * clasificados, y eso es útil. Pero una campaña coordinada puede inflar esa
     * señal a voluntad, y aunque los reportes no tocan nada por sí solos, sí
     * pueden dirigir la atención hasta que alguien "corrija" un valor sin más
     * evidencia que la insistencia.
     *
     * La regla lo corta de raíz: se puede reportar cuanto se quiera, pero
     * cambiar y firmar una clasificación exige producir dónde consta. Un
     * recuento de reportes no es una fuente.
     *
     * Es la misma regla que ya rige para las fichas de propiedad más abajo, y
     * por el mismo motivo: son afirmaciones sobre organizaciones identificables
     * que pueden discutirlas.
     */
    if (!Array.isArray(media.biasSources) || media.biasSources.length === 0) {
        fail(
            `${media.id}: el sesgo está firmado (reviewedAt ${media.reviewedAt}) pero sin una ` +
            `sola fuente en "biasSources". Firmar una clasificación exige citar dónde consta; ` +
            `los reportes de lectores señalan dónde mirar, no sirven de evidencia.`
        );
        continue;
    }

    for (const source of media.biasSources) {
        const url = typeof source === 'string' ? source : source?.url;
        if (!/^https?:\/\/\S+$/.test(url ?? '')) {
            fail(`${media.id}: fuente de sesgo mal formada ${JSON.stringify(source)}`);
        }
    }
}

// ── 2 y 3. RETIRADAS al desaparecer el fixture (F2-03) ──────────────────────
//
// Comprobaban que ninguna fuente de src/data/mockData.js quedara sin resolver
// contra el registro, y que ningún sesgo embebido en aquellos datos
// contradijera al catálogo. Era la guarda de F1-04, y su objeto de vigilancia
// ya no existe: el fixture se eliminó porque contenía citas fabricadas.
//
// La garantía que daban NO se perdió, cambió de sitio y es más fuerte:
//   · `sources` es una PROYECCIÓN del registro que se regenera en cada arranque
//     y en cada migración (server/db/sourceSync.js). Un UPDATE manual sobre esa
//     tabla se revierte solo.
//   · `hydrateArticles` lee el sesgo de `sources` mediante JOIN, nunca del
//     artículo almacenado, así que un artículo viejo no puede arrastrar un
//     valor caduco (server/db/contentStore.js).
// Es decir: ya no hay ningún sitio donde un sesgo pueda vivir fuera del
// registro, que es lo que aquellas comprobaciones detectaban a posteriori.

// ── 4. Los documentos públicos no declaran sesgos propios ───────────────────
//
// El cuarto lugar donde vivían valores divergentes no era código, era prosa:
// src/docs/criterios_clasificacion_medios.txt clasificaba a Semana en +0.65
// mientras el motor usaba +0.45, y era el valor de la prosa el que veía el
// lector. Un verificador que solo mire archivos .js no habría detectado nada.
//
// Regla: si un documento nombra a un medio y a menos de 80 caracteres aparece
// un número con pinta de sesgo, ese número debe ser el del registro. Se acepta
// la línea que contiene AMBOS valores, que es la forma de dejar constancia
// histórica de una divergencia ya corregida.

const here = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = resolve(here, '../src/docs');
const GENERATED_DOC = basename(OUTPUT);

const DECIMAL = /[-+−]?\d\.\d{1,2}/g;

for (const file of readdirSync(DOCS_DIR).filter((f) => f.endsWith('.txt'))) {
    if (file === GENERATED_DOC) continue;

    const text = readFileSync(resolve(DOCS_DIR, file), 'utf8');

    for (const media of MEDIA_REGISTRY) {
        let index = text.indexOf(media.name);

        while (index !== -1) {
            const window = text.slice(index + media.name.length, index + media.name.length + 80);
            const numbers = (window.match(DECIMAL) ?? []).map((n) =>
                Number(n.replace('−', '-'))
            );

            const declared = numbers.filter((n) => n >= -1 && n <= 1);
            const matchesRegistry = declared.some((n) => Math.abs(n - media.bias) < 0.001);

            if (declared.length && !matchesRegistry) {
                fail(
                    `${file}: "${media.name}" aparece junto a ${declared.join(', ')} ` +
                    `pero el registro dice ${media.bias >= 0 ? '+' : ''}${media.bias}`
                );
            }

            index = text.indexOf(media.name, index + 1);
        }
    }
}

// ── 5. El catálogo público está sincronizado con el registro ────────────────

const stripDate = (text) => text.replace(GENERATED_LINE, 'Generado: —');

try {
    const onDisk = stripDate(readFileSync(OUTPUT, 'utf8'));
    const expected = stripDate(renderCatalog());

    if (onDisk !== expected) {
        fail(`${GENERATED_DOC} está desactualizado respecto al registro. Ejecuta: npm run docs:catalog`);
    }
} catch {
    fail(`${GENERATED_DOC} no existe. Ejecuta: npm run docs:catalog`);
}

// ── 6. Fichas de propiedad: nada se afirma sin fuente ───────────────────────
//
// Es el control más importante de este archivo. Las fichas de propiedad hablan
// de personas y empresas identificables; una afirmación sin enlace ahí no es un
// descuido de datos, es un señalamiento sin respaldo. La regla se comprueba en
// vez de confiarse.

let documentedProfiles = 0;

for (const media of MEDIA_REGISTRY) {
    const profile = OWNERSHIP_PROFILES[media.id];

    if (!profile) {
        fail(`${media.id}: sin ficha de propiedad en shared/mediaOwnership.js`);
        continue;
    }

    if (!OWNER_TYPES[profile.ownerType]) {
        fail(`${media.id}: ownerType desconocido "${profile.ownerType}"`);
    }

    for (const field of ['holdings', 'notes', 'sources']) {
        if (!Array.isArray(profile[field])) {
            fail(`${media.id}: la ficha de propiedad necesita "${field}" como lista`);
        }
    }

    const claims = (profile.holdings?.length ?? 0) + (profile.notes?.length ?? 0);

    if (claims > 0) {
        documentedProfiles += 1;

        if (!profile.sources?.length) {
            fail(
                `${media.id}: la ficha de propiedad afirma ${claims} cosa(s) sin una sola ` +
                `fuente. Cada afirmación sobre un dueño se publica con el enlace donde ` +
                `consta o no se publica.`
            );
        }

        for (const url of profile.sources ?? []) {
            if (!/^https?:\/\/\S+$/.test(url)) {
                fail(`${media.id}: fuente de propiedad mal formada "${url}"`);
            }
        }
    }
}

for (const id of Object.keys(OWNERSHIP_PROFILES)) {
    if (!MEDIA_REGISTRY.some((m) => m.id === id)) {
        fail(`ficha de propiedad huérfana: "${id}" no existe en el registro`);
    }
}

if (documentedProfiles === 0) {
    warn(
        `ninguna de las ${MEDIA_REGISTRY.length} fichas de propiedad tiene contenido ` +
        `documentado todavía; la interfaz declara la ausencia`
    );
}

// ── 7. Cobertura por espectro ───────────────────────────────────────────────

const feeds = getIngestFeeds();
const ingestedMedia = MEDIA_REGISTRY.filter((m) => m.feed?.url);

const perBand = {};
for (const media of ingestedMedia) {
    const band = getBand(media.bias).id;
    perBand[band] = (perBand[band] ?? 0) + 1;
}

const leftish = (perBand.left ?? 0) + (perBand['center-left'] ?? 0);
const rightish = (perBand.right ?? 0) + (perBand['center-right'] ?? 0);

if (leftish < 6) warn(`solo ${leftish} medios de izquierda/centro-izquierda con feed (objetivo F1-06: 6)`);
if (rightish < 6) warn(`solo ${rightish} medios de derecha/centro-derecha con feed (objetivo F1-06: 6)`);

// ── Informe ─────────────────────────────────────────────────────────────────

console.log('CATÁLOGO DE MEDIOS');
console.log('─'.repeat(62));
console.log(`medios registrados        : ${MEDIA_REGISTRY.length}`);
console.log(`con feed de ingesta       : ${ingestedMedia.length} (${feeds.length} feeds)`);
console.log(`sin feed (solo referencia): ${MEDIA_REGISTRY.length - ingestedMedia.length}`);
console.log();
console.log('distribución por banda (medios con feed):');
for (const band of SPECTRUM_BANDS) {
    const count = perBand[band.id] ?? 0;
    console.log(`  ${band.label.padEnd(17)} ${String(count).padStart(2)}  ${'▇'.repeat(count)}`);
}
console.log();

if (warnings.length) {
    console.log(`AVISOS (${warnings.length})`);
    console.log('─'.repeat(62));
    for (const w of warnings) console.log(`  · ${w}`);
    console.log();
}

if (problems.length) {
    console.log(`ERRORES (${problems.length})`);
    console.log('─'.repeat(62));
    for (const p of problems) console.log(`  ✗ ${p}`);
    console.log();
    process.exit(1);
}

console.log('✓ Sin errores de integridad.');
