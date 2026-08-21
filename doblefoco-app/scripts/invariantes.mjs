/**
 * INVARIANTES DE PRODUCCIÓN — comprobar que lo que el sitio dice es POSIBLE.
 *
 * Ejecutar:  npm run invariantes
 *            npm run invariantes -- --strict            (sale 1 si algo falla)
 *            npm run invariantes -- --api=http://localhost:5000
 *            npm run invariantes -- --resumen=/tmp/r.json
 *
 * POR QUÉ EXISTE, Y ES LA LECCIÓN DEL 2026-08-19
 * ----------------------------------------------
 * Ese día se encontró que `hydrateArticles` no leía `articles.topics` ni
 * `articles.ambito`. Consecuencia: 99 de cada 100 historias sin tema, y el
 * catálogo entero marcado como nacional con la API respondiendo
 * `internacional: 0`. Llevaba así sabe Dios cuánto.
 *
 * **Nada chilló.** Ni las 557 pruebas, ni el lint, ni `tsc`, ni `vigilancia.yml`
 * —que comprueba que el sitio esté EN PIE—, ni la auditoría —que comprueba el
 * mundo EXTERIOR: feeds, fuentes, rutas ajenas—. Ninguna pieza del sistema tenía
 * una opinión sobre si nuestra propia salida era posible.
 *
 * Esto la tiene.
 *
 * ── LA REGLA DE ORO DE ESTE ARCHIVO ────────────────────────────────────────
 *
 * **UNA CONTRADICCIÓN, NUNCA UN UMBRAL.** No se comprueba «el 40 % de las
 * historias debería tener tema»: ese número no lo respalda nada, envejece, y el
 * día que falle nadie sabrá si el sitio está roto o si el umbral estaba mal
 * puesto. Se comprueba que el sitio **no se contradiga a sí mismo**: si filtrar
 * por un tema devuelve historias, entonces es imposible que ninguna historia
 * tenga tema. Eso no necesita número, no envejece, y cuando falla es siempre un
 * fallo de verdad.
 *
 * Es la misma disciplina que ya rige el panel del catálogo, donde se decidió no
 * inventar un umbral de caducidad para las fichas porque no había medida que lo
 * respaldara.
 *
 * ── LO QUE ESTO NO ES ──────────────────────────────────────────────────────
 *
 * No es un monitor de disponibilidad —eso ya lo hace `vigilancia.yml`— ni mide
 * calidad editorial. Solo responde una pregunta: **¿puede ser cierto a la vez
 * todo lo que la API está diciendo?**
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import pg from 'pg';

import { MEDIA_REGISTRY } from '../shared/mediaRegistry.js';
import { TEMAS } from '../shared/topicClassifier.js';
import { USER_AGENT } from '../shared/userAgent.js';

const arg = (nombre) =>
    process.argv.find((a) => a.startsWith(`--${nombre}=`))?.slice(nombre.length + 3);

const STRICT = process.argv.includes('--strict');
const RUTA_RESUMEN = arg('resumen');
const API = (arg('api') ?? process.env.API_URL ?? 'https://doblefoco.fly.dev').replace(/\/+$/, '');

const TIMEOUT_MS = 30_000;

/*
 * En local lee `.env.local`; en Actions no existe y `DATABASE_URL` llega del
 * entorno. Mismo arreglo que `comprobarMedios.mjs`, que ya corre en vigilancia.
 */
dotenv.config({
    path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local'),
    quiet: true,
});

async function pedir(ruta) {
    const control = new AbortController();
    const alarma = setTimeout(() => control.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(`${API}${ruta}`, {
            signal: control.signal,
            headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } finally {
        clearTimeout(alarma);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Los invariantes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cada uno declara **con qué se contradice**, no qué valor espera. El campo
 * `contradice` es obligatorio y es lo que se imprime cuando falla: un invariante
 * que no sabe explicar por qué es imposible lo que vio no sirve de aviso.
 */
const invariantes = [];

const invariante = (nombre, contradice, comprobar) =>
    invariantes.push({ nombre, contradice, comprobar });

invariante(
    'las historias tienen tema',
    'la base sí sabe filtrar por tema, así que es imposible que ninguna historia lo tenga',
    async (ctx) => {
        const conTema = ctx.portada.filter((s) => (s.topics ?? []).length > 0).length;
        if (conTema > 0) return { ok: true, detalle: `${conTema}/${ctx.portada.length} con tema` };

        /*
         * Cero historias con tema en la página. Solo es un fallo si la base SÍ
         * tiene historias con tema — y eso se le pregunta a la propia API. Si
         * tampoco filtra nada, el catálogo puede estar legítimamente sin
         * clasificar todavía, y acusar sería inventarse un umbral.
         */
        const conFiltro = await Promise.all(
            TEMAS.slice(0, 6).map((t) =>
                pedir(`/api/feed?temas=${encodeURIComponent(t.id)}&limit=1`)
                    .then((r) => ({ id: t.id, n: r.stories?.length ?? 0 }))
                    .catch(() => ({ id: t.id, n: 0 })),
            ),
        );
        const filtran = conFiltro.filter((c) => c.n > 0);

        if (!filtran.length)
            return { ok: true, detalle: 'ninguna historia tiene tema, y la base tampoco: coherente' };

        return {
            ok: false,
            detalle:
                `ninguna de las ${ctx.portada.length} historias trae tema, pero filtrar por ` +
                `«${filtran[0].id}» sí devuelve historias. Los temas están en la base y no llegan a la salida`,
        };
    },
);

invariante(
    'existe lo internacional',
    'el catálogo tiene medios de fuera de Colombia, así que no pueden ser cero',
    async (ctx) => {
        const deFuera = MEDIA_REGISTRY.filter((m) => m.country && m.country !== 'CO');
        if (!deFuera.length) return { ok: true, detalle: 'el catálogo no tiene medios de fuera' };

        const n = ctx.counts?.internacional ?? 0;
        if (n > 0) return { ok: true, detalle: `${n} historias internacionales` };

        return {
            ok: false,
            detalle:
                `el catálogo tiene ${deFuera.length} medios de fuera de Colombia ` +
                `(${deFuera.slice(0, 3).map((m) => m.shortName || m.name).join(', ')}…) ` +
                'y la API responde internacional: 0',
        };
    },
);

invariante(
    'las cuentas cuadran entre sí',
    'una parte no puede ser mayor que el todo',
    async (ctx) => {
        const { total, multifuente, nacional, internacional } = ctx.counts ?? {};
        const fallos = [];
        if (multifuente > total) fallos.push(`multifuente ${multifuente} > total ${total}`);
        if (nacional + internacional > total)
            fallos.push(`nacional+internacional ${nacional + internacional} > total ${total}`);
        if (ctx.portada.length > ctx.limite)
            fallos.push(`la página trae ${ctx.portada.length} con limit=${ctx.limite}`);

        return fallos.length
            ? { ok: false, detalle: fallos.join('; ') }
            : { ok: true, detalle: `total ${total}, multifuente ${multifuente}` };
    },
);

invariante(
    'cada titular viene de un medio del catálogo',
    'el sitio no puede atribuir una noticia a un medio que no tiene ficha',
    async (ctx) => {
        const conocidos = new Set(MEDIA_REGISTRY.map((m) => m.id));
        const intrusos = [
            ...new Set(
                ctx.portada
                    .map((s) => s.titleOutletId)
                    .filter((id) => id && !conocidos.has(id)),
            ),
        ];

        return intrusos.length
            ? { ok: false, detalle: `medios sin ficha: ${intrusos.join(', ')}` }
            : { ok: true, detalle: `${ctx.portada.length} titulares, todos del catálogo` };
    },
);

invariante(
    'ninguna historia está vacía',
    'una historia sin fuentes no es una historia',
    async (ctx) => {
        const vacias = ctx.portada.filter((s) => !(s.sources ?? []).length || !s.articleCount);
        return vacias.length
            ? { ok: false, detalle: `${vacias.length} historia(s) sin fuentes o sin artículos` }
            : { ok: true, detalle: `${ctx.portada.length} historias, todas con fuentes` };
    },
);

invariante(
    'el espectro dominante coincide con el sesgo medio',
    'no se puede decir que una historia la cubre la izquierda y a la vez que su sesgo medio es de derecha',
    async (ctx) => {
        const banda = (b) => (b <= -0.2 ? 'left' : b >= 0.2 ? 'right' : 'center');
        const raros = ctx.portada.filter((s) => {
            if (typeof s.meanBias !== 'number' || !s.dominantSpectrum) return false;
            // Solo se acusa el contrasentido franco: izquierda contra derecha.
            const b = banda(s.meanBias);
            return (b === 'left' && s.dominantSpectrum === 'right') ||
                   (b === 'right' && s.dominantSpectrum === 'left');
        });

        return raros.length
            ? { ok: false, detalle: `${raros.length} historia(s) con espectro y sesgo opuestos` }
            : { ok: true, detalle: 'sin contrasentidos' };
    },
);

/**
 * EL INVARIANTE QUE DE VERDAD CAZA EL FALLO DEL 2026-08-19, Y POR QUÉ LOS DE
 * ARRIBA NO BASTAN.
 *
 * Al escribir esto, los seis invariantes de la API pasaban: 42 de 100 historias
 * traían tema. Y sin embargo el fallo seguía ahí. La razón es que **el daño no
 * es permanente sino que se rehace en cada arranque**: al reiniciar, el motor
 * rehidrata los artículos desde la base sin sus temas y reconstruye las
 * historias vacías; después, la ingesta fresca va devolviendo temas a las
 * historias nuevas. Medido poco después de un despliegue daba 1 de 100; medido
 * un rato después, 42.
 *
 * Un invariante que solo se rompe en el peor momento no vale: avisaría el día
 * del despliegue y callaría el resto de la semana con el defecto puesto.
 *
 * Este mira donde la contradicción SIEMPRE está visible: en la base. Una
 * historia se compone con la unión de los temas de sus artículos, así que **una
 * historia sin ningún tema cuyos artículos SÍ tengan tema es imposible por
 * construcción**. No hace falta umbral, no envejece, y cuando falla es siempre
 * un fallo de verdad.
 *
 * Necesita `DATABASE_URL`. Sin ella no se acusa nada: se dice que no se pudo
 * comprobar, que no es lo mismo.
 */
async function invarianteDeLaUnion() {
    if (!process.env.DATABASE_URL?.trim()) {
        return { ok: null, detalle: 'sin DATABASE_URL: no se pudo comprobar' };
    }

    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)
            ? false
            : { rejectUnauthorized: false },
        max: 1,
    });

    try {
        const { rows } = await pool.query(`
            SELECT count(*)::int AS rotas
              FROM stories s
             WHERE cardinality(coalesce(s.topics, '{}')) = 0
               AND EXISTS (
                   SELECT 1
                     FROM story_articles sa
                     JOIN articles a ON a.id = sa.article_id
                    WHERE sa.story_id = s.id
                      AND cardinality(coalesce(a.topics, '{}')) > 0
               )
        `);

        const rotas = rows[0]?.rotas ?? 0;
        return rotas === 0
            ? { ok: true, detalle: 'ninguna historia pierde los temas de sus artículos' }
            : {
                  ok: false,
                  detalle:
                      `${rotas} historia(s) no tienen ningún tema aunque alguno de sus ` +
                      'artículos sí lo tiene. Los temas se escriben y no se leen',
              };
    } catch (error) {
        return { ok: null, detalle: `no se pudo consultar la base: ${error?.message}` };
    } finally {
        await pool.end().catch(() => {});
    }
}

invariante(
    'la historia conserva los temas de sus artículos',
    'una historia se compone con la UNIÓN de los temas de sus artículos: no puede tener menos que ellos',
    invarianteDeLaUnion,
);

// ─────────────────────────────────────────────────────────────────────────────
//  Recorrido
// ─────────────────────────────────────────────────────────────────────────────

console.log(`Comprobando invariantes contra ${API}`);
console.log(`Fecha: ${new Date().toISOString()}`);
console.log();

let ctx;
try {
    const limite = 100;
    const feed = await pedir(`/api/feed?limit=${limite}`);
    ctx = { portada: feed.stories ?? [], counts: feed.counts ?? {}, limite };
} catch (error) {
    /*
     * Que la API no conteste NO es un invariante roto: es que no se pudo mirar.
     * Es la misma distinción que la auditoría hace con los feeds y con las
     * fuentes, y `vigilancia.yml` ya cubre la disponibilidad. Se sale con 2 para
     * que el flujo pueda separarlo de un invariante violado, que sale con 1.
     */
    console.error(`No se pudo leer la API: ${error?.message ?? error}`);
    console.error('Esto NO dice que los invariantes fallen: dice que no se pudieron comprobar.');
    process.exit(2);
}

const resultados = [];
for (const inv of invariantes) {
    try {
        const r = await inv.comprobar(ctx);
        resultados.push({ ...inv, ...r });
    } catch (error) {
        resultados.push({ ...inv, ok: null, detalle: `no se pudo comprobar: ${error?.message}` });
    }
}

const rotos = resultados.filter((r) => r.ok === false);
const dudosos = resultados.filter((r) => r.ok === null);

for (const r of resultados) {
    const marca = r.ok === true ? '✓' : r.ok === false ? '✗' : '?';
    console.log(`${marca}  ${r.nombre}`);
    console.log(`      ${r.detalle}`);
    if (r.ok === false) console.log(`      IMPOSIBLE PORQUE: ${r.contradice}`);
}

console.log();
console.log(
    `${resultados.length - rotos.length - dudosos.length}/${resultados.length} invariantes se cumplen` +
        (dudosos.length ? ` · ${dudosos.length} no se pudieron comprobar` : ''),
);

if (rotos.length) {
    console.log();
    console.log('LO QUE ESTO SIGNIFICA. Un invariante roto no es una métrica fea: es que el');
    console.log('sitio está diciendo dos cosas que no pueden ser ciertas a la vez. Casi');
    console.log('siempre quiere decir que un dato se escribe y no se lee, o al revés.');
}

if (RUTA_RESUMEN) {
    writeFileSync(
        RUTA_RESUMEN,
        `${JSON.stringify(
            {
                fecha: new Date().toISOString().slice(0, 10),
                api: API,
                total: resultados.length,
                rotos: rotos.length,
                dudosos: dudosos.length,
                nombres: rotos.map((r) => r.nombre),
            },
            null,
            4,
        )}\n`,
        'utf8',
    );
}

if (STRICT && rotos.length) process.exit(1);
