// @ts-check
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    CAMPOS_DE_ARTICULO,
    CAMPOS_QUE_NO_SE_GUARDAN,
    camposDesdeFila,
    columnasParaLeer,
    filaSimulada,
    sqlDeInsercion,
    valoresDeInsercion,
} from './contratoDeArticulo.js';

const AQUI = dirname(fileURLToPath(import.meta.url));

/** Un artículo con la forma que sale de la ingesta, con todos sus campos llenos. */
const ARTICULO = {
    id: 'abc123',
    headline: 'Niegan tutela de Iván Cepeda por Emisoras de Paz',
    rawTitle: 'Niegan tutela de Iván Cepeda por Emisoras de Paz | RTVC',
    link: 'https://www.rtvcnoticias.com/actualidad/niegan-tutela',
    snippet: 'La decisión se conoció el jueves y afecta a cuatro emisoras.',
    imageUrl: null,
    tone: { score: 0.2, terms: ['tutela'] },
    publishedAt: '2026-09-04T22:13:13.000Z',
    ingestedAtMs: Date.parse('2026-09-04T23:00:00.000Z'),
    category: 'Política',
    topics: ['justicia', 'politica'],
    ambito: 'nacional',
    feedCategories: ['Actualidad', 'Bogotá, D.C.'],
    outlet: { id: 'rtvc', name: 'RTVC Noticias' },
};

/**
 * LA IDA Y VUELTA, que es la prueba que la revisión externa pedía por su nombre.
 *
 * No comprueba que el SQL sea válido —eso se comprueba ejecutándolo, y así se
 * cazó el `$14` que faltaba—: comprueba que las dos mitades del contrato encajan
 * entre sí, que es donde se han ido perdiendo campos.
 */
describe('el artículo baja y vuelve entero', () => {
    it('sobrevive el viaje completo', () => {
        const vuelto = camposDesdeFila(filaSimulada(ARTICULO));

        expect(vuelto.id).toBe(ARTICULO.id);
        expect(vuelto.link).toBe(ARTICULO.link);
        expect(vuelto.headline).toBe(ARTICULO.headline);
        expect(vuelto.rawTitle).toBe(ARTICULO.rawTitle);
        expect(vuelto.snippet).toBe(ARTICULO.snippet);
        expect(vuelto.category).toBe(ARTICULO.category);
        expect(vuelto.tone).toEqual(ARTICULO.tone);
        expect(vuelto.publishedAt).toBe(ARTICULO.publishedAt);
        expect(vuelto.ingestedAtMs).toBe(ARTICULO.ingestedAtMs);
        expect(vuelto.imageUrl).toBeNull();
        expect(vuelto.topics).toEqual(ARTICULO.topics);
        expect(vuelto.ambito).toBe(ARTICULO.ambito);
        expect(vuelto.sourceId).toBe('rtvc');
    });

    /**
     * El separador de las etiquetas es el TABULADOR y no la coma justamente por
     * este caso: «Bogotá, D.C.» es una sección de verdad de más de un medio.
     */
    it('una etiqueta con coma dentro no se parte en dos', () => {
        const vuelto = camposDesdeFila(filaSimulada(ARTICULO));
        expect(vuelto.feedCategories).toEqual(['Actualidad', 'Bogotá, D.C.']);
    });

    /**
     * Vacío y NULL no son lo mismo, y la diferencia la usa el recategorizador:
     * NULL es «nunca se clasificó» y `{}` es «se clasificó y no dio tema».
     */
    it('sin temas guarda un array vacío, no una lista con una cadena vacía', () => {
        const vuelto = camposDesdeFila(filaSimulada({ ...ARTICULO, topics: [], feedCategories: [] }));
        expect(vuelto.topics).toEqual([]);
        expect(vuelto.feedCategories).toEqual([]);
    });

    it('un artículo sin nada opcional no revienta ni inventa', () => {
        const pelado = {
            id: 'x', headline: 'Titular', link: 'https://medio.co/x',
            outlet: { id: 'medio' }, ingestedAtMs: Date.parse('2026-09-09T00:00:00.000Z'),
        };
        const vuelto = camposDesdeFila(filaSimulada(pelado));

        expect(vuelto.snippet).toBeNull();
        expect(vuelto.tone).toBeNull();
        expect(vuelto.publishedAt).toBeNull();
        expect(vuelto.topics).toEqual([]);
        // Sin `rawTitle`, el titular limpio hace de respaldo.
        expect(vuelto.rawTitle).toBe('Titular');
    });
});

describe('el contrato genera lo que se ejecuta', () => {
    it('cada columna aparece en el INSERT, en el unnest y en la lectura', () => {
        const sql = sqlDeInsercion();
        const lectura = columnasParaLeer('a');

        for (const { columna, alias } of CAMPOS_DE_ARTICULO) {
            expect(sql, columna).toContain(columna);
            expect(sql, alias).toContain(alias);
            expect(lectura, columna).toContain(`a.${columna}`);
        }
    });

    /**
     * EL FALLO DEL 2026-09-09, convertido en prueba. El `INSERT` declaraba
     * catorce columnas y la lista de valores traía trece: ni el lint ni `tsc` ni
     * las 845 pruebas lo vieron.
     */
    it('hay tantos valores como parámetros, y tantos parámetros como columnas', () => {
        const sql = sqlDeInsercion();
        const parametros = [...sql.matchAll(/\$(\d+)::/g)].map((m) => Number(m[1]));

        expect(parametros).toEqual(CAMPOS_DE_ARTICULO.map((_, i) => i + 1));
        expect(valoresDeInsercion([ARTICULO])).toHaveLength(CAMPOS_DE_ARTICULO.length);
    });

    it('cada valor es una lista con una entrada por artículo', () => {
        const valores = valoresDeInsercion([ARTICULO, ARTICULO]);
        for (const columna of valores) expect(columna).toHaveLength(2);
    });
});

/**
 * LA PARTE QUE IMPIDE QUE ESTO SE QUEDE ATRÁS.
 *
 * Se lee el literal `const article = {…}` de la ingesta, que es donde nace el
 * artículo, y se exige que cada uno de sus campos esté decidido: o tiene columna
 * o está en la lista de los que no se guardan, con su motivo. Añadir un campo a
 * la ingesta sin decidir qué pasa con él deja de ser posible en silencio.
 *
 * Se lee el fuente como texto, igual que hacen las pruebas de disposición con su
 * CSS: importar el módulo arrancaría el motor entero.
 */
describe('nada nace en la ingesta sin decidir si se guarda', () => {
    it('cada campo del artículo tiene columna o motivo escrito', () => {
        const fuente = readFileSync(resolve(AQUI, '../services/ingestDaemon.js'), 'utf8');
        const desde = fuente.indexOf('const article = {');
        const hasta = fuente.indexOf('\n                    };', desde);
        expect(desde).toBeGreaterThan(-1);
        expect(hasta).toBeGreaterThan(desde);

        const literal = fuente.slice(desde, hasta);
        const campos = [...literal.matchAll(/^ {24}([A-Za-z][A-Za-z0-9]*):/gm)].map((m) => m[1]);
        expect(campos.length).toBeGreaterThan(10);

        const conColumna = new Set(CAMPOS_DE_ARTICULO.map((c) => c.campo));
        const sinDecidir = campos.filter(
            (campo) => !conColumna.has(campo) && !(campo in CAMPOS_QUE_NO_SE_GUARDAN)
        );

        expect(sinDecidir).toEqual([]);
    });

    /**
     * El typedef existe porque `tsc` no infiere claves de un bucle, y por eso
     * mismo puede quedarse atrás sin que nada avise: es la única lista de este
     * archivo que no se ejecuta.
     */
    it('el typedef dice lo mismo que la lista', () => {
        const contrato = readFileSync(resolve(AQUI, 'contratoDeArticulo.js'), 'utf8');
        const desde = contrato.indexOf('}} CamposDeArticulo');
        const typedef = contrato.slice(contrato.lastIndexOf('@typedef {{', desde), desde);

        const declarados = [...typedef.matchAll(/^ \* {3}(\w+):/gm)].map((m) => m[1]);
        expect(declarados.sort()).toEqual(CAMPOS_DE_ARTICULO.map((c) => c.campo).sort());
    });

    it('el motivo de los que no se guardan no puede estar en blanco', () => {
        for (const [campo, motivo] of Object.entries(CAMPOS_QUE_NO_SE_GUARDAN)) {
            expect(String(motivo).length, campo).toBeGreaterThan(40);
        }
    });
});

/**
 * Y QUE EL CONTRATO SE USE, no que exista.
 *
 * Una lista declarativa que nadie ejecuta es un comentario con sintaxis. Estas
 * dos comprobaciones son las que hacen que volver a escribir el SQL a mano —que
 * es exactamente como nació el defecto— tenga que pasar por poner una prueba en
 * rojo.
 */
describe('contentStore no vuelve a escribir la costura a mano', () => {
    const fuente = readFileSync(resolve(AQUI, 'contentStore.js'), 'utf8');

    it('el INSERT y sus valores salen del contrato', () => {
        expect(fuente).toContain('${sqlDeInsercion()}');
        expect(fuente).toContain('valoresDeInsercion(usable)');
        // Y ya no queda una lista de columnas escrita a mano: el INSERT
        // entero vive en el contrato.
        expect(fuente).not.toContain('INSERT INTO articles');
    });

    it('la rehidratación pide las columnas del contrato y las lee con él', () => {
        expect(fuente).toContain("columnasParaLeer('a')");
        expect(fuente).toContain('camposDesdeFila(row)');
    });
});
