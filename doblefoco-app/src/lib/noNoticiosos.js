// @ts-check
import { MEDIA_REGISTRY } from '../../shared/mediaRegistry.js';

/**
 * LOS MEDIOS NO NOTICIOSOS, PARA EL PANEL DEL INICIO (M1.8).
 *
 * El tipo lo decidió Jose el 2026-09-16: su producto es la investigación o el
 * análisis, no el ciclo diario, así que salen del mapa mediático y siguen en la
 * ingesta. Quedó escrito que tendrían «acceso propio en un panel del inicio», y
 * el 2026-09-28 decidió que el panel entra en el MVP con el estilo actual.
 *
 * La lista sale del registro, no se escribe aquí: si mañana entra o sale un
 * medio del tipo, el panel cambia solo. `shared/noNoticioso.test.js` vigila
 * quién lo lleva.
 *
 * Lo que NO lleva el panel, a propósito: la orientación de cada medio. Tres de
 * los seis están «sin medir», y ponerle un número a los otros tres al lado
 * sería colocarlos en un eje del que se sacaron justo por no competir en él.
 */

/** Los seis, por nombre. */
export const NO_NOTICIOSOS = MEDIA_REGISTRY.filter((medio) => medio.noNoticioso)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

/**
 * Cada medio con la primera historia cargada en la que aparece, o null.
 *
 * «Primera» en el orden del feed, que es el de la portada: la que el lector
 * tiene más a mano, no la más reciente. Se compara por el id del catálogo, que
 * `normalizeStory` pone en cada fuente reconocida.
 *
 * @param {Array<{ id: string, title: string, sources?: Array<{ id?: string }> }>} historias
 * @param {typeof NO_NOTICIOSOS} [medios]
 */
export function noNoticiososConHistoria(historias, medios = NO_NOTICIOSOS) {
    return medios.map((medio) => ({
        medio,
        historia:
            (historias ?? []).find((h) => (h.sources ?? []).some((s) => s?.id === medio.id)) ?? null,
    }));
}
