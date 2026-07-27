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
 * NO contiene todavía lo que más le interesa al lector: quiénes son las
 * personas dueñas, qué otros negocios tienen, qué se les ha señalado y cómo
 * eso podría condicionar la cobertura. Esos campos están vacíos A PROPÓSITO.
 *
 * Por qué están vacíos
 * --------------------
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

export const OWNERSHIP_PROFILES = {
    // ── Colombia ────────────────────────────────────────────────────────────
    'colombia-informa': pending('independiente'),
    'voragine': pending('independiente'),
    'cuestion-publica': pending('independiente'),
    'razon-publica': pending('independiente'),
    'cambio': pending('independiente'),
    'rtvc': pending('publico'),
    'el-espectador': pending('conglomerado'),
    'la-silla-vacia': pending('independiente'),
    'el-tiempo': pending('conglomerado'),
    'w-radio': pending('internacional'),
    'caracol-radio': pending('internacional'),
    'noticias-caracol': pending('conglomerado'),
    'portafolio': pending('conglomerado'),
    'infobae-co': pending('internacional'),
    'la-republica': pending('familiar'),
    'el-heraldo': pending('familiar'),
    'el-universal': pending('familiar'),
    'blu-radio': pending('conglomerado'),
    'noticias-rcn': pending('conglomerado'),
    'la-patria': pending('familiar'),
    'vanguardia': pending('familiar'),
    'la-opinion': pending('familiar'),
    'el-pais-cali': pending('conglomerado'),
    'kienyke': pending('independiente'),
    'la-fm': pending('conglomerado'),
    'el-colombiano': pending('familiar'),
    'semana': pending('conglomerado'),
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
