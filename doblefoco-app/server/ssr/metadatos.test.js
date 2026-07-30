// @ts-check
import { describe, it, expect } from 'vitest';
import {
    construirMetadatos,
    describirCobertura,
    escaparHtml,
    esIndexable,
    limpiarMetadatosGenericos,
    montarPagina,
    serializarParaScript,
} from './metadatos.js';

const SITIO = 'https://doblefococo.vercel.app';

const historia = (extra = {}) => ({
    id: 'story_abc123',
    title: 'Cámara aprueba el traslado de la sede',
    publishedAt: '2026-07-29T12:00:00.000Z',
    coverage: { left: 1, center: 5, right: 7 },
    sources: [
        { name: 'El Tiempo', url: 'https://eltiempo.com/x' },
        { name: 'Semana', url: 'https://semana.com/y' },
    ],
    ...extra,
});

describe('escaparHtml', () => {
    it('neutraliza los cinco caracteres que rompen un atributo', () => {
        expect(escaparHtml(`<a href="x" & 'y'>`)).toBe(
            '&lt;a href=&quot;x&quot; &amp; &#39;y&#39;&gt;'
        );
    });

    it('escapa el ampersand ANTES que el resto, sin doble escapado', () => {
        // Si se escapara & al final, &lt; se convertiría en &amp;lt; y el
        // navegador mostraría el texto "&lt;" en vez de "<".
        expect(escaparHtml('<')).toBe('&lt;');
    });

    it('convierte null y undefined en cadena vacía, no en "null"', () => {
        expect(escaparHtml(null)).toBe('');
        expect(escaparHtml(undefined)).toBe('');
    });
});

describe('esIndexable', () => {
    it('una historia de un solo medio NO se pide indexar', () => {
        // Su página es un titular y un enlace: contenido agregado sin valor
        // añadido. Eran 3 178 de 3 463 el 2026-07-29.
        expect(esIndexable(historia({ coverage: { left: 0, center: 1, right: 0 } }))).toBe(false);
    });

    it('con dos medios ya hay comparación, y sí se indexa', () => {
        expect(esIndexable(historia({ coverage: { left: 1, center: 1, right: 0 } }))).toBe(true);
    });

    it('sin cobertura conocida, tampoco', () => {
        expect(esIndexable(historia({ coverage: undefined }))).toBe(false);
        expect(esIndexable(/** @type {any} */ (null))).toBe(false);
    });
});

describe('construirMetadatos', () => {
    it('marca noindex la historia de un solo medio, y solo esa', () => {
        const sola = construirMetadatos(
            historia({ coverage: { left: 0, center: 1, right: 0 } }),
            SITIO
        );
        expect(sola).toContain('<meta name="robots" content="noindex, follow" />');
        // «follow» importa: los enlaces se siguen recorriendo, así que la
        // historia no queda aislada del rastreo si mañana la cubre otro medio.
        expect(sola).not.toContain('content="noindex, nofollow"');

        // La normal no lleva la etiqueta: sin esto, un fallo del umbral dejaría
        // el sitio entero fuera del índice sin que nada avisara.
        expect(construirMetadatos(historia(), SITIO)).not.toContain('noindex');
    });

    it('NO deja escapar un titular con comillas fuera de su atributo', () => {
        // Los titulares vienen de 34 medios ajenos. Una comilla doble es
        // corriente en español; sin escapar, parte el atributo.
        const etiquetas = construirMetadatos(
            historia({ title: 'Petro dijo "no habrá reforma" ante el Congreso' }),
            SITIO
        );

        const og = etiquetas.match(/<meta property="og:title" content="([^"]*)"/);
        expect(og).not.toBeNull();
        // El contenido capturado tiene que ser el titular COMPLETO. Si la
        // comilla hubiera partido el atributo, se cortaría en "Petro dijo ".
        expect(og?.[1]).toContain('no habr');
        expect(og?.[1]).toContain('ante el Congreso');
        expect(etiquetas).not.toMatch(/content="Petro dijo "/);
    });

    it('no permite inyectar una etiqueta desde el titular', () => {
        const etiquetas = construirMetadatos(
            historia({ title: '"><script>alert(1)</script>' }),
            SITIO
        );
        expect(etiquetas).not.toContain('<script>alert(1)</script>');
        expect(etiquetas).toContain('&lt;script&gt;');
    });

    it('usa story.coverage y no recalcula el sesgo por su cuenta', () => {
        // F1-04: un solo lugar donde vive la clasificación. Aquí se comprueba
        // que el reparto sale de coverage aunque las fuentes digan otra cosa.
        const etiquetas = construirMetadatos(
            historia({ coverage: { left: 2, center: 0, right: 0 } }),
            SITIO
        );
        expect(etiquetas).toContain('2 medios cubren este hecho');
        expect(etiquetas).toContain('2 de izquierda, 0 de centro, 0 de derecha');
    });

    it('apunta la canónica al sitio público, nunca a la API', () => {
        const etiquetas = construirMetadatos(historia(), SITIO);
        // La ruta LEGIBLE, que es a la que redirige el servidor con 301. Si la
        // canónica declarara otra dirección se contradirían entre sí y el
        // buscador tendría que elegir por su cuenta.
        expect(etiquetas).toContain(
            `<link rel="canonical" href="${SITIO}/noticia/camara-aprueba-el-traslado-de-la-sede-abc123" />`
        );
        expect(etiquetas).not.toContain('fly.dev');
        expect(etiquetas).not.toContain('story_abc123');
    });

    it('emite JSON-LD válido con las citas a los medios', () => {
        const etiquetas = construirMetadatos(historia(), SITIO);
        const bruto = etiquetas.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
        expect(bruto).not.toBeNull();

        const ld = JSON.parse(String(bruto?.[1]));
        expect(ld['@type']).toBe('NewsArticle');
        expect(ld.headline).toBe(historia().title);
        expect(ld.citation).toHaveLength(2);
        expect(ld.citation[0].url).toBe('https://eltiempo.com/x');
    });

    it('omite article:published_time cuando no hay fecha, en vez de inventarla', () => {
        const etiquetas = construirMetadatos(
            historia({ publishedAt: null, firstSeenAt: null }),
            SITIO
        );
        expect(etiquetas).not.toContain('article:published_time');
    });
});

describe('describirCobertura', () => {
    it('describe la COBERTURA y no resume la noticia', () => {
        // Principio rector: no se produce texto sobre un hecho que no hemos
        // verificado. El reparto entre espectros sí es un dato nuestro.
        const texto = describirCobertura(historia());
        expect(texto).toContain('13 medios cubren este hecho');
        expect(texto).not.toContain(historia().title);
    });

    it('concuerda en singular con un solo medio', () => {
        const texto = describirCobertura(historia({ coverage: { left: 0, center: 1, right: 0 } }));
        expect(texto).toContain('1 medio cubre este hecho');
    });

    it('cae a un texto genérico si no hay cobertura, sin decir "0 medios"', () => {
        const texto = describirCobertura(historia({ coverage: { left: 0, center: 0, right: 0 } }));
        expect(texto).not.toContain('0 medios');
    });
});

describe('serializarParaScript', () => {
    it('impide que un titular cierre la etiqueta <script>', () => {
        const salida = serializarParaScript({ t: 'fin </script> sigue' });
        expect(salida).not.toContain('</script>');
        expect(JSON.parse(salida).t).toBe('fin </script> sigue');
    });
});

describe('limpiarMetadatosGenericos y montarPagina', () => {
    const plantilla = `<!doctype html><html><head>
  <title>DobleFoco.co - Perspectivas</title>
  <meta name="description" content="generica" />
  <meta property="og:title" content="generico" />
  <meta name="twitter:title" content="generico" />
</head><body><div id="root"></div></body></html>`;

    it('retira las etiquetas genéricas de la plantilla', () => {
        const limpia = limpiarMetadatosGenericos(plantilla);
        expect(limpia).not.toContain('generica');
        expect(limpia).not.toContain('generico');
        expect(limpia).not.toContain('<title>');
    });

    it('no deja NINGÚN og:title duplicado en la página final', () => {
        // Con dos og:title cada red social elige por su cuenta: la tarjeta al
        // compartir saldría unas veces con el titular y otras con el texto
        // genérico, sin patrón y sin que nada falle.
        const pagina = montarPagina({
            plantilla,
            html: '<h1>hola</h1>',
            metadatos: construirMetadatos(historia(), SITIO),
            datos: { story: historia() },
        });
        expect(pagina.match(/property="og:title"/g)).toHaveLength(1);
        expect(pagina.match(/name="description"/g)).toHaveLength(1);
        expect(pagina.match(/<title>/g)).toHaveLength(1);
    });

    it('inserta el árbol renderizado dentro de #root y los datos aparte', () => {
        const pagina = montarPagina({
            plantilla,
            html: '<h1>hola</h1>',
            metadatos: '<title>x</title>',
            datos: { story: { id: 'z' } },
        });
        expect(pagina).toContain('<div id="root"><h1>hola</h1></div>');
        expect(pagina).toContain('id="datos-iniciales"');
    });

    it('falla ruidosamente si la plantilla no tiene la forma esperada', () => {
        // Un cambio en index.html que rompa el anclaje debe reventar aquí y no
        // producir en silencio una página sin contenido renderizado.
        expect(() =>
            montarPagina({
                plantilla: '<html><body></body></html>',
                html: '<h1>hola</h1>',
                metadatos: '',
                datos: {},
            })
        ).toThrow(/forma esperada/);
    });
});
