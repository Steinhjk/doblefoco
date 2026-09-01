// @ts-check
import { Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import AvisoDesfase from './components/AvisoDesfase';
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
                {/* Solo existe si el sitio y su motor llevan catalogos
                    distintos; el resto del tiempo no pinta nada. En el SSR
                    tampoco: su efecto no corre ahi, y por eso no puede
                    desencajar la hidratacion. */}
                <AvisoDesfase />

                <main id="main-content" className="main-content">
                    <Rutas />
                </main>

                {/*
                    Aquí había un divisor decorativo con una pastilla que decía
                    «DobleFoco.co». Se retira porque hacía dos cosas mal a la vez:
                      · repetía la marca 65 px por encima del logotipo del pie,
                        que además es un enlace y sí tiene función;
                      · dibujaba una línea separadora 24 px por encima de la que
                        ya pinta el propio <footer> con su border-top, de modo
                        que se veían dos rayas paralelas muy juntas.
                    El pie ya se separa solo. Si algún día se quiere recuperar el
                    adorno, tendrá que sustituir a esa línea, no sumarse a ella.
                */}
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
