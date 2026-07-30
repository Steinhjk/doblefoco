// @ts-check
import { useMemo } from 'react';
import { SlidersHorizontal, EyeOff, Globe, Flag, ChevronDown, Info } from 'lucide-react';
import NewsCard from './NewsCard';
import AnimateIn from './AnimateIn';
import { useStories } from '../hooks/useStories';
import { useFiltrosDeFeed, TAMANO_PAGINA } from '../hooks/useFiltrosDeFeed';
import { resumenDelFeed } from '../lib/resumenDelFeed.js';
import EmptyState from './EmptyState';
import { BLINDSPOT_MIN_SOURCES, SPECTRUM_LABEL_SHORT } from '../../shared/biasAnalysis.js';
import './NewsFeed.css';

const NewsFeed = () => {
    // Una sola fuente para todo el sitio (F2-03). Ya no hay respaldo al fixture:
    // aquel catálogo de demostración contenía 600 citas inventadas atribuidas a
    // 32 medios reales, y el aviso que lo acompañaba solo existía en esta
    // pantalla. O hay cobertura real, o se dice que no la hay.
    const { stories: allNews, counts, status, reason } = useStories({ limit: 100 });

    /**
     * Los filtros viven en la URL, no en useState (F3-06). Así se pueden
     * compartir, el botón «atrás» deshace el último y una recarga no devuelve a
     * la portada perdiendo el sitio.
     */
    const { filtros, visibles, asignar, verMas, hayFiltros, limpiar } = useFiltrosDeFeed(allNews.length);
    const {
        ambito: scopeFilter,
        espectro: spectrumFilter,
        ciego: blindspotFilter,
        polar: polarizationFilter,
        orden: sortBy,
    } = filtros;

    /**
     * DOS ÁMBITOS QUE NO HAY QUE MEZCLAR, y mezclarlos fue el fallo original.
     *
     * `counts` describe el catálogo entero. `allNews` son las 100 que se pidieron.
     * Las pestañas FILTRAN sobre `allNews`, así que sus cifras tienen que salir de
     * `allNews`: poner ahí el total del catálogo haría que «Internacional (20)»
     * devolviera seis resultados, que es cambiar una cifra engañosa por otra.
     *
     * El universo se declara UNA vez, en la cabecera, con las cifras de `counts`.
     * Ahí es donde el lector se enteraba mal de cuántas historias sigue el sitio.
     */
    const nationalCount = useMemo(
        () => allNews.filter((s) => s.category !== 'Internacional').length,
        [allNews]
    );
    const internationalCount = allNews.length - nationalCount;

    const resumen = resumenDelFeed(counts, allNews.length);

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

    const displayedNews = sortedNews.slice(0, visibles);
    const blindspotCount = useMemo(
        () => allNews.filter((s) => s.coverage.blindspot).length,
        [allNews]
    );
    const evaluableCount = useMemo(
        () => allNews.filter((s) => !s.coverage.insufficientCoverage).length,
        [allNews]
    );

    // La forma corta, que es la que cabe en una fila de botones. La larga —«Sin
    // línea marcada»— y su porqué están en la página de transparencia.
    const spectrumOptions = [
        ['all', 'Todos'],
        ['left', SPECTRUM_LABEL_SHORT.left],
        ['center', SPECTRUM_LABEL_SHORT.center],
        ['right', SPECTRUM_LABEL_SHORT.right],
    ];

    return (
        <div className="news-feed">
            <div className="section-header">
                <h2>Análisis de Perspectivas</h2>
                {/* Dos cifras distintas y dichas como tales: cuántas hay y
                    cuántas se están mostrando. Antes había una sola, la segunda
                    presentada como la primera. */}
                <p>
                    {resumen.multifuente} historias con cobertura multifuente
                    {resumen.seguidas !== null && <> de {resumen.seguidas} seguidas en total</>}
                    {resumen.mostradas !== null && (
                        <> · se muestran las {resumen.mostradas} con más medios cubriendo</>
                    )}
                </p>
            </div>

            {status === 'sin-datos' && <EmptyState reason={reason} />}

            <div className="scope-tabs-bar">
                <button
                    className={`scope-tab ${scopeFilter === 'all' ? 'active' : ''}`}
                    aria-pressed={scopeFilter === 'all'}
                    onClick={() => asignar('ambito', 'all')}
                >
                    <Globe size={15} aria-hidden="true" /> Todas ({allNews.length})
                </button>
                <button
                    className={`scope-tab ${scopeFilter === 'nacional' ? 'active' : ''}`}
                    aria-pressed={scopeFilter === 'nacional'}
                    onClick={() => asignar('ambito', 'nacional')}
                >
                    <Flag size={15} aria-hidden="true" /> Colombia ({nationalCount})
                </button>
                <button
                    className={`scope-tab ${scopeFilter === 'internacional' ? 'active' : ''}`}
                    aria-pressed={scopeFilter === 'internacional'}
                    onClick={() => asignar('ambito', 'internacional')}
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
                                onClick={() => asignar('espectro', value)}
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
                            onClick={() => asignar('ciego', 'all')}
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
                            onClick={() => asignar('ciego', 'only')}
                        >
                            Con punto ciego ({blindspotCount})
                        </button>
                        <button
                            className={`filter-btn ${polarizationFilter === 'high' ? 'active' : ''}`}
                            aria-pressed={polarizationFilter === 'high'}
                            onClick={() => asignar('polar', polarizationFilter === 'high' ? 'all' : 'high')}
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
                            onChange={(e) => asignar('orden', e.target.value)}
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
                    {hayFiltros && <> · <strong>{allNews.length}</strong> sin filtrar</>}
                </span>

                {/* Solo con filtros puestos. Antes esta salida existía únicamente
                    en el estado vacío, es decir, cuando ya te habías quedado sin
                    resultados: quitar un filtro exigía acordarse de cuál habías
                    puesto y deshacerlo a mano. */}
                {hayFiltros && (
                    <button type="button" className="clear-filters-inline" onClick={limpiar}>
                        Quitar filtros
                    </button>
                )}
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
                            onClick={limpiar}
                        >
                            Restablecer filtros
                        </button>
                    </div>
                )}
            </div>

            {visibles < sortedNews.length && (
                <div className="load-more-box">
                    <button
                        className="load-more-btn"
                        onClick={verMas}
                    >
                        <span>Cargar más (+{TAMANO_PAGINA})</span>
                        <ChevronDown size={16} aria-hidden="true" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default NewsFeed;
