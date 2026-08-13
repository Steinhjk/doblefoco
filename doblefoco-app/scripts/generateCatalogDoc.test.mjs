// @ts-check
/**
 * EL CATÁLOGO PÚBLICO NO INVENTA NÚMEROS QUE NADIE HA MEDIDO.
 *
 * POR QUÉ EXISTE ESTA PRUEBA. `fmtFactuality` hacía `Math.round(value * 100)`
 * sin mirar el tipo, así que un medio con `factuality: null` se publicaba como
 * «factualidad 0%». Dieciocho medios reales, con su nombre al lado, con la peor
 * nota de rigor posible, en el único documento que el lector puede consultar
 * para saber cómo se les clasifica.
 *
 * El fallo no lo detectaba nada: `check:registry` compara el archivo generado
 * contra `renderCatalog()`, y los dos producían el mismo 0 %. Una comprobación
 * de coherencia no ve un error que está en el generador.
 *
 * Es la clase de defecto que este proyecto no se puede permitir: `factuality:
 * null` se hizo válida el 2026-08-09 justamente para no tener que inventarle un
 * número de rigor a un medio al darlo de alta, y esto lo invalidaba entero.
 */
import { describe, it, expect } from 'vitest';
import { renderCatalog } from './generateCatalogDoc.mjs';
import { MEDIA_REGISTRY } from '../shared/mediaRegistry.js';

const catalogo = renderCatalog();

const sinMedir = MEDIA_REGISTRY.filter((m) => typeof m.factuality !== 'number');
const medidos = MEDIA_REGISTRY.filter((m) => typeof m.factuality === 'number');

describe('catálogo público generado', () => {
    it('no atribuye un 0 % de factualidad a nadie', () => {
        // Ningún medio del registro tiene 0 y ninguno debería poder tenerlo: el
        // verificador rechaza `factuality <= 0`. Así que un «0%» impreso solo
        // puede venir de un null mal formateado.
        expect(catalogo).not.toContain('factualidad 0%');
    });

    it('dice «sin medir» de cada medio sin factualidad medida', () => {
        expect(sinMedir.length).toBeGreaterThan(0);

        for (const media of sinMedir) {
            const linea = catalogo
                .split('\n')
                .find((l) => l.trimStart().startsWith(`${media.name}  ·`));

            expect(linea, `no se encontró la línea de ${media.name}`).toBeDefined();
            expect(linea, `${media.name} debería decir «sin medir»`).toContain(
                'factualidad sin medir'
            );
        }
    });

    it('sigue imprimiendo el porcentaje de los que sí están medidos', () => {
        // El arreglo no debe apagar el dato bueno junto con el inventado.
        expect(medidos.length).toBeGreaterThan(0);

        for (const media of medidos) {
            const linea = catalogo
                .split('\n')
                .find((l) => l.trimStart().startsWith(`${media.name}  ·`));

            expect(linea, `no se encontró la línea de ${media.name}`).toBeDefined();
            expect(linea).toContain(
                `factualidad ${Math.round(media.factuality * 100)}%`
            );
        }
    });

    it('usa la misma palabra que la interfaz', () => {
        // `fmtPct` en src/pages/MediaMap.jsx dice «sin medir». Que el mapa y el
        // catálogo llamen distinto a lo mismo es la divergencia de siempre, y el
        // lector los ve a los dos.
        expect(catalogo).toContain('sin medir');
        expect(catalogo).not.toContain('no medida');
    });
});
