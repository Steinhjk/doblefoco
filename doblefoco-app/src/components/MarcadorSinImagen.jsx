// @ts-check
import { ImageOff } from 'lucide-react';
import { getMediaByName } from '../data/mediaLogos';
import MediaLogo from './MediaLogo';
import './MarcadorSinImagen.css';

/**
 * EL MARCADOR DE «NO HAY IMAGEN», que no es una imagen.
 *
 * Decisión de Jose del 2026-09-02 (sesión de decisiones, punto 8a; duda 3).
 * Hasta hoy una historia sin foto se pintaba sin hueco: el titular subía y la
 * tarjeta se adaptaba. Era honesto y era invisible: nada decía que faltaba
 * algo, y las tarjetas con y sin foto no se alineaban.
 *
 * LO QUE ESTO ES: el logo del medio que abre la historia, sobre un fondo plano,
 * con la frase «Sin imagen del medio». Se lee como aviso, no como ilustración.
 *
 * LO QUE ESTO NO ES, y la regla viene del 2026-07-30: nunca una foto
 * «relacionada». Aquella vez se ilustraba «Condenan a Carlos Caicedo» con una
 * foto de archivo etiquetada «Indicadores Económicos», porque una imagen junto
 * a un titular se lee como documental. Por eso el marcador es plano, lleva
 * texto y no tiene nada que se pueda confundir con una foto.
 *
 * El logo sale del catálogo por el nombre de la primera fuente; si el medio no
 * tiene logo, `MediaLogo` pinta sus iniciales, que es lo que hace en todo el
 * sitio. Sin fuente conocida, se pinta solo el aviso.
 *
 * @param {{ story: any, className?: string, tamano?: number, compacto?: boolean }} props
 */
const MarcadorSinImagen = ({ story, className = '', tamano = 44, compacto = false }) => {
    const fuente = story?.sources?.[0];
    const media = fuente?.name ? getMediaByName(fuente.name) : null;
    const nombre = media?.shortName ?? media?.name ?? null;

    return (
        <div
            className={`marcador-sin-imagen ${compacto ? 'marcador-sin-imagen--compacto' : ''} ${className}`}
            role="img"
            aria-label={nombre ? `Sin imagen del medio. Abre ${nombre}.` : 'Sin imagen del medio.'}
        >
            {media ? (
                <MediaLogo media={media} size={tamano} />
            ) : (
                <ImageOff size={Math.round(tamano * 0.6)} aria-hidden="true" />
            )}
            {!compacto && (
                <span className="marcador-sin-imagen-texto">
                    <ImageOff size={11} aria-hidden="true" />
                    Sin imagen del medio
                </span>
            )}
        </div>
    );
};

export default MarcadorSinImagen;
