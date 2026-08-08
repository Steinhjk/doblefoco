// @ts-check
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { fetchPanorama, isApiConfigured } from '../services/apiClient';
import { MEDIA_REGISTRY } from '../../shared/mediaRegistry';
import { repartoPorEspectro } from '../../shared/panorama.js';
import './AvisoDesequilibrio.css';

/**
 * ANTES DE LEER: AQUÍ FALTA UN LADO.
 *
 * Pedido por Jose (2026-07-30). Su formulación era «la mayoría de noticias
 * tendrán cobertura mayoritariamente de derechas», y el dato NO la sostiene: el
 * bloque más grande por volumen es el de medios de orientación mixta, con un 53 %.
 * Lo que sí sostiene, y es más fuerte, es que la IZQUIERDA ESTÁ CASI AUSENTE —
 * un artículo suyo por cada treinta y cinco de los demás.
 *
 * Se afirma lo segundo y no lo primero. Decir «todo es de derechas» sería
 * exagerar en la dirección que el lector ya sospecha, que es la forma más fácil
 * de perder autoridad justo en la afirmación que más falta hace.
 *
 * LAS CIFRAS SE CALCULAN EN VIVO, no se escriben en el texto. Un aviso sobre el
 * desequilibrio con números a mano envejecería en días y acabaría diciendo algo
 * que la propia base contradice — en una página cuyo argumento es la
 * verificabilidad, sería el peor sitio para tener una cifra vieja.
 *
 * NO SE PUEDE CERRAR. Un aviso descartable se convierte en decoración: se cierra
 * una vez y no se vuelve a ver, justo cuando explica cómo hay que leer todo lo
 * que hay debajo.
 */
const AvisoDesequilibrio = () => {
    const [conteos, setConteos] = useState(null);

    useEffect(() => {
        if (!isApiConfigured) return undefined;
        let vivo = true;
        fetchPanorama().then((r) => {
            if (vivo && r.ok && r.medios.length) setConteos(r.medios);
        });
        return () => { vivo = false; };
    }, []);

    const datos = useMemo(() => {
        if (!conteos) return null;

        const bandas = repartoPorEspectro(conteos, MEDIA_REGISTRY);
        const izquierda = bandas.find((b) => b.id === 'left');
        const sinLinea = bandas.find((b) => b.id === 'center');

        if (!izquierda?.articulos) return null;

        const totalArticulos = bandas.reduce((s, b) => s + b.articulos, 0);
        const medios = bandas.reduce((s, b) => s + b.medios, 0);

        return {
            izquierda,
            sinLinea,
            medios,
            // «Uno por cada N del resto» se entiende sin pensar; un porcentaje
            // con un decimal, no. La proporción es la misma.
            porCada: Math.round((totalArticulos - izquierda.articulos) / izquierda.articulos),
        };
    }, [conteos]);

    // Sin datos no se pinta un aviso a medias: quedaría una afirmación sobre el
    // desequilibrio sin la medición que la sostiene, que es lo contrario de lo
    // que este recuadro viene a hacer.
    if (!datos) return null;

    const { izquierda, sinLinea, medios, porCada } = datos;

    return (
        <aside className="aviso-desequilibrio" aria-label="Advertencia sobre el catálogo de medios">
            <h2>
                <Scale size={17} aria-hidden="true" /> Antes de leer: aquí falta un lado
            </h2>

            <p>
                El espectro mediático colombiano no está repartido, y eso cambia cómo hay que
                leer este sitio. De los {medios} medios que seguimos,{' '}
                <strong>{izquierda.medios} son de izquierda</strong> —el{' '}
                {izquierda.pctMedios.toFixed(0)} % del catálogo— pero publican el{' '}
                <strong>{izquierda.pctVolumen.toFixed(1)} % de los artículos</strong>: por cada
                nota suya hay <strong>{porCada} del resto</strong>.
            </p>

            <p>
                Por eso la mayoría de los hechos le llegarán contados por medios de derecha o
                de orientación mixta. Y por eso muchos de los «puntos ciegos de la izquierda»
                que verá <strong>no son un silencio deliberado</strong>: son un lado que casi
                no publica.
            </p>

            <p>
                Conviene además no leer «orientación mixta» como neutral. <strong>Mixta no
                significa que no tengan línea</strong>, sino que la suya no se sitúa en el eje
                izquierda-derecha: la de un diario económico es el capital, y es clarísima. Es
                el bloque más grande por volumen —{sinLinea.pctVolumen.toFixed(1)} %— y lo
                componen en buena parte medios de los mayores grupos económicos del país. Quién
                es dueño de cada uno está documentado, con su fuente, en el{' '}
                <Link to="/mapa-medios">mapa mediático</Link>.
            </p>

            <p className="aviso-desequilibrio-cierre">
                Nada de esto es un defecto de este sitio: es el retrato del ecosistema que
                cubre. Taparlo sería peor que mostrarlo, y mostrarlo es justamente a lo que
                venimos.
            </p>
        </aside>
    );
};

export default AvisoDesequilibrio;
