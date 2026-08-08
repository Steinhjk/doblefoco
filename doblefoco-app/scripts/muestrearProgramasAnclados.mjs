/**
 * MUESTREO REPRODUCIBLE DE PROGRAMAS DEPARTAMENTALES PARA LA CALIBRACIÓN.
 *
 *   npm run muestra:programas -- [documentos-por-partido]
 *
 * QUÉ RESUELVE
 * ------------
 * El §20.5 del diseño pide muestrear 3 programas por partido «al azar, con
 * semilla declarada». Elegirlos a mano sería el punto exacto donde se cuela el
 * sesgo del que hace la medición: quien busca confirmar una hipótesis escoge,
 * sin querer, los documentos que la confirman.
 *
 * Aquí la semilla va escrita en el código y el generador es determinista, así
 * que cualquiera reproduce la misma muestra y puede comprobar que no se
 * seleccionó a conveniencia.
 *
 * POR QUÉ NO `Math.random()`
 * --------------------------
 * No se puede sembrar. Una muestra irreproducible obliga al auditor a confiar en
 * nuestra palabra sobre cómo se eligió, que es justo lo que este proyecto no
 * pide a nadie. `mulberry32` es cuatro líneas y hace la muestra verificable.
 *
 * POR QUÉ SE VUELVE A DESCARGAR LA POBLACIÓN, y no se usa el índice
 * -----------------------------------------------------------------
 * La primera versión de este script sorteaba sobre `ejemplos` de
 * `indice-programas-anclados.json`. Ese campo guarda **seis URL por partido**,
 * obtenidas con `docs.slice(0, 6)`: los primeros seis que devolvió la API, en
 * un orden que nadie eligió y que no es aleatorio.
 *
 * O sea que la semilla, el barajado de Fisher-Yates y el «cualquiera lo
 * reproduce» daban una garantía sobre el último paso mientras el filtro que de
 * verdad decidía —quedarse con 6 de 103— quedaba fuera del alcance de esa
 * garantía. Un muestreo reproducible sobre una preselección opaca no es un
 * muestreo reproducible: es la apariencia de uno.
 *
 * Por eso aquí se pide la tabla entera —494 programas— y se sortea sobre ella.
 * Cuesta una petición de red y convierte el aparato de reproducibilidad en algo
 * que efectivamente cubre la elección.
 *
 * QUÉ HACER CON LOS PDF SIN CAPA DE TEXTO
 * ---------------------------------------
 * Parte de lo radicado ante la Registraduría son ESCANEOS. El primer intento de
 * la prueba piloto se topó con uno: `PLAN_AL46880000011_E6.pdf` (Centro
 * Democrático, Casanare) devuelve **2 palabras en 12 páginas**.
 *
 * La regla es: **se sustituye por el SIGUIENTE del orden barajado, no por uno
 * elegido a mano**, y la sustitución se anota. Escoger el reemplazo a criterio
 * reabriría por la puerta de atrás exactamente el sesgo de selección que el
 * sorteo existe para cerrar.
 *
 * Por eso conviene pedir más documentos por partido de los que se van a
 * codificar: los sobrantes son la cola de reemplazo, y como el barajado es
 * determinista, pedir 5 en vez de 3 no cambia cuáles son los 3 primeros.
 *
 * NO SE DESCARTAN COMO «MALOS DOCUMENTOS». Un escaneo es un programa radicado
 * igual de válido; lo que falla es nuestra capacidad de leerlo. Si algún día la
 * proporción de escaneos resultara distinta entre partidos, eso sería un sesgo
 * de la muestra y habría que medirlo, no ignorarlo.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FUENTE = 'https://www.datos.gov.co/resource/h236-q58p.json?$limit=5000';

/**
 * SEMILLA DECLARADA. No se cambia para «ver si sale mejor»: cambiarla después de
 * ver un resultado que no gusta es exactamente la práctica que invalida una
 * medición. Si alguna vez hay que cambiarla, se cambia ANTES de mirar y se
 * escribe por qué.
 */
const SEMILLA = 20260808;

const POR_PARTIDO = Number(process.argv[2]) || 3;

/** Generador determinista de 32 bits. */
function mulberry32(a) {
    return function siguiente() {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const indice = JSON.parse(
    readFileSync(resolve(ROOT, 'programas/indice-programas-anclados.json'), 'utf8')
);

// La población completa, no los seis ejemplos guardados. Ver la cabecera.
const respuesta = await fetch(FUENTE, {
    headers: { 'User-Agent': 'DobleFocoBot/1.0 (+https://doblefoco.co/transparencia)' },
});
if (!respuesta.ok) {
    console.error(`\n  ✗ No se pudo descargar la población: HTTP ${respuesta.status}\n`);
    process.exitCode = 1;
    process.exit();
}
const filas = await respuesta.json();

/** @type {Record<string, {departamento: string, elegido: string, url: string}[]>} */
const poblacion = {};
for (const fila of filas) {
    const partido = fila.agrupacion_politica;
    if (!indice.partidos[partido]) continue;
    const url = fila.progama_de_gobierno?.url;
    if (!url) continue;
    (poblacion[partido] ??= []).push({
        departamento: fila.departamento,
        elegido: fila.nombre_del_elegido,
        url,
    });
}

const azar = mulberry32(SEMILLA);
const muestra = [];

// Orden alfabético de partidos ANTES de sortear: el orden de las claves de un
// objeto es estable en la práctica, pero apoyarse en eso haría que la muestra
// dependiera de en qué orden llegó la respuesta de la API.
for (const nombre of Object.keys(indice.partidos).sort()) {
    const partido = indice.partidos[nombre];
    const docs = poblacion[nombre] ?? [];

    if (!docs.length) {
        console.log(`  ${nombre}: sin URLs en la población, se omite`);
        continue;
    }

    // Barajado de Fisher-Yates con el generador sembrado, y luego los primeros N.
    const barajado = [...docs];
    for (let i = barajado.length - 1; i > 0; i -= 1) {
        const j = Math.floor(azar() * (i + 1));
        [barajado[i], barajado[j]] = [barajado[j], barajado[i]];
    }

    for (const doc of barajado.slice(0, POR_PARTIDO)) {
        muestra.push({
            partido: nombre,
            ancla: partido.ancla,
            poblacion: docs.length,
            departamento: doc.departamento,
            elegido: doc.elegido,
            url: doc.url,
        });
    }
}

const salida = {
    descripcion:
        'Muestra reproducible de programas de gobierno departamentales para calibrar ' +
        'la escala RILE contra las anclas externas (CHES-LA 2020 y V-Party 2018).',
    semilla: SEMILLA,
    documentosPorPartido: POR_PARTIDO,
    generadoEl: new Date().toISOString().slice(0, 10),
    poblacion: `${filas.length} filas descargadas de ${FUENTE}; se sortea sobre TODOS los programas de cada partido anclado, no sobre los ejemplos guardados en el índice.`,
    advertencia: indice.advertenciaDeGenero,
    comoReproducir: `npm run muestra:programas -- ${POR_PARTIDO}`,
    documentos: muestra,
};

const destino = resolve(ROOT, 'programas/muestra-calibracion.json');
writeFileSync(destino, `${JSON.stringify(salida, null, 2)}\n`, 'utf8');

console.log(`\n  MUESTRA — semilla ${SEMILLA}, ${POR_PARTIDO} por partido\n`);
for (const d of muestra) {
    const corto = d.partido.replace(/^PARTIDO /, '').slice(0, 26);
    console.log(
        `  ${corto.padEnd(27)} lrgen ${String(d.ancla.ches_lrgen).padStart(4)}  de ${String(d.poblacion).padStart(3)}  ` +
        `${d.departamento.padEnd(14)} ${d.elegido.slice(0, 26)}`
    );
}
console.log(`\n  ${muestra.length} documentos · escrito en programas/muestra-calibracion.json\n`);
