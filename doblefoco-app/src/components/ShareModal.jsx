import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Check, Copy, Linkedin, MessageCircle, X } from 'lucide-react';
import './ShareModal.css';
import { nombreDeSeccion } from '../lib/seccion';
import { categories } from '../data/categories';
import {
    fraseDeCoberturaDeHistoria,
    mensajeConEnlace,
    textoDeCompartir,
    urlDeHistoria,
} from '../lib/compartir';

/** Ver la nota de `nombreDeSeccion`: la etiqueta sale de `topics`, no del feed. */
const seccionDe = (story) => nombreDeSeccion(story, categories);

/**
 * Diálogo para compartir.
 *
 * Accesibilidad corregida: la versión anterior no tenía role="dialog", no
 * cerraba con Escape, no atrapaba el foco (se podía tabular "detrás" del
 * modal) y no devolvía el foco al abridor al cerrarse.
 *
 * ES EL RESPALDO, NO EL CAMINO PRINCIPAL. Donde el navegador tiene
 * `navigator.share` —o sea en casi todos los móviles— `BotonCompartir` abre la
 * hoja nativa y este diálogo no llega a verse. Aquí se llega desde un
 * escritorio, que es donde elegir la red a mano tiene sentido.
 *
 * LO QUE SE VE AQUÍ ES LO QUE SE VA A MANDAR. La versión anterior enseñaba una
 * vista previa con «N medios cubriendo el hecho» y mandaba otra cosa distinta.
 * Una vista previa que no previsualiza es peor que ninguna. *
 * SE PINTA EN UN PORTAL, Y ESO NO ES UN DETALLE DE IMPLEMENTACIÓN. El velo es
 * `position: fixed` con `inset: 0`, que debería cubrir la pantalla — salvo si
 * algún ancestro tiene `transform`, porque entonces el navegador posiciona el
 * «fijo» respecto a ESE ancestro y no a la ventana. Y `.news-card:hover` lleva
 * `transform: translateY(-2px)`.
 *
 * O sea que al colgar el diálogo de la tarjeta fallaba **solo cuando el puntero
 * estaba encima**, que es exactamente cuando alguien pulsa el botón. Una prueba
 * que haga clic sin pasar por encima lo ve bien; un lector, nunca. Lo cazó mirar
 * la captura, no las 872 pruebas.
 *
 * `document.body` no está dentro de nada, así que ahí `fixed` vuelve a
 * significar fijo.
 */
const ShareModal = ({ story, isOpen, onClose }) => {
    const [copied, setCopied] = useState(false);
    const dialogRef = useRef(null);
    const previouslyFocused = useRef(null);

    const handleKeyDown = useCallback(
        (event) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                onClose();
                return;
            }

            if (event.key !== 'Tab' || !dialogRef.current) return;

            const focusables = dialogRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (!focusables.length) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (!isOpen) return undefined;

        previouslyFocused.current = document.activeElement;
        dialogRef.current?.querySelector('button')?.focus();

        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = overflow;
            // Devolver el foco a donde estaba evita que el lector de pantalla
            // quede huérfano al principio del documento.
            previouslyFocused.current?.focus?.();
        };
    }, [isOpen]);

    useEffect(() => {
        if (!copied) return undefined;
        const timer = setTimeout(() => setCopied(false), 2500);
        return () => clearTimeout(timer);
    }, [copied]);

    if (!isOpen || !story) return null;

    const shareUrl = urlDeHistoria(story);
    const shareText = textoDeCompartir(story);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
        } catch {
            // Sin permiso de portapapeles (o contexto no seguro): no se puede
            // copiar y el botón simplemente no confirma.
        }
    };

    const openShare = (url) => window.open(url, '_blank', 'noopener,noreferrer');

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="share-modal-overlay" onClick={onClose}>
            <div
                ref={dialogRef}
                className="share-modal-content"
                role="dialog"
                aria-modal="true"
                aria-labelledby="share-modal-title"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <div className="share-modal-header">
                    <h2 id="share-modal-title">
                        <Share2 size={18} aria-hidden="true" /> Compartir
                    </h2>
                    <button className="close-modal-btn" onClick={onClose} aria-label="Cerrar">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="share-preview-card">
                    {seccionDe(story) && <span className="preview-tag">{seccionDe(story)}</span>}
                    <h3 className="preview-title">{story.title}</h3>
                    <p className="preview-sources-summary">{fraseDeCoberturaDeHistoria(story)}</p>
                    <p className="preview-url">{shareUrl}</p>
                </div>

                <div className="share-options-grid">
                    {/*
                      * WHATSAPP VA PRIMERO, Y NO ES UNA PREFERENCIA. En Colombia
                      * es por donde circula lo que circula; ofrecer X y LinkedIn
                      * y no WhatsApp era ofrecer las dos redes que menos usa el
                      * lector de este sitio. Es un enlace `wa.me`, no un SDK: la
                      * CSP es `script-src 'self'` y no admite otra cosa.
                      */}
                    <button
                        className="social-share-btn whatsapp"
                        onClick={() =>
                            openShare(
                                `https://wa.me/?text=${encodeURIComponent(mensajeConEnlace(story))}`
                            )
                        }
                    >
                        <MessageCircle size={16} aria-hidden="true" /> Compartir por WhatsApp
                    </button>

                    <button
                        className="social-share-btn twitter"
                        onClick={() =>
                            openShare(
                                `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
                            )
                        }
                    >
                        Compartir en X
                    </button>

                    <button
                        className="social-share-btn linkedin"
                        onClick={() =>
                            openShare(
                                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
                            )
                        }
                    >
                        <Linkedin size={16} aria-hidden="true" /> Compartir en LinkedIn
                    </button>

                    <button className="social-share-btn copy" onClick={handleCopy}>
                        {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                        {copied ? 'Enlace copiado' : 'Copiar enlace'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ShareModal;
