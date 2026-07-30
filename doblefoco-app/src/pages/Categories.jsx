// @ts-check
import { useMemo, useState } from 'react';
import {
    Newspaper,
    Landmark,
    TrendingUp,
    Activity,
    Leaf,
    Cpu,
    Building2,
    Scale,
    GraduationCap,
    Trophy,
    Globe,
    Layers,
    ChevronRight,
} from 'lucide-react';
import { categories } from '../data/categories';
import { useStories } from '../hooks/useStories';
import EmptyState from '../components/EmptyState';
import NewsCard from '../components/NewsCard';
import AnimateIn from '../components/AnimateIn';
import './Categories.css';

const ICON_MAP = {
    Newspaper,
    Landmark,
    TrendingUp,
    Activity,
    Leaf,
    Cpu,
    Building2,
    Scale,
    GraduationCap,
    Trophy,
    Globe,
};

const Categories = () => {
    const [active, setActive] = useState(null);
    const { stories, status, reason } = useStories();

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
            <header className="categories-hero">
                <div className="categories-hero-inner">
                    <span className="hero-badge">
                        <Layers size={14} /> Clasificación Temática
                    </span>
                    <h1>Exploración por Categorías</h1>
                    <p className="hero-description">
                        Selecciona un sector periodístico para analizar la distribución de medios y la cobertura contrastada.
                    </p>
                </div>
            </header>

            {status === 'sin-datos' && <EmptyState reason={reason} />}

            <div className="categories-grid">
                {categories.map((category) => {
                    const count = countFor(category);
                    const isActive = active?.id === category.id;
                    const IconComponent = ICON_MAP[category.iconName] || Layers;

                    return (
                        <button
                            key={category.id}
                            className={`category-card ${isActive ? 'active' : ''}`}
                            aria-pressed={isActive}
                            onClick={() => setActive(isActive ? null : category)}
                        >
                            <div className="category-icon-wrapper">
                                <IconComponent size={22} className="category-lucide-icon" />
                            </div>
                            <div className="category-card-content">
                                <h2>{category.name}</h2>
                                <p className="category-card-desc">{category.description}</p>
                                <div className="category-card-footer">
                                    <span className="category-count">
                                        {count} {count === 1 ? 'noticia' : 'noticias'}
                                    </span>
                                    <ChevronRight size={16} className="category-arrow" />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {active && (
                <div className="category-results">
                    <div className="category-results-header">
                        <div className="category-active-title">
                            {(() => {
                                const ActiveIcon = ICON_MAP[active.iconName] || Layers;
                                return <ActiveIcon size={24} className="active-header-icon" />;
                            })()}
                            <h2>{active.name}</h2>
                        </div>
                        <span className="category-results-badge">
                            {filtered.length} {filtered.length === 1 ? 'noticia encontrada' : 'noticias encontradas'}
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
                        <div className="category-empty-state">
                            <p>Todavía no hay cobertura registrada en esta categoría.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Categories;
