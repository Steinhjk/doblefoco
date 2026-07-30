// @ts-check
import { useMemo, useState } from 'react';
import { categories } from '../data/categories';
import { useStories } from '../hooks/useStories';
import EmptyState from '../components/EmptyState';
import NewsCard from '../components/NewsCard';
import AnimateIn from '../components/AnimateIn';
import './Categories.css';

const Categories = () => {
    const [active, setActive] = useState(null);

    const { stories, status, reason } = useStories();

    // El conteo se deriva de los datos. El campo `count` del catálogo estaba
    // desactualizado (describía solo la mitad nacional) y se eliminó.
    const countFor = (category) =>
        category.id === 'ultimas'
            ? stories.length
            : stories.filter((s) => s.category === category.name).length;

    const filtered = useMemo(() => {
        if (!active) return [];
        if (active.id === 'ultimas') return stories;
        return stories.filter((s) => s.category === active.name);
    }, [active, stories]);

    return (
        <div className="categories-page">
            <div className="page-header">
                <h1>Categorías</h1>
                <p>Explora la cobertura por sector.</p>
            </div>

            {status === 'sin-datos' && <EmptyState reason={reason} />}

            <div className="categories-grid">
                {categories.map((category) => {
                    const count = countFor(category);
                    const isActive = active?.id === category.id;

                    return (
                        <button
                            key={category.id}
                            className={`category-card ${isActive ? 'active' : ''}`}
                            aria-pressed={isActive}
                            onClick={() => setActive(isActive ? null : category)}
                        >
                            <span className="category-icon" aria-hidden="true">{category.icon}</span>
                            <h2>{category.name}</h2>
                            <span className="category-count">
                                {count} {count === 1 ? 'noticia' : 'noticias'}
                            </span>
                        </button>
                    );
                })}
            </div>

            {active && (
                <div className="category-results">
                    <div className="category-results-header">
                        <h2>{active.name}</h2>
                        <span className="category-results-count">
                            {filtered.length} {filtered.length === 1 ? 'noticia' : 'noticias'}
                        </span>
                    </div>

                    {filtered.length > 0 ? (
                        <div className="category-results-list">
                            {filtered.map((story) => (
                                <AnimateIn key={story.id}>
                                    <NewsCard story={story} />
                                </AnimateIn>
                            ))}
                        </div>
                    ) : (
                        <p className="category-empty">
                            Todavía no hay cobertura registrada en esta categoría.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Categories;
