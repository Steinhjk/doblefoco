/*
 * SIN `// @ts-check`, y no por pereza: este archivo lee `import.meta.env`, que
 * necesita los tipos de `vite/client` y este proyecto no los tiene declarados.
 * Los otros cuatro servicios lo evitan de la misma forma. El día que se añada
 * un `src/vite-env.d.ts`, esta línea puede volver.
 */

/**
 * De dónde cuelga la API, decidido UNA vez.
 *
 * Estas cinco líneas estaban copiadas en `apiClient`, `authClient`,
 * `moderationClient` y `reportClient`, con cuatro formas distintas de preguntar
 * lo mismo: `Boolean(API_BASE)`, `!API_BASE`, `isApiConfigured`,
 * `isModerationAvailable`. Cuatro copias de una regla es cuatro sitios donde
 * puede divergir, y este proyecto ya sabe cómo acaba eso.
 *
 * LOS TRES ESTADOS, Y POR QUÉ HACEN FALTA TRES
 * --------------------------------------------
 *
 *   `VITE_API_URL` vacía  ->  MODO DEMOSTRACIÓN. No se intenta ninguna
 *       petición: el sitio se dibuja con el catálogo local. Es un estado
 *       legítimo y hay que conservarlo, así que vacío NO puede significar
 *       «mismo origen».
 *
 *   `VITE_API_URL=same-origin`  ->  MISMO ORIGEN. Las rutas salen relativas
 *       (`/api/...`) y las sirve quien sirva la página. En desarrollo eso es el
 *       proxy de `vite.config.js`, que reenvía a la API de verdad.
 *
 *       SE ADMITE TAMBIÉN `/`, que es la notación natural, pero NO se
 *       recomienda en este proyecto: Git Bash —el shell de la máquina donde se
 *       desarrolla— convierte un `/` suelto en una ruta de Windows antes de que
 *       llegue a Node. `VITE_API_URL=/ npm run dev` acaba valiendo
 *       `C:/Program Files/Git`, y el navegador intenta pedir a `file:///…`.
 *       Comprobado el 2026-08-24, y cuesta un rato entender qué pasa.
 *
 *   `VITE_API_URL=https://…`  ->  ORIGEN AJENO. Es lo que usa Vercel, donde el
 *       valor sale de `vercel.json` y el dominio tiene que estar además en
 *       `connect-src` de la CSP.
 *
 * POR QUÉ EXISTE EL ESTADO DEL MEDIO. Poner la URL de producción en local
 * parece lo natural y es una trampa: el navegador pide entonces a otro origen,
 * la API solo permite el de producción, y TODAS las llamadas mueren en la CORS.
 * Lo que se ve no es un fallo del código, es la página vacía con los contadores
 * en cero — un diagnóstico falso esperando a que alguien lo crea. Pasó el
 * 2026-08-24 y costó media hora de perseguir un fantasma.
 */

const CRUDA = (import.meta.env.VITE_API_URL ?? '').trim();

/** Marca de mismo origen. No es una base vacía: vacío es modo demostración. */
const MISMO_ORIGEN = CRUDA === 'same-origin' || CRUDA === '/';

/** Prefijo de toda petición. Cadena vacía cuando es el mismo origen. */
export const API_BASE = MISMO_ORIGEN ? '' : CRUDA.replace(/\/+$/, '');

/**
 * ¿Se puede pedir algo?
 *
 * Ojo con la tentación de escribir `Boolean(API_BASE)`: con mismo origen la
 * base es la cadena vacía **a propósito**, y esa comprobación devolvería falso
 * justo cuando sí hay API. Es el fallo que hizo falta arreglar para que el
 * proxy sirviera de algo.
 */
export const HAY_API = MISMO_ORIGEN || Boolean(API_BASE);
