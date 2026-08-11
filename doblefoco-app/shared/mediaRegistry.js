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
 * Escala de ORIENTACIÓN: -1.0 (izquierda marcada) … 0.0 (orientación mixta) …
 * +1.0 (derecha marcada). El 0.0 NO significa «neutral» ni «sin línea»:
 * significa que la orientación de ese medio no se sitúa en el eje
 * izquierda-derecha —la de Portafolio es el capital, y es clarísima—. Ver el
 * comentario de SPECTRUM_LABEL en shared/biasAnalysis.js.
 * `factuality` es el historial de rigor factual del medio, NO una evaluación
 * de una noticia concreta.
 */

/**
 * QUIÉN ESCRIBE: humanos o máquinas.
 *
 * Campo `redaccion`. Ausente significa redacción humana, que es lo normal y no
 * hace falta declarar. `'automatizada'` significa que el medio DECLARA que su
 * redacción son agentes de inteligencia artificial.
 *
 * POR QUÉ EXISTE (2026-08-09, decisión de Jose). Entró Boyacá Digital, que se
 * anuncia como el primer periódico autónomo con agentes de IA de Colombia. Se
 * admite —«es el primero»— pero no puede entrar disimulado, por dos razones que
 * son de este proyecto en particular:
 *
 *   1. **El recuento de pluralidad.** Todo el sitio se apoya en «cuántos medios
 *      distintos cubren este hecho». Una redacción automatizada que reescribe lo
 *      que ya publicaron otros suma al recuento sin aportar una voz. Sin marca,
 *      infla la cifra que da sentido a la portada.
 *   2. **La firma.** El protocolo de juicio editorial dice que firmar significa
 *      que hay alguien a quien preguntarle por qué. Aquí ese alguien existe
 *      —un editor en jefe que responde legalmente— pero no publica su nombre.
 *
 * LO QUE ESTE CAMPO NO DICE: nada sobre la calidad de lo que publica. Un medio
 * automatizado que cita bien sus fuentes puede ser más riguroso que uno humano
 * que no las cita. Es una etiqueta de PROCEDENCIA, igual que la de propiedad.
 *
 * LO SIGUIENTE, y es idea de Jose: en un medio así **la orientación debería ser
 * más medible, no menos**. En una redacción humana el sesgo se reparte entre
 * personas y días; en una configurada, es una propiedad del sistema y su salida
 * es sistemática. Con corpus suficiente, la deriva de un medio automatizado
 * debería poder calcularse de forma más directa que la de uno humano —y una
 * alteración de su configuración debería verse como un salto, no como ruido—.
 * Eso es trabajo del motor de sesgo, no de este archivo, y queda anotado aquí
 * porque es donde se buscará.
 */
export const REDACCIONES = {
    automatizada: {
        etiqueta: 'Redacción de IA',
        explica:
            'Este medio declara que sus contenidos los produce una redacción de agentes de '
            + 'inteligencia artificial con supervisión editorial humana. No dice nada sobre su '
            + 'rigor: dice de dónde viene el texto.',
    },
};

/**
 * ¿Este medio declara redacción automatizada?
 *
 * @param {{redaccion?: string}} medio
 */
export const esRedaccionAutomatizada = (medio) => medio?.redaccion === 'automatizada';

/**
 * Bandas de ORIENTACIÓN del medio. metodologia.txt debe describir exactamente
 * estas.
 *
 * El campo se sigue llamando `bias` en el registro, en la base y en la API. Es
 * deliberado y no un descuido: renombrar la columna `sources.bias` obligaría a
 * migrar la base y a romper la API por un cambio que el lector no ve. Lo que sí
 * cambia es TODO lo que el lector lee. Ver la nota de SPECTRUM_LABEL en
 * shared/biasAnalysis.js para la distinción entre orientación y sesgo.
 */
export const SPECTRUM_BANDS = [
    { id: 'left', min: -1.0, max: -0.6, label: 'Izquierda' },
    { id: 'center-left', min: -0.6, max: -0.2, label: 'Izquierda moderada' },
    { id: 'center', min: -0.2, max: 0.2, label: 'Orientación mixta' },
    { id: 'center-right', min: 0.2, max: 0.6, label: 'Derecha moderada' },
    { id: 'right', min: 0.6, max: 1.0, label: 'Derecha' },
];

/**
 * Feed de búsqueda de Google News restringido a un dominio.
 *
 * ES EL ÚLTIMO RECURSO, Y CUESTA MÁS DE LO QUE PARECE. Medido el 2026-08-08: los
 * medios que entraban por aquí aportaban 16 artículos de media y los de feed
 * directo 134. La causa no es que Google dé pocos ítems —da 100, y 82 dentro de
 * la ventana— sino que **ordena por relevancia y no por fecha**: cada sondeo
 * devuelve casi los mismos 15, con mediana de edad de 39,9 h, se deduplican
 * contra lo que ya hay y no se acumula nada. Además ninguno trae `media:*` y los
 * enlaces apuntan a news.google.com en vez de al medio.
 *
 * Antes de dejar a un medio aquí, hay que buscarle feed propio en serio. Ese día
 * aparecieron cuatro que se daban por inexistentes: El Espectador, Caracol Radio,
 * W Radio y Cambio. La ficha de W Radio llegó a afirmar «SIGUE SIN PUBLICAR RSS
 * PROPIO» tras probar cinco rutas — ninguna era la correcta.
 *
 * DÓNDE MIRAR, por orden de acierto:
 *   1. El `<link rel="alternate" type="application/rss+xml">` del propio HTML.
 *      Así apareció el de Cambio, que vive en `/feeds/articulos/` y no habría
 *      salido probando rutas a ciegas.
 *   2. Arc, el gestor de media Colombia: `/arc/outboundfeeds/rss/?outputType=xml`
 *      y la variante `/discover/`. **Probar con y sin la query**: en El Universal
 *      la misma ruta da 0 ítems frescos sin ella y 100 con ella.
 *   3. Las convencionales: /feed/, /rss, /rss.xml, /index.xml, /atom.xml.
 *
 * LO YA DESCARTADO el 2026-08-08, para no repetir la búsqueda: Revista RAYA,
 * La FM, Noticias RCN, Noticias Caracol y Blu Radio no tienen feed propio por
 * ninguna de las tres vías. Los dos últimos DECLARAN un `.atom` en su HTML que
 * devuelve la página, no un feed. RTVC sí publica `rss.xml`, pero está
 * abandonado —su entrada más reciente es de mayo de 2026 y de ahí salta a junio
 * de 2024—, así que sigue entrando por aquí.
 */
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
        /**
         * AÑADIDO EL 2026-08-08, a petición de Jose. Junto con Volcánicas es el
         * primer medio que entra DESPUÉS del protocolo de juicio editorial, así
         * que su valor se justifica solo con evidencia del presente (§2 del
         * PROTOCOLO): lo que el medio declara HOY como su misión. Nada de
         * fundaciones ni trayectorias.
         *
         * CRUCE QUE HAY QUE DECLARAR: Juan Pablo Barrientos dirige aquí la unidad
         * investigativa y es a la vez uno de los cuatro periodistas fundadores de
         * la Fundación Vorágine, que también está en este catálogo. Es el segundo
         * caso de una persona con papel en dos medios nuestros, después de Daniel
         * Coronell (Cambio y NTC Televisión).
         *
         * Ficha pendiente en `fichas/`. `reviewedAt` sigue en null: el número es
         * una propuesta, no un juicio firmado.
         */
        id: 'casa-macondo', name: 'CasaMacondo', shortName: 'CasaMacondo',
        domain: 'casamacondo.co', country: 'CO', group: 'Investigación independiente',
        bias: -0.35, factuality: 0.88, reviewedAt: null,
        biasRationale: 'Declara HOY como compromiso editorial «promover la justicia social, la divulgación ambiental y la complejidad cultural», con periodismo de investigación y ambiental. Valor derivado de esa declaración vigente, no de su historia.',
        feed: { url: 'https://casamacondo.co/feed/', via: 'direct', category: 'Judicial' },
    },
    {
        /**
         * AÑADIDO EL 2026-08-08, a petición de Jose. Ver la nota de CasaMacondo
         * sobre la regla del presente.
         *
         * Su financiación está DECLARADA con porcentajes por la propia
         * organización, lo que es inusual y vale anotarlo: Hispanics in
         * Philanthropy 40,8 %, Ford Foundation 24,5 %, Foundation for a Just
         * Society 16,3 %, más aportes individuales. Es evidencia de nivel 4
         * excepcionalmente concreta.
         */
        id: 'volcanicas', name: 'Volcánicas', shortName: 'Volcánicas',
        domain: 'volcanicas.com', country: 'CO', group: 'Periodismo feminista independiente',
        bias: -0.50, factuality: 0.88, reviewedAt: null,
        biasRationale: 'Revista de periodismo feminista latinoamericano que declara HOY como misión «usar las herramientas del periodismo para avanzar los derechos de las mujeres». Es periodismo de causa declarada, y el valor se deriva de esa declaración vigente.',
        feed: { url: 'https://volcanicas.com/feed/', via: 'direct', category: 'Política' },
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
        /**
         * PASA A FEED PROPIO (2026-08-08). Lo declara en su HTML y no está en
         * ninguna ruta convencional: no es /feed/ ni /rss ni la de Arc, sino
         * `/feeds/articulos/`. Por eso los sondeos anteriores no lo encontraron.
         *
         *   gnews    100 ítems ·  5/15 frescos · mediana 155,6 h
         *   propio    20 ítems · 15/15 frescos · piezas de hoy
         *
         * PUBLICA CON FECHAS EN EL FUTURO —hasta dos días—, porque programa sus
         * piezas. No es un fallo suyo ni nuestro, y no hace falta tocar nada:
         * `parsePublishedAt` ya rechaza cualquier fecha a más de 30 min vista, así
         * que esas entradas se ignoran hasta que les llega su hora y entran en un
         * sondeo posterior. Se comprueba ahí y no aquí para que la regla valga
         * para todos los feeds, no solo para este.
         *
         * NO TRAE `media:*`: sus fotos las rescata el enriquecedor por og:image,
         * igual que las de El Tiempo.
         */
        feed: {
            url: 'https://cambiocolombia.com/feeds/articulos/',
            via: 'direct',
            category: 'Política',
        },
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
        /**
         * CANALES PÚBLICOS REGIONALES (2026-08-09, a petición de Jose).
         *
         * Añaden al mapa una capa de propiedad que no existía: medios cuyo dueño
         * es un ALCALDE O UNA GOBERNACIÓN, no el presidente ni un grupo
         * económico. Su línea depende del gobierno LOCAL de turno, así que
         * heredan la misma volatilidad que ya está declarada para RTVC, pero con
         * un calendario electoral distinto.
         *
         * Su valor de orientación entra en 0,00 —orientación mixta— a propósito:
         * NO se les asigna posición sin haberla medido, y su ficha depende de
         * quién gobierne la ciudad. `reviewedAt` en null como los otros 34.
         */
        id: 'telemedellin', name: 'Telemedellín', shortName: 'Telemedellín',
        domain: 'telemedellin.tv', departamento: 'Antioquia', country: 'CO',
        group: 'Público municipal — Alcaldía de Medellín',
        bias: 0.0, factuality: 0.85, reviewedAt: null,
        biasRationale: 'Canal público del municipio de Medellín. Su dirección la designa la Alcaldía, así que su línea sigue al gobierno local de turno. Valor sin medir: entra en orientación mixta hasta tener conducta observable.',
        feed: { url: 'https://www.telemedellin.tv/feed/', via: 'direct', category: 'Política' },
    },
    {
        id: 'canal-capital', name: 'Canal Capital', shortName: 'Canal Capital',
        domain: 'canalcapital.gov.co', departamento: 'Bogotá D.C.', country: 'CO',
        group: 'Público distrital — Alcaldía Mayor de Bogotá',
        bias: 0.0, factuality: 0.85, reviewedAt: null,
        biasRationale: 'Canal público del Distrito Capital. Su dirección la designa la Alcaldía Mayor, así que su línea sigue al gobierno distrital de turno. Valor sin medir.',
        feed: { url: 'https://www.canalcapital.gov.co/feed/', via: 'direct', category: 'Política' },
    },
    {
        /**
         * SU RSS ESTÁ CASI PARADO, y se declara al entrar: medido el 2026-08-09,
         * de los 15 ítems que tomamos solo 1 caía dentro de la ventana y la
         * mediana era de 1 365 horas —57 días—. Entra igual, por el criterio de
         * no silenciar a nadie, pero sabiendo que hoy aportará muy poco.
         */
        id: 'telecaribe', name: 'Telecaribe', shortName: 'Telecaribe',
        domain: 'telecaribe.co', departamento: 'Atlántico', country: 'CO',
        group: 'Público regional — Caribe',
        bias: 0.0, factuality: 0.85, reviewedAt: null,
        biasRationale: 'Canal público regional del Caribe colombiano, participado por las gobernaciones de la región. Valor sin medir.',
        feed: { url: 'https://www.telecaribe.co/feed/', via: 'direct', category: 'Política' },
    },
    {
        id: 'telecafe', name: 'Telecafé', shortName: 'Telecafé',
        domain: 'telecafe.gov.co', departamento: 'Caldas', country: 'CO',
        group: 'Público regional — Eje Cafetero',
        bias: 0.0, factuality: null, reviewedAt: null,
        biasRationale: 'Canal público regional del Eje Cafetero, participado por las gobernaciones de Caldas, Risaralda y Quindío. Su dirección la designa el poder político de turno, así que su línea sigue a quien gobierna — ver fichas/telecafe.md.',
        feed: { url: 'https://telecafe.gov.co/feed/', via: 'direct', category: 'Política' },
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
        /**
         * PASA DE GOOGLE NEWS A FEED PROPIO (2026-08-08).
         *
         * Aportaba 24 artículos en 72 h. El Tiempo, su par, aportaba 234; El
         * Heraldo, un diario regional, 383. No es una diferencia de tamaño entre
         * redacciones: era la tubería.
         *
         * Y NO por lo que parecía a primera vista. El feed de Google devuelve
         * 100 ítems y 82 están dentro de la ventana, así que no era escasez.
         * Medido item a item, la diferencia es el ORDEN:
         *
         *              gnews        propio
         *   mediana     39,9 h       1,5 h
         *   imagen      0/15        15/15
         *   enlace   news.google.com  elespectador.com
         *
         * Google ordena por RELEVANCIA, no por fecha. Cada 30 minutos pedimos
         * los 15 «más relevantes» y nos devuelve casi los mismos, con mediana de
         * casi dos días. Se deduplican y no se acumula nada. Un feed cronológico
         * trae en cada sondeo lo publicado desde el anterior, que es justo lo
         * que este producto necesita.
         *
         * ES EL FEED DE «DISCOVER» y trae 20 ítems, no el archivo completo. Uno
         * de los 20 era de mayo —contenido perenne—, y la ventana de 72 h se
         * encarga de él. Se probaron además /arc/outboundfeeds/rss/ con y sin
         * query, /mrss/ y dos variantes por sección —404 las cuatro— y
         * /news-sitemap/, que sí existe pero no es RSS. Este es el único feed
         * consumible que publica el medio.
         *
         * La CSP ya admitía elespectador.com, así que las fotos entran sin
         * tocar nada. Antes no había ninguna que admitir.
         */
        feed: {
            url: 'https://www.elespectador.com/arc/outboundfeeds/discover/?outputType=xml',
            via: 'direct',
            category: 'Política',
        },
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
         * SÍ TENÍA RSS PROPIO (hallado el 2026-08-08). Aquí decía que no, tras
         * probar /feed/, /rss/, /rss.xml, /feeds/rss/ y /feed/rss/ —los cinco
         * dan 404, sigue siendo cierto—. Ninguna de las cinco era la ruta de
         * Arc, que es el gestor que usa media Colombia: El Heraldo, El Universal,
         * Vanguardia, El País de Cali y Semana ya entraban por ahí. Estaba a la
         * vista en el catálogo.
         *
         * MOTIVO DEL CAMBIO, y es el más grave de los tres: el feed de Google
         * para este dominio tenía una MEDIANA DE EDAD DE 32 551 HORAS —casi
         * cuatro años— entre los 15 ítems que tomábamos. Solo 1 de 15 caía
         * dentro de la ventana. No es que aportara poco: es que servía archivo
         * viejo con apariencia de actualidad, y eso es peor que estar mudo.
         *
         * LO QUE APORTA EL NUEVO, sin adornos: 2 ítems. Es poco, pero son dos
         * piezas reales, recientes y con foto, en vez de una superviviente entre
         * quince fósiles. Si algún día publica más, entra solo.
         *
         * Su feed entregaba además entradas que no son piezas —«Noticias y Radio
         * Online», fechada ayer, que habría salido en portada como noticia—. De
         * eso se encarga la regla `no-es-articulo` de contentQuality, y se deja
         * puesta: el feed nuevo puede traer lo mismo.
         */
        feed: {
            url: 'https://www.wradio.com.co/arc/outboundfeeds/rss/?outputType=xml',
            via: 'direct',
            category: 'Política',
        },
    },
    {
        /**
         * `shortName` ERA «Caracol» A SECAS, y sobraba el ahorro de dos palabras
         * (2026-08-08, lo señaló Jose). «Noticias Caracol» es OTRA empresa, de
         * OTRO dueño: esta es del Grupo Prisa y aquella de los Santo Domingo vía
         * Valorem. En un sitio cuyo argumento central es quién posee qué, abreviar
         * a «Caracol» invitaba justo a la confusión que el mapa existe para
         * deshacer —y el propio archivo ya advertía, unas líneas más abajo, que
         * las dos no comparten nada salvo el nombre—.
         */
        id: 'caracol-radio', name: 'Caracol Radio', shortName: 'Caracol Radio',
        domain: 'caracol.com.co', country: 'CO', group: 'Grupo PRISA',
        bias: 0.05, factuality: 0.85, reviewedAt: null,
        biasRationale: 'Radio informativa de cobertura nacional con agenda noticiosa amplia.',
        /**
         * PASA A FEED PROPIO DE ARC (2026-08-08). El mejor de los tres hallados:
         * 100 ítems, los 15 que tomamos dentro de la ventana y con foto, mediana
         * de 1,2 h frente a las 21,7 h que daba Google.
         *
         * Aquí no había siquiera una nota que dijera por qué entraba por Google
         * News: se asumió, y nadie volvió a mirar. El feed existía.
         */
        feed: {
            url: 'https://caracol.com.co/arc/outboundfeeds/rss/?outputType=xml',
            via: 'direct',
            category: 'Política',
        },
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
        /**
         * VALORA ANALITIK — alta del 2026-08-11, a petición de Jose.
         *
         * Lo edita Valora Inversiones S.A.S. (NIT 900.811.192-0, Medellín,
         * constituida en enero de 2015), de sus dos fundadores: Camilo Silva y
         * Alejandro Montoya. **No pertenece a ningún grupo**, y eso es lo
         * inusual: en este catálogo tres dueños concentran la mitad de lo
         * publicado.
         *
         * EL SESGO, EN +0,10 Y NO EN +0,15. Es un medio de mercados con
         * audiencia inversionista, lo que empujaría hacia La República, pero su
         * cobertura de la reforma laboral se lee del lado del trabajador —«lo
         * que deben pagarle de más», «el salario no bajará», «las empresas
         * tendrán prohibido»— y no con encuadre patronal. Queda con Portafolio,
         * que es su comparable exacto. `reviewedAt: null`: sin firmar.
         *
         * CONFLICTO DE INTERÉS, DECLARADO EN LA FICHA. La misma sociedad vende
         * una plataforma de pago para inversionistas sobre las acciones de la
         * Bolsa de Valores de Colombia, y publica avisos de ley pagados de
         * empresas, mientras su redacción cubre esas mismas emisoras. No es
         * asesoría ni recomendación de compra: es desvelamiento, no acusación.
         *
         * Su feed figuraba como inexistente hasta hoy, y el problema era
         * nuestro: el User-Agent llevaba una tilde y su cortafuegos lo
         * rechazaba. Ver `shared/userAgent.js`.
         *
         * SU `pubDate` NO DECLARA ZONA HORARIA —«2026-08-11 18:10:48» a secas—,
         * así que `rss-parser` lo interpreta con la del proceso. Con TZ=UTC
         * entran sus 50 artículos; en UTC-5 sus fechas quedan cinco horas en el
         * futuro y el filtro de fechas futuras descarta 19 de 50. Por eso
         * `fly.toml` fija `TZ = 'UTC'` explícitamente desde hoy.
         */
        id: 'valora-analitik', name: 'Valora Analitik', shortName: 'Valora',
        domain: 'valoraanalitik.com', departamento: 'Antioquia', country: 'CO',
        group: 'Valora Inversiones S.A.S.',
        bias: 0.10, factuality: null, reviewedAt: null,
        biasRationale: 'Medio económico y bursátil independiente, de sus dos fundadores; encuadre desde el mercado y la empresa, con cobertura laboral de servicio.',
        feed: { url: 'https://www.valoraanalitik.com/feed/', via: 'direct', category: 'Economía' },
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
        domain: 'elheraldo.co', departamento: 'Atlántico', country: 'CO', group: 'Regional Caribe',
        bias: 0.20, factuality: 0.84, reviewedAt: null,
        biasRationale: 'Diario regional del Caribe; agenda local con encuadre institucional.',
        feed: { url: 'https://www.elheraldo.co/arc/outboundfeeds/rss/', via: 'direct', category: 'Política' },
    },
    {
        id: 'el-universal', name: 'El Universal', shortName: 'El Universal',
        domain: 'eluniversal.com.co', departamento: 'Bolívar', country: 'CO', group: 'Regional Cartagena',
        bias: 0.20, factuality: 0.86, reviewedAt: null,
        biasRationale: 'Diario regional de Cartagena; cobertura local con línea editorial conservadora moderada.',
        /**
         * `?outputType=xml` NO ES DECORATIVO (2026-08-08). Sin esa query, la
         * MISMA ruta devuelve 100 ítems de los que NINGUNO entra en la ventana:
         * mediana de 475 h —veinte días— y sin orden de fecha. Con ella, los 100
         * son de las últimas 28 h.
         *
         *   sin query   100 ítems ·   0 frescos · mediana 475,3 h
         *   con query   100 ítems · 100 frescos · mediana  27,9 h
         *
         * El feed respondía 200 y traía cien titulares, así que `check:feeds`
         * lo daba por bueno mientras el medio aportaba una fracción de lo suyo.
         * Es el fallo que hizo añadir la comprobación de frescura a ese script.
         *
         * OJO al copiar: El Heraldo, Vanguardia y El País de Cali usan esta misma
         * ruta SIN la query y sus cien ítems sí son recientes. No es una regla de
         * Arc, es de esta instalación. Hay que medir cada una.
         */
        feed: {
            url: 'https://www.eluniversal.com.co/arc/outboundfeeds/rss/?outputType=xml',
            via: 'direct',
            category: 'Política',
        },
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
        domain: 'lapatria.com', departamento: 'Caldas', country: 'CO', group: 'Regional Eje Cafetero',
        bias: 0.25, factuality: 0.85, reviewedAt: null,
        biasRationale: 'Diario del Eje Cafetero; línea tradicional con agenda regional agroindustrial.',
        feed: { url: 'https://www.lapatria.com/rss.xml', via: 'direct', category: 'Política' },
    },
    {
        id: 'vanguardia', name: 'Vanguardia', shortName: 'Vanguardia',
        domain: 'vanguardia.com', departamento: 'Santander', country: 'CO', group: 'Regional Santander',
        bias: 0.25, factuality: 0.85, reviewedAt: null,
        biasRationale: 'Diario de Santander; cobertura regional con encuadre empresarial.',
        feed: { url: 'https://www.vanguardia.com/arc/outboundfeeds/rss/', via: 'direct', category: 'Política' },
    },
    {
        id: 'la-opinion', name: 'La Opinión', shortName: 'La Opinión',
        /**
         * EL DOMINIO CAMBIÓ A `laopinion.co` (corregido el 2026-08-08).
         *
         * Aquí decía `laopinion.com.co`. El medio migró y su propio feed —que
         * sigue sirviéndose desde el dominio viejo— entrega enlaces e imágenes
         * en el nuevo. La consecuencia era invisible desde el servidor y muy
         * visible para el lector: sus **133 fotografías estaban en laopinion.co,
         * que no figuraba en la CSP**, así que se guardaban, pasaban la
         * validación —esa compara contra el dominio del propio artículo, no
         * contra este campo— y el navegador las bloqueaba al pintarlas.
         *
         * Se añadió `laopinion.co` al `img-src` de vercel.json y se creó
         * `check:csp`, que compara esa lista contra el registro. La CSP está
         * escrita a mano y no tenía forma de enterarse de una migración.
         */
        domain: 'laopinion.co', departamento: 'Norte de Santander', country: 'CO', group: 'Regional Norte de Santander',
        bias: 0.30, factuality: 0.87, reviewedAt: null,
        biasRationale: 'Diario de Cúcuta; cobertura fronteriza con énfasis en seguridad y migración.',
        // El feed sigue publicándose en el dominio antiguo, que redirige.
        feed: { url: 'https://www.laopinion.com.co/rss.xml', via: 'direct', category: 'Política' },
    },
    {
        id: 'el-pais-cali', name: 'El País (Cali)', shortName: 'El País Cali',
        domain: 'elpais.com.co', departamento: 'Valle del Cauca', country: 'CO', group: 'Regional Valle',
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
        domain: 'elcolombiano.com', departamento: 'Antioquia', country: 'CO', group: 'Regional Antioquia',
        bias: 0.35, factuality: 0.86, reviewedAt: null,
        biasRationale: 'Diario antioqueño de tradición conservadora; énfasis en empresa privada y orden institucional.',
        feed: { url: 'https://www.elcolombiano.com/rss/portada.xml', via: 'direct', category: 'Política' },
    },

    /**
     * ── REGIONALES DEPARTAMENTALES (alta del 2026-08-09) ─────────────────────
     *
     * Nueve medios, uno por departamento, de los 22 candidatos investigados.
     * Cada uno tiene su ficha razonada en `fichas/<id>.md` y NINGUNO está
     * firmado: entran con `reviewedAt: null` como los otros 45.
     *
     * `factuality: null` EN LOS NUEVE, y es deliberado. No existe ni una
     * medición de rigor factual de ninguno. Ponerles 0.85 «como los otros
     * regionales» habría sido inventar una medición, que es justo lo que la
     * Fase 0 quitó del motor. El hueco se declara: la tabla dice «sin medir» y
     * el gráfico no los coloca en el eje vertical.
     *
     * De los 22 candidatos NO entran aquí trece: nueve porque su ficha quedó
     * sin número, uno —Ecos del Combeima— porque su alta está condicionada a
     * resolver si es afiliada de Blu Radio, y tres —EL DIARIO de Boyacá, Vive
     * el Meta y Lente Regional— porque dar de alta obliga a declarar un
     * `ownerType`, y de esos tres no sé de quién son.
     */
    {
        id: 'el-pilon', name: 'El Pilón', shortName: 'El Pilón',
        domain: 'elpilon.com.co', departamento: 'Cesar', country: 'CO', group: 'Regional Cesar',
        bias: 0.20, factuality: null, reviewedAt: null,
        biasRationale: 'Diario de Valledupar; sociedad anónima con junta empresarial y agenda regional. Valor provisional puesto por coherencia con la banda de los otros diarios comerciales regionales, no por evidencia propia — ver fichas/el-pilon.md.',
        feed: { url: 'https://elpilon.com.co/api/rss', via: 'direct', category: 'Política' },
    },
    {
        id: 'diario-del-huila', name: 'Diario del Huila', shortName: 'Diario del Huila',
        domain: 'diariodelhuila.com', departamento: 'Huila', country: 'CO', group: 'Regional Huila',
        bias: 0.20, factuality: null, reviewedAt: null,
        biasRationale: 'Diario de Neiva, casa familiar dirigida por la familia fundadora. Valor provisional por coherencia con la banda regional; el accionariado sigue sin documentar — ver fichas/diario-del-huila.md.',
        feed: { url: 'https://diariodelhuila.com/feed/', via: 'direct', category: 'Política' },
    },
    {
        id: 'diario-del-norte', name: 'Diario del Norte', shortName: 'Diario del Norte',
        domain: 'diariodelnorte.net', departamento: 'La Guajira', country: 'CO', group: 'Sistema Cardenal',
        bias: 0.20, factuality: null, reviewedAt: null,
        biasRationale: 'Diario de Riohacha del grupo radial Sistema Cardenal. Es el único candidato regional que publica su accionariado con porcentajes. Valor provisional por coherencia con la banda regional — ver fichas/diario-del-norte.md.',
        feed: { url: 'https://diariodelnorte.net/feed', via: 'direct', category: 'Política' },
    },
    {
        id: 'el-diario-pereira', name: 'El Diario (Pereira)', shortName: 'El Diario',
        domain: 'eldiario.com.co', departamento: 'Risaralda', country: 'CO', group: 'Regional Risaralda',
        bias: 0.20, factuality: null, reviewedAt: null,
        biasRationale: 'Único diario de Pereira desde 2016, cuando la familia propietaria del Diario del Otún compró La Tarde y fusionó ambas cabeceras. Valor provisional por coherencia con la banda regional — ver fichas/el-diario-pereira.md.',
        feed: { url: 'https://www.eldiario.com.co/feed/', via: 'direct', category: 'Política' },
    },
    {
        id: 'proclama-del-pacifico', name: 'Proclama del Pacífico', shortName: 'Proclama',
        domain: 'proclamadelpacifico.com', departamento: 'Cauca', country: 'CO', group: 'Digital independiente',
        bias: 0.0, factuality: null, reviewedAt: null,
        biasRationale: 'Medio digital de Santander de Quilichao, verificado en el directorio de SembraMedia. Orientación mixta provisional: nada de la evidencia lo sitúa en el eje y la regla manda ir a la banda más cercana a la mixta — ver fichas/proclama-del-pacifico.md.',
        feed: { url: 'https://proclamadelpacifico.com/feed/', via: 'direct', category: 'Política' },
    },
    {
        id: 'choco-7-dias', name: 'Chocó 7 Días', shortName: 'Chocó 7 Días',
        domain: 'choco7dias.com', departamento: 'Chocó', country: 'CO', group: 'Regional Chocó',
        bias: 0.0, factuality: null, reviewedAt: null,
        biasRationale: 'Semanario de Quibdó, el único medio vivo del Chocó del catálogo. Declara denunciar las causas de la crisis del departamento; se clasifica en mixta porque denunciar al poder es el oficio y no una orientación, con la tensión declarada — ver fichas/choco-7-dias.md.',
        feed: { url: 'https://choco7dias.com/feed/', via: 'direct', category: 'Política' },
    },
    {
        id: 'el-manduco', name: 'El Manduco', shortName: 'El Manduco',
        domain: 'elmanduco.com.co', departamento: 'Guaviare', country: 'CO', group: 'Regional Guaviare',
        bias: 0.0, factuality: null, reviewedAt: null,
        biasRationale: 'Medio de San José del Guaviare cuyos cuatro cargos —fundador, director, director emérito y gerente— ocupa la misma familia. La estructura dice quién manda, no hacia dónde tira — ver fichas/el-manduco.md.',
        feed: { url: 'https://elmanduco.com.co/feed/', via: 'direct', category: 'Política' },
    },
    {
        id: 'miputumayo', name: 'MiPutumayo', shortName: 'MiPutumayo',
        domain: 'miputumayo.com.co', departamento: 'Putumayo', country: 'CO', group: 'Regional Putumayo',
        bias: 0.0, factuality: null, reviewedAt: null,
        biasRationale: 'Magazín digital de Mocoa fundado y dirigido por la misma persona desde 2004. Sin sociedad ni financiación declaradas; orientación mixta provisional — ver fichas/miputumayo.md.',
        feed: { url: 'https://miputumayo.com.co/feed/', via: 'direct', category: 'Política' },
    },
    {
        id: 'el-morichal', name: 'El Morichal', shortName: 'El Morichal',
        domain: 'elmorichal.com', departamento: 'Vichada', country: 'CO', group: 'Corporación El Morichal',
        bias: 0.0, factuality: null, reviewedAt: null,
        biasRationale: 'Corporación sin ánimo de lucro de Puerto Carreño que cubre Vichada y Guainía. Único medio sin ánimo de lucro de la tanda departamental; orientación mixta provisional — ver fichas/el-morichal.md.',
        feed: { url: 'https://elmorichal.com/feed/', via: 'direct', category: 'Política' },
    },
    {
        id: 'boyaca-digital', name: 'Boyacá Digital', shortName: 'Boyacá Digital',
        domain: 'boyacadigital.com', departamento: 'Boyacá', country: 'CO',
        group: 'Holding Consultants',
        bias: 0.0, factuality: null, reviewedAt: null,
        /**
         * PRIMER MEDIO DEL CATÁLOGO CON REDACCIÓN AUTOMATIZADA (2026-08-09).
         * Ver el bloque REDACCIONES más abajo y fichas/boyaca-digital.md.
         */
        redaccion: 'automatizada',
        biasRationale: 'Medio digital de Boyacá operado por una redacción de agentes de inteligencia artificial bajo supervisión editorial humana, según él mismo declara. Orientación mixta provisional: su línea no es una propiedad de la casa sino de su configuración — ver fichas/boyaca-digital.md.',
        feed: { url: 'https://www.boyacadigital.com/rss.xml', via: 'direct', category: 'Política' },
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
            // El país lo necesita el clasificador de ámbito para desempatar:
            // una pieza sin marca geográfica de un medio extranjero es
            // internacional, y de uno colombiano es nacional.
            country: media.country,
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
                country: media.country,
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
