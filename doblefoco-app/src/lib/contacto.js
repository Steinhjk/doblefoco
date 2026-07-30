// @ts-check
/**
 * LA DIRECCIÓN DE CONTACTO, EN UN SOLO SITIO.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO. Hasta el 2026-07-30 la dirección estaba escrita
 * en cuatro sitios y con DOS VALORES DISTINTOS: `contacto@doblefoco.co` a mano
 * en «Quiénes somos» y dos veces en «Transparencia», y `doblefococo@gmail.com`
 * como constante en el servicio del boletín. Ninguno de los dos era el buzón
 * real.
 *
 * Es el mismo patrón que ya costó caro con el sesgo de los medios —el mismo
 * hecho declarado en varios archivos que divergen en silencio— y tiene la misma
 * solución: un solo sitio del que todo lo demás deriva.
 *
 * IMPORTA MÁS QUE UNA CONSTANTE CUALQUIERA. Es la dirección por la que alguien
 * pide que borremos su dato personal, y por la que un medio objetaría su
 * clasificación. Una dirección equivocada ahí no es una errata: es una vía de
 * reclamación que no llega a nadie.
 */

/** Buzón real del proyecto. */
export const CONTACT_EMAIL = 'doblefoco.co@gmail.com';

/** Enlace listo para un `href`. */
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;
