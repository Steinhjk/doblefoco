/**
 * COMPRUEBA UN CANAL DE YOUTUBE CONTRA LA RED.
 *
 *   node scripts/comprobarCanales.mjs <url-o-@handle> [más...]
 *   npm run check:canales                    (todos los del registro)
 *
 * QUÉ RESUELVE
 * ------------
 * Antes de meter a nadie en el catálogo de formadores de opinión hay que poder
 * responder tres cosas con datos públicos, no de oído:
 *
 *   · ¿existe y cuál es su identificador estable?
 *   · ¿sigue publicando, o es un archivo? (el caso Contravía: último vídeo en
 *     enero de 2007, y por eso NO entró)
 *   · ¿qué audiencia tiene?
 *
 * POR QUÉ IMPORTA EL IDENTIFICADOR ESTABLE
 * ----------------------------------------
 * Un canal puede cambiar de nombre y de @handle cuando quiera; el `channelId`
 * —`UC...`— no cambia nunca. Guardar el handle sería guardar algo que el propio
 * sujeto puede modificar para salirse del catálogo o para heredar la ficha de
 * otro. Se guarda el channelId y el handle solo como ayuda de lectura.
 *
 * DE DÓNDE SALEN LOS DATOS
 * ------------------------
 * Del feed RSS público de YouTube y de la página del canal. NO se usa la API de
 * datos: exige una clave, que es un secreto más que gestionar y un punto de
 * fallo, y no aporta nada que no esté ya publicado.
 *
 * LÍMITE CONOCIDO: el número de suscriptores que YouTube muestra viene
 * redondeado («1,2 M»), así que sirve para un umbral y no para una serie fina.
 * Se guarda tal cual lo publica YouTube, sin convertirlo a un número exacto que
 * nadie ha dicho.
 */

const NAVEGADOR =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120 Safari/537.36';

/** Extrae el primer grupo de la primera expresión que encaje. */
function primero(texto, expresiones) {
    for (const re of expresiones) {
        const m = texto.match(re);
        if (m?.[1]) return m[1];
    }
    return null;
}

async function paginaDelCanal(entrada) {
    const url = entrada.startsWith('http')
        ? entrada
        : `https://www.youtube.com/${entrada.startsWith('@') ? entrada : `@${entrada}`}`;
    const res = await fetch(url, { headers: { 'User-Agent': NAVEGADOR }, redirect: 'follow' });
    if (!res.ok) return { url, html: null, estado: res.status };
    return { url, html: await res.text(), estado: res.status };
}

export async function comprobarCanal(entrada) {
    const { url, html, estado } = await paginaDelCanal(entrada);
    if (!html) return { entrada, ok: false, motivo: `HTTP ${estado}` };

    const channelId = primero(html, [
        /"externalId":"(UC[A-Za-z0-9_-]{22})"/,
        /channel_id=(UC[A-Za-z0-9_-]{22})/,
        /"channelId":"(UC[A-Za-z0-9_-]{22})"/,
    ]);
    if (!channelId) return { entrada, ok: false, motivo: 'no se pudo resolver el channelId' };

    /*
     * SUSCRIPTORES — tal cual lo publica YouTube, redondeado.
     *
     * OJO CON EL «DE», que costó un dato falso. La expresión anterior pedía el
     * número PEGADO a «suscriptores», así que se saltaba «1.44 M **de**
     * suscriptores» —que es el del canal— y cazaba la siguiente coincidencia:
     * «9.59 K suscriptores», de un canal RECOMENDADO en la misma página. La
     * Pulla salía con 9,59 mil en vez de 1,44 millones, un factor de 150.
     *
     * Se toma además la PRIMERA aparición a propósito: la del propio canal va en
     * la cabecera, antes que cualquier recomendación.
     */
    const suscriptores = primero(html, [
        /"subscriberCountText":\{"simpleText":"([^"]+)"/,
        /([\d.,]+\s*[KMkm]?)\s*(?:de\s+)?(?:suscriptores|subscribers)/i,
    ]);
    const nombre = primero(html, [/"channelMetadataRenderer":\{"title":"([^"]+)"/, /<title>([^<]+)<\/title>/]);

    const rss = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
        headers: { 'User-Agent': NAVEGADOR },
    });
    const xml = rss.ok ? await rss.text() : '';

    /*
     * SOLO LAS FECHAS DE DENTRO DE <entry>, Y ESTO COSTÓ UN ERROR PUBLICADO.
     *
     * Un feed de YouTube trae `<published>` DOS veces: una a nivel del feed
     * —que es la fecha de CREACIÓN DEL CANAL— y otra dentro de cada vídeo.
     * Leyendo la primera coincidencia, el canal de Contravía daba «última
     * publicación: enero de 2007» y con ese dato se dictaminó el 2026-08-08 que
     * llevaba diecinueve años muerto.
     *
     * Era falso: sus títulos hablaban de la candidata vicepresidencial de Iván
     * Cepeda. La contradicción entre la fecha y los títulos fue lo que delató el
     * fallo — por eso este script imprime los dos, y no solo la fecha.
     */
    const entradasXml = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => m[1]);
    const fechas = entradasXml
        .map((e) => e.match(/<published>([^<]+)<\/published>/)?.[1])
        .filter(Boolean);
    const titulos = entradasXml
        .map((e) => e.match(/<media:title>([^<]+)<\/media:title>/)?.[1])
        .filter(Boolean);

    // Se toma el MÁXIMO, no el primero: no se da por hecho que el feed venga
    // ordenado. Es la misma lección de los feeds por relevancia de Google News.
    const masReciente = fechas.length
        ? new Date(Math.max(...fechas.map((f) => new Date(f).getTime())))
        : null;
    const diasSinPublicar = masReciente
        ? Math.round((Date.now() - masReciente.getTime()) / 86400000)
        : null;

    // Cadencia sobre lo que el feed devuelve (YouTube da los 15 últimos).
    let cadenciaDias = null;
    if (fechas.length >= 2) {
        const t = fechas.map((f) => new Date(f).getTime());
        cadenciaDias = Math.round((Math.max(...t) - Math.min(...t)) / 86400000 / (t.length - 1));
    }

    return {
        entrada,
        ok: true,
        url,
        channelId,
        nombre: nombre?.replace(/ - YouTube$/, '') ?? null,
        suscriptores,
        videosEnElFeed: fechas.length,
        ultimaPublicacion: masReciente ? masReciente.toISOString().slice(0, 10) : null,
        diasSinPublicar,
        cadenciaDias,
        ultimosTitulos: titulos.slice(0, 3),
    };
}

// ── ejecución directa ───────────────────────────────────────────────────────

const entradas = process.argv.slice(2);
if (entradas.length === 0) {
    console.error('\n  uso: node scripts/comprobarCanales.mjs <url-o-@handle> [más...]\n');
    process.exitCode = 1;
} else {
    for (const e of entradas) {
        const r = await comprobarCanal(e);
        console.log();
        if (!r.ok) {
            console.log(`  ✗ ${e}: ${r.motivo}`);
            continue;
        }
        /*
         * NUNCA SE AÑADE UN CANAL DESDE UN HANDLE ADIVINADO.
         *
         * Probado el 2026-08-09 con seis nombres, tres fallaron y uno de forma
         * peligrosa: `@danielcoronell` resuelve a un canal llamado «Víctimas de
         * Daniel Coronell», con 5 suscriptores y sin vídeos desde 2014. NO es
         * suyo: es un canal EN SU CONTRA. Añadirlo a ciegas habría atribuido a
         * un periodista el canal de sus detractores.
         *
         * De ahí estos avisos: el nombre resuelto se imprime siempre y grande, y
         * un canal sin vídeos o sin suscriptores legibles se marca. La regla es
         * partir de la URL que da el propio canal, no de un handle plausible.
         */
        const sospechas = [];
        if (r.videosEnElFeed === 0) sospechas.push('sin vídeos en el feed');
        if (!r.suscriptores) sospechas.push('suscriptores no legibles');
        if (r.diasSinPublicar !== null && r.diasSinPublicar > 365) sospechas.push('más de un año parado');

        console.log(`  ${r.nombre ?? '(sin nombre)'}`);
        if (sospechas.length) {
            console.log(`    ⚠  COMPROBAR A MANO: ${sospechas.join(' · ')}`);
            console.log('       ¿es de verdad el canal que se busca, o un homónimo?');
        }
        console.log(`    channelId ......... ${r.channelId}`);
        console.log(`    suscriptores ...... ${r.suscriptores ?? 'no publicado'}`);
        console.log(`    última publicación  ${r.ultimaPublicacion ?? '—'}  (hace ${r.diasSinPublicar ?? '?'} días)`);
        console.log(`    cadencia media .... ${r.cadenciaDias ?? '?'} días entre vídeos`);
        for (const t of r.ultimosTitulos) console.log(`    · ${t.slice(0, 80)}`);
    }
}
