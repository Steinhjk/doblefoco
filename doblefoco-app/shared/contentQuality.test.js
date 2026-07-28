/**
 * Pruebas del filtro de formatos — tareas F1-14 y F2-09.
 *
 * Aquí los dos errores no cuestan lo mismo, y por eso hay más pruebas de lo que
 * NO debe filtrarse que de lo que sí.
 *
 * Dejar pasar un sorteo ensucia el feed: molesto, visible, fácil de corregir.
 * Descartar una noticia real la borra del sitio sin que nadie se entere de que
 * existió — no aparece en ninguna pantalla, no genera error, no deja rastro
 * salvo un contador. Un filtro editorial que se equivoca hacia dentro es
 * censura accidental, y este proyecto no puede permitírsela.
 */

import { describe, it, expect } from 'vitest';
import { assessArticle, summarizeFiltering, QUALITY_RULES } from './contentQuality.js';

const filtra = (headline) => assessArticle({ headline });

describe('lo que SÍ debe descartarse', () => {
    it('resultados de sorteos y loterías', () => {
        const titulares = [
            'Resultados del sorteo de La Caribeña Día del lunes 27 de julio',
            'Baloto: números ganadores del sorteo de anoche',
            'Resultado del Chance Astro Sol de hoy',
            'Lotería de Boyacá: resultado del sorteo',
            'Sinuano Noche: número ganador del 27 de julio',
        ];

        for (const titular of titulares) {
            expect(filtra(titular).indexable, titular).toBe(false);
        }
    });

    it('horóscopos', () => {
        expect(filtra('Horóscopo de hoy: predicciones para tu signo').indexable).toBe(false);
        expect(filtra('Los signos del zodiaco con mejor suerte esta semana').indexable).toBe(false);
    });

    it('cotizaciones del día en bruto', () => {
        expect(filtra('Precio del dólar hoy en Colombia').indexable).toBe(false);
        expect(filtra('TRM hoy: así cerró la divisa').indexable).toBe(false);
        // Caso real del corpus que la primera versión NO capturaba, porque
        // decía el día de la semana en vez de "hoy".
        expect(filtra('Precio del dólar en casas de cambio para el martes, 28 de julio de 2026').indexable).toBe(false);
    });

    it('portadas, boletines y programas completos', () => {
        expect(filtra('Portada 27 de julio del 2026').indexable).toBe(false);
        expect(filtra('Últimas noticias | 28 julio 2026 - Tarde').indexable).toBe(false);
        expect(filtra('27 de julio de 2026 - Voz Populi, programa completo').indexable).toBe(false);
        expect(filtra('Noticias Caracol En Vivo: Últimas noticias de Colombia y el Mundo hoy').indexable).toBe(false);
    });

    it('partes meteorológicos', () => {
        expect(filtra('Clima hoy en Bogotá: pronóstico por localidades').indexable).toBe(false);
    });

    it('retransmisiones sin pieza cerrada', () => {
        expect(filtra('Elecciones minuto a minuto: siga aquí los resultados').indexable).toBe(false);
    });

    it('marcadores y programación deportiva en bruto', () => {
        expect(filtra('Resultados de la fecha 5 del fútbol colombiano').indexable).toBe(false);
        expect(filtra('Alineaciones confirmadas para el clásico').indexable).toBe(false);
        expect(filtra('Tabla de posiciones tras la jornada').indexable).toBe(false);
    });

    it('titulares vacíos', () => {
        expect(filtra('').indexable).toBe(false);
        expect(filtra(null).indexable).toBe(false);
        expect(assessArticle({}).indexable).toBe(false);
    });

    it('ignora tildes y mayúsculas', () => {
        expect(filtra('HORÓSCOPO DE HOY').indexable).toBe(false);
        expect(filtra('Loteria de Medellin: resultado del sorteo').indexable).toBe(false);
    });
});

describe('lo que NO debe descartarse — el error caro', () => {
    it('no toca noticias políticas, judiciales ni económicas', () => {
        const titulares = [
            'Corte Constitucional tumba la reforma pensional del gobierno Petro',
            'Petro se reúne con el presidente de Brasil en Brasilia',
            'Fiscalía imputa cargos a exdirector de la UNGRD',
            'El desempleo bajó al 9,1% en junio, según el DANE',
            'Rescatan a 12 mineros atrapados en Antioquia',
            'Paro de transportadores completa su tercer día en el Magdalena Medio',
        ];

        for (const titular of titulares) {
            expect(filtra(titular).indexable, titular).toBe(true);
        }
    });

    it('no borra noticias por contener "últimas noticias" o una fecha (falso positivo real)', () => {
        // La versión amplia de la regla `indice` capturaba este titular real
        // del corpus por contener "últimas noticias" más adelante. Es una
        // noticia sobre un terremoto: borrarla no habría dejado ningún rastro
        // visible. Por eso los patrones van anclados al inicio.
        expect(filtra('Terremoto en Japón | Víctimas, daños y edificios colapsados tras el fuerte sismo').indexable).toBe(true);
        expect(filtra('Las últimas noticias sobre el paro de transportadores en el Magdalena Medio').indexable).toBe(true);
        expect(filtra('El 7 de agosto de 2026 será la posesión presidencial en Cali').indexable).toBe(true);
    });

    it('deja pasar el ANÁLISIS de mercado, no solo el dato', () => {
        // "Precio del dólar hoy" es un dato idéntico en todos los medios.
        // "Por qué se disparó el dólar" es un encuadre, y encuadres opuestos
        // sobre lo mismo es exactamente el producto.
        expect(filtra('Por qué se disparó el dólar tras el anuncio del Banco de la República').indexable).toBe(true);
        expect(filtra('El dólar y la reforma tributaria: qué dicen los analistas').indexable).toBe(true);
    });

    it('deja pasar el periodismo deportivo con encuadre', () => {
        expect(filtra('La crisis del Deportivo Cali: tres directivos renuncian').indexable).toBe(true);
        expect(filtra('Nairo Quintana anuncia su retiro del ciclismo profesional').indexable).toBe(true);
        expect(filtra('Selección Colombia venció a Uruguay en el Metropolitano').indexable).toBe(true);
    });

    it('no descarta noticias que contienen el nombre de una lotería (falso positivo real)', () => {
        // Este caso lo produjo el filtro sobre datos reales: "El Dorado" es una
        // lotería, pero también el aeropuerto de Bogotá y el nombre de medio
        // país. La primera versión del patrón borró una noticia de obras
        // públicas, que es exactamente el error que no podemos permitirnos
        // porque no deja rastro visible.
        expect(filtra('En Montería iniciaron las obras de rehabilitación del CDI El Dorado').indexable).toBe(true);
        expect(filtra('Retrasos en el aeropuerto El Dorado por la niebla').indexable).toBe(true);
        expect(filtra('La Fantástica gira de la Filarmónica por el Caribe').indexable).toBe(true);

        // Pero con contexto de sorteo sí se descarta.
        expect(filtra('Resultado del sorteo de El Dorado Mañana').indexable).toBe(false);
        expect(filtra('La Caribeña Día: número ganador de hoy').indexable).toBe(false);
    });

    it('no confunde astronomía con astrología ni deja que "chance" cace dentro de otra palabra', () => {
        expect(filtra('Hallan un nuevo astro en el cinturón de Kuiper').indexable).toBe(true);
        expect(filtra('El Gobierno anuncia cambios en el sistema de salud').indexable).toBe(true);
    });

    it('no descarta una noticia sobre el negocio de las loterías', () => {
        // Aquí sí hay encuadre: la corrupción en una lotería es un hecho con
        // versiones enfrentadas. El filtro apunta al resultado del sorteo, no
        // a la palabra "lotería".
        expect(filtra('Contraloría investiga contratos de la Lotería del Meta').indexable).toBe(true);
        expect(filtra('Escándalo por el manejo de recursos del chance en Antioquia').indexable).toBe(true);
    });

    it('no descarta noticias sobre el clima como fenómeno', () => {
        expect(filtra('La Niña dejará lluvias por encima del promedio, advierte el Ideam').indexable).toBe(true);
        expect(filtra('Emergencia por inundaciones en La Mojana').indexable).toBe(true);
    });
});

describe('trazabilidad', () => {
    it('cada descarte dice por qué', () => {
        const verdict = filtra('Resultados del sorteo de La Caribeña');
        expect(verdict.ruleId).toBe('sorteo');
        expect(verdict.reason).toBeTruthy();
    });

    it('todas las reglas tienen identificador y motivo únicos', () => {
        const ids = QUALITY_RULES.map((r) => r.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const rule of QUALITY_RULES) {
            expect(rule.reason, rule.id).toBeTruthy();
            expect(rule.patterns.length, rule.id).toBeGreaterThan(0);
        }
    });

    it('resume el lote por motivo, que es lo que permite vigilar el filtro', () => {
        const resumen = summarizeFiltering([
            { headline: 'Horóscopo de hoy' },
            { headline: 'Resultados del sorteo de Baloto' },
            { headline: 'Corte tumba la reforma pensional' },
        ]);

        expect(resumen.total).toBe(3);
        expect(resumen.filtered).toBe(2);
        expect(resumen.byRule).toEqual({ horoscopo: 1, sorteo: 1 });
    });
});
