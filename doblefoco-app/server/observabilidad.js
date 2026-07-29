// @ts-check
/**
 * CAPTURA DE ERRORES A NIVEL DE PROCESO (F2-11)
 *
 * Antes de esto no había ni un manejador: un fallo no capturado mataba el
 * proceso sin dejar rastro en ninguna parte. En Fly la máquina se reiniciaba
 * sola y no quedaba constancia de que hubiera pasado nada.
 */

import { registrarError } from './db/errorStore.js';

/** Margen para que la escritura en la base termine antes de morir. */
const MARGEN_SALIDA_MS = 1_500;

/**
 * Instala los manejadores de proceso.
 *
 * QUÉ HACE AL CAPTURAR: registra, avisa por consola y SALE con código 1.
 *
 * Salir es deliberado y conviene entender el porqué, porque la alternativa
 * tienta. Tras una excepción no capturada el proceso queda en estado
 * desconocido: conexiones a medio cerrar, transacciones abiertas, variables a
 * medias. Un servidor de noticias que sigue respondiendo desde ese estado puede
 * servir datos incorrectos sin que nadie lo note, y eso es peor para ESTE
 * producto que unos segundos de caída — la credibilidad es lo único que
 * distingue a un agregador de sesgo de un montón de titulares.
 *
 * Fly reinicia la máquina sola en segundos, y ahora, gracias a esta función,
 * el fallo queda escrito antes de morir.
 *
 * @param {'api'|'motor'} proceso
 */
export function instalarCapturaDeErrores(proceso) {
    const morir = async (error, origen) => {
        console.error(`[${proceso}] error no capturado (${origen}):`, error);

        // Se le da un margen acotado: si la base es justo lo que está fallando,
        // esperar indefinidamente dejaría el proceso zombi.
        await Promise.race([
            registrarError({ error, proceso, origen }),
            new Promise((r) => setTimeout(r, MARGEN_SALIDA_MS)),
        ]);

        process.exit(1);
    };

    process.on('uncaughtException', (error) => { void morir(error, 'excepcion'); });

    // Node ≥15 ya termina el proceso ante una promesa rechazada sin manejar.
    // Registrar aquí NO cambia ese comportamiento: lo conserva y además deja
    // constancia. Si algún día se decide sobrevivir a ellas, este es el sitio,
    // pero sería un cambio de criterio que merece discutirse, no un descuido.
    process.on('unhandledRejection', (error) => { void morir(error, 'promesa'); });
}

/**
 * Middleware de errores de Express. Va SIEMPRE el último.
 *
 * Express identifica los manejadores de error por tener cuatro parámetros, así
 * que `next` no se puede quitar aunque no se use.
 *
 * NO REGISTRA LOS 4xx. Un cliente que pide una noticia inexistente o manda un
 * cuerpo mal formado no es un fallo nuestro; anotarlo convertiría la tabla en
 * un registro de tráfico y el panel dejaría de servir para lo que se hizo.
 *
 * @returns {import('express').ErrorRequestHandler}
 */
export function middlewareDeErrores() {
    // eslint-disable-next-line no-unused-vars
    return (error, req, res, next) => {
        const estado = Number(error?.status ?? error?.statusCode ?? 500);

        if (estado >= 500) {
            void registrarError({
                error,
                proceso: 'api',
                origen: 'peticion',
                // `req.path` y no `req.originalUrl`: la cadena de consulta puede
                // llevar términos de búsqueda de una persona, y no hacen falta
                // para diagnosticar.
                ruta: `${req.method} ${req.path}`,
            });
            console.error(`[api] ${req.method} ${req.path}`, error);
        }

        if (res.headersSent) return;

        res
            .status(estado >= 400 && estado < 600 ? estado : 500)
            .json({
                success: false,
                // Sin detalles hacia fuera: el mensaje de un error interno puede
                // describir la estructura de la base. El detalle vive en la
                // tabla `errores`, que exige sesión.
                error: estado >= 500 ? 'Error interno' : (error?.message ?? 'Petición inválida'),
            });
    };
}
