// @ts-check
import { describe, it, expect } from 'vitest';
import { leerOgImage } from './imageEnricher.js';

/**
 * Se prueba la lectura de og:image con un `fetch` inyectado. Lo que importa
 * comprobar aquí no es la red: es que se lea la etiqueta correcta, que se
 * resuelva una URL relativa y que la descarga se corte en el <head> en vez de
 * bajarse el artículo entero de un servidor ajeno.
 */
const respuestaCon = (html, { ok = true } = {}) => ({
    ok,
    body: {
        getReader() {
            let entregado = false;
            return {
                async read() {
                    if (entregado) return { done: true, value: undefined };
                    entregado = true;
                    return { done: false, value: new TextEncoder().encode(html) };
                },
                async cancel() {},
            };
        },
    },
});

const fetchQueDevuelve = (html, opciones) => async () => respuestaCon(html, opciones);

describe('leerOgImage', () => {
    const PAGINA = 'https://www.larepublica.co/economia/una-noticia-123';

    it('lee og:image del head', async () => {
        const html = `<html><head><meta property="og:image" content="https://img.lalr.co/foto.jpg"></head><body>`;
        expect(await leerOgImage(PAGINA, { fetchImpl: fetchQueDevuelve(html) }))
            .toBe('https://img.lalr.co/foto.jpg');
    });

    it('acepta el orden de atributos invertido', async () => {
        const html = `<head><meta content="https://img.lalr.co/b.jpg" property="og:image"></head>`;
        expect(await leerOgImage(PAGINA, { fetchImpl: fetchQueDevuelve(html) }))
            .toBe('https://img.lalr.co/b.jpg');
    });

    it('cae a twitter:image cuando no hay og:image', async () => {
        const html = `<head><meta name="twitter:image" content="https://img.lalr.co/t.jpg"></head>`;
        expect(await leerOgImage(PAGINA, { fetchImpl: fetchQueDevuelve(html) }))
            .toBe('https://img.lalr.co/t.jpg');
    });

    it('resuelve una og:image relativa contra la propia página', async () => {
        const html = `<head><meta property="og:image" content="/media/foto.jpg"></head>`;
        expect(await leerOgImage(PAGINA, { fetchImpl: fetchQueDevuelve(html) }))
            .toBe('https://www.larepublica.co/media/foto.jpg');
    });

    it('devuelve null si la página no declara ninguna', async () => {
        expect(await leerOgImage(PAGINA, { fetchImpl: fetchQueDevuelve('<head><title>x</title></head>') }))
            .toBeNull();
    });

    it('devuelve null si la petición no fue correcta', async () => {
        const html = `<head><meta property="og:image" content="https://img.lalr.co/f.jpg"></head>`;
        expect(await leerOgImage(PAGINA, { fetchImpl: fetchQueDevuelve(html, { ok: false }) }))
            .toBeNull();
    });

    it('NO sigue leyendo después de </head>', async () => {
        // Es lo que hace que esto lea ~47 kB y no el artículo entero. Se
        // comprueba contando cuántas veces se pidió un trozo al cuerpo.
        let lecturas = 0;
        const trozos = [
            '<head><meta property="og:image" content="https://img.lalr.co/f.jpg"></head>',
            '<body>' + 'x'.repeat(50_000) + '</body>',
        ];

        const fetchPorTrozos = async () => ({
            ok: true,
            body: {
                getReader: () => ({
                    async read() {
                        const trozo = trozos[lecturas++];
                        if (!trozo) return { done: true, value: undefined };
                        return { done: false, value: new TextEncoder().encode(trozo) };
                    },
                    async cancel() {},
                }),
            },
        });

        await leerOgImage(PAGINA, { fetchImpl: fetchPorTrozos });
        expect(lecturas).toBe(1);
    });
});
