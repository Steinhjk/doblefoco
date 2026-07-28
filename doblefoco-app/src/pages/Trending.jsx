// @ts-check
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { topCoveredStories } from '../lib/story';
import { useStories } from '../hooks/useStories';
import EmptyState from '../components/EmptyState';
import NewsCard from '../components/NewsCard';
import AnimateIn from '../components/AnimateIn';
import './Trending.css';

const Trending = () => {
    // Se destacan las historias con más medios cubriéndolas, no las primeras
    // del array.
    const { stories, status, reason } = useStories();

    const topNews = useMemo(
        () => [...stories].sort((a, b) => b.coverage.total - a.coverage.total).slice(0, 10),
        [stories]
    );

    // Los "temas" son ahora los hechos con más medios cubriéndolos, derivados
    // de la cobertura real. Los ocho del fixture traían contadores inventados.
    const topicos = useMemo(() => topCoveredStories(stories, 8), [stories]);

    return (
        <div className="trending-page">
            <div className="page-header">
                <h1>Tendencias</h1>
                <p>Los temas con más cobertura simultánea en la prensa colombiana.</p>
            </div>

            {status === 'sin-datos' && <EmptyState reason={reason} />}

            <div className="trending-topics">
                {topicos.map((story, index) => (
                    <AnimateIn key={story.id} delay={Math.min(index + 1, 3)}>
                        <Link to={`/noticia/${story.id}`} className="topic-card">
                            <span className="topic-rank">#{index + 1}</span>
                            <div className="topic-info">
                                <h2>{story.title}</h2>
                                <span className="topic-articles">
                                    {story.coverage.total} medios lo cubren
                                </span>
                            </div>
                        </Link>
                    </AnimateIn>
                ))}
            </div>

            <div className="trending-news">
                <h2>Historias con mayor cobertura</h2>
                {topNews.map((story) => (
                    <AnimateIn key={story.id}>
                        <NewsCard story={story} />
                    </AnimateIn>
                ))}
            </div>
        </div>
    );
};

export default Trending;
