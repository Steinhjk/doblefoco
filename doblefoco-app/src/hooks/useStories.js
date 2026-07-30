import { useEffect, useState } from 'react';
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
 * Y el aviso de "datos de demostración" solo existía en el feed principal. La
 * página de detalle —donde la cita fabricada se muestra a pantalla completa con
 * el nombre del medio al lado— no advertía nada. Tampoco el buscador, ni
 * categorías, ni tendencias, ni el sidebar.
 *
 * QUÉ HACE AHORA
 * --------------
 * O hay datos reales de la API, o no hay nada y se dice. No existe tercer
 * estado. Es más pobre de ver y es lo único honesto: un sitio cuyo principio es
 * "nunca se publica lo que no se puede verificar contra su fuente" no puede
 * rellenar su propio escaparate con citas que nadie escribió.
 *
 * `counts` SON DEL CATÁLOGO, `stories` ES UNA PÁGINA. La distinción importa
 * porque confundirlas ya produjo un error en la portada: contaba `stories.length`
 * y escribía el resultado como si fuera el total, de modo que el techo de la
 * petición se leía como el tamaño del catálogo. Quien pinte una cifra tiene que
 * tomarla de `counts`; `stories.length` solo dice cuántas se descargaron.
 *
 * @returns {{stories: Array, counts: {total: number, multifuente: number, nacional: number, internacional: number}, status: 'cargando'|'listo'|'sin-datos', reason: string|null}}
 */
const SIN_CONTEO = { total: 0, multifuente: 0, nacional: 0, internacional: 0 };

export function useStories({ limit = 100 } = {}) {
    const [state, setState] = useState(() => ({
        stories: [],
        counts: SIN_CONTEO,
        status: isApiConfigured ? 'cargando' : 'sin-datos',
        reason: isApiConfigured ? null : 'Este despliegue no tiene la API configurada.',
    }));

    useEffect(() => {
        if (!isApiConfigured) return undefined;

        let active = true;

        fetchFeed({ limit }).then((result) => {
            if (!active) return;

            if (result.ok && result.stories.length) {
                setState({
                    stories: normalizeStories(result.stories),
                    counts: result.counts ?? SIN_CONTEO,
                    status: 'listo',
                    reason: null,
                });
                return;
            }

            setState({
                stories: [],
                counts: SIN_CONTEO,
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
            active = false;
        };
    }, [limit]);

    return state;
}
