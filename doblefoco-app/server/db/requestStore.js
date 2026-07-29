/**
 * Solicitudes de ciclo de ingesta — tarea F2-12.
 *
 * El panel pide un ciclo inmediato escribiendo una fila; el motor la mira en
 * cada vuelta de su bucle y actúa. Nadie llama a nadie por red.
 *
 * POR QUÉ NO UNA LLAMADA HTTP AL MOTOR
 * ------------------------------------
 * La ingesta tarda minutos, así que corre en una máquina propia y no en una
 * función. Para dispararla por red habría que exponer esa máquina: puerto
 * abierto, autenticación propia y superficie de ataque para algo que se usa
 * tres veces al mes.
 *
 * Con una fila en la base, el motor no necesita conectividad ENTRANTE en
 * absoluto: nadie puede alcanzarlo. Y el panel no sabe ni le importa dónde está
 * alojado, así que cambiar de proveedor no toca ni una línea del panel.
 */

import { safeQuery } from './pool.js';

/**
 * Registra una solicitud. Si ya hay una sin atender, no crea otra.
 *
 * @returns {Promise<{created: boolean, pendingSince: string|null}>}
 */
export async function requestCycle(userId) {
    // El índice único parcial garantiza una sola pendiente; aquí se traduce el
    // conflicto en una respuesta clara en vez de en un error.
    const result = await safeQuery(
        `
        INSERT INTO ingest_requests (requested_by)
        VALUES ($1)
        ON CONFLICT DO NOTHING
        RETURNING requested_at
        `,
        [userId ?? null],
        'solicitud de ciclo'
    );

    if (result?.rowCount) {
        return { created: true, pendingSince: result.rows[0].requested_at };
    }

    const pendiente = await safeQuery(
        'SELECT requested_at FROM ingest_requests WHERE claimed_at IS NULL LIMIT 1',
        [],
        'solicitud pendiente'
    );

    return { created: false, pendingSince: pendiente?.rows[0]?.requested_at ?? null };
}

/**
 * Toma la solicitud pendiente, si la hay.
 *
 * El UPDATE ... RETURNING es atómico: si dos motores corrieran a la vez, solo
 * uno se la lleva. Hoy hay uno solo, pero la alternativa —leer y luego marcar—
 * tendría una carrera de la que nadie se acordaría el día que haya dos.
 *
 * @returns {Promise<{id: number, requestedAt: string}|null>}
 */
export async function claimCycleRequest() {
    const result = await safeQuery(
        `
        UPDATE ingest_requests
           SET claimed_at = now()
         WHERE id = (SELECT id FROM ingest_requests WHERE claimed_at IS NULL
                      ORDER BY requested_at LIMIT 1 FOR UPDATE SKIP LOCKED)
        RETURNING id, requested_at
        `,
        [],
        'toma de solicitud'
    );

    if (!result?.rowCount) return null;
    return { id: result.rows[0].id, requestedAt: result.rows[0].requested_at };
}

/** Cierra una solicitud con el resultado, para que el panel lo muestre. */
export async function finishCycleRequest(id, outcome) {
    await safeQuery(
        'UPDATE ingest_requests SET finished_at = now(), outcome = $2 WHERE id = $1',
        [id, String(outcome).slice(0, 500)],
        'cierre de solicitud'
    );
}

/** Últimas solicitudes, para el panel. */
export async function recentRequests(limit = 5) {
    const result = await safeQuery(
        `
        SELECT r.id, r.requested_at, r.claimed_at, r.finished_at, r.outcome,
               u.display_name, u.email
          FROM ingest_requests r
          LEFT JOIN admin_users u ON u.id = r.requested_by
         ORDER BY r.requested_at DESC
         LIMIT $1
        `,
        [limit],
        'solicitudes recientes'
    );

    return (result?.rows ?? []).map((r) => ({
        id: r.id,
        requestedAt: r.requested_at,
        claimedAt: r.claimed_at,
        finishedAt: r.finished_at,
        outcome: r.outcome,
        requestedBy: r.display_name || r.email || null,
    }));
}

