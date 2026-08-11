// @ts-check

/**
 * CÓMO SE PRESENTA ESTE PROYECTO ANTE LOS MEDIOS QUE LEE.
 *
 * Un solo sitio, y no cinco. Estaba copiado literalmente en `ingestDaemon`,
 * `imageEnricher`, `cosecharMedios`, `descubrirFeed` y `verifyFeeds`, que es la
 * clase de duplicación que este proyecto ya pagó cara en F1-04: el mismo hecho
 * declarado en varios documentos que pueden divergir en silencio. Aquí además
 * habría significado arreglar un fallo en un archivo y dejarlo vivo en cuatro.
 *
 * LA TILDE QUE NOS CERRÓ PUERTAS (2026-08-11)
 * -------------------------------------------
 * Decía «agregador de cobertura periodística», con tilde. Una cabecera HTTP solo
 * admite ASCII, así que ese User-Agent era inválido y los cortafuegos lo
 * rechazaban de plano. Medido sobre el mismo servidor y el mismo minuto:
 *
 *   ...cobertura periodística)   → HTTP 403
 *   ...cobertura periodistica)   → HTTP 200
 *
 * No nos rechazaban por ser un bot: `DobleFocoBot/1.0` a secas también da 200.
 * Nos rechazaban por mandar una cabecera mal formada.
 *
 * LO QUE ESTO OBLIGA A CORREGIR, Y NO ES EL CÓDIGO
 * ------------------------------------------------
 * Quedó escrito como decisión que «los bloqueos de robots se respetan:
 * prensaescrita.com devuelve 403 a nuestro bot y 200 a un navegador, y no se
 * cambia el User-Agent porque contradiría lo que el motor declara de sí mismo».
 * El principio sigue en pie y es correcto. La premisa no: prensaescrita.com
 * nunca nos bloqueó. Sin la tilde responde 200.
 *
 * Conviene tenerlo presente antes de dar por deliberado el próximo 403. Un medio
 * que nos cierra la puerta merece que le escribamos; una cabecera rota solo
 * merece arreglarse, y confundirlas nos hizo renunciar a una fuente durante días.
 *
 * QUITAR LA TILDE NO ES DISFRAZARSE. Se dice exactamente lo mismo, con los
 * mismos caracteres que permite el protocolo: seguimos siendo `DobleFocoBot`,
 * seguimos enlazando a la página donde explicamos qué hacemos y a quién
 * escribir. Lo que NO se hace, y sigue sin hacerse, es fingir ser un navegador.
 */

/**
 * El User-Agent de todo lo que este proyecto pide por red.
 *
 * ASCII PURO, y hay una prueba que lo verifica. No es una preferencia de estilo:
 * es lo único que admite una cabecera HTTP.
 */
export const USER_AGENT =
    'DobleFocoBot/1.0 (+https://doblefoco.co/transparencia; agregador de cobertura periodistica)';

/** Cabeceras por defecto de cualquier petición nuestra. */
export const CABECERAS = Object.freeze({
    'User-Agent': USER_AGENT,
});
