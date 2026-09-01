/**
 * LA TARJETA QUE SE VE AL COMPARTIR EL SITIO.
 *
 *     npm run og:generar    → reescribe public/og-image.png (1200×630)
 *
 * QUÉ SUSTITUYE, Y POR QUÉ HABÍA QUE SUSTITUIRLO
 * ----------------------------------------------
 * Al anterior, `createOgImage.mjs`, se le pedía «una imagen de marca» y lo que
 * escribía era **un rectángulo oscuro con un borde dorado y nada más**: pintaba
 * los píxeles a mano, sin ninguna forma de dibujar texto. Nadie lo miró.
 *
 * Estuvo así desde el 2026-07-29, y no en un rincón: `metadatos.js` y
 * `paginasEstaticas.js` la sirven como `og:image` de **todas** las páginas de
 * noticia. O sea que cada vez que alguien compartía una historia de DobleFoco
 * en WhatsApp o en X, lo que se veía era un rectángulo vacío. Se descubrió el
 * 2026-08-31, preparando el sitio para salir a hacer mercadeo, y es el defecto
 * más silencioso de los que aparecieron: no se ve desde dentro del sitio nunca.
 *
 * CÓMO SE DIBUJA AHORA. Con Playwright, que ya es dependencia de desarrollo
 * —`npm run mirar` lo usa— y sabe componer texto. Se monta la tarjeta en HTML
 * con la tipografía y la paleta del propio sitio y se le hace una captura. Así
 * la tarjeta no puede desviarse de la identidad: sale de las mismas variables.
 *
 * LAS TIPOGRAFÍAS VAN INCRUSTADAS EN BASE64 y no enlazadas. Una fuente cargada
 * desde `file://` la bloquea la política de mismo origen del navegador sin decir
 * nada: la captura saldría con la tipografía por defecto y con otro ancho, que
 * es la clase de fallo que se nota tarde.
 *
 * POR QUÉ NO LLEVA BARRA DE ESPECTRO, que era lo primero que pedía el diseño.
 * Una barra de tres tramos —izquierda, mixta, derecha— es el lenguaje visual del
 * sitio, pero en una tarjeta genérica habría que darles un ancho, y ahí está la
 * trampa: **tres tramos iguales afirman que el espacio mediático colombiano está
 * repartido en tercios**, que es exactamente el falso equilibrio contra el que
 * existe este proyecto. Y ponerle la proporción real la convertiría en un dato
 * con fecha dentro de una imagen que nadie va a regenerar. Se queda en tipografía.
 *
 * Y NO LLEVA NINGÚN NÚMERO, por lo mismo: esta imagen acompaña a cada historia
 * durante meses. Un «78 medios» impreso aquí envejece solo y en silencio.
 *
 * TAMPOCO LLEVA NADA QUE LATA NI QUE ARDA. La tarjeta aparece junto a la noticia
 * que sea, y la peor del día también. Es la misma regla por la que se retiró la
 * llama de «Temas frecuentes».
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = resolve(ROOT, 'public/og-image.png');

/** Las dos únicas que hacen falta. Se incrustan; ver la cabecera. */
const FUENTES = {
    titulo: 'public/fonts/plus-jakarta-sans-800-latin.woff2',
    texto: 'public/fonts/outfit-400-latin.woff2',
};

const incrustar = (rel) =>
    `data:font/woff2;base64,${readFileSync(resolve(ROOT, rel)).toString('base64')}`;

/**
 * La paleta, copiada de `src/index.css` (tema oscuro). Son cuatro valores y
 * están aquí a la vista a propósito: importarlos exigiría analizar el CSS, y una
 * imagen que se regenera a mano no gana nada con eso. Si la paleta cambia, esto
 * se nota mirando la tarjeta, que es justo lo que hay que hacer al tocarla.
 */
const FONDO = '#18191c';
const TEXTO = '#f8fafc';
const APAGADO = '#94a3b8';
const BORDE = 'rgba(255, 255, 255, 0.14)';

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face { font-family: 'Jakarta'; src: url('${incrustar(FUENTES.titulo)}') format('woff2'); font-weight: 800; }
  @font-face { font-family: 'Outfit';  src: url('${incrustar(FUENTES.texto)}')  format('woff2'); font-weight: 400; }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1200px; height: 630px;
    background: ${FONDO};
    color: ${TEXTO};
    display: flex; flex-direction: column; justify-content: center;
    padding: 0 96px;
    /* La marca lleva la tipografía de titulares del sitio. */
    font-family: 'Jakarta', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .marca {
    font-size: 40px; font-weight: 800; letter-spacing: -1px;
    margin-bottom: 40px;
  }
  /* El sufijo va más apagado, como en la barra de navegación del sitio. */
  .marca span { color: ${APAGADO}; }

  .frase {
    font-size: 68px; font-weight: 800; line-height: 1.12; letter-spacing: -2px;
    max-width: 960px;
  }

  .apoyo {
    font-family: 'Outfit', system-ui, sans-serif;
    font-size: 28px; line-height: 1.45; color: ${APAGADO};
    margin-top: 32px; max-width: 820px;
  }

  .pie {
    position: absolute; left: 96px; bottom: 56px;
    font-family: 'Outfit', system-ui, sans-serif;
    font-size: 22px; color: ${APAGADO};
    border-top: 1px solid ${BORDE};
    padding-top: 18px; width: 1008px;
  }
</style>

<div class="marca">DobleFoco<span>.co</span></div>

<div class="frase">Quién está contando<br>esta noticia, y quién no.</div>

<div class="apoyo">
  La cobertura de los medios colombianos sobre un mismo hecho, con quién es dueño
  de cada uno al lado.
</div>

<div class="pie">doblefoco.co</div>
`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
});

await pagina.setContent(html, { waitUntil: 'load' });
// Sin esto la captura puede salir con la tipografía de reserva: `load` no
// espera a que las fuentes estén listas para pintar.
await pagina.evaluate(() => document.fonts.ready);

await pagina.screenshot({ path: DESTINO, type: 'png' });
await navegador.close();

const bytes = readFileSync(DESTINO).length;
console.log(`\n  Tarjeta escrita en public/og-image.png — 1200×630, ${(bytes / 1024).toFixed(0)} KB\n`);
