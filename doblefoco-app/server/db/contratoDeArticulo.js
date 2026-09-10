// @ts-check

/**
 * EL CONTRATO DE UN ARTÍCULO: cómo baja a la base y cómo vuelve a subir.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ EXISTE (2.4 / Kimi E-3)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `persistArticles` escribe columnas a mano y `articuloDesdeFila` las lee a
 * mano. **Son dos serializadores escritos por separado para la misma costura**,
 * y cuando se separan no falla nada: la fila se guarda, el artículo vuelve, y
 * solo falta un campo que nadie echa de menos hasta que una pantalla enseña un
 * cero.
 *
 * Ya ocurrió tres veces, y las tres están escritas en el código que las sufrió:
 *
 *   · `topics` y `ambito` — se escribían en cada ingesta y NO se leían nunca. Los
 *     4 000 artículos rehidratados volvían sin tema, así que **99 de las 100
 *     historias de la portada tenían `topics: []`** y Categorías enseñaba catorce
 *     ceros sobre un catálogo que sí estaba clasificado (2026-08-19).
 *   · La marca de opinión — al rehidratar volvía sin ella, y **71 columnas
 *     reentraban al agrupamiento en cada arranque** (2026-08-21).
 *   · `feed_categories` — el 2026-09-09, escribiendo esta misma costura, la
 *     columna nueva se añadió al `INSERT` y **se olvidó el parámetro `$14`**. El
 *     fallo no lo vio ni el lint ni `tsc` ni las pruebas: lo cazó ejecutar el
 *     SQL contra la base dentro de una transacción con `ROLLBACK`.
 *
 * Una revisión externa lo llamó «el arreglo más barato de toda la lista, y
 * habría cazado el fallo más caro». Esto es ese arreglo, y tiene la misma forma
 * que `contratoDeHistoria` para la otra costura: **una sola lista, leída desde
 * los dos lados**.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUÉ GENERA, Y POR QUÉ ESO IMPORTA MÁS QUE UNA PRUEBA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La lista no se comprueba: se USA. De ella salen la lista de columnas del
 * `INSERT`, las expresiones de su `SELECT`, los `$n::tipo[]` del `unnest`, los
 * alias, los valores en el mismo orden, y las columnas que pide la
 * rehidratación. **Un campo nuevo es una línea aquí y nada más**; olvidarse del
 * parámetro deja de ser posible porque nadie los numera a mano.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAS DOS CATEGORÍAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   `columna`  el campo vive en una columna de `articles`. Baja con `aFila` y
 *              vuelve con `deFila`.
 *   `deriva`   el campo del artículo en memoria NO se guarda, y está bien. Lleva
 *              escrito el motivo, que es lo que impide que «no se guarda» y «se
 *              nos olvidó guardarlo» se lean igual dentro de seis meses.
 */

/**
 * Cómo viaja un array de textos dentro de `unnest`.
 *
 * `unnest` no admite un array de arrays irregulares: aplana los
 * multidimensionales y exigiría el mismo número de elementos en cada fila, que
 * es justo lo que ni la clasificación multietiqueta ni las etiquetas del feed
 * garantizan. Así que viajan como UNA cadena por fila y se parten en SQL.
 *
 * @param {string} separador
 * @param {string} alias
 */
const partirEnSql = (separador, alias) =>
    `CASE WHEN ${alias} = '' THEN '{}'::text[] ELSE string_to_array(${alias}, ${separador}) END`;

/**
 * @typedef {{
 *   campo: string,
 *   columna: string,
 *   alias: string,
 *   tipo: string,
 *   aFila: (articulo: any) => any,
 *   deFila: (fila: any) => any,
 *   expresion?: (alias: string) => string,
 *   guardaComo?: (valor: any) => any,
 * }} CampoDeArticulo
 */

/**
 * LOS CAMPOS QUE VUELVEN, para que `tsc` los vea.
 *
 * `camposDesdeFila` llena el objeto en un bucle, y de un bucle el compilador no
 * puede inferir ni una clave: sin esto, todo lo que sale de la rehidratación
 * quedaba tipado como «un objeto con `outlet` y `opinion`» y cualquier
 * `articulo.topics` de aguas abajo se volvía un error. No es un segundo
 * serializador —no transforma nada—, es la declaración de lo que la lista de
 * abajo produce, y hay una prueba que exige que las dos digan lo mismo.
 *
 * @typedef {{
 *   id: string,
 *   link: string,
 *   sourceId: string,
 *   headline: string,
 *   rawTitle: string,
 *   snippet: string|null,
 *   category: string|null,
 *   tone: any,
 *   publishedAt: string|null,
 *   ingestedAtMs: number,
 *   imageUrl: string|null,
 *   topics: string[],
 *   ambito: string|null,
 *   feedCategories: string[],
 * }} CamposDeArticulo
 */

/** @type {CampoDeArticulo[]} */
export const CAMPOS_DE_ARTICULO = [
    { campo: 'id', columna: 'id', alias: 'id', tipo: 'text', aFila: (a) => a.id, deFila: (f) => f.id },
    {
        campo: 'link', columna: 'canonical_url', alias: 'url', tipo: 'text',
        aFila: (a) => a.link, deFila: (f) => f.canonical_url,
    },
    {
        campo: 'sourceId', columna: 'source_id', alias: 'src', tipo: 'text',
        aFila: (a) => a.outlet.id, deFila: (f) => f.source_id,
    },
    {
        campo: 'headline', columna: 'headline', alias: 'titular', tipo: 'text',
        aFila: (a) => a.headline, deFila: (f) => f.headline,
    },
    {
        campo: 'rawTitle', columna: 'raw_title', alias: 'crudo', tipo: 'text',
        aFila: (a) => a.rawTitle ?? null,
        // El titular limpio hace de respaldo: una fila vieja sin `raw_title` no
        // debe devolver null a una pantalla que espera texto.
        deFila: (f) => f.raw_title ?? f.headline,
    },
    {
        campo: 'snippet', columna: 'snippet', alias: 'extracto', tipo: 'text',
        aFila: (a) => a.snippet ?? null, deFila: (f) => f.snippet,
    },
    {
        campo: 'category', columna: 'category', alias: 'categoria', tipo: 'text',
        aFila: (a) => a.category ?? null, deFila: (f) => f.category,
    },
    {
        campo: 'tone', columna: 'tone', alias: 'tono', tipo: 'jsonb',
        aFila: (a) => (a.tone ? JSON.stringify(a.tone) : null),
        guardaComo: (v) => (v === null ? null : JSON.parse(String(v))),
        deFila: (f) => f.tone,
    },
    {
        campo: 'publishedAt', columna: 'published_at', alias: 'publicado', tipo: 'timestamptz',
        aFila: (a) => a.publishedAt ?? null, deFila: (f) => f.published_at,
    },
    {
        campo: 'ingestedAtMs', columna: 'ingested_at', alias: 'ingerido', tipo: 'timestamptz',
        aFila: (a) => new Date(a.ingestedAtMs ?? Date.now()).toISOString(),
        deFila: (f) => Date.parse(f.ingested_at),
    },
    {
        // null cuando el feed no trae imagen, que es lo más frecuente. No se
        // sustituye por nada: o es la del medio, o no hay. Sin esto la memoria
        // no sabría qué artículos ya tienen foto y el relleno de imágenes
        // intentaría rellenar los 4 000 en cada ciclo.
        campo: 'imageUrl', columna: 'image_url', alias: 'imagen', tipo: 'text',
        aFila: (a) => a.imageUrl ?? null, deFila: (f) => f.image_url,
    },
    {
        /*
         * Array vacío y NULL NO son lo mismo aquí, y la diferencia la usa el
         * recategorizador: NULL es «nunca se clasificó» y `{}` es «se clasificó
         * y no dio tema». Sin distinguirlas, cada pasada volvería a intentar los
         * mismos artículos inclasificables para siempre.
         *
         * `?? []` al volver y no `?? null`: aguas abajo esto se recorre con
         * `flatMap`, y un artículo viejo de antes de que existiera la columna
         * tiene que aportar cero temas, no reventar la construcción de su
         * historia.
         */
        campo: 'topics', columna: 'topics', alias: 'temas', tipo: 'text',
        expresion: (alias) => partirEnSql("','", alias),
        aFila: (a) => (a.topics ?? []).join(','),
        guardaComo: (v) => (v === '' ? [] : String(v).split(',')),
        deFila: (f) => f.topics ?? [],
    },
    {
        campo: 'ambito', columna: 'ambito', alias: 'ambito', tipo: 'text',
        aFila: (a) => a.ambito ?? null, deFila: (f) => f.ambito ?? null,
    },
    {
        /*
         * Las etiquetas que el medio le puso al ítem en su RSS. El separador es
         * el TABULADOR y no la coma porque una etiqueta de medio sí puede llevar
         * comas —«Bogotá, D.C.» es una sección de verdad— y ninguna lleva
         * tabuladores.
         *
         * Nunca NULL desde aquí: una pieza sin etiquetas guarda `{}`, y así NULL
         * sigue significando lo único que significa —«esta fila se escribió
         * antes de que existiera la columna»—, que es lo que mira el relleno del
         * `ON CONFLICT`.
         */
        campo: 'feedCategories', columna: 'feed_categories', alias: 'etiquetas', tipo: 'text',
        expresion: (alias) => partirEnSql("E'\\t'", alias),
        aFila: (a) => (a.feedCategories ?? []).join('\t'),
        guardaComo: (v) => (v === '' ? [] : String(v).split('\t')),
        deFila: (f) => f.feed_categories ?? [],
    },
];

/**
 * Lo que el artículo en memoria tiene y la tabla NO guarda, con su motivo.
 *
 * Existe para que la prueba pueda exigir que todo campo esté en una de las dos
 * listas. Un campo que no esté en ninguna es la pregunta que hay que hacerse
 * antes de que la haga una pantalla en blanco.
 */
export const CAMPOS_QUE_NO_SE_GUARDAN = {
    outlet: 'Sale del JOIN con `sources`, que es la proyección del registro. Guardarlo aquí congelaría el sesgo de un medio en cada artículo.',
    opinion: 'Se DERIVA al rehidratar, de `canonical_url` y `feed_categories`. Guardar el veredicto duplicaría un dato que ya está y dejaría mintiendo a los artículos viejos el día que se afine la detección.',
};

/** Las columnas, en el orden en que viajan. */
export const COLUMNAS = CAMPOS_DE_ARTICULO.map((c) => c.columna);

/**
 * El `INSERT` de la ingesta, generado de la lista de arriba.
 *
 * Devuelve la consulta sin el `ON CONFLICT`, que es política de escritura y no
 * forma parte del contrato: decidir qué se rellena al reencontrar una fila es
 * una decisión aparte y vive donde se toma.
 */
export function sqlDeInsercion() {
    const columnas = CAMPOS_DE_ARTICULO.map((c) => c.columna).join(', ');
    const expresiones = CAMPOS_DE_ARTICULO
        .map((c) => (c.expresion ? c.expresion(c.alias) : c.alias))
        .join(',\n               ');
    const parametros = CAMPOS_DE_ARTICULO
        .map((c, i) => `$${i + 1}::${c.tipo}[]`)
        .join(', ');
    const alias = CAMPOS_DE_ARTICULO.map((c) => c.alias).join(', ');

    return `INSERT INTO articles
            (${columnas})
        SELECT ${expresiones}
          FROM unnest(${parametros}) AS t(${alias})`;
}

/**
 * Los valores, en el mismo orden que los `$n` de arriba. Nadie los numera a
 * mano, que es de donde salió el fallo del `$14`.
 *
 * @param {any[]} articulos
 */
export function valoresDeInsercion(articulos) {
    return CAMPOS_DE_ARTICULO.map((campo) => articulos.map((a) => campo.aFila(a)));
}

/** Las columnas que la rehidratación tiene que pedir, con su prefijo de tabla. */
export function columnasParaLeer(prefijo = 'a') {
    return CAMPOS_DE_ARTICULO.map((c) => `${prefijo}.${c.columna}`).join(', ');
}

/**
 * Los campos del artículo que salen de la fila. `articuloDesdeFila` le añade lo
 * que viene del JOIN y lo que se deriva.
 *
 * @param {Record<string, any>} fila
 */
export function camposDesdeFila(fila) {
    /** @type {Record<string, any>} */
    const articulo = {};
    for (const campo of CAMPOS_DE_ARTICULO) articulo[campo.campo] = campo.deFila(fila);
    return /** @type {CamposDeArticulo} */ (articulo);
}

/**
 * LA IDA Y VUELTA, SIN BASE DE DATOS.
 *
 * Simula lo que Postgres hace con cada valor —`guardaComo`, que solo declaran
 * los tres campos que la base transforma: el JSON del tono y los dos arrays que
 * viajan como cadena— y devuelve la fila que el `SELECT` leería. Con eso la
 * prueba puede recorrer el circuito entero sin conexión.
 *
 * NO SUSTITUYE A CORRERLO CONTRA LA BASE, y conviene decirlo: esto comprueba que
 * las dos mitades del contrato encajan entre sí, no que el SQL sea válido. Lo
 * segundo se comprueba ejecutándolo dentro de una transacción con `ROLLBACK`,
 * que es lo que cazó el `$14` que faltaba.
 *
 * @param {any} articulo
 */
export function filaSimulada(articulo) {
    /** @type {Record<string, any>} */
    const fila = {};
    for (const campo of CAMPOS_DE_ARTICULO) {
        const crudo = campo.aFila(articulo);
        fila[campo.columna] = campo.guardaComo ? campo.guardaComo(crudo) : crudo;
    }
    return fila;
}
