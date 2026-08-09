// @ts-check
import { describe, it, expect } from 'vitest';
import {
    FILTROS,
    TAMANO_PAGINA,
    aplicarCambios,
    leerFiltros,
    leerVisibles,
} from './useFiltrosDeFeed.js';
import { SLUGS_DEPARTAMENTO } from '../../shared/geografia.js';

const params = (cadena = '') => new URLSearchParams(cadena);

describe('leerFiltros (F3-06)', () => {
    it('sin parámetros devuelve todos los valores por omisión', () => {
        const f = leerFiltros(params());
        for (const [clave, def] of Object.entries(FILTROS)) {
            expect(f[clave]).toBe(def.porDefecto);
        }
    });

    it('lee los valores válidos de la URL', () => {
        const f = leerFiltros(params('ambito=nacional&espectro=right&ciego=only&orden=coverage'));
        expect(f).toMatchObject({
            ambito: 'nacional',
            espectro: 'right',
            ciego: 'only',
            orden: 'coverage',
        });
    });

    it('descarta un valor que no está en la lista, en vez de propagarlo', () => {
        // Una URL la escribe cualquiera. Sin validar, el feed quedaría en un
        // estado que ningún botón representa y del que no se sale sin editar la
        // barra de direcciones.
        expect(leerFiltros(params('orden=loquesea')).orden).toBe('recent');
        expect(leerFiltros(params('espectro=izquierda')).espectro).toBe('all');
    });

    it('neutraliza un intento de inyección desde la barra de direcciones', () => {
        const f = leerFiltros(params('espectro=%3Cscript%3Ealert(1)%3C%2Fscript%3E'));
        expect(f.espectro).toBe('all');
    });

    it('un parámetro vacío cae al valor por omisión y no a cadena vacía', () => {
        expect(leerFiltros(params('ambito=')).ambito).toBe('all');
    });
});

describe('leerVisibles (F3-06)', () => {
    it('empieza en una página', () => {
        expect(leerVisibles(params(), 100)).toBe(TAMANO_PAGINA);
    });

    it('respeta un valor razonable', () => {
        expect(leerVisibles(params('ver=30'), 100)).toBe(30);
    });

    it('acota por arriba para que no cuelgue el navegador', () => {
        // `?ver=999999999` haría que se intentaran pintar un millón de tarjetas.
        // No hace falta mala intención: basta un dedo torpe en la URL.
        expect(leerVisibles(params('ver=999999999'), 80)).toBe(80);
    });

    it('ignora lo que no es un número', () => {
        expect(leerVisibles(params('ver=muchas'), 100)).toBe(TAMANO_PAGINA);
        expect(leerVisibles(params('ver=-5'), 100)).toBe(TAMANO_PAGINA);
    });

    it('redondea al múltiplo de página, para no dejar filas a medias', () => {
        expect(leerVisibles(params('ver=23'), 100)).toBe(30);
    });
});

describe('aplicarCambios (F3-06)', () => {
    it('NO escribe en la URL los valores por omisión', () => {
        // La portada es `/`, no `/?ambito=all&espectro=all&ciego=all&...`.
        // Una URL que se comparte se lee, y esa no dice nada.
        const salida = aplicarCambios(params('ambito=nacional'), { ambito: 'all' });
        expect(salida.toString()).toBe('');
    });

    it('conserva los demás filtros al cambiar uno', () => {
        const salida = aplicarCambios(params('ambito=nacional&orden=coverage'), { espectro: 'left' });
        expect(salida.get('ambito')).toBe('nacional');
        expect(salida.get('orden')).toBe('coverage');
        expect(salida.get('espectro')).toBe('left');
    });

    it('no muta los parámetros que recibe', () => {
        // setSearchParams recibe los previos: mutarlos produciría estados
        // incoherentes cuando React reejecuta el actualizador.
        const originales = params('ambito=nacional');
        aplicarCambios(originales, { ambito: 'all' });
        expect(originales.get('ambito')).toBe('nacional');
    });

    it('quita `ver` cuando vuelve a una sola página', () => {
        expect(aplicarCambios(params('ver=40'), { ver: null }).toString()).toBe('');
        expect(aplicarCambios(params('ver=40'), { ver: TAMANO_PAGINA }).toString()).toBe('');
    });

    it('escribe `ver` cuando hay más de una página', () => {
        expect(aplicarCambios(params(), { ver: 30 }).get('ver')).toBe('30');
    });
});

describe('el filtro de departamento (mapa)', () => {
    it('acepta un slug de la lista', () => {
        expect(leerFiltros(params('depto=norte-de-santander')).depto).toBe('norte-de-santander');
        expect(leerFiltros(params('depto=bogota')).depto).toBe('bogota');
    });

    it('descarta un departamento inventado en vez de propagarlo', () => {
        // Sin validar, el feed se quedaría vacío para siempre y ningún botón
        // podría representar ese estado.
        expect(leerFiltros(params('depto=narnia')).depto).toBe('all');
        expect(leerFiltros(params('depto=Nariño')).depto).toBe('all');
    });

    it('los válidos salen de shared/geografia, no de una copia', () => {
        // Repetir la lista aquí sería el sitio donde el mapa y el detector
        // acabarían discrepando sin que nada avisara.
        expect(FILTROS.depto.validos).toHaveLength(SLUGS_DEPARTAMENTO.length + 1);
        for (const slug of SLUGS_DEPARTAMENTO) {
            expect(FILTROS.depto.validos).toContain(slug);
        }
    });

    it('«all» no se escribe en la URL: la portada sigue siendo /', () => {
        expect(aplicarCambios(params('depto=cauca'), { depto: 'all' }).toString()).toBe('');
    });

    it('cambiar de departamento vuelve a la primera página', () => {
        const siguiente = aplicarCambios(params('depto=cauca&ver=30'), { depto: 'huila', ver: null });
        expect(siguiente.get('depto')).toBe('huila');
        expect(siguiente.get('ver')).toBeNull();
    });
});
