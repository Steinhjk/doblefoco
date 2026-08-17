/**
 * ARMA EL ARCHIVO QUE SE LE PEGA A UN MODELO EXTERNO.
 *
 * Ejecutar con: npm run envio -- diario-la-libertad
 *               npm run envio -- --tramo        (los 20 de mayor audiencia)
 *               npm run envio -- --todos        (todos los que tengan ficha)
 *               npm run envio -- --todos --ciclo=1
 *
 * Qué produce
 * -----------
 * Una carpeta `revision-externa/envios/ciclo-<n>-<fecha>/` con un archivo por
 * medio: `PROMPT.md` + `CONTEXTO.md` + la conducta medida + la ficha, en ese
 * orden y sin editar. Se copia entero y se pega.
 *
 * **LOS ARCHIVOS VAN NUMERADOS POR ALCANCE.** `01-` a `20-` son el tramo
 * prioritario de `shared/audiencia.js`, ordenado por lectores y no por volumen
 * de publicación: el volumen no mide a cuánta gente llega un error. Los demás van
 * detrás, sin número. Así el orden de revisión está en el propio nombre del
 * archivo y no depende de que nadie se acuerde de él.
 *
 * LA CONDUCTA MEDIDA VIAJA DENTRO
 * -------------------------------
 * Si existe `data/conducta.json` —lo escribe `npm run conducta -- --json=…`—, las
 * cifras de nivel 2 de cada medio se copian al envío con su fecha, su ventana y
 * su advertencia. El revisor externo no tiene acceso al repositorio ni a la base:
 * toda la evidencia tiene que ir en el texto que se le pega, o no puede
 * comprobarla ni objetarla.
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

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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

/** Los 20 de mayor alcance, en orden de lectores. Define la numeración. */
const tramo = tramoPrioritario(MEDIA_REGISTRY).map((m) => m.id);
const puestoEnTramo = new Map(tramo.map((id, i) => [id, i + 1]));

function mediosPedidos() {
    if (args.includes('--tramo')) return tramo;
    if (args.includes('--todos')) {
        // Primero los del tramo, en su orden; después el resto, en orden de
        // catálogo. El orden del listado es el orden de revisión.
        const resto = MEDIA_REGISTRY.map((m) => m.id).filter((id) => tieneFicha(id) && !puestoEnTramo.has(id));
        return [...tramo, ...resto];
    }
    return args.filter((a) => !a.startsWith('--'));
}

const pedidos = mediosPedidos();
const ciclo = args.find((a) => a.startsWith('--ciclo='))?.slice('--ciclo='.length);

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

/** La conducta medida, si alguien la calculó. Sin ella el envío lo dice. */
let conducta = null;
try {
    conducta = JSON.parse(readFileSync(ruta('data/conducta.json'), 'utf8'));
} catch {
    console.log('  ⚠ No hay data/conducta.json — los envíos irán sin las cifras de nivel 2.');
    console.log('    Se generan con: npm run conducta -- --todos --json=data/conducta.json\n');
}

/**
 * El bloque de nivel 2 que se le pega al revisor, con su advertencia.
 *
 * La advertencia no es un descargo: es lo que impide que el revisor use la
 * compañía media para mover un número, que sería un error y aquí está escrito
 * para que pueda objetarlo si lo intentamos nosotros.
 */
function bloqueDeConducta(id) {
    const m = conducta?.medios?.[id];
    if (!m) return '';

    const sinCorpus = !m.historias;

    return [
        '<!-- ==================== CONDUCTA MEDIDA (nivel 2) ==================== -->',
        '',
        `## Conducta medida de ${m.nombre}`,
        '',
        `Medición del **${conducta.medidoEl}**, ventana **${conducta.ventana.desde} → ${conducta.ventana.hasta}**`,
        `(retención de 72 h). Corpus completo: ${conducta.corpus.articulos} artículos, ${conducta.corpus.historias} historias.`,
        '',
        sinCorpus
            ? `**NO TIENE CORPUS EN ESTA VENTANA: ${m.articulos} artículos, ${m.historias} historias.** No hay nivel 2 que aportar, y eso es en sí mismo una objeción disponible contra cualquier afirmación de conducta que haga la ficha.`
            : [
                  '| Artículos | Historias | Agenda propia | Compartidas | Compañía media | Coincide sobre todo con |',
                  '|---|---|---|---|---|---|',
                  `| ${m.articulos} | ${m.historias} | ${m.agendaPropia} | ${m.compartidas} | ${m.companiaMedia ?? '—'} | ${m.coincideCon ?? '—'} |`,
              ].join('\n'),
        '',
        '**Qué significan.** *Agenda propia*: historias en las que es el único medio del',
        'catálogo. *Compañía media*: sesgo medio de los otros medios con los que comparte',
        'historia. Ninguna mide el contenido de lo que publica: miden **con quién coincide**,',
        'que es observable.',
        '',
        '> **ADVERTENCIA QUE VA CON LAS CIFRAS, Y ES PARTE DE LA EVIDENCIA.**',
        '>',
        '> **Son tres días y el protocolo pide noventa.** La retención es de 72 horas',
        '> rodantes, así que esto es una foto y las proporciones bailan con corpus pequeño.',
        '>',
        '> **La compañía media está saturada.** La izquierda es el 22,6 % de los medios del',
        '> catálogo y el 3,3 % del volumen publicado, así que coincidir con el catálogo se',
        '> parece a coincidir con la derecha para cualquiera. **Usar la compañía media para',
        '> mover un valor de sesgo es un error**, y si esta ficha lo hace, es una objeción',
        '> válida contra ella.',
        '>',
        '> **Qué cambió respecto a la medición anterior.** Las cifras que llevan escritas',
        '> algunas fichas son del 2026-08-12, cuando el 37 % del corpus era el terremoto del',
        '> 10 de agosto — y en un desastre todos los medios cubren lo mismo, así que la',
        '> co-cobertura medía la catástrofe y no la línea editorial. Los días del hecho ya',
        '> han salido de la ventana de 72 horas. **Si una cifra de la ficha no coincide con',
        '> la de aquí arriba, la buena es la de aquí arriba**, y la discrepancia entre las',
        '> dos es en sí misma un dato sobre lo poco que aguantan estas medidas.',
        '',
        '---',
        '',
    ].join('\n');
}

/**
 * Qué revisiones externas tiene ya este medio.
 *
 * Importa para la cabecera del envío: hasta el ciclo 1, a un revisor se le
 * advertía que atacaba «un expediente que no ha leído entero nadie». Después del
 * ciclo 1 eso es falso para veinte medios, y seguir diciéndolo lo desorienta —
 * peor: le esconde que hay objeciones ya formuladas que puede dar por hechas o
 * contradecir. Se lee de `respuestas/`, que es lo que se versiona.
 */
function revisionesPrevias(id) {
    try {
        return readdirSync(ruta('revision-externa/respuestas'))
            .filter((f) => f.endsWith(`-${id}.md`))
            .map((f) => f.replace(`-${id}.md`, ''));
    } catch {
        return [];
    }
}

/** «Valor actual» / «Propuesta» / «Valor propuesto» de la cabecera de la ficha. */
function resumenDeFicha(texto) {
    const fila = (etiqueta) =>
        texto.match(new RegExp(`\\|\\s*\\*\\*${etiqueta}\\*\\*\\s*\\|\\s*(.+?)\\s*\\|`))?.[1] ?? null;
    return {
        valor: fila('Valor actual') ?? fila('Valor propuesto'),
        propuesta: fila('Propuesta'),
    };
}

const carpeta = ciclo ? `revision-externa/envios/ciclo-${ciclo}-${hoy}` : 'revision-externa/envios';
mkdirSync(ruta(carpeta), { recursive: true });

let armados = 0;
const saltados = [];
const indice = [];

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
    const previas = revisionesPrevias(id);

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
        previas.length
            ? [
                  `> · **Esta ficha ya pasó por revisión externa** (${previas.join(', ')}). La respuesta`,
                  `>   literal está en \`respuestas/${previas[0]}-${id}.md\`. **No la repitas: contradícela`,
                  '>   o constrúyele encima.** Y ojo, que una objeción registrada no es una objeción',
                  '>   resuelta: mientras la tabla de resolución esté en blanco, sigue siendo la',
                  '>   afirmación de otro modelo, no un hecho del expediente.',
              ].join('\n')
            : [
                  '> · **Lo que NO se ha hecho es la comprobación de campo.** Que las fuentes sigan',
                  '>   sosteniendo lo que la ficha afirma solo lo ve una persona leyéndolas. En el',
                  '>   único caso en que se hizo —Diario La Libertad, el 2026-08-17— apareció un',
                  '>   conflicto de interés que la ficha no tenía. Tenlo en cuenta al objetar.',
              ].join('\n'),
        '',
        '---',
        '',
    ].join('\n');

    const ficha = readFileSync(ruta(`fichas/${id}.md`), 'utf8').trimEnd();

    const cuerpo = [
        cabecera,
        '<!-- ==================== PROMPT ==================== -->\n\n',
        `${prompt}\n\n---\n\n`,
        '<!-- ==================== CONTEXTO ==================== -->\n\n',
        `${contexto}\n\n---\n\n`,
        bloqueDeConducta(id),
        '<!-- ==================== FICHA DEL MEDIO ==================== -->\n\n',
        `${ficha}\n`,
    ].join('');

    const puesto = puestoEnTramo.get(id);
    const archivo = puesto ? `${String(puesto).padStart(2, '0')}-${id}.md` : `${id}.md`;

    writeFileSync(ruta(`${carpeta}/${archivo}`), cuerpo, 'utf8');
    armados += 1;

    const { valor, propuesta } = resumenDeFicha(ficha);
    indice.push({ archivo, nombre, puesto, valor, propuesta, rotas: rotas.length, fuentes: fuentes.length });

    const marca = rotas.length ? `⚠ ${rotas.length} fuente(s) rota(s)` : `${fuentes.length} fuente(s) viva(s)`;
    console.log(`  ✓ ${nombre.padEnd(22)} ${archivo.padEnd(32)} ${marca}`);
}

// ── Índice del ciclo ─────────────────────────────────────────────────────────

if (ciclo && armados) {
    const conProblema = indice.filter((i) => i.rotas);
    const lineas = [
        `# Ciclo ${ciclo} de revisión externa de sesgo — armado el ${hoy}`,
        '',
        `**${armados} medios.** Cada archivo de esta carpeta se copia entero y se pega a un`,
        'modelo. No hace falta darle nada más: lleva dentro el encargo, el contexto del',
        'proyecto, la conducta medida y la ficha.',
        '',
        '## El orden importa, y está en el nombre del archivo',
        '',
        '`01-` a `20-` son los veinte medios de **mayor alcance real de audiencia**, en ese',
        'orden. No es el orden de volumen de publicación: el volumen no mide a cuánta gente',
        'llega un error. Los demás van detrás sin número.',
        '',
        '## Qué se hace con lo que devuelvan',
        '',
        'La respuesta se guarda **literal**, sin resumir ni recortar, en',
        '`revision-externa/respuestas/<modelo>-<medio>.md`. Si se recorta se pierde justo lo',
        'que pueda incomodar. Una objeción con fuente comprobable se verifica y cambia el',
        'número o se declara la tensión; una sin fuente se anota como no admisible; un',
        'acuerdo se anota como «no hubo objeción» y **no cuenta como aval**.',
        '',
        '## Cinco preguntas que atraviesan varias fichas',
        '',
        'Salieron al escribir el ciclo 1 y ninguna se resuelve ficha por ficha. El estado',
        'de cada una está en `../ciclo-1-conclusiones.md`; en corto:',
        '',
        '1. **Los tres de Valorem** —Noticias Caracol +0,10, Blu Radio +0,25, El Espectador',
        '   −0,20—. **Con respuesta candidata**: la diferencia vive en la dirección, no en el',
        '   dueño. Falta escribirla en las tres fichas.',
        '2. **«Fiscalizar al poder» se resuelve de tres formas distintas** en Chocó 7 Días,',
        '   Noticias Uno y La Silla Vacía. **Sigue abierta, y es la que más bloquea**: con la',
        '   evidencia del ciclo 1 ya no es teórica.',
        '3. **Los siete diarios regionales están todos a la derecha.** **Respondida a favor',
        '   del criterio**: los siete tienen hoy piezas propias fechadas, con gradación',
        '   visible. Falta redactarlo como criterio.',
        '4. **Los medios internacionales están clasificados en el eje de su país**, no en el',
        '   colombiano. Sigue abierta, con un requisito nuevo: si se mide «cómo cubre a',
        '   Colombia», hay que fijar un umbral mínimo de piezas.',
        '5. **La prensa económica no tiene ancla.** **Con ancla propuesta**: asimetría de',
        '   fuentes, asimetría de verbos en titulares macro y cobertura del propio',
        '   accionista.',
        '',
        '## Índice',
        '',
        '| # | Medio | Valor actual | Lo que propone la ficha | Fuentes |',
        '|---|---|---|---|---|',
        ...indice.map(
            (i) =>
                `| ${i.puesto ? String(i.puesto).padStart(2, '0') : '—'} | [${i.nombre}](${i.archivo}) | ${
                    i.valor ?? '—'
                } | ${i.propuesta ?? '—'} | ${i.rotas ? `⚠ ${i.rotas} de ${i.fuentes} rota(s)` : `${i.fuentes} viva(s)`} |`,
        ),
    ];

    if (conProblema.length) {
        lineas.push(
            '',
            '## Fichas con alguna fuente que no resuelve hoy',
            '',
            'Se mandan igual, con el aviso dentro. Un hueco declarado se puede leer; uno',
            'escondido vuelve como objeción:',
            '',
            ...conProblema.map((i) => `- **${i.nombre}** — ${i.rotas} de ${i.fuentes}`),
        );
    }

    lineas.push(
        '',
        '## Lo que este material NO garantiza',
        '',
        'Que las fuentes sigan **sosteniendo** lo que la ficha afirma. Al armar cada envío se',
        'comprueba que las URL respondan, que es la parte barata. Leerlas es otra cosa: en',
        'Diario La Libertad apareció así **un conflicto de interés que la ficha no tenía**, y',
        'el ciclo 1 de revisión externa encontró quince errores de hecho en veinte fichas —',
        'cuatro titulares fallecidos citados como vivos, un medio vendido hace catorce meses',
        'y otro fusionado hace siete. **Ninguno de esos quince está corregido todavía en las',
        'fichas que van aquí dentro**, y los envíos de medios ya revisados lo dicen arriba,',
        'en su cabecera.',
        '',
    );

    writeFileSync(ruta(`${carpeta}/00-LEEME.md`), `${lineas.join('\n')}\n`, 'utf8');
    console.log(`\n  ✓ Índice del ciclo en ${carpeta}/00-LEEME.md`);
}

console.log();
console.log(`${armados} envío(s) armado(s) en ${carpeta}/, con fecha ${hoy}.`);

if (saltados.length) {
    console.log();
    console.log('SALTADOS:');
    for (const s of saltados) console.log(`  · ${s}`);
}
