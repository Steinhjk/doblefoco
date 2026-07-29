// @ts-check
import { createContext, useContext } from 'react';

/**
 * Datos que el SERVIDOR ya cargó y no hace falta volver a pedir.
 *
 * El servidor consulta la historia en Postgres para poder renderizarla; sin
 * este canal, el navegador la volvería a pedir a /api/story/:id nada más
 * hidratar. Serían dos consultas para el mismo dato y, peor, un parpadeo: el
 * HTML llega con la noticia, React hidrata con `story` en null y la página se
 * queda un instante en «Cargando».
 *
 * VIAJA POR CONTEXTO, no por una variable de módulo. Con
 * renderToPipeableStream el renderizado es asíncrono y dos peticiones
 * simultáneas pueden solaparse: una variable global haría que un lector viera
 * la noticia de otro. El contexto es por árbol, y cada petición tiene el suyo.
 *
 * En el navegador lo rellena main.jsx leyendo <script id="datos-iniciales">.
 */
export const DatosInicialesContext = createContext(/** @type {any} */ (null));

/**
 * Devuelve la historia precargada SOLO si es la que se está pidiendo.
 *
 * La comprobación del id no es decorativa: al navegar de una noticia a otra
 * dentro de la SPA, el contexto sigue conteniendo la primera. Sin comparar,
 * la segunda noticia mostraría el contenido de la primera.
 *
 * @param {string | undefined} id
 */
export function useHistoriaInicial(id) {
    const datos = useContext(DatosInicialesContext);
    if (!id || !datos?.story || datos.story.id !== id) return null;
    return datos.story;
}
