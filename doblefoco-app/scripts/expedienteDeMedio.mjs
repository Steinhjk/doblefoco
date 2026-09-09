/**
 * EL NIVEL 2 DE UNA FICHA, MEDIDO. — `npm run expediente -- --medio=<id>`
 *
 * SOLO LEE. No escribe una línea en la base ni en ninguna ficha.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `PROTOCOLO_JUICIO_EDITORIAL.md` ordena la evidencia en cinco niveles y dice
 * que una ficha no puede apoyarse solo en los dos últimos. El nivel 1 —quién es
 * el dueño— ya está resuelto para todo el catálogo en `mediaOwnership.js`. El
 * nivel 2 —«conducta medida en nuestro corpus»— estaba nombrado en el protocolo
 * y no lo producía nada: había que ir a la base a mano, medio por medio.
 *
 * Por eso las fichas que faltan llevan paradas desde el 2026-08-24, y por eso la
 * banda de izquierda —6 de 18 documentados frente a 36 de 47 de la mixta— es la
 * peor cubierta del catálogo justo cuando su tasa es la que sostiene el modelo
 * de puntos ciegos.
 *
 * ESTO NO CLASIFICA A NADIE, y no es una limitación técnica: es la regla. El
 * número lo pone y lo firma Jose. Lo que esto quita de en medio es el trabajo
 * que no es juicio —contar, comparar y citar—, que era el que hacía que cada
 * ficha costara una tarde.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LO QUE MIDE, Y LO QUE CADA MEDIDA NO PUEDE DECIR
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   VOLUMEN Y CADENCIA  cuánto publica y cuándo publicó por última vez. Un medio
 *                       que no aparece no puede clasificarse por su conducta, y
 *                       eso hay que verlo antes que nada.
 *
 *   TEMAS               qué cubre, contra lo que cubre el corpus entero. Dice en
 *                       qué se aparta de la agenda común. NO dice desde dónde la
 *                       cubre: el tema es el asunto, no la postura.
 *
 *   CO-COBERTURA        con quién coincide más de lo que su volumen explicaría.
 *                       Es lo más cercano a «agenda compartida» que dan estos
 *                       datos, y no depende de que nadie declare el sesgo de
 *                       nadie. NO dice quién es de qué lado: eso sigue siendo
 *                       interpretación, y ponerle etiqueta al bloque es volver al
 *                       punto de partida.
 *
 *   AISLAMIENTO         con cuántos coincide, **y con su confusor al lado**: un
 *                       medio que publica cinco piezas coincide poco porque
 *                       publica poco, no porque tenga agenda propia. Sin esa
 *                       comparación la cifra acusaría a los pequeños de ser
 *                       raros, y los pequeños de este catálogo son casi todos de
 *                       la banda que peor documentada está. Se contrasta contra
 *                       medios de volumen parecido.
 *
 *   TITULARES           una muestra literal y reciente, para leer. No se resume
 *                       ni se puntúa: promediar la carga de sus titulares con
 *                       nuestro propio léxico sería circular, y el protocolo lo
 *                       excluye por escrito.
 *
 * Todo lo que sale de aquí es del PRESENTE —la base guarda 30 días—, que es lo
 * que exige la regla del presente. Nada de lo que imprime es historia.
 *
 * LO QUE SUBESTIMA, Y CONVIENE SABERLO: la co-cobertura se calcula sobre las
 * historias que produce el agrupamiento, y está medido que parte hechos (F1-05).
 * Cada hecho partido son medios que sí coincidieron y aquí aparecen como que no.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: resolve(ROOT, '.env.local'), quiet: true });

const { checkConnection, query, closePool } = await import('../server/db/pool.js');
const { MEDIA_REGISTRY, getBand } = await import('../shared/mediaRegistry.js');
const { getOwnership } = await import('../shared/mediaOwnership.js');
const { TEMAS } = await import('../shared/topicClassifier.js');

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const MEDIO = arg('medio');
const CUANTOS_TITULARES = Number(arg('titulares') ?? 12);

if (!MEDIO) {
    console.error('\n  Uso: npm run expediente -- --medio=<id>\n');
    console.error('  Los ids son los de shared/mediaRegistry.js: cambio, las2orillas, …\n');
    process.exit(1);
}

const medio = MEDIA_REGISTRY.find((m) => m.id === MEDIO);
if (!medio) {
    console.error(`\n  ✗ «${MEDIO}» no está en el registro.\n`);
    process.exit(1);
}

const estado = await checkConnection();
if (!estado.enabled) {
    console.error(`\n  ✗ Sin base de datos: ${estado.reason}\n`);
    process.exit(1);
}

const nombreDeTema = new Map(TEMAS.map((t) => [t.id, t.nombre ?? t.id]));
const registro = new Map(MEDIA_REGISTRY.map((m) => [m.id, m]));
const pc = (x, total) => (total ? `${((x / total) * 100).toFixed(1).padStart(5)} %` : '    — ');
const linea = (n = 74) => console.log('  ' + '─'.repeat(n));

console.log(`\n  EXPEDIENTE DE NIVEL 2 — ${medio.name}`);
linea();
console.log(`  id ${medio.id} · dominio ${medio.domain}`);
console.log(`  valor declarado hoy: ${medio.bias}  (${getBand(medio.bias)?.label ?? '—'})`);
console.log(`  medido el ${new Date().toISOString().slice(0, 10)} sobre los 30 días que guarda la base`);

// ── Nivel 1: ya existe. Se recuerda para tenerlo al lado, no se investiga ──
const propiedad = getOwnership(medio.id);
console.log(`\n  NIVEL 1 — ${propiedad ? 'YA DOCUMENTADO' : 'AUSENTE, Y SIN ÉL NO SE PUEDE FIRMAR'}`);
linea();
if (propiedad) {
    console.log(`  tipo de dueño: ${propiedad.ownerType ?? 'sin declarar'} · grupo: ${propiedad.controlGroup ?? '—'}`);
    for (const h of propiedad.holdings ?? []) console.log(`    · ${h}`);
    for (const n of propiedad.notes ?? []) console.log(`    nota: ${n}`);
    for (const f of propiedad.sources ?? []) console.log(`    fuente: ${f}`);
} else {
    console.log('  Regla 3 del protocolo: sin evidencia de nivel 1-3 no se mueve el número.');
}

// ── Volumen y cadencia ────────────────────────────────────────────────────
//
// `count(DISTINCT a.id)` Y NO `count(*)`, y la diferencia no es cosmética. El
// LEFT JOIN con `story_articles` devuelve una fila por cada historia en la que
// el artículo aparece, y un artículo APARECE EN VARIAS: el agrupamiento se
// rehace en cada ciclo y las historias que envejecen se congelan en vez de
// borrarse, así que una misma pieza queda dentro de la historia archivada de
// ayer y de la de hoy. Medido el 2026-09-09: 1 589 artículos del corpus están
// en más de una historia —y NINGUNO en más de una VIVA, que es lo que habría
// sido un defecto del producto—. Con `count(*)` el conteo se inflaba hasta un
// 17 % (RTVC daba 7 piezas por 6) y la cadencia salía de un divisor falso.
const { rows: vol } = await query(
    `SELECT count(DISTINCT a.id)::int AS articulos,
            count(DISTINCT sa.story_id)::int AS historias,
            count(DISTINCT sa.story_id) FILTER (WHERE st.archivada_el IS NULL)::int AS vivas,
            count(DISTINCT sa.story_id) FILTER (WHERE st.source_count > 1)::int AS multifuente,
            min(a.published_at) AS primera,
            max(a.published_at) AS ultima
       FROM articles a
       LEFT JOIN story_articles sa ON sa.article_id = a.id
       LEFT JOIN stories st ON st.id = sa.story_id
      WHERE a.source_id = $1`,
    [medio.id]
);
const v = vol[0];
const horasDeSerie = v.primera && v.ultima ? (new Date(v.ultima) - new Date(v.primera)) / 3.6e6 : 0;

console.log('\n  NIVEL 2 — VOLUMEN Y CADENCIA');
linea();
console.log(`  artículos en la base ....... ${v.articulos}`);
console.log(`  historias en las que entra . ${v.historias}  (${v.multifuente} compartidas con otro medio)`);
console.log(`  de ellas, hoy en el sitio .. ${v.vivas}  (el resto están archivadas)`);
console.log(`  última pieza ............... ${v.ultima ? new Date(v.ultima).toISOString().slice(0, 16).replace('T', ' ') : '—'}`);
if (horasDeSerie > 0 && v.articulos > 1) {
    console.log(`  una pieza cada ............. ${(horasDeSerie / (v.articulos - 1)).toFixed(1)} h`);
}
if (v.articulos < 10) {
    console.log('\n  ⚠ CON MENOS DE DIEZ PIEZAS, LO DE ABAJO NO SOSTIENE UNA CLASIFICACIÓN.');
    console.log('    Se imprime igual porque un hueco declarado se puede leer y uno');
    console.log('    escondido vuelve como objeción.');
}

// ── Temas, contra el corpus ───────────────────────────────────────────────
const { rows: suyos } = await query(
    `SELECT t AS tema, count(*)::int AS n
       FROM articles a, unnest(a.topics) AS t
      WHERE a.source_id = $1
      GROUP BY t ORDER BY n DESC`,
    [medio.id]
);
const { rows: corpus } = await query(
    `SELECT t AS tema, count(*)::int AS n FROM articles a, unnest(a.topics) AS t GROUP BY t`
);
const totalSuyos = suyos.reduce((s, r) => s + r.n, 0);
const totalCorpus = corpus.reduce((s, r) => s + r.n, 0);
const enCorpus = new Map(corpus.map((r) => [r.tema, r.n]));

console.log('\n  NIVEL 2 — QUÉ CUBRE, CONTRA LA AGENDA COMÚN');
linea();
if (!totalSuyos) {
    console.log('  Ninguna de sus piezas tiene tema clasificado.');
} else {
    console.log('  tema                      suyo     corpus    se aparta');
    for (const r of suyos.slice(0, 10)) {
        const proporcionSuya = r.n / totalSuyos;
        const proporcionComun = (enCorpus.get(r.tema) ?? 0) / totalCorpus;
        const veces = proporcionComun > 0 ? proporcionSuya / proporcionComun : null;
        console.log(
            `  ${(nombreDeTema.get(r.tema) ?? r.tema).padEnd(22)} ${pc(r.n, totalSuyos)}   ` +
            `${pc(enCorpus.get(r.tema) ?? 0, totalCorpus)}   ${veces ? `${veces.toFixed(1)}x` : '—'}`
        );
    }
    console.log('\n  «Se aparta» es cuántas veces más, o menos, que el corpus. Dice en qué se');
    console.log('  separa de la agenda común; NO dice desde dónde la cubre.');
}

// ── Co-cobertura ──────────────────────────────────────────────────────────
// ARCHIVO A PROPÓSITO. Este denominador cuenta TODAS las historias, vivas y
// archivadas, y tiene que hacerlo para que la elevación signifique algo: el
// numerador —las historias de cada medio— también las cuenta todas, porque una
// ficha mide treinta días de conducta y no la portada de hoy. Filtrar solo aquí
// haría que un medio con la mitad de sus historias congeladas saliera con el
// doble de elevación, que es un artefacto de la fecha en que se corrió el
// expediente. Medido el 2026-09-09: 8 674 vivas y 2 370 archivadas.
const { rows: totalHistorias } = await query(`SELECT count(*)::int AS n FROM stories`);
const historiasDelCorpus = totalHistorias[0].n || 1;

const { rows: socios } = await query(
    `WITH mias AS (
        SELECT DISTINCT sa.story_id
          FROM story_articles sa
          JOIN articles a ON a.id = sa.article_id
         WHERE a.source_id = $1
     ),
     porMedio AS (
        SELECT a.source_id, count(DISTINCT sa.story_id)::int AS total
          FROM story_articles sa
          JOIN articles a ON a.id = sa.article_id
         GROUP BY a.source_id
     ),
     juntas AS (
        SELECT a.source_id, count(DISTINCT sa.story_id)::int AS comun
          FROM story_articles sa
          JOIN articles a ON a.id = sa.article_id
         WHERE sa.story_id IN (SELECT story_id FROM mias)
           AND a.source_id <> $1
         GROUP BY a.source_id
     )
     SELECT j.source_id, s.name, j.comun, p.total
       FROM juntas j
       JOIN sources s ON s.id = j.source_id
       JOIN porMedio p ON p.source_id = j.source_id
      ORDER BY j.comun DESC
      LIMIT 12`,
    [medio.id]
);

console.log('\n  NIVEL 2 — CON QUIÉN COINCIDE');
linea();
if (!socios.length) {
    console.log('  Con nadie: ninguna de sus historias la cubre otro medio del catálogo.');
    console.log('  Mira el confusor de abajo antes de leer esto como agenda propia.');
} else {
    console.log('  común  elevación  medio (sesgo declarado)');
    for (const s of socios) {
        const esperado = (v.historias * s.total) / historiasDelCorpus;
        const elevacion = esperado > 0 ? s.comun / esperado : 0;
        const otro = registro.get(s.source_id);
        console.log(
            `  ${String(s.comun).padStart(5)}  ${elevacion.toFixed(1).padStart(8)}x  ${s.name} (${otro?.bias ?? '?'})`
        );
    }
    console.log('\n  El sesgo declarado se imprime para CONTRASTAR: no entró en el cálculo.');
    console.log('  Una elevación alta es agenda compartida; no dice de qué lado es ninguno.');
}

// ── Aislamiento, con su confusor al lado ─────────────────────────────────
const { rows: cuantosSocios } = await query(
    `WITH mias AS (
        SELECT DISTINCT sa.story_id
          FROM story_articles sa
          JOIN articles a ON a.id = sa.article_id
         WHERE a.source_id = $1
     )
     SELECT count(DISTINCT a.source_id)::int AS socios
       FROM story_articles sa
       JOIN articles a ON a.id = sa.article_id
      WHERE sa.story_id IN (SELECT story_id FROM mias)
        AND a.source_id <> $1`,
    [medio.id]
);

const { rows: parecidos } = await query(
    `WITH porMedio AS (
        SELECT a.source_id, s.name, count(DISTINCT sa.story_id)::int AS historias
          FROM articles a
          JOIN sources s ON s.id = a.source_id
          LEFT JOIN story_articles sa ON sa.article_id = a.id
         GROUP BY a.source_id, s.name
     )
     SELECT p.name, p.source_id, p.historias,
            (SELECT count(DISTINCT a2.source_id)::int
               FROM story_articles sa2
               JOIN articles a2 ON a2.id = sa2.article_id
              WHERE sa2.story_id IN (
                        SELECT DISTINCT sa3.story_id
                          FROM story_articles sa3
                          JOIN articles a3 ON a3.id = sa3.article_id
                         WHERE a3.source_id = p.source_id)
                AND a2.source_id <> p.source_id) AS socios
       FROM porMedio p
      WHERE p.source_id <> $1
        AND p.historias BETWEEN GREATEST($2::int - 5, 1) AND $2::int + 5
      ORDER BY abs(p.historias - $2::int)
      LIMIT 6`,
    [medio.id, v.historias]
);

console.log('\n  NIVEL 2 — AISLAMIENTO, Y SI EL VOLUMEN LO EXPLICA');
linea();
console.log(`  ${medio.name}: ${cuantosSocios[0].socios} socios con ${v.historias} historias`);
if (parecidos.length) {
    console.log('\n  medios de volumen parecido, para comparar:');
    for (const p of parecidos) {
        const otro = registro.get(p.source_id);
        console.log(
            `    ${String(p.socios).padStart(3)} socios  ${String(p.historias).padStart(3)} historias   ` +
            `${p.name} (${otro?.bias ?? '?'})`
        );
    }
}
console.log('\n  Si los de volumen parecido tienen bastantes más socios, el aislamiento es');
console.log('  suyo. Si tienen los mismos, es del tamaño de la muestra y no dice nada.');

// ── Titulares para leer ──────────────────────────────────────────────────
const { rows: titulares } = await query(
    `SELECT a.headline, a.published_at
       FROM articles a
      WHERE a.source_id = $1
      ORDER BY a.published_at DESC NULLS LAST
      LIMIT $2`,
    [medio.id, CUANTOS_TITULARES]
);

console.log(`\n  NIVEL 2 — SUS ÚLTIMOS ${titulares.length} TITULARES, LITERALES`);
linea();
for (const t of titulares) {
    const f = t.published_at ? new Date(t.published_at).toISOString().slice(0, 10) : '——————————';
    console.log(`  ${f}  ${t.headline}`);
}
console.log('\n  No se resumen ni se puntúan: promediar su carga con nuestro propio léxico');
console.log('  sería circular, y el protocolo lo excluye por escrito.');

linea();
console.log('  ESTO NO CLASIFICA A NADIE. El número lo pone y lo firma Jose.');
console.log(`  Protocolo: PROTOCOLO_JUICIO_EDITORIAL.md · Ficha: fichas/${medio.id}.md\n`);

await closePool();
