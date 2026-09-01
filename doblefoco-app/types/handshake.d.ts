/**
 * La huella del registro que `vite.config.js` incrusta en el bundle con
 * `define` (el handshake de versión, I-7 / 2-B). En las pruebas y en el
 * renderizado en servidor puede no existir: por eso los usos pasan por
 * `hashEsperadoDelBundle()`, que la lee con guarda.
 */
declare const __REGISTRO_HASH_ESPERADO__: string;
