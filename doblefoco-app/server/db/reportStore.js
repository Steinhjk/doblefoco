/**
 * Reportes del lector — tarea F2-07.
 *
 * QUÉ SON Y QUÉ NO SON
 * --------------------
 * NO son validación comunitaria. Un voto de lectores anónimos no valida un
 * análisis de cobertura, y publicar "el 84 % está de acuerdo" sería repetir el
 * fallo que corrigió F0-08: una constante decorativa presentada como medición.
 *
 * Son INSTRUMENTACIÓN. Las cuatro categorías de desacuerdo que ofrece la
 * interfaz corresponden una a una con las preguntas abiertas más difíciles del
 * proyecto, y hasta ahora cada respuesta se tiraba a la basura:
 *
 *   falta-izquierda / falta-derecha  → F1-12, equilibrio del catálogo
 *   medio-mal-clasificado            → F1-13, revisión de los valores de sesgo
 *   historias-distintas              → F1-05, fusiones incorrectas
 *
 * Esa última es exactamente la señal que costó etiquetar 72 pares a mano, pero
 * continua y sobre tráfico real.
 *
 * DÓNDE SE VEN: solo en el panel, nunca en el sitio público. Un contador
 * visible invita a inflarlo, y además convertiría una pista en un veredicto.
 */

import { query, safeQuery } from './pool.js';

export const REPORT_KINDS = [
    'preciso',
    'falta-izquierda',
    'falta-derecha',
    'medio-mal-clasificado',
    'historias-distintas',
];

/** Los que señalan un posible defecto. 'preciso' es conformidad, no señal. */
export const PROBLEM_KINDS = REPORT_KINDS.filter((k) => k !== 'preciso');

/**
 * Registra un reporte.
 *
 * @returns {Promise<boolean>} false si la historia no existe. Se comprueba para
 *   poder responder 404 en vez de dejar que salte la clave foránea y devolver
 *   un 500 que no explica nada.
 */
export async function recordReport(storyId, kind) {
    if (!REPORT_KINDS.includes(kind)) {
        throw new Error(`Tipo de reporte no válido: ${kind}`);
    }

    const exists = await query('SELECT 1 FROM stories WHERE id = $1', [storyId]);
    if (!exists.rowCount) return false;

    await query('INSERT INTO reader_reports (story_id, kind) VALUES ($1, $2)', [storyId, kind]);
    return true;
}

/**
 * Historias con más reportes de problema, para la cola de revisión del panel.
 *
 * Se ordena por número de reportes de PROBLEMA, no por total: una historia con
 * cien "preciso" y dos "historias-distintas" merece la misma atención que otra
 * con solo esos dos. Lo que interesa es la señal, no el respaldo.
 */
export async function storiesNeedingReview({ days = 14, limit = 20 } = {}) {
    const result = await safeQuery(
        `
        SELECT r.story_id,
               s.title,
               count(*) FILTER (WHERE r.kind <> 'preciso')::int AS problemas,
               count(*) FILTER (WHERE r.kind = 'preciso')::int  AS conformes,
               count(*) FILTER (WHERE r.kind = 'historias-distintas')::int   AS "historiasDistintas",
               count(*) FILTER (WHERE r.kind = 'medio-mal-clasificado')::int AS "medioMalClasificado",
               count(*) FILTER (WHERE r.kind = 'falta-izquierda')::int       AS "faltaIzquierda",
               count(*) FILTER (WHERE r.kind = 'falta-derecha')::int         AS "faltaDerecha",
               min(r.created_at) AS "primerReporte",
               max(r.created_at) AS "ultimoReporte",
               -- Minutos entre el primero y el último reporte de PROBLEMA.
               -- Doce reportes en cuatro minutos y doce repartidos en diez días
               -- son cosas distintas, y sin este dato se ven idénticas en el
               -- panel. No pretende detectar coordinación: la hace visible, que
               -- es lo que un humano necesita para desconfiar a tiempo.
               EXTRACT(EPOCH FROM (
                   max(r.created_at) FILTER (WHERE r.kind <> 'preciso') -
                   min(r.created_at) FILTER (WHERE r.kind <> 'preciso')
               ))::int / 60 AS "minutosDeRafaga"
          FROM reader_reports r
          JOIN stories s ON s.id = r.story_id
         WHERE r.created_at > now() - ($1::int * interval '1 day')
         GROUP BY r.story_id, s.title
        HAVING count(*) FILTER (WHERE r.kind <> 'preciso') > 0
         ORDER BY problemas DESC, "ultimoReporte" DESC
         LIMIT $2
        `,
        [days, limit],
        'historias con reportes'
    );

    return result?.rows ?? null;
}

/**
 * Totales por tipo. Es la vista que dice si una pregunta del ROADMAP tiene
 * respaldo empírico de los lectores o si nadie ha reportado nada al respecto.
 */
export async function reportTotals({ days = 14 } = {}) {
    const result = await safeQuery(
        `
        SELECT kind, count(*)::int AS total
          FROM reader_reports
         WHERE created_at > now() - ($1::int * interval '1 day')
         GROUP BY kind
        `,
        [days],
        'totales de reportes'
    );

    if (!result) return null;

    // Se devuelven TODOS los tipos, incluidos los que están a cero. Un tipo
    // ausente de la respuesta se leería como "no medido" cuando en realidad
    // significa "medido y nadie lo reportó", que es información distinta.
    const totals = Object.fromEntries(REPORT_KINDS.map((k) => [k, 0]));
    for (const row of result.rows) totals[row.kind] = row.total;

    return totals;
}
