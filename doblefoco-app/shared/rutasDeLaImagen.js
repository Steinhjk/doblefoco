// @ts-check

/**
 * ¿PUEDE ESTE ARCHIVO CAMBIAR LO QUE CORRE FLY?
 *
 * POR QUÉ EXISTE (2026-08-21)
 * ---------------------------
 * `comprobarDesfase.mjs` comparaba el commit de la imagen con el de `main` por
 * igualdad estricta. Ese día se escribieron dos archivos `.md` —la minuta y la
 * nota de traspaso—, `main` avanzó, y el vigilante quedó listo para gritar que
 * «Fly está 1 commit por detrás» por un texto que ninguna máquina ejecuta. Hubo
 * que pagar un despliegue entero de Fly solo para callarlo.
 *
 * ESTO NO ES BAJAR EL LISTÓN PARA QUE DEJE DE MOLESTAR. La cabecera del propio
 * workflow dice qué quiere saber: si Fly corre el CÓDIGO que hay en main. Un
 * `.md` no es código. Ajustar una medida hasta que calle al que molesta es como
 * se estropea un vigilante —está escrito en la minuta a propósito de Razón
 * Pública—; corregir QUÉ mide para que responda la pregunta que dice responder
 * es lo contrario.
 *
 * SE EQUIVOCA HACIA EL LADO SEGURO, Y ESO ES DELIBERADO
 * -----------------------------------------------------
 * Los dos errores posibles no cuestan lo mismo. Dar por irrelevante un archivo
 * que sí llega a la imagen **silencia un desfase real**, que es la avería que
 * este workflow existe para cazar y que ya mordió dos veces —seis días con el
 * motor leyendo 37 feeds y tres secciones de la portada en cero—. Dar por
 * relevante uno que no llega solo produce una alarma de más.
 *
 * Por eso la lista es de lo que se PERDONA, no de lo que cuenta: cualquier ruta
 * que no encaje aquí se trata como desfase. Añadir algo a esta lista exige poder
 * demostrar que no llega, no que probablemente no llegue.
 *
 * LO QUE DE VERDAD LLEGA, SEGÚN EL Dockerfile
 * -------------------------------------------
 * La etapa `runtime` copia `package.json`, `server/`, `shared/`, `scripts/` y
 * `certs/`, más el `dist/` y `dist-server/` que produce la etapa `build` a
 * partir de `COPY . .` —así que `src/`, `public/`, `index.html`, `vite.config.js`
 * y todo lo que el cliente importe (incluido `auditoria/*.json`) también—. El
 * contexto de construcción es `doblefoco-app/`: nada de la raíz del repositorio
 * ni de `.github/` entra en la imagen jamás.
 */

/** El contexto de construcción de `fly deploy`. Fuera de aquí no hay imagen. */
const CONTEXTO = 'doblefoco-app/';

/**
 * Rutas que NO pueden cambiar lo que la imagen ejecuta. Ver arriba: esta lista
 * se amplía solo con pruebas, nunca por comodidad.
 */
const PERDONADAS = [
    // Prosa. Entra en la imagen por el `COPY . .` de la etapa de compilación,
    // pero no la ejecuta nada ni acaba en el paquete: ni el servidor la lee ni
    // Vite la incluye en `dist/`.
    /\.md$/i,
    // Las pruebas están en `.dockerignore` (`**/*.test.js`), y las de interfaz
    // viven en `src/` pero Vite no las mete en el paquete.
    /\.test\.(js|jsx)$/i,
];

/**
 * ¿Puede este archivo cambiar lo que corre Fly?
 *
 * @param {string} ruta Ruta relativa a la raíz del repositorio, como la da
 *   `git diff --name-only`.
 * @returns {boolean} `true` si llega a la imagen, y por tanto un cambio suyo
 *   sin desplegar ES un desfase.
 */
export function llegaALaImagen(ruta) {
    // `git diff --name-only` entrega siempre barras normales, también en
    // Windows, así que no hace falta normalizar nada aquí.
    if (typeof ruta !== 'string' || !ruta) return false;
    if (!ruta.startsWith(CONTEXTO)) return false;
    return !PERDONADAS.some((re) => re.test(ruta));
}
