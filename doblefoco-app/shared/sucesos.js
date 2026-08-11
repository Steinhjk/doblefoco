// @ts-check

/**
 * SUCESOS — la capa que hay por encima de la historia.
 *
 * QUÉ PROBLEMA RESUELVE (2026-08-10, terremoto del Chocó)
 * -------------------------------------------------------
 * El orden del feed cuenta medios distintos DENTRO de cada historia. Eso premia
 * al hecho que se cuenta de una sola manera y castiga al que se cuenta de
 * muchas, que suele ser el importante.
 *
 * Medido el día del terremoto de magnitud 7,4: era el hecho más cubierto del
 * corpus con diferencia —22 medios distintos y 104 artículos— y estaba repartido
 * en 20 historias de entre 3 y 7 medios. Ninguna pieza reflejaba la magnitud. El
 * nombramiento del director de la DIAN, que solo admite una forma de contarse,
 * se llevaba 8 medios limpios y ganaba.
 *
 * La consecuencia es peor que un mal orden: **cuanto más importante es un hecho,
 * más ángulos genera, más se fragmenta y menos pesa cada trozo.** El sitio se
 * apoya en «cuántos medios distintos cubren este hecho» y estaba subreportando
 * su propia métrica justo donde más importaba.
 *
 * POR QUÉ NO SE BAJA EL UMBRAL DE AGRUPAMIENTO
 * ---------------------------------------------
 * Sería lo obvio y sería un error. `clustering.js` documenta con medición por
 * qué su umbral está en 0,34: por debajo de 0,30 aparecen fusiones incorrectas,
 * y fusionar dos hechos en una historia inventa una cobertura que no existe.
 * Esa decisión sigue siendo correcta.
 *
 * Un suceso NO fusiona. Cada historia conserva su recuento honesto de medios y
 * su titular. El suceso es una agrupación **para ordenar y presentar**, y por
 * eso puede permitirse un umbral más laxo: son afirmaciones distintas. Decir
 * «estas veinte piezas hablan del terremoto» no es decir «estas veinte piezas
 * son el mismo hecho», y solo la segunda inventaría cobertura.
 *
 * AGRUPAMIENTO POR LÍDER, NO POR ENCADENAMIENTO
 * ----------------------------------------------
 * Un umbral laxo con enlace simple encadena: A se parece a B, B se parece a C, y
 * C acaba en el mismo grupo que A sin parecerse a A en nada. Con un umbral
 * estricto el riesgo es tolerable; con uno laxo es la falla dominante.
 *
 * Aquí cada historia se compara **solo contra la historia que encabeza el
 * suceso**, nunca contra el vocabulario acumulado del grupo. No hay cadenas
 * posibles, el resultado no depende del orden de llegada más allá de quién sea
 * el líder, y una agrupación equivocada se audita mirando dos titulares. Es
 * también lo que evita el defecto que `mergeSimilarClusters` tuvo que corregir
 * en la capa de abajo: el vocabulario del grupo no crece, así que la similitud
 * no se diluye a medida que el suceso engorda.
 *
 * LA VENTANA
 * ----------
 * Un suceso está acotado en el tiempo. Sin ventana, «Terremoto en Chocó» se
 * llevaría por delante cualquier noticia sobre un terremoto de hace tres meses.
 */

import { buildIdf, cosineSimilarity, tokenize } from './clustering.js';
import { mediosDeHistoria, porRelevancia, puntuacionDeRelevancia } from './relevancia.js';

/**
 * Umbral de similitud coseno para que una historia entre en un suceso.
 *
 * CALIBRADO, NO ELEGIDO. Reproducible con `npm run eval:sucesos`.
 *
 * Más laxo que el 0,34 de `clustering.js` porque agrupa para presentar y no para
 * fusionar. Medido sobre las 100 historias servidas el 2026-08-10 con el
 * terremoto del Chocó en curso, revisando a ojo las agrupaciones resultantes:
 *
 *   0,14 → 21 grupos, aparecen fusiones por coincidencia de estructura
 *   0,18 → 21 grupos
 *   0,22 → 17 grupos, ninguna fusión falsa clara
 *   0,26 → 17 grupos
 *   0,30 → 12 grupos, empieza a partir sucesos legítimos
 *
 * 0,22 es donde desaparece la última fusión falsa sin haber empezado a perder
 * agrupaciones buenas.
 */
export const UMBRAL_SUCESO = 0.22;

/**
 * Mínimo de tokens compartidos con el líder.
 *
 * Tres y no dos, que es lo que pide la capa de abajo. Con el coseno ponderado
 * por IDF, dos nombres propios raros compartidos disparan la puntuación, y dos
 * titulares que solo coinciden en «De la Espriella» y «Chocó» pueden ser dos
 * hechos distintos del mismo día. Exigir un tercero obliga a que el solape sea
 * de contenido y no de protagonista.
 */
export const MIN_TOKENS_SUCESO = 3;

/**
 * EL VOCABULARIO IMPORTA MÁS QUE EL UMBRAL. Es el hallazgo de la calibración y
 * conviene no perderlo: con el IDF calculado sobre las 100 historias de una
 * página, seis de diecinueve agrupaciones eran falsas —el 32 %—. Con el IDF
 * sobre los 4 684 titulares del corpus completo, y sin tocar el umbral,
 * desaparecen las seis.
 *
 * La razón es que en un corpus de cien un token que sale dos veces parece
 * rarísimo, y esas dos veces suelen ser exactamente las dos historias que se
 * fusionan mal. «soberania» aparecía dos veces en cien y unió «Colombia
 * reconoce la soberanía de Marruecos sobre el Sáhara» con «reconoce soberanía
 * de Israel sobre el Golán» — dos reconocimientos distintos presentados como un
 * suceso.
 *
 * Ejemplos que quedaron correctamente separados al ampliar el vocabulario:
 * el ataque en El Zulia y el ataque con drones en Cesar; el nombramiento en la
 * DIAN y el primer Consejo de Seguridad; las medidas por el terremoto y la
 * eliminación del impuesto al patrimonio.
 */

/** Cuánto puede durar un suceso, en horas. */
export const VENTANA_SUCESO_HORAS = 72;

const MS_POR_HORA = 3_600_000;

/** Marca de tiempo de una historia, en ms. `null` si no la trae. */
function marcaDe(historia) {
    const valor = historia?.publishedAt ?? historia?.firstSeenAt ?? null;
    if (valor == null) return null;
    const ms = valor instanceof Date ? valor.getTime() : Date.parse(String(valor));
    return Number.isFinite(ms) ? ms : null;
}

/** Nombres de los medios que cubren una historia, venga por el camino que venga. */
function nombresDeMedios(historia) {
    const fuentes = Array.isArray(historia?.sources) ? historia.sources : [];
    return fuentes
        .map((f) => (typeof f === 'string' ? f : f?.name))
        .filter((n) => typeof n === 'string' && n.length > 0);
}

/**
 * ¿Caben estas dos historias en el mismo suceso?
 *
 * Se expone aparte de `agruparEnSucesos` para poder auditar una pareja concreta
 * sin reconstruir el corpus: al revisar una agrupación dudosa, lo que se quiere
 * saber es qué puntuó y con qué tokens.
 *
 * `tokensA` y `tokensB` se aceptan ya calculados porque el agrupamiento compara
 * cada historia contra cada líder: tokenizar dentro de la comparación convierte
 * el trabajo en O(n²) tokenizaciones y con unos miles de historias deja de
 * terminar. Se midió con el barrido de `eval:sucesos`, que no acababa.
 *
 * @param {any} historia
 * @param {any} lider
 * @param {Map<string, number>} idf
 * @param {{
 *   umbral?: number, ventanaHoras?: number, minTokens?: number,
 *   tokensA?: Set<string>, tokensB?: Set<string>
 * }} [opciones]
 */
export function mismoSuceso(historia, lider, idf, opciones = {}) {
    const {
        umbral = UMBRAL_SUCESO,
        ventanaHoras = VENTANA_SUCESO_HORAS,
        minTokens = MIN_TOKENS_SUCESO,
    } = opciones;

    const marcaA = marcaDe(historia);
    const marcaB = marcaDe(lider);

    // Sin fecha en alguno de los dos no se puede acotar la ventana. Se compara
    // igual: negarlo dejaría fuera del suceso a una historia real por un fallo
    // del feed que la trajo, y ese castigo ya se decidió no aplicarlo en
    // `relevancia.js`.
    if (marcaA != null && marcaB != null) {
        if (Math.abs(marcaA - marcaB) > ventanaHoras * MS_POR_HORA) {
            return { entra: false, score: 0, shared: 0 };
        }
    }

    const { score, shared } = cosineSimilarity(
        opciones.tokensA ?? tokenize(historia?.title ?? ''),
        opciones.tokensB ?? tokenize(lider?.title ?? ''),
        idf
    );

    return { entra: shared >= minTokens && score >= umbral, score, shared };
}

/**
 * Agrupa historias en sucesos.
 *
 * El IDF se calcula sobre las historias recibidas y no se guarda: describe el
 * vocabulario vivo del corpus. Un peso fijo envejecería en silencio y en unos
 * meses «terremoto» seguiría pareciendo raro cuando ya no lo fuera. Es la misma
 * razón por la que `calcularTasasBase` se rehace en cada ciclo.
 *
 * @param {Array<any>} historias
 * @param {{
 *   ahora?: number,
 *   umbral?: number,
 *   ventanaHoras?: number,
 *   minTokens?: number,
 *   vocabulario?: Array<string>
 * }} [opciones] `vocabulario` son los titulares con los que calcular el IDF.
 *   Pásalo siempre que se conozcan más historias de las que se van a agrupar:
 *   es lo que más reduce las fusiones falsas.
 * @returns {Array<{
 *   id: string,
 *   titular: string,
 *   lider: any,
 *   historias: Array<any>,
 *   medios: number,
 *   articulos: number,
 *   angulos: number,
 *   publishedAt: string|null,
 *   puntuacion: number
 * }>}
 */
export function agruparEnSucesos(historias, opciones = {}) {
    const {
        ahora = Date.now(),
        umbral = UMBRAL_SUCESO,
        ventanaHoras = VENTANA_SUCESO_HORAS,
        minTokens = MIN_TOKENS_SUCESO,
    } = opciones;

    const lista = (Array.isArray(historias) ? historias : []).filter((h) => h?.id && h?.title);
    if (!lista.length) return [];

    /*
     * EL IDF SE CALCULA SOBRE EL CORPUS MÁS GRANDE QUE HAYA, y por eso se puede
     * pasar aparte. Medido: con el IDF de las 100 historias de una página, un
     * token que aparece dos veces parece rarísimo, y esas dos veces suelen ser
     * justo las dos historias que se fusionan mal. Así se juntaron «Colombia
     * reconoce la soberanía de Marruecos sobre el Sáhara» y «reconoce soberanía
     * de Israel sobre el Golán»: «soberania» salía dos veces en cien.
     *
     * `vocabulario` son los titulares de todo lo que se conozca, no solo de lo
     * que se va a agrupar.
     */
    const corpus = Array.isArray(opciones.vocabulario) && opciones.vocabulario.length
        ? opciones.vocabulario
        : lista.map((h) => h.title);

    const idf = buildIdf(corpus.map((titulo) => tokenize(titulo)));

    // Se recorre por relevancia para que el líder de cada suceso sea su historia
    // más relevante y no la primera que llegó. El líder da el titular y es
    // contra quien se compara todo lo demás, así que quién lo sea importa.
    const ordenadas = [...lista].sort(porRelevancia(ahora));

    // Una tokenización por historia y no una por comparación. Ver la nota de
    // `mismoSuceso`: hacerlo dentro del bucle es O(n²) y no termina.
    const tokensPorId = new Map(ordenadas.map((h) => [h.id, tokenize(h.title)]));

    /** @type {Array<{lider: any, historias: Array<any>}>} */
    const grupos = [];

    for (const historia of ordenadas) {
        let destino = null;
        let mejor = 0;
        const tokensA = tokensPorId.get(historia.id);

        for (const grupo of grupos) {
            const { entra, score } = mismoSuceso(historia, grupo.lider, idf, {
                umbral,
                ventanaHoras,
                minTokens,
                tokensA,
                tokensB: tokensPorId.get(grupo.lider.id),
            });
            if (entra && score > mejor) {
                destino = grupo;
                mejor = score;
            }
        }

        if (destino) destino.historias.push(historia);
        else grupos.push({ lider: historia, historias: [historia] });
    }

    return grupos.map((grupo) => resumirSuceso(grupo, ahora));
}

/**
 * Convierte un grupo en el suceso que consume la interfaz.
 *
 * `medios` es la UNIÓN de medios distintos de todas sus historias, no la suma:
 * un medio que cubrió el terremoto desde cinco ángulos es un medio, no cinco.
 * Sumarlos daría el número grande y halagador, y sería exactamente la cobertura
 * inventada que el umbral de la capa de abajo existe para evitar.
 */
function resumirSuceso(grupo, ahora) {
    const medios = new Set();
    let articulos = 0;
    let masReciente = null;

    for (const historia of grupo.historias) {
        for (const nombre of nombresDeMedios(historia)) medios.add(nombre);
        articulos += Number.isFinite(historia?.articleCount)
            ? historia.articleCount
            : mediosDeHistoria(historia);

        const marca = marcaDe(historia);
        if (marca != null && (masReciente == null || marca > masReciente)) masReciente = marca;
    }

    // Si ninguna historia trajo nombres de medio se cae al recuento del líder,
    // que es lo único verificable que queda.
    const cuantos = medios.size || mediosDeHistoria(grupo.lider);

    return {
        id: grupo.lider.id,
        titular: grupo.lider.title,
        lider: grupo.lider,
        historias: grupo.historias,
        medios: cuantos,
        articulos,
        angulos: grupo.historias.length,
        publishedAt: masReciente == null ? null : new Date(masReciente).toISOString(),
        puntuacion: puntuacionDeRelevancia(
            { medios: cuantos, publishedAt: masReciente },
            ahora
        ),
    };
}

/** Comparador de sucesos: más relevante primero. */
export function porRelevanciaDeSuceso() {
    return (a, b) => {
        if (b.puntuacion !== a.puntuacion) return b.puntuacion - a.puntuacion;
        return b.angulos - a.angulos;
    };
}
