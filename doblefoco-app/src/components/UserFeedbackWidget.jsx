import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Check } from 'lucide-react';
import './UserFeedbackWidget.css';

function readStoredVote(storyId) {
    try {
        return localStorage.getItem(`doblefoco-vote-${storyId}`);
    } catch {
        return null;
    }
}

/**
 * Auditoría comunitaria del análisis de cobertura.
 *
 * La versión anterior mostraba "84% Validación Comunitarias" leyendo un
 * `useState({ agree: 84, disagree: 16 })` escrito a mano. Los votos nunca
 * salían de localStorage, así que ese porcentaje era decorado: presentaba una
 * constante como si fuera el resultado agregado de miles de lectores.
 *
 * Aquí no se muestra ningún agregado, porque todavía no existe backend que
 * agregue nada. El voto se guarda localmente y sirve para que el lector vea
 * que ya opinó. Cuando exista el endpoint (tarea F2-07 del ROADMAP), este
 * componente enviará el voto y podrá mostrar cifras reales.
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

    const save = (voteType) => {
        try {
            localStorage.setItem(`doblefoco-vote-${storyId}`, voteType);
        } catch {
            /* sin efecto: no bloquea la interacción */
        }
        setVote(voteType);
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
                        className={`feedback-btn agree ${vote === 'agree' ? 'active' : ''}`}
                        onClick={() => save('agree')}
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
                                onClick={() => save('disagree')}
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
                            Tu respuesta quedó guardada en este navegador. Todavía no la
                            enviamos a ningún servidor: la agregación comunitaria está en
                            desarrollo.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserFeedbackWidget;
