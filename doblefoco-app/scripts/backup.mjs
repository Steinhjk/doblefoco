/**
 * COPIA DE SEGURIDAD DE LO QUE NO SE PUEDE RECONSTRUIR.
 *
 *   npm run backup        → escribe backup/ con un archivo NDJSON por tabla
 *
 * POR QUÉ EXISTE. No había ninguna. Y la creencia de que sí la había venía de
 * que `data/ingest_runs.jsonl` «sobrevive a que Postgres no responda»: eso es
 * cierto en una máquina, pero la ingesta corre en GitHub Actions, donde cada
 * ejecución es un contenedor que se destruye. En la práctica **la base era el
 * único sitio durable de la serie de F1-01**, esa que por diseño no se puede
 * reconstruir hacia atrás porque los artículos se descartan a las 72 horas.
 *
 * POR QUÉ NO ES UN `pg_dump`, que es lo que se haría por defecto:
 *
 *   1. EL REPOSITORIO ES PÚBLICO. En un repositorio público, los artefactos de
 *      Actions los puede descargar cualquiera. Un volcado completo publicaría
 *      `admin_users` —correo y hash de contraseña— y `admin_sessions`, que
 *      guarda IP y user-agent. Sería un fallo de seguridad servido a diario y
 *      en horario.
 *   2. La mitad del tamaño de la base son artículos e historias, que se
 *      reconstruyen solos en 72 horas. Respaldarlos cada noche es guardar ruido.
 *   3. `pg_dump` exige que el cliente coincida con la versión del servidor
 *      (17.6 aquí), y el runner trae otra. Un acoplamiento más que se rompe
 *      solo el día que alguien actualice algo.
 *
 * ASÍ QUE SE ELIGE QUÉ SE GUARDA, Y SE DICE POR QUÉ. La lista de abajo es la
 * decisión, no un detalle de implementación.
 *
 * CÓMO SE RESTAURA
 * ----------------
 *   1. `npm run db:migrate` sobre la base nueva. Crea el esquema y proyecta los
 *      medios desde shared/mediaRegistry.js.
 *   2. `npm run backup:restore -- <carpeta>` para volcar los NDJSON.
 *   3. `npm run ingest:once`. En 72 horas el corpus vuelve a estar lleno.
 *   4. El usuario del panel se recrea con `node scripts/createAdmin.mjs`. No se
 *      respalda a propósito (ver arriba) y recrearlo cuesta un minuto.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { checkConnection, query, closePool } = await import('../server/db/pool.js');

/**
 * LO QUE SE RESPALDA: irreemplazable Y sin datos personales.
 *
 * Las dos condiciones a la vez. Si algo es irreemplazable pero contiene datos
 * personales, no entra aquí — entra en la conversación sobre cifrado.
 */
const TABLAS = [
    {
        nombre: 'ingest_runs',
        porque:
            'La serie de F1-01. Es LO único verdaderamente irrecuperable: mide ' +
            'ciclos que ya ocurrieron y no se pueden volver a observar.',
    },
    {
        nombre: 'moderation',
        porque:
            'Decisiones editoriales sobre qué se retiró y por qué. Perderlas ' +
            'republicaría historias que alguien decidió quitar. `reviewer_id` es ' +
            'un identificador opaco, no un correo.',
    },
    {
        nombre: 'reader_reports',
        porque: 'Señales de lectores sobre historias. Sin datos personales por diseño.',
    },
    {
        nombre: 'reportes_propiedad',
        porque: 'Objeciones a las fichas de propiedad. Sin datos personales por diseño.',
    },
];

/**
 * LO QUE NO SE RESPALDA, y el motivo de cada uno. Está escrito para que la
 * próxima persona no tenga que deducirlo —ni «arreglarlo» sin querer.
 */
const EXCLUIDAS = {
    admin_users: 'Correo y hash de contraseña. El repositorio es PÚBLICO. Se recrea con createAdmin.',
    admin_sessions: 'Guarda IP y user-agent. Datos personales, y caducan solas.',
    waitlist: 'Correos de suscriptores. Datos personales; exigiría cifrado antes de salir de la base.',
    rate_limits: 'Contadores con ventana. Caducan en minutos y no hay nada que restaurar.',
    articles: 'Se reconstruye solo: la ventana de retención es de 72 h.',
    stories: 'Derivadas de los artículos; se recalculan en el primer ciclo.',
    story_articles: 'Igual que stories.',
    sources: 'Proyección de shared/mediaRegistry.js. `db:migrate` la regenera.',
    errores: 'Telemetría operativa. Útil en vivo, sin valor una vez restaurado.',
    ingest_requests: 'Cola de solicitudes del panel. Efímera por definición.',
    schema_migrations: 'La gestiona la propia migración.',
};

const estado = await checkConnection();
if (!estado.enabled) {
    console.error(`\n  ✗ Sin base de datos: ${estado.reason}\n`);
    process.exit(1);
}

const sello = new Date().toISOString().replace(/[:.]/g, '-');
const destino = resolve(ROOT, 'backup', sello);
await mkdir(destino, { recursive: true });

console.log(`\n  COPIA DE SEGURIDAD — DobleFoco\n  destino: backup/${sello}\n`);

const manifiesto = { generadoEn: new Date().toISOString(), tablas: {} };
let filasTotales = 0;

for (const tabla of TABLAS) {
    const resultado = await query(`SELECT * FROM ${tabla.nombre}`);
    const filas = resultado.rows;

    // NDJSON: una fila por línea. Un archivo cortado a la mitad conserva todo lo
    // anterior al corte, cosa que un JSON en un solo array no permite.
    const contenido = filas.map((f) => JSON.stringify(f)).join('\n');
    await writeFile(resolve(destino, `${tabla.nombre}.ndjson`), contenido, 'utf8');

    manifiesto.tablas[tabla.nombre] = filas.length;
    filasTotales += filas.length;
    console.log(`  ${String(filas.length).padStart(6)} filas  ${tabla.nombre}`);
}

/**
 * ¿HAY ALGUNA TABLA QUE NADIE HA DECIDIDO QUÉ HACER CON ELLA?
 *
 * Es la comprobación que hace que esto no envejezca mal. Una tabla nueva queda
 * fuera del respaldo por omisión —que es la dirección segura— pero en SILENCIO,
 * y ese silencio es el que hace que un día falte algo. Aquí se rompe la
 * ejecución para obligar a decidir: o se respalda, o se declara por qué no.
 */
const enBase = await query(`
    SELECT tablename FROM pg_tables
     WHERE schemaname = 'public'
     ORDER BY tablename
`);

const conocidas = new Set([...TABLAS.map((t) => t.nombre), ...Object.keys(EXCLUIDAS)]);
const desconocidas = enBase.rows.map((r) => r.tablename).filter((t) => !conocidas.has(t));

if (desconocidas.length) {
    console.error(
        `\n  ✗ Tablas sin decisión: ${desconocidas.join(', ')}\n` +
        '    Añádelas a TABLAS o a EXCLUIDAS en scripts/backup.mjs, con su motivo.\n'
    );
    await closePool();
    process.exit(1);
}

/**
 * Un respaldo vacío que sale en verde es peor que no tener respaldo: crea la
 * confianza sin el contenido, y eso solo se descubre el día que hace falta.
 */
if (!manifiesto.tablas.ingest_runs) {
    console.error('\n  ✗ La serie de ingesta salió vacía. Algo va mal; no es un respaldo válido.\n');
    await closePool();
    process.exit(1);
}

await writeFile(
    resolve(destino, 'manifiesto.json'),
    JSON.stringify(manifiesto, null, 2),
    'utf8'
);

console.log(`\n  ${filasTotales} filas en ${TABLAS.length} tablas.`);
console.log(`  Excluidas a propósito: ${Object.keys(EXCLUIDAS).length} (ver scripts/backup.mjs).\n`);

await closePool();
