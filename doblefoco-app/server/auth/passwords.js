/**
 * Derivación y verificación de contraseñas — tarea F2-04.
 *
 * scrypt, de node:crypto. No hace falta bcrypt ni argon2: scrypt está en la
 * biblioteca estándar desde Node 10, es una función de derivación dura en
 * memoria (que es lo que encarece el ataque con GPU) y una dependencia menos es
 * una superficie menos que auditar.
 *
 * Formato del hash almacenado, todo en una cadena:
 *
 *   scrypt$N$r$p$<sal en base64>$<derivada en base64>
 *
 * Los parámetros van DENTRO del hash a propósito. Si mañana hay que endurecer
 * el coste, los hashes viejos siguen verificándose con sus propios parámetros y
 * se pueden migrar al vuelo en el siguiente inicio de sesión, en lugar de dejar
 * a todo el mundo fuera.
 */

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

/**
 * Coste. N=2^16 tarda del orden de 100 ms por verificación en hardware
 * corriente: imperceptible para quien inicia sesión, caro para quien prueba un
 * diccionario. `maxmem` hay que subirlo explícitamente porque el valor por
 * defecto de Node (32 MB) no da para esta N y la llamada fallaría.
 */
const PARAMS = { N: 2 ** 16, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const MAX_MEM = 256 * 1024 * 1024;

/** Longitud mínima. No hay reglas de "un símbolo y una mayúscula": encarecen
 *  la memorización sin encarecer el ataque tanto como la longitud. */
export const MIN_PASSWORD_LENGTH = 12;

/**
 * Deriva el hash de una contraseña.
 * @param {string} password
 * @returns {Promise<string>} cadena autodescriptiva, lista para almacenar
 */
export async function hashPassword(password) {
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
    }

    const salt = randomBytes(SALT_LENGTH);
    const derived = await scrypt(password.normalize('NFC'), salt, KEY_LENGTH, {
        ...PARAMS,
        maxmem: MAX_MEM,
    });

    return [
        'scrypt',
        PARAMS.N,
        PARAMS.r,
        PARAMS.p,
        salt.toString('base64'),
        derived.toString('base64'),
    ].join('$');
}

/**
 * Verifica una contraseña contra su hash almacenado.
 *
 * Nunca lanza: un hash corrupto o de un formato desconocido es un `false`, no
 * una excepción que se convierta en un 500 y le confirme a quien prueba que ese
 * usuario existe.
 *
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, stored) {
    if (typeof password !== 'string' || typeof stored !== 'string') return false;

    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

    const [, n, r, p, saltB64, derivedB64] = parts;
    const N = Number(n);
    const R = Number(r);
    const P = Number(p);

    if (!Number.isInteger(N) || !Number.isInteger(R) || !Number.isInteger(P)) return false;

    try {
        const salt = Buffer.from(saltB64, 'base64');
        const expected = Buffer.from(derivedB64, 'base64');

        const actual = await scrypt(password.normalize('NFC'), salt, expected.length, {
            N,
            r: R,
            p: P,
            maxmem: MAX_MEM,
        });

        // Comparación en tiempo constante. Un `===` filtra por cuánto tarda en
        // fallar cuántos bytes iniciales acertó quien lo intenta.
        return timingSafeEqual(actual, expected);
    } catch {
        return false;
    }
}

/**
 * Genera una contraseña aleatoria legible.
 *
 * Se usa al crear la primera cuenta. Alfabeto sin caracteres ambiguos (0/O,
 * 1/l/I): quien la copie a mano no debería perder diez minutos averiguando si
 * ese trazo era un uno o una ele.
 *
 * El rechazo del sesgo del módulo importa: `% alfabeto.length` a secas haría
 * los primeros caracteres del alfabeto más probables que los últimos, y una
 * contraseña generada así tiene menos entropía de la que aparenta.
 */
export function generatePassword(length = 24) {
    const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const limit = 256 - (256 % alphabet.length);
    let out = '';

    while (out.length < length) {
        for (const byte of randomBytes(length)) {
            if (byte >= limit) continue;
            out += alphabet[byte % alphabet.length];
            if (out.length === length) break;
        }
    }

    return out;
}
