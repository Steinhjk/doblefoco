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
        motivo:
            'No está en el catálogo. Canal local de Bogotá de Casa Editorial El Tiempo. ' +
            'INTENTADO EL 2026-08-24 y no se pudo: su dominio devuelve 403 a nuestro ' +
            'User-Agent en TODAS las rutas, incluida la portada, y esta vez no es cosa ' +
            'nuestra —el User-Agent ya es ASCII puro desde el caso de Las2Orillas—. La ' +
            'vía de Google News tampoco sirve: rinde 2 ítems. Queda como el candidato de ' +
            'mayor audiencia que este catálogo NO puede alcanzar hoy.',
    },
    {
        marca: 'Las2Orillas',
        online: 12,
        offline: null,
        motivo:
            'YA ESTÁ EN EL CATÁLOGO desde el 2026-08-24, con id `las2orillas`. Se queda ' +
            'escrito aquí porque la razón por la que estuvo fuera importa: un 403 que ' +
            'causaba nuestro propio User-Agent con tilde, no un bloqueo del medio. ' +
            'Pendiente: asignarle esta cifra de alcance en AUDIENCIA_REUTERS.',
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
 * ═══════════════════════════════════════════════════════════════════════════
 * EL TRAMO PRIORITARIO: VEINTE FICHAS, DOS GRADOS DE CERTEZA
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Jose pidió veinte fichas de propiedad prioritarias. La encuesta del Reuters
 * Institute solo llega a trece de nuestros medios, así que las siete restantes
 * entran por otra vía —y **esa diferencia se marca en vez de disimularse**, que
 * es la parte que él pidió aclarar—.
 *
 *   · **Trece con audiencia MEDIDA.** Porcentaje de colombianos que declara
 *     haber usado la marca en la última semana. Es un dato ajeno, citable, y
 *     mide personas.
 *
 *   · **Siete con volumen ESTIMADO.** Piezas que ingerimos de cada uno en una
 *     ventana de 72 horas. Es un dato NUESTRO, no citable como audiencia, y mide
 *     lo que publica un RSS. Aquí se usa como aproximación al peso de un medio
 *     porque no hay nada mejor, no porque sea lo mismo.
 *
 * POR QUÉ EL VOLUMEN NO ES AUDIENCIA, otra vez y en corto: Infobae publica
 * 1.700 piezas en 72 horas y La FM diez, y La FM llega al 11 % de los
 * colombianos. Un medio puede publicar mucho y leerlo poca gente, y al revés.
 * Las siete de abajo son diarios grandes que casi con seguridad tienen mucha
 * audiencia —El Colombiano y El Heraldo son los dos mayores diarios regionales
 * del país—, pero **nadie lo ha medido públicamente y nosotros tampoco**.
 *
 * EL RECUENTO ES UNA FOTO CON FECHA, no un valor vivo. Se congela aquí a
 * propósito: si el tramo prioritario se recalculara con cada consulta, la lista
 * de fichas a trabajar cambiaría sola de un día para otro y nadie sabría por
 * qué. Para actualizarla hay que volver a medir y cambiar estos números a mano,
 * que es exactamente la fricción que se quiere.
 *
 * LO QUE ESTA AMPLIACIÓN LE HACE AL EQUILIBRIO, y conviene mirarlo de frente:
 * seis de los siete que entran son de derecha. El tramo pasa de 7 mixtos / 4
 * derecha / 2 izquierda a **8 mixtos / 10 derecha / 2 izquierda**. No se corrige
 * ni se compensa: el desequilibrio del espacio mediático colombiano es lo que
 * este proyecto existe para enseñar, y maquillarlo en la lista de fichas sería
 * empezar por mentir en el índice.
 */
export const AMPLIACION_POR_VOLUMEN = {
    medidoEl: '2026-08-11',
    ventanaHoras: 72,
    fuente: 'Recuento propio de piezas ingeridas (/api/panorama)',
    advertencia:
        'NO es audiencia. Son piezas que publicaron y nosotros recogimos, no personas que ' +
        'las leyeran. Se usa como aproximación al peso de un medio porque no existe ' +
        'medición pública de audiencia por debajo de las dieciséis marcas de la encuesta.',
    /** id → piezas en la ventana, medidas el día de arriba. */
    piezas: {
        'el-heraldo': 348,
        'el-colombiano': 303,
        'el-pais-cali': 232,
        'la-republica': 222,
        'el-universal': 175,
        'vanguardia': 139,
        'la-opinion': 139,
    },
};

/**
 * El orden del tramo, calculado una vez. Primero los medidos por audiencia, y
 * detrás los estimados por volumen: **ningún estimado adelanta a un medido**,
 * por poco que este último alcance. Mezclarlos por una escala común exigiría
 * convertir piezas en lectores, que es justo lo que no se puede hacer.
 */
const ORDEN_PRIORITARIO = [
    ...Object.keys(ALCANCE_SEMANAL)
        .sort((a, b) => {
            const porPico = (alcanceMaximo(b) ?? 0) - (alcanceMaximo(a) ?? 0);
            if (porPico !== 0) return porPico;
            const porOnline = (ALCANCE_SEMANAL[b].online ?? 0) - (ALCANCE_SEMANAL[a].online ?? 0);
            return porOnline !== 0 ? porOnline : a.localeCompare(b);
        })
        .map((id) => ({ id, certeza: /** @type {const} */ ('medida') })),
    ...Object.entries(AMPLIACION_POR_VOLUMEN.piezas)
        .sort(([idA, a], [idB, b]) => (b - a) || idA.localeCompare(idB))
        .map(([id]) => ({ id, certeza: /** @type {const} */ ('estimada') })),
];

/** Cuántas fichas componen el tramo prioritario. */
export const TAMANO_TRAMO = ORDEN_PRIORITARIO.length;

/**
 * Puesto de un medio en el tramo prioritario, o `null` si no está.
 *
 * @param {string} mediaId
 * @returns {{puesto: number, certeza: 'medida'|'estimada', cifra: number, unidad: string}|null}
 */
export function prioridadDe(mediaId) {
    const i = ORDEN_PRIORITARIO.findIndex((e) => e.id === mediaId);
    if (i === -1) return null;

    const { certeza } = ORDEN_PRIORITARIO[i];
    return {
        puesto: i + 1,
        certeza,
        cifra:
            certeza === 'medida'
                ? /** @type {number} */ (alcanceMaximo(mediaId))
                : AMPLIACION_POR_VOLUMEN.piezas[mediaId],
        unidad: certeza === 'medida' ? '% de alcance semanal' : 'piezas en 72 h',
    };
}

/**
 * Los veinte, en orden, para quien tenga que trabajarlas.
 *
 * @template {{id: string}} T
 * @param {T[]} medios
 * @returns {Array<T & {prioridad: NonNullable<ReturnType<typeof prioridadDe>>}>}
 */
export function tramoPrioritario(medios) {
    return (Array.isArray(medios) ? medios : [])
        .filter((m) => prioridadDe(m?.id))
        .map((m) => ({ ...m, prioridad: /** @type {any} */ (prioridadDe(m.id)) }))
        .sort((a, b) => a.prioridad.puesto - b.prioridad.puesto);
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
