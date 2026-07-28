import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const Trending = lazy(() => import('./pages/Trending'));
const Categories = lazy(() => import('./pages/Categories'));
const About = lazy(() => import('./pages/About'));
const Transparency = lazy(() => import('./pages/Transparency'));
const MediaMap = lazy(() => import('./pages/MediaMap'));
const NewsDetail = lazy(() => import('./pages/NewsDetail'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const NotFound = lazy(() => import('./pages/NotFound'));

/**
 * El panel de moderación.
 *
 * La ruta se registra siempre desde F2-04, y eso es una mejora, no un descuido.
 * Antes dependía de que existiera VITE_ADMIN_PASSPHRASE: esconder la ruta era
 * la única defensa real, porque la clave que la protegía viajaba en el propio
 * bundle y se leía en las herramientas de desarrollo. Ahora la defensa es la
 * sesión del servidor, así que ocultar la puerta ya no aporta nada.
 *
 * El import dinámico se mantiene por peso, no por seguridad: el código del
 * panel solo se descarga si alguien navega a /admin, y sin sesión no verá más
 * que el formulario de entrada.
 */
const AdminGate = lazy(() => import('./pages/AdminGate'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const PageLoader = () => (
    <div className="page-loader" role="status" aria-live="polite">
        <span className="visually-hidden">Cargando…</span>
        <div className="loader-spinner" aria-hidden="true" />
    </div>
);

function App() {
    return (
        <Router>
            <ErrorBoundary>
                <div className="App">
                    <a href="#main-content" className="skip-link">Ir al contenido principal</a>
                    <Navbar />

                    <main id="main-content" className="main-content">
                        <Suspense fallback={<PageLoader />}>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/tendencias" element={<Trending />} />
                                <Route path="/categorias" element={<Categories />} />
                                <Route path="/sobre-nosotros" element={<About />} />
                                <Route path="/transparencia" element={<Transparency />} />
                                <Route path="/mapa-medios" element={<MediaMap />} />
                                <Route path="/noticia/:id" element={<NewsDetail />} />
                                <Route path="/buscar" element={<SearchResults />} />

                                <Route
                                    path="/admin"
                                    element={
                                        <AdminGate>
                                            <AdminDashboard />
                                        </AdminGate>
                                    }
                                />

                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
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
        </Router>
    );
}

export default App;
