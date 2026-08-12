// @ts-check
import { describe, it, expect } from 'vitest';
import {
    ALCANCE_SEMANAL,
    MARCAS_NO_ASIGNADAS,
    FUENTE_AUDIENCIA,
    audienciaDe,
    alcanceMaximo,
    ordenadosPorAudiencia,
    sinAudienciaMedida,
    AMPLIACION_POR_VOLUMEN,
    TAMANO_TRAMO,
    prioridadDe,
    tramoPrioritario,
} from './audiencia.js';
import { MEDIA_REGISTRY } from './mediaRegistry.js';

describe('contrato de la tabla de audiencia', () => {
    it('todo medio con audiencia existe en el registro', () => {
        // Una cifra huérfana no rompería nada visible: simplemente no se
        // enseñaría nunca, y la tabla parecería completa estándolo menos.
        for (const id of Object.keys(ALCANCE_SEMANAL)) {
            expect(MEDIA_REGISTRY.some((m) => m.id === id), id).toBe(true);
        }
    });

    it('cada cifra dice con qué marca de la encuesta se corresponde', () => {
        // Es la prueba de que la asignación se puede comprobar abriendo la
        // fuente. Sin el nombre exacto, nadie puede verificar que «Noticias
        // Caracol TV» de la encuesta sea nuestro `noticias-caracol`.
        for (const [id, cifra] of Object.entries(ALCANCE_SEMANAL)) {
            expect(cifra.marca, id).toBeTruthy();
            expect(cifra.online === null || typeof cifra.online === 'number', id).toBe(true);
            expect(cifra.offline === null || typeof cifra.offline === 'number', id).toBe(true);
            // Un porcentaje de alcance semanal fuera de 0–100 es un error de
            // transcripción, no un medio muy leído.
            for (const v of [cifra.online, cifra.offline]) {
                if (typeof v === 'number') expect(v, id).toBeGreaterThanOrEqual(0);
                if (typeof v === 'number') expect(v, id).toBeLessThanOrEqual(100);
            }
        }
    });

    it('ninguna marca queda con las dos cifras vacías', () => {
        // Sería una fila que ocupa sitio y no dice nada.
        for (const [id, cifra] of Object.entries(ALCANCE_SEMANAL)) {
            expect(cifra.online !== null || cifra.offline !== null, id).toBe(true);
        }
    });

    it('la fuente se puede abrir y está fechada', () => {
        // El número lo produjo otro y tiene que poder rastrearse hasta él.
        expect(FUENTE_AUDIENCIA.url).toMatch(/^https:\/\/\S+$/);
        expect(FUENTE_AUDIENCIA.consultadoEl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('las marcas no asignadas dicen POR QUÉ no se asignaron', () => {
        // Sin el motivo, la lista parecería un descuido en vez de una decisión,
        // y alguien la «arreglaría» asignándolas a ojo.
        for (const m of MARCAS_NO_ASIGNADAS) {
            expect(m.marca).toBeTruthy();
            expect(m.motivo, m.marca).toBeTruthy();
        }
    });

    it('ninguna marca no asignada coincide con un medio ya medido', () => {
        // Si una marca está en las dos listas, o sobra de una o la asignación
        // se hizo dos veces con criterios distintos.
        const medidas = Object.values(ALCANCE_SEMANAL).map((c) => c.marca);
        for (const m of MARCAS_NO_ASIGNADAS) {
            expect(medidas, m.marca).not.toContain(m.marca);
        }
    });
});

describe('alcanceMaximo', () => {
    it('toma el mayor de los dos canales, no la suma', () => {
        // Sumar contaría dos veces a quien ve el noticiero Y entra a su web.
        // Noticias Caracol es el caso que lo hace evidente: 22 en internet y 42
        // fuera. La suma diría 64 %, que no es cierto de nadie.
        expect(alcanceMaximo('noticias-caracol')).toBe(42);
        expect(audienciaDe('noticias-caracol')).toEqual({
            online: 22, offline: 42, marca: 'Noticias Caracol TV',
        });
    });

    it('funciona con un solo canal medido', () => {
        expect(alcanceMaximo('pulzo')).toBe(19);
        expect(alcanceMaximo('noticias-uno')).toBe(11);
    });

    it('devuelve null y NO cero para un medio sin medición', () => {
        // Es la distinción que sostiene toda la columna: cero lo hundiría al
        // final del orden y lo haría parecer irrelevante, que es justo la
        // afirmación que no tenemos.
        expect(alcanceMaximo('el-colombiano')).toBeNull();
        expect(alcanceMaximo('la-razon-cordoba')).toBeNull();
        expect(audienciaDe('medio-que-no-existe')).toBeNull();
    });
});

describe('ordenar por audiencia', () => {
    const catalogo = MEDIA_REGISTRY.filter((m) => m.country === 'CO');

    it('pone al más leído del país primero', () => {
        const orden = ordenadosPorAudiencia(catalogo);
        expect(orden[0].id).toBe('noticias-caracol');
    });

    it('el empate lo rompe el alcance en internet, no el orden del registro', () => {
        // El Tiempo y Noticias RCN empatan hoy a 30 % de pico. Sin desempate
        // explícito el orden lo decidía cuál estuviera antes en
        // `mediaRegistry.js`, y mover una entrada de sitio habría cambiado quién
        // sale primero en una lista titulada «los más leídos del país».
        expect(alcanceMaximo('el-tiempo')).toBe(30);
        expect(alcanceMaximo('noticias-rcn')).toBe(30);

        const ids = ordenadosPorAudiencia(catalogo).map((m) => m.id);
        expect(ids.indexOf('el-tiempo')).toBeLessThan(ids.indexOf('noticias-rcn'));
    });

    it('deja fuera a los que no tienen medición, en vez de ponerlos al final', () => {
        // «No medido» no es una posición del ranking. Colarlos al final sería
        // afirmar que son los que menos audiencia tienen.
        const orden = ordenadosPorAudiencia(catalogo);
        expect(orden.some((m) => m.id === 'el-colombiano')).toBe(false);
        expect(orden.every((m) => alcanceMaximo(m.id) !== null)).toBe(true);
    });

    it('Pulzo entra por delante de El Espectador, Caracol Radio y Blu Radio', () => {
        // Es la razón por la que Pulzo se dio de alta el 2026-08-11: ordenar por
        // audiencia en vez de por volumen destapó que el cuarto medio más
        // consumido del país no estaba en el catálogo.
        const ids = ordenadosPorAudiencia(catalogo).map((m) => m.id);
        expect(ids).toContain('pulzo');
        expect(ids.indexOf('pulzo')).toBeLessThan(ids.indexOf('el-espectador'));
        expect(ids.indexOf('pulzo')).toBeLessThan(ids.indexOf('blu-radio'));
    });

    it('las dos listas se reparten el catálogo entero y no se solapan', () => {
        const medidos = ordenadosPorAudiencia(catalogo);
        const sinMedir = sinAudienciaMedida(catalogo);

        expect(medidos.length + sinMedir.length).toBe(catalogo.length);
        expect(medidos.filter((m) => sinMedir.includes(m))).toEqual([]);
    });

    it('el tramo prioritario son veinte fichas y ninguna repetida', () => {
        const tramo = tramoPrioritario(MEDIA_REGISTRY);
        expect(tramo).toHaveLength(TAMANO_TRAMO);
        expect(TAMANO_TRAMO).toBe(20);
        expect(new Set(tramo.map((m) => m.id)).size).toBe(20);
        // Los puestos son 1..20 sin huecos: una lista de prioridades con un
        // número repetido o saltado no es una lista de prioridades.
        expect(tramo.map((m) => m.prioridad.puesto)).toEqual(
            Array.from({ length: 20 }, (_, i) => i + 1)
        );
    });

    it('NINGÚN estimado adelanta a un medido', () => {
        // Es la regla que impide que las dos escalas se mezclen. El Heraldo
        // publica 348 piezas en 72 h y Noticias Uno once; ponerlos en la misma
        // escala exigiría convertir piezas en lectores, que no se puede.
        const tramo = tramoPrioritario(MEDIA_REGISTRY);
        const ultimoMedido = tramo.map((m) => m.prioridad.certeza).lastIndexOf('medida');
        const primerEstimado = tramo.map((m) => m.prioridad.certeza).indexOf('estimada');

        expect(ultimoMedido).toBe(12);
        expect(primerEstimado).toBe(13);
    });

    it('cada ficha del tramo dice con qué certeza entró y con qué cifra', () => {
        for (const m of tramoPrioritario(MEDIA_REGISTRY)) {
            expect(['medida', 'estimada'], m.id).toContain(m.prioridad.certeza);
            expect(typeof m.prioridad.cifra, m.id).toBe('number');
            expect(m.prioridad.unidad, m.id).toBeTruthy();
        }
    });

    it('los siete estimados NO tienen audiencia medida, y al revés', () => {
        // Si un medio estuviera en las dos listas, su puesto dependería de cuál
        // se mirara primero.
        for (const id of Object.keys(AMPLIACION_POR_VOLUMEN.piezas)) {
            expect(audienciaDe(id), id).toBeNull();
            expect(MEDIA_REGISTRY.some((m) => m.id === id), id).toBe(true);
        }
    });

    it('el recuento de volumen está fechado', () => {
        // Es una foto, no un valor vivo: sin fecha nadie sabría de cuándo es la
        // lista de fichas que está trabajando.
        expect(AMPLIACION_POR_VOLUMEN.medidoEl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(AMPLIACION_POR_VOLUMEN.ventanaHoras).toBeGreaterThan(0);
    });

    it('prioridadDe devuelve null fuera del tramo', () => {
        expect(prioridadDe('la-razon-cordoba')).toBeNull();
        expect(prioridadDe('medio-que-no-existe')).toBeNull();
    });

    it('aguanta entradas vacías o inválidas', () => {
        expect(tramoPrioritario([])).toEqual([]);
        expect(tramoPrioritario(null)).toEqual([]);
        expect(ordenadosPorAudiencia([])).toEqual([]);
        expect(ordenadosPorAudiencia(null)).toEqual([]);
        expect(sinAudienciaMedida(undefined)).toEqual([]);
    });
});
