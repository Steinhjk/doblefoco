// @ts-check

/**
 * QUIÉN LE PONE NOMBRE A UN SUCESO.
 *
 * EL PROBLEMA (2026-08-10, observado por Jose)
 * ---------------------------------------------
 * Un suceso se titula con una de sus piezas, y hasta aquí la elegía la más
 * cubierta. Eso funciona casi siempre y falla justo donde más se nota: un hecho
 * grande arrastra piezas de acompañamiento —la galería de fotos, el explicativo,
 * el directo, el detalle humano— y alguna de ellas puede estar muy cubierta.
 *
 * El caso que lo destapó: el accidente de helicóptero en el que murieron tres
 * turistas colombianas se titulaba **«Las últimas fotos de las turistas
 * colombianas antes del accidente»**. Cinco medios la cubrían, más que ninguna
 * otra pieza del suceso en ese momento. El hecho —que murieron tres personas—
 * quedaba debajo.
 *
 * EL CRITERIO, Y DÓNDE ESTÁ SU LÍMITE
 * ------------------------------------
 * Se mira el FORMATO del titular, nunca su tema ni su importancia. Es el mismo
 * criterio de `contentQuality.js` y por la misma razón: cualquier otra cosa es
 * decidir de qué se puede hablar, y eso no lo hace un agregador.
 *
 * La diferencia con aquel filtro es que aquí NO SE DESCARTA NADA. La galería de
 * fotos sigue en el suceso, con su recuento de medios y su enlace; lo único que
 * no puede hacer es dar nombre al conjunto. Un formato de acompañamiento es una
 * pieza legítima —a veces la más leída— pero describe una arista del hecho, no
 * el hecho.
 *
 * Y si TODAS las piezas de un suceso son de acompañamiento, se titula igual con
 * la más relevante. No hay ningún caso en que esto deje un suceso sin nombre:
 * preferir un titular imperfecto a no tener titular es la misma decisión que
 * toma `resumirSuceso` al caer al recuento del líder.
 *
 * POR QUÉ NO EL MEDOIDE
 * ---------------------
 * La alternativa evidente era elegir la pieza más central al suceso —la de mayor
 * similitud media con las demás—. Se midió sobre los seis sucesos de tres o más
 * ángulos del 2026-08-10: cambiaba el titular en los seis, acertaba en dos y
 * empeoraba en tres. Metía «En directo: Netanyahu rechaza el plan…» como titular
 * de la historia de Gaza, y en el terremoto cambiaba un titular que traía la
 * cifra de muertos y el departamento por uno genérico. La centralidad mide
 * parecido, no vocación de titular.
 */

import { porRelevancia } from './relevancia.js';

/** Quita tildes y baja a minúsculas, igual que hace `contentQuality.js`. */
function normalizar(texto) {
    return String(texto ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();
}

/**
 * Formatos de acompañamiento. Cada uno lleva su motivo, y ese motivo se puede
 * consultar: una pieza que no llegó a titular siempre puede explicarse.
 *
 * Salvo la pregunta, todos se anclan al ARRANQUE del titular. Es deliberado:
 * «Tres colombianas mueren en accidente de helicóptero: esto se sabe de la
 * tragedia» es un buen titular con una coletilla detrás, y buscar «esto se sabe»
 * en cualquier posición lo habría descartado — precisamente el titular correcto
 * de aquel suceso.
 *
 * La pregunta es la excepción porque en la prensa en español el patrón habitual
 * es «Tema: ¿pregunta?», con el tema limpio delante. «Terremoto en Colombia:
 * ¿Se pueden predecir las réplicas?» se escapaba de una regla anclada al
 * principio, y es un explicativo, no la noticia.
 */
export const FORMATOS_DE_ACOMPANAMIENTO = [
    {
        id: 'pregunta',
        motivo: 'explicativo en forma de pregunta',
        // En cualquier posición. Ver la nota de arriba.
        patrones: [/[¿]/, /\?\s*$/],
    },
    {
        id: 'directo',
        motivo: 'cobertura en directo, sin hecho cerrado',
        patrones: [/^(en directo|en vivo|minuto a minuto|ultima hora|ultimas noticias)\b/],
    },
    {
        id: 'formato',
        motivo: 'pieza de material audiovisual',
        patrones: [/^(video|videos|foto|fotos|imagen|imagenes|en imagenes|galeria|audio|podcast|mapa|mapas|grafico|graficos|infografia)\s*[|:—-]/],
    },
    {
        id: 'instructivo',
        motivo: 'pieza de servicio o de instrucciones',
        patrones: [/^asi\s+(puede|podra|se|quedo|quedaron|fue|luce|lucia|avanza|va|van|funciona)\b/],
    },
    {
        id: 'material',
        motivo: 'recopilación de material, no el hecho',
        patrones: [/^(las|los)\s+(ultimas?|ultimos?|primeras?|primeros?|mejores)\s+(fotos?|imagenes|videos?|palabras|momentos|reacciones)\b/],
    },
    {
        id: 'cita',
        motivo: 'titular construido sobre una cita',
        patrones: [/^["“”'']/],
    },
    {
        id: 'perfil',
        motivo: 'perfil de un protagonista, no el hecho',
        patrones: [/^(quien|quienes)\s+(es|era|son|eran|fue|fueron)\b/],
    },
];

/**
 * ¿Es este titular una pieza de acompañamiento? Devuelve el id de la regla que
 * lo marca, o `null`.
 *
 * @param {string} titulo
 * @returns {string|null}
 */
export function formatoDeAcompanamiento(titulo) {
    if (!titulo || typeof titulo !== 'string') return null;

    // La pregunta se busca sobre el original: «¿» desaparecería si alguien
    // cambiara la normalización, y es la señal más fiable de las siete.
    const normalizado = normalizar(titulo);

    for (const regla of FORMATOS_DE_ACOMPANAMIENTO) {
        for (const patron of regla.patrones) {
            if (patron.test(titulo) || patron.test(normalizado)) return regla.id;
        }
    }

    return null;
}

/**
 * La pieza que representa al suceso: la que le pone titular, foto y enlace.
 *
 * Entre las que no son de acompañamiento, la más relevante — el mismo criterio
 * que ordena todo lo demás, para que la portada no tenga un orden propio que
 * nadie pueda explicar. Si todas son de acompañamiento, la más relevante de
 * todas: un titular imperfecto es mejor que ninguno.
 *
 * @param {Array<any>} historias
 * @param {number} [ahora]
 * @returns {any}
 */
export function elegirRepresentante(historias, ahora = Date.now()) {
    const lista = (Array.isArray(historias) ? historias : []).filter((h) => h?.title);
    if (!lista.length) return null;

    const limpias = lista.filter((h) => !formatoDeAcompanamiento(h.title));
    const candidatas = limpias.length ? limpias : lista;

    return [...candidatas].sort(porRelevancia(ahora))[0];
}
