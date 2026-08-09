import { Eye, AlertTriangle } from 'lucide-react';
import { MEDIA_REGISTRY } from '../../../shared/mediaRegistry';
import './Transparencia.css';

/**
 * Sección de /transparencia. Extraída de la página única el 2026-08-09 al
 * partirla en sub-páginas: eran ocho bloques largos bajo una sola URL.
 *
 * El texto NO se reescribió al mover —se partió con un script— para que el
 * cambio de estructura no arrastrara cambios de contenido sin querer.
 */
const ACTIVE_FEEDS = MEDIA_REGISTRY.filter((m) => m.feed?.url).length;
const REVIEWED = MEDIA_REGISTRY.filter((m) => m.reviewedAt).length;

const TrIndice = () => (
    <>
    <section className="tr-section">
        <h2><Eye size={18} aria-hidden="true" /> Para qué existe DobleFoco</h2>
        <p>
            Cuando un hecho importa, distintos medios lo cuentan distinto: cambian el
            titular, el ángulo, a quién citan y qué omiten. Casi nadie tiene tiempo de
            abrir siete periódicos para notarlo. DobleFoco reúne esa cobertura en un
            mismo lugar y la muestra junta.
        </p>
        <p>
            El producto no es decirle a nadie qué pensar. Es enseñar quién está contando
            un hecho, quién no lo está contando, y con qué palabras. La ausencia de
            cobertura es información: cuando ningún medio de un sector publicó sobre
            algo, lo decimos en lugar de rellenar el hueco.
        </p>
        <p className="tr-scope">
            Hoy leemos los canales públicos de {ACTIVE_FEEDS} medios. Los titulares se
            citan literales y siempre con enlace al original. Nunca los reescribimos,
            ni siquiera para "neutralizarlos": editar la frase de otro y publicarla con
            su firma no es neutralizar.
        </p>
    </section>

    <section className="tr-section tr-manifesto">
        <h2><AlertTriangle size={18} aria-hidden="true" /> Declaración contra la posverdad</h2>

        <p className="tr-manifesto-lede">
            La manipulación informativa rara vez consiste en mentir. Casi siempre
            consiste en elegir: qué se cuenta, qué se calla, qué palabra se usa y a
            quién se le da el micrófono. Por eso una plataforma que quiera enfrentarla
            no puede limitarse a desmentir; tiene que hacer visible la elección.
        </p>

        <ol className="tr-principles">
            <li>
                <strong>No publicamos nada que no podamos verificar contra su fuente.</strong>{' '}
                Ni un titular, ni una cita, ni una cifra. Cuando falta un dato, se declara
                que falta. Un hueco visible es honesto; uno rellenado con texto verosímil
                es una falsificación, por bienintencionada que sea.
            </li>
            <li>
                <strong>No corregimos las palabras de nadie.</strong> Medimos la carga
                emocional de un titular y la anotamos aparte. El titular se muestra tal y
                como lo escribió su redacción, con enlace para comprobarlo.
            </li>
            <li>
                <strong>No fingimos precisión que no tenemos.</strong> Si una historia no
                reúne fuentes suficientes para afirmar que existe un punto ciego, decimos
                que no hay datos suficientes. Un porcentaje inventado sobre cuatro fuentes
                no es un análisis: es ruido con aspecto de hallazgo.
            </li>
            <li>
                <strong>Nuestras clasificaciones son discutibles y las publicamos como
                tales.</strong> Clasificar la línea editorial de un medio real es la
                afirmación más fuerte que hace este sitio. Cada valor lleva su
                justificación escrita al lado, para que se pueda rebatir con argumentos.
            </li>
            <li>
                <strong>Cuando nos equivoquemos, lo corregimos a la vista.</strong> Sin
                borrar el error. El registro de lo que estuvo mal es parte de la
                credibilidad, no una mancha que se limpia.
            </li>
        </ol>

        <p className="tr-manifesto-close">
            Nada de esto exige que usted nos crea. Exige que pueda comprobarlo, que es
            distinto y mucho mejor.
        </p>
    </section>
    </>
);

export default TrIndice;
