import { useState } from 'react';
import AnimateIn from '../components/AnimateIn';
import { BookOpen, FileText, ListTree } from 'lucide-react';
import metodologiaText from '../docs/metodologia.txt?raw';
import catalogoText from '../docs/catalogo_medios.txt?raw';
import { MEDIA_REGISTRY } from '../../shared/mediaRegistry';
import './About.css';

/**
 * Las cifras se cuentan del catálogo, no se escriben a mano.
 *
 * Antes esta página decía "más de 20 fuentes nacionales" en texto fijo. Una
 * cifra escrita a mano es una afirmación que envejece sin avisar: el día que
 * el catálogo baje de 20, la página seguirá diciéndolo.
 */
const NATIONAL_SOURCES = MEDIA_REGISTRY.filter((m) => m.country === 'CO' && m.feed?.url).length;
const TOTAL_SOURCES = MEDIA_REGISTRY.filter((m) => m.feed?.url).length;

const About = () => {
    const [showMethodology, setShowMethodology] = useState(false);
    const [showCatalog, setShowCatalog] = useState(false);

    return (
        <div className="about-page">
            <div className="about-hero">
                <h1>Sobre DobleFoco.co</h1>
                <p className="tagline">Información objetiva para un ciudadano informado.</p>
            </div>

            <div className="about-content">
                <AnimateIn>
                    <section className="about-section">
                        <h2>Nuestra Misión</h2>
                        <p>
                            DobleFoco.co es una plataforma dedicada a promover la objetividad
                            en los medios de comunicación colombianos. Creemos que el acceso a
                            información veraz y sin sesgos es fundamental para una democracia sana
                            y ciudadanos empoderados.
                        </p>
                        <p>
                            En un mundo donde la polarización mediática fragmenta la conversación
                            pública, ofrecemos una herramienta que reúne perspectivas diversas bajo
                            un mismo techo, inspirados en los estándares internacionales de Ground News,
                            para permitirte ver el panorama completo de cada historia.
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
                                y {TOTAL_SOURCES - NATIONAL_SOURCES} internacionales.
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
                            Ninguna de las {MEDIA_REGISTRY.length} clasificaciones ha pasado aún por revisión
                            editorial formal, así que las publicamos marcadas como provisionales, cada una con
                            su justificación al lado. Están para ser discutidas.
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
                    </section>
                </AnimateIn>

                <AnimateIn>
                    <section className="about-section">
                        <h2>Nuestros Valores</h2>
                        <ul className="values-list">
                            <li><strong>Transparencia:</strong> Mostramos abiertamente cómo clasificamos las fuentes.</li>
                            <li><strong>Independencia:</strong> No recibimos financiación de partidos políticos ni grupos de interés.</li>
                            <li><strong>Accesibilidad:</strong> Creemos que la información objetiva debe estar al alcance de todos.</li>
                        </ul>
                    </section>
                </AnimateIn>

                <AnimateIn>
                    <section className="about-section contact">
                        <h2>Contáctanos</h2>
                        <p>
                            ¿Tienes preguntas, sugerencias o quieres colaborar?
                            Escríbenos a <strong>contacto@doblefoco.co</strong>
                        </p>
                    </section>
                </AnimateIn>
            </div>
        </div>
    );
};

export default About;
