/**
 * Genera src/docs/catalogo_medios.txt a partir de shared/mediaRegistry.js.
 *
 * Ejecutar con: npm run docs:catalog
 *
 * Por qué se genera y no se escribe a mano
 * ----------------------------------------
 * El catálogo público estaba escrito a mano en dos documentos
 * (metodologia.txt y criterios_clasificacion_medios.txt) y ninguno coincidía
 * con el código: Semana aparecía en +0.65 ante el lector y valía +0.45 en el
 * motor; Noticias RCN, +0.45 frente a +0.25. El sitio le mostraba al público
 * una clasificación distinta de la que usaba para clasificar.
 *
 * Un documento escrito a mano vuelve a divergir en la primera edición. Uno
 * generado no puede: si el registro cambia, el documento cambia con él, y
 * `npm run check:registry` falla si alguien lo edita a mano y se desincroniza.
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { MEDIA_REGISTRY, SPECTRUM_BANDS, getBand } from '../shared/mediaRegistry.js';

const here = dirname(fileURLToPath(import.meta.url));
export const OUTPUT = resolve(here, '../src/docs/catalogo_medios.txt');

/**
 * La fecha de generación es la única línea que cambia sin que cambie el
 * catálogo. `npm run check:registry` compara el documento con lo que el
 * registro produciría hoy, así que tiene que poder ignorarla.
 */
export const GENERATED_LINE = /^Generado: \d{4}-\d{2}-\d{2}$/m;

const fmtBias = (bias) => `${bias >= 0 ? '+' : '−'}${Math.abs(bias).toFixed(2)}`;
/**
 * `factuality: null` SE PINTA «sin medir», NUNCA «0%».
 *
 * Esto decía `${Math.round(value * 100)}%` a secas, y con null eso da 0. O sea
 * que el catálogo público —el documento cuya cabecera promete que lo que se
 * publica aquí es exactamente lo que usa el sistema— afirmaba que DIECIOCHO
 * medios reales tienen un 0 % de rigor factual. No es un redondeo desafortunado:
 * es la peor nota posible, publicada con nombre y apellidos, sobre medios a los
 * que no se ha medido nada.
 *
 * Y anulaba la decisión del 2026-08-09 que hizo válida la factualidad no medida.
 * Aquella existe para no tener que inventar un número de rigor al dar de alta un
 * medio; si el documento lo convierte en un 0, el número inventado vuelve por la
 * puerta de atrás y encima es el más dañino de todos.
 *
 * La interfaz ya lo hacía bien —`fmtPct` en src/pages/MediaMap.jsx dice «sin
 * medir»— así que esto era además una divergencia entre lo que el lector ve en
 * el mapa y lo que lee en el catálogo. Se usa la misma palabra a propósito.
 */
const fmtFactuality = (value) =>
    typeof value === 'number' ? `${Math.round(value * 100)}%` : 'sin medir';

/** Envuelve texto a un ancho fijo, con sangría, para leerlo en <pre>. */
function wrap(text, width, indent) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';

    for (const word of words) {
        if (line && (line + ' ' + word).length > width) {
            lines.push(line);
            line = word;
        } else {
            line = line ? `${line} ${word}` : word;
        }
    }
    if (line) lines.push(line);

    return lines.map((l) => indent + l).join('\n');
}

export function renderCatalog() {
const lines = [];
const push = (text = '') => lines.push(text);

push('CATÁLOGO DE MEDIOS CLASIFICADOS — SINCUENTO.CO');
push('='.repeat(70));
push();
push(wrap(
    'Este documento se genera automáticamente desde el catálogo que usa el ' +
    'motor (shared/mediaRegistry.js). No se edita a mano: lo que usted lee ' +
    'aquí es exactamente el valor con el que el sistema clasifica cada ' +
    'noticia. Si los dos pudieran divergir, esta página no serviría de nada.',
    70, ''
));
push();
push(`Generado: ${new Date().toISOString().slice(0, 10)}`);
push(`Medios en el catálogo: ${MEDIA_REGISTRY.length}`);
push();
push(wrap(
    'ESTADO DE REVISIÓN: ninguno de estos valores ha pasado todavía por ' +
    'revisión editorial formal. Son juicios documentados —cada uno lleva ' +
    'escrita su justificación— que unifican los valores que antes estaban ' +
    'dispersos por el código, pero nadie los ha firmado. Se marcan como ' +
    'PROVISIONALES hasta que ocurra. Lo decimos aquí porque clasificar a un ' +
    'medio real es la afirmación más discutible que hace este sitio.',
    70, ''
));
push();

const byBand = new Map(SPECTRUM_BANDS.map((band) => [band.id, []]));
for (const media of MEDIA_REGISTRY) {
    byBand.get(getBand(media.bias).id).push(media);
}

for (const band of SPECTRUM_BANDS) {
    const group = byBand.get(band.id).sort((a, b) => a.bias - b.bias);

    push('-'.repeat(70));
    const count = `${group.length} ${group.length === 1 ? 'medio' : 'medios'}`;
    push(`${band.label.toUpperCase()}  [${fmtBias(band.min)} a ${fmtBias(band.max)})  —  ${count}`);
    push('-'.repeat(70));
    push();

    if (!group.length) {
        push(wrap(
            'Ningún medio del catálogo cae en esta banda. La ausencia es un ' +
            'dato, no un olvido: mientras siga vacía, el sistema no puede ' +
            'detectar puntos ciegos que dependan de ella.',
            66, '  '
        ));
        push();
        continue;
    }

    for (const media of group) {
        const feed = media.feed?.url
            ? (media.feed.via === 'gnews' ? 'vía Google News' : 'RSS propio')
            : 'sin feed (solo referencia)';
        const review = media.reviewedAt ? `revisado ${media.reviewedAt}` : 'PROVISIONAL';

        push(`  ${media.name}  ·  sesgo ${fmtBias(media.bias)}  ·  factualidad ${fmtFactuality(media.factuality)}`);
        push(`    ${media.domain} · ${media.group} · ${media.country} · ${feed} · ${review}`);
        push(wrap(media.biasRationale, 66, '    '));
        push();
    }
}

push('-'.repeat(70));
push('CÓMO LEER ESTOS NÚMEROS');
push('-'.repeat(70));
push();
push(wrap(
    'El sesgo describe la línea editorial histórica de una organización, no ' +
    'la calidad ni la veracidad de una noticia concreta. Un medio con sesgo ' +
    'marcado puede ser riguroso, y uno de centro puede equivocarse.',
    70, ''
));
push();
push(wrap(
    'La factualidad es el historial de rigor del medio: correcciones ' +
    'publicadas, rectificaciones, contraste con verificadores. Tampoco ' +
    'evalúa la noticia que usted está leyendo.',
    70, ''
));
push();
push(wrap(
    'Si cree que una clasificación está mal, escríbanos con ejemplos ' +
    'concretos de cobertura. Los valores están pensados para ser discutidos, ' +
    'y por eso cada uno lleva su justificación al lado.',
    70, ''
));
push();

return lines.join('\n');
}

// Solo escribe cuando se invoca como script. Importado, únicamente expone
// renderCatalog() para que el verificador pueda comparar sin tocar el disco.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    const content = renderCatalog();
    writeFileSync(OUTPUT, content, 'utf8');
    console.log(
        `Escrito ${OUTPUT} (${content.split('\n').length} líneas, ${MEDIA_REGISTRY.length} medios)`
    );
}
