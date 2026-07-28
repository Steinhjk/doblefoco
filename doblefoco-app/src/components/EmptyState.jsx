import { Inbox, WifiOff } from 'lucide-react';

/**
 * Lo que se muestra cuando no hay historias — tarea F2-03.
 *
 * Existe porque al retirar el fixture hacía falta algo que ocupara su lugar, y
 * la tentación era rellenar con contenido de ejemplo. Este componente es la
 * decisión contraria: cuando no hay datos se dice que no hay datos.
 *
 * Distingue las dos causas a propósito. "La ingesta no está disponible" es una
 * avería nuestra y el visitante merece saber que lo que ve no es el estado del
 * mundo. "Todavía no hay historias" es un hecho sobre la cobertura. Mostrarlas
 * con el mismo mensaje escondería la avería detrás de un dato.
 */
/**
 * @param {{reason?: string|null, title?: string, hint?: string}} props
 */
const EmptyState = ({ reason, title, hint }) => {
    const esAveria = Boolean(reason) && !/todav[ií]a no hay/i.test(reason);
    const Icon = esAveria ? WifiOff : Inbox;

    return (
        <div className="empty-state" role="status">
            <Icon size={40} aria-hidden="true" />
            <h2>{title ?? (esAveria ? 'No se pudo cargar la cobertura' : 'Sin historias todavía')}</h2>
            {reason && <p className="empty-state-reason">{reason}</p>}
            <p className="empty-state-hint">
                {hint ??
                    (esAveria
                        ? 'El motor de ingesta no está respondiendo. No se muestra contenido de ejemplo: lo que vería no sería cobertura real.'
                        : 'Las historias aparecerán en cuanto el motor complete un ciclo de ingesta.')}
            </p>
        </div>
    );
};

export default EmptyState;
