// @ts-check
import { describe, it, expect } from 'vitest';
import {
    CICLO_HORAS,
    ITEMS_POR_CICLO,
    clasificarFeed,
    estadosDe,
    margenDeSondeo,
    peorEstado,
    porGravedad,
    resumirAuditoria,
    ventanaYRitmo,
} from './auditoria.js';
import { ITEMS_PER_FEED } from '../server/services/ingestDaemon.js';

const HORA = 3_600_000;

describe('la copia de las constantes del motor', () => {
    /*
     * `shared/auditoria.js` no puede importar el motor —arrastra la base de
     * datos y esto se empaqueta con el cliente—, así que copia el número. Esta
     * prueba es lo que impide que la copia se quede vieja en silencio: si
     * alguien sube el motor a 25 ítems, la auditoría seguiría calculando el
     * margen con 15 y diría que cabe lo que no cabe.
     */
    it('sigue coincidiendo con el motor', () => {
        expect(ITEMS_POR_CICLO).toBe(ITEMS_PER_FEED);
    });
});

describe('ventanaYRitmo', () => {
    it('no afirma nada con menos de dos fechas', () => {
        const nada = { ventanaHoras: null, piezasPorDia: null, huecoTipicoHoras: null };
        expect(ventanaYRitmo([])).toEqual(nada);
        expect(ventanaYRitmo([Date.now()])).toEqual(nada);
    });

    it('ignora las fechas que no lo son', () => {
        const t = Date.now();
        expect(ventanaYRitmo([t, NaN, Number.POSITIVE_INFINITY])).toEqual({
            ventanaHoras: null,
            piezasPorDia: null,
            huecoTipicoHoras: null,
        });
    });

    it('mide el caso de La Libertad: 50 ítems en 9,8 h son ~120 piezas al día', () => {
        const fin = Date.parse('2026-08-17T12:00:00Z');
        // 50 ítems repartidos por igual a lo largo de 9,8 horas.
        const fechas = Array.from({ length: 50 }, (_, i) => fin - (i * 9.8 * HORA) / 49);

        const { ventanaHoras, piezasPorDia } = ventanaYRitmo(fechas);

        expect(ventanaHoras).toBeCloseTo(9.8, 5);
        expect(piezasPorDia).toBeGreaterThan(115);
        expect(piezasPorDia).toBeLessThan(125);
    });

    it('el caso de La Patria: un ancla vieja no puede decidir la cadencia', () => {
        /*
         * Medido contra el feed real el 2026-09-08. Nueve huecos: ocho por
         * debajo de 24 h y uno de 3 246 h, un ítem de abril que el feed sigue
         * arrastrando. La ventana repartida daba «una pieza cada 367 h», y con
         * ese número la auditoría le escribía «publica despacio, es su cadencia
         * y no una avería» a un medio que publica cada siete horas.
         */
        const fin = Date.parse('2026-09-07T05:00:00Z');
        const huecos = [0.8, 23.2, 2.9, 11.4, 9.7, 0.0, 1.8, 7.1, 3246.6];
        const fechas = [fin];
        for (const h of huecos) fechas.push(fechas[fechas.length - 1] - h * HORA);

        const { ventanaHoras, piezasPorDia, huecoTipicoHoras } = ventanaYRitmo(fechas);

        expect(ventanaHoras).toBeCloseTo(3303.5, 0);
        expect(huecoTipicoHoras).toBeCloseTo(7.1, 1);

        // El VOLUMEN sigue siendo el reparto por la ventana, y sigue diciendo
        // que publica poquísimo: son dos preguntas distintas y solo una de las
        // dos se arruinaba con el ancla vieja.
        expect(24 / piezasPorDia).toBeCloseTo(367.1, 0);
    });

    it('sin ancla vieja las dos medidas coinciden', () => {
        // La Libertad de la prueba de arriba: 50 ítems repartidos por igual.
        const fin = Date.parse('2026-08-17T12:00:00Z');
        const fechas = Array.from({ length: 50 }, (_, i) => fin - (i * 9.8 * HORA) / 49);
        const { piezasPorDia, huecoTipicoHoras } = ventanaYRitmo(fechas);
        expect(piezasPorDia).toBeGreaterThan(115);
        expect(piezasPorDia).toBeLessThan(125);
        expect(huecoTipicoHoras).toBeCloseTo(24 / piezasPorDia, 5);
    });

    it('el volumen no se deja arrastrar por las ráfagas: el caso de Caracol Radio', () => {
        /*
         * Medido sobre el catálogo el 2026-09-08, antes de separar las dos
         * medidas: usar la mediana también para el volumen cambiaba el
         * diagnóstico de nueve medios y lo empeoraba en los nueve. Caracol Radio
         * publica en ráfagas —varias piezas en el mismo minuto y luego horas de
         * silencio—, así que su hueco mediano es de segundos y el margen de
         * sondeo salía «estrecho» en un feed que está sano.
         */
        const fin = Date.parse('2026-09-08T12:00:00Z');
        const fechas = [];
        // Cuatro ráfagas de cinco piezas, separadas por seis horas.
        for (let rafaga = 0; rafaga < 4; rafaga++) {
            for (let i = 0; i < 5; i++) {
                fechas.push(fin - rafaga * 6 * HORA - i * 0.01 * HORA);
            }
        }

        const { piezasPorDia, huecoTipicoHoras } = ventanaYRitmo(fechas);

        expect(huecoTipicoHoras).toBeCloseTo(0.01, 2);
        // 19 huecos en 18,04 h: unas 25 piezas al día, que es lo que publica.
        expect(piezasPorDia).toBeGreaterThan(20);
        expect(piezasPorDia).toBeLessThan(30);
    });

    it('con la mediana en cero vuelve a la ventana: el caso de Noticias Uno', () => {
        /*
         * Publica sus diez ítems en el mismo cuarto de hora, así que su hueco
         * típico es 0 y no se puede dividir por él. Sin este rescate, un feed
         * que hoy se ve «roto» pasaría a «no comprobable», que es peor.
         */
        const fin = Date.parse('2026-09-08T12:00:00Z');
        const fechas = [fin, fin, fin, fin, fin, fin, fin, fin, fin, fin - 0.3 * HORA];
        const { ventanaHoras, piezasPorDia, huecoTipicoHoras } = ventanaYRitmo(fechas);

        expect(ventanaHoras).toBeCloseTo(0.3, 5);
        expect(piezasPorDia).toBeCloseTo((9 / 0.3) * 24, 5);
        expect(huecoTipicoHoras).toBeCloseTo(24 / piezasPorDia, 5);
    });

    it('con todo publicado en el mismo instante da ventana cero y ningún ritmo', () => {
        const t = Date.now();
        expect(ventanaYRitmo([t, t, t])).toEqual({
            ventanaHoras: 0,
            piezasPorDia: null,
            huecoTipicoHoras: null,
        });
    });
});

describe('margenDeSondeo', () => {
    it('un medio de 122 piezas al día cabe de sobra en el sondeo de media hora', () => {
        const margen = margenDeSondeo(122);
        // 122/día son 2,54 en media hora, y tomamos 15.
        expect(margen).toBeGreaterThan(5);
    });

    it('pero NO cabe en un barrido diario, que es de lo que avisaba la planeación', () => {
        const margen = margenDeSondeo(122, 24);
        expect(margen).toBeLessThan(1);
    });

    it('sin ritmo conocido no inventa un margen', () => {
        expect(margenDeSondeo(null)).toBeNull();
        expect(margenDeSondeo(0)).toBeNull();
        expect(margenDeSondeo(NaN)).toBeNull();
    });

    it('usa el ciclo real del motor por defecto', () => {
        expect(margenDeSondeo(24)).toBeCloseTo(ITEMS_POR_CICLO / (1 * CICLO_HORAS), 5);
    });
});

describe('clasificarFeed', () => {
    const sano = {
        respondio: true,
        items: 30,
        frescos: 12,
        tomados: 15,
        margen: 8,
        piezasPorDia: 20,
        edadMasNuevoHoras: 1,
        cronologico: true,
    };

    describe('lo que no contesta, que no siempre es culpa del catálogo', () => {
        /*
         * La primera pasada del libro de hallazgos destapó esto: Razón Pública
         * salió fichada como defecto del catálogo por un tropiezo de TLS, y es
         * literalmente el medio que este proyecto tiene documentado como «falla
         * por la red, no por el feed». Con un libro que guarda antigüedades, esa
         * confusión no es un aviso de más: es ruido con memoria.
         */
        it('un tropiezo de red NO es un defecto: es que no se pudo saber', () => {
            const r = clasificarFeed({
                ...sano,
                respondio: false,
                error: 'Client network socket disconnected before secure TLS connection was established',
            });
            expect(r.estado).toBe('no-comprobable');
            expect(r.motivo).toContain('local');
        });

        it('un timeout tampoco', () => {
            expect(clasificarFeed({ ...sano, respondio: false, error: 'ETIMEDOUT' }).estado).toBe(
                'no-comprobable',
            );
        });

        it('un 403 o un 429 son el servidor hablando de nosotros, no de la URL', () => {
            for (const e of ['Status code 403', 'Status code 429', 'Status code 500']) {
                expect(clasificarFeed({ ...sano, respondio: false, error: e }).estado).toBe(
                    'no-comprobable',
                );
            }
        });

        it('un 404 SÍ es nuestro: la URL del catálogo está mal', () => {
            const r = clasificarFeed({ ...sano, respondio: false, error: 'Status code 404' });
            expect(r).toEqual({ estado: 'roto', motivo: 'Status code 404' });
        });

        it('y responder algo que no es un feed también es nuestro', () => {
            const r = clasificarFeed({
                ...sano,
                respondio: false,
                error: 'Feed not recognized as RSS 1 or 2.',
            });
            expect(r.estado).toBe('roto');
        });
    });

    /*
     * EL CASO QUE DESTAPÓ LA PRIMERA PASADA CONTRA LOS 76 MEDIOS.
     *
     * Seis feeds salieron con cero piezas frescas, y no eran lo mismo: Vorágine
     * publica una pieza cada 80 h —periodismo de investigación, su cadencia— y
     * Telemedellín publica 51 al día y llevaba días callado. La versión anterior
     * llamaba «roto» a los dos.
     */
    describe('cero piezas frescas, que son dos cosas distintas', () => {
        it('el que publica despacio NO está roto: es su oficio', () => {
            // Vorágine: 0,3 piezas/día es una cada 80 h, y lo más nuevo tiene 90.
            const r = clasificarFeed({
                ...sano,
                items: 10,
                frescos: 0,
                piezasPorDia: 0.3,
                edadMasNuevoHoras: 90,
            });
            expect(r.estado).toBe('revisar');
            expect(r.motivo).toContain('cadencia');
        });

        it('el que publica cada media hora y lleva días callado SÍ está roto', () => {
            // Telemedellín: 51 piezas/día es una cada 28 min, y lo más nuevo
            // tiene 100 h. Son doscientos huecos de silencio.
            const r = clasificarFeed({
                ...sano,
                items: 10,
                frescos: 0,
                piezasPorDia: 51.1,
                edadMasNuevoHoras: 100,
            });
            expect(r.estado).toBe('roto');
            expect(r.motivo).toContain('parado');
        });

        it('el que sirve piezas de hace diez meses está parado, por lento que sea', () => {
            /*
             * W Radio: 13 ítems repartidos por 20 157 h son 0,0155 piezas al día
             * —un hueco de 64 días— y lo más nuevo tiene 7 561 h. Son casi cinco
             * huecos: está parado, no es que publique despacio.
             *
             * Este caso además destapó que redondear el ritmo ANTES de clasificar
             * lo convertía en cero y el veredicto en «no se puede medir». Aquí se
             * clasifica con el número crudo.
             */
            const r = clasificarFeed({
                ...sano,
                items: 13,
                frescos: 0,
                piezasPorDia: 0.0155,
                edadMasNuevoHoras: 7561,
            });
            expect(r.estado).toBe('roto');
            expect(r.motivo).toContain('parado');
        });

        it('sin ritmo medible no firma la causa: dice que no se pudo saber', () => {
            const r = clasificarFeed({
                ...sano,
                frescos: 0,
                piezasPorDia: null,
                edadMasNuevoHoras: 300,
            });
            expect(r.estado).toBe('no-comprobable');
        });

        it('sin ninguna fecha sí está roto: no se puede auditar lo que no se fecha', () => {
            const r = clasificarFeed({
                ...sano,
                frescos: 0,
                piezasPorDia: 5,
                edadMasNuevoHoras: null,
            });
            expect(r.estado).toBe('roto');
            expect(r.motivo).toContain('fecha');
        });
    });

    it('avisa cuando el medio publica más de lo que cabe en un sondeo', () => {
        const r = clasificarFeed({ ...sano, margen: 0.4 });
        expect(r.estado).toBe('revisar');
        expect(r.motivo).toContain('se pierden piezas');
    });

    it('avisa también del margen estrecho, que es el que revienta un día movido', () => {
        expect(clasificarFeed({ ...sano, margen: 1.6 }).estado).toBe('revisar');
        expect(clasificarFeed({ ...sano, margen: 2.4 }).estado).toBe('sano');
    });

    it('desordenado y viejo es relevancia; desordenado y todo fresco no se acusa', () => {
        expect(clasificarFeed({ ...sano, cronologico: false, frescos: 4, tomados: 15 }).estado).toBe(
            'revisar',
        );
        expect(clasificarFeed({ ...sano, cronologico: false, frescos: 15, tomados: 15 }).estado).toBe(
            'sano',
        );
    });

    it('sin ritmo medible no penaliza: no saber no es un defecto del medio', () => {
        expect(clasificarFeed({ ...sano, margen: null }).estado).toBe('sano');
    });
});

describe('peorEstado', () => {
    it('un medio con el feed sano y una fuente rota está roto', () => {
        expect(peorEstado(['sano', 'roto', 'sano'])).toBe('roto');
    });

    it('sin ningún estado no aprueba: dice que no se pudo comprobar', () => {
        expect(peorEstado([])).toBe('no-comprobable');
    });

    it('«no comprobable» no cuenta como defecto ni como aprobado', () => {
        expect(peorEstado(['sano', 'no-comprobable'])).toBe('no-comprobable');
        expect(peorEstado(['revisar', 'no-comprobable'])).toBe('revisar');
    });

    it('ordena poniendo delante lo que más urge mirar', () => {
        expect(['sano', 'no-comprobable', 'roto', 'revisar'].sort(porGravedad)).toEqual([
            'roto',
            'revisar',
            'no-comprobable',
            'sano',
        ]);
    });
});

describe('resumirAuditoria', () => {
    const estado = {
        medios: {
            uno: {
                feed: { estado: 'roto' },
                fuentes: [{ estado: 'sano' }, { estado: 'roto' }],
                rutas: { estado: 'sano', respondeATodo: false },
            },
            dos: {
                feed: { estado: 'sano' },
                fuentes: [{ estado: 'sano' }],
                rutas: { estado: 'no-comprobable', respondeATodo: true },
                reintentoUaLimpio: true,
            },
            tres: {
                feed: { estado: 'sano' },
                fuentes: [],
                rutas: { estado: 'sano', respondeATodo: false },
            },
        },
    };

    it('cuenta lo que la cabecera del panel afirma', () => {
        expect(resumirAuditoria(estado)).toMatchObject({
            medios: 3,
            feedsRotos: 1,
            fuentesRotas: 1,
            rutasTrampa: 1,
            rescatadosPorUa: 1,
            conDefecto: 1,
            noComprobables: 1,
        });
    });

    it('con el archivo vacío o ausente cuenta cero y no explota', () => {
        expect(resumirAuditoria(null).medios).toBe(0);
        expect(resumirAuditoria({}).medios).toBe(0);
    });

    it('estadosDe recoge las tres partes de una fila', () => {
        expect(estadosDe(estado.medios.uno)).toEqual(['roto', 'sano', 'roto', 'sano']);
    });
});
