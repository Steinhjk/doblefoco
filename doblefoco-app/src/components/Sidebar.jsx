import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, EyeOff, RotateCcw, Award, Layers, Mail, Info } from 'lucide-react';
import { topCoveredStories } from '../lib/story';
import { useStories } from '../hooks/useStories';
import { getHistory, clearHistory, subscribeToHistory, summarizeDiet } from '../lib/readingHistory';
import { BLINDSPOT_MIN_SOURCES } from '../../shared/biasAnalysis.js';
import NewsletterWidget from './NewsletterWidget';
import './Sidebar.css';
import { rutaDeHistoria } from '../../shared/storyPath.js';

const Sidebar = () => {
    const [history, setHistory] = useState(() => getHistory());

    useEffect(() => subscribeToHistory(() => setHistory(getHistory())), []);

    // Ya no se mezclan las historias "aprobadas" del localStorage (F2-02):
    // solo existían en el navegador de quien las aprobó.
    const { stories } = useStories({ limit: 60 });
    const trending = useMemo(() => topCoveredStories(stories, 8), [stories]);

    const blindspots = useMemo(
        () =>
            stories
                .filter((s) => s.coverage.blindspot)
                .slice(0, 3)
                .map((s) => ({
                    id: s.id,
                    title: s.title,
                    spectrum: s.coverage.blindspot.spectrum,
                    label: s.coverage.blindspot.label,
                })),
        [stories]
    );

    const evaluable = useMemo(
        () => stories.filter((s) => !s.coverage.insufficientCoverage).length,
        [stories]
    );

    const diet = useMemo(() => summarizeDiet(history), [history]);

    return (
        <aside className="sidebar">
            <div className="sidebar-section live-trends-card">
                <div className="trends-card-header">
                    {/*
                      * La llama pulsante se retiró el 2026-08-17, y la razón de
                      * Jose es la que manda: UN ADORNO TIENE QUE SOBREVIVIR A LA
                      * PEOR NOTICIA DEL DÍA. Este panel no elige qué encabeza:
                      * lo que va debajo es lo que más medios cubren a la vez, y
                      * esa misma semana era un terremoto con 289 muertos y
                      * 186.000 damnificados. Una llama que late y suelta un halo
                      * junto a eso no es un problema de estilo.
                      *
                      * Y además decía otra cosa que los datos. La lista se ordena
                      * por `coverage.total` —cuántos medios cubren el mismo
                      * hecho—; una llama afirma que algo ARDE, que es la métrica
                      * de los productos que miden atención. Aquí se mide
                      * coincidencia entre medios.
                      *
                      * `Layers` es el mismo icono que encabeza «Distribución de
                      * cobertura» en la ficha de la noticia, y por el mismo
                      * motivo: varios medios apilados sobre un solo hecho.
                      */}
                    <h3><Layers size={18} className="section-icon" aria-hidden="true" /> Temas frecuentes</h3>
                </div>
                <ul className="trending-list">
                    {trending.length === 0 && (
                        <li className="trend-empty">Sin cobertura simultánea todavía.</li>
                    )}
                    {trending.map((story, index) => (
                        <li key={story.id}>
                            <Link to={rutaDeHistoria(story)} className="trend-link">
                                <span className="trend-rank">#{index + 1}</span>
                                <span className="trend-name">{story.title}</span>
                                <span className="trend-count" title="medios que lo cubren">
                                    {story.coverage.total}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="sidebar-section">
                <h3><PieChart size={20} className="section-icon" aria-hidden="true" /> Tu dieta informativa</h3>
                <p className="diet-privacy-note">
                    Se calcula en tu navegador y no se envía a ningún servidor.
                </p>

                {!diet.hasHistory ? (
                    <p className="bias-message">{diet.recommendation}</p>
                ) : (
                    <div className="bias-calculator-active">
                        <div className="diet-stats-row">
                            {typeof diet.avgFactuality === 'number' && (
                                <div className="diet-metric-circle">
                                    <svg width="70" height="70" viewBox="0 0 36 36" className="circular-chart" role="img"
                                        aria-label={`Factualidad media de tus lecturas: ${Math.round(diet.avgFactuality * 100)} por ciento`}>
                                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <path className="circle" strokeDasharray={`${Math.round(diet.avgFactuality * 100)}, 100`}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <text x="18" y="19.5" textAnchor="middle" dominantBaseline="central" className="percentage">
                                            {Math.round(diet.avgFactuality * 100)}%
                                        </text>
                                    </svg>
                                    <span className="circle-metric-label">Factualidad</span>
                                </div>
                            )}
                            <div className="diet-metric-reads">
                                <span className="reads-count">{diet.count}</span>
                                <span className="reads-label">Noticias leídas</span>
                            </div>
                        </div>

                        <div className="diet-bias-visual">
                            <span className="diet-bias-track-label">Sesgo medio</span>
                            <div
                                className="diet-bias-track"
                                role="meter"
                                aria-valuemin={-1}
                                aria-valuemax={1}
                                aria-valuenow={Number(diet.avgBias.toFixed(2))}
                                aria-valuetext={diet.label}
                            >
                                <div className="diet-bias-indicator" style={{ left: `${diet.biasPosition}%` }} />
                            </div>
                            <div className="diet-bias-track-bounds">
                                {/* Eje de tres marcas. «Mixta» y no «Centro»
                                    ni «Sin línea»: ver SPECTRUM_LABEL. */}
                                <span>Izq</span><span>Mixta</span><span>Der</span>
                            </div>
                            <span className="diet-bias-verdict">{diet.label}</span>
                        </div>

                        <div className="diet-recommendation">
                            <h4><Award size={14} aria-hidden="true" /> Recomendación</h4>
                            <p>{diet.recommendation}</p>
                        </div>

                        <button className="clear-history-btn" onClick={clearHistory}>
                            <RotateCcw size={13} aria-hidden="true" /> Reiniciar análisis
                        </button>
                    </div>
                )}
            </div>

            <div className="sidebar-section blindspot-section-box">
                <h3><EyeOff size={18} className="section-icon" aria-hidden="true" /> Puntos ciegos</h3>

                {blindspots.length > 0 ? (
                    <>
                        <p className="blindspot-message">
                            Hechos con cobertura amplia en un lado del espectro y casi nula en el otro.
                        </p>
                        {blindspots.map((item) => (
                            <Link key={item.id} to={rutaDeHistoria(item)} className={`blindspot-item item-${item.spectrum}`}>
                                <span className={`blindspot-label ${item.spectrum}`}>
                                    <EyeOff size={12} aria-hidden="true" /> {item.label}
                                </span>
                                <span className="blindspot-title">{item.title}</span>
                            </Link>
                        ))}
                    </>
                ) : (
                    /* Estado honesto en lugar de una lista vacía o de dos
                       enlaces escritos a mano. Si no se puede medir, se dice
                       por qué no se puede medir. */
                    <div className="blindspot-unavailable">
                        <Info size={15} aria-hidden="true" />
                        <p>
                            {evaluable === 0 ? (
                                <>
                                    Todavía no se puede evaluar. Detectar una omisión requiere al
                                    menos {BLINDSPOT_MIN_SOURCES} medios cubriendo el mismo hecho;
                                    ninguna historia del catálogo actual los alcanza. Con menos
                                    fuentes, un solo medio mueve la cobertura del 0% al 33% y
                                    cualquier conclusión sería ruido.
                                </>
                            ) : (
                                <>
                                    De las {evaluable} historias con cobertura suficiente, ninguna
                                    muestra una omisión marcada por un lado del espectro.
                                </>
                            )}
                        </p>
                    </div>
                )}
            </div>

            <NewsletterWidget />
        </aside>
    );
};

export default Sidebar;
