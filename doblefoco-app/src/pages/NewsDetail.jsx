// @ts-check
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, EyeOff, Layers, ExternalLink, Share2, Info, SearchX } from 'lucide-react';
import { getMediaByName } from '../data/mediaLogos';
import { getOrRotateNeutralImage, FALLBACK_NEUTRAL_IMAGE } from '../services/imageEngineService';
import { fetchStory, isApiConfigured } from '../services/apiClient';
import { normalizeStory, storyTimeLabel, formatAbsoluteTime } from '../lib/story';
import { useStories } from '../hooks/useStories';
import { recordRead } from '../lib/readingHistory';
import { useHistoriaInicial } from '../hooks/datosInicialesContext';
import { SPECTRUM_LABEL, describeBias, BLINDSPOT_MIN_SOURCES } from '../../shared/biasAnalysis.js';
import NewsCard from '../components/NewsCard';
import CoverageBar from '../components/CoverageBar';
import CoverageTimeline from '../components/CoverageTimeline';
import ToneNote from '../components/ToneNote';
import ToneSummary from '../components/ToneSummary';
import MediaLogo from '../components/MediaLogo';
import UserFeedbackWidget from '../components/UserFeedbackWidget';
import ShareModal from '../components/ShareModal';
import './NewsDetail.css';

/**
 * Tarjeta de perspectiva.
 *
 * Cuando `perspective` es null NO se inventa nada. Se declara la ausencia,
 * que es precisamente la información más valiosa del producto: saber que un
 * lado del espectro no cubrió un hecho vale más que un titular de relleno.
 *
 * La versión anterior, ante la falta de cobertura, atribuía el hecho a El
 * Espectador o a Semana por defecto y le concatenaba una coletilla inventada
 * ("— Enfoque en garantías sociales e impacto comunitario"), describiéndola
 * como "titular auténtico reportado por la redacción".
 */
const PerspectiveCard = ({ spectrum, perspective }) => {
    if (!perspective) {
        return (
            <div className={`stacked-perspective-card ${spectrum} is-empty`}>
                <div className="perspective-card-header">
                    <span className={`card-spectrum-badge ${spectrum}`}>
                        {SPECTRUM_LABEL[spectrum]}
                    </span>
                </div>

                {/* Ocupa la MISMA banda que el titular de las otras columnas.
                    Es deliberado: la ausencia de cobertura tiene que leerse a la
                    altura de los titulares con los que compite, no como una nota
                    al pie. Es la señal que hace valioso al producto. */}
                <div className="perspective-empty-body">
                    <SearchX size={20} aria-hidden="true" />
                    <p>
                        <strong>Sin cobertura registrada.</strong> Ningún medio de este espectro
                        entre los que rastreamos ha publicado sobre este hecho.
                    </p>
                </div>

                {/* Banda vacía, para que la retícula de las tres columnas
                    cuadre y los titulares queden alineados. */}
                <div className="perspective-extras" />
            </div>
        );
    }

    const media = getMediaByName(perspective.outlet);

    return (
        <div className={`stacked-perspective-card ${spectrum}`}>
            <div className="perspective-card-header">
                <span className={`card-spectrum-badge ${spectrum}`}>
                    {SPECTRUM_LABEL[spectrum]}
                </span>
                {perspective.url ? (
                    <a
                        href={perspective.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="source-with-logo interactive-source-link"
                        title={`Leer el original en ${perspective.outlet}`}
                    >
                        <MediaLogo media={media} size={18} />
                        <span className="card-source-tag">{perspective.outlet}</span>
                        <ExternalLink size={11} className="source-external-icon" aria-hidden="true" />
                    </a>
                ) : (
                    <span className="card-source-tag">{perspective.outlet}</span>
                )}
            </div>

            {/* Titular literal del medio. Sin prefijos, sin coletillas, sin
                adjetivos eliminados. Si está entre comillas es porque es
                textualmente lo que publicó. */}
            <h4 className="perspective-headline">{perspective.headline}</h4>

            {/* Todo lo opcional va en UNA banda. Si cada pieza fuera una fila
                de la retícula, una columna con extracto y otra sin él
                desalinearían los titulares, que es exactamente lo que esta
                pantalla existe para evitar. */}
            <div className="perspective-extras">
                {perspective.snippet && (
                    <p className="perspective-snippet">{perspective.snippet}</p>
                )}

                {/* F3-09. Antes esto listaba las palabras a secas, leyendo una
                    forma del objeto que ya no existe: ahora el tono se calcula
                    al servir, sobre titular Y entradilla, y dice dónde apareció
                    cada término. Se pinta solo cuando hay algo que decir. */}
                <ToneNote tone={perspective.tone} />

                {perspective.otherOutletsInSpectrum > 0 && (
                    <p className="perspective-more-outlets">
                        +{perspective.otherOutletsInSpectrum} medio
                        {perspective.otherOutletsInSpectrum === 1 ? '' : 's'} más en este espectro
                    </p>
                )}
            </div>
        </div>
    );
};

const NewsDetail = () => {
    const { id } = useParams();
    const [isShareOpen, setIsShareOpen] = useState(false);

    /**
     * La historia que el SERVIDOR ya cargó, si esta página vino renderizada
     * (F3-01). Es null en una navegación dentro de la SPA y en desarrollo.
     */
    const historiaInicial = useHistoriaInicial(id);

    // Sembrar el estado con lo que ya trae el HTML es lo que hace que el
    // renderizado en servidor sirva de algo. Sin esto: el servidor pinta la
    // noticia, el navegador hidrata con `story` en null, se ve «Cargando…» y
    // se pide a la API un dato que la página ya tenía. Se pagaría el coste del
    // renderizado y se perdería su beneficio, más un parpadeo.
    const [story, setStory] = useState(() =>
        historiaInicial ? normalizeStory(historiaInicial) : null
    );
    const [loading, setLoading] = useState(!historiaInicial);

    // Historias reales, para el bloque de relacionadas. Antes esto era el
    // fixture, y además de alimentar "relacionadas" servía de RESPALDO cuando
    // la API fallaba: NewsDetail buscaba la noticia entre las 200 inventadas y
    // la pintaba entera —con sus perspectivas atribuidas a medios reales— sin
    // ningún aviso. Era el peor sitio donde podía ocurrir, porque es la pantalla
    // donde la cita fabricada se lee a tamaño completo con el nombre del medio
    // al lado. Ese respaldo se eliminó: si la API no la tiene, no existe.
    const { stories: pool } = useStories({ limit: 60 });

    /**
     * Qué id tenemos ya cargado.
     *
     * Arranca apuntando al de la historia que trajo el servidor (F3-01): así el
     * efecto sabe que no hace falta pedir nada. Va en una referencia y no en el
     * estado a propósito — mirar `story` desde el efecto lo obligaría a
     * depender de `story`, y como el efecto lo escribe, se reejecutaría en
     * bucle.
     */
    const idCargado = useRef(historiaInicial ? id : null);

    useEffect(() => {
        let cancelled = false;

        // Ya la tenemos: vino en el HTML que renderizó el servidor. Volver a
        // pedirla sería una consulta de más en cada visita que llegue indexada.
        if (idCargado.current === id) return;

        const load = async () => {
            setLoading(true);

            if (isApiConfigured) {
                const result = await fetchStory(id);
                if (cancelled) return;
                if (result.ok && result.story) {
                    setStory(normalizeStory(result.story));
                    idCargado.current = id;
                    setLoading(false);
                    return;
                }
            }

            if (cancelled) return;
            setStory(null);
            idCargado.current = id;
            setLoading(false);
        };

        load();
        return () => { cancelled = true; };
    }, [id]);

    // El historial se registra una sola vez por noticia, no en cada render.
    useEffect(() => {
        if (story) recordRead(story);
    }, [story?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const related = useMemo(() => {
        if (!story) return [];
        return pool
            .filter((s) => s.category === story.category && s.id !== story.id)
            .slice(0, 3);
    }, [story, pool]);

    if (loading) {
        return (
            <div className="news-detail-page">
                <div className="detail-not-found"><p>Cargando…</p></div>
            </div>
        );
    }

    if (!story) {
        return (
            <div className="news-detail-page">
                <div className="detail-not-found">
                    <h1>Noticia no encontrada</h1>
                    <p>La noticia que buscas no existe o ya no está disponible.</p>
                    <Link to="/" className="back-link">Volver al inicio</Link>
                </div>
            </div>
        );
    }

    const { coverage } = story;
    const timeLabel = storyTimeLabel(story);
    const spectrums = ['left', 'center', 'right'];

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = FALLBACK_NEUTRAL_IMAGE;
    };

    return (
        <div className="news-detail-page">
            <div className="detail-header">
                <Link to="/" className="back-link">← Volver al feed</Link>
                <span className="detail-category-badge">{story.category}</span>
            </div>

            <article className="detail-article detail-split-layout">
                <div className="detail-main-col">
                    <div className="detail-hero-header">
                        <div className="detail-meta-bar">
                            {timeLabel && (
                                <time
                                    className="detail-time"
                                    dateTime={story.publishedAt ?? undefined}
                                    title={formatAbsoluteTime(story.publishedAt) ?? undefined}
                                >
                                    {timeLabel}
                                </time>
                            )}
                            <button className="share-detail-btn" onClick={() => setIsShareOpen(true)}>
                                <Share2 size={14} aria-hidden="true" /> Compartir
                            </button>
                        </div>

                        <h1 className="detail-title">{story.title}</h1>
                        {story.summary && <p className="detail-summary">{story.summary}</p>}
                    </div>

                    <div className="stacked-perspectives-container">
                        <h2 className="comparison-title">Cómo lo tituló cada espectro</h2>
                        <p className="comparison-caption">
                            Titulares literales, tal como los publicó cada medio. Donde no hay
                            cobertura, lo decimos.
                        </p>

                        <div className="stacked-perspectives-list">
                            {spectrums.map((spectrum) => (
                                <PerspectiveCard
                                    key={spectrum}
                                    spectrum={spectrum}
                                    perspective={story.perspectives[spectrum]}
                                />
                            ))}
                        </div>
                    </div>

                    {story.articles.length > 0 && (
                        <div className="detail-article-list">
                            <h2>Todas las coberturas ({story.articles.length})</h2>
                            <ul>
                                {story.articles.map((article) => (
                                    <li key={article.id ?? article.url}>
                                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                                            <span className="article-outlet">{article.outlet}</span>
                                            <span className="article-headline">{article.headline}</span>
                                            <ExternalLink size={11} aria-hidden="true" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/*
                        Aquí había un bloque "Contexto" que pintaba `story.body`:
                        párrafos de texto corrido que solo existían en el fixture
                        y que nadie había escrito. El motor real no produce
                        cuerpos de noticia —no puede, sin fabricarlos— así que
                        con el fixture retirado (F2-03) este bloque quedaba
                        muerto para todo dato real.
                        Se elimina en vez de dejarlo condicionado: un hueco que
                        solo se rellena con contenido inventado es una invitación
                        a volver a inventarlo.
                    */}

                    {/* Cronología (F3-08). Va DESPUÉS de las perspectivas y antes
                        del widget de reporte: primero se lee qué dijo cada
                        espectro, y solo entonces cobra sentido en qué orden
                        entraron. Al revés sería un dato sin contexto.
                        Se pinta sola cuando no hay línea de tiempo utilizable. */}
                    <CoverageTimeline timeline={story.timeline} />

                    {/* F3-09. Va tras la cronología: primero quién cubrió y
                        cuándo, después cómo lo contaron. Se pinta sola cuando
                        ningún medio usó lenguaje valorativo, que es el caso
                        habitual —la carga aparece en el 3,1% de los artículos. */}
                    <ToneSummary resumen={story.toneSummary} />

                    <UserFeedbackWidget storyId={story.id} />
                </div>

                <div className="detail-sidebar-col">
                    <div className="detail-compact-image-box">
                        <img
                            src={getOrRotateNeutralImage(story)}
                            alt=""
                            width="600"
                            height="400"
                            className="detail-compact-image"
                            onError={handleImageError}
                        />
                        {/* Etiqueta honesta: es una imagen de banco, no una
                            fotografía del hecho. */}
                        <span className="detail-image-disclaimer">Imagen ilustrativa</span>

                        {typeof story.factuality === 'number' && (
                            <div
                                className="detail-factuality-chip"
                                title="Promedio de la factualidad histórica de los medios que cubren el hecho. No evalúa esta noticia en particular."
                            >
                                <ShieldCheck size={14} aria-hidden="true" />
                                Factualidad media de fuentes: {Math.round(story.factuality * 100)}%
                            </div>
                        )}
                    </div>

                    {coverage.blindspot && (
                        <div className={`detail-blindspot-alert ${coverage.blindspot.spectrum}`}>
                            <div className="blindspot-alert-header">
                                <EyeOff size={16} aria-hidden="true" />
                                <strong>{coverage.blindspot.label}</strong>
                            </div>
                            <p>{coverage.blindspot.description}</p>
                        </div>
                    )}

                    <div className="ground-coverage-box">
                        <div className="ground-coverage-header">
                            <Layers size={18} className="coverage-icon" aria-hidden="true" />
                            <h2>Distribución de cobertura</h2>
                        </div>

                        <CoverageBar coverage={coverage} />

                        {coverage.insufficientCoverage && (
                            <p className="coverage-caveat">
                                <Info size={13} aria-hidden="true" />
                                Con {coverage.total} medios no es posible afirmar que exista una
                                omisión: hacen falta al menos {BLINDSPOT_MIN_SOURCES}.
                            </p>
                        )}

                        <div className="media-logos-grouped-grid">
                            {spectrums.map((spectrum) => {
                                const group = story.sources.filter((s) => {
                                    const bias = typeof s.bias === 'number' ? s.bias : 0;
                                    if (spectrum === 'left') return bias <= -0.2;
                                    if (spectrum === 'right') return bias >= 0.2;
                                    return bias > -0.2 && bias < 0.2;
                                });

                                return (
                                    <div key={spectrum} className={`media-group-col ${spectrum}`}>
                                        <span className="group-col-title">{SPECTRUM_LABEL[spectrum]}</span>
                                        <div className="group-logos-list">
                                            {group.length > 0 ? (
                                                group.map((s, idx) => {
                                                    const info = getMediaByName(s.name);
                                                    return (
                                                        <a
                                                            key={`${s.name}-${idx}`}
                                                            href={s.url || info.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="media-logo-card interactive-media-link"
                                                            title={`Abrir ${info.name}`}
                                                        >
                                                            <MediaLogo media={info} size={16} />
                                                            <span className="media-logo-name">{info.shortName}</span>
                                                        </a>
                                                    );
                                                })
                                            ) : (
                                                <span className="empty-group">Sin cobertura</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <p className="detail-bias-verdict">
                            Sesgo medio de la cobertura: <strong>{describeBias(coverage.meanBias)}</strong>
                            <br />
                            <span className="verdict-note">
                                Dispersión entre fuentes: {coverage.polarization.toFixed(2)}
                                {coverage.isHighlyPolarized && ' — cobertura polarizada'}
                            </span>
                        </p>
                    </div>
                </div>
            </article>

            {related.length > 0 && (
                <section className="detail-related">
                    <h2>Más en {story.category}</h2>
                    <div className="detail-related-grid">
                        {related.map((s) => <NewsCard key={s.id} story={s} />)}
                    </div>
                </section>
            )}

            <ShareModal story={story} isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
        </div>
    );
};

export default NewsDetail;
