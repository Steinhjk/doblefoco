/**
 * Pruebas del clasificador por contenido.
 *
 * Aquí los dos errores tampoco cuestan lo mismo, pero al revés que en
 * contentQuality. Allí filtrar de más borra una noticia del sitio sin dejar
 * rastro; aquí clasificar de más solo coloca una pieza algo fuera de sitio, y se
 * ve. Por decisión de producto (2026-08-03) el umbral se inclina a asignar.
 *
 * Lo que sí se vigila con dureza son los términos AMBIGUOS, porque un léxico se
 * pudre por ahí: cada regresión de esa sección salió de un falso positivo real
 * medido sobre los feeds vivos, no de un caso imaginado.
 */

import { describe, it, expect } from 'vitest';
import {
    classifyTopics,
    clasificarAmbito,
    seccionDeLaUrl,
    resumirClasificacion,
    TEMAS,
    UMBRAL_ASIGNA,
    UMBRAL_RESCATE,
} from './topicClassifier.js';

const temas = (headline, extra = {}) => classifyTopics({ headline, ...extra }).temas;
const principal = (headline, extra = {}) => classifyTopics({ headline, ...extra }).principal;

describe('asignación por titular', () => {
    it('reconoce cada tema con un término inequívoco', () => {
        const casos = [
            ['El Congreso aprobó en plenaria la reforma pensional', 'politica'],
            ['El DANE reportó una inflación del 5,2 % en julio', 'economia'],
            ['Nueva EPS acumula deudas con hospitales de Antioquia', 'salud'],
            ['La deforestación en la Amazonía creció un 12 %', 'ambiente'],
            ['La inteligencia artificial ya redacta fallos en juzgados', 'tecnologia'],
            ['Se revertirán ocho concesiones viales a la ANI', 'infraestructura'],
            ['La Corte Suprema condenó al exsenador por corrupción', 'justicia'],
            ['El ICETEX anunció nuevas condiciones de crédito educativo', 'educacion'],
            ['La Selección Colombia venció a Perú en las eliminatorias', 'deportes'],
            ['Disidencias de las FARC hostigaron a la fuerza pública en Cauca', 'conflicto'],
            ['Aumentan los feminicidios en el Valle del Cauca', 'derechos'],
            ['El Festival de Cine de Cartagena anunció su programación', 'cultura'],
        ];

        for (const [titular, esperado] of casos) {
            expect(temas(titular), titular).toContain(esperado);
        }
    });

    it('un término fuerte en el titular basta por sí solo', () => {
        const r = classifyTopics({ headline: 'Полиция' });
        expect(r.temas).toEqual([]);

        const s = classifyTopics({ headline: 'El ciclismo colombiano pierde a su gran promesa' });
        expect(s.rescatado).toBe(false);
        expect(s.puntajes.deportes).toBeGreaterThanOrEqual(UMBRAL_ASIGNA);
    });
});

describe('multietiqueta', () => {
    it('una reforma a la salud es Salud y es Política', () => {
        const t = temas('El Congreso hundió la reforma a la salud que cambiaba el papel de las EPS');
        expect(t).toContain('salud');
        expect(t).toContain('politica');
    });

    it('un mundial es Deportes, y su ámbito es aparte', () => {
        const r = classifyTopics({
            headline: 'Polémica por la participación de atletas trans en el Mundial de atletismo',
        });
        expect(r.temas).toContain('deportes');
        expect(r.temas).toContain('derechos');
    });

    it('el tema principal es el de mayor puntaje', () => {
        expect(principal('La Selección Colombia goleó en el estadio El Campín')).toBe('deportes');
    });
});

describe('términos ambiguos — regresiones de falsos positivos reales', () => {
    /**
     * Todos estos titulares son del corpus vivo y todos fueron clasificados mal
     * en alguna versión de este archivo. Son el equivalente aquí del «CDI El
     * Dorado» de contentQuality.
     */
    it('«millonarios contratos» no es el club Millonarios', () => {
        expect(
            temas('Puerta giratoria: periodistas con historial de millonarios contratos con el Estado')
        ).not.toContain('deportes');
    });

    it('el club sí se reconoce cuando lleva contexto', () => {
        expect(temas('Millonarios FC anunció a su nuevo entrenador')).toContain('deportes');
    });

    it('«líder digital de la campaña» no es Tecnología', () => {
        expect(
            temas('Líder digital de la campaña enfrenta denuncia por presuntos delitos informáticos')
        ).not.toContain('tecnologia');
    });

    it('«partido» suelto no decide entre Política y Deportes', () => {
        const t = temas('El partido terminó sin acuerdos');
        expect(t).not.toContain('deportes');
        expect(t).not.toContain('politica');
    });

    it('un incendio forestal no convierte cualquier incendio en ambiental', () => {
        expect(temas('Incendio en un edificio del centro dejó dos heridos')).not.toContain('ambiente');
    });
});

describe('la entradilla suma pero no decide sola', () => {
    /**
     * La entradilla es texto largo lleno de menciones de pasada. Al medir, dos
     * términos débiles incidentales sumaban 1,6 y disparaban el rescate:
     * «Jay Clayton asume como director de Inteligencia Nacional» acabó en
     * Economía por palabras del cuerpo. El rescate exige señal de titular, de
     * sección de URL o de etiqueta del medio.
     */
    it('no rescata un tema que solo aparece en la entradilla', () => {
        const r = classifyTopics({
            headline: 'Un nombramiento que sorprendió a todos',
            snippet: 'El mercado reaccionó y los precios se movieron durante la jornada.',
        });
        expect(r.temas).toEqual([]);
        expect(r.rescatado).toBe(false);
    });

    it('pero refuerza hasta el umbral un tema que ya asoma en el titular', () => {
        const soloTitular = classifyTopics({ headline: 'El mercado reaccionó al anuncio' });
        expect(soloTitular.rescatado).toBe(true); // señal débil, apenas rescatado

        const conEntradilla = classifyTopics({
            headline: 'El mercado reaccionó al anuncio',
            snippet: 'La reforma tributaria contempla nuevos impuestos y una meta de recaudo.',
        });
        expect(conEntradilla.temas).toContain('economia');
        expect(conEntradilla.rescatado).toBe(false); // ya no hace falta rescatarlo
    });
});

describe('el pulgar en la balanza', () => {
    it('rescata con una señal débil de titular', () => {
        const r = classifyTopics({ headline: 'Golpe a la minería ilegal en Antioquia' });
        expect(r.temas).toContain('ambiente');
        expect(r.rescatado).toBe(true);
    });

    it('marca el rescate para poder medirlo', () => {
        const r = classifyTopics({ headline: 'Golpe a la minería ilegal en Antioquia' });
        expect(r.puntajes.ambiente).toBeGreaterThanOrEqual(UMBRAL_RESCATE);
        expect(r.puntajes.ambiente).toBeLessThan(UMBRAL_ASIGNA);
    });

    it('un titular sin ninguna señal se queda sin tema, y eso es correcto', () => {
        // Del corpus real: columnas de opinión de CAMBIO y Revista RAYA que
        // llegan por Google News, sin entradilla y sin sección en la URL.
        for (const titular of ['CUATRO AÑOS DESPUÉS', 'EL NUEVO PROFETA', 'SubRaya']) {
            const r = classifyTopics({ headline: titular });
            expect(r.temas, titular).toEqual([]);
            expect(r.principal, titular).toBeNull();
        }
    });
});

describe('señales de refuerzo', () => {
    it('la sección de la URL cuenta', () => {
        const r = classifyTopics({
            headline: 'Un nuevo capítulo para el equipo',
            link: 'https://www.eltiempo.com/deportes/futbol-colombiano/un-nuevo-capitulo-92831',
        });
        expect(r.temas).toContain('deportes');
    });

    it('los enlaces de Google News no tienen sección utilizable', () => {
        expect(seccionDeLaUrl('https://news.google.com/rss/articles/CBMiWmh0dHBz')).toBeNull();
    });

    it('ignora segmentos de geografía y de formato', () => {
        expect(seccionDeLaUrl('https://www.vanguardia.com/bucaramanga/nota-123')).toBe('bucaramanga');
        expect(classifyTopics({
            headline: 'Sin señales temáticas aquí',
            link: 'https://www.vanguardia.com/bucaramanga/nota-123',
        }).temas).toEqual([]);
    });

    it('la etiqueta <category> del medio cuenta cuando es un tema', () => {
        const r = classifyTopics({
            headline: 'Un anuncio esperado',
            feedCategories: ['Judicial'],
        });
        expect(r.puntajes.justicia).toBeGreaterThan(0);
    });

    it('y se ignora cuando es una sección de portada o un nombre propio', () => {
        const r = classifyTopics({
            headline: 'Un anuncio esperado',
            feedCategories: ['Destacadas', 'Portada', 'El Colombiano', 'Emisión 02 de agosto 2026'],
        });
        expect(r.temas).toEqual([]);
    });
});

describe('ámbito, que es un eje distinto del tema', () => {
    it('una marca de Colombia lo hace nacional aunque el medio sea de fuera', () => {
        expect(
            clasificarAmbito({ texto: 'El Gobierno de Colombia responde a Bruselas', paisDelMedio: 'ES' })
        ).toBe('nacional');
    });

    it('sin marca colombiana y con marca exterior, es internacional', () => {
        expect(
            clasificarAmbito({ texto: 'Zelenski viajó a Washington para reunirse con Trump', paisDelMedio: 'CO' })
        ).toBe('internacional');
    });

    it('con marcas de los dos lados gana Colombia', () => {
        // «Petro se reunió con Lula» es una noticia colombiana con contexto
        // exterior, no una noticia internacional.
        expect(
            clasificarAmbito({ texto: 'Petro se reunió con Lula en Brasilia', paisDelMedio: 'CO' })
        ).toBe('nacional');
    });

    it('sin ninguna marca, decide el país del medio', () => {
        expect(clasificarAmbito({ texto: 'Un hecho sin lugar', paisDelMedio: 'CO' })).toBe('nacional');
        expect(clasificarAmbito({ texto: 'Un hecho sin lugar', paisDelMedio: 'DE' })).toBe('internacional');
    });

    it('una historia puede ser deportiva E internacional a la vez', () => {
        const r = classifyTopics({
            headline: 'Rusia sigue excluida del Mundial de fútbol por la invasión a Ucrania',
        });
        expect(r.temas).toContain('deportes');
        expect(r.ambito).toBe('internacional');
    });
});

describe('integridad del catálogo de temas', () => {
    it('no hay ids repetidos', () => {
        const ids = TEMAS.map((t) => t.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('todo tema tiene nombre y al menos un patrón fuerte', () => {
        for (const tema of TEMAS) {
            expect(tema.nombre, tema.id).toBeTruthy();
            expect(tema.fuertes.length, tema.id).toBeGreaterThan(0);
        }
    });

    it('no clasifica sin titular, y no revienta', () => {
        expect(classifyTopics({}).temas).toEqual([]);
        expect(classifyTopics({ headline: '' }).principal).toBeNull();
        expect(classifyTopics({ headline: 'Algo', link: 'no-es-una-url' }).temas).toEqual([]);
    });
});

describe('resumen para vigilancia', () => {
    it('cuenta rescatados, multitema y huérfanos', () => {
        const r = resumirClasificacion([
            { headline: 'El Congreso aprobó la reforma a la salud' },
            { headline: 'Golpe a la minería ilegal en Antioquia' },
            { headline: 'CUATRO AÑOS DESPUÉS' },
        ]);

        expect(r.total).toBe(3);
        expect(r.multiples).toBe(1);
        expect(r.rescatados).toBe(1);
        expect(r.sinTema).toBe(1);
        expect(r.porAmbito.nacional + r.porAmbito.internacional).toBe(3);
    });
});
