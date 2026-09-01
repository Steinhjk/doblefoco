// @ts-check
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CuerpoDelAviso } from './AvisoDesfase';
import { evaluarHandshake } from '../services/versionHandshake.js';

/**
 * La mitad del handshake que se puede probar sin red ni navegador: el
 * evaluador puro y el cuerpo del aviso. La regla que protegen es la de la
 * casa: SIN DATOS NO SE ACUSA. Un motor anterior a esta función, una API que
 * no responde o un bundle sin huella tienen que producir silencio, no un
 * aviso — si el handshake naciera en rojo, se ignoraría desde el primer día.
 */

const salud = (version) => ({ version });

describe('evaluarHandshake', () => {
    it('coincide cuando las huellas son iguales', () => {
        const v = evaluarHandshake('abc123abc123', salud({ registroHash: 'abc123abc123' }));
        expect(v.estado).toBe('coinciden');
    });

    it('acusa desfase cuando difieren, y conserva el diagnóstico', () => {
        const v = evaluarHandshake(
            'abc123abc123',
            salud({ registroHash: 'fff000fff000', feeds: 74, commit: 'deadbeef' })
        );
        expect(v.estado).toBe('desfase');
        expect(v.motorFeeds).toBe(74);
        expect(v.motorCommit).toBe('deadbeef');
    });

    it('NO acusa si el motor todavía no publica huella', () => {
        // El caso del arranque: el motor desplegado es anterior a esta función.
        expect(evaluarHandshake('abc123abc123', salud({ feeds: 74 })).estado).toBe('sin-datos');
    });

    it('NO acusa sin respuesta del motor ni sin huella propia', () => {
        expect(evaluarHandshake('abc123abc123', null).estado).toBe('sin-datos');
        expect(evaluarHandshake(null, salud({ registroHash: 'x' })).estado).toBe('sin-datos');
    });
});

describe('CuerpoDelAviso', () => {
    it('no pinta nada salvo en desfase', () => {
        for (const estado of /** @type {Array<'coinciden' | 'sin-datos'>} */ (['coinciden', 'sin-datos'])) {
            const html = renderToStaticMarkup(
                <CuerpoDelAviso veredicto={{ estado, motorHash: null, esperadoHash: null, motorFeeds: null, motorCommit: null }} />
            );
            expect(html).toBe('');
        }
    });

    it('en desfase avisa en lenguaje de lector, con las fuentes contadas', () => {
        const html = renderToStaticMarkup(
            <CuerpoDelAviso veredicto={{
                estado: 'desfase',
                motorHash: 'fff000fff000',
                esperadoHash: 'abc123abc123',
                motorFeeds: 2,
                motorCommit: 'deadbeef',
            }} />
        );
        expect(html).toContain('se está actualizando');
        expect(html).toContain('el motor está leyendo 2');
        // Lo técnico va a la consola, no a la pantalla.
        expect(html).not.toContain('abc123abc123');
        expect(html).not.toContain('deadbeef');
    });
});
