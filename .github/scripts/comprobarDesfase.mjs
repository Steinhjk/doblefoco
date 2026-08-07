/**
 * ¿Corre Fly lo que hay en main? Lo ejecuta .github/workflows/desfase.yml.
 *
 * Sale con 1 cuando hay desfase, para que el fallo del workflow sea el aviso.
 * No manda correos por su cuenta: GitHub ya avisa de los workflows que fallan,
 * y añadir un segundo canal sería otra cosa que mantener.
 */

import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const { getIngestFeeds } = await import(
    new URL(`file://${RAIZ}/doblefoco-app/shared/mediaRegistry.js`).href
);

const URL_SALUD = process.env.SALUD_URL ?? 'https://doblefoco.fly.dev/api/health';

const respuesta = await fetch(URL_SALUD, { signal: AbortSignal.timeout(20_000) });
const salud = await respuesta.json();

const commitDesplegado = salud?.version?.commit ?? 'desconocido';
const feedsDesplegados = salud?.version?.feeds ?? null;
const feedsEnMain = getIngestFeeds().length;
const commitEnMain = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

console.log('\n  ESTADO DEL DESPLIEGUE\n');
console.log(`  main    ${commitEnMain}   ${feedsEnMain} feeds`);
console.log(`  Fly     ${commitDesplegado}   ${feedsDesplegados ?? '?'} feeds`);
console.log('');

const problemas = [];

// ── 1. Feeds. Funciona aunque la imagen no esté marcada. ────────────────────
if (feedsDesplegados === null) {
    problemas.push(
        'La API no publica `version.feeds`. O está desplegada una versión anterior a ' +
        'esta comprobación, o /api/health cambió de forma.'
    );
} else if (feedsDesplegados !== feedsEnMain) {
    problemas.push(
        `El motor lee ${feedsDesplegados} feeds y el registro de main tiene ${feedsEnMain}. ` +
        'Fly está atrasada: hay medios del catálogo que no se están consultando.'
    );
}

// ── 2. Commit. Más preciso, pero solo si se desplegó con `npm run deploy`. ──
if (commitDesplegado === 'desconocido') {
    problemas.push(
        'La imagen no está marcada con su commit, así que NO SE PUEDE COMPROBAR si el ' +
        'código desplegado es el de main. Se desplegó con `fly deploy` a secas; usar ' +
        '`npm run deploy`.'
    );
} else if (commitDesplegado !== commitEnMain) {
    let detras = null;
    try {
        detras = execFileSync(
            'git', ['rev-list', '--count', `${commitDesplegado}..${commitEnMain}`],
            { encoding: 'utf8' }
        ).trim();
    } catch {
        // El commit desplegado puede no existir en este clon: rama borrada, o
        // una imagen construida desde algo que nunca se subió.
    }
    problemas.push(
        detras && detras !== '0'
            ? `Fly está ${detras} commit(s) por detrás de main.`
            : 'El commit desplegado no coincide con main y no se pudo medir la distancia; ' +
              'puede venir de una rama que ya no existe.'
    );
}

if (!problemas.length) {
    console.log('  ✓ Al día: mismo commit y mismo número de feeds.\n');
    process.exit(0);
}

console.error('  ✗ DESFASE\n');
for (const p of problemas) console.error(`    · ${p}`);
console.error('\n  Se corrige con:  cd doblefoco-app && npm run deploy\n');
process.exit(1);
