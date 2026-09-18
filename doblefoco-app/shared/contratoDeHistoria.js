// @ts-check

/**
 * EL CONTRATO DE UNA HISTORIA: qué manda el motor y qué hace el cliente con ello.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Entre `componerHistoria` (server/db/feedStore.js) y `normalizeStory`
 * (src/lib/story.js) hay una costura, y las costuras son el punto ciego de este
 * proyecto. El cliente **construye un objeto nuevo campo a campo**, así que un
 * campo que el motor mande y el normalizador no copie **desaparece sin error**:
 * sin excepción, sin aviso en consola, sin prueba en rojo. La pantalla
 * simplemente no lo enseña.
 *
 * No es hipotético, ha pasado tres veces y las tres están escritas en el código
 * que las sufrió:
 *
 *   · `image` — llegaba en la respuesta, se perdía aquí, y la portada no pintaba
 *     ninguna foto.
 *   · `blindspot` — 6 299 historias con cero puntos ciegos y una pestaña que
 *     solo podía enseñar su estado vacío (2026-08-21).
 *   · `ausencia` — se coló por la misma puerta cuatro días después.
 *
 * Una revisión externa lo llamó «el arreglo más barato de toda la lista, y
 * habría cazado el fallo más caro». Esto es ese arreglo: **una sola lista, leída
 * desde los dos lados**, y una prueba de ida y vuelta que la obliga a estar al
 * día. Añadir un campo al motor sin decidir qué hace el cliente con él deja de
 * ser posible en silencio: la prueba se pone roja pidiendo una línea aquí.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAS DOS CATEGORÍAS, Y POR QUÉ NO BASTA UNA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   `copia`  el cliente lo deja pasar tal cual. Si se pierde, es un defecto.
 *   `deriva` el cliente NO lo copia, y está bien: o lo recalcula contra el
 *            catálogo —que es la razón de ser de `normalizeStory`— o no lo
 *            necesita ninguna pantalla. Lleva escrito el motivo.
 *
 * Marcar todo como `copia` habría sido más simple y habría mentido: el cliente
 * resuelve las fuentes contra `mediaRegistry` a propósito, para que el catálogo
 * sea la fuente de verdad de hecho y no solo de intención.
 */

/*
 * LO QUE ESTA LISTA ENCONTRO EN SU PRIMERA PASADA, RESUELTO EL 2026-09-16.
 *
 * `summary` no estaba aqui porque el motor no lo mandaba, y la interfaz lo
 * leia en seis sitios que no podian pintarse nunca — el buscador incluido,
 * que decia buscar en el resumen y solo buscaba en el titular. Era decision
 * de producto y Jose la dicto en la sesion del 16-09 (punto 8): el motor lo
 * manda, y el texto es el `snippet` del articulo que pone el titular — nunca
 * de la casa. Desde entonces los tres bloques `{story.summary && ...}` se
 * pintan y el buscador hace lo que promete.
 */

/**
 * @typedef {{ trato: 'copia' | 'deriva', motivo?: string }} CampoDeHistoria
 * @type {Record<string, CampoDeHistoria>}
 */
export const CAMPOS_DE_HISTORIA = {
    id: { trato: 'copia' },
    title: { trato: 'copia' },
    category: { trato: 'copia' },
    topics: { trato: 'copia' },
    ambito: { trato: 'copia' },
    publishedAt: { trato: 'copia' },
    image: { trato: 'copia' },
    timeline: { trato: 'copia' },
    toneSummary: { trato: 'copia' },
    articles: { trato: 'copia' },
    archivadaEl: { trato: 'copia' },
    summary: {
        trato: 'copia',
        motivo:
            'el snippet LITERAL del artículo que pone el titular, o null si esa ' +
            'pieza no trae entradilla (decisión de Jose, 2026-09-16). Nunca de ' +
            'la casa, y sin caída a otra pieza: prosa corrida bajo un titular ' +
            'ajeno sería atribuir texto de otro medio.',
    },

    factuality: {
        trato: 'copia',
        motivo:
            'se copia si viene, y si no se calcula como media de las fuentes ya ' +
            'resueltas contra el catálogo. Las dos vías dan un número, nunca una ' +
            'constante disfrazada de medición.',
    },

    sources: {
        trato: 'deriva',
        motivo:
            'se RESUELVEN contra el catálogo: el sesgo sale de mediaRegistry aunque ' +
            'la respuesta traiga otro valor. Es lo que hace del catálogo la fuente ' +
            'de verdad de hecho y no solo de intención.',
    },
    coverage: {
        trato: 'deriva',
        motivo:
            'se recalcula con las fuentes ya resueltas —si no, una revisión de ' +
            'sesgo dejaría la cobertura vieja— PERO el veredicto del punto ciego ' +
            '(`blindspot` y `ausencia`) se trasplanta del servidor tal cual: el ' +
            'cliente no tiene las tasas base del corpus.',
    },
    perspectives: {
        trato: 'deriva',
        motivo: 'cada perspectiva se normaliza a {outlet, headline, snippet, url, bias}.',
    },

    titleOutlet: { trato: 'deriva', motivo: 'el medio del titular ya viaja dentro de `sources`.' },
    titleOutletId: { trato: 'deriva', motivo: 'ídem: el id sale del catálogo al resolver.' },
    titleUrl: { trato: 'deriva', motivo: 'ídem: la URL del titular está en su fuente.' },
    firstSeenAt: {
        trato: 'deriva',
        motivo: 'la pantalla fecha por `publishedAt`; el primer avistamiento es de la cronología.',
    },
    departamento: {
        trato: 'deriva',
        motivo: 'lo consume el mapa desde su propio recuento por departamento, no la tarjeta.',
    },
    articleCount: {
        trato: 'deriva',
        motivo: 'el cliente cuenta `articles.length`, que no puede desincronizarse.',
    },
    meanBias: { trato: 'deriva', motivo: 'lo recalcula `analyzeCoverage` con las fuentes resueltas.' },
    polarization: { trato: 'deriva', motivo: 'ídem.' },
    coveragePercentages: { trato: 'deriva', motivo: 'ídem.' },
    dominantSpectrum: { trato: 'deriva', motivo: 'ídem.' },
    insufficientCoverage: { trato: 'deriva', motivo: 'ídem.' },
    blindspot: {
        trato: 'deriva',
        motivo:
            'no se pierde: entra en `coverage.blindspot`. Se trasplanta y NO se ' +
            'recalcula, porque la tasa base del corpus solo la tiene el servidor.',
    },
    ausencia: { trato: 'deriva', motivo: 'ídem que `blindspot`, y por la misma puerta se coló.' },
};

/** Los que el cliente tiene que dejar pasar intactos. */
export const CAMPOS_QUE_SE_COPIAN = Object.entries(CAMPOS_DE_HISTORIA)
    .filter(([, c]) => c.trato === 'copia')
    .map(([nombre]) => nombre);
