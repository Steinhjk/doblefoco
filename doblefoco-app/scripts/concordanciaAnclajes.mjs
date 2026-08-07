// Concordancia entre CHES-LA 2020 y Global Party Survey 2019 en partidos colombianos.
// Sin dependencias: parseo manual.
import { readFileSync } from 'node:fs';

const DIR = 'C:/Users/geren/.claude/jobs/ba8780a5/tmp/anclajes';

function parseDelimited(texto, sep) {
    const filas = [];
    let campo = '', fila = [], enComillas = false;
    for (let i = 0; i < texto.length; i += 1) {
        const c = texto[i];
        if (enComillas) {
            if (c === '"' && texto[i + 1] === '"') { campo += '"'; i += 1; }
            else if (c === '"') enComillas = false;
            else campo += c;
        } else if (c === '"') enComillas = true;
        else if (c === sep) { fila.push(campo); campo = ''; }
        else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; }
        else if (c !== '\r') campo += c;
    }
    if (campo || fila.length) { fila.push(campo); filas.push(fila); }
    const cab = filas.shift();
    return filas.filter((f) => f.length > 1).map((f) => Object.fromEntries(cab.map((k, i) => [k, f[i]])));
}

const ches = parseDelimited(readFileSync(`${DIR}/ches_la.csv`, 'utf8'), ',')
    .filter((r) => r.country_en === 'Colombia' && r.president !== '1');
const gps = parseDelimited(readFileSync(`${DIR}/gps_party.tab`, 'utf8'), '\t')
    .filter((r) => (r.Country || '').includes('Colombia'));

// Emparejamiento a mano, por nombre. Se declara para que sea auditable.
const PARES = [
    ['PLC', 'PLC', 'Liberal'],
    ['CD', 'PCD', 'Centro Democrático'],
    ['RCP', 'CR', 'Cambio Radical'],
    ['U', 'la U', 'Partido de la U'],
    ['PCC', 'PCC', 'Conservador'],
    ['AV', 'VA', 'Alianza Verde'],
    ['MIRA', 'Mira', 'MIRA'],
    ['PDA', 'PDA', 'Polo Democrático'],
    ['POC', 'OC', 'Opción Ciudadana'],
    ['DEC', 'List of', 'Lista de la Decencia'],
];

// Number('') es 0, no NaN. Sin este guardia los valores AUSENTES del GPS
// entran como ceros y fabrican desacuerdos que no existen: en la primera
// pasada, Opción Ciudadana apareció con 9,0 de diferencia en el eje
// sociocultural porque su casilla estaba vacía.
const num = (v) => {
    if (v === null || v === undefined || String(v).trim() === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

const filas = [];
for (const [abbC, abbG, nombre] of PARES) {
    const c = ches.find((r) => r.party_abb === abbC);
    const g = gps.find((r) => r.Partyabb === abbG);
    if (!c || !g) { console.log(`  ⚠ sin pareja: ${nombre}`); continue; }
    filas.push({
        partido: nombre,
        ches_econ: num(c.lrecon), gps_econ: num(g.V4_Scale),
        ches_soc: num(c.galtan), gps_soc: num(g.V6_Scale),
        ches_gen: num(c.lrgen),
    });
}

const pearson = (xs, ys) => {
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i += 1) { const a = xs[i] - mx, b = ys[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
    return sxy / Math.sqrt(sxx * syy);
};
const rangos = (v) => {
    const orden = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]);
    const r = new Array(v.length);
    for (let i = 0; i < orden.length;) {
        let j = i; while (j + 1 < orden.length && orden[j + 1][0] === orden[i][0]) j += 1;
        const medio = (i + j) / 2 + 1;
        for (let k = i; k <= j; k += 1) r[orden[k][1]] = medio;
        i = j + 1;
    }
    return r;
};
const spearman = (xs, ys) => pearson(rangos(xs), rangos(ys));

function comparar(etiqueta, campoC, campoG) {
    const v = filas.filter((f) => f[campoC] !== null && f[campoG] !== null);
    const xs = v.map((f) => f[campoC]), ys = v.map((f) => f[campoG]);
    console.log(`\n── ${etiqueta}  (n = ${v.length})`);
    console.log(`   Pearson  r = ${pearson(xs, ys).toFixed(3)}`);
    console.log(`   Spearman ρ = ${spearman(xs, ys).toFixed(3)}`);
    const difs = v.map((f) => ({ partido: f.partido, ches: f[campoC], gps: f[campoG], dif: f[campoC] - f[campoG] }))
        .sort((a, b) => Math.abs(b.dif) - Math.abs(a.dif));
    console.log('\n   partido                CHES   GPS    dif');
    for (const d of difs) {
        console.log(`   ${d.partido.padEnd(22)}${d.ches.toFixed(1).padStart(5)}${d.gps.toFixed(1).padStart(7)}${d.dif.toFixed(1).padStart(7)}`);
    }
    const mad = v.reduce((s, f) => s + Math.abs(f[campoC] - f[campoG]), 0) / v.length;
    console.log(`\n   Desviación absoluta media: ${mad.toFixed(2)} puntos sobre una escala de 0-10`);
}

console.log(`\nCHES-LA: ${ches.length} partidos colombianos · GPS: ${gps.length} · emparejados: ${filas.length}`);
comparar('EJE ECONÓMICO — CHES lrecon vs GPS V4', 'ches_econ', 'gps_econ');
comparar('EJE SOCIOCULTURAL — CHES galtan vs GPS V6', 'ches_soc', 'gps_soc');

console.log('\n── ¿COINCIDEN EN EL ORDEN DE IZQUIERDA A DERECHA? (eje económico)\n');
const porChes = [...filas].filter((f) => f.gps_econ !== null).sort((a, b) => a.ches_econ - b.ches_econ);
const porGps = [...porChes].sort((a, b) => a.gps_econ - b.gps_econ);
console.log('   según CHES                    según GPS');
for (let i = 0; i < porChes.length; i += 1) {
    console.log(`   ${(i + 1 + '. ' + porChes[i].partido).padEnd(30)}${i + 1}. ${porGps[i].partido}`);
}
