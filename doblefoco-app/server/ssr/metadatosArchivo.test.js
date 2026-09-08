// @ts-check
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describirCobertura, esIndexable, estaArchivada } from './metadatos.js';

/**
 * UNA HISTORIA ARCHIVADA TIENE QUE DECIRSE ARCHIVO, TAMBIÉN FUERA DE LA PÁGINA.
 *
 * Desde el 2026-09-02 la misma ruta sirve lo de hoy y lo de hace semanas. La
 * página lleva su aviso, pero para mucha gente lo único que se lee de aquí es
 * la línea que enseña un buscador: una historia de hace un mes descrita en
 * presente —«12 medios cubren este hecho»— se lee como la noticia del día.
 *
 * Lo que estas pruebas fijan es que el archivo se anuncia y que se sigue
 * indexando: un archivo que no se puede encontrar no es un archivo.
 */

const historia = (extra = {}) => ({
    title: 'Un hecho cualquiera',
    coverage: { left: 2, center: 3, right: 4 },
    ...extra,
});

describe('metadatos de una historia archivada', () => {
    it('la descripción lo dice, con la fecha, y en pasado', () => {
        const d = describirCobertura(historia({ archivadaEl: '2026-07-15T10:00:00.000Z' }));
        expect(d).toContain('Archivada el 2026-07-15');
        expect(d).toContain('cubrieron');
        expect(d).not.toContain('medios cubren');
    });

    it('una historia viva no menciona el archivo, y habla en presente', () => {
        const d = describirCobertura(historia());
        expect(d).not.toMatch(/[Aa]rchivada/);
        expect(d).toContain('medios cubren');
    });

    it('el archivo SE INDEXA: un archivo que no se encuentra no sirve de nada', () => {
        // Lo que decide el noindex es la cobertura, y solo ella. Archivar no
        // puede convertirse por la puerta de atrás en «esconder».
        expect(esIndexable(historia({ archivadaEl: '2026-07-15T10:00:00.000Z' }))).toBe(true);
    });

    it('estaArchivada distingue el sello de su ausencia', () => {
        expect(estaArchivada(historia({ archivadaEl: '2026-07-15T10:00:00.000Z' }))).toBe(true);
        expect(estaArchivada(historia())).toBe(false);
        expect(estaArchivada(historia({ archivadaEl: null }))).toBe(false);
        expect(estaArchivada(null)).toBe(false);
    });

    it('el dato llega desde la base hasta la pantalla, y por eso son cuatro sitios', () => {
        // La costura de este cambio: si un solo eslabón se olvida del campo, la
        // página de archivo vuelve a parecer la noticia de hoy sin que falle
        // nada. Pasó con `topics` y con `blindspot`; se comprueba leyendo.
        const aqui = dirname(fileURLToPath(import.meta.url));
        const leer = (r) => readFileSync(resolve(aqui, r), 'utf8');

        expect(leer('../db/feedStore.js'), 'la consulta no selecciona archivada_el').toMatch(/s\.archivada_el/);
        expect(leer('../db/feedStore.js'), 'la API no publica archivadaEl').toMatch(/archivadaEl: fila\.archivada_el/);
        expect(leer('../../src/lib/story.js'), 'el cliente pierde el campo al normalizar').toMatch(/archivadaEl: raw\.archivadaEl/);
        expect(leer('../../src/pages/NewsDetail.jsx'), 'la página no enseña el aviso').toMatch(/story\.archivadaEl &&/);
    });
});
