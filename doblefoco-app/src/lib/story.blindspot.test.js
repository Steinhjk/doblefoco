// @ts-check
import { describe, it, expect } from 'vitest';
import { normalizeStory, puntoCiegoDelServidor } from './story.js';

/**
 * EL PUNTO CIEGO CRUZA LA COSTURA API↔CLIENTE, Y SE PERDÍA AL CRUZARLA.
 *
 * QUÉ PASÓ (2026-08-21)
 * ---------------------
 * El servidor calcula el punto ciego con las tasas base del corpus entero
 * —7 559 apariciones medio-historia— y lo manda en la respuesta. El cliente lo
 * RECALCULABA con `analyzeCoverage(sources)`, sin tasas, y sin tasas esa función
 * calla por diseño. Además `normalizeStory` construye un objeto nuevo que no
 * copiaba `raw.blindspot`. Resultado: el veredicto se descartaba dos veces y
 * `coverage.blindspot` era `null` pasara lo que pasara.
 *
 * `MobileSidebar` tiene una pestaña «Puntos ciegos» que por eso solo podía
 * enseñar su estado vacío.
 *
 * POR QUÉ NO LO CAZÓ NADA
 * -----------------------
 * Porque el servidor tampoco encuentra ninguno hoy —el modelo exige 90 medios en
 * una sola historia para la izquierda, ver `ESTUDIO_PUNTOS_CIEGOS.md`—, así que
 * `null` era también la respuesta correcta por accidente. **Un fallo tapado por
 * otro.** El día que el modelo empezara a encontrarlos, la pantalla habría
 * seguido sin enseñarlos y nadie habría sabido por qué.
 *
 * Por eso estas pruebas fabrican el veredicto en vez de esperar a que exista:
 * son la única forma de comprobar hoy algo que la producción no produce todavía.
 */

/** Un punto ciego con la forma exacta que arma `analyzeCoverage`. */
const PUNTO_CIEGO = {
    spectrum: 'left',
    label: 'Punto ciego de la izquierda',
    description:
        '9 de 10 medios que cubren el hecho son de derecha o de orientación mixta. ' +
        'Solo 1 de izquierda lo reportan.',
};

const historia = (extra = {}) => ({
    id: 'h1',
    title: 'Un hecho que la prensa cubrió',
    sources: [
        { name: 'El Tiempo', bias: 0.1 },
        { name: 'Semana', bias: 0.45 },
        { name: 'El Espectador', bias: 0 },
        { name: 'La FM', bias: 0.35 },
    ],
    ...extra,
});

describe('puntoCiegoDelServidor', () => {
    it('devuelve el veredicto cuando el servidor lo manda', () => {
        expect(puntoCiegoDelServidor({ blindspot: PUNTO_CIEGO })).toEqual(PUNTO_CIEGO);
    });

    it('calla cuando el servidor dice que no hay', () => {
        expect(puntoCiegoDelServidor({ blindspot: null })).toBeNull();
    });

    it('calla cuando la API no manda el campo', () => {
        /*
         * Un despliegue de la API anterior a que el campo existiera. No se
         * inventa una respuesta: callar es la degradación correcta cuando lo que
         * se afirmaría es que alguien omitió algo.
         */
        expect(puntoCiegoDelServidor({})).toBeNull();
        expect(puntoCiegoDelServidor(null)).toBeNull();
    });

    it('calla ante una forma que no es un veredicto', () => {
        expect(puntoCiegoDelServidor({ blindspot: 'izquierda' })).toBeNull();
        expect(puntoCiegoDelServidor({ blindspot: {} })).toBeNull();
        expect(puntoCiegoDelServidor({ blindspot: { spectrum: 'left' } })).toBeNull();
    });
});

describe('normalizeStory conserva el veredicto del servidor', () => {
    it('el punto ciego llega hasta `coverage.blindspot`', () => {
        // ESTA es la prueba que habría cazado el fallo.
        const n = normalizeStory(historia({ blindspot: PUNTO_CIEGO }));
        expect(n.coverage.blindspot).toEqual(PUNTO_CIEGO);
    });

    it('sin veredicto del servidor, el cliente NO se lo inventa', () => {
        /*
         * El cliente no tiene las tasas base del corpus y no debe estimarlas de
         * lo que lleva descargado: esa tasa cambiaría al desplazarse la lista, y
         * con ella la acusación.
         */
        expect(normalizeStory(historia()).coverage.blindspot).toBeNull();
        expect(normalizeStory(historia({ blindspot: null })).coverage.blindspot).toBeNull();
    });

    it('lo demás se sigue calculando en el cliente, que para eso no hacen falta tasas', () => {
        /*
         * `sorprende()` solo se usa dentro de las tres ramas del punto ciego, así
         * que el resto de `analyzeCoverage` es correcto sin tasas base. Es la
         * razón de que el énfasis sí funcione hoy y el punto ciego no.
         */
        const n = normalizeStory(historia({ blindspot: PUNTO_CIEGO }));
        expect(n.coverage.total).toBe(4);
        expect(n.coverage.counts).toEqual({ left: 0, center: 2, right: 2 });
        expect(n.coverage.percentages).toBeTruthy();
        expect(typeof n.coverage.polarization).toBe('number');
        expect('enfasis' in n.coverage).toBe(true);
    });

    it('los conteos del cliente no contradicen la descripción del servidor', () => {
        /*
         * El veredicto trae números dentro de su texto —«9 de 10 medios»—. Si el
         * cliente contara distinto que el servidor, la frase contradiría a la
         * barra pintada al lado. Comprobado sobre las 100 historias del feed de
         * producción el 2026-08-21: coinciden en las 100. Esta prueba fija la
         * forma de la que depende esa coincidencia.
         */
        const n = normalizeStory(historia());
        const { counts, total } = n.coverage;
        expect(counts.left + counts.center + counts.right).toBe(total);
        expect(total).toBe(historia().sources.length);
    });
});
