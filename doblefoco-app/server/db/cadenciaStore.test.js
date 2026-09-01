// @ts-check
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearMemoriaDeCadencia } from './cadenciaStore.js';

/**
 * EL ARCHIVO DE CADENCIA SOLO ACUMULA, Y ESTAS PRUEBAS FIJAN CÓMO.
 *
 * Nada lo lee todavía (tarea 2.1: grabar, sin usar). Lo que sí puede fallar
 * hoy es la parte silenciosa: que un ciclo reintente las mismas quinientas
 * filas, que una tabla nueva no entre en la copia de seguridad —pasó con el
 * archivo de conducta el 2026-08-18— o que la serie del ciclo pierda la
 * columna que dice si el archivo sigue creciendo.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = (ruta) => readFileSync(resolve(AQUI, ruta), 'utf8');

const pieza = (sourceId, piezaId, extra = {}) => ({
    sourceId,
    piezaId,
    publicadaEl: null,
    descartada: null,
    ...extra,
});

describe('crearMemoriaDeCadencia', () => {
    it('la primera vez deja pasar todo; la segunda, nada', () => {
        const memoria = crearMemoriaDeCadencia();
        const lote = [pieza('semana', 'art_1'), pieza('semana', 'art_2')];

        expect(memoria.seleccionarNuevas(lote)).toHaveLength(2);
        // El feed reexpone las mismas piezas en el ciclo siguiente.
        expect(memoria.seleccionarNuevas(lote)).toHaveLength(0);
    });

    it('la misma pieza en dos medios son dos observaciones', () => {
        // Un enlace compartido (una nota de agencia republicada) tiene el mismo
        // hash; la cadencia es de cada medio, así que se guarda por medio.
        const memoria = crearMemoriaDeCadencia();
        const lote = [pieza('semana', 'art_1'), pieza('cambio', 'art_1')];

        expect(memoria.seleccionarNuevas(lote)).toHaveLength(2);
    });

    it('desduplica dentro del propio lote, que es lo que rompería el unnest', () => {
        const memoria = crearMemoriaDeCadencia();
        const lote = [pieza('semana', 'art_1'), pieza('semana', 'art_1')];

        expect(memoria.seleccionarNuevas(lote)).toHaveLength(1);
    });

    it('ignora observaciones sin medio o sin pieza en vez de guardar basura', () => {
        const memoria = crearMemoriaDeCadencia();
        const lote = [pieza('', 'art_1'), pieza('semana', ''), pieza('semana', 'art_2')];

        expect(memoria.seleccionarNuevas(lote).map((p) => p.piezaId)).toEqual(['art_2']);
    });

    it('al llenarse se vacía y vuelve a dejar pasar: reintentar es gratis, crecer sin tope no', () => {
        const memoria = crearMemoriaDeCadencia(2);
        memoria.seleccionarNuevas([pieza('a', '1'), pieza('a', '2')]);
        expect(memoria.tamano).toBe(2);

        // Tope alcanzado: el lote siguiente entra entero aunque repita.
        expect(memoria.seleccionarNuevas([pieza('a', '1'), pieza('a', '3')])).toHaveLength(2);
        expect(memoria.tamano).toBe(2);
    });
});

describe('las tablas de cadencia existen en todos los sitios donde tienen que existir', () => {
    const schema = leer('schema.sql');
    const backup = leer('../../scripts/backup.mjs');
    const restore = leer('../../scripts/restore.mjs');

    it('schema.sql crea las dos tablas y la columna de la serie', () => {
        expect(schema).toMatch(/CREATE TABLE IF NOT EXISTS cadencia_piezas/);
        expect(schema).toMatch(/CREATE TABLE IF NOT EXISTS cadencia_huecos/);
        expect(schema).toMatch(/ALTER TABLE ingest_runs ADD COLUMN IF NOT EXISTS cadencia_nuevas/);
    });

    it('las dos tablas se crean ANTES del bloque que cierra la API de Supabase', () => {
        // Ese bloque recorre el catálogo para activar RLS. Una tabla creada
        // después queda abierta hasta la siguiente migración.
        const cierre = schema.indexOf('Cerrar la API pública de Supabase');
        expect(cierre).toBeGreaterThan(0);
        expect(schema.indexOf('CREATE TABLE IF NOT EXISTS cadencia_piezas')).toBeLessThan(cierre);
        expect(schema.indexOf('CREATE TABLE IF NOT EXISTS cadencia_huecos')).toBeLessThan(cierre);
    });

    it('la copia de seguridad las respalda: son irreemplazables, como la conducta', () => {
        expect(backup).toMatch(/nombre: 'cadencia_piezas'/);
        expect(backup).toMatch(/nombre: 'cadencia_huecos'/);
    });

    it('y la restauración sabe devolverlas, con la misma clave que las desduplica', () => {
        expect(restore).toMatch(/tabla: 'cadencia_piezas', conflicto: '\(source_id, pieza_id\)'/);
        expect(restore).toMatch(/tabla: 'cadencia_huecos', conflicto: '\(source_id, at\)'/);
    });

    it('ingest_runs.cadencia_nuevas se escribe en la base y en el JSONL', () => {
        const contentStore = leer('contentStore.js');
        const metricsStore = leer('../services/metricsStore.js');
        expect(contentStore).toMatch(/cadencia_nuevas\)/);
        expect(contentStore).toMatch(/row\.cadenciaNuevas \?\? null/);
        expect(metricsStore).toMatch(/cadenciaNuevas: record\.cadenciaNuevas \?\? null/);
    });
});
