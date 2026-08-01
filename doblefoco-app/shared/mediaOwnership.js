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
 * Queda UNO sin documentar: `colombia-informa`. Su razón social aparece en
 * directorios de registro mercantil, pero no se ha podido citar una fuente
 * consultable sobre quién la controla ni con qué financiación. Se queda vacía y
 * visible antes que verosímil.
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
 * Ficha vacía. Se usa para todo medio sin documentación todavía. Explícita, para
 * que la interfaz no tenga que adivinar.
 */
const pending = (ownerType) => ({
    ownerType,
    /** Otros negocios del grupo propietario. Requiere `sources`. */
    holdings: [],
    /** Señalamientos, sanciones o conflictos documentados. Requiere `sources`. */
    notes: [],
    /** URLs consultables. Sin esto, lo de arriba no se publica. */
    sources: [],
    /** Fecha de verificación documental. null = nadie lo ha comprobado. */
    verifiedAt: null,
});

/** Fecha de la documentación. */
const VERIFICADO = '2026-07-29';

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
export const CONTROL_GROUPS = {
    gilinski: {
        label: 'Grupo Gilinski',
        sectores: ['banca', 'alimentos'],
    },
    valorem: {
        label: 'Valorem — familia Santo Domingo',
        sectores: ['retail', 'logística', 'transporte', 'entretenimiento', 'industria', 'inmobiliario', 'turismo'],
    },
    'ardila-lulle': {
        label: 'Organización Ardila Lülle',
        sectores: ['bebidas', 'azúcar', 'textiles', 'deporte'],
    },
    prisa: {
        label: 'Grupo Prisa',
        sectores: ['educación editorial'],
    },
    'sarmiento-aval': {
        label: 'Luis Carlos Sarmiento Angulo — Grupo Aval',
        sectores: ['banca', 'construcción', 'infraestructura'],
    },
    'infobae-hadad': {
        label: 'Daniel Hadad — Grupo Infobae',
        sectores: ['radio', 'televisión'],
    },
    'el-colombiano-accionistas': {
        label: 'Familia Gómez Martínez y empresarios antioqueños',
        sectores: [],
    },
    'el-heraldo-familias': {
        label: 'Familias Manotas, Pumarejo y Fernández',
        sectores: [],
    },

    // ── Familias regionales ─────────────────────────────────────────────────
    galvis: {
        label: 'Familia Galvis — Galvis Ramírez y Cía',
        sectores: [],
    },
    'restrepo-la-patria': {
        label: 'Familia Restrepo',
        sectores: [],
    },
    'uribe-vegalara': {
        label: 'Familia Uribe Vegalara',
        sectores: [],
    },
    catalitico: {
        label: 'Grupo Empresarial Catalítico',
        sectores: ['tecnología', 'mercadeo'],
    },
    'lopez-escauriaza-araujo': {
        label: 'Familias fundadoras, familia Araujo y Galvis Ramírez (Editora del Mar)',
        sectores: ['hotelería'],
    },

    // ── Colombia: independientes y público ──────────────────────────────────
    'estado-colombiano': {
        label: 'Estado colombiano',
        sectores: [],
    },
    'la-silla-socios': {
        label: 'Juanita León y socios de La Silla Vacía',
        sectores: [],
    },
    'el-escarbabajo': {
        label: 'Diana Salinas y Claudia Báez — El Escarbabajo SAS',
        sectores: [],
    },
    'ntc-television': {
        label: 'NTC Televisión — Noticias Uno',
        sectores: [],
    },
    'voragine-fundacion': {
        label: 'Fundación Vorágine Periodismo Contracorriente',
        sectores: [],
    },
    'razon-publica-fundacion': {
        label: 'Fundación Razón Pública',
        sectores: [],
    },
    'cambio-inversionistas': {
        label: 'Inversionistas de Cambio — Lara Salive, Silva Luján y Armitage',
        sectores: ['siderurgia'],
    },
    'kienyke-bernal': {
        label: 'Adriana Bernal Salgado — Kieneskien Editorial',
        sectores: ['seguros'],
    },
    'pcc-partido': {
        label: 'Partido Comunista Colombiano (PCC)',
        sectores: [],
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
            'Fundado el 20 de julio de 1957 como medio de comunicación de tiraje nacional. Órgano de prensa oficial del Partido Comunista Colombiano (PCC).',
            'Su dirección editorial la ejerce la Fundación de Estudios Políticos e Históricos VOZ y el Comité Ejecutivo Central del PCC.',
        ],
        notes: [
            'Financiado mediante la venta del impreso, suscripciones digitales y aportes de su militancia. Históricamente ha documentado luchas populares, sindicales y agrarias.',
        ],
        sources: [
            'https://semanariovoz.com/quienes-somos/',
            'https://colombia.mom-gmr.org/es/medios/detalle/outlet/semanario-voz/',
        ],
        verifiedAt: VERIFICADO,
    },

    /**
     * El único que sigue vacío. Su razón social —Corporación Red de Medios
     * Alternativos, Agencia Colombiana de Prensa Popular— aparece en
     * directorios de registro mercantil, pero no se ha localizado una fuente
     * consultable sobre quién la controla ni de qué vive. Lo que hace falta es
     * el certificado de existencia del RUES o sus estatutos.
     */
    'colombia-informa': pending('independiente'),

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
        ],
        notes: [
            'Que el jefe del Gobierno nombre a su director es la razón por la que la clasificación de sesgo de este medio es la más volátil del catálogo: cambia con el gobierno de turno, no con su sala de redacción.',
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
        ownerType: 'familiar',
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
        ownerType: 'independiente',
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
