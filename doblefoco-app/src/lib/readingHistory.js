/**
 * Historial de lectura y "Dieta Informativa".
 *
 * La lógica estaba duplicada literalmente entre Sidebar.jsx y
 * MobileSidebar.jsx, con textos de recomendación distintos en cada copia, y la
 * escritura del historial estaba repetida en NewsCard y NewsDetail.
 *
 * El historial es local por diseño: nunca sale del navegador. Es dato de
 * comportamiento de lectura política, que es exactamente el tipo de dato que
 * no debería viajar a un servidor sin consentimiento explícito.
 */

const HISTORY_KEY = 'doblefoco-history';
const HISTORY_EVENT = 'doblefoco-history-updated';
const MAX_ENTRIES = 200;

function readRaw() {
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/** Entradas del historial, de la más reciente a la más antigua. */
export function getHistory() {
    return readRaw();
}

/** Registra una lectura. Reemplaza la entrada previa de la misma noticia. */
export function recordRead(story) {
    if (!story?.id) return;

    try {
        const history = readRaw().filter((item) => String(item.id) !== String(story.id));

        history.unshift({
            id: String(story.id),
            category: story.category ?? null,
            // Se guarda el sesgo MEDIO de la cobertura, que es lo que el
            // lector realmente consumió.
            bias: story.coverage?.meanBias ?? story.bias ?? 0,
            factuality: story.factuality ?? null,
            readAt: Date.now(),
        });

        localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_ENTRIES)));
        window.dispatchEvent(new Event(HISTORY_EVENT));
    } catch {
        // Modo incógnito o cuota llena: perder el historial es aceptable,
        // romper la navegación no.
    }
}

export function clearHistory() {
    try {
        localStorage.removeItem(HISTORY_KEY);
        window.dispatchEvent(new Event(HISTORY_EVENT));
    } catch {
        /* sin efecto */
    }
}

export function subscribeToHistory(listener) {
    window.addEventListener(HISTORY_EVENT, listener);
    // El evento `storage` mantiene sincronizadas varias pestañas abiertas.
    window.addEventListener('storage', listener);

    return () => {
        window.removeEventListener(HISTORY_EVENT, listener);
        window.removeEventListener('storage', listener);
    };
}

/**
 * Resumen de la dieta informativa. Fuente única para escritorio y móvil.
 */
export function summarizeDiet(history) {
    const entries = Array.isArray(history) ? history : [];

    if (!entries.length) {
        return {
            hasHistory: false,
            count: 0,
            avgBias: 0,
            avgFactuality: null,
            biasPosition: 50,
            label: 'Sin datos todavía',
            recommendation:
                'Aún no has leído ninguna noticia. A medida que leas, aquí verás qué parte del espectro estás consumiendo.',
        };
    }

    const avgBias =
        entries.reduce((sum, item) => sum + (item.bias ?? 0), 0) / entries.length;

    const factualities = entries
        .map((item) => item.factuality)
        .filter((f) => typeof f === 'number' && Number.isFinite(f));

    const avgFactuality = factualities.length
        ? factualities.reduce((sum, f) => sum + f, 0) / factualities.length
        : null;

    let label;
    let recommendation;

    if (avgBias <= -0.3) {
        label = 'Sesgo de izquierda';
        recommendation =
            'Tu lectura se concentra en medios de izquierda. Para contrastar, busca la cobertura del mismo hecho en El Colombiano o Semana.';
    } else if (avgBias < -0.1) {
        label = 'Izquierda moderada';
        recommendation =
            'Tu lectura se inclina levemente a la izquierda. Revisa algunos hechos desde medios de centro o centro-derecha.';
    } else if (avgBias <= 0.1) {
        label = 'Centro / equilibrada';
        recommendation =
            'Tu dieta está equilibrada entre espectros. Mantén el hábito de contrastar cada hecho en al menos dos medios.';
    } else if (avgBias < 0.3) {
        label = 'Derecha moderada';
        recommendation =
            'Tu lectura se inclina levemente a la derecha. Revisa algunos hechos desde medios de centro o centro-izquierda.';
    } else {
        label = 'Sesgo de derecha';
        recommendation =
            'Tu lectura se concentra en medios de derecha. Para contrastar, busca la cobertura del mismo hecho en El Espectador o Cambio.';
    }

    return {
        hasHistory: true,
        count: entries.length,
        avgBias,
        avgFactuality,
        biasPosition: ((Math.max(-1, Math.min(1, avgBias)) + 1) / 2) * 100,
        label,
        recommendation,
    };
}
