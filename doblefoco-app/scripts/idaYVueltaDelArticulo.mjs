/**
 * LA IDA Y VUELTA DE UN ARTÍCULO, CONTRA LA BASE DE VERDAD.
 *
 *     npm run db:contrato
 *
 * NO DEJA NADA. Escribe y lee dentro de una transacción que termina en
 * `ROLLBACK`, así que puede correrse contra producción sin pensárselo.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ EXISTE, SI YA HAY PRUEBAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `contratoDeArticulo.test.js` comprueba que las dos mitades del contrato
 * encajan **entre sí**: que lo que baja vuelve. Lo que no puede comprobar es que
 * el SQL sea válido, porque no habla con Postgres.
 *
 * Y ahí es donde han estado los fallos. El 2026-09-09, al añadir
 * `feed_categories`, el `INSERT` declaraba catorce columnas y la lista de
 * valores traía trece: **el lint, `tsc` y 845 pruebas pasaron con el fallo
 * dentro**, y lo cazó ejecutar la consulta contra la base dentro de una
 * transacción con `ROLLBACK`. Eso es lo que hace este script, y por eso se queda
 * en el repositorio en vez de morir en una carpeta temporal.
 *
 * DÓNDE VA. A mano, y en la lista del día del despliegue cuando el cambio toque
 * columnas. En CI no, mientras CI no tenga una base: un vigilante que no puede
 * correr es ruido rojo.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { getPool, closePool } = await import('../server/db/pool.js');
const { sqlDeInsercion, valoresDeInsercion, columnasParaLeer } =
    await import('../server/db/contratoDeArticulo.js');
const { articuloDesdeFila } = await import('../server/db/contentStore.js');

/** Un artículo con todos los campos llenos, incluidos los tres que la base transforma. */
const ARTICULO = {
    id: 'prueba-del-contrato',
    headline: 'Titular de prueba con acentos: gestión, año, Chocó',
    rawTitle: 'Titular de prueba con acentos: gestión, año, Chocó | Medio',
    link: 'https://ejemplo.invalido/prueba-del-contrato',
    snippet: 'Un extracto cualquiera, suficientemente largo para pasar el mínimo.',
    imageUrl: null,
    tone: { score: 0.2, terms: ['gestión'] },
    publishedAt: '2026-09-04T22:13:13.000Z',
    ingestedAtMs: Date.parse('2026-09-04T23:00:00.000Z'),
    category: 'Política',
    topics: ['justicia', 'politica'],
    ambito: 'nacional',
    // La coma de dentro es el caso que obliga a que el separador sea el
    // tabulador: «Bogotá, D.C.» es una sección de verdad de más de un medio.
    feedCategories: ['Actualidad', 'Bogotá, D.C.'],
    outlet: { id: null },
};

const cliente = await getPool().connect();
let fallos = 0;

try {
    await cliente.query('BEGIN');

    // Cualquier medio real sirve: lo único que se prueba de él es que la clave
    // foránea encaja.
    const fuente = (await cliente.query('SELECT id FROM sources LIMIT 1')).rows[0]?.id;
    if (!fuente) throw new Error('no hay medios en `sources`: ¿corriste `npm run db:migrate`?');
    ARTICULO.outlet.id = fuente;

    await cliente.query(sqlDeInsercion(), valoresDeInsercion([ARTICULO]));

    const { rows } = await cliente.query(
        `SELECT ${columnasParaLeer('a')},
                s.name AS source_name, s.domain AS source_domain, s.bias, s.factuality
           FROM articles a JOIN sources s ON s.id = a.source_id
          WHERE a.id = $1`,
        [ARTICULO.id]
    );

    if (!rows.length) throw new Error('la fila no volvió: el INSERT no escribió nada');
    const vuelto = articuloDesdeFila(rows[0]);

    const comparaciones = [
        ['id', vuelto.id, ARTICULO.id],
        ['link', vuelto.link, ARTICULO.link],
        ['headline', vuelto.headline, ARTICULO.headline],
        ['rawTitle', vuelto.rawTitle, ARTICULO.rawTitle],
        ['snippet', vuelto.snippet, ARTICULO.snippet],
        ['category', vuelto.category, ARTICULO.category],
        ['tone', JSON.stringify(vuelto.tone), JSON.stringify(ARTICULO.tone)],
        ['publishedAt', new Date(vuelto.publishedAt).toISOString(), ARTICULO.publishedAt],
        ['ingestedAtMs', vuelto.ingestedAtMs, ARTICULO.ingestedAtMs],
        ['imageUrl', vuelto.imageUrl, ARTICULO.imageUrl],
        ['topics', String(vuelto.topics), String(ARTICULO.topics)],
        ['ambito', vuelto.ambito, ARTICULO.ambito],
        ['feedCategories', String(vuelto.feedCategories), String(ARTICULO.feedCategories)],
        ['outlet.id', vuelto.outlet.id, fuente],
    ];

    console.log('\n  IDA Y VUELTA DE UN ARTÍCULO — contra la base, sin dejar nada\n');
    for (const [campo, ida, vuelta] of comparaciones) {
        const igual = String(ida) === String(vuelta);
        if (!igual) fallos += 1;
        console.log(`  ${igual ? '·' : '✗'} ${campo.padEnd(16)} ${String(ida).slice(0, 46)}`);
    }

    // `sourceId` es columna en la base y `outlet.id` en memoria. Si se queda
    // suelto, la forma del artículo cambió sin que nadie lo decidiera.
    if ('sourceId' in vuelto) {
        fallos += 1;
        console.log('  ✗ «sourceId» quedó suelto en el objeto');
    }
} finally {
    await cliente.query('ROLLBACK');
    cliente.release();
    await closePool();
}

console.log(
    fallos === 0
        ? '\n  El artículo baja y vuelve entero. ROLLBACK hecho.\n'
        : `\n  ${fallos} campo(s) no sobreviven el viaje. ROLLBACK hecho.\n`
);

process.exit(fallos === 0 ? 0 : 1);
