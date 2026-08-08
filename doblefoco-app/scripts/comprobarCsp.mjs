/**
 * ¿PERMITE LA CSP LAS IMÁGENES DE TODOS LOS MEDIOS DEL CATÁLOGO?
 *
 *   npm run check:csp
 *
 * POR QUÉ EXISTE
 * --------------
 * La directiva `img-src` de vercel.json está escrita A MANO y enumera dominio
 * por dominio. El registro de medios, en cambio, cambia: un medio migra, se
 * añade otro, alguien corrige un dominio. Las dos listas no tenían ninguna
 * relación, así que se separaban en silencio.
 *
 * Y el fallo que produce es de los peores: **invisible desde el servidor y
 * total para el lector**. El 2026-08-08 se encontró que La Opinión había
 * migrado a `laopinion.co`. Sus 133 fotografías se descargaban, se validaban
 * —`urlDeImagenValida` compara contra el dominio del propio artículo, no contra
 * la CSP— y se guardaban en la base. El navegador las bloqueaba al pintarlas.
 * Nada en los registros, nada en la ingesta, nada en `check:feeds`: solo un
 * hueco gris donde debía ir la foto.
 *
 * LO QUE COMPRUEBA
 * ----------------
 * Que para cada medio del registro, su `domain` y sus `imageHosts` estén
 * cubiertos por alguna entrada del `img-src`. Nada más. No valida la sintaxis
 * de la CSP ni que las demás directivas sean correctas.
 *
 * LO QUE NO PUEDE COMPROBAR
 * -------------------------
 * Que un medio sirva sus fotos desde un host que NO esté declarado en el
 * registro. Eso solo se ve mirando `image_url` en la base, y por eso la
 * comprobación se acompaña de la costumbre de revisar los hosts reales cuando
 * un medio entra o cambia de dominio.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MEDIA_REGISTRY } from '../shared/mediaRegistry.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(resolve(ROOT, 'vercel.json'), 'utf8'));

/** Saca el `img-src` de la cabecera Content-Security-Policy. */
function extraerImgSrc(cfg) {
    for (const bloque of cfg.headers ?? []) {
        for (const cabecera of bloque.headers ?? []) {
            if (cabecera.key?.toLowerCase() !== 'content-security-policy') continue;
            const trozo = cabecera.value
                .split(';')
                .map((d) => d.trim())
                .find((d) => d.startsWith('img-src'));
            if (trozo) return trozo.slice('img-src'.length).trim().split(/\s+/);
        }
    }
    return null;
}

const fuentes = extraerImgSrc(config);

if (!fuentes) {
    console.error('\n  ✗ No se encontró una directiva img-src en vercel.json.\n');
    process.exitCode = 1;
} else {
    /** ¿Cubre alguna entrada de la CSP a este host? */
    const permitido = (host) =>
        fuentes.some((fuente) => {
            const limpia = fuente.replace(/^https:\/\//, '');
            if (limpia === host) return true;
            // `*.dominio` cubre subdominios, NO el dominio desnudo — así lo trata
            // el navegador, y por eso la lista trae las dos formas de cada uno.
            if (limpia.startsWith('*.')) return host.endsWith(limpia.slice(1));
            return false;
        });

    /*
     * SE SEPARA POR SI EL MEDIO INGIERE O NO, y no es un matiz cosmético.
     *
     * Siete medios del catálogo están como referencia y NO tienen feed: EFE,
     * Reuters, CNN, NYT, WSJ, FT y La Vanguardia. Sin feed no hay artículos, sin
     * artículos no hay imágenes, y por tanto no hay nada que la CSP esté
     * bloqueando hoy. Hacer fallar la comprobación por ellos sería un aviso que
     * grita cuando no pasa nada, que es como se enseña a ignorar los avisos.
     *
     * Se listan igualmente: el día que alguien les ponga feed, sus fotos se
     * romperían en silencio, y entonces este recordatorio ahorra el diagnóstico.
     */
    const rotos = [];
    const futuros = [];

    for (const medio of MEDIA_REGISTRY) {
        for (const host of [medio.domain, ...(medio.imageHosts ?? [])]) {
            if (!host || permitido(host)) continue;
            (medio.feed?.url ? rotos : futuros).push({ medio: medio.name, host });
        }
    }

    console.log(`\n  CSP img-src: ${fuentes.length} entradas · registro: ${MEDIA_REGISTRY.length} medios\n`);

    if (rotos.length) {
        console.error('  ✗ MEDIOS QUE INGIEREN Y CUYAS IMÁGENES LA CSP BLOQUEA\n');
        for (const f of rotos) console.error(`      ${f.medio.padEnd(24)} ${f.host}`);
        console.error('\n  Sus imágenes se guardan y el navegador las bloquea al pintarlas.');
        console.error('  Añadir a img-src en vercel.json en las DOS formas: «https://host»');
        console.error('  y «https://*.host».\n');
        process.exitCode = 1;
    } else {
        console.log('  ✓ Todos los medios que ingieren tienen sus imágenes permitidas.\n');
    }

    if (futuros.length) {
        console.log('  Sin feed, así que hoy no cargan ninguna imagen. Si algún día lo tienen,');
        console.log('  hay que añadirlos a img-src o sus fotos se romperán sin avisar:\n');
        for (const f of futuros) console.log(`      ${f.medio.padEnd(24)} ${f.host}`);
        console.log();
    }
}
