/**
 * QUÉ VIGILA EL CENTINELA EN CADA MEDIO.
 *
 * Ejecuta esto `scripts/centinela.mjs`, con `npm run centinela`.
 *
 * Por qué existe
 * --------------
 * El 2026-08-17, al comprobar la ficha de Diario La Libertad el día en que se
 * mandaba a revisión externa, apareció un conflicto de interés que la ficha no
 * tenía: **la directora del periódico había anunciado su candidatura en su
 * propio periódico**, once meses antes. No estaba escondido. Estaba publicado,
 * con titular, y salió de escribir dos palabras en el buscador del propio sitio.
 *
 * Eso es lo que esto automatiza. No la lectura ni el juicio —eso sigue siendo
 * trabajo de una persona—, sino **la parte que un programa hace mejor que
 * nosotros: mirar todas las semanas, en 76 sitios, si han publicado algo que
 * toque lo que su ficha afirma.**
 *
 * LA REGLA DE ESTE ARCHIVO: CADA TÉRMINO VIGILA UNA AFIRMACIÓN CONCRETA
 * --------------------------------------------------------------------
 * El campo `vigila` no es documentación de cortesía: es la razón por la que el
 * término está aquí, y sin ella el centinela degenera en una alerta de Google.
 * Si al leer un aviso no se puede decir QUÉ frase de la ficha queda en duda, el
 * término sobra. Un vigilante que avisa de todo enseña a ignorarlo — la misma
 * lección que fijó el umbral de 14 días en `comprobarMedios.mjs`.
 *
 * POR QUÉ SON POCOS MEDIOS
 * ------------------------
 * Arrancó con los tres de la cola de revisión y se amplió el 2026-08-18 a todos
 * los que tienen ficha escrita **y sitio consultable**. Las dos condiciones
 * importan, y la segunda dejó fuera a mucha gente:
 *
 * **LOS VEINTE MEDIOS DE MAYOR AUDIENCIA NO SE PUEDEN VIGILAR POR AQUÍ.** Se
 * probaron uno por uno y **los veinte devuelven la misma página con cualquier
 * consulta**: El Tiempo daba 159 enlaces para «Sarmiento Angulo» y los mismos
 * 159 para una palabra inventada. Sus buscadores se pintan con JavaScript o
 * ignoran el parámetro. No es que no hayan publicado nada — es que no hay por
 * dónde preguntarles.
 *
 * Es una limitación incómoda, porque son justo los medios que más gente lee. Se
 * escribe aquí para que nadie la descubra dos veces, y `scripts/centinela.mjs`
 * lleva ahora la comprobación incorporada: un buscador que no filtra sale como
 * `buscador-falso` en vez de fingir que vigila.
 *
 * TAMPOCO ENTRAN LOS MEDIOS SIN UN NOMBRE AL QUE AGARRARSE. La Razón.co, Quindío
 * Noticias, Abra Noticias, EL DIARIO de Boyacá y Archipiélago Press tienen la
 * propiedad sin comprobar y **ningún nombre publicado**: no hay término que
 * vigile nada. Lo que les falta es un certificado de cámara de comercio, no una
 * consulta semanal.
 */

/**
 * @typedef {object} Consulta
 * @property {string} consulta  Lo que se le pregunta al buscador del medio.
 * @property {string} vigila    Qué afirmación de la ficha queda en duda si sale algo.
 * @property {boolean} [enTitular=true]
 *   Si `true`, solo cuentan las piezas cuyo TITULAR contiene el término. El
 *   buscador de WordPress también encuentra menciones de pasada en el cuerpo, y
 *   esas son casi todas ruido: de 72 resultados por «Tcherassi» en La Libertad,
 *   21 lo llevaban en el titular y el resto eran menciones sueltas.
 */

/** @type {Record<string, { consultas: Consulta[] }>} */
export const VIGILANCIA = {
    'diario-la-libertad': {
        consultas: [
            {
                consulta: 'Tcherassi',
                vigila:
                    'Que la compra anunciada en enero de 2025 sigue SIN cerrarse. Si el diario publica que se cerró —o que se cayó—, `ownerType` deja de ser null y hay que decidir aviso de conflicto de interés y controlGroup con El Espacio.',
            },
            {
                consulta: 'Esper',
                vigila:
                    'Que Luz Marina Esper Fayad sigue siendo la directora, y que la casa se sigue describiendo como propiedad de la familia. Son los tres indicios en los que hoy se apoya que la operación no se cerró.',
            },
            {
                consulta: 'contienda electoral',
                vigila:
                    'En qué queda la candidatura que la directora anunció el 12-10-2025 —«no lo pongas en duda, voy para la contienda electoral»—. Es el conflicto de interés mejor acreditado de esta ficha y el que decide si hay que publicar un aviso.',
            },
        ],
    },

    'la-nacion-neiva': {
        consultas: [
            {
                consulta: 'Olave',
                vigila:
                    'Que Felipe Olave Blackburn sigue siendo el comprador de 2024 y no ha vuelto a cambiar de manos. Casi toda la evidencia de esa ficha es del propio diario, así que el propio diario es donde primero se vería.',
            },
            {
                consulta: 'Huila Stéreo',
                vigila:
                    'Si crece el grupo. Olave compró la emisora después del diario; una tercera compra convertiría esto en un grupo regional y pediría controlGroup.',
            },
        ],
    },

    /**
     * Cablenoticias entra sabiendo que HOY NO SE PUEDE PREGUNTAR: su sitio no es
     * WordPress y no expone buscador consultable, así que el centinela lo
     * declarará «no comprobable» en cada pasada.
     *
     * Se deja escrito a propósito. Una lista que solo contiene lo que sí se puede
     * mirar da la impresión de cobertura completa, y esta ficha es justamente la
     * que más vigilancia necesita: su propiedad está documentada al detalle y
     * toda la documentación es de 2018.
     */
    cablenoticias: {
        consultas: [
            {
                consulta: 'Cable Noticias TV',
                vigila:
                    'Cualquier señal de quién lo controla hoy. La estructura societaria conocida —accionistas venezolanos, sociedad última en Panamá— viene de una fuente cuya última actualización es de marzo de 2018.',
            },
        ],
    },

    // ── Regionales con dueño o director con nombre ──────────────────────────
    //
    // El término es, en casi todos, EL NOMBRE SOBRE EL QUE SE APOYA LA FICHA. Si
    // ese nombre aparece en las páginas del propio medio, o cambió algo o el
    // medio está cubriendo a su dueño — y las dos cosas se quieren leer.

    telecafe: {
        consultas: [
            {
                consulta: 'Amanda Jaimes',
                vigila:
                    'Que siga gerenciando el canal. Es un canal público de tres gobernaciones, así que su gerencia cambia con los gobiernos: es el mismo caso de RTVC, cuya ficha ya prevé que gire con el poder de turno.',
            },
        ],
    },

    'diario-del-huila': {
        consultas: [
            {
                consulta: 'Duque Rengifo',
                vigila:
                    'Que María Pia Duque Rengifo siga dirigiéndolo. La ficha sostiene el control en la continuidad de la familia fundadora, no en un accionariado documentado: si ella sale, la afirmación se queda sin pie.',
            },
        ],
    },

    'diario-del-norte': {
        consultas: [
            {
                consulta: 'Demis Pacheco',
                vigila:
                    'Que siga con el 80 % de Sistema Cardenal. Es el único regional del catálogo que publica su propio accionariado, así que su ficha es tan buena —o tan caduca— como ese dato.',
            },
        ],
    },

    'el-diario-pereira': {
        consultas: [
            {
                consulta: 'Ramírez Múnera',
                vigila:
                    'Que los hermanos Luis Carlos y Javier Ignacio sigan siendo los dueños, y Luis Carlos el director. El diario nació de fusionar a los dos rivales de Pereira: una recomposición societaria aquí cambia el mapa del Risaralda entero.',
            },
        ],
    },

    'proclama-del-pacifico': {
        consultas: [
            {
                consulta: 'Luna Geller',
                vigila:
                    'Que Alfonso José Luna Geller siga dirigiéndolo. Propiedad y dirección son la misma persona, así que cualquier cosa que le pase a él le pasa a la ficha.',
            },
        ],
    },

    'choco-7-dias': {
        consultas: [
            {
                consulta: 'Cañadas',
                vigila:
                    'Que Iván Cañadas Garrido siga siendo propietario y editor. Además su ficha fue la que resolvió «fiscalizar al poder» como oficio y no como orientación, y ese criterio pasó al protocolo el 2026-08-18 como regla del polo fijo: era una de las cinco preguntas abiertas de la revisión externa y hoy es la norma del catálogo.',
            },
        ],
    },

    'el-manduco': {
        consultas: [
            {
                consulta: 'Díaz',
                vigila:
                    'Que los cuatro cargos de la cabecera sigan en la misma familia. Es el caso más nítido de medio familiar del catálogo, y toda la ficha descansa en esa coincidencia de apellido.',
            },
        ],
    },

    miputumayo: {
        consultas: [
            {
                consulta: 'Chamorro Burbano',
                vigila:
                    'Que Luis Carlos Chamorro Burbano siga al frente. Propiedad y dirección son la misma persona natural desde 2004.',
            },
        ],
    },

    'el-morichal': {
        consultas: [
            {
                consulta: 'Corporación El Morichal',
                vigila:
                    'Qué pasa con la corporación sin ánimo de lucro constituida en agosto de 2025. Es la tercera figura jurídica del medio en nueve años —dos anteriores liquidadas—, así que la actual no se da por estable.',
            },
            {
                consulta: 'Edwin Suárez',
                vigila: 'Que su director y cofundador siga siéndolo.',
            },
        ],
    },

    'vive-el-meta': {
        consultas: [
            {
                consulta: 'Grupo La Independencia',
                vigila:
                    'Su sociedad editora, declarada con NIT en tres páginas del propio sitio. Es lo único que se sabe de su propiedad: entró con `ownerType: null` a la espera del certificado de Villavicencio.',
            },
        ],
    },

    'lente-regional': {
        consultas: [
            {
                consulta: 'Sánchez Cardozo',
                vigila:
                    'Que Juan Pablo Sánchez Cardozo siga de director. Publica equipo con nombres y biografías pero no razón social ni NIT, así que las personas son toda la evidencia que hay.',
            },
        ],
    },

    'periodismo-publico': {
        consultas: [
            {
                consulta: 'Corporación Humanista',
                vigila:
                    'El vínculo con la entidad sin ánimo de lucro de Soacha en la que nació en 2009. Hay además una sociedad localizable, PERIODISMO PUBLICO SAS, y no consta cuál de las dos lo edita hoy.',
            },
        ],
    },

    'archipielago-press': {
        consultas: [
            {
                consulta: 'Radio Archipiélago',
                vigila:
                    'Su único vínculo institucional expuesto. La vía para cerrar su propiedad es la licencia de radiodifusión ante el MinTIC, porque una concesión sí tiene titular público.',
            },
        ],
    },

    'al-aire-noticias': {
        consultas: [
            {
                consulta: 'Al Aire Comunicar',
                vigila:
                    'La sociedad que reserva los derechos en su pie. Entró con `ownerType: null` esperando el certificado de la Cámara de Comercio de Arauca.',
            },
            {
                consulta: 'Miguel Matus',
                vigila: 'Que su CEO y director siga siéndolo. Es el único cargo con nombre que publica.',
            },
        ],
    },

    // ── Nacionales que sí se pueden preguntar ───────────────────────────────

    'noticias-uno': {
        consultas: [
            {
                consulta: 'Coronell',
                vigila:
                    'EL CONFLICTO ANOTADO EN SU PROPIA FICHA: Daniel Coronell tiene el 60,5 % de NTC Televisión y además preside la revista Cambio, que también está en el catálogo. Su ficha es de las que la revisión externa tiene que resolver —«no firmar»: mitad histórica, propiedad sin cerrar, cero corpus—.',
            },
        ],
    },

    'valora-analitik': {
        consultas: [
            {
                consulta: 'Valora Inversiones',
                vigila:
                    'Su sociedad editora, con NIT y domicilio en Medellín. La ficha afirma que no pertenece a ningún grupo: una entrada de capital se vería aquí.',
            },
            {
                consulta: 'Camilo Silva',
                vigila:
                    'Que uno de sus dos dueños fundadores siga de gerente. Y hay una tensión escrita: su valor de sesgo se calibró tomando «el de Portafolio», sin evidencia propia.',
            },
        ],
    },

    'casa-macondo': {
        consultas: [
            {
                consulta: 'Barrientos',
                vigila:
                    'Juan Pablo Barrientos dirige aquí la unidad investigativa y cofundó la Fundación Vorágine, que también está en el catálogo. Es un vínculo entre dos medios que hoy no está marcado como grupo.',
            },
        ],
    },

    volcanicas: {
        consultas: [
            {
                consulta: 'Hoja Blanca',
                vigila:
                    'La fundación que lo sostiene. Es de los poquísimos medios que declara su financiación con porcentajes, y ese detalle es el que sostiene su −0,50: si la composición cambia, el número se queda sin fundamento.',
            },
        ],
    },
};

/** Los medios vigilados, para que los informes y las pruebas no repitan la forma. */
export const MEDIOS_VIGILADOS = Object.keys(VIGILANCIA);
