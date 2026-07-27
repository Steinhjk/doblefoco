import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { newsData } from '../data/mockData';
import { getApprovedStories } from '../services/storageService';
import { normalizeStories } from '../lib/story';
import NewsCard from '../components/NewsCard';
import './SearchResults.css';

/**
 * Búsqueda en el catálogo local.
 *
 * Se retiró `sanitizeInput()` de esta ruta. Convertía & < > " ' en entidades
 * HTML antes de comparar y de pintar, pero React ya escapa todo lo que
 * interpola, así que el escapado era redundante y su único efecto real era
 * romper la función: buscar "R&D" mostraba 'Resultados para "R&amp;D"' y
 * "Peñalosa & Cía" no encontraba nunca su propio texto.
 *
 * También se retiró `checkRateLimit()`. Contaba peticiones en una variable en
 * memoria que se reinicia con cada recarga, así que no limitaba nada; y cuando
 * bloqueaba, ponía un estado que jamás se renderizaba: el usuario veía "0
 * resultados" sin explicación. El límite real vive en el servidor.
 */
const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const query = (searchParams.get('q') ?? '').trim();
    const normalizedQuery = query.toLowerCase();

    const stories = useMemo(
        () => normalizeStories([...getApprovedStories(), ...newsData]),
        []
    );

    const results = useMemo(() => {
        if (normalizedQuery.length < 2) return [];

        return stories.filter((story) => {
            const haystack = [
                story.title,
                story.summary ?? '',
                story.category,
                ...story.sources.map((s) => s.name ?? ''),
            ]
                .join(' ')
                .toLowerCase();

            return haystack.includes(normalizedQuery);
        });
    }, [stories, normalizedQuery]);

    return (
        <div className="search-results-page">
            <div className="search-header">
                <h1>Resultados para “{query}”</h1>
                <p aria-live="polite">
                    {results.length}{' '}
                    {results.length === 1 ? 'noticia encontrada' : 'noticias encontradas'}
                </p>
            </div>

            {results.length > 0 ? (
                <div className="search-results-list">
                    {results.map((story) => (
                        <NewsCard key={story.id} story={story} />
                    ))}
                </div>
            ) : (
                <div className="search-empty">
                    {normalizedQuery.length < 2 ? (
                        <p>Escribe al menos 2 caracteres para buscar.</p>
                    ) : (
                        <>
                            <p>No encontramos noticias que coincidan con tu búsqueda.</p>
                            <Link to="/" className="search-back-link">Volver al inicio</Link>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchResults;
