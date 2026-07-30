import { useState } from 'react';
import AnimateIn from '../components/AnimateIn';
import { HelpCircle, Key, Cpu, ShieldAlert, FileText, CheckCircle2, Lock, Unlock } from 'lucide-react';
import conclusionesText from '../docs/conclusiones.md?raw';
import './Conclusions.css';

export default function Conclusions() {
    const [showRawDoc, setShowRawDoc] = useState(false);
    const [activeTab, setActiveTab] = useState('titulares');

    return (
        <div className="conclusions-page">
            <header className="conclusions-hero">
                <div className="conclusions-hero-container">
                    <span className="conclusions-badge">
                        <Cpu size={16} /> Análisis de Arquitectura & Periodismo Técnico
                    </span>
                    <h1>Conclusiones & Hallazgos Técnicos</h1>
                    <p className="tagline">
                        Respuestas clave sobre cómo operan los agregadores de noticias, la profundidad de su análisis y el tratamiento de paredes de pago (Paywalls).
                    </p>
                </div>
            </header>

            <main className="conclusions-content">
                {/* Navigation Tabs */}
                <div className="conclusions-tabs" role="tablist">
                    <button
                        className={`tab-btn ${activeTab === 'titulares' ? 'active' : ''}`}
                        onClick={() => setActiveTab('titulares')}
                        role="tab"
                        aria-selected={activeTab === 'titulares'}
                    >
                        <HelpCircle size={18} /> ¿Análisis de Titulares o Contenido?
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'paywalls' ? 'active' : ''}`}
                        onClick={() => setActiveTab('paywalls')}
                        role="tab"
                        aria-selected={activeTab === 'paywalls'}
                    >
                        <Key size={18} /> Noticas con Pared de Pago (Paywall)
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'comparativa' ? 'active' : ''}`}
                        onClick={() => setActiveTab('comparativa')}
                        role="tab"
                        aria-selected={activeTab === 'comparativa'}
                    >
                        <CheckCircle2 size={18} /> Comparativa Ground News vs DobleFoco
                    </button>
                </div>

                {/* TAB 1: TITULARES VS CONTENIDO */}
                {activeTab === 'titulares' && (
                    <AnimateIn key="titulares">
                        <section className="conclusions-section">
                            <div className="section-header-badge">
                                <h2>¿Ground News (y DobleFoco) solo analiza titulares pero no el contenido?</h2>
                            </div>
                            
                            <div className="callout-card primary">
                                <h3><CheckCircle2 size={20} /> Conclusión Principal & Capacidades del Motor DobleFoco</h3>
                                <p>
                                    <strong>Procesan fundamentalmente titulares, entradillas (primer párrafo / snippets) y metadatos estructurados</strong>. El motor de DobleFoco.co ingiere la entradilla emitida en el feed RSS de cada medio y evalúa la <strong>intención editorial</strong> a través de modelos de lenguaje valorativo (<code>headlineTone.js</code>) y métricas de sesgo, sin almacenar ni replicar el cuerpo completo por razones de <strong>propiedad intelectual y eficiencia computacional</strong>.
                                </p>
                            </div>

                            <div className="grid-reasons">
                                <div className="reason-card">
                                    <div className="reason-icon">
                                        <FileText size={24} />
                                    </div>
                                    <h4>1. Integración de Entradillas (Primer Párrafo)</h4>
                                    <p>
                                        El motor de DobleFoco captura el <code>contentSnippet</code> o <code>summary</code> enviado en los feeds RSS oficiales. Esto permite acceder a la síntesis del primer párrafo elaborada por la redacción del medio sin violar derechos de autor.
                                    </p>
                                </div>

                                <div className="reason-card">
                                    <div className="reason-icon">
                                        <Cpu size={24} />
                                    </div>
                                    <h4>2. Análisis de Intención Editorial & Tono</h4>
                                    <p>
                                        A través de la evaluación del tono de lenguaje, se detectan adjetivación, juicios de valor y encuadre (framing) en los titulares y entradillas, ofreciendo una métrica objetiva de la intención periodística.
                                    </p>
                                </div>

                                <div className="reason-card">
                                    <div className="reason-icon">
                                        <ShieldAlert size={24} />
                                    </div>
                                    <h4>3. Copyright (Fair Use) & Eficiencia PLN</h4>
                                    <p>
                                        Citar titulares y entradillas con enlace al original cumple estrictamente con el <em>Fair Use</em>. Analizar la pirámide invertida (titular + 1er párrafo) brinda un 85%+ de precisión semántica a bajo costo computacional.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </AnimateIn>
                )}

                {/* TAB 2: PAREDES DE PAGO */}
                {activeTab === 'paywalls' && (
                    <AnimateIn key="paywalls">
                        <section className="conclusions-section">
                            <h2>¿Cómo se puede acceder a las noticias si tienen Pared de Pago (Paywall)?</h2>
                            <p className="section-intro">
                                Dependiendo de la arquitectura del medio periodístico, existen dos categorías principales de paywalls y distintas estrategias técnicas de ingestión y scraping:
                            </p>

                            <div className="paywall-type-container">
                                {/* Soft Paywalls */}
                                <div className="paywall-card soft">
                                    <div className="paywall-header">
                                        <Unlock size={24} className="icon-soft" />
                                        <div>
                                            <h3>Paredes de Pago Suaves (Soft / Metered Paywalls)</h3>
                                            <span className="badge-type">Bloqueo mediante JavaScript en el navegador cliente</span>
                                        </div>
                                    </div>
                                    <ul className="techniques-list">
                                        <li>
                                            <strong>Extracción de JSON-LD / Schema.org:</strong> Para ser indexados por Google, los periódicos incluyen el texto completo o la nota estructurada en etiquetas <code>&lt;script type="application/ld+json"&gt;</code> en el HTML inicial. Peticiones HTTP GET directas obtienen el contenido antes de que el script JS bloquee la pantalla.
                                        </li>
                                        <li>
                                            <strong>Imitación de User-Agent (Googlebot):</strong> Muchos medios entregan la nota completa cuando la solicitud declara ser un rastreador (<code>User-Agent: Googlebot/2.1</code>).
                                        </li>
                                        <li>
                                            <strong>Feeds RSS/Atom & Versiones AMP:</strong> Los canales RSS y las versiones AMP (Accelerated Mobile Pages) suelen transmitir la bajada completa o el artículo limpio sin scripts de pago.
                                        </li>
                                        <li>
                                            <strong>APIs de Archivos Web (Wayback Machine / Archive.today):</strong> Consulta automatizada a instantáneas guardadas en repositorios públicos.
                                        </li>
                                    </ul>
                                </div>

                                {/* Hard Paywalls */}
                                <div className="paywall-card hard">
                                    <div className="paywall-header">
                                        <Lock size={24} className="icon-hard" />
                                        <div>
                                            <h3>Paredes de Pago Duras (Hard / Server-side Paywalls)</h3>
                                            <span className="badge-type">Autenticación estricta del lado del servidor (WSJ, Financial Times)</span>
                                        </div>
                                    </div>
                                    <ul className="techniques-list">
                                        <li>
                                            <strong>Licenciamiento B2B y APIs Oficiales:</strong> Agregadores globales firman convenios comerciales con agencias de noticias (Reuters, AP) o distribuidores (LexisNexis, Factiva) para recibir los cables estructurados.
                                        </li>
                                        <li>
                                            <strong>Scraping con Navegadores Headless Autenticados:</strong> Microservicios (Puppeteer / Playwright) usando cookies de sesión autenticadas con suscripciones institucionales del agregador.
                                        </li>
                                        <li>
                                            <strong>Aportes Comunitarios (Crowdsourced Summary):</strong> Permitir que usuarios registrados con suscripción compartan la verificación de hechos respetando extractos bajo fair use.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </section>
                    </AnimateIn>
                )}

                {/* TAB 3: COMPARATIVA */}
                {activeTab === 'comparativa' && (
                    <AnimateIn key="comparativa">
                        <section className="conclusions-section">
                            <h2>Matriz Comparativa de Implementación</h2>
                            <p className="section-intro">
                                Comparación entre el modelo global de Ground News y la arquitectura localizada de DobleFoco.co para Colombia.
                            </p>

                            <div className="table-responsive">
                                <table className="comparison-table">
                                    <thead>
                                        <tr>
                                            <th>Criterio Técnico</th>
                                            <th>Ground News (Internacional)</th>
                                            <th>DobleFoco.co (Colombia)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>Unidad de Análisis Primaria</strong></td>
                                            <td>Titulares + Entradillas de fuentes públicas</td>
                                            <td>Titulares + Feeds RSS oficiales sin alteración</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Cobertura de Fuentes</strong></td>
                                            <td>&gt; 50,000 medios internacionales</td>
                                            <td>Catálogo de medios nacionales e internacionales contextualizados</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Tratamiento de Paywalls</strong></td>
                                            <td>Redirección a la fuente original + Licencias B2B</td>
                                            <td>Scraping de metadatos abiertos + Redirección transparente</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Clasificación de Sesgo</strong></td>
                                            <td>Agregación de calificaciones (AllSides, Ad Fontes)</td>
                                            <td>Matriz editorial transparente con justificación pública</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </AnimateIn>
                )}

                {/* RAW DOC TOGGLE */}
                <div className="raw-doc-section">
                    <button
                        className="raw-doc-toggle-btn"
                        onClick={() => setShowRawDoc(prev => !prev)}
                        aria-expanded={showRawDoc}
                    >
                        <FileText size={16} />
                        {showRawDoc ? 'Ocultar documento de conclusiones raw (.md)' : 'Ver documento completo en Markdown raw'}
                    </button>

                    {showRawDoc && (
                        <div className="raw-doc-container">
                            <div className="raw-doc-header">
                                <FileText size={14} /> conclusiones.md
                            </div>
                            <pre className="raw-doc-pre">{conclusionesText}</pre>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
