// @ts-check
/**
 * La huella del registro de medios: el contrato que cliente y motor tienen que
 * compartir, reducido a una cadena corta comparable.
 *
 * POR QUÉ EXISTE. El desfase entre lo desplegado en Vercel y lo desplegado en
 * Fly ya mordió dos veces, y las dos veces el síntoma fue el mismo: los dos
 * lados llevaban COMPILADO un `mediaRegistry` distinto —37 feeds contra 39, y
 * tres secciones contando en cero—. Comparar commits no distingue ese caso del
 * inocuo (un commit de prosa que nunca llega a la imagen); comparar la huella
 * del registro señala exactamente el desfase que el lector puede sufrir, y solo
 * ese. El commit queda como diagnóstico, no como veredicto.
 *
 * QUIÉN LA USA. El motor la publica en `/api/health` (`version.registroHash`,
 * calculada al arrancar) y el cliente lleva la suya incrustada en el bundle
 * (`__REGISTRO_HASH_ESPERADO__`, calculada por `vite.config.js` al construir).
 * `AvisoDesfase` compara las dos en el navegador.
 *
 * SOLO CORRE EN NODE. Usa `node:crypto` a propósito: sus dos consumidores son
 * el servidor y el build de Vite. El navegador nunca importa este módulo — le
 * llega el resultado, no la función.
 */

import { createHash } from 'node:crypto';

/**
 * Huella corta y determinista de un valor JSON-serializable.
 *
 * `JSON.stringify` a secas, sin canonicalizar claves: los dos lados hashean el
 * MISMO módulo con el mismo orden de escritura, así que el orden es estable
 * por construcción. Si algún día una reordenación cosmética cambiara la
 * huella, el efecto es un desfase transitorio durante ese despliegue — el
 * mismo que produce cualquier otro commit del registro, y igual de inofensivo.
 *
 * @param {unknown} registro
 * @returns {string} 12 caracteres hexadecimales.
 */
export function hashDelRegistro(registro) {
    return createHash('sha256')
        .update(JSON.stringify(registro))
        .digest('hex')
        .slice(0, 12);
}
