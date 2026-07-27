import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { trendingTopics, newsData } from '../data/mockData';
import { normalizeStories } from '../lib/story';
import NewsCard from '../components/NewsCard';
import AnimateIn from '../components/AnimateIn';
import './Trending.css';

const Trending = () => {
    // Se destacan las historias con más medios cubriéndolas, no las primeras
    // del array.
    const topNews = useMemo(
        () =>
            normalizeStories(newsData)
                .sort((a, b) => b.coverage.total - a.coverage.total)
                .slice(0, 10),
        []
    );

    return (
        <div className="trending-page">
            <div className="page-header">
                <h1>Tendencias</h1>
                <p>Los temas con más cobertura simultánea en la prensa colombiana.</p>
            </div>

            <div className="trending-topics">
                {trendingTopics.map((topic, index) => (
                    <AnimateIn key={topic.id} delay={Math.min(index + 1, 3)}>
                        <Link
                            to={`/buscar?q=${encodeURIComponent(topic.name)}`}
                            className="topic-card"
                        >
                            <span className="topic-rank">#{index + 1}</span>
                            <div className="topic-info">
                                <h2>{topic.name}</h2>
                                <span className="topic-articles">{topic.articles} artículos</span>
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
