/**
 * LO QUE EL SITIO DICE DE SÍ MISMO CUANDO NO ESTÁ DELANTE.
 *
 * Las etiquetas de `index.html` son el sitio entero para quien lo ve compartido
 * en WhatsApp o en X y no llega a entrar. Nadie las mira nunca: no se ven desde
 * dentro del sitio, no las toca ninguna prueba, no salen en el lint. Por eso
 * aguantaron desde julio diciendo tres cosas que el proyecto tenía prohibidas.
 *
 * QUÉ SE COMPRUEBA, Y POR QUÉ CADA COSA
 * -------------------------------------
 *
 * 1. NADA QUE SUENE A VIRTUD. Es una regla editorial escrita de este proyecto:
 *    «objetivo», «imparcial», «sin sesgo» y compañía afirman una cualidad que la
 *    medición no sostiene, y elogiar la ausencia de bando es el falso equilibrio
 *    que el sitio combate. La portada decía «Información Objetiva y Moderna» y
 *    «Sin sesgos ocultos» mientras /transparencia/clasificacion decía, literal,
 *    «no significa neutral, imparcial ni objetivo».
 *
 * 2. NINGÚN NÚMERO. Esta cabecera no se regenera con el catálogo, así que
 *    cualquier cifra escrita aquí empieza a caducar el mismo día. Decía «más de
 *    20 fuentes nacionales» cuando ya eran 78 medios.
 *
 * 3. QUE HAYA TARJETA. `summary_large_image` promete una imagen grande; sin
 *    `og:image` el que comparte el enlace ve un recuadro vacío y no se entera
 *    nadie, porque el fallo solo se ve fuera del sitio.
 *
 * 4. QUE OPEN GRAPH Y TWITTER DIGAN LO MISMO. Anunciaban dos sitios distintos, y
 *    la de Twitter era justamente la que llevaba la frase prohibida.
 *
 * SE LEE EL FUENTE COMO TEXTO, como en las otras pruebas de costura del
 * proyecto. Y SIN COMENTARIOS: los de este repositorio citan lo que se retiró
 * —el de `index.html` nombra las tres frases viejas para que no vuelvan—, así
 * que una prueba que busca palabras tiene que leer el contenido, no la prosa que
 * lo explica. Es la misma corrección que hubo que hacerle a las de Tendencias.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const HTML = readFileSync(resolve(aqui, '..', 'index.html'), 'utf8');

/** El HTML sin comentarios. Ver la cabecera. */
const marcado = HTML.replace(/<!--[\s\S]*?-->/g, '');

/** Solo el texto que va a leer un tercero: el de `content=` y el del `<title>`. */
const contenidos = [
    ...[...marcado.matchAll(/content="([^"]*)"/g)].map((m) => m[1]),
    ...[...marcado.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => m[1]),
].join(' \n ');

const etiqueta = (nombre) => {
    const m = marcado.match(
        new RegExp(`<meta[^>]*(?:name|property)="${nombre}"[^>]*content="([^"]*)"`)
    ) ?? marcado.match(
        new RegExp(`<meta[^>]*content="([^"]*)"[^>]*(?:name|property)="${nombre}"`)
    );
    return m?.[1] ?? null;
};

describe('Las etiquetas de la portada · lo que el sitio dice de sí mismo', () => {
    /**
     * La lista es de raíces, no de palabras: «objetiv» caza objetivo, objetiva y
     * objetividad, que es como volvería a colarse.
     */
    it.each([
        ['objetiv', 'afirma una cualidad que la medición no sostiene'],
        ['imparcial', 'lo mismo, con otra palabra'],
        ['sin sesgo', 'el sitio mide sesgo; no puede declararse exento'],
        ['equidistante', 'equidistar de un desequilibrio es blanquearlo'],
        ['neutral', 'no existe el punto neutral desde el que se mira todo'],
        ['premium', 'no describe lo que hace el producto'],
    ])('no se proclama «%s» (%s)', (raiz) => {
        expect(contenidos.toLowerCase()).not.toContain(raiz);
    });

    it('no escribe ninguna cifra, porque aquí las cifras no se regeneran', () => {
        // Se permiten las de la propia imagen (1200, 630) y las del viewport,
        // que no son afirmaciones sobre el catálogo sino medidas técnicas.
        const afirmaciones = [
            etiqueta('description'),
            etiqueta('og:description'),
            etiqueta('twitter:description'),
            marcado.match(/<title>([^<]*)<\/title>/)?.[1],
        ].join(' ');

        expect(afirmaciones).not.toMatch(/\d/);
    });

    it('promete una imagen grande y la manda', () => {
        expect(etiqueta('twitter:card')).toBe('summary_large_image');
        expect(etiqueta('og:image')).toBe('https://doblefoco.co/og-image.png');
        expect(etiqueta('twitter:image')).toBe('https://doblefoco.co/og-image.png');
        // El alt no es un adorno: es lo que lee quien no ve la tarjeta.
        expect(etiqueta('og:image:alt')).toBeTruthy();
    });

    it('dice cuál es su propia dirección', () => {
        expect(etiqueta('og:url')).toBe('https://doblefoco.co/');
    });

    it('Open Graph y Twitter anuncian el MISMO sitio', () => {
        expect(etiqueta('twitter:title')).toBe(etiqueta('og:title'));
        expect(etiqueta('twitter:description')).toBe(etiqueta('og:description'));
    });
});

describe('La tarjeta que se comparte', () => {
    const PNG = resolve(aqui, '..', 'public', 'og-image.png');

    it('existe y no es el rectángulo vacío de antes', () => {
        const bytes = readFileSync(PNG);

        // 1200×630, leído de la cabecera IHDR del PNG.
        expect(bytes.readUInt32BE(16)).toBe(1200);
        expect(bytes.readUInt32BE(20)).toBe(630);

        /*
         * EL TAMAÑO ES LA PRUEBA, Y HAY QUE EXPLICAR POR QUÉ SIRVE. La tarjeta
         * anterior era un rectángulo de dos colores planos: se comprimía a
         * 3,6 KB. Cualquier imagen con texto encima pesa un orden de magnitud
         * más, porque las letras rompen las filas iguales que hacen pequeño a un
         * PNG liso. No comprueba que ponga lo correcto —eso se mira— pero sí
         * caza el caso que de verdad ocurrió: que no ponga nada.
         */
        expect(bytes.length).toBeGreaterThan(15_000);
    });
});
