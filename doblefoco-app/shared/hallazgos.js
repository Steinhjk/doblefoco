// @ts-check

/**
 * EL LIBRO DE HALLAZGOS — un defecto con nombre, con edad y con historia.
 *
 * POR QUÉ EXISTE, Y ES UNA CRÍTICA A LA PRIMERA AUDITORÍA
 * -------------------------------------------------------
 * `auditoria/estado.json` es una FOTO: el estado de hoy, escrito encima del de
 * la semana pasada. Con una foto no se puede responder ninguna de las preguntas
 * que de verdad importan —cuánto lleva roto esto, ¿es nuevo o es el de siempre,
 * alguien decidió ya que se queda así—. Y un aviso que no distingue «apareció
 * hoy» de «lleva seis semanas» acaba leyéndose entero o no leyéndose nada, que
 * es exactamente como muere un vigilante.
 *
 * Aquí un hallazgo tiene tres cosas que la foto no daba:
 *
 *   IDENTIDAD  un id estable, para poder nombrarlo en la minuta y seguirlo entre
 *              pasadas aunque el texto del motivo se reescriba.
 *   EDAD       `primeraVez`, que no se toca nunca. Es lo que convierte «hay 14
 *              defectos» en «hay uno de hace dos meses», que es una frase que sí
 *              obliga a alguien a hacer algo.
 *   HISTORIA   lo resuelto NO SE BORRA, se marca. Y si vuelve, se cuenta. Un
 *              feed que se rompe y se arregla solo tres veces en un mes no es lo
 *              mismo que uno que se rompió una vez; la foto los igualaba.
 *
 * ESTE ARCHIVO NO TOCA LA RED NI EL DISCO. Lo escribe `scripts/auditoria.mjs` y
 * lo lee el panel; vive en `shared/` para que los dos cuenten lo mismo.
 */

/** Versión del formato de `auditoria/hallazgos.json`. */
export const VERSION_HALLAZGOS = 1;

/**
 * Los tres estados de un hallazgo.
 *
 *   abierto   está y nadie ha dicho nada.
 *   resuelto  dejó de aparecer. Se conserva: que algo se arreglara es parte del
 *             hilo, y borrarlo perdería la reincidencia.
 *   aceptado  una PERSONA decidió que se queda así. Sigue apareciendo y sigue
 *             contándose, pero no cuenta como pendiente ni abre aviso.
 *
 * Aceptar EXIGE nota. Un hallazgo silenciado sin decir por qué no está aceptado:
 * está escondido, y dentro de tres meses nadie sabrá cuál de las dos cosas fue.
 */
export const ESTADOS_HALLAZGO = /** @type {const} */ (['abierto', 'aceptado', 'resuelto']);

/**
 * El id de un hallazgo. Estable entre pasadas y legible por una persona.
 *
 * Se construye con lo que NO cambia —el medio y el tipo de defecto—, nunca con
 * el texto del motivo, que se reescribe cada vez que se afina un umbral. El
 * detalle solo entra donde un mismo medio puede tener varios del mismo tipo: las
 * fuentes, que son una por URL.
 */
export function idDeHallazgo(medioId, tipo, detalle = null) {
    return detalle ? `${medioId}/${tipo}/${detalle}` : `${medioId}/${tipo}`;
}

/** Dominio y ruta, para que el id de una fuente rota se pueda leer de un vistazo. */
function trozoDeUrl(url) {
    try {
        const u = new URL(url);
        return `${u.hostname.replace(/^www\./, '')}${u.pathname}`.replace(/\/$/, '').slice(0, 80);
    } catch {
        return String(url).slice(0, 80);
    }
}

/**
 * Los hallazgos que hay HOY en la ficha de un medio.
 *
 * «No comprobable» NO es un hallazgo y no entra. Es la regla que ya gobierna el
 * resto de la auditoría: que un sitio nos cierre la puerta desde la nube no es
 * un defecto del catálogo —Vorágine y Razón Pública responden desde casa—, y
 * meterlo aquí llenaría la minuta de tareas que no son de nadie.
 */
export function extraerHallazgos(medioId, medio) {
    const fuera = [];
    const nombre = medio?.nombre ?? medioId;
    const cuenta = (estado) => estado === 'roto' || estado === 'revisar';

    if (cuenta(medio?.feed?.estado)) {
        fuera.push({
            id: idDeHallazgo(medioId, 'feed'),
            medio: medioId,
            nombre,
            tipo: 'feed',
            gravedad: medio.feed.estado,
            resumen: medio.feed.motivo ?? 'el feed no está bien',
        });
    }

    if (medio?.rutas?.respondeATodo === true) {
        fuera.push({
            id: idDeHallazgo(medioId, 'rutas'),
            medio: medioId,
            nombre,
            tipo: 'rutas',
            gravedad: 'revisar',
            resumen: 'el sitio devuelve 200 a una ruta inventada: aquí un 200 no prueba nada',
        });
    }

    for (const f of medio?.fuentes ?? []) {
        if (!cuenta(f.estado)) continue;
        fuera.push({
            id: idDeHallazgo(medioId, 'fuente', trozoDeUrl(f.url)),
            medio: medioId,
            nombre,
            tipo: 'fuente',
            gravedad: f.estado,
            resumen: f.motivo ?? 'la fuente no resuelve',
            url: f.url,
        });
    }

    return fuera;
}

/** Todos los hallazgos de una pasada entera. */
export function hallazgosDeLaPasada(estado) {
    return Object.entries(estado?.medios ?? {}).flatMap(([id, m]) => extraerHallazgos(id, m));
}

/**
 * Cruza lo de hoy con lo que ya se sabía. **Nada se borra nunca.**
 *
 * LAS CUATRO TRANSICIONES, Y LA QUE MÁS IMPORTA ES LA ÚLTIMA:
 *
 *   nuevo        no estaba → `abierto`, y `primeraVez` queda fijada para siempre.
 *   sigue        estaba y sigue → solo se mueve `ultimaVez`.
 *   se resolvió  estaba y hoy no aparece → `resuelto`, con fecha.
 *   REAPARECE    estaba resuelto y vuelve → `abierto` otra vez, se cuenta la
 *                reincidencia y **`primeraVez` NO se reescribe**. Un problema
 *                crónico no es un hallazgo nuevo cada vez que asoma; tratarlo
 *                como nuevo es la manera de no verlo nunca entero.
 *
 * UNA PASADA PARCIAL NO RESUELVE NADA. Si se corrió con `--medio=`, lo que no se
 * miró no se puede dar por arreglado: se conserva tal cual. Sin esta salvaguarda,
 * una pasada de depuración sobre un solo medio marcaría como resueltos los
 * defectos de los otros setenta y cinco.
 */
export function conciliarHallazgos(libro, hallazgosHoy, hoy, { parcial = false } = {}) {
    const previo = libro?.hallazgos ?? {};
    const salida = {};
    const vistos = new Set();

    const nuevos = [];
    const reaparecidos = [];
    const resueltos = [];

    for (const h of hallazgosHoy) {
        vistos.add(h.id);
        const antes = previo[h.id];

        if (!antes) {
            salida[h.id] = {
                ...h,
                primeraVez: hoy,
                ultimaVez: hoy,
                estado: 'abierto',
                resueltoEl: null,
                reincidencias: 0,
                nota: null,
            };
            nuevos.push(salida[h.id]);
            continue;
        }

        const volvio = antes.estado === 'resuelto';
        salida[h.id] = {
            ...antes,
            // El texto sí se refresca: lo estable es el id, no la frase.
            nombre: h.nombre,
            gravedad: h.gravedad,
            resumen: h.resumen,
            ...(h.url ? { url: h.url } : {}),
            ultimaVez: hoy,
            estado: antes.estado === 'aceptado' ? 'aceptado' : 'abierto',
            resueltoEl: volvio ? null : (antes.resueltoEl ?? null),
            reincidencias: (antes.reincidencias ?? 0) + (volvio ? 1 : 0),
        };
        if (volvio) reaparecidos.push(salida[h.id]);
    }

    for (const [id, antes] of Object.entries(previo)) {
        if (vistos.has(id)) continue;

        const estabaVivo = antes.estado === 'abierto' || antes.estado === 'aceptado';
        if (parcial || !estabaVivo) {
            salida[id] = antes;
            continue;
        }

        salida[id] = { ...antes, estado: 'resuelto', resueltoEl: hoy };
        resueltos.push(salida[id]);
    }

    return {
        libro: { version: VERSION_HALLAZGOS, ultimaPasada: hoy, parcial, hallazgos: salida },
        nuevos,
        reaparecidos,
        resueltos,
    };
}

const DIA_MS = 24 * 60 * 60 * 1000;

/** Días que lleva abierto un hallazgo. `null` si no se puede fechar. */
export function diasAbierto(hallazgo, ahora = Date.now()) {
    const t = Date.parse(`${hallazgo?.primeraVez}T00:00:00Z`);
    return Number.isNaN(t) ? null : Math.max(0, Math.round((ahora - t) / DIA_MS));
}

/**
 * Lo pendiente, de lo más viejo a lo más nuevo.
 *
 * EL ORDEN ES EL ARGUMENTO, y es distinto del de la tabla del panel. Allí manda
 * la gravedad, porque se está mirando el catálogo. Aquí manda la ANTIGÜEDAD,
 * porque lo que esta lista responde es «qué llevamos más tiempo sin hacer» — y
 * un aviso menor de hace dos meses dice más sobre nosotros que uno grave de ayer.
 */
export function pendientes(libro, ahora = Date.now()) {
    return Object.values(libro?.hallazgos ?? {})
        .filter((h) => h.estado === 'abierto')
        .map((h) => ({ ...h, dias: diasAbierto(h, ahora) }))
        .sort((a, b) => (b.dias ?? 0) - (a.dias ?? 0));
}

/** El recuento del libro, para la cabecera del panel y para el flujo. */
export function resumirHallazgos(libro, ahora = Date.now()) {
    const todos = Object.values(libro?.hallazgos ?? {});
    const abiertos = todos.filter((h) => h.estado === 'abierto');
    const edades = abiertos.map((h) => diasAbierto(h, ahora)).filter((d) => d !== null);

    return {
        abiertos: abiertos.length,
        aceptados: todos.filter((h) => h.estado === 'aceptado').length,
        resueltos: todos.filter((h) => h.estado === 'resuelto').length,
        cronicos: todos.filter((h) => (h.reincidencias ?? 0) > 0).length,
        diasDelMasViejo: edades.length ? Math.max(...edades) : 0,
    };
}

/**
 * Los aceptados sin motivo escrito, que es un defecto del LIBRO y no del sitio.
 *
 * Se comprueba y se saca por pantalla porque es la única forma de que «aceptado»
 * siga significando algo. En cuanto se pueda silenciar un hallazgo sin escribir
 * por qué, «aceptado» pasa a querer decir «me molestaba».
 */
export function aceptadosSinNota(libro) {
    return Object.values(libro?.hallazgos ?? {}).filter(
        (h) => h.estado === 'aceptado' && !String(h.nota ?? '').trim(),
    );
}
