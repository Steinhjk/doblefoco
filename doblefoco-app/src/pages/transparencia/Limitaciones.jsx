import { Link } from 'react-router-dom';
import { AlertTriangle, Mail } from 'lucide-react';
import { MEDIA_REGISTRY } from '../../../shared/mediaRegistry';
import { fraseDeFirmas, fraseDePropiedad } from '../../lib/catalogo';
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

/*
 * LAS DOS AFIRMACIONES DE ABAJO SE ESCRIBEN SOLAS, Y ESO ES EL ARREGLO.
 *
 * Aquí había un `REVIEWED` que contaba las firmadas, junto a una frase fija que
 * empezaba «Ninguna de las 78 clasificaciones está firmada». Cuando el contador
 * pasó de 0 a 5, el número se movió y la frase no: durante semanas esta página
 * se contradijo a sí misma en dos oraciones seguidas. Lo mismo pasaba con la
 * propiedad, que afirmaba constar la de todos los medios «con una excepción»
 * cuando eran quince. Ver `src/lib/catalogo.js`.
 */

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
                <strong>{fraseDeFirmas()}</strong> Las que no la llevan se publican
                marcadas como provisionales, cada una con su justificación al lado.
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
                <strong>De algunos medios no consta quién manda.</strong>{' '}
                {fraseDePropiedad()} Casi todos son prensa regional que no publica su
                mástil, y ahí no saber es lo corriente: de veintisiete candidatos que se
                revisaron, diecisiete no dicen quién los edita. Pero no siempre es por
                falta de datos — de <strong>Cablenoticias</strong> consta la estructura
                societaria entera y la fuente que la trae se actualizó por última vez en
                2018, así que tampoco afirmamos que hoy sea suya.
            </li>
            <li>
                <strong>Y a veces el hilo se para antes de una persona.</strong> De{' '}
                <strong>Colombia Informa</strong> conocemos la razón social —Corporación
                Colombia Informa, NIT 900.408.141-8—, cómo se financia y con qué red
                trabaja, pero no quién la representa legalmente. Ese dato es público y está
                en el RUES; hasta tenerlo en la mano no escribimos ningún nombre. No es el
                único caso: en Pulzo, en los tres medios de la Organización Ardila Lülle y
                en el propio Cablenoticias el rastro termina en otra sociedad. Saber
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

    {/*
      * EL PROCEDIMIENTO PARA UN MEDIO, escrito (decisión de Jose, 2026-09-02,
      * duda 12). Hasta hoy un lector tenía camino —el panel, el correo— y un
      * medio no: era la única ausencia que se notaba desde fuera. Lo que se
      * promete aquí son plazos y publicación, no un resultado: la
      * reclasificación, si la hay, sigue el protocolo de juicio editorial y no
      * la presión. Los plazos viven también en PROTOCOLO_JUICIO_EDITORIAL.md
      * (sección 7); si cambian, cambian en los dos sitios.
      */}
    <section className="tr-section tr-contact" id="medios">
        <h2><Mail size={18} aria-hidden="true" /> Si usted es un medio del catálogo</h2>
        <p>
            Si su medio aparece aquí y no está de acuerdo con su clasificación, con su
            ficha de propiedad o con un aviso que publicamos, escríbanos desde una cuenta
            del medio a{' '}
            <a href={`${CONTACT_MAILTO}?subject=${encodeURIComponent('Objeción de un medio del catálogo')}`}>
                <strong>{CONTACT_EMAIL}</strong>
            </a>
            , diciendo qué afirmación objeta y con qué evidencia. Esto es lo que nos
            comprometemos a hacer:
        </p>
        <ul className="tr-limits">
            <li>
                <strong>Acusar recibo en cinco días y responder por escrito en quince.</strong>{' '}
                La respuesta dice qué se cambia, qué no, y por qué.
            </li>
            <li>
                <strong>Publicar la objeción y la respuesta junto a la ficha del medio,
                con fecha</strong>, cambie o no la clasificación. Quien lea la ficha verá
                que el medio la discutió y qué dijimos.
            </li>
            <li>
                <strong>Cambiar solo con evidencia.</strong> Una clasificación se revisa
                con el mismo protocolo con el que se hizo —cobertura reciente, fuentes
                consultables— y no por la insistencia. Lo que sí cambia siempre es un
                dato de hecho que se demuestre errado: un dueño, una fecha, un cargo.
            </li>
        </ul>
    </section>
    </>
);

export default TrLimitaciones;
