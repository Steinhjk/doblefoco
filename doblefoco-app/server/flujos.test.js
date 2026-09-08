// @ts-check
import { describe, it, expect } from 'vitest';
import { globSync, readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * EL TIMBRE QUE NO SONABA, Y POR QUÉ ESTA PRUEBA MIRA UN .YML.
 *
 * El 2026-08-31 y el 2026-09-01 se les puso timbre a los cinco vigilantes: al
 * fallar abren un issue asignado, y al recuperarse lo cierran. Para meter la
 * salida completa dentro del issue, cada paso pasó a escribirse así:
 *
 *     run: node scripts/loQueSea.mjs 2>&1 | tee "$RUNNER_TEMP/salida.txt"
 *
 * Y ahí se rompió todo lo demás. El shell por defecto de Actions es
 * `bash -e {0}` —sin `pipefail`—, así que el código de una TUBERÍA es el del
 * último mandato: el de `tee`, que es siempre 0. El paso queda en verde, y con
 * él `steps.<id>.outcome`, que es justo lo que deciden los `if:` que abren el
 * issue y los que ponen el job en rojo.
 *
 * O SEA QUE EL MISMO CAMBIO QUE LES DIO VOZ LES QUITÓ EL FALLO. Medido el
 * 2026-09-08: la vigilancia imprimió «✗ HAY QUE MIRAR ESTO · Telecaribe (26d)»
 * en la ejecución de las 15:45 UTC y GitHub la marcó como exitosa. Doce días
 * acusando a un medio mudo sin que nadie se enterara, y no por falta de
 * detección —la detección funcionaba— sino porque el aviso no llegaba a nacer.
 *
 * Se comprueba el fichero como texto, igual que `archivo.test.js` con las
 * consultas: es una propiedad de lo ESCRITO, y ejecutar los workflows para
 * verlo costaría una hora de CI por cada cambio.
 *
 * CÓMO SE DECLARA UNA EXCEPCIÓN, y hay dos legítimas —la auditoría y el
 * centinela deciden por su resumen en JSON, no por el código de salida—:
 * escribiendo «EL CODIGO DE SALIDA NO IMPORTA AQUI» en el comentario del paso.
 * Como en el archivo, la excepción tiene que ser una decisión escrita.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const FLUJOS = resolve(AQUI, '..', '..', '.github', 'workflows');

const ficheros = globSync('*.yml', { cwd: FLUJOS }).map((f) => ({
    nombre: f.split(sep).join('/'),
    texto: readFileSync(resolve(FLUJOS, f), 'utf8'),
}));

/**
 * Los bloques `run:` que terminan en una tubería, con el texto que los rodea.
 *
 * La ventana hacia atrás cubre el comentario del paso, que es donde se declara
 * la excepción; la de delante, las líneas que puedan rescatar el código.
 */
function tuberiasConTee(texto) {
    const trozos = [];
    const re = /\|\s*tee\s/g;
    let m;
    while ((m = re.exec(texto))) {
        trozos.push(texto.slice(Math.max(0, m.index - 900), m.index + 300));
    }
    return trozos;
}

describe('los flujos de GitHub', () => {
    it('hay flujos que mirar', () => {
        expect(ficheros.length).toBeGreaterThanOrEqual(8);
    });

    it('ninguna tubería con `tee` se traga el código de salida sin declararlo', () => {
        const culpables = [];
        for (const { nombre, texto } of ficheros) {
            for (const t of tuberiasConTee(texto)) {
                if (t.includes('PIPESTATUS')) continue;
                if (t.includes('EL CODIGO DE SALIDA NO IMPORTA AQUI')) continue;
                // Una tubería dentro de un bloque `{ ... } | tee` que ya
                // recupera su código más abajo también vale.
                culpables.push(`${nombre}: ${t.slice(-160).replace(/\s+/g, ' ')}`);
            }
        }

        expect(
            culpables,
            'una tubería con `tee` cuyo fallo no puede llegar a `steps.<id>.outcome`'
        ).toEqual([]);
    });

    it('los cuatro vigilantes que deciden por el código de salida lo rescatan', () => {
        // Nombrados uno a uno: si mañana alguien reescribe uno de estos pasos
        // sin `PIPESTATUS`, la prueba de arriba lo acusa; esta dice además
        // cuáles son los que NO pueden perderlo.
        for (const flujo of ['vigilancia.yml', 'desfase.yml', 'backup.yml', 'archivo.yml']) {
            const texto = ficheros.find((f) => f.nombre === flujo)?.texto ?? '';
            expect(texto, `${flujo} sin rescate del código de salida`).toMatch(/PIPESTATUS/);
        }
    });
});
