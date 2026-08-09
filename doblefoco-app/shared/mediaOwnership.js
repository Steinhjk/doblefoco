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
 *   ownerType    uno de OWNER_TYPES.
 *   controlGroup clave de CONTROL_GROUPS. Es lo que enlaza con las personas.
 *   holdings     otros negocios del grupo. Requiere `sources`.
 *   notes        señalamientos, sanciones o conflictos. Requiere `sources`.
 *   sources      URLs consultables. Sin esto, lo de arriba no se publica.
 *   verifiedAt   fecha de comprobación documental. null = nadie lo ha mirado.
 */

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
