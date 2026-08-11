// @ts-check
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { USER_AGENT, CABECERAS } from './userAgent.js';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('User-Agent', () => {
    /**
     * LA PRUEBA QUE HABRÍA AHORRADO EL FALLO. El User-Agent decía «cobertura
     * periodística», con tilde, y una cabecera HTTP solo admite ASCII. Servidores
     * que no nos bloqueaban en absoluto devolvían 403 por una cabecera mal
     * formada, y eso llegó a apuntarse como decisión editorial: se dio por
     * deliberado el bloqueo de prensaescrita.com, que sin la tilde responde 200.
     */
    it('es ASCII imprimible, que es lo único que admite una cabecera HTTP', () => {
        const invalidos = [...USER_AGENT].filter((c) => {
            const punto = c.codePointAt(0) ?? 0;
            return punto < 0x20 || punto > 0x7e;
        });

        expect(invalidos, `caracteres no admitidos: ${invalidos.join(' ')}`).toEqual([]);
    });

    it('sigue diciendo quiénes somos y dónde reclamar', () => {
        expect(USER_AGENT).toContain('DobleFocoBot');
        expect(USER_AGENT).toContain('https://doblefoco.co/transparencia');
    });

    /**
     * No fingimos ser un navegador, y esa sí es una decisión y no un detalle: si
     * leemos los feeds de medios ajenos, que sepan quiénes somos y cómo pedirnos
     * que paremos. Quitar la tilde no cambió eso.
     */
    it('no se disfraza de navegador', () => {
        expect(USER_AGENT).not.toMatch(/Mozilla|Chrome|Safari|Gecko|AppleWebKit/i);
    });

    it('las cabeceras por defecto lo llevan y no se pueden mutar', () => {
        expect(CABECERAS['User-Agent']).toBe(USER_AGENT);
        expect(Object.isFrozen(CABECERAS)).toBe(true);
    });
});

describe('un solo sitio declara el User-Agent', () => {
    /**
     * Estaba copiado en cinco archivos. Arreglar la tilde en uno y dejarla viva
     * en cuatro habría sido peor que no arreglarla: el fallo seguiría, pero ya
     * nadie lo buscaría. Es la misma clase de duplicación que motivó F1-04.
     */
    it('nadie vuelve a escribir la cadena a mano', () => {
        const carpetas = ['server/services', 'scripts', 'shared'];
        const culpables = [];

        for (const carpeta of carpetas) {
            const dir = resolve(RAIZ, carpeta);
            for (const archivo of readdirSync(dir)) {
                if (!/\.(js|mjs)$/.test(archivo)) continue;
                if (archivo.startsWith('userAgent.')) continue;

                const fuente = readFileSync(resolve(dir, archivo), 'utf8');
                // La cadena literal, no la palabra: los comentarios pueden
                // nombrarla y de hecho lo hacen.
                if (/['"`]DobleFocoBot\/[\d.]+ \(/.test(fuente)) {
                    culpables.push(`${carpeta}/${archivo}`);
                }
            }
        }

        expect(culpables, `declaran el User-Agent aparte: ${culpables.join(', ')}`).toEqual([]);
    });
});
