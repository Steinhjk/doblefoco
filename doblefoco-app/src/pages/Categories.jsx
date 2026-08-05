// @ts-check
import { useMemo, useState } from 'react';
import { categories } from '../data/categories';
import { useStories } from '../hooks/useStories';
import EmptyState from '../components/EmptyState';
import NewsCard from '../components/NewsCard';
import AnimateIn from '../components/AnimateIn';
import CategoryMark from '../components/CategoryMark';
import { perteneceA } from '../lib/seccion';
import './Categories.css';

const Categories = () => {
    const [active, setActive] = useState(null);

    const { stories, counts, status, reason } = useStories();

    /**
     * Recuento por sección en UNA pasada sobre las historias, no catorce.
     *
     * Y el máximo sale de las secciones de tema únicamente: «Últimas» es el
     * total y ganaría siempre, con lo que la barra de todas las demás quedaría
     * aplastada contra el cero y dejaría de comparar nada.
     */
    const { porSeccion, mayor } = useMemo(() => {
        const cuenta = Object.fromEntries(categories.map((c) => [c.id, 0]));

        for (const story of stories) {
            for (const categoria of categories) {
                if (perteneceA(story, categoria)) cuenta[categoria.id] += 1;
            }
        }

        const temas = categories.filter((c) => c.tipo === 'tema');
        return { porSeccion: cuenta, mayor: Math.max(1, ...temas.map((c) => cuenta[c.id])) };
    }, [stories]);

    const filtered = useMemo(
        () => (active ? stories.filter((s) => perteneceA(s, active)) : []),
        [active, stories]
    );

    return (
        <div className="categories-page">
            <div className="page-header">
                {/* El mismo rótulo que el enlace del menú. En código estas cosas
                    se llaman secciones —«categoría» ya nombra otra cosa, la que
                    heredan los feeds—, pero el visitante navega con la palabra
                    que leyó arriba. */}
                <h1>Categorías</h1>
                <p>
                    Cuánto ocupa cada sector en la cobertura, y qué se publicó dentro de él.
                </p>
                {/*
                  * LA CIFRA ES DE LO DESCARGADO, NO DEL CATÁLOGO, y se dice.
                  * Confundir las dos cosas ya produjo un error en la portada,
                  * donde `stories.length` se presentaba como el tamaño del
                  * sitio. Aquí el reparto por sección solo puede calcularse
                  * sobre lo que hay en memoria, así que se acota en voz alta en
                  * vez de dejar que el lector suponga que son las 4 000.
                  */}
                {status === 'listo' && (
                    <p className="categories-alcance">
                        Reparto sobre las <strong>{stories.length}</strong> historias más recientes
                        {counts.total > stories.length && <> de {counts.total.toLocaleString('es-CO')} en el catálogo</>}.
                    </p>
                )}
            </div>

            {status === 'sin-datos' && <EmptyState reason={reason} />}

            <div className="categories-grid">
                {categories.map((category) => {
                    const count = porSeccion[category.id];
                    const isActive = active?.id === category.id;

                    return (
                        <button
                            key={category.id}
                            className={`category-card ${isActive ? 'active' : ''}`}
                            aria-pressed={isActive}
                            onClick={() => setActive(isActive ? null : category)}
                        >
                            <span className="category-plate">
                                <CategoryMark id={category.id} />
                            </span>

                            <span className="category-body">
                                <span className="category-name">{category.name}</span>
                                <span className="category-desc">{category.description}</span>
                            </span>

                            <span className="category-foot">
                                {/*
                                  * La barra compara ENTRE TEMAS —cada uno
                                  * contra el más cubierto—, no contra el total.
                                  * Contra el total todas serían astillas
                                  * indistinguibles y la comparación, que es lo
                                  * único que esta barra existe para hacer, se
                                  * perdería.
                                  *
                                  * «Últimas» e «Internacional» se quedan sin
                                  * relleno, con el carril vacío. No son temas:
                                  * una es el total y la otra es un ámbito, así
                                  * que no compiten en esta escala. Llevaban la
                                  * barra al 100 % y eso las presentaba como las
                                  * dos secciones más cubiertas del sitio, que
                                  * es afirmar algo que nadie midió.
                                  */}
                                <span className="category-meter" aria-hidden="true">
                                    {category.tipo === 'tema' && (
                                        <span
                                            className="category-meter-fill"
                                            style={{ width: `${Math.round((count / mayor) * 100)}%` }}
                                        />
                                    )}
                                </span>
                                <span className="category-count">
                                    {count} {count === 1 ? 'historia' : 'historias'}
                                </span>
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
                            {filtered.length} {filtered.length === 1 ? 'historia' : 'historias'}
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
                            Todavía no hay cobertura registrada en esta sección.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Categories;
