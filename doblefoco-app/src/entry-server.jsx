// @ts-check
import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { Writable } from 'node:stream';
import { ThemeProvider } from './components/ThemeProvider';
import { DatosInicialesContext } from './hooks/datosInicialesContext';
import Shell from './Shell';

/**
 * Si el renderizado no termina en este tiempo, se aborta y la ruta responde
 * con el HTML de la SPA. Sin tope, una página que se quede colgada retendría
 * la conexión hasta el timeout del proxy, que es mucho más largo, y con
 * suficientes peticiones así se agota el proceso.
 */
const TIEMPO_MAXIMO_MS = 8_000;

/**
 * Renderiza la aplicación a HTML en el servidor.
 *
 * USA renderToPipeableStream Y NO renderToString, y esa es la diferencia entre
 * que esto funcione o no. Todas las páginas de Rutas.jsx se cargan con
 * `lazy()`, es decir, suspenden. `renderToString` no espera a Suspense: pinta
 * el `fallback` y devuelve. El resultado habría sido HTML con el spinner
 * «Cargando…» en lugar de la noticia — un rastreador recibiría un indicador de
 * carga y nada más, que es exactamente el problema que F3-01 venía a resolver.
 *
 * `onAllReady` espera a que TODAS las fronteras de Suspense hayan resuelto, así
 * que el HTML sale completo. Para una página de noticia es lo correcto: no
 * queremos entregar el esqueleto antes que el contenido, queremos el contenido.
 *
 * @param {string} url - Ruta solicitada, p. ej. "/noticia/story_12flvrc"
 * @param {any} [datosIniciales] - Datos ya cargados, p. ej. { story }
 * @returns {Promise<{ html: string }>}
 */
export function render(url, datosIniciales = null) {
    return new Promise((resolve, reject) => {
        let html = '';
        let errorDeRender = null;
        let terminado = false;

        const destino = new Writable({
            write(trozo, _codificacion, siguiente) {
                html += trozo;
                siguiente();
            },
        });

        const { pipe, abort } = renderToPipeableStream(
            <StrictMode>
                <DatosInicialesContext.Provider value={datosIniciales}>
                    <ThemeProvider>
                        <StaticRouter location={url}>
                            <Shell />
                        </StaticRouter>
                    </ThemeProvider>
                </DatosInicialesContext.Provider>
            </StrictMode>,
            {
                onAllReady() {
                    destino.on('finish', () => {
                        terminado = true;
                        clearTimeout(cronometro);
                        // Un error dentro de una frontera de Suspense NO impide
                        // que el flujo termine: devolvería HTML a medias con el
                        // fallback incrustado. Entregar eso sería peor que no
                        // renderizar, porque el rastreador lo indexaría.
                        if (errorDeRender) reject(errorDeRender);
                        else resolve({ html });
                    });
                    pipe(destino);
                },
                onError(error) {
                    errorDeRender = error;
                },
                onShellError(error) {
                    clearTimeout(cronometro);
                    reject(error);
                },
            }
        );

        const cronometro = setTimeout(() => {
            if (terminado) return;
            abort(new Error(`El renderizado de ${url} superó ${TIEMPO_MAXIMO_MS} ms`));
            reject(new Error(`El renderizado de ${url} superó ${TIEMPO_MAXIMO_MS} ms`));
        }, TIEMPO_MAXIMO_MS);
    });
}
