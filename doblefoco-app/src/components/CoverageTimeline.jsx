// @ts-check
import { Clock, AlertCircle } from 'lucide-react';
import { SPECTRUM_LABEL } from '../../shared/biasAnalysis.js';
import { retrasoDelEspectro } from '../../shared/coverageTimeline.js';
import './CoverageTimeline.css';

const ESPECTROS = ['left', 'center', 'right'];

/** «+0 h», «+45 min», «+2,3 h» según convenga a la escala. */
function formatearRetraso(horas) {
    if (horas === null) return null;
    if (horas < 1 / 60) return 'a la vez';
    if (horas < 1) return `+${Math.round(horas * 60)} min`;
    return `+${String(horas).replace('.', ',')} h`;
}

const hora = (iso) =>
    new Date(iso).toLocaleString('es-CO', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });

/**
 * Cronología de cobertura de un hecho (F3-08).
 *
 * Responde a algo que ningún otro agregador del mercado local contesta: en qué
 * ORDEN entró cada espectro. Que trece medios cubran algo es un dato; que la
 * derecha lo publicara cuatro horas antes que el centro y que la izquierda siga
 * sin entrar es una observación sobre cómo circula la información.
 *
 * LA ADVERTENCIA NO ES LETRA PEQUEÑA, es parte de la afirmación. Las horas son
 * las que cada medio DECLARA en su feed; no las medimos nosotros y no podemos
 * contrastarlas. Por eso esto nunca dice «X dio la primicia»: dice en qué orden
 * quedan según lo que cada uno declara. Afirmar una exclusiva con un dato que no
 * podemos verificar sería exactamente lo que el principio rector prohíbe.
 */
const CoverageTimeline = ({ timeline }) => {
    if (!timeline || timeline.entradas.length === 0) return null;

    const { entradas, ordenEspectros, duracionHoras, mediosSinFecha } = timeline;

    const ausentes = ESPECTROS.filter((e) => !timeline.porEspectro[e]);
    const primero = ordenEspectros[0];

    return (
        <section className="coverage-timeline" aria-labelledby="timeline-title">
            <h3 id="timeline-title" className="timeline-title">
                <Clock size={16} aria-hidden="true" />
                Cómo se propagó la cobertura
            </h3>

            <p className="timeline-summary">
                {ordenEspectros.length > 1 ? (
                    <>
                        Entró primero por <strong>{SPECTRUM_LABEL[primero].toLowerCase()}</strong> y se
                        extendió a{' '}
                        {/* El punto va DENTRO de la expresión: en una línea aparte,
                            JSX lo une con un espacio y sale «(+12 min) .» */}
                        {`${ordenEspectros
                            .slice(1)
                            .map((e) => `${SPECTRUM_LABEL[e].toLowerCase()} (${formatearRetraso(retrasoDelEspectro(timeline, e))})`)
                            .join(', ')}.`}
                    </>
                ) : (
                    <>
                        Solo lo ha cubierto <strong>{SPECTRUM_LABEL[primero].toLowerCase()}</strong>.
                    </>
                )}
                {duracionHoras > 0 && (
                    <> La cobertura se repartió a lo largo de {String(duracionHoras).replace('.', ',')} horas.</>
                )}
            </p>

            {/* La ausencia se declara, no se omite: es la información más
                valiosa del producto. Ver PerspectiveCard, misma decisión. */}
            {ausentes.length > 0 && (
                <p className="timeline-ausentes">
                    {ausentes.map((e) => SPECTRUM_LABEL[e]).join(' y ')}
                    {ausentes.length === 1 ? ' no ha' : ' no han'} publicado nada sobre este hecho
                    entre los medios que rastreamos.
                </p>
            )}

            <ol className="timeline-list">
                {entradas.map((e, indice) => {
                    // La primera abre la secuencia: mostrarle «a la vez» insinuaría
                    // simultaneidad con algo anterior que no existe.
                    const retraso = indice === 0 ? 'primero' : formatearRetraso(
                        Math.round(((Date.parse(e.at) - Date.parse(timeline.primeraAt)) / 3_600_000) * 10) / 10
                    );

                    return (
                        <li key={e.sourceId} className={`timeline-entry timeline-${e.spectrum}`}>
                            <span className="timeline-dot" aria-hidden="true" />

                            <div className="timeline-entry-body">
                                <div className="timeline-entry-head">
                                    <span className="timeline-outlet">{e.outlet}</span>
                                    <span className={`timeline-spectrum timeline-spectrum-${e.spectrum}`}>
                                        {SPECTRUM_LABEL[e.spectrum]}
                                    </span>
                                    <span className="timeline-offset">{retraso}</span>
                                </div>

                                {e.headline && (
                                    e.url ? (
                                        <a
                                            className="timeline-headline"
                                            href={e.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {e.headline}
                                        </a>
                                    ) : (
                                        <span className="timeline-headline">{e.headline}</span>
                                    )
                                )}

                                <time className="timeline-time" dateTime={e.at}>{hora(e.at)}</time>
                            </div>
                        </li>
                    );
                })}
            </ol>

            <p className="timeline-caveat">
                <AlertCircle size={13} aria-hidden="true" />
                <span>
                    Las horas son las que <strong>cada medio declara</strong> en su propio canal;
                    no las medimos nosotros y no podemos contrastarlas. Esto describe un orden de
                    publicación declarado, no una primicia verificada.
                    {mediosSinFecha > 0 && (
                        <>
                            {' '}
                            {mediosSinFecha} medio{mediosSinFecha === 1 ? '' : 's'} más cubrió el hecho
                            sin declarar hora, así que queda fuera de esta secuencia.
                        </>
                    )}
                </span>
            </p>
        </section>
    );
};

export default CoverageTimeline;
