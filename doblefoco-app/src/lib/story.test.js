import { describe, it, expect } from 'vitest';
import { selectDiverseBlindspots } from './story.js';

describe('selectDiverseBlindspots', () => {
    it('devuelve un arreglo vacío si no hay historias', () => {
        expect(selectDiverseBlindspots([])).toEqual([]);
        expect(selectDiverseBlindspots(null)).toEqual([]);
    });

    it('fuerza la inclusión de al menos un punto ciego de la derecha cuando está disponible', () => {
        const stories = [
            {
                id: 'story-1',
                title: 'Noticia A',
                coverage: { blindspot: { spectrum: 'left', label: 'Punto ciego en la izquierda' } }
            },
            {
                id: 'story-2',
                title: 'Noticia B',
                coverage: { blindspot: { spectrum: 'left', label: 'Punto ciego en la izquierda' } }
            },
            {
                id: 'story-3',
                title: 'Noticia C',
                coverage: { blindspot: { spectrum: 'left', label: 'Punto ciego en la izquierda' } }
            },
            {
                id: 'story-4',
                title: 'Noticia D (Derecha)',
                coverage: { blindspot: { spectrum: 'right', label: 'Punto ciego en la derecha' } }
            }
        ];

        const selected = selectDiverseBlindspots(stories, 3);
        expect(selected).toHaveLength(3);
        const hasRightBlindspot = selected.some(s => s.coverage.blindspot.spectrum === 'right');
        expect(hasRightBlindspot).toBe(true);
        expect(selected[0].id).toBe('story-4');
    });
});
