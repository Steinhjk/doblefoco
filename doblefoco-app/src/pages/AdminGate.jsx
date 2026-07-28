import { useEffect, useState } from 'react';
import { Lock, ShieldAlert, LogOut } from 'lucide-react';
import { fetchSession, login, logout } from '../services/authClient';

/**
 * Traduce la respuesta del servidor al estado de la pantalla.
 *
 * Fuera del componente y sin efectos: un 401 y un 503 significan cosas
 * distintas y conviene que la diferencia esté en un solo sitio. 401 es "hay que
 * entrar"; 503 es "este despliegue no puede tener panel", que no se arregla
 * escribiendo la contraseña.
 */
function stateFromSession(result) {
    if (result.ok) return { status: 'dentro', user: result.user, error: '' };
    if (result.unavailable) return { status: 'no-disponible', user: null, error: result.error };
    return { status: 'fuera', user: null, error: '' };
}

/**
 * Puerta de acceso al panel de moderación.
 *
 * QUÉ CAMBIÓ (tarea F2-04)
 * ------------------------
 * La versión anterior comparaba `value === import.meta.env.VITE_ADMIN_PASSPHRASE`
 * aquí mismo. Todo lo que empieza por VITE_ se incrusta en el bundle, así que
 * la clave era pública y, peor, la comprobación ocurría en la máquina de quien
 * intentaba entrar: bastaba con poner `unlocked` a true en las herramientas de
 * desarrollo. Era un cerrojo, y estaba escrito que lo era.
 *
 * Ahora este componente no valida nada. Pregunta al servidor si hay sesión y le
 * envía las credenciales; quien decide es él. La sesión viaja en una cookie
 * httpOnly que este código no puede leer ni falsificar, lo que también significa
 * que un XSS en cualquier otra página del sitio no puede robarla.
 */
const AdminGate = ({ children }) => {
    const [state, setState] = useState({ status: 'comprobando', user: null, error: '' });
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        // `active` evita actualizar el estado si el componente se desmontó
        // mientras la petición seguía en vuelo: navegar fuera de /admin durante
        // esos milisegundos provocaría una advertencia de React y, peor, dejaría
        // una promesa escribiendo sobre un componente que ya no existe.
        let active = true;

        fetchSession().then((result) => {
            if (active) setState(stateFromSession(result));
        });

        return () => {
            active = false;
        };
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSending(true);

        const result = await login(email, password);
        setPassword('');

        if (result.ok) {
            setState({ status: 'dentro', user: result.user, error: '' });
        } else {
            setState((prev) => ({ ...prev, status: 'fuera', error: result.error }));
        }

        setSending(false);
    };

    const handleLogout = async () => {
        await logout();
        setState({ status: 'fuera', user: null, error: '' });
        setEmail('');
    };

    if (state.status === 'comprobando') {
        return (
            <div className="admin-gate" role="status" aria-live="polite">
                <span className="visually-hidden">Comprobando la sesión…</span>
                <div className="loader-spinner" aria-hidden="true" />
            </div>
        );
    }

    if (state.status === 'no-disponible') {
        return (
            <div className="admin-gate">
                <ShieldAlert size={40} aria-hidden="true" />
                <h1>Panel no disponible</h1>
                <p>{state.error}</p>
            </div>
        );
    }

    if (state.status === 'dentro') {
        return (
            <>
                <div className="admin-session-bar">
                    <span>
                        Sesión de <strong>{state.user.displayName || state.user.email}</strong>
                    </span>
                    <button type="button" onClick={handleLogout} className="admin-logout">
                        <LogOut size={16} aria-hidden="true" />
                        Cerrar sesión
                    </button>
                </div>
                {children}
            </>
        );
    }

    return (
        <div className="admin-gate">
            <Lock size={36} aria-hidden="true" />
            <h1>Panel de moderación</h1>
            <p>Acceso restringido al equipo editorial.</p>

            <form onSubmit={handleSubmit} className="admin-gate-form">
                <label htmlFor="admin-email">Correo</label>
                <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                />

                <label htmlFor="admin-password">Contraseña</label>
                <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    aria-invalid={Boolean(state.error)}
                    aria-describedby={state.error ? 'admin-gate-error' : undefined}
                />

                <button type="submit" disabled={sending}>
                    {sending ? 'Comprobando…' : 'Entrar'}
                </button>

                {state.error && (
                    <span id="admin-gate-error" role="alert">
                        {state.error}
                    </span>
                )}
            </form>
        </div>
    );
};

export default AdminGate;
