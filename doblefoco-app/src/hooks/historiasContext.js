// @ts-check
import { createContext, useContext, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars -- solo para el @typedef de abajo
import { useStories } from './useStories';

/**
 * UNA SOLA CONSULTA DE HISTORIAS PARA TODA LA PÁGINA (T2-2 / punto 13).
 *
 * EL DEFECTO QUE CIERRA
 * ---------------------
 * Cinco componentes pedían las mismas historias por su cuenta: la barra de
 * navegación (60), el destacado (40), las dos barras laterales (60 y 60) y el
 * feed (100). Cinco peticiones y, lo que importa, **cinco fotografías tomadas
 * en cinco instantes distintos**. El ciclo de ingesta entra cada 30 minutos y
 * reordena la portada: si cae entre dos de esas peticiones, la página enseña
 * dos mundos a la vez —el destacado con una historia que el feed de abajo ya no
 * tiene—. No hay error, no hay aviso; simplemente el sitio se contradice a sí
 * mismo delante del lector.
 *
 * LO QUE CUESTA, dicho antes de que alguien lo eche de menos: la propiedad de
 * que «cada componente es autosuficiente». Un componente ya no puede montarse
 * suelto y traerse sus datos; necesita el proveedor encima. Vale menos que la
 * coherencia de la portada, y era el precio que el plan de continuidad ya había
 * aceptado.
 *
 * DOS TUBERÍAS, NO UNA, Y POR QUÉ
 * -------------------------------
 * El feed tiene un filtro de ÁMBITO que el resto de la página no tiene. Si todo
 * colgara de la misma consulta, filtrar el feed a «internacional» cambiaría
 * también el destacado y las laterales, que hoy hablan siempre del catálogo
 * entero. Eso no es la incoherencia que había que arreglar: es una pregunta
 * distinta, deliberada y del lector.
 *
 * Así que hay dos:
 *
 *   · **la de ambiente** — `ambito: 'all'`, la que ven el destacado, las
 *     laterales, el buscador de la barra y las pantallas de secciones,
 *     tendencias y búsqueda;
 *   · **la del feed** — la misma cuando no hay filtro, y una consulta propia
 *     cuando el lector elige un ámbito.
 *
 * Con la portada sin filtrar, que es la inmensa mayoría de las visitas, **hay
 * una sola petición y una sola fotografía**. Filtrando, hay dos, y cada una es
 * coherente consigo misma.
 *
 * EL ÁMBITO NO SE LEVANTA A ESTADO: YA VIVE EN LA URL. `useFiltrosDeFeed` lo
 * guarda en la barra de direcciones desde F3-06, así que el proveedor y el feed
 * leen la misma fuente sin tener que pasarse nada. Es la razón de que esto no
 * necesite un `setAmbito` ni un contexto de filtros.
 *
 * DÓNDE VA. Dentro del enrutador —lee la URL— y por encima de la barra de
 * navegación, o sea envolviendo el árbol de `Shell`, que es el único sitio donde
 * cliente y servidor pintan lo mismo.
 */

/**
 * El contexto y sus hooks van SEPARADOS del componente proveedor, igual que
 * `themeContext` y `ThemeProvider`: un archivo que exporta un componente no
 * puede exportar además otras cosas sin perder el refresco en caliente.
 *
 * @typedef {ReturnType<typeof useStories>} Consulta
 */

export const HistoriasContext = createContext(
    /** @type {{ambiente: Consulta, feed: Consulta}|null} */ (null)
);

function useContextoDeHistorias(quien) {
    const ctx = useContext(HistoriasContext);
    if (!ctx) {
        // Falla ruidosamente a propósito. Un estado vacío de mentira dejaría la
        // página pintándose «sin datos» sin que nadie supiera por qué, que es
        // exactamente la clase de fallo silencioso que este proyecto persigue.
        throw new Error(`${quien} se usó fuera de <ProveedorDeHistorias>`);
    }
    return ctx;
}

/**
 * LAS HISTORIAS DE AMBIENTE, recortadas a las que pide quien llama.
 *
 * EL RECORTE NO ES UN DETALLE. Sin él, un componente que pide 40 vería 200 en
 * cuanto el lector hubiera pulsado «cargar más» en el feed, y las cifras que
 * calcula sobre lo descargado —«reparto sobre las N historias con más
 * cobertura»— cambiarían según por dónde hubiera navegado antes. Con el
 * recorte, cada uno ve exactamente lo que veía cuando se traía sus propios
 * datos: las primeras N, en el mismo orden.
 *
 * @param {{limit?: number}} [opciones]
 */
export function useHistorias({ limit = 100 } = {}) {
    const { ambiente } = useContextoDeHistorias('useHistorias');

    return useMemo(
        () => ({ ...ambiente, stories: ambiente.stories.slice(0, limit) }),
        [ambiente, limit]
    );
}

/**
 * La consulta del feed, con su paginación. La misma que la de ambiente mientras
 * el lector no filtre por ámbito.
 */
export function useFeedDeHistorias() {
    return useContextoDeHistorias('useFeedDeHistorias').feed;
}
