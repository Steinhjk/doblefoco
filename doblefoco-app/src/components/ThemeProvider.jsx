import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from '../hooks/themeContext';

const STORAGE_KEY = 'doblefoco-theme';

function getInitialTheme() {
    // En el servidor no hay ni localStorage ni matchMedia. Sin esta guarda, el
    // renderizado en servidor (F3-01) revienta con «window is not defined»
    // ANTES de emitir un solo carácter, y la ruta entera devuelve 500.
    //
    // Devolver 'light' aquí no produce discrepancia de hidratación porque el
    // tema no se pinta en el HTML: se aplica como data-theme sobre
    // documentElement dentro de un useEffect, que en el servidor no corre. El
    // cliente lo corrige en su primer efecto.
    if (typeof window === 'undefined') return 'light';

    try {
        // Una elección explícita SÍ se respeta: si alguien pulsó el interruptor,
        // esa decisión pesa más que cualquier valor por omisión.
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') return stored;
    } catch {
        // Modo incógnito con almacenamiento bloqueado: se cae al valor por
        // omisión en lugar de reventar en el primer render.
    }

    /*
     * CLARO POR OMISIÓN, y ya NO se consulta `prefers-color-scheme`.
     *
     * Es decisión de producto —Jose la pidió el 2026-07-29— y tiene además un
     * efecto técnico a favor: el servidor renderiza siempre en claro (no tiene
     * forma de conocer la preferencia del sistema), así que mientras el cliente
     * la consultara, quien tuviera el sistema en oscuro veía la página cargar
     * en claro y cambiar de golpe al hidratar. Ese destello desaparece.
     *
     * Contrapartida asumida: se deja de honrar la preferencia del sistema en la
     * primera visita. Quien quiera oscuro lo pulsa una vez y se recuerda.
     */
    return 'light';
}

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            /* la preferencia no persiste, pero la sesión funciona */
        }
    }, [theme]);

    const toggleTheme = useCallback(
        () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
        []
    );

    const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
