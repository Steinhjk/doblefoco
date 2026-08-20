/**
 * LA AUDITORÍA — los chequeos que se hacían a mano, corriendo solos y dejando rastro.
 *
 * Ejecutar:  npm run auditoria
 *            npm run auditoria -- --medio=diario-la-libertad     (uno solo)
 *            npm run auditoria -- --resumen=/tmp/resumen.json    (para el flujo)
 *            npm run auditoria -- --solo-informe                 (relee lo guardado y lo reimprime)
 *
 * POR QUÉ EXISTE
 * --------------
 * `check:feeds`, `check:sources` y `check:registry` dicen la verdad, pero solo
 * cuando alguien se acuerda de ejecutarlas, y cada una escupe su informe en una
 * terminal que nadie vuelve a mirar. El panel «Estado del catálogo» arregló la
 * mitad del problema —enseña lo que ya está escrito en el repositorio— y dejó la
 * otra mitad intacta: nadie estaba CORRIENDO los chequeos.
 *
 * Esto los corre, y sobre todo **los escribe**: `auditoria/estado.json` es la
 * memoria, va versionada como la del centinela, y es lo que el panel pinta.
 *
 * LOS CUATRO CHEQUEOS, Y DE DÓNDE SALE CADA UNO
 * ---------------------------------------------
 * 1. VITALES DEL FEED CON LA VENTANA REAL. No «50 ítems» sino «50 ítems que
 *    cubren 9,8 h, o sea ~120 piezas al día, o sea que caben 5,9 veces en un
 *    sondeo». La aritmética vive en `shared/auditoria.js` porque el panel dice
 *    los mismos números.
 * 2. LA TRAMPA DE LAS RUTAS INSTITUCIONALES. Sitios que devuelven 200 a
 *    cualquier ruta. Nos ha mordido dos veces —Quindío Noticias y La Libertad—
 *    y se detecta como el centinela detecta un buscador falso: pidiendo algo
 *    que no existe. Si /una-ruta-inventada responde 200, el 200 de /nosotros no
 *    demuestra nada, y decirlo es más útil que fingir que sí.
 * 3. REINTENTO CON USER-AGENT LIMPIO ANTES DE DECLARAR BLOQUEO. Era una regla
 *    que vivía en la cabeza: la pieza de Tcherassi estuvo tres días dada por
 *    inaccesible por un 403 que no era un bloqueo, sino una tilde en la
 *    cabecera. Aquí es código.
 * 4. FUENTES VIVAS. Lo que hacía `check:sources`, pero guardado en vez de
 *    impreso, y atribuido a su medio para que aparezca en la fila que le toca.
 *
 * ── LO QUE ESTE ARCHIVO NO HACE ────────────────────────────────────────────
 *
 * NO SE DISFRAZA DE NAVEGADOR. `verifySources.mjs` sí lo hace y allí tiene su
 * motivo, pero esto corre cada semana contra 76 sitios ajenos y el proyecto se
 * presenta ante ellos con nombre y una URL para pedirnos que paremos. La
 * escalera es de dos peldaños y los dos dicen quiénes somos: el User-Agent
 * completo, y si eso recibe un 403, `DobleFocoBot/1.0` a secas —que es lo que
 * está medido que basta—. Si aun así nos rechazan, la respuesta NO es «roto»:
 * es «no comprobable», que es distinto y se explica abajo.
 *
 * NO CONFUNDE «NO SIRVE» CON «NO SE PUDO SABER». Un 404 es un defecto nuestro:
 * la ficha enlaza a algo que no existe. Un 403 o un 429 es un sitio que nos
 * cierra la puerta, y la URL puede estar perfectamente viva para un lector.
 * Vorágine y Razón Pública responden desde una máquina de casa y fallan desde
 * Actions por la IP; darlos por muertos sería un error nuestro leído como un
 * defecto suyo. Por eso «rechazado» sale como NO COMPROBABLE y con la
 * instrucción de repetirlo en local.
 *
 * NO JUZGA LAS FICHAS. No mide si una ficha ha caducado, porque no hay umbral
 * que lo respalde —la de EL DIARIO caducó en tres días—. Mide si lo que la
 * sostiene sigue en pie, que es otra cosa y sí se puede comprobar.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import Parser from 'rss-parser';

import { MEDIA_REGISTRY, getIngestFeeds } from '../shared/mediaRegistry.js';
import { OWNERSHIP_PROFILES } from '../shared/mediaOwnership.js';
import { USER_AGENT } from '../shared/userAgent.js';
import { RETENTION_MS, ITEMS_PER_FEED } from '../server/services/ingestDaemon.js';
import {
    RED_HORAS,
    VERSION_AUDITORIA,
    clasificarFeed,
    estadosDe,
    margenDeSondeo,
    peorEstado,
    porGravedad,
    resumirAuditoria,
    ventanaYRitmo,
} from '../shared/auditoria.js';
import {
    aceptadosSinNota,
    conciliarHallazgos,
    hallazgosDeLaPasada,
    pendientes,
    resumirHallazgos,
    VERSION_HALLAZGOS,
} from '../shared/hallazgos.js';

// ── Argumentos ───────────────────────────────────────────────────────────────

const arg = (nombre) =>
    process.argv.find((a) => a.startsWith(`--${nombre}=`))?.slice(nombre.length + 3);

const SOLO_MEDIO = arg('medio');
const RUTA_RESUMEN = arg('resumen');
const SOLO_INFORME = process.argv.includes('--solo-informe');

const TIMEOUT_MS = 20_000;
/** Medios a la vez. Dentro de cada medio las peticiones van EN SERIE, que es lo
 *  que evita caerle encima a un mismo servidor con cuatro cosas a la vez. */
const MEDIOS_A_LA_VEZ = 4;
/** Respiro entre dos peticiones al mismo sitio. */
const PAUSA_MS = 700;

const RUTA_ESTADO = fileURLToPath(new URL('../auditoria/estado.json', import.meta.url));

/*
 * EL LIBRO, QUE ES OTRA COSA QUE LA FOTO.
 *
 * `estado.json` se sobrescribe en cada pasada: es lo que pasa HOY. `hallazgos.json`
 * no se sobrescribe nunca — se concilia—, y es lo que llevamos sin arreglar. Sin
 * el segundo, un defecto de hace dos meses y uno de esta manana se ven iguales, y
 * lo que se decidio sobre cualquiera de los dos no se ve en ninguna parte.
 */
const RUTA_LIBRO = fileURLToPath(new URL('../auditoria/hallazgos.json', import.meta.url));

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const hoy = new Date().toISOString().slice(0, 10);

// ── La escalera de User-Agent ────────────────────────────────────────────────

/**
 * El segundo peldaño: el mismo bot, sin el paréntesis explicativo.
 *
 * Está medido en `shared/userAgent.js`: el 403 que nos cerró puertas venía de
 * una tilde en esa parte de la cabecera, y `DobleFocoBot/1.0` a secas devolvía
 * 200 en el mismo servidor y el mismo minuto. Seguimos diciendo quiénes somos.
 */
const UA_LIMPIO = 'DobleFocoBot/1.0';

/** Códigos que significan «esto existe», aunque no nos dejen verlo. */
const VIVA = new Set([200, 201, 202, 203, 204, 301, 302, 303, 307, 308]);
/** Nos cierran la puerta. No es lo mismo que no existir. */
const RECHAZO = new Set([401, 403, 405, 406, 429, 451]);

async function unaPeticion(url, { method = 'GET', ua = USER_AGENT } = {}) {
    const control = new AbortController();
    const alarma = setTimeout(() => control.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            method,
            redirect: 'follow',
            signal: control.signal,
            headers: { 'User-Agent': ua, Accept: 'text/html,*/*;q=0.8' },
        });
        const cuerpo = method === 'GET' ? await res.text() : '';
        return { status: res.status, cuerpo, url: res.url };
    } finally {
        clearTimeout(alarma);
    }
}

/**
 * Una petición con el reintento del punto 3 ya dentro.
 *
 * Devuelve además `uaLimpio: true` cuando el segundo peldaño rescató lo que el
 * primero no consiguió. Ese dato sube al panel a propósito: si un día son
 * quince los medios rescatados así, la conclusión no es «hay que reintentar
 * más», es que nuestro User-Agent principal tiene un problema.
 */
async function pedir(url) {
    let primero;
    try {
        primero = await unaPeticion(url);
        if (!RECHAZO.has(primero.status)) return { ...primero, uaLimpio: false, error: null };
    } catch (error) {
        return {
            status: 0,
            cuerpo: '',
            uaLimpio: false,
            error: error?.name === 'AbortError' ? `sin respuesta en ${TIMEOUT_MS} ms` : error?.message,
        };
    }

    await dormir(PAUSA_MS);

    try {
        const segundo = await unaPeticion(url, { ua: UA_LIMPIO });
        if (!RECHAZO.has(segundo.status)) return { ...segundo, uaLimpio: true, error: null };
        return { ...segundo, uaLimpio: false, error: `rechazado (${segundo.status})` };
    } catch {
        return { ...primero, uaLimpio: false, error: `rechazado (${primero.status})` };
    }
}

/** El veredicto de una URL, con la distinción que da sentido a todo esto. */
function veredictoDeUrl(r) {
    if (VIVA.has(r.status)) return { estado: 'sano', motivo: null };
    if (RECHAZO.has(r.status))
        return {
            estado: 'no-comprobable',
            motivo: `${r.status}: nos cierra la puerta. Repetir en local antes de darla por rota`,
        };
    if (r.status === 0)
        return { estado: 'no-comprobable', motivo: r.error ?? 'no contestó' };
    return { estado: 'roto', motivo: `${r.status}` };
}

// ── 1. Vitales del feed ──────────────────────────────────────────────────────

const parser = new Parser({
    headers: { 'User-Agent': USER_AGENT },
    timeout: TIMEOUT_MS,
    customFields: {
        item: [
            ['media:content', 'mediaContent', { keepArray: true }],
            ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
            ['content:encoded', 'contentEncoded'],
        ],
    },
});

/** ¿Vienen de más nuevo a más viejo? Con menos de cuatro fechas no se afirma. */
function esCronologico(edades) {
    if (edades.length < 4) return null;
    let enOrden = 0;
    for (let i = 1; i < edades.length; i += 1) if (edades[i] >= edades[i - 1]) enOrden += 1;
    return enOrden / (edades.length - 1) >= 0.8;
}

/**
 * La ficha de feed, SIEMPRE CON LAS MISMAS CLAVES.
 *
 * Un medio sin feed tentaba a devolver un objeto corto de tres campos, y el
 * archivo acababa con setenta y seis formas distintas. El panel entonces tiene
 * que preguntar por cada campo antes de leerlo —y `tsc` lo cazó, que para eso
 * está—. Lo que falta se escribe como `null`, que además dice algo: «se miró y
 * no hay», en vez del silencio de una clave ausente.
 */
const fichaDeFeed = (parcial) => ({
    estado: 'no-comprobable',
    motivo: null,
    items: 0,
    frescos: 0,
    tomados: 0,
    conImagen: 0,
    ventanaHoras: null,
    piezasPorDia: null,
    edadMasNuevoHoras: null,
    margen: null,
    margenRed: null,
    vias: [],
    ...parcial,
});

async function auditarFeed(feeds) {
    if (!feeds.length) return fichaDeFeed({ motivo: 'el medio no tiene feed' });

    const vias = [];

    for (const feed of feeds) {
        if (vias.length) await dormir(PAUSA_MS);
        const inicio = Date.now();

        try {
            const parsed = await parser.parseURL(feed.url);
            const items = parsed?.items ?? [];
            const ahora = Date.now();

            const fechas = items
                .map((i) => Date.parse(i.isoDate ?? i.pubDate ?? ''))
                .filter(Number.isFinite);

            // La ventana se mide sobre el feed ENTERO: es el ritmo del medio.
            const { ventanaHoras, piezasPorDia } = ventanaYRitmo(fechas);

            // Lo fresco, en cambio, se mide sobre lo que el motor toma.
            const tomados = items.slice(0, ITEMS_PER_FEED);
            const edades = tomados
                .map((i) => ahora - Date.parse(i.isoDate ?? i.pubDate ?? ''))
                .filter(Number.isFinite);

            /*
             * La edad de la pieza MÁS NUEVA, que es lo que separa a un medio que
             * publica despacio de un feed que se quedó parado. Se mide sobre el
             * feed entero y no sobre lo que toma el motor: si el feed viniera
             * desordenado, la más nueva podría estar en la posición veinte.
             */
            const edadMasNuevoHoras = fechas.length
                ? (ahora - Math.max(...fechas)) / 3_600_000
                : null;

            vias.push({
                url: feed.url,
                via: feed.via,
                items: items.length,
                tomados: tomados.length,
                frescos: edades.filter((ms) => ms < RETENTION_MS).length,
                conImagen: tomados.filter((i) => i.mediaContent || i.mediaThumbnail || i.contentEncoded)
                    .length,
                ventanaHoras: ventanaHoras === null ? null : Number(ventanaHoras.toFixed(1)),
                piezasPorDia: piezasPorDia === null ? null : Number(piezasPorDia.toFixed(1)),
                edadMasNuevoHoras:
                    edadMasNuevoHoras === null ? null : Number(edadMasNuevoHoras.toFixed(1)),
                /*
                 * LOS MISMOS NÚMEROS SIN REDONDEAR, PARA CLASIFICAR CON ELLOS.
                 *
                 * Lo de arriba se redondea para que el archivo se lea; si además
                 * se clasifica con lo redondeado, W Radio publica 0,0155 piezas
                 * al día, eso se guarda como 0,0 y el clasificador lo lee como
                 * «ritmo desconocido». Y no lo es: su feed sirve piezas de hace
                 * diez meses, que es el hallazgo que el redondeo tapaba.
                 */
                crudo: { piezasPorDia, edadMasNuevoHoras },
                cronologico: esCronologico(edades),
                ms: Date.now() - inicio,
                respondio: true,
                error: null,
            });
        } catch (error) {
            vias.push({
                url: feed.url,
                via: feed.via,
                items: 0,
                tomados: 0,
                frescos: 0,
                conImagen: 0,
                ventanaHoras: null,
                piezasPorDia: null,
                edadMasNuevoHoras: null,
                crudo: { piezasPorDia: null, edadMasNuevoHoras: null },
                cronologico: null,
                ms: Date.now() - inicio,
                respondio: false,
                error: error?.message ?? 'error desconocido',
            });
        }
    }

    /*
     * Un medio con dos vías está sano si UNA alimenta: es lo que hace el motor.
     * Así que se clasifica cada vía y se toma la mejor, no la peor — al revés
     * que en el resto de la auditoría, y por eso se dice aquí.
     */
    const clasificadas = vias.map((v) => {
        const margen = margenDeSondeo(v.crudo.piezasPorDia);
        const margenRed = margenDeSondeo(v.crudo.piezasPorDia, RED_HORAS);
        return {
            ...v,
            margen: margen === null ? null : Number(margen.toFixed(2)),
            // No entra en la clasificación: mientras el motor viva, el reloj que
            // manda es el suyo. Se guarda para poder responder qué pasaría si
            // cayera, que es una pregunta que hoy nadie puede contestar.
            margenRed: margenRed === null ? null : Number(margenRed.toFixed(2)),
            ...clasificarFeed({ ...v, ...v.crudo, margen }),
        };
    });

    const mejor = [...clasificadas].sort((a, b) => porGravedad(b.estado, a.estado))[0];

    return fichaDeFeed({
        estado: mejor.estado,
        motivo: mejor.motivo,
        items: mejor.items,
        frescos: mejor.frescos,
        tomados: mejor.tomados,
        conImagen: mejor.conImagen,
        ventanaHoras: mejor.ventanaHoras,
        piezasPorDia: mejor.piezasPorDia,
        edadMasNuevoHoras: mejor.edadMasNuevoHoras,
        margen: mejor.margen,
        margenRed: mejor.margenRed,
        vias: clasificadas.map((v) => ({ url: v.url, via: v.via, estado: v.estado, motivo: v.motivo })),
    });
}

// ── 2. La trampa de las rutas institucionales ────────────────────────────────

/** Rutas que una ficha suele citar como prueba de quién está detrás. */
const PALABRAS_INSTITUCIONALES = [
    'nosotros',
    'quienes-somos',
    'quienes_somos',
    'quienessomos',
    'equipo',
    'contacto',
    'about',
    'staff',
    'directorio',
    'mision',
    'historia',
    'empresa',
];

const esRutaInstitucional = (url) => {
    try {
        const ruta = new URL(url).pathname.toLowerCase();
        return PALABRAS_INSTITUCIONALES.some((p) => ruta.includes(p));
    } catch {
        return false;
    }
};

const tituloDe = (html) =>
    html
        .match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
        ?.replace(/\s+/g, ' ')
        .trim() ?? null;

/**
 * ¿Este sitio responde 200 A CUALQUIER COSA?
 *
 * Se le pide una ruta que no puede existir. Si contesta 200, entonces el 200 de
 * `/quienes-somos` no prueba que esa página exista: prueba que el servidor no
 * sabe decir que no. Es la misma prueba que el centinela le hace a un buscador
 * antes de fiarse de él, y por el mismo motivo.
 *
 * LO QUE AQUÍ NO SE DEDUCE. Se guarda el tamaño de la respuesta como evidencia,
 * pero no se razona con él: que dos respuestas midan distinto prueba que no son
 * la misma página, NO que la que pediste sea la que te dieron. Esa confusión es
 * la que dejó pasar el caso de La Libertad la segunda vez.
 */
/** Misma regla que en el feed: una sola forma, y lo que falta va como `null`. */
const fichaDeRutas = (parcial) => ({
    estado: 'no-comprobable',
    respondeATodo: null,
    motivo: null,
    status: null,
    titulo: null,
    bytes: null,
    ...parcial,
});

async function auditarRutas(medio) {
    const base = `https://${medio.domain.replace(/^www\./, '')}`;
    const inventada = `${base}/doblefoco-ruta-que-no-existe-${Date.now().toString(36)}`;

    const r = await pedir(inventada);

    if (r.status === 0) return fichaDeRutas({ motivo: r.error ?? 'el sitio no contestó' });

    if (RECHAZO.has(r.status))
        return fichaDeRutas({
            status: r.status,
            motivo: `${r.status}: nos cierra la puerta. Repetir en local`,
        });

    if (VIVA.has(r.status))
        return fichaDeRutas({
            estado: 'revisar',
            respondeATodo: true,
            status: r.status,
            motivo: 'devuelve 200 a una ruta inventada: aquí un 200 no prueba que la página exista',
            titulo: tituloDe(r.cuerpo),
            bytes: r.cuerpo.length,
        });

    return fichaDeRutas({ estado: 'sano', respondeATodo: false, status: r.status });
}

// ── 4. Fuentes vivas ─────────────────────────────────────────────────────────

async function auditarFuentes(ficha, rutas) {
    const urls = ficha?.sources ?? [];
    const resultados = [];

    for (const url of urls) {
        if (resultados.length) await dormir(PAUSA_MS);
        const r = await pedir(url);
        const veredicto = veredictoDeUrl(r);
        const institucional = esRutaInstitucional(url);

        /*
         * AQUÍ SE ENCUENTRAN LOS CHEQUEOS 2 Y 4, Y ESE CRUCE ES EL QUE VALE.
         * Una fuente institucional que responde 200 en un sitio que responde 200
         * a todo no está comprobada: está sin comprobar y pareciéndolo. Bajarla
         * a «no comprobable» es lo que impide que el panel diga que sí a algo
         * que nadie ha mirado.
         */
        const degradada =
            veredicto.estado === 'sano' && institucional && rutas.respondeATodo === true;

        resultados.push({
            url,
            institucional,
            status: r.status,
            uaLimpio: r.uaLimpio,
            titulo: institucional ? tituloDe(r.cuerpo) : null,
            estado: degradada ? 'no-comprobable' : veredicto.estado,
            motivo: degradada
                ? 'responde 200, pero este sitio responde 200 a todo: no prueba nada'
                : veredicto.motivo,
        });
    }

    return resultados;
}

// ── El recorrido ─────────────────────────────────────────────────────────────

async function enParalelo(items, limite, trabajo) {
    const resultados = new Array(items.length);
    let cursor = 0;
    await Promise.all(
        Array.from({ length: Math.min(limite, items.length) }, async () => {
            while (cursor < items.length) {
                const i = cursor;
                cursor += 1;
                resultados[i] = await trabajo(items[i]);
            }
        }),
    );
    return resultados;
}

function leerEstado() {
    try {
        return JSON.parse(readFileSync(RUTA_ESTADO, 'utf8'));
    } catch {
        return { version: VERSION_AUDITORIA, ultimaPasada: null, medios: {} };
    }
}

function leerLibro() {
    try {
        return JSON.parse(readFileSync(RUTA_LIBRO, 'utf8'));
    } catch {
        return { version: VERSION_HALLAZGOS, ultimaPasada: null, hallazgos: {} };
    }
}

const feedsPorMedio = new Map();
for (const feed of getIngestFeeds()) {
    const lista = feedsPorMedio.get(feed.mediaId) ?? [];
    lista.push(feed);
    feedsPorMedio.set(feed.mediaId, lista);
}

const medios = MEDIA_REGISTRY.filter((m) => !SOLO_MEDIO || m.id === SOLO_MEDIO);

if (SOLO_MEDIO && !medios.length) {
    console.error(`No hay ningún medio con id «${SOLO_MEDIO}».`);
    process.exit(2);
}

const estado = leerEstado();

/** El libro y lo que se movio en esta pasada. Con `--solo-informe` no se mueve nada. */
let libro = leerLibro();
let movimientos = { nuevos: [], reaparecidos: [], resueltos: [] };

if (!SOLO_INFORME) {
    console.log(`Auditando ${medios.length} medio(s)…`);
    console.log(`Fecha: ${new Date().toISOString()}`);
    console.log();

    const filas = await enParalelo(medios, MEDIOS_A_LA_VEZ, async (medio) => {
        const rutas = await auditarRutas(medio);
        await dormir(PAUSA_MS);
        const feed = await auditarFeed(feedsPorMedio.get(medio.id) ?? []);
        await dormir(PAUSA_MS);
        const fuentes = await auditarFuentes(OWNERSHIP_PROFILES[medio.id], rutas);

        process.stdout.write('.');

        return {
            id: medio.id,
            nombre: medio.shortName || medio.name,
            comprobadoEl: hoy,
            feed,
            rutas,
            fuentes,
            reintentoUaLimpio: fuentes.some((f) => f.uaLimpio),
        };
    });

    console.log();
    console.log();

    for (const fila of filas) {
        const { id, ...resto } = fila;
        estado.medios[id] = resto;
    }

    estado.version = VERSION_AUDITORIA;
    estado.ultimaPasada = hoy;
    // `parcial` impide que una pasada de un solo medio se lea como una pasada
    // completa: el panel diría «comprobado hoy» sobre 75 medios que no se miraron.
    estado.parcial = Boolean(SOLO_MEDIO);

    mkdirSync(dirname(RUTA_ESTADO), { recursive: true });
    writeFileSync(RUTA_ESTADO, `${JSON.stringify(estado, null, 4)}\n`, 'utf8');

    /*
     * Y AHORA EL LIBRO. Se concilia contra lo que ya se sabia: lo que aparece
     * por primera vez nace con fecha, lo que sigue solo mueve `ultimaVez`, lo
     * que dejo de aparecer se marca resuelto sin borrarse, y lo que vuelve
     * cuenta como reincidencia conservando su fecha original.
     *
     * `parcial` viaja hasta aqui porque importa: una pasada de un solo medio no
     * puede dar por arreglado lo que no miro.
     */
    const conciliado = conciliarHallazgos(leerLibro(), hallazgosDeLaPasada(estado), hoy, {
        parcial: Boolean(SOLO_MEDIO),
    });
    libro = conciliado.libro;
    movimientos = conciliado;

    writeFileSync(RUTA_LIBRO, `${JSON.stringify(libro, null, 4)}\n`, 'utf8');
}

// ── El informe ───────────────────────────────────────────────────────────────

const resumen = resumirAuditoria(estado);
const filas = Object.entries(estado.medios ?? {})
    .map(([id, m]) => ({ id, ...m, peor: peorEstado(estadosDe(m)) }))
    .sort((a, b) => porGravedad(a.peor, b.peor) || a.nombre.localeCompare(b.nombre));

const conAlgo = filas.filter((f) => f.peor !== 'sano');

if (conAlgo.length) {
    console.log('LO QUE PIDE UNA MIRADA');
    console.log('─'.repeat(78));
    for (const f of conAlgo) {
        console.log(`  ${f.peor.toUpperCase().padEnd(15)} ${f.nombre}`);
        if (f.feed?.estado !== 'sano') console.log(`      feed · ${f.feed?.motivo ?? '—'}`);
        if (f.rutas?.respondeATodo) console.log(`      rutas · ${f.rutas.motivo}`);
        for (const s of f.fuentes ?? []) {
            if (s.estado === 'sano') continue;
            console.log(`      fuente · ${s.estado} · ${s.motivo ?? ''}`);
            console.log(`               ${s.url}`);
        }
    }
    console.log();
}

/*
 * LO QUE CAMBIÓ DESDE LA ÚLTIMA PASADA, Y VA ANTES QUE EL RESTO.
 *
 * Es la única parte del informe que no se podía escribir con la foto. Quien lee
 * esto cada semana no necesita volver a ver los catorce defectos de siempre:
 * necesita saber qué apareció, qué se arregló y qué volvió.
 */
const hubo = movimientos.nuevos.length + movimientos.reaparecidos.length + movimientos.resueltos.length;

if (hubo) {
    console.log('QUÉ CAMBIÓ');
    console.log('─'.repeat(78));
    for (const h of movimientos.nuevos) console.log(`  NUEVO       ${h.nombre} · ${h.resumen}`);
    for (const h of movimientos.reaparecidos)
        console.log(`  VUELVE      ${h.nombre} · ${h.resumen} (reincidencia ${h.reincidencias})`);
    for (const h of movimientos.resueltos) console.log(`  RESUELTO    ${h.nombre} · ${h.resumen}`);
    console.log();
} else if (!SOLO_INFORME) {
    console.log('Sin novedades respecto a la pasada anterior.');
    console.log();
}

// ── El libro: lo que llevamos sin arreglar, de lo más viejo a lo más nuevo ──

const libroResumen = resumirHallazgos(libro);
const abiertos = pendientes(libro);

if (abiertos.length) {
    console.log('PENDIENTE, POR ANTIGÜEDAD');
    console.log('─'.repeat(78));
    for (const h of abiertos) {
        const edad = h.dias === null ? '  — ' : `${String(h.dias).padStart(4)}d`;
        const cronico = h.reincidencias ? ` · ha vuelto ${h.reincidencias} vez(ces)` : '';
        console.log(`  ${edad}  ${h.nombre}${cronico}`);
        console.log(`        ${h.resumen}`);
        console.log(`        ${h.id}`);
    }
    console.log();
}

const sinNota = aceptadosSinNota(libro);
if (sinNota.length) {
    console.log(`  ${sinNota.length} hallazgo(s) están en «aceptado» SIN motivo escrito.`);
    console.log('  Aceptar sin decir por qué no es aceptar: es esconder, y dentro de tres');
    console.log('  meses nadie sabrá cuál de las dos cosas fue. Ponles `nota` en el libro.');
    console.log();
}

console.log('RESUMEN');
console.log('─'.repeat(78));
console.log(`  medios auditados          ${resumen.medios}`);
console.log(`  feeds rotos               ${resumen.feedsRotos}`);
console.log(`  feeds a revisar           ${resumen.feedsARevisar}`);
console.log(`  fuentes rotas             ${resumen.fuentesRotas}`);
console.log(`  sitios que responden 200 a todo   ${resumen.rutasTrampa}`);
console.log(`  rescatados por el UA limpio       ${resumen.rescatadosPorUa}`);
console.log(`  no comprobables desde aquí        ${resumen.noComprobables}`);
console.log();
console.log(`  PENDIENTES en el libro    ${libroResumen.abiertos}`);
console.log(`  aceptados con motivo      ${libroResumen.aceptados}`);
console.log(`  resueltos históricos      ${libroResumen.resueltos}`);
console.log(`  crónicos (han vuelto)     ${libroResumen.cronicos}`);
console.log(`  el más viejo lleva        ${libroResumen.diasDelMasViejo} día(s)`);
console.log();

if (resumen.rescatadosPorUa > 3) {
    console.log('  Ojo: si el User-Agent limpio rescata a muchos, el problema no es de ellos.');
    console.log('  Lo que hay que revisar entonces es nuestra cabecera, no sus servidores.');
    console.log();
}

if (resumen.noComprobables) {
    console.log('  «No comprobable» NO es un aprobado ni un suspenso: es que no se pudo saber');
    console.log('  DESDE AQUÍ. Vorágine y Razón Pública responden desde casa y fallan desde');
    console.log('  Actions por la IP. Antes de dar nada por perdido:');
    console.log('      npm run auditoria -- --medio=<id>   desde una máquina de casa.');
    console.log();
}

if (!SOLO_INFORME) {
    console.log(`Estado guardado en auditoria/estado.json y libro en auditoria/hallazgos.json (${hoy}).`);
    console.log('El hilo de lo que se decide sobre cada uno se lleva en MINUTA.md.');
}

/*
 * El resumen en JSON, y por qué el flujo mira ESTO y no el código de salida.
 *
 * Encontrar defectos no es una avería del auditor: es su producto. Si un feed
 * roto pintara el job de rojo, el rojo dejaría de significar «el auditor se
 * rompió» y se aprendería a ignorarlo — la misma lección del centinela y del
 * umbral de 14 días. Este archivo solo existe si el recorrido llegó al final.
 */
if (RUTA_RESUMEN) {
    writeFileSync(
        RUTA_RESUMEN,
        `${JSON.stringify(
            {
                fecha: hoy,
                parcial: Boolean(SOLO_MEDIO),
                ...resumen,
                // Lo que el flujo necesita para decidir si abre aviso: no basta
                // con que HAYA defectos —casi siempre los hay—, tiene que haber
                // algo NUEVO o algo que vuelve.
                nuevos: movimientos.nuevos.length,
                reaparecidos: movimientos.reaparecidos.length,
                resueltosHoy: movimientos.resueltos.length,
                pendientes: libroResumen.abiertos,
                diasDelMasViejo: libroResumen.diasDelMasViejo,
            },
            null,
            4,
        )}\n`,
        'utf8',
    );
}
