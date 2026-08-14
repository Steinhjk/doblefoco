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
            ['Un terremoto de magnitud 7,4 sacudió el Chocó', 'desastres'],
        ];

        /**
         * Los accidentes van en la misma sección, como en IPTC Media Topics
         * —«disaster, accident and emergency incident»—. Antes se repartían: el
         * helicóptero caía en Medio Ambiente y el desplome de una viga, en
         * Tecnología.
         */
        const accidentes = [
            'Tres colombianas mueren en accidente de helicóptero en Dominicana',
            'Un concejal murió por el desplome de una viga en un gimnasio',
            'Choque múltiple en la vía Bogotá-Girardot deja cuatro heridos',
            'Mineros atrapados tras un derrumbe en una mina de Boyacá',
        ];

        for (const titular of accidentes) {
            expect(temas(titular), titular).toContain('desastres');
        }

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

    /**
     * «Huracán» es el Club Atlético Huracán, que juega el clásico con San
     * Lorenzo y al que cubre la prensa colombiana. Como término fuerte se
     * llevaba la tabla de posiciones del Torneo Clausura a Desastres; como
     * débil tampoco bastaba, porque la entradilla aportaba lo que faltaba.
     * Está fuera de las dos listas, y esta prueba existe para que siga fuera.
     */
    it('«Huracán» el club no es un huracán', () => {
        expect(temas('San Lorenzo y Huracán animarán una nueva edición del clásico'))
            .not.toContain('desastres');
        expect(temas('Así están las posiciones del Torneo Clausura: los saltos de Huracán'))
            .not.toContain('desastres');
    });

    /** Y el fenómeno se sigue reconociendo, por el término que no es ambiguo. */
    it('una onda tropical sí es un desastre en potencia', () => {
        expect(temas('Nueva onda tropical pone en alerta al Atlántico'))
            .toContain('desastres');
    });

    /**
     * «accidente cerebrovascular» es un ictus, y va a Salud. Es la razón de que
     * «accidente» suelto esté como débil y no como fuerte.
     */
    it('un accidente cerebrovascular no es un accidente de tráfico', () => {
        expect(principal('Aumentan los casos de accidente cerebrovascular en Nueva EPS'))
            .toBe('salud');
    });

    /**
     * Metáforas de uso corriente en la prensa en español. Suman pero no deciden,
     * que es justo por lo que están como débiles.
     */
    it('las metáforas sísmicas no son sismos', () => {
        expect(temas('El epicentro del escándalo está en la Casa de Nariño'))
            .not.toContain('desastres');
        expect(temas('Un tsunami de críticas contra el ministro'))
            .not.toContain('desastres');
    });

    /**
     * UN INCENDIO URBANO ES UN DESASTRE. Solo estaba «incendio forestal», y eso
     * dejaba fuera 85 artículos del corpus: por IPTC la rúbrica es «disaster,
     * accident and emergency incident», no «desastre natural».
     */
    it('el incendio no tiene que ser forestal', () => {
        expect(temas('Incendio en centro comercial de El Cairo deja dos personas muertas'))
            .toContain('desastres');
        expect(temas('Alarma por incendio en el municipio de Yumbo'))
            .toContain('desastres');
    });

    /**
     * «ESCOMBROS» VA DÉBIL PORQUE LOS DEJA TAMBIÉN UNA OBRA. Rinde 70 artículos
     * y en 99 de 123 ya coincidía con Desastres, pero como fuerte archivaría la
     * obra del metro como catástrofe. Estas dos pruebas fijan las dos mitades.
     */
    it('los escombros de un rescate son un desastre', () => {
        expect(temas('Bomberos de Tunja rescatan pareja de adultos mayores entre los escombros'))
            .toContain('desastres');
        expect(temas('Médica que duró 30 horas bajo los escombros'))
            .toContain('desastres');
    });

    /**
     * ESTA ES LA PRUEBA QUE FALTABA Y QUE DESTAPÓ EL FALLO.
     *
     * La primera versión usaba «escombros» suelto y se comprobaba con el metro
     * de Bogotá, que pasaba —pero por Infraestructura, que puntuaba 4,5 y ganaba,
     * no porque el término se portara bien—. Sin competidor fuerte, el falso
     * positivo salía: este titular se rescataba como desastre siendo residuo de
     * obra. Por eso el patrón exige ahora la preposición.
     */
    it('los escombros de una obra no son un desastre, ni aunque nada compita', () => {
        const r = classifyTopics({
            headline: 'CAR impuso medidas preventivas a predio en Suba por mala disposición de escombros',
        });
        expect(r.temas).not.toContain('desastres');

        expect(temas('Metro de Bogotá: la enorme cantidad de escombros que deja la obra'))
            .not.toContain('desastres');
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

    /**
     * EL PAÍS DELANTE DE LA SECCIÓN NO PUEDE TAPARLA.
     *
     * Infobae archiva como `/{país}/{sección}/{fecha}/{slug}` y el detector
     * devolvía el primer segmento, o sea el país. De sus 2 041 artículos, 1 460
     * tenían por «sección» un país, y el medio se iba sin clasificar en el 51 %
     * de sus piezas: el 38 % de todo el «sin tema» del corpus salía de aquí.
     */
    it('prefiere el segmento que mapea a un tema, no el primero', () => {
        expect(
            seccionDeLaUrl(
                'https://www.infobae.com/colombia/deportes/2026/08/14/el-futbolista-jhon-arias-hablo/'
            )
        ).toBe('deportes');

        expect(
            classifyTopics({
                headline: 'Una entrevista larga con el protagonista',
                link: 'https://www.infobae.com/colombia/deportes/2026/08/14/el-futbolista-jhon-arias-hablo/',
            }).temas
        ).toContain('deportes');
    });

    it('si ningún segmento mapea, conserva el primero plausible', () => {
        // El respaldo no clasifica nada —classifyTopics solo usa la sección si
        // está en el mapa— pero es lo que leen los diagnósticos.
        expect(seccionDeLaUrl('https://www.vanguardia.com/bucaramanga/nota-123')).toBe('bucaramanga');
    });

    it('no inventa sección donde solo hay región y teletipo', () => {
        // Infobae publica cable de agencia bajo /america/agencias/ y eso no es
        // un tema: que no mapee es el resultado correcto, no un hueco.
        const s = seccionDeLaUrl(
            'https://www.infobae.com/america/agencias/2026/08/13/ohla-gano-05-millones/'
        );
        expect(s).toBe('america');
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

/**
 * LA FRONTERA DE LAS TRES SECCIONES QUE SALIERON DE «CULTURA Y MEDIOS».
 *
 * Se partió el 2026-08-04 porque el tema mezclaba la obra, el oficio y el
 * consumo. Lo que hay que proteger no es la división —esa se ve leyendo el
 * catálogo— sino las TRAMPAS DE VOCABULARIO que hacen que un tema construido
 * con el idioma de la propia redacción se lo trague todo.
 */
describe('cultura, medios y entretenimiento', () => {
    /**
     * El primer caso de esta prueba es el que destapó que casi todo el léxico
     * de Cultura estaba en singular estricto: «conciertos» no lo cazaba nadie.
     */
    it('cada uno cae donde le toca', () => {
        expect(temas('La Filarmónica de Bogotá estrenó su temporada de conciertos')).toContain('cultura');
        expect(temas('Los museos de Bogotá abren gratis el domingo')).toContain('cultura');
        expect(temas('Tres películas colombianas compiten en el festival')).toContain('cultura');
        expect(temas('La FLIP documentó 40 agresiones contra la prensa en el semestre')).toContain('medios');
        expect(temas('La casa de los famosos define su eliminación de esta semana')).toContain('entretenimiento');
    });

    /**
     * `rueda de prensa` es la trampa central de `medios`: la convocan el
     * gobierno, los clubes y la Fiscalía, así que como patrón habría convertido
     * la sección de libertad de prensa en un segundo canal de política.
     */
    it('una rueda de prensa no es una noticia sobre la prensa', () => {
        const r = temas('El ministro de Hacienda anunció en rueda de prensa el recorte del presupuesto');
        expect(r).not.toContain('medios');
        expect(r).toContain('politica');
    });

    it('citar a la prensa internacional tampoco es hablar de medios', () => {
        expect(temas('La prensa internacional reaccionó al discurso del presidente')).not.toContain('medios');
    });

    /**
     * Misma lección que «partido» en Deportes y «El Dorado» en contentQuality:
     * la subcadena existe, el sentido no.
     */
    it('«una serie de» y «la temporada de» no son televisión', () => {
        expect(temas('Una serie de ataques dejó tres heridos en el Catatumbo')).not.toContain('entretenimiento');
        expect(temas('La temporada de lluvias deja 12 municipios incomunicados')).not.toContain('entretenimiento');
    });

    it('la editorial literaria no arrastra a medios', () => {
        expect(temas('La editorial literaria publicó la novela póstuma del escritor')).not.toContain('medios');
    });

    /** El motivo de la división, comprobado: ya no comparten casilla. */
    it('la libertad de prensa dejó de archivarse junto a la farándula', () => {
        expect(temas('Periodistas amenazados en Arauca denuncian censura')).toContain('medios');
        expect(temas('Periodistas amenazados en Arauca denuncian censura')).not.toContain('entretenimiento');
        expect(temas('El reality de cocina estrena temporada en televisión')).not.toContain('medios');
    });
});
