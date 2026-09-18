import { SPECTRUM_LABEL } from '../../shared/biasAnalysis.js';
import { repartoEnPalabras } from '../../shared/repartoDeCobertura.js';
import './CoverageBar.css';

/**
 * Barra de distribución de cobertura por espectro.
 *
 * Extraída de las cuatro copias que existían (NewsCard, NewsDetail,
 * CompactHeroGrid y el sidebar), que además habían divergido en umbrales.
 *
 * Accesibilidad: la versión anterior declaraba role="meter" sin
 * aria-valuenow/min/max, así que un lector de pantalla anunciaba un medidor
 * sin medida. Y la información viajaba SOLO por color (rojo/blanco/azul), que
 * es inaccesible con daltonismo o en escala de grises. Aquí cada segmento
 * lleva su valor y hay un resumen textual asociado.
 */
const CoverageBar = ({ coverage, compact = false, showLabels = true }) => {
    if (!coverage || !coverage.total) return null;

    const { percentages, counts, total } = coverage;

    /**
     * LA BARRA REPARTE LO MEDIDO (2026-09-18). `percentages` suma 100 sobre los
     * medios con orientación medida, así que con alguno sin medir la barra
     * describe un subconjunto de la cobertura y hay que decirlo: el resumen lo
     * dice en palabras —es lo que oye un lector de pantalla— y la nota de
     * debajo, en pantalla. Sin ellos no cambia nada.
     */
    const sinMedir = Number(coverage.sinMedir ?? 0);

    // «Mixta» y no «Centro» ni «Sin línea»: esta barra sale en CADA tarjeta, así
    // que es el sitio donde más se nota si un renombrado se queda a medias.
    //
    // Y se quedó a medias: el metadato de Open Graph siguió diciendo «de centro»
    // hasta el 2026-09-15. Por eso el reparto ya no se escribe aquí — sale de
    // `shared/repartoDeCobertura.js`, que es el único sitio donde se nombran las
    // bandas.
    const summary =
        `Cobertura de ${total} ${total === 1 ? 'medio' : 'medios'}: ` +
        `${repartoEnPalabras({ ...counts, sinMedir })}.`;

    return (
        <div className={`coverage-bar-box ${compact ? 'is-compact' : ''}`}>
            {showLabels && (
                <div className="coverage-bar-labels" aria-hidden="true">
                    <span className="coverage-label left">{percentages.left}% Izq</span>
                    <span className="coverage-label center">{percentages.center}% Mixta</span>
                    <span className="coverage-label right">{percentages.right}% Der</span>
                </div>
            )}

            <div
                className="coverage-bar"
                role="img"
                aria-label={summary}
                title={summary}
            >
                {['left', 'center', 'right'].map((spectrum) =>
                    percentages[spectrum] > 0 ? (
                        <div
                            key={spectrum}
                            className={`coverage-segment ${spectrum}`}
                            style={{ width: `${percentages[spectrum]}%` }}
                        >
                            {/* Patrón además del color: distingue los espectros
                                sin depender de la percepción cromática. */}
                            <span className="coverage-segment-pattern" aria-hidden="true" />
                        </div>
                    ) : null
                )}
            </div>

            {showLabels && (
                <p className="coverage-bar-summary">
                    {total} {total === 1 ? 'medio' : 'medios'}
                    {coverage.dominantSpectrum && (
                        <>
                            {' · predomina '}
                            <strong>{SPECTRUM_LABEL[coverage.dominantSpectrum]}</strong>
                        </>
                    )}
                    {coverage.isHighlyPolarized && (
                        <span className="coverage-polarized-tag"> · Cobertura polarizada</span>
                    )}
                    {sinMedir > 0 && (
                        <span className="coverage-sin-medir-nota">
                            {' '}· {sinMedir} sin orientación medida, fuera de la barra
                        </span>
                    )}
                </p>
            )}
        </div>
    );
};

export default CoverageBar;
