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
