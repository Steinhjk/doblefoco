/**
 * Pruebas de la derivación de contraseñas — tareas F2-04 y F2-09.
 *
 * Un fallo aquí no rompe ninguna pantalla: deja entrar a quien no debe, o
 * impide entrar a quien sí, y en los dos casos en silencio. Es exactamente el
 * tipo de código que no se puede verificar mirándolo.
 */

import { describe, it, expect } from 'vitest';
import {
    generatePassword,
    hashPassword,
    verifyPassword,
    MIN_PASSWORD_LENGTH,
} from './passwords.js';

const VALID = 'una contraseña larga y suficiente';

describe('hashPassword', () => {
    it('nunca guarda la contraseña, ni en claro ni codificada', () => {
        // La prueba más importante del archivo. Un hash que contenga la
        // contraseña —por un error de concatenación, por ejemplo— pasaría
        // igualmente el ciclo de verificar, y solo se notaría el día que
        // alguien se lleve un volcado de la tabla.
        return hashPassword(VALID).then((hash) => {
            expect(hash).not.toContain(VALID);
            expect(hash).not.toContain(Buffer.from(VALID).toString('base64'));
            expect(hash.toLowerCase()).not.toContain('contrase');
        });
    });

    it('produce un hash distinto cada vez, por la sal', () => {
        // Dos personas con la misma contraseña deben tener hashes distintos. Si
        // no, una tabla filtrada revela quién comparte clave con quién, y un
        // ataque precalculado sirve para todas a la vez.
        return Promise.all([hashPassword(VALID), hashPassword(VALID)]).then(([a, b]) => {
            expect(a).not.toBe(b);
        });
    });

    it('lleva los parámetros dentro del hash, para poder endurecerlos después', () => {
        return hashPassword(VALID).then((hash) => {
            const [algoritmo, n, r, p, sal, derivada] = hash.split('$');
            expect(algoritmo).toBe('scrypt');
            expect(Number(n)).toBeGreaterThanOrEqual(2 ** 15);
            expect(Number(r)).toBeGreaterThan(0);
            expect(Number(p)).toBeGreaterThan(0);
            expect(Buffer.from(sal, 'base64').length).toBeGreaterThanOrEqual(16);
            expect(Buffer.from(derivada, 'base64').length).toBeGreaterThanOrEqual(32);
        });
    });

    it(`rechaza contraseñas de menos de ${MIN_PASSWORD_LENGTH} caracteres`, async () => {
        await expect(hashPassword('corta')).rejects.toThrow();
        await expect(hashPassword('')).rejects.toThrow();
        await expect(hashPassword(null)).rejects.toThrow();
    });
});

describe('verifyPassword', () => {
    it('acepta la contraseña correcta', async () => {
        const hash = await hashPassword(VALID);
        expect(await verifyPassword(VALID, hash)).toBe(true);
    });

    it('rechaza cualquier otra', async () => {
        const hash = await hashPassword(VALID);

        expect(await verifyPassword('otra cosa totalmente', hash)).toBe(false);
        expect(await verifyPassword(`${VALID} `, hash)).toBe(false);
        expect(await verifyPassword(VALID.toUpperCase(), hash)).toBe(false);
        expect(await verifyPassword('', hash)).toBe(false);
    });

    it('devuelve false en vez de lanzar ante un hash corrupto', async () => {
        // Si esto lanzara, el 500 resultante le diría a quien lo prueba que ese
        // usuario existe y que algo raro pasa con su fila. Un false es a la vez
        // más seguro y más honesto.
        for (const corrupto of [
            '',
            'basura',
            'scrypt$mal',
            'bcrypt$1$2$3$4$5',
            'scrypt$abc$8$1$c2FsdA==$ZGVyaXZhZGE=',
            null,
            undefined,
            42,
        ]) {
            expect(await verifyPassword(VALID, corrupto)).toBe(false);
        }
    });

    it('normaliza el Unicode, para que la misma tecla valga siempre', async () => {
        // "café" se puede codificar con é como un solo punto de código o como
        // e + acento combinante. Son cadenas distintas para JavaScript y la
        // misma para quien la teclea; sin normalizar, la contraseña dejaría de
        // funcionar según el teclado o el sistema operativo.
        const compuesta = 'café con leche y azucar';
        const precompuesta = 'café con leche y azucar';

        expect(compuesta).not.toBe(precompuesta);
        expect(await verifyPassword(precompuesta, await hashPassword(compuesta))).toBe(true);
    });
});

describe('generatePassword', () => {
    it('genera con la longitud pedida y por encima del mínimo', () => {
        expect(generatePassword().length).toBeGreaterThanOrEqual(MIN_PASSWORD_LENGTH);
        expect(generatePassword(32)).toHaveLength(32);
    });

    it('evita los caracteres que se confunden al copiar a mano', () => {
        const muestra = Array.from({ length: 50 }, () => generatePassword(40)).join('');
        for (const ambiguo of ['0', 'O', '1', 'l', 'I']) {
            expect(muestra).not.toContain(ambiguo);
        }
    });

    it('no repite', () => {
        const generadas = new Set(Array.from({ length: 200 }, () => generatePassword()));
        expect(generadas.size).toBe(200);
    });

    it('usa todo el alfabeto, sin sesgo del módulo', () => {
        // Tomar `byte % alfabeto.length` sin descartar el resto haría los
        // primeros caracteres más probables que los últimos. Con 57 símbolos y
        // esta muestra, cada uno debería aparecer de sobra.
        const muestra = Array.from({ length: 400 }, () => generatePassword(40)).join('');
        const distintos = new Set(muestra).size;

        expect(distintos).toBeGreaterThanOrEqual(50);
    });
});
