/**
 * API de moderación — tarea F2-02.
 *
 * Todo lo de aquí exige sesión (F2-04). No es una formalidad: hasta que existió
 * la autenticación real, migrar la moderación a una base compartida habría sido
 * un retroceso. Con las decisiones en el localStorage de una persona el panel
 * era inútil, pero inofensivo; en una base con la puerta abierta, cualquiera
 * habría podido aprobar o rechazar lo que quisiera y encima quedaría firmado a
 * nombre de otro.
 */

import { Router } from 'express';
import { requireSession } from './auth/routes.js';
import { counts, decide, listDecided, listPending, undecide } from './db/moderationStore.js';

const router = Router();

// La sesión se exige para TODO el router, no ruta por ruta. Una lista que se
// olvida de añadir es la forma habitual de dejar un endpoint abierto.
router.use(requireSession);

/** Rango de paginación acotado: `limit=999999` no debe poder tumbar la base. */
function paging(req) {
    return {
        limit: Math.min(Math.max(Number(req.query.limit) || 50, 1), 200),
        offset: Math.max(Number(req.query.offset) || 0, 0),
    };
}

/** Historias sin decidir. Lo pendiente es la ausencia de fila, no un estado. */
router.get('/pending', async (req, res) => {
    try {
        const stories = await listPending(paging(req));
        if (!stories) return res.status(503).json({ success: false, error: 'Base no disponible' });
        return res.json({ success: true, stories });
    } catch (error) {
        console.error('[moderación] fallo en /pending', error);
        return res.status(500).json({ success: false, error: 'Error interno' });
    }
});

/** Decisiones tomadas, con quién las firmó. */
router.get('/decided', async (req, res) => {
    const state = ['aprobada', 'rechazada'].includes(req.query.state) ? req.query.state : null;

    try {
        const stories = await listDecided({ state, ...paging(req) });
        if (!stories) return res.status(503).json({ success: false, error: 'Base no disponible' });
        return res.json({ success: true, stories });
    } catch (error) {
        console.error('[moderación] fallo en /decided', error);
        return res.status(500).json({ success: false, error: 'Error interno' });
    }
});

router.get('/counts', async (req, res) => {
    try {
        const result = await counts();
        if (!result) return res.status(503).json({ success: false, error: 'Base no disponible' });
        return res.json({ success: true, counts: result });
    } catch (error) {
        console.error('[moderación] fallo en /counts', error);
        return res.status(500).json({ success: false, error: 'Error interno' });
    }
});

/**
 * Decide sobre una historia.
 *
 * `state: 'pendiente'` retira la decisión y la devuelve a la cola. Se resuelve
 * con el mismo endpoint en vez de con un DELETE porque desde el navegador es
 * la misma acción para quien la usa —cambiar de opinión— y evita ampliar los
 * métodos permitidos en CORS solo para esto.
 */
router.post('/:storyId', async (req, res) => {
    const { storyId } = req.params;
    const state = req.body?.state;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 1000) : null;

    if (!['aprobada', 'rechazada', 'pendiente'].includes(state)) {
        return res.status(400).json({
            success: false,
            error: "El estado debe ser 'aprobada', 'rechazada' o 'pendiente'",
        });
    }

    try {
        if (state === 'pendiente') {
            const removed = await undecide(storyId);
            return res.json({ success: true, state: 'pendiente', removed: removed > 0 });
        }

        const result = await decide({
            storyId,
            state,
            reviewerId: req.user.id,   // de la sesión, nunca del cuerpo de la petición
            reason,
        });

        if (!result) {
            return res.status(404).json({ success: false, error: 'La historia no existe' });
        }

        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('[moderación] fallo al decidir', error);
        return res.status(500).json({ success: false, error: 'Error interno' });
    }
});

export default router;
