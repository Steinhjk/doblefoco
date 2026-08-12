// @ts-check
/**
 * AUDIENCIA DE LOS MEDIOS — CUÁNTA GENTE LOS LEE, Y DE DÓNDE SALE ESA CIFRA
 * ========================================================================
 *
 * POR QUÉ EXISTE (2026-08-11, decisión de Jose). Al priorizar qué fichas de
 * propiedad se trabajan primero hacía falta ordenar el catálogo por «mayor
 * cobertura nacional», y Jose aclaró que eso significa **cantidad de lectores**,
 * no cantidad de piezas.
 *
 * LA DISTINCIÓN NO ES UN MATIZ, es la diferencia entre dos retratos opuestos.
 * `/api/panorama` mide lo que nosotros ingerimos: por ahí Infobae Colombia sale
 * primero con 1.700 piezas en 72 horas —tres veces el segundo— y La FM sale con
 * diez. Eso describe la productividad de un RSS, no cuánta gente lo lee. Un
 * noticiero de televisión que publica poco en su web puede tener veinte veces la
 * audiencia de un portal que vuelca cientos de notas al día.
 *
 * DE DÓNDE SALEN ESTAS CIFRAS, Y POR QUÉ DE AHÍ
 * ---------------------------------------------
 * Del Digital News Report del Reuters Institute, capítulo Colombia. Se eligió
 * después de comprobar las alternativas, y conviene dejar escrito el descarte
 * para no repetir la búsqueda:
 *
 *   · **Comscore** es la moneda del sector —es lo que citan Semana, El Tiempo y
 *     RCN cuando se declaran número uno— pero es de pago y su tabla no se puede
 *     republicar. Además tiene un agujero: el medio más leído del país abandonó
 *     la medición oficial, así que ni siquiera es un censo.
 *   · **Similarweb** enseña cinco puestos sin cuenta. **Semrush** enseña unos
 *     veinte, y en su categoría «Newspapers · Colombia» aparecen youtube,
 *     instagram, wikipedia e imdb. Los dos estiman TRÁFICO DE UN DOMINIO, que no
 *     es lo mismo que lectores de un medio.
 *
 * El Reuters Institute es el único que mide **personas**, incluye televisión y
 * radio —donde está la mitad del consumo de noticias en Colombia—, es gratuito y
 * se puede enlazar. Es exactamente la clase de fuente que el resto del proyecto
 * ya exige.
 *
 * LO QUE NO CUBRE, Y SE DECLARA EN VEZ DE RELLENARSE
 * --------------------------------------------------
 * Llega a dieciséis marcas y ahí se acaba. **Por debajo de esa lista no existe
 * medición pública de audiencia en Colombia.** No hay una cifra citable para El
 * Colombiano, El Heraldo, El País de Cali, Vanguardia, La Opinión ni El
 * Universal, que son seis de los siete medios que más volumen aportan a este
 * catálogo después de los nacionales.
 *
 * Y hay un dato que lo dice mejor que cualquier explicación: en la encuesta,
 * TODA la prensa regional y local junta —agregada en una sola fila, «Other
 * regional or local newspaper»— alcanza al 10 % semanal. No es que midan poco:
 * es que la encuesta no pregunta por ellos uno por uno.
 *
 * Así que este archivo NO ordena el catálogo entero. Ordena el tramo que se
 * puede citar y dice dónde se acaba, igual que el mapa dice qué departamentos no
 * tienen medio y por qué.
 *
 * DOS LECTURAS DISTINTAS Y NINGUNA SE SUMA
 * ----------------------------------------
 * `online` y `offline` son dos preguntas distintas de la misma encuesta: qué
 * marcas usó el encuestado en la última semana por internet, y cuáles fuera de
 * internet. **Sumarlas sería contar dos veces a la misma persona**, que es quien
 * ve el noticiero y además entra a su web. Se guardan aparte y se enseñan
 * aparte.
 */

/** La fuente, con todo lo que hace falta para poder discutirla. */
export const FUENTE_AUDIENCIA = {
    nombre: 'Digital News Report 2026 — capítulo Colombia',
    editor: 'Reuters Institute for the Study of Journalism (Universidad de Oxford)',
    url: 'https://reutersinstitute.politics.ox.ac.uk/es/digital-news-report/2026/colombia',
    publicado: '2026-06-16',
    consultadoEl: '2026-08-11',
    metodo:
        'Encuesta en línea con cuotas representativas por edad, género y región, ' +
        'sobre qué marcas de noticias usó el encuestado en la última semana. Mide ' +
        'PERSONAS que declaran haber consumido cada marca, no visitas ni páginas vistas.',
    /**
     * La cifra es de la encuesta, no nuestra. Se cita así porque el número que
     * el lector ve tiene que poder rastrearse hasta quien lo produjo.
     */
    advertencia:
        'Es una encuesta declarativa: la gente dice qué recuerda haber consumido, ' +
        'y las marcas grandes suelen recordarse mejor que las pequeñas.',
};

/**
 * Alcance semanal por medio, en porcentaje de la población encuestada.
 *
 * `marca` es el nombre EXACTO con el que aparece en la encuesta, para que
 * cualquiera pueda abrir la fuente y encontrar la fila. Cuando el nombre de la
 * encuesta y el nuestro no coinciden, esta es la prueba de que la asignación es
 * correcta y no una corazonada.
 *
 * `null` significa que esa marca no está en ese gráfico, no que valga cero.
 */
export const ALCANCE_SEMANAL = {
    'el-tiempo': { online: 30, offline: 25, marca: 'El Tiempo' },
    'noticias-caracol': { online: 22, offline: 42, marca: 'Noticias Caracol TV' },
    'semana': { online: 20, offline: 12, marca: 'Semana' },
    'pulzo': { online: 19, offline: null, marca: 'Pulzo' },
    'el-espectador': { online: 16, offline: 15, marca: 'El Espectador' },
    'caracol-radio': { online: 16, offline: 21, marca: 'Caracol Radio' },
    'blu-radio': { online: 15, offline: 15, marca: 'Blu Radio' },
    'noticias-rcn': { online: 14, offline: 30, marca: 'Noticias RCN TV' },
    'infobae-co': { online: 13, offline: null, marca: 'Infobae.com' },
    'la-silla-vacia': { online: 12, offline: null, marca: 'La Silla Vacía' },
    'cnn-es': { online: 12, offline: 10, marca: 'CNN' },
    'noticias-uno': { online: null, offline: 11, marca: 'Noticias Uno' },
    'la-fm': { online: null, offline: 11, marca: 'La FM (RCN Radio)' },
};

/**
 * MARCAS DE LA ENCUESTA QUE NO SE ASIGNARON A NINGÚN MEDIO, y por qué.
 *
 * Está aquí y no en un comentario porque es información sobre nuestro propio
 * catálogo: las dos primeras dicen qué medios de audiencia real nos faltan, y
 * las otras dicen dónde la encuesta y el catálogo no encajan.
 *
 * NINGUNA SE ASIGNÓ A OJO. Asignar «RCN Radio online» a La FM o «SeñalColombia»
 * a RTVC parece inofensivo y no lo es: pondría una cifra de audiencia ajena bajo
 * el nombre de un medio, y esa cifra se leería después como medida suya.
 */
export const MARCAS_NO_ASIGNADAS = [
    {
        marca: 'CityTv',
        online: 14,
        offline: 20,
        motivo: 'No está en el catálogo. Canal local de Bogotá de Casa Editorial El Tiempo.',
    },
    {
        marca: 'Las2Orillas',
        online: 12,
        offline: null,
        motivo: 'No está en el catálogo. Portal de opinión y análisis, nativo digital.',
    },
    {
        marca: 'Q´Hubo',
        online: null,
        offline: 18,
        motivo: 'No está en el catálogo. Diario popular impreso, con ediciones por ciudad.',
    },
    {
        marca: 'NTN24',
        online: null,
        offline: 9,
        motivo: 'No está en el catálogo. Canal internacional de noticias del grupo RCN.',
    },
    {
        marca: 'RCN Radio online',
        online: 12,
        offline: null,
        motivo:
            'Ambigua. En el catálogo tenemos La FM, que es la emisora informativa de RCN Radio, ' +
            'pero no toda RCN Radio. La encuesta mide la marca matriz y nosotros una de sus partes.',
    },
    {
        marca: 'El País online',
        online: 12,
        offline: null,
        motivo:
            'Ambigua, y es justo la colisión de nombre que este proyecto documenta: en el catálogo ' +
            'hay un El País de Cali (Grupo Gilinski) y un El País de España (Prisa). La encuesta no ' +
            'dice cuál, y elegir sería inventar.',
    },
    {
        marca: 'Señal Colombia RTVC / Radio Nacional de Colombia (RTVC) / SeñalColombia.TV',
        online: 11,
        offline: 11,
        motivo:
            'Ambigua. La encuesta mide TRES canales del sistema público por separado; el catálogo ' +
            'tiene una sola entrada, RTVC, para el sistema entero. Sumar los tres contaría dos veces ' +
            'a quien ve más de uno.',
    },
    {
        marca: 'Other regional or local newspaper',
        online: null,
        offline: 10,
        motivo:
            'No es una marca: es la fila donde la encuesta agrega TODA la prensa regional y local ' +
            'del país. Por eso El Colombiano, El Heraldo, El País de Cali, Vanguardia, La Opinión y ' +
            'El Universal no tienen cifra propia aquí pese a estar entre los que más publican.',
    },
];

/**
 * Audiencia de un medio, o `null` si no hay medición pública.
 *
 * DEVUELVE `null` Y NO CERO. Un medio sin cifra no es un medio sin lectores: es
 * un medio que la encuesta no midió. Poner 0 lo hundiría al final de cualquier
 * orden y lo haría parecer irrelevante, que es exactamente la afirmación que no
 * tenemos.
 *
 * @param {string} mediaId
 * @returns {{online: number|null, offline: number|null, marca: string}|null}
 */
export function audienciaDe(mediaId) {
    return ALCANCE_SEMANAL[mediaId] ?? null;
}

/**
 * La cifra con la que se ordena: el mayor de los dos alcances.
 *
 * EL MAYOR Y NO LA SUMA, por lo dicho arriba —sumar cuenta dos veces a la misma
 * persona—, y no solo el online porque dejaría a Noticias Caracol (42 % fuera de
 * internet, 22 % dentro) por debajo de portales que no se le acercan en
 * audiencia real.
 *
 * @param {string} mediaId
 * @returns {number|null}
 */
export function alcanceMaximo(mediaId) {
    const a = audienciaDe(mediaId);
    if (!a) return null;

    const valores = [a.online, a.offline].filter((v) => typeof v === 'number');
    return valores.length ? Math.max(...valores) : null;
}

/**
 * Los medios del catálogo con audiencia medida, del más leído al menos.
 *
 * ES LA LISTA DE FICHAS PRIORITARIAS. Un error en la ficha de propiedad de El
 * Tiempo lo leen treinta veces más personas que uno en la de un semanario de
 * provincia, y el esfuerzo de documentación se reparte con ese criterio. No dice
 * que los demás importen menos: dice por dónde empezar.
 *
 * @template {{id: string}} T
 * @param {T[]} medios
 * @returns {T[]}
 */
export function ordenadosPorAudiencia(medios) {
    return (Array.isArray(medios) ? medios : [])
        .filter((m) => alcanceMaximo(m?.id) !== null)
        .sort((a, b) => {
            const porPico = (alcanceMaximo(b.id) ?? 0) - (alcanceMaximo(a.id) ?? 0);
            if (porPico !== 0) return porPico;

            /*
             * EL EMPATE SE ROMPE EXPLÍCITAMENTE, y no es un detalle: El Tiempo
             * y Noticias RCN empatan hoy a 30 %. Sin esto el orden lo decidía
             * el del registro —estable, sí, pero accidental—, y mover una
             * entrada de sitio en `mediaRegistry.js` habría cambiado quién sale
             * primero en una lista que dice «los más leídos del país».
             *
             * Desempata el alcance EN INTERNET, que es donde vive este
             * producto: entre dos marcas que llegan a la misma proporción de
             * colombianos, la que llega por web es la que más se va a cruzar
             * con lo que aquí se agrega.
             */
            const porOnline = (audienciaDe(b.id)?.online ?? 0) - (audienciaDe(a.id)?.online ?? 0);
            if (porOnline !== 0) return porOnline;

            return a.id.localeCompare(b.id);
        });
}

/**
 * Los que NO tienen medición, en el orden en que vengan.
 *
 * Existe para poder decir la cifra en voz alta —«de 49 medios, 13 tienen
 * audiencia medida»— en vez de dejar que el lector lo deduzca.
 *
 * @template {{id: string}} T
 * @param {T[]} medios
 * @returns {T[]}
 */
export function sinAudienciaMedida(medios) {
    return (Array.isArray(medios) ? medios : []).filter((m) => alcanceMaximo(m?.id) === null);
}
