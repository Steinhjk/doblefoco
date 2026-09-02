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
    getIngestFeeds,
    getBand,
} from '../shared/mediaRegistry.js';
import { renderCatalog, OUTPUT, GENERATED_LINE } from './generateCatalogDoc.mjs';
import {
    renderModelo,
    OUTPUT as MODELO_OUTPUT,
    LINEA_GENERADO,
    leerMedido,
    DIAS_ANTES_DE_CADUCAR,
} from './generarDocModelo.mjs';
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

    /**
     * `factuality: null` ES VÁLIDO Y SIGNIFICA «no medida».
     *
     * Antes era obligatoria, y esa obligación tenía un efecto perverso: para
     * dar de alta un medio había que inventarle un número de rigor factual. Es
     * exactamente lo que la Fase 0 quitó del motor —fijaba 0.88 para todo y la
     * interfaz lo mostraba como «Factualidad IA: 88 %», una constante
     * disfrazada de medición— y volvía a colarse por la puerta del catálogo.
     *
     * El resto del código ya lo contemplaba: `averageFactuality` filtra los no
     * numéricos y devuelve `null` en vez de un valor por defecto.
     *
     * Se avisa, no se falla: un medio sin factualidad medida es un hueco
     * declarado, no un error.
     */
    if (media.factuality === null || media.factuality === undefined) {
        warn(`${media.id}: sin factualidad medida`);
    } else if (typeof media.factuality !== 'number' || media.factuality <= 0 || media.factuality > 1) {
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

/**
 * Se normalizan los saltos de línea antes de comparar, y NO es cosmético.
 *
 * La comparación era de cadenas exactas, así que en Windows daba **falsa alarma**:
 * git deja el archivo con CRLF al hacer checkout o merge, `renderCatalog()` lo
 * genera con LF, y la comprobación anunciaba «catálogo desactualizado» sobre un
 * archivo cuyo contenido era idéntico —`git diff` no mostraba ni una línea—.
 *
 * Pasó el 2026-08-12, dos veces en la misma sesión. El daño real no es el susto:
 * es que la salida correcta ante ese aviso es ejecutar `docs:catalog`, que
 * reescribe el archivo y produce un cambio de solo saltos de línea en el commit.
 * Una comprobación que avisa en falso es una que se acaba ignorando, y esta
 * comprueba algo que importa.
 */
const normalizar = (text) => text.replace(GENERATED_LINE, 'Generado: —').replace(/\r\n/g, '\n');

try {
    const onDisk = normalizar(readFileSync(OUTPUT, 'utf8'));
    const expected = normalizar(renderCatalog());

    if (onDisk !== expected) {
        fail(`${GENERATED_DOC} está desactualizado respecto al registro. Ejecuta: npm run docs:catalog`);
    }
} catch {
    fail(`${GENERATED_DOC} no existe. Ejecuta: npm run docs:catalog`);
}

// ── 5 bis. Los parámetros del modelo, publicados y sin caducar ──────────────
//
// Mismo trato que el catálogo, por la misma razón y con un matiz.
//
// LA MITAD DERIVABLE se compara letra a letra: si alguien toca una constante y
// no regenera, esto falla. Es lo que impide que el documento público siga
// diciendo «hacen falta 90 medios» cuatro días después de que sean 14 — que es
// literalmente lo que pasó con ESTUDIO_PUNTOS_CIEGOS.md este mes.
//
// LA MITAD MEDIDA no se puede comparar así: depende de la API y cambia cada
// media hora. Compararla dejaría la verificación en rojo permanente, y una
// verificación siempre roja se apaga. Lo que sí se comprueba es que no sea
// vieja, que es la diferencia entre un dato fechado y un dato caducado.

const MODELO_DOC = 'src/docs/modelo_sesgo.txt';

try {
    const enDisco = normalizar(readFileSync(MODELO_OUTPUT, 'utf8').replace(LINEA_GENERADO, 'Generado: —'));
    const esperado = normalizar(renderModelo().replace(LINEA_GENERADO, 'Generado: —'));

    if (enDisco !== esperado) {
        fail(`${MODELO_DOC} está desactualizado respecto al código. Ejecuta: npm run docs:modelo`);
    }
} catch {
    fail(`${MODELO_DOC} no existe. Ejecuta: npm run docs:modelo`);
}

const medido = leerMedido();
if (!medido?.fecha) {
    warn(`${MODELO_DOC} no lleva ninguna medición. Ejecuta: npm run docs:modelo -- --medir`);
} else {
    const dias = Math.floor((Date.now() - Date.parse(medido.fecha)) / 86_400_000);
    if (dias > DIAS_ANTES_DE_CADUCAR) {
        warn(
            `lo medido en ${MODELO_DOC} tiene ${dias} días (${medido.fecha}). ` +
            'Ejecuta: npm run docs:modelo -- --medir'
        );
    }
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

    /**
     * `ownerType: null` ES VÁLIDO Y SIGNIFICA «no consta quién lo controla».
     *
     * Pero cuesta más que un tipo cualquiera, y ese es justo el punto: para
     * poder decir «no lo sabemos» hay que decir CUÁNDO se buscó y DÓNDE. Sin
     * esas dos cosas, «no consta» es una afirmación sobre el mundo que envejece
     * sola —mañana pueden registrar al representante legal y la ficha seguiría
     * diciendo que no existe—. Con ellas es una afirmación sobre una consulta
     * concreta, que es lo único que podemos sostener.
     *
     * Si no se comprobara aquí, la salida cómoda sería poner `null` en cualquier
     * ficha incómoda y quedarse tan tranquilo. La regla lo impide: declarar la
     * ausencia es un trabajo documental, no un atajo para no hacerlo.
     */
    if (profile.ownerType === null) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.consultadoEl ?? '')) {
            fail(
                `${media.id}: la ficha declara la propiedad como no comprobada pero no dice ` +
                `cuándo se buscó. "consultadoEl" es obligatorio con ownerType null (AAAA-MM-DD).`
            );
        }

        if (!Array.isArray(profile.buscadoEn) || profile.buscadoEn.length === 0) {
            fail(
                `${media.id}: la ficha declara la propiedad como no comprobada sin decir dónde ` +
                `se buscó. "buscadoEn" necesita al menos un sitio consultado con su resultado.`
            );
        }

        for (const intento of profile.buscadoEn ?? []) {
            if (!intento?.fuente || !intento?.resultado) {
                fail(`${media.id}: cada entrada de "buscadoEn" necesita "fuente" y "resultado"`);
            }
            if (intento?.url && !/^https?:\/\/\S+$/.test(intento.url)) {
                fail(`${media.id}: url mal formada en "buscadoEn": "${intento.url}"`);
            }
        }

        warn(`${media.id}: propiedad NO comprobada, declarada como tal (buscado el ${profile.consultadoEl})`);
    } else if (!OWNER_TYPES[profile.ownerType]) {
        fail(`${media.id}: ownerType desconocido "${profile.ownerType}"`);
    }

    for (const field of ['holdings', 'notes', 'sources']) {
        if (!Array.isArray(profile[field])) {
            fail(`${media.id}: la ficha de propiedad necesita "${field}" como lista`);
        }
    }

    /*
     * QUIEN DIRIGE, EN POLÍTICA (regla del 2026-09-02). El aviso afirma algo
     * sobre una persona con nombre: sin fecha, sin fuente o con un hecho que no
     * sea candidatura o cargo público, no se publica. Y la fuente tiene que
     * estar también en `sources`, que es la lista que el lector ve.
     */
    for (const aviso of profile.direccion ?? []) {
        const donde = `${media.id}: aviso de dirección de «${aviso?.persona ?? '?'}»`;
        if (!aviso?.persona || !aviso?.cargoEnElMedio || !aviso?.detalle) {
            fail(`${donde} necesita persona, cargoEnElMedio y detalle`);
        }
        if (!['candidatura', 'cargo publico'].includes(aviso?.hecho)) {
            fail(`${donde}: "hecho" tiene que ser 'candidatura' o 'cargo publico', no "${aviso?.hecho}"`);
        }
        for (const campo of ['desde', 'publicadoEl']) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(aviso?.[campo] ?? '')) {
                fail(`${donde}: "${campo}" tiene que ser una fecha AAAA-MM-DD`);
            }
        }
        if (aviso?.hasta !== null && aviso?.hasta !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(aviso.hasta)) {
            fail(`${donde}: "hasta" tiene que ser null (vigente) o una fecha AAAA-MM-DD`);
        }
        if (!/^https?:\/\/\S+$/.test(aviso?.fuente ?? '')) {
            fail(`${donde}: "fuente" tiene que ser una URL`);
        } else if (!(profile.sources ?? []).includes(aviso.fuente)) {
            fail(`${donde}: la fuente del aviso no está en "sources", que es lo que el lector ve`);
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

/*
 * TECHO POR FEED. Un techo por debajo del general sería un muestreo escondido
 * con nombre propio —justo lo que la decisión del 2026-09-02 vino a quitar—, y
 * uno desmesurado convierte a un medio en el corpus entero. Se acota a 100,
 * que es lo que expone el feed más largo del catálogo.
 */
for (const feed of feeds) {
    if (feed.techo === null || feed.techo === undefined) continue;
    if (!Number.isInteger(feed.techo) || feed.techo <= 15 || feed.techo > 100) {
        fail(
            `${feed.name}: techo por feed inválido (${feed.techo}). Tiene que ser un entero ` +
            'mayor que 15 —el general— y como mucho 100.'
        );
    }
}

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
/*
 * ─────────────────────────────────────────────────────────────────────────────
 * `group` CONTRA `controlGroup`: dicen cosas distintas, y hay que poder verlo
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Son dos conceptos y está bien que lo sean. `group` es la MARCA editorial que
 * se enseña al lector; `controlGroup` es QUIÉN MANDA, y es lo que usa el mapa
 * de propiedad para medir concentración. Por eso La República figura como
 * «Editorial La República» en uno y bajo `ardila-lulle` en el otro: por marca
 * la casa tiene tres medios y por propiedad tiene cuatro.
 *
 * Lo que estaba mal no era la diferencia: era que NADA avisaba cuando se leen
 * como si fueran lo mismo. Y hay un fallo peor, silencioso y trivial de
 * cometer, que se coló el 2026-08-24: escribir «Organizacion Ardila Lulle» sin
 * tildes al dar de alta NTN24. La casa quedó PARTIDA EN DOS al agrupar por
 * `group`, y se descubrió por casualidad al contar medios.
 */
const porControl = new Map();
for (const medio of MEDIA_REGISTRY) {
    const perfil = OWNERSHIP_PROFILES[medio.id];
    if (!perfil?.controlGroup) continue;
    if (!porControl.has(perfil.controlGroup)) porControl.set(perfil.controlGroup, []);
    porControl.get(perfil.controlGroup).push(medio);
}

const casasConVariasMarcas = [];
for (const [control, medios] of porControl) {
    const marcas = [...new Set(medios.map((m) => m.group ?? '(sin group)'))];
    if (marcas.length > 1) casasConVariasMarcas.push({ control, medios: medios.length, marcas });
}

/*
 * VA COMO INFORMACIÓN Y NO COMO AVISO, a propósito.
 *
 * `gobiernos-locales` reúne cuatro canales públicos de cuatro administraciones
 * distintas: por naturaleza tendrá siempre cuatro marcas. Un aviso que sale
 * igual todas las semanas y nunca hay nada que hacer con él es exactamente como
 * se estropea un vigilante —lo mismo que este repositorio escribió a propósito
 * de Razón Pública—, y acaba tapando los avisos que sí importan.
 *
 * Pero la información vale: dice dónde el mapa de propiedad cuenta como un solo
 * dueño lo que el lector ve como marcas separadas, que es justo la afirmación
 * central del producto. Así que se enseña, sin gritar.
 */

/*
 * Y el que SÍ es error: dos cadenas de `group` que solo se diferencian en
 * tildes, mayúsculas o espacios. Eso nunca es intencionado, y parte la casa en
 * dos cubos sin que nadie lo note.
 */
const sinTildes = (g) =>
    g.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

const porNormal = new Map();
for (const medio of MEDIA_REGISTRY) {
    if (!medio.group) continue;
    const clave = sinTildes(medio.group);
    if (!porNormal.has(clave)) porNormal.set(clave, new Set());
    porNormal.get(clave).add(medio.group);
}

for (const [clave, variantes] of porNormal) {
    if (variantes.size > 1) {
        fail(
            `el grupo «${clave}» está escrito de ${variantes.size} formas distintas: ` +
            `${[...variantes].map((g) => `«${g}»`).join(' vs ')}. ` +
            'Se diferencian solo en tildes, mayúsculas o espacios, así que al agrupar ' +
            'por `group` la misma casa se parte en varios cubos. Unifícalas.'
        );
    }
}

console.log('─'.repeat(62));
console.log(`medios registrados        : ${MEDIA_REGISTRY.length}`);
console.log(`con feed de ingesta       : ${ingestedMedia.length} (${feeds.length} feeds)`);
console.log(`sin feed (solo referencia): ${MEDIA_REGISTRY.length - ingestedMedia.length}`);
console.log();
if (casasConVariasMarcas.length) {
    console.log('una casa, varias marcas (por propiedad, no por `group`):');
    for (const c of casasConVariasMarcas) {
        console.log(`  ${c.control.padEnd(22)} ${c.medios} medios · ${c.marcas.join(' · ')}`);
    }
    console.log();
}

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
