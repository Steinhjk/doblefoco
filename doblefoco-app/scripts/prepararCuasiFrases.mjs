/**
 * PREPARA LAS CUASI-FRASES DE UN PROGRAMA PARA CODIFICARLAS.
 *
 *   node scripts/prepararCuasiFrases.mjs <fichero.txt> [objetivo]
 *
 * POR QUÉ EXISTE, Y NO SE ELIGEN LOS PASAJES A OJO
 * ------------------------------------------------
 * Codificar «las partes relevantes» de un programa es el mismo fallo que
 * muestrear documentos a mano, un nivel más abajo: quien busca confirmar que un
 * partido es de derecha encuentra, sin querer, los párrafos que lo confirman.
 *
 * Aquí el recorrido es SISTEMÁTICO —1 de cada k, con arranque fijo— sobre el
 * documento entero, así que ninguna sección queda fuera por decisión de nadie y
 * cualquiera reproduce exactamente la misma lista.
 *
 * QUÉ CUENTA COMO CUASI-FRASE
 * ---------------------------
 * MARPOR codifica «quasi-sentences»: una afirmación política única. En la
 * práctica, una oración normal es una cuasi-frase, y una oración con varias
 * propuestas se parte. Aquí se parte por oración y por viñeta —estos programas
 * están llenos de listas donde cada guion ES una propuesta— y el codificador
 * puede subdividir después si una trae dos afirmaciones distintas.
 *
 * LO QUE SE DESCARTA, y por qué no sesga
 * --------------------------------------
 * Fragmentos sin verbo ni contenido proposicional: títulos, numeraciones sueltas,
 * encabezados de tabla, cadenas de menos de 30 caracteres. No son afirmaciones
 * políticas y no reciben código en MARPOR tampoco. Se descartan ANTES de
 * muestrear para que el paso no gaste su cupo en ruido tipográfico.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

const fichero = process.argv[2];
const OBJETIVO = Number(process.argv[3]) || 80;
const ARRANQUE = 2; // fijo y declarado

if (!fichero) {
    console.error('uso: node scripts/prepararCuasiFrases.mjs <fichero.txt> [objetivo]');
    process.exitCode = 1;
    process.exit();
}

const bruto = readFileSync(fichero, 'utf8');

/** Corta por oración y por viñeta; normaliza el espacio. */
const trozos = bruto
    .replace(/\r/g, '')
    // Las viñetas llegan como  , •, -, – al principio de línea o tras un salto.
    .split(/(?<=[.;:!?])\s+|\n\s*[\u2022\u25cf\uf0a7\uf0b7*\-–]\s*|\n{2,}/)
    .map((t) => t.replace(/\s+/g, ' ').trim());

const CON_VERBO = /\b(se|se[rá]|es|son|está|están|hay|tiene|tienen|será|serán|debe|deben|puede|pueden|har[áé]|gestionar|promover|crear|fortalecer|mejorar|construir|apoyar|impulsar|garantizar|implementar|desarrollar|realizar|generar|ampliar|reducir|proteger|articular|formular|dise[ñn]ar|adoptar|establecer|dotar|entregar|aumentar)\w*\b/i;

const candidatas = trozos.filter((t) => {
    if (t.length < 30) return false;
    if (!/[a-záéíóúñ]/i.test(t)) return false;
    // Una línea que es solo numeración o mayúsculas es un título.
    if (/^[\d.\s]+$/.test(t)) return false;
    if (t === t.toUpperCase() && t.length < 90) return false;
    return CON_VERBO.test(t);
});

const paso = Math.max(1, Math.floor(candidatas.length / OBJETIVO));
const muestra = [];
for (let i = ARRANQUE; i < candidatas.length && muestra.length < OBJETIVO; i += paso) {
    muestra.push({ n: muestra.length + 1, indiceEnDocumento: i, texto: candidatas[i] });
}

const nombre = basename(fichero, '.txt');
const salida = {
    documento: nombre,
    cuasiFrasesCandidatas: candidatas.length,
    trozosBrutos: trozos.length,
    objetivo: OBJETIVO,
    paso,
    arranque: ARRANQUE,
    metodo: 'Sistemático 1 de cada k sobre el documento entero, arranque fijo en 2. Reproducible.',
    muestra,
};

// Junto al fichero de entrada, no en una ruta fija: con la ruta fija, preparar
// los documentos cegados dejaba su salida en la carpeta del piloto.
const destino = resolve(dirname(fichero), `${nombre}.cuasi.json`);
writeFileSync(destino, `${JSON.stringify(salida, null, 2)}\n`, 'utf8');

console.log(`\n  ${nombre}`);
console.log(`    trozos brutos ....... ${trozos.length}`);
console.log(`    cuasi-frases ........ ${candidatas.length}`);
console.log(`    muestreadas ......... ${muestra.length} (1 de cada ${paso})`);
console.log(`    → ${destino}\n`);
