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
 * NO SE DESCARTA, SE DESVÍA. La opinión es material valioso —seguramente el
 * mejor indicio de la orientación de un medio, porque a quién le das una columna
 * es una decisión deliberada y repetida, no un accidente de cobertura—. Sale del
 * flujo de noticias y alimenta el agregado de formadores de opinión.
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
    // Caricatura: opinión, pero no texto. No sirve para el índice de columnistas
    // ni para medir corriente, y se marca para poder excluirla del recuento.
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
