// @ts-check
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const Trending = lazy(() => import('./pages/Trending'));
const Categories = lazy(() => import('./pages/Categories'));
const TransparenciaLayout = lazy(() => import('./pages/transparencia/Layout'));
const TrIndice = lazy(() => import('./pages/transparencia/Indice'));
const TrSobreNosotros = lazy(() => import('./pages/transparencia/SobreNosotros'));
const TrClasificacion = lazy(() => import('./pages/transparencia/Clasificacion'));
const TrDinero = lazy(() => import('./pages/transparencia/Dinero'));
const TrDatos = lazy(() => import('./pages/transparencia/Datos'));
const TrLimitaciones = lazy(() => import('./pages/transparencia/Limitaciones'));
const MediaMap = lazy(() => import('./pages/MediaMap'));
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
                {/*
                  * REDIRECCIÓN PERMANENTE, no borrado. `/sobre-nosotros` está
                  * indexada por Google y enlazada desde varias páginas del propio
                  * sitio; romperla perdería lo que costó ganar con el renderizado
                  * en servidor. `replace` para que el botón de atrás no rebote.
                  */}
                <Route
                    path="/sobre-nosotros"
                    element={<Navigate to="/transparencia/sobre-nosotros" replace />}
                />

                <Route path="/transparencia" element={<TransparenciaLayout />}>
                    <Route index element={<TrIndice />} />
                    <Route path="sobre-nosotros" element={<TrSobreNosotros />} />
                    <Route path="clasificacion" element={<TrClasificacion />} />
                    <Route path="dinero" element={<TrDinero />} />
                    <Route path="datos" element={<TrDatos />} />
                    <Route path="limitaciones" element={<TrLimitaciones />} />
                </Route>
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
