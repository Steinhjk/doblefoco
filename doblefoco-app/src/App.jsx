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
 * El panel de moderación solo existe si el despliegue lo habilitó.
 *
 * Sin VITE_ADMIN_PASSPHRASE la ruta no se registra y, gracias al import
 * dinámico, su código nunca se descarga al navegador. Antes /admin era pública
 * en todos los builds: cualquiera podía entrar, editar sesgos y titulares, y
 * descargar los correos de los suscriptores.
 */
const adminEnabled = Boolean(import.meta.env.VITE_ADMIN_PASSPHRASE);
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

                                {adminEnabled && (
                                    <Route
                                        path="/admin"
                                        element={
                                            <AdminGate>
                                                <AdminDashboard />
                                            </AdminGate>
                                        }
                                    />
                                )}

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
