// @ts-check
import { describe, it, expect } from 'vitest';
import { departamentoDe, repartoGeografico, escalonDe, ESCALONES } from './geografiaDelFeed.js';
import { DEPARTAMENTOS } from '../../shared/geografia.js';
import { TRAZADOS, INSULAR, VISTA } from '../data/mapaColombia.js';

const historia = (id, title, ambito = 'nacional') => ({ id, title, ambito });

describe('departamentoDe', () => {
    it('etiqueta una historia nacional por su titular', () => {
        expect(departamentoDe(historia('1', 'Capturan a tres en Cúcuta'))).toBe('Norte de Santander');
    });

    /**
     * LA PROTECCIÓN QUE JUSTIFICA EL MÓDULO ENTERO.
     *
     * «Santander» es departamento colombiano, banco y ciudad de España, y a
     * diferencia de «Bolívar» o «Córdoba» NO está en la lista de ambiguos: en un
     * titular colombiano casi siempre es el departamento. En uno español, nunca.
     * Sin este corte, El País de Madrid mandaría noticias a Bucaramanga.
     */
    it('NO etiqueta lo internacional, aunque el titular nombre un topónimo colombiano', () => {
        expect(departamentoDe(historia('1', 'El Santander gana un 12 % más', 'internacional'))).toBeNull();
        expect(departamentoDe(historia('2', 'Incendio en Córdoba, Argentina', 'internacional'))).toBeNull();
    });

    it('etiqueta cuando el ámbito viene nulo, que es «la API aún no clasifica»', () => {
        // Negarse dejaría el mapa entero en blanco en ese despliegue.
        expect(departamentoDe(historia('1', 'Paro de transporte en Medellín', null))).toBe('Antioquia');
    });

    it('no revienta con una historia a medio hacer', () => {
        expect(departamentoDe(/** @type {any} */ ({}))).toBeNull();
        expect(departamentoDe(/** @type {any} */ (null))).toBeNull();
    });
});

describe('repartoGeografico', () => {
    const feed = [
        historia('a', 'Capturan a tres en Cúcuta'),
        historia('b', 'Tiroteo en Ocaña deja dos heridos'),
        historia('c', 'Paro de transporte en Medellín'),
        historia('d', 'El Gobierno anuncia una reforma'),
        historia('e', 'La bolsa de Fráncfort cierra al alza', 'internacional'),
    ];

    it('cuenta por departamento y dice cuántas quedaron sin etiquetar', () => {
        const r = repartoGeografico(feed);
        expect(r.conteos['Norte de Santander']).toBe(2);
        expect(r.conteos.Antioquia).toBe(1);
        expect(r.etiquetadas).toBe(3);
        expect(r.total).toBe(5);
        expect(r.maximo).toBe(2);
    });

    /**
     * Un cero se puede leer; una ausencia, no. Omitir los departamentos vacíos
     * convertiría el mapa en «de los que hablamos» y quien viva en Vaupés
     * simplemente no se encontraría en el filtro.
     */
    it('devuelve los 33, incluidos los que valen cero', () => {
        const r = repartoGeografico(feed);
        expect(Object.keys(r.conteos)).toHaveLength(33);
        expect(r.conteos['Vaupés']).toBe(0);
        expect(r.vacios).toBe(31);
    });

    it('guarda la etiqueta por id, para que el filtro no vuelva a detectar', () => {
        const r = repartoGeografico(feed);
        expect(r.porHistoria.get('a')).toBe('Norte de Santander');
        expect(r.porHistoria.get('d')).toBeNull();
    });

    it('con el feed vacío no divide por cero ni inventa un máximo', () => {
        const r = repartoGeografico([]);
        expect(r.maximo).toBe(0);
        expect(r.vacios).toBe(33);
        expect(escalonDe(0, r.maximo)).toBe(0);
    });
});

describe('escalonDe', () => {
    it('cero es su propio escalón, no el más bajo', () => {
        expect(escalonDe(0, 200)).toBe(0);
    });

    it('el máximo se lleva el escalón más alto y nunca se pasa', () => {
        expect(escalonDe(200, 200)).toBe(ESCALONES);
        expect(escalonDe(999, 200)).toBe(ESCALONES);
    });

    it('es monótona: más historias nunca dan un tono más flojo', () => {
        let previo = 0;
        for (let n = 0; n <= 219; n++) {
            const e = escalonDe(n, 219);
            expect(e).toBeGreaterThanOrEqual(previo);
            previo = e;
        }
    });

    /**
     * POR QUÉ RAÍZ Y NO LINEAL. Con el reparto real —Valle 219, Atlántico 78,
     * Antioquia 71, Bogotá 64— una escala lineal deja a los tres perseguidores
     * en el mismo escalón que un departamento con una sola noticia: un mapa de
     * un solo departamento. Esta prueba es la que se rompería al «simplificar»
     * la escala a lineal.
     */
    it('separa la cola larga en vez de aplastarla contra el primer escalón', () => {
        const reales = { valle: 219, atlantico: 78, antioquia: 71, bogota: 64, una: 1 };
        expect(escalonDe(reales.valle, 219)).toBe(5);
        expect(escalonDe(reales.atlantico, 219)).toBe(3);
        expect(escalonDe(reales.una, 219)).toBe(1);
        expect(escalonDe(reales.atlantico, 219)).toBeGreaterThan(escalonDe(reales.una, 219));
    });

    /**
     * LOS CINCO TONOS DECLARADOS EN LA LEYENDA TIENEN QUE PODER SALIR.
     *
     * Anclada en cero, con el máximo real de una tanda de 100 historias —12, no
     * 219— una sola historia caía ya en el segundo tono y el primero no lo
     * alcanzaba nadie: la leyenda prometía cinco pasos y el mapa usaba cuatro.
     */
    it('con un máximo pequeño la rampa sigue empezando por el primer tono', () => {
        expect(escalonDe(1, 12)).toBe(1);
        expect(escalonDe(12, 12)).toBe(5);
        expect(escalonDe(1, 3)).toBe(1);
        expect(escalonDe(3, 3)).toBe(5);
    });

    it('si solo hay un nivel poblado, ese es el máximo y se pinta como tal', () => {
        expect(escalonDe(1, 1)).toBe(ESCALONES);
    });
});

/**
 * El mapa y el detector comparten los NOMBRES como clave. Si Natural Earth
 * renombrara una pieza o `shared/geografia.js` cambiara una tilde, el
 * departamento se quedaría gris para siempre sin que nada avisara: el trazado
 * pintaría `undefined` conteos y la lista nunca lo destacaría.
 */
describe('la geometría casa con la lista de departamentos', () => {
    it('los 32 trazados continentales están todos en DEPARTAMENTOS', () => {
        expect(TRAZADOS).toHaveLength(32);
        for (const [nombre] of TRAZADOS) {
            expect(DEPARTAMENTOS).toContain(nombre);
        }
    });

    it('los 32 más el insular son exactamente los 33, sin repetidos', () => {
        const delMapa = new Set([...TRAZADOS.map(([n]) => n), INSULAR]);
        expect(delMapa.size).toBe(33);
        expect([...delMapa].sort()).toEqual([...DEPARTAMENTOS].sort());
    });

    it('cada trazado es un path cerrado y no una cadena vacía', () => {
        for (const [nombre, d] of TRAZADOS) {
            expect(d.startsWith('M'), nombre).toBe(true);
            expect(d.endsWith('Z'), nombre).toBe(true);
        }
    });

    it('nada se sale del lienzo', () => {
        for (const [nombre, d] of TRAZADOS) {
            const numeros = d.replace(/[MLZ]/g, ' ').trim().split(/\s+/).map(Number);
            for (let i = 0; i < numeros.length; i += 2) {
                expect(numeros[i], `${nombre} en x`).toBeGreaterThanOrEqual(0);
                expect(numeros[i], `${nombre} en x`).toBeLessThanOrEqual(VISTA.ancho);
                expect(numeros[i + 1], `${nombre} en y`).toBeGreaterThanOrEqual(0);
                expect(numeros[i + 1], `${nombre} en y`).toBeLessThanOrEqual(VISTA.alto);
            }
        }
    });
});
