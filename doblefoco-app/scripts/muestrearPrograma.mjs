// Muestreo sistemático reproducible del programa de Cepeda (1.ª vuelta).
// Sistemático y no aleatorio simple: recorre el documento entero de principio a
// fin, así que ninguna sección queda fuera por azar. El arranque va fijo para
// que cualquiera repita exactamente la misma muestra.
import { readFileSync, writeFileSync } from 'node:fs';

const DIR = 'C:/Users/geren/OneDrive/Documentos/Proyectos antigravity/doblefoco/doblefoco-app/programas';
const texto = readFileSync(`${DIR}/pacto-historico-2026-v1.txt`, 'utf8');

const paginas = texto.split(/-- \d+ of \d+ --/);
console.log(`Páginas: ${paginas.length}`);

// Se descartan páginas sin prosa (portadas, índices, páginas casi vacías).
const COMUNES = /\b(de|la|el|los|las|para|con|que|una|del|por|en|y|se|su|es|al)\b/gi;
const utiles = paginas
    .map((p, i) => ({ pagina: i + 1, texto: p.replace(/\s+/g, ' ').trim() }))
    .filter((p) => {
        if (p.texto.length < 400) return false;
        const pal = p.texto.split(/\s+/).length;
        return ((p.texto.match(COMUNES) ?? []).length / pal) > 0.10;
    });

console.log(`Páginas con prosa codificable: ${utiles.length}`);

const N_MUESTRA = 24;
const paso = Math.floor(utiles.length / N_MUESTRA);
const ARRANQUE = 3; // fijo, declarado
const muestra = [];
for (let i = ARRANQUE; i < utiles.length && muestra.length < N_MUESTRA; i += paso) {
    muestra.push(utiles[i]);
}

console.log(`Muestra: ${muestra.length} páginas (1 de cada ${paso}), arranque en la ${ARRANQUE}`);
console.log(`Páginas elegidas: ${muestra.map((m) => m.pagina).join(', ')}`);

const palabras = muestra.reduce((s, m) => s + m.texto.split(/\s+/).length, 0);
console.log(`Palabras en la muestra: ${palabras}`);

writeFileSync(
    'C:/Users/geren/.claude/jobs/ba8780a5/tmp/muestra_cepeda.txt',
    muestra.map((m) => `\n===== PÁGINA ${m.pagina} =====\n${m.texto}`).join('\n')
);
