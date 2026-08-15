/**
 * PROPIEDAD DE LOS MEDIOS — ESTRUCTURA Y CONTRATO
 * ===============================================
 *
 * Qué contiene y qué NO
 * ---------------------
 * Contiene el tipo de control de cada medio (conglomerado, familia regional,
 * público, independiente, internacional). Ese dato se deriva del campo `group`
 * que el catálogo ya afirma; no es una afirmación nueva.
 *
 * Contiene además, para 39 de los 40 medios del catálogo, quién los controla y
 * con qué otros negocios, cada afirmación con el enlace donde consta. La primera
 * tanda (once medios, 2026-07-29) se eligió por peso en lo que se publica; la
 * segunda completó el resto.
 *
 * LO QUE APARECE AL PONERLO JUNTO, y es el motivo de existir del archivo:
 *   · Ardila Lülle controla TRES: Noticias RCN, La FM y La República.
 *   · Prisa controla TRES: Caracol Radio, W Radio y El País (España).
 *   · Valorem/Santo Domingo controla TRES: El Espectador, Blu Radio y
 *     Noticias Caracol.
 *   · Gilinski controla DOS: Semana y El País (Cali).
 *   · Sarmiento Angulo controla DOS: El Tiempo y Portafolio.
 * Once de los medios que el lector ve como voces distintas son cinco dueños.
 *
 * Y DOS COLISIONES DE NOMBRE que un lector comete solo y el producto no puede
 * permitirse cometer:
 *   · Caracol Radio (Prisa) y Noticias Caracol (Santo Domingo) NO tienen
 *     ninguna relación de propiedad.
 *   · El País (Cali) es de Gilinski y El País (España) es de Prisa. Mismo
 *     nombre, dueños sin relación entre sí.
 *
 * DOS AFIRMACIONES SE CAYERON AL COMPROBARLAS, y conviene dejarlo escrito:
 *   · La compra de El Heraldo por el Grupo Gilinski se anunció en junio de 2023
 *     y se deshizo en agosto. Darla por hecha habría producido una
 *     concentración inventada, con nombres propios.
 *   · Que Galvis Ramírez fuera dueña de El Universal de Cartagena aparecía
 *     resumido así en una búsqueda. Al ir a las fuentes, su participación es del
 *     50 % junto a la familia Araujo: coposesión, no control. Está en la ficha y
 *     NO en el aviso de dueño compartido, que afirma pertenencia.
 * Es exactamente el fallo que la regla de citar existe para evitar.
 *
 * Lo que sigue vacío, y por qué
 * -----------------------------
 * Ya no queda ninguna ficha vacía. `colombia-informa` se documentó el
 * 2026-08-08 hasta donde llega lo público: razón social, NIT, financiación y
 * articulación con la ALBA de los Movimientos Sociales. Lo que sigue abierto es
 * un solo dato —QUIÉN la representa legalmente— y ya no por falta de rastro sino
 * por un trámite: el certificado del RUES con el NIT 900.408.141-8, que exige un
 * formulario manual. Es el único medio colombiano del catálogo cuyo hilo no
 * termina en una persona natural.
 *
 * Las 29 restantes sí terminan en alguien. Las institucionales incluidas: que el
 * dueño sea un partido, el Estado o una fundación no borra la pregunta, la
 * desplaza a un cargo, y el cargo lo ocupa alguien con nombre. Nombrar a los
 * accionistas de los grandes y callar a quien dirige el medio público habría
 * sido aplicar el escrutinio de forma desigual —justo el sesgo que este mapa
 * existe para no cometer—. Cuando la persona manda pero no posee, se dice.
 *
 * Son afirmaciones sobre personas y empresas reales e identificables. Escribir
 * "el dueño de X busca Y" sin poder enlazar dónde consta es exactamente lo que
 * este proyecto eliminó en la Fase 0, con el agravante de que aquí el sujeto
 * puede demandar. Mientras esté vacío la interfaz DECLARA LA AUSENCIA, igual que
 * hace con la cobertura que falta.
 *
 * CONTRATO (lo verifica `npm run check:registry`)
 * -----------------------------------------------
 *   · Todo medio del registro tiene aquí una entrada.
 *   · `ownerType` es uno de OWNER_TYPES.
 *   · Si `holdings` o `notes` traen contenido, `sources` NO puede estar vacío.
 *     Cada afirmación se publica con el enlace donde consta o no se publica.
 *   · `sources` son URLs de documentos consultables: registros mercantiles,
 *     informes de la FLIP o Reporteros sin Fronteras, investigaciones
 *     publicadas, comunicados del propio medio. No vale "es sabido".
 *   · `controlGroup` solo se pone cuando el grupo CONTROLA el medio. Una
 *     participación del 50 % sin mayoría se documenta en `holdings` y no genera
 *     aviso: el aviso dice «pertenecen a», y eso sería sobreafirmar.
 */

/** Tipos de control. La pregunta que responden: ¿ante quién responde la sala de redacción? */
export const OWNER_TYPES = {
    conglomerado: {
        label: 'Conglomerado económico',
        description:
            'Controlado por un grupo con intereses mayoritarios en otros sectores (banca, ' +
            'construcción, bebidas, infraestructura). La cobertura de esos sectores es donde ' +
            'un conflicto de interés se haría visible.',
    },
    familiar: {
        label: 'Propiedad familiar regional',
        description:
            'Controlado por una familia, casi siempre con arraigo en su región. Sus intereses ' +
            'suelen estar en la política local antes que en un sector económico concreto.',
    },
    publico: {
        label: 'Medio público',
        description:
            'Financiado por el Estado. Su línea editorial tiende a seguir al gobierno de turno, ' +
            'lo que hace que su clasificación de sesgo sea la más volátil del catálogo.',
    },
    independiente: {
        label: 'Independiente / sin ánimo de lucro',
        description:
            'Financiado por donaciones, membresías o cooperación internacional. El conflicto de ' +
            'interés, cuando existe, viene de quién financia, no de quién posee.',
    },
    internacional: {
        label: 'Medio internacional',
        description:
            'Con sede fuera de Colombia. Cubre el país desde una agenda editorial extranjera.',
    },
};

/**
 * DISTINTIVO VISUAL: LA NATURALEZA DEL INTERÉS PRIMERO, EL ORIGEN DE APELLIDO.
 *
 * La pregunta que el lector quiere responder de un vistazo es «¿este medio
 * responde a un interés económico o hace periodismo independiente?». `ownerType`
 * no la contestaba: repartía en cinco cajones donde tres —conglomerado, familiar
 * e internacional— son la misma respuesta con distinto alcance.
 *
 * Así que el distintivo se invierte (decisión de Jose, 2026-08-08): manda
 * **Grupo económico**, y el origen —nacional, regional, internacional— queda de
 * apellido. `publico` e `independiente` se quedan solos porque sí responden otra
 * cosa.
 *
 * LO QUE ESTO AFIRMA Y LO QUE NO, porque la diferencia es la que sostiene el
 * cambio. NO se está diciendo que las familias dueñas de diarios regionales
 * tengan negocios ocultos en otros sectores: eso seguiría sin fuente y no se
 * publica. Lo que se dice es que **controlar la empresa que publica un diario ya
 * es un interés económico**, y eso consta en la ficha de cada uno. Es un cambio
 * de qué cuenta como grupo económico, no una afirmación sobre patrimonios que no
 * se pueden documentar.
 *
 * Donde SÍ hay negocios en otros sectores documentados, están en `holdings` con
 * su fuente, que es donde deben leerse.
 *
 * `enfasis` resalta grupo económico e independiente, los dos polos de la
 * pregunta. La interfaz decide cómo se ven; este archivo solo dice cuáles son.
 *
 * `icono` es el nombre del componente de lucide-react. Se declara aquí, junto al
 * tipo, para que no acabe habiendo un mapa de iconos distinto en cada pantalla
 * que muestre esto.
 */
export const OWNER_BADGES = {
    conglomerado: {
        icono: 'Building2',
        familia: 'Grupo económico',
        apellido: 'nacional',
        enfasis: true,
        explica:
            'Controlado por un grupo con intereses mayoritarios en otros sectores y alcance ' +
            'nacional.',
    },
    familiar: {
        icono: 'Building2',
        familia: 'Grupo económico',
        apellido: 'regional',
        enfasis: true,
        explica:
            'Controlado por una familia o sociedad con arraigo en su región. Sigue siendo un ' +
            'interés económico: quien controla la empresa que publica el diario lo posee como ' +
            'activo. Si además tiene negocios en otros sectores, consta en «holdings».',
    },
    internacional: {
        icono: 'Building2',
        familia: 'Grupo económico',
        apellido: 'internacional',
        enfasis: true,
        explica:
            'Controlado desde fuera de Colombia. «Internacional» dice DÓNDE está el dueño, no ' +
            'qué es: el Grupo Prisa, por ejemplo, lo controla un banquero de inversión.',
    },
    independiente: {
        icono: 'Sprout',
        familia: 'Independiente',
        apellido: null,
        enfasis: true,
        explica:
            'Sin dueño que lo posea como activo económico: vive de donaciones, membresías o ' +
            'cooperación. El conflicto de interés, si existe, viene de quién financia.',
    },
    publico: {
        icono: 'Landmark',
        familia: 'Público',
        apellido: null,
        enfasis: false,
        explica: 'Financiado por el Estado. Su línea tiende a seguir al gobierno de turno.',
    },
};

/**
 * Distintivo de un medio, o `null` si su propiedad no está documentada.
 *
 * DEVUELVE `null` Y NO UN TIPO POR OMISIÓN. Un medio sin ficha verificada no es
 * «independiente por defecto» ni «grupo económico por defecto»: es un medio del
 * que todavía no se ha comprobado nada, y la interfaz tiene que poder decirlo.
 * Rellenarlo con una suposición sería exactamente la clase de afirmación sin
 * fuente que el resto de este archivo existe para impedir.
 *
 * @param {string} mediaId
 */
export function getOwnerBadge(mediaId) {
    if (!hasDocumentedOwnership(mediaId)) return null;
    const ficha = getOwnership(mediaId);
    const distintivo = OWNER_BADGES[ficha?.ownerType];
    if (!distintivo) return null;
    return {
        tipo: ficha.ownerType,
        ...distintivo,
        // Texto ya compuesto, para que ninguna pantalla decida cómo se une la
        // familia con su apellido y acaben viéndose distinto en dos sitios.
        corto: distintivo.apellido
            ? `${distintivo.familia} · ${distintivo.apellido}`
            : distintivo.familia,
        label: OWNER_TYPES[ficha.ownerType]?.label,
    };
}

/*
 * Aquí vivía `pending()`, la ficha vacía explícita para los medios que aún no
 * se habían documentado. El 2026-08-08 se quedó sin usos —ninguna ficha del
 * catálogo está vacía ya— y el linter lo señaló. Se retira en vez de silenciarlo:
 * si algún día entra un medio nuevo sin documentar, que el hueco se note al
 * escribirlo y no se rellene con una plantilla cómoda.
 *
 * La forma de una ficha, para quien añada una:
 *   ownerType    uno de OWNER_TYPES, o `null` — ver AUSENCIA DECLARADA abajo.
 *   controlGroup clave de CONTROL_GROUPS. Es lo que enlaza con las personas.
 *   holdings     otros negocios del grupo. Requiere `sources`.
 *   notes        señalamientos, sanciones o conflictos. Requiere `sources`.
 *   sources      URLs consultables. Sin esto, lo de arriba no se publica.
 *   verifiedAt   fecha de comprobación documental. null = nadie lo ha mirado.
 *   consultadoEl fecha en que se BUSCÓ. Obligatoria si `ownerType` es null.
 *   buscadoEn    dónde se buscó y qué dio. Obligatoria si `ownerType` es null.
 *   falta        qué documento cerraría el hueco.
 */

/**
 * AUSENCIA DECLARADA — «no sabemos de quién es, y aquí está cuándo lo buscamos».
 *
 * POR QUÉ EXISTE (2026-08-11, decisión de Jose). Hasta hoy el catálogo tenía una
 * sola forma de tratar un medio del que no se sabe quién manda: no darlo de
 * alta. Es la regla que dejó fuera a EL DIARIO de Boyacá, a Vive el Meta y a
 * Lente Regional, y la que estuvo a punto de dejar fuera a La Razón de Montería
 * —tres medios vivos, con feed, en departamentos que el mapa dibuja en blanco—.
 *
 * El coste de esa regla estaba mal repartido. Al lector le decíamos «aquí no hay
 * medios» cuando lo cierto era «aquí no hemos podido comprobar de quién son», y
 * esas dos frases no significan lo mismo ni de lejos. La primera describe el
 * territorio; la segunda describe nuestro trabajo.
 *
 * Así que `ownerType: null` pasa a ser un estado de primera clase, y NO es
 * volver a la ficha vacía que se retiró: una ficha vacía no afirmaba nada, y
 * esta afirma tres cosas comprobables —dónde se buscó, qué día, y qué documento
 * cerraría el hueco—. La ausencia deja de ser un silencio y pasa a ser un dato
 * con fecha, que es lo mismo que ya hacemos con la cobertura que falta.
 *
 * LA FECHA NO ES DECORACIÓN. «No consta el representante legal» sin fecha es una
 * afirmación sobre el mundo, y envejece mal: mañana pueden registrarlo. Con
 * fecha es una afirmación sobre una consulta concreta, que es lo único que
 * podemos sostener, y le dice al lector cuánto tiempo lleva sin revisarse.
 *
 * @param {string} mediaId
 * @returns {{consultadoEl: string|null, buscadoEn: Array<{fuente: string, resultado: string, url?: string}>, falta: string[]}|null}
 */
export function ausenciaDeclarada(mediaId) {
    const ficha = getOwnership(mediaId);
    if (!ficha || ficha.ownerType !== null) return null;

    return {
        consultadoEl: ficha.consultadoEl ?? null,
        buscadoEn: ficha.buscadoEn ?? [],
        falta: ficha.falta ?? [],
    };
}

/**
 * Medios cuya propiedad está declarada como no comprobada, en orden de catálogo.
 *
 * Lo usa la vista de fichas para contar el hueco en voz alta en vez de dejar que
 * el lector lo descubra medio por medio.
 *
 * @param {Array<{id: string}>} medios
 */
export function conAusenciaDeclarada(medios) {
    return (Array.isArray(medios) ? medios : []).filter((m) => ausenciaDeclarada(m?.id));
}

/** Fecha de la documentación. */
const VERIFICADO = '2026-07-29';

/**
 * Segunda tanda: VOZ y RAYA, documentadas el 2026-08-02.
 *
 * Llevan fecha propia porque sus fichas se rehicieron enteras. Las que traían
 * citaban cuatro URL que no existen —dos páginas «quiénes somos» inventadas y
 * dos fichas de un Media Ownership Monitor cuyo estudio es de 2017, anterior a
 * la fundación de RAYA—, y aun así estaban marcadas como verificadas. Firmar
 * una comprobación que no se hizo es peor que no firmarla: el lector que pulsa
 * y encuentra un 404 ya no tiene motivo para creerse las otras cuarenta.
 */
const VERIFICADO_AGO = '2026-08-02';

/**
 * GRUPOS DE CONTROL — el dueño como dato, no como prosa.
 *
 * Las fichas describen en texto quién controla cada medio, y eso sirve para
 * leerlo pero no para calcularlo. Para poder avisar «dos de los medios que
 * cubren esto responden ante el mismo dueño» hace falta que el dueño sea un
 * identificador comparable. Esto es ese identificador.
 *
 * `sectores` son los otros negocios del grupo, y están AQUÍ y no en el texto
 * porque son la base de lo siguiente: señalar cuándo un medio informa sobre el
 * sector del que vive su dueño. Solo se listan los que constan en las fuentes
 * de la ficha; los que no se han documentado quedan vacíos en vez de supuestos.
 */
/**
 * `personas` — HASTA QUIÉN LLEGA EL HILO (2026-08-08, pedido de Jose).
 *
 * Un nombre de grupo no dice nada por sí solo: «Valorem» o «Grupo Gilinski» son
 * vehículos, y detrás hay personas naturales que sí toman decisiones. Tirar del
 * hilo hasta ellas es lo que convierte el mapa de propiedad en información
 * utilizable.
 *
 * TRES CAUTELAS, y las tres importan porque aquí se nombra a gente real:
 *
 *   · Cada persona lleva su fuente. Sin enlace consultable no entra, igual que
 *     el resto de este archivo.
 *   · Se nombra el CONTROL, no el patrimonio. «Preside la junta» o «es el
 *     accionista mayoritario» es un hecho societario documentado; «es el dueño
 *     real» sería una interpretación.
 *   · Donde el control es familiar y no hay una cabeza única documentada, se
 *     dice así en vez de elegir a uno. Señalar a una persona concreta cuando la
 *     fuente habla de una familia sería sobreafirmar.
 *
 * `desde` es la fecha del hecho que la fuente documenta, no la de consulta.
 */
export const CONTROL_GROUPS = {
    gilinski: {
        label: 'Grupo Gilinski',
        sectores: ['banca', 'alimentos'],
        personas: [
            {
                nombre: 'Jaime Gilinski Bacal',
                papel: 'Preside el conglomerado financiero que compró el 100 % de Publicaciones Semana.',
                desde: '2020-11',
                fuentes: [
                    'https://www.larepublica.co/empresas/el-grupo-gilinski-compro-50-de-la-revista-semana-2822114',
                    'https://www.elcolombiano.com/colombia/grupo-gilinski-ahora-es-dueno-de-todas-las-acciones-del-grupo-semana-IB14048303',
                ],
            },
            {
                nombre: 'Gabriel Gilinski Kardonski',
                papel: 'Accionista mayoritario del Grupo Semana; la familia lo designó para llevar el medio.',
                desde: '2020-11',
                fuentes: ['https://forbes.co/2020/11/11/negocios/gabriel-gilinski-el-millonario-que-se-quedo-con-semana-y-va-por-nutresa/'],
            },
        ],
    },
    valorem: {
        label: 'Valorem — familia Santo Domingo',
        sectores: ['retail', 'logística', 'transporte', 'entretenimiento', 'industria', 'inmobiliario', 'turismo'],
        personas: [
            {
                nombre: 'Alejandro Santo Domingo Dávila',
                papel:
                    'Preside la junta directiva de Valorem y encabeza las inversiones de la familia ' +
                    'desde la muerte de su padre, Julio Mario Santo Domingo.',
                desde: '2011',
                fuentes: [
                    'https://lasillavacia.com/quienesquien/perfilquien/alejandro-santo-domingo-davila',
                    'https://forbes.co/2025/04/11/editors-picks/los-santo-domingo-un-imperio-que-crece/',
                ],
            },
        ],
    },
    'ardila-lulle': {
        label: 'Organización Ardila Lülle',
        sectores: ['bebidas', 'azúcar', 'textiles', 'deporte'],
        personas: [
            {
                nombre: 'Carlos Julio Ardila Gaviria',
                papel:
                    'Preside la Organización Ardila Lülle tras la muerte de su padre, Carlos Ardila ' +
                    'Lülle, en 2021. Es el heredero que ha concentrado su interés en los medios.',
                desde: '2021',
                fuentes: [
                    'https://www.produ.com/perfiles/carlos-julio-ardila-presidente-de-organizacion-ardila-lulle/',
                    'https://forbes.co/2021/08/13/empresas/los-herederos-de-carlos-ardila-lulle/',
                ],
            },
            {
                nombre: 'Antonio José, María Eugenia y María Emma Ardila Gaviria',
                papel: 'Coherederos del grupo junto a Carlos Julio; el control es familiar, no de una sola persona.',
                desde: '2021',
                fuentes: ['https://www.bloomberglinea.com/2021/08/13/los-herederos-de-la-fortuna-de-us2200-millones-del-empresario-carlos-ardila-lulle/'],
            },
        ],
    },
    prisa: {
        label: 'Grupo Prisa',
        sectores: ['educación editorial'],
        personas: [
            {
                nombre: 'Joseph Oughourlian',
                papel:
                    'Banquero de inversión, fundador del fondo Amber Capital; controla el Grupo Prisa, ' +
                    'que a su vez controla Caracol Radio y W Radio.',
                desde: '2003',
                // Ya constaba en la ficha de Caracol Radio; se sube aquí para que
                // el hilo se lea desde el grupo y no solo desde un medio suelto.
                fuentes: ['https://colombia.mom-gmr.org/es/proprietarios/companies-database/'],
            },
        ],
    },
    'sarmiento-aval': {
        label: 'Luis Carlos Sarmiento Angulo — Grupo Aval',
        sectores: ['banca', 'construcción', 'infraestructura'],
        personas: [
            {
                nombre: 'Luis Carlos Sarmiento Angulo',
                papel:
                    'Compró Casa Editorial El Tiempo en 2012 y es el mayor accionista y presidente ' +
                    'del Grupo Aval, el mayor conglomerado financiero del país.',
                desde: '2012',
                fuentes: ['https://colombia.mom-gmr.org/es/proprietarios/companies-database/'],
            },
        ],
    },

    // Los grupos independientes llevan sus `personas` más abajo, junto a su
    // definición original.
    'infobae-hadad': {
        label: 'Daniel Hadad — Grupo Infobae',
        sectores: ['radio', 'televisión'],
    },
    'el-colombiano-accionistas': {
        label: 'Quince empresarios antioqueños y la familia Gómez Martínez',
        // Los sectores salen de las empresas que los propios accionistas
        // dirigen, nombradas en las crónicas de la operación. Es el caso más
        // claro de por qué «familiar regional» escondía información: el 51 % lo
        // tienen constructoras, comercio y textiles.
        sectores: ['construcción', 'comercio', 'textiles', 'agroindustria', 'inmobiliario'],
        personas: [
            {
                nombre: 'Manuel Santiago Mejía Correa',
                papel: 'Cabeza del grupo Corbeta (Alkosto, Ktronix); uno de los dos que encabezaron la compra.',
                desde: '2022-02',
                fuentes: [
                    'https://www.las2orillas.co/quienes-son-los-empresarios-antioquenos-que-se-quedaron-con-el-colombiano/',
                    'https://www.lasillavacia.com/quien-es-quien/manuel-santiago-mejia-correa/',
                ],
            },
            {
                nombre: 'Pedro Estrada',
                papel: 'Grupo Escala, expresidente de Compañía de Empaques; coencabezó la operación.',
                desde: '2022-02',
                fuentes: ['https://forbes.co/2022/02/04/actualidad/asi-fue-el-negocio-por-el-periodico-el-colombiano'],
            },
            {
                nombre:
                    'Juan Luis Aristizábal (Conconcreto), Francisco Martínez Restrepo (Arquitectura y ' +
                    'Concreto), Luis Fernando Restrepo Echavarría (Crystal), Carlos Eduardo Mesa ' +
                    '(Premex), Juan Carlos González Jaramillo (Acierto), Juan Manuel del Corral ' +
                    '(Cadena), Josefina Trujillo de Agudelo (TTC) y Londoño Gómez',
                papel:
                    'Resto del grupo de quince que tomó el 51 % en febrero de 2022. Sus empresas están ' +
                    'en construcción, comercio, textiles, agroindustria e inmobiliario.',
                desde: '2022-02',
                fuentes: [
                    'https://www.bluradio.com/nacion/grupo-de-15-empresarios-antioquenos-compra-mayoria-de-acciones-del-periodico-el-colombiano',
                    'https://www.larepublica.co/empresas/un-grupo-de-inversionistas-paisas-comprarian-51-del-periodico-local-de-medellin-3297296',
                ],
            },
            {
                nombre: 'Familia Gómez Martínez',
                papel: 'Dueña única entre 2019 y 2022; conserva una participación minoritaria.',
                desde: '2022-02',
                fuentes: ['https://forbes.co/2022/02/04/actualidad/asi-fue-el-negocio-por-el-periodico-el-colombiano'],
            },
        ],
    },
    /**
     * DIRIGIR NO ES POSEER, y en los diarios regionales confundirlo es fácil.
     *
     * Al buscar quién encabeza hoy Vanguardia aparecen los nombres de sus
     * directores de 2025. No entran aquí: la dirección de un periódico es un
     * cargo editorial y esta lista responde a quién lo POSEE. Meter a un
     * director en la cadena de propiedad sería atribuirle un control que no
     * tiene, y a la vez tapar al dueño real.
     */
    'el-heraldo-familias': {
        label: 'Familias Manotas, Pumarejo y Fernández',
        sectores: [],
        personas: [
            {
                nombre: 'Familias Manotas, Pumarejo y Fernández',
                papel:
                    'Un tercio de las acciones cada una. Descienden de los fundadores de 1933: ' +
                    'Alberto Pumarejo, Luis Eduardo Manotas y Juan B. Fernández Ortega.',
                desde: '1933',
                fuentes: ['https://www.pulzo.com/economia/duenos-heraldo-cuales-tres-familias-que-mandan-ese-periodico-PP2729022'],
            },
            {
                // El reparto en tercios es justo lo que impide señalar a una
                // cabeza: ninguna familia tiene mayoría por sí sola.
                nombre: 'Cabeza única: no la hay',
                papel:
                    'Con las acciones repartidas en tres tercios iguales, ninguna familia controla ' +
                    'sola. Nombrar a una persona sería inventarle una mayoría que no tiene.',
                desde: null,
                fuentes: [],
            },
        ],
    },

    // ── Familias regionales ─────────────────────────────────────────────────
    galvis: {
        label: 'Familia Galvis — Galvis Ramírez y Cía',
        sectores: [],
        personas: [
            {
                nombre: 'Descendientes de Alejandro Galvis Galvis',
                papel:
                    'Fundó el diario en Bucaramanga en 1919 y sigue en manos de su familia, a través ' +
                    'de Galvis Ramírez y Cía S.A. La misma familia entró en 1980 con el 50 % de ' +
                    'Editora del Mar (El Universal) y adquirió El Nuevo Día de Ibagué.',
                desde: '1919',
                fuentes: ['https://en.wikipedia.org/wiki/Vanguardia_(Colombian_newspaper)'],
            },
            {
                nombre: 'Alejandro Galvis Ramírez',
                papel:
                    'Principal impulsor del diario hasta su muerte. Quién encabeza la sociedad ' +
                    'después NO está documentado: los nombres que circulan son de la dirección ' +
                    'editorial, que es otro cargo.',
                desde: null,
                fuentes: ['https://www.vanguardia.com/area-metropolitana/bucaramanga/fallecio-alejandro-galvis-ramirez-presidente-corporativo-de-vanguardia-BN3294298'],
            },
        ],
    },
    'restrepo-la-patria': {
        label: 'Familia Restrepo',
        sectores: [],
        personas: [
            {
                nombre: 'Nicolás Restrepo Escobar',
                papel:
                    'Encabeza el diario, tercera generación de la familia. José Restrepo Restrepo lo ' +
                    'adquirió en 1940 y Luis José Restrepo lo dirigió desde 1973.',
                desde: '1940',
                fuentes: ['https://www.las2orillas.co/la-batalla-de-diez-familias-por-no-dejar-morir-sus-periodicos-impresos/'],
            },
        ],
    },
    'uribe-vegalara': {
        label: 'Familia Uribe Vegalara',
        sectores: [],
        personas: [
            {
                nombre: 'Juan Pablo Uribe y Elvira Vegalara',
                papel: 'Sostienen económicamente el diario desde 1990.',
                desde: '1990',
                fuentes: ['https://www.las2orillas.co/quienes-son-los-duenos-de-periodicos-regionales-que-no-dan-plata-pero-si-poder/'],
            },
            {
                nombre: 'Juan Gabriel Uribe Vegalara',
                papel: 'Hijo de los anteriores; dirige el diario.',
                desde: null,
                fuentes: ['https://www.las2orillas.co/quienes-son-los-duenos-de-periodicos-regionales-que-no-dan-plata-pero-si-poder/'],
            },
        ],
    },
    catalitico: {
        label: 'Grupo Empresarial Catalítico',
        sectores: ['tecnología', 'mercadeo'],
        personas: [
            {
                nombre: 'Cristian Verbel',
                papel:
                    'Director del grupo, que compró el 100 % del diario. Catalítico opera negocios de ' +
                    'tecnología y mercadeo en Estados Unidos, Bogotá, Cali y Barranquilla.',
                desde: '2024-02-01',
                fuentes: [
                    'https://www.lasillavacia.com/en-vivo/grupo-empresarial-catalitico-compra-el-diario-la-opinion-de-cucuta/',
                    'https://www.larepublica.co/empresas/grupo-empresarial-catalitico-comprara-el-diario-la-opinion-de-cucuta-3789641',
                ],
            },
            {
                // Se dice lo que NO se sabe, en vez de dejar el hilo colgando
                // sin explicación: es el hueco concreto que habría que cerrar.
                nombre: 'Socios del grupo: sin documentar',
                papel:
                    'La prensa que cubrió la operación nombra al director, pero no a los accionistas ' +
                    'de Catalítico. Cerrarlo exige el registro mercantil.',
                desde: null,
                fuentes: [],
            },
        ],
    },
    'lopez-escauriaza-araujo': {
        label: 'Familias fundadoras, familia Araujo y Galvis Ramírez (Editora del Mar)',
        sectores: ['hotelería'],
        personas: [
            {
                nombre: 'Domingo López Escauriaza y Eduardo Ferrer Ferrer',
                papel: 'Cuñados y socios; fundaron el diario en 1948. Lo publica Editora del Mar S.A.',
                desde: '1948',
                fuentes: ['https://es.wikipedia.org/wiki/El_Universal_(Colombia)'],
            },
            {
                nombre: 'Alejandro Galvis Ramírez',
                papel:
                    'Entró en 1980 con el 50 % de Editora del Mar. Es la misma familia dueña de ' +
                    'Vanguardia, en este catálogo. El otro 50 % quedó en socios locales, así que ' +
                    'ninguno de los dos bloques tiene mayoría y NO cuenta como dueño compartido en ' +
                    'los avisos del sitio.',
                desde: '1980',
                fuentes: ['https://es.wikipedia.org/wiki/El_Universal_(Colombia)'],
            },
        ],
    },

    // ── Colombia: independientes y público ──────────────────────────────────
    'estado-colombiano': {
        label: 'Estado colombiano',
        sectores: [],
        // Una institución no diluye la pregunta, solo la desplaza: aquí el hilo
        // no termina en un accionista sino en un cargo, y el cargo lo ocupa
        // alguien con nombre. Callarlo mientras nombramos a los Santo Domingo
        // sería aplicar el escrutinio de forma desigual.
        personas: [
            {
                nombre: 'Hollman Felipe Morris Rincón',
                papel:
                    'Gerente general. Dirige, no posee: el dueño es el Estado y quien lo designa es ' +
                    'el presidente de la República. Es además una figura política —fue candidato a la ' +
                    'Alcaldía de Bogotá por Colombia Humana en 2019—, un dato que en el medio público ' +
                    'pesa más que en cualquier otro del catálogo.',
                desde: '2024-04-05',
                fuentes: [
                    'https://www.inravision.gov.co/quienes-somos/perfiles-directivos',
                    'https://en.wikipedia.org/wiki/Hollman_Morris',
                ],
            },
            {
                nombre: 'El presidente de la República en ejercicio',
                papel:
                    'Titular del control efectivo: designa al gerente a través del MinTIC. No se ' +
                    'nombra aquí a una persona concreta a propósito, porque el cargo cambió de manos ' +
                    'el 7 de agosto de 2026 y el catálogo no debe envejecer con el gobierno de turno.',
                desde: null,
                fuentes: ['https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=82339'],
            },
        ],
    },
    // En estos el hilo siempre fue corto —las personas estaban en el `label`
    // desde el principio— y por eso pasó desapercibido que se leía distinto que
    // en los grupos grandes. Se suben al mismo campo para que la pregunta «¿en
    // quién termina?» se responda igual en todo el mapa. Las fuentes son las que
    // ya traía la ficha de cada medio.
    'la-silla-socios': {
        label: 'Juanita León y socios de La Silla Vacía',
        sectores: [],
        personas: [{
            nombre: 'Juanita León',
            papel: 'Periodista, socia fundadora y directora desde el origen del medio.',
            desde: '2009',
            fuentes: ['https://www.lasillavacia.com/que-es-la-silla-vacia/'],
        }],
    },
    'valora-fundadores': {
        label: 'Camilo Silva y Alejandro Montoya — Valora Inversiones S.A.S.',
        /*
         * `sectores` lleva los negocios del dueño AJENOS al medio, que es donde
         * se buscaría un conflicto. Aquí el otro negocio no es ajeno: es una
         * plataforma de pago de información bursátil sobre las mismas emisoras
         * que la redacción cubre, bajo la misma sociedad. Se declara como sector
         * propio y se explica en las notas de la ficha.
         */
        sectores: ['información financiera'],
        personas: [
            {
                nombre: 'Camilo Silva',
                papel: 'Cofundador y gerente de Valora Inversiones S.A.S., la sociedad que publica Valora Analitik.',
                desde: '2015-01-20',
                fuentes: [
                    'https://es.wikipedia.org/wiki/Valora_Analitik',
                    'https://www.datacreditoempresas.com.co/directorio/valora-inversiones-sas.html',
                ],
            },
            {
                nombre: 'Alejandro Montoya',
                papel: 'Cofundador y CFO de Valora Inversiones S.A.S.',
                desde: '2015-01-20',
                fuentes: ['https://es.wikipedia.org/wiki/Valora_Analitik'],
            },
        ],
    },
    'el-escarbabajo': {
        label: 'Diana Salinas y Claudia Báez — El Escarbabajo SAS',
        sectores: [],
        personas: [
            {
                nombre: 'Diana Salinas',
                papel: 'Periodista; 66,37 % de El Escarbabajo SAS, la empresa que publica Cuestión Pública.',
                desde: '2018-03-06',
                fuentes: ['https://cuestionpublica.com/nosotros/'],
            },
            {
                nombre: 'Claudia Báez',
                papel: 'Periodista; 33,33 % de El Escarbabajo SAS.',
                desde: '2018-03-06',
                fuentes: ['https://cuestionpublica.com/nosotros/'],
            },
        ],
    },
    'ntc-television': {
        label: 'NTC Televisión — Daniel Coronell',
        sectores: [],
        personas: [
            {
                nombre: 'Daniel Coronell',
                papel:
                    'Accionista mayoritario de NTC Televisión con el 60,5 %, la empresa que produce ' +
                    'el noticiero. ATENCIÓN: es además presidente de la revista Cambio, que aparece ' +
                    'igualmente en este catálogo. Es la única persona con posición de control o ' +
                    'dirección en dos medios del mapa.',
                desde: null,
                fuentes: ['https://www.las2orillas.co/el-gringo-dueno-de-canal-1-que-le-dio-la-espalda-a-noticias-uno-de-daniel-coronell/'],
            },
            {
                nombre: 'María Cristina Uribe',
                papel: 'Periodista, esposa de Coronell; 3,5 % de NTC Televisión.',
                desde: null,
                fuentes: ['https://www.las2orillas.co/el-gringo-dueno-de-canal-1-que-le-dio-la-espalda-a-noticias-uno-de-daniel-coronell/'],
            },
            {
                // Se nombra para que quede claro que NO es dueño: el noticiero
                // lleva su firma editorial y confundir dirección con propiedad
                // es el error que este archivo evita en los regionales.
                nombre: 'Ignacio Gómez — dirige, no posee',
                papel: 'Director del noticiero desde 2024. Cargo editorial, sin participación documentada.',
                desde: '2024',
                fuentes: ['https://es.wikipedia.org/wiki/Noticias_Uno'],
            },
        ],
    },
    'voragine-fundacion': {
        label: 'Fundación Vorágine Periodismo Contracorriente',
        sectores: [],
        personas: [{
            nombre: 'Juan Pablo Barrientos, Francisco Escobar, José Guarnizo y Laila Abu Shihab',
            papel: 'Periodistas fundadores de la fundación sin ánimo de lucro, con capital propio.',
            desde: '2020-06-01',
            fuentes: ['https://voragine.co/nosotros/'],
        }],
    },
    'razon-publica-fundacion': {
        label: 'Fundación Razón Pública',
        sectores: [],
        personas: [
            {
                nombre: 'Hernando Gómez Buendía',
                papel:
                    'Fundador, director y editor general. En una fundación sin ánimo de lucro nadie ' +
                    'se reparte utilidades, pero la dirección editorial sí recae en una persona, y ' +
                    'aquí lleva el mismo nombre desde 2008.',
                desde: '2008',
                fuentes: ['https://razonpublica.com/que-es-razon-publica/'],
            },
            {
                nombre:
                    'Consejo editorial: Armando Montenegro, Salomón Kalmanovitz, Eduardo Cifuentes, ' +
                    'Marco Palacios y Alfredo Sarmiento, entre otros',
                papel:
                    'Orientan la línea sin poseerla. Vale nombrarlos porque varios vienen de la alta ' +
                    'función pública y de la ortodoxia económica —Montenegro dirigió el DNP, Cifuentes ' +
                    'fue magistrado de la Corte Constitucional—, lo que matiza la etiqueta de ' +
                    '«independiente» sin desmentirla.',
                desde: null,
                fuentes: ['https://razonpublica.com/que-es-razon-publica/'],
            },
        ],
    },
    'cambio-inversionistas': {
        label: 'Inversionistas de Cambio — Lara Salive, Silva Luján y Armitage',
        sectores: ['siderurgia'],
        personas: [
            {
                nombre: 'Patricia Lara Salive, Gabriel Silva Luján y Maurice Armitage',
                papel:
                    'Compraron los derechos de publicación en 2021 y relanzaron la revista. Silva Luján ' +
                    'fue ministro de Defensa; Armitage, alcalde de Cali y empresario siderúrgico.',
                desde: '2021-09',
                fuentes: ['https://es.wikipedia.org/wiki/Cambio_(revista)'],
            },
            {
                nombre: 'Daniel Coronell',
                papel:
                    'Periodista, presidente del medio. Sostiene públicamente que «los accionistas no ' +
                    'son los dueños de la información».',
                desde: '2022-02',
                fuentes: ['https://latamjournalismreview.org/es/articles/los-accionistas-no-son-los-duenos-de-la-informacion-dice-daniel-coronell-presidente-de-la-resucitada-revista-cambio-de-colombia/'],
            },
        ],
    },
    'kienyke-bernal': {
        label: 'Adriana Bernal Salgado — Kieneskien Editorial',
        sectores: ['seguros'],
        personas: [{
            nombre: 'Adriana Bernal Salgado',
            papel:
                'Dueña absoluta: 89,9 % vía Kieneskien Casa Editorial y 10,2 % a su nombre. Su ' +
                'negocio principal está en los seguros (Red Assist).',
            desde: '2010',
            fuentes: [
                'http://colombia.mom-gmr.org/es/media/detail/outlet/kienykecom/',
                'https://www.lasillavacia.com/silla-nacional/el-quien-y-que-detras-de-kienykecom/',
            ],
        }],
    },
    'pcc-partido': {
        label: 'Partido Comunista Colombiano (PCC)',
        sectores: [],
        personas: [
            {
                nombre: 'Jaime Caycedo Turriago',
                papel:
                    'Secretario general del partido, que es el propietario del semanario. Miembro del ' +
                    'comité central desde 1971. El control editorial es del partido, no suyo a título ' +
                    'personal, pero la línea del semanario responde a la dirección que él encabeza.',
                desde: null,
                fuentes: ['https://pacocol.org/secretario/'],
            },
            {
                nombre: 'Zabier Hernández Buelvas',
                papel: 'Director del semanario. Dirige, no posee.',
                desde: '2023',
                fuentes: ['https://es.wikipedia.org/wiki/Semanario_Voz'],
            },
        ],
    },
    'colombia-informa-corporacion': {
        label: 'Corporación Colombia Informa',
        sectores: [],
        // Único grupo del catálogo colombiano sin una sola persona identificada.
        // No es un descuido nuestro: el medio publica bajo autoría colectiva
        // («Equipo Editor Nacional», «Editora Bogotá») y no divulga dirección.
        // Lo que sí conseguimos es la puerta para averiguarlo —ver `personas`—,
        // así que esto pasa de «sin documentar» a «pendiente con procedimiento».
        personas: [{
            nombre: 'Sin identificar — falta el certificado del RUES',
            papel:
                'La razón social es Corporación Colombia Informa, NIT 900.408.141-8, con domicilio ' +
                'en Bogotá. Su representante legal es público por ley y consultable en el RUES con ' +
                'ese NIT; el trámite exige un formulario que no se puede automatizar. Hasta tenerlo ' +
                'en la mano no se escribe ningún nombre aquí.',
            desde: null,
            fuentes: ['https://www.colombiainforma.info/somos/', 'https://www.rues.org.co/'],
        }],
    },
    'casamacondo-direccion': {
        label: 'CasaMacondo — su equipo directivo',
        sectores: [],
        personas: [
            {
                nombre: 'Christopher Tibble',
                papel: 'Director general.',
                desde: null,
                fuentes: ['https://casamacondo.co/somos/'],
            },
            {
                nombre: 'José Alejandro Castaño',
                papel: 'Editor general.',
                desde: null,
                fuentes: ['https://casamacondo.co/somos/'],
            },
            {
                nombre: 'Juan Pablo Barrientos',
                papel:
                    'Dirige la unidad investigativa. ATENCIÓN: es también uno de los cuatro ' +
                    'periodistas fundadores de la Fundación Vorágine, que está en este mismo ' +
                    'catálogo. Segundo caso de una persona con papel en dos medios nuestros, ' +
                    'después de Daniel Coronell.',
                desde: null,
                fuentes: ['https://casamacondo.co/somos/', 'https://voragine.co/nosotros/'],
            },
        ],
    },
    'volcanicas-hoja-blanca': {
        label: 'Fundación Hoja Blanca ONG — Catalina Ruiz-Navarro y Matilde de los Milagros Londoño',
        sectores: [],
        personas: [
            {
                nombre: 'Catalina Ruiz-Navarro',
                papel: 'Cofundadora y directora. Periodista feminista colombiana.',
                desde: '2021',
                fuentes: ['https://volcanicas.com/nosotras/'],
            },
            {
                nombre: 'Matilde de los Milagros Londoño Jaramillo',
                papel: 'Cofundadora.',
                desde: '2021',
                fuentes: ['https://volcanicas.com/nosotras/'],
            },
            {
                nombre: 'Martha Beatriz Navarro y Paula Henao Aristizábal',
                papel: 'Gerencia administrativa y financiera, y coordinación general. Dirigen, no poseen.',
                desde: null,
                fuentes: ['https://volcanicas.com/nosotras/'],
            },
        ],
    },
    'gobiernos-locales': {
        label: 'Gobiernos locales — alcaldías y gobernaciones',
        sectores: [],
        // Misma lógica que `estado-colombiano`: el dueño es una institución y el
        // control lo ejerce un cargo electo. La diferencia es el CALENDARIO —los
        // alcaldes y gobernadores se eligen en un ciclo distinto al presidencial—
        // y el ÁMBITO: responden a una ciudad, no al país.
        personas: [{
            nombre: 'El alcalde o gobernador en ejercicio, según el canal',
            papel:
                'Titular del control efectivo: designa a la dirección del canal. No se ' +
                'nombra a personas concretas porque cambian con cada elección local y el ' +
                'catálogo no debe envejecer con ellas. Las direcciones de los tres canales ' +
                'están SIN documentar: falta ir a la web de cada uno.',
            desde: null,
            fuentes: [
                'https://www.telemedellin.tv/',
                'https://www.canalcapital.gov.co/',
                'https://www.telecaribe.co/',
            ],
        }],
    },
    'raya-fundacion': {
        label: 'Fundación RAYA — sus nueve periodistas fundadores',
        sectores: [],
        personas: [{
            nombre: 'Edinson Bolaños e Isabel Caballero, con otros siete periodistas',
            papel: 'Fundadores de la fundación sin ánimo de lucro; Bolaños la dirige.',
            desde: '2022',
            fuentes: ['https://revistaraya.com/staff.html'],
        }],
    },

    // ── Internacionales ─────────────────────────────────────────────────────
    bbc: {
        label: 'BBC — corporación pública británica',
        sectores: [],
    },
    'deutsche-welle': {
        label: 'Deutsche Welle — Estado alemán',
        sectores: [],
    },
    'france-medias-monde': {
        label: 'France Médias Monde — Estado francés',
        sectores: [],
    },
    alpac: {
        label: 'Alpac Capital',
        sectores: [],
    },
    sepi: {
        label: 'SEPI — Estado español',
        sectores: [],
    },
    woodbridge: {
        label: 'Woodbridge Company — familia Thomson',
        sectores: [],
    },
    'warner-bros-discovery': {
        label: 'Warner Bros. Discovery',
        sectores: ['cine', 'televisión', 'streaming'],
    },
    'ochs-sulzberger': {
        label: 'Familia Ochs-Sulzberger',
        sectores: [],
    },
    'news-corp': {
        label: 'News Corp — familia Murdoch',
        sectores: ['televisión', 'editorial'],
    },
    nikkei: {
        label: 'Nikkei Inc.',
        sectores: [],
    },
    godo: {
        label: 'Grupo Godó — familia Godó',
        sectores: ['radio'],
    },
};

export const OWNERSHIP_PROFILES = {
    // ── Colombia ────────────────────────────────────────────────────────────

    'semanario-voz': {
        ownerType: 'independiente',
        controlGroup: 'pcc-partido',
        holdings: [
            'Órgano de prensa del Partido Comunista Colombiano. Salió por primera vez el 20 de julio de 1957 como «Voz de la Democracia», semanas después de la caída de la dictadura de Rojas Pinilla y de la derogación del decreto que ilegalizaba al partido.',
            'Clausurado en 1964 por orden del presidente Guillermo León Valencia, reapareció como «Voz Proletaria» y adoptó su nombre actual en 1983. Su archivo reúne más de 2.700 ediciones.',
        ],
        notes: [
            'Manuel Cepeda Vargas, senador del PCC y miembro del comité de redacción del semanario, fue asesinado el 9 de agosto de 1994. La Corte Interamericana de Derechos Humanos declaró en 2010 la responsabilidad del Estado colombiano: concluyó que la ejecución fue obra de agentes estatales y grupos paramilitares dentro de un patrón sistemático de violencia contra la Unión Patriótica.',
        ],
        sources: [
            'https://es.wikipedia.org/wiki/Semanario_Voz',
            'https://centrodememoriahistorica.gov.co/las-tres-estaciones-del-semanario-voz/',
            'https://semanariovoz.com/66-anos-del-semanario-voz/',
            'https://cejil.org/comunicado-de-prensa/corte-interamericana-condena-a-colombia-por-la-ejecucion-del-senador-manuel-cepeda/',
        ],
        verifiedAt: VERIFICADO_AGO,
    },

    'revista-raya': {
        ownerType: 'independiente',
        controlGroup: 'raya-fundacion',
        holdings: [
            'Fundación sin ánimo de lucro creada en 2022 por nueve periodistas, entre ellos Edinson Bolaños —su director— e Isabel Caballero, ambos procedentes de la revista Cambio.',
            'Su ingreso principal son servicios prestados a organizaciones sin ánimo de lucro, seguidos de consultoría; completan la financiación campañas de micromecenazgo, donaciones individuales, producción de contenidos para otros medios y formación. No cobra por leer ni admite publicidad dentro del contenido editorial.',
        ],
        notes: [
            'En octubre de 2023 el CTI de la Fiscalía ordenó una inspección judicial de sus archivos y fuentes. La Fundación para la Libertad de Prensa (FLIP) rechazó la orden por constreñir el ejercicio periodístico y poner en riesgo la reserva de fuente.',
        ],
        sources: [
            'https://revistaraya.com/staff.html',
            'https://directorio.sembramedia.org/revista-raya/',
            'https://www.lasillavacia.com/en-vivo/presentan-la-revista-raya-nuevo-medio-de-investigacion-periodistica/',
            'https://flip.org.co/pronunciamientos/orden-emitida-por-la-fiscalia-constrine-el-ejercicio-periodistico-de-la-revista-raya',
        ],
        verifiedAt: VERIFICADO_AGO,
    },

    /**
     * El único que sigue vacío. Su razón social —Corporación Red de Medios
     * Alternativos, Agencia Colombiana de Prensa Popular— aparece en
     * directorios de registro mercantil, pero no se ha localizado una fuente
     * consultable sobre quién la controla ni de qué vive. Lo que hace falta es
     * el certificado de existencia del RUES o sus estatutos.
     */
    'casa-macondo': {
        ownerType: 'independiente',
        controlGroup: 'casamacondo-direccion',
        holdings: [
            'Medio digital de periodismo de investigación, ambiental y cultural. Contenidos de libre acceso; se sostiene con suscripciones y donaciones.',
        ],
        notes: [
            'Su página declara tener una sección «Así nos financiamos», pero el enlace directo devolvía 404 el 2026-08-08. La composición de sus ingresos queda SIN documentar hasta poder citarla.',
            'Juan Pablo Barrientos dirige aquí la unidad investigativa y cofundó la Fundación Vorágine, también en este catálogo.',
        ],
        sources: ['https://casamacondo.co/somos/'],
        verifiedAt: '2026-08-08',
    },

    'volcanicas': {
        ownerType: 'independiente',
        controlGroup: 'volcanicas-hoja-blanca',
        holdings: [
            'Proyecto de la Fundación Hoja Blanca ONG, organización sin ánimo de lucro. No tiene propietarios individuales: los recursos se reinvierten en la organización.',
            'DECLARA SU FINANCIACIÓN CON PORCENTAJES, lo que casi ningún medio del catálogo hace: Hispanics in Philanthropy 40,8 %, Ford Foundation 24,5 %, Foundation for a Just Society 16,3 %, más aportes individuales vía Patreon. Open Society Foundation fue su principal donante hasta junio de 2025.',
        ],
        notes: [
            'Depender de fundaciones filantrópicas internacionales es una forma de propiedad económica distinta de un grupo empresarial, pero no es ausencia de interés: sus donantes tienen agenda declarada. Se anota como se anota el sector de cualquier otro dueño.',
        ],
        sources: ['https://volcanicas.com/nosotras/', 'https://volcanicas.com/nuestra-historia/'],
        verifiedAt: '2026-08-08',
    },

    'colombia-informa': {
        ownerType: 'independiente',
        controlGroup: 'colombia-informa-corporacion',
        holdings: [
            'La sostiene la Corporación Colombia Informa (NIT 900.408.141-8, Bogotá). Se define como agencia de comunicación de los pueblos y trabaja con corresponsales regionales y colectivos de comunicación popular.',
            'Se financia «con aportes voluntarios y dedicación solidaria». Se articula con la ALBA de los Movimientos Sociales, espacio continental de coordinación de movimientos populares.',
        ],
        notes: [
            'Publica bajo autoría colectiva y no divulga quién la dirige. Es el único medio colombiano del catálogo cuyo hilo de propiedad no llega todavía a una persona natural.',
        ],
        sources: ['https://www.colombiainforma.info/somos/', 'https://www.colombiainforma.info/'],
        verifiedAt: '2026-08-08',
    },

    'noticias-uno': {
        ownerType: 'independiente',
        controlGroup: 'ntc-television',
        holdings: [
            'Lo produce NTC Televisión. Emite desde 1992 y estuvo en Canal 1 —televisión abierta— hasta el 30 de noviembre de 2019.',
            'NTC formó parte de Plural Comunicaciones, la sociedad que operaba Canal 1 junto a RTI (Patricio Wills), CM& (Yamid Amat) y el grupo estadounidense Hemisphere Media Group.',
            'En septiembre de 2019 Hemisphere Media Group anunció que dejaba de financiar el noticiero. El 1 de diciembre pasó a Cablenoticias, televisión por suscripción, y recurrió a financiación colectiva para sostenerse.',
            'Daniel Coronell lo dirigió entre 2002 y 2011; hoy es presidente de la revista Cambio, que aparece igualmente en este catálogo. Lo dirige Ignacio Gómez desde 2024.',
        ],
        notes: [
            'LO QUE NO SE PUDO DOCUMENTAR: cómo quedó repartida la propiedad tras la salida de Hemisphere Media Group en 2019. Las fuentes consultables describen la etapa de Plural Comunicaciones y el paso a financiación colectiva, pero no la composición accionaria actual. Se deja el hueco a la vista en vez de deducirlo.',
        ],
        sources: [
            'https://es.wikipedia.org/wiki/Noticias_Uno',
            'https://es.wikipedia.org/wiki/Canal_1_(Colombia)',
            'https://www.las2orillas.co/el-gringo-dueno-de-canal-1-que-le-dio-la-espalda-a-noticias-uno-de-daniel-coronell/',
        ],
        verifiedAt: VERIFICADO,
    },

    'voragine': {
        ownerType: 'independiente',
        controlGroup: 'voragine-fundacion',
        holdings: [
            'Fundación sin ánimo de lucro, creada el 1 de junio de 2020 por los periodistas Juan Pablo Barrientos, Francisco Escobar, José Guarnizo y Laila Abu Shihab.',
            'Arrancó con siete millones de pesos aportados por sus propios fundadores. La producción de contenidos se financia con aliados: empresas privadas, fundaciones y organizaciones defensoras de derechos humanos que patrocinan investigaciones concretas.',
        ],
        notes: [],
        sources: [
            'https://voragine.co/nosotros/',
            'https://sembramedia.org/voragine-el-valiente-medio-colombiano/',
            'https://gfmd.info/members/fundacion-voragine-periodismo-contracorriente/',
        ],
        verifiedAt: VERIFICADO,
    },

    'cuestion-publica': {
        ownerType: 'independiente',
        controlGroup: 'el-escarbabajo',
        holdings: [
            'Lo publica El Escarbabajo SAS, de las periodistas Diana Salinas (66,37 %) y Claudia Báez (33,33 %). Se lanzó el 6 de marzo de 2018.',
            'No es una fundación: sus creadoras lo montaron como empresa con ánimo de lucro.',
            'Publica su propia contabilidad. En 2025: cooperación internacional 89,93 %, contratos con organizaciones 8,04 %, monetización en redes 1,19 % y membresías 0,84 %.',
            'Entre sus financiadores figuran Luminate, el International Fund for Public Interest Media, la National Endowment for Democracy y la Fundación Heinrich Böll.',
            'Declara que nunca ha contratado ni contratará con el Estado colombiano.',
        ],
        notes: [],
        sources: [
            'https://cuestionpublica.com/nosotros/',
            'https://www.sembramedia.org/medio/cuestion-publica/',
        ],
        verifiedAt: VERIFICADO,
    },

    'razon-publica': {
        ownerType: 'independiente',
        controlGroup: 'razon-publica-fundacion',
        holdings: [
            'Fundación sin ánimo de lucro ni carácter partidista, constituida en 2008 como punto de convergencia de académicos e intelectuales colombianos.',
            'La dirige Hernando Gómez Buendía, su director y editor general.',
            'Se sostiene con donaciones directas y con aportes de miembros de su propio consejo directivo, que figuran como miembros financiadores.',
            'NO publica la identidad de sus patrocinadores institucionales: su página de aliados muestra logos sin identificarlos. Es un hueco de transparencia que aquí se deja constatado, no rellenado.',
        ],
        notes: [],
        sources: [
            'https://razonpublica.com/quienes-somos/',
            'https://razonpublica.com/que-es-razon-publica/',
        ],
        verifiedAt: VERIFICADO,
    },

    'cambio': {
        ownerType: 'independiente',
        controlGroup: 'cambio-inversionistas',
        holdings: [
            'La revista se relanzó como medio digital en febrero de 2022, después de que un grupo de inversionistas comprara los derechos de publicación en septiembre de 2021.',
            'Entre esos inversionistas están la periodista Patricia Lara Salive, el exministro de Defensa Gabriel Silva Luján y el exalcalde de Cali y empresario siderúrgico Maurice Armitage.',
            'El periodista Daniel Coronell es su presidente. Sostiene públicamente que «los accionistas no son los dueños de la información».',
        ],
        notes: [
            'Dos de sus accionistas han ocupado cargos públicos de elección o designación —un exministro de Defensa y un exalcalde de Cali—, lo que es pertinente cuando la revista cubre defensa o política del Valle del Cauca. No se afirma que hayan influido en la cobertura; se expone quién puso el dinero.',
        ],
        sources: [
            'https://es.wikipedia.org/wiki/Cambio_(revista)',
            'https://latamjournalismreview.org/es/articles/los-accionistas-no-son-los-duenos-de-la-informacion-dice-daniel-coronell-presidente-de-la-resucitada-revista-colombiana-cambio/',
            'https://www.lasillavacia.com/historias/silla-nacional/asi-resucita-la-revista-cambio-en-la-era-digital/',
        ],
        verifiedAt: VERIFICADO,
    },

    'telemedellin': {
        ownerType: 'publico',
        controlGroup: 'gobiernos-locales',
        holdings: ['Canal público del municipio de Medellín. Su dirección la designa la Alcaldía.'],
        notes: ['Su orientación depende del gobierno municipal de turno, igual que la de RTVC depende del nacional, pero con calendario electoral propio.'],
        sources: ['https://www.telemedellin.tv/'],
        verifiedAt: '2026-08-09',
    },

    'canal-capital': {
        ownerType: 'publico',
        controlGroup: 'gobiernos-locales',
        holdings: ['Canal público del Distrito Capital. Su dirección la designa la Alcaldía Mayor de Bogotá.'],
        notes: ['Su orientación depende del gobierno distrital de turno.'],
        sources: ['https://www.canalcapital.gov.co/'],
        verifiedAt: '2026-08-09',
    },

    'telecaribe': {
        ownerType: 'publico',
        controlGroup: 'gobiernos-locales',
        holdings: ['Canal público regional del Caribe colombiano, participado por las gobernaciones de la región.'],
        notes: ['Su RSS está casi parado: medido el 2026-08-09, solo 1 de los 15 ítems que tomamos caía dentro de la ventana de 72 h y la mediana era de 57 días. Entra por el criterio de no silenciar a ningún medio, sabiendo que hoy aporta muy poco.'],
        sources: ['https://www.telecaribe.co/'],
        verifiedAt: '2026-08-09',
    },
    'telecafe': {
        ownerType: 'publico',
        controlGroup: 'gobiernos-locales',
        holdings: [
            'Canal público regional del Eje Cafetero, participado por las gobernaciones de Caldas, Risaralda y Quindío. Cubre 53 municipios y emite desde Manizales.',
            'Lo gerencia Amanda Jaimes, comunicadora nacida en Toledo (Norte de Santander) y exgerente del Canal TRO entre 2020 y 2023.',
        ],
        notes: [
            'Su departamento es Caldas porque el canal está en Manizales, no porque solo cubra Caldas: el campo dice de dónde ES el medio. Quindío sigue sin medio propio en el catálogo.',
            'La dirección la designan tres gobernaciones a la vez, así que su clasificación es de las más volátiles del catálogo: un cambio de gobernación en cualquiera de los tres departamentos obliga a revisarla.',
        ],
        sources: [
            'https://telecafe.gov.co/',
            'https://www.lapatria.com/eje-cafetero/amanda-jaimes-cambia-de-canal-nueva-gerente-de-telecafe',
        ],
        verifiedAt: null,
    },

    'rtvc': {
        ownerType: 'publico',
        controlGroup: 'estado-colombiano',
        holdings: [
            'Sociedad entre entidades públicas del orden nacional, constituida en octubre de 2004 y sujeta al régimen de las Empresas Industriales y Comerciales del Estado.',
            'El presidente de la República ejerce el control sobre RTVC a través del Ministerio de Tecnologías de la Información y las Comunicaciones, y DESIGNA a su director general.',
            'En 2026 la entidad recuperó su nombre histórico, Inravisión: rtvc.gov.co redirige de forma permanente a inravision.gov.co. Comprobado el 2026-08-08. AQUÍ SE LE SIGUE LLAMANDO RTVC por decisión de Jose: es el nombre con el que el medio se presenta ante su audiencia, y el catálogo nombra a los medios como el lector los conoce, no como figuran en el registro mercantil.',
        ],
        notes: [
            'Que el jefe del Gobierno nombre a su director es la razón por la que la clasificación de orientación de este medio es la más volátil del catálogo: cambia con el gobierno de turno, no con su sala de redacción.',
            'El período presidencial terminó el 7 de agosto de 2026. Quien designa al gerente cambió de manos, así que esta ficha necesita revisarse: es la única del catálogo con fecha de caducidad conocida.',
            'PREVISIÓN DECLARADA, no medición (Jose, 2026-08-08): se espera que en los próximos días el medio cambie de dirección y pase a cubrir la actualidad desde una posición oficialista con el nuevo gobierno. Su valor actual de orientación (−0,35) se fijó bajo el gobierno anterior. Se deja escrito ANTES de que ocurra para que el ajuste, si llega, se pueda contrastar contra lo que se esperaba, en vez de justificarse después.',
        ],
        sources: [
            'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=82339',
            'https://normograma.mintic.gov.co/mintic/compilacion/docs/resolucion_rtvc_0461_2016.htm',
            'https://statemediamonitor.com/2025/03/radio-y-television-nacional-de-colombia-rtvc-sistema-de-medios-publicos/',
        ],
        verifiedAt: VERIFICADO,
    },

    'el-espectador': {
        ownerType: 'conglomerado',
        controlGroup: 'valorem',
        holdings: [
            'Lo publica Comunican S.A., del holding Valorem, controlado por la familia Santo Domingo.',
            'Valorem está también detrás de Blu Radio y de Caracol Televisión —Noticias Caracol—, que aparecen igualmente en este catálogo: tres medios, un dueño.',
            'Fuera de los medios, Valorem opera en retail (almacenes D1, a través de Koba International), logística y transporte (Suppla, Ditransa), entretenimiento (Cine Colombia), industria (Biofilm, Gases del Caribe) e inmobiliario y turismo.',
        ],
        notes: [],
        sources: [
            'https://colombia.mom-gmr.org/es/media/detail/outlet/el-espectador/',
            'https://colombia.mom-gmr.org/es/proprietarios/companies-database/detail/company/company/show/valorem-sa/',
        ],
        verifiedAt: VERIFICADO,
    },

    'la-silla-vacia': {
        ownerType: 'independiente',
        controlGroup: 'la-silla-socios',
        holdings: [
            'La dirige desde su fundación la periodista Juanita León, socia fundadora.',
            'Arrancó con una donación de Open Society Foundations, la embajada británica, varias ONG y donaciones de usuarios.',
            'Hoy se sostiene con su comunidad de lectores —el programa de membresías SuperAmigos— y con aliados estratégicos. No tiene muro de pago ni publicidad en su sitio.',
        ],
        notes: [
            'En abril de 2026 el medio y su directora fueron señalados públicamente por un supuesto conflicto de interés relacionado con inversiones en Ecopetrol, en un episodio en el que se pronunció hasta el presidente Petro. Se consigna el señalamiento y su fuente, no una conclusión sobre él.',
        ],
        sources: [
            'https://www.lasillavacia.com/que-es-la-silla-vacia/',
            'https://www.lasillavacia.com/opinion/de-la-direccion/la-financiacion-de-la-silla-vacia/',
            'https://www.infobae.com/colombia/2026/04/21/la-silla-vacia-y-juanita-leon-estan-bajo-presion-por-acusaciones-de-conflicto-de-interes-por-inversiones-en-ecopetrol-hasta-petro-se-pronuncio/',
        ],
        verifiedAt: VERIFICADO,
    },

    'el-tiempo': {
        ownerType: 'conglomerado',
        controlGroup: 'sarmiento-aval',
        holdings: [
            'Luis Carlos Sarmiento Angulo compró Casa Editorial El Tiempo en 2012: adquirió el 88 % que tenía el grupo español Planeta y después el resto a los minoritarios.',
            'Es el mayor accionista y presidente del Grupo Aval, el mayor conglomerado financiero de Colombia, con intereses en banca, construcción e infraestructura.',
            'La misma casa editorial publica Portafolio, que aparece igualmente en este catálogo.',
        ],
        notes: [],
        sources: [
            'https://colombia.mom-gmr.org/es/proprietarios/propietarios-individuales/detail/owner/owner/show/luis-carlos-sarmiento-angulo/',
            'https://www.semana.com/negocios/articulo/luis-carlos-sarmiento-controla-el-tiempo/146788/',
            'https://www.eltiempo.com/archivo/documento/CMS-11610965',
        ],
        verifiedAt: VERIFICADO,
    },

    'w-radio': {
        ownerType: 'internacional',
        controlGroup: 'prisa',
        holdings: [
            'La emite Caracol Primera Cadena Radial Colombiana S.A., controlada por el Grupo Prisa a través de la Sociedad Española de Radiodifusión, con el 77 % de las acciones.',
            'El resto se reparte entre Inversiones Ferines S.A.S., de la familia Londoño (14,4 %), e Inversiones Valmiera, de Felipe López Caballero, fundador de Semana (8,6 %).',
            'El mismo grupo controla Caracol Radio y El País de España, que aparecen igualmente en este catálogo.',
        ],
        notes: [],
        sources: [
            'https://colombia.mom-gmr.org/es/media/detail/outlet/w-radio/',
            'https://www.las2orillas.co/tres-millonarios-duenos-de-los-cinco-poderosos-noticieros-radiales/',
        ],
        verifiedAt: VERIFICADO,
    },

    'caracol-radio': {
        ownerType: 'internacional',
        controlGroup: 'prisa',
        holdings: [
            'Pertenece al Grupo Prisa, de España, controlado desde 2003 por el banquero de inversión Joseph Oughourlian. El mismo grupo es dueño de W Radio y de El País de España.',
            'NO tiene relación de propiedad con Noticias Caracol, que es del grupo Santo Domingo. Comparten nombre y no dueño.',
        ],
        notes: [],
        sources: [
            'https://www.las2orillas.co/tres-millonarios-duenos-de-los-cinco-poderosos-noticieros-radiales/',
        ],
        verifiedAt: VERIFICADO,
    },

    'noticias-caracol': {
        ownerType: 'conglomerado',
        controlGroup: 'valorem',
        holdings: [
            'Es la división de noticias de Caracol Televisión S.A., cuyo accionista mayoritario es Valorem S.A. con el 93,4 %, controlada por Alejandro Santo Domingo Dávila.',
            'El 6,5 % restante está en Inversiones Valmiera, de Felipe López Caballero, fundador de Semana.',
            'El mismo holding controla El Espectador y Blu Radio, que aparecen igualmente en este catálogo.',
            'NO tiene relación de propiedad con Caracol Radio, que es del Grupo Prisa. Comparten nombre y no dueño.',
        ],
        notes: [],
        sources: [
            'https://colombia.mom-gmr.org/es/media/detail/outlet/caracol-tv/',
            'https://colombia.mom-gmr.org/es/proprietarios/companies-database/detail/company/company/show/valorem-sa/',
        ],
        verifiedAt: VERIFICADO,
    },

    'portafolio': {
        ownerType: 'conglomerado',
        controlGroup: 'sarmiento-aval',
        holdings: [
            'Lo publica Casa Editorial El Tiempo, propiedad de Luis Carlos Sarmiento Angulo desde 2012. Fue fundado en 1993 por Mauricio Rodríguez Múnera.',
            'Su dueño preside el Grupo Aval, el mayor conglomerado financiero del país, con intereses en banca, construcción e infraestructura.',
            'Es un diario especializado en economía y negocios cuyo propietario es el mayor banquero de Colombia: la cobertura del sector financiero es donde ese cruce se haría visible.',
        ],
        notes: [],
        sources: [
            'https://es.wikipedia.org/wiki/Portafolio_(peri%C3%B3dico)',
            'https://www.eltiempo.com/archivo/documento/CMS-11610965',
            'https://colombia.mom-gmr.org/es/proprietarios/propietarios-individuales/detail/owner/owner/show/luis-carlos-sarmiento-angulo/',
        ],
        verifiedAt: VERIFICADO,
    },

    'infobae-co': {
        ownerType: 'internacional',
        controlGroup: 'infobae-hadad',
        holdings: [
            'Medio argentino fundado en 2002 por Daniel Hadad, que sigue siendo su dueño.',
            'Hadad fundó Radio 10 en Buenos Aires y adquirió Canal 9 en 2002.',
            'Su redacción colombiana es una expansión posterior a la de México; la agenda editorial se decide fuera del país.',
        ],
        notes: [],
        sources: [
            'https://en.wikipedia.org/wiki/Infobae',
            'https://en.wikipedia.org/wiki/Daniel_Hadad',
            'https://www.las2orillas.co/infobae-el-gigante-argentino-que-pisa-duro-en-colombia/',
        ],
        verifiedAt: VERIFICADO,
    },

    'la-republica': {
        ownerType: 'conglomerado',
        controlGroup: 'ardila-lulle',
        holdings: [
            'Fundado en 1954 por el expresidente Mariano Ospina Pérez y el empresario Julio C. Hernández García.',
            'La Organización Ardila Lülle lo compró en agosto de 2002 y tomó el control en diciembre de ese año a través de Editorial La República S.A.S.',
            'La misma organización controla Noticias RCN y La FM, que aparecen igualmente en este catálogo: tres medios, un dueño.',
            'Sus otros negocios están en bebidas (Postobón), azúcar, textiles y deporte.',
        ],
        notes: [
            'Es un diario económico cuyo dueño es uno de los mayores conglomerados industriales del país. La cobertura de bebidas, azúcar o textiles es donde ese cruce se haría visible.',
        ],
        sources: [
            'https://es.wikipedia.org/wiki/La_Rep%C3%BAblica_(Colombia)',
            'https://colombia.mom-gmr.org/en/owners/companies/detail/company/company/show/organizacion-ardila-luelle-sa/',
        ],
        verifiedAt: VERIFICADO,
    },

    'valora-analitik': {
        ownerType: 'independiente',
        controlGroup: 'valora-fundadores',
        holdings: [
            'Lo edita Valora Inversiones S.A.S. (NIT 900.811.192-0), constituida el 20 de enero de 2015 y domiciliada en Medellín, Carrera 43A n.º 5A-113, oficina 2020.',
            'Sus dueños son sus dos fundadores, Camilo Silva (gerente) y Alejandro Montoya (CFO), con capital propio. No pertenece a ningún grupo de medios ni a ningún conglomerado.',
            'Se financia con pauta publicitaria, suscripciones a un servicio premium y avisos de ley pagados (convocatorias, liquidaciones, escisiones) de empresas.',
        ],
        notes: [
            'La misma sociedad opera una plataforma de pago para inversionistas del mercado accionario colombiano, con gráficos y análisis de las acciones que cotizan en la Bolsa de Valores de Colombia. Su redacción cubre a esas mismas emisoras: es ahí donde ese cruce se haría visible. No ofrece asesoría personalizada ni recomendaciones de compra.',
            'Los avisos de ley son una relación comercial con las empresas sobre las que informa, del mismo tipo que la pauta y con el mismo lugar donde mirar.',
            'Es de los pocos medios del catálogo sin dueño en un conglomerado, y eso conviene decirlo con el mismo cuidado que lo contrario: la independencia societaria no es independencia editorial, solo quita un conflicto conocido.',
        ],
        sources: [
            'https://www.valoraanalitik.com/Terminos_Condiciones_Valora_Inversiones.pdf',
            'https://www.datacreditoempresas.com.co/directorio/valora-inversiones-sas.html',
            'https://es.wikipedia.org/wiki/Valora_Analitik',
            'https://plataforma.valoraanalitik.com/plataforma/index.php',
        ],
        verifiedAt: '2026-08-11',
    },

    'el-heraldo': {
        ownerType: 'familiar',
        controlGroup: 'el-heraldo-familias',
        holdings: [
            'Controlado por las familias Manotas, Pumarejo y Fernández, con un tercio de las acciones cada una. Lo fundaron en 1933 Alberto Pumarejo, Luis Eduardo Manotas y Juan B. Fernández Ortega.',
            'En junio de 2023 el Grupo Semana, de la familia Gilinski, firmó un memorando para comprar el 100 %. La operación se cayó en agosto de ese año y el diario siguió con sus dueños.',
        ],
        notes: [],
        sources: [
            'https://www.pulzo.com/economia/duenos-heraldo-cuales-tres-familias-que-mandan-ese-periodico-PP2729022',
            'https://www.publimetro.co/barranquilla/2023/08/19/se-le-cayo-multimillonario-negocio-a-los-gilinski-y-a-semana-por-estas-razones/',
            'https://www.las2orillas.co/la-batalla-de-diez-familias-por-no-dejar-morir-sus-periodicos-impresos/',
        ],
        verifiedAt: VERIFICADO,
    },

    /**
     * Documentado pero SIN grupo de control, a propósito. Galvis Ramírez tiene
     * el 50 % de Editora del Mar y la familia Araujo el resto: ninguna de las
     * dos manda sola. El aviso de dueño compartido afirma «pertenecen a», y con
     * una coposesión al 50 % eso sería sobreafirmar. El dato queda en la ficha,
     * donde el lector lo ve con su matiz, y fuera del cálculo automático.
     */
    'el-universal': {
        ownerType: 'familiar',
        /**
         * FALTABA. El grupo `lopez-escauriaza-araujo` existía en CONTROL_GROUPS
         * desde el principio, pero esta ficha no lo referenciaba: `controlGroup`
         * venía `undefined`, así que el medio aparecía «sin grupo» y su cadena de
         * propiedad no se podía leer. Detectado el 2026-08-08 al recorrer el mapa
         * medio por medio.
         */
        controlGroup: 'lopez-escauriaza-araujo',
        holdings: [
            'Lo publica Editora del Mar S.A. Lo fundaron en 1948 Domingo López Escauriaza y Eduardo Ferrer Ferrer, cuñados y socios.',
            'Alejandro Galvis Ramírez —de la familia dueña de Vanguardia, en este mismo catálogo— entró en 1980 con el 50 % de Editora del Mar. El otro 50 % quedó en manos de socios locales, entre ellos la familia Araujo Perdomo, con intereses en hotelería y trayectoria política conservadora.',
            'Ninguno de los dos bloques tiene mayoría por sí solo, así que este medio NO cuenta como dueño compartido con Vanguardia en los avisos del sitio.',
        ],
        notes: [],
        sources: [
            'https://www.las2orillas.co/quienes-son-los-duenos-de-periodicos-regionales-que-no-dan-plata-pero-si-poder/',
            'https://www.las2orillas.co/la-batalla-de-diez-familias-por-no-dejar-morir-sus-periodicos-impresos/',
            'https://es.wikipedia.org/wiki/El_Universal_(Colombia)',
        ],
        verifiedAt: VERIFICADO,
    },

    'blu-radio': {
        ownerType: 'conglomerado',
        controlGroup: 'valorem',
        holdings: [
            'Pertenece a Valorem, el holding de la familia Santo Domingo.',
            'El mismo holding está detrás de El Espectador y de Caracol Televisión —Noticias Caracol—, que aparecen igualmente en este catálogo: tres medios, un dueño.',
        ],
        notes: [],
        sources: [
            'https://colombia.mom-gmr.org/es/proprietarios/companies-database/detail/company/company/show/valorem-sa/',
            'https://www.las2orillas.co/tres-millonarios-duenos-de-los-cinco-poderosos-noticieros-radiales/',
        ],
        verifiedAt: VERIFICADO,
    },

    'noticias-rcn': {
        ownerType: 'conglomerado',
        controlGroup: 'ardila-lulle',
        holdings: [
            'Pertenece a la Organización Ardila Lülle, con intereses en bebidas (Postobón), azúcar, textiles y deporte.',
            'La misma organización controla RCN Radio y La FM, y el diario económico La República: tres medios de este catálogo, un dueño.',
        ],
        notes: [],
        sources: [
            'https://colombia.mom-gmr.org/en/owners/companies/detail/company/company/show/organizacion-ardila-luelle-sa/',
            'https://www.eltiempo.com/economia/empresas/carlos-ardila-luelle-de-que-empresas-era-dueno-610443',
        ],
        verifiedAt: VERIFICADO,
    },

    'la-patria': {
        ownerType: 'familiar',
        controlGroup: 'restrepo-la-patria',
        holdings: [
            'Diario de Manizales en circulación desde los años veinte. José Restrepo Restrepo lo adquirió en 1940 y sigue en manos de sus herederos.',
            'Luis José Restrepo lo dirigió desde 1973 y hoy lo encabeza Nicolás Restrepo Escobar, tercera generación de la familia.',
        ],
        notes: [],
        sources: [
            'https://www.las2orillas.co/quienes-son-los-duenos-de-periodicos-regionales-que-no-dan-plata-pero-si-poder/',
            'https://www.las2orillas.co/la-batalla-de-diez-familias-por-no-dejar-morir-sus-periodicos-impresos/',
        ],
        verifiedAt: VERIFICADO,
    },

    'vanguardia': {
        ownerType: 'familiar',
        controlGroup: 'galvis',
        holdings: [
            'Lo publica Galvis Ramírez y Cía S.A. Fundado en Bucaramanga en septiembre de 1919 por Alejandro Galvis Galvis, sigue en manos de sus descendientes.',
            'Alejandro Galvis Ramírez fue su principal impulsor hasta su muerte en 2021.',
            'La misma familia entró en 1980 con el 50 % de Editora del Mar, que publica El Universal de Cartagena, y adquirió El Nuevo Día de Ibagué.',
        ],
        notes: [],
        sources: [
            'https://www.las2orillas.co/quienes-son-los-duenos-de-periodicos-regionales-que-no-dan-plata-pero-si-poder/',
            'https://www.las2orillas.co/la-batalla-de-diez-familias-por-no-dejar-morir-sus-periodicos-impresos/',
            'https://en.wikipedia.org/wiki/Vanguardia_(Colombian_newspaper)',
        ],
        verifiedAt: VERIFICADO,
    },

    'la-opinion': {
        /**
         * `conglomerado` y no `familiar` desde el 2026-08-08. La familia
         * Colmenares lo tuvo 64 años, pero lo vendió: el Grupo Empresarial
         * Catalítico cerró la compra del 100 % el 1 de febrero de 2024, y es un
         * grupo de negocios de tecnología y mercadeo con presencia en Estados
         * Unidos, Bogotá, Cali y Barranquilla. Dejarlo como «familiar regional»
         * describía al dueño anterior.
         */
        ownerType: 'conglomerado',
        controlGroup: 'catalitico',
        holdings: [
            'Fundado en 1958 en Cúcuta. Estuvo siempre en manos de la familia del periodista Eustorgio Colmenares, asesinado por el ELN en marzo de 1993 y sucedido por su hijo José Eustorgio Colmenares.',
            'El Grupo Empresarial Catalítico, de Barranquilla, compró el 100 % de las acciones y cerró la operación el 1 de febrero de 2024. Lo dirige el comunicador Cristian Verbel.',
            'Catalítico se dedica a recuperar empresas de tecnología y mercadeo; llegó al diario como asesor de la transformación digital de la familia Colmenares y acabó proponiendo comprarlo.',
        ],
        notes: [],
        sources: [
            'https://www.semana.com/nacion/articulo/grupo-empresarial-catalitico-nuevo-dueno-del-diario-la-opinion-de-cucuta/202443/',
            'https://www.larepublica.co/empresas/grupo-empresarial-catalitico-comprara-el-diario-la-opinion-de-cucuta-3789641',
            'https://www.vanguardia.com/colombia/2024/01/27/periodico-la-opinion-cambia-de-duenos-grupo-empresarial-catalitico-adquirio-el-diario-de-cucuta/',
        ],
        verifiedAt: VERIFICADO,
    },

    'el-pais-cali': {
        ownerType: 'conglomerado',
        controlGroup: 'gilinski',
        holdings: [
            'Lo controla el Grupo Semana, de Gabriel Gilinski, desde enero de 2023. La familia Lloreda salió tras más de ochenta años al frente del diario.',
            'Comparte propietario con Semana: dos medios de este catálogo responden ante el mismo dueño.',
            'NO tiene ninguna relación con El País de España, que es del Grupo Prisa y aparece también en este catálogo. Mismo nombre, dueños distintos.',
        ],
        notes: [],
        sources: [
            'https://www.larepublica.co/empresas/familia-lloreda-cerro-trato-con-gabriel-gilinski-por-adquiscion-de-el-pais-de-cali-3521173',
            'https://lasillavacia.com/historias/silla-nacional/con-el-pais-de-cali-gilinski-arranca-la-expansion-del-modelo-semana',
        ],
        verifiedAt: VERIFICADO,
    },

    'kienyke': {
        /**
         * RECLASIFICADO EL 2026-08-08. Figuraba como `independiente` y no lo es.
         *
         * `independiente` significa «sin dueño que lo posea como activo
         * económico: vive de donaciones, membresías o cooperación». KienyKe es
         * lo contrario y su propia ficha lo dice desde siempre: lo posee **una
         * empresaria al 100 %** —89,9 % vía su sociedad y 10,2 % a su nombre— y
         * su **negocio principal está en los seguros**. El archivo ya le tenía
         * puesto `sectores: ['seguros']`; lo que fallaba era la etiqueta, no el
         * dato.
         *
         * Lo destapó el cambio de criterio de Jose —que manda la naturaleza del
         * interés y no quién es el dueño—: con la taxonomía anterior, «no es un
         * conglomerado» bastaba para dejarlo en independiente.
         */
        ownerType: 'conglomerado',
        controlGroup: 'kienyke-bernal',
        holdings: [
            'Lo publica Kieneskien Editorial S.A.S. Su dueña absoluta es la empresaria Adriana Bernal Salgado: 89,9 % a través de Kieneskien Casa Editorial y 10,2 % a su nombre.',
            'Bernal es propietaria de Red Assist y tiene su negocio principal en el sector de los seguros. Fundó el portal en 2010 con el apoyo de María Elvira Bonilla y Claudia Tascón.',
            'Es el único medio nativo digital afiliado a Andiarios, la asociación de diarios colombianos.',
        ],
        notes: [
            'La Silla Vacía documentó que su dueña montó la estrategia de medios de la campaña de Álvaro Uribe, y que entre las figuras vinculadas al medio han estado el exasesor de Uribe y expresidente de la ANDI Fabio Echeverry, el excandidato liberal Alfonso López —hermano del dueño de Semana— y José Antonio Vargas Lleras, hermano de quien era entonces ministro del Interior. Se consigna la red de relaciones documentada, no una conclusión sobre su línea editorial.',
        ],
        sources: [
            'http://colombia.mom-gmr.org/es/media/detail/outlet/kienykecom/',
            'https://www.lasillavacia.com/silla-nacional/el-quien-y-que-detras-de-kienykecom/',
            'https://es.wikipedia.org/wiki/KienyKe.com',
        ],
        verifiedAt: VERIFICADO,
    },

    'la-fm': {
        ownerType: 'conglomerado',
        controlGroup: 'ardila-lulle',
        holdings: [
            'Forma parte de RCN Radio, de la Organización Ardila Lülle, que cubre más del 80 % del territorio nacional con más de 160 emisoras.',
            'La misma organización controla Noticias RCN y el diario económico La República: tres medios de este catálogo, un dueño.',
        ],
        notes: [],
        sources: [
            'https://colombia.mom-gmr.org/es/media/detail/outlet/la-fm/',
            'https://colombia.mom-gmr.org/en/owners/companies/detail/company/company/show/organizacion-ardila-luelle-sa/',
        ],
        verifiedAt: VERIFICADO,
    },

    'el-colombiano': {
        /**
         * `familiar` aquí NO significa «una familia»: significa control
         * económico de alcance regional, que es como lo muestra el distintivo
         * («Grupo económico · regional»). Desde febrero de 2022 lo controlan 15
         * empresarios antioqueños con el 51 %, y la familia Gómez Martínez
         * quedó en minoría. Sus negocios están en construcción, comercio,
         * textiles y agroindustria: ver `sectores` del grupo.
         */
        ownerType: 'familiar',
        controlGroup: 'el-colombiano-accionistas',
        holdings: [
            'La familia Gómez Martínez quedó como única dueña en 2019, al comprar a la familia Hernández la mitad que tenía desde 1930.',
            'En febrero de 2022 un grupo de empresarios antioqueños adquirió el 51 % de las acciones. Sus protagonistas describieron la operación como una respuesta al interés del Grupo Gilinski por el diario.',
            'Entre los compradores está Manuel Santiago Mejía, cabeza del grupo Corbeta.',
        ],
        notes: [],
        sources: [
            'https://www.elcolombiano.com/antioquia/venta-de-acciones-de-el-colombiano-asi-fue-el-negocio-MI16691915',
            'https://www.las2orillas.co/quienes-son-los-empresarios-antioquenos-que-se-quedaron-con-el-colombiano/',
        ],
        verifiedAt: VERIFICADO,
    },
    // ── Regionales departamentales (alta del 2026-08-09) ────────────────────
    //
    // Nueve fichas escritas a la vez que se dieron de alta los medios. La
    // razonada completa de cada uno está en fichas/<id>.md; aquí va solo lo
    // que es propiedad, que es lo que esta estructura publica.
    //
    // NINGUNA está verificada en registro mercantil: todas salen de fuentes
    // secundarias o de lo que el propio medio declara, y por eso 'verifiedAt'
    // va vacío en las nueve. Ocho certificados de Cámara de Comercio cerrarían
    // el hueco, y están pedidos en las fichas.

    'el-pilon': {
        ownerType: 'familiar',
        holdings: [
            'El Pilón S.A., NIT 824000056, constituida el 23 de mayo de 1995 en Valledupar y con matrícula mercantil activa. Su junta directiva la preside Juan Carlos Quintero Castro, accionista mayoritario.',
            'Quintero Castro es empresario de La Loma (Cesar), abogado y economista. Fue gobernador encargado del Cesar y consejero presidencial para la Costa Atlántica, cargos que dejó hace más de veinte años; desde entonces se dedica a la gestión empresarial y a juntas directivas.',
        ],
        notes: [
            'El paso por cargos públicos se declara porque de quién es un medio se dice siempre, no porque indique su línea: son cargos de hace más de dos décadas y la regla del presente los excluye como evidencia de orientación.',
        ],
        sources: [
            'https://elpilon.com.co/el-pilon-30-anos/amp/',
            'https://www.datacreditoempresas.com.co/directorio/el-pilon-sa.html',
        ],
        verifiedAt: null,
    },

    'diario-del-huila': {
        ownerType: 'familiar',
        holdings: [
            'Lo edita Editora del Huila S.A., con sede en Neiva. Existe además una segunda sociedad, Diario del Huila Digital S.A.S., constituida el 7 de septiembre de 2021.',
            'Lo dirige María Pia Duque Rengifo. Sus fundadores fueron Max Duque Gómez y Max Duque Palma: la dirección sigue en la familia fundadora, y esa continuidad es estructura de control vigente, no efeméride.',
        ],
        notes: [
            'El accionariado no está documentado: se sabe quién dirige, no de quién es el capital. Tampoco está explicado por qué existen dos sociedades, ni si la digital tiene otros socios.',
        ],
        sources: [
            'https://diariodelhuila.com/directorio/',
            'https://www.datacreditoempresas.com.co/directorio/diario-del-huila-digital-sas.html',
        ],
        verifiedAt: null,
    },

    'diario-del-norte': {
        ownerType: 'familiar',
        holdings: [
            'Lo edita Sistema Cardenal S.A.S., empresa privada constituida en 2009. El propio medio publica su accionariado: Demis Pacheco Fernández con el 80 %, Demis Consuelo Fernández Pacheco con el 10 % y Mercy Edith Fernández Pacheco con el 10 %. La junta directiva la forman esos mismos accionistas.',
            'Sistema Cardenal no es solo un periódico: opera emisoras en Valledupar (1050 AM), San Juan del Cesar (94.7 FM) y Riohacha (91.7 FM). Tenía además frecuencias en Barranquilla, Cartagena y Sincelejo, que dejaron de operar entre enero y febrero de 2024 y hoy pertenecen a AWR 360, la radio de la Iglesia Adventista en Colombia.',
        ],
        notes: [
            'Es el único medio regional del catálogo que publica su accionariado con porcentajes. Es autodeclarado y no un certificado de Cámara de Comercio, pero es nominal y contrastable.',
            'Un accionista con el 80 % no tiene contrapeso interno, y los otros dos comparten apellido con él. La independencia editorial que el medio declara por escrito descansa en la voluntad de una persona, no en una estructura.',
            'El dueño del único medio de La Guajira del catálogo también emite en el Cesar, donde el único medio del catálogo es El Pilón. No hay propiedad compartida entre ambos, pero sí un mismo actor con voz en dos departamentos vecinos.',
        ],
        sources: [
            'https://diariodelnorte.net/directrices-editoriales/',
        ],
        verifiedAt: null,
    },

    'el-diario-pereira': {
        ownerType: 'familiar',
        holdings: [
            'Lo edita R.R. Editores Ramírez y Ramírez S.A.S. Sus propietarios son los hermanos Luis Carlos y Javier Ignacio Ramírez Múnera; Luis Carlos es además el director.',
            'El Diario nació en noviembre de 2016 de la fusión de los dos diarios rivales de Pereira. Los hermanos Ramírez Múnera eran dueños del Diario del Otún —fundado por su padre, Javier Ramírez González, en 1982— y compraron La Tarde. De dos cabeceras que competían quedó una.',
        ],
        notes: [
            'La fusión no es historia sino la estructura de hoy: Pereira tiene un solo diario y es de esta familia. Presentarlo como «el medio de Risaralda» es exacto y a la vez engañoso — es el único que queda, no el que ganó una competencia que siga existiendo.',
            'El accionariado no está verificado en registro mercantil: falta el certificado de la Cámara de Comercio de Pereira, que diría si hay más capital que el de los dos hermanos.',
        ],
        sources: [
            'https://es.wikipedia.org/wiki/El_Diario_(Colombia)',
            'https://www.elcolombiano.com/colombia/el-diario-el-nuevo-periodico-de-los-pereiranos-IB5425875',
        ],
        verifiedAt: null,
    },

    'proclama-del-pacifico': {
        ownerType: 'independiente',
        holdings: [
            'Lo dirige el periodista Alfonso José Luna Geller, desde Santander de Quilichao (Cauca). Está registrado como publicación periódica con el nombre Proclama del Cauca por resolución 004785 de la Dirección Nacional de Derecho de Autor, del 29 de diciembre de 1983.',
            'En enero de 2025 cambió de nombre a Proclama del Pacífico y amplió su cobertura declarada a Chocó, Nariño y Valle del Cauca, además del Cauca.',
        ],
        notes: [
            'Figura en el directorio de SembraMedia, la red de medios digitales independientes de Iberoamérica. Eso acredita su naturaleza —medio digital independiente verificado—, no su orientación.',
            'El accionariado no está documentado y no consta ninguna fuente de financiación.',
        ],
        sources: [
            'https://www.proclamadelpacifico.com/nosotros/',
            'https://directorio.sembramedia.org/proclama-cauca-y-valle/',
        ],
        verifiedAt: null,
    },

    'choco-7-dias': {
        ownerType: 'familiar',
        holdings: [
            'Su propietario y editor es Iván Cañadas Garrido, abogado, comerciante y periodista. El semanario lo fundó en Quibdó, el 7 de agosto de 1995, Donaldo Cañadas Moreno, hermano de padre del anterior, que lo dirigió durante años.',
        ],
        notes: [
            'No consta la sociedad que lo edita —ni razón social, ni NIT, ni matrícula— ni quién ejerce hoy la dirección.',
            'La fuente es la hemeroteca digital de la Universidad Tecnológica del Chocó, es decir, una universidad pública del propio departamento, y no el medio hablando de sí mismo.',
        ],
        sources: [
            'https://hemeroteca.utch.edu.co/choco-7-dias-1995-2025/',
        ],
        verifiedAt: null,
    },

    'el-manduco': {
        ownerType: 'familiar',
        holdings: [
            'Los cuatro cargos de la cabecera los ocupa la misma familia: Carlos Díaz Carrasco como fundador, Gonzalo Díaz García como director, Jhon Díaz Cañadas como director emérito y Marvin Díaz García como gerente.',
        ],
        notes: [
            'No consta la sociedad que lo edita. La familia controla dirección, gerencia y fundación, y el propio medio lo publica sin disimulo.',
            'En un departamento de unos 90 000 habitantes, no hay ninguna estructura interna que contrapese un interés de la familia propietaria. Eso no dice hacia dónde tira su línea; dice de quién depende.',
        ],
        sources: [
            'https://elmanduco.com.co/',
        ],
        verifiedAt: null,
    },

    'miputumayo': {
        ownerType: 'familiar',
        holdings: [
            'Lo fundó Luis Carlos Chamorro Burbano el 17 de marzo de 2004 en Mocoa, y lo sigue dirigiendo. Propiedad y dirección son la misma persona natural.',
        ],
        notes: [
            'No consta sociedad, ni NIT, ni fuente de financiación. En un medio de una sola persona, de quién viene el dinero es la pregunta que más determina, y esta ficha no la responde.',
            'Se define a sí mismo como «un magazín informativo imparcial, neutral e independiente». Es una declaración suya, no una comprobación nuestra.',
        ],
        sources: [
            'https://miputumayo.com.co/quienes-somos/',
        ],
        verifiedAt: null,
    },

    'el-morichal': {
        ownerType: 'independiente',
        holdings: [
            'Lo sostiene la Corporación El Morichal, sin ánimo de lucro, constituida en agosto de 2025. Antes fue El Morichal Comunicaciones S.A.S., creada en 2016 y liquidada, y después operó como persona natural a nombre de Edwin Suárez.',
            'Lo dirige Edwin Suárez Narváez, periodista y cofundador. Cofundan también Gardenia Nazaret Rebolledo Anija, abogada venezolana con estudios en comunicación social, y Edgar Guajo Bernavé, comunicador indígena originario de Cacahual (Guainía).',
            'Cubre Vichada y Guainía: Cumaribo, La Primavera, Puerto Carreño y Santa Rosalía en el primero; Inírida y Barrancominas en el segundo. Dejó de imprimir en diciembre de 2025 y sigue en digital.',
        ],
        notes: [
            'Es el único medio de la tanda departamental que declara su propia trayectoria societaria, incluida la liquidación de su primera sociedad. A otros dos candidatos esa misma situación se les descubrió consultando el registro mercantil.',
            'No consta ninguna fuente de financiación. En un medio sin ánimo de lucro es la pregunta central: el conflicto de interés, cuando existe, viene de quién financia y no de quién posee.',
            'La corporación tiene menos de un año, así que esa figura no tiene todavía historial.',
        ],
        sources: [
            'https://elmorichal.com/nosotros/',
        ],
        verifiedAt: null,
    },
    'boyaca-digital': {
        ownerType: 'conglomerado',
        holdings: [
            'Su política editorial declara que el medio lo «opera y edita» Holding Consultants, y que un Editor en Jefe humano supervisa la redacción y responde legalmente por lo publicado. No se publica el nombre de esa persona, ni razón social, ni NIT.',
            'Con ese nombre existe en Bogotá Holding Consultants de Colombia, consultora de sistemas de gestión —ISO 9001, seguridad y salud en el trabajo—, con veinte años de actividad y clientes en el sector privado Y EN EL PÚBLICO, con cobertura declarada en Cundinamarca, Boyacá y el resto del país. EL VÍNCULO ESTÁ RESPALDADO TÉCNICAMENTE, no solo por el nombre: boyacadigital.com y holdingconsultants.org comparten el MISMO PAR de servidores de nombres de Cloudflare (dylan.ns.cloudflare.com y fatima.ns.cloudflare.com), y Cloudflare asigna un par por cuenta. Sumado a que el propio medio declara que lo opera Holding Consultants, y a que la consultora declara cobertura en Boyacá, la conclusión razonable es que se trata de la misma organización. No es un certificado de Cámara de Comercio: es evidencia convergente, y se publica como tal.',
        ],
        notes: [
            'CONFLICTO DE INTERÉS QUE SE DECLARA: una consultora que vende servicios de sistemas de gestión a entidades públicas es, con toda probabilidad, la dueña de un medio cuya redacción automatizada cubre a diario las alcaldías y la gobernación de Boyacá. No se afirma que haya influido en ninguna pieza —eso no consta y no se publica—; se expone quién está detrás, que es un hecho comprobable, y el lector saca su conclusión con el dato delante en vez de sin él.',
            'Sus trece «periodistas» son agentes de inteligencia artificial CON NOMBRE Y APELLIDO HUMANOS —Mariana Restrepo en judicial, Andrés Cárdenas en política, Carolina Pinilla en Boyacá hiperlocal, entre otros—. El medio lo declara en su página de equipo, pero la firma es donde el lector se lo encuentra, y ahí parecen personas. Su feed RSS no trae etiqueta de autor, así que esa firma no nos llega.',
            'El único humano identificado con nombre es Juan Pablo Sáenz, columnista de «Escenario Político», periodista y estratega en comunicación política. Es columnista, no responsable del medio.',
            'Declara etiquetar las imágenes generadas por IA y no crear imágenes que simulen personas reales. Sus imágenes se sirven desde img.boyacadigital.com. Conviene comprobar qué proporción es generada antes de mostrarlas como «la foto del medio»: la regla del proyecto es imagen real del medio o ninguna.',
        ],
        sources: [
            'https://www.boyacadigital.com/politica-editorial',
            'https://www.boyacadigital.com/equipo',
            'https://www.holdingconsultants.org/nuestra-organizacion/',
            'https://www.boyacadigital.com/politica-de-privacidad',
        ],
        verifiedAt: null,
    },

    /**
     * LA RAZÓN.CO (Montería) — PRIMERA FICHA CON AUSENCIA DECLARADA (2026-08-11).
     *
     * Lo que se sabe está abajo con su fuente. Lo que NO se sabe —quién controla
     * el medio— se dice con la fecha en que se buscó, dónde se buscó y qué
     * documento lo cerraría. Es la diferencia entre un hueco y un silencio.
     *
     * UNA PISTA QUE NO SE PUBLICA, Y CONVIENE DEJAR ESCRITO POR QUÉ. Una búsqueda
     * devolvió que el medio pertenecería a «A&J Medios S.A.S.», dirigido por el
     * periodista Luis Darío Díaz con su esposa Ana Carolina Buitrago en la
     * gerencia. NO ENTRA EN LA FICHA: ninguna de las páginas que lo sostendrían
     * se pudo abrir —DataCrédito devuelve 403 y el perfil de infoperiodistas es
     * el de La Razón de Madrid, otro medio— y la única corroboración era el
     * resumen de un buscador, que no es una fuente consultable.
     *
     * Es exactamente el fallo que este archivo ya cometió dos veces y documenta
     * arriba: la compra de El Heraldo por Gilinski y el supuesto control de
     * Galvis sobre El Universal. Y es peor aquí, porque señalaría a dos personas
     * naturales con nombre y apellido. La pista queda en fichas/ como línea de
     * trabajo, no como afirmación.
     */
    'la-razon-cordoba': {
        ownerType: null,
        holdings: [
            'Su feed y su sitio son un WordPress activo desde 2014, con publicación cada pocas horas y agenda de Montería y el resto de Córdoba (Chinú, Sahagún, Lorica).',
        ],
        notes: [
            'No comparte nada con La Razón de Madrid, de La Razón de México ni de La Razón de Buenos Aires. Es la tercera colisión de nombre del catálogo, después de los dos Caracol y los dos El País.',
        ],
        sources: [
            'https://larazon.co/',
            'https://larazon.co/feed/',
        ],
        verifiedAt: null,

        // ── Ausencia declarada ──────────────────────────────────────────────
        consultadoEl: '2026-08-11',
        buscadoEn: [
            {
                fuente: 'Su propia página «Nosotros»',
                resultado: 'No publica mástil. El pie de página es solo «© 2026 Todos los derechos reservados», sin razón social, sin NIT y sin director. Su presentación institucional está maquetada como imagen, así que no hay texto que leer ni por programa ni con lector de pantalla.',
                url: 'https://larazon.co/nosotros/',
            },
            {
                fuente: 'Su página de contacto',
                resultado: 'Tampoco nombra responsable ni sociedad editora.',
                url: 'https://larazon.co/contacto/',
            },
            {
                fuente: 'Directorio del registro mercantil (DataCrédito Empresas)',
                resultado: 'Consta el establecimiento «Larazon.co Diario Digital», constituido el 24-09-2014, en la carrera 5 n.º 68-09 de Montería. NO constan ni representante legal ni socios. El servidor responde 403 a las consultas automatizadas, así que el dato viene de la consulta manual anotada en la ficha del 2026-08-09.',
                url: 'https://www.datacreditoempresas.com.co/directorio/larazonco-diario-digital.html',
            },
        ],
        falta: [
            'El certificado de existencia y representación de la Cámara de Comercio de Montería, que diría el representante legal y los socios. Es un trámite con formulario manual: no se alcanza desde aquí.',
            'El mástil que el medio publica como imagen, transcrito leyéndolo en un navegador.',
        ],
    },

    /*
     * ── LOS TRES QUE LA REGLA VIEJA DEJABA FUERA (2026-08-12) ────────────────
     *
     * EL DIARIO de Boyacá, Vive el Meta y Lente Regional entran hoy con la
     * regla que se estrenó con La Razón de Montería. No hay hallazgo nuevo que
     * los habilite: lo que cambió es que la ausencia de dueño se puede declarar
     * en vez de obligar a dejar el medio fuera.
     *
     * LOS TRES SE COMPROBARON DE NUEVO EL 2026-08-12, sitio por sitio, y NO se
     * copió lo que decían sus fichas del 9 de agosto. Menos mal: la de EL
     * DIARIO había caducado en tres días —ver su registro— y la de Vive el Meta
     * se quedaba corta.
     */

    'el-diario-boyaca': {
        ownerType: null,
        holdings: [
            'Publica en papel y en web —«producción impresa y virtual», según su propia misión— desde Tunja, con corresponsalía en Occidente y el Valle de Tenza.',
            'Dice ser la cuenta número uno de YouTube entre los medios de Boyacá, y mantiene canal propio (EDtv) con entrevistas a candidatos.',
        ],
        notes: [
            'CAMBIÓ DE MANOS EN JUNIO DE 2026, Y LA FICHA DEL 9 DE AGOSTO NO SE HABÍA ENTERADO. Ricardo Rodríguez Puerto —26 años como jefe de redacción de Boyacá Siete Días— asumió la dirección tras un acuerdo con la familia propietaria por el cual adquirió participación accionaria y pasó a ser copropietario. Su web ya no menciona a Julio César Peña Suárez ni a Pedro Esaú Mendieta, que eran los dos nombres de la ficha anterior.',
            'El director es hoy además accionista. Eso concentra en una persona la decisión editorial y el interés patrimonial, que en un diario regional pequeño es la estructura habitual y conviene decirla en voz alta.',
            'La gerencia figura a nombre de Camila Mendieta. Comparte apellido con el Pedro Esaú Mendieta que la ficha anterior daba como director general, lo que APUNTA a que la familia propietaria sea la Mendieta, pero no se afirma: no hay documento que lo diga y un apellido no es una prueba.',
        ],
        sources: [
            'https://eldiarioboyaca.com/quienes-somos/',
            'https://www.orfetv.com/2026/06/17/el-periodico-el-diario-inicia-una-nueva-etapa/',
        ],
        verifiedAt: null,

        // ── Ausencia declarada ──────────────────────────────────────────────
        consultadoEl: '2026-08-12',
        buscadoEn: [
            {
                fuente: 'Su página «¿Quiénes somos?»',
                resultado: 'Publica cargos y correos —Director: Ricardo Rodríguez Puerto; Gerencia: Camila Mendieta— y la dirección de Tunja (Transversal 4 n.º 46-53). NO publica razón social, NI NIT, NI accionariado. El pie dice solo «Periódico EL DIARIO, la casa de la información de Boyacá © 2020».',
                url: 'https://eldiarioboyaca.com/quienes-somos/',
            },
            {
                fuente: 'Orfetv (medio local de Boyacá), 17-06-2026',
                resultado: 'Informa del cambio de etapa: «Se concretó un acuerdo con la familia propietaria del periódico mediante el cual Ricardo Rodríguez Puerto adquirió una participación accionaria». Es la única fuente de tercero que dice que hay una familia detrás, y NO la nombra ni da el porcentaje.',
                url: 'https://www.orfetv.com/2026/06/17/el-periodico-el-diario-inicia-una-nueva-etapa/',
            },
            {
                fuente: '/contacto/ del propio medio',
                resultado: 'Devuelve 404. El único canal es el formulario de la página de «¿Quiénes somos?».',
                url: 'https://eldiarioboyaca.com/contacto/',
            },
        ],
        falta: [
            'El certificado de existencia y representación de la Cámara de Comercio de Tunja, que diría la razón social de la editora, sus socios y el porcentaje que compró el director. Sin razón social ni NIT hay que buscarlo por nombre comercial: es trámite manual y no se alcanza desde aquí.',
            'Confirmar si la familia propietaria es la Mendieta. Un solo documento del registro lo cierra en cualquiera de los dos sentidos.',
        ],
    },

    'vive-el-meta': {
        ownerType: null,
        holdings: [
            'La sociedad editora está nombrada y con NIT: Grupo La Independencia S.A.S., NIT 901092043-9, de Villavicencio. El medio lo declara en tres páginas distintas —contacto, política de ética y pie— con la fórmula «es propietaria y editora de viveelmeta.com».',
            'El sitio anuncia además secciones de Emisora y TV, así que la sociedad no se limita al portal escrito. No se ha comprobado qué son esas señales ni con qué licencia operan.',
        ],
        notes: [
            'QUIÉN CONTROLA LA SOCIEDAD NO CONSTA, y esa es toda la diferencia. Se conoce el vehículo y no a la persona, igual que en Pulzo. La única página de equipo publica dos cargos de redacción —Fernando Betancourt Durán, periodista, y Camilo Aguirre Grajales, editor general— y ningún propietario, accionista ni representante legal.',
            'Un medio digital pequeño en un departamento con política departamental con dinero es exactamente el perfil donde la propiedad más importa. La ausencia se declara por eso, no a pesar de eso.',
        ],
        sources: [
            'https://viveelmeta.com/contacto/',
            'https://viveelmeta.com/politica-de-etica/',
            'https://www.viveelmeta.com/equipo-editorial/',
        ],
        verifiedAt: null,

        // ── Ausencia declarada ──────────────────────────────────────────────
        consultadoEl: '2026-08-12',
        buscadoEn: [
            {
                fuente: 'Su página de contacto',
                resultado: 'Es la más explícita del catálogo entre las que no cierran la propiedad: «La persona jurídica Grupo La Independencia S.A.S es propietaria y editora de viveelmeta.com». Da NIT 901092043-9 y ciudad, y ni un nombre de persona.',
                url: 'https://viveelmeta.com/contacto/',
            },
            {
                fuente: 'Su página de equipo editorial',
                resultado: 'Dos cargos de redacción y nada más: Fernando Betancourt Durán (periodista) y Camilo Aguirre Grajales (editor general). No hay director, ni gerente, ni representante legal.',
                url: 'https://www.viveelmeta.com/equipo-editorial/',
            },
            {
                fuente: 'Espejos del RUES que sí respondieron con El Pilón, Aguasclaras y Diario del Sur',
                resultado: 'Grupo La Independencia S.A.S. no aparece en ninguno (consulta del 2026-08-09, repetida el 2026-08-12). La API pública de ruesapi.rues.org.co devuelve 404 a las cuatro rutas probadas, así que no se pudo consultar por programa.',
                url: 'https://www.rues.org.co/',
            },
        ],
        falta: [
            'El certificado de la Cámara de Comercio de Villavicencio con el NIT 901092043-9: socios, representante legal y estado de la matrícula. Es el trámite más directo de los tres, porque el NIT ya está en la mano.',
            'Comprobar que la matrícula está activa. Dos de los doce candidatos examinados el 9 de agosto tenían la editora en liquidación, así que la ausencia de dato no tranquiliza.',
            'Qué son la Emisora y la TV que anuncia, y a nombre de quién están.',
        ],
    },

    'lente-regional': {
        ownerType: null,
        holdings: [
            'Es un informativo web de Florencia con equipo nombrado y biografiado: Juan Pablo Sánchez Cardozo (director), Wendy Barrios Gasca (periodista y cofundadora), Cristian Sánchez (productor), Andrés Elías Cuellar (director comercial) y Alexander Cruz Aponte (productor general).',
        ],
        notes: [
            'PIDE «APOYO SIN RESTRICCIONES» de empresas y de la región, y no publica quién se lo da. Es lo que ellos mismos escriben, y deja abierto el conflicto de interés más común de la prensa regional: el que viene de quién financia, no de quién posee.',
            'Su fórmula editorial declarada es «destacar lo positivo, pero sin esconder lo negativo». En un departamento, quien produce las buenas noticias suele ser la gobernación, la alcaldía y las empresas — los mismos a los que pide apoyo. No se afirma que ocurra: se deja anotado dónde se vería.',
        ],
        sources: [
            'https://lenteregional.com/quienes-somos/',
            'https://lenteregional.com/equipo/',
        ],
        verifiedAt: null,

        // ── Ausencia declarada ──────────────────────────────────────────────
        consultadoEl: '2026-08-12',
        buscadoEn: [
            {
                fuente: 'Su página «Quiénes somos»',
                resultado: 'Presenta el proyecto y a sus dos fundadores con trayectoria, pero no publica razón social, NI NIT, NI socios. Los metadatos de la web declaran una S.A.S.: existe la figura societaria, no está publicada su identidad.',
                url: 'https://lenteregional.com/quienes-somos/',
            },
            {
                fuente: 'Su página de equipo',
                resultado: 'Cinco personas con cargo y biografía, incluido un director comercial. Ninguna figura como propietaria ni como socia.',
                url: 'https://lenteregional.com/equipo/',
            },
            {
                fuente: 'Su página de contacto',
                resultado: 'Solo un número de móvil (311 892 5721). Sin sociedad, sin dirección física y sin representante.',
                url: 'https://lenteregional.com/contacto/',
            },
        ],
        falta: [
            'La razón social y el NIT, que su web no publica pese a declararse S.A.S. en los metadatos. Sin uno de los dos no hay por dónde entrar en el registro mercantil.',
            'El certificado de la Cámara de Comercio del Caquetá una vez se tenga el nombre.',
            'Quién le da hoy el «apoyo sin restricciones» que pide. Es la pregunta que su propia página deja abierta, y en cuanto se conozca es evidencia de nivel 1.',
        ],
    },

    /**
     * EL NUEVO DÍA (Ibagué) — UN VÍNCULO QUE NO SE MARCA, Y POR QUÉ (2026-08-13).
     *
     * Este es el caso inverso de Pulzo. Allí la tentación era cerrar la propiedad
     * con fuentes que no aguantan; aquí la tentación es cerrarla con un hecho
     * VERDADERO pero caducado: que la familia Galvis —dueña de Vanguardia, en
     * este mismo catálogo— fundó y controló el periódico.
     *
     * ES VERDAD, Y ES DE OTRA EMPRESA. Alejandro Galvis Ramírez creó Editorial
     * Aguasclaras S.A. en 1992 con un grupo de empresarios tolimenses que tomaron
     * el 30 % de las acciones. Esa sociedad consta hoy como EDITORIAL AGUASCLARAS
     * S.A. EN LIQUIDACIÓN JUDICIAL, NIT 800052169, CON LA MATRÍCULA CANCELADA. El
     * impreso cerró el 22 de octubre de 2023 tras 31 años, y el Ministerio de
     * Trabajo le había abierto averiguación preliminar por impago de salarios,
     * liquidaciones y seguridad social.
     *
     * LO QUE PUBLICA HOY ES OTRA SOCIEDAD: EL NUEVO DÍA DIGITAL S.A.S., que
     * aparece en el pie, en los términos y en la política de datos del sitio, con
     * objeto social «la industria periodística en todas las manifestaciones». No
     * publica NIT, ni socios, ni representante legal, y no tiene página de equipo.
     *
     * NO HAY NI UN DOCUMENTO QUE ENLACE LAS DOS. Puede que sea la misma gente
     * detrás de un vehículo nuevo —es lo habitual cuando una editorial se liquida
     * y el cabecero sobrevive— y puede que no. Marcar `controlGroup: 'galvis'`
     * sobre esa suposición haría que el mapa de concentración afirmara que
     * Vanguardia y El Nuevo Día responden a la misma familia. Es una afirmación
     * sobre personas identificables y no tenemos con qué sostenerla, así que no
     * se hace. La pista queda escrita aquí, que es su sitio.
     */
    'el-nuevo-dia': {
        ownerType: null,
        holdings: [
            'Lo edita EL NUEVO DÍA DIGITAL S.A.S., de Ibagué, según el pie, los términos y condiciones y la política de tratamiento de datos de su propio sitio. Su objeto social declarado es «la industria periodística en todas las manifestaciones».',
            'Es digital desde el 22 de octubre de 2023, cuando circuló el último ejemplar impreso tras 31 años. Inauguró sede propia en el centro comercial La Estación de Ibagué el 13 de junio de 2026.',
            'Publica avisos legales de CORTOLIMA y de la rama judicial, y mantiene un portal de clasificados aparte (clasificadoselnuevodia.com.co).',
        ],
        notes: [
            'LA SOCIEDAD ANTERIOR NO ES LA ACTUAL, Y ESA DISTINCIÓN ES TODO EL EXPEDIENTE. El periódico lo editaba Editorial Aguasclaras S.A., creada en 1992 por Alejandro Galvis Ramírez —de la familia dueña de Vanguardia, en este catálogo— junto a empresarios tolimenses que tomaron el 30 % de las acciones. Esa sociedad figura hoy como «EDITORIAL AGUASCLARAS S.A. EN LIQUIDACIÓN JUDICIAL», NIT 800052169, con la matrícula cancelada.',
            'NO SE LE ASIGNA GRUPO DE CONTROL. Que Galvis controlara la editorial de 1992 no dice quién controla la S.A.S. de 2026, y no hay documento que las enlace. Con `controlGroup: galvis` el aviso de dueño compartido afirmaría que Vanguardia y El Nuevo Día responden a la misma familia; es un señalamiento sobre personas concretas y no hay con qué sostenerlo.',
            'Los cargos que el propio medio publica, en su nota del 13 de junio de 2026: Leónidas López, presidente de la junta directiva; Laura Millán, gerencia; Edwin Gutiérrez, jefatura de redacción; Loreny Cruz, dirección comercial. Ninguno figura como propietario ni como socio. Que exista junta directiva implica accionistas, y no están nombrados.',
            'Leónidas López era gerente del periódico en 2023, bajo la sociedad anterior, y hoy preside la junta de la nueva. Es continuidad de personas, no prueba de continuidad de propiedad, y se anota por lo primero.',
            'El impreso no cerró solo por el mercado: el Ministerio de Trabajo abrió averiguación preliminar a Editorial Aguas Claras S.A. por impago de liquidaciones, salarios y seguridad social. No dice nada de su orientación y no entra en ningún número, pero sí dice algo de su independencia, y por eso se deja escrito.',
        ],
        sources: [
            'https://www.elnuevodia.com.co/terminos-y-condiciones',
            'https://www.elnuevodia.com.co/politica-de-privacidad-de-datos',
            'https://www.elnuevodia.com.co/ibague/el-nuevo-dia-inicia-una-nueva-era-con-la-inauguracion-de-su-sede-propia-537295',
            'https://empresas.larepublica.co/colombia/tolima/ibague/editorial-aguasclaras-s-a-800052169',
            'https://elcronista.co/actualidad/el-nuevo-dia-otro-medio-impreso-que-pasa-a-la-era-digital',
            'https://www.ecosdelcombeima.com/ibague/nota-235510-se-acabo-el-impreso-de-el-nuevo-dia',
        ],
        verifiedAt: null,

        // ── Ausencia declarada ──────────────────────────────────────────────
        consultadoEl: '2026-08-13',
        buscadoEn: [
            {
                fuente: 'Sus términos y condiciones',
                resultado: 'Dan la razón social —EL NUEVO DÍA DIGITAL S.A.S.—, la dirección (Calle 6 n.º 1-27, Ibagué) y tres correos de contacto. NO dan NIT, NI socios, NI representante legal.',
                url: 'https://www.elnuevodia.com.co/terminos-y-condiciones',
            },
            {
                fuente: 'Su política de tratamiento de datos',
                resultado: 'Transcribe el objeto social completo de la sociedad —«la industria periodística en todas las manifestaciones»— y es la página más explícita del sitio sobre la empresa. Tampoco publica NIT ni accionariado, que es lo llamativo: detalla párrafos de objeto social y omite quién la posee.',
                url: 'https://www.elnuevodia.com.co/politica-de-privacidad-de-datos',
            },
            {
                fuente: 'Su página de contacto',
                resultado: 'Repite la razón social y da otra dirección, la de la sede nueva: Calle 60 n.º 12-224, centro comercial La Estación, locales P4, P5 y P6. Sin nombres.',
                url: 'https://www.elnuevodia.com.co/contactenos',
            },
            {
                fuente: 'Páginas de equipo o «quiénes somos» del propio medio',
                resultado: 'NO EXISTEN. /quienes-somos y /nosotros devuelven 404, y /equipo es un listado de noticias, no una plantilla de redacción. Los únicos cargos publicados están dentro de una nota informativa suya.',
                url: 'https://www.elnuevodia.com.co/quienes-somos',
            },
            {
                fuente: 'Espejo del RUES en empresas.larepublica.co, para la sociedad anterior',
                resultado: 'EDITORIAL AGUASCLARAS S.A. EN LIQUIDACIÓN JUDICIAL, NIT 800052169, Ibagué, matrícula cancelada, CIIU de publicidad y edición de periódicos. Confirma que la editora histórica —la de Galvis— ya no opera. No dice nada de la sociedad actual.',
                url: 'https://empresas.larepublica.co/colombia/tolima/ibague/editorial-aguasclaras-s-a-800052169',
            },
            {
                fuente: 'Directorios mercantiles para EL NUEVO DÍA DIGITAL S.A.S.',
                resultado: 'Solo confirman existencia, ciudad, dirección (Calle 6 n.º 1-27) y actividad de publicidad. Ninguno publica NIT, socios ni representante legal. informacolombia.com devolvió 429 en las dos consultas del día; empresas.larepublica.co no tiene ficha de esta sociedad y datacreditoempresas.com.co responde 403.',
                url: 'https://www.informacolombia.com/directorio-empresas/informacion-empresa/nuevo-dia-digital-sas',
            },
        ],
        falta: [
            'El NIT de EL NUEVO DÍA DIGITAL S.A.S. Es la llave de todo lo demás y hoy no está en ninguna fuente abierta que responda: sin él hay que buscar por nombre comercial en el registro.',
            'El certificado de existencia y representación de la Cámara de Comercio de Ibagué: socios, representante legal y fecha de constitución. Es el noveno certificado pendiente y es trámite manual.',
            'SI HAY O NO CONTINUIDAD SOCIETARIA CON EDITORIAL AGUASCLARAS. Es la pregunta que decide si este medio comparte dueño con Vanguardia. La cierran en cualquiera de los dos sentidos la fecha de constitución de la S.A.S. y su lista de socios.',
            'Cómo terminó la averiguación preliminar del Ministerio de Trabajo contra Editorial Aguas Claras S.A.',
        ],
    },

    /**
     * ── LOS SEIS DEPARTAMENTALES DEL 2026-08-14 ──────────────────────────────
     *
     * Comprobados de campo sitio por sitio los días 13 y 14, no copiados de
     * ningún listado. Los seis quedan con `ownerType: null`.
     *
     * QUE LOS SEIS SALGAN OPACOS NO ES CASUALIDAD Y CONVIENE DECIRLO. No es que
     * se buscara mal: es que la prensa digital departamental colombiana no
     * publica quién la posee, y en varios casos ni siquiera quién la dirige. El
     * patrón se repitió idéntico en las altas del 9, del 11, del 12 y del 13.
     * Cuando una ausencia se repite en veinte de veinte, deja de ser un hueco de
     * nuestra investigación y pasa a ser un hallazgo sobre el sector.
     */

    'periodismo-publico': {
        ownerType: null,
        holdings: [
            'Existe una sociedad localizable, PERIODISMO PUBLICO SAS, con domicilio en la Calle 7 n.º 5-61 de Soacha y actividad registrada de portales web. Es el único de los seis del lote cuya razón social aparece en un directorio mercantil.',
            'Nació en 2009 dentro de la Corporación Humanista, entidad sin ánimo de lucro de Soacha, como uno de sus tres proyectos. El medio se presenta como respuesta a la falta de contenidos locales del municipio.',
            'Su web publica un equipo con cargos: Ariel González (director), Diana Patricia Gómez (administración de contenidos), Germán Bustos (webmaster) y Camila Castillo Guerrero (reportería).',
        ],
        notes: [
            'SE CONOCE AL DIRECTOR Y NO AL DUEÑO. Ariel González figura como director en su propia web y en una página de perfil del medio; ninguna de las dos dice si fundó la sociedad, si es socio o si solo la dirige. Dirigir no es poseer, y el registro no debe dejar creer que sí.',
            'EL ORIGEN EN UNA CORPORACIÓN SIN ÁNIMO DE LUCRO Y LA SOCIEDAD ACTUAL SON DOS COSAS DISTINTAS, y no consta cómo se pasó de una a otra ni si la corporación conserva participación. Es la misma cautela que en El Nuevo Día: una entidad fundadora documentada no equivale a un dueño vigente.',
            'Se declara sobre tres pilares —«Denuncia Ciudadana, Investigación Periodística y Opinión Pública»— y sobre contar «la verdad». Eso describe un método, no una posición en el eje. Un medio cuyo oficio declarado es fiscalizar a la administración local no queda por ello a la izquierda ni a la derecha; mismo criterio con que Chocó 7 Días quedó en la mixta.',
            'Cubre Soacha, un municipio de más de medio millón de habitantes pegado a Bogotá y con administración propia. Es el perfil donde la financiación por pauta oficial más pesa, y no se ha podido establecer de qué vive.',
        ],
        sources: [
            'https://periodismopublico.com/quienes-somos/',
            'https://periodismopublico.com/ariel-gonzalez-director-de-periodismo-publico',
            'https://www.informacolombia.com/directorio-empresas/informacion-empresa/periodismo-publico-sas',
        ],
        verifiedAt: null,

        // ── Ausencia declarada ──────────────────────────────────────────────
        consultadoEl: '2026-08-14',
        buscadoEn: [
            {
                fuente: 'Su página «Quiénes somos»',
                resultado: 'Publica misión, los tres pilares editoriales y cuatro personas con cargo y correo, encabezadas por Ariel González como director. NO publica razón social, NI NIT, NI socios, NI de qué se financia.',
                url: 'https://periodismopublico.com/quienes-somos/',
            },
            {
                fuente: 'Su página de perfil del director',
                resultado: 'Confirma el cargo de Ariel González y nada más: sin trayectoria, sin decir si es fundador o socio, y sin mencionar la estructura societaria.',
                url: 'https://periodismopublico.com/ariel-gonzalez-director-de-periodismo-publico',
            },
            {
                fuente: 'Directorio mercantil informacolombia.com',
                resultado: 'PERIODISMO PUBLICO SAS, Calle 7 n.º 5-61, Soacha (Cundinamarca), actividad de portales web. Confirma que la sociedad existe y dónde. NO publica NIT, NI representante legal, NI socios.',
                url: 'https://www.informacolombia.com/directorio-empresas/informacion-empresa/periodismo-publico-sas',
            },
        ],
        falta: [
            'El NIT de PERIODISMO PUBLICO SAS y su certificado de la Cámara de Comercio de Bogotá, que cubre Soacha: socios, representante legal y fecha de constitución. Con la razón social en la mano es el trámite más directo de los seis.',
            'Si Ariel González es además socio, y con qué porcentaje. Es la diferencia entre un director contratado y un dueño-director, que en un medio pequeño cambia mucho.',
            'Qué relación conserva hoy la Corporación Humanista con la sociedad, si conserva alguna.',
            'De qué vive: proporción de pauta oficial del municipio de Soacha y de la Gobernación de Cundinamarca frente a ingreso privado.',
        ],
    },

    'seguimiento': {
        ownerType: null,
        holdings: [
            'Publica desde el 2 de abril de 2010, según su propia página de historia, con el proyecto gestado en 2009 y una refundación fechada el 1 de julio de 2016.',
            'Da dirección física: Carrera 3 n.º 17-27, oficina 208, Centro Histórico de Santa Marta.',
            'Se describe sobre tres pilares —periodismo de investigación, interacción con el lector por redes y memoria histórica— y se declara vigilante de la gestión de los servidores públicos de Santa Marta y del Magdalena.',
        ],
        notes: [
            'NO PUBLICA NI UN NOMBRE PROPIO. Ni director, ni editor, ni fundador, ni socio: su página de equipo se refiere a «un grupo de periodistas profesionales» sin nombrar a ninguno, y solo menciona que en 2016 existía un editor general, tampoco nombrado. El único nombre propio de todo el sitio es el de quien lo diseñó.',
            'ES LLAMATIVO EN UN MEDIO QUE SE DECLARA FISCALIZADOR. Quien pide cuentas a los servidores públicos de su departamento no publica quién responde por lo que él mismo escribe. Se anota como observación sobre la transparencia del medio, no como juicio sobre su contenido, y no entra en el número.',
            'La dirección de oficina en el Centro Histórico es el dato más sólido que da de sí mismo, y es el que permitiría buscarlo en el registro por ubicación si el nombre comercial no bastara.',
        ],
        sources: [
            'https://seguimiento.co/quienes-somos/',
            'https://seguimiento.co/contacto/',
        ],
        verifiedAt: null,

        // ── Ausencia declarada ──────────────────────────────────────────────
        consultadoEl: '2026-08-14',
        buscadoEn: [
            {
                fuente: 'Su página «Quiénes somos»',
                resultado: 'Cuenta la historia del medio con fechas precisas (2009, 2 de abril de 2010, 1 de julio de 2016) y sus pilares editoriales. NO nombra a ninguna persona, NO da razón social y NO da NIT.',
                url: 'https://seguimiento.co/quienes-somos/',
            },
            {
                fuente: 'Su página de contacto',
                resultado: 'Solo la dirección: Carrera 3 n.º 17-27 of. 208, Centro Histórico, Santa Marta. Sin representante, sin sociedad, sin NIT.',
                url: 'https://seguimiento.co/contacto/',
            },
            {
                fuente: 'Su página de equipo',
                resultado: 'Existe y no lista personas: describe al medio como obra de «un grupo de periodistas profesionales». Es la única página de equipo del catálogo que no nombra a nadie.',
                url: 'https://seguimiento.co/equipo/',
            },
        ],
        falta: [
            'La razón social. Sin ella no hay por dónde entrar al registro mercantil: habría que buscar por nombre comercial en la Cámara de Comercio de Santa Marta, o por la dirección de la oficina 208.',
            'Quién dirige el medio hoy. Un solo nombre público bastaría para empezar.',
            'De qué vive, y en particular qué peso tiene la pauta de la Alcaldía de Santa Marta y de la Gobernación del Magdalena en un medio que se declara vigilante de ambas.',
        ],
    },

    'prensa-libre-casanare': {
        ownerType: null,
        holdings: [
            'Publica un nombre con cargo y teléfono directo: Miguel Ángel Cristancho como editor, con móvil y correo de contacto en el pie del sitio.',
            'Cubre Yopal y el Casanare, con secciones propias de salud, medio ambiente, judicial y «información comercial».',
        ],
        notes: [
            'EL ÚNICO NOMBRE ES EL DEL EDITOR, Y NO SE DICE QUE SEA EL DUEÑO. En un digital regional pequeño lo habitual es que coincidan, pero suponerlo sería inventarlo: puede haber una sociedad detrás, o puede ser una persona natural. No consta ninguna de las dos cosas.',
            'NO HAY RAZÓN SOCIAL NI NIT en ninguna página del sitio, así que no hay por dónde entrar al registro salvo por nombre comercial.',
            'Mantiene una sección declarada de «información comercial». Que el contenido pagado esté señalado como tal es lo correcto y se anota a su favor; qué anunciantes hay detrás no consta, y en un departamento petrolero con regalías esa es la pregunta que importa.',
        ],
        sources: [
            'https://prensalibrecasanare.com/',
        ],
        verifiedAt: null,

        // ── Ausencia declarada ──────────────────────────────────────────────
        consultadoEl: '2026-08-14',
        buscadoEn: [
            {
                fuente: 'Pie y cabecera de su portada',
                resultado: 'Publica «Editor Miguel Ángel Cristancho» con móvil (310 216 5320) y correo. Es todo lo que declara de sí mismo. NO hay razón social, NI NIT, NI socios, NI representante legal.',
                url: 'https://prensalibrecasanare.com/',
            },
            {
                fuente: 'Rutas habituales de «quiénes somos», «nosotros», «contacto», «equipo» y avisos legales',
                resultado: 'NINGUNA EXISTE. Diez rutas convencionales probadas el 2026-08-14 y ninguna devuelve una página propia. El medio no tiene página institucional de ningún tipo.',
                url: 'https://prensalibrecasanare.com/quienes-somos/',
            },
        ],
        falta: [
            'Si existe sociedad editora o si el medio lo explota una persona natural. Es la primera bifurcación y hoy no se sabe cuál de las dos.',
            'El certificado de la Cámara de Comercio del Casanare, buscando por nombre comercial y por el nombre del editor.',
            'Qué peso tiene la pauta oficial de la Gobernación del Casanare y de la Alcaldía de Yopal, y qué anunciantes hay tras su sección de información comercial.',
        ],
    },

    'quindio-noticias': {
        ownerType: null,
        holdings: [
            'Reivindica actividad continuada desde 2011: su pie dice «Quindío Noticias® — 2011-2025», con el símbolo de marca registrada.',
            'Cubre Armenia y el Quindío, y sirve sus imágenes por la CDN de Jetpack en vez de desde su propio dominio.',
        ],
        notes: [
            'NO PUBLICA ABSOLUTAMENTE NADA SOBRE SÍ MISMO: ni sociedad, ni NIT, ni director, ni editor, ni dirección, ni teléfono. De los seis del lote es, junto con The Archipielago Press, el más cerrado.',
            'SU SERVIDOR RESPONDE 200 A CUALQUIER RUTA devolviendo la portada, y eso es una trampa de comprobación que hay que declarar: `/quienes-somos/`, `/nosotros/`, `/about/`, `/equipo/` y `/aviso-legal/` devuelven los mismos 106 kB de la portada. Quien las pruebe y vea «200» creerá que ha mirado sus páginas institucionales. No existen. La comprobación del 2026-08-14 tuvo que hacerse comparando tamaños de respuesta.',
            'El símbolo ® del pie AFIRMA una marca registrada, lo que implicaría un titular identificable ante la Superintendencia de Industria y Comercio. Es la vía de entrada más prometedora y no se ha recorrido: no se afirma que el registro exista, solo que el medio dice tenerlo.',
        ],
        sources: [
            'https://quindionoticias.com/',
        ],
        verifiedAt: null,

        // ── Ausencia declarada ──────────────────────────────────────────────
        consultadoEl: '2026-08-14',
        buscadoEn: [
            {
                fuente: 'Pie de su portada',
                resultado: 'Todo lo que declara de sí mismo son cinco caracteres: «Quindío Noticias® - 2011-2025». Ni una persona, ni una sociedad, ni una dirección.',
                url: 'https://quindionoticias.com/',
            },
            {
                fuente: 'Diez rutas institucionales habituales',
                resultado: 'Todas devuelven 200 con el contenido de la portada, incluidas `/about/` y `/aviso-legal/`. Es un catch-all: ninguna de esas páginas existe. Comprobado comparando el tamaño de las respuestas el 2026-08-14.',
                url: 'https://quindionoticias.com/quienes-somos/',
            },
            {
                fuente: 'Búsqueda web por director y propietario',
                resultado: 'Confirma que el medio existe y tiene audiencia grande en redes, y NO devuelve ningún nombre de director, propietario ni sociedad editora (consulta del 2026-08-14).',
            },
        ],
        falta: [
            'El titular de la marca «Quindío Noticias» en el registro de la Superintendencia de Industria y Comercio. Es la única vía de entrada que su propio sitio sugiere, por el ® que exhibe.',
            'Cualquier nombre propio. Es la ficha con menos asideros del lote junto a la del Archipiélago.',
            'La razón social, para poder pedir el certificado en la Cámara de Comercio de Armenia.',
        ],
    },

    'archipielago-press': {
        ownerType: null,
        holdings: [
            'Se presenta como diario digital del Archipiélago de San Andrés y Providencia, y publica en español e inglés, que es lo propio del departamento.',
            'Comparte casa con una emisora, `radioarchipielago.com`, a la que enlaza desde su sitio. Es el único vínculo institucional que expone.',
            'Su aviso de derechos es de 2024, y el desarrollo del sitio lo firma Zona Creativos SAS.',
        ],
        notes: [
            'ES LA FICHA MÁS VACÍA DEL CATÁLOGO. No publica un solo nombre propio: ni director, ni editor, ni redactor, ni socio. Los artículos van firmados «The Archipielago Press», es decir por la cabecera. Tampoco hay razón social, NIT ni dirección física.',
            'ZONA CREATIVOS SAS APARECE COMO DESARROLLADOR, NO COMO EDITOR, y no se le atribuye la propiedad: firmar el desarrollo de un sitio no es poseerlo. Se anota porque es el único nombre de sociedad que aparece en todo el dominio y porque es la primera puerta a la que llamar, no porque signifique nada todavía.',
            'LA RELACIÓN CON RADIO ARCHIPIÉLAGO ESTÁ SIN ESTABLECER y es la pista más prometedora: una emisora necesita licencia del MinTIC, y una licencia tiene titular público. Si las dos son de la misma casa, el nombre está en un registro estatal.',
            'ENTRA PESE A TODO ESTO, y merece decirse por qué: es la única voz web del Archipiélago que publica con regularidad. Excluirlo por opaco dejaría en blanco a un departamento insular de unos 60 000 habitantes, con una historia de conflicto territorial con Nicaragua y una población raizal con lengua propia. El mapa callaría justo donde menos debe.',
        ],
        sources: [
            'https://www.thearchipielagopress.co/nosotros/',
            'https://www.thearchipielagopress.co/',
        ],
        verifiedAt: null,

        // ── Ausencia declarada ──────────────────────────────────────────────
        consultadoEl: '2026-08-14',
        buscadoEn: [
            {
                fuente: 'Su página «Nosotros»',
                resultado: 'Existe y no dice quién es nadie: sin director, sin equipo, sin sociedad, sin NIT, sin dirección y sin fecha de fundación. Es la página institucional más vacía que se ha encontrado en el catálogo.',
                url: 'https://www.thearchipielagopress.co/nosotros/',
            },
            {
                fuente: 'Pie del sitio',
                resultado: '«Copyright © 2024 Todos los derechos reservados» y el crédito de desarrollo de Zona Creativos SAS. Ningún titular nombrado.',
                url: 'https://www.thearchipielagopress.co/',
            },
            {
                fuente: 'Su página de contacto',
                resultado: 'Enlace genérico sin dirección postal ni representante. El único enlace externo institucional es a radioarchipielago.com.',
                url: 'https://www.thearchipielagopress.co/contacto/',
            },
        ],
        falta: [
            'Quién es el titular de la licencia de Radio Archipiélago ante el MinTIC. Es la vía más prometedora, porque una concesión de radiodifusión tiene titular en un registro público, y cerraría la propiedad de las dos si resultan ser la misma casa.',
            'Confirmar o descartar que Zona Creativos SAS tenga algo más que el desarrollo del sitio.',
            'El certificado de la Cámara de Comercio de San Andrés, en cuanto haya un nombre que buscar. Hoy no lo hay.',
        ],
    },

    'abra-noticias': {
        ownerType: null,
        holdings: [
            'Publica cobertura local de Nariño con varias piezas al día, con Pasto e Ipiales como focos principales.',
            'Corre sobre el tema comercial «MoreNews», de AF themes, según su propio pie.',
        ],
        notes: [
            'SU PÁGINA DE CONTACTO ES LA DE LA PLANTILLA, SIN EDITAR. En el pie figuran un teléfono «+202-555-0156», una dirección en «23 Miller Court, Hagerstown» —Maryland, Estados Unidos— y un correo «acenews@support.com». Los tres vienen de serie con el tema y no son suyos. El medio no ha llegado a poner sus propios datos de contacto.',
            'ESO NO PONE EN DUDA SU CONTENIDO, y conviene separarlo: sus piezas son de Nariño, verificables y con hechos locales concretos. Lo que dice el dato es otra cosa —qué infraestructura de rendición de cuentas tiene el medio—, y es información relevante para el lector: hoy no hay ninguna dirección real a la que escribirle ni nadie a quien pedirle una rectificación.',
            'NO PUBLICA NI UN NOMBRE PROPIO más allá de la firma «ABRA NOTICIAS» en sus piezas. Sin razón social, sin NIT, sin director.',
            'SE ELIGIÓ FRENTE A `narinoahora.com`, que cubre el mismo departamento y también publica, solo por frescura —2 h contra 31 h en la comprobación del 2026-08-13—. El otro NO queda descartado, y si esta ficha no se puede cerrar conviene reconsiderarlo.',
        ],
        sources: [
            'https://abranoticias.com/',
        ],
        verifiedAt: null,

        // ── Ausencia declarada ──────────────────────────────────────────────
        consultadoEl: '2026-08-14',
        buscadoEn: [
            {
                fuente: 'Pie y cabecera de su portada',
                resultado: 'Los datos de contacto son los de demostración del tema «MoreNews»: teléfono +202-555-0156, dirección en Hagerstown (Maryland, EE. UU.) y correo acenews@support.com. No hay ni un dato real del medio, ni razón social, ni NIT, ni nombres.',
                url: 'https://abranoticias.com/',
            },
            {
                fuente: 'Diez rutas institucionales habituales',
                resultado: 'NINGUNA EXISTE. Probadas el 2026-08-14: no tiene página de «quiénes somos», ni de equipo, ni de contacto propia.',
                url: 'https://abranoticias.com/quienes-somos/',
            },
        ],
        falta: [
            'Cualquier dato real de contacto. Es el único medio del catálogo del que no se conoce ni una dirección ni un correo verdaderos, y eso conviene revisarlo pronto.',
            'La razón social, si existe, para la Cámara de Comercio de Pasto.',
            'Quién lo dirige o lo escribe. Todas sus piezas van firmadas por la cabecera.',
        ],
    },

    /**
     * AL AIRE NOTICIAS (Arauca) — Y LA CUARTA FICHA QUE CADUCA EN UNA SEMANA.
     *
     * La del 2026-08-09 afirmaba que «su web no tiene página de equipo ni de
     * "quiénes somos"; solo un formulario de contacto», y que no constaba
     * director ni propietario. Comprobado el 2026-08-14: tiene las dos páginas,
     * nombra a cuatro personas empezando por su director, y declara de qué vive.
     *
     * Es la cuarta vez en seis días —EL DIARIO, Vive el Meta, El Nuevo Día y
     * esta—. El patrón ya no admite otra lectura: **una ficha de propiedad de
     * prensa digital regional caduca en días, no en meses.**
     *
     * LO QUE SIGUE SIN CONSTAR ES LA PROPIEDAD, y por eso `ownerType: null`.
     * Miguel Matus figura como «CEO, Director», que es un cargo, no una escritura.
     * En un medio pequeño lo más probable es que dirija y posea, y «lo más
     * probable» no es lo que este campo publica.
     */
    'al-aire-noticias': {
        ownerType: null,
        holdings: [
            'La sociedad que reserva los derechos es Al Aire Comunicar S.A.S., citada en el pie del sitio como «Al Aire Comunicar | Al Aire Noticias | Todos los derechos reservados».',
            'Publica equipo con cargos: Miguel Matus (CEO y director), William Wielman (periodista), Andrés Rincón (webmaster y SEO) y Ray Cristancho («Master En Vivo»).',
            'Cubre los siete municipios del departamento —Arauca, Saravena, Tame, Arauquita, Fortul, Cravo Norte y Puerto Rondón— y mantiene emisiones en vivo además del portal escrito. Tiene canal propio de YouTube.',
            'DECLARA CÓMO SE FINANCIA, que es raro en el catálogo: pide donaciones directas a sus lectores por Nequi y Daviplata, y dice sostenerse «gracias al apoyo de personas comprometidas».',
        ],
        notes: [
            'SE CONOCE AL DIRECTOR Y NO AL DUEÑO. «CEO» es un cargo que la propia casa se asigna, no un dato registral. En un digital regional pequeño lo habitual es que dirigir y poseer coincidan, y suponerlo sería inventarlo: no consta el accionariado de Al Aire Comunicar S.A.S. ni su NIT.',
            'EL MODELO DE DONACIONES IMPORTA EN ARAUCA MÁS QUE EN OTROS SITIOS, y por eso se anota. Es departamento de frontera, con presencia de grupos armados y una historia larga de presión sobre periodistas locales. Un medio que no vive de la pauta de la gobernación tiene un perfil de presión distinto del que sí. No se premia ni se castiga con el número: se declara para que el lector lo pese.',
            'Su declaración de independencia —«sin influencias ni intereses externos»— es evidencia de nivel 4, lo que el medio dice de sí mismo, y el protocolo prohíbe sostener una ficha solo en eso. Aquí no la sostiene: es contexto, no fundamento.',
            'QUE PIDA DONACIONES NO DICE QUIÉN SE LAS DA, y esa es la pregunta abierta. Es el mismo hueco que en Lente Regional con su «apoyo sin restricciones», con la diferencia de que allí se pedía a empresas y aquí a personas.',
        ],
        sources: [
            'https://alairenoticias.com/al-aire-noticias/',
            'https://alairenoticias.com/donaciones/',
            'https://alairenoticias.com/',
        ],
        verifiedAt: null,

        // ── Ausencia declarada ──────────────────────────────────────────────
        consultadoEl: '2026-08-14',
        buscadoEn: [
            {
                fuente: 'Su página «¿Quiénes somos?»',
                resultado: 'Existe —contra lo que decía la ficha del 9 de agosto— y nombra a cuatro personas con cargo, encabezadas por Miguel Matus como CEO y director. Se define como «epicentro del periodismo independiente en Arauca». NO publica razón social completa, NI NIT, NI socios, NI fecha de fundación.',
                url: 'https://alairenoticias.com/al-aire-noticias/',
            },
            {
                fuente: 'Su página de donaciones',
                resultado: 'Declara el modelo de financiación: donaciones de lectores por Nequi y Daviplata, y afirma no tener influencias ni intereses externos. NO nombra ninguna entidad legal receptora, NI cuenta bancaria a nombre de nadie, NI donante o patrocinador alguno.',
                url: 'https://alairenoticias.com/donaciones/',
            },
            {
                fuente: 'Pie del sitio',
                resultado: 'Cita «Al Aire Comunicar» como titular de los derechos. Es la única mención de la sociedad y va sin NIT y sin domicilio.',
                url: 'https://alairenoticias.com/',
            },
            {
                fuente: 'Espejos del RUES que sí respondieron con El Pilón, Aguasclaras y Diario del Sur',
                resultado: 'Al Aire Comunicar S.A.S. no aparece en ninguno (consulta del 2026-08-09, repetida el 2026-08-14). Sin NIT no hay forma de consultar por programa.',
                url: 'https://www.rues.org.co/',
            },
        ],
        falta: [
            'El certificado de existencia y representación de Al Aire Comunicar S.A.S. en la Cámara de Comercio de Arauca: NIT, socios, representante legal y estado de la matrícula. Es el décimo certificado pendiente del catálogo.',
            'Confirmar que la matrícula está activa. Dos de las doce editoras examinadas el 2026-08-09 estaban en liquidación y sus feeds publicaban con normalidad.',
            'Si Miguel Matus es además socio, y con qué porcentaje.',
            'SI APARECE CAPITAL LIGADO A POLÍTICA O A CONTRATACIÓN DEPARTAMENTAL EN ARAUCA, se declara antes que cualquier número. Es la advertencia que dejó escrita la ficha del 9 de agosto y sigue vigente.',
        ],
    },

    /**
     * CABLENOTICIAS — TODO ESTÁ DOCUMENTADO, Y TODO ES VIEJO (2026-08-14).
     *
     * Es el caso contrario al del resto de altas recientes. En los regionales no
     * hay ni un nombre; aquí hay estructura societaria completa, con accionistas,
     * junta directiva y parentescos — y la fuente que la trae declara su última
     * actualización en **marzo de 2018**, ocho años atrás. La compra que la
     * origina es de **2011**.
     *
     * LA REGLA DEL PRESENTE MANDA, POR CUARTA VEZ EN EL CATÁLOGO. Tras Semana, EL
     * DIARIO y El Nuevo Día, este es otro medio cuya propiedad «se sabe» por
     * documentos que nadie ha renovado. Con `ownerType` asignado, la interfaz
     * afirmaría al lector que hoy lo controlan dos empresarios venezolanos, y eso
     * no consta: consta que lo controlaban. Va como ausencia declarada.
     *
     * Y NINGÚN `ownerType` LE SERVÍA IGUAL. `internacional` es «con sede fuera de
     * Colombia, que cubre el país desde una agenda editorial extranjera», y este
     * canal tiene redacción en Bogotá, firmas colombianas y agenda colombiana:
     * los extranjeros son sus dueños, no el medio. Etiquetarlo así lo habría
     * mandado al mismo saco que el cable extranjero, que es justo lo que este
     * producto trabaja para no confundir.
     */
    cablenoticias: {
        ownerType: null,
        holdings: [
            'La sociedad colombiana es CABLE NOTICIAS TV S.A.S., con sede en Bogotá (Avenida Carrera 28 n.º 36-41) y operación también en Medellín.',
            'El Media Ownership Monitor de Colombia registra que el canal «pertenece por 100 % a la empresa Cable Noticias TV S.A.S., que está subdividido entre los empresarios venezolanos Alberto Federico Ravell y Tobías Carrero Nácar», y que LA EMPRESA SE ENCUENTRA REGISTRADA EN PANAMÁ.',
            'Junta directiva según esa misma fuente: Tobías Carrero Nácar (presidente del directorio), Rafael Andrés Carrero (hijo de Carrero) y Jesús Ramírez (yerno de Ravell). Representante registrado: José Raúl Serna Quintero, vicepresidente de Global Media Telecomunicaciones S.A.',
            'El canal lo fundó en septiembre de 2007 el periodista colombiano Juan Gonzalo Ángel Restrepo, que lo vendió en agosto de 2011 por US$ 17 millones.',
            'Alberto Federico Ravell fue director de Globovisión (Venezuela) y fundador de La Patilla; su oposición al gobierno de Chávez está documentada en prensa. Tobías Carrero Nácar es empresario del sector asegurador venezolano.',
        ],
        notes: [
            'TODA LA EVIDENCIA ES ANTERIOR A 2018 Y ESO ES LO DETERMINANTE. La ficha del Media Ownership Monitor declara «last change: 2018/03/14» y la operación que describe es de 2011. Ninguna fuente consultada acredita quién controla el canal HOY. Es la regla del presente por cuarta vez —tras Semana, EL DIARIO y El Nuevo Día—, y aquí sirve para NO afirmar una propiedad, igual que en El Nuevo Día sirvió para no afirmar un dueño compartido.',
            'LA SOCIEDAD ÚLTIMA ESTÁ EN PANAMÁ, y eso cierra el hilo por diseño, no por falta de búsqueda: es una jurisdicción sin registro público de accionistas. Es el mismo muro que en Pulzo, con la diferencia de que allí las fuentes se contradecían y aquí coinciden pero están caducadas.',
            'QUE SUS DUEÑOS DOCUMENTADOS SEAN EXTRANJEROS NO LO CONVIERTE EN MEDIO INTERNACIONAL, y la distinción importa para no clasificarlo mal: la redacción es colombiana, las firmas son colombianas y la agenda es colombiana. Lo que se declara es la propiedad, no la procedencia del contenido.',
            'NO SE LE DEDUCE ORIENTACIÓN DE LA BIOGRAFÍA POLÍTICA VENEZOLANA DE SUS DUEÑOS. Ravell fue una figura de la oposición a Chávez; trasladar eso al eje colombiano sería la misma traslación sin justificar que el catálogo tiene pendiente con los trece medios internacionales. Y aun cuando se aceptara, la propiedad documentada tiene ocho años.',
            'NO DUPLICA A NOTICIAS UNO, que emite en este canal. Comprobado en su RSS del 14-08-2026: agenda propia y firmas con correo corporativo del canal. Alquilar espacio de emisión no comparte redacción.',
        ],
        sources: [
            'https://colombia.mom-gmr.org/es/media/detail/outlet/cable-noticias/',
            'https://www.portafolio.co/negocios/empresas/canal-cablenoticias-pasa-manos-venezolano-137362',
            'https://www.semana.com/negocios/articulo/venden-cablenoticias-venezolanos-us17-millones/132837/',
            'https://www.cablenoticias.tv/rss',
        ],
        verifiedAt: null,

        // ── Ausencia declarada ──────────────────────────────────────────────
        consultadoEl: '2026-08-14',
        buscadoEn: [
            {
                fuente: 'Su propio sitio',
                resultado: 'NO ES AUDITABLE POR RUTAS: devuelve exactamente 220 175 bytes para cualquier URL, incluidas /politica-de-privacidad, /programacion y una inventada. Es una aplicación de página única que resuelve el contenido en el navegador. El único rastro societario en el bundle es «S.A.S.» suelto y «COPYRIGHT 2021».',
                url: 'https://www.cablenoticias.tv/',
            },
            {
                fuente: 'Media Ownership Monitor Colombia',
                resultado: 'Da la estructura completa —accionistas, junta, parentescos, registro en Panamá— y declara su última actualización el 14-03-2018. Es la fuente más sólida y la que hace que esta ficha no pueda cerrarse: describe una situación de hace ocho años.',
                url: 'https://colombia.mom-gmr.org/es/media/detail/outlet/cable-noticias/',
            },
            {
                fuente: 'Prensa económica colombiana (Portafolio, Semana, El Colombiano, La República)',
                resultado: 'Cubren la venta de 2011 y el nombramiento de un director del canal. NINGUNA publica cambio de propiedad posterior, y su silencio no es prueba de continuidad.',
                url: 'https://www.portafolio.co/negocios/empresas/canal-cablenoticias-pasa-manos-venezolano-137362',
            },
            {
                fuente: 'Búsqueda de operaciones societarias 2024-2026',
                resultado: 'Sin resultados. No consta venta, fusión ni cambio de control en los últimos años; tampoco consta lo contrario.',
                url: 'https://colombia.mom-gmr.org/es/media/detail/outlet/cable-noticias/',
            },
        ],
        falta: [
            'El certificado de existencia y representación de CABLE NOTICIAS TV S.A.S. en la Cámara de Comercio de Bogotá: NIT, composición accionaria actual, representante legal y estado de la matrícula. Es el undécimo certificado pendiente del catálogo, y aquí es el ÚNICO documento que puede cerrar la ficha, porque la vía societaria termina en Panamá.',
            'Confirmar si la matrícula sigue activa. Dos de las doce editoras examinadas el 2026-08-09 estaban en liquidación y sus feeds publicaban con normalidad.',
            'Si Ravell y Carrero Nácar siguen siendo los accionistas en 2026, y en qué proporción.',
            'La ficha del canal ante el MinTIC como operador de televisión por suscripción, que sí tiene titular público. Es la pista que funcionó con The Archipielago Press y su licencia de Radio Archipiélago.',
        ],
    },

    /**
     * PULZO — EL HILO LLEGA A UNA SOCIEDAD Y AHÍ SE PARA (2026-08-11).
     *
     * Es el cuarto medio más consumido del país y su propiedad última es la peor
     * documentada de todo el tramo de audiencia alta. Merece explicarse, porque
     * la tentación de cerrarlo era grande.
     *
     * TRES FUENTES Y NO COINCIDEN:
     *
     *   · El **Media Ownership Monitor** —proyecto dedicado justo a esto— dice
     *     que el 100 % de las acciones está a nombre de INQLAB S.A.S., y nombra a
     *     Guillermo Eduardo Franco Morales como fundador y CEO y a Julio Mario
     *     Camacho como representante legal. Es la única fuente abierta con
     *     estructura societaria, y su estudio es viejo: La República publicó
     *     después que Franco se retiró del medio, así que sus personas están
     *     caducadas aunque la sociedad siga.
     *   · **Wikipedia** afirma que INQLAB está registrada en Panamá y pertenece
     *     al grupo Santo Domingo. Su única referencia para eso es la ficha de
     *     SembraMedia, y **esa ficha no dice nada de Santo Domingo ni de
     *     INQLAB**: da otro fundador (Andrés Murcia), otro año (2012) y describe
     *     el medio como sociedad con fines de lucro financiada por publicidad.
     *   · **La República** lo llama «un portal web del Grupo Santo Domingo» EN EL
     *     TITULAR, y su propio texto no lo sostiene en ninguna línea.
     *
     * POR ESO NO SE LE ASIGNA `controlGroup`, y no es prudencia decorativa: si se
     * le pusiera `valorem`, el aviso de dueño compartido diría que CUATRO medios
     * de este catálogo —El Espectador, Blu Radio, Noticias Caracol y Pulzo—
     * responden ante la familia Santo Domingo. Sería la concentración más grande
     * que este mapa habría enseñado nunca, construida sobre un titular sin
     * cuerpo y una nota de Wikipedia que su propia fuente desmiente.
     *
     * Es el mismo error de la compra de El Heraldo por Gilinski, que se anunció y
     * se deshizo, con el agravante de que aquí el aviso saldría en cada noticia
     * que cubran dos de los cuatro.
     *
     * LA CONTRADICCIÓN SÍ SE PUBLICA. Que la propiedad última del cuarto medio
     * más leído del país esté en disputa entre sus tres fuentes públicas es un
     * hecho sobre el espacio mediático colombiano, y ocultarlo para que la ficha
     * quedara limpia sería justo lo contrario de lo que hace este archivo.
     */
    'pulzo': {
        ownerType: 'conglomerado',
        holdings: [
            'El 100 % de las acciones figura a nombre de INQLAB S.A.S., según la ficha del Media Ownership Monitor de Colombia, que es el único registro público abierto con su estructura societaria.',
            'La misma sociedad participa en otras tres empresas de tecnología y comercio electrónico: Quantum (49 %), Chicplace (43 %) y Appto (15 %). Son participaciones minoritarias, no control.',
            'Quién controla INQLAB S.A.S. NO CONSTA en ninguna fuente que se haya podido abrir. El hilo llega a la sociedad y ahí se detiene, a diferencia del resto de medios colombianos del catálogo, donde termina en personas.',
        ],
        notes: [
            'SUS TRES FUENTES PÚBLICAS SE CONTRADICEN, y se deja constancia en vez de elegir una: el Media Ownership Monitor da a Guillermo Eduardo Franco Morales como fundador y CEO y a Julio Mario Camacho como representante legal; Wikipedia afirma que INQLAB está registrada en Panamá y pertenece al grupo Santo Domingo; y la ficha de SembraMedia que Wikipedia cita como única prueba de eso no menciona ni a Santo Domingo ni a INQLAB, sino a otro fundador (Andrés Murcia) y otro año de fundación (2012).',
            'La República tituló «Guillermo Franco se retira de Pulzo, un portal web del Grupo Santo Domingo», pero el cuerpo de esa nota no afirma nada sobre la propiedad. NO se le atribuye por eso ningún grupo de control: hacerlo pondría a cuatro medios de este catálogo bajo el mismo dueño a partir de un titular que su propio texto no respalda.',
            'Los datos de personas del Media Ownership Monitor están caducados en al menos un punto: la propia La República informó de la salida de Franco del medio. La sociedad se mantiene; los cargos, no necesariamente.',
        ],
        sources: [
            'https://colombia.mom-gmr.org/en/media/detail/outlet/pulzocom/',
            'https://directorio.sembramedia.org/pulzo/',
            'https://es.wikipedia.org/wiki/Pulzo_(medio_digital)',
            'https://www.larepublica.co/internet-economy/guillermo-franco-se-retira-de-pulzo-un-portal-web-del-grupo-santo-domingo-2741710',
        ],
        verifiedAt: '2026-08-11',
    },

    'semana': {
        ownerType: 'conglomerado',
        controlGroup: 'gilinski',
        holdings: [
            'El Grupo Gilinski compró el 50 % en 2019 y ejerció la opción sobre el resto en noviembre de 2020: desde entonces controla el 100 %.',
            'El mismo grupo controla El País (Cali) desde enero de 2023, así que dos medios de este catálogo responden ante el mismo dueño.',
            'Su activo principal en Colombia es el Banco GNB Sudameris, entre los diez mayores del país, y también está detrás del banco digital Lulo Bank. Tras el pulso con el Grupo Empresarial Antioqueño, la familia quedó con el control de Nutresa, en alimentos.',
        ],
        notes: [
            'Su dueño es a la vez banquero y dueño de una de las mayores empresas de alimentos del país. La cobertura del sector financiero y de la industria alimentaria es donde ese cruce se haría visible.',
        ],
        sources: [
            'https://www.larepublica.co/empresas/el-grupo-gilinski-compro-50-de-la-revista-semana-2822114',
            'https://www.larepublica.co/empresas/gilinski-ejerce-opcion-de-compra-a-minoritarios-de-semana-y-se-queda-con-100-del-grupo-3087653',
            'https://www.elcolombiano.com/negocios/estos-son-los-negocios-de-los-gilinski-LH16110139',
            'https://www.eltiempo.com/economia/empresas/jaime-gilinski-quien-es-el-magnate-detras-de-sura-y-nutresa-655482',
        ],
        verifiedAt: VERIFICADO,
    },

    'el-nuevo-siglo': {
        ownerType: 'familiar',
        controlGroup: 'uribe-vegalara',
        holdings: [
            'Lo sostiene la familia Uribe Vegalara: Juan Pablo Uribe y Elvira Vegalara lo financian desde 1990.',
            'Lo dirige su hijo, Juan Gabriel Uribe Vegalara.',
        ],
        notes: [],
        sources: [
            'https://www.las2orillas.co/la-batalla-de-diez-familias-por-no-dejar-morir-sus-periodicos-impresos/',
            'https://www.las2orillas.co/quienes-son-los-duenos-de-periodicos-regionales-que-no-dan-plata-pero-si-poder/',
        ],
        verifiedAt: VERIFICADO,
    },

    // ── Internacionales ─────────────────────────────────────────────────────

    'bbc-mundo': {
        ownerType: 'publico',
        controlGroup: 'bbc',
        holdings: [
            'Es el servicio en español del BBC World Service, la división internacional de la corporación pública británica.',
            'El World Service NO se financia solo con la licencia de televisión británica: en 2025-26 el Foreign, Commonwealth and Development Office —el ministerio de Exteriores del Reino Unido— aportó 137 millones de libras frente a 221 millones de la licencia.',
        ],
        notes: [
            'Aproximadamente un tercio del presupuesto del servicio que produce BBC Mundo sale del ministerio de Exteriores británico. Es un hecho presupuestario público y pertinente para leer su cobertura de política exterior; no implica por sí mismo intervención editorial.',
        ],
        sources: [
            'https://commonslibrary.parliament.uk/research-briefings/cdp-2025-0132/',
            'https://publications.parliament.uk/pa/cm5901/cmselect/cmpubacc/1299/report.html',
            'https://www.nao.org.uk/reports/the-bbc-world-services-savings-programme/',
        ],
        verifiedAt: VERIFICADO,
    },

    'dw-es': {
        ownerType: 'publico',
        controlGroup: 'deutsche-welle',
        holdings: [
            'Deutsche Welle es el servicio exterior de radiodifusión de Alemania.',
            'A diferencia de las cadenas públicas alemanas, que viven del canon, se financia con el presupuesto federal, es decir con impuestos.',
        ],
        notes: [],
        sources: [
            'https://en.wikipedia.org/wiki/Deutsche_Welle',
            'https://www.eurotopics.net/en/148493/deutsche-welle',
            'https://international.bonn.de/international-profile/international-location/germaninternationalbroadcasting-deutschewelle.php',
        ],
        verifiedAt: VERIFICADO,
    },

    'france24-es': {
        ownerType: 'publico',
        controlGroup: 'france-medias-monde',
        holdings: [
            'Pertenece íntegramente al Estado francés desde 2008, a través del holding France Médias Monde, que agrupa también a RFI.',
            'France Médias Monde recibió una subvención estatal de 263 millones de euros en 2023.',
        ],
        notes: [],
        sources: [
            'https://en.wikipedia.org/wiki/France_M%C3%A9dias_Monde',
            'https://en.wikipedia.org/wiki/France_24',
            'https://statemediamonitor.com/2025/08/france-medias-monde-fmm/',
        ],
        verifiedAt: VERIFICADO,
    },

    'euronews-es': {
        ownerType: 'internacional',
        controlGroup: 'alpac',
        holdings: [
            'El fondo portugués Alpac Capital compró el 88 % al empresario egipcio Naguib Sawiris en diciembre de 2021, operación cerrada en 2022. Su vehículo Future Media EuVECA controla hoy cerca del 98 %.',
            'Nació como consorcio de radiodifusoras públicas europeas, pero su control es hoy privado.',
        ],
        notes: [
            'Radio Free Europe/Radio Liberty documentó que Alpac Capital tiene vínculos con un asesor del primer ministro húngaro Viktor Orbán. Se consigna el señalamiento con su fuente, no una conclusión sobre la línea editorial del canal.',
        ],
        sources: [
            'https://www.advanced-television.com/2021/12/20/alpac-capital-takes-majority-stake-in-euronews/',
            'https://www.rferl.org/a/hungary-euronews-orban-david/31619957.html',
            'https://en.wikipedia.org/wiki/Alpac_Capital',
        ],
        verifiedAt: VERIFICADO,
    },

    'el-pais-es': {
        ownerType: 'internacional',
        controlGroup: 'prisa',
        holdings: [
            'Lo edita el Grupo Prisa. Su primer accionista es Amber Capital, el vehículo de Joseph Oughourlian, que preside el grupo y mantiene una participación cercana al 30 % desde hace más de quince años.',
            'Detrás vienen la familia Polanco a través de Rucandio (7,6 %), Global Alconaba (7,1 %) y la empresa familiar de Carlos Slim, Control Empresarial de Capitales (7,0 %).',
            'El mismo grupo controla Caracol Radio y W Radio en Colombia, que aparecen igualmente en este catálogo: tres medios, un dueño. Fuera de la prensa, Prisa es dueña de la editorial educativa Santillana.',
            'NO tiene ninguna relación con El País de Cali, que es del Grupo Gilinski y aparece también en este catálogo. Mismo nombre, dueños distintos.',
        ],
        notes: [],
        sources: [
            'https://es.wikipedia.org/wiki/Grupo_PRISA',
            'https://prisa.labolsavirtual.com/accionistas-prisa.html',
            'https://cronicaglobal.elespanol.com/business/20260324/dueno-pais-establece-barcelona-sede-fondo-espana/1003742744702_0.html',
        ],
        verifiedAt: VERIFICADO,
    },

    'efe': {
        ownerType: 'publico',
        controlGroup: 'sepi',
        holdings: [
            'Agencia estatal española. Su capital está íntegramente en manos de la Sociedad Estatal de Participaciones Industriales (SEPI), el holding público que depende del Ministerio de Hacienda.',
            'Vive de la venta de contenidos a clientes de todo el mundo y de una subvención anual del Estado español.',
        ],
        notes: [],
        sources: [
            'https://www.sepi.es/en/sectores/agencia-efe',
            'https://en.wikipedia.org/wiki/EFE',
            'https://statemediamonitor.com/2025/08/efe/',
        ],
        verifiedAt: VERIFICADO,
    },

    'reuters': {
        ownerType: 'internacional',
        controlGroup: 'woodbridge',
        holdings: [
            'Pertenece a Thomson Reuters, cuyo accionista mayoritario es The Woodbridge Company, la sociedad de inversión privada de la familia Thomson de Canadá, con cerca del 68 % de las acciones.',
            'Los Principios del Trust de Reuters obligan a la compañía a preservar la independencia informativa. Woodbridge se comprometió por contrato a votar en apoyo de esos principios mientras siga bajo control familiar.',
            'Están respaldados por la Reuters Founders Share Company, que posee una acción especial con poderes de veto si alguien intenta tomar el control de forma que amenace la independencia editorial.',
        ],
        notes: [],
        sources: [
            'https://www.thomsonreuters.com/content/dam/ewp-m/documents/thomsonreuters/en/pdf/corporate-responsibility/thomson-reuters-founders-share-company-limited.pdf',
            'https://www.stocktitan.net/sec-filings/TRI/schedule-13d-a-thomson-reuters-corp-can-amended-major-shareholder-rep-9ade70af18cf.html',
        ],
        verifiedAt: VERIFICADO,
    },

    'cnn-es': {
        ownerType: 'internacional',
        controlGroup: 'warner-bros-discovery',
        holdings: [
            'CNN pertenece a Warner Bros. Discovery, que en 2025 anunció su división en dos compañías, con CNN en la rama de canales de televisión.',
            'Warner Bros. Discovery aceptó además ser adquirida por Paramount Skydance por unos 110 000 millones de dólares. A julio de 2026 la operación NO se ha consumado: está aplazada por demandas de fiscales generales estatales y del Writers Guild of America, y podría irse a 2027.',
            'Se consigna el dueño de hoy, no el anunciado. Una compra firmada y no cerrada no es un cambio de propiedad.',
        ],
        notes: [],
        sources: [
            'https://www.axios.com/local/atlanta/2025/06/10/cnn-warner-bros-discovery-two-companies-atlanta-restructuring',
            'https://www.cnn.com/2026/07/24/media/paramount-warner-bros-discovery-merger-delay',
            'https://www.npr.org/2026/02/27/nx-s1-5728914/what-happens-to-cnn-if-paramount-buys-warner-bros-discovery',
        ],
        verifiedAt: VERIFICADO,
    },

    'nyt': {
        ownerType: 'internacional',
        controlGroup: 'ochs-sulzberger',
        holdings: [
            'The New York Times Company cotiza en bolsa, pero la familia Ochs-Sulzberger conserva el control mediante una estructura de doble clase de acciones creada en 1967.',
            'Las acciones de clase B, en manos de la familia a través del fideicomiso de 1997, eligen el 70 % del consejo de administración. Las de clase A, que cotizan, eligen el 30 % restante.',
            'La familia controla así el consejo con una participación económica minoritaria, en torno al 20 % del capital.',
        ],
        notes: [],
        sources: [
            'https://en.wikipedia.org/wiki/The_New_York_Times_Company',
            'https://richardpollock.substack.com/p/the-tight-family-trust-that-reigns',
        ],
        verifiedAt: VERIFICADO,
    },

    'wsj': {
        ownerType: 'internacional',
        controlGroup: 'news-corp',
        holdings: [
            'Lo publica Dow Jones & Company, filial de News Corp, que lo compró en 2007.',
            'La familia Murdoch controla News Corp mediante una doble clase de acciones y un fideicomiso familiar que concentra el voto.',
            'En septiembre de 2025 un acuerdo familiar dejó a Lachlan Murdoch con el control del imperio, que incluye Fox News y el Journal.',
        ],
        notes: [],
        sources: [
            'https://www.cnbc.com/2025/09/08/lachlan-murdoch-cements-control-of-fox-wsj-media-empire-in-new-family-deal.html',
            'https://www.aljazeera.com/news/2007/7/23/dow-jones-board-okays-news-corp-bid',
        ],
        verifiedAt: VERIFICADO,
    },

    'financial-times': {
        ownerType: 'internacional',
        controlGroup: 'nikkei',
        holdings: [
            'Pertenece al grupo japonés Nikkei Inc., que lo compró a Pearson en julio de 2015 por 844 millones de libras.',
            'Pearson lo había tenido desde 1957.',
        ],
        notes: [],
        sources: [
            'https://www.nikkei.co.jp/nikkeiinfo/en/news/release_en_20150725_01.pdf',
            'https://asia.nikkei.com/business/nikkei-completes-acquisition-of-financial-times',
        ],
        verifiedAt: VERIFICADO,
    },

    'la-vanguardia-es': {
        ownerType: 'internacional',
        controlGroup: 'godo',
        holdings: [
            'Pertenece al Grupo Godó de Comunicación, de la familia Godó, que lo fundó el 1 de febrero de 1881. Después de más de 140 años, el 100 % del capital sigue en la misma rama familiar.',
            'El grupo posee también el diario Mundo Deportivo y la emisora catalana RAC1.',
        ],
        notes: [],
        sources: [
            'https://en.wikipedia.org/wiki/Grupo_God%C3%B3',
            'https://www.diario-red.com/articulo/medios/grupo-godo-propietario-vanguardia-lleva-cabo-transicion-hereditaria-cupula/20250708072903050664.html',
        ],
        verifiedAt: VERIFICADO,
    },
};

/** Ficha de un medio, o null si no la tiene. */
export function getOwnership(mediaId) {
    return OWNERSHIP_PROFILES[mediaId] ?? null;
}

/**
 * ¿Hay algo documentado que publicar?
 *
 * Separado en su propia función porque la interfaz tiene que preguntarlo en
 * varios sitios y la respuesta "no, y lo decimos" es una rama de primera clase,
 * no un caso borde.
 */
export function hasDocumentedOwnership(mediaId) {
    const profile = getOwnership(mediaId);
    if (!profile) return false;
    return profile.sources.length > 0 && (profile.holdings.length > 0 || profile.notes.length > 0);
}

/**
 * ¿Cuántas de estas voces son en realidad la misma?
 *
 * Dado el conjunto de medios que cubre un hecho, devuelve los grupos de control
 * que aportan MÁS DE UNO. Solo esos: un grupo con un único medio en la lista no
 * es un dato sobre la cobertura, es una ficha de propiedad, y ya está en el mapa
 * de medios.
 *
 * POR QUÉ IMPORTA, y es el motivo de que esto exista: la cifra que el producto
 * pone delante es «5 medios cubren este hecho», y el lector la lee como cinco
 * voces. Si dos responden ante el mismo dueño, la pluralidad real es de cuatro.
 * No se afirma que se hayan coordinado —eso no consta y no se publica—; se
 * expone quién manda en cada una, que es un hecho registral, y el lector saca
 * su conclusión con el dato delante en vez de sin él.
 *
 * @param {string[]} mediaIds
 * @returns {Array<{groupId: string, label: string, sectores: string[], medios: string[]}>}
 */
export function gruposCompartidos(mediaIds) {
    const porGrupo = new Map();

    for (const id of Array.isArray(mediaIds) ? mediaIds : []) {
        const grupo = getOwnership(id)?.controlGroup;
        if (!grupo || !CONTROL_GROUPS[grupo]) continue;

        // Un mismo medio repetido en la lista no cuenta dos veces: haría
        // aparecer una concentración inventada a partir de un duplicado.
        const yaVistos = porGrupo.get(grupo) ?? [];
        if (!yaVistos.includes(id)) porGrupo.set(grupo, [...yaVistos, id]);
    }

    return [...porGrupo.entries()]
        .filter(([, medios]) => medios.length > 1)
        .map(([groupId, medios]) => ({
            groupId,
            label: CONTROL_GROUPS[groupId].label,
            sectores: CONTROL_GROUPS[groupId].sectores,
            medios,
        }))
        .sort((a, b) => b.medios.length - a.medios.length);
}

/**
 * SUBCATEGORÍAS DEL MAPA DE PROPIEDAD.
 *
 * POR QUÉ EXISTEN (2026-08-09, decisión de Jose). El catálogo tenía 10 medios
 * regionales y va camino de ~28: uno por departamento. Sin separarlos, los
 * regionales pasarían a ser la MITAD de los puntos del mapa mediático, y el
 * retrato que esa página existe para dar —tres dueños concentran la mitad de lo
 * que se publica en Colombia— quedaría enterrado bajo un enjambre de diarios de
 * provincia que no compiten en ese espacio.
 *
 * No es esconderlos: es que la pregunta de esa página tiene un sujeto. El mismo
 * argumento que ya sacó del mapa a los medios internacionales, y por eso mismo
 * los regionales siguen ahí, a un clic, con su ficha entera.
 */
export const ALCANCES = {
    nacional: {
        label: 'Nacionales',
        descripcion: 'Circulan en todo el país y pertenecen a grupos con intereses en otros sectores. Son los que deciden la agenda nacional.',
    },
    independiente: {
        label: 'Independientes',
        descripcion: 'Sin ánimo de lucro, por membresía o por cooperación. Su conflicto de interés, cuando lo hay, viene de quién los financia, no de quién los posee.',
    },
    regional: {
        label: 'Regionales',
        descripcion: 'Con sede y agenda en un departamento. Se muestran aparte porque son muchos y su espacio de competencia es otro, no porque cuenten menos.',
    },
};

/**
 * En cuál de las tres cae un medio. Excluyentes: un medio sale una sola vez.
 *
 * EL ORDEN DE LAS PREGUNTAS ES LA DECISIÓN. Se mira PRIMERO si tiene
 * departamento, así que un futuro medio regional e independiente cuenta como
 * regional y queda fuera de la vista por omisión. Es deliberado y es la parte
 * discutible: al separarlos por alcance antes que por tipo de dueño, el mapa
 * gana legibilidad nacional y pierde de vista al independiente de provincia,
 * que suele ser justo el que menos se ve ya.
 *
 * @param {{id: string, departamento?: string}} medio
 * @returns {'nacional'|'independiente'|'regional'}
 */
export function alcanceDe(medio) {
    if (medio?.departamento) return 'regional';
    return getOwnership(medio?.id)?.ownerType === 'independiente' ? 'independiente' : 'nacional';
}
