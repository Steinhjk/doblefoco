// @ts-check
import { describe, it, expect } from 'vitest';
import { detectarDepartamento, DEPARTAMENTOS, AMBIGUOS } from './geografia.js';

describe('detectarDepartamento', () => {
    it('etiqueta por ciudad, que es la señal fuerte', () => {
        expect(detectarDepartamento('Capturan a alias El Costeño en Cúcuta').departamento)
            .toBe('Norte de Santander');
        expect(detectarDepartamento('Doble homicidio en Buenaventura').departamento)
            .toBe('Valle del Cauca');
        expect(detectarDepartamento('Nuevo escándalo de corrupción en Quibdó').departamento)
            .toBe('Chocó');
    });

    it('etiqueta por nombre de departamento cuando no es ambiguo', () => {
        expect(detectarDepartamento('Alerta por deslizamientos en Boyacá').departamento).toBe('Boyacá');
        expect(detectarDepartamento('Erradicación forzada en el Catatumbo').departamento)
            .toBe('Norte de Santander');
    });

    /**
     * LA PARTE QUE IMPORTA: los topónimos trampa.
     *
     * Etiquetar mal manda un hecho al departamento de otro, y el lector que
     * filtra por su región recibe algo ajeno y deja de fiarse del filtro entero.
     * Por eso ante la duda NO se etiqueta.
     */
    it('NO etiqueta con nombres ambiguos', () => {
        // Bolívar es sobre todo el apellido del Libertador.
        expect(detectarDepartamento('Robaron la espada de Bolívar del museo').departamento).toBeNull();
        // Córdoba es municipio de tres departamentos, y apellido.
        expect(detectarDepartamento('Declara el exsenador Córdoba ante la Corte').departamento).toBeNull();
    });

    it('los ambiguos están declarados con su motivo, no simplemente ausentes', () => {
        expect(Object.keys(AMBIGUOS).length).toBeGreaterThan(0);
        for (const motivo of Object.values(AMBIGUOS)) {
            expect(motivo.length).toBeGreaterThan(20);
        }
    });

    it('gana el topónimo MÁS ESPECÍFICO, no el que esté antes en la tabla', () => {
        // «Cartagena del Chairá» está en Caquetá y contiene «cartagena», que
        // está en Bolívar. Recorriendo la tabla por orden, un hecho del Caquetá
        // acababa etiquetado en el Caribe.
        const r = detectarDepartamento('Combates en Cartagena del Chairá dejan dos muertos');
        expect(r.departamento).toBe('Caquetá');
        expect(r.termino).toBe('cartagena del chairá');
    });

    it('no confunde una palabra dentro de otra', () => {
        // «Metadatos» contiene «meta»; «Caucasia» contiene «cauca».
        expect(detectarDepartamento('Nuevos metadatos revelan el fraude').departamento).toBeNull();
        expect(detectarDepartamento('Polémica por el caso Caucasia').departamento).toBeNull();
    });

    it('devuelve null sin titular, en vez de adivinar', () => {
        for (const v of [null, undefined, '', '   ']) {
            expect(detectarDepartamento(v).departamento).toBeNull();
        }
    });

    it('una noticia nacional no recibe departamento', () => {
        expect(detectarDepartamento('El Congreso aprueba la reforma pensional').departamento).toBeNull();
        expect(detectarDepartamento('Petro anuncia cambios en su gabinete').departamento).toBeNull();
    });

    it('dice POR QUÉ etiquetó, para poder auditarlo', () => {
        const r = detectarDepartamento('Incautan droga en el puerto de Cartagena');
        expect(r).toEqual({ departamento: 'Bolívar', senal: 'ciudad', termino: 'cartagena' });
    });
});

describe('DEPARTAMENTOS', () => {
    it('están los 33: 32 departamentos y Bogotá', () => {
        expect(DEPARTAMENTOS).toHaveLength(33);
        expect(DEPARTAMENTOS).toContain('Bogotá D.C.');
        expect(DEPARTAMENTOS).toContain('Vaupés');
    });
});
