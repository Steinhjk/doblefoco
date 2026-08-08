/**
 * ¿Se puede aplicar el esquema sobre una base VACÍA?   npm run check:esquema
 *
 * POR QUÉ EXISTE. El 2026-08-08, al probar por primera vez la restauración de
 * una copia de seguridad, aparecieron TRES fallos que hacían `schema.sql`
 * inaplicable desde cero:
 *
 *   1. un `ALTER TABLE stories` colocado cien líneas antes del `CREATE`;
 *   2. un bloque `DO` que consultaba `moderation` para decidir si migrarla —y
 *      PL/pgSQL prepara la expresión entera, así que fallaba sin la tabla—;
 *   3. `moderation` referenciando `admin_users`, creada más abajo.
 *
 * Ninguno se veía contra producción, porque allí las tablas ya existen. Los tres
 * significaban lo mismo: **el respaldo diario corría en verde y no se podía
 * restaurar**. La confianza estaba puesta en el extremo equivocado —el volcado—
 * mientras el camino de vuelta llevaba roto quién sabe cuánto.
 *
 * Esta comprobación es lo que hace que eso no vuelva a pasar sin avisar. Cuesta
 * un contenedor de Postgres y unos segundos, y cubre una clase entera de fallo
 * que reaparece cada vez que alguien añade un ALTER o un bloque DO.
 *
 * NO sustituye a probar la restauración de verdad con un artefacto real: eso
 * sigue conviniendo hacerlo a mano cuando el esquema cambie de forma. Lo que
 * cubre es el fallo que hizo falta para descubrirlo.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const url = process.env.DATABASE_URL_PRUEBA;
if (!url) {
    console.error('\n  ✗ Falta DATABASE_URL_PRUEBA.');
    console.error('    Es a propósito: esta comprobación BORRA el esquema, así que');
    console.error('    exige una variable distinta de DATABASE_URL para no poder');
    console.error('    apuntarse a producción por un descuido.\n');
    process.exit(1);
}

const cliente = new pg.Client({ connectionString: url });
await cliente.connect();

// Base limpia de verdad: el fallo que se busca solo aparece desde cero.
await cliente.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');

try {
    await cliente.query(readFileSync(`${RAIZ}/server/db/schema.sql`, 'utf8'));
} catch (error) {
    console.error('\n  ✗ EL ESQUEMA NO SE PUEDE APLICAR SOBRE UNA BASE VACÍA\n');
    console.error(`    ${error.message}\n`);
    console.error('    Casi siempre es un orden: un ALTER antes de su CREATE, una');
    console.error('    referencia a una tabla que se crea más abajo, o un bloque DO');
    console.error('    que consulta una tabla sin comprobar antes que exista.\n');
    await cliente.end();
    process.exit(1);
}

const { rows } = await cliente.query(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name`
);

// Aplicarlo dos veces tiene que ser inocuo: la migración corre en cada
// despliegue y en cada ciclo de ingesta.
await cliente.query(readFileSync(`${RAIZ}/server/db/schema.sql`, 'utf8'));

const { rows: segunda } = await cliente.query(
    `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`
);

await cliente.end();

console.log(`\n  ✓ Esquema aplicado sobre una base vacía · ${rows.length} tablas`);
console.log(`    ${rows.map((r) => r.table_name).join(', ')}`);

if (segunda[0].n !== rows.length) {
    console.error(`\n  ✗ No es idempotente: la segunda pasada deja ${segunda[0].n} tablas.\n`);
    process.exit(1);
}

console.log('  ✓ Idempotente: aplicarlo dos veces no cambia nada\n');
