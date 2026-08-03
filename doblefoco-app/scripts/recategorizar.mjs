/**
 * RECATEGORIZACIÓN de lo ya ingerido.
 *
 * Uso:  npm run recategorizar            (ensayo: mide y no escribe)
 *       npm run recategorizar -- --aplicar
 *
 * POR QUÉ EXISTE
 * --------------
 * El clasificador por contenido entró en la ingesta, así que lo nuevo llega
 * clasificado. Pero la ventana de retención es de 72 horas y los artículos ya
 * guardados conservan la categoría heredada del feed: sin esto habría que
 * esperar tres días para ver el efecto, y durante esos tres días la interfaz
 * mezclaría dos criterios distintos en la misma pantalla. Se decidió
 * recategorizar (2026-08-03).
 *
 * QUÉ NO TOCA
 * -----------
 * `category` se conserva intacta. Guarda lo que se le mostró al lector antes de
 * esta migración, por el mismo motivo por el que las métricas de cobertura se
 * guardan calculadas: poder auditar qué decía el sitio y cuándo. Aquí solo se
 * escriben `topics` y `ambito`.
 *
 * ENSAYO POR DEFECTO. Escribe solo con `--aplicar`. Esto reclasifica el
 * catálogo entero de una pasada, y la forma de descubrir que un léxico estaba
 * mal no puede ser mirar la portada después.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { checkConnection, query, withTransaction, closePool } = await import('../server/db/pool.js');
const { classifyTopics, TEMAS } = await import('../shared/topicClassifier.js');
const { MEDIA_REGISTRY } = await import('../shared/mediaRegistry.js');

const APLICAR = process.argv.includes('--aplicar');
const LOTE = 500;

/** El país del medio, que el clasificador necesita para desempatar el ámbito. */
const paisPorMedio = new Map(MEDIA_REGISTRY.map((m) => [m.id, m.country]));
const nombrePorTema = new Map(TEMAS.map((t) => [t.id, t.nombre]));

async function main() {
    const estado = await checkConnection();
    if (!estado.enabled) {
        console.error(`\n  ✗ No se pudo conectar: ${estado.reason}`);
        console.error('    Completa DATABASE_URL en .env.local\n');
        process.exitCode = 1;
        return;
    }

    console.log(`\n  RECATEGORIZACIÓN ${APLICAR ? '— APLICANDO' : '— ENSAYO (no escribe)'}`);
    console.log(`  Conectado a ${estado.database}\n`);

    const { rows: totales } = await query(`
        SELECT count(*)::int                                    AS articulos,
               count(*) FILTER (WHERE topics IS NULL)::int      AS sin_clasificar
          FROM articles
    `);

    console.log(`  ${totales[0].articulos} artículos · ${totales[0].sin_clasificar} sin clasificar\n`);

    // ── Artículos ────────────────────────────────────────────────────────────

    const porTema = {};
    const porAmbito = { nacional: 0, internacional: 0 };
    let procesados = 0;
    let rescatados = 0;
    let sinTema = 0;
    let offset = 0;

    for (;;) {
        const { rows } = await query(
            `
            SELECT a.id, a.headline, a.snippet, a.canonical_url, a.source_id
              FROM articles a
             ORDER BY a.id
             LIMIT $1 OFFSET $2
            `,
            [LOTE, offset]
        );

        if (!rows.length) break;

        const ids = [];
        const temasPorId = [];
        const ambitos = [];

        for (const fila of rows) {
            const r = classifyTopics({
                headline: fila.headline,
                snippet: fila.snippet ?? '',
                link: fila.canonical_url,
                // Las etiquetas <category> del RSS no se guardaron nunca, así
                // que aquí no están. Es una señal de refuerzo del 32 % de los
                // casos, no la fuente, y el titular sí lo tenemos entero.
                feedCategories: [],
                paisDelMedio: paisPorMedio.get(fila.source_id) ?? 'CO',
            });

            ids.push(fila.id);
            temasPorId.push(r.temas);
            ambitos.push(r.ambito);

            porAmbito[r.ambito] += 1;
            if (r.rescatado) rescatados += 1;
            if (!r.temas.length) sinTema += 1;
            for (const t of r.temas) porTema[t] = (porTema[t] ?? 0) + 1;
        }

        if (APLICAR) {
            await withTransaction(async (client) => {
                await client.query(
                    `
                    UPDATE articles AS a
                       SET topics = CASE WHEN v.temas = '' THEN '{}'::text[]
                                         ELSE string_to_array(v.temas, ',') END,
                           ambito = v.ambito
                      FROM (
                        SELECT * FROM unnest($1::text[], $2::text[], $3::text[])
                            AS t(id, temas, ambito)
                      ) AS v
                     WHERE a.id = v.id
                    `,
                    // Los temas viajan como cadena y se parten en SQL. `unnest`
                    // no sirve para un array de arrays irregulares: aplana los
                    // multidimensionales y además exigiría que todas las filas
                    // tuvieran el mismo número de temas, que es justo lo que la
                    // clasificación multietiqueta no garantiza. Los ids de tema
                    // son [a-z]+ y no llevan comas, así que la unión es segura.
                    [ids, temasPorId.map((t) => t.join(',')), ambitos]
                );
            });
        }

        procesados += rows.length;
        offset += LOTE;
        process.stdout.write(`\r  procesados ${procesados}…`);
    }

    console.log(`\r  procesados ${procesados}   \n`);

    // ── Historias ────────────────────────────────────────────────────────────
    //
    // Se agregan DESDE los artículos ya reclasificados, con las mismas reglas
    // que usa el motor: unión de temas, ámbito por mayoría con el empate a
    // favor de lo nacional. Se hace en SQL porque es una agregación sobre
    // filas que ya están en la base y traerlas a Node para volver a subirlas
    // sería mover 3 600 filas para no calcular nada distinto.

    if (APLICAR) {
        await query(`
            UPDATE stories s
               SET topics = COALESCE(agg.topics, '{}'),
                   ambito = agg.ambito
              FROM (
                SELECT sa.story_id,
                       array_agg(DISTINCT t) FILTER (WHERE t IS NOT NULL) AS topics,
                       -- count(DISTINCT a.id) y NO count(*): el LATERAL unnest
                       -- produce una fila por (artículo × tema), así que un
                       -- artículo con tres temas contaría por tres y la mayoría
                       -- del ámbito la decidiría cuántas etiquetas tiene cada
                       -- pieza en vez de cuántos medios dicen qué.
                       CASE WHEN count(DISTINCT a.id) FILTER (WHERE a.ambito = 'internacional')
                                 > count(DISTINCT a.id) / 2.0
                            THEN 'internacional' ELSE 'nacional' END       AS ambito
                  FROM story_articles sa
                  JOIN articles a ON a.id = sa.article_id
                  LEFT JOIN LATERAL unnest(a.topics) AS t ON TRUE
                 GROUP BY sa.story_id
              ) AS agg
             WHERE s.id = agg.story_id
        `);
    }

    const { rows: historias } = await query(`
        SELECT count(*)::int                                          AS total,
               count(*) FILTER (WHERE topics IS NOT NULL
                                  AND cardinality(topics) > 0)::int   AS con_tema,
               count(*) FILTER (WHERE ambito = 'internacional')::int  AS internacional
          FROM stories
    `);

    // ── Informe ──────────────────────────────────────────────────────────────

    const pc = (x) => `${String(Math.round((x / procesados) * 100)).padStart(3)}%`;

    console.log('  REPARTO POR TEMA (multietiqueta, la suma pasa de 100 %)');
    console.log('  ' + '─'.repeat(68));
    for (const tema of TEMAS) {
        const c = porTema[tema.id] ?? 0;
        console.log(
            `    ${(nombrePorTema.get(tema.id) ?? tema.id).padEnd(22)} ${String(c).padStart(6)}  ${pc(c)}`
        );
    }

    console.log('\n  ÁMBITO');
    console.log('  ' + '─'.repeat(68));
    console.log(`    nacional               ${String(porAmbito.nacional).padStart(6)}  ${pc(porAmbito.nacional)}`);
    console.log(`    internacional          ${String(porAmbito.internacional).padStart(6)}  ${pc(porAmbito.internacional)}`);

    console.log('\n  SALUD DEL CLASIFICADOR');
    console.log('  ' + '─'.repeat(68));
    console.log(`    rescatados por señal débil ${String(rescatados).padStart(6)}  ${pc(rescatados)}`);
    console.log(`    sin tema                   ${String(sinTema).padStart(6)}  ${pc(sinTema)}`);

    if (APLICAR) {
        const h = historias[0];
        console.log('\n  HISTORIAS');
        console.log('  ' + '─'.repeat(68));
        console.log(`    total                  ${String(h.total).padStart(6)}`);
        console.log(`    con al menos un tema   ${String(h.con_tema).padStart(6)}`);
        console.log(`    internacionales        ${String(h.internacional).padStart(6)}`);
    }

    console.log(
        APLICAR
            ? '\n  ✓ Escrito.\n'
            : '\n  Ensayo: no se escribió nada. Repite con --aplicar cuando el reparto convenza.\n'
    );
}

try {
    await main();
} catch (error) {
    console.error(`\n  ✗ ${error.message}\n`);
    if (process.env.DEBUG) console.error(error);
    process.exitCode = 1;
} finally {
    await closePool();
}
