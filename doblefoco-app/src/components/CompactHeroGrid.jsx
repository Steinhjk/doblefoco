// @ts-check
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Layers, Sparkles } from 'lucide-react';
import { useStories } from '../hooks/useStories';
import { getMediaByName, getBiasSpectrumColor } from '../data/mediaLogos';
import StoryImage from './StoryImage';
import { EsqueletoHero } from './Esqueleto';
import { tieneImagen } from '../services/imageEngineService';
import { storyTimeLabel } from '../lib/story';
import { recordRead } from '../lib/readingHistory';
import CoverageBar from './CoverageBar';
import MediaLogo from './MediaLogo';
import './CompactHeroGrid.css';
import { rutaDeHistoria } from '../../shared/storyPath.js';

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
    const { stories, status } = useStories({ limit: 40 });

    const featured = useMemo(() => {
        const ranked = [...stories].sort((a, b) => {
            if (b.coverage.total !== a.coverage.total) {
                return b.coverage.total - a.coverage.total;
            }
            return b.coverage.polarization - a.coverage.polarization;
        });

        return { main: ranked[0] ?? null, secondary: ranked.slice(1, 4) };
    }, [stories]);

    // Mientras llega la respuesta se reserva el sitio con la forma del destacado.
    // Devolver null aquí era la mitad de la pantalla en blanco al recargar.
    if (status === 'cargando' && !stories.length) return <EsqueletoHero />;

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
                    {/* Sin imagen no se deja el hueco: el titular sube arriba. */}
                    {tieneImagen(main) && (
                        <Link
                            to={rutaDeHistoria(main)}
                            className="spotlight-image-link"
                            onClick={() => recordRead(main)}
                            tabIndex={-1}
                            aria-hidden="true"
                        >
                            <StoryImage
                                story={main}
                                className="spotlight-image"
                                width={800}
                                height={450}
                                eager
                            >
                                <span className="spotlight-category-tag">{main.category}</span>
                            </StoryImage>
                        </Link>
                    )}

                    <div className="spotlight-body">
                        <div className="spotlight-meta">
                            {!tieneImagen(main) && main.category && (
                                <span className="spotlight-category-inline">{main.category}</span>
                            )}
                            <span className="meta-time">{storyTimeLabel(main)}</span>
                            <span className="meta-sources-count">
                                <Layers size={12} aria-hidden="true" /> {main.coverage.total} medios
                            </span>
                        </div>

                        <h3 className="spotlight-title">
                            <Link to={rutaDeHistoria(main)} onClick={() => recordRead(main)}>
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
                            {tieneImagen(story) && (
                                <Link
                                    to={rutaDeHistoria(story)}
                                    className="secondary-image-link"
                                    onClick={() => recordRead(story)}
                                    tabIndex={-1}
                                    aria-hidden="true"
                                >
                                    <StoryImage
                                        story={story}
                                        className="secondary-image"
                                        width={240}
                                        height={160}
                                        showCredit={false}
                                    />
                                </Link>
                            )}

                            <div className="secondary-content">
                                <div className="secondary-meta">
                                    <span className="secondary-cat">{story.category}</span>
                                    <span className="secondary-time">{storyTimeLabel(story)}</span>
                                </div>

                                <h4 className="secondary-title">
                                    <Link to={rutaDeHistoria(story)} onClick={() => recordRead(story)}>
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
