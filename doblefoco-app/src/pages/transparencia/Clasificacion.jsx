import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { MEDIA_REGISTRY } from '../../../shared/mediaRegistry.js';
import { SIN_MEDIR_LABEL } from '../../../shared/biasAnalysis.js';
import './Transparencia.css';

/**
 * Los dos estados que nacieron el 2026-09-16 y 18, leídos del registro y no
 * escritos a mano: una lista copiada aquí se quedaría atrás en cuanto uno de
 * ellos se firme o cambie de tipo, y esta página diría algo falso sin que
 * nada falle.
 */
const LISTA = new Intl.ListFormat('es', { type: 'conjunction' });
const nombres = (medios) => LISTA.format(medios.map((m) => m.name));
const SIN_MEDIR = MEDIA_REGISTRY.filter((m) => m.bias === null || m.bias === undefined);
const NO_NOTICIOSOS = MEDIA_REGISTRY.filter((m) => m.noNoticioso);

/**
 * Sección de /transparencia. Extraída de la página única el 2026-08-09 al
 * partirla en sub-páginas: eran ocho bloques largos bajo una sola URL.
 *
 * El texto NO se reescribió al mover —se partió con un script— para que el
 * cambio de estructura no arrastrara cambios de contenido sin querer.
 */
const TrClasificacion = () => (
    <>
    <section className="tr-section">
        <h2><Scale size={18} aria-hidden="true" /> Qué queremos decir con izquierda y derecha</h2>
        <p>
            Clasificamos <strong>organizaciones, no noticias</strong>. Cuando decimos que
            un medio se inclina hacia un lado no estamos calificando el artículo que usted
            acaba de leer: estamos describiendo un patrón sostenido en su cobertura. Estas
            son las definiciones con las que trabajamos, y publicarlas es la única forma
            de que usted pueda decir que están mal.
        </p>

        <dl className="tr-spectrum">
            <dt className="tr-spectrum-left">Izquierda</dt>
            <dd>
                Cobertura que tiende a situar la causa de los problemas públicos en
                estructuras —desigualdad, concentración de la propiedad, abandono
                estatal—, que da relevancia sostenida a derechos laborales, protesta
                social, medio ambiente y víctimas del conflicto, y que cita con más
                frecuencia a organizaciones sociales, sindicatos y academia crítica.
            </dd>

            <dt className="tr-spectrum-right">Derecha</dt>
            <dd>
                Cobertura que tiende a situar la causa de los problemas públicos en
                decisiones individuales, en la acción del gobierno de turno o en la
                inseguridad, que da relevancia sostenida a orden público, crecimiento
                económico, empresa privada y gasto estatal, y que cita con más frecuencia
                a fuentes oficiales de seguridad, gremios empresariales y centros de
                pensamiento afines.
            </dd>

            <dt className="tr-spectrum-center">Orientación mixta</dt>
            <dd>
                <strong>No significa neutral, imparcial ni objetivo — y tampoco significa
                que no tenga línea.</strong> Todos los medios tienen una. Significa que la
                suya no se sitúa en el eje izquierda-derecha, que es el único que aquí se
                mide. La de un diario económico es el capital: clarísima, declarada, y sin
                lugar en ese eje.
                <br />
                Esta banda se llamó «Sin línea marcada» hasta agosto de 2026, y se cambió
                porque era falsa. Seis de los siete medios colombianos que caen aquí
                pertenecen a grupos económicos —El Tiempo y Portafolio a Sarmiento Angulo,
                Noticias Caracol a los Santo Domingo, La República a Ardila Lülle, Caracol
                Radio y W Radio a Prisa—. Decir de ellos que no tienen línea marcada era
                exactamente el falso equilibrio que este sitio existe para no producir.
                Quién es dueño de cada uno está documentado, con su fuente, en el{' '}
                <Link to="/mapa-medios">mapa mediático</Link>.
                <br />
                Tampoco se llama «Centro»: dar por sentado que existe un centro político
                equivale a conceder que hay un punto neutral desde el cual se mira todo lo
                demás, y eso es precisamente lo que este sitio no da por sentado.
            </dd>

            <dt>{SIN_MEDIR_LABEL}</dt>
            <dd>
                <strong>No es una cuarta banda ni quiere decir neutral: es que no lo
                sabemos todavía.</strong> Es el estado de un medio al que no le ponemos
                número porque la evidencia no alcanza para firmarlo. Preferimos decir
                que no lo sabemos a publicar un número que no podemos defender.
                {SIN_MEDIR.length > 0 && (
                    <> Hoy están así {SIN_MEDIR.length}: {nombres(SIN_MEDIR)}.</>
                )}
                {' '}En la barra de cobertura de cada noticia aparecen aparte, y no
                cuentan para detectar puntos ciegos. Salen de este estado cuando hay
                evidencia suficiente y una clasificación firmada.
            </dd>
        </dl>

        {NO_NOTICIOSOS.length > 0 && (
            <p>
                <strong>Medios de investigación y análisis.</strong> {nombres(NO_NOTICIOSOS)}{' '}
                no publican la noticia diaria: su producto es la investigación o el
                análisis. Por eso no están en el{' '}
                <Link to="/mapa-medios">mapa mediático</Link>, que compara a los medios
                del ciclo noticioso. Salir del mapa no los silencia: seguimos leyendo lo
                que publican y aparecen en las noticias que cubren.
            </p>
        )}

        <p>
            Los valores numéricos, las bandas y los cuatro criterios con que se asigna cada
            uno —propiedad y estructura económica, selección de agenda, encuadre y balance
            de fuentes citadas— están en la{' '}
            <Link to="/transparencia/sobre-nosotros">metodología</Link>.
        </p>
    </section>
    </>
);

export default TrClasificacion;
