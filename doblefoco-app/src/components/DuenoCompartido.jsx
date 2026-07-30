// @ts-check
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { gruposCompartidos } from '../../shared/mediaOwnership.js';
import { getMediaById } from '../../shared/mediaRegistry.js';
import './DuenoCompartido.css';

/**
 * «Cinco medios» no siempre son cinco voces.
 *
 * La cifra de cobertura es lo primero que lee alguien, y la lee como pluralidad.
 * Cuando dos de esos medios responden ante el mismo dueño, la pluralidad real es
 * menor y el lector no tiene forma de saberlo: son marcas distintas, con logos
 * distintos, en ciudades distintas.
 *
 * SE EXPONE LA PROPIEDAD, NO SE ACUSA DE NADA. No decimos que se hayan puesto de
 * acuerdo —no consta, y lo que no consta no se publica—: decimos quién es el
 * dueño de cada uno, que es un hecho registral con su fuente en el mapa de
 * medios. La conclusión la saca quien lee, con el dato delante en vez de sin él.
 *
 * Silencioso cuando no hay nada que decir. Un aviso que sale siempre se
 * convierte en decorado y deja de leerse justo el día que importa.
 */
const DuenoCompartido = ({ sources, total }) => {
    const grupos = useMemo(
        () => gruposCompartidos((sources ?? []).map((s) => s?.id).filter(Boolean)),
        [sources]
    );

    if (!grupos.length) return null;

    // Voces reales = medios menos los que se repiten dentro de un mismo dueño.
    const repetidos = grupos.reduce((suma, g) => suma + g.medios.length - 1, 0);
    const voces = total - repetidos;

    return (
        <div className="detail-owner-alert">
            <div className="owner-alert-header">
                <Building2 size={16} aria-hidden="true" />
                <strong>
                    {voces === 1
                        ? `${total} medios, un solo dueño`
                        : `${total} medios, ${voces} dueños distintos`}
                </strong>
            </div>
            {grupos.map((g) => (
                <p key={g.groupId} className="owner-alert-line">
                    <strong>
                        {g.medios
                            .map((id) => getMediaById(id)?.name ?? id)
                            .join(' y ')}
                    </strong>{' '}
                    pertenecen a {g.label}.
                </p>
            ))}
            <p className="owner-alert-note">
                Son marcas distintas con el mismo propietario. No afirmamos que hayan coordinado
                su cobertura; mostramos de quién depende cada una.{' '}
                <Link to="/mapa-medios">Ver las fichas de propiedad</Link>.
            </p>
        </div>
    );
};


export default DuenoCompartido;
