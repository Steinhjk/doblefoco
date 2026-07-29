// @ts-check
import { Highlighter } from 'lucide-react';
import './ToneNote.css';

const ETIQUETA_TIPO = {
    sensacional: 'registro emocional',
    izquierda: 'carga ideológica',
    derecha: 'carga ideológica',
};

const DONDE = {
    titular: 'en el titular',
    entradilla: 'en la entradilla',
};

/**
 * Anotación de lenguaje valorativo en un artículo (F3-09).
 *
 * ES UNA ANOTACIÓN, NO UN VEREDICTO, y el tamaño lo refleja. Está MEDIDO: el
 * léxico se dispara en el 1,7% de 3 481 artículos. Un elemento grande para una
 * señal que aparece dos de cada cien veces sería una promesa que la pantalla
 * no puede cumplir; peor aún, empujaría a ampliar el léxico hasta que «llenara»
 * el hueco, que es como un detector se convierte en ruido.
 *
 * NUNCA SE TOCA EL TITULAR. Este componente existe porque su antecesor,
 * headlineNeutralizerService, BORRABA los adjetivos del titular original y
 * presentaba el resultado como la frase del medio. Aquí el lector ve la frase
 * literal y, al lado, la señal. El dato queda verificable y la interpretación,
 * explícita.
 *
 * DÓNDE APARECIÓ ES LA PARTE INTERESANTE: en el titular es una decisión de
 * portada; en la entradilla, una de redacción. Y un titular limpio con la
 * valoración en la entradilla es justamente la forma de sesgo que solo se ve
 * si se mira más allá del titular.
 */
const ToneNote = ({ tone }) => {
    if (!tone?.terminos?.length) return null;

    const soloEntradilla = tone.soloEnEntradilla;

    return (
        <p className={`tone-note ${soloEntradilla ? 'tone-note-entradilla' : ''}`}>
            <Highlighter size={12} aria-hidden="true" />

            <span>
                <span className="tone-note-label">
                    {soloEntradilla ? 'Titular neutro, valoración en la entradilla' : 'Lenguaje valorativo'}:
                </span>{' '}
                {tone.terminos.map((t, i) => (
                    <span key={t.termino}>
                        {i > 0 && ', '}
                        <em className={`tone-term tone-term-${t.tipo}`} title={ETIQUETA_TIPO[t.tipo]}>
                            {t.termino}
                        </em>
                        <span className="tone-where">
                            {' '}({t.donde.map((d) => DONDE[d]).join(' y ')})
                        </span>
                    </span>
                ))}
            </span>
        </p>
    );
};

export default ToneNote;
