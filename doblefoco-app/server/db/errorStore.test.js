// @ts-check
import { describe, it, expect } from 'vitest';
import { calcularHuella, redactar } from './errorStore.js';

describe('redactar (F2-11)', () => {
    it('tapa la contraseña de una cadena de conexión de Postgres', () => {
        // Los errores de `pg` incluyen la cadena de conexión, y esta tabla se
        // muestra en el panel: sin esto, la contraseña de Supabase acabaría en
        // pantalla y en cualquier captura que alguien comparta pidiendo ayuda.
        const texto = 'no se pudo conectar a postgresql://postgres.abc:BDlordDPc6@aws.pooler.com:5432/postgres';
        const limpio = redactar(texto);
        expect(limpio).not.toContain('BDlordDPc6');
        expect(limpio).toContain('postgresql://postgres.abc:***@');
    });

    it('conserva el host, que sí hace falta para diagnosticar', () => {
        const limpio = redactar('fallo en postgres://u:secreto@aws-0-sa-east-1.pooler.supabase.com:5432/db');
        expect(limpio).toContain('aws-0-sa-east-1.pooler.supabase.com');
        expect(limpio).not.toContain('secreto');
    });

    it('tapa contraseñas y tokens sueltos en cualquier formato', () => {
        for (const bruto of ['password=hunter2', 'PGPASSWORD: hunter2', 'api_key=hunter2', 'token = hunter2']) {
            expect(redactar(bruto)).not.toContain('hunter2');
        }
    });

    it('no altera un mensaje que no lleva credenciales', () => {
        const texto = 'ECONNREFUSED al puerto 5432';
        expect(redactar(texto)).toBe(texto);
    });
});

describe('calcularHuella (F2-11)', () => {
    const base = { proceso: 'api', tipo: 'TypeError', mensaje: 'x is not a function', ruta: 'GET /api/feed' };

    it('agrupa el mismo fallo aunque cambien los identificadores', () => {
        // «story_12flvrc no existe» y «story_9xk2ab no existe» son el MISMO
        // error. Sin normalizar, cada ocurrencia crearía su propia fila y
        // volveríamos a una fila por ocurrencia — justo lo que hay que evitar.
        const a = calcularHuella({ ...base, mensaje: 'story_12flvrc no existe' });
        const b = calcularHuella({ ...base, mensaje: 'story_9xk2ab12 no existe' });
        expect(a).toBe(b);
    });

    it('agrupa aunque cambien las cifras', () => {
        expect(calcularHuella({ ...base, mensaje: 'timeout tras 8000 ms' }))
            .toBe(calcularHuella({ ...base, mensaje: 'timeout tras 12000 ms' }));
    });

    it('separa errores distintos', () => {
        expect(calcularHuella(base)).not.toBe(calcularHuella({ ...base, tipo: 'RangeError' }));
        expect(calcularHuella(base)).not.toBe(calcularHuella({ ...base, ruta: 'GET /api/story' }));
        expect(calcularHuella(base)).not.toBe(calcularHuella({ ...base, proceso: 'motor' }));
    });

    it('es estable entre llamadas', () => {
        expect(calcularHuella(base)).toBe(calcularHuella({ ...base }));
    });
});
