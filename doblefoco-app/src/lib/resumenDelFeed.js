// @ts-check

/**
 * QUÉ CIFRA VA EN LA CABECERA DE LA PORTADA.
 *
 * POR QUÉ ESTO EXISTE COMO FUNCIÓN APARTE. La portada pedía 100 historias y
 * escribía «100 historias con cobertura multifuente», con las pestañas Colombia
 * e Internacional repartiendo ese mismo 100. Las tres cifras salían de `length`
 * sobre lo descargado, así que el TECHO DE LA PETICIÓN se leía como el tamaño
 * del catálogo: un lector concluía que el sitio sigue cien hechos cuando sigue
 * 301 multifuente de 3 671.
 *
 * Y no era una cifra falsa —el feed ordena por número de medios, así que esas
 * 100 sí eran multifuente—, lo cual es peor: una ventana presentada como el
 * total no se delata nunca, porque cada número por separado es correcto.
 *
 * Vive en su propio módulo porque es la decisión que estuvo mal, y una decisión
 * que estuvo mal merece una prueba en vez de cuidado.
 *
 * @param {{total: number, multifuente: number}} counts  cifras del CATÁLOGO
 * @param {number} descargadas  cuántas historias trajo esta página
 */
export function resumenDelFeed(counts, descargadas) {
    // Una API antigua no manda `counts`. En ese caso no se inventa un total: se
    // dice solo lo que se sabe, que es cuántas se descargaron.
    const hayConteoReal = (counts?.multifuente ?? 0) > 0;

    const multifuente = hayConteoReal ? counts.multifuente : descargadas;

    return {
        hayConteoReal,
        multifuente,
        /** El catálogo completo, o null si no procede mencionarlo. */
        seguidas: hayConteoReal && counts.total > counts.multifuente ? counts.total : null,
        /**
         * Cuántas se están mostrando, o null si se muestran todas: decir «se
         * muestran las 12 de 12» es ruido, y en cuanto es ruido se deja de leer.
         */
        mostradas: descargadas < multifuente ? descargadas : null,
    };
}
