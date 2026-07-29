/**
 * Las listas blancas de JavaScript coinciden con las de SQL.
 *
 * POR QUÉ EXISTE
 * -------------
 * Los valores admitidos de `reader_reports.kind` y de `moderation.state` están
 * declarados DOS VECES: como constante en JavaScript, que es lo que rechaza el
 * endpoint con un 400, y como `CHECK` en schema.sql, que es lo que rechaza la
 * base con una violación de restricción.
 *
 * Nada comprobaba que coincidieran. Añadir un tipo a la lista de JavaScript y
 * olvidar el CHECK produce un fallo que solo aparece en ejecución, cuando
 * alguien usa el valor nuevo: el endpoint lo acepta, la base lo rechaza y el
 * lector recibe un 500 sin explicación. Al revés es más benigno pero igual de
 * confuso: la base lo aceptaría y el endpoint lo rechaza.
 *
 * Es la misma clase de problema que motivó F1-04 —el mismo hecho declarado en
 * dos sitios que pueden divergir en silencio— y se resuelve igual: con una
 * comprobación automática, no con cuidado.
 *
 * Se lee el .sql como texto a propósito. Verificar esto contra una base real
 * exigiría credenciales en CI, y lo que se quiere comprobar es la coherencia de
 * lo que está ESCRITO, que es donde ocurre la divergencia.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPORT_KINDS } from './reportStore.js';

const SCHEMA = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), 'schema.sql'),
    'utf8'
);

/**
 * Extrae los literales de un `CHECK (columna IN ('a', 'b', …))`.
 * Devuelve null si la restricción no está, que es un fallo distinto y merece
 * un mensaje distinto.
 */
function valoresDelCheck(columna) {
    const patron = new RegExp(`CHECK\\s*\\(\\s*${columna}\\s+IN\\s*\\(([^)]*)\\)`, 'i');
    const encontrado = SCHEMA.match(patron);
    if (!encontrado) return null;

    return [...encontrado[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe('coherencia entre las listas blancas de JS y las de SQL', () => {
    it('reader_reports.kind admite exactamente los REPORT_KINDS de JavaScript', () => {
        const enSql = valoresDelCheck('kind');

        expect(enSql, 'falta el CHECK de kind en schema.sql').not.toBeNull();
        expect([...enSql].sort()).toEqual([...REPORT_KINDS].sort());
    });

    it('moderation.state admite exactamente los estados que acepta el endpoint', () => {
        // 'pendiente' NO está aquí a propósito: en el modelo de F2-02 lo
        // pendiente es la AUSENCIA de fila, no un estado almacenado. El
        // endpoint sí lo acepta como instrucción —significa "borra la
        // decisión"— y por eso las dos listas son distintas y deben serlo.
        const enSql = valoresDelCheck('state');

        expect(enSql, 'falta el CHECK de state en schema.sql').not.toBeNull();
        expect([...enSql].sort()).toEqual(['aprobada', 'rechazada']);
    });

    it('dominant_spectrum y blindspot_spectrum usan el vocabulario de biasAnalysis', () => {
        // Los espectros salen de shared/biasAnalysis.js y viajan hasta las
        // columnas de `stories`. Si alguien renombrara una banda allí, estas
        // columnas dejarían de aceptar lo que el motor intenta escribir.
        expect(valoresDelCheck('dominant_spectrum')?.sort()).toEqual(['center', 'left', 'right']);
        expect(valoresDelCheck('blindspot_spectrum')?.sort()).toEqual(['left', 'right']);
    });
});
