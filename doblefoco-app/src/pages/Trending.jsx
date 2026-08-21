// @ts-check
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { topCoveredStories, storyTimeLabel } from '../lib/story';
import { useStories } from '../hooks/useStories';
import EmptyState from '../components/EmptyState';
import CoverageBar from '../components/CoverageBar';
import AnimateIn from '../components/AnimateIn';
import './Trending.css';
import { rutaDeHistoria } from '../../shared/storyPath.js';
import { nombreDeSeccion } from '../lib/seccion';
import { categories } from '../data/categories';

/**
 * TENDENCIAS — una sola lista, y por qué antes eran dos.
 *
 * LA PÁGINA SE REPETÍA A SÍ MISMA (medido el 2026-08-21)
 * ------------------------------------------------------
 * Había dos bloques bajo dos títulos que prometían cosas distintas —«Los temas
 * con más cobertura» arriba y «Historias con mayor cobertura» abajo— y los dos
 * salían de la MISMA consulta: `topCoveredStories(stories, 8)` y `stories`
 * ordenadas por `coverage.total`. Contra el feed de producción, **8 de las 10
 * historias del segundo bloque eran exactamente las 8 tarjetas del primero.**
 *
 * Dos encabezados distintos sobre el mismo dato no es un problema de estilo:
 * le dice al lector que está viendo dos medidas cuando está viendo una.
 *
 * LO QUE SE MIDIÓ ANTES DE DESCARTAR LA ALTERNATIVA
 * -------------------------------------------------
 * La idea natural era que el segundo bloque respondiera otra pregunta usando lo
 * que ya se calcula por historia: punto ciego, énfasis, polarización. **No da.**
 * En las 100 historias del feed había **0 con punto ciego**, 13 con énfasis y 4
 * muy polarizadas; y las de polarización más alta tenían 3 o 4 medios, que es
 * justo el ruido contra el que existe `insufficientCoverage` —con cuatro
 * fuentes, una sola mueve la proporción un 25 %—. Un bloque así saldría vacío
 * casi siempre, y cuando se llenara, con lo más débil.
 *
 * Así que la página hace una sola cosa y la hace entera: **el ranking de lo que
 * más medios cubren a la vez, con el reparto por espectro en cada fila**, que es
 * lo único que esta página puede decir y no dice ninguna otra.
 *
 * LOS ESTILOS VAN POR CLASE, NO POR ETIQUETA
 * ------------------------------------------
 * El titular se veía enorme porque `Trending.css` estilizaba `.topic-info h3` y
 * el JSX renderizaba un `<h2>`. La regla no aplicaba nunca y el titular caía al
 * tamaño por defecto del navegador —`1.5em`— dentro de una tarjeta estrecha.
 * Ningún error salta: es la costura JSX↔CSS, la misma que dejó los puntos del
 * mapa invisibles.
 *
 * Por eso aquí cada texto lleva su clase y el CSS no selecciona por etiqueta:
 * cambiar el nivel de encabezado por razones de accesibilidad deja de poder
 * desmaquetar la página en silencio.
 */
const CUANTAS = 12;

const Trending = () => {
    const { stories, status, reason } = useStories();

    /*
     * `topCoveredStories` ya exige más de un medio, que es lo que convierte una
     * noticia en tendencia: una historia de un solo medio no es «lo que la
     * prensa está cubriendo», es lo que publicó alguien.
     */
    const ranking = useMemo(() => topCoveredStories(stories, CUANTAS), [stories]);

    return (
        <div className="trending-page">
            <div className="page-header">
                <h1>Tendencias</h1>
                <p>
                    Los hechos que más medios están cubriendo a la vez, y cómo se reparte esa
                    cobertura por el espectro.
                </p>
            </div>

            {status === 'sin-datos' && <EmptyState reason={reason} />}

            {/* Un ranking es una lista ordenada de verdad: así el lector de
                pantalla anuncia la posición sin que el número tenga que leerse,
                y por eso el numeral de al lado es decorativo. */}
            <ol className="trend-list">
                {ranking.map((story, index) => (
                    /*
                     * `AnimateIn` va DENTRO del <li>, no fuera. Envolviéndolo
                     * quedaba `<ol> > <div> > <li>`, que es HTML inválido y le
                     * quita al <ol> justo lo que se vino a buscar: que el lector
                     * de pantalla anuncie la posición en la lista.
                     */
                    <li className="trend-item" key={story.id}>
                        <AnimateIn delay={Math.min(index + 1, 3)}>
                            <Link to={rutaDeHistoria(story)} className="trend-row">
                                <span className="trend-rank" aria-hidden="true">
                                    {index + 1}
                                </span>

                                <div className="trend-body">
                                    <h2 className="trend-title">{story.title}</h2>

                                    <p className="trend-meta">
                                        <span className="trend-medios">
                                            {story.coverage.total} medios
                                        </span>
                                        <span className="trend-sep" aria-hidden="true">
                                            ·
                                        </span>
                                        <span>{nombreDeSeccion(story, categories)}</span>
                                        <span className="trend-sep" aria-hidden="true">
                                            ·
                                        </span>
                                        <span>{storyTimeLabel(story)}</span>
                                    </p>

                                    {/* Sin etiquetas: la línea de arriba ya dice
                                        cuántos medios son, y repetirlo convierte
                                        la barra en decorado. El resumen accesible
                                        viaja igual en su `aria-label`. */}
                                    <CoverageBar
                                        coverage={story.coverage}
                                        compact
                                        showLabels={false}
                                    />
                                </div>
                            </Link>
                        </AnimateIn>
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default Trending;
