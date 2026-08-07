// @ts-check
/**
 * MILITANCIA DE ACTORES POLÍTICOS, EXTRAÍDA DE DOCUMENTOS — Fase 2.
 *
 * QUÉ ES ESTO Y QUÉ NO ES.
 * Cada entrada dice a qué partido pertenece un actor, **con la fuente y las
 * fechas**. NO dice dónde está ese actor en ningún eje: la posición viene de los
 * registros externos de expertos (CHES-LA, V-Party) a través del partido, nunca
 * de aquí y nunca del juicio de quien rellena esta tabla.
 *
 * CÓMO SE RELLENA (protocolo de la sección 16.4 del diseño).
 * La búsqueda puede hacerla un modelo de lenguaje; **lo que se guarda es el
 * documento, no lo que el modelo recuerde**. Sin URL comprobable no hay entrada:
 * el actor se queda como `sinAncla` y eso se publica como tal. Un dato que no se
 * puede abrir y verificar no entra.
 *
 * POR QUÉ IMPORTA TANTO ESA REGLA. La arquitectura entera existe para tener
 * etiquetas que no hayamos escrito nosotros (ver sección 2). Si aquí se colara
 * una posición deducida por una IA o por nosotros, el método se vuelve circular
 * y la auditoría externa deja de ser posible.
 *
 * LO QUE ESTA TABLA CORRIGE DE WIKIDATA. Wikidata da militancia pero sin
 * distinguir la vigente de la histórica: a Gustavo Petro le atribuye cinco
 * partidos a la vez, y una primera versión de este trabajo le asignó la posición
 * del Polo Democrático —que dejó hace más de una década—. Aquí la militancia
 * lleva `desde` y `hasta`, y `vigente` marca cuál cuenta hoy.
 */

/**
 * @typedef {Object} Militancia
 * @property {string} actor
 * @property {string} partido        nombre tal como aparece en el documento
 * @property {string|null} desde     ISO, o null si el documento no lo precisa
 * @property {string|null} hasta     null = vigente
 * @property {boolean} vigente
 * @property {string[]} fuentes      URLs comprobables. Sin esto no hay entrada.
 * @property {string} [nota]
 */

/** @type {Militancia[]} */
export const MILITANCIAS = [
    {
        actor: 'Abelardo de la Espriella',
        partido: 'Defensores de la Patria',
        desde: '2026-03-12',
        hasta: null,
        vigente: true,
        fuentes: [
            'https://es.wikipedia.org/wiki/Defensores_de_la_Patria',
            'https://es.wikipedia.org/wiki/Elecciones_presidenciales_de_Colombia_de_2026',
        ],
        nota:
            'Se inscribió como GRUPO SIGNIFICATIVO DE CIUDADANOS el 2026-03-12, no con aval ' +
            'de partido. Salvación Nacional lo respaldó el 2025-08-27 pero NO fue su aval de ' +
            'inscripción; un resumen de buscador afirmaba lo contrario y el documento lo ' +
            'desmiente. Defensores de la Patria obtuvo personería jurídica como partido el ' +
            '2026-08-03, DESPUÉS de la elección.',
    },
    {
        actor: 'José Manuel Restrepo',
        partido: 'Defensores de la Patria',
        desde: '2026-03-10',
        hasta: null,
        vigente: true,
        fuentes: [
            'https://es.wikipedia.org/wiki/Jos%C3%A9_Manuel_Restrepo_Abondano',
            'https://es.wikipedia.org/wiki/Elecciones_presidenciales_de_Colombia_de_2026',
        ],
        nota:
            'Fórmula vicepresidencial de De la Espriella, anunciada el 2026-03-10. Exministro ' +
            'de Comercio y de Hacienda con Iván Duque. Sin militancia partidista propia ' +
            'documentada antes de esa fecha.',
    },
    {
        actor: 'Iván Cepeda',
        partido: 'Pacto Histórico',
        desde: '2026-03-11',
        hasta: null,
        vigente: true,
        fuentes: ['https://es.wikipedia.org/wiki/Elecciones_presidenciales_de_Colombia_de_2026'],
        nota:
            'CORRIGE A WIKIDATA, que solo registra Polo Democrático Alternativo. Su candidatura ' +
            'presidencial de 2026 se inscribió por el Pacto Histórico el 2026-03-11.',
    },
    {
        actor: 'Aída Quilcué',
        partido: 'Pacto Histórico',
        desde: '2026-03-11',
        hasta: null,
        vigente: true,
        fuentes: ['https://es.wikipedia.org/wiki/Elecciones_presidenciales_de_Colombia_de_2026'],
        nota:
            'Fórmula vicepresidencial de Iván Cepeda. Wikidata la registra en el Movimiento ' +
            'Alternativo Indígena y Social (MAIS), que es su origen.',
    },
];

/**
 * Partidos cuyo nombre en Wikidata no coincide con el de los registros externos.
 *
 * No es cosmética: por esto Hernán Penagos y Dilian Francisca Toro aparecían
 * «sin ancla» teniendo una perfectamente disponible. «Partido de la Unión por la
 * Gente» es el nombre formal del Partido de la U, que CHES sí puntúa.
 */
export const ALIAS_PARTIDOS = {
    'Partido de la Unión por la Gente': 'Partido Social de Unidad Nacional',
    'Partido Alianza Verde': 'Alianza Verde',
    'Movimiento MIRA': 'MIRA',
};

/**
 * Cadenas que parecen un actor y no lo son. Se excluyen de la detección.
 *
 * `Teófilo Forero` es el caso que lo motivó: fue un dirigente del Partido
 * Comunista asesinado en 1989, pero en los titulares de hoy el nombre designa
 * casi siempre a la columna móvil de las FARC bautizada en su honor. Atribuir
 * esas menciones a un político —y con ellas una posición— sería exactamente la
 * misatribución que ya costó la tarea F1-07.
 */
export const FALSOS_POSITIVOS = [
    'Teófilo Forero',
];

/**
 * Actores muy mencionados cuya POSICIÓN sigue sin ancla, aunque su militancia
 * esté verificada. Se declara la lista en vez de rellenarla con una estimación.
 *
 * El caso es grave y hay que verlo: Defensores de la Patria y Pacto Histórico no
 * existen en CHES-LA 2020 ni en V-Party 2018 —son posteriores—, así que los dos
 * candidatos de la segunda vuelta de 2026 y el partido de gobierno entrante no
 * tienen posición externa que heredar. Entre ambos suman la mayor parte de las
 * menciones del corpus.
 */
export const PARTIDOS_SIN_ANCLA = [
    'Defensores de la Patria',
    'Pacto Histórico',
    'Colombia Humana',
    'Lista de la Decencia',
    'Movimiento Alternativo Indígena y Social',
];
