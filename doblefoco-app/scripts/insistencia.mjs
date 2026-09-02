/**
 * INSISTENCIA: ¿QUIÉN VUELVE UNA Y OTRA VEZ SOBRE UN TEMA?  —  npm run insistencia
 *
 * SOLO LEE. No escribe una línea en la base y no toca el léxico.
 *
 * POR QUÉ EXISTE. El punto ciego dice quién NO cuenta algo. Jose pidió el
 * 2026-07-30 lo contrario: quién lo cuenta sin parar. Es F1-17.
 *
 * POR QUÉ NO SE PUDO ANTES, Y POR QUÉ SÍ AHORA. El ROADMAP lo dejó bloqueado con
 * esta frase: «LO QUE HARÍA FALTA: detección de tema a partir del TITULAR, sobre
 * la ventana de retención». La tentación entonces era usar `articles.category`, y
 * habría dado un resultado con buena pinta —«la derecha sobre-representa Política
 * ×2,0»— que en realidad mide NUESTRA configuración de los feeds, no la agenda
 * del medio. Esa detección se construyó el 2026-08-03 y se persiste en
 * `articles.topics`. La dependencia ya no existe; el riesgo de circularidad, que
 * era la razón de fondo, tampoco.
 *
 * QUÉ MIDE, EXACTAMENTE. Para cada banda del espectro y cada tema:
 *
 *     cuota de la banda = artículos de la banda sobre ese tema / todo lo que
 *                         publicó la banda
 *     cuota del corpus  = artículos sobre ese tema / todo el corpus
 *     índice            = cuota de la banda ÷ cuota del corpus
 *
 * Un índice de 2,0 dice: «de cada cien piezas suyas, esta banda dedica a este
 * tema el doble de las que le dedica el ecosistema». Eso es insistencia, y es una
 * afirmación sobre proporciones, no sobre volumen: un medio pequeño puede
 * insistir más que uno grande.
 *
 * LAS DOS TRAMPAS QUE EL PROPIO ROADMAP DEJÓ ESCRITAS, y que aquí se aplican:
 *
 *   1. LOS MEDIOS DE IZQUIERDA PUBLICAN EL 3,3 % DEL VOLUMEN (F3-16). Sobre bases
 *      tan pequeñas un índice se dispara con dos artículos. Por eso NO basta el
 *      índice: se exige además un MÍNIMO ABSOLUTO de piezas.
 *   2. UNA INSISTENCIA DE UN DÍA NO ES UNA AGENDA. El terremoto puso a todo el
 *      mundo a hablar de Desastres. Por eso se mide también día a día y se informa
 *      en cuántos se sostiene.
 *
 * LO QUE NO HACE: no publica nada, no propone umbrales definitivos y no decide si
 * esto merece vista. Primero se mira si la señal discrimina algo — que es lo que
 * `npm run conducta` enseñó al no discriminar casi nada.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { checkConnection, query, closePool } = await import('../server/db/pool.js');
const { MEDIA_REGISTRY } = await import('../shared/mediaRegistry.js');
const { classifySpectrum, SPECTRUM_LABEL } = await import('../shared/biasAnalysis.js');
const { TEMAS } = await import('../shared/topicClassifier.js');

/**
 * Mínimo de piezas de una banda sobre un tema para que su índice se informe.
 *
 * No es un umbral calibrado: es el suelo por debajo del cual la aritmética deja
 * de significar nada. Con 5 piezas, una sola mueve el índice un 20 %.
 */
const MINIMO_ABSOLUTO = 10;

/** A partir de aquí se considera que hay algo que mirar. */
const INDICE_INTERESANTE = 1.5;

const nombreTema = new Map(TEMAS.map((t) => [t.id, t.nombre]));
const bandaPorMedio = new Map(
    MEDIA_REGISTRY.map((m) => [m.id, classifySpectrum(m.bias)])
);
const pct = (x) => `${(x * 100).toFixed(1)} %`;

async function main() {
    const estado = await checkConnection();
    if (!estado.enabled) {
        console.error(`\n  ✗ No se pudo conectar: ${estado.reason}\n`);
        process.exitCode = 1;
        return;
    }

    console.log(`\n  INSISTENCIA POR BANDA DEL ESPECTRO  (solo lectura)`);
    console.log(`  Conectado a ${estado.database}\n`);

    const { rows } = await query(
        `SELECT source_id, topics, published_at
           FROM articles
          WHERE topics IS NOT NULL
            AND published_at IS NOT NULL`
    );

    // ── Reparto por banda, que es el contexto sin el cual el resto engaña ──
    const totalPorBanda = new Map();
    const temaPorBanda = new Map(); // banda → Map(tema → n)
    const temaGlobal = new Map();
    const porDia = new Map(); // día → { banda → {total, Map(tema→n)} }
    const mediosPorBanda = new Map();
    let total = 0;

    for (const a of rows) {
        const banda = bandaPorMedio.get(a.source_id);
        if (!banda) continue; // medio fuera del registro: no se le atribuye banda

        // El driver puede devolver `timestamp` como Date o como cadena según la
        // configuración de tipos; se normaliza aquí y no se asume ninguna.
        const dia = (a.published_at instanceof Date
            ? a.published_at.toISOString()
            : String(a.published_at)
        ).slice(0, 10);

        totalPorBanda.set(banda, (totalPorBanda.get(banda) ?? 0) + 1);
        total += 1;

        if (!mediosPorBanda.has(banda)) mediosPorBanda.set(banda, new Set());
        mediosPorBanda.get(banda).add(a.source_id);

        if (!temaPorBanda.has(banda)) temaPorBanda.set(banda, new Map());
        const dePorBanda = temaPorBanda.get(banda);

        if (!porDia.has(dia)) porDia.set(dia, new Map());
        const delDia = porDia.get(dia);
        if (!delDia.has(banda)) delDia.set(banda, { total: 0, temas: new Map() });
        delDia.get(banda).total += 1;

        for (const t of a.topics ?? []) {
            dePorBanda.set(t, (dePorBanda.get(t) ?? 0) + 1);
            temaGlobal.set(t, (temaGlobal.get(t) ?? 0) + 1);
            const d = delDia.get(banda).temas;
            d.set(t, (d.get(t) ?? 0) + 1);
        }
    }

    console.log(`  Artículos con tema y fecha: ${total}\n`);

    console.log('  1. CUÁNTO PUBLICA CADA BANDA  —  el contexto que lo condiciona todo');
    console.log('  ──────────────────────────────────────────────────────────────────');
    for (const banda of ['left', 'center', 'right']) {
        const n = totalPorBanda.get(banda) ?? 0;
        const medios = mediosPorBanda.get(banda)?.size ?? 0;
        console.log(
            `    ${String(SPECTRUM_LABEL[banda] ?? banda).padEnd(22)} ${String(n).padStart(5)} artículos` +
            `  (${pct(total ? n / total : 0).padStart(7)})   ${medios} medios`
        );
    }
    console.log('');

    // ── Índice de insistencia ────────────────────────────────────────────────
    console.log('  2. ÍNDICE DE INSISTENCIA  =  cuota de la banda ÷ cuota del corpus');
    console.log('  ──────────────────────────────────────────────────────────────────');
    console.log(`    Se informa solo con ${MINIMO_ABSOLUTO}+ piezas de esa banda en ese tema.\n`);

    const hallazgos = [];

    for (const banda of ['left', 'center', 'right']) {
        const nBanda = totalPorBanda.get(banda) ?? 0;
        if (!nBanda) continue;
        const temas = temaPorBanda.get(banda) ?? new Map();

        const filas = [];
        for (const [tema, n] of temas) {
            const cuotaBanda = n / nBanda;
            const cuotaCorpus = (temaGlobal.get(tema) ?? 0) / total;
            if (!cuotaCorpus) continue;
            const indice = cuotaBanda / cuotaCorpus;
            filas.push({ tema, n, cuotaBanda, cuotaCorpus, indice });
        }

        filas.sort((a, b) => b.indice - a.indice);

        console.log(`    ${SPECTRUM_LABEL[banda] ?? banda}`);
        let mostradas = 0;
        for (const f of filas) {
            if (f.n < MINIMO_ABSOLUTO) continue;
            if (mostradas >= 5) break;
            mostradas += 1;
            const marca = f.indice >= INDICE_INTERESANTE ? ' ←' : '';
            console.log(
                `      ${(nombreTema.get(f.tema) ?? f.tema).padEnd(24)}` +
                `×${f.indice.toFixed(2).padStart(5)}   ${String(f.n).padStart(4)} piezas` +
                `   ${pct(f.cuotaBanda).padStart(7)} vs ${pct(f.cuotaCorpus).padStart(7)} del corpus${marca}`
            );
            if (f.indice >= INDICE_INTERESANTE) hallazgos.push({ banda, ...f });
        }
        const descartadas = filas.filter((f) => f.n < MINIMO_ABSOLUTO).length;
        if (descartadas) {
            console.log(`      (${descartadas} temas por debajo del mínimo de ${MINIMO_ABSOLUTO} piezas, no se informan)`);
        }
        console.log('');
    }

    // ── ¿Se sostiene en el tiempo? ───────────────────────────────────────────
    const dias = [...porDia.keys()].sort();
    console.log(`  3. ¿SE SOSTIENE?  —  el corpus cubre ${dias.length} días (${dias[0]} → ${dias.at(-1)})`);
    console.log('  ──────────────────────────────────────────────────────────────────');

    if (!hallazgos.length) {
        console.log('    No hay ningún índice por encima de ' + INDICE_INTERESANTE + ' con datos suficientes.\n');
    }

    for (const h of hallazgos) {
        let diasPorEncima = 0;
        let diasConDatos = 0;
        const serie = [];
        for (const dia of dias) {
            const delDia = porDia.get(dia);
            const b = delDia.get(h.banda);
            if (!b || b.total < 20) continue; // día flojo de esa banda: no dice nada
            const nTema = b.temas.get(h.tema) ?? 0;

            // Cuota del corpus ESE día, no la global: si un hecho copa la agenda
            // de todos, el índice tiene que verlo y no premiar a quien lo siguió.
            let totalDia = 0;
            let temaDia = 0;
            for (const [, bb] of delDia) {
                totalDia += bb.total;
                temaDia += bb.temas.get(h.tema) ?? 0;
            }
            if (!totalDia || !temaDia) continue;

            diasConDatos += 1;
            const idx = (nTema / b.total) / (temaDia / totalDia);
            serie.push(`${dia.slice(5)} ×${idx.toFixed(1)}`);
            if (idx >= INDICE_INTERESANTE) diasPorEncima += 1;
        }
        console.log(
            `    ${(SPECTRUM_LABEL[h.banda] ?? h.banda)} · ${nombreTema.get(h.tema) ?? h.tema}: ` +
            `${diasPorEncima} de ${diasConDatos} días por encima de ×${INDICE_INTERESANTE}`
        );
        if (serie.length) console.log(`        ${serie.join('  ')}`);
    }
    console.log('');

    // ── El límite que ninguna calibración arregla ───────────────────────────
    console.log('  4. LO QUE ESTA MEDIDA NO PUEDE AFIRMAR, Y POR QUÉ');
    console.log('  ──────────────────────────────────────────────────────────────────');
    console.log(`    El corpus cubre ${dias.length} días. Desde el 2026-09-02 la base conserva 30`);
    console.log('    (`RETENCION_BASE_MS` en ingestDaemon.js); antes borraba a las 72 h, y una');
    console.log('    agenda no se mide en tres días. La serie se llena sola: un día por día.');
    console.log('');
    console.log('    El ROADMAP daba F1-17 por bloqueada a falta de «detección de tema a');
    console.log('    partir del titular». Eso ya existe —es lo que usa este script—. El');
    console.log('    bloqueo real es la RETENCIÓN: sobre `articles` nunca habrá serie.');
    console.log('');
    console.log('    Lo que lo desbloquearía es barato: un agregado diario persistente');
    console.log('    —día, banda, tema, piezas, total de la banda—, que son unas pocas');
    console.log('    filas al día y sobrevive a la poda. Con semanas de eso, «insiste»');
    console.log('    pasa de ser una foto a ser una afirmación.');
    console.log('');

    console.log('  Solo lectura: no se escribió nada.\n');
}

try {
    await main();
} finally {
    await closePool();
}
