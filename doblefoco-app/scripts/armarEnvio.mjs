/**
 * ARMA EL ARCHIVO QUE SE LE PEGA A UN MODELO EXTERNO.
 *
 * Ejecutar con: npm run envio -- diario-la-libertad
 *               npm run envio -- --tramo        (los 20 de mayor audiencia)
 *               npm run envio -- --todos        (todos los que tengan ficha)
 *
 * Qué produce
 * -----------
 * `revision-externa/envios/<fecha>-<medio>.md`, que es `PROMPT.md` + `CONTEXTO.md`
 * + la ficha del medio, en ese orden y sin editar. Se copia entero y se pega.
 *
 * POR QUÉ UN SCRIPT Y NO UNIRLOS A MANO
 * -------------------------------------
 * Porque a mano se hace una vez y a la tercera se pega la ficha de otro. Pero
 * sobre todo por lo de abajo: hay una comprobación que este archivo no puede
 * saltarse y una persona con prisa sí.
 *
 * NO SE ARMA UN ENVÍO SIN COMPROBAR SUS FUENTES ESE MISMO DÍA
 * ----------------------------------------------------------
 * La regla nació de dos golpes: la ficha de EL DIARIO de Boyacá caducó en tres
 * días, y la de Diario La Libertad cambió entera en otros tres. Mandar a un
 * revisor externo una ficha cuyas fuentes ya no resuelven es hacerle perder el
 * tiempo con un expediente muerto, y encima el error vuelve como objeción.
 *
 * Así que cada envío pide todas las URL de su ficha de propiedad ANTES de
 * escribirse, y **el resultado va estampado en la cabecera del propio archivo**,
 * con fecha. Si alguna no resuelve, el envío se arma igual pero lo dice arriba y
 * en voz alta: un hueco declarado se puede leer, uno escondido no.
 *
 * LO QUE ESTO NO COMPRUEBA, Y VA DICHO EN LA CABECERA
 * --------------------------------------------------
 * Que las fuentes sigan sosteniendo lo que la ficha afirma. Eso solo lo ve una
 * persona leyéndolas — es la diferencia entre esto y la comprobación de campo
 * que se le hizo a La Libertad el día de su envío, donde apareció un conflicto
 * de interés que la ficha no tenía. Este script descarta el enlace muerto, que
 * es la parte barata.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { MEDIA_REGISTRY } from '../shared/mediaRegistry.js';
import { OWNERSHIP_PROFILES } from '../shared/mediaOwnership.js';
import { tramoPrioritario } from '../shared/audiencia.js';
import { VIGILANCIA } from '../shared/centinela.js';

const TIMEOUT_MS = 20_000;
const PAUSA_MS = 300;

/** Mismo criterio que `verifySources.mjs`: aquí se persigue el 404, no el 403. */
const VIVA = new Set([200, 201, 202, 203, 204, 301, 302, 303, 307, 308, 403, 405]);

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const raiz = new URL('../', import.meta.url);
const ruta = (p) => fileURLToPath(new URL(p, raiz));

const hoy = new Date().toISOString().slice(0, 10);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Qué medios ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const nombrePorId = new Map(MEDIA_REGISTRY.map((m) => [m.id, m.shortName || m.name]));
const tieneFicha = (id) => existsSync(ruta(`fichas/${id}.md`));

function mediosPedidos() {
    if (args.includes('--tramo')) return tramoPrioritario(MEDIA_REGISTRY).map((m) => m.id);
    if (args.includes('--todos')) return MEDIA_REGISTRY.map((m) => m.id).filter(tieneFicha);
    return args.filter((a) => !a.startsWith('--'));
}

const pedidos = mediosPedidos();

if (pedidos.length === 0) {
    console.error('\n  Uso: npm run envio -- <id-del-medio> | --tramo | --todos\n');
    process.exit(1);
}

// ── Comprobación de fuentes ──────────────────────────────────────────────────

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

/** HEAD por cortesía; su fallo no es concluyente, así que siempre hay GET. */
async function comprobar(url) {
    try {
        const res = await pedir(url, 'HEAD');
        if (VIVA.has(res.status)) return { url, ok: true, status: res.status };
    } catch {
        /* lo dice el GET */
    }
    try {
        const res = await pedir(url, 'GET');
        return { url, ok: VIVA.has(res.status), status: res.status };
    } catch (error) {
        return { url, ok: false, status: 0, error: error?.name === 'AbortError' ? 'sin respuesta' : error?.message };
    }
}

// ── Armado ───────────────────────────────────────────────────────────────────

const prompt = readFileSync(ruta('revision-externa/PROMPT.md'), 'utf8').trimEnd();
const contexto = readFileSync(ruta('revision-externa/CONTEXTO.md'), 'utf8').trimEnd();

mkdirSync(ruta('revision-externa/envios'), { recursive: true });

let armados = 0;
const saltados = [];

for (const id of pedidos) {
    const nombre = nombrePorId.get(id) ?? id;

    if (!tieneFicha(id)) {
        saltados.push(`${nombre} — no tiene ficha en fichas/${id}.md`);
        continue;
    }

    const fuentes = OWNERSHIP_PROFILES[id]?.sources ?? [];
    const resultados = [];
    for (const url of fuentes) {
        resultados.push(await comprobar(url));
        await dormir(PAUSA_MS);
    }

    const rotas = resultados.filter((r) => !r.ok);
    const vigilado = Boolean(VIGILANCIA[id]);

    const cabecera = [
        `# ENVÍO A REVISIÓN EXTERNA — ${nombre}`,
        '',
        `> **Armado el ${hoy}.** Este archivo es \`PROMPT.md\` + \`CONTEXTO.md\` + la ficha`,
        '> del medio, en ese orden y sin editar. **Se copia entero y se pega al modelo, de',
        '> una sola vez.** La respuesta se guarda literal en',
        `> \`respuestas/<modelo>-${id}.md\`, con \`respuestas/PLANTILLA.md\`.`,
        '>',
        '> ### Qué se comprobó hoy, y qué no',
        '>',
        fuentes.length === 0
            ? '> · **Su ficha de propiedad no cita ninguna fuente.** No hay nada que comprobar, y eso es en sí mismo una objeción que el revisor debería hacer.'
            : rotas.length === 0
              ? `> · **Las ${fuentes.length} fuentes de su ficha de propiedad responden hoy.** Se pidieron una por una al armar este archivo.`
              : [
                    `> · **${rotas.length} de ${fuentes.length} fuentes NO RESUELVEN hoy.** Se declara en vez de esconderlo:`,
                    ...rotas.map((r) => `>   - \`${r.status || r.error}\` ${r.url}`),
                ].join('\n'),
        vigilado
            ? '> · El medio está en la vigilancia semanal del centinela, así que un cambio en lo que su ficha afirma tendría aviso propio.'
            : '> · **El medio NO está en la vigilancia semanal**: su sitio no se puede preguntar, o su ficha no se apoya en ningún nombre publicado.',
        '>',
        '> · **Lo que NO se ha hecho es la comprobación de campo.** Que las fuentes sigan',
        '>   sosteniendo lo que la ficha afirma solo lo ve una persona leyéndolas. En el',
        '>   único caso en que se hizo —Diario La Libertad, el 2026-08-17— apareció un',
        '>   conflicto de interés que la ficha no tenía. Tenlo en cuenta al objetar.',
        '',
        '---',
        '',
    ].join('\n');

    const cuerpo = [
        cabecera,
        '<!-- ==================== PROMPT ==================== -->\n\n',
        `${prompt}\n\n---\n\n`,
        '<!-- ==================== CONTEXTO ==================== -->\n\n',
        `${contexto}\n\n---\n\n`,
        '<!-- ==================== FICHA DEL MEDIO ==================== -->\n\n',
        `${readFileSync(ruta(`fichas/${id}.md`), 'utf8').trimEnd()}\n`,
    ].join('');

    writeFileSync(ruta(`revision-externa/envios/${hoy}-${id}.md`), cuerpo, 'utf8');
    armados += 1;

    const marca = rotas.length ? `⚠ ${rotas.length} fuente(s) rota(s)` : `${fuentes.length} fuente(s) viva(s)`;
    console.log(`  ✓ ${nombre.padEnd(22)} envios/${hoy}-${id}.md   ${marca}`);
}

console.log();
console.log(`${armados} envío(s) armado(s) en revision-externa/envios/, con fecha ${hoy}.`);

if (saltados.length) {
    console.log();
    console.log('SALTADOS:');
    for (const s of saltados) console.log(`  · ${s}`);
}
