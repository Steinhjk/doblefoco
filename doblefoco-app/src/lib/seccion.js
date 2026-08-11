// @ts-check

/**
 * ¿Esta historia entra en esta sección?
 *
 * UN SOLO SITIO DECIDE LA PERTENENCIA. La regla estaba escrita dos veces en la
 * pantalla de secciones —una para contar la baldosa y otra para llenar la lista
 * de abajo— y son la clase de pareja que se desincroniza en el primer cambio:
 * la baldosa promete un número y la lista da otro.
 *
 * Vive en `lib/` y no dentro de la página por dos motivos: es lógica sin
 * interfaz, y así puede probarse sin arrastrar el componente, sus estilos y el
 * cliente de la API detrás.
 *
 * LOS DOS CAMINOS, Y POR QUÉ HAY DOS
 * ----------------------------------
 * El bueno es `topics` / `ambito`, los dos ejes que el clasificador escribe en
 * la base.
 *
 * El de respaldo compara contra `category`, la sección heredada del feed por el
 * que entró el artículo. Existe porque el cliente se despliega en Vercel y la
 * API en Fly, por separado y en momentos distintos: mientras la API vigente no
 * mande los campos nuevos, esta pantalla tiene que seguir diciendo algo cierto
 * en lugar de catorce ceros. En cuanto los mande, el camino bueno se activa
 * solo, sin tocar este archivo ni volver a desplegar el cliente.
 *
 * El respaldo es PEOR y conviene tener escrito en qué. Compara por nombre
 * exacto, que es justo lo que dejó la baldosa de Justicia en cero teniendo cinco
 * historias dentro —los feeds la llamaban `Judicial`—, y no puede acertar nunca
 * en las secciones que ningún feed nombra: Conflicto y paz, Derechos y
 * sociedad, Cultura y medios. Es un respaldo, no un equivalente.
 *
 * @param {{category: string, topics: string[]|null, ambito: string|null}} story
 * @param {{id: string, name: string, tipo: 'todo'|'tema'|'ambito'}} categoria
 * @returns {boolean}
 */
export function perteneceA(story, categoria) {
    if (categoria.tipo === 'todo') return true;

    if (categoria.tipo === 'ambito') {
        return story.ambito !== null
            ? story.ambito === categoria.id
            : story.category === categoria.name;
    }

    return story.topics !== null
        ? story.topics.includes(categoria.id)
        : story.category === categoria.name;
}

/**
 * El nombre de sección que se le enseña al lector en una tarjeta.
 *
 * POR QUÉ NO SIRVE `category` A SECAS (2026-08-10). Es la sección heredada del
 * feed, y `recategorizar.mjs` la conserva intacta a propósito: guarda lo que el
 * sitio mostró antes de cada migración, para poder auditar qué decía y cuándo.
 * Es un registro de archivo, no un campo de presentación.
 *
 * Pintarla en la tarjeta hacía que la etiqueta contradijera a la sección. El día
 * del terremoto del Chocó el destacado salía marcado «Política» —porque así
 * llegó del feed— mientras la historia vivía, correctamente, en Desastres y
 * accidentes. Dos respuestas distintas a la misma pregunta en la misma pantalla.
 *
 * Se usa el MISMO orden de preferencia que `perteneceA`, y por el mismo motivo:
 * `topics` cuando la API los manda, `category` mientras no. Así la etiqueta y la
 * pertenencia no pueden divergir.
 *
 * @param {{category?: string, topics?: string[]|null}} story
 * @param {Array<{id: string, name: string, tipo: string}>} categorias
 * @returns {string} Cadena vacía si no hay nada honesto que decir.
 */
export function nombreDeSeccion(story, categorias) {
    const temas = story?.topics;

    if (Array.isArray(temas) && temas.length) {
        // El primero es el de mayor puntaje: el clasificador los devuelve
        // ordenados y la base conserva ese orden.
        const principal = categorias.find((c) => c.tipo === 'tema' && c.id === temas[0]);
        if (principal) return principal.name;
    }

    return story?.category ?? '';
}
