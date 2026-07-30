// @ts-check
import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { reportarPropiedad } from '../services/apiClient';
import './ReportePropiedad.css';

/**
 * «¿Esta información de propiedad es correcta?»
 *
 * QUÉ HACE Y QUÉ NO, y el «no» es lo importante. NO cambia la ficha, no dispara
 * nada automático y no se muestra ningún recuento en el sitio público. Guarda
 * una pista para saber dónde mirar, y punto.
 *
 * POR QUÉ NO PUEDE HACER MÁS. Corregir quién es dueño de un medio exige producir
 * la fuente donde consta lo contrario — es la regla que gobierna todo el
 * registro. Si un recuento de reportes bastara, cualquiera con tiempo podría
 * reescribir la propiedad de un medio pulsando un botón, y una campaña
 * coordinada podría hacerlo a voluntad. La regla cierra ese camino indirecto:
 * se puede señalar cuanto se quiera, y cambiar la ficha sigue costando lo mismo.
 *
 * EL RECUENTO NO SE ENSEÑA AQUÍ. Un contador visible invita a inflarlo y
 * convierte una pista en un veredicto. Vive solo en el panel.
 *
 * Se agradece igual cuando falla el envío. La alternativa —un mensaje de error
 * por algo que el lector no puede arreglar ni le afecta— sería castigarle por
 * haber colaborado.
 */
const ReportePropiedad = ({ mediaId }) => {
    const [enviado, setEnviado] = useState(null);

    const enviar = (veredicto) => {
        setEnviado(veredicto);
        reportarPropiedad(mediaId, veredicto);
    };

    if (enviado) {
        return (
            <p className="reporte-propiedad-gracias">
                <Check size={14} aria-hidden="true" />
                {enviado === 'correcta'
                    ? 'Gracias por confirmarlo.'
                    : 'Anotado. Lo revisaremos contra las fuentes; esto no cambia la ficha por sí solo.'}
            </p>
        );
    }

    return (
        <div className="reporte-propiedad">
            <span className="reporte-propiedad-pregunta">¿Esta información es correcta?</span>
            <div className="reporte-propiedad-botones">
                <button type="button" onClick={() => enviar('correcta')}>
                    <ThumbsUp size={13} aria-hidden="true" /> Sí
                </button>
                <button type="button" onClick={() => enviar('incorrecta')}>
                    <ThumbsDown size={13} aria-hidden="true" /> No
                </button>
            </div>
        </div>
    );
};

export default ReportePropiedad;
