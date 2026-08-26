// @ts-check
import { lazy, Suspense, useId, useMemo, useState } from 'react';
import { SlidersHorizontal, EyeOff, Globe, Flag, ChevronDown, Info, Map as MapaIcono } from 'lucide-react';
import NewsCard from './NewsCard';
import AnimateIn from './AnimateIn';
import { useStories } from '../hooks/useStories';
import { useFiltrosDeFeed, TAMANO_PAGINA } from '../hooks/useFiltrosDeFeed';
import { resumenDelFeed } from '../lib/resumenDelFeed.js';
import { repartoGeografico } from '../lib/geografiaDelFeed.js';
import { useConteosPorDepartamento } from '../hooks/useConteosPorDepartamento';
import EmptyState from './EmptyState';
import { EsqueletoTarjetas } from './Esqueleto';
import {
    mediosParaAfirmarAusencia,
    BLINDSPOT_MIN_SOURCES,
    BLINDSPOT_MAX_RATIO,
    SPECTRUM_LABEL_SHORT,
} from '../../shared/biasAnalysis.js';
import { DEPARTAMENTO_POR_SLUG, slugDepartamento } from '../../shared/geografia.js';
import { decimal } from '../../shared/numeros.js';
import './NewsFeed.css';

/**
 * EL MAPA SE DESCARGA AL ABRIRLO, no al entrar en la portada.
 *
 * La geometría de los 32 departamentos son 40 kB, 15,8 kB comprimidos: más de
 * la mitad de todo el JavaScript de la portada, para un panel que arranca
 * plegado. Con `lazy` se va a su propio trozo y solo lo paga quien lo abre.
 *
 * El filtro NO depende de esto: el reparto por departamento lo calcula
 * `geografiaDelFeed`, que solo necesita el detector. Un enlace con `?depto=`
 * recorta el feed aunque el trozo del mapa todavía esté viajando.
 */
const MapaDepartamentos = lazy(() => import('./MapaDepartamentos'));

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
        depto: deptoFilter,
    } = filtros;

    /**
     * El mapa arranca plegado, salvo que la URL ya traiga departamento: quien
     * llega por un enlace compartido tiene que ver de dónde sale su filtro, no
     * un feed recortado sin explicación visible.
     */
    const [mapaAbierto, setMapaAbierto] = useState(() => deptoFilter !== 'all');
    const idPanelMapa = useId();

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

    /**
     * De qué departamento habla cada historia, y cuántas por departamento.
     *
     * LOS CONTEOS SON DEL CATÁLOGO y vienen del servidor; el reparto por
     * historia es de lo descargado, porque la lista de abajo solo puede mostrar
     * lo que se ha bajado. Son dos cosas distintas y confundirlas es lo que
     * hacía que el color del mapa creciera al pulsar «cargar más».
     */
    const { conteos: conteosDelCatalogo } = useConteosPorDepartamento();
    const geografia = useMemo(
        () => repartoGeografico(allNews, conteosDelCatalogo),
        [allNews, conteosDelCatalogo]
    );

    /** El nombre que corresponde al slug de la URL, o `null` si no hay filtro. */
    const deptoSeleccionado = DEPARTAMENTO_POR_SLUG[deptoFilter] ?? null;

    const filteredNews = useMemo(
        () =>
            allNews.filter((story) => {
                const { coverage } = story;

                // El ámbito ya no se filtra aquí: lo aplicó la consulta.

                // El departamento se lee del reparto ya calculado, no se vuelve
                // a detectar: hacerlo aquí repetiría el análisis del titular en
                // cada repintado y por cada historia.
                if (deptoSeleccionado && geografia.porHistoria.get(story.id) !== deptoSeleccionado) {
                    return false;
                }

                // Filtro por espectro DOMINANTE en la cobertura, no por la
                // media de sesgos. Promediar fuentes opuestas las cancela: con
                // la media, el filtro "Derecha" devolvía 0 de 200 resultados.
                if (spectrumFilter !== 'all' && coverage.dominantSpectrum !== spectrumFilter) {
                    return false;
                }

                if (polarizationFilter === 'high' && !coverage.isHighlyPolarized) return false;
                if (blindspotFilter === 'only' && !coverage.ausencia) return false;

                return true;
            }),
        [allNews, spectrumFilter, polarizationFilter, blindspotFilter, deptoSeleccionado, geografia]
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
    /*
     * SE CUENTAN LAS AUSENCIAS, NO LOS PUNTOS CIEGOS, y la diferencia es el
     * producto entero.
     *
     * Una AUSENCIA es un hecho de la lista de medios: aquí no aparece ninguno
     * de ese espectro. Un PUNTO CIEGO es una afirmación sobre el
     * comportamiento, y hoy sale cero porque exige 14 medios en una historia y
     * la mayor tiene 10.
     *
     * Contar los puntos ciegos dejaba este filtro permanentemente en «(0)» y
     * desactivado: una función que el sitio anuncia y nunca puede usarse. Con
     * las ausencias enseña 38 de 100, que es información real — sobre todo su
     * reparto: 35 de esas 38 son de Política.
     */
    /**
     * Qué espectro es el que falta en estas historias.
     *
     * Se lee del corpus en vez de suponer «izquierda»: hoy son 38 de 38, pero
     * dar por hecho el lado es exactamente cómo se escriben los textos que
     * caducan sin avisar.
     */
    const espectroQueFalta = useMemo(() => {
        const cuenta = {};
        for (const s of allNews) {
            const e = s.coverage.ausencia?.spectrum;
            if (e) cuenta[e] = (cuenta[e] ?? 0) + 1;
        }
        const masFrecuente = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0]?.[0];
        return /** @type {'left'|'center'|'right'} */ (masFrecuente ?? 'left');
    }, [allNews]);

    /** El contexto viaja en cada ausencia; basta con leerlo de la primera. */
    const contextoAusencia = useMemo(
        () => allNews.find((s) => s.coverage.ausencia?.contexto)?.coverage.ausencia.contexto ?? null,
        [allNews]
    );

    /** La historia más cubierta que se ha traído, para decir cuánto falta. */
    const maxMedios = useMemo(
        () => allNews.reduce((m, s) => Math.max(m, s.coverage.total ?? 0), 0),
        [allNews]
    );

    const blindspotCount = useMemo(
        () => allNews.filter((s) => s.coverage.ausencia).length,
        [allNews]
    );

    /**
     * De las marcadas, cuántas están de verdad en cero.
     *
     * NO SON LO MISMO Y HAY QUE DECIRLO. La regla que las selecciona compara una
     * proporción —15 % o menos—, así que en una historia grande cabe un medio
     * del lado que se dice que falta. Este aviso decía «no aparece ningún
     * medio», y el 2026-08-25 eso era falso en 5 de 44. Se cuentan las dos
     * cosas en vez de elegir la frase más redonda.
     */
    const sinNingunMedio = useMemo(
        () => allNews.filter((s) => s.coverage.ausencia?.presentes === 0).length,
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
                                    : 'Historias donde falta por completo un lado del espectro. No es una acusación: mire la frecuencia.'
                            }
                            onClick={() => asignar('ciego', 'only')}
                        >
                            Falta un lado ({blindspotCount})
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

                {/*
                  * MAPA. Plegado por omisión: son 33 nombres y un mapa, y
                  * abierto siempre empujaría el feed media pantalla hacia
                  * abajo en cada visita. El botón lleva el departamento puesto
                  * escrito, para que un filtro activo no quede escondido
                  * detrás de un panel cerrado.
                  */}
                <div className="controls-group">
                    <span className="controls-label">
                        <MapaIcono size={14} aria-hidden="true" /> Mapa:
                    </span>
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${mapaAbierto || deptoSeleccionado ? 'active' : ''}`}
                            aria-expanded={mapaAbierto}
                            aria-controls={idPanelMapa}
                            /*
                             * En internacional no se ofrece: el etiquetado por
                             * departamento se salta esas historias a propósito
                             * —«Santander» también es una ciudad de España— así
                             * que aquí el mapa saldría entero a cero y parecería
                             * una avería en vez de una decisión.
                             */
                            disabled={scopeFilter === 'internacional'}
                            title={
                                scopeFilter === 'internacional'
                                    ? 'El departamento solo se etiqueta en las noticias de Colombia'
                                    : undefined
                            }
                            onClick={() => setMapaAbierto((abierto) => !abierto)}
                        >
                            {deptoSeleccionado ?? 'Por departamento'}
                            <ChevronDown
                                size={14}
                                aria-hidden="true"
                                className={`mapa-chevron ${mapaAbierto ? 'esta-abierto' : ''}`}
                            />
                        </button>
                    </div>
                </div>

                {mapaAbierto && scopeFilter !== 'internacional' && (
                    <div id={idPanelMapa} className="mapa-panel">
                        <Suspense
                            fallback={
                                <p className="mapa-cargando" role="status">
                                    Cargando el mapa…
                                </p>
                            }
                        >
                            <MapaDepartamentos
                                conteos={geografia.conteos}
                                maximo={geografia.maximo}
                                etiquetadas={geografia.etiquetadas}
                                total={geografia.total}
                                vacios={geografia.vacios}
                                delCatalogo={geografia.delCatalogo}
                                seleccionado={deptoSeleccionado}
                                onSeleccionar={(nombre) =>
                                    asignar('depto', nombre ? slugDepartamento(nombre) : 'all')
                                }
                            />
                        </Suspense>
                    </div>
                )}

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

            {/*
              * EL HALLAZGO ES LA LISTA, NO CADA ELEMENTO.
              *
              * Sin esta caja, 38 etiquetas «sin medios de izquierda» seguidas
              * se leen como 38 acusaciones. Con ella se leen como lo que son:
              * el retrato de un catálogo donde la izquierda son 13 de 72 medios
              * y falta en 9 de cada 10 historias evaluables.
              *
              * El proyecto ya pagó esto una vez —treinta «punto ciego de la
              * izquierda» y cero de la derecha, midiendo cadencia de
              * publicación y presentándolo como comportamiento editorial—, así
              * que el número que lo desmiente va ARRIBA y no en una nota al pie.
              */}
            {blindspotFilter === 'only' && contextoAusencia && (
                <div className="feed-ausencia-aviso">
                    <p className="ausencia-aviso-titulo">
                        <EyeOff size={15} aria-hidden="true" />
                        Esto no es una lista de omisiones deliberadas
                    </p>
                    <p>
                        Son las historias donde un lado del espectro{' '}
                        <strong>no llega al {decimal(BLINDSPOT_MAX_RATIO * 100, 0)} % de la cobertura</strong>
                        {sinNingunMedio < blindspotCount ? (
                            <> — en {sinNingunMedio} de las {blindspotCount} no aparece ninguno, y en el
                            resto aparece alguno suelto</>
                        ) : (
                            <>, y en todas ellas hoy no aparece ninguno</>
                        )}
                        . Hoy ese lado es{' '}
                        <strong>{SPECTRUM_LABEL_SHORT[espectroQueFalta]?.toLowerCase()}</strong>, que falta en{' '}
                        <strong>{decimal(contextoAusencia.frecuencia * 100, 0)} %</strong> de las{' '}
                        {contextoAusencia.evaluables} historias con {BLINDSPOT_MIN_SOURCES} medios
                        o más. Con esa frecuencia, señalar una historia concreta no dice nada
                        sobre ella.
                    </p>
                    <p className="ausencia-aviso-nota">
                        Lo que sí se puede leer aquí es <strong>cuáles son</strong> y de qué
                        hablan. Para afirmar que una ausencia sorprende harían falta{' '}
                        {mediosParaAfirmarAusencia(espectroQueFalta)} medios en una sola historia, y la más cubierta
                        de ahora tiene {maxMedios}.
                    </p>
                </div>
            )}

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
