/**
 * El invariante del que depende la comparación en columnas — tarea F3-04.
 *
 * QUÉ PROTEGE
 * -----------
 * Las tres perspectivas se muestran en columnas paralelas con `subgrid`, de
 * modo que las cabeceras se alineen entre sí, los titulares entre sí y los
 * extras entre sí. Sin esa alineación las columnas no sirven: si cada titular
 * arranca a una altura distinta, el ojo no puede compararlos y se pierde
 * justamente lo que esa pantalla existe para dar.
 *
 * `subgrid` exige que cada tarjeta emita EXACTAMENTE tres hijos, uno por banda.
 * Añadir un cuarto elemento suelto —un aviso, una fecha, lo que sea— lo empuja
 * a una fila implícita y desalinea esa columna respecto a las otras dos.
 *
 * POR QUÉ HACE FALTA UNA PRUEBA
 * -----------------------------
 * Ese fallo no produce ningún error. No lo ve el lint, ni `tsc`, ni el build:
 * la página se pinta, simplemente deja de comparar. Es exactamente la clase de
 * defecto que se descubre meses después, o nunca.
 *
 * SE LEE EL FUENTE COMO TEXTO, igual que schema.test.js con el .sql. Comprobar
 * esto de verdad exigiría montar un renderizador de componentes y medir
 * posiciones en un navegador; lo que se quiere garantizar aquí es la ESTRUCTURA
 * que el CSS presupone, y esa está en el fuente.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FUENTE = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), 'NewsDetail.jsx'),
    'utf8'
);

const CSS = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), 'NewsDetail.css'),
    'utf8'
);

/** El cuerpo del componente de tarjeta, separado en sus dos variantes. */
function variantesDeTarjeta() {
    const bloque = FUENTE.slice(
        FUENTE.indexOf('const PerspectiveCard'),
        FUENTE.indexOf('const NewsDetail')
    );

    const ultimoReturn = bloque.lastIndexOf('return (');

    return {
        sinCobertura: bloque.slice(bloque.indexOf('if (!perspective)'), ultimoReturn),
        conTitular: bloque.slice(ultimoReturn),
    };
}

/** Cuenta los elementos que ocupan una banda de la retícula. */
function contarBandas(fragmento) {
    const bandas = [
        'perspective-card-header',
        'perspective-headline',
        'perspective-empty-body',
        'perspective-extras',
    ];

    return bandas.reduce((total, clase) => {
        const apariciones = fragmento.match(new RegExp(`className="${clase}"`, 'g')) ?? [];
        return total + apariciones.length;
    }, 0);
}

describe('comparación en columnas paralelas (F3-04)', () => {
    const { sinCobertura, conTitular } = variantesDeTarjeta();

    it('la tarjeta CON titular emite exactamente 3 bandas', () => {
        expect(contarBandas(conTitular)).toBe(3);
    });

    it('la tarjeta SIN cobertura emite exactamente 3 bandas', () => {
        // Lleva una banda de extras vacía a propósito. Sin ella, la columna de
        // la ausencia tendría dos filas y las otras tres, y los titulares de al
        // lado se desplazarían. La ausencia de cobertura es la señal que hace
        // valioso al producto: tiene que leerse a la altura de los titulares
        // con los que compite, no como una nota al pie.
        expect(contarBandas(sinCobertura)).toBe(3);
    });

    it('lo opcional va agrupado, no suelto en la retícula', () => {
        // Extracto, términos con carga y "otros medios" son opcionales. Si cada
        // uno fuera una banda, una columna con extracto y otra sin él
        // desalinearían todo lo de abajo.
        for (const clase of ['perspective-snippet', 'perspective-tone-note', 'perspective-more-outlets']) {
            const posicion = conTitular.indexOf(`className="${clase}"`);
            if (posicion === -1) continue;

            const aperturaExtras = conTitular.indexOf('className="perspective-extras"');
            expect(aperturaExtras, `${clase} debe ir dentro de perspective-extras`).toBeGreaterThan(-1);
            expect(posicion).toBeGreaterThan(aperturaExtras);
        }
    });

    it('el CSS declara la retícula compartida y su respaldo', () => {
        expect(CSS).toContain('grid-template-rows: subgrid');
        expect(CSS).toContain('grid-row: span 3');
        // Sin subgrid no se puede garantizar la alineación, y desalinear en
        // silencio es peor que apilar: se vuelve a la pila vertical.
        expect(CSS).toContain('@supports not (grid-template-rows: subgrid)');
    });
});
