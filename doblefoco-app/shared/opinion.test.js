// @ts-check
import { describe, it, expect } from 'vitest';
import {
    detectarOpinion,
    detectarOpinionDeclarada,
    detectarOpinionDelArticulo,
    nombreDesdeRanura,
} from './opinion.js';

/**
 * Las URLs de esta prueba son REALES, tomadas del corpus el 2026-08-09. Inventar
 * ejemplos aquí haría que el detector pasara contra un mundo imaginario, que es
 * exactamente el error que se quiere evitar en un módulo cuya única entrada es
 * cómo escriben las direcciones seis medios distintos.
 */
describe('detectarOpinion', () => {
    it('reconoce la ruta de opinión de cada medio del corpus', () => {
        const reales = [
            'https://www.infobae.com/opinion/2025/04/06/el-camino-hacia-el-abismo/',
            'https://www.lasillavacia.com/opinion/la-segunda-batalla-cultural/',
            'https://www.semana.com/economia/opinion/articulo/no-hay-mal-que-dure-4-anos/202650/',
        ];
        for (const url of reales) {
            expect(detectarOpinion(url).esOpinion, url).toBe(true);
        }
    });

    it('saca el nombre del columnista cuando la URL lo trae', () => {
        // Vanguardia publica el autor en la dirección: no hay que deducirlo.
        const r = detectarOpinion(
            'https://www.vanguardia.com/opinion/columnistas/luis-ernesto-ruiz/2026/08/06/el-reto-apenas-comienza/'
        );
        expect(r).toEqual({ esOpinion: true, tipo: 'columna', columnista: 'Luis Ernesto Ruiz' });
    });

    it('distingue el editorial, que es la voz del propio medio', () => {
        // Un editorial sin firma es el indicio MÁS fuerte de la línea de la casa,
        // más que cualquier columnista invitado. Por eso no va en el mismo saco.
        const r = detectarOpinion(
            'https://www.elpais.com.co/opinion/editorial/es-el-momento-de-la-cali-civica.html'
        );
        expect(r.tipo).toBe('editorial');
        expect(r.columnista).toBeNull();
    });

    it('marca la caricatura aparte: es opinión pero no es texto', () => {
        const r = detectarOpinion('https://www.elpais.com.co/opinion/caricaturas/nieves-0650.html');
        expect(r.tipo).toBe('caricatura');
    });

    it('NO marca como opinión una noticia normal', () => {
        const noticias = [
            'https://www.eltiempo.com/politica/congreso/reforma-pensional-2026',
            'https://www.elespectador.com/judicial/capturan-a-alias-el-costeno/',
            'https://www.elheraldo.co/barranquilla/obras-del-malecon-avanzan',
        ];
        for (const url of noticias) {
            expect(detectarOpinion(url).esOpinion, url).toBe(false);
        }
    });

    it('no confunde una palabra suelta con una ruta', () => {
        // Sin URL parseable no se afirma nada: un titular que diga «opinión» no
        // convierte la pieza en columna.
        expect(detectarOpinion('columna de opinion sobre el paro').esOpinion).toBe(false);
        expect(detectarOpinion(null).esOpinion).toBe(false);
        expect(detectarOpinion(undefined).esOpinion).toBe(false);
    });

    it('no toma por persona un segmento de listado', () => {
        const r = detectarOpinion('https://www.vanguardia.com/opinion/columnistas/todos/');
        expect(r.esOpinion).toBe(true);
        expect(r.columnista).toBeNull();
    });
});

describe('nombreDesdeRanura', () => {
    it('deja las partículas en minúscula, como se escriben en español', () => {
        expect(nombreDesdeRanura('maria-de-la-cruz-gomez')).toBe('Maria de la Cruz Gomez');
    });

    it('devuelve null con un solo token: rara vez es un nombre', () => {
        expect(nombreDesdeRanura('editorial')).toBeNull();
        expect(nombreDesdeRanura('')).toBeNull();
    });
});

/**
 * LAS ETIQUETAS DE ESTA PRUEBA TAMBIÉN SON REALES, leídas de los feeds el
 * 2026-09-09. Es la misma regla que arriba y por el mismo motivo: el detector no
 * puede pasar contra un mundo imaginario cuando su única entrada es cómo
 * etiquetan veintidós redacciones distintas.
 */
describe('detectarOpinionDeclarada', () => {
    it('reconoce las etiquetas tal como las escribe cada casa', () => {
        const reales = [
            ['Opinión'],                                  // Las2Orillas, Volcánicas, Semanario VOZ
            ['opinión', 'Fuerzas Militares'],             // Las2Orillas, en minúscula
            ['Opinion', 'política'],                      // Las2Orillas, sin tilde
            ['opiniòn'],                                  // Proclama del Pacífico, con acento grave
            ['COLUMNA DE OPINIÓN', 'Marta Juanita Villaveces Niño'], // Razón Pública
            ['Columnista invitado', 'Destacado'],         // El Diario de Boyacá
            ['Columnistas'],                              // Chocó 7 Días
            ['Editorial', 'Clima'],                       // Archipiélago Press
            ['SAZÓN PÚBLICA', 'B&B', 'Caricatura'],       // Razón Pública
            ['caricatura política'],                      // Proclama del Pacífico
        ];
        for (const etiquetas of reales) {
            expect(detectarOpinionDeclarada(etiquetas).esOpinion, etiquetas.join('|')).toBe(true);
        }
    });

    it('distingue el tipo, igual que la ruta', () => {
        expect(detectarOpinionDeclarada(['Editorial']).tipo).toBe('editorial');
        expect(detectarOpinionDeclarada(['Caricatura']).tipo).toBe('caricatura');
        expect(detectarOpinionDeclarada(['COLUMNA DE OPINIÓN']).tipo).toBe('columna');
    });

    /**
     * LA COINCIDENCIA ES EXACTA, NUNCA SUBCADENA, y esto es lo que evita el daño
     * peor: marcar una noticia real la saca del agrupamiento. Las etiquetas de
     * abajo son reales y NINGUNA es una sección de opinión.
     */
    it('no acusa a una noticia por parecerse', () => {
        const noticias = [
            ['Actualidad', 'Al Minuto', 'Poder'],
            ['Gobierno y política', 'Violencias machistas'],
            ['Noticias económicas importantes', 'Finanzas personales'],
            ['Nota Ciudadana', 'Discapacidad'],
            ['EDICTOS', 'Lo último'],
            ['Editorial Planeta'],
            ['Opinión pública en Colombia'],
            ['columnas de humo'],
        ];
        for (const etiquetas of noticias) {
            expect(detectarOpinionDeclarada(etiquetas).esOpinion, etiquetas.join('|')).toBe(false);
        }
    });

    it('sin etiquetas no afirma nada', () => {
        expect(detectarOpinionDeclarada([]).esOpinion).toBe(false);
        expect(detectarOpinionDeclarada(null).esOpinion).toBe(false);
        expect(detectarOpinionDeclarada(undefined).esOpinion).toBe(false);
    });
});

describe('detectarOpinionDelArticulo', () => {
    it('la ruta manda cuando dice algo, porque es la única que nombra al columnista', () => {
        const r = detectarOpinionDelArticulo({
            url: 'https://www.vanguardia.com/opinion/columnistas/euclides-ardila-rueda/2026/08/06/nota/',
            categorias: ['Actualidad'],
        });
        expect(r.esOpinion).toBe(true);
        expect(r.columnista).toBe('Euclides Ardila Rueda');
    });

    /**
     * EL CASO QUE MOTIVA TODO ESTO. Las2Orillas publica en la raíz —177 piezas
     * en el corpus y CERO marcadas—, así que la ruta no puede verlo y la
     * etiqueta sí.
     */
    it('la etiqueta llega donde la ruta no: un medio que publica en la raíz', () => {
        const r = detectarOpinionDelArticulo({
            url: 'https://www.las2orillas.co/si-para-estar-seguros-necesitamos-armarnos-el-estado-ya-perdio/',
            categorias: ['Opinión', 'Fuerzas Militares', 'opinión', 'porte de armas'],
        });
        expect(r).toEqual({ esOpinion: true, tipo: 'columna', columnista: null });
    });

    it('una noticia de ese mismo medio sigue sin marcarse', () => {
        const r = detectarOpinionDelArticulo({
            url: 'https://www.las2orillas.co/la-ultima-caricatura-de-vladdo/',
            categorias: ['Actualidad', 'Noticias RCN'],
        });
        expect(r.esOpinion).toBe(false);
    });
});
