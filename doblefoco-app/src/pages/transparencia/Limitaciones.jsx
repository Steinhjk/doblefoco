import { Link } from 'react-router-dom';
import { AlertTriangle, Mail } from 'lucide-react';
import { MEDIA_REGISTRY } from '../../../shared/mediaRegistry';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../../lib/contacto';
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

const TrLimitaciones = () => (
    <>
    <section className="tr-section">
        <h2><AlertTriangle size={18} aria-hidden="true" /> Lo que todavía no funciona</h2>
        <p>
            Esta lista existe porque un sitio sobre transparencia que solo cuenta sus
            aciertos ya está fallando en lo que promete.
        </p>
        <ul className="tr-limits">
            <li>
                <strong>Ninguna de las {MEDIA_REGISTRY.length} clasificaciones está
                firmada.</strong> {REVIEWED === 0 ? 'Cero' : REVIEWED} han pasado por
                revisión editorial formal. Se publican marcadas como provisionales.
            </li>
            <li>
                <strong>El catálogo está desequilibrado, y más de lo que parece.</strong>{' '}
                Contando medios, los de izquierda son cerca de un cuarto del catálogo.
                Pesando lo que cada uno publica, son el 3 % de los artículos: siete veces
                menos. Eso hace que los puntos ciegos hacia la izquierda sean mucho más
                difíciles de detectar que los del otro lado, y afecta directamente a lo
                que usted ve. Las dos cifras, una al lado de la otra, están en el{' '}
                <Link to="/mapa-medios">mapa mediático</Link>.
            </li>
            <li>
                <strong>No verificamos si una noticia es cierta.</strong> No somos un
                verificador de datos. Mostramos quién publica qué; la veracidad de cada
                pieza es otro oficio.
            </li>
            <li>
                <strong>Falta un nombre propio.</strong> Todos los medios del catálogo
                tienen documentado quién los controla, con la fuente al lado, y en los
                colombianos el hilo llega hasta las personas. Con una excepción: de{' '}
                <strong>Colombia Informa</strong> conocemos la razón social —Corporación
                Colombia Informa, NIT 900.408.141-8—, cómo se financia y con qué red
                trabaja, pero no quién la representa legalmente. Ese dato es público y está
                en el RUES; hasta tenerlo en la mano no escribimos ningún nombre. Saber
                quién es dueño de un medio importa tanto como su línea editorial, y por eso
                mismo no se afirma de oídas.
            </li>
            <li>
                <strong>Mandar no es lo mismo que poseer, y lo decimos.</strong> Cuando el
                dueño es una institución —el Estado, un partido, una fundación— la pregunta
                de quién manda no desaparece: se traslada a un cargo, y el cargo lo ocupa
                alguien. Por eso nombramos también a quien dirige el medio público o el
                semanario de un partido, siempre aclarando cuál de las dos cosas es.
                Nombrar a los accionistas de los grandes grupos y dejar en «institución» a
                los demás sería aplicar el escrutinio de forma desigual.
            </li>
            <li>
                <strong>La propiedad documentada no es la propiedad real.</strong> Lo que
                publicamos es lo que consta en fuentes consultables: quién figura como
                accionista. Un testaferro, un acuerdo privado entre socios o una sociedad
                en el exterior no aparecerían ahí, y no tenemos forma de verlos.
            </li>
        </ul>
        <p>
            El detalle de cómo clasificamos, con sus fórmulas y sus umbrales, está en la{' '}
            <Link to="/transparencia/sobre-nosotros">metodología</Link>, y el catálogo completo con la
            justificación de cada medio, en el <Link to="/mapa-medios">mapa mediático</Link>.
        </p>
    </section>

    <section className="tr-section tr-contact">
        <h2><Mail size={18} aria-hidden="true" /> Corregirnos</h2>
        <p>
            Si cree que una clasificación está mal, escríbanos con ejemplos concretos de
            cobertura a <a href={CONTACT_MAILTO}><strong>{CONTACT_EMAIL}</strong></a>. Los
            valores están hechos
            para ser discutidos; por eso cada uno se publica con su argumento al lado.
        </p>
    </section>
    </>
);

export default TrLimitaciones;
