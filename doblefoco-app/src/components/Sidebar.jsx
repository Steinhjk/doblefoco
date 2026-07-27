import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, EyeOff, RotateCcw, Award, Flame, Mail, Info } from 'lucide-react';
import { newsData, trendingTopics } from '../data/mockData';
import { normalizeStories } from '../lib/story';
import { getHistory, clearHistory, subscribeToHistory, summarizeDiet } from '../lib/readingHistory';
import { getApprovedStories, subscribeToFeed } from '../services/storageService';
import { BLINDSPOT_MIN_SOURCES } from '../../shared/biasAnalysis.js';
import NewsletterWidget from './NewsletterWidget';
import './Sidebar.css';

const Sidebar = () => {
    const [history, setHistory] = useState(() => getHistory());
    const [approved, setApproved] = useState(() => getApprovedStories());

    useEffect(() => subscribeToHistory(() => setHistory(getHistory())), []);
    useEffect(() => subscribeToFeed(() => setApproved(getApprovedStories())), []);

    const stories = useMemo(
        () => normalizeStories([...approved, ...newsData]),
        [approved]
    );

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
                    <h3><Flame size={18} className="flame-pulse-icon" aria-hidden="true" /> Temas frecuentes</h3>
                </div>
                <ul className="trending-list">
                    {trendingTopics.map((topic, index) => (
                        <li key={topic.id}>
                            <Link to={`/buscar?q=${encodeURIComponent(topic.name)}`} className="trend-link">
                                <span className="trend-rank">#{index + 1}</span>
                                <span className="trend-name">{topic.name}</span>
                                <span className="trend-count">{topic.articles}</span>
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
                                <span>Izq</span><span>Centro</span><span>Der</span>
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
                            <Link key={item.id} to={`/noticia/${item.id}`} className={`blindspot-item item-${item.spectrum}`}>
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
