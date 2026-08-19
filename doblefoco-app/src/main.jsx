// @ts-check
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { ThemeProvider } from './components/ThemeProvider'
import { DatosInicialesContext } from './hooks/datosInicialesContext'
import './index.css'
import App from './App.jsx'

const container = document.getElementById('root');

if (!container) {
    throw new Error('No se encontró el elemento #root en el DOM');
}

/**
 * Datos que el servidor ya cargó y dejó dentro del HTML (F3-01).
 *
 * Viajan en <script type="application/json"> y NO en un script ejecutable, a
 * propósito: la política de seguridad del sitio es `script-src 'self'`, así que
 * un script con código incrustado quedaría bloqueado por el navegador. Un
 * bloque de datos no se ejecuta, de modo que la política no le aplica y no hace
 * falta relajarla ni repartir nonces por la página.
 *
 * Si el análisis falla no se rompe nada: se devuelve null y la página pide los
 * datos a la API como ha hecho siempre.
 */
function leerDatosIniciales() {
    const nodo = document.getElementById('datos-iniciales');
    if (!nodo?.textContent) return null;

    try {
        return JSON.parse(nodo.textContent);
    } catch (error) {
        console.warn('[datos-iniciales] ilegibles, se pedirán a la API', error);
        return null;
    }
}

const appJsx = (
    <StrictMode>
        <DatosInicialesContext.Provider value={leerDatosIniciales()}>
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </DatosInicialesContext.Provider>
    </StrictMode>
);

// Si #root ya tiene contenido, la página vino renderizada del servidor y hay
// que HIDRATAR: adoptar ese HTML en lugar de tirarlo y volver a pintarlo.
// Usar createRoot aquí desperdiciaría el renderizado entero y se vería un
// parpadeo en cada visita que llegue desde un buscador.
if (container.hasChildNodes()) {
    hydrateRoot(container, appJsx);
} else {
    createRoot(container).render(appJsx);
}

// Registro de Service Worker para caché offline y rendimiento
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (/** @type {any} */ (import.meta)).env?.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
            console.debug('[SW] Error al registrar service worker:', err);
        });
    });
}
