/**
 * LA PASADA DE ACCESIBILIDAD: axe sobre las páginas, en los dos temas.
 *
 *     npm run accesibilidad
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ EXISTE (2026-09-22, M1.6 del plan del MVP)
 * ─────────────────────────────────────────────────────────────────────────────
 * La primera pasada encontró 146 textos con contraste insuficiente, un buscador
 * que el lector de pantalla no anunciaba en ninguna de las 22 vistas, y un mapa
 * cuyos puntos se saltaba porque el gráfico se declaraba «imagen». Nada de eso
 * rompía una prueba ni se veía en `mirar`: `mirar` comprueba que lo que se
 * pinta se pueda leer con los ojos que lo miran, y esto, que se pueda leer con
 * los que no. Casi todo salía de UNA variable —el gris secundario daba 4,34
 * contra el 4,5 de WCAG AA— y por eso conviene que se vuelva a mirar sola.
 *
 * QUÉ HACE Y QUÉ NO. Pasa las reglas WCAG 2 A y AA de axe por las mismas rutas
 * que `mirar`, más una noticia real, en tema claro y oscuro. Sale con 1 si hay
 * algo crítico o serio. **No es una auditoría completa**: axe caza alrededor de
 * un tercio de los problemas de accesibilidad. Lo demás —el orden del foco, lo
 * que anuncia un lector de verdad, el uso con teclado— sigue pidiendo una
 * persona (F3-11).
 */

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const RUTAS = [
    '/',
    '/categorias',
    '/tendencias',
    '/mapa-medios',
    '/transparencia',
    '/transparencia/sobre-nosotros',
    '/transparencia/clasificacion',
    '/transparencia/dinero',
    '/transparencia/datos',
    '/transparencia/limitaciones',
];

/** La clave con la que `ThemeProvider` recuerda el tema. */
const CLAVE_TEMA = 'doblefoco-theme';
const PUERTO = 5395;
const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PUERTO), '--strictPort'], {
    env: { ...process.env, VITE_API_URL: 'same-origin' },
    stdio: 'ignore',
});
const base = `http://localhost:${PUERTO}`;

try {
    for (let i = 0; i < 120; i += 1) {
        try { await fetch(base); break; } catch { await new Promise((listo) => setTimeout(listo, 500)); }
    }

    // La noticia, igual que en `mirar`: la historia con más medios del feed.
    const rutas = [...RUTAS];
    for (let intento = 1; intento <= 3; intento += 1) {
        try {
            const { stories = [] } = await (await fetch(`${base}/api/feed?limit=40`)).json();
            const medios = (s) => (Array.isArray(s.sources) ? s.sources.length : 0);
            const mejor = [...stories].sort((a, b) => medios(b) - medios(a))[0];
            if (mejor) { rutas.push(`/noticia/${mejor.id}`); break; }
        } catch { /* se reintenta */ }
        await new Promise((listo) => setTimeout(listo, 3_000));
    }

    const navegador = await chromium.launch();
    const hallazgos = new Map();

    for (const tema of ['light', 'dark']) {
        const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
        await ctx.addInitScript(([clave, t]) => { try { localStorage.setItem(clave, t); } catch { /* sin almacenamiento */ } }, [CLAVE_TEMA, tema]);
        const pagina = await ctx.newPage();

        for (const ruta of rutas) {
            await pagina.goto(base + ruta, { waitUntil: 'networkidle', timeout: 60_000 }).catch(() => {});
            await pagina.waitForTimeout(3_000);
            await pagina.addScriptTag({ content: AXE });
            const violaciones = await pagina.evaluate(async () => {
                // eslint-disable-next-line no-undef
                const r = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] });
                return r.violations.map((v) => ({
                    id: v.id,
                    impacto: v.impact,
                    ayuda: v.help,
                    nodos: v.nodes.map((n) => `${n.target.join(' ')} — ${(n.failureSummary ?? '').split('\n')[1] ?? ''}`.trim()),
                }));
            });
            for (const v of violaciones) {
                const clave = `${v.impacto} · ${v.id}`;
                const h = hallazgos.get(clave) ?? { ayuda: v.ayuda, vistas: new Set(), ejemplos: [] };
                h.vistas.add(`${tema}:${ruta}`);
                h.ejemplos.push(...v.nodos.slice(0, 2));
                hallazgos.set(clave, h);
            }
        }
        await ctx.close();
    }
    await navegador.close();

    const orden = { critical: 0, serious: 1, moderate: 2, minor: 3 };
    const lista = [...hallazgos.entries()].sort((a, b) => orden[a[0].split(' ')[0]] - orden[b[0].split(' ')[0]]);
    for (const [clave, h] of lista) {
        console.log(`\n${clave} — ${h.ayuda}`);
        console.log(`   en ${h.vistas.size} vistas: ${[...h.vistas].slice(0, 6).join(' ')}`);
        for (const e of h.ejemplos.slice(0, 3)) console.log(`   · ${e.slice(0, 200)}`);
    }

    const graves = lista.filter(([clave]) => /^(critical|serious)/.test(clave)).length;
    console.log(`\n${rutas.length} rutas × 2 temas. ${lista.length ? `${lista.length} regla(s) incumplida(s), ${graves} crítica(s) o seria(s).` : 'axe no encuentra nada.'}`);
    process.exitCode = graves ? 1 : 0;
} finally {
    vite.kill();
}
