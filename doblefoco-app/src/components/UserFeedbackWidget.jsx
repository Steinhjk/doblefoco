import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Check } from 'lucide-react';
import { sendReport } from '../services/reportClient';
import './UserFeedbackWidget.css';

function readStoredVote(storyId) {
    try {
        return localStorage.getItem(`doblefoco-vote-${storyId}`);
    } catch {
        return null;
    }
}

/**
 * Reporte del lector sobre el análisis de cobertura.
 *
 * TRES VERSIONES, Y CONVIENE SABER POR QUÉ ESTA
 * ---------------------------------------------
 * La primera mostraba "84 % Validación Comunitaria" leyendo un `useState`
 * escrito a mano: una constante presentada como el agregado de miles de
 * lectores. La retiró F0-08.
 *
 * La segunda —honesta pero hueca— guardaba el voto en localStorage y lo decía:
 * "todavía no la enviamos a ningún servidor". Preguntaba y tiraba la respuesta.
 *
 * Esta lo envía (F2-07), y SIGUE sin mostrar ningún porcentaje. No es una
 * limitación pendiente: es la decisión. Un voto de lectores anónimos no valida
 * un análisis de cobertura, y publicar el agregado sería volver al problema de
 * la primera versión con datos de verdad, que no lo hace menos engañoso.
 *
 * Lo que sí hace, y es lo valioso: las cuatro categorías de desacuerdo
 * corresponden con las preguntas abiertas más difíciles del proyecto —falta de
 * cobertura por banda (F1-12), medio mal clasificado (F1-13), hechos distintos
 * agrupados como uno (F1-05)— y ahora llegan al panel como pistas de revisión.
 * Ese último caso es la misma señal que costó etiquetar 72 pares a mano.
 */
const UserFeedbackWidget = ({ storyId }) => {
    const [reason, setReason] = useState('');
    const [vote, setVote] = useState(() => readStoredVote(storyId));
    const [submitted, setSubmitted] = useState(() => Boolean(readStoredVote(storyId)));

    // Al cambiar de noticia el estado se recalcula durante el render, no en un
    // efecto. Leer localStorage dentro de useEffect y llamar a setState provoca
    // un render en cascada: se pinta el estado equivocado y luego se corrige.
    const [renderedStoryId, setRenderedStoryId] = useState(storyId);
    if (renderedStoryId !== storyId) {
        const stored = readStoredVote(storyId);
        setRenderedStoryId(storyId);
        setVote(stored);
        setSubmitted(Boolean(stored));
        setReason('');
    }

    /**
     * Guarda y envía.
     *
     * El localStorage se mantiene por una razón distinta a la de antes: ya no
     * es el destino del dato sino la memoria de que este lector ya opinó sobre
     * esta historia, para no volver a preguntárselo.
     *
     * El envío no se espera ni se comprueba: si el servidor no responde, el
     * lector no tiene nada que hacer al respecto y mostrarle un error sobre una
     * pista de revisión interna sería ruido. La pérdida de un reporte es
     * asumible; interrumpir la lectura, no.
     */
    const save = (kind) => {
        try {
            localStorage.setItem(`doblefoco-vote-${storyId}`, kind);
        } catch {
            /* sin efecto: no bloquea la interacción */
        }

        sendReport(storyId, kind);
        setVote(kind);
        setSubmitted(true);
    };

    return (
        <div className="user-feedback-card">
            <div className="feedback-card-header">
                <h3>
                    <MessageSquare size={16} className="feedback-icon" aria-hidden="true" />
                    Auditoría del lector
                </h3>
            </div>

            <p className="feedback-question">
                ¿La distribución de cobertura que mostramos refleja lo que ves en los medios?
            </p>

            {!submitted ? (
                <div className="feedback-actions">
                    <button
                        className={`feedback-btn agree ${vote === 'preciso' ? 'active' : ''}`}
                        onClick={() => save('preciso')}
                    >
                        <ThumbsUp size={14} aria-hidden="true" /> Sí, es preciso
                    </button>
                    <button
                        className={`feedback-btn disagree ${vote === 'disagree' ? 'active' : ''}`}
                        aria-expanded={vote === 'disagree'}
                        onClick={() => setVote('disagree')}
                    >
                        <ThumbsDown size={14} aria-hidden="true" /> No, hay algo mal
                    </button>

                    {vote === 'disagree' && (
                        <div className="feedback-reasons-box">
                            <label htmlFor={`bias-reason-${storyId}`}>¿Qué observaste?</label>
                            <select
                                id={`bias-reason-${storyId}`}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="feedback-select"
                            >
                                <option value="">Selecciona una opción…</option>
                                <option value="falta-izquierda">Falta cobertura de izquierda</option>
                                <option value="falta-derecha">Falta cobertura de derecha</option>
                                <option value="medio-mal-clasificado">Un medio está mal clasificado</option>
                                <option value="historias-distintas">Son hechos distintos agrupados como uno</option>
                            </select>
                            <button
                                className="submit-reason-btn"
                                disabled={!reason}
                                onClick={() => save(reason)}
                            >
                                Enviar observación
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="feedback-thanks-box">
                    <div className="thanks-badge" aria-hidden="true"><Check size={14} /></div>
                    <div>
                        <h4>Registrado</h4>
                        <p>
                            Gracias. Tu observación va al equipo editorial como señal de
                            revisión. No publicamos porcentajes de acuerdo: un recuento de
                            votos no valida un análisis, pero sí nos dice dónde mirar.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserFeedbackWidget;
