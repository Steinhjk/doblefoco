// @ts-check
import { useMemo } from 'react';
import { SlidersHorizontal, EyeOff, Globe, Flag, ChevronDown, Info } from 'lucide-react';
import NewsCard from './NewsCard';
import AnimateIn from './AnimateIn';
import { useStories } from '../hooks/useStories';
import { useFiltrosDeFeed, TAMANO_PAGINA } from '../hooks/useFiltrosDeFeed';
import { resumenDelFeed } from '../lib/resumenDelFeed.js';
import EmptyState from './EmptyState';
import { EsqueletoTarjetas } from './Esqueleto';
import { BLINDSPOT_MIN_SOURCES, SPECTRUM_LABEL_SHORT } from '../../shared/biasAnalysis.js';
import './NewsFeed.css';

const NewsFeed = () => {
    // Una sola fuente para todo el sitio (F2-03). Ya no hay respaldo al fixture:
    // aquel catálogo de demostración contenía 600 citas inventadas atribuidas a
    // 32 medios reales, y el aviso que lo acompañaba solo existía en esta
    // pantalla. O hay cobertura real, o se dice que no la hay.
    /**
     * Los filtros viven en la URL, no en useState (F3-06). Así se pueden
     * compartir, el botón «atrás» deshace el último y una recarga no devuelve a
     * la portada perdiendo el sitio.
     *
     * Se leen ANTES de pedir las historias porque el ámbito ya no se filtra
     * aquí: viaja al servidor, de modo que cada pestaña es su propia consulta
     * paginada y su cifra puede ser la del catálogo entero.
     */
    const { filtros, visibles, asignar, verMas, hayFiltros, limpiar } = useFiltrosDeFeed(Infinity);
    const {
        ambito: scopeFilter,
        espectro: spectrumFilter,
        ciego: blindspotFilter,
        polar: polarizationFilter,
        orden: sortBy,
    } = filtros;

    const {
        stories: allNews,
        counts,
        status,
        reason,
        cargarMas,
        hayMas,
        cargandoMas,
    } = useStories({ limit: 100, ambito: scopeFilter });

    /**
     * LAS CIFRAS DE LAS PESTAÑAS SON DEL CATÁLOGO, y ahora pueden serlo.
     *
     * Antes se contaban sobre lo descargado, así que «Todas (100)» presentaba el
     * techo de la petición como el tamaño del sitio. Poner el total del catálogo
     * habría sido peor mientras el ámbito se filtrara aquí: «Internacional (102)»
     * habría devuelto 34 resultados.
     *
     * Lo que lo desbloquea es que el ámbito viaje al SERVIDOR. Cada pestaña es su
     * propia consulta paginada, así que su número es alcanzable cargando más y
     * deja de ser una promesa que la lista no cumple.
     */
    const resumen = resumenDelFeed(counts, allNews.length);

    const filteredNews = useMemo(
        () =>
            allNews.filter((story) => {
                const { coverage } = story;

                // El ámbito ya no se filtra aquí: lo aplicó la consulta.

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
        [allNews, spectrumFilter, polarizationFilter, blindspotFilter]
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
                    , ordenadas por número de medios cubriendo
                </p>
            </div>

            {status === 'sin-datos' && <EmptyState reason={reason} />}

            <div className="scope-tabs-bar">
                <button
                    className={`scope-tab ${scopeFilter === 'all' ? 'active' : ''}`}
                    aria-pressed={scopeFilter === 'all'}
                    onClick={() => asignar('ambito', 'all')}
                >
                    <Globe size={15} aria-hidden="true" /> Todas ({counts.multifuente || allNews.length})
                </button>
                <button
                    className={`scope-tab ${scopeFilter === 'nacional' ? 'active' : ''}`}
                    aria-pressed={scopeFilter === 'nacional'}
                    onClick={() => asignar('ambito', 'nacional')}
                >
                    <Flag size={15} aria-hidden="true" /> Colombia ({counts.nacional || 0})
                </button>
                <button
                    className={`scope-tab ${scopeFilter === 'internacional' ? 'active' : ''}`}
                    aria-pressed={scopeFilter === 'internacional'}
                    onClick={() => asignar('ambito', 'internacional')}
                >
                    <Globe size={15} aria-hidden="true" /> Internacional ({counts.internacional || 0})
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
                {/* «de N cargadas» y no «de N historias»: con paginación real,
                    sortedNews es lo que se ha traído hasta ahora, no el total.
                    Decir «de 100 historias» era justo el número que sobraba. */}
                <span>
                    Mostrando <strong>{displayedNews.length}</strong> de{' '}
                    <strong>{sortedNews.length}</strong> cargadas
                    {hayMas && <> · hay más</>}
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
                {/* Mientras llega la primera respuesta se dibuja la FORMA de las
                    tarjetas. Antes aquí no había nada y la página parecía rota
                    durante uno o dos segundos. */}
                {status === 'cargando' && allNews.length === 0 ? (
                    <EsqueletoTarjetas cuantas={5} />
                ) : displayedNews.length > 0 ? (
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

            {/**
              * «Cargar más» hace DOS cosas, y antes solo hacía la primera:
              * mostrar diez más de lo descargado y, cuando se agota, pedirle al
              * servidor la página siguiente. Sin lo segundo la historia 101 era
              * inalcanzable y el sitio se comportaba como si tuviera 100.
              */}
            {(visibles < sortedNews.length || hayMas) && (
                <div className="load-more-box">
                    <button
                        className="load-more-btn"
                        disabled={cargandoMas}
                        onClick={() => {
                            verMas();
                            // Se pide la siguiente página con margen, antes de
                            // llegar al final: así el botón nunca se queda sin
                            // nada que revelar mientras la respuesta viaja.
                            if (hayMas && visibles + TAMANO_PAGINA * 2 >= allNews.length) {
                                cargarMas();
                            }
                        }}
                    >
                        <span>
                            {cargandoMas ? 'Cargando…' : `Cargar más (+${TAMANO_PAGINA})`}
                        </span>
                        <ChevronDown size={16} aria-hidden="true" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default NewsFeed;
