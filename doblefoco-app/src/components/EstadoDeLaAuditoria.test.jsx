// @ts-check
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import EstadoDeLaAuditoria from './EstadoDeLaAuditoria';
import estadoAuditoria from '../../auditoria/estado.json';
import { VERSION_AUDITORIA, resumirAuditoria } from '../../shared/auditoria.js';

/**
 * QUÉ PROTEGE ESTA PRUEBA, QUE NO ES LO QUE PARECE.
 *
 * No comprueba estilos ni maquetación. Comprueba que el panel SE PINTA con el
 * archivo real, y el motivo es el mismo que en `EstadoDelCatalogo.test.jsx` pero
 * más agudo: `auditoria/estado.json` lo escribe un bot cada semana, contra 76
 * sitios ajenos, y con lo que devuelvan. Un medio que un día conteste algo raro
 * puede dejar el archivo con una forma que ni el lint ni `tsc` miran — y el
 * fallo no aparecería hasta que alguien abriera el panel de administración.
 *
 * Por eso lo primero que se prueba es lo aburrido: que el archivo existe, que su
 * versión es la que el panel sabe leer, y que renderizarlo no explota.
 */
describe('EstadoDeLaAuditoria', () => {
    const html = renderToStaticMarkup(<EstadoDeLaAuditoria />);

    it('se pinta con el archivo real de la última pasada', () => {
        expect(html).toContain('Auditoría del catálogo');
    });

    it('el archivo guardado tiene la versión que este panel sabe leer', () => {
        /*
         * Si esto falla, el panel NO se rompe —muestra el aviso de formato— pero
         * deja de informar, que en un panel de comprobaciones es casi igual de
         * malo. Vale más enterarse aquí.
         */
        expect(estadoAuditoria.version).toBe(VERSION_AUDITORIA);
    });

    it('dice cuándo fue la pasada, que es lo que impide leerlo como si fuera de hoy', () => {
        expect(estadoAuditoria.ultimaPasada).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(html).toContain(estadoAuditoria.ultimaPasada);
    });

    it('enseña las cifras que salen del propio archivo, sin recalcular otra cosa', () => {
        const resumen = resumirAuditoria(estadoAuditoria);
        expect(html).toContain(`>${resumen.medios}<`);
    });

    it('avisa en palabras cuando la pasada fue de un solo medio', () => {
        // La marca `parcial` es lo único que impide que una pasada de depuración
        // —`--medio=`— se lea en el panel como si se hubiera mirado el catálogo.
        if (estadoAuditoria.parcial) {
            expect(html).toContain('de un solo medio');
        } else {
            expect(html).not.toContain('de un solo medio');
        }
    });

    it('cada fila listada lleva su estado escrito, no solo un color', () => {
        const palabras = ['roto', 'revisar', 'no comprobable', 'sano'];
        const pendientes = resumirAuditoria(estadoAuditoria).conDefecto;
        if (pendientes > 0) {
            expect(palabras.some((p) => html.includes(`>${p}<`))).toBe(true);
        }
    });
});
