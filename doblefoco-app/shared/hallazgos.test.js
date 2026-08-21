// @ts-check
import { describe, it, expect } from 'vitest';
import {
    aceptadosSinNota,
    conciliarHallazgos,
    diasAbierto,
    extraerHallazgos,
    hallazgosDeLaPasada,
    idDeHallazgo,
    pendientes,
    resumirHallazgos,
} from './hallazgos.js';

const DIA = 24 * 60 * 60 * 1000;

const medioConTodo = {
    nombre: 'El Pilón',
    feed: { estado: 'roto', motivo: 'el feed está parado' },
    rutas: { estado: 'revisar', respondeATodo: true, motivo: 'devuelve 200 a todo' },
    fuentes: [
        { url: 'https://elpilon.com.co/el-pilon-30-anos/amp/', estado: 'roto', motivo: '404' },
        { url: 'https://elpilon.com.co/quienes-somos/', estado: 'sano', motivo: null },
        { url: 'https://elpilon.com.co/otra/', estado: 'no-comprobable', motivo: '403' },
    ],
};

describe('extraerHallazgos', () => {
    const h = extraerHallazgos('el-pilon', medioConTodo);

    it('saca uno por feed, uno por rutas y uno por cada fuente mala', () => {
        expect(h.map((x) => x.tipo)).toEqual(['feed', 'rutas', 'fuente']);
    });

    it('«no comprobable» NO es un hallazgo: no es un defecto del catálogo', () => {
        // El 403 de la tercera fuente es un sitio que nos cierra la puerta, no
        // una fuente rota. Meterlo aquí llenaría la minuta de tareas de nadie.
        expect(h.some((x) => x.resumen?.includes('403'))).toBe(false);
    });

    it('el id de una fuente se puede leer, y no es un hash', () => {
        expect(h[2].id).toBe('el-pilon/fuente/elpilon.com.co/el-pilon-30-anos/amp');
    });

    it('un medio sano no produce ninguno', () => {
        expect(extraerHallazgos('x', { feed: { estado: 'sano' }, fuentes: [] })).toEqual([]);
    });

    it('idDeHallazgo no mete el detalle cuando no hace falta', () => {
        expect(idDeHallazgo('semana', 'feed')).toBe('semana/feed');
    });
});

describe('conciliarHallazgos', () => {
    const hoyHallazgos = hallazgosDeLaPasada({ medios: { 'el-pilon': medioConTodo } });

    it('la primera pasada los marca todos nuevos y les fija la fecha', () => {
        const r = conciliarHallazgos(null, hoyHallazgos, '2026-08-19');
        expect(r.nuevos).toHaveLength(3);
        expect(Object.values(r.libro.hallazgos).every((h) => h.primeraVez === '2026-08-19')).toBe(true);
    });

    it('en la segunda pasada ya no son nuevos, y primeraVez NO se mueve', () => {
        const uno = conciliarHallazgos(null, hoyHallazgos, '2026-08-19');
        const dos = conciliarHallazgos(uno.libro, hoyHallazgos, '2026-09-02');

        expect(dos.nuevos).toHaveLength(0);
        expect(dos.libro.hallazgos['el-pilon/feed'].primeraVez).toBe('2026-08-19');
        expect(dos.libro.hallazgos['el-pilon/feed'].ultimaVez).toBe('2026-09-02');
    });

    it('lo que deja de aparecer se marca resuelto y NO se borra', () => {
        const uno = conciliarHallazgos(null, hoyHallazgos, '2026-08-19');
        const dos = conciliarHallazgos(uno.libro, [], '2026-09-02');

        expect(dos.resueltos).toHaveLength(3);
        // Sigue en el libro: que algo se arreglara es parte del hilo.
        expect(Object.keys(dos.libro.hallazgos)).toHaveLength(3);
        expect(dos.libro.hallazgos['el-pilon/feed'].estado).toBe('resuelto');
        expect(dos.libro.hallazgos['el-pilon/feed'].resueltoEl).toBe('2026-09-02');
    });

    it('lo que vuelve cuenta como reincidencia y conserva su fecha original', () => {
        const uno = conciliarHallazgos(null, hoyHallazgos, '2026-08-19');
        const dos = conciliarHallazgos(uno.libro, [], '2026-09-02');
        const tres = conciliarHallazgos(dos.libro, hoyHallazgos, '2026-09-16');

        const feed = tres.libro.hallazgos['el-pilon/feed'];
        expect(tres.reaparecidos).toHaveLength(3);
        expect(tres.nuevos).toHaveLength(0);
        expect(feed.estado).toBe('abierto');
        expect(feed.reincidencias).toBe(1);
        // Lo crónico no puede parecer recién nacido cada vez que asoma.
        expect(feed.primeraVez).toBe('2026-08-19');
    });

    it('el texto del motivo se refresca, pero el hallazgo sigue siendo el mismo', () => {
        const uno = conciliarHallazgos(null, hoyHallazgos, '2026-08-19');
        const cambiado = hallazgosDeLaPasada({
            medios: {
                'el-pilon': { ...medioConTodo, feed: { estado: 'revisar', motivo: 'ahora publica despacio' } },
            },
        });
        const dos = conciliarHallazgos(uno.libro, cambiado, '2026-09-02');

        expect(dos.nuevos).toHaveLength(0);
        expect(dos.libro.hallazgos['el-pilon/feed'].resumen).toBe('ahora publica despacio');
        expect(dos.libro.hallazgos['el-pilon/feed'].gravedad).toBe('revisar');
    });

    it('un aceptado sigue aceptado aunque siga apareciendo', () => {
        const uno = conciliarHallazgos(null, hoyHallazgos, '2026-08-19');
        uno.libro.hallazgos['el-pilon/rutas'].estado = 'aceptado';
        uno.libro.hallazgos['el-pilon/rutas'].nota = 'sin otra fuente disponible; se revisa en enero';

        const dos = conciliarHallazgos(uno.libro, hoyHallazgos, '2026-09-02');
        expect(dos.libro.hallazgos['el-pilon/rutas'].estado).toBe('aceptado');
    });

    it('UNA PASADA PARCIAL NO RESUELVE NADA de lo que no miró', () => {
        /*
         * Sin esta salvaguarda, `npm run auditoria -- --medio=semana` marcaría
         * como arreglados los defectos de los otros setenta y cinco medios,
         * simplemente porque no se miraron. Un libro que se limpia solo cuando
         * dejas de mirar es peor que no tener libro.
         */
        const uno = conciliarHallazgos(null, hoyHallazgos, '2026-08-19');
        const dos = conciliarHallazgos(uno.libro, [], '2026-09-02', { parcial: true });

        expect(dos.resueltos).toHaveLength(0);
        expect(dos.libro.hallazgos['el-pilon/feed'].estado).toBe('abierto');
    });
});

describe('lo pendiente, y cómo se cuenta', () => {
    const libro = {
        hallazgos: {
            viejo: { id: 'viejo', estado: 'abierto', primeraVez: '2026-06-01', reincidencias: 2 },
            nuevo: { id: 'nuevo', estado: 'abierto', primeraVez: '2026-08-18', reincidencias: 0 },
            mudo: { id: 'mudo', estado: 'aceptado', primeraVez: '2026-05-01', nota: 'decidido' },
            listo: { id: 'listo', estado: 'resuelto', primeraVez: '2026-05-01' },
            callado: { id: 'callado', estado: 'aceptado', primeraVez: '2026-05-01', nota: '  ' },
        },
    };
    const ahora = Date.parse('2026-08-19T12:00:00Z');

    it('ordena por antigüedad, no por gravedad', () => {
        expect(pendientes(libro, ahora).map((h) => h.id)).toEqual(['viejo', 'nuevo']);
    });

    it('un aceptado no es pendiente, pero sigue contándose', () => {
        const r = resumirHallazgos(libro, ahora);
        expect(r).toMatchObject({ abiertos: 2, aceptados: 2, resueltos: 1, cronicos: 1 });
    });

    it('dice cuántos días lleva el más viejo, que es la frase que obliga a actuar', () => {
        // Del 1 de junio al 19 de agosto a mediodía son 79,5 días.
        expect(resumirHallazgos(libro, ahora).diasDelMasViejo).toBe(80);
    });

    it('caza los aceptados sin motivo escrito, que es esconder y no aceptar', () => {
        expect(aceptadosSinNota(libro).map((h) => h.id)).toEqual(['callado']);
    });

    it('diasAbierto no inventa una edad cuando no hay fecha', () => {
        expect(diasAbierto({ primeraVez: null }, ahora)).toBeNull();
    });

    it('con el libro vacío cuenta cero y no explota', () => {
        expect(resumirHallazgos(null).abiertos).toBe(0);
        expect(pendientes(undefined)).toEqual([]);
    });
});

describe('la edad se mide en días de verdad', () => {
    it('nueve días son nueve días', () => {
        const ahora = Date.parse('2026-08-19T00:00:00Z');
        expect(diasAbierto({ primeraVez: '2026-08-10' }, ahora)).toBe(9);
        expect(diasAbierto({ primeraVez: '2026-08-19' }, ahora + 3 * DIA)).toBe(3);
    });
});
