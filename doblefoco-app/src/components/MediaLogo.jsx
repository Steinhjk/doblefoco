import { useState } from 'react';
import './MediaLogo.css';

/**
 * Logo de un medio, con degradación honesta.
 *
 * Un medio que no está en el catálogo no tiene dominio conocido, así que no se
 * le puede derivar un logo. Antes se fabricaba una URL con el nombre y sus
 * espacios (…favicons?domain=the%20new%20york%20times.com), lo que producía un
 * icono roto en cada tarjeta de las 100 noticias internacionales.
 *
 * Aquí, si no hay logo o falla la carga, se muestran las iniciales del medio.
 * Un monograma legible comunica más que un icono roto.
 */
const MediaLogo = ({ media, size = 16 }) => {
    const [failed, setFailed] = useState(false);
    const showImage = media?.logo && !failed;

    if (showImage) {
        return (
            <img
                src={media.logo}
                alt=""
                className="media-logo-img-el"
                width={size}
                height={size}
                loading="lazy"
                onError={() => setFailed(true)}
            />
        );
    }

    const initials = String(media?.shortName ?? media?.name ?? '?')
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();

    return (
        <span
            className="media-logo-fallback"
            style={{ width: size, height: size, fontSize: Math.max(7, size * 0.45) }}
            aria-hidden="true"
        >
            {initials}
        </span>
    );
};

export default MediaLogo;
