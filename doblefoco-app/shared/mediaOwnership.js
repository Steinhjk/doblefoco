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
 * Desde el 2026-07-29 contiene además, para once medios, quién los controla y
 * con qué otros negocios: la primera tanda documentada. Se eligieron por peso
 * en lo que se publica, no por lo que opinemos de ellos. El resto sigue vacío.
 *
 * LO QUE ESTA TANDA HIZO VISIBLE, y es el motivo de existir del archivo:
 *   · Semana y El País (Cali) tienen el mismo dueño (Grupo Gilinski).
 *   · El Espectador y Blu Radio tienen el mismo dueño (Valorem/Santo Domingo).
 *   · Noticias RCN y La FM tienen el mismo dueño (Organización Ardila Lülle).
 *   · Caracol Radio (Grupo Prisa) y Noticias Caracol (Santo Domingo) NO tienen
 *     ninguna relación de propiedad, pese al nombre.
 * Seis de los medios que el lector ve como voces distintas son tres dueños.
 *
 * Y UNA QUE SE CAYÓ AL COMPROBARLA: la compra de El Heraldo por el Grupo
 * Gilinski se anunció en junio de 2023 y se deshizo en agosto. Dar por hecho lo
 * anunciado habría producido una concentración inventada, con nombres propios.
 * Es exactamente el fallo que la regla de citar existe para evitar.
 *
 * Por qué el resto sigue vacío
 * ----------------------------
 * Son afirmaciones sobre personas y empresas reales e identificables. Escribir
 * "el dueño de X busca Y" sin poder enlazar dónde consta es exactamente lo que
 * este proyecto eliminó en la Fase 0, con el agravante de que aquí el sujeto
 * puede demandar. La regla del producto —no se publica lo que no se puede
 * verificar contra su fuente— aplica igual, o más, cuando el sujeto es el dueño
 * de un medio.
 *
 * Mientras estén vacíos la interfaz DECLARA LA AUSENCIA, igual que hace con la
 * cobertura que falta. Un "pendiente de documentar" visible vale más que un
 * párrafo plausible.
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
 * Ficha vacía. Se usa para todo medio sin documentación todavía, que hoy son
 * todos. Explícita, para que la interfaz no tenga que adivinar.
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

/** Fecha de la primera tanda documentada. */
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
        sectores: [],
    },
    valorem: {
        label: 'Valorem — familia Santo Domingo',
        sectores: [],
    },
    'ardila-lulle': {
        label: 'Organización Ardila Lülle',
        sectores: ['bebidas', 'azúcar', 'textiles', 'deporte'],
    },
    prisa: {
        label: 'Grupo Prisa',
        sectores: [],
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
};

export const OWNERSHIP_PROFILES = {
    // ── Colombia ────────────────────────────────────────────────────────────
    'colombia-informa': pending('independiente'),
    'voragine': pending('independiente'),
    'cuestion-publica': pending('independiente'),
    'razon-publica': pending('independiente'),
    'cambio': pending('independiente'),
    'rtvc': pending('publico'),

    'el-espectador': {
        ownerType: 'conglomerado',
        controlGroup: 'valorem',
        holdings: [
            'Lo publica Comunican S.A., del holding Valorem, controlado por la familia Santo Domingo.',
            'Valorem está también detrás de Blu Radio, que aparece igualmente en este catálogo.',
        ],
        notes: [],
        sources: [
            'https://colombia.mom-gmr.org/es/media/detail/outlet/el-espectador/',
            'https://colombia.mom-gmr.org/es/proprietarios/companies-database/detail/company/company/show/valorem-sa/',
        ],
        verifiedAt: VERIFICADO,
    },

    'la-silla-vacia': pending('independiente'),

    'el-tiempo': {
        ownerType: 'conglomerado',
        controlGroup: 'sarmiento-aval',
        holdings: [
            'Luis Carlos Sarmiento Angulo compró Casa Editorial El Tiempo en 2012.',
            'Es el mayor accionista y presidente del Grupo Aval, el mayor conglomerado financiero de Colombia, con intereses en banca, construcción e infraestructura.',
        ],
        notes: [],
        sources: [
            'https://colombia.mom-gmr.org/es/proprietarios/propietarios-individuales/detail/owner/owner/show/luis-carlos-sarmiento-angulo/',
            'https://www.semana.com/negocios/articulo/luis-carlos-sarmiento-controla-el-tiempo/146788/',
        ],
        verifiedAt: VERIFICADO,
    },

    'w-radio': pending('internacional'),

    'caracol-radio': {
        ownerType: 'internacional',
        controlGroup: 'prisa',
        holdings: [
            'Pertenece al Grupo Prisa, de España, controlado desde 2003 por el banquero de inversión Joseph Oughourlian. El mismo grupo es dueño de W Radio.',
            'NO tiene relación de propiedad con Noticias Caracol, que es del grupo Santo Domingo. Comparten nombre y no dueño.',
        ],
        notes: [],
        sources: [
            'https://www.las2orillas.co/tres-millonarios-duenos-de-los-cinco-poderosos-noticieros-radiales/',
        ],
        verifiedAt: VERIFICADO,
    },

    'noticias-caracol': pending('conglomerado'),
    'portafolio': pending('conglomerado'),

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

    'la-republica': pending('familiar'),

    'el-heraldo': {
        ownerType: 'familiar',
        controlGroup: 'el-heraldo-familias',
        holdings: [
            'Controlado por las familias Manotas, Pumarejo y Fernández, con un tercio de las acciones cada una.',
            'En junio de 2023 el Grupo Semana, de la familia Gilinski, firmó un memorando para comprar el 100 %. La operación se cayó en agosto de ese año y el diario siguió con sus dueños.',
        ],
        notes: [],
        sources: [
            'https://www.pulzo.com/economia/duenos-heraldo-cuales-tres-familias-que-mandan-ese-periodico-PP2729022',
            'https://www.publimetro.co/barranquilla/2023/08/19/se-le-cayo-multimillonario-negocio-a-los-gilinski-y-a-semana-por-estas-razones/',
        ],
        verifiedAt: VERIFICADO,
    },

    'el-universal': pending('familiar'),

    'blu-radio': {
        ownerType: 'conglomerado',
        controlGroup: 'valorem',
        holdings: [
            'Pertenece a Valorem, el holding de la familia Santo Domingo.',
            'El mismo holding está detrás de El Espectador, que aparece igualmente en este catálogo.',
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
            'La misma organización controla RCN Radio y La FM, que aparece igualmente en este catálogo.',
        ],
        notes: [],
        sources: [
            'https://colombia.mom-gmr.org/en/owners/companies/detail/company/company/show/organizacion-ardila-luelle-sa/',
            'https://www.eltiempo.com/economia/empresas/carlos-ardila-luelle-de-que-empresas-era-dueno-610443',
        ],
        verifiedAt: VERIFICADO,
    },

    'la-patria': pending('familiar'),
    'vanguardia': pending('familiar'),
    'la-opinion': pending('familiar'),

    'el-pais-cali': {
        ownerType: 'conglomerado',
        controlGroup: 'gilinski',
        holdings: [
            'Lo controla el Grupo Semana, de Gabriel Gilinski, desde enero de 2023. La familia Lloreda salió tras más de ochenta años al frente del diario.',
            'Comparte propietario con Semana: dos medios de este catálogo responden ante el mismo dueño.',
        ],
        notes: [],
        sources: [
            'https://www.larepublica.co/empresas/familia-lloreda-cerro-trato-con-gabriel-gilinski-por-adquiscion-de-el-pais-de-cali-3521173',
            'https://lasillavacia.com/historias/silla-nacional/con-el-pais-de-cali-gilinski-arranca-la-expansion-del-modelo-semana',
        ],
        verifiedAt: VERIFICADO,
    },

    'kienyke': pending('independiente'),

    'la-fm': {
        ownerType: 'conglomerado',
        controlGroup: 'ardila-lulle',
        holdings: [
            'Forma parte de RCN Radio, de la Organización Ardila Lülle, que cubre más del 80 % del territorio nacional con más de 160 emisoras.',
            'La misma organización controla Noticias RCN, que aparece igualmente en este catálogo.',
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
        ],
        notes: [],
        sources: [
            'https://www.larepublica.co/empresas/el-grupo-gilinski-compro-50-de-la-revista-semana-2822114',
            'https://www.larepublica.co/empresas/gilinski-ejerce-opcion-de-compra-a-minoritarios-de-semana-y-se-queda-con-100-del-grupo-3087653',
        ],
        verifiedAt: VERIFICADO,
    },

    'el-nuevo-siglo': pending('familiar'),

    // ── Internacionales ─────────────────────────────────────────────────────
    'bbc-mundo': pending('publico'),
    'dw-es': pending('publico'),
    'france24-es': pending('publico'),
    'euronews-es': pending('internacional'),
    'el-pais-es': pending('internacional'),
    'efe': pending('internacional'),
    'reuters': pending('internacional'),
    'cnn-es': pending('internacional'),
    'nyt': pending('internacional'),
    'wsj': pending('internacional'),
    'financial-times': pending('internacional'),
    'la-vanguardia-es': pending('internacional'),
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
