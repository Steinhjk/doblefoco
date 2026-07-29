// @ts-check
import { Highlighter } from 'lucide-react';
import { SPECTRUM_LABEL } from '../../shared/biasAnalysis.js';
import './ToneNote.css';

const DONDE = { titular: 'titular', entradilla: 'entradilla' };

/**
 * Lenguaje valorativo en toda la cobertura de un hecho (F3-09).
 *
 * POR QUÉ A NIVEL DE HISTORIA Y NO SOLO POR PERSPECTIVA: de los diez u once
 * medios que cubren un hecho solo se muestran tres, y la carga aparece en el
 * 3,1% de los artículos. La probabilidad de que el cargado sea justo uno de los
 * tres elegidos es baja, así que la anotación no se vería casi nunca.
 *
 * NO SE DICE QUIÉN ES SENSACIONALISTA. Se dice qué palabra usó cada medio y
 * dónde, con su titular literal al lado para que el lector juzgue. La
 * coincidencia es léxica, no semántica: no distingue ironía, ni cita textual,
 * ni un adjetivo que describe con exactitud —«devastadores terremotos» lo es—.
 * Por eso esto es una señal para mirar, no una acusación.
 */
const ToneSummary = ({ resumen }) => {
    if (!resumen?.articulos?.length) return null;

    const { mediosConCarga, totalMedios, articulos } = resumen;

    return (
        <section className="tone-summary" aria-labelledby="tone-summary-title">
            <h3 id="tone-summary-title" className="tone-summary-title">
                <Highlighter size={15} aria-hidden="true" />
                Lenguaje valorativo en la cobertura
            </h3>

            <p className="tone-summary-lead">
                <strong>{mediosConCarga}</strong> de {totalMedios} medio{totalMedios === 1 ? '' : 's'}{' '}
                {/* Concuerda con el SUJETO, que es mediosConCarga, no con el total:
                    «3 de 7 medios usó» estaba mal. */}
                {mediosConCarga === 1 ? 'usó' : 'usaron'} términos con carga emocional o
                ideológica al contar este hecho.
            </p>

            <ul className="tone-summary-list">
                {articulos.map((a, i) => (
                    <li key={`${a.outlet}-${i}`} className="tone-summary-item">
                        <div className="tone-summary-head">
                            <span className="tone-summary-outlet">{a.outlet}</span>
                            <span className={`timeline-spectrum timeline-spectrum-${a.spectrum}`}>
                                {SPECTRUM_LABEL[a.spectrum]}
                            </span>
                            {a.tone.soloEnEntradilla && (
                                <span className="tone-summary-flag">titular neutro</span>
                            )}
                        </div>

                        {/* El titular LITERAL, sin tocar. Su antecesor borraba
                            los adjetivos y presentaba el resultado como la frase
                            del medio: editar una cita ajena en silencio. */}
                        {a.url ? (
                            <a className="tone-summary-headline" href={a.url} target="_blank" rel="noopener noreferrer">
                                {a.headline}
                            </a>
                        ) : (
                            <span className="tone-summary-headline">{a.headline}</span>
                        )}

                        <span className="tone-summary-terms">
                            {a.tone.terminos.map((t, j) => (
                                <span key={t.termino}>
                                    {j > 0 && ' · '}
                                    <em className={`tone-term tone-term-${t.tipo}`}>{t.termino}</em>
                                    <span className="tone-where"> en {t.donde.map((d) => DONDE[d]).join(' y ')}</span>
                                </span>
                            ))}
                        </span>
                    </li>
                ))}
            </ul>

            <p className="tone-summary-caveat">
                El cotejo es contra un diccionario de términos, no un juicio sobre el contenido:
                no distingue ironía, cita textual ni un adjetivo que describa con exactitud.
                Es una señal para mirar el original, no una acusación.
            </p>
        </section>
    );
};

export default ToneSummary;
