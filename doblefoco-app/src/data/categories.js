// @ts-check

/**
 * Secciones del sitio.
 *
 * Extraídas de src/data/mockData.js al retirarlo (F2-03). Son lo ÚNICO que
 * merecía sobrevivir de aquel archivo: definen la estructura de navegación del
 * sitio, no afirman nada sobre ningún medio ni sobre ninguna noticia.
 *
 * Todo lo demás que había allí —200 historias con 600 citas inventadas
 * atribuidas a 32 medios reales, y ocho "temas en tendencia" con contadores de
 * artículos fabricados— se eliminó.
 *
 * TRES EJES, NO UNO. La lista mezclaba cosas que no son comparables, que es el
 * mismo colapso que la base de datos deshizo al separar `topics` de `ambito`:
 *
 *   - `todo`   — el catálogo entero. No filtra nada.
 *   - `tema`   — de qué trata la pieza. Sale de `TEMAS` en el clasificador y
 *                una historia puede tener varios a la vez.
 *   - `ambito` — dónde ocurre. Nacional o internacional, y es independiente del
 *                tema: una noticia puede ser internacional Y deportiva.
 *
 * Mientras «Internacional» vivía en la misma lista que «Economía» sin
 * distinción, la baldosa comparaba contra el nombre de tema y por tanto no
 * podía acertar nunca.
 *
 * `id` ES EL CONTRATO con el clasificador, no `name`. Los ids de tema de aquí
 * tienen que existir en `TEMAS` (shared/topicClassifier.js) tal cual: el
 * desajuste entre el `Judicial` de los feeds y el `Justicia` de la interfaz ya
 * dejó una baldosa en cero con cinco historias dentro. El nombre es solo lo que
 * lee el visitante y puede reescribirse sin tocar nada más.
 *
 * FALTABAN TRES. `conflicto`, `derechos` y `cultura` llevaban clasificándose en
 * el motor sin baldosa donde aparecer, así que su cobertura era invisible en
 * esta pantalla.
 *
 * Y FALTABA UNA ENTERA. Los desastres no tenían sección: medidos 400 artículos
 * del terremoto del Chocó, 236 se quedaban sin tema y los demás se repartían
 * entre TRECE. El Congreso aplazando sesión en Política, los bancos reabriendo
 * en Economía, el Ejército buscando desaparecidos en Justicia, Shakira en
 * Entretenimiento. Quien quisiera saber qué pasó con el terremoto no tenía
 * dónde ir. Se añadió `desastres` el 2026-08-10.
 *
 * Y SOBRABA UNA MAL HECHA. «Cultura y medios» era el cajón de lo que no cabía
 * en ninguna otra: el cine y los museos, la libertad de prensa, y la telenovela
 * con el influencer. Jose la señaló como difusa y al abrir el léxico se vio por
 * qué —el asunto central de este sitio, quién puede informar y quién lo
 * impide, estaba archivado junto a «reggaetón»—. Se partió en `cultura`,
 * `medios` y `entretenimiento` el 2026-08-04.
 */

/**
 * @typedef {Object} Categoria
 * @property {string} id
 * @property {string} name
 * @property {'todo'|'tema'|'ambito'} tipo
 * @property {string} description
 */

/** @type {Categoria[]} */
export const categories = [
    {
        id: 'ultimas',
        name: 'Últimas Noticias',
        tipo: 'todo',
        description: 'Todo el catálogo, nacional e internacional.',
    },
    {
        id: 'politica',
        name: 'Política',
        tipo: 'tema',
        description: 'Congreso, altas cortes, gobierno y elecciones 2026.',
    },
    {
        id: 'economia',
        name: 'Economía',
        tipo: 'tema',
        description: 'Inflación, tasa de interés, divisas y finanzas públicas.',
    },
    {
        id: 'justicia',
        name: 'Justicia',
        tipo: 'tema',
        description: 'Fiscalía, Corte Suprema, JEP y procesos judiciales.',
    },
    {
        id: 'conflicto',
        name: 'Conflicto y paz',
        tipo: 'tema',
        description: 'Grupos armados, negociaciones y seguridad territorial.',
    },
    {
        id: 'derechos',
        name: 'Derechos y sociedad',
        tipo: 'tema',
        description: 'Derechos humanos, migración, género y protesta social.',
    },
    {
        id: 'medios',
        name: 'Medios y libertad de prensa',
        tipo: 'tema',
        // Cabe en las dos líneas de la baldosa. La primera redacción añadía «y
        // quién financia la prensa» y se cortaba a media frase.
        description: 'Censura, agresiones a periodistas y desinformación.',
    },
    {
        id: 'salud',
        name: 'Salud',
        tipo: 'tema',
        description: 'Sistema de salud, EPS, ADRES y reformas públicas.',
    },
    {
        id: 'educacion',
        name: 'Educación',
        tipo: 'tema',
        description: 'Educación superior, ICETEX y formación regional.',
    },
    {
        id: 'desastres',
        name: 'Desastres y accidentes',
        tipo: 'tema',
        description: 'Sismos, ola invernal, accidentes y la respuesta a la emergencia.',
    },
    {
        id: 'ambiente',
        name: 'Medio Ambiente',
        tipo: 'tema',
        description: 'Transición energética, deforestación y biodiversidad.',
    },
    {
        id: 'infraestructura',
        name: 'Infraestructura',
        tipo: 'tema',
        description: 'Vías 4G/5G, puertos, aeropuertos y transporte fluvial.',
    },
    {
        id: 'tecnologia',
        name: 'Tecnología',
        tipo: 'tema',
        description: 'Inteligencia artificial, conectividad 5G y ciberseguridad.',
    },
    {
        id: 'cultura',
        name: 'Cultura',
        tipo: 'tema',
        description: 'Cine, música, literatura, museos, teatro y patrimonio.',
    },
    {
        id: 'entretenimiento',
        name: 'Entretenimiento',
        tipo: 'tema',
        description: 'Televisión, streaming, realities y famosos.',
    },
    {
        id: 'deportes',
        name: 'Deportes',
        tipo: 'tema',
        description: 'Selección Colombia, atletas olímpicos y liga profesional.',
    },
    {
        id: 'internacional',
        name: 'Internacional',
        tipo: 'ambito',
        description: 'Cobertura global y su impacto en Colombia.',
    },
];
