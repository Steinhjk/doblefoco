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
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') return stored;
    } catch {
        // Modo incógnito con almacenamiento bloqueado: se cae a la preferencia
        // del sistema en lugar de reventar en el primer render.
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
