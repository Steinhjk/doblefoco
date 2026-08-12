// @ts-check
import { describe, it, expect } from 'vitest';
import {
    CONTROL_GROUPS,
    OWNERSHIP_PROFILES,
    gruposCompartidos,
    hasDocumentedOwnership,
    ausenciaDeclarada,
    conAusenciaDeclarada,
    getOwnerBadge,
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

    it('ignora los medios que no están en el catálogo', () => {
        // Un id desconocido no tiene dueño documentado, así que no puede entrar
        // en el cálculo ni para bien ni para mal. Antes esto se probaba con
        // `colombia-informa`, que era el medio real sin ficha; desde el
        // 2026-08-08 ya no hay ninguno, y la prueba no debe depender de que
        // vuelva a haberlo.
        expect(gruposCompartidos(['medio-que-no-existe', 'semana'])).toEqual([]);
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

    it('no queda ninguna ficha de propiedad sin documentar', () => {
        // La cabecera del archivo y la página de transparencia le dicen al lector
        // cuántas fichas faltan. Si alguien añade un medio al catálogo sin ficha,
        // esas dos afirmaciones pasan a ser falsas y nadie se enteraría: esta
        // prueba es la que se entera.
        //
        // Estuvo en 1 —`colombia-informa`— hasta el 2026-08-08. Que ahora esté en
        // 0 no la vuelve inútil: es justo cuando más protege, porque el hueco
        // siguiente entraría sin que nada más lo delate.
        const sinDocumentar = Object.keys(OWNERSHIP_PROFILES)
            .filter((id) => !hasDocumentedOwnership(id));
        expect(sinDocumentar).toEqual([]);
    });
});

/**
 * OJO CON LO QUE PROMETE LA PRUEBA DE ARRIBA, desde el 2026-08-11.
 *
 * «Documentada» y «sabemos de quién es» dejaron de ser lo mismo. La ficha de La
 * Razón.co pasa `hasDocumentedOwnership` —tiene afirmaciones y tiene fuentes—
 * y aun así su dueño no consta. Es correcto: lo que está documentado ahí es la
 * búsqueda, no el resultado.
 *
 * Por eso la ausencia necesita su propio contrato. Sin esto, `ownerType: null`
 * sería la salida cómoda para cualquier ficha incómoda, y nadie se enteraría.
 */
describe('ausencia declarada', () => {
    const conAusencia = Object.entries(OWNERSHIP_PROFILES)
        .filter(([, perfil]) => perfil.ownerType === null);

    it('toda ficha sin ownerType dice CUÁNDO se buscó', () => {
        // Sin fecha, «no consta» es una afirmación sobre el mundo que envejece
        // sola: mañana pueden registrar al representante legal y la ficha
        // seguiría diciendo que no existe.
        for (const [id, perfil] of conAusencia) {
            expect(perfil.consultadoEl, `${id}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
    });

    it('toda ficha sin ownerType dice DÓNDE se buscó, con el resultado de cada sitio', () => {
        for (const [id, perfil] of conAusencia) {
            expect(perfil.buscadoEn?.length, `${id}`).toBeGreaterThan(0);

            for (const intento of perfil.buscadoEn) {
                expect(intento.fuente, `${id}`).toBeTruthy();
                expect(intento.resultado, `${id}`).toBeTruthy();
            }
        }
    });

    it('`ausenciaDeclarada` distingue el hueco del dato, y no al revés', () => {
        // Las dos direcciones importan. Que devuelva la ficha de La Razón es la
        // mitad fácil; que NO devuelva nada para un medio con dueño conocido es
        // lo que impide que el aviso salga donde no toca y se vuelva decorado.
        expect(ausenciaDeclarada('la-razon-cordoba')?.consultadoEl).toBe('2026-08-11');
        expect(ausenciaDeclarada('el-tiempo')).toBeNull();
        expect(ausenciaDeclarada('medio-que-no-existe')).toBeNull();
    });

    it('una ausencia declarada NO se pinta como un tipo de dueño', () => {
        // El fallo que esto evita es silencioso y grave: que «no lo sabemos»
        // acabe leyéndose como «independiente», que es la suposición cómoda
        // para un medio pequeño de provincia.
        expect(getOwnerBadge('la-razon-cordoba')).toBeNull();
    });

    it('conAusenciaDeclarada solo devuelve los medios con el hueco declarado', () => {
        const medios = [{ id: 'el-tiempo' }, { id: 'la-razon-cordoba' }, { id: 'semana' }];
        expect(conAusenciaDeclarada(medios).map((m) => m.id)).toEqual(['la-razon-cordoba']);
        expect(conAusenciaDeclarada([])).toEqual([]);
    });
});
