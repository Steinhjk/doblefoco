import { useEffect, useState } from 'react';
import { fetchConteosPorDepartamento, isApiConfigured } from '../services/apiClient';

/**
 * Cuántas historias hay por departamento, en TODO el catálogo.
 *
 * Es la cifra que pinta el mapa, y tiene que ser del catálogo: la intensidad de
 * un coropleto responde a «cuánto se habla de aquí», no a «cuánto has cargado».
 * Contándolo en el navegador sobre lo descargado, el color subía al pulsar
 * «cargar más» — que es el fallo que esto cierra.
 *
 * `{}` vacío NO es un error que haya que enseñar: puede ser que la API de Fly
 * todavía no tenga la ruta, porque el cliente se despliega antes. Quien lo
 * consuma cuenta lo descargado, como antes, y no avisa de nada.
 *
 * Se pide UNA VEZ al montar y no se refresca: el mapa acompaña a un feed que ya
 * se recarga al navegar, y un sondeo periódico por una cifra que cambia cada
 * treinta minutos sería tráfico sin lector.
 */
export function useConteosPorDepartamento() {
    const [estado, setEstado] = useState({ conteos: null, cargando: isApiConfigured });

    useEffect(() => {
        if (!isApiConfigured) return undefined;

        let vigente = true;

        fetchConteosPorDepartamento().then((resultado) => {
            if (!vigente) return;
            setEstado({ conteos: resultado.conteos, cargando: false });
        });

        return () => {
            vigente = false;
        };
    }, []);

    return estado;
}
