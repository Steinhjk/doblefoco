import { useInView } from '../hooks/useInView';

const AnimateIn = ({ children, delay = 0, className = '' }) => {
    const [ref, inView] = useInView();
    const delayClass = delay > 0 ? `animate-delay-${delay}` : '';

    return (
        <div
            ref={ref}
            className={`animate-in ${inView ? 'visible' : ''} ${delayClass} ${className}`}
        >
            {children}
        </div>
    );
};

export default AnimateIn;
