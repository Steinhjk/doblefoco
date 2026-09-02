// @ts-check
import { describe, it, expect } from 'vitest';
import { parsePublishedAt, extractImage, cleanHeadline, elegirTitularReciente, observarPieza } from './ingestDaemon.js';
import { articleId } from '../../shared/clustering.js';

/**
 * La fecha del feed es un dato que declara el medio y que nadie comprueba. Estas
 * pruebas fijan qué se acepta de él, porque de ese valor depende el orden de la
 * portada entera.
 */
describe('parsePublishedAt', () => {
    const AHORA = Date.parse('2026-07-29T23:00:00.000Z');

    it('acepta la fecha del feed cuando es plausible', () => {
        expect(parsePublishedAt({ isoDate: '2026-07-29T22:00:00.000Z' }, AHORA))
            .toBe('2026-07-29T22:00:00.000Z');
    });

    it('prefiere isoDate a pubDate cuando vienen los dos', () => {
        const item = { isoDate: '2026-07-29T22:00:00.000Z', pubDate: 'Wed, 29 Jul 2026 12:00:00 GMT' };
        expect(parsePublishedAt(item, AHORA)).toBe('2026-07-29T22:00:00.000Z');
    });

    it('DESCARTA una fecha en el futuro', () => {
        // El caso real: La Opinión entregó el 2026-07-29 dos artículos fechados
        // a las 09:00 del día siguiente. El feed ordena por published_at DESC, y
        // se quedaron encabezando la portada hasta que el reloj los alcanzara.
        expect(parsePublishedAt({ isoDate: '2026-07-30T09:00:00.000Z' }, AHORA)).toBeNull();
    });

    it('tolera la deriva razonable entre relojes', () => {
        // Diez minutos por delante es un reloj mal puesto, no una publicación
        // programada. Descartarlo perdería fechas buenas sin motivo.
        const diezMinutos = new Date(AHORA + 10 * 60 * 1000).toISOString();
        expect(parsePublishedAt({ isoDate: diezMinutos }, AHORA)).toBe(diezMinutos);
    });

    it('corta pasado el margen de media hora', () => {
        const treintaYUno = new Date(AHORA + 31 * 60 * 1000).toISOString();
        expect(parsePublishedAt({ isoDate: treintaYUno }, AHORA)).toBeNull();
    });

    it('devuelve null sin fecha o con una ilegible', () => {
        expect(parsePublishedAt({}, AHORA)).toBeNull();
        expect(parsePublishedAt({ pubDate: 'el martes pasado' }, AHORA)).toBeNull();
        expect(parsePublishedAt(null, AHORA)).toBeNull();
    });

    it('acepta una fecha vieja: la retención es asunto de otro sitio', () => {
        // Descartar aquí lo antiguo escondería el motivo real por el que un
        // artículo desaparece. De la ventana de 72 h se encarga pruneArticles.
        expect(parsePublishedAt({ isoDate: '2020-01-01T00:00:00.000Z' }, AHORA))
            .toBe('2020-01-01T00:00:00.000Z');
    });
});

/**
 * LA IMAGEN QUE SE ACEPTA DE UN FEED.
 *
 * Estas pruebas existen por lo que había antes: la portada ilustraba cada
 * noticia con una foto de archivo de Unsplash elegida por `hash(titular) % 21`,
 * de modo que «Condenan a Carlos Caicedo a cerca de 10 años de cárcel» salía con
 * la imagen etiquetada «Indicadores Económicos». Ahora la imagen sale del feed
 * del propio medio o no hay imagen, y lo que se acepta del feed queda fijado
 * aquí.
 *
 * La regla del mismo dominio es la que más importa: sin ella, cualquier feed
 * podría hacer que el navegador del lector pidiera una URL a un tercero.
 */
describe('extractImage', () => {
    const LINK = 'https://www.semana.com/nacion/articulo/una-noticia/123/';
    const FOTO = 'https://www.semana.com/resizer/foto.jpg';

    const mediaContent = (attrs) => ({ mediaContent: [{ $: attrs }] });

    it('toma la imagen de media:content', () => {
        expect(extractImage(mediaContent({ url: FOTO, type: 'image/jpeg' }), LINK)).toBe(FOTO);
    });

    it('acepta media:content sin tipo si la extensión es de imagen', () => {
        expect(extractImage(mediaContent({ url: FOTO }), LINK)).toBe(FOTO);
    });

    it('acepta medium="image" aunque no declare el tipo MIME', () => {
        const sinExtension = 'https://www.semana.com/resizer/abc123';
        expect(extractImage(mediaContent({ url: sinExtension, medium: 'image' }), LINK))
            .toBe(sinExtension);
    });

    it('toma la imagen de enclosure, donde los atributos vienen planos', () => {
        const item = { enclosure: { url: FOTO, type: 'image/jpeg' } };
        expect(extractImage(item, LINK)).toBe(FOTO);
    });

    it('RECHAZA una imagen de otro dominio', () => {
        // Es la regla que importa: un feed no puede hacer que el navegador del
        // lector pida algo a un tercero. Un rastreador disfrazado de imagen
        // entraría por aquí.
        const ajena = 'https://rastreador.example.com/pixel.jpg';
        expect(extractImage(mediaContent({ url: ajena, type: 'image/jpeg' }), LINK)).toBeNull();
    });

    it('acepta un subdominio del propio medio', () => {
        const cdn = 'https://cdn.semana.com/foto.jpg';
        expect(extractImage(mediaContent({ url: cdn, type: 'image/jpeg' }), LINK)).toBe(cdn);
    });

    it('RECHAZA http: no cargaría en una página https y degrada la conexión', () => {
        const insegura = 'http://www.semana.com/foto.jpg';
        expect(extractImage(mediaContent({ url: insegura, type: 'image/jpeg' }), LINK)).toBeNull();
    });

    it('RECHAZA un enclosure que no es imagen', () => {
        // Un enclosure puede ser un audio o un PDF.
        const item = { enclosure: { url: 'https://www.semana.com/pod.mp3', type: 'audio/mpeg' } };
        expect(extractImage(item, LINK)).toBeNull();
    });

    it('devuelve null cuando el feed no trae imagen, que es lo más frecuente', () => {
        expect(extractImage({ title: 'algo' }, LINK)).toBeNull();
        expect(extractImage(null, LINK)).toBeNull();
    });

    it('prefiere media:content a media:thumbnail', () => {
        const item = {
            mediaContent: [{ $: { url: FOTO, type: 'image/jpeg' } }],
            mediaThumbnail: [{ $: { url: 'https://www.semana.com/mini.jpg', type: 'image/jpeg' } }],
        };
        expect(extractImage(item, LINK)).toBe(FOTO);
    });

    it('se salta un candidato inválido y sigue con el siguiente', () => {
        const item = {
            mediaContent: [
                { $: { url: 'no-es-una-url', type: 'image/jpeg' } },
                { $: { url: FOTO, type: 'image/jpeg' } },
            ],
        };
        expect(extractImage(item, LINK)).toBe(FOTO);
    });

    it('no revienta con un enlace de artículo inválido', () => {
        expect(extractImage(mediaContent({ url: FOTO, type: 'image/jpeg' }), 'no-es-url')).toBeNull();
    });
});

describe('extractImage con hosts declarados en el registro', () => {
    const LINK_SEMANA = 'https://www.semana.com/nacion/articulo/algo/123/';
    const ARC = 'https://semana-semana-prod.web.arc-cdn.net/resizer/v2/ABC.jpg?auth=x';

    it('acepta la CDN del gestor de contenidos cuando el medio la declara', () => {
        // Medido el 2026-07-30: sin esto se perdían TODAS las fotos de Semana,
        // El País de Cali y BBC Mundo, que son 3 de los 12 feeds con imagen.
        const item = { mediaContent: [{ $: { url: ARC, type: 'image/jpeg' } }] };
        expect(extractImage(item, LINK_SEMANA, ['semana-semana-prod.web.arc-cdn.net'])).toBe(ARC);
    });

    it('la rechaza si el medio NO la declara', () => {
        const item = { mediaContent: [{ $: { url: ARC, type: 'image/jpeg' } }] };
        expect(extractImage(item, LINK_SEMANA)).toBeNull();
        expect(extractImage(item, LINK_SEMANA, [])).toBeNull();
    });

    it('NO acepta otro cliente de la misma CDN: la coincidencia es exacta', () => {
        // Arc Publishing sirve a cientos de medios ajenos a este catálogo. Un
        // comodín *.arc-cdn.net los dejaría entrar todos.
        const ajeno = 'https://otro-medio-prod.web.arc-cdn.net/resizer/v2/XYZ.jpg';
        const item = { mediaContent: [{ $: { url: ajeno, type: 'image/jpeg' } }] };
        expect(extractImage(item, LINK_SEMANA, ['semana-semana-prod.web.arc-cdn.net'])).toBeNull();
    });

    it('un host declarado sigue teniendo que ser https', () => {
        const insegura = 'http://semana-semana-prod.web.arc-cdn.net/resizer/v2/ABC.jpg';
        const item = { mediaContent: [{ $: { url: insegura, type: 'image/jpeg' } }] };
        expect(extractImage(item, LINK_SEMANA, ['semana-semana-prod.web.arc-cdn.net'])).toBeNull();
    });
});

/**
 * El sufijo que añade Google News no es del medio, así que quitarlo devuelve el
 * titular a lo que era. Todo lo demás se deja intacto: la regla del archivo es
 * que el titular es literal.
 */
describe('cleanHeadline', () => {
    it('quita el sufijo con el nombre del medio', () => {
        expect(cleanHeadline('Petro anuncia reforma - Caracol Radio', 'Caracol Radio', 'caracol.com.co'))
            .toBe('Petro anuncia reforma');
    });

    it('quita el sufijo con el DOMINIO, que es como rotula una búsqueda site:', () => {
        // El caso que dejó «Noticias y Radio Online - wradio.com.co» en la base.
        expect(cleanHeadline('Noticias y Radio Online - wradio.com.co', 'W Radio', 'wradio.com.co'))
            .toBe('Noticias y Radio Online');
    });

    it('quita el sufijo aunque el dominio venga con www.', () => {
        expect(cleanHeadline('Algo pasó - www.eltiempo.com', 'El Tiempo', 'eltiempo.com'))
            .toBe('Algo pasó');
    });

    it('NO toca un guion que forma parte del titular', () => {
        // El sufijo se reconoce por coincidir con el medio, no por haber un guion.
        const t = 'Petro - Trump: la reunión que no fue';
        expect(cleanHeadline(t, 'Semana', 'semana.com')).toBe(t);
    });

    it('NO recorta adjetivos ni prefijos: el titular es literal', () => {
        const t = 'URGENTE: escandaloso fallo del tribunal';
        expect(cleanHeadline(t, 'Semana', 'semana.com')).toBe(t);
    });

    it('normaliza los espacios y nada más', () => {
        expect(cleanHeadline('  Dos   espacios  ', 'Semana', 'semana.com')).toBe('Dos espacios');
    });

    it('aguanta entradas vacías', () => {
        expect(cleanHeadline(null, 'Semana', 'semana.com')).toBe('');
        expect(cleanHeadline('Titular', undefined, undefined)).toBe('Titular');
    });
});

describe('extractImage desde el HTML del contenido', () => {
    const LINK = 'https://www.elnuevosiglo.com.co/articulo/algo';
    const FOTO = 'https://www.elnuevosiglo.com.co/sites/default/files/2026-07/foto.jpg';

    it('usa la primera <img> del contenido cuando no hay media:content', () => {
        // Medido el 2026-07-30: de los 21 feeds sin media:content, tres llevan
        // la foto aquí dentro. Leerla no cuesta ninguna petición extra.
        const item = { content: `<p>Texto</p><img src="${FOTO}" alt="">` };
        expect(extractImage(item, LINK)).toBe(FOTO);
    });

    it('prefiere media:content a la <img> del cuerpo', () => {
        // La primera <img> del cuerpo puede ser un logo o un banner;
        // media:content es la foto que el medio designó para la pieza.
        const designada = 'https://www.elnuevosiglo.com.co/designada.jpg';
        const item = {
            mediaContent: [{ $: { url: designada, type: 'image/jpeg' } }],
            content: `<img src="${FOTO}">`,
        };
        expect(extractImage(item, LINK)).toBe(designada);
    });

    it('la <img> del cuerpo pasa por las MISMAS comprobaciones de host', () => {
        const ajena = 'https://rastreador.example.com/pixel.jpg';
        expect(extractImage({ content: `<img src="${ajena}">` }, LINK)).toBeNull();
    });

    it('acepta el CDN del gestor de contenidos si el medio lo declara', () => {
        // La Silla Vacía sirve por Jetpack/WordPress.
        const wp = 'https://i0.wp.com/www.lasillavacia.com/wp-content/uploads/foto.jpg';
        const link = 'https://www.lasillavacia.com/historias/algo/';
        expect(extractImage({ content: `<img src="${wp}">` }, link, ['i0.wp.com'])).toBe(wp);
        expect(extractImage({ content: `<img src="${wp}">` }, link)).toBeNull();
    });

    it('busca en content:encoded, content, summary y description', () => {
        for (const campo of ['contentEncoded', 'content', 'summary', 'description']) {
            expect(extractImage({ [campo]: `<img src="${FOTO}">` }, LINK), campo).toBe(FOTO);
        }
    });

    it('no confunde otra etiqueta con una imagen', () => {
        const item = { content: '<a href="https://www.elnuevosiglo.com.co/x.jpg">enlace</a>' };
        expect(extractImage(item, LINK)).toBeNull();
    });
});

describe('cleanHeadline con otros separadores de marca', () => {
    it('quita el sufijo con barra vertical', () => {
        // Noticias Uno cierra así sus titulares. Es el mismo sufijo de marca que
        // el guion de El Tiempo, y tampoco lo escribió la redacción.
        expect(cleanHeadline(
            'Presupuesto de la salud creció 60% entre 2022 y 2026 | Noticias UNO',
            'Noticias Uno', 'noticiasuno.com'
        )).toBe('Presupuesto de la salud creció 60% entre 2022 y 2026');
    });

    it('quita el sufijo con raya larga', () => {
        expect(cleanHeadline('Algo ocurrió — Semana', 'Semana', 'semana.com'))
            .toBe('Algo ocurrió');
    });

    it('NO recorta por una barra que forma parte del titular', () => {
        // Es el error que la comparación por nombre existe para no cometer:
        // cortar por el separador y no por el medio partiría este titular.
        const t = 'Petro | La entrevista completa';
        expect(cleanHeadline(t, 'Noticias Uno', 'noticiasuno.com')).toBe(t);
    });
});

/**
 * EL TITULAR SE CONGELABA MIENTRAS LA HISTORIA SEGUÍA VIVA.
 *
 * Se elegía el del medio más cercano al centro sea cual sea su hora, así que en
 * un hecho en desarrollo la historia absorbía artículos con datos nuevos y su
 * titular repetía lo que ese medio dijo la primera vez. En el terremoto del
 * Chocó la portada decía «71 muertos» cuando las piezas de esa misma historia ya
 * iban por 111. Medido: el 40 % de las historias multifuente llevaba un titular
 * más de una hora más viejo que su artículo más nuevo.
 */
describe('elegirTitularReciente', () => {
    const art = (headline, bias, horas) => ({
        headline,
        link: `https://ejemplo.co/${horas}`,
        publishedAt: new Date(Date.parse('2026-08-11T18:00:00.000Z') - horas * 3_600_000).toISOString(),
        outlet: { name: `medio-${bias}`, bias, id: `m${bias}` },
    });

    it('prefiere el centro entre los recientes, no el centro de siempre', () => {
        const items = [
            art('Terremoto deja 71 muertos', 0, 20),      // centrista pero viejo
            art('Terremoto deja 111 muertos', 0.3, 0.5),  // reciente, menos centrado
        ];

        expect(elegirTitularReciente(items).headline).toBe('Terremoto deja 111 muertos');
    });

    /**
     * El principio no cambia: entre dos igual de recientes sigue ganando el más
     * cercano al centro. Es lo que evita adoptar el encuadre de un extremo.
     */
    it('entre recientes sigue mandando la cercanía al centro', () => {
        const items = [
            art('Version del extremo', 0.45, 1),
            art('Version del centro', 0.05, 2),
        ];

        expect(elegirTitularReciente(items).headline).toBe('Version del centro');
    });

    it('la ventana se mide contra el artículo más nuevo, no contra el reloj', () => {
        // Los dos son viejos, pero uno está dentro de las 6 h del otro.
        const items = [
            art('Muy viejo y centrado', 0, 200),
            art('Menos viejo', 0.2, 100),
        ];

        expect(elegirTitularReciente(items).headline).toBe('Menos viejo');
    });

    it('con todo dentro de la ventana se comporta como antes', () => {
        const items = [
            art('Del centro', 0.02, 1),
            art('Del extremo', 0.5, 0),
        ];

        expect(elegirTitularReciente(items).headline).toBe('Del centro');
    });

    /**
     * Sin fechas no se puede hablar de reciente. Devuelve null y quien llama cae
     * al ancla: titular como antes es peor que no titular.
     */
    it('devuelve null cuando ninguna fecha sirve', () => {
        expect(elegirTitularReciente([
            { headline: 'Sin fecha', publishedAt: null, outlet: { name: 'x', bias: 0 } },
        ])).toBeNull();
        expect(elegirTitularReciente([])).toBeNull();
        expect(elegirTitularReciente(/** @type {any} */ (null))).toBeNull();
    });

    it('ignora los que no traen fecha pero usa los que sí', () => {
        const items = [
            { headline: 'Sin fecha y centrado', publishedAt: null, outlet: { name: 'a', bias: 0 } },
            art('Con fecha', 0.3, 1),
        ];

        expect(elegirTitularReciente(items).headline).toBe('Con fecha');
    });
});

/**
 * LA CADENCIA SE OBSERVA DEL FEED, NO DE LO QUE INDEXAMOS (tarea 2.1).
 *
 * Una pieza publicada hace diez días nunca entra en `articles`: la poda de 72 h
 * la saca antes. Para un medio lento eso es toda su producción, y es
 * exactamente lo que la observación tiene que ver. Estas pruebas fijan que la
 * observación no depende de la ventana ni del filtro editorial.
 */
describe('observarPieza', () => {
    const AHORA = Date.parse('2026-09-01T12:00:00.000Z');
    const feed = { mediaId: 'razon-publica' };

    it('observa una pieza de hace diez días, que articles no vería nunca', () => {
        const obs = observarPieza(feed, { isoDate: '2026-08-22T09:00:00.000Z' }, 'https://razonpublica.com/nota', 'Titular', AHORA);
        expect(obs.sourceId).toBe('razon-publica');
        expect(obs.publicadaEl).toBe('2026-08-22T09:00:00.000Z');
        expect(obs.descartada).toBeNull();
    });

    it('usa el mismo id que articles.id, para poder cruzarlos mientras la pieza viva', () => {
        const link = 'https://razonpublica.com/nota';
        expect(observarPieza(feed, {}, link, 'Titular', AHORA).piezaId).toBe(articleId(link, 'Titular'));
    });

    it('sin fecha del medio guarda null, no «ahora»: la ausencia se declara', () => {
        expect(observarPieza(feed, {}, 'https://razonpublica.com/nota', 'Titular', AHORA).publicadaEl).toBeNull();
    });

    it('una fecha en el futuro tampoco se guarda: es la misma regla que parsePublishedAt', () => {
        const obs = observarPieza(feed, { isoDate: '2026-09-03T09:00:00.000Z' }, 'https://razonpublica.com/nota', 'Titular', AHORA);
        expect(obs.publicadaEl).toBeNull();
    });
});
