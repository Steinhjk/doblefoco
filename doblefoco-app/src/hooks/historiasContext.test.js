// @ts-check
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(AQUI, '..');

function fuentes(dir) {
    const salida = [];
    for (const entrada of readdirSync(dir)) {
        const ruta = join(dir, entrada);
        if (statSync(ruta).isDirectory()) salida.push(...fuentes(ruta));
        else if (/\.(jsx?|tsx?)$/.test(entrada) && !/\.test\./.test(entrada)) salida.push(ruta);
    }
    return salida;
}

/**
 * LA INVARIANTE QUE MANTIENE UNA SOLA CONSULTA (T2-2).
 *
 * Esto no prueba comportamiento, prueba que el defecto no puede volver. Cinco
 * componentes pedían las historias por su cuenta —la barra, el destacado, las
 * dos laterales y el feed— y enseñaban cinco fotografías de instantes
 * distintos; el arreglo consiste en que ahora solo hay un sitio que pide.
 *
 * Se lee el fuente como texto, igual que hacen las pruebas de disposición con su
 * CSS: montar el árbol exigiría un renderizador, y lo que hay que garantizar
 * —que nadie abra una segunda tubería— está escrito en los imports.
 *
 * Si algún día hace falta una consulta aparte de verdad, la forma de añadirla es
 * cambiar esta lista y decir por qué en el mismo commit, no rodearla.
 */
describe('una sola consulta de historias', () => {
    const PERMITIDOS = ['components/ProveedorDeHistorias.jsx'];

    it('solo el proveedor llama a useStories', () => {
        const culpables = fuentes(SRC)
            .filter((ruta) => /from '[^']*hooks\/useStories'/.test(readFileSync(ruta, 'utf8')))
            .map((ruta) => relative(SRC, ruta).replace(/\\/g, '/'))
            .filter((ruta) => !PERMITIDOS.includes(ruta));

        expect(culpables).toEqual([]);
    });

    it('el proveedor sigue estando por encima de la barra y de las rutas', () => {
        const shell = readFileSync(resolve(SRC, 'Shell.jsx'), 'utf8');
        const proveedor = shell.indexOf('<ProveedorDeHistorias>');
        const navbar = shell.indexOf('<Navbar />');
        const rutas = shell.indexOf('<Rutas />');

        expect(proveedor).toBeGreaterThan(-1);
        expect(proveedor).toBeLessThan(navbar);
        expect(proveedor).toBeLessThan(rutas);
    });

    /**
     * El interruptor se llama `encendido` y no `activo` porque dentro del efecto
     * de `useStories` ya hay un `let activo` que es su bandera de cancelación.
     * Con los dos nombres iguales la página entera se caía con «Cannot access
     * 'activo' before initialization» —y ninguna prueba lo vio, porque ninguna
     * monta el árbol; lo cazó abrir el navegador—.
     */
    it('el interruptor no se llama como la bandera de cancelación', () => {
        const fuente = readFileSync(resolve(SRC, 'hooks/useStories.js'), 'utf8');
        expect(fuente).toMatch(/encendido = true/);
        expect(fuente).toMatch(/let activo = true/);
        expect(fuente).not.toMatch(/activo = true \} = \{\}\)/);
    });
});
