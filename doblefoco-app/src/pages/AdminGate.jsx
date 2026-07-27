import { useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

const SESSION_KEY = 'doblefoco-admin-unlocked';

/**
 * Puerta de acceso al panel de moderación.
 *
 * QUÉ ES Y QUÉ NO ES
 * ------------------
 * Esto NO es autenticación. Una passphrase incrustada en un bundle de
 * navegador es pública: cualquiera puede leerla en las herramientas de
 * desarrollo. Es un cerrojo, no una cerradura.
 *
 * Por qué existe igualmente: antes /admin era una ruta abierta donde cualquier
 * visitante podía aprobar, rechazar y editar el sesgo, la factualidad y los
 * titulares de cualquier noticia, además de descargarse los correos de los
 * suscriptores. Un cerrojo débil es estrictamente mejor que una puerta
 * abierta, y la defensa real está en App.jsx: si VITE_ADMIN_PASSPHRASE no
 * está definida, la ruta no se registra y el código del panel ni siquiera
 * llega al navegador.
 *
 * La autenticación de verdad (sesión de servidor, contra la base de datos) es
 * la tarea F2-04 del ROADMAP y debe llegar antes de que el panel gestione
 * contenido real.
 */
const AdminGate = ({ children }) => {
    const expected = import.meta.env.VITE_ADMIN_PASSPHRASE;

    const [unlocked, setUnlocked] = useState(
        () => sessionStorage.getItem(SESSION_KEY) === '1'
    );
    const [value, setValue] = useState('');
    const [error, setError] = useState('');

    if (!expected) {
        return (
            <div className="admin-gate">
                <ShieldAlert size={40} aria-hidden="true" />
                <h1>Panel no disponible</h1>
                <p>Este despliegue no tiene configurado el acceso de moderación.</p>
            </div>
        );
    }

    if (unlocked) return children;

    const handleSubmit = (event) => {
        event.preventDefault();

        if (value === expected) {
            sessionStorage.setItem(SESSION_KEY, '1');
            setUnlocked(true);
            setError('');
            return;
        }

        setError('Clave incorrecta.');
        setValue('');
    };

    return (
        <div className="admin-gate">
            <Lock size={36} aria-hidden="true" />
            <h1>Panel de moderación</h1>
            <p>Acceso restringido al equipo editorial.</p>

            <form onSubmit={handleSubmit} className="admin-gate-form">
                <label htmlFor="admin-passphrase">Clave de acceso</label>
                <input
                    id="admin-passphrase"
                    type="password"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    autoComplete="current-password"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'admin-gate-error' : undefined}
                />
                <button type="submit">Entrar</button>
                {error && <span id="admin-gate-error" role="alert">{error}</span>}
            </form>

            <p className="admin-gate-note">
                Medida provisional: no sustituye a una autenticación de servidor.
            </p>
        </div>
    );
};

export default AdminGate;
