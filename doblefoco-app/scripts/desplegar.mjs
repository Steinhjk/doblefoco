/**
 * DESPLIEGUE A FLY MARCANDO EL COMMIT.   Uso: npm run deploy
 *
 * Es `fly deploy` con el SHA del commit actual pasado como argumento de
 * construcción, para que la imagen sepa de dónde salió y /api/health lo pueda
 * publicar. Sin eso, el workflow `desfase.yml` no puede comprobar si Fly está
 * al día y lo dice como «no verificable».
 *
 * POR QUÉ UN SCRIPT Y NO UNA LÍNEA EN package.json: `$(git rev-parse HEAD)` no
 * se expande en Windows, donde los scripts de npm corren por cmd.exe. Una línea
 * que funciona en el portátil de quien la escribió y falla en el de al lado es
 * peor que no tenerla, porque el fallo es silencioso —se despliega igual, solo
 * que sin marcar—.
 *
 * AVISA SI EL ÁRBOL ESTÁ SUCIO. Desplegar con cambios sin confirmar produce una
 * imagen que dice venir de un commit cuyo contenido no es el que se desplegó.
 * Eso convierte la comprobación en una mentira, así que se pregunta antes.
 */

import { execFileSync, spawnSync } from 'node:child_process';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

let sha;
try {
    sha = git('rev-parse', 'HEAD');
} catch {
    console.error('\n  ✗ No se pudo leer el commit actual. ¿Es esto un repositorio git?\n');
    process.exit(1);
}

const sucio = git('status', '--porcelain');
const rama = git('rev-parse', '--abbrev-ref', 'HEAD');

console.log(`\n  Desplegando a Fly`);
console.log(`  rama   ${rama}`);
console.log(`  commit ${sha}`);

if (sucio) {
    const archivos = sucio.split('\n').length;
    console.log(`\n  ⚠ Hay ${archivos} archivo(s) sin confirmar.`);
    console.log('    La imagen quedará marcada con un commit cuyo contenido NO es');
    console.log('    exactamente lo que se despliega, y la comprobación de desfase');
    console.log('    dará por bueno algo que no lo es.');
    console.log('\n    Confirma o guarda los cambios y vuelve a intentarlo.\n');
    process.exit(1);
}

const r = spawnSync('fly', ['deploy', '--build-arg', `GIT_SHA=${sha}`], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
});

process.exit(r.status ?? 1);
