import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HistoriasContext } from '../hooks/historiasContext';
import { useStories } from '../hooks/useStories';
import { FILTROS } from '../hooks/useFiltrosDeFeed';

/**
 * LA CONSULTA COMPARTIDA DE HISTORIAS. El porqué, entero, está en
 * `hooks/historiasContext.js`; aquí solo vive el componente.
 *
 * @param {{children: React.ReactNode}} props
 */
export function ProveedorDeHistorias({ children }) {
    const [params] = useSearchParams();

    /**
     * El ámbito, validado contra la misma lista que usa el feed.
     *
     * Se valida en lugar de confiar en el texto de la URL por el mismo motivo
     * que lo hace `useFiltrosDeFeed`: es texto que escribe cualquiera, y un
     * valor inventado viajaría al servidor dentro de la consulta.
     */
    const pedido = params.get('ambito');
    const ambito = FILTROS.ambito.validos.includes(/** @type {any} */ (pedido))
        ? /** @type {string} */ (pedido)
        : FILTROS.ambito.porDefecto;

    const ambiente = useStories({ limit: 100, ambito: 'all' });

    /**
     * La del feed solo se pide cuando hay filtro. `encendido` existe justamente
     * para poder no pedirla sin saltarse la regla de los hooks: el hook se
     * llama siempre, y es su efecto el que no hace nada.
     */
    const filtrada = useStories({ limit: 100, ambito, encendido: ambito !== 'all' });

    const valor = useMemo(
        () => ({ ambiente, feed: ambito === 'all' ? ambiente : filtrada }),
        [ambiente, ambito, filtrada]
    );

    return <HistoriasContext.Provider value={valor}>{children}</HistoriasContext.Provider>;
}
