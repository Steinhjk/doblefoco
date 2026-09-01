// @ts-check
import { useEffect, useState } from 'react';
import { isApiConfigured } from '../services/apiClient.js';
import { comprobarDesfaseConElMotor } from '../services/versionHandshake.js';
import { getIngestFeeds } from '../../shared/mediaRegistry.js';
import './AvisoDesfase.css';

/**
 * El aviso del handshake de versión: se pinta SOLO cuando el sitio y su motor
 * llevan compilados catálogos distintos. El resto del tiempo no existe.
 *
 * POR QUÉ HABLA EL SITIO Y NO SOLO UN VIGILANTE. `desfase.yml` compara una vez
 * al día y avisa a quien mantiene el sitio; esto se entera en el minuto uno e
 * incluye el caso que ningún cron ve —un despliegue a medias, un rollback— y
 * al único que el desfase le importa de verdad: el lector que tiene la página
 * abierta. La revisión externa lo llamó por su nombre: un vigilante que solo
 * avisa es la peor posición intermedia.
 *
 * QUÉ LE DICE AL LECTOR. Que los conteos pueden estar incompletos, que es la
 * consecuencia real medida las dos veces que este desfase ocurrió. No le habla
 * de commits ni de huellas: eso va a la consola, para quien depure.
 */

/**
 * El cuerpo, separado del efecto para poderse probar con renderToStaticMarkup.
 *
 * @param {{ veredicto: import('../services/versionHandshake.js').Veredicto }} props
 */
export function CuerpoDelAviso({ veredicto }) {
    if (veredicto.estado !== 'desfase') return null;

    const esperados = getIngestFeeds().length;
    const detalle = veredicto.motorFeeds !== null && veredicto.motorFeeds !== esperados
        ? ` Esta versión del sitio espera ${esperados} fuentes y el motor está leyendo ${veredicto.motorFeeds}.`
        : '';

    return (
        <div className="aviso-desfase" role="status">
            <strong>El sitio se está actualizando.</strong> La página y su motor de
            datos llevan versiones distintas del catálogo, así que algunos conteos
            pueden estar incompletos.{detalle} Suele resolverse solo en unos
            minutos.
        </div>
    );
}

export default function AvisoDesfase() {
    const [veredicto, setVeredicto] = useState(
        /** @type {import('../services/versionHandshake.js').Veredicto | null} */ (null)
    );

    useEffect(() => {
        // Sin API configurada es el modo demostración: no hay motor con el que
        // discrepar. Y el efecto no corre en el servidor, así que el HTML del
        // SSR y el primer render del cliente coinciden siempre (los dos, null).
        if (!isApiConfigured) return;

        let vivo = true;
        comprobarDesfaseConElMotor().then((v) => {
            if (!vivo) return;
            setVeredicto(v);
            if (v.estado === 'desfase') {
                // El diagnóstico técnico, donde le sirve a quien depura y no
                // asusta a quien lee.
                console.warn(
                    `[DobleFoco] Desfase de versión: este bundle espera el registro ` +
                    `${v.esperadoHash} y el motor sirve ${v.motorHash} ` +
                    `(commit del motor: ${v.motorCommit ?? 'desconocido'}).`
                );
            }
        });
        return () => { vivo = false; };
    }, []);

    if (!veredicto) return null;
    return <CuerpoDelAviso veredicto={veredicto} />;
}
