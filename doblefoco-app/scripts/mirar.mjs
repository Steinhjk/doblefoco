/**
 * MIRAR LAS PÁGINAS CON UN NAVEGADOR, Y AFIRMAR TRES COSAS SOBRE LO QUE SE VE.
 *
 *     npm run mirar                    todas las rutas
 *     npm run mirar -- /categorias     solo una
 *     npm run mirar -- --movil         además en 412 px
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * El punto ciego de este proyecto son las COSTURAS —JSX↔CSS, base↔memoria,
 * API↔cliente— y las 642 pruebas apenas las tocan, porque prueban módulos
 * puros. No es mala suerte: es la trampa de probar en proporción a lo fácil que
 * es probar. Lo señaló una revisión externa el 2026-08-25 y tenía razón.
 *
 * Esa revisión decía que faltaba «un modo de arranque de prueba del sistema», y
 * que esa pieza importa más que los tests. Es verdad para el e2e completo, y
 * hay un atajo que quien lo escribió no podía ver: **no hace falta un sistema
 * de mentira porque ya hay uno de verdad al que apuntar.** El proxy de
 * `vite.config.js` sirve la API real; esto abre las páginas contra ella.
 *
 * EL 2026-08-24 ESTA COMPROBACIÓN ENCONTRÓ TRES DEFECTOS QUE LAS PRUEBAS NO
 * VIERON, todos en el mismo bloque: un título que se pintaba encima del de al
 * lado, nombres de medios cortados a media palabra, y una columna vacía
 * comiéndose un tercio del ancho. Ninguno rompía un test. Los tres se veían.
 *
 * QUÉ NO ES. No prueba lógica ni sustituye al e2e con base de prueba. Comprueba
 * que lo que se pinta se puede leer. Es el 10 % del coste y cubre la clase de
 * fallo que más veces ha mordido aquí.
 *
 * DÓNDE VA. De momento a mano. En CI solo cuando esté demostrado que no da
 * falsos positivos: un vigilante que parpadea se ignora, y entonces sobra.
 */

import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const RUTAS_POR_DEFECTO = ['/', '/categorias', '/tendencias', '/mapa-medios', '/transparencia'];
const CAPTURAS = 'capturas';
/** Puerto de partida. Si está ocupado, Vite coge el siguiente y lo dice. */
const PUERTO = 5390;
const ESPERA_MS = 3_500;

const args = process.argv.slice(2);
const movil = args.includes('--movil');

/**
 * Las rutas pedidas, sobreviviendo a Git Bash.
 *
 * `npm run mirar -- /tendencias` NO llega aquí como «/tendencias»: MSYS
 * convierte cualquier argumento que empiece por barra en una ruta de Windows,
 * y lo que llega es «C:/Program Files/Git/tendencias». Pasó el 2026-08-25 y el
 * filtro se ignoró en silencio, que es peor que fallar.
 *
 * Así que se admite con barra y sin ella —`npm run mirar -- tendencias`— y se
 * deshace la conversión si ya ocurrió.
 */
const rutas = args
    .filter((a) => !a.startsWith('--'))
    .map((a) => {
        // Deshace la conversión de MSYS: de «C:/Program Files/Git/tendencias»
        // se queda con «tendencias». Sin expresión regular a propósito, que
        // aquí las barras invertidas se escapan mal con demasiada facilidad.
        const corte = a.toLowerCase().lastIndexOf('/git/');
        const limpio = corte === -1 ? a : a.slice(corte + 5);
        return limpio.startsWith('/') ? limpio : `/${limpio}`;
    });

/** Arranca Vite y devuelve su URL, leyéndola de su propia salida. */
function arrancarVite() {
    return new Promise((resolve, reject) => {
        // Se arranca Vite con el Node que ya corre y su binario del proyecto,
        // en vez de `npx` con shell: en Windows eso metia una capa de cmd que
        // se tragaba la salida, y el arranque no se detectaba nunca.
        const hijo = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PUERTO)], {
            env: { ...process.env, VITE_API_URL: 'same-origin' },
        });
        const corte = setTimeout(() => reject(new Error('Vite no arrancó en 60 s')), 60_000);
        hijo.stdout.on('data', (b) => {
            // La URL la dice ÉL, y por eso no se adivina: si el puerto estaba
            // ocupado, Vite coge otro sin avisar más que en esta línea.
            //
            // HAY QUE QUITARLE EL COLOR ANTES DE LEERLA. Vite escribe el puerto
            // en negrita, o sea que mete códigos ANSI EN MEDIO de la URL:
            //   http://localhost:\e[1m5390\e[22m/
            // Buscar /http:\/\/localhost:\d+/ sobre eso no casa nunca, y el
            // arranque parece no llegar. Costó un rato el 2026-08-25.
            const limpio = String(b).replace(/\[[0-9;]*m/g, '');
            const m = limpio.match(/http:\/\/localhost:\d+/);
            if (m) { clearTimeout(corte); resolve({ url: m[0], hijo }); }
        });
        hijo.stderr.on('data', (b) => process.stderr.write(String(b)));
        hijo.on('error', reject);
    });
}

/**
 * Lo que se comprueba en cada página. Tres cosas, y ninguna es de gusto.
 */
const COMPROBACIONES = () => {
    const fallos = [];

    // 1. La página no puede desplazarse en horizontal. Es el síntoma que deja
    //    cualquier elemento que se sale, y no tiene falsos positivos.
    if (document.documentElement.scrollWidth > window.innerWidth + 1) {
        fallos.push(
            `la página se desplaza en horizontal: ${document.documentElement.scrollWidth}px ` +
            `de contenido en ${window.innerWidth}px de ventana`
        );
    }

    // 2. Ningún texto recortado SIN haberlo pedido. Recortar con puntos
    //    suspensivos es una decisión legítima —la tarjeta de un medio lo hace—,
    //    así que solo se acusa cuando no hay `text-overflow` ni scroll propio.
    for (const el of document.querySelectorAll('h1,h2,h3,h4,p,span,a,td,th,li,strong,button')) {
        if (!el.textContent?.trim()) continue;
        const s = getComputedStyle(el);
        if (s.textOverflow === 'ellipsis') continue;
        if (['auto', 'scroll'].includes(s.overflowX)) continue;
        if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
            fallos.push(`texto recortado en <${el.tagName.toLowerCase()}>: «${el.textContent.trim().slice(0, 45)}»`);
        }
    }

    // 3. Ningún elemento pisando al vecino: se sale por la derecha de su padre.
    //    Es lo que hizo que «ORIENTACIÓN MIXTA» se pintara encima de «DERECHA».
    for (const el of document.querySelectorAll('[class]')) {
        const padre = el.parentElement;
        if (!padre || !el.textContent?.trim()) continue;
        const sp = getComputedStyle(padre);
        if (['auto', 'scroll'].includes(sp.overflowX)) continue;
        const se = getComputedStyle(el);
        // Lo que está fuera del flujo NO se mide contra su padre: un panel
        // lateral fuera de lienzo o un menú desplegable están fuera a
        // propósito, y `fixed` además se posiciona contra la VENTANA, no
        // contra el contenedor. Acusarlos sería el ruido que mata a un
        // vigilante. Lo que sí se mide es que la página no se desplace en
        // horizontal, y de eso se encarga la comprobación 1.
        if (se.position === 'absolute' || se.position === 'fixed') continue;
        if (sp.position === 'absolute' || sp.position === 'fixed') continue;
        if (se.visibility === 'hidden' || se.display === 'none') continue;
        const r = el.getBoundingClientRect(), rp = padre.getBoundingClientRect();
        if (rp.width === 0) continue;
        if (r.right > rp.right + 2) {
            fallos.push(
                `«${el.className}» se sale ${(r.right - rp.right).toFixed(0)}px de su contenedor ` +
                `(«${el.textContent.trim().slice(0, 30)}»)`
            );
        }
    }

    return [...new Set(fallos)];
};

const { url, hijo } = await arrancarVite();
console.log(`Vite en ${url}\n`);
mkdirSync(CAPTURAS, { recursive: true });

const navegador = await chromium.launch();
const vistas = movil
    ? [{ nombre: 'escritorio', w: 1440, h: 1000 }, { nombre: 'movil', w: 412, h: 900 }]
    : [{ nombre: 'escritorio', w: 1440, h: 1000 }];

let total = 0;
const aRevisar = rutas.length ? rutas : RUTAS_POR_DEFECTO;

for (const vista of vistas) {
    const ctx = await navegador.newContext({ viewport: { width: vista.w, height: vista.h } });
    const pagina = await ctx.newPage();

    for (const ruta of aRevisar) {
        const consola = [];
        const onMsg = (m) => { if (m.type() === 'error') consola.push(m.text().slice(0, 120)); };
        const onErr = (e) => consola.push(`excepción: ${String(e).slice(0, 120)}`);
        pagina.on('console', onMsg);
        pagina.on('pageerror', onErr);

        await pagina.goto(url + ruta, { waitUntil: 'networkidle', timeout: 60_000 })
            .catch((e) => consola.push(`no cargó: ${e.message.slice(0, 90)}`));
        await pagina.waitForTimeout(ESPERA_MS);

        const fallos = await pagina.evaluate(COMPROBACIONES);
        const nombre = `${vista.nombre}${ruta.replace(/\//g, '-') || '-inicio'}`;
        await pagina.screenshot({ path: `${CAPTURAS}/${nombre}.png` });

        const problemas = [...consola.map((c) => `consola: ${c}`), ...fallos];
        total += problemas.length;
        console.log(`${problemas.length ? '✗' : '✓'}  ${vista.nombre.padEnd(11)} ${ruta}`);
        for (const p of [...new Set(problemas)]) console.log(`      ${p}`);

        pagina.off('console', onMsg);
        pagina.off('pageerror', onErr);
    }
    await ctx.close();
}

await navegador.close();
hijo.kill();

console.log(`\nCapturas en ${CAPTURAS}/`);
if (total) {
    console.log(`${total} problema${total === 1 ? '' : 's'} en lo que se ve.`);
    process.exit(1);
}
console.log('Nada que reprochar a lo que se ve.');
