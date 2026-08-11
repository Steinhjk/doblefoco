// @ts-check
import { describe, it, expect } from 'vitest';
import {
    agruparEnSucesos,
    porRelevanciaDeSuceso,
    UMBRAL_SUCESO,
    VENTANA_SUCESO_HORAS,
} from './sucesos.js';

const AHORA = Date.parse('2026-08-10T22:00:00Z');
const haceHoras = (h) => new Date(AHORA - h * 3_600_000).toISOString();

/** Historia mínima con la forma que produce `normalizeStories`. */
function historia(id, title, medios, horas = 1, articleCount = null) {
    return {
        id,
        title,
        publishedAt: haceHoras(horas),
        sources: Array.from({ length: medios }, (_, i) => ({ name: `medio-${id}-${i}`, bias: 0 })),
        articleCount: articleCount ?? medios,
    };
}

/**
 * Titulares reales del 2026-08-10 con el terremoto del Chocó en curso. Son los
 * que se usaron para calibrar, y están aquí para que un cambio de umbral o de
 * métrica se note como un test roto y no en la portada.
 */
const TERREMOTO = [
    'Gobierno declara desastre nacional tras terremoto en Chocó que deja 71 muertos',
    'Informe desde Bogotá: De la Espriella declara desastre nacional por terremoto',
    'Gobierno declara desastre nacional ante emergencia provocada por terremoto',
];

describe('agruparEnSucesos', () => {
    it('reúne los ángulos de un mismo suceso bajo un solo titular', () => {
        const historias = TERREMOTO.map((t, i) => historia(`t${i}`, t, 7 - i, 2 + i));
        const sucesos = agruparEnSucesos(historias, { ahora: AHORA });

        expect(sucesos).toHaveLength(1);
        expect(sucesos[0].angulos).toBe(3);
    });

    /**
     * LO QUE HACE QUE ESTA CAPA NO CONTRADIGA EL UMBRAL DE `clustering.js`:
     * agrupar no es fusionar. Cada historia conserva su titular y sus medios.
     */
    it('no fusiona: cada historia sigue entera dentro del suceso', () => {
        const historias = TERREMOTO.map((t, i) => historia(`t${i}`, t, 7 - i, 2 + i));
        const [suceso] = agruparEnSucesos(historias, { ahora: AHORA });

        expect(suceso.historias.map((h) => h.title)).toEqual(
            expect.arrayContaining(TERREMOTO)
        );
        expect(suceso.historias.every((h) => h.sources.length > 0)).toBe(true);
    });

    /**
     * El número que va en portada. Un medio que cubrió el hecho desde cinco
     * ángulos es UN medio: sumarlos daría la cifra halagadora y sería la
     * cobertura inventada que todo el diseño evita.
     */
    it('cuenta la unión de medios distintos, no la suma', () => {
        const compartido = { name: 'El Tiempo', bias: 0 };
        const historias = [
            { ...historia('a', TERREMOTO[0], 0, 2), sources: [compartido, { name: 'Semana', bias: 0.4 }] },
            { ...historia('b', TERREMOTO[1], 0, 3), sources: [compartido, { name: 'El Espectador', bias: -0.3 }] },
        ];

        const [suceso] = agruparEnSucesos(historias, { ahora: AHORA });
        expect(suceso.angulos).toBe(2);
        expect(suceso.medios).toBe(3); // El Tiempo una vez, no dos.
    });

    it('el líder del suceso es su historia más relevante', () => {
        const historias = [
            historia('floja', TERREMOTO[1], 2, 20),
            historia('fuerte', TERREMOTO[0], 9, 1),
        ];

        const [suceso] = agruparEnSucesos(historias, { ahora: AHORA });
        expect(suceso.titular).toBe(TERREMOTO[0]);
        expect(suceso.lider.id).toBe('fuerte');
    });

    it('deja sola a la historia que no se parece a nada', () => {
        const historias = [
            historia('t', TERREMOTO[0], 7, 2),
            historia('otra', 'Andrés Felipe Velásquez será el nuevo director de la DIAN', 8, 3),
        ];

        const sucesos = agruparEnSucesos(historias, { ahora: AHORA });
        expect(sucesos).toHaveLength(2);
        expect(sucesos.every((s) => s.angulos === 1)).toBe(true);
    });

    /**
     * FUSIONES FALSAS REALES, capturadas durante la calibración. Se agrupaban
     * con el IDF de una página de cien historias y dejaron de hacerlo al ampliar
     * el vocabulario. Están aquí una por una porque son el tipo de error que no
     * se puede publicar: presentan dos hechos distintos como el mismo suceso.
     */
    describe('no agrupa hechos distintos que comparten estructura', () => {
        const vocabulario = [
            ...TERREMOTO,
            'Colombia reconoce la soberanía de Marruecos sobre el Sáhara Occidental',
            'Gobierno De la Espriella reconoce soberanía de Israel sobre Altos del Golán',
            'Un muerto y tres heridos deja ataque armado en zona rural de El Zulia',
            'Ataque con drones contra subestación de Policía en Cesar deja un uniformado',
            'Andrés Felipe Velásquez será el nuevo director de la DIAN',
            'Informe desde Cali: primer Consejo de Seguridad del nuevo Gobierno',
            'Presidente Abelardo de la Espriella anuncia medidas para afectados',
            'Le salen aliados a la eliminación del impuesto al patrimonio',
            // Relleno para que el IDF tenga un corpus con el que comparar.
            ...Array.from({ length: 60 }, (_, i) => `Noticia de relleno numero ${i} sobre asuntos varios`),
        ];

        const pares = [
            [
                'dos reconocimientos de soberanía distintos',
                'Colombia reconoce la soberanía de Marruecos sobre el Sáhara Occidental',
                'Gobierno De la Espriella reconoce soberanía de Israel sobre Altos del Golán',
            ],
            [
                'dos ataques armados distintos',
                'Un muerto y tres heridos deja ataque armado en zona rural de El Zulia',
                'Ataque con drones contra subestación de Policía en Cesar deja un uniformado',
            ],
            [
                'un nombramiento y un consejo de seguridad',
                'Andrés Felipe Velásquez será el nuevo director de la DIAN',
                'Informe desde Cali: primer Consejo de Seguridad del nuevo Gobierno',
            ],
            [
                'medidas por el terremoto y el impuesto al patrimonio',
                'Presidente Abelardo de la Espriella anuncia medidas para afectados',
                'Le salen aliados a la eliminación del impuesto al patrimonio',
            ],
        ];

        for (const [nombre, a, b] of pares) {
            it(nombre, () => {
                const sucesos = agruparEnSucesos(
                    [historia('a', a, 6, 2), historia('b', b, 6, 3)],
                    { ahora: AHORA, vocabulario }
                );
                expect(sucesos).toHaveLength(2);
            });
        }
    });

    /**
     * Un suceso está acotado en el tiempo. Sin ventana, un terremoto de hace
     * tres meses se llevaría por delante al de hoy.
     */
    it('no agrupa fuera de la ventana', () => {
        const historias = [
            historia('hoy', TERREMOTO[0], 7, 1),
            historia('viejo', TERREMOTO[0], 7, VENTANA_SUCESO_HORAS + 10),
        ];

        expect(agruparEnSucesos(historias, { ahora: AHORA })).toHaveLength(2);
    });

    it('aguanta la entrada vacía o inservible', () => {
        expect(agruparEnSucesos([], { ahora: AHORA })).toEqual([]);
        expect(agruparEnSucesos(/** @type {any} */ (null), { ahora: AHORA })).toEqual([]);
        expect(agruparEnSucesos([{ id: 'x' }, { title: 'sin id' }], { ahora: AHORA })).toEqual([]);
    });
});

describe('porRelevanciaDeSuceso', () => {
    /**
     * EL CASO QUE MOTIVÓ LA CAPA. El terremoto repartido en varios ángulos
     * perdía contra un nombramiento que solo admite una forma de contarse.
     * Agrupado, gana — y con el titular correcto, no con el anecdótico.
     */
    it('el suceso de muchos ángulos gana al hecho de uno solo', () => {
        const historias = [
            ...TERREMOTO.map((t, i) => historia(`t${i}`, t, 7 - i, 2 + i)),
            historia('dian', 'Andrés Felipe Velásquez será el nuevo director de la DIAN', 8, 3),
        ];

        const sucesos = agruparEnSucesos(historias, { ahora: AHORA }).sort(porRelevanciaDeSuceso());

        expect(sucesos[0].titular).toBe(TERREMOTO[0]);
        expect(sucesos[0].medios).toBeGreaterThan(8);
        expect(sucesos[0].angulos).toBe(3);
    });
});

describe('parámetros de calibración', () => {
    it('el umbral es más laxo que el de clustering, que fusiona de verdad', async () => {
        const { SIMILARITY_THRESHOLD } = await import('./clustering.js');
        expect(UMBRAL_SUCESO).toBeLessThan(SIMILARITY_THRESHOLD);
    });
});
