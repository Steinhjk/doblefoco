import { useEffect, useRef, useState } from 'react';

/**
 * Detecta cuándo un elemento entra en el viewport.
 *
 * Recibe primitivas en lugar de un objeto de opciones: el objeto se recreaba en
 * cada render, así que incluirlo en las dependencias reejecutaba el efecto
 * indefinidamente y omitirlo dejaba un aviso de exhaustive-deps.
 *
 * `initialInView` existe por seguridad: el CSS de entrada parte de opacidad 0,
 * de modo que si el observador nunca se dispara el contenido quedaría
 * invisible. Ver la nota en AnimateIn.
 */
/** Se evalúa una vez por carga: la capacidad del navegador no cambia. */
const SUPPORTS_OBSERVER =
    typeof window !== 'undefined' && typeof IntersectionObserver !== 'undefined';

export const useInView = ({ threshold = 0.1, rootMargin = '0px' } = {}) => {
    const ref = useRef(null);

    // Sin soporte del observador, el elemento arranca visible. Se decide en el
    // estado inicial, no dentro del efecto.
    const [inView, setInView] = useState(!SUPPORTS_OBSERVER);

    useEffect(() => {
        if (!SUPPORTS_OBSERVER) return undefined;

        const element = ref.current;
        if (!element) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [threshold, rootMargin]);

    return [ref, inView];
};
