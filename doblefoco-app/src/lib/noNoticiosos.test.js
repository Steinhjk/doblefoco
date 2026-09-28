import { describe, it, expect } from 'vitest';
import { NO_NOTICIOSOS, noNoticiososConHistoria } from './noNoticiosos.js';

describe('el panel de los no noticiosos', () => {
    it('lista los seis del registro, sin escribirlos a mano', () => {
        expect(NO_NOTICIOSOS.map((m) => m.id).sort()).toEqual(
            ['casa-macondo', 'cuestion-publica', 'razon-publica', 'revista-raya', 'volcanicas', 'voragine']
        );
    });

    it('va en orden alfabético', () => {
        const nombres = NO_NOTICIOSOS.map((m) => m.name);
        expect(nombres).toEqual([...nombres].sort((a, b) => a.localeCompare(b, 'es')));
    });

    it('enlaza la primera historia del feed en la que aparece cada medio', () => {
        const historias = [
            { id: 'a', title: 'Sin ellos', sources: [{ id: 'el-tiempo' }] },
            { id: 'b', title: 'Con Vorágine', sources: [{ id: 'semana' }, { id: 'voragine' }] },
            { id: 'c', title: 'Otra con Vorágine', sources: [{ id: 'voragine' }] },
        ];
        const porId = Object.fromEntries(
            noNoticiososConHistoria(historias).map(({ medio, historia }) => [medio.id, historia?.id ?? null])
        );
        expect(porId.voragine).toBe('b');
        expect(porId['razon-publica']).toBeNull();
    });

    it('sin historias cargadas no se rompe: cada medio queda sin historia', () => {
        const r = noNoticiososConHistoria(undefined);
        expect(r).toHaveLength(NO_NOTICIOSOS.length);
        expect(r.every((x) => x.historia === null)).toBe(true);
    });
});
