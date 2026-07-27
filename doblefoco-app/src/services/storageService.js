/**
 * Persistencia local del navegador.
 *
 * IMPORTANTE: esto NO es una base de datos. Es almacenamiento por dispositivo
 * y por navegador: no se comparte entre usuarios, no sobrevive a un borrado de
 * caché y no sirve para operar una redacción. Es una solución puente hasta que
 * exista la base de datos real (tarea F2-01 del ROADMAP). Cualquier función
 * que dependa de que un dato sea visible para OTRA persona no puede vivir aquí.
 */

const KEYS = {
    APPROVED: 'doblefoco-approved-articles',
    PENDING: 'doblefoco-pending-articles',
    SUBSCRIBERS: 'doblefoco-newsletter-waitlist',
};

const FEED_EVENT = 'doblefoco-feed-updated';
const PENDING_EVENT = 'doblefoco-pending-updated';

function readList(key) {
    try {
        const stored = localStorage.getItem(key);
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error(`No se pudo leer ${key} de localStorage`, error);
        return [];
    }
}

function writeList(key, list, eventName) {
    try {
        localStorage.setItem(key, JSON.stringify(list));
        if (eventName) window.dispatchEvent(new Event(eventName));
        return { ok: true };
    } catch (error) {
        console.error(`No se pudo guardar ${key} en localStorage`, error);
        return { ok: false, error: 'No hay espacio disponible en el navegador.' };
    }
}

export const getApprovedStories = () => readList(KEYS.APPROVED);
export const saveApprovedStories = (stories) => writeList(KEYS.APPROVED, stories, FEED_EVENT);

export const getPendingStories = () => readList(KEYS.PENDING);
export const savePendingStories = (stories) => writeList(KEYS.PENDING, stories, PENDING_EVENT);

export function subscribeToFeed(listener) {
    window.addEventListener(FEED_EVENT, listener);
    window.addEventListener('storage', listener);
    return () => {
        window.removeEventListener(FEED_EVENT, listener);
        window.removeEventListener('storage', listener);
    };
}

export function subscribeToPending(listener) {
    window.addEventListener(PENDING_EVENT, listener);
    return () => window.removeEventListener(PENDING_EVENT, listener);
}

/**
 * Exporta el contenido editorial como respaldo JSON.
 *
 * NO incluye la lista de correos.
 *
 * La versión anterior sí los incluía, y como /admin era una ruta pública sin
 * autenticación, cualquier visitante podía descargarse los datos personales de
 * los suscriptores con un clic. Los correos ahora solo se exportan mediante
 * `exportSubscribersForOperator`, que exige confirmación explícita y solo debe
 * invocarse desde el panel ya autenticado.
 */
export function exportContentBackup() {
    try {
        const payload = {
            exportedAt: new Date().toISOString(),
            approved: getApprovedStories(),
            pending: getPendingStories(),
        };

        downloadJson(payload, `doblefoco_contenido_${Date.now()}.json`);
        return { ok: true };
    } catch (error) {
        console.error('No se pudo exportar el respaldo', error);
        return { ok: false, error: error.message };
    }
}

/** Cuántas personas hay en la lista de espera, sin revelar sus correos. */
export function getWaitlistCount() {
    return readList(KEYS.SUBSCRIBERS).length;
}

/**
 * Exporta los correos de la lista de espera. Contiene datos personales:
 * el llamante debe haber confirmado la acción con el operador.
 */
export function exportSubscribersForOperator({ confirmed = false } = {}) {
    if (!confirmed) {
        return { ok: false, error: 'Exportación de datos personales no confirmada.' };
    }

    try {
        downloadJson(
            {
                exportedAt: new Date().toISOString(),
                notice:
                    'Contiene datos personales (Ley 1581 de 2012). Trátalos conforme a la ' +
                    'política de privacidad y elimínalos cuando dejen de ser necesarios.',
                waitlist: readList(KEYS.SUBSCRIBERS),
            },
            `doblefoco_lista_espera_${Date.now()}.json`
        );
        return { ok: true };
    } catch (error) {
        console.error('No se pudo exportar la lista de espera', error);
        return { ok: false, error: error.message };
    }
}

function downloadJson(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    // Sin esto el blob queda retenido en memoria hasta que se cierre la pestaña.
    URL.revokeObjectURL(url);
}

export { KEYS as STORAGE_KEYS };
