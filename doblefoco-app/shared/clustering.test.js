/**
 * Pruebas del agrupamiento y los identificadores — tarea F2-09.
 *
 * El error caro de este módulo no es el que parece. Separar dos artículos que
 * hablaban del mismo hecho produce dos historias con un medio cada una: se
 * pierde una comparación. FUSIONAR dos hechos distintos produce una historia
 * que afirma una cobertura que no existe, y sobre esa cobertura inventada se
 * calcula después un punto ciego.
 *
 * Por eso el umbral está calibrado del lado conservador (0.34, documentado en
 * clustering.js) y por eso estas pruebas insisten más en lo que NO debe
 * agruparse. Son también la red que necesita F1-05, que va a sustituir Jaccard
 * por similitud semántica: sin ellas, "mejoró" sería una opinión.
 */

import { describe, it, expect } from 'vitest';
import {
    articleId,
    clusterArticles,
    contentHash,
    isSameStory,
    similarity,
    storyId,
    tokenize,
    MIN_SHARED_TOKENS,
} from './clustering.js';

describe('tokenize', () => {
    it('ignora tildes, para que Bogotá y Bogota sean el mismo token', () => {
        expect(tokenize('Bogotá')).toEqual(tokenize('Bogota'));
        expect(tokenize('Petró elección')).toEqual(tokenize('Petro eleccion'));
    });

    it('descarta palabras vacías y palabras de menos de tres letras', () => {
        const tokens = tokenize('El presidente de la República en la casa');

        expect(tokens.has('presidente')).toBe(true);
        expect(tokens.has('republica')).toBe(true);
        expect(tokens.has('casa')).toBe(true);
        expect(tokens.has('el')).toBe(false);
        expect(tokens.has('de')).toBe(false);
        expect(tokens.has('la')).toBe(false);
        expect(tokens.has('en')).toBe(false);
    });

    it('conserva los números, que distinguen hechos', () => {
        // "reforma de 2026" y "reforma de 2024" no son el mismo hecho.
        expect(tokenize('Reforma tributaria 2026').has('2026')).toBe(true);
    });

    it('no revienta con entradas vacías o de otro tipo', () => {
        for (const value of ['', null, undefined, 42, {}]) {
            expect(tokenize(value).size).toBe(0);
        }
    });
});

describe('similarity', () => {
    it('da 1 a dos conjuntos idénticos y 0 a dos disjuntos', () => {
        expect(similarity(tokenize('rescate minero Antioquia'), tokenize('rescate minero Antioquia')).score).toBe(1);
        expect(similarity(tokenize('rescate minero'), tokenize('reforma pensional')).score).toBe(0);
    });

    it('es simétrica', () => {
        const a = tokenize('Corte Constitucional tumba la reforma');
        const b = tokenize('La Corte tumba reforma pensional');

        expect(similarity(a, b).score).toBe(similarity(b, a).score);
    });

    it('devuelve 0 sin lanzar cuando un conjunto está vacío', () => {
        expect(similarity(new Set(), tokenize('algo'))).toEqual({ score: 0, shared: 0 });
    });
});

describe('isSameStory — lo que NO debe fusionarse', () => {
    it('separa dos hechos distintos que empiezan igual', () => {
        // El agrupamiento anterior del servidor usaba las tres primeras
        // palabras largas del titular. Estos dos caían en la misma historia.
        expect(
            isSameStory(
                'Gobierno anuncia nueva reforma tributaria para financiar el subsidio de vivienda',
                'Gobierno anuncia nueva ronda de diálogos con el ELN en Venezuela'
            )
        ).toBe(false);
    });

    it('separa dos hechos distintos sobre la misma persona', () => {
        expect(
            isSameStory(
                'Petro se reúne con el presidente de Brasil en Brasilia',
                'Petro sanciona la reforma pensional tras el aval de la Corte'
            )
        ).toBe(false);
    });

    it(`exige al menos ${MIN_SHARED_TOKENS} tokens compartidos`, () => {
        // Dos titulares cortos que comparten una sola palabra pueden alcanzar
        // un Jaccard alto por accidente aritmético. El mínimo absoluto lo
        // impide.
        expect(isSameStory('Renunció el ministro', 'Renunció')).toBe(false);
    });

    it('no agrupa titulares vacíos entre sí', () => {
        expect(isSameStory('', '')).toBe(false);
    });
});

describe('isSameStory — lo que SÍ debe agruparse', () => {
    it('reconoce el mismo hecho titulado por dos medios distintos', () => {
        expect(
            isSameStory(
                'Corte Constitucional tumba la reforma pensional del gobierno Petro',
                'La Corte Constitucional tumbó la reforma pensional de Petro'
            )
        ).toBe(true);
    });

    it('aguanta una conjugación distinta si el resto del titular coincide', () => {
        // "Rescatan" y "Rescataron" son tokens DISTINTOS: el agrupamiento es
        // léxico, no semántico, y no lematiza. Aun así estos dos se agrupan,
        // porque los otros tres tokens (mineros, atrapados, antioquia) bastan
        // para superar el umbral.
        //
        // Merece quedar escrito porque marca dónde está el límite real: la
        // tolerancia a las reformulaciones no viene de entender el idioma, sino
        // de que sobren tokens coincidentes. En titulares cortos, donde no
        // sobran, es justo donde Jaccard falla — y es lo que F1-05 debe medir
        // antes y después de cambiar el método.
        expect(
            isSameStory(
                'Rescatan a 12 mineros atrapados en Antioquia',
                '¡Rescataron a los 12 mineros atrapados en Antioquía!'
            )
        ).toBe(true);
    });

    it('pierde la reformulación cuando el titular es corto (limitación conocida)', () => {
        // Mismo hecho, dicho de otra forma, sin tokens de sobra que compensen.
        // Está documentado como limitación, no como defecto a tapar: es el caso
        // que justifica F1-05.
        expect(isSameStory('Renunció el ministro de Hacienda', 'Dimite el jefe de la cartera fiscal')).toBe(false);
    });
});

describe('clusterArticles', () => {
    it('junta el mismo hecho y separa los distintos', () => {
        const clusters = clusterArticles([
            { cleanTitle: 'Corte Constitucional tumba la reforma pensional del gobierno' },
            { cleanTitle: 'La Corte Constitucional tumbó la reforma pensional del gobierno' },
            { cleanTitle: 'Selección Colombia venció a Uruguay en el estadio Metropolitano' },
        ]);

        expect(clusters).toHaveLength(2);
        expect(clusters[0].articles).toHaveLength(2);
        expect(clusters[1].articles).toHaveLength(1);
    });

    it('descarta artículos sin titular utilizable en vez de agruparlos juntos', () => {
        // Si los titulares vacíos produjeran un clúster, todas las noticias
        // rotas de todos los medios acabarían en una sola historia con
        // cobertura masiva y falsa.
        const clusters = clusterArticles([
            { cleanTitle: '' },
            { cleanTitle: null },
            { cleanTitle: 'de la el en' },
        ]);

        expect(clusters).toHaveLength(0);
    });

    it('acumula el vocabulario del grupo, no solo el del primer artículo', () => {
        const clusters = clusterArticles([
            { cleanTitle: 'Corte Constitucional tumba reforma pensional' },
            { cleanTitle: 'Corte Constitucional tumba reforma pensional del gobierno Petro' },
        ]);

        expect(clusters).toHaveLength(1);
        expect(clusters[0].tokens.has('petro')).toBe(true);
        expect(clusters[0].tokens.has('gobierno')).toBe(true);
    });

    it('no lanza con entradas que no son un array', () => {
        expect(clusterArticles(null)).toEqual([]);
        expect(clusterArticles(undefined)).toEqual([]);
    });
});

describe('identificadores estables (F1-11)', () => {
    it('deriva el id del contenido, no del reloj', () => {
        // Los ids anteriores eran `Date.now() + idx`: colisionaban dentro del
        // mismo milisegundo y cambiaban en cada ciclo, así que /noticia/:id
        // apuntaba a una noticia distinta según cuándo se hubiera generado.
        const primero = articleId('https://ejemplo.co/nota');
        const segundo = articleId('https://ejemplo.co/nota');

        expect(primero).toBe(segundo);
        expect(articleId('https://ejemplo.co/otra')).not.toBe(primero);
    });

    it('distingue artículos de historias por el prefijo', () => {
        expect(articleId('x')).toMatch(/^art_/);
        expect(storyId('x')).toMatch(/^story_/);
    });

    it('produce un hash estable e independiente del orden de llamada', () => {
        expect(contentHash('a', 'b')).toBe(contentHash('a', 'b'));
        expect(contentHash('a', 'b')).not.toBe(contentHash('b', 'a'));
    });

    it('cae al titular cuando no hay enlace', () => {
        expect(articleId('', 'Un titular')).toBe(articleId(null, 'Un titular'));
    });
});
