// @ts-check
/**
 * LOS FILTROS DEL FEED VIVEN EN LA URL (F3-06)
 *
 * Antes vivían en `useState` dentro de NewsFeed, y eso rompía tres cosas que la
 * gente da por sentadas en una web:
 *   · compartir. «Mira los puntos ciegos de la izquierda» exigía explicar por
 *     escrito qué botones pulsar;
 *   · volver atrás. El botón del navegador se saltaba el feed entero en vez de
 *     deshacer el último filtro;
 *   · recargar. Un F5 devolvía a la portada sin filtros, perdiendo el sitio.
 *
 * DOS COMPORTAMIENTOS DISTINTOS DE HISTORIAL, y la distinción es el detalle que
 * hace que esto se sienta bien:
 *   · cambiar un FILTRO empuja una entrada nueva, así que «atrás» deshace ese
 *     filtro, que es justo lo que se espera;
 *   · pulsar «ver más» REEMPLAZA la entrada. Si empujara, volver atrás desde
 *     una noticia obligaría a pasar por cada carga de diez en diez —cinco
 *     pulsaciones de «atrás» para salir del feed— y eso es exasperante.
 *
 * LOS VALORES POR OMISIÓN NO SE ESCRIBEN EN LA URL. La portada es `/`, no
 * `/?ambito=all&espectro=all&ciego=all&polar=all&orden=recent`. Una URL que se
 * comparte se lee, y esa no dice nada.
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Cuántas historias añade cada pulsación de «ver más». */
export const TAMANO_PAGINA = 10;

/**
 * Definición de cada filtro: su clave en la URL, su valor por omisión y los
 * valores que acepta.
 *
 * LOS VALORES SE VALIDAN CONTRA ESTA LISTA. Una URL es texto que escribe
 * cualquiera: sin comprobarlo, `?espectro=<script>` acabaría en un atributo del
 * DOM, y `?orden=loquesea` dejaría el feed en un estado que ningún botón puede
 * representar y del que no se sale sin editar la barra de direcciones.
 *
 * Las CLAVES van en español porque la URL la lee una persona. Los VALORES no se
 * traducen: son los mismos que usa el clasificador de sesgo en shared/, y
 * añadir una capa de traducción sería un sitio más donde equivocarse.
 */
export const FILTROS = /** @type {const} */ ({
    ambito: { porDefecto: 'all', validos: ['all', 'nacional', 'internacional'] },
    espectro: { porDefecto: 'all', validos: ['all', 'left', 'center', 'right'] },
    ciego: { porDefecto: 'all', validos: ['all', 'only'] },
    polar: { porDefecto: 'all', validos: ['all', 'high'] },
    orden: { porDefecto: 'recent', validos: ['recent', 'polarization', 'coverage'] },
});

/**
 * Lee los filtros de una URL, cayendo al valor por omisión cuando no valen.
 *
 * @param {URLSearchParams} params
 * @returns {Record<string, string>}
 */
export function leerFiltros(params) {
    /** @type {Record<string, string>} */
    const salida = {};

    for (const [clave, def] of Object.entries(FILTROS)) {
        const bruto = params.get(clave);
        salida[clave] = def.validos.includes(/** @type {never} */ (bruto))
            ? String(bruto)
            : def.porDefecto;
    }

    return salida;
}

/**
 * Cuántas historias mostrar según la URL.
 *
 * Se acota por arriba: `?ver=999999999` haría que el navegador intentara pintar
 * un millón de tarjetas y se quedara colgado. No hace falta mala intención,
 * basta un dedo torpe editando la barra de direcciones.
 *
 * @param {URLSearchParams} params
 * @param {number} total
 */
export function leerVisibles(params, total) {
    const bruto = Number(params.get('ver'));
    if (!Number.isFinite(bruto) || bruto < TAMANO_PAGINA) return TAMANO_PAGINA;
    return Math.min(Math.ceil(bruto / TAMANO_PAGINA) * TAMANO_PAGINA, Math.max(total, TAMANO_PAGINA));
}

/**
 * Aplica cambios sobre unos parámetros, quitando los que valgan lo de siempre.
 *
 * @param {URLSearchParams} actuales
 * @param {Record<string, string|number|null>} cambios
 * @returns {URLSearchParams}
 */
export function aplicarCambios(actuales, cambios) {
    const siguientes = new URLSearchParams(actuales);

    for (const [clave, valor] of Object.entries(cambios)) {
        const def = FILTROS[/** @type {keyof typeof FILTROS} */ (clave)];
        const esPorDefecto = def
            ? valor === def.porDefecto
            : valor === null || Number(valor) <= TAMANO_PAGINA;

        if (esPorDefecto) siguientes.delete(clave);
        else siguientes.set(clave, String(valor));
    }

    return siguientes;
}

/**
 * Estado del feed, sincronizado con la barra de direcciones.
 *
 * @param {number} total - historias disponibles, para acotar la paginación
 */
export function useFiltrosDeFeed(total) {
    const [params, setParams] = useSearchParams();

    const filtros = useMemo(() => leerFiltros(params), [params]);
    const visibles = leerVisibles(params, total);

    /**
     * Cambia un filtro. Empuja historial y vuelve a la primera página: seguir
     * en la página 4 tras cambiar de filtro mostraría un tramo arbitrario de
     * una lista que la persona no ha visto empezar.
     */
    const asignar = useCallback(
        (clave, valor) => {
            setParams((previos) => aplicarCambios(previos, { [clave]: valor, ver: null }));
        },
        [setParams]
    );

    /** Más resultados. REEMPLAZA la entrada de historial (ver cabecera). */
    const verMas = useCallback(() => {
        setParams(
            (previos) => aplicarCambios(previos, { ver: leerVisibles(previos, total) + TAMANO_PAGINA }),
            { replace: true }
        );
    }, [setParams, total]);

    /** ¿Hay algún filtro puesto? Para poder ofrecer «quitar filtros». */
    const hayFiltros = useMemo(
        () => Object.entries(FILTROS).some(([clave, def]) => filtros[clave] !== def.porDefecto),
        [filtros]
    );

    const limpiar = useCallback(() => {
        setParams(new URLSearchParams());
    }, [setParams]);

    return { filtros, visibles, asignar, verMas, hayFiltros, limpiar };
}
