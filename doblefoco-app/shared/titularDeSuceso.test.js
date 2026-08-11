// @ts-check
import { describe, it, expect } from 'vitest';
import { formatoDeAcompanamiento, elegirRepresentante } from './titularDeSuceso.js';

const AHORA = Date.parse('2026-08-10T22:00:00Z');
const haceHoras = (h) => new Date(AHORA - h * 3_600_000).toISOString();

const historia = (id, title, medios, horas = 2) => ({
    id,
    title,
    publishedAt: haceHoras(horas),
    sources: Array.from({ length: medios }, (_, i) => ({ name: `m${id}${i}`, bias: 0 })),
});

describe('formatoDeAcompanamiento', () => {
    /**
     * Titulares reales del 2026-08-10. Son los que aparecieron compitiendo por
     * dar nombre a un suceso.
     */
    const acompanamiento = [
        ['material', 'Las últimas fotos de las turistas colombianas antes del accidente de helicóptero'],
        ['directo', 'En directo: Netanyahu rechaza el plan de Estados Unidos para Gaza'],
        ['pregunta', '¿Quién era alias El Ruso, abatido este domingo por las Fuerzas Militares?'],
        ['pregunta', 'Terremoto en Colombia: ¿Se pueden predecir las réplicas de los sismos?'],
        ['instructivo', 'Así puede activar las alertas sísmicas en su celular'],
        ['cita', '“Nos enteramos por internet”: familiar de colombianas que fallecieron'],
        ['formato', 'Video | Este es el momento exacto del accidente del concejal'],
    ];

    for (const [esperado, titulo] of acompanamiento) {
        it(`marca como «${esperado}»: ${titulo.slice(0, 42)}…`, () => {
            expect(formatoDeAcompanamiento(titulo)).toBe(esperado);
        });
    }

    /**
     * LA PARTE QUE MÁS IMPORTA: no marcar de más. Un buen titular con coletilla
     * detrás sigue siendo un buen titular, y descartarlo dejaría al suceso con
     * un nombre peor. «esto se sabe» al final es exactamente el caso que hizo
     * anclar las reglas al arranque.
     */
    const noticias = [
        'Tres colombianas mueren en accidente de helicóptero: esto se sabe de la tragedia',
        'Gobierno declara desastre nacional tras terremoto en Chocó que deja 71 muertos',
        'Israel rechaza el "plan de paz" de Trump para Gaza y no retirará tropas',
        'Atentan con explosivos contra el nuevo peaje de la vía Panamericana en Cauca',
        'Abatieron a “El Ruso”, cabecilla de disidencias de Mordisco',
        'Asciende a 111 la cifra de fallecidos por el terremoto en Colombia',
    ];

    for (const titulo of noticias) {
        it(`NO marca una noticia normal: ${titulo.slice(0, 42)}…`, () => {
            expect(formatoDeAcompanamiento(titulo)).toBeNull();
        });
    }

    it('aguanta la entrada vacía', () => {
        expect(formatoDeAcompanamiento('')).toBeNull();
        expect(formatoDeAcompanamiento(/** @type {any} */ (null))).toBeNull();
    });
});

describe('elegirRepresentante', () => {
    /**
     * EL CASO QUE MOTIVÓ EL MÓDULO. La galería de fotos estaba más cubierta que
     * la noticia, y titulaba el suceso entero.
     */
    it('no deja que la galería de fotos titule la muerte de tres personas', () => {
        const angulos = [
            historia('fotos', 'Las últimas fotos de las turistas colombianas antes del accidente', 5, 1),
            historia('cita', '“Nos enteramos por internet”: familiar de las colombianas', 4, 2),
            historia('hecho', 'Tres colombianas mueren en accidente de helicóptero', 4, 2),
        ];

        expect(elegirRepresentante(angulos, AHORA).id).toBe('hecho');
    });

    it('entre piezas limpias elige la más relevante, sin inventarse otro orden', () => {
        const angulos = [
            historia('poca', 'Gobierno declara desastre nacional ante emergencia', 3, 2),
            historia('mucha', 'Gobierno declara desastre nacional tras terremoto en Chocó', 7, 2),
        ];

        expect(elegirRepresentante(angulos, AHORA).id).toBe('mucha');
    });

    /**
     * Preferir un titular imperfecto a no tener titular. Es la misma decisión
     * que toma `resumirSuceso` cuando ninguna historia trae nombres de medio.
     */
    it('si todas son de acompañamiento, titula igual con la más relevante', () => {
        const angulos = [
            historia('a', '¿Qué se sabe del accidente?', 2, 2),
            historia('b', 'Video | El momento del accidente', 6, 2),
        ];

        expect(elegirRepresentante(angulos, AHORA).id).toBe('b');
    });

    it('devuelve null sin nada que elegir', () => {
        expect(elegirRepresentante([], AHORA)).toBeNull();
        expect(elegirRepresentante(/** @type {any} */ (null), AHORA)).toBeNull();
    });
});
