// @ts-check

/**
 * DETECCIÓN DE OPINIÓN — separar lo que se reporta de lo que se opina.
 *
 * POR QUÉ EXISTE (2026-08-09, decisión de Jose)
 * ---------------------------------------------
 * Una columna NO es el reporte de un hecho. Agruparla con la cobertura noticiosa
 * mezcla dos preguntas distintas —«quién informó de esto» y «quién opinó de
 * esto»— y corrompe justo la función central del sitio: si tres medios publican
 * una columna sobre el mismo tema, el agrupador ve una historia multifuente
 * perfecta donde no hubo un solo hecho reportado.
 *
 * Medido el 2026-08-09: 105 de 2 749 artículos colombianos del corpus eran
 * opinión, y estaban entrando al agrupamiento como si fueran noticia.
 *
 * NO SE DESCARTA, SE MARCA. La opinión es material valioso —seguramente el
 * mejor indicio de la orientación de un medio, porque a quién le das una columna
 * es una decisión deliberada y repetida, no un accidente de cobertura—, así que
 * el artículo se conserva con su marca y solo sale del AGRUPAMIENTO.
 *
 * QUÉ HACE HOY CON ESA MARCA, dicho sin adornos: **nada más que eso**. Su único
 * consumidor en todo el código es el filtro del agrupamiento. Esta línea decía
 * que «alimenta el agregado de formadores de opinión», y ese agregado NO EXISTE.
 * Lo señaló una revisión externa el 2026-08-25, y era la tercera vez este mes que
 * un comentario de este repositorio describía una intención en vez de un
 * comportamiento. Cuando exista algo que consuma la marca, se escribe aquí.
 *
 * LA URL ES LA PISTA, y hay que decir por qué
 * -------------------------------------------
 * Casi todos los medios cuelgan la opinión de una ruta propia. Es una señal del
 * PROPIO MEDIO —él decidió publicarlo bajo /opinion/— y no una inferencia
 * nuestra sobre el texto, que es lo que la hace admisible: no estamos juzgando
 * si algo "suena a opinión", estamos leyendo cómo lo clasificó quien lo publicó.
 *
 * LÍMITE CONOCIDO Y DECLARADO: la detección es incompleta. Un medio que publique
 * columnas sin ruta distintiva no se detecta, y sus columnas seguirán entrando
 * como noticia. Se prefiere quedarse corto: marcar como opinión una noticia real
 * la sacaría del agrupamiento, que es el daño peor.
 */

/**
 * Rutas de opinión, por tipo. El orden importa: se prueba de más específico a
 * más general, porque `/opinion/editorial/` también contiene `/opinion/`.
 */
const PATRONES = [
    // Sin firma personal: es la voz institucional del medio. Es el indicio MÁS
    // fuerte de su línea, más que cualquier columnista invitado, y por eso se
    // distingue en vez de meterlo en el mismo saco.
    { tipo: 'editorial', re: /\/(editorial(es)?)\//i },
    // Caricatura: opinión, pero no texto. Se distingue de la columna porque no
    // sirve para medir corriente —no hay argumento que leer— y porque el día que
    // se cuenten columnistas habrá que dejarla fuera del recuento. Hoy, como el
    // resto de la marca, su único efecto es salir del agrupamiento.
    { tipo: 'caricatura', re: /\/(caricaturas?|humor\s*grafico)\//i },
    { tipo: 'columna', re: /\/(opinion|columnistas?|columnas?|blogs?)\//i },
];

/**
 * Nombre del columnista cuando la propia URL lo trae.
 *
 * Vanguardia publica `/opinion/columnistas/luis-ernesto-ruiz/2026/08/06/...`,
 * así que el autor está en la dirección y no hay que deducirlo de nada. Donde no
 * esté, se devuelve null: no se adivina a partir del titular ni del texto.
 */
const TRAS_COLUMNISTAS = /\/columnistas?\/([a-z0-9-]{4,60})(?:\/|$)/i;

/** Segmentos que aparecen tras /columnistas/ y NO son personas. */
const NO_ES_PERSONA = new Set([
    'todos', 'todas', 'index', 'listado', 'archivo', 'page', 'pagina',
    'opinion', 'columnas', 'blogs', 'autores',
]);

/**
 * Convierte `luis-ernesto-ruiz` en `Luis Ernesto Ruiz`.
 *
 * Las partículas van en minúscula —«Juan de la Cruz», no «Juan De La Cruz»—
 * porque así se escriben los nombres en español y porque el índice se va a leer.
 */
const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'da', 'e']);

export function nombreDesdeRanura(ranura) {
    if (!ranura) return null;
    const partes = ranura.split('-').filter(Boolean);
    if (partes.length < 2) return null; // un solo token rara vez es un nombre
    return partes
        .map((p, i) => (i > 0 && PARTICULAS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
        .join(' ');
}

/**
 * LA SEGUNDA SEÑAL: LA ETIQUETA QUE EL MEDIO LE PONE AL ÍTEM EN SU RSS.
 *
 * POR QUÉ HIZO FALTA (2026-09-09, decisión de Jose)
 * -------------------------------------------------
 * `detectarOpinion` lee la ruta, y **22 de los 70 medios con datos publican en
 * la raíz** —`medio.co/titulo`, sin sección—: 2 179 piezas, el 6,3 % del corpus.
 * Para ellos el filtro no es incompleto, es ciego. La cifra que lo cerraba:
 * **de las 631 piezas marcadas como opinión en todo el corpus, CERO eran de los
 * seis medios de raíz plana de la banda de izquierda**, y 96 de sus 267
 * artículos estaban dentro de una historia. No es que no publiquen opinión —el
 * 08-09-2026 Razón Pública tenía una caricatura en el corpus—: es que no se la
 * podía ver.
 *
 * ES LA MISMA CLASE DE SEÑAL, y por eso es admisible con el mismo argumento: la
 * etiqueta la escribe **el propio medio** al publicar. No se analiza el texto de
 * la pieza —eso seguiría estando fuera de este proyecto—, se lee cómo la
 * clasificó quien la publicó, igual que con la ruta.
 *
 * MEDIDO ANTES DE ESCRIBIRLO (2026-09-09): los 22 son WordPress y **el 100 % de
 * sus ítems trae `<category>`**. Sobre lo que publicaban ese día, esta lista
 * marca 38 de los 150 ítems de Las2Orillas, 3 de los 10 de Razón Pública —la
 * caricatura incluida— y 6 de los 40 de Volcánicas. Hoy los tres marcan cero.
 *
 * COINCIDENCIA EXACTA, NUNCA SUBCADENA, y esta es la decisión que evita el daño
 * peor. Marcar como opinión una noticia real la saca del agrupamiento, así que
 * se compara la etiqueta ENTERA contra esta lista. El precedente está en
 * contentQuality: un patrón de lotería descartó «obras de rehabilitación del CDI
 * El Dorado» por buscar la subcadena.
 *
 * LO QUE SE DEJÓ FUERA A PROPÓSITO, con su motivo:
 *
 *   · `nota ciudadana` (Las2Orillas, 18 ítems) — es contenido de lectores, y eso
 *     no es lo mismo que una columna. Habría que decidirlo mirándolo.
 *   · `analisis` — Razón Pública publica análisis y solo análisis, y si eso debe
 *     entrar al agrupamiento es otra pregunta abierta (punto 7 de la minuta).
 *     Meterlo aquí sería contestarla de tapadillo.
 */
const ETIQUETAS_DE_OPINION = new Map([
    ['editorial', 'editorial'],
    ['editoriales', 'editorial'],
    ['caricatura', 'caricatura'],
    ['caricaturas', 'caricatura'],
    ['caricatura politica', 'caricatura'],
    ['humor grafico', 'caricatura'],
    ['opinion', 'columna'],
    ['opiniones', 'columna'],
    ['columna', 'columna'],
    ['columnas', 'columna'],
    ['columna de opinion', 'columna'],
    ['columnista', 'columna'],
    ['columnistas', 'columna'],
    ['columnista invitado', 'columna'],
    ['columnista invitada', 'columna'],
    ['tribuna', 'columna'],
    ['la tribuna', 'columna'],
    // Los mismos que la ruta ya trata como columna, para que las dos señales no
    // se contradigan.
    ['blog', 'columna'],
    ['blogs', 'columna'],
]);

/**
 * Normaliza una etiqueta para compararla: sin tildes, en minúsculas y sin
 * espacios de sobra.
 *
 * Las tildes se quitan porque en el catálogo real conviven «Opinión», «Opinion»
 * y hasta «opiniòn» con acento grave —Proclama del Pacífico—, y las tres son la
 * misma sección de la misma casa.
 */
function normalizarEtiqueta(texto) {
    return String(texto ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * ¿Declara el propio medio que este ítem es opinión?
 *
 * @param {Array<string|{_?: string}>|null|undefined} categorias
 * @returns {{ esOpinion: boolean, tipo: string|null, etiqueta: string|null }}
 */
export function detectarOpinionDeclarada(categorias) {
    if (!Array.isArray(categorias)) return { esOpinion: false, tipo: null, etiqueta: null };

    for (const cruda of categorias) {
        const texto = typeof cruda === 'string' ? cruda : cruda?._ ?? '';
        const tipo = ETIQUETAS_DE_OPINION.get(normalizarEtiqueta(texto));
        // El primero que encaja manda, y el orden de la lista de arriba va de
        // más específico a más general por el mismo motivo que en PATRONES.
        if (tipo) return { esOpinion: true, tipo, etiqueta: texto };
    }

    return { esOpinion: false, tipo: null, etiqueta: null };
}

/**
 * LAS DOS SEÑALES JUNTAS, que es lo que se le pregunta a un artículo.
 *
 * La ruta va primero porque dice más: es la única que puede nombrar al
 * columnista. La etiqueta entra donde la ruta no llega, que es exactamente el
 * caso de los 22 medios que publican en la raíz.
 *
 * @param {{ url?: string|null, categorias?: Array<string|{_?: string}>|null }} articulo
 * @returns {{ esOpinion: boolean, tipo: string|null, columnista: string|null }}
 */
export function detectarOpinionDelArticulo({ url, categorias } = {}) {
    const porRuta = detectarOpinion(url);
    if (porRuta.esOpinion) return porRuta;

    const porEtiqueta = detectarOpinionDeclarada(categorias);
    if (!porEtiqueta.esOpinion) return porRuta;

    // La etiqueta no trae columnista: el nombre solo está cuando la URL lo pone,
    // y aquí la URL no dice nada. No se deduce del titular ni del texto.
    return { esOpinion: true, tipo: porEtiqueta.tipo, columnista: null };
}

/**
 * ¿Es opinión esta URL, y de quién?
 *
 * @param {string|null|undefined} url
 * @returns {{ esOpinion: boolean, tipo: string|null, columnista: string|null }}
 */
export function detectarOpinion(url) {
    const vacio = { esOpinion: false, tipo: null, columnista: null };
    if (typeof url !== 'string' || !url) return vacio;

    let ruta;
    try {
        ruta = new URL(url).pathname;
    } catch {
        // Sin URL parseable no se afirma nada. Una cadena suelta que contenga
        // «opinion» podría ser cualquier cosa —un titular, un slug de noticia—.
        return vacio;
    }

    const encaje = PATRONES.find((p) => p.re.test(ruta));
    if (!encaje) return vacio;

    let columnista = null;
    if (encaje.tipo === 'columna') {
        const m = ruta.match(TRAS_COLUMNISTAS);
        const ranura = m?.[1]?.toLowerCase();
        if (ranura && !NO_ES_PERSONA.has(ranura)) columnista = nombreDesdeRanura(ranura);
    }

    return { esOpinion: true, tipo: encaje.tipo, columnista };
}
