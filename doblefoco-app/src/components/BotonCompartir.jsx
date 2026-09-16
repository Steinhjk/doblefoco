import { useState } from 'react';
import { Share2 } from 'lucide-react';
import ShareModal from './ShareModal';
import { textoDeCompartir, urlDeHistoria } from '../lib/compartir';
import './BotonCompartir.css';

/**
 * EL BOTÓN DE COMPARTIR, Y LA DECISIÓN QUE TOMA POR EL LECTOR.
 *
 * Hay dos formas de compartir y no compiten: se elige sola.
 *
 *   · **Donde existe `navigator.share`** —o sea en prácticamente cualquier
 *     móvil— se abre la hoja nativa del sistema. Ahí está WhatsApp, y también el
 *     Telegram, el correo y las notas que tenga ESE lector. Un diálogo nuestro
 *     con tres botones ofrece menos y pide más toques.
 *   · **Donde no existe** —casi todo escritorio— se abre `ShareModal`, que es
 *     para eso: elegir la red a mano.
 *
 * QUE EL LECTOR CIERRE LA HOJA NO ES UN FALLO. `navigator.share` rechaza con
 * `AbortError` cuando alguien se arrepiente, y caer al diálogo en ese caso sería
 * insistir: el lector acaba de decir que no. Los demás rechazos —permiso
 * denegado, contexto no seguro— sí caen al diálogo, porque ahí el lector quiso
 * compartir y la vía falló.
 *
 * `preventDefault` Y `stopPropagation` SON DEFENSA, NO NECESIDAD DE HOY. Se
 * comprobó al escribirlo: ninguna tarjeta envuelve su contenido entero en un
 * `Link` —solo lo están el titular y la imagen—, así que hoy el clic no tiene
 * dónde propagarse. Se quedan porque el día que una tarjeta sí se vuelva
 * pulsable entera, el fallo sería tocar «compartir» y acabar en la noticia, y
 * eso no lo caza ninguna prueba de las que hay.
 *
 * @param {{story: any, variante?: 'tarjeta' | 'detalle'}} props
 */
const BotonCompartir = ({ story, variante = 'tarjeta' }) => {
    const [dialogoAbierto, setDialogoAbierto] = useState(false);

    if (!story) return null;

    const compartir = async (evento) => {
        evento.preventDefault();
        evento.stopPropagation();

        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            try {
                await navigator.share({
                    title: story.title,
                    text: textoDeCompartir(story),
                    url: urlDeHistoria(story),
                });
                return;
            } catch (error) {
                if (error?.name === 'AbortError') return;
            }
        }

        setDialogoAbierto(true);
    };

    return (
        <>
            <button
                type="button"
                className={`boton-compartir es-${variante}`}
                onClick={compartir}
                aria-label={`Compartir: ${story.title}`}
            >
                <Share2 size={variante === 'detalle' ? 14 : 13} aria-hidden="true" />
                <span className="boton-compartir-texto">Compartir</span>
            </button>

            <ShareModal
                story={story}
                isOpen={dialogoAbierto}
                onClose={() => setDialogoAbierto(false)}
            />
        </>
    );
};

export default BotonCompartir;
