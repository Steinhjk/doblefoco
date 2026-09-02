import { useState } from 'react';
import AnimateIn from '../../components/AnimateIn';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../../lib/contacto';
import { BookOpen, FileText, ListTree, SlidersHorizontal } from 'lucide-react';
import metodologiaText from '../../docs/metodologia.txt?raw';
import catalogoText from '../../docs/catalogo_medios.txt?raw';
import modeloText from '../../docs/modelo_sesgo.txt?raw';
import { MEDIA_REGISTRY } from '../../../shared/mediaRegistry';
import { fraseDeFirmas } from '../../lib/catalogo';
import './SobreNosotros.css';

/**
 * Las cifras se cuentan del catálogo, no se escriben a mano.
 *
 * Antes esta página decía "más de 20 fuentes nacionales" en texto fijo. Una
 * cifra escrita a mano es una afirmación que envejece sin avisar: el día que
 * el catálogo baje de 20, la página seguirá diciéndolo.
 */
const NATIONAL_SOURCES = MEDIA_REGISTRY.filter((m) => m.country === 'CO' && m.feed?.url).length;
const TOTAL_SOURCES = MEDIA_REGISTRY.filter((m) => m.feed?.url).length;
/*
 * Los medios con techo propio se leen del registro para que esta frase no
 * pueda mentir: si mañana Semana lo necesita, aparece aquí sin tocar el texto.
 */
const CON_TECHO_PROPIO = MEDIA_REGISTRY.filter((m) => m.feed?.techo)
    .map((m) => `${m.shortName ?? m.name} (${m.feed.techo})`);

const SobreNosotros = () => {
    const [showMethodology, setShowMethodology] = useState(false);
    const [showCatalog, setShowCatalog] = useState(false);
    const [showModelo, setShowModelo] = useState(false);

    return (
        <div className="about-page">
            <div className="about-hero">
                <h2 className="sn-titulo">Sobre DobleFoco.co</h2>
                {/*
                  * DECÍA «Información objetiva para un ciudadano informado», y era la
                  * frase que este proyecto tiene prohibida por escrito: proclamar una
                  * virtud que la medición no sostiene. Y estaba a dos clics de
                  * /transparencia/clasificacion, que dice literalmente «no significa
                  * neutral, imparcial ni objetivo». El sitio se contradecía dentro de
                  * su propia sección de transparencia. Corregido el 2026-08-31.
                  */}
                <p className="tagline">Quién está contando cada noticia, y quién no.</p>
            </div>

            <div className="about-content">
                <AnimateIn>
                    <section className="about-section">
                        <h2>Nuestra Misión</h2>
                        <p>
                            DobleFoco.co reúne la cobertura de los medios colombianos sobre un
                            mismo hecho y enseña <strong>quién lo está contando y quién no</strong>,
                            con quién es dueño de cada medio al lado. No verificamos si una noticia
                            es cierta: eso es otro oficio. Clasificamos organizaciones, no piezas, y
                            publicamos cómo lo hacemos.
                        </p>
                        <p>
                            <strong>No buscamos el equilibrio, buscamos que se vea el
                            desequilibrio.</strong> En Colombia el espacio mediático no está
                            repartido: contando cabezas, los medios de izquierda son cerca de un
                            cuarto del catálogo; pesando lo que cada uno publica, son el 3 % de los
                            artículos. Presentar eso como «las dos caras de la historia» sería
                            blanquearlo. Un agregador que finge simetría donde no la hay le hace un
                            favor a quien se beneficia de la asimetría.
                        </p>
                    </section>
                </AnimateIn>

                <section className="about-section">
                    <AnimateIn><h2>¿Cómo Funciona?</h2></AnimateIn>
                    <div className="how-it-works">
                        <AnimateIn delay={1}><div className="step">
                            <span className="step-number">1</span>
                            <h3>Agregamos</h3>
                            <p>
                                Leemos los canales públicos de {NATIONAL_SOURCES} medios colombianos
                                y {TOTAL_SOURCES - NATIONAL_SOURCES} internacionales, cada media hora
                                y hasta 15 piezas por canal y ciclo.
                                {CON_TECHO_PROPIO.length > 0 && (
                                    <>
                                        {' '}Quien publica más que eso en media hora lleva un techo
                                        propio, para no muestrearlo a escondidas: {CON_TECHO_PROPIO.join(', ')}.
                                    </>
                                )}
                            </p>
                        </div></AnimateIn>
                        <AnimateIn delay={2}><div className="step">
                            <span className="step-number">2</span>
                            <h3>Agrupamos</h3>
                            <p>Reunimos bajo un mismo hecho la cobertura de medios de distinta línea editorial.</p>
                        </div></AnimateIn>
                        <AnimateIn delay={3}><div className="step">
                            <span className="step-number">3</span>
                            <h3>Mostramos quién falta</h3>
                            <p>
                                Los titulares se citan literalmente. Cuando un sector del espectro no
                                cubrió el hecho, lo decimos en vez de rellenarlo.
                            </p>
                        </div></AnimateIn>
                    </div>
                </section>

                <AnimateIn>
                    <section className="about-section methodology-toggle-section">
                        <h2>Metodología</h2>
                        <p>
                            El sesgo que asignamos a un medio es un juicio editorial argumentado, no el
                            resultado de un cálculo automático: lo decide una persona siguiendo criterios
                            escritos. Lo que sí se calcula es la cobertura de cada historia: cuántos medios
                            de cada sector la cuentan y cuáles la están omitiendo.
                        </p>
                        <p>
                            {fraseDeFirmas()} Las que no la llevan se publican marcadas como
                            provisionales, cada una con su justificación al lado. Están para ser
                            discutidas: si cree que una está mal, la sección de{' '}
                            <strong>limitaciones</strong> dice cómo objetarla.
                        </p>
                        <button
                            className="methodology-toggle-btn"
                            onClick={() => setShowMethodology(prev => !prev)}
                            aria-expanded={showMethodology}
                        >
                            <FileText size={16} /> {showMethodology ? 'Ocultar metodología' : 'Ver metodología'}
                        </button>
                        <button
                            className="methodology-toggle-btn"
                            onClick={() => setShowCatalog(prev => !prev)}
                            aria-expanded={showCatalog}
                        >
                            <ListTree size={16} /> {showCatalog ? 'Ocultar catálogo de medios' : 'Ver catálogo de medios'}
                        </button>
                        {/*
                          * Los PARÁMETROS, no solo el catálogo. Publicar a quién
                          * clasificamos y callar con qué números decidimos deja la
                          * mitad discutible fuera del alcance de quien discute.
                          */}
                        <button
                            className="methodology-toggle-btn"
                            onClick={() => setShowModelo(prev => !prev)}
                            aria-expanded={showModelo}
                        >
                            <SlidersHorizontal size={16} /> {showModelo ? 'Ocultar parámetros del modelo' : 'Ver parámetros del modelo'}
                        </button>

                        {showMethodology && (
                            <div className="methodology-text-container">
                                <div className="methodology-text-header">
                                    <BookOpen size={16} />
                                    <span>Cómo clasificamos y qué calculamos</span>
                                </div>
                                <pre className="methodology-pre">{metodologiaText}</pre>
                            </div>
                        )}

                        {showCatalog && (
                            <div className="methodology-text-container">
                                <div className="methodology-text-header">
                                    <ListTree size={16} />
                                    <span>
                                        Catálogo completo · generado desde el mismo archivo que usa el motor
                                    </span>
                                </div>
                                <pre className="methodology-pre">{catalogoText}</pre>
                            </div>
                        )}

                        {showModelo && (
                            <div className="methodology-text-container">
                                <div className="methodology-text-header">
                                    <SlidersHorizontal size={16} />
                                    <span>
                                        Parámetros del modelo · generados desde las mismas constantes que deciden
                                    </span>
                                </div>
                                <pre className="methodology-pre">{modeloText}</pre>
                            </div>
                        )}
                    </section>
                </AnimateIn>

                <AnimateIn>
                    <section className="about-section">
                        <h2>Nuestros Valores</h2>
                        <ul className="values-list">
                            <li><strong>Transparencia:</strong> Mostramos abiertamente cómo clasificamos las fuentes.</li>
                            <li><strong>Independencia:</strong> No recibimos financiación de partidos políticos ni grupos de interés.</li>
                            <li><strong>Decir lo que no sabemos:</strong> Las clasificaciones sin
                            firmar, los medios cuya propiedad no consta y las cifras que todavía no
                            cuadran están publicados, no escondidos.</li>
                        </ul>
                    </section>
                </AnimateIn>

                <AnimateIn>
                    <section className="about-section contact">
                        <h2>Contáctanos</h2>
                        <p>
                            ¿Tienes preguntas, sugerencias o quieres colaborar?
                            Escríbenos a{' '}
                            <a href={CONTACT_MAILTO}><strong>{CONTACT_EMAIL}</strong></a>
                        </p>
                    </section>
                </AnimateIn>
            </div>
        </div>
    );
};

export default SobreNosotros;
