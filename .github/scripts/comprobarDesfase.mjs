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
const { llegaALaImagen } = await import(
    new URL(`file://${RAIZ}/doblefoco-app/shared/rutasDeLaImagen.js`).href
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
/** Cosas que conviene decir en voz alta aunque no sean un desfase. */
const notas = [];

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
    /*
     * UN COMMIT DE DIFERENCIA NO ES UN DESFASE: LO ES UN COMMIT QUE CAMBIE LA
     * IMAGEN (2026-08-21).
     *
     * Antes esto era una igualdad estricta, y el 2026-08-21 quedó listo para
     * gritar «Fly está 1 commit por detrás» porque se habían escrito dos `.md`.
     * Hubo que pagar un despliegue entero para callarlo, y un vigilante que da
     * alarmas falsas es un vigilante al que se deja de hacer caso — que es
     * justo la avería que este archivo existe para evitar.
     *
     * Se sigue midiendo lo mismo que decía la cabecera: si Fly corre el CÓDIGO
     * de main. `llegaALaImagen` lleva la lista de lo que se perdona, se equivoca
     * a propósito hacia el lado de gritar, y tiene sus propias pruebas.
     */
    let detras = null;
    let cambiados = null;
    try {
        detras = execFileSync(
            'git', ['rev-list', '--count', `${commitDesplegado}..${commitEnMain}`],
            { encoding: 'utf8' }
        ).trim();
        cambiados = execFileSync(
            'git', ['diff', '--name-only', `${commitDesplegado}..${commitEnMain}`],
            { encoding: 'utf8' }
        ).split('\n').map((l) => l.trim()).filter(Boolean);
    } catch {
        // El commit desplegado puede no existir en este clon: rama borrada, o
        // una imagen construida desde algo que nunca se subió.
    }

    if (cambiados === null) {
        problemas.push(
            'El commit desplegado no coincide con main y NO SE PUDO MEDIR qué cambió; ' +
            'puede venir de una rama que ya no existe. No se da por bueno: una ' +
            'comprobación que calla cuando no puede comprobar es peor que no tenerla.'
        );
    } else {
        const relevantes = cambiados.filter(llegaALaImagen);
        if (relevantes.length) {
            const muestra = relevantes.slice(0, 5).map((r) => `\n        ${r}`).join('');
            const resto = relevantes.length > 5 ? `\n        …y ${relevantes.length - 5} más` : '';
            problemas.push(
                `Fly está ${detras} commit(s) por detrás de main, y ${relevantes.length} ` +
                `archivo(s) que SÍ llegan a la imagen han cambiado:${muestra}${resto}`
            );
        } else {
            notas.push(
                `Fly está ${detras} commit(s) por detrás de main, pero ninguno de los ` +
                `${cambiados.length} archivo(s) cambiados llega a la imagen ` +
                '(prosa, pruebas o workflows). No hay nada que desplegar.'
            );
        }
    }
}

/**
 * SE USA `process.exitCode`, NO `process.exit()`, Y NO ES INDIFERENTE.
 *
 * `process.exit()` aquí aborta el proceso mientras el socket del `fetch` aún se
 * está cerrando. En Windows eso dispara una aserción de libuv —«Assertion
 * failed: !(handle->flags & UV_HANDLE_CLOSING)»— y el proceso muere con código
 * -1073740791 DESPUÉS de haber impreso que todo está bien.
 *
 * En una comprobación cuyo único propósito es avisar, eso es el peor fallo
 * posible: el workflow saldría en rojo con el despliegue perfectamente al día, y
 * unas cuantas falsas alarmas bastan para que nadie vuelva a mirar el aviso. Es
 * exactamente el problema que costó los correos falsos de Actions, reaparecido
 * en la herramienta que se hizo para evitarlo.
 *
 * Con `exitCode`, Node termina cuando el socket se cierra solo. Tarda unos
 * segundos más y no miente.
 */
for (const n of notas) console.log(`  · ${n}`);
if (notas.length) console.log('');

if (!problemas.length) {
    console.log(
        notas.length
            ? '  ✓ Al día en lo que importa: la imagen corre el código de main.\n'
            : '  ✓ Al día: mismo commit y mismo número de feeds.\n'
    );
} else {
    console.error('  ✗ DESFASE\n');
    for (const p of problemas) console.error(`    · ${p}`);
    console.error('\n  Se corrige con:  cd doblefoco-app && npm run deploy\n');
    process.exitCode = 1;
}
