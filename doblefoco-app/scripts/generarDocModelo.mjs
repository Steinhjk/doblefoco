/**
 * Genera src/docs/modelo_sesgo.txt a partir de las constantes del motor.
 *
 *     npm run docs:modelo              regenera desde el código
 *     npm run docs:modelo -- --medir   además vuelve a medir contra la API
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ SE GENERA Y NO SE ESCRIBE A MANO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Hay precedente exacto y por eso esto se parece tanto a `generateCatalogDoc`:
 * el catálogo público estaba escrito a mano en dos documentos y ninguno
 * coincidía con el código —el sitio le enseñaba al lector una clasificación
 * distinta de la que usaba para clasificar—. Se generó, y dejó de poder pasar.
 *
 * Los PARÁMETROS del modelo estaban en la misma situación, y peor, porque el
 * número que más importa no es una constante sino algo que se deriva de ellas y
 * del catálogo. Dos ejemplos reales, los dos de este mes:
 *
 *   · `ESTUDIO_PUNTOS_CIEGOS.md` afirmó durante cuatro días que hacían falta
 *     **90 medios** para poder decir que falta la izquierda. Cuando se escribió
 *     era verdad. Al corregir la nula pasaron a ser 14, y el documento siguió
 *     diciendo 90 hasta que alguien fue a leerlo.
 *
 *   · El comentario de `UMBRAL_SORPRESA` explicó la nula con la fórmula
 *     equivocada durante un día entero, después de que la fórmula cambiara.
 *
 * En los dos casos el problema no fue escribir mal: fue **escribir bien y
 * quedarse quieto** mientras el código se movía. Un documento generado no puede
 * hacer eso, y `npm run check:registry` falla si alguien lo edita a mano.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAS DOS MITADES, Y POR QUÉ SE TRATAN DISTINTO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * DERIVABLE SIN RED — constantes, catálogo, y los umbrales que salen de los dos.
 * Se recalcula en cada ejecución y el verificador lo compara letra a letra, como
 * hace con el catálogo. Si diverge, falla.
 *
 * MEDIDO CONTRA EL CORPUS — cada cuánto falta de verdad cada espectro. Esto NO
 * se puede recalcular en CI: depende de la API y cambia cada media hora, así que
 * compararlo letra a letra pondría la verificación en rojo permanente, que es la
 * forma más rápida de que alguien la apague.
 *
 * Se guarda en `modelo_medido.json` con **su fecha dentro**, y el verificador no
 * comprueba que el número sea el de hoy —no puede— sino que **no sea viejo**.
 * Pasados los días de `DIAS_ANTES_DE_CADUCAR`, avisa. Es la diferencia entre un
 * dato con fecha y un dato caducado: los dos envejecen, pero solo el segundo
 * miente sin decirlo.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
    SPECTRUM_THRESHOLD,
    BLINDSPOT_MIN_SOURCES,
    BLINDSPOT_MIN_COBERTURA_LADO,
    analyzeCoverage,
    BLINDSPOT_MAX_PRESENTES,
    RAMAS_NO_MEDIBLES,
    UMBRAL_SORPRESA,
    SOLO_EJE_MIN_SOURCES,
    ENFASIS_MIN_RATIO,
    HIGH_POLARIZATION_STDDEV,
    catalogoDelModelo,
    mediosParaAfirmarAusencia,
} from '../shared/biasAnalysis.js';
import { MEDIA_REGISTRY } from '../shared/mediaRegistry.js';
import { RETENTION_MS } from '../server/services/ingestDaemon.js';
import { decimal } from '../shared/numeros.js';

const aqui = dirname(fileURLToPath(import.meta.url));
export const OUTPUT = resolve(aqui, '../src/docs/modelo_sesgo.txt');
export const MEDIDO = resolve(aqui, '../src/docs/modelo_medido.json');

/**
 * La fecha de generación es la única línea que cambia sin que cambie nada más.
 * El verificador tiene que poder ignorarla, igual que con el catálogo.
 */
export const LINEA_GENERADO = /^Generado: \d{4}-\d{2}-\d{2}$/m;

/** A partir de aquí, lo medido se considera viejo y el verificador lo dice. */
export const DIAS_ANTES_DE_CADUCAR = 45;

/** El orden en que se nombran los espectros. Uno solo, para no divergir. */
const ORDEN = [
    ['left', 'Izquierda'],
    ['center', 'Orientación mixta'],
    ['right', 'Derecha'],
];

/**
 * La fecha de hoy EN BOGOTÁ, no en UTC.
 *
 * `toISOString()` da la fecha en Greenwich, y Colombia va cinco horas por
 * detrás: cualquier ejecución después de las siete de la tarde fechaba el
 * documento **al día siguiente**. Salió a la primera, generando esto a las
 * 20:40 del 25 y viendo escrito «2026-08-26». En un documento público de un
 * sitio colombiano, una fecha que va por delante del calendario del lector es
 * un error pequeño y de los que hacen desconfiar del resto.
 */
const hoyEnBogota = () =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());

const ANCHO = 70;
const raya = (c = '=') => c.repeat(ANCHO);

/** Envuelve texto a un ancho fijo para leerlo en <pre>. */
function envolver(texto, ancho = ANCHO, sangria = '') {
    const palabras = String(texto).split(/\s+/).filter(Boolean);
    const lineas = [];
    let actual = sangria;
    for (const palabra of palabras) {
        if (actual.length + palabra.length + 1 > ancho && actual.trim()) {
            lineas.push(actual.trimEnd());
            actual = sangria + palabra + ' ';
        } else {
            actual += palabra + ' ';
        }
    }
    if (actual.trim()) lineas.push(actual.trimEnd());
    return lineas.join('\n');
}

const pct = (v) => `${decimal(v * 100, 1)} %`;

/**
 * Una fila «etiqueta ....... valor», alineada por columna y no a ojo.
 *
 * Se escribía a mano con puntos contados uno a uno, y salían desalineadas en
 * cuanto una etiqueta crecía una letra. Un documento que se genera no debería
 * tener nada contado a mano.
 */
const fila = (etiqueta, valor, columna = 44) =>
    `    ${etiqueta} ${'.'.repeat(Math.max(3, columna - etiqueta.length))}  ${valor}`;

/** Lo medido, o null si nunca se ha medido. */
export function leerMedido() {
    try {
        return JSON.parse(readFileSync(MEDIDO, 'utf8'));
    } catch {
        return null;
    }
}

/**
 * Mide contra la API pública.
 *
 * Va contra producción a propósito y no contra la base: lo que este documento
 * promete es lo que el LECTOR obtiene, y el lector obtiene lo que sirve la API.
 */
export async function medir(base = 'https://api.doblefoco.co') {
    const respuesta = await fetch(`${base}/api/feed?limit=200`);
    if (!respuesta.ok) throw new Error(`la API respondió ${respuesta.status}`);
    const cuerpo = await respuesta.json();
    const historias = cuerpo.stories ?? [];

    const medios = (h) => h.sources?.length ?? 0;
    const evaluables = historias.filter((h) => medios(h) >= BLINDSPOT_MIN_SOURCES);

    const falta = { left: 0, center: 0, right: 0 };
    for (const h of evaluables) {
        const c = h.coverage ?? {};
        if (!(c.left > 0)) falta.left++;
        if (!(c.center > 0)) falta.center++;
        if (!(c.right > 0)) falta.right++;
    }

    return {
        fecha: hoyEnBogota(),
        historias: historias.length,
        evaluables: evaluables.length,
        mayorHistoria: historias.reduce((max, h) => Math.max(max, medios(h)), 0),
        conAusencia: historias.filter((h) => h.ausencia).length,
        /*
         * Las dos formas por separado, porque no son la misma afirmación: la
         * regla selecciona por proporción y en una historia grande cabe un
         * medio del lado que se dice que falta. Contarlas juntas es lo que hizo
         * que el aviso del feed dijera «no aparece ningún medio» sobre cinco
         * historias donde sí aparecía uno.
         */
        sinNingunMedio: historias.filter((h) => h.ausencia?.presentes === 0).length,
        apenasUnos: historias.filter((h) => h.ausencia && h.ausencia.presentes > 0).length,
        conPuntoCiego: historias.filter((h) => h.blindspot).length,
        faltaEnEvaluables: falta,
        // El énfasis por lado, para que la ceguera direccional quede medida y
        // no solo dicha (opción E, 2026-09-02).
        // Se recalcula desde las fuentes con el modelo de ESTE código, igual que
        // hace el cliente (normalizeStory): la API sirve el modelo que tenga
        // desplegado, y aquí se mide el que se está documentando.
        enfasis: {
            left: historias.filter((h) => analyzeCoverage(h.sources ?? []).enfasis?.spectrum === 'left').length,
            right: historias.filter((h) => analyzeCoverage(h.sources ?? []).enfasis?.spectrum === 'right').length,
        },
    };
}

export function renderModelo() {
    const cat = catalogoDelModelo();
    const medido = leerMedido();
    const lineas = [];
    const push = (t = '') => lineas.push(t);

    push('CÓMO MIDE DOBLEFOCO — PARÁMETROS DEL MODELO');
    push(raya());
    push();
    push(envolver(
        'Este documento se genera desde el código que corre. No se edita a ' +
        'mano: cada número de aquí sale de la misma constante que usa el ' +
        'motor para decidir, o se deriva de ella y del catálogo. Si los dos ' +
        'pudieran divergir, esta página no serviría de nada — y ya divergió ' +
        'dos veces este mes, que es la razón de que exista.'
    ));
    push();
    push(`Generado: ${hoyEnBogota()}`);
    push();
    push();

    // ── 1 ────────────────────────────────────────────────────────────────────
    push('1. QUÉ MIDE ESTE MODELO, Y QUÉ NO');
    push(raya('-'));
    push();
    push(envolver(
        'Mide QUIÉN cubrió cada hecho, no cómo lo contó. La orientación es ' +
        'una propiedad del MEDIO, documentada y publicada en el catálogo; no ' +
        'se analiza el texto de la pieza y no se le pone nota a ninguna ' +
        'noticia. Cuando este sitio dice que a una historia le falta un lado, ' +
        'la afirmación entera es: entre los medios que la cubrieron no hay ' +
        'ninguno de esa orientación.'
    ));
    push();
    push(envolver(
        'Eso deja fuera, a propósito, todo lo que haría falta para decir que ' +
        'alguien OMITIÓ algo: no sabemos qué escribió cada redacción y ' +
        'descartó, ni si el hecho llegó a su mesa. Por eso la ausencia se ' +
        'publica como hecho y con su frecuencia al lado, y la palabra «punto ' +
        'ciego» se reserva para cuando esa ausencia además sorprenda.'
    ));
    push();
    push();

    // ── 2 ────────────────────────────────────────────────────────────────────
    push('2. LAS BANDAS DEL ESPECTRO');
    push(raya('-'));
    push();
    push(envolver(
        `Cada medio lleva un valor entre −1 y +1. La frontera entre la banda ` +
        `media y los extremos está en ${decimal(SPECTRUM_THRESHOLD, 2)}:`
    ));
    push();
    const u = decimal(SPECTRUM_THRESHOLD, 2);
    push(`    ${`bias <= −${u}`.padEnd(24)}izquierda`);
    push(`    ${`entre −${u} y +${u}`.padEnd(24)}orientación mixta`);
    push(`    ${`bias >= +${u}`.padEnd(24)}derecha`);
    push();
    push(envolver(
        'La banda media se llama «orientación mixta» y no «centro» porque no ' +
        'hay tal cosa como un centro político neutral: lo que la banda ' +
        'recoge son medios cuya línea no se sitúa de forma marcada en el eje.'
    ));
    push();
    push();

    // ── 3 ────────────────────────────────────────────────────────────────────
    push('3. EL CATÁLOGO QUE VE EL MODELO');
    push(raya('-'));
    push();
    push(envolver(
        'Cuentan solo los medios CON FEED. Un medio sin feed no puede ' +
        'aparecer en ninguna historia, así que meterlo en el denominador ' +
        'inventaría competidores que no compiten — y haría más fácil declarar ' +
        'ausente a quien nunca pudo estar.'
    ));
    push();
    for (const [clave, etiqueta] of ORDEN) {
        push(fila(etiqueta, `${String(cat[clave]).padStart(3)}   ${pct(cat[clave] / cat.total).padStart(7)}`, 28));
    }
    push(`    ${'-'.repeat(40)}`);
    push(fila('Con feed', String(cat.total).padStart(3), 28));
    push(fila('En el registro', String(MEDIA_REGISTRY.length).padStart(3), 28));
    push();
    push();

    // ── 4 ────────────────────────────────────────────────────────────────────
    push('4. CUÁNDO SE DICE QUE A UNA HISTORIA LE FALTA UN LADO');
    push(raya('-'));
    push();
    push(envolver(
        `Hacen falta al menos ${BLINDSPOT_MIN_SOURCES} medios cubriendo el ` +
        'hecho. Por debajo de eso no se evalúa nada: con dos o tres medios, ' +
        'que falte una orientación no dice más que quién madrugó.'
    ));
    push();
    push(fila('Medios mínimos para evaluar', BLINDSPOT_MIN_SOURCES));
    push(fila('Un lado se considera ausente si lo cubren', `${BLINDSPOT_MAX_PRESENTES} medio(s) o menos`));
    push(fila('Y el otro lado tiene que aportar', `${BLINDSPOT_MIN_COBERTURA_LADO} medios o más`));
    push(fila('«Solo medios del eje» pide, además', `${SOLO_EJE_MIN_SOURCES} medios`));
    push();
    push(envolver(
        `La condición de los ${BLINDSPOT_MIN_COBERTURA_LADO} medios es la que ` +
        `sostiene el umbral de ${BLINDSPOT_MIN_SOURCES}. Un lado ausente está ` +
        'por definición en cero, así que lo único comprobable es que el otro ' +
        'no sea uno solo: con un único medio cubriendo, lo que hay no es «un ' +
        'lado omite esto» sino «un periódico decidió cubrirlo».'
    ));
    push();
    push();

    // ── 5 ────────────────────────────────────────────────────────────────────
    push('5. CUÁNDO ESA AUSENCIA ADEMÁS SORPRENDE');
    push(raya('-'));
    push();
    push(envolver(
        'Que falte un lado casi nunca es noticia por sí solo: depende de ' +
        'cuántos medios de ese lado hay para empezar. La pregunta que se hace ' +
        'el modelo es: si los medios que cubrieron el hecho se hubieran ' +
        'sacado al azar del catálogo, ¿qué probabilidad había de que no ' +
        `saliera ninguno de ese lado? Si baja de ${pct(UMBRAL_SORPRESA)}, la ` +
        'ausencia se llama punto ciego. Si no, se publica el hecho y nada más.'
    ));
    push();
    push(envolver(
        'Traducido a lo único que se puede mirar de un vistazo: cuántos ' +
        'medios tiene que reunir UNA historia para que la ausencia de cada ' +
        'lado deje de ser lo esperable.'
    ));
    push();
    push('    Lado ausente          Medios que haría falta reunir');
    push('    ' + '-'.repeat(50));
    for (const [espectro, etiqueta] of ORDEN) {
        const n = mediosParaAfirmarAusencia(espectro);
        push(`    ${etiqueta.padEnd(22)}${n === null ? 'ninguno basta' : n}`);
    }
    push();
    if (medido?.mayorHistoria) {
        push(envolver(
            `Para comparar: la historia más cubierta del último corpus medido ` +
            `reunió ${medido.mayorHistoria} medios.`
        ));
        push();
    }
    push(envolver(
        'Esta cuenta mira MEDIOS, no artículos. Es una corrección del ' +
        '2026-08-25: antes miraba la cuota de apariciones, lo que mezclaba ' +
        'cuántos medios existen de un lado con cuánto publica cada uno, y ' +
        'castigaba dos veces a un lado silencioso. El relato está en el §2 ' +
        'de ESTUDIO_PUNTOS_CIEGOS.md.'
    ));
    push();
    push();

    // ── 6 ────────────────────────────────────────────────────────────────────
    push('6. ÉNFASIS Y POLARIZACIÓN');
    push(raya('-'));
    push();
    push(envolver(
        'El énfasis es el reverso del punto ciego y no su sinónimo: mira la ' +
        'concentración en vez de la ausencia. Solo se calcula sobre los ' +
        'extremos, porque que la mayoría de medios de un hecho no tenga línea ' +
        'marcada es lo normal en este catálogo y no dice nada.'
    ));
    push();
    push(fila('Un lado marca énfasis desde el', `${pct(ENFASIS_MIN_RATIO)} de la cobertura`));
    push(fila('y con al menos', `${BLINDSPOT_MIN_COBERTURA_LADO} medios`));
    push(fila('Polarización alta desde una desviación de', decimal(HIGH_POLARIZATION_STDDEV, 2)));
    push();
    push();

    // ── 7 ────────────────────────────────────────────────────────────────────
    push('7. LA VENTANA DE TIEMPO');
    push(raya('-'));
    push();
    const horas = Math.round(RETENTION_MS / 3_600_000);
    push(fila('Una noticia vive', `${horas} horas`));
    push();
    push(envolver(
        `Pasadas esas ${horas} horas la pieza se borra. Conviene saberlo al ` +
        'leer cualquier cifra de este documento: un medio que publica cada ' +
        'cuatro días no aparece nunca, y su silencio en las cuentas es ' +
        'nuestro, no suyo. Es la razón por la que la pregunta del §5 mira ' +
        'medios y no volumen.'
    ));
    push();
    push();

    // ── 8 ────────────────────────────────────────────────────────────────────
    push('8. LO MEDIDO CONTRA EL CORPUS');
    push(raya('-'));
    push();
    if (!medido) {
        push(envolver(
            'Todavía no se ha medido nada. Se hace con: ' +
            'npm run docs:modelo -- --medir'
        ));
    } else {
        push(envolver(
            'Esto NO se recalcula al generar el documento: sale de una ' +
            'medición fechada contra la API pública, y por eso lleva la fecha ' +
            'delante. Los apartados anteriores describen la regla; este dice ' +
            'qué pasa cuando se aplica.'
        ));
        push();
        push(fila('Medido el', medido.fecha));
        push(fila('Historias en la ventana', medido.historias));
        push(fila(`De ellas, evaluables (${BLINDSPOT_MIN_SOURCES}+ medios)`, medido.evaluables));
        push(fila('Historia más cubierta', `${medido.mayorHistoria} medios`));
        push();
        push(fila('Con un lado por debajo del umbral', medido.conAusencia));
        if (typeof medido.sinNingunMedio === 'number') {
            push(fila('  de esas, sin ningún medio', medido.sinNingunMedio));
            push(fila('  de esas, con alguno suelto', medido.apenasUnos));
        }
        push(fila('Puntos ciegos declarados', medido.conPuntoCiego));
        push();
        push('    Cada cuánto falta cada lado, en las evaluables:');
        push();
        for (const [espectro, etiqueta] of ORDEN) {
            const n = medido.faltaEnEvaluables?.[espectro] ?? 0;
            const frac = medido.evaluables ? n / medido.evaluables : 0;
            push(`      ${etiqueta.padEnd(22)}${String(n).padStart(3)} de ${medido.evaluables}   ${pct(frac).padStart(7)}`);
        }
        push();
        push(envolver(
            'La columna de la derecha es la que impide que el veredicto ' +
            'mienta. Una ausencia que ocurre en la mayoría de las historias ' +
            'no es un hallazgo sobre la noticia: es el estado por defecto de ' +
            'este catálogo, y enseñarla sin decir cada cuánto pasa sería ' +
            'convertir la norma en titular.'
        ));
        push();
        push(envolver(
            `RAMAS DECLARADAS NO MEDIBLES: ${[...RAMAS_NO_MEDIBLES].map((e) => ORDEN.find(([k]) => k === e)?.[1] ?? e).join(', ')}. ` +
            'Desde el 2026-09-02 la ausencia de ese lado nunca se llama «punto ciego», ' +
            'aunque la nula la declare improbable: con la frecuencia de arriba, señalar ' +
            'una historia concreta sería acusarla de lo que hace el catálogo. Se publica ' +
            'el hecho —«sin medios de»— con su frecuencia al lado, y el desequilibrio se ' +
            'cuenta donde está, en el mapa de medios. Se revisa si entran medios de ese ' +
            'lado o si la frecuencia baja de la mitad.'
        ));
        if (medido.enfasis) {
            push();
            push(fila('Énfasis hacia la derecha', medido.enfasis.right));
            push(fila('Énfasis hacia la izquierda', medido.enfasis.left));
            push(envolver(
                'El énfasis es la señal que sí funciona en un corpus asimétrico, y tiene ' +
                'una ceguera direccional que conviene tener a la vista: en este catálogo ' +
                'apunta casi siempre a la derecha y casi nunca a la izquierda. No es un ' +
                'hallazgo sobre las noticias; es que la izquierda es una parte pequeña del ' +
                'catálogo. Se adopta con eso escrito (2026-09-02).'
            ));
        }
    }
    push();
    push();
    push(raya());
    push(envolver(
        'Todos estos números son discutibles y están en constantes para poder ' +
        'discutirlos. Si cree que alguno está mal, escríbanos: lo que no se ' +
        'puede es cambiarlos sin que este documento cambie con ellos.'
    ));
    push();

    return lineas.join('\n');
}

// Solo escribe cuando se invoca como script. Importado, expone renderModelo()
// para que el verificador compare sin tocar el disco.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    if (process.argv.includes('--medir')) {
        const medicion = await medir();
        writeFileSync(MEDIDO, JSON.stringify(medicion, null, 2) + '\n', 'utf8');
        console.log(`Medido contra la API: ${medicion.evaluables} evaluables de ${medicion.historias}.`);
    }
    const contenido = renderModelo();
    writeFileSync(OUTPUT, contenido, 'utf8');
    console.log(`Escrito ${OUTPUT} (${contenido.split('\n').length} líneas)`);
}
