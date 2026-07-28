/**
 * Persistencia local del navegador.
 *
 * IMPORTANTE: esto NO es una base de datos. Es almacenamiento por dispositivo y
 * por navegador: no se comparte entre usuarios, no sobrevive a un borrado de
 * caché y no sirve para operar una redacción.
 *
 * QUÉ SE FUE DE AQUÍ (tarea F2-02)
 * --------------------------------
 * Las historias aprobadas y la cola de pendientes. Vivían aquí y el resultado
 * era que cada persona veía un sitio distinto: quien aprobaba una historia la
 * veía publicada, y nadie más. La versión "real" del sitio no existía en
 * ninguna parte. Ahora esas decisiones viven en la tabla `moderation`, se
 * comparten y quedan firmadas con quién las tomó.
 *
 * Lo que queda es la lista de espera del boletín, que sigue siendo local a
 * propósito: son datos personales sin infraestructura de tratamiento todavía
 * (F3-05), y el sitio declara con claridad dónde se guardan y cómo borrarlos.
 */

const KEYS = {
    SUBSCRIBERS: 'doblefoco-newsletter-waitlist',
};

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
