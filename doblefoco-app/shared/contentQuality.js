// @ts-check
/**
 * Filtro de formatos sin encuadre que comparar — tarea F1-14.
 *
 * POR QUÉ EXISTE
 * --------------
 * El motor encontró y agrupó "Resultados del sorteo de La Caribeña Día del
 * lunes" con cuatro medios distintos. Técnicamente es una historia multifuente
 * perfecta; editorialmente no es nada. Cuatro medios publican el mismo número
 * ganador porque es un dato, no porque tengan una posición sobre él.
 *
 * Ese es el criterio exacto de este archivo, y conviene enunciarlo con cuidado
 * porque de otro modo se convierte en censura por la puerta de atrás:
 *
 *   NO se filtra por tema, ni por importancia, ni por calidad periodística.
 *   Se filtra por FORMATO: piezas cuyo contenido es un dato objetivo idéntico
 *   en todos los medios, donde no existe encuadre que contrastar.
 *
 * Un sorteo de lotería, un horóscopo o la TRM del día no tienen "versión de
 * izquierda" y "versión de derecha". Compararlas no produce información; solo
 * infla los números de cobertura y empuja hacia abajo las historias que sí
 * tienen encuadres enfrentados.
 *
 * QUÉ NO HACE ESTE FILTRO
 * -----------------------
 * No decide qué es importante. Una noticia deportiva, de farándula o de sucesos
 * SÍ se indexa: se puede cubrir con encuadres distintos y compararla es
 * legítimo. Lo que se descarta es el resultado del partido en bruto, no la
 * crónica del partido.
 *
 * CÓMO SE VIGILA
 * --------------
 * Cada ciclo registra cuántos artículos descartó y por qué motivo. Si el filtro
 * se vuelve demasiado goloso, se ve en la serie en vez de descubrirse meses
 * después echando en falta noticias que nadie sabe que faltaron.
 */

/**
 * Reglas. Cada una lleva su motivo, y ese motivo se registra: un artículo
 * descartado siempre puede explicarse.
 *
 * Las expresiones se aplican sobre el titular normalizado (sin tildes, en
 * minúsculas). Se usan fronteras de palabra para que "chance" no cace dentro de
 * otra palabra y "astro" no descarte una noticia de astronomía.
 */
export const QUALITY_RULES = [
    {
        id: 'sorteo',
        reason: 'resultado de sorteo o lotería',
        // El número ganador es idéntico en los cuatro medios que lo publican.
        patterns: [
            /\bresultados?\b[^.]{0,40}\b(sorteo|loteria|chance|baloto|revancha)\b/,
            /\b(sorteo|loteria)\b[^.]{0,30}\b(hoy|ayer|anoche|lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/,
            /\bnumeros?\s+ganadores?\b/,
            /\bloteria\s+de\b/,

            // Marcas inconfundibles: no significan otra cosa en español.
            /\b(baloto|revancha|super\s?astro|astro\s+(sol|luna)|sinuano|cash\s?three|play\s?four)\b/,

            /**
             * Marcas AMBIGUAS: solo cuentan junto a una palabra de contexto.
             *
             * Aprendido con un falso positivo real. "El Dorado" es una lotería,
             * pero también el aeropuerto de Bogotá y el nombre de medio país:
             * el patrón a secas descartó "En Montería iniciaron las obras de
             * rehabilitación del CDI El Dorado", que es una noticia de
             * infraestructura perfectamente legítima.
             *
             * Ese es el error que este archivo no puede permitirse, porque
             * borra la noticia sin dejar rastro visible. De ahí la asimetría:
             * las marcas ambiguas exigen que en el mismo titular aparezca
             * "sorteo", "resultado", "chance", "premio" o similar.
             */
            /\b(caribena|dorado|paisita|culona|chontico|cafeterito|motilon|pijao|antioquenita|fantastica)\b[^.]{0,40}\b(sorteo|resultados?|chance|premio|gano|ganador|numero)\b/,
            /\b(sorteo|resultados?|chance|premio|ganador|numero)\b[^.]{0,40}\b(caribena|dorado|paisita|culona|chontico|cafeterito|motilon|pijao|antioquenita|fantastica)\b/,
        ],
    },
    {
        id: 'horoscopo',
        reason: 'horóscopo o predicción astrológica',
        patterns: [
            /\bhoroscopo\b/,
            /\b(signos?\s+del\s+zodiaco|zodiacal)\b/,
            /\b(tarot|carta\s+astral|predicciones\s+de\s+(hoy|la\s+semana))\b/,
        ],
    },
    {
        id: 'cotizacion',
        reason: 'cotización del día en bruto',
        /**
         * El precio del dólar es idéntico en todos los medios. El ANÁLISIS de
         * por qué se movió sí es encuadre, y encuadres opuestos sobre lo mismo
         * es el producto entero.
         *
         * La primera versión estaba mal en LAS DOS direcciones, y solo se vio
         * al mirar los titulares reales del corpus:
         *   · `\b(trm|dolar)\b .{0,20} \bhoy\b` descartaba "Dólar hoy en
         *     Colombia: mercado se movería entre la expectativa de rebote y la
         *     incertidumbre", que es análisis y debía publicarse.
         *   · Y a la vez NO capturaba "Precio del dólar en casas de cambio para
         *     el martes, 28 de julio", que sí es el dato en bruto, porque no
         *     dice "hoy" sino el día de la semana.
         *
         * Ahora se exige la FORMA del boletín diario recurrente, no la mera
         * presencia de "dólar" cerca de una marca temporal. Titulares como
         * "El dólar se sitúa por debajo de los $3.200" quedan fuera del filtro
         * a propósito: son limítrofes y se prefiere publicarlos.
         */
        patterns: [
            /^precio\s+del\s+dolar\b/,
            /^(el\s+)?(dolar|trm)\s+(hoy|de\s+hoy)\b/,
            /\btrm\b[^.]{0,15}\b(hoy|de\s+hoy)\b/,
            /\b(dolar|trm)\b[^.]{0,30}\b(asi\s+(abrio|cerro)|apertura\s+de\s+la\s+jornada|cierre\s+de\s+la\s+jornada)\b/,
            /^precio\s+del?\s+(euro|bitcoin|cafe|petroleo)\b[^.]{0,20}\bhoy\b/,
        ],
    },
    {
        id: 'indice',
        reason: 'portada, boletín o programa completo, no una pieza',
        /**
         * Páginas índice que los feeds publican como si fueran artículos: la
         * portada del día, el boletín horario, el programa de radio completo.
         * No son noticias sino contenedores, y su titular no describe ningún
         * hecho: "Portada 27 de julio del 2026".
         *
         * Además de no aportar nada, envenenan el agrupamiento: al ser
         * titulares cortos y casi idénticos entre sí, se fusionan formando
         * historias multifuente falsas con varios medios.
         *
         * PATRONES ANCLADOS AL INICIO, no sueltos. La versión amplia que probé
         * primero capturaba "Terremoto en Japón | Víctimas, daños y edificios
         * colapsados…" por contener "últimas noticias" más adelante en el
         * titular. Una noticia real, borrada sin dejar rastro: el mismo error
         * que "El Dorado".
         */
        patterns: [
            /^portada\b/,
            /^ultimas\s+noticias\s*[|:—-]/,
            /\bprograma\s+completo\b/,
            /\ben\s+vivo\b[^.]{0,20}\bultimas\s+noticias\s+de\b/,
            /^\d{1,2}\s+de\s+\w+\s+de\s+\d{4}\s*[-–—]/,
        ],
    },
    {
        id: 'clima',
        reason: 'parte meteorológico',
        patterns: [
            /\b(clima|pronostico\s+del\s+tiempo|estado\s+del\s+tiempo)\b[^.]{0,25}\b(hoy|manana|semana)\b/,
        ],
    },
    {
        id: 'directo',
        reason: 'retransmisión en directo, sin pieza cerrada',
        // No es que no importe: es que el titular cambia cada diez minutos y el
        // agrupamiento junta actualizaciones sucesivas del mismo acto como si
        // fueran cobertura de medios distintos.
        patterns: [
            /\bminuto\s+a\s+minuto\b/,
            /\b(siga|sigue|siganlo)\s+(aqui|en\s+vivo)\b/,
            /\ben\s+vivo\b[^.]{0,25}\b(transmision|streaming|senal)\b/,
        ],
    },
    {
        id: 'resultado-deportivo',
        reason: 'marcador o programación deportiva en bruto',
        // Deliberadamente estrecho. La crónica de un partido y el análisis de
        // un fichaje SÍ se indexan: tienen encuadre. Lo que se descarta es la
        // tabla de resultados y la alineación.
        patterns: [
            /\b(resultados?|marcador)\b[^.]{0,30}\b(fecha|jornada)\s+\d+\b/,
            /\b(alineaciones?|formaciones?)\s+(confirmadas?|probables?)\b/,
            /\btabla\s+de\s+posiciones\b/,
            /\bhorarios?\s+y\s+donde\s+ver\b/,
        ],
    },
    {
        id: 'no-es-articulo',
        reason: 'página de sección, portada o aviso del sitio, no una pieza',
        /**
         * NO ES UNA NOTICIA MAL ESCRITA: NO ES UNA NOTICIA.
         *
         * Apareció al reactivar W Radio y RTVC Noticias (2026-07-30). Sus feeds
         * entregan, junto a piezas reales, entradas cuyo titular es el nombre de
         * una sección o un aviso del propio sitio: «Noticias y Radio Online»,
         * «sitio en mantenimiento». La primera venía fechada el día anterior, así
         * que habría sobrevivido a la ventana de 72 h y habría aparecido en la
         * portada como una noticia de W Radio con cero contenido.
         *
         * ANCLADAS AL TITULAR COMPLETO (^...$) a propósito, y esto es lo que
         * impide que la regla se vuelva golosa. El precedente está escrito en
         * F1-14: un patrón de lotería descartó «obras de rehabilitación del CDI
         * El Dorado» porque buscaba la subcadena. Aquí «Portada» descarta un
         * titular que ES exactamente «Portada», y no toca «Portada de la revista
         * Semana genera polémica».
         */
        patterns: [
            /^(inicio|portada|home|noticias|ultimas?\s+noticias|actualidad)$/,
            /^noticias\s+y\s+radio\s+online$/,
            /^sitio\s+en\s+mantenimiento$/,
            /^(pagina\s+)?(no\s+encontrada|not\s+found)$/,
            /^(rss|feed|sin\s+titulo|untitled)$/,
        ],
    },
];

/** Quita tildes y baja a minúsculas, para que las reglas no dependan de ellas. */
function normalize(text) {
    return String(text)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
}

/**
 * ¿Se indexa este artículo?
 *
 * @param {{headline?: string, category?: string}} article
 * @returns {{indexable: boolean, ruleId: string|null, reason: string|null}}
 */
export function assessArticle(article) {
    const headline = article?.headline;

    if (!headline || typeof headline !== 'string' || !headline.trim()) {
        return { indexable: false, ruleId: 'sin-titular', reason: 'sin titular utilizable' };
    }

    const text = normalize(headline);

    for (const rule of QUALITY_RULES) {
        if (rule.patterns.some((pattern) => pattern.test(text))) {
            return { indexable: false, ruleId: rule.id, reason: rule.reason };
        }
    }

    return { indexable: true, ruleId: null, reason: null };
}

/**
 * Cuenta descartes por motivo sobre un lote.
 * Lo que alimenta la vigilancia: sin esta cifra, un filtro demasiado goloso
 * solo se descubre echando en falta noticias que nadie sabe que faltaron.
 */
export function summarizeFiltering(articles) {
    const byRule = {};
    let filtered = 0;

    for (const article of articles) {
        const verdict = assessArticle(article);
        if (verdict.indexable) continue;
        filtered += 1;
        byRule[verdict.ruleId] = (byRule[verdict.ruleId] ?? 0) + 1;
    }

    return { total: articles.length, filtered, byRule };
}
