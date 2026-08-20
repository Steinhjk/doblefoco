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
        expect(ventanaYRitmo([])).toEqual({ ventanaHoras: null, piezasPorDia: null });
        expect(ventanaYRitmo([Date.now()])).toEqual({ ventanaHoras: null, piezasPorDia: null });
    });

    it('ignora las fechas que no lo son', () => {
        const t = Date.now();
        expect(ventanaYRitmo([t, NaN, Number.POSITIVE_INFINITY])).toEqual({
            ventanaHoras: null,
            piezasPorDia: null,
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

    it('con todo publicado en el mismo instante da ventana cero y ningún ritmo', () => {
        const t = Date.now();
        expect(ventanaYRitmo([t, t, t])).toEqual({ ventanaHoras: 0, piezasPorDia: null });
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

    it('lo que no responde está roto, y dice por qué', () => {
        const r = clasificarFeed({ ...sano, respondio: false, error: 'ETIMEDOUT' });
        expect(r).toEqual({ estado: 'roto', motivo: 'ETIMEDOUT' });
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
