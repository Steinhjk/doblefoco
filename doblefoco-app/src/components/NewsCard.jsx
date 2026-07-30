// @ts-check
import { Link } from 'react-router-dom';
import { EyeOff, ExternalLink, HelpCircle } from 'lucide-react';
import { getMediaByName, getBiasSpectrumColor } from '../data/mediaLogos';
import StoryImage from './StoryImage';
import { tieneImagen } from '../services/imageEngineService';
import { normalizeStory, storyTimeLabel, formatAbsoluteTime } from '../lib/story';
import { recordRead } from '../lib/readingHistory';
import CoverageBar from './CoverageBar';
import MediaLogo from './MediaLogo';
import './NewsCard.css';
import { rutaDeHistoria } from '../../shared/storyPath.js';

const NewsCard = ({ story: rawStory }) => {
    // Tolerante a historias sin normalizar para que ninguna pantalla reviente
    // por una diferencia de forma entre el backend y el fixture.
    const story = rawStory?.coverage ? rawStory : normalizeStory(rawStory);
    if (!story) return null;

    const { coverage } = story;
    const timeLabel = storyTimeLabel(story);
    const absoluteTime = formatAbsoluteTime(story.publishedAt);

    // La mayoría de los feeds no traen imagen, así que la tarjeta sin foto es el
    // caso normal y el layout se adapta en vez de dejar la columna vacía.
    const muestraImagen = tieneImagen(story);

    return (
        <article className="news-card">
            {/* El punto ciego solo se afirma cuando hay fuentes suficientes
                para poder afirmarlo. Con 3 o 4 medios, cualquier proporción es
                ruido: una sola fuente mueve la cobertura del 0% al 33%. */}
            {coverage.blindspot && (
                <div className={`card-blindspot-alert ${coverage.blindspot.spectrum}`}>
                    <EyeOff size={13} />
                    <strong>{coverage.blindspot.label}</strong>: {coverage.blindspot.description}
                </div>
            )}

            <div className={`news-card-inner-grid ${muestraImagen ? '' : 'sin-imagen'}`}>
                {muestraImagen && (
                    <Link
                        to={rutaDeHistoria(story)}
                        className="news-card-image-wrapper"
                        onClick={() => recordRead(story)}
                        tabIndex={-1}
                        aria-hidden="true"
                    >
                        <StoryImage story={story} className="news-card-img">
                            <span className="news-card-category-badge">{story.category}</span>
                        </StoryImage>
                    </Link>
                )}

                <div className="news-card-info">
                    <div className="news-card-top-meta">
                        {/* El distintivo de categoría vivía sobre la imagen. Sin
                            imagen desaparecía, así que aquí va cuando hace falta. */}
                        {!muestraImagen && story.category && (
                            <span className="news-card-category-inline">{story.category}</span>
                        )}
                        {timeLabel && (
                            <time
                                className="news-card-time"
                                dateTime={story.publishedAt ?? undefined}
                                title={absoluteTime ?? undefined}
                            >
                                {timeLabel}
                            </time>
                        )}
                        {typeof story.factuality === 'number' && (
                            <span
                                className="news-card-factuality"
                                title="Promedio de la factualidad histórica de los medios que cubren el hecho. No es una evaluación de esta noticia en particular."
                            >
                                Factualidad media de fuentes: {Math.round(story.factuality * 100)}%
                            </span>
                        )}
                    </div>

                    <h3 className="news-card-title">
                        <Link to={rutaDeHistoria(story)} onClick={() => recordRead(story)}>
                            {story.title}
                        </Link>
                    </h3>

                    {story.summary && <p className="news-card-summary">{story.summary}</p>}

                    <CoverageBar coverage={coverage} />

                    {coverage.insufficientCoverage && (
                        <p className="news-card-coverage-note">
                            <HelpCircle size={12} aria-hidden="true" />
                            Cobertura insuficiente para evaluar omisiones
                            (se requieren 6 medios, hay {coverage.total}).
                        </p>
                    )}

                    <div className="news-card-sources-row">
                        <span className="sources-label">Medios:</span>
                        <div className="sources-chips-grid">
                            {story.sources.map((source, index) => {
                                const media = getMediaByName(source.name);
                                const bias =
                                    typeof source.bias === 'number' ? source.bias : media.bias;

                                return (
                                    <a
                                        key={`${source.name}-${index}`}
                                        href={source.url || media.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="interactive-source-chip"
                                        style={{ borderTopColor: getBiasSpectrumColor(bias) }}
                                        title={`Abrir ${media.name} en una pestaña nueva`}
                                    >
                                        <MediaLogo media={media} size={14} />
                                        <span>{media.shortName}</span>
                                        <ExternalLink size={9} className="badge-ext-icon" aria-hidden="true" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default NewsCard;
