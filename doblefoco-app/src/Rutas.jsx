// @ts-check
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const Trending = lazy(() => import('./pages/Trending'));
const Categories = lazy(() => import('./pages/Categories'));
const About = lazy(() => import('./pages/About'));
const Transparency = lazy(() => import('./pages/Transparency'));
const MediaMap = lazy(() => import('./pages/MediaMap'));
const Conclusions = lazy(() => import('./pages/Conclusions'));
const NewsDetail = lazy(() => import('./pages/NewsDetail'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const NotFound = lazy(() => import('./pages/NotFound'));

const AdminGate = lazy(() => import('./pages/AdminGate'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const PageLoader = () => (
    <div className="page-loader" role="status" aria-live="polite">
        <span className="visually-hidden">Cargando…</span>
        <div className="loader-spinner" aria-hidden="true" />
    </div>
);

export default function Rutas() {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tendencias" element={<Trending />} />
                <Route path="/categorias" element={<Categories />} />
                <Route path="/sobre-nosotros" element={<About />} />
                <Route path="/transparencia" element={<Transparency />} />
                <Route path="/conclusiones" element={<Conclusions />} />
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
    );
}
