import { writeFileSync } from 'node:fs';

const DST = 'C:/Users/geren/OneDrive/Documentos/Proyectos antigravity/doblefoco/doblefoco-app/programas';

// Partidos con posición externa en CHES-LA 2020 y/o V-Party 2018.
const ANCLADOS = {
    'PARTIDO CONSERVADOR COLOMBIANO': { ches_lrgen: 8.43, ches_lrecon: 8.43, ches_galtan: 9.29, vparty: 2.36 },
    'PARTIDO LIBERAL COLOMBIANO': { ches_lrgen: 5.93, ches_lrecon: 6.29, ches_galtan: 5.07, vparty: -0.28 },
    'PARTIDO SOCIAL DE UNIDAD NACIONAL  PARTIDO DE LA U': { ches_lrgen: 6.50, ches_lrecon: 6.64, ches_galtan: 6.18, vparty: 0.58 },
    'PARTIDO CENTRO DEMOCRATICO': { ches_lrgen: 9.21, ches_lrecon: 9.07, ches_galtan: 9.43, vparty: 2.68 },
    'PARTIDO CAMBIO RADICAL': { ches_lrgen: 7.64, ches_lrecon: 7.57, ches_galtan: 7.50, vparty: 1.57 },
    'PARTIDO ALIANZA VERDE': { ches_lrgen: 3.86, ches_lrecon: 5.07, ches_galtan: 2.07, vparty: -0.64 },
    'PARTIDO COLOMBIA JUSTA LIBRES': { ches_lrgen: 9.20, ches_lrecon: 7.78, ches_galtan: 9.18, vparty: null },
};

const r = await fetch('https://www.datos.gov.co/resource/h236-q58p.json?$limit=5000', {
    headers: { 'User-Agent': 'DobleFocoBot/1.0 (+https://doblefoco.co/transparencia)' },
});
const filas = await r.json();

const porPartido = {};
for (const f of filas) {
    const p = f.agrupacion_politica;
    if (!ANCLADOS[p]) continue;
    const url = f.progama_de_gobierno?.url;
    if (!url) continue;
    (porPartido[p] ??= []).push({
        departamento: f.departamento,
        elegido: f.nombre_del_elegido,
        url,
    });
}

const indice = {
    descripcion:
        'Programas de gobierno de gobernadores electos en 2019, radicados ante la Registraduría ' +
        'Nacional. Se filtran los de partidos CON posición externa documentada en CHES-LA 2020 ' +
        'y V-Party 2018, que son los que permiten calibrar la escala RILE contra un ancla.',
    fuente: 'https://www.datos.gov.co/resource/h236-q58p.json (datos abiertos del Estado colombiano)',
    procedencia:
        'Los PDF están alojados en wapp.registraduria.gov.co: es la copia RADICADA, no una ' +
        'reproducción de un tercero. Resuelve el aviso de procedencia que quedaba abierto con ' +
        'los programas presidenciales de 2026.',
    advertenciaDeGenero:
        'IMPORTANTE: son programas DEPARTAMENTALES, no manifiestos nacionales. Un programa de ' +
        'gobernación habla de vías terciarias, acueductos y salud local, así que sus proporciones ' +
        'por categoría NO son directamente comparables con las de un programa presidencial. Para ' +
        'la calibración esto puede bastar —lo que se necesita es que el ORDEN de los partidos se ' +
        'conserve— pero hay que comprobarlo, no suponerlo, y declararlo en la metodología.',
    consultadoEl: '2026-08-07',
    partidos: {},
};

for (const [nombre, docs] of Object.entries(porPartido)) {
    indice.partidos[nombre] = { ancla: ANCLADOS[nombre], documentos: docs.length, ejemplos: docs.slice(0, 6) };
}

writeFileSync(`${DST}/indice-programas-anclados.json`, JSON.stringify(indice, null, 2));
for (const [n, d] of Object.entries(indice.partidos)) {
    console.log(`${String(d.documentos).padStart(4)}  ${n}`);
}
