import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, EyeOff, Globe, Flag, ChevronDown, Info } from 'lucide-react';
import NewsCard from './NewsCard';
import AnimateIn from './AnimateIn';
import { newsData } from '../data/mockData';
import { fetchFeed, isApiConfigured } from '../services/apiClient';
import { normalizeStories } from '../lib/story';
import { BLINDSPOT_MIN_SOURCES } from '../../shared/biasAnalysis.js';
import { getApprovedStories, subscribeToFeed } from '../services/storageService';
import './NewsFeed.css';

const PAGE_SIZE = 10;

const NewsFeed = () => {
    const [scopeFilter, setScopeFilter] = useState('all');
    const [spectrumFilter, setSpectrumFilter] = useState('all');
    const [blindspotFilter, setBlindspotFilter] = useState('all');
    const [polarizationFilter, setPolarizationFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const [remoteStories, setRemoteStories] = useState([]);
    const [localStories, setLocalStories] = useState([]);
    const [source, setSource] = useState(isApiConfigured ? 'loading' : 'fixture');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            // Sin VITE_API_URL no se intenta la petición. Antes se llamaba
            // siempre a http://localhost:5000, que en producción está
            // bloqueado por CSP y por contenido mixto: cada carga gastaba una
            // petición condenada a fallar y ensuciaba la consola.
            if (isApiConfigured) {
                const result = await fetchFeed({ limit: 100 });
                if (cancelled) return;

                if (result.ok && result.stories.length) {
                    setRemoteStories(normalizeStories(result.stories));
                    setSource('api');
                    return;
                }
                setSource('fixture');
            }

            setLocalStories(normalizeStories(getApprovedStories()));
        };

        load();
        const unsubscribe = subscribeToFeed(load);

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, []);

    const allNews = useMemo(() => {
        if (source === 'api' && remoteStories.length) return remoteStories;
        return [...localStories, ...normalizeStories(newsData)];
    }, [source, remoteStories, localStories]);

    const nationalCount = useMemo(
        () => allNews.filter((s) => s.category !== 'Internacional').length,
        [allNews]
    );
    const internationalCount = allNews.length - nationalCount;

    const filteredNews = useMemo(
        () =>
            allNews.filter((story) => {
                const { coverage } = story;

                if (scopeFilter === 'nacional' && story.category === 'Internacional') return false;
                if (scopeFilter === 'internacional' && story.category !== 'Internacional') return false;

                // Filtro por espectro DOMINANTE en la cobertura, no por la
                // media de sesgos. Promediar fuentes opuestas las cancela: con
                // la media, el filtro "Derecha" devolvía 0 de 200 resultados.
                if (spectrumFilter !== 'all' && coverage.dominantSpectrum !== spectrumFilter) {
                    return false;
                }

                if (polarizationFilter === 'high' && !coverage.isHighlyPolarized) return false;
                if (blindspotFilter === 'only' && !coverage.blindspot) return false;

                return true;
            }),
        [allNews, scopeFilter, spectrumFilter, polarizationFilter, blindspotFilter]
    );

    const sortedNews = useMemo(() => {
        const list = [...filteredNews];

        if (sortBy === 'polarization') {
            return list.sort((a, b) => b.coverage.polarization - a.coverage.polarization);
        }
        if (sortBy === 'coverage') {
            return list.sort((a, b) => b.coverage.total - a.coverage.total);
        }
        // "Más recientes" ahora ordena de verdad: antes el comparador era
        // `return 0` y, además, la fecha era una cadena fija sin valor
        // temporal ("Hace 45 mins").
        return list.sort(
            (a, b) => Date.parse(b.publishedAt ?? 0) - Date.parse(a.publishedAt ?? 0)
        );
    }, [filteredNews, sortBy]);

    const displayedNews = sortedNews.slice(0, visibleCount);
    const blindspotCount = useMemo(
        () => allNews.filter((s) => s.coverage.blindspot).length,
        [allNews]
    );
    const evaluableCount = useMemo(
        () => allNews.filter((s) => !s.coverage.insufficientCoverage).length,
        [allNews]
    );

    const resetPage = () => setVisibleCount(PAGE_SIZE);

    const spectrumOptions = [
        ['all', 'Todos'],
        ['left', 'Izquierda'],
        ['center', 'Centro'],
        ['right', 'Derecha'],
    ];

    return (
        <div className="news-feed">
            <div className="section-header">
                <h2>Análisis de Perspectivas</h2>
                <p>
                    {allNews.length} historias con cobertura multifuente
                    {source === 'fixture' && ' · datos de demostración'}
                </p>
            </div>

            {source === 'fixture' && (
                <div className="feed-fixture-notice" role="status">
                    <Info size={15} aria-hidden="true" />
                    <span>
                        <strong>Catálogo de demostración.</strong> La ingesta en vivo no está
                        conectada en este entorno, así que estás viendo un conjunto de datos de
                        muestra con fines de evaluación, no cobertura periodística real.
                    </span>
                </div>
            )}

            <div className="scope-tabs-bar">
                <button
                    className={`scope-tab ${scopeFilter === 'all' ? 'active' : ''}`}
                    aria-pressed={scopeFilter === 'all'}
                    onClick={() => { setScopeFilter('all'); resetPage(); }}
                >
                    <Globe size={15} aria-hidden="true" /> Todas ({allNews.length})
                </button>
                <button
                    className={`scope-tab ${scopeFilter === 'nacional' ? 'active' : ''}`}
                    aria-pressed={scopeFilter === 'nacional'}
                    onClick={() => { setScopeFilter('nacional'); resetPage(); }}
                >
                    <Flag size={15} aria-hidden="true" /> Colombia ({nationalCount})
                </button>
                <button
                    className={`scope-tab ${scopeFilter === 'internacional' ? 'active' : ''}`}
                    aria-pressed={scopeFilter === 'internacional'}
                    onClick={() => { setScopeFilter('internacional'); resetPage(); }}
                >
                    <Globe size={15} aria-hidden="true" /> Internacional ({internationalCount})
                </button>
            </div>

            <div className="feed-controls">
                <div className="controls-group">
                    <span className="controls-label">
                        <SlidersHorizontal size={14} aria-hidden="true" /> Espectro dominante:
                    </span>
                    <div className="filter-buttons">
                        {spectrumOptions.map(([value, label]) => (
                            <button
                                key={value}
                                className={`filter-btn ${spectrumFilter === value ? 'active' : ''} filter-btn-${value}`}
                                aria-pressed={spectrumFilter === value}
                                onClick={() => { setSpectrumFilter(value); resetPage(); }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="controls-group">
                    <span className="controls-label">
                        <EyeOff size={14} aria-hidden="true" /> Omisiones:
                    </span>
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${blindspotFilter === 'all' ? 'active' : ''}`}
                            aria-pressed={blindspotFilter === 'all'}
                            onClick={() => { setBlindspotFilter('all'); resetPage(); }}
                        >
                            Ver todo
                        </button>
                        <button
                            className={`filter-btn ${blindspotFilter === 'only' ? 'active' : ''}`}
                            aria-pressed={blindspotFilter === 'only'}
                            disabled={blindspotCount === 0}
                            title={
                                blindspotCount === 0
                                    ? `Ninguna historia tiene aún los ${BLINDSPOT_MIN_SOURCES} medios necesarios para evaluar omisiones`
                                    : undefined
                            }
                            onClick={() => { setBlindspotFilter('only'); resetPage(); }}
                        >
                            Con punto ciego ({blindspotCount})
                        </button>
                        <button
                            className={`filter-btn ${polarizationFilter === 'high' ? 'active' : ''}`}
                            aria-pressed={polarizationFilter === 'high'}
                            onClick={() => {
                                setPolarizationFilter((p) => (p === 'high' ? 'all' : 'high'));
                                resetPage();
                            }}
                        >
                            Cobertura polarizada
                        </button>
                    </div>
                </div>

                <div className="controls-row-2">
                    <div className="controls-group">
                        <label className="controls-label" htmlFor="feed-sort">Ordenar:</label>
                        <select
                            id="feed-sort"
                            className="sort-select"
                            value={sortBy}
                            onChange={(e) => { setSortBy(e.target.value); resetPage(); }}
                        >
                            <option value="recent">Más recientes</option>
                            <option value="coverage">Más medios cubriendo</option>
                            <option value="polarization">Mayor polarización</option>
                        </select>
                    </div>
                </div>
            </div>

            {evaluableCount === 0 && (
                <p className="feed-coverage-caveat">
                    <Info size={13} aria-hidden="true" />
                    Ninguna historia alcanza todavía los {BLINDSPOT_MIN_SOURCES} medios necesarios
                    para afirmar que existe un punto ciego. Con menos fuentes, cualquier
                    proporción es ruido estadístico.
                </p>
            )}

            <div className="feed-results-summary">
                <span>
                    Mostrando <strong>{displayedNews.length}</strong> de{' '}
                    <strong>{sortedNews.length}</strong> historias
                </span>
            </div>

            <div className="feed-container">
                {displayedNews.length > 0 ? (
                    displayedNews.map((story) => (
                        <AnimateIn key={story.id}>
                            <NewsCard story={story} />
                        </AnimateIn>
                    ))
                ) : (
                    <div className="feed-empty">
                        <p>Ninguna historia coincide con estos filtros.</p>
                        <button
                            className="reset-filters-btn"
                            onClick={() => {
                                setSpectrumFilter('all');
                                setBlindspotFilter('all');
                                setPolarizationFilter('all');
                                setScopeFilter('all');
                                setSortBy('recent');
                                resetPage();
                            }}
                        >
                            Restablecer filtros
                        </button>
                    </div>
                )}
            </div>

            {visibleCount < sortedNews.length && (
                <div className="load-more-box">
                    <button
                        className="load-more-btn"
                        onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    >
                        <span>Cargar más (+{PAGE_SIZE})</span>
                        <ChevronDown size={16} aria-hidden="true" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default NewsFeed;
