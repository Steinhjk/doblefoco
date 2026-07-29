// @ts-check
import { Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import Rutas from './Rutas';

/**
 * El árbol de la aplicación por DENTRO del enrutador.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 * ---------------------------
 * Cliente y servidor tienen que pintar EXACTAMENTE el mismo árbol. Lo único
 * que cambia entre ellos es el enrutador —BrowserRouter en el navegador,
 * StaticRouter en el servidor— y nada más.
 *
 * El primer intento de F3-01 duplicó esta estructura a mano en
 * entry-server.jsx y se le olvidaron <Navbar>, el divisor y el <footer>. El
 * síntoma no habría sido un error sino algo peor: React detecta la
 * discrepancia al hidratar, DESCARTA el HTML del servidor y vuelve a pintar
 * desde cero. Es decir, se paga el coste del renderizado en servidor y se
 * pierde su beneficio, sin que nada falle de forma visible.
 *
 * Teniendo una sola definición, esa clase de error deja de ser posible.
 */
export default function Shell() {
    return (
        <ErrorBoundary>
            <div className="App">
                <a href="#main-content" className="skip-link">Ir al contenido principal</a>
                <Navbar />

                <main id="main-content" className="main-content">
                    <Rutas />
                </main>

                <div className="footer-top-divider" aria-hidden="true">
                    <div className="divider-line" />
                    <div className="divider-badge">DobleFoco.co</div>
                    <div className="divider-line" />
                </div>

                <footer>
                    <div className="footer-container">
                        <Link to="/" className="footer-logo">DobleFoco<span>.co</span></Link>
                        <p className="footer-copy">
                            &copy; {new Date().getFullYear()} DobleFoco.co — Cobertura
                            periodística contrastada.
                        </p>
                    </div>
                </footer>
            </div>
        </ErrorBoundary>
    );
}
