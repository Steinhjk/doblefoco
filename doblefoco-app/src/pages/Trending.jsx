// @ts-check
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Flame, TrendingUp, Newspaper, ArrowRight, EyeOff } from 'lucide-react';
import { topCoveredStories } from '../lib/story';
import { useStories } from '../hooks/useStories';
import EmptyState from '../components/EmptyState';
import NewsCard from '../components/NewsCard';
import AnimateIn from '../components/AnimateIn';
import './Trending.css';
import { rutaDeHistoria } from '../../shared/storyPath.js';

const Trending = () => {
    const { stories, status, reason } = useStories();

    const topNews = useMemo(
        () => [...stories].sort((a, b) => (b.coverage?.total ?? 0) - (a.coverage?.total ?? 0)).slice(0, 10),
        [stories]
    );

    const topicos = useMemo(() => topCoveredStories(stories, 8), [stories]);

    return (
        <div className="trending-page">
            <header className="trending-hero">
                <div className="trending-hero-inner">
                    <span className="trending-badge">
                        <Flame size={16} className="flame-icon" /> Cobertura Simultánea
                    </span>
                    <h1>Tendencias Periodísticas</h1>
                    <p className="trending-subtitle">
                        Monitoreo en tiempo real de los hechos que concitan la mayor atención de los medios en Colombia.
                    </p>
                </div>
            </header>

            {status === 'sin-datos' && <EmptyState reason={reason} />}

            {topicos.length > 0 && (
                <section className="trending-section">
                    <div className="section-title-row">
                        <h2><TrendingUp size={20} className="section-icon" /> Ranking de Cobertura</h2>
                        <span className="section-caption">Ordenado por número de medios independientes cubriendo el hecho</span>
                    </div>

                    <div className="trending-leaderboard">
                        {topicos.map((story, index) => {
                            const blindspotLabel = story.coverage?.blindspot?.label;

                            return (
                                <AnimateIn key={story.id} delay={Math.min(index + 1, 4)}>
                                    <Link to={rutaDeHistoria(story)} className="leaderboard-card">
                                        <div className="rank-badge-col">
                                            <span className="rank-number">
                                                #{index + 1}
                                            </span>
                                        </div>

                                        <div className="leaderboard-main">
                                            <div className="leaderboard-meta">
                                                <span className="category-pill">{story.category}</span>
                                                {blindspotLabel && (
                                                    <span className="blindspot-chip">
                                                        <EyeOff size={12} /> {blindspotLabel}
                                                    </span>
                                                )}
                                            </div>
                                            <h3>{story.title}</h3>
                                        </div>

                                        <div className="leaderboard-stats">
                                            <div className="media-count-badge">
                                                <span className="count-number">{story.coverage?.total ?? 1}</span>
                                                <span className="count-label">medios cubriendo</span>
                                            </div>
                                            <ArrowRight size={18} className="card-arrow" />
                                        </div>
                                    </Link>
                                </AnimateIn>
                            );
                        })}
                    </div>
                </section>
            )}

            <section className="trending-news-section">
                <div className="section-title-row">
                    <h2><Newspaper size={20} className="section-icon" /> Historias con Mayor Alcance</h2>
                </div>

                <div className="trending-news-list">
                    {topNews.map((story) => (
                        <AnimateIn key={story.id}>
                            <NewsCard story={story} />
                        </AnimateIn>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Trending;
