/**
 * RESTAURA UNA COPIA DE SEGURIDAD.
 *
 *   npm run backup:restore -- backup/2026-07-30T15-41-44-077Z
 *   npm run backup:restore -- <carpeta> --dry-run
 *
 * EXISTE PORQUE UN RESPALDO QUE NADIE SABE RESTAURAR NO ES UN RESPALDO. Es la
 * mitad que se olvida: se automatiza el volcado, se deja el camino de vuelta
 * para «cuando haga falta», y cuando hace falta resulta que el formato no
 * encaja o que el orden de las tablas viola una clave foránea. Este script se
 * escribió el mismo día que el respaldo, a propósito.
 *
 * ORDEN DE INSERCIÓN. `moderation` referencia `stories` y `admin_users`, y
 * `reader_reports` referencia `stories`. Después de una pérdida total, esas
 * filas todavía no existen: hay que restaurar DESPUÉS de que la ingesta haya
 * reconstruido el corpus, o aceptar que las que apunten a historias
 * desaparecidas no entren. Por eso cada tabla informa de cuántas se saltaron en
 * vez de abortar: una decisión de moderación sobre una historia que ya no
 * existe no tiene a qué aplicarse.
 *
 * NO SOBRESCRIBE. Todo va con ON CONFLICT DO NOTHING: restaurar dos veces no
 * duplica, y restaurar sobre una base viva no pisa lo que ya haya.
 *
 * ESTA LISTA Y LA DE backup.mjs SON DOS, Y PUEDEN DIVERGIR. Es el defecto que
 * este repositorio persigue en todas partes: dos listas escritas a mano que
 * dicen cosas distintas sin que nada salte. Aquí la divergencia es peor que en
 * otros sitios, porque la dirección del fallo es SILENCIOSA — una tabla que se
 * respalda y no se restaura no da error, da una restauración incompleta que
 * parece completa, y eso solo se descubre el día que hace falta.
 *
 * Por eso, más abajo, un `.ndjson` de la copia que esta lista no conozca ROMPE
 * la restauración en vez de saltárselo. Se descubrió el 2026-08-31, al añadir
 * las dos tablas del archivo de conducta: entraban en el respaldo y salían por
 * aquí sin decir una palabra.
 */

import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { checkConnection, query, closePool } = await import('../server/db/pool.js');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const carpetaArg = args.find((a) => !a.startsWith('--'));

if (!carpetaArg) {
    console.error('\n  Uso: npm run backup:restore -- <carpeta> [--dry-run]\n');
    process.exit(1);
}

const carpeta = isAbsolute(carpetaArg) ? carpetaArg : resolve(ROOT, carpetaArg);

/**
 * Orden de restauración: las que no dependen de nadie primero.
 * `conflicto` es la columna que decide si una fila ya estaba.
 */
const ORDEN = [
    { tabla: 'ingest_runs', conflicto: '(at)' },
    // No dependen de nadie: son identificadores en texto, sin clave foránea.
    // Van antes que moderation por eso, no por preferencia.
    { tabla: 'conducta_archivo', conflicto: '(story_id, source_id)' },
    { tabla: 'conducta_archivo_runs', conflicto: '(at)' },
    { tabla: 'cadencia_piezas', conflicto: '(source_id, pieza_id)' },
    { tabla: 'cadencia_huecos', conflicto: '(source_id, at)' },
    { tabla: 'moderation', conflicto: '(story_id)' },
    { tabla: 'reader_reports', conflicto: '' },
    { tabla: 'reportes_propiedad', conflicto: '' },
];

const estado = await checkConnection();
if (!estado.enabled) {
    console.error(`\n  ✗ Sin base de datos: ${estado.reason}\n`);
    process.exit(1);
}

let archivos;
try {
    archivos = await readdir(carpeta);
} catch {
    console.error(`\n  ✗ No se pudo leer la carpeta: ${carpeta}\n`);
    process.exit(1);
}

console.log(`\n  RESTAURACIÓN — DobleFoco${dryRun ? '  (ENSAYO, no escribe)' : ''}`);
console.log(`  origen: ${carpetaArg}\n`);

// ¿Trae la copia alguna tabla que esta lista no sepa restaurar? Ver la cabecera.
const conocidas = new Set(ORDEN.map((o) => `${o.tabla}.ndjson`));
const huerfanos = archivos.filter((a) => a.endsWith('.ndjson') && !conocidas.has(a));

if (huerfanos.length) {
    console.error(
        '  ✗ La copia trae tablas que esta restauración no sabe devolver: ' +
        `${huerfanos.map((a) => a.replace('.ndjson', '')).join(', ')}` + '\n' +
        '    Añádelas a ORDEN en scripts/restore.mjs, con su columna de conflicto.\n'
    );
    await closePool();
    process.exit(1);
}

for (const { tabla, conflicto } of ORDEN) {
    const archivo = `${tabla}.ndjson`;
    if (!archivos.includes(archivo)) {
        console.log(`  ${'—'.padStart(6)}         ${tabla} (no está en la copia)`);
        continue;
    }

    const texto = await readFile(resolve(carpeta, archivo), 'utf8');
    const filas = texto.split('\n').filter(Boolean).map((l) => JSON.parse(l));

    if (!filas.length) {
        console.log(`  ${String(0).padStart(6)} filas  ${tabla}`);
        continue;
    }

    if (dryRun) {
        console.log(`  ${String(filas.length).padStart(6)} filas  ${tabla} (se insertarían)`);
        continue;
    }

    // Las columnas salen de la propia copia, no de una lista escrita a mano:
    // así un cambio de esquema no obliga a tocar esto en dos sitios.
    const columnas = Object.keys(filas[0]);
    let insertadas = 0;
    let saltadas = 0;

    for (const fila of filas) {
        const valores = columnas.map((c) => fila[c]);
        const marcadores = columnas.map((_, i) => `$${i + 1}`).join(', ');

        try {
            const r = await query(
                `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${marcadores})
                 ON CONFLICT ${conflicto} DO NOTHING`,
                valores
            );
            if (r.rowCount) insertadas += 1;
            else saltadas += 1;
        } catch (error) {
            // Clave foránea rota: la historia a la que apuntaba ya no existe.
            // Se cuenta y se sigue; abortar por esto dejaría a medias una
            // restauración que en su mayor parte sí es válida.
            if (String(error.code) === '23503') saltadas += 1;
            else throw error;
        }
    }

    console.log(
        `  ${String(insertadas).padStart(6)} filas  ${tabla}` +
        (saltadas ? `  (${saltadas} ya estaban o sin destino)` : '')
    );
}

console.log('');
await closePool();
