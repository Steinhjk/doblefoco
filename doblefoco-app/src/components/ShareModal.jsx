import { useCallback, useEffect, useRef, useState } from 'react';
import { Share2, Check, Copy, Linkedin, X } from 'lucide-react';
import './ShareModal.css';
import { nombreDeSeccion } from '../lib/seccion';
import { categories } from '../data/categories';

/** Ver la nota de `nombreDeSeccion`: la etiqueta sale de `topics`, no del feed. */
const seccionDe = (story) => nombreDeSeccion(story, categories);

/**
 * Diálogo para compartir.
 *
 * Accesibilidad corregida: la versión anterior no tenía role="dialog", no
 * cerraba con Escape, no atrapaba el foco (se podía tabular "detrás" del
 * modal) y no devolvía el foco al abridor al cerrarse.
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

    const shareUrl = window.location.href;
    const shareText = `Cobertura contrastada: "${story.title}" en DobleFoco.co`;

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

    return (
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
                    <span className="preview-tag">{seccionDe(story)}</span>
                    <h3 className="preview-title">{story.title}</h3>
                    <p className="preview-sources-summary">
                        {story.coverage?.total ?? story.sources?.length ?? 0} medios cubriendo el hecho
                    </p>
                </div>

                <div className="share-options-grid">
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
        </div>
    );
};

export default ShareModal;
