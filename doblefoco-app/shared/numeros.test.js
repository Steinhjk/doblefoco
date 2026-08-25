import { describe, it, expect } from 'vitest';
import { decimal, decimalCorto, sesgo } from './numeros.js';

describe('decimal', () => {
    it('escribe con coma, que es el separador decimal en Colombia', () => {
        expect(decimal(4.1, 1)).toBe('4,1');
        expect(decimal(0.11, 2)).toBe('0,11');
    });

    it('conserva los decimales pedidos aunque sean ceros', () => {
        // «4,0 %» y «4 %» no dicen lo mismo: el primero declara la precisión.
        expect(decimal(4, 1)).toBe('4,0');
        expect(decimal(0.5, 2)).toBe('0,50');
    });

    it('redondea, no trunca', () => {
        expect(decimal(4.16, 1)).toBe('4,2');
        expect(decimal(0.115, 2)).toBe('0,12');
    });

    it('con cero decimales no deja separador suelto', () => {
        expect(decimal(18, 0)).toBe('18');
        expect(decimal(17.6, 0)).toBe('18');
    });

    it('NO agrupa millares, porque aquí no los hay y el punto confundiría', () => {
        // Es justo el carácter del que huye este módulo: si agrupara, «1234,5»
        // saldría «1.234,5» y volveríamos a tener puntos en pantalla.
        expect(decimal(1234.5, 1)).toBe('1234,5');
    });

    it('devuelve cadena vacía en vez de reventar cuando no hay número', () => {
        // `toFixed()` lanzaba TypeError con undefined y tumbaba la página.
        expect(decimal(undefined)).toBe('');
        expect(decimal(null)).toBe('');
        expect(decimal(Number.NaN)).toBe('');
        expect(decimal(Number.POSITIVE_INFINITY)).toBe('');
    });
});

describe('sesgo', () => {
    it('siempre lleva signo visible', () => {
        expect(sesgo(0.45)).toBe('+0,45');
        expect(sesgo(0.05)).toBe('+0,05');
    });

    it('usa el MENOS tipográfico y no el guion del teclado', () => {
        expect(sesgo(-0.35)).toBe('−0,35');
        expect(sesgo(-0.35)).not.toBe('-0,35');
        expect(sesgo(-0.35).charCodeAt(0)).toBe(0x2212);
    });

    it('el centro exacto no es negativo', () => {
        expect(sesgo(0)).toBe('+0,00');
        expect(sesgo(-0)).toBe('+0,00');
    });

    it('cubre los extremos del rango del catálogo', () => {
        expect(sesgo(-0.8)).toBe('−0,80');
        expect(sesgo(1)).toBe('+1,00');
        expect(sesgo(-1)).toBe('−1,00');
    });

    it('devuelve cadena vacía sin número', () => {
        expect(sesgo(undefined)).toBe('');
        expect(sesgo(null)).toBe('');
    });
});

describe('decimalCorto', () => {
    it('no rellena con ceros a la derecha', () => {
        expect(decimalCorto(2)).toBe('2');
        expect(decimalCorto(2.3)).toBe('2,3');
    });

    it('sigue usando coma cuando hay decimal', () => {
        expect(decimalCorto(45.7, 1)).toBe('45,7');
    });

    it('recorta al máximo pedido, redondeando', () => {
        expect(decimalCorto(2.34, 1)).toBe('2,3');
        expect(decimalCorto(2.36, 1)).toBe('2,4');
    });

    it('devuelve cadena vacía sin número', () => {
        expect(decimalCorto(null)).toBe('');
    });
});
