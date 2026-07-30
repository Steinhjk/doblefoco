// @ts-check
import { describe, it, expect } from 'vitest';
import {
    CONTROL_GROUPS,
    OWNERSHIP_PROFILES,
    gruposCompartidos,
    hasDocumentedOwnership,
} from './mediaOwnership.js';

describe('gruposCompartidos', () => {
    it('detecta dos medios del mismo dueño entre los que cubren un hecho', () => {
        // Semana y El País (Cali) son los dos del Grupo Gilinski. El lector ve
        // «3 medios» y en realidad son dos dueños.
        const grupos = gruposCompartidos(['semana', 'el-pais-cali', 'el-tiempo']);
        expect(grupos).toHaveLength(1);
        expect(grupos[0].groupId).toBe('gilinski');
        expect(grupos[0].medios).toEqual(['semana', 'el-pais-cali']);
    });

    it('no dice nada cuando cada medio tiene un dueño distinto', () => {
        // Es el caso normal y tiene que ser silencioso: avisar siempre
        // convertiría el aviso en decorado y dejaría de leerse.
        expect(gruposCompartidos(['el-tiempo', 'semana', 'infobae-co'])).toEqual([]);
    });

    it('NO cuenta a Caracol Radio y Noticias Caracol como el mismo dueño', () => {
        // Comparten nombre y no propietario: Prisa una, Santo Domingo la otra.
        // Es justo el error que un lector comete solo, y el que el producto no
        // puede permitirse cometer.
        expect(gruposCompartidos(['caracol-radio', 'noticias-caracol'])).toEqual([]);
    });

    it('un medio repetido no inventa una concentración', () => {
        expect(gruposCompartidos(['semana', 'semana'])).toEqual([]);
    });

    it('ignora los medios sin propiedad documentada', () => {
        expect(gruposCompartidos(['la-patria', 'vanguardia', 'la-opinion'])).toEqual([]);
    });

    it('devuelve varios grupos, del más concentrado al menos', () => {
        const grupos = gruposCompartidos([
            'el-espectador', 'blu-radio',      // Valorem
            'noticias-rcn', 'la-fm',           // Ardila Lülle
            'el-tiempo',
        ]);
        expect(grupos.map((g) => g.groupId).sort()).toEqual(['ardila-lulle', 'valorem']);
    });

    it('aguanta entradas vacías o inválidas', () => {
        expect(gruposCompartidos([])).toEqual([]);
        expect(gruposCompartidos(/** @type {any} */ (null))).toEqual([]);
        expect(gruposCompartidos(['medio-que-no-existe'])).toEqual([]);
    });
});

describe('contrato de las fichas', () => {
    it('todo controlGroup declarado existe en CONTROL_GROUPS', () => {
        // Un identificador con una errata no rompería nada visible: el aviso
        // simplemente no saldría nunca, y nadie se enteraría.
        for (const [id, perfil] of Object.entries(OWNERSHIP_PROFILES)) {
            if (perfil.controlGroup) {
                expect(CONTROL_GROUPS[perfil.controlGroup], `${id}`).toBeDefined();
            }
        }
    });

    it('toda ficha con grupo de control está documentada con fuentes', () => {
        for (const [id, perfil] of Object.entries(OWNERSHIP_PROFILES)) {
            if (perfil.controlGroup) {
                expect(hasDocumentedOwnership(id), `${id}`).toBe(true);
            }
        }
    });
});
