import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Award, EyeOff, Info } from 'lucide-react';
import { topCoveredStories, selectDiverseBlindspots } from '../lib/story';
import { useStories } from '../hooks/useStories';
import { getHistory, clearHistory, subscribeToHistory, summarizeDiet } from '../lib/readingHistory';
import './MobileSidebar.css';
import { rutaDeHistoria } from '../../shared/storyPath.js';

/**
 * Versión móvil del sidebar.
 *
 * Antes tenía DOS puntos ciegos escritos a mano ("Crisis ambiental en el
 * Chocó", "Inversión extranjera en caída") que ni siquiera enlazaban a
 * noticias. En escritorio el cálculo sí era dinámico, así que la mayoría del
 * tráfico —móvil— veía una versión falsa de la función principal. Ahora ambos
 * consumen exactamente la misma lógica.
 */
const MobileSidebar = () => {
    const [expanded, setExpanded] = useState(null);
    const [history, setHistory] = useState(() => getHistory());

    useEffect(() => subscribeToHistory(() => setHistory(getHistory())), []);

    const { stories } = useStories({ limit: 60 });
    const trending = useMemo(() => topCoveredStories(stories, 8), [stories]);

    const blindspots = useMemo(
        () => selectDiverseBlindspots(stories, 3),
        [stories]
    );

    const diet = useMemo(() => summarizeDiet(history), [history]);
    const toggle = (section) => setExpanded((prev) => (prev === section ? null : section));

    const sections = [
        { id: 'trends', label: 'Temas frecuentes' },
        { id: 'diet', label: 'Mi dieta informativa' },
        { id: 'blindspots', label: 'Puntos ciegos' },
    ];

    return (
        <div className="mobile-sidebar">
            <div className="mobile-sidebar-inner">
                {sections.map(({ id, label }) => (
                    <div key={id}>
                        <button
                            className={`mobile-sidebar-toggle ${expanded === id ? 'active' : ''}`}
                            onClick={() => toggle(id)}
                            aria-expanded={expanded === id}
                            aria-controls={`mobile-panel-${id}`}
                        >
                            <span className="mobile-sidebar-toggle-label">{label}</span>
                            <span className="mobile-sidebar-toggle-icon" aria-hidden="true">
                                {expanded === id ? '−' : '+'}
                            </span>
                        </button>

                        {expanded === id && (
                            <div className="mobile-sidebar-content" id={`mobile-panel-${id}`}>
                                {id === 'trends' && (
                                    <ul className="mobile-trending-list">
                                        {trending.length === 0 && (
                                            <li className="trend-empty">Sin cobertura simultánea todavía.</li>
                                        )}
                                        {trending.map((story, index) => (
                                            <li key={story.id}>
                                                <Link
                                                    to={rutaDeHistoria(story)}
                                                    className="mobile-trend-link"
                                                >
                                                    <span className="mobile-trend-rank">#{index + 1}</span>
                                                    <span className="mobile-trend-name">{story.title}</span>
                                                    <span className="mobile-trend-count">{story.coverage.total}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {id === 'diet' && (
                                    !diet.hasHistory ? (
                                        <p className="mobile-diet-message">{diet.recommendation}</p>
                                    ) : (
                                        <div className="mobile-diet-active">
                                            <div className="mobile-diet-metrics">
                                                {typeof diet.avgFactuality === 'number' && (
                                                    <div className="mobile-metric">
                                                        <svg width="50" height="50" viewBox="0 0 36 36" className="circular-chart"
                                                            role="img"
                                                            aria-label={`Factualidad media: ${Math.round(diet.avgFactuality * 100)} por ciento`}>
                                                            <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                            <path className="circle" strokeDasharray={`${Math.round(diet.avgFactuality * 100)}, 100`}
                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                            <text x="18" y="19.5" textAnchor="middle" dominantBaseline="central" className="percentage">
                                                                {Math.round(diet.avgFactuality * 100)}%
                                                            </text>
                                                        </svg>
                                                        <span className="mobile-metric-label">Factualidad</span>
                                                    </div>
                                                )}
                                                <div className="mobile-metric-reads">
                                                    <span className="mobile-reads-count">{diet.count}</span>
                                                    <span className="mobile-reads-label">Leídas</span>
                                                </div>
                                            </div>

                                            <div className="mobile-diet-bias">
                                                <span className="mobile-bias-label">
                                                    Sesgo medio: <strong>{diet.label}</strong>
                                                </span>
                                                <div
                                                    className="mobile-bias-track"
                                                    role="meter"
                                                    aria-valuemin={-1}
                                                    aria-valuemax={1}
                                                    aria-valuenow={Number(diet.avgBias.toFixed(2))}
                                                    aria-valuetext={diet.label}
                                                >
                                                    <div className="mobile-bias-indicator" style={{ left: `${diet.biasPosition}%` }} />
                                                </div>
                                            </div>

                                            <div className="mobile-diet-recommendation">
                                                <h4><Award size={12} aria-hidden="true" /> Recomendación</h4>
                                                <p>{diet.recommendation}</p>
                                            </div>

                                            <button className="mobile-clear-btn" onClick={clearHistory}>
                                                <RotateCcw size={11} aria-hidden="true" /> Reiniciar análisis
                                            </button>
                                        </div>
                                    )
                                )}

                                {id === 'blindspots' && (
                                    blindspots.length > 0 ? (
                                        blindspots.map((story) => (
                                            <Link
                                                key={story.id}
                                                to={rutaDeHistoria(story)}
                                                className="mobile-blindspot-item"
                                            >
                                                <span className={`mobile-blindspot-label ${story.coverage.blindspot.spectrum}`}>
                                                    <EyeOff size={11} aria-hidden="true" /> {story.coverage.blindspot.label}
                                                </span>
                                                <span className="mobile-blindspot-title">{story.title}</span>
                                            </Link>
                                        ))
                                    ) : (
                                        <p className="mobile-blindspot-desc">
                                            <Info size={13} aria-hidden="true" /> Todavía no hay historias con
                                            suficientes medios para afirmar que existe una omisión.
                                        </p>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MobileSidebar;
