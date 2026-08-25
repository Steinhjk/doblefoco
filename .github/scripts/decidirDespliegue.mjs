/**
 * ¿Hay que desplegar el motor por lo que se acaba de empujar?
 *
 * Lo decide `shared/rutasDeLaImagen.js`, el mismo predicado que usa el
 * vigilante del desfase y que tiene 19 pruebas propias. Aquí no se duplica esa
 * lista: duplicarla sería crear un segundo sitio donde puede divergir, que es
 * la enfermedad que este repositorio lleva persiguiendo.
 *
 * Escribe `desplegar=si|no` y un `motivo` en las salidas del paso, para que el
 * trabajo siguiente decida y para que quede dicho en el registro por qué.
 */

import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const { llegaALaImagen } = await import(
    new URL(`file://${RAIZ}/doblefoco-app/shared/rutasDeLaImagen.js`).href
);

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', cwd: RAIZ }).trim();

function salida(desplegar, motivo) {
    console.log(`${desplegar === 'si' ? 'SE DESPLIEGA' : 'no se despliega'}: ${motivo}`);
    if (process.env.GITHUB_OUTPUT) {
        appendFileSync(process.env.GITHUB_OUTPUT, `desplegar=${desplegar}\nmotivo=${motivo}\n`);
    }
    if (process.env.GITHUB_STEP_SUMMARY) {
        appendFileSync(
            process.env.GITHUB_STEP_SUMMARY,
            `### Despliegue del motor\n\n**${desplegar === 'si' ? 'Sí' : 'No'}** — ${motivo}\n`
        );
    }
}

if (process.env.FORZAR === 'true') {
    salida('si', 'pedido a mano con «forzar»');
    process.exit(0);
}

const mensaje = process.env.MENSAJE ?? '';
if (mensaje.includes('[solo-cliente]')) {
    salida('no', 'el commit lleva [solo-cliente], así que se publica solo Vercel');
    process.exit(0);
}

const antes = process.env.ANTES ?? '';
/*
 * `github.event.before` viene a ceros cuando la rama es nueva o cuando el
 * empujón fue forzado. En ese caso no se puede saber qué cambió, y ante la duda
 * se despliega: perdonar de más silencia justo la avería que esto evita.
 */
const sinBase = !antes || /^0+$/.test(antes);
if (sinBase) {
    salida('si', 'no hay commit anterior con el que comparar (rama nueva o empujón forzado)');
    process.exit(0);
}

let cambiados;
try {
    cambiados = git('diff', '--name-only', `${antes}..${process.env.GITHUB_SHA ?? 'HEAD'}`)
        .split('\n')
        .filter(Boolean);
} catch {
    salida('si', 'no se pudo leer el diff, y ante la duda se despliega');
    process.exit(0);
}

if (!cambiados.length) {
    salida('no', 'el empujón no cambió ningún archivo');
    process.exit(0);
}

const relevantes = cambiados.filter(llegaALaImagen);

console.log(`archivos en el empujón: ${cambiados.length}`);
for (const r of cambiados) console.log(`  ${llegaALaImagen(r) ? 'LLEGA ' : '  ·   '} ${r}`);

if (relevantes.length) {
    salida('si', `${relevantes.length} archivo(s) llegan a la imagen: ${relevantes.slice(0, 4).join(', ')}`);
} else {
    salida('no', `ninguno de los ${cambiados.length} archivos llega a la imagen`);
}
