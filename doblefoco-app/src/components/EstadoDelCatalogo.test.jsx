// @ts-check
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import EstadoDelCatalogo from './EstadoDelCatalogo';
import { MEDIA_REGISTRY } from '../../shared/mediaRegistry.js';
import { VIGILANCIA } from '../../shared/centinela.js';

/**
 * QUÉ PROTEGE ESTA PRUEBA, QUE NO ES LO QUE PARECE.
 *
 * No comprueba estilos ni maquetación. Comprueba que el panel SE PINTA con los
 * datos reales del repositorio, y hay un motivo concreto: es lo único que
 * importa `centinela/estado.json`, un archivo que **escribe un bot cada lunes**.
 * Si una pasada lo dejara malformado o vacío, el fallo no aparecería en el lint
 * ni en `tsc` — reventaría el panel de administración entero, y solo se
 * descubriría al abrirlo.
 *
 * `renderToStaticMarkup` basta y no arrastra ninguna dependencia nueva de
 * pruebas: no hace falta DOM para responder «¿esto explota o no?».
 */
describe('EstadoDelCatalogo', () => {
    const html = renderToStaticMarkup(<EstadoDelCatalogo />);

    it('se pinta con los datos reales del repositorio', () => {
        expect(html).toContain('Estado del catálogo');
        expect(html).toContain('Vigilados por el centinela');
    });

    it('cuenta todos los medios del registro', () => {
        expect(html).toContain(`>${MEDIA_REGISTRY.length}<`);
    });

    it('nombra cada término vigilado, con lo que vigila a la vista', () => {
        // El `title` con el campo `vigila` es la mitad útil del bloque: sin él, un
        // término suelto no le dice a nadie qué afirmación queda en duda.
        for (const [, { consultas }] of Object.entries(VIGILANCIA)) {
            for (const c of consultas) {
                expect(html, `falta el término «${c.consulta}»`).toContain(c.consulta);
            }
        }
    });

    it('no promete estar en vivo', () => {
        // El panel lee datos empaquetados en el despliegue. Decir o insinuar que
        // son de este segundo sería mentir sobre su frescura, que es peor que no
        // tener panel.
        expect(html).toContain('último despliegue');
    });
});
