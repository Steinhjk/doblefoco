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
    mergeSimilarClusters,
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

describe('fusión de grupos (F1-05)', () => {
    /**
     * Regresión del caso que destapó el fallo, con titulares REALES del corpus
     * del 2026-07-28.
     *
     * La asignación es de una sola pasada: cada artículo entra en el mejor
     * grupo que exista en ese momento y nada vuelve a mirar los grupos después.
     * Estos trece titulares acababan en DOS historias —una de 8 medios y otra
     * de 5— cuya similitud entre sí era 0,455, muy por encima del umbral. Trece
     * medios sobre un hecho superan de sobra los 6 que exige afirmar un punto
     * ciego; ocho y cinco por separado, no.
     */
    const GAONA = [
        'Abelardo de la Espriella designa a Mauricio Gaona como embajador de Colombia ante la ONU',
        'Abelardo De La Espriella designó a Mauricio Gaona como embajador ante las Naciones Unidas',
        '¿Quién es Mauricio Gaona, el nuevo embajador de Colombia ante las Naciones Unidas?',
        'Mauricio Gaona será el embajador de Colombia ante la ONU en el gobierno de De la Espriella',
        'De la Espriella designó al jurista Mauricio Gaona como embajador ante la ONU',
        'De la Espriella anuncia al jurista Mauricio Gaona como embajador ante las Naciones Unidas',
        'Mauricio Gaona, nuevo embajador de Colombia ante la ONU en Nueva York',
        'Mauricio Gaona será el embajador de Abelardo ante la ONU',
        'De la Espriella nombra a Mauricio Gaona embajador de Colombia ante la ONU',
        'Abelardo De La Espriella ya eligió a su embajador ante la ONU: este es Mauricio Gaona',
    ];

    it('reúne en una sola historia lo que la pasada única partía en dos', () => {
        const sinFusion = clusterArticles(GAONA.map((t) => ({ cleanTitle: t })), { merge: false });
        const conFusion = clusterArticles(GAONA.map((t) => ({ cleanTitle: t })));

        expect(sinFusion.length).toBeGreaterThan(1);
        expect(conFusion).toHaveLength(1);
        expect(conFusion[0].articles).toHaveLength(GAONA.length);
    });

    it('NO fusiona hechos distintos de una misma saga', () => {
        // Dos desarrollos de la saga de Angie Rodríguez que comparten poco
        // léxico: la petición y la denuncia penal son hechos distintos y así
        // deben quedar. Si una futura calibración los uniera, esta prueba avisa.
        const clusters = clusterArticles([
            { cleanTitle: 'Petro pidió declarar insubsistente a Angie Rodríguez tras sus denuncias' },
            { cleanTitle: 'Papá Pitufo denunció al presidente Gustavo Petro por injuria y calumnia' },
        ]);

        expect(clusters).toHaveLength(2);
    });

    it('DOCUMENTA una fusión incorrecta conocida, no la disimula', () => {
        // La petición de Petro y el hecho de que NO se ejecutara son dos
        // sucesos distintos, pero comparten cuatro tokens fuertes —angie,
        // rodriguez, insubsistente, petro— y Jaccard da 0,364, por encima del
        // umbral. Se fusionan.
        //
        // Es una de las dos fusiones incorrectas que mide `npm run
        // eval:clustering` sobre el conjunto etiquetado, y NO la introdujo la
        // fusión de grupos: ya ocurría en la asignación. Queda escrita aquí
        // para que se sepa que existe y para que, el día que se arregle, esta
        // prueba falle y obligue a actualizarla.
        const clusters = clusterArticles([
            { cleanTitle: 'Petro pidió declarar insubsistente a Angie Rodríguez tras sus denuncias' },
            { cleanTitle: 'Angie Rodríguez no fue declarada insubsistente, pese a petición del presidente Petro' },
        ]);

        expect(clusters).toHaveLength(1);
    });

    it('deja en paz lo que ya estaba bien separado', () => {
        const clusters = clusterArticles([
            { cleanTitle: 'Corte Constitucional tumba la reforma pensional del gobierno' },
            { cleanTitle: 'Selección Colombia venció a Uruguay en el estadio Metropolitano' },
            { cleanTitle: 'Fuerte terremoto de magnitud 7,1 sacude el sur de Japón' },
        ]);

        expect(clusters).toHaveLength(3);
    });

    it('termina aunque se lo pongan difícil', () => {
        // Cadena de titulares donde cada uno se parece al siguiente. Sin tope de
        // pasadas, una fusión habilita otra indefinidamente y el ciclo de
        // ingesta se cuelga.
        const cadena = Array.from({ length: 40 }, (_, i) => ({
            cleanTitle: `Reforma pensional avanza en el Congreso etapa ${i} debate ${i + 1} ponencia`,
        }));

        const inicio = Date.now();
        const clusters = mergeSimilarClusters(clusterArticles(cadena, { merge: false }));

        expect(Date.now() - inicio).toBeLessThan(3000);
        expect(clusters.length).toBeGreaterThan(0);
        // Ningún artículo se pierde ni se duplica al fusionar.
        expect(clusters.reduce((n, c) => n + c.articles.length, 0)).toBe(cadena.length);
    });

    it('no pierde ni duplica artículos', () => {
        const entrada = [...GAONA, 'Terremoto en Japón deja decenas de heridos'].map((t) => ({ cleanTitle: t }));
        const clusters = clusterArticles(entrada);
        const titulos = clusters.flatMap((c) => c.articles.map((a) => a.cleanTitle));

        expect(titulos).toHaveLength(entrada.length);
        expect(new Set(titulos).size).toBe(entrada.length);
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
