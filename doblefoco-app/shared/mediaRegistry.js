/**
 * CATÁLOGO DE MEDIOS — FUENTE ÚNICA DE VERDAD
 * ===========================================
 *
 * Todo dato sobre un medio (sesgo, factualidad, dominio, feed, logo) sale de
 * aquí. Ningún otro archivo puede declarar el sesgo de un medio.
 *
 * Por qué existe
 * --------------
 * El mismo medio tenía hasta tres valores distintos según dónde se mirara:
 *
 *   El Nuevo Siglo    +0.30 (mockData)  vs  +0.55 (mediaLogos)
 *   Blu Radio         +0.25             vs  +0.35
 *   Cambio            -0.30             vs  -0.40
 *   Cuestión Pública  -0.40             vs  -0.50
 *   Colombia Informa  -0.60             vs  -0.70
 *   El Colombiano     +0.35             vs  +0.40
 *
 * Y además contradecían src/docs/metodologia.txt, que es el documento público
 * que el sitio muestra a los lectores. Un agregador cuya afirmación central es
 * "clasificamos medios con método" no puede tener tres clasificaciones del
 * mismo medio.
 *
 * ⚠️ REVISIÓN EDITORIAL PENDIENTE
 * -------------------------------
 * Los valores de `bias` son la afirmación más discutible que hace este
 * producto: son juicios sobre organizaciones reales e identificables. Los que
 * están aquí unifican los que ya existían dispersos en el código y llevan una
 * justificación escrita, pero NO han pasado por revisión editorial formal.
 * Antes de publicar, cada valor debe ser revisado y firmado por el equipo
 * editorial, y `reviewedAt` debe dejar de ser null.
 *
 * FIRMAR EXIGE CITAR
 * ------------------
 * Poner `reviewedAt` OBLIGA a rellenar `biasSources` con al menos un enlace
 * donde conste lo que se afirma. `npm run check:registry` falla si no está, y
 * está probado inyectando el caso a propósito.
 *
 *     reviewedAt: '2026-08-15',
 *     biasSources: [
 *         'https://colombia.mom-gmr.org/en/media/detail/outlet/revista-semana/',
 *         'https://moe.org.co/observatorio/',
 *     ],
 *
 * No es burocracia. Los lectores pueden reportar que un medio está mal
 * clasificado (F2-07), y eso es útil para saber dónde mirar — pero una campaña
 * coordinada puede inflar esa señal a voluntad. La regla corta el camino
 * indirecto: se puede señalar cuanto se quiera, y cambiar la clasificación
 * sigue exigiendo producir dónde consta. Un recuento de reportes no es fuente.
 *
 * Fuentes utilizables para el caso colombiano, ya localizadas: el Media
 * Ownership Monitor de RSF y FECOLPER (propiedad), el Observatorio de Medios de
 * la MOE (sesgo de cobertura en elecciones), ColombiaCheck (factualidad) y las
 * agencias internacionales para los medios que cubran. Donde no haya ancla
 * externa, se declara como criterio propio en vez de disimularlo.
 *
 * Escala: -1.0 (izquierda marcada) … 0.0 (sin línea marcada) … +1.0 (derecha
 * marcada). El 0.0 NO significa «neutral»: significa que no se detectó una
 * inclinación consistente. Ver el comentario de SPECTRUM_LABEL en
 * shared/biasAnalysis.js.
 * `factuality` es el historial de rigor factual del medio, NO una evaluación
 * de una noticia concreta.
 */

/** Bandas del espectro. metodologia.txt debe describir exactamente estas. */
export const SPECTRUM_BANDS = [
    { id: 'left', min: -1.0, max: -0.6, label: 'Izquierda' },
    { id: 'center-left', min: -0.6, max: -0.2, label: 'Izquierda moderada' },
    { id: 'center', min: -0.2, max: 0.2, label: 'Sin línea marcada' },
    { id: 'center-right', min: 0.2, max: 0.6, label: 'Derecha moderada' },
    { id: 'right', min: 0.6, max: 1.0, label: 'Derecha' },
];

/** Feed de búsqueda de Google News restringido a un dominio. */
const gnews = (domain) =>
    `https://news.google.com/rss/search?q=${encodeURIComponent(`site:${domain}`)}` +
    '&hl=es-419&gl=CO&ceid=CO:es-419';

/**
 * Todos los feeds fueron verificados contra la red el 2026-07-26.
 * `via: 'gnews'` significa que el medio no publica RSS propio accesible: el
 * titular sigue siendo literal suyo, pero el enlace es una redirección de
 * Google News y así debe mostrarse.
 */
export const MEDIA_REGISTRY = [
    // ─────────── Izquierda / centro-izquierda ───────────
    {
        id: 'semanario-voz', name: 'Semanario VOZ', shortName: 'Semanario VOZ',
        domain: 'semanariovoz.com', country: 'CO', group: 'Partido Comunista Colombiano',
        bias: -0.80, factuality: 0.85, reviewedAt: null,
        biasRationale: 'Periódico semanal fundado en 1957; órgano de difusión política del Partido Comunista Colombiano (PCC) con línea editorial marxista y de izquierda popular.',
        feed: { url: 'https://semanariovoz.com/feed/', via: 'direct', category: 'Política' },
    },
    {
        id: 'colombia-informa', name: 'Colombia Informa', shortName: 'Col. Informa',
        domain: 'colombiainforma.info', country: 'CO', group: 'Comunicación popular',
        bias: -0.65, factuality: 0.78, reviewedAt: null,
        biasRationale: 'Agencia de comunicación popular ligada a procesos sociales y campesinos; encuadre explícito desde movimientos de base.',
        feed: { url: 'https://www.colombiainforma.info/feed/', via: 'direct', category: 'Política' },
    },
    {
        id: 'revista-raya', name: 'Revista RAYA', shortName: 'Revista RAYA',
        domain: 'revistaraya.com', country: 'CO', group: 'Investigación independiente',
        bias: -0.55, factuality: 0.89, reviewedAt: null,
        biasRationale: 'Medio de investigación periodística independiente enfocado en derechos humanos, fiscalización del poder político y conflicto armado.',
        feed: { url: gnews('revistaraya.com'), via: 'gnews', category: 'Judicial' },
    },
    {
        id: 'voragine', name: 'Vorágine', shortName: 'Vorágine',
        domain: 'voragine.co', country: 'CO', group: 'Investigación independiente',
        bias: -0.50, factuality: 0.90, reviewedAt: null,
        biasRationale: 'Periodismo de investigación centrado en poder económico, conflicto armado y derechos humanos.',
        feed: { url: 'https://voragine.co/feed/', via: 'direct', category: 'Judicial' },
    },
    {
        id: 'cuestion-publica', name: 'Cuestión Pública', shortName: 'C. Pública',
        domain: 'cuestionpublica.com', country: 'CO', group: 'Investigación independiente',
        bias: -0.45, factuality: 0.89, reviewedAt: null,
        biasRationale: 'Investigación sobre corrupción y captura del Estado; enfoque de veeduría al poder establecido.',
        feed: { url: 'https://cuestionpublica.com/feed/', via: 'direct', category: 'Judicial' },
    },
    {
        id: 'razon-publica', name: 'Razón Pública', shortName: 'R. Pública',
        domain: 'razonpublica.com', country: 'CO', group: 'Fundación académica',
        bias: -0.40, factuality: 0.92, reviewedAt: null,
        biasRationale: 'Análisis académico con énfasis en política social y crítica al modelo económico vigente.',
        feed: { url: 'https://razonpublica.com/feed/', via: 'direct', category: 'Economía' },
    },
    {
        id: 'cambio', name: 'Cambio', shortName: 'Cambio',
        domain: 'cambiocolombia.com', country: 'CO', group: 'Independiente',
        bias: -0.40, factuality: 0.88, reviewedAt: null,
        biasRationale: 'Revista de investigación; agenda centrada en fiscalización del poder político y económico.',
        feed: { url: gnews('cambiocolombia.com'), via: 'gnews', category: 'Política' },
    },
    {
        id: 'noticias-uno', name: 'Noticias Uno', shortName: 'Noticias Uno',
        domain: 'noticiasuno.com', country: 'CO', group: 'NTC Televisión',
        bias: -0.40, factuality: 0.89, reviewedAt: null,
        biasRationale: 'Noticiero de investigación con treinta años de fiscalización a gobiernos sucesivos —Uribe, Santos, Duque—; su agenda es la corrupción y el abuso de poder, y esa vigilancia al establecimiento lo sitúa a la izquierda del eje colombiano.',
        feed: { url: 'https://www.noticiasuno.com/feed/', via: 'direct', category: 'Política' },
        /**
         * NO TE ALARMES SI APARECE CON CERO ARTÍCULOS. Es un noticiero de FIN DE
         * SEMANA —emite sábados, domingos y festivos— así que publica en
         * ráfagas, no a diario. Con la ventana de retención de 72 h, sus piezas
         * se ven de domingo a miércoles y desaparecen el resto de la semana.
         * Comprobado el 2026-07-31: el feed responde y trae 10 piezas, todas de
         * hace 82 h o más, o sea justo fuera de la ventana.
         *
         * Es el mismo patrón que F1-12 describe para los medios de izquierda del
         * catálogo: no son medios de noticia diaria, y el producto está
         * construido sobre la noticia diaria. Aquí se ve con nitidez porque el
         * ritmo es semanal y no irregular.
         */
    },
    {
        id: 'rtvc', name: 'RTVC Noticias', shortName: 'RTVC',
        domain: 'rtvcnoticias.com', country: 'CO', group: 'Medio público nacional',
        bias: -0.35, factuality: 0.82, reviewedAt: null,
        biasRationale: 'Sistema de medios públicos; su línea editorial sigue al gobierno de turno, lo que hace este valor especialmente volátil.',
        /**
         * REACTIVADO 2026-07-30, por decisión de Jose: no se silencia a ningún
         * medio del catálogo. Estuvo retirado desde el 2026-07-28.
         *
         * QUÉ HABÍA CAMBIADO Y QUÉ NO, medido de nuevo antes de reactivarlo:
         *   · Su rss.xml propio SIGUE inservible. La entrada más reciente es del
         *     30 de mayo y de ahí salta a junio de 2024; una de ellas se titula
         *     «sitio en mantenimiento». Por eso NO se usa.
         *   · Google News, en cambio, ya devuelve titulares reales —«Pacto
         *     Histórico respalda desobediencia civil…», «Presidente Petro anuncia
         *     acciones judiciales…»— y no las páginas de etiqueta («Gustavo
         *     Petro», «principal») que motivaron el retiro. Esa vía sirve.
         *
         * QUÉ VA A APORTAR, dicho sin adornos: poco. Lo indexado más reciente
         * era del 9 de julio, o sea fuera de la ventana de 72 h, así que hoy
         * suma cero artículos visibles. Eso es un hecho sobre su ritmo de
         * publicación, no una avería nuestra, y es justo lo que el producto
         * existe para hacer visible. Cuando publique, entra.
         *
         * Importa que esté: es el único medio público del catálogo y uno de los
         * pocos de centro-izquierda (F1-06 pide 6 y hay 5).
         */
        feed: { url: gnews('rtvcnoticias.com'), via: 'gnews', category: 'Política' },
    },
    {
        id: 'el-espectador', name: 'El Espectador', shortName: 'El Espectador',
        domain: 'elespectador.com', country: 'CO', group: 'Grupo Valorem',
        bias: -0.20, factuality: 0.88, reviewedAt: null,
        biasRationale: 'Diario nacional con tradición liberal; énfasis en derechos humanos y proceso de paz.',
        feed: { url: gnews('elespectador.com'), via: 'gnews', category: 'Política' },
    },
    {
        id: 'la-silla-vacia', name: 'La Silla Vacía', shortName: 'La Silla',
        domain: 'lasillavacia.com', country: 'CO', group: 'Independiente',
        bias: -0.10, factuality: 0.92, reviewedAt: null,
        biasRationale: 'Análisis de poder político con verificación factual sistemática; encuadre analítico más que militante.',
        feed: { url: 'https://www.lasillavacia.com/feed/', via: 'direct', category: 'Política' },
        // Sirve sus imágenes por el CDN de Jetpack/WordPress, que es la
        // infraestructura de su propio gestor de contenidos.
        imageHosts: ['i0.wp.com'],
    },

    // ─────────── Centro ───────────
    {
        id: 'el-tiempo', name: 'El Tiempo', shortName: 'El Tiempo',
        domain: 'eltiempo.com', country: 'CO', group: 'Grupo Sarmiento Angulo',
        bias: 0.05, factuality: 0.88, reviewedAt: null,
        biasRationale: 'Diario de mayor circulación; cobertura institucional amplia y encuadre predominantemente descriptivo.',
        feed: { url: 'https://www.eltiempo.com/rss/colombia.xml', via: 'direct', category: 'Política' },
        extraFeeds: [
            { url: 'https://www.eltiempo.com/rss/economia.xml', category: 'Economía' },
            { url: 'https://www.eltiempo.com/rss/justicia.xml', category: 'Judicial' },
            { url: 'https://www.eltiempo.com/rss/mundo.xml', category: 'Internacional' },
        ],
    },
    {
        id: 'w-radio', name: 'W Radio', shortName: 'W Radio',
        domain: 'wradio.com.co', country: 'CO', group: 'Grupo PRISA',
        bias: 0.0, factuality: 0.87, reviewedAt: null,
        biasRationale: 'Radio informativa con entrevistas a todo el arco político; encuadre variable según franja.',
        /**
         * REACTIVADO 2026-07-30, por decisión de Jose: no se silencia a ningún
         * medio del catálogo. Estuvo retirado desde el 2026-07-28.
         *
         * SIGUE SIN PUBLICAR RSS PROPIO: se volvieron a probar /feed/, /rss/,
         * /rss.xml, /feeds/rss/ y /feed/rss/ y los cinco dan 404. Así que entra
         * por Google News, la misma vía que Caracol Radio, que además es del
         * mismo dueño (Grupo Prisa).
         *
         * QUÉ VA A APORTAR, dicho sin adornos: casi nada. Google apenas indexa
         * este dominio — lo más reciente con contenido real es de enero de 2026,
         * fuera de la ventana de 72 h. Se busca por `site:` y NO por nombre, que
         * es la parte importante: buscar «W Radio» trae piezas de OTROS medios
         * que la mencionan («Claro Sports por W Radio»), y atribuirlas a ella
         * sería la misatribución que costó F1-07.
         *
         * Su feed entrega además entradas que no son piezas —«Noticias y Radio
         * Online», fechada ayer, que habría salido en portada como noticia—. De
         * eso se encarga la regla `no-es-articulo` de contentQuality, añadida
         * junto a esta reactivación.
         */
        feed: { url: gnews('wradio.com.co'), via: 'gnews', category: 'Política' },
    },
    {
        id: 'caracol-radio', name: 'Caracol Radio', shortName: 'Caracol',
        domain: 'caracol.com.co', country: 'CO', group: 'Grupo PRISA',
        bias: 0.05, factuality: 0.85, reviewedAt: null,
        biasRationale: 'Radio informativa de cobertura nacional con agenda noticiosa amplia.',
        feed: { url: gnews('caracol.com.co'), via: 'gnews', category: 'Política' },
    },
    {
        // Caracol Televisión y Caracol Radio comparten nombre y no comparten
        // nada más: son empresas distintas, de dueños distintos (Valorem y
        // PRISA respectivamente). El alias "Noticias Caracol" apuntaba a la
        // radio, que es exactamente la misatribución que F1-07 corrige.
        id: 'noticias-caracol', name: 'Noticias Caracol', shortName: 'Not. Caracol',
        domain: 'noticiascaracol.com', country: 'CO', group: 'Grupo Valorem',
        bias: 0.10, factuality: 0.86, reviewedAt: null,
        biasRationale: 'Informativo de televisión abierta líder en audiencia; cobertura amplia con encuadre institucional y foco en seguridad y orden público.',
        feed: { url: gnews('noticiascaracol.com'), via: 'gnews', category: 'Política' },
    },
    {
        id: 'portafolio', name: 'Portafolio', shortName: 'Portafolio',
        domain: 'portafolio.co', country: 'CO', group: 'Grupo Sarmiento Angulo',
        bias: 0.10, factuality: 0.89, reviewedAt: null,
        biasRationale: 'Diario económico; encuadre desde indicadores y perspectiva empresarial.',
        feed: { url: 'https://www.portafolio.co/rss/economia.xml', via: 'direct', category: 'Economía' },
    },
    {
        id: 'infobae-co', name: 'Infobae Colombia', shortName: 'Infobae',
        domain: 'infobae.com', country: 'AR', group: 'Infobae',
        bias: 0.15, factuality: 0.80, reviewedAt: null,
        biasRationale: 'Portal regional de alto volumen; cobertura rápida con menor verificación que la prensa tradicional.',
        feed: { url: 'https://www.infobae.com/arc/outboundfeeds/rss/?outputType=xml', via: 'direct', category: 'Internacional' },
    },
    {
        id: 'la-republica', name: 'La República', shortName: 'La República',
        domain: 'larepublica.co', country: 'CO', group: 'Editorial La República',
        bias: 0.15, factuality: 0.88, reviewedAt: null,
        biasRationale: 'Diario económico orientado al sector financiero y empresarial.',
        feed: { url: 'https://www.larepublica.co/rss', via: 'direct', category: 'Economía' },
        // Sirve sus fotos desde img.lalr.co (LR = La República). Apareció al
        // medir og:image: su RSS no trae imagen, su página sí.
        imageHosts: ['img.lalr.co'],
    },

    // ─────────── Centro-derecha / derecha ───────────
    {
        id: 'el-heraldo', name: 'El Heraldo', shortName: 'El Heraldo',
        domain: 'elheraldo.co', country: 'CO', group: 'Regional Caribe',
        bias: 0.20, factuality: 0.84, reviewedAt: null,
        biasRationale: 'Diario regional del Caribe; agenda local con encuadre institucional.',
        feed: { url: 'https://www.elheraldo.co/arc/outboundfeeds/rss/', via: 'direct', category: 'Política' },
    },
    {
        id: 'el-universal', name: 'El Universal', shortName: 'El Universal',
        domain: 'eluniversal.com.co', country: 'CO', group: 'Regional Cartagena',
        bias: 0.20, factuality: 0.86, reviewedAt: null,
        biasRationale: 'Diario regional de Cartagena; cobertura local con línea editorial conservadora moderada.',
        feed: { url: 'https://www.eluniversal.com.co/arc/outboundfeeds/rss/', via: 'direct', category: 'Política' },
    },
    {
        id: 'blu-radio', name: 'Blu Radio', shortName: 'Blu Radio',
        domain: 'bluradio.com', country: 'CO', group: 'Grupo Valorem',
        bias: 0.25, factuality: 0.85, reviewedAt: null,
        biasRationale: 'Radio informativa con énfasis en seguridad y orden público.',
        feed: { url: gnews('bluradio.com'), via: 'gnews', category: 'Política' },
    },
    {
        id: 'noticias-rcn', name: 'Noticias RCN', shortName: 'RCN',
        domain: 'noticiasrcn.com', country: 'CO', group: 'Organización Ardila Lülle',
        bias: 0.25, factuality: 0.82, reviewedAt: null,
        biasRationale: 'Noticiero de televisión nacional; énfasis en seguridad y crítica frecuente al gobierno progresista.',
        feed: { url: gnews('noticiasrcn.com'), via: 'gnews', category: 'Política' },
    },
    {
        id: 'la-patria', name: 'La Patria', shortName: 'La Patria',
        domain: 'lapatria.com', country: 'CO', group: 'Regional Eje Cafetero',
        bias: 0.25, factuality: 0.85, reviewedAt: null,
        biasRationale: 'Diario del Eje Cafetero; línea tradicional con agenda regional agroindustrial.',
        feed: { url: 'https://www.lapatria.com/rss.xml', via: 'direct', category: 'Política' },
    },
    {
        id: 'vanguardia', name: 'Vanguardia', shortName: 'Vanguardia',
        domain: 'vanguardia.com', country: 'CO', group: 'Regional Santander',
        bias: 0.25, factuality: 0.85, reviewedAt: null,
        biasRationale: 'Diario de Santander; cobertura regional con encuadre empresarial.',
        feed: { url: 'https://www.vanguardia.com/arc/outboundfeeds/rss/', via: 'direct', category: 'Política' },
    },
    {
        id: 'la-opinion', name: 'La Opinión', shortName: 'La Opinión',
        domain: 'laopinion.com.co', country: 'CO', group: 'Regional Norte de Santander',
        bias: 0.30, factuality: 0.87, reviewedAt: null,
        biasRationale: 'Diario de Cúcuta; cobertura fronteriza con énfasis en seguridad y migración.',
        feed: { url: 'https://www.laopinion.com.co/rss.xml', via: 'direct', category: 'Política' },
    },
    {
        id: 'el-pais-cali', name: 'El País (Cali)', shortName: 'El País Cali',
        domain: 'elpais.com.co', country: 'CO', group: 'Regional Valle',
        bias: 0.30, factuality: 0.85, reviewedAt: null,
        biasRationale: 'Diario del Valle del Cauca; línea editorial conservadora con agenda empresarial regional.',
        feed: { url: 'https://www.elpais.com.co/arc/outboundfeeds/rss/', via: 'direct', category: 'Política' },
        // Sirve sus fotos desde la CDN de Arc Publishing, su gestor de contenidos.
        imageHosts: ['semana-el-pais-prod.web.arc-cdn.net'],
    },
    {
        id: 'kienyke', name: 'KienyKe', shortName: 'KienyKe',
        domain: 'kienyke.com', country: 'CO', group: 'Digital',
        bias: 0.30, factuality: 0.75, reviewedAt: null,
        biasRationale: 'Portal digital de actualidad y entretenimiento; menor densidad de verificación.',
        feed: { url: 'https://www.kienyke.com/feed', via: 'direct', category: 'Política' },
    },
    {
        id: 'la-fm', name: 'La FM', shortName: 'La FM',
        domain: 'lafm.com.co', country: 'CO', group: 'Organización Ardila Lülle',
        bias: 0.35, factuality: 0.83, reviewedAt: null,
        biasRationale: 'Radio informativa del grupo RCN; línea editorial crítica con gobiernos progresistas.',
        feed: { url: gnews('lafm.com.co'), via: 'gnews', category: 'Política' },
    },
    {
        id: 'el-colombiano', name: 'El Colombiano', shortName: 'El Colombiano',
        domain: 'elcolombiano.com', country: 'CO', group: 'Regional Antioquia',
        bias: 0.35, factuality: 0.86, reviewedAt: null,
        biasRationale: 'Diario antioqueño de tradición conservadora; énfasis en empresa privada y orden institucional.',
        feed: { url: 'https://www.elcolombiano.com/rss/portada.xml', via: 'direct', category: 'Política' },
    },
    {
        id: 'semana', name: 'Semana', shortName: 'Semana',
        domain: 'semana.com', country: 'CO', group: 'Grupo Gilinski',
        bias: 0.45, factuality: 0.78, reviewedAt: null,
        biasRationale: 'Revista de actualidad; tras el cambio de propiedad en 2020 adoptó una línea de oposición marcada al gobierno progresista.',
        feed: { url: 'https://www.semana.com/arc/outboundfeeds/rss/', via: 'direct', category: 'Política' },
        // Misma CDN de Arc Publishing que El País (Cali): los dos son del Grupo
        // Gilinski y comparten gestor de contenidos.
        imageHosts: ['semana-semana-prod.web.arc-cdn.net'],
    },
    {
        id: 'el-nuevo-siglo', name: 'El Nuevo Siglo', shortName: 'N. Siglo',
        domain: 'elnuevosiglo.com.co', country: 'CO', group: 'Conservador',
        bias: 0.55, factuality: 0.80, reviewedAt: null,
        biasRationale: 'Diario históricamente vinculado al Partido Conservador; línea editorial explícitamente conservadora.',
        feed: { url: 'https://www.elnuevosiglo.com.co/rss.xml', via: 'direct', category: 'Política' },
    },

    // ─────────── Internacionales ───────────
    {
        id: 'bbc-mundo', name: 'BBC Mundo', shortName: 'BBC Mundo',
        domain: 'bbc.com', country: 'GB', group: 'Servicio público británico',
        bias: -0.05, factuality: 0.92, reviewedAt: null,
        biasRationale: 'Servicio público con obligación estatutaria de imparcialidad y estándares de verificación altos.',
        feed: { url: 'https://feeds.bbci.co.uk/mundo/rss.xml', via: 'direct', category: 'Internacional' },
        // CDN de imágenes de la propia BBC.
        imageHosts: ['ichef.bbci.co.uk'],
    },
    {
        id: 'dw-es', name: 'DW Español', shortName: 'DW',
        domain: 'dw.com', country: 'DE', group: 'Servicio público alemán',
        bias: -0.05, factuality: 0.93, reviewedAt: null,
        biasRationale: 'Radiodifusora pública internacional alemana; encuadre institucional europeo.',
        feed: { url: 'https://rss.dw.com/rdf/rss-sp-all', via: 'direct', category: 'Internacional' },
    },
    {
        id: 'france24-es', name: 'France 24 Español', shortName: 'France 24',
        domain: 'france24.com', country: 'FR', group: 'Servicio público francés',
        bias: 0.0, factuality: 0.90, reviewedAt: null,
        biasRationale: 'Cadena internacional pública francesa; cobertura global con encuadre descriptivo.',
        feed: { url: 'https://www.france24.com/es/rss', via: 'direct', category: 'Internacional' },
    },
    {
        id: 'euronews-es', name: 'Euronews Español', shortName: 'Euronews',
        domain: 'euronews.com', country: 'EU', group: 'Paneuropeo',
        bias: 0.05, factuality: 0.87, reviewedAt: null,
        biasRationale: 'Cadena paneuropea; agenda centrada en instituciones de la Unión Europea.',
        feed: { url: 'https://es.euronews.com/rss', via: 'direct', category: 'Internacional' },
    },
    {
        id: 'el-pais-es', name: 'El País (España)', shortName: 'El País',
        domain: 'elpais.com', country: 'ES', group: 'Grupo PRISA',
        bias: -0.20, factuality: 0.88, reviewedAt: null,
        biasRationale: 'Diario español de referencia con línea editorial socialdemócrata.',
        feed: { url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', via: 'direct', category: 'Internacional' },
    },

    // Medios sin feed configurado: aparecen citados como fuente en el catálogo
    // pero no se ingieren. Están aquí para que se resuelvan correctamente al
    // mostrarse (logo, dominio, sesgo) en lugar de caer al respaldo genérico.
    {
        id: 'efe', name: 'Agencia EFE', shortName: 'EFE',
        domain: 'efe.com', country: 'ES', group: 'Agencia de noticias',
        bias: 0.0, factuality: 0.92, reviewedAt: null,
        biasRationale: 'Agencia de noticias; produce despachos factuales destinados a ser reutilizados por medios de todo el espectro.',
        feed: null,
    },
    {
        id: 'reuters', name: 'Reuters', shortName: 'Reuters',
        domain: 'reuters.com', country: 'GB', group: 'Agencia de noticias',
        bias: 0.0, factuality: 0.95, reviewedAt: null,
        biasRationale: 'Agencia internacional con estándares de neutralidad codificados (Trust Principles).',
        feed: null,
    },
    {
        id: 'cnn-es', name: 'CNN en Español', shortName: 'CNN',
        domain: 'cnnespanol.cnn.com', country: 'US', group: 'Warner Bros. Discovery',
        bias: -0.15, factuality: 0.84, reviewedAt: null,
        biasRationale: 'Cadena internacional; encuadre editorial estadounidense de centro-izquierda.',
        feed: null,
    },
    {
        id: 'nyt', name: 'The New York Times', shortName: 'NYT',
        domain: 'nytimes.com', country: 'US', group: 'The New York Times Company',
        bias: -0.25, factuality: 0.90, reviewedAt: null,
        biasRationale: 'Diario estadounidense de referencia con línea editorial liberal.',
        feed: null,
    },
    {
        id: 'wsj', name: 'The Wall Street Journal', shortName: 'WSJ',
        domain: 'wsj.com', country: 'US', group: 'News Corp',
        bias: 0.30, factuality: 0.89, reviewedAt: null,
        biasRationale: 'Diario económico estadounidense; página editorial explícitamente conservadora, sección informativa más neutra.',
        feed: null,
    },
    {
        id: 'financial-times', name: 'Financial Times', shortName: 'FT',
        domain: 'ft.com', country: 'GB', group: 'Nikkei',
        bias: 0.15, factuality: 0.91, reviewedAt: null,
        biasRationale: 'Diario económico británico; encuadre desde mercados y liberalismo económico.',
        feed: null,
    },
    {
        id: 'la-vanguardia-es', name: 'La Vanguardia', shortName: 'La Vanguardia',
        domain: 'lavanguardia.com', country: 'ES', group: 'Grupo Godó',
        bias: 0.10, factuality: 0.86, reviewedAt: null,
        biasRationale: 'Diario barcelonés de tradición liberal-conservadora moderada.',
        feed: null,
    },
];

// ---------------------------------------------------------------------------
// Índices y consultas
// ---------------------------------------------------------------------------

const byId = new Map(MEDIA_REGISTRY.map((m) => [m.id, m]));
const byDomain = new Map(MEDIA_REGISTRY.map((m) => [m.domain, m]));

/**
 * Alias por los que un medio aparece nombrado en datos heredados.
 *
 * Existen para arreglar la misatribución que producía la búsqueda difusa
 * anterior: `getMediaByName('El País (España)')` resolvía a "El País (Cali)"
 * —un diario colombiano— porque comparaba con `.includes()` en ambos sentidos.
 * "La Vanguardia" (Barcelona) caía en "Vanguardia (Bucaramanga)". En un
 * producto cuyo valor es la precisión de la fuente, eso es el peor error
 * posible.
 */
const ALIASES = new Map(Object.entries({
    'revista semana': 'semana',
    'rcn radio / noticias rcn': 'noticias-rcn',
    'rcn radio': 'noticias-rcn',
    'caracol televisión': 'noticias-caracol',
    'caracol tv': 'noticias-caracol',
    'agencia efe colombia': 'efe',
    'agencia efe': 'efe',
    'el heraldo (barranquilla)': 'el-heraldo',
    'el universal (cartagena)': 'el-universal',
    'la opinión (cúcuta)': 'la-opinion',
    'la patria (manizales)': 'la-patria',
    'vanguardia (bucaramanga)': 'vanguardia',
    'la vanguardia': 'la-vanguardia-es',
    'el país (cali)': 'el-pais-cali',
    'el país (españa)': 'el-pais-es',
    'el país': 'el-pais-es',
    'cnn en español': 'cnn-es',
    'reuters latam': 'reuters',
    'france 24 español': 'france24-es',
    'dw español': 'dw-es',
    'infobae colombia': 'infobae-co',
    'la silla vacia': 'la-silla-vacia',
    'razon publica': 'razon-publica',
    'cuestion publica': 'cuestion-publica',
    'voragine': 'voragine',
}));

function normalizeName(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();
}

const byNormalizedName = new Map();
for (const media of MEDIA_REGISTRY) {
    byNormalizedName.set(normalizeName(media.name), media);
    byNormalizedName.set(normalizeName(media.shortName), media);
}

export function getMediaById(id) {
    return byId.get(id) ?? null;
}

export function getMediaByDomain(domain) {
    return byDomain.get(String(domain ?? '').toLowerCase()) ?? null;
}

/**
 * Resuelve un medio por nombre. Estricto por diseño: coincidencia exacta
 * normalizada o alias explícito. NUNCA coincidencia parcial.
 *
 * Devuelve `null` si no lo conoce; los llamantes de presentación deben usar
 * `resolveMedia()`, que siempre devuelve algo pintable.
 */
export function findMediaByName(name) {
    const key = normalizeName(name);
    if (!key) return null;

    const direct = byNormalizedName.get(key);
    if (direct) return direct;

    const aliasId = ALIASES.get(key);
    return aliasId ? (byId.get(aliasId) ?? null) : null;
}

/** Medios que tienen feed configurado, aplanando los feeds secundarios. */
export function getIngestFeeds() {
    const feeds = [];

    for (const media of MEDIA_REGISTRY) {
        if (!media.feed?.url) continue;

        feeds.push({
            mediaId: media.id,
            name: media.name,
            domain: media.domain,
            bias: media.bias,
            factuality: media.factuality,
            url: media.feed.url,
            via: media.feed.via,
            category: media.feed.category ?? 'Política',
            imageHosts: media.imageHosts ?? [],
        });

        for (const extra of media.extraFeeds ?? []) {
            feeds.push({
                mediaId: media.id,
                name: media.name,
                domain: media.domain,
                bias: media.bias,
                factuality: media.factuality,
                url: extra.url,
                via: media.feed.via,
                category: extra.category ?? 'Política',
                imageHosts: media.imageHosts ?? [],
            });
        }
    }

    return feeds;
}

/** Banda del espectro a la que pertenece un sesgo. */
export function getBand(bias) {
    const value = typeof bias === 'number' ? bias : 0;
    return (
        SPECTRUM_BANDS.find((b) => value >= b.min && value < b.max) ??
        SPECTRUM_BANDS[SPECTRUM_BANDS.length - 1]
    );
}
