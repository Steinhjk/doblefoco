import { useState } from 'react';
import { Mail, Check, ShieldQuestion } from 'lucide-react';
import { joinWaitlist, CONTACT_EMAIL } from '../services/newsletterService';
import './NewsletterWidget.css';

/**
 * Lista de espera del boletín.
 *
 * La versión anterior decía "Se ha enviado la confirmación a tu@correo.com
 * desde sincuentoco@gmail.com". No había —ni hay todavía— ningún envío: el
 * correo solo se guardaba en localStorage. Este componente ya no afirma nada
 * que el sistema no haga.
 */
const NewsletterWidget = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState(null);
    const [error, setError] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        setError('');

        const result = joinWaitlist(email);

        if (!result.ok) {
            setError(result.error);
            return;
        }

        setStatus(result);
        setEmail('');
    };

    return (
        <div className="sidebar-section newsletter-widget">
            <div className="newsletter-header-row">
                <h3><Mail size={18} className="section-icon" aria-hidden="true" /> Boletín diario</h3>
                <span className="newsletter-status-chip">En preparación</span>
            </div>

            {!status ? (
                <form onSubmit={handleSubmit} className="newsletter-form" noValidate>
                    <p className="newsletter-description">
                        El boletín todavía no se está enviando. Déjanos tu correo y te
                        avisaremos cuando lo lancemos.
                    </p>

                    <div className="newsletter-input-group">
                        <label className="visually-hidden" htmlFor="newsletter-email">
                            Correo electrónico
                        </label>
                        <input
                            id="newsletter-email"
                            type="email"
                            placeholder="tu@correo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="newsletter-input"
                            aria-invalid={Boolean(error)}
                            aria-describedby={error ? 'newsletter-error' : 'newsletter-privacy'}
                        />
                        <button type="submit" className="newsletter-submit-btn">
                            Avísenme
                        </button>
                    </div>

                    {error && (
                        <span className="newsletter-error-msg" id="newsletter-error" role="alert">
                            {error}
                        </span>
                    )}

                    <p className="newsletter-privacy" id="newsletter-privacy">
                        <ShieldQuestion size={12} aria-hidden="true" />
                        Tu correo se guarda <strong>solo en este navegador</strong> hasta que el
                        boletín exista. No se comparte con terceros. Puedes borrarlo limpiando los
                        datos del sitio o escribiendo a {CONTACT_EMAIL}.
                    </p>
                </form>
            ) : (
                <div className="newsletter-success-box">
                    <span className="success-icon" aria-hidden="true"><Check size={18} /></span>
                    <h4>{status.message}</h4>
                    <p>
                        Todavía <strong>no te hemos enviado ningún correo</strong> y no lo haremos
                        hasta que el boletín esté listo. Ese será el primero que recibas.
                    </p>
                    <button onClick={() => setStatus(null)} className="newsletter-reset-btn">
                        Registrar otro correo
                    </button>
                </div>
            )}
        </div>
    );
};

export default NewsletterWidget;
