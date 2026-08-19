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
 *
 * Y POR ESO MISMO ES CORTO (2026-08-18). Tenía cuatro párrafos y un cierre que
 * decía «nada de esto es un defecto de este sitio… mostrarlo es justamente a lo
 * que venimos». Un aviso que no se puede cerrar y además se defiende convierte
 * lo primero que ve el lector en una incomodidad, y el dato —uno por cada
 * treinta y cinco— se pierde entre la explicación.
 *
 * Se queda la cifra y su consecuencia para leer. Se van: la definición de
 * «orientación mixta», que vive en el mapa y aquí solo hace falta como
 * advertencia de una línea; y el cierre defensivo, que sobraba — un dato bien
 * puesto no necesita pedir permiso.
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

        if (!izquierda?.articulos) return null;

        const totalArticulos = bandas.reduce((s, b) => s + b.articulos, 0);
        const medios = bandas.reduce((s, b) => s + b.medios, 0);

        return {
            izquierda,
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

    const { izquierda, medios, porCada } = datos;

    return (
        <aside className="aviso-desequilibrio" aria-label="Advertencia sobre el catálogo de medios">
            <h2>
                <Scale size={17} aria-hidden="true" /> Antes de leer: aquí falta un lado
            </h2>

            <p>
                De los {medios} medios que seguimos,{' '}
                <strong>{izquierda.medios} son de izquierda</strong> —el{' '}
                {izquierda.pctMedios.toFixed(0)} % del catálogo— pero publican el{' '}
                <strong>{izquierda.pctVolumen.toFixed(1)} % de los artículos</strong>: por cada
                nota suya hay <strong>{porCada} del resto</strong>.
            </p>

            <p>
                Así que casi todo le llegará contado desde la derecha o desde medios de
                orientación mixta —que <strong>no quiere decir sin línea</strong>—. Y muchos
                «puntos ciegos de la izquierda» no son un silencio deliberado: son un lado que
                casi no publica. Quién es dueño de cada medio está en el{' '}
                <Link to="/mapa-medios">mapa mediático</Link>.
            </p>
        </aside>
    );
};

export default AvisoDesequilibrio;
