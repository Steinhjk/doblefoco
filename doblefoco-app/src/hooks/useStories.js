import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchFeed, isApiConfigured } from '../services/apiClient';
import { normalizeStories } from '../lib/story';

/**
 * Fuente única de historias para todo el sitio — tarea F2-03.
 *
 * QUÉ SUSTITUYE, Y POR QUÉ NO ERA SOLO PESO
 * -----------------------------------------
 * Ocho componentes hacían `normalizeStories([...algo, ...newsData])` contra un
 * fixture de 200 historias. Ese fixture no era un marcador de posición
 * inofensivo: contenía 600 "perspectivas" con la plantilla
 *
 *     "Desde El Tiempo: Balance normativo y análisis de indicadores…"
 *
 * es decir, texto inventado atribuido a 32 medios colombianos reales, con la
 * portada del medio como supuesto enlace de verificación. Es exactamente la
 * fabricación que la Fase 0 eliminó del motor (F0-01, F0-03), sobreviviendo en
 * el bundle que se descargaba el visitante.
 *
 * QUÉ HACE AHORA
 * --------------
 * O hay datos reales de la API, o no hay nada y se dice. No existe tercer
 * estado. Es más pobre de ver y es lo único honesto.
 *
 * PAGINACIÓN DE VERDAD (2026-07-30)
 * ---------------------------------
 * Antes pedía 100 historias y ahí se acababa el sitio: «cargar más» solo
 * revelaba parte de lo ya descargado, así que la historia 101 era inalcanzable y
 * el 100 aparecía en la portada como si fuera el tamaño del catálogo. Sigue 311
 * multifuente de más de 4 000.
 *
 * Ahora `cargarMas()` pide la página siguiente al servidor y la añade. El
 * ÁMBITO viaja al servidor en vez de filtrarse aquí, y por eso cambiarlo
 * reinicia la lista: cada pestaña es su propia consulta paginada, con lo cual
 * sus cifras pueden ser las del catálogo entero sin mentir, porque cargando más
 * se llega a todas.
 *
 * `counts` SON DEL CATÁLOGO, `stories` ES LO DESCARGADO. Confundirlos ya produjo
 * un error en la portada: contaba `stories.length` y lo presentaba como total.
 *
 * @returns {{stories: Array, counts: {total: number, multifuente: number, nacional: number, internacional: number}, status: 'cargando'|'listo'|'sin-datos', reason: string|null, cargarMas: () => void, hayMas: boolean, cargandoMas: boolean}}
 */
const SIN_CONTEO = { total: 0, multifuente: 0, nacional: 0, internacional: 0 };

export function useStories({ limit = 100, ambito = 'all' } = {}) {
    const [state, setState] = useState(() => ({
        stories: [],
        counts: SIN_CONTEO,
        status: isApiConfigured ? 'cargando' : 'sin-datos',
        reason: isApiConfigured ? null : 'Este despliegue no tiene la API configurada.',
    }));

    const [cargandoMas, setCargandoMas] = useState(false);
    const [hayMas, setHayMas] = useState(false);

    /**
     * Cuántas historias se han pedido ya. En una ref y no en estado: cambiarla
     * no tiene que repintar, y si lo hiciera provocaría otra petición.
     */
    const offset = useRef(0);

    useEffect(() => {
        if (!isApiConfigured) return undefined;

        let activo = true;
        offset.current = 0;

        /**
         * NO se marca «cargando» al cambiar de pestaña, a propósito. La lista
         * anterior se queda visible hasta que llega la nueva, que es mejor que
         * un parpadeo en blanco entre dos listas. En la primera carga el estado
         * ya arranca en «cargando» desde el inicializador.
         */
        fetchFeed({ limit, offset: 0, ambito }).then((result) => {
            if (!activo) return;

            if (result.ok && result.stories.length) {
                offset.current = result.stories.length;
                setHayMas(result.stories.length >= limit);
                setState({
                    stories: normalizeStories(result.stories),
                    counts: result.counts ?? SIN_CONTEO,
                    status: 'listo',
                    reason: null,
                });
                return;
            }

            setHayMas(false);
            setState({
                stories: [],
                counts: result.counts ?? SIN_CONTEO,
                status: 'sin-datos',
                // Se distingue "la API no respondió" de "respondió y no hay
                // nada": la primera es una avería y la segunda es un hecho
                // sobre la cobertura. Confundirlas oculta la avería.
                reason: result.ok
                    ? 'Todavía no hay historias ingeridas.'
                    : result.error ?? 'No se pudo contactar con la API.',
            });
        });

        return () => {
            activo = false;
        };
    }, [limit, ambito]);

    /**
     * Siguiente página, añadida a lo que ya hay.
     *
     * Se protege con `cargandoMas` porque el botón puede pulsarse dos veces
     * antes de que llegue la respuesta, y eso pediría el mismo tramo dos veces y
     * lo pintaría duplicado.
     */
    const cargarMas = useCallback(() => {
        if (cargandoMas || !hayMas || !isApiConfigured) return;

        setCargandoMas(true);

        fetchFeed({ limit, offset: offset.current, ambito })
            .then((result) => {
                if (!result.ok || !result.stories.length) {
                    setHayMas(false);
                    return;
                }

                offset.current += result.stories.length;
                setHayMas(result.stories.length >= limit);
                setState((previo) => ({
                    ...previo,
                    stories: [...previo.stories, ...normalizeStories(result.stories)],
                }));
            })
            .finally(() => setCargandoMas(false));
    }, [ambito, cargandoMas, hayMas, limit]);

    return { ...state, cargarMas, hayMas, cargandoMas };
}
