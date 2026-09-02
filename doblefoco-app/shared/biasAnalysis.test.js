/**
 * Pruebas de la medición de sesgo y cobertura — tarea F2-09.
 *
 * Este módulo es la afirmación más discutible que hace el sitio: decide si una
 * historia tiene un punto ciego, es decir, si acusa a media prensa colombiana
 * de estar omitiendo un hecho. Una regresión aquí no rompe una pantalla:
 * publica una acusación falsa sobre organizaciones reales.
 *
 * Por eso las pruebas no persiguen cobertura de líneas. Persiguen las reglas
 * que costaron caras de aprender, cada una atada a su tarea del ROADMAP.
 */

import { describe, it, expect } from 'vitest';
import {
    ramaNoMedible,
    analyzeCoverage,
    averageFactuality,
    catalogoDelModelo,
    classifySpectrum,
    describirOrientacionMedia,
    probabilidadDeAusenciaEnCatalogo,
    probabilidadDeComoMuchoEnCatalogo,
    BLINDSPOT_MIN_SOURCES,
    SOLO_EJE_MIN_SOURCES,
    SPECTRUM_THRESHOLD,
    UMBRAL_SORPRESA,
} from './biasAnalysis.js';

/** Atajo: construye fuentes con los sesgos dados. */
const sources = (...biases) => biases.map((bias, i) => ({ name: `Medio ${i}`, bias }));

describe('classifySpectrum', () => {
    it('clasifica los tres bloques', () => {
        expect(classifySpectrum(-0.7)).toBe('left');
        expect(classifySpectrum(0)).toBe('center');
        expect(classifySpectrum(0.7)).toBe('right');
    });

    it('trata el umbral como inclusivo hacia los extremos', () => {
        // Exactamente en la frontera cuenta como extremo, no como centro. Es
        // una decisión, no un accidente: si cambia, cambia la clasificación de
        // todos los medios que están justo en ±0.2 y con ella la cobertura de
        // sus historias.
        expect(classifySpectrum(-SPECTRUM_THRESHOLD)).toBe('left');
        expect(classifySpectrum(SPECTRUM_THRESHOLD)).toBe('right');
        expect(classifySpectrum(-SPECTRUM_THRESHOLD + 0.01)).toBe('center');
        expect(classifySpectrum(SPECTRUM_THRESHOLD - 0.01)).toBe('center');
    });

    it('trata como centro cualquier valor que no sea un número finito', () => {
        // El catálogo no debería producir estos valores, pero un feed nuevo o
        // un medio sin clasificar sí. Caer al centro es la degradación
        // correcta: no atribuye una inclinación que nadie ha establecido.
        for (const value of [null, undefined, NaN, Infinity, 'izquierda', {}]) {
            expect(classifySpectrum(value)).toBe('center');
        }
    });
});

/**
 * LOS UMBRALES YA NO SE PASAN: SALEN DEL CATÁLOGO (2026-08-25).
 *
 * Hasta hoy estas pruebas inventaban un corpus equilibrado —un tercio cada
 * espectro— y comprobaban `(1−q)^n`. Esa fórmula se retiró: la hipótesis nula
 * declarada habla de MEDIOS que eligen, y `q` medía APARICIONES, que mezcla la
 * elección editorial con la cadencia de publicación y con nuestra ventana de
 * 72 h. El detalle está en `probabilidadDeAusenciaEnCatalogo`.
 *
 * Ahora la nula es hipergeométrica sobre el catálogo, así que los umbrales son
 * hechos del catálogo y no parámetros de la prueba. Se leen aquí en vez de
 * escribirlos a mano: si mañana entran cuatro medios de izquierda, estas
 * pruebas siguen diciendo la verdad en vez de fijar un número caducado.
 */
const CAT = catalogoDelModelo();

/** Medios que tienen que cubrir una historia para que la ausencia sorprenda. */
function minimoPara(espectro) {
    for (let n = 2; n <= CAT.total; n += 1) {
        if (probabilidadDeAusenciaEnCatalogo(CAT[espectro], CAT.total, n) < UMBRAL_SORPRESA) return n;
    }
    return Infinity;
}

const MIN_IZQ = minimoPara('left');
const MIN_DER = minimoPara('right');

/** `n` fuentes de un solo signo, para llevar una historia hasta el umbral. */
const seguidas = (signo, n) =>
    sources(...Array.from({ length: n }, (_, i) => signo * (0.3 + (i % 5) * 0.05)));

describe('analyzeCoverage — el umbral de F1-03', () => {
    it(`no afirma un punto ciego por debajo de ${BLINDSPOT_MIN_SOURCES} fuentes`, () => {
        // Con 3 fuentes cualquier proporción es ruido: una sola mueve la
        // cobertura de un espectro 33 puntos.
        const result = analyzeCoverage(sources(-0.6, -0.5, 0));

        expect(result.total).toBe(3);
        expect(result.insufficientCoverage).toBe(true);
        expect(result.blindspot).toBeNull();
    });

    it(`${BLINDSPOT_MIN_SOURCES} fuentes ya no bastan: la ausencia tiene que sorprender`, () => {
        // Cuatro medios: tres de izquierda y uno sin línea marcada. Cumple todas
        // las condiciones ANTERIORES —cuatro fuentes, la derecha en cero, el
        // lado que cubre con más de una voz— y aun así NO se afirma nada.
        //
        // Con los tres espectros a un tercio cada uno, que falte uno entre
        // cuatro medios ocurre por azar el 20 % de las veces: (2/3)⁴ = 0,198.
        // Llamar «punto ciego» a algo que pasa una de cada cinco veces es acusar
        // a alguien de omitir cuando lo que hubo fue una moneda.
        const result = analyzeCoverage(sources(-0.6, -0.5, -0.4, 0));

        expect(result.total).toBe(4);
        expect(result.insufficientCoverage).toBe(false);
        expect(result.blindspot).toBeNull();
    });

    it('lo afirma cuando hay medios suficientes para que la ausencia sea rara', () => {
        // Justo en el umbral de la derecha, sea cual sea hoy: con ese número de
        // medios cubriendo y ninguno de derecha, su ausencia baja del 5 % bajo
        // la nula de catálogo.
        const result = analyzeCoverage(seguidas(-1, MIN_DER));

        expect(result.counts.right).toBe(0);
        expect(result.blindspot).not.toBeNull();
        expect(result.blindspot.spectrum).toBe('right');
    });

    it('UNO MENOS no basta, que es lo que hace del umbral un umbral', () => {
        // La prueba de arriba sin esta no vale nada: demostraría que dispara,
        // no que discrimina.
        //
        // Se comprueba que NO sea el punto ciego de la derecha, y no que no
        // haya ninguno. Con todas las fuentes en un extremo salta la tercera
        // rama —«solo medios de izquierda y derecha»—, que es correcta y dice
        // otra cosa: nadie de orientación mixta cubrió el hecho. Afirmar
        // `blindspot === null` aquí sería fijar como verdad un efecto
        // colateral de cómo se construye la muestra.
        const result = analyzeCoverage(seguidas(-1, MIN_DER - 1));

        expect(result.counts.right).toBe(0);
        expect(result.blindspot?.spectrum).not.toBe('right');
    });

    it('NO lo afirma si el lado que cubre es UN SOLO medio', () => {
        // Es la condición que sostiene el umbral de 4, y la que Jose formuló
        // como «2 de izquierda y 2 de derecha». Un medio de izquierda y tres
        // sin línea marcada: la derecha está en cero, pero lo que hay no es
        // «la derecha omite esto», es «un periódico decidió cubrirlo».
        const result = analyzeCoverage(sources(-0.6, 0, 0.1, -0.05));

        expect(result.total).toBe(4);
        expect(result.insufficientCoverage).toBe(false);
        expect(result.counts.left).toBe(1);
        expect(result.blindspot).toBeNull();
    });

    it('no inventa un punto ciego cuando faltan LOS DOS extremos', () => {
        // Seis medios de centro. Ni la izquierda ni la derecha cubren el hecho.
        // Sería falso decir que uno de los dos lo está omitiendo: no hay
        // asimetría, hay un hecho que solo interesó al centro.
        const result = analyzeCoverage(sources(0, 0.1, -0.1, 0, 0.05, -0.05));

        expect(result.insufficientCoverage).toBe(false);
        expect(result.blindspot).toBeNull();
    });

    it('la rama de la izquierda está declarada NO MEDIBLE: aunque la nula sorprenda, no es punto ciego', () => {
        // Hasta el 2026-09-02 esta prueba exigía lo contrario: que con MIN_IZQ
        // medios y ninguno de izquierda saltara «Punto ciego de la izquierda».
        // La aritmética lo permite —MIN_IZQ cabe en el catálogo— y la decisión
        // de Jose (opción D) es que aun así no se afirme: la izquierda falta en
        // el 84 % de las historias evaluables, y una señal que dispara sobre la
        // norma no es un hallazgo. Lo que sí se publica es el HECHO, con su
        // etiqueta de hecho y nunca la de veredicto.
        const result = analyzeCoverage(seguidas(1, MIN_IZQ));

        expect(MIN_IZQ).toBeLessThanOrEqual(CAT.total);
        expect(ramaNoMedible('left')).toBe(true);
        // Con todos los medios en la derecha salta la tercera rama —«solo
        // medios del eje»—, que es medible y dice otra cosa. Lo que aquí se
        // fija es que el veredicto NUNCA sea el de la izquierda.
        expect(result.blindspot?.spectrum).not.toBe('left');
        expect(result.ausencia?.spectrum).toBe('left');
        expect(result.ausencia.label).toBe('Sin medios de izquierda');
        expect(result.ausencia.label).not.toContain('Punto ciego');
    });

    it('la derecha sigue siendo medible, y por eso el modelo no es simétrico a propósito', () => {
        expect(ramaNoMedible('right')).toBe(false);
        expect(ramaNoMedible('center')).toBe(false);
        expect(analyzeCoverage(seguidas(-1, MIN_DER)).blindspot?.spectrum).toBe('right');
    });
});

/**
 * EL CORPUS REAL, QUE ES LO QUE DECIDE SI EL PRODUCTO MIENTE.
 *
 * Medido el 2026-08-08 sobre 4 807 historias: la izquierda aparece en el 3,1 %
 * de ellas, el centro en el 58,5 % y la derecha en el 42,9 %. Con ese reparto,
 * el sitio llevaba declarados 30 puntos ciegos de izquierda y CERO de derecha.
 *
 * Estas pruebas fijan la corrección para que no se pueda deshacer sin darse
 * cuenta: son la diferencia entre señalar un silencio y publicar una acusación
 * que solo refleja cuánto publica cada quien.
 */
describe('analyzeCoverage — el punto ciego contra el desequilibrio real', () => {
    it('la izquierda hace falta MÁS que la derecha, porque hay menos', () => {
        // La asimetría no desaparece con la nula nueva: sigue habiendo menos
        // medios de izquierda que de derecha, así que su ausencia sorprende
        // más tarde. Lo que cambia es que ya no es INALCANZABLE.
        expect(MIN_IZQ).toBeGreaterThan(MIN_DER);
        expect(MIN_IZQ).toBeLessThanOrEqual(CAT.total);
    });

    it('con pocos medios no acusa a nadie, ni a un lado ni al otro', () => {
        // Ocho medios sin izquierda: por debajo de su umbral. Antes esto
        // producía un punto ciego de izquierda con la fórmula equilibrada, y
        // era el defecto que arrancó todo.
        const result = analyzeCoverage(sources(0.6, 0.5, 0.4, 0.3, 0.35, 0.45, 0, 0));

        expect(result.counts.left).toBe(0);
        expect(result.blindspot).toBeNull();
    });

    it('SÍ puede acusar a la derecha, y desde menos medios que a la izquierda', () => {
        // Que el aviso pueda apuntar a los dos lados es lo que lo convierte en
        // una medición en vez de en una constante.
        const result = analyzeCoverage(seguidas(-1, MIN_DER));

        expect(result.counts.right).toBe(0);
        expect(result.blindspot?.spectrum).toBe('right');
    });

    it('señala cuando SOLO cubrieron medios con línea marcada', () => {
        // Siete medios de derecha y ninguno sin línea. Es el caso real que la
        // motivó: «Uribe llegó a Cali para la investidura», 7 medios, 0 sin
        // línea marcada.
        //
        // No afirma que nadie omitiera nada: describe que el hecho solo interesó
        // a medios con posición declarada.
        const result = analyzeCoverage(sources(0.6, 0.5, 0.4, 0.3, 0.35, 0.45, 0.55));

        expect(result.counts.center).toBe(0);
        expect(result.blindspot?.spectrum).toBe('center');
        expect(result.blindspot.label).toBe('Solo medios de izquierda y derecha');
    });

    it(`no la señala por debajo de ${SOLO_EJE_MIN_SOURCES} medios`, () => {
        // Cuatro medios de derecha: cumple la prueba estadística —(1−0,585)⁴ =
        // 0,029— y aun así no se afirma. Con cuatro, la señal disparaba en
        // noticias de fútbol donde la composición no dice nada del encuadre.
        //
        // OJO: no se excluye el deporte, se exige más evidencia. Estos mismos
        // cuatro medios con dos más habrían disparado la señal.
        const result = analyzeCoverage(sources(0.6, 0.5, 0.4, 0.3));

        expect(result.counts.center).toBe(0);
        expect(result.blindspot).toBeNull();
    });

    it('la constante de 4 sigue siendo APARTE de la de «solo eje»', () => {
        // BLINDSPOT_MIN_SOURCES vale 4 por decisión del 2026-07-30 y no se
        // toca. Subir aquella para arreglar la señal de «solo eje» habría
        // deshecho esa decisión de paso y en silencio.
        expect(BLINDSPOT_MIN_SOURCES).toBe(4);
        expect(SOLO_EJE_MIN_SOURCES).toBeGreaterThan(BLINDSPOT_MIN_SOURCES);
    });

    it('YA NO depende de que quien llama pase las tasas, y eso es el arreglo', () => {
        // ESTA PRUEBA AFIRMA LO CONTRARIO QUE LA QUE SUSTITUYE, a propósito.
        //
        // Antes, llamar sin tasas base apagaba el punto ciego en silencio, y se
        // llamaba «fallar cerrado». Sonaba prudente y costó dos incidentes: la
        // rehidratación y el cliente llamaban sin tasas, así que la función
        // insignia del producto no existía por ahí y nadie se enteró.
        //
        // La nula de catálogo no necesita que nadie pase nada. Un dato que hay
        // que acordarse de pasar es un dato que algún día no se pasa.
        const result = analyzeCoverage(seguidas(-1, MIN_DER));

        expect(result.blindspot?.spectrum).toBe('right');
    });

    it('el veredicto viaja con su frecuencia cuando se le da la medida', () => {
        // Es lo que impide que un punto ciego mienta: si ese espectro falta en
        // la mitad de las historias evaluables, no es un hallazgo y el propio
        // veredicto lo dice.
        const medida = { left: 0.78, center: 0.02, right: 0.6, evaluables: 118 };
        const result = analyzeCoverage(seguidas(-1, MIN_DER), medida);

        expect(result.blindspot.contexto.frecuencia).toBe(0.6);
        expect(result.blindspot.contexto.evaluables).toBe(118);
        expect(result.blindspot.contexto.esLoNormal).toBe(true);
    });

    it('sin medida no inventa una frecuencia: la calla', () => {
        const result = analyzeCoverage(seguidas(-1, MIN_DER));
        expect(result.blindspot.contexto).toBeNull();
    });
});

describe('analyzeCoverage — separar polarización de media (F1-02)', () => {
    it('no cancela los extremos al medir polarización', () => {
        // ESTE es el fallo que motivó F1-02. La versión anterior resumía la
        // historia en la media de los sesgos: seis medios en polos opuestos
        // daban media ~0, la historia se etiquetaba "Centro" y el filtro
        // "Derecha" devolvía cero resultados sobre 200 noticias.
        const polarizada = analyzeCoverage(sources(-0.8, -0.7, -0.75, 0.8, 0.7, 0.75));

        expect(Math.abs(polarizada.meanBias)).toBeLessThan(0.05);
        expect(polarizada.isHighlyPolarized).toBe(true);
        expect(polarizada.polarization).toBeGreaterThan(0.7);
    });

    it('distingue el consenso real de la polarización', () => {
        // Seis medios de centro también dan media ~0. La diferencia con el caso
        // anterior no está en la media —es la misma— sino en la dispersión.
        const consenso = analyzeCoverage(sources(0, 0.05, -0.05, 0.1, -0.1, 0));

        expect(Math.abs(consenso.meanBias)).toBeLessThan(0.05);
        expect(consenso.isHighlyPolarized).toBe(false);
    });
});

describe('analyzeCoverage — porcentajes', () => {
    it('reparte exactamente 100 puntos, sin sobrantes por redondeo', () => {
        // Tres fuentes reparten 33,33% cada una. Redondear por separado da 99;
        // calcular la tercera como 100−a−b llegó a dar negativos.
        const tercios = analyzeCoverage(sources(-0.5, 0, 0.5));
        const suma = tercios.percentages.left + tercios.percentages.center + tercios.percentages.right;

        expect(suma).toBe(100);
    });

    it('mantiene la suma en repartos irregulares', () => {
        for (const total of [3, 6, 7, 9, 11, 13]) {
            const biases = Array.from({ length: total }, (_, i) => (i % 3 === 0 ? -0.5 : i % 3 === 1 ? 0 : 0.5));
            const { percentages } = analyzeCoverage(sources(...biases));
            const suma = percentages.left + percentages.center + percentages.right;

            expect(suma, `con ${total} fuentes`).toBe(100);
        }
    });

    it('no divide por cero sin fuentes', () => {
        const vacio = analyzeCoverage([]);

        expect(vacio.total).toBe(0);
        expect(vacio.percentages).toEqual({ left: 0, center: 0, right: 0 });
        expect(vacio.dominantSpectrum).toBeNull();
        expect(vacio.blindspot).toBeNull();
        expect(vacio.insufficientCoverage).toBe(true);
    });
});

describe('analyzeCoverage — espectro dominante', () => {
    it('no declara dominante un empate', () => {
        // Empate entre izquierda y derecha: no hay encuadre predominante, y
        // decir que sí lo hay sería elegir uno por desempate arbitrario.
        const empate = analyzeCoverage(sources(-0.5, -0.6, 0.5, 0.6));

        expect(empate.dominantSpectrum).toBeNull();
    });

    it('declara dominante solo al que supera estrictamente a los demás', () => {
        expect(analyzeCoverage(sources(-0.5, -0.6, -0.7, 0.5)).dominantSpectrum).toBe('left');
    });
});

describe('averageFactuality — la constante 0.88 no vuelve (F0-09)', () => {
    it('devuelve null cuando ninguna fuente aporta el dato', () => {
        // El motor anterior fijaba 0.88 para TODAS las historias y la interfaz
        // lo mostraba como "Factualidad IA: 88%": una constante presentada como
        // medición. Ante la ausencia de dato, la respuesta honesta es null.
        expect(averageFactuality([])).toBeNull();
        expect(averageFactuality([{ name: 'Medio' }])).toBeNull();
        expect(averageFactuality([{ factuality: 0 }])).toBeNull();
        expect(averageFactuality([{ factuality: 'alta' }])).toBeNull();
    });

    it('promedia solo las fuentes que sí lo traen', () => {
        expect(averageFactuality([{ factuality: 0.9 }, { factuality: 0.7 }])).toBe(0.8);
        expect(averageFactuality([{ factuality: 0.9 }, { name: 'sin dato' }])).toBe(0.9);
    });
});

describe('describirOrientacionMedia', () => {
    it('cubre la escala sin dejar huecos', () => {
        expect(describirOrientacionMedia(-0.8)).toBe('Inclinación izquierda');
        expect(describirOrientacionMedia(-0.2)).toBe('Izquierda moderada');
        expect(describirOrientacionMedia(0)).toBe('Orientación mixta');
        expect(describirOrientacionMedia(0.2)).toBe('Derecha moderada');
        expect(describirOrientacionMedia(0.8)).toBe('Inclinación derecha');
    });
});

/**
 * PUNTOS DE ÉNFASIS — pedidos por Jose el 2026-07-30: «no solo mostrar ausencia
 * sino exceso o insistencia en divulgación».
 *
 * Lo que estas pruebas fijan es que énfasis y punto ciego son señales DISTINTAS
 * y no dos nombres de lo mismo. Si acabaran coincidiendo siempre, la señal nueva
 * no aportaría nada y valdría más retirarla que mantenerla.
 */
describe('analyzeCoverage — puntos de énfasis', () => {
    it('marca énfasis cuando un lado concentra la cobertura', () => {
        // Cuatro de derecha y uno sin línea: el 80 % en un solo lado.
        const result = analyzeCoverage(sources(0.5, 0.4, 0.6, 0.3, 0));

        expect(result.enfasis).not.toBeNull();
        expect(result.enfasis.spectrum).toBe('right');
        expect(result.enfasis.description).toContain('80 %');
    });

    it('HAY énfasis sin que haya punto ciego, y ese es el caso que faltaba', () => {
        // Siete medios: cinco de derecha, uno de izquierda, uno sin línea. La
        // izquierda NO está ausente —cubre el 14 %—, así que no hay punto ciego
        // por poco; pero la cobertura está claramente concentrada.
        const result = analyzeCoverage(sources(0.5, 0.4, 0.6, 0.3, 0.7, -0.5, 0));

        expect(result.counts).toEqual({ left: 1, center: 1, right: 5 });
        expect(result.enfasis?.spectrum).toBe('right');
    });

    it('no marca énfasis cuando la cobertura está repartida', () => {
        const result = analyzeCoverage(sources(-0.5, -0.4, 0, 0.4, 0.5, 0.1));
        expect(result.enfasis).toBeNull();
    });

    it('no marca énfasis del lado «sin línea marcada»', () => {
        // Que la mayoría de medios que cubren un hecho no tengan línea marcada
        // es lo normal en este catálogo y no dice nada sobre el hecho.
        // Anunciarlo sería ruido con formato de hallazgo.
        const result = analyzeCoverage(sources(0, 0.1, -0.1, 0.05, -0.05, 0));
        expect(result.enfasis).toBeNull();
    });

    it('no marca énfasis por debajo del umbral de fuentes', () => {
        const result = analyzeCoverage(sources(0.5, 0.4, 0.6));
        expect(result.insufficientCoverage).toBe(true);
        expect(result.enfasis).toBeNull();
    });

    it('un lado que copa TODO es a la vez énfasis y punto ciego', () => {
        // Las dos señales pueden coincidir, y cuando lo hacen es correcto que
        // las dos se disparen: son afirmaciones distintas sobre el mismo hecho.
        //
        // Hacen falta tantos medios como pida el umbral de la izquierda, y no
        // cuatro, desde que el punto ciego exige que la ausencia sorprenda. El
        // énfasis NO cambió: con cuatro de un solo lado ya se dispara. Que una
        // señal necesite más pruebas que la otra es correcto —el énfasis
        // describe lo que hay, el punto ciego acusa de lo que falta— y es
        // justamente por qué conviene no confundirlas.
        // Con la izquierda declarada no medible (2026-09-02), el caso que lo
        // demuestra es el espejo: medios de izquierda copándolo todo, y la
        // derecha —rama medible— ausente.
        const result = analyzeCoverage(seguidas(-1, MIN_DER));

        expect(result.enfasis?.spectrum).toBe('left');
        expect(result.blindspot?.spectrum).toBe('right');
    });

    it('la ausencia se mide por un número fijo de medios, no por el 15 % de n (2026-09-02)', () => {
        // Con 20 medios el 15 % permitía hasta tres presentes; el número fijo
        // permite uno. Dos medios de izquierda entre veinte NO es ausencia.
        // Dieciséis de derecha, dos de orientación mixta y dos de izquierda:
        // ningún lado queda con «como mucho uno», así que no hay ausencia.
        const veinte = sources(...Array.from({ length: 16 }, (_, i) => 0.3 + (i % 5) * 0.05), 0, 0.1, -0.5, -0.6);
        expect(veinte.length).toBe(20);
        expect(analyzeCoverage(veinte).ausencia).toBeNull();

        // Y uno entre siete sí lo es: «Apenas 1 medio de izquierda», igual que
        // con el 15 %. El cambio solo mueve las historias grandes.
        const siete = sources(0.3, 0.35, 0.4, 0.45, 0.5, 0, -0.5);
        expect(analyzeCoverage(siete).ausencia?.label).toBe('Apenas 1 medio de izquierda');
    });
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LA RAMA COMPARA UNA PROPORCIÓN, Y LA ETIQUETA PROMETÍA UN CERO (2026-08-25)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * El 2026-08-25 el sitio publicó «Punto ciego de la izquierda» sobre la muerte
 * de Dolly Parton: quince medios la cubrieron y **uno era de izquierda**. Debajo
 * del titular, su propia frase decía «Solo 1 de izquierda lo reportan».
 *
 * No fue una regresión: el defecto estaba desde el principio y era inalcanzable.
 * La rama exige `leftRatio <= 15 %`, y con 4, 5 o 6 medios un solo medio ya pasa
 * del 15 % — así que la proporción y el cero coincidían. **Dejan de coincidir a
 * partir de 7**, y el corpus llegó a ese tamaño esa semana.
 *
 * Y había un segundo fallo debajo del primero, peor: **la prueba no probaba la
 * afirmación**. Se decía «apenas uno» y se calculaba la probabilidad de
 * «ninguno», que es un suceso distinto y más raro. Con la prueba puesta sobre lo
 * que se afirma, aquella historia no sorprende ni de lejos.
 *
 * Estas pruebas fijan las dos señales que decidió Jose y la nula que les toca.
 */
describe('las dos señales: sin medios, y apenas unos pocos', () => {
    /** Una historia de `n` medios donde `izq` de ellos son de izquierda. */
    const historia = (n, izq) =>
        sources(
            ...Array.from({ length: izq }, () => -0.5),
            ...Array.from({ length: Math.ceil((n - izq) / 2) }, () => 0.4),
            ...Array.from({ length: Math.floor((n - izq) / 2) }, () => 0)
        );

    it('con cero medios del espectro dice «Sin medios de izquierda»', () => {
        const c = analyzeCoverage(historia(MIN_IZQ, 0));
        expect(c.counts.left).toBe(0);
        expect(c.ausencia?.etiquetaAusencia).toBe('Sin medios de izquierda');
        expect(c.ausencia?.description).toContain('Ninguno de izquierda lo reportó.');
    });

    it('con un medio del espectro dice «Apenas 1 medio», no «Sin medios»', () => {
        // Quince medios y uno de izquierda: la forma exacta de Dolly Parton.
        const c = analyzeCoverage(historia(15, 1));
        expect(c.counts.left).toBe(1);
        expect(c.ausencia?.etiquetaAusencia).toBe('Apenas 1 medio de izquierda');
        expect(c.ausencia?.label).toBe('Apenas 1 medio de izquierda');
        // La concordancia importa: se leía «Solo 1 de izquierda lo reportan».
        expect(c.ausencia?.description).toContain('Solo 1 de izquierda lo reporta.');
    });

    it('NO llama punto ciego a una historia que ese espectro sí cubrió', () => {
        // Es la afirmación que se publicó mal. Con n grande, la ausencia total
        // sí sorprendería —está por debajo del umbral— y aun así aquí no debe
        // haber punto ciego, porque no hay ausencia.
        const c = analyzeCoverage(historia(15, 1));
        expect(probabilidadDeAusenciaEnCatalogo(CAT.left, CAT.total, 15)).toBeLessThan(UMBRAL_SORPRESA);
        expect(c.blindspot).toBeNull();
    });

    it('la ausencia de verdad se nombra como hecho, nunca como punto ciego: la rama no es medible (2026-09-02)', () => {
        // Hasta el 2026-09-02 aquí se exigía «Punto ciego de la izquierda». Con
        // quince medios y ninguno de izquierda la nula sí sorprende; la
        // decisión (opción D) es que aun así no se afirme. Ver RAMAS_NO_MEDIBLES.
        const c = analyzeCoverage(historia(15, 0));
        expect(c.blindspot).toBeNull();
        expect(c.ausencia?.label).toBe('Sin medios de izquierda');
    });

    it('la sorpresa se mide sobre lo que se afirma, no sobre «ninguno»', () => {
        // Si «apenas uno» se juzgara con la nula de «ninguno», con 15 medios
        // saldría 0,034 —por debajo del 5 %— y volvería el fallo. La nula que
        // corresponde da 0,18.
        const conNinguno = probabilidadDeAusenciaEnCatalogo(CAT.left, CAT.total, 15);
        const conUno = probabilidadDeComoMuchoEnCatalogo(CAT.left, CAT.total, 15, 1);
        expect(conNinguno).toBeLessThan(UMBRAL_SORPRESA);
        expect(conUno).toBeGreaterThan(UMBRAL_SORPRESA);
    });
});

describe('probabilidadDeComoMuchoEnCatalogo', () => {
    /** Referencia por fuerza bruta, en logaritmos, para no depender del código. */
    const logC = (arriba, abajo) => {
        if (abajo < 0 || abajo > arriba) return -Infinity;
        let acc = 0;
        for (let i = 0; i < abajo; i += 1) acc += Math.log(arriba - i) - Math.log(i + 1);
        return acc;
    };
    const referencia = (K, N, n, k) => {
        let s = 0;
        for (let j = 0; j <= Math.min(k, K, n); j += 1) {
            s += Math.exp(logC(K, j) + logC(N - K, n - j) - logC(N, n));
        }
        return Math.min(s, 1);
    };

    it('coincide con la referencia en todo el rango que usa el modelo', () => {
        for (const [K, N] of [[13, 72], [18, 72], [41, 72], [2, 10], [1, 3], [40, 41]]) {
            for (let n = 1; n <= Math.min(N, 30); n += 1) {
                for (let k = 0; k <= Math.min(4, n); k += 1) {
                    expect(probabilidadDeComoMuchoEnCatalogo(K, N, n, k))
                        .toBeCloseTo(referencia(K, N, n, k), 10);
                }
            }
        }
    });

    it('acierta cuando P(0) es cero, que es donde se rompía la versión anterior', () => {
        // Con 5 del espectro en 20 y 16 medios cubriendo, es IMPOSIBLE que no
        // salga ninguno del espectro: solo hay 15 fuera. La implementación por
        // recurrencia arrancaba en P(0) = 0 y se quedaba en cero para siempre,
        // devolviendo 0 donde la respuesta es 0,72.
        expect(probabilidadDeAusenciaEnCatalogo(5, 20, 16)).toBe(0);
        expect(probabilidadDeComoMuchoEnCatalogo(5, 20, 16, 4)).toBeCloseTo(0.71827, 4);
    });

    it('con k = 0 es exactamente la nula de ausencia', () => {
        for (let n = 2; n <= 30; n += 1) {
            expect(probabilidadDeComoMuchoEnCatalogo(CAT.left, CAT.total, n, 0))
                .toBe(probabilidadDeAusenciaEnCatalogo(CAT.left, CAT.total, n));
        }
    });
});
