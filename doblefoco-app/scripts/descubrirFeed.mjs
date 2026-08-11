/**
 * ¿TIENE FEED ESTE MEDIO? — descubridor para candidatos al catálogo.
 *
 *     npm run feed:descubrir -- elpilon.com.co choco7dias.com
 *     npm run feed:descubrir -- --json dominios.txt
 *
 * NO ES `check:feeds`. Aquel comprueba los feeds que YA están en el registro,
 * cuya URL conocemos. Este busca la URL de un medio que aún no está dentro, que
 * es un problema distinto y es el que bloqueaba la cobertura departamental.
 *
 * EL ORDEN DE LOS INTENTOS ES LO ÚNICO IMPORTANTE AQUÍ
 * ----------------------------------------------------
 * Primero el `<link rel="alternate">` declarado en el HTML, y solo después las
 * rutas convencionales. Al revés se dan por mudos medios que sí publican:
 *
 *   · Telepacífico y Teleantioquia se descartaron por no responder en `/feed`
 *     ni `/rss`, sin mirar lo que su propio HTML declaraba.
 *   · El Pilón (Cesar) figuraba como mudo en la primera pasada. Su feed está en
 *     `/api/rss`, que no es ninguna de las rutas habituales. Sin él, el Cesar
 *     seguiría en blanco en el mapa.
 *
 * «RESPONDE» Y «PUBLICA» NO SON LO MISMO, y por eso se informa de la fecha del
 * artículo más reciente. Diario del Chocó devuelve diez artículos y el último
 * es de hace tres meses. Un feed quieto no es un feed roto, pero tampoco es una
 * fuente viva, y la diferencia hay que verla antes de dar de alta al medio.
 */

import fs from 'node:fs';

/** El mismo que anuncia la ingesta: si nos bloquean, que sepan a quién. */
import { USER_AGENT } from '../shared/userAgent.js';

const TIMEOUT_MS = 15_000;
const CONCURRENCIA = 4;

/**
 * Rutas convencionales, de la más probable a la más rara. Las últimas no son
 * relleno: `/api/rss` es la de El Pilón y `/index.php?format=feed` la de los
 * Joomla, que en la prensa regional colombiana siguen siendo muchos.
 */
const RUTAS = [
    '/feed', '/feed/', '/rss', '/rss.xml', '/feed.xml', '/index.xml',
    '/atom.xml', '/?feed=rss2', '/feeds/posts/default?alt=rss',
    '/index.php?format=feed&type=rss', '/?format=feed&type=rss',
    '/rss/noticias', '/rss/portada', '/noticias/feed', '/feed/rss',
    '/rssfeed', '/es/rss', '/rss/news', '/api/rss', '/api/feed',
    '/blog/feed', '/blog-feed.xml', '/feed/atom',
];

async function pedir(url) {
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), TIMEOUT_MS);

    try {
        const respuesta = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
            signal: control.signal,
            redirect: 'follow',
        });
        return { ok: respuesta.ok, estado: respuesta.status, texto: await respuesta.text(), url: respuesta.url };
    } catch (error) {
        return {
            ok: false,
            estado: 0,
            texto: '',
            error: error.name === 'AbortError' ? 'tiempo agotado' : error.message,
        };
    } finally {
        clearTimeout(reloj);
    }
}

/**
 * ¿Es un feed CON ARTÍCULOS? Un XML válido y vacío no sirve de nada, y hay
 * bastantes: la plantilla existe, la sección está muerta.
 */
function analizarFeed(texto) {
    if (!texto || texto.length < 80) return null;

    const cabeza = texto.slice(0, 600).toLowerCase();
    if (!cabeza.includes('<?xml') && !cabeza.includes('<rss') && !cabeza.includes('<feed')) return null;

    const articulos =
        (texto.match(/<item[\s>]/gi) || []).length + (texto.match(/<entry[\s>]/gi) || []).length;
    if (articulos === 0) return null;

    const fechas = [...texto.matchAll(/<(pubDate|updated|published|dc:date)>([^<]+)</gi)]
        .map((coincidencia) => Date.parse(coincidencia[2].trim()))
        .filter(Number.isFinite);

    return {
        articulos,
        // `null` cuando ninguna fecha se pudo leer. NO se sustituye por «ahora»:
        // Diario del Sur trae los pubDate vacíos, y darle la fecha de la
        // descarga lo haría parecer el medio más al día del catálogo.
        masReciente: fechas.length ? new Date(Math.max(...fechas)) : null,
    };
}

/** Los feeds que la propia página declara. */
function feedsDeclarados(html, base) {
    return [...html.matchAll(/<link[^>]+>/gi)]
        .map((coincidencia) => coincidencia[0])
        .filter((etiqueta) => /rel=["']?alternate/i.test(etiqueta))
        .filter((etiqueta) => /application\/(rss|atom)\+xml/i.test(etiqueta))
        .map((etiqueta) => (etiqueta.match(/href=["']([^"']+)["']/i) || [])[1])
        .filter(Boolean)
        .map((href) => {
            try {
                // `&amp;` aparece tal cual en el HTML y rompe la URL si no se deshace.
                return new URL(href.replace(/&amp;/g, '&'), base).toString();
            } catch {
                return null;
            }
        })
        .filter(Boolean);
}

/** Con y sin `www`: unos redirigen y otros dan un certificado que no vale. */
async function investigar(dominio) {
    for (const base of [`https://${dominio}`, `https://www.${dominio}`]) {
        const portada = await pedir(base);
        if (!portada.texto) continue;

        const declarados = feedsDeclarados(portada.texto, portada.url ?? base);
        const probados = new Set();

        for (const candidato of [...declarados, ...RUTAS.map((ruta) => base + ruta)]) {
            if (probados.has(candidato)) continue;
            probados.add(candidato);

            const respuesta = await pedir(candidato);
            if (!respuesta.ok) continue;

            const feed = analizarFeed(respuesta.texto);
            if (feed) {
                return {
                    estado: 'con-feed',
                    url: candidato,
                    via: declarados.includes(candidato) ? 'declarado' : 'convencional',
                    ...feed,
                };
            }
        }

        return { estado: 'sin-feed', declarados: declarados.length };
    }

    return { estado: 'no-responde' };
}

// ── Programa ─────────────────────────────────────────────────────────────────

const argumentos = process.argv.slice(2);
const comoJson = argumentos.includes('--json');
const entradas = argumentos.filter((a) => !a.startsWith('--'));

if (!entradas.length) {
    console.error('Uso: npm run feed:descubrir -- <dominio|archivo.txt> [...]');
    console.error('     npm run feed:descubrir -- elpilon.com.co choco7dias.com');
    process.exit(2);
}

const dominios = entradas.flatMap((entrada) =>
    fs.existsSync(entrada)
        ? fs.readFileSync(entrada, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
        : [entrada]
);

const resultados = [];

for (let i = 0; i < dominios.length; i += CONCURRENCIA) {
    const lote = dominios.slice(i, i + CONCURRENCIA);
    const hechos = await Promise.all(
        lote.map(async (dominio) => ({ dominio, ...(await investigar(dominio)) }))
    );
    resultados.push(...hechos);

    if (comoJson) continue;

    for (const r of hechos) {
        const antiguedad = r.masReciente
            ? `${((Date.now() - r.masReciente) / 3.6e6).toFixed(0)} h`
            : 'SIN FECHA';

        const resumen =
            r.estado === 'con-feed'
                ? `${r.articulos} art., último hace ${antiguedad} [${r.via}]`
                : r.estado === 'sin-feed'
                    ? `sin feed (${r.declarados} declarados en el HTML)`
                    : 'no responde';

        console.log(`${r.dominio.padEnd(32)} ${resumen}`);
        if (r.url) console.log(`${''.padEnd(32)} └─ ${r.url}`);
    }
}

if (comoJson) {
    console.log(JSON.stringify(resultados, null, 2));
} else {
    const conFeed = resultados.filter((r) => r.estado === 'con-feed');
    const sinFecha = conFeed.filter((r) => !r.masReciente);
    console.log(`\n${conFeed.length} de ${resultados.length} con feed vivo.`);
    if (sinFecha.length) {
        console.log(`⚠ ${sinFecha.length} sin fechas legibles: no se pueden podar ni ordenar.`);
    }
}
