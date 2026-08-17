/**
 * EL CENTINELA — ¿han publicado los medios algo que toque lo que su ficha afirma?
 *
 * Ejecutar con: npm run centinela
 *               npm run centinela -- --medio=diario-la-libertad
 *               npm run centinela -- --strict   (sale 1 si hay novedades)
 *
 * Por qué existe
 * --------------
 * `vigilancia.yml` avisa de lo que está CAÍDO. Nada avisa de lo que está
 * DESACTUALIZADO, y eso es lo que se lleva por delante las fichas: la de EL
 * DIARIO de Boyacá caducó en tres días, y la de Diario La Libertad cambió entera
 * en otros tres —apareció un conflicto de interés que no tenía, publicado por el
 * propio medio once meses antes—.
 *
 * Lo que esto hace es la parte mecánica de aquella comprobación: preguntarle al
 * buscador de cada medio por los términos que sostienen su ficha y avisar de lo
 * que sea NUEVO desde la última pasada. Los términos y su porqué están en
 * `shared/centinela.js`.
 *
 * LO QUE ESTO NO HACE, Y CONVIENE NO CONFUNDIRLO
 * ----------------------------------------------
 * No lee las piezas ni las caracteriza. Que la pieza de Tcherassi del 10-05-2025
 * sea promoción política sin contradictorio lo dijo una persona leyéndola; este
 * programa solo habría dicho «hay una pieza nueva con Tcherassi en el titular».
 * Eso ya es casi todo el valor: el hallazgo tardó tres días en aparecer porque
 * nadie estaba mirando, no porque fuera difícil de ver.
 *
 * TRES CANALES, EN ESTE ORDEN, Y EL TERCERO ES DECIR QUE NO SE PUEDE
 * -----------------------------------------------------------------
 *   1. API REST de WordPress — devuelve fecha exacta. La Nación (Neiva) la tiene
 *      abierta.
 *   2. Buscador HTML `?s=` — La Libertad tiene la API cerrada (401) y el
 *      buscador abierto. La fecha sale del permalink cuando lo lleva.
 *   3. NO COMPROBABLE — Cablenoticias no es WordPress y no hay por dónde
 *      preguntarle. Se dice en voz alta en cada pasada.
 *
 * El tercero es tan importante como los otros dos. Una comprobación que calla
 * cuando no puede comprobar da confianza sin respaldo; es la misma razón por la
 * que `desfase.yml` grita cuando el commit viene como «desconocido».
 *
 * POR QUÉ UN NAVEGADOR Y NO NUESTRO BOT
 * -------------------------------------
 * Igual que en `verifySources.mjs`: esto no consume un feed que alguien publica
 * para ser consumido, hace una consulta puntual a un buscador. Y hay una lección
 * cara detrás — la pieza clave de La Libertad estuvo tres días dada por
 * inaccesible por un 403 que no era un bloqueo, sino un User-Agent que el sitio
 * no digería. Con un User-Agent de navegador responde 200.
 *
 * CADENCIA: SEMANAL, NO DIARIA
 * ----------------------------
 * Son sitios ajenos. Este proyecto se presenta ante ellos con un User-Agent
 * propio y una URL para pedirnos que paremos; consultarles a diario lo que
 * cambia cada meses contradice esa postura. Entre petición y petición se espera,
 * también a propósito.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { VIGILANCIA } from '../shared/centinela.js';
import { MEDIA_REGISTRY } from '../shared/mediaRegistry.js';

const STRICT = process.argv.includes('--strict');
const SOLO_MEDIO = process.argv.find((a) => a.startsWith('--medio='))?.slice('--medio='.length);

const TIMEOUT_MS = 25_000;
const PAUSA_MS = 1_500;
const MAX_RESULTADOS = 60;
/** Cuántas URL se recuerdan por consulta. Suficiente para que nada reaparezca como nuevo. */
const MEMORIA_POR_CONSULTA = 300;
/** En la primera pasada no se vuelca el archivo entero: se muestran las más recientes. */
const MUESTRA_LINEA_BASE = 5;

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const RUTA_ESTADO = fileURLToPath(new URL('../centinela/estado.json', import.meta.url));

const medioPorId = new Map(MEDIA_REGISTRY.map((m) => [m.id, m]));

// ── Utilidades ───────────────────────────────────────────────────────────────

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Sin tildes y en minúsculas: «Stéreo» tiene que encontrar «STEREO». */
const normalizar = (s) =>
    (s ?? '')
        .normalize('NFD')
        // Se quitan por propiedad Unicode y no por un rango literal: un editor
        // que reguarde el archivo en otra codificación se llevaría el rango por delante.
        .replace(/\p{M}/gu, '')
        .toLowerCase();

/**
 * ¿Aparece el término COMO PALABRA en el titular?
 *
 * Con `includes` no valía, y la primera pasada lo demostró en el sitio: vigilar
 * «Esper» —la familia dueña de La Libertad— devolvía 43 piezas, y las de arriba
 * eran «avenida La ESPERanza», «los que ESPERan», «la perorata de la ESPERanza
 * ciega». Cuarenta y tres avisos de los que ninguno tocaba la ficha.
 *
 * Los límites se piden con clases Unicode y no con `\b`, que en JavaScript trata
 * la ñ y las vocales acentuadas como frontera de palabra. Aquí los titulares son
 * en español.
 */
const escaparRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function apareceComoPalabra(texto, termino) {
    const t = normalizar(texto);
    const c = normalizar(termino);
    if (!c) return false;
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaparRegExp(c)}($|[^\\p{L}\\p{N}])`, 'u').test(t);
}

const limpiarTitulo = (s) =>
    (s ?? '')
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#8217;|&#039;|&rsquo;/g, "'")
        .replace(/&laquo;|&#171;/g, '«')
        .replace(/&raquo;|&#187;/g, '»')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

async function pedir(url) {
    const control = new AbortController();
    const alarma = setTimeout(() => control.abort(), TIMEOUT_MS);
    try {
        return await fetch(url, {
            redirect: 'follow',
            signal: control.signal,
            headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/json;q=0.9,*/*;q=0.8' },
        });
    } finally {
        clearTimeout(alarma);
    }
}

/** La fecha del permalink, cuando el sitio la lleva. `null` no es un error: es no saberla. */
function fechaDelEnlace(url) {
    const m = url.match(/\/(20\d\d)\/(\d\d)\/(\d\d)\//);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

// ── Canal 1: API REST de WordPress ───────────────────────────────────────────

async function porRest(origen, consulta) {
    const url =
        `${origen}/wp-json/wp/v2/posts?search=${encodeURIComponent(consulta)}` +
        `&per_page=${MAX_RESULTADOS}&_fields=date,link,title`;

    const res = await pedir(url);
    if (!res.ok) return null;

    const cuerpo = await res.text();
    let datos;
    try {
        datos = JSON.parse(cuerpo);
    } catch {
        // Un sitio que no es WordPress devuelve su portada con 200. No es un
        // fallo, es que este canal no aplica.
        return null;
    }
    if (!Array.isArray(datos)) return null;

    return datos
        .filter((p) => p?.link)
        .map((p) => ({
            url: p.link,
            titulo: limpiarTitulo(p.title?.rendered ?? ''),
            fecha: typeof p.date === 'string' ? p.date.slice(0, 10) : null,
        }));
}

// ── Canal 2: el buscador HTML ────────────────────────────────────────────────

/** Rutas que no son piezas: archivos, taxonomías, paginación, recursos. */
const NO_ES_PIEZA =
    /\/(wp-content|wp-json|wp-admin|category|categoria|tag|author|autor|page|feed|comment)[/-]|\.(jpg|jpeg|png|webp|gif|svg|pdf|mp3|mp4)($|\?)/i;

async function porHtml(origen, consulta) {
    const res = await pedir(`${origen}/?s=${encodeURIComponent(consulta)}`);
    if (!res.ok) return null;

    const html = await res.text();
    const host = new URL(origen).host.replace(/^www\./, '');

    const encontrados = new Map();
    const rx = /href="(https?:\/\/[^"]+)"[^>]*>([^<]{10,220})</g;

    for (const [, url, texto] of html.matchAll(rx)) {
        if (!url.includes(host)) continue;
        if (NO_ES_PIEZA.test(url)) continue;
        if (encontrados.has(url)) continue;

        const titulo = limpiarTitulo(texto);
        if (!titulo) continue;

        encontrados.set(url, { url, titulo, fecha: fechaDelEnlace(url) });
    }

    return encontrados.size ? [...encontrados.values()] : null;
}

// ── Una consulta, por el canal que haya ──────────────────────────────────────

async function preguntar(origen, consulta, canalConocido) {
    const orden = canalConocido === 'html' ? ['html', 'rest'] : ['rest', 'html'];

    for (const canal of orden) {
        try {
            const piezas = canal === 'rest' ? await porRest(origen, consulta) : await porHtml(origen, consulta);
            if (piezas) return { canal, piezas };
        } catch (error) {
            // Un canal que revienta no descarta el otro. Si revientan los dos,
            // sale como no comprobable, que es lo honesto.
            if (canal === orden[1]) return { canal: 'no-comprobable', piezas: [], error: error?.message };
        }
        await dormir(PAUSA_MS);
    }

    return { canal: 'no-comprobable', piezas: [] };
}

// ── Estado entre pasadas ─────────────────────────────────────────────────────

function leerEstado() {
    try {
        return JSON.parse(readFileSync(RUTA_ESTADO, 'utf8'));
    } catch {
        return { version: 1, medios: {} };
    }
}

function guardarEstado(estado) {
    mkdirSync(dirname(RUTA_ESTADO), { recursive: true });
    writeFileSync(RUTA_ESTADO, `${JSON.stringify(estado, null, 4)}\n`, 'utf8');
}

// ── Recorrido ────────────────────────────────────────────────────────────────

const hoy = new Date().toISOString().slice(0, 10);
const estado = leerEstado();

const ids = Object.keys(VIGILANCIA).filter((id) => !SOLO_MEDIO || id === SOLO_MEDIO);

if (SOLO_MEDIO && ids.length === 0) {
    console.error(`No hay vigilancia escrita para «${SOLO_MEDIO}». Ver shared/centinela.js.`);
    process.exit(1);
}

console.log(`Centinela — ${ids.length} medio(s) vigilado(s). ${new Date().toISOString()}`);
console.log();

const novedades = [];
const noComprobables = [];

for (const id of ids) {
    const medio = medioPorId.get(id);
    const nombre = medio?.shortName || medio?.name || id;
    const origen = `https://${medio?.domain ?? id}`;

    const previo = estado.medios[id] ?? { consultas: {} };
    const registro = { ultimaComprobacion: hoy, canal: previo.canal ?? null, consultas: {} };

    console.log(`── ${nombre}`);

    for (const { consulta, vigila, enTitular = true } of VIGILANCIA[id].consultas) {
        const { canal, piezas, error } = await preguntar(origen, consulta, previo.canal);
        registro.canal = canal === 'no-comprobable' ? registro.canal : canal;

        if (canal === 'no-comprobable') {
            console.log(`   ⚠ «${consulta}»: NO COMPROBABLE — no hay buscador consultable${error ? ` (${error})` : ''}`);
            noComprobables.push({ nombre, consulta, vigila });
            registro.consultas[consulta] = previo.consultas?.[consulta] ?? { vistos: [] };
            continue;
        }

        const relevantes = piezas
            .filter((p) => !enTitular || apareceComoPalabra(p.titulo, consulta))
            .sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));

        const vistos = new Set(previo.consultas?.[consulta]?.vistos ?? []);
        const esLineaBase = !previo.consultas?.[consulta];
        const nuevas = relevantes.filter((p) => !vistos.has(p.url));

        if (esLineaBase && relevantes.length === 0) {
            // Cero no es tranquilidad: puede ser que el medio no haya publicado
            // nada, o que el término esté mal escrito y esta consulta no vaya a
            // encontrar nunca nada. Se distingue a la vista.
            console.log(`   ? «${consulta}» [${canal}]: SIN RESULTADOS — comprobar que el término sea el correcto`);
        } else if (esLineaBase) {
            console.log(
                `   · «${consulta}» [${canal}]: línea base con ${relevantes.length} pieza(s). ` +
                    `A partir de la próxima pasada solo se avisa de lo nuevo.`,
            );
            for (const p of relevantes.slice(0, MUESTRA_LINEA_BASE)) {
                console.log(`       ${p.fecha ?? '    ?     '}  ${p.titulo.slice(0, 88)}`);
            }
        } else if (nuevas.length === 0) {
            console.log(`   · «${consulta}» [${canal}]: sin novedades (${relevantes.length} conocidas)`);
        } else {
            console.log(`   ⚑ «${consulta}» [${canal}]: ${nuevas.length} PIEZA(S) NUEVA(S)`);
            for (const p of nuevas) {
                console.log(`       ${p.fecha ?? '    ?     '}  ${p.titulo.slice(0, 88)}`);
                console.log(`       ${p.url}`);
            }
            console.log(`       vigila: ${vigila}`);
            novedades.push({ nombre, id, consulta, vigila, piezas: nuevas });
        }

        registro.consultas[consulta] = {
            vistos: [...relevantes.map((p) => p.url), ...vistos].slice(0, MEMORIA_POR_CONSULTA),
        };

        await dormir(PAUSA_MS);
    }

    estado.medios[id] = registro;
    console.log();
}

guardarEstado(estado);

// ── Informe ──────────────────────────────────────────────────────────────────

console.log('─'.repeat(78));

if (novedades.length) {
    console.log(`${novedades.length} consulta(s) con piezas nuevas. Qué queda en duda:`);
    for (const n of novedades) console.log(`  ⚑ ${n.nombre} · «${n.consulta}» — ${n.vigila}`);
} else {
    console.log('Sin novedades en lo vigilado.');
}

if (noComprobables.length) {
    console.log();
    console.log('NO COMPROBABLES HOY (no es un aprobado, es un hueco declarado):');
    for (const n of noComprobables) console.log(`  ⚠ ${n.nombre} · «${n.consulta}»`);
}

console.log();
console.log(`Estado guardado en centinela/estado.json (${hoy}).`);

if (STRICT && novedades.length) process.exit(1);
