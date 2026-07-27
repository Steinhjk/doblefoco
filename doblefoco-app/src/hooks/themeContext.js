import { createContext, useContext } from 'react';

/**
 * Contexto y hook del tema, separados del componente proveedor.
 *
 * Estaban en el mismo archivo que ThemeProvider, lo que rompía Fast Refresh:
 * un archivo que exporta componentes no puede exportar además otras cosas sin
 * perder el refresco en caliente.
 */
export const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);
