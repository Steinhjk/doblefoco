/**
 * Decisiones de moderación — tarea F2-02.
 *
 * Lo que cambia respecto a antes: las aprobaciones vivían en el localStorage de
 * un navegador. Dos personas del equipo veían cosas distintas, un borrado de
 * datos del navegador perdía el trabajo, y los visitantes no veían nada de
 * ello. El panel no era un CMS, era una nota adhesiva.
 *
 * Modelo
 * ------
 * Una fila de `moderation` es una DECISIÓN sobre una historia, no una copia de
 * ella. La historia sigue viviendo en `stories`, se recalcula en cada ciclo de
 * ingesta y puede cambiar de forma; lo que se conserva es quién dijo qué sobre
 * ella y cuándo.
 *
 * "Pendiente" no es un estado almacenado: es la ausencia de fila. Guardarlo
 * explícitamente daría dos representaciones de lo mismo y obligaría a cada
 * consulta a contemplar las dos.
 */

import { safeQuery, query } from './pool.js';

/**
 * Historias todavía sin decidir, de la más cubierta a la más reciente.
 *
 * El mismo orden que usa el feed: primero las que reúnen más medios distintos,
 * porque son las que de verdad comparan encuadres y las que más se pierde nadie
 * si se quedan sin revisar.
 */
export async function listPending({ limit = 50, offset = 0 } = {}) {
    const result = await safeQuery(
        `
        SELECT s.id, s.title, s.category, s.published_at, s.factuality,
               s.coverage_left, s.coverage_center, s.coverage_right,
               s.dominant_spectrum, s.insufficient_coverage, s.blindspot_spectrum,
               src.name AS title_source,
               (SELECT count(*)::int FROM story_articles sa WHERE sa.story_id = s.id) AS article_count
          FROM stories s
          LEFT JOIN moderation m ON m.story_id = s.id
          LEFT JOIN sources   src ON src.id = s.title_source_id
         WHERE m.story_id IS NULL
         ORDER BY (s.coverage_left + s.coverage_center + s.coverage_right) DESC,
                  s.published_at DESC NULLS LAST
         LIMIT $1 OFFSET $2
        `,
        [limit, offset],
        'listado de pendientes'
    );

    if (!result) return null;
    return result.rows.map(toStorySummary);
}

/** Decisiones ya tomadas, con quién las tomó. */
export async function listDecided({ state = null, limit = 50, offset = 0 } = {}) {
    const result = await safeQuery(
        `
        SELECT s.id, s.title, s.category, s.published_at, s.factuality,
               s.coverage_left, s.coverage_center, s.coverage_right,
               s.dominant_spectrum, s.insufficient_coverage, s.blindspot_spectrum,
               src.name AS title_source,
               (SELECT count(*)::int FROM story_articles sa WHERE sa.story_id = s.id) AS article_count,
               m.state, m.reason, m.decided_at,
               u.email AS reviewer_email, u.display_name AS reviewer_name
          FROM moderation m
          JOIN stories     s ON s.id = m.story_id
          JOIN admin_users u ON u.id = m.reviewer_id
          LEFT JOIN sources src ON src.id = s.title_source_id
         WHERE ($1::text IS NULL OR m.state = $1)
         ORDER BY m.decided_at DESC
         LIMIT $2 OFFSET $3
        `,
        [state, limit, offset],
        'listado de decididas'
    );

    if (!result) return null;

    return result.rows.map((row) => ({
        ...toStorySummary(row),
        state: row.state,
        reason: row.reason,
        decidedAt: row.decided_at,
        reviewer: row.reviewer_name || row.reviewer_email,
    }));
}

/**
 * Registra una decisión. Sobrescribe la anterior si la había: rectificar es
 * parte del trabajo editorial, y el registro guarda siempre la vigente junto a
 * quién la firmó.
 *
 * @returns {Promise<{state:string, decidedAt:string}|null>} null si la historia no existe
 */
export async function decide({ storyId, state, reviewerId, reason = null }) {
    if (!['aprobada', 'rechazada'].includes(state)) {
        throw new Error(`Estado no válido: ${state}`);
    }

    // Se comprueba antes para poder responder 404 en vez de dejar que salte la
    // clave foránea y devolver un 500 que no le dice nada a nadie.
    const exists = await query('SELECT 1 FROM stories WHERE id = $1', [storyId]);
    if (!exists.rowCount) return null;

    const { rows } = await query(
        `
        INSERT INTO moderation (story_id, state, reviewer_id, reason)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (story_id) DO UPDATE SET
            state       = EXCLUDED.state,
            reviewer_id = EXCLUDED.reviewer_id,
            reason      = EXCLUDED.reason,
            decided_at  = now()
        RETURNING state, decided_at
        `,
        [storyId, state, reviewerId, reason?.trim() || null]
    );

    return { state: rows[0].state, decidedAt: rows[0].decided_at };
}

/** Retira una decisión y devuelve la historia a la cola. */
export async function undecide(storyId) {
    const { rowCount } = await query('DELETE FROM moderation WHERE story_id = $1', [storyId]);
    return rowCount;
}

/**
 * Ids de las historias RECHAZADAS.
 *
 * Es lo que el feed público tiene que ocultar. Se devuelve la lista de
 * rechazadas y no la de aprobadas porque el modelo editorial elegido es
 * publicar todo y moderar para RETIRAR:
 *
 *   · Filtrar por aprobación dejaría el sitio vacío hasta que alguien revisara
 *     un millar de historias a mano, y a ese ritmo o va siempre desactualizado
 *     o se aprueba en bloque sin mirar, que es lo mismo que no moderar pero con
 *     la mentira añadida de que hubo revisión.
 *   · Las garantías del producto —titulares literales, enlace verificable,
 *     ausencia declarada— las da el motor, no una persona dando a un botón.
 *
 * La lista de rechazadas es pequeña por construcción, así que cabe en memoria
 * y se consulta sin tocar la base en cada petición.
 *
 * @returns {Promise<Set<string>>} vacío si no hay base: ante la duda se
 *   publica, que es el fallo menos grave de los dos.
 */
export async function rejectedStoryIds() {
    const result = await safeQuery(
        `SELECT story_id FROM moderation WHERE state = 'rechazada'`,
        [],
        'lista de rechazadas'
    );

    return new Set((result?.rows ?? []).map((r) => r.story_id));
}

/** Cuántas hay en cada estado. Para las cifras de cabecera del panel. */
export async function counts() {
    const result = await safeQuery(
        `
        SELECT
            (SELECT count(*)::int FROM stories s
              LEFT JOIN moderation m ON m.story_id = s.id
             WHERE m.story_id IS NULL)                                  AS pendientes,
            (SELECT count(*)::int FROM moderation WHERE state='aprobada')  AS aprobadas,
            (SELECT count(*)::int FROM moderation WHERE state='rechazada') AS rechazadas
        `,
        [],
        'conteo de moderación'
    );

    return result?.rows[0] ?? null;
}

/** Forma común de una historia en el panel. */
function toStorySummary(row) {
    return {
        id: row.id,
        title: row.title,
        titleSource: row.title_source,
        category: row.category,
        publishedAt: row.published_at,
        factuality: row.factuality,
        articleCount: row.article_count,
        coverage: {
            left: row.coverage_left,
            center: row.coverage_center,
            right: row.coverage_right,
        },
        dominantSpectrum: row.dominant_spectrum,
        insufficientCoverage: row.insufficient_coverage,
        blindspotSpectrum: row.blindspot_spectrum,
    };
}
