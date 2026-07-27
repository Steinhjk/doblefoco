import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from '../hooks/themeContext';

const STORAGE_KEY = 'doblefoco-theme';

function getInitialTheme() {
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
