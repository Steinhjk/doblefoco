// @ts-check
import { describe, it, expect } from 'vitest';
import { CAMPOS_DE_HISTORIA, CAMPOS_QUE_SE_COPIAN } from './contratoDeHistoria.js';
import { componerHistoria } from '../server/db/feedStore.js';
import { normalizeStory } from '../src/lib/story.js';

/**
 * LA IDA Y LA VUELTA, CON LAS DOS FUNCIONES DE VERDAD.
 *
 * No se lee ningún fichero como texto ni se imita a nadie: se llama a
 * `componerHistoria` con una fila inventada, se pasa el resultado por
 * `JSON.parse(JSON.stringify(...))` —que es literalmente lo que hace el cable— y
 * se le da a `normalizeStory`. Lo que sobreviva es lo que ve el lector.
 *
 * La fila usa medios REALES del catálogo: `normalizeStory` resuelve las fuentes
 * contra `mediaRegistry` y con nombres inventados caerían todas en «fuente sin
 * identificar», que es justo la rama que no se quiere probar aquí.
 */

const AHORA = Date.parse('2026-09-08T12:00:00Z');

const articulos = [
    {
        id: 'art-1',
        outlet: 'El Tiempo',
        source_id: 'el-tiempo',
        headline: 'Un titular cualquiera que no dice nada escandaloso',
        snippet: 'El primer párrafo, tal como lo publicó el medio.',
        canonical_url: 'https://eltiempo.com/una-noticia',
        published_at: new Date(AHORA - 3 * 3600_000).toISOString(),
        first_seen_at: new Date(AHORA - 3 * 3600_000).toISOString(),
        bias: 0.2,
        factuality: 0.85,
        image_url: 'https://eltiempo.com/foto.jpg',
    },
    {
        id: 'art-2',
        outlet: 'Semana',
        source_id: 'semana',
        headline: 'La misma noticia contada por otro medio del catálogo',
        snippet: 'Otro primer párrafo.',
        canonical_url: 'https://semana.com/una-noticia',
        published_at: new Date(AHORA - 5 * 3600_000).toISOString(),
        first_seen_at: new Date(AHORA - 5 * 3600_000).toISOString(),
        bias: 0.45,
        factuality: 0.8,
        image_url: null,
    },
];

const fila = {
    id: 'una-noticia-abc123',
    title: 'Un titular cualquiera que no dice nada escandaloso',
    title_outlet: 'El Tiempo',
    title_source_id: 'el-tiempo',
    title_url: 'https://eltiempo.com/una-noticia',
    category: 'Política',
    topics: ['politica'],
    ambito: 'nacional',
    departamento: 'Cundinamarca',
    published_at: new Date(AHORA - 3 * 3600_000).toISOString(),
    first_seen_at: new Date(AHORA - 5 * 3600_000).toISOString(),
    archivada_el: null,
};

const historia = componerHistoria(fila, articulos);
/** Lo que de verdad cruza el cable: JSON y nada más. */
const porElCable = JSON.parse(JSON.stringify(historia));
const normalizada = normalizeStory(porElCable);

describe('el contrato entre el motor y la interfaz', () => {
    it('el contrato nombra exactamente lo que manda el motor, ni más ni menos', () => {
        /*
         * LAS DOS DIRECCIONES, Y HACEN FALTA LAS DOS. Un campo nuevo en el motor
         * sin línea aquí es el fallo que se quiere cazar; una línea aquí sobre un
         * campo que ya no se manda es documentación que envejeció, y este
         * repositorio tiene un vigilante entero dedicado a eso.
         */
        expect(Object.keys(historia).sort()).toEqual(Object.keys(CAMPOS_DE_HISTORIA).sort());
    });

    it('todo lo que el contrato marca «copia» llega intacto al cliente', () => {
        const perdidos = CAMPOS_QUE_SE_COPIAN.filter(
            (campo) => porElCable[campo] !== undefined && normalizada?.[campo] === undefined
        );

        expect(perdidos, 'campos que el motor manda y el normalizador tira sin avisar').toEqual([]);
    });

    it('y llega con el mismo valor, no solo con la clave puesta', () => {
        for (const campo of CAMPOS_QUE_SE_COPIAN) {
            if (porElCable[campo] === undefined || porElCable[campo] === null) continue;
            // `factuality` se recalcula si no viene; aquí viene, así que se copia.
            expect(normalizada?.[campo], `${campo} cambió al normalizar`).toEqual(porElCable[campo]);
        }
    });

    it('el veredicto del punto ciego se trasplanta y no se recalcula', () => {
        /*
         * Es la excepción que costó 6 299 historias con cero puntos ciegos: el
         * cliente NO tiene las tasas base del corpus, así que recalcular aquí da
         * un veredicto distinto del que firmó el servidor. Se comprueba con un
         * veredicto inventado para que la prueba no dependa de que el fixture
         * dispare la señal.
         */
        const conVeredicto = {
            ...porElCable,
            blindspot: {
                spectrum: 'left',
                label: 'Sin medios de izquierda',
                contexto: { tasa: 0.0329 },
            },
            ausencia: {
                spectrum: 'left',
                label: 'Apenas 1 medio de izquierda',
                contexto: { tasa: 0.0329 },
            },
        };
        const salida = normalizeStory(conVeredicto);

        expect(salida?.coverage?.blindspot).toEqual(conVeredicto.blindspot);
        expect(salida?.coverage?.ausencia).toEqual(conVeredicto.ausencia);
    });

    it('las fuentes se resuelven contra el catálogo, que es lo que «deriva» promete', () => {
        // El motor mandó bias 0.2 para El Tiempo; manda el catálogo.
        const elTiempo = normalizada?.sources.find((s) => s.name === 'El Tiempo');
        expect(elTiempo?.isKnown).toBe(true);
        expect(elTiempo?.id).toBe('el-tiempo');
    });

    it('cada campo que «deriva» dice por qué, o no es una decisión: es un olvido', () => {
        const sinMotivo = Object.entries(CAMPOS_DE_HISTORIA)
            .filter(([, c]) => c.trato === 'deriva' && !c.motivo?.trim())
            .map(([nombre]) => nombre);

        expect(sinMotivo, 'campos que el cliente descarta sin decir por qué').toEqual([]);
    });
});
