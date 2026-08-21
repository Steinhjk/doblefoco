// @ts-check
import { describe, it, expect } from 'vitest';
import { llegaALaImagen } from './rutasDeLaImagen.js';

/**
 * LO QUE ESTA PRUEBA PROTEGE NO ES UN CÁLCULO, ES UN VIGILANTE.
 *
 * `comprobarDesfase.mjs` avisa de que Fly no corre lo que hay en `main`. Si este
 * predicado perdona de más, el aviso no llega y volvemos a la avería que ya
 * mordió dos veces —seis días con el motor leyendo 37 feeds—. Si perdona de
 * menos, solo hay una alarma sobrante.
 *
 * Los dos errores no cuestan lo mismo, así que las pruebas cargan hacia el lado
 * caro: la mayoría comprueban que algo SÍ llega.
 */
describe('llegaALaImagen', () => {
    describe('lo que sí llega, y por tanto es desfase de verdad', () => {
        it.each([
            ['doblefoco-app/server/db/contentStore.js', 'el runtime copia server/'],
            ['doblefoco-app/shared/opinion.js', 'el runtime copia shared/'],
            ['doblefoco-app/scripts/ingestWorker.mjs', 'el runtime copia scripts/'],
            ['doblefoco-app/certs/supabase-prod-ca-2021.crt', 'el runtime copia certs/'],
            ['doblefoco-app/package.json', 'el runtime lo copia, y manda en las dependencias'],
            ['doblefoco-app/src/pages/MediaMap.jsx', 'la etapa build lo mete en dist/'],
            ['doblefoco-app/index.html', 'la etapa build lo mete en dist/'],
            ['doblefoco-app/vite.config.js', 'decide cómo se compila dist/'],
            ['doblefoco-app/Dockerfile', 'define la imagen entera'],
            ['doblefoco-app/.dockerignore', 'decide qué entra en el contexto'],
            [
                'doblefoco-app/auditoria/hallazgos.json',
                'EstadoDeLaAuditoria.jsx lo importa, así que acaba empaquetado',
            ],
        ])('%s llega (%s)', (ruta) => {
            expect(llegaALaImagen(ruta)).toBe(true);
        });
    });

    describe('lo que se perdona, y hay que poder demostrarlo', () => {
        it('la prosa de la raíz del repositorio, que ni siquiera entra en el contexto', () => {
            // El caso que provocó todo esto el 2026-08-21.
            expect(llegaALaImagen('MINUTA.md')).toBe(false);
            expect(llegaALaImagen('README.md')).toBe(false);
        });

        it('`.github/`, que gobierna los workflows y no la imagen', () => {
            expect(llegaALaImagen('.github/workflows/desfase.yml')).toBe(false);
            expect(llegaALaImagen('.github/scripts/comprobarDesfase.mjs')).toBe(false);
        });

        it('la prosa de dentro de doblefoco-app: entra en el contexto, pero no la ejecuta nada', () => {
            expect(llegaALaImagen('doblefoco-app/SIGUIENTE.md')).toBe(false);
            expect(llegaALaImagen('doblefoco-app/ESTUDIO_GROUND_NEWS.md')).toBe(false);
        });

        it('las pruebas, que están en .dockerignore y no entran en el paquete', () => {
            expect(llegaALaImagen('doblefoco-app/shared/opinion.test.js')).toBe(false);
            expect(llegaALaImagen('doblefoco-app/src/components/EstadoDeLaAuditoria.test.jsx')).toBe(
                false,
            );
        });
    });

    describe('ante la duda, desfase', () => {
        it('una extensión desconocida dentro del contexto NO se perdona', () => {
            /*
             * El día que alguien añada un `.yaml` de configuración o un `.wasm`,
             * el vigilante debe gritar hasta que alguien decida. Perdonar por
             * defecto es como se silencia una avería sin querer.
             */
            expect(llegaALaImagen('doblefoco-app/server/config.yaml')).toBe(true);
            expect(llegaALaImagen('doblefoco-app/algo.nuevo')).toBe(true);
        });

        it('un .md no se perdona si no está en el contexto de otra forma rara', () => {
            // `.md` solo se perdona por la extensión, no por vivir en un sitio.
            expect(llegaALaImagen('doblefoco-app/server/LEEME.md')).toBe(false);
            expect(llegaALaImagen('doblefoco-app/server/LEEME.md.js')).toBe(true);
        });

        it('entradas vacías o no textuales no afirman nada', () => {
            expect(llegaALaImagen('')).toBe(false);
            // La guarda de tipo en tiempo de ejecución existe porque
            // `git diff --name-only` puede devolver una línea vacía al final, y
            // porque quien llame desde un `.mjs` no tiene tipos que le avisen.
            expect(llegaALaImagen(/** @type {any} */ (null))).toBe(false);
            expect(llegaALaImagen(/** @type {any} */ (undefined))).toBe(false);
        });

        it('no se perdona un archivo por parecerse al contexto sin estarlo', () => {
            expect(llegaALaImagen('doblefoco-app-viejo/server/index.js')).toBe(false);
            expect(llegaALaImagen('otra-cosa/doblefoco-app/server/index.js')).toBe(false);
        });
    });
});
