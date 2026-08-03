/**
 * Verificación de las FUENTES de las fichas de propiedad CONTRA LA RED.
 *
 * Ejecutar con: npm run check:sources
 *               npm run check:sources -- --strict   (sale 1 si alguna no resuelve)
 *
 * Por qué existe
 * --------------
 * Las fichas de `shared/mediaOwnership.js` afirman quién controla cada medio, y
 * el único motivo por el que un lector debería creerlas es que puede pulsar la
 * fuente y comprobarlo. Un enlace roto no es un defecto cosmético: convierte una
 * afirmación verificable en una afirmación a secas.
 *
 * El 2026-08-02 se encontraron cuatro fuentes inventadas —dos páginas «quiénes
 * somos» que no existen y dos fichas de un Media Ownership Monitor cuyo estudio
 * es de 2017, anterior a la fundación del medio que decían documentar— en las
 * dos fichas añadidas más recientemente. Las otras cuarenta resistieron enteras.
 * Nada las detectó porque los 271 tests comprueban la FORMA de las fichas y
 * ninguno comprobaba que las URL llevaran a alguna parte.
 *
 * Esto lo comprueba. No puede ir en un test unitario: toca la red, tarda un
 * minuto y falla por causas ajenas al código.
 *
 * LO QUE ESTO NO HACE. Comprueba que la URL responde, no que diga lo que la
 * ficha afirma. Un enlace vivo que no sostiene el texto sigue siendo un problema
 * y solo lo ve una persona leyendo. Esto descarta la falsificación descarada,
 * que es la barata de descartar.
 */

import { OWNERSHIP_PROFILES } from '../shared/mediaOwnership.js';
import { MEDIA_REGISTRY } from '../shared/mediaRegistry.js';

const STRICT = process.argv.includes('--strict');

const TIMEOUT_MS = 20_000;
const CONCURRENCY = 4;

/**
 * Un navegador de verdad.
 *
 * Aquí NO se usa el bot identificable de la ingesta, y es a propósito: no
 * estamos consumiendo un feed que alguien publica para ser consumido, estamos
 * comprobando una vez que una página existe. Varios sitios (revistaraya.com
 * entre ellos) devuelven 429 a cualquier cosa que no parezca un navegador, y un
 * 429 aquí se leería como «fuente rota» cuando no lo está.
 */
const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

/** Nombre legible del medio, para que el informe no sea una lista de ids. */
const nombrePorId = new Map(MEDIA_REGISTRY.map((m) => [m.id, m.shortName || m.name]));

async function mapWithConcurrency(items, limit, worker) {
    const results = new Array(items.length);
    let cursor = 0;

    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (cursor < items.length) {
            const index = cursor;
            cursor += 1;
            results[index] = await worker(items[index]);
        }
    });

    await Promise.all(runners);
    return results;
}

/**
 * 403 y 405 cuentan como viva.
 *
 * Son sitios que rechazan la petición automatizada, no páginas inexistentes: la
 * URL resuelve y una persona con navegador la ve. Tratarlas como rotas llenaría
 * el informe de falsos positivos y lo volvería inútil, que es como muere un
 * verificador. Lo que se persigue aquí es el 404.
 */
const VIVA = new Set([200, 201, 202, 203, 204, 301, 302, 303, 307, 308, 403, 405]);

/**
 * Una petición con su PROPIO plazo.
 *
 * El controlador va aquí dentro y no fuera a propósito. Compartir uno solo
 * entre el HEAD y el GET hacía que, al expirar el HEAD, el reintento naciera ya
 * cancelado: dos fuentes que responden 200 en menos de dos segundos salían como
 * muertas. Un verificador que acusa en falso se deja de mirar, y entonces deja
 * de proteger.
 */
async function pedir(url, method) {
    const control = new AbortController();
    const alarma = setTimeout(() => control.abort(), TIMEOUT_MS);

    try {
        return await fetch(url, {
            method,
            redirect: 'follow',
            signal: control.signal,
            headers: { 'User-Agent': USER_AGENT },
        });
    } finally {
        clearTimeout(alarma);
    }
}

async function comprobar({ mediaId, url }) {
    const inicio = Date.now();

    // HEAD primero por cortesía: evita descargar la página entera. Bastantes
    // servidores no lo implementan —responden 404, 405 o nada a un HEAD de una
    // página que con GET existe—, así que su fallo NO es concluyente y siempre
    // hay segunda oportunidad con GET.
    try {
        const res = await pedir(url, 'HEAD');
        if (VIVA.has(res.status)) {
            return { mediaId, url, status: res.status, ok: true, ms: Date.now() - inicio };
        }
    } catch {
        // Silencio deliberado: lo dice el GET.
    }

    try {
        const res = await pedir(url, 'GET');
        return { mediaId, url, status: res.status, ok: VIVA.has(res.status), ms: Date.now() - inicio };
    } catch (error) {
        return {
            mediaId,
            url,
            status: 0,
            ok: false,
            ms: Date.now() - inicio,
            error: error?.name === 'AbortError' ? `sin respuesta en ${TIMEOUT_MS} ms` : error?.message,
        };
    }
}

// ── Recolección ──────────────────────────────────────────────────────────────

const pendientes = [];
const sinFuente = [];

for (const [mediaId, ficha] of Object.entries(OWNERSHIP_PROFILES)) {
    const fuentes = ficha?.sources ?? [];

    // Una ficha firmada sin fuentes es el mismo problema con otra cara: afirma
    // haber comprobado algo y no deja con qué comprobarlo.
    if (ficha?.verifiedAt && fuentes.length === 0) sinFuente.push(mediaId);

    for (const url of fuentes) pendientes.push({ mediaId, url });
}

const unicas = new Map();
for (const p of pendientes) if (!unicas.has(p.url)) unicas.set(p.url, p);

console.log(`Comprobando ${unicas.size} fuentes únicas de ${Object.keys(OWNERSHIP_PROFILES).length} fichas…`);
console.log(`Fecha: ${new Date().toISOString()}`);
console.log();

const resultados = await mapWithConcurrency([...unicas.values()], CONCURRENCY, comprobar);
const rotas = resultados.filter((r) => !r.ok);

// ── Informe ──────────────────────────────────────────────────────────────────

if (rotas.length) {
    console.log('FUENTES QUE NO RESUELVEN');
    console.log('─'.repeat(78));

    for (const r of rotas) {
        const nombre = nombrePorId.get(r.mediaId) ?? r.mediaId;
        console.log(`  ✗ ${nombre}`);
        console.log(`    ${r.status || '—'}  ${r.url}`);
        if (r.error) console.log(`    ${r.error}`);
    }
    console.log();
}

if (sinFuente.length) {
    console.log('FICHAS FIRMADAS SIN NINGUNA FUENTE');
    console.log('─'.repeat(78));
    for (const id of sinFuente) console.log(`  ✗ ${nombrePorId.get(id) ?? id}`);
    console.log();
}

const vivas = resultados.length - rotas.length;
console.log(`${vivas}/${resultados.length} fuentes vivas`);

if ((rotas.length || sinFuente.length) && STRICT) process.exit(1);
