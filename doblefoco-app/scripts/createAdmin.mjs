/**
 * Crea o actualiza una cuenta del panel — tarea F2-04.
 *
 *   npm run admin:create -- correo@ejemplo.co
 *   npm run admin:create -- correo@ejemplo.co --name "Nombre visible"
 *
 * La contraseña se GENERA y se imprime una sola vez. No se pide por teclado ni
 * se acepta como argumento a propósito: un argumento queda en el historial del
 * intérprete de órdenes y en la lista de procesos de la máquina, donde lo ve
 * cualquier otro usuario del sistema. Si de verdad hace falta fijarla —al
 * restaurar una cuenta concreta, por ejemplo— se pasa por la variable de
 * entorno ADMIN_PASSWORD, que al menos no aparece en `ps`.
 *
 * Sobre una cuenta existente actualiza la contraseña y cierra todas sus
 * sesiones abiertas, que es lo que se espera de un restablecimiento: si se
 * cambia la clave porque se sospecha de un acceso, dejar viva la sesión del
 * intruso lo haría inútil.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { checkConnection, query, closePool } = await import('../server/db/pool.js');
const { hashPassword, generatePassword, MIN_PASSWORD_LENGTH } = await import(
    '../server/auth/passwords.js'
);
const { destroyAllSessions } = await import('../server/auth/sessions.js');

function fail(message, hint = null) {
    console.error(`\n  ✗ ${message}`);
    if (hint) console.error(`    ${hint}`);
    console.error('');
    process.exitCode = 1;
}

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith('--'))?.trim().toLowerCase();
const nameIndex = args.indexOf('--name');
const displayName = nameIndex !== -1 ? args[nameIndex + 1] ?? null : null;

// Validación deliberadamente laxa: exigir la forma exacta de una dirección de
// correo es un pozo sin fondo, y aquí el correo es un identificador, no un
// canal. Lo único que importa es que no esté vacío y tenga una arroba.
if (!email || !email.includes('@')) {
    fail('Falta el correo.', 'Uso: npm run admin:create -- correo@ejemplo.co [--name "Nombre"]');
} else {
    try {
        const status = await checkConnection();

        if (!status.enabled) {
            fail(
                `Sin base de datos: ${status.reason}`,
                'Completa DATABASE_URL en .env.local y corre `npm run db:migrate`.'
            );
        } else {
            const password = process.env.ADMIN_PASSWORD || generatePassword();

            if (password.length < MIN_PASSWORD_LENGTH) {
                fail(`ADMIN_PASSWORD debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
            } else {
                const passwordHash = await hashPassword(password);

                const { rows } = await query(
                    `INSERT INTO admin_users (id, email, password_hash, display_name)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (email) DO UPDATE SET
                         password_hash = EXCLUDED.password_hash,
                         display_name  = COALESCE(EXCLUDED.display_name, admin_users.display_name),
                         disabled_at   = NULL
                     RETURNING id, (xmax = 0) AS created`,
                    [randomUUID(), email, passwordHash, displayName]
                );

                const { id, created } = rows[0];
                const closed = created ? 0 : await destroyAllSessions(id);

                console.log('');
                console.log(`  ${created ? 'Cuenta creada' : 'Contraseña actualizada'}: ${email}`);
                if (closed) console.log(`  ${closed} sesión(es) abiertas cerradas.`);
                console.log('');
                console.log('  ┌─────────────────────────────────────────────────────┐');
                console.log(`    contraseña:  ${password}`);
                console.log('  └─────────────────────────────────────────────────────┘');
                console.log('');
                console.log('  No se vuelve a mostrar. Guárdala en un gestor de contraseñas,');
                console.log('  no en un archivo de texto ni en un chat.');
                console.log('');
            }
        }
    } catch (error) {
        fail(error.message);
        if (process.env.DEBUG) console.error(error);
    }
}

await closePool();
