// @ts-check

/**
 * Números con decimales, escritos como se escriben en Colombia.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 * ---------------------------
 * Los enteros de este sitio ya salían bien, porque todos pasan por
 * `toLocaleString('es-CO')`. Los decimales no: se escribían con `toFixed()`,
 * que **siempre** devuelve punto y no conoce ninguna configuración regional. El
 * resultado era un sitio que decía «5.532 historias» y dos líneas más abajo
 * «4.1 % de los artículos», donde el mismo carácter significa dos cosas
 * distintas: en el primero separa miles y en el segundo separa decimales.
 *
 * Para un lector colombiano eso no es un detalle de estilo. «4.1» se lee como
 * cuatro mil cien antes de que el ojo corrija, y este es un sitio cuya materia
 * prima son porcentajes de cobertura y valores de orientación entre −1 y +1.
 *
 * NO SE INVENTÓ NADA: `CoverageTimeline` ya lo hacía, a mano, con un
 * `String(horas).replace('.', ',')` para escribir «+2,3 h». La intención estaba
 * y nunca se generalizó, así que siete sitios más siguieron escribiendo en
 * inglés. Esto es esa misma decisión puesta en un solo lugar.
 *
 * LO QUE ESTE ARCHIVO NO DEBE TOCAR, Y ES IMPORTANTE
 * --------------------------------------------------
 * Hay decimales que NO van a la pantalla y que se romperían con una coma:
 *
 *   · `aria-valuenow` — la especificación de ARIA exige un número decimal
 *     válido. Una coma lo invalida y el lector de pantalla deja de anunciar el
 *     valor. Va en `Sidebar` y en `MobileSidebar`.
 *   · `style={{ width: `${pct}%` }}` — CSS solo entiende el punto.
 *   · Cualquier valor que viaje a la API, a la base o a un `key` de React.
 *
 * La regla es simple: **esto se usa donde un humano lee, y solo ahí.**
 *
 * Y TAMPOCO los redondeos de `biasAnalysis` y `headlineTone`, que hacen
 * `Number(x.toFixed(3))`: eso no formatea nada, recorta la precisión de un
 * NÚMERO que después se guarda y se compara. Se parecen en la letra y no en el
 * oficio.
 *
 * VIVE EN `shared/` Y NO EN `src/lib/` porque no lo usa solo el navegador: los
 * motivos que escribe la auditoría —«publica una pieza cada 4,1 h»— se generan
 * fuera del navegador y se leen en el panel de administración.
 */

/**
 * Formateadores memorizados por clave.
 *
 * `Intl.NumberFormat` es caro de construir y esto se llama una vez por medio en
 * la tabla del mapa, que tiene 78 filas.
 */
const cache = new Map();

/** @param {number} decimales */
function formateador(decimales) {
    let f = cache.get(decimales);
    if (!f) {
        f = new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: decimales,
            maximumFractionDigits: decimales,
            // Los decimales de este sitio son porcentajes y valores de
            // orientación: nunca llegan a los miles, y agrupar «1.234,5» dentro
            // de un eje de −1 a +1 solo añadiría ruido.
            useGrouping: false,
        });
        cache.set(decimales, f);
    }
    return f;
}

/**
 * Un número con decimales, con coma, para enseñárselo a alguien.
 *
 * Devuelve cadena vacía si no hay número. Antes esto era `toFixed()`, que ante
 * `undefined` revienta con un TypeError; aquí un dato que falta se ve como un
 * hueco y no tumba la página.
 *
 * @param {number | null | undefined} valor
 * @param {number} [decimales]
 * @returns {string}
 */
export function decimal(valor, decimales = 1) {
    if (typeof valor !== 'number' || !Number.isFinite(valor)) return '';
    return formateador(decimales).format(valor);
}

/**
 * Igual, pero SIN rellenar con ceros: «2» y «2,3», no «2,0» y «2,3».
 *
 * Existe para la cronología de cobertura, que escribe retrasos —«+2 h», «+45
 * min», «+2,3 h»—. Ahí un «+2,0 h» declararía una precisión de décimas que la
 * frase no necesita, y encima alarga una etiqueta que va apretada.
 *
 * La diferencia con `decimal` es de intención, no de formato: `decimal` se usa
 * cuando la precisión ES el dato (un porcentaje de cobertura, un valor de
 * orientación) y `decimalCorto` cuando el número solo sitúa.
 *
 * @param {number | null | undefined} valor
 * @param {number} [maximoDecimales]
 * @returns {string}
 */
export function decimalCorto(valor, maximoDecimales = 1) {
    if (typeof valor !== 'number' || !Number.isFinite(valor)) return '';
    const clave = `corto:${maximoDecimales}`;
    let f = cache.get(clave);
    if (!f) {
        f = new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: maximoDecimales,
            useGrouping: false,
        });
        cache.set(clave, f);
    }
    return f.format(valor);
}

/**
 * Un valor de orientación editorial, con su signo siempre visible.
 *
 * El signo se escribe a mano y no con `signDisplay: 'always'` por una razón: el
 * negativo va con el MENOS tipográfico (U+2212), no con el guion del teclado.
 * Es lo que ya hacía el mapa de medios, y se conserva porque en una columna de
 * cifras alineadas el guion se lee como un separador y el menos no.
 *
 * `-0` entra aquí como cero: un medio en el centro exacto no tiene signo.
 *
 * @param {number | null | undefined} bias
 * @param {number} [decimales]
 * @returns {string}
 */
export function sesgo(bias, decimales = 2) {
    if (typeof bias !== 'number' || !Number.isFinite(bias)) return '';
    const signo = bias < 0 ? '−' : '+';
    return `${signo}${decimal(Math.abs(bias), decimales)}`;
}
