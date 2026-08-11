import { useEffect, useState } from 'react';
import { fetchPortada, isApiConfigured } from '../services/apiClient';
import { normalizeStories } from '../lib/story';

/**
 * Los sucesos de la portada.
 *
 * Un suceso agrupa los ángulos de un mismo hecho para ordenarlos y presentarlos,
 * sin fusionarlos: cada historia conserva su titular y su recuento de medios.
 * Ver `shared/sucesos.js` para por qué el agrupamiento vive en el servidor —
 * necesita el IDF del corpus completo, que el navegador no tiene.
 *
 * `sucesos` vacío NO es un error que haya que enseñar. Puede ser que la API de
 * Fly todavía no tenga la ruta, porque el cliente se despliega antes. Quien lo
 * consuma se queda con el orden por historias y no avisa de nada.
 */
export function usePortada({ limit = 100 } = {}) {
    const [estado, setEstado] = useState({ sucesos: [], cargando: isApiConfigured });

    useEffect(() => {
        // Sin API no hay nada que pedir. No hace falta tocar el estado: el
        // inicial ya nace en `{sucesos: [], cargando: false}` cuando
        // `isApiConfigured` es falso, que es una constante del módulo.
        if (!isApiConfigured) return undefined;

        let vigente = true;

        fetchPortada({ limit }).then((resultado) => {
            if (!vigente) return;

            // Las historias llegan crudas de la API y la interfaz espera la forma
            // normalizada, la misma que usa el feed. Normalizarlas aquí evita que
            // el destacado y la lista de debajo cuenten distinto.
            const sucesos = resultado.sucesos.map((suceso) => ({
                ...suceso,
                lider: normalizeStories([suceso.lider])[0] ?? null,
                historias: normalizeStories(suceso.historias ?? []),
            })).filter((suceso) => suceso.lider);

            setEstado({ sucesos, cargando: false });
        });

        return () => {
            vigente = false;
        };
    }, [limit]);

    return estado;
}
