import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Layers, Sparkles } from 'lucide-react';
import { useStories } from '../hooks/useStories';
import { getMediaByName, getBiasSpectrumColor } from '../data/mediaLogos';
import { getOrRotateNeutralImage, FALLBACK_NEUTRAL_IMAGE } from '../services/imageEngineService';
import { storyTimeLabel } from '../lib/story';
import { recordRead } from '../lib/readingHistory';
import CoverageBar from './CoverageBar';
import MediaLogo from './MediaLogo';
import './CompactHeroGrid.css';

/**
 * Portada destacada.
 *
 * Antes fijaba `newsData[0]` y `newsData.slice(1, 4)`, así que la portada era
 * idéntica en cada visita. Ahora selecciona por relevancia: primero cuántos
 * medios cubren el hecho, luego qué tan polarizada está la cobertura. Esas dos
 * señales son las que hacen que una historia merezca portada en este producto.
 */
const CompactHeroGrid = () => {
    // La portada es un destacado: si no hay cobertura real no se pinta nada, y
    // el aviso de ausencia lo da el feed de debajo una sola vez.
    const { stories } = useStories({ limit: 40 });

    const featured = useMemo(() => {
        const ranked = [...stories].sort((a, b) => {
            if (b.coverage.total !== a.coverage.total) {
                return b.coverage.total - a.coverage.total;
            }
            return b.coverage.polarization - a.coverage.polarization;
        });

        return { main: ranked[0] ?? null, secondary: ranked.slice(1, 4) };
    }, [stories]);

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = FALLBACK_NEUTRAL_IMAGE;
    };

    if (!featured.main) return null;

    const { main, secondary } = featured;

    return (
        <section className="compact-hero-section">
            <div className="compact-hero-header-row">
                <div className="hero-col-title">
                    <span className="hero-badge-tag">
                        <Sparkles size={12} aria-hidden="true" /> Destacado
                    </span>
                    <h2>Mayor cobertura del día</h2>
                </div>
                <div className="hero-col-title secondary-title-col">
                    <span className="hero-badge-tag">Radar</span>
                    <h2>Otras historias relevantes</h2>
                </div>
            </div>

            <div className="compact-hero-grid">
                <article className="hero-spotlight-card">
                    <Link
                        to={`/noticia/${main.id}`}
                        className="spotlight-image-link"
                        onClick={() => recordRead(main)}
                        tabIndex={-1}
                        aria-hidden="true"
                    >
                        <img
                            src={getOrRotateNeutralImage(main)}
                            alt=""
                            width="800"
                            height="450"
                            className="spotlight-image"
                            onError={handleImageError}
                        />
                        <span className="spotlight-category-tag">{main.category}</span>
                    </Link>

                    <div className="spotlight-body">
                        <div className="spotlight-meta">
                            <span className="meta-time">{storyTimeLabel(main)}</span>
                            <span className="meta-sources-count">
                                <Layers size={12} aria-hidden="true" /> {main.coverage.total} medios
                            </span>
                        </div>

                        <h3 className="spotlight-title">
                            <Link to={`/noticia/${main.id}`} onClick={() => recordRead(main)}>
                                {main.title}
                            </Link>
                        </h3>

                        {main.summary && <p className="spotlight-summary">{main.summary}</p>}

                        <CoverageBar coverage={main.coverage} />

                        <div className="spotlight-sources-list">
                            {main.sources.map((source, idx) => {
                                const media = getMediaByName(source.name);
                                const bias = typeof source.bias === 'number' ? source.bias : media.bias;

                                return (
                                    <a
                                        key={`${source.name}-${idx}`}
                                        href={source.url || media.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mini-media-chip"
                                        style={{ borderTopColor: getBiasSpectrumColor(bias) }}
                                        title={`Abrir ${media.name}`}
                                    >
                                        <MediaLogo media={media} size={14} />
                                        <span>{media.shortName}</span>
                                        <ExternalLink size={9} aria-hidden="true" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </article>

                <div className="hero-secondary-stack">
                    {secondary.map((story) => (
                        <article key={story.id} className="secondary-compact-card">
                            <Link
                                to={`/noticia/${story.id}`}
                                className="secondary-image-link"
                                onClick={() => recordRead(story)}
                                tabIndex={-1}
                                aria-hidden="true"
                            >
                                <img
                                    src={getOrRotateNeutralImage(story)}
                                    alt=""
                                    width="240"
                                    height="160"
                                    className="secondary-image"
                                    onError={handleImageError}
                                />
                            </Link>

                            <div className="secondary-content">
                                <div className="secondary-meta">
                                    <span className="secondary-cat">{story.category}</span>
                                    <span className="secondary-time">{storyTimeLabel(story)}</span>
                                </div>

                                <h4 className="secondary-title">
                                    <Link to={`/noticia/${story.id}`} onClick={() => recordRead(story)}>
                                        {story.title}
                                    </Link>
                                </h4>

                                <CoverageBar coverage={story.coverage} compact showLabels={false} />

                                <div className="secondary-sources-micro">
                                    {story.sources.slice(0, 3).map((source, idx) => {
                                        const media = getMediaByName(source.name);
                                        return (
                                            <a
                                                key={`${source.name}-${idx}`}
                                                href={source.url || media.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={media.name}
                                            >
                                                <MediaLogo media={media} size={16} />
                                            </a>
                                        );
                                    })}
                                    {story.sources.length > 3 && (
                                        <span className="more-sources-count">
                                            +{story.sources.length - 3}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CompactHeroGrid;
