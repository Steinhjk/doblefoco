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
        // `colombia-informa` es el único que sigue con la ficha vacía. Sin dueño
        // documentado no puede entrar en el cálculo, ni para bien ni para mal.
        expect(gruposCompartidos(['colombia-informa', 'semana'])).toEqual([]);
    });

    it('los tres diarios regionales tienen cada uno su dueño y no se agrupan', () => {
        // Documentados los tres, y de tres dueños distintos: Galvis, Restrepo y
        // Catalítico. Documentar no es concentrar.
        expect(gruposCompartidos(['la-patria', 'vanguardia', 'la-opinion'])).toEqual([]);
    });

    it('NO agrupa El País de Cali con El País de España', () => {
        // Mismo nombre, dueños sin relación: Gilinski uno, Prisa el otro. Es la
        // segunda trampa de nombre del catálogo, después de los dos Caracol, y
        // se dispararía justo en una noticia internacional.
        expect(gruposCompartidos(['el-pais-cali', 'el-pais-es'])).toEqual([]);
    });

    it('NO cuenta El Universal con Vanguardia: Galvis tiene el 50 %, no el control', () => {
        // Coposesión al 50 % con la familia Araujo. El aviso afirma «pertenecen
        // a», así que este caso se queda en la ficha y fuera del cálculo.
        expect(gruposCompartidos(['vanguardia', 'el-universal'])).toEqual([]);
    });

    it('devuelve varios grupos, del más concentrado al menos', () => {
        const grupos = gruposCompartidos([
            'el-espectador', 'blu-radio', 'noticias-caracol',  // Valorem: tres
            'noticias-rcn', 'la-fm',                           // Ardila Lülle: dos
            'el-tiempo',
        ]);
        expect(grupos.map((g) => g.groupId)).toEqual(['valorem', 'ardila-lulle']);
        expect(grupos[0].medios).toHaveLength(3);
    });

    it('detecta los tres tríos que aparecieron al completar las fichas', () => {
        // Son la razón de existir del archivo: once medios que el lector ve como
        // voces distintas responden ante cinco dueños.
        const trios = [
            { groupId: 'ardila-lulle', medios: ['noticias-rcn', 'la-fm', 'la-republica'] },
            { groupId: 'prisa', medios: ['caracol-radio', 'w-radio', 'el-pais-es'] },
            { groupId: 'valorem', medios: ['el-espectador', 'blu-radio', 'noticias-caracol'] },
        ];
        for (const { groupId, medios } of trios) {
            const grupos = gruposCompartidos(medios);
            expect(grupos, `${groupId}`).toHaveLength(1);
            expect(grupos[0].groupId).toBe(groupId);
            expect(grupos[0].medios).toHaveLength(3);
        }
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

    it('el único medio sin documentar es colombia-informa', () => {
        // La cabecera del archivo y la página de transparencia le dicen al lector
        // cuántas fichas faltan. Si alguien añade un medio al catálogo sin ficha,
        // esas dos afirmaciones pasan a ser falsas y nadie se enteraría: esta
        // prueba es la que se entera.
        const sinDocumentar = Object.keys(OWNERSHIP_PROFILES)
            .filter((id) => !hasDocumentedOwnership(id));
        expect(sinDocumentar).toEqual(['colombia-informa']);
    });
});
