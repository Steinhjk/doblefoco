// @ts-check
import { describe, it, expect } from 'vitest';
import { VIGILANCIA, MEDIOS_VIGILADOS } from './centinela.js';
import { MEDIA_REGISTRY } from './mediaRegistry.js';

const ids = new Set(MEDIA_REGISTRY.map((m) => m.id));

describe('lista de vigilancia', () => {
    it('vigila medios que existen en el registro', () => {
        // Un id mal escrito no falla al ejecutar: el centinela construiría la
        // URL con el propio id como dominio y saldría «no comprobable», que se
        // lee como «ese sitio no se puede preguntar» y no como «esto es un
        // error nuestro».
        for (const id of MEDIOS_VIGILADOS) expect(ids, `«${id}» no está en el registro`).toContain(id);
    });

    it('todos los medios vigilados tienen dominio, que es por donde se pregunta', () => {
        for (const id of MEDIOS_VIGILADOS) {
            const medio = MEDIA_REGISTRY.find((m) => m.id === id);
            expect(medio?.domain, `«${id}» sin dominio`).toBeTruthy();
        }
    });

    it('CADA TÉRMINO DICE QUÉ AFIRMACIÓN VIGILA', () => {
        // Es la regla del archivo, y no es cosmética: sin ella, al llegar un
        // aviso no se puede decir qué frase de la ficha queda en duda, y un
        // vigilante que avisa sin decir de qué se acaba ignorando.
        for (const [id, { consultas }] of Object.entries(VIGILANCIA)) {
            expect(consultas.length, `«${id}» sin consultas`).toBeGreaterThan(0);

            for (const c of consultas) {
                expect(c.consulta?.trim(), `«${id}» tiene una consulta vacía`).toBeTruthy();
                expect(c.vigila?.trim().length ?? 0, `«${id}» · «${c.consulta}» sin campo vigila`).toBeGreaterThan(20);
            }
        }
    });

    it('no repite la misma consulta dentro de un medio', () => {
        // Duplicarla no rompe nada, pero gasta una petición a un sitio ajeno y
        // duplica el aviso. El estado se guarda por consulta, así que la segunda
        // pisaría a la primera.
        for (const [id, { consultas }] of Object.entries(VIGILANCIA)) {
            const vistas = consultas.map((c) => c.consulta.toLowerCase());
            expect(new Set(vistas).size, `«${id}» repite una consulta`).toBe(vistas.length);
        }
    });
});
