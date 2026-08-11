// @ts-check

/**
 * RELEVANCIA — en qué orden se presentan las historias.
 *
 * QUÉ ARREGLA (2026-08-10, terremoto del Chocó)
 * ---------------------------------------------
 * El orden era `medios DESC, published_at DESC`, sin envejecimiento. Una
 * historia bien cubierta se quedaba arriba indefinidamente: el día del terremoto
 * de magnitud 7,4, el «radar» de la portada mostraba la muerte de Jorge Messi y
 * un ataque con drones en Cesar, ambos del 8 de agosto, dos días antes.
 *
 * No era un fallo del recuento. Era que la fecha solo desempataba: entre dos
 * historias de 8 medios ganaba la más nueva, pero una de 8 medios de anteayer
 * seguía por delante de una de 7 de hace una hora.
 *
 * LA FÓRMULA
 * ----------
 *     puntuación = medios × 0,5 ^ (antigüedad_en_horas / VIDA_MEDIA_HORAS)
 *
 * Se conserva `medios` como factor principal —es la métrica del sitio, «cuántos
 * medios distintos cubren este hecho»— y se le aplica una vida media. Es
 * multiplicativa y no aditiva a propósito: sumar un bono de novedad haría que
 * una historia de un solo medio recién publicada compitiera con una de ocho, y
 * eso contradiría lo que el sitio afirma medir.
 *
 * LA CALIBRACIÓN, MEDIDA
 * ----------------------
 * Sobre las 100 historias servidas por la API el 2026-08-10 a las 19:40, con el
 * terremoto del Chocó en curso (22 medios, 104 artículos, repartidos en 20
 * historias distintas). Se cuenta cuántas del top 10 eran del terremoto y
 * cuántas tenían más de 36 h:
 *
 *   sin decaimiento →  3 del terremoto  ·  3 de más de 36 h
 *   vida media 48 h →  5 del terremoto  ·  0 de más de 36 h
 *   vida media 24 h →  6 del terremoto  ·  0 de más de 36 h
 *   vida media 12 h →  7 del terremoto  ·  0 de más de 36 h
 *   vida media  6 h →  8 del terremoto  ·  0 de más de 36 h
 *
 * Cualquier vida media barre lo rancio: el salto está entre «sin decaimiento» y
 * el resto, no entre los valores. Lo que separa a unos de otros es el
 * monocultivo: a 6 h la portada entera es un solo hecho contado ocho veces, que
 * es el defecto contrario y no menos grave.
 *
 * 24 h es el valor elegido, y no por quedar en medio: un día es la unidad en que
 * se piensa una noticia, y «una historia pierde la mitad de su peso al día» se
 * le puede explicar a un lector sin enseñarle la fórmula. Un parámetro de orden
 * que no se puede explicar es un parámetro que nadie va a auditar.
 *
 * LO QUE ESTO NO ARREGLA
 * ----------------------
 * En las siete configuraciones medidas, incluida la elegida, la primera historia
 * seguía siendo «Terremoto en Chocó: murió el hijo del alcalde de Bahía Solano»
 * — el ángulo más anecdótico de un desastre con 111 muertos. El decaimiento
 * ordena mejor las piezas, pero no puede recomponer un hecho que el agrupamiento
 * partió en veinte. Eso es trabajo de la capa de suceso.
 */

/** Vida media del interés de una historia, en horas. Ver la calibración arriba. */
export const VIDA_MEDIA_HORAS = 24;

const MS_POR_HORA = 3_600_000;

/**
 * Cuánto pesa todavía algo publicado en `publishedAt`, entre 0 y 1.
 *
 * Sin fecha devuelve 1 y no 0. Una historia sin fecha es un fallo del feed de
 * origen, no una historia vieja, y hundirla la castigaría por un defecto del
 * medio que la publicó. Se la trata como nueva y el recuento de medios decide.
 *
 * Una fecha en el futuro también da 1, sin premio. Los feeds las traen —husos
 * horarios mal declarados, embargos— y un exponente negativo convertiría el
 * error de un medio en un empujón hacia la portada.
 *
 * @param {string|number|Date|null|undefined} publishedAt
 * @param {number} [ahora] Marca de tiempo en ms. Inyectable para las pruebas.
 * @returns {number}
 */
export function factorDeAntiguedad(publishedAt, ahora = Date.now()) {
    if (publishedAt == null) return 1;

    const marca = publishedAt instanceof Date ? publishedAt.getTime() : Date.parse(String(publishedAt));
    if (!Number.isFinite(marca)) return 1;

    const horas = (ahora - marca) / MS_POR_HORA;
    if (horas <= 0) return 1;

    return Math.pow(0.5, horas / VIDA_MEDIA_HORAS);
}

/**
 * Puntuación de relevancia de una historia.
 *
 * @param {{medios?: number, publishedAt?: string|number|Date|null}} historia
 * @param {number} [ahora]
 * @returns {number}
 */
export function puntuacionDeRelevancia({ medios = 0, publishedAt = null } = {}, ahora = Date.now()) {
    const cuantos = Number.isFinite(medios) && medios > 0 ? medios : 0;
    if (!cuantos) return 0;

    return cuantos * factorDeAntiguedad(publishedAt, ahora);
}

/**
 * Cuántos medios distintos cubren una historia, sea cual sea la forma en que
 * llegue.
 *
 * El motor en memoria la trae como `sources` (lista), la base como `medios`
 * (entero ya agregado) y el cliente normalizado como `coverage.total`. Las tres
 * cuentan lo mismo, y tener un solo sitio donde se resuelve evita que el orden
 * dependa de por qué camino entró la historia.
 *
 * @param {any} historia
 * @returns {number}
 */
export function mediosDeHistoria(historia) {
    if (!historia) return 0;
    if (Array.isArray(historia.sources)) return historia.sources.length;
    if (Number.isFinite(historia.medios)) return historia.medios;
    if (Number.isFinite(historia.coverage?.total)) return historia.coverage.total;
    return 0;
}

/**
 * Comparador para `Array.prototype.sort`: más relevante primero.
 *
 * Desempata por polarización de la cobertura cuando la hay. Entre dos historias
 * igual de cubiertas e igual de recientes, la que reparte su cobertura entre
 * espectros opuestos es la que este sitio existe para enseñar.
 *
 * @param {number} [ahora]
 */
export function porRelevancia(ahora = Date.now()) {
    return (a, b) => {
        const pa = puntuacionDeRelevancia({ medios: mediosDeHistoria(a), publishedAt: a?.publishedAt }, ahora);
        const pb = puntuacionDeRelevancia({ medios: mediosDeHistoria(b), publishedAt: b?.publishedAt }, ahora);
        if (pb !== pa) return pb - pa;

        const ca = a?.coverage?.polarization ?? a?.polarization ?? 0;
        const cb = b?.coverage?.polarization ?? b?.polarization ?? 0;
        return cb - ca;
    };
}

/**
 * La MISMA fórmula en SQL, para que la base pueda ordenar y paginar.
 *
 * Tiene que estar en el `ORDER BY` y no aplicarse en memoria después de leer:
 * con `LIMIT`/`OFFSET`, reordenar la página ya recortada solo baraja veinte
 * historias que la base eligió con otro criterio, y la número 21 no aparecería
 * nunca. Es el mismo motivo por el que las rechazadas por moderación se filtran
 * en SQL.
 *
 * `EXTRACT(EPOCH FROM ...)` da segundos; de ahí el 3600. `GREATEST(..., 0)`
 * replica el trato de las fechas futuras: pesan como nuevas, no más.
 *
 * @param {string} expresionMedios  Expresión SQL que cuenta medios distintos.
 * @param {string} expresionFecha   Expresión SQL con la fecha de publicación.
 */
export function ordenPorRelevanciaSQL(expresionMedios, expresionFecha) {
    return `${expresionMedios} * power(
        0.5,
        GREATEST(EXTRACT(EPOCH FROM (now() - ${expresionFecha})), 0) / 3600.0 / ${VIDA_MEDIA_HORAS}
    )`;
}
