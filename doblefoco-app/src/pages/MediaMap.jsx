import { useMemo, useState, useId, useEffect } from 'react';
import { fetchPanorama, isApiConfigured } from '../services/apiClient';
import {
    ExternalLink, Table2, ScatterChart, Info,
    Building2, Sprout, Users, Landmark, Globe, Bot, FileSearch, Mail,
    Search, X,
} from 'lucide-react';
import { MEDIA_REGISTRY, SPECTRUM_BANDS, getBand, REDACCIONES, esRedaccionAutomatizada } from '../../shared/mediaRegistry';
import PanoramaMediatico from '../components/PanoramaMediatico';
import ReportePropiedad from '../components/ReportePropiedad';
import { classifySpectrum, SPECTRUM_LABEL } from '../../shared/biasAnalysis';
import {
    OWNER_TYPES, CONTROL_GROUPS, getOwnership, hasDocumentedOwnership, getOwnerBadge,
    ALCANCES, alcanceDe, ausenciaDeclarada, conAusenciaDeclarada,
} from '../../shared/mediaOwnership';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../lib/contacto';
import {
    FUENTE_AUDIENCIA, audienciaDe, alcanceMaximo, sinAudienciaMedida,
    prioridadDe, AMPLIACION_POR_VOLUMEN, TAMANO_TRAMO,
} from '../../shared/audiencia';
import MediaLogo from '../components/MediaLogo';
import { getMediaByName } from '../data/mediaLogos';
import './MediaMap.css';

/**
 * MAPA MEDIÁTICO — dispersión orientación × factualidad.
 *
 * Decisiones de visualización
 * ---------------------------
 * · El color codifica SOLO los tres bloques (izquierda / centro / derecha),
 *   no las cinco bandas. Con cinco pasos el validador de paleta rechaza el
 *   resultado: los vecinos quedan por debajo del umbral de distinción incluso
 *   con visión de color normal. La banda fina ya la lleva la posición en X,
 *   que es la codificación primaria; el color es redundante con ella, y esa
 *   redundancia es justamente lo que hace legible el gráfico sin depender del
 *   color.
 * · Paleta validada contra ambas superficies (#202226 oscuro, #ffffff claro)
 *   con el script del sistema de diseño. Único aviso: el gris del centro queda
 *   bajo el piso de croma, que es lo que se espera del punto neutro de una
 *   escala divergente.
 * · Toda la información existe también como tabla. No es un extra de
 *   accesibilidad: es la forma correcta de leer 40 valores exactos.
 *
 * Sobre el eje Y
 * --------------
 * Factualidad es el historial de rigor del MEDIO, no de la noticia que el
 * lector tenga delante. El gráfico lo repite porque es el malentendido más
 * probable de toda la página.
 */

const WIDTH = 720;
const HEIGHT = 460;
const PAD = { top: 28, right: 24, bottom: 52, left: 62 };

const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

/** Rango del eje Y. Arranca en 0.7 porque ningún medio del catálogo baja de ahí. */
const Y_MIN = 0.7;
const Y_MAX = 1.0;

const xScale = (bias) => PAD.left + ((bias + 1) / 2) * PLOT_W;
const yScale = (factuality) =>
    PAD.top + PLOT_H - ((factuality - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;

const SPECTRUM_FILL = {
    left: 'var(--map-left)',
    center: 'var(--map-center)',
    right: 'var(--map-right)',
};

/*
 * Aquí vivía una COPIA de SPECTRUM_LABEL. Se importa la de biasAnalysis
 * (2026-08-08): dos listas de etiquetas para el mismo concepto son dos listas
 * que se separan, y esta pantalla es justo donde se notaría menos, porque la
 * copia local seguiría pintando lo de siempre mientras el resto del sitio dice
 * otra cosa.
 */

const fmtBias = (bias) => `${bias >= 0 ? '+' : '−'}${Math.abs(bias).toFixed(2)}`;

/**
 * `null` es «no medida», y se dice. Antes esto devolvía «NaN%» en cuanto
 * llegaba un medio sin factualidad, que es peor que no decir nada: parece una
 * avería del sitio en vez de un hueco del dato.
 */
const fmtPct = (value) => (typeof value === 'number' ? `${Math.round(value * 100)}%` : 'sin medir');

/** ¿Se puede colocar este medio en el eje vertical? */
const tieneFactualidad = (medio) => typeof medio?.factuality === 'number';

/**
 * Separa puntos que caerían encima. Con 40 medios en un rango estrecho de
 * factualidad, varios coinciden en el mismo píxel y desaparecen unos bajo
 * otros: un medio invisible es un medio que el lector cree que no existe.
 */
function spread(media) {
    const placed = [];

    return media.map((item) => {
        const x = xScale(item.bias);
        const y = yScale(item.factuality);

        let dy = 0;
        while (placed.some((p) => Math.abs(p.x - x) < 13 && Math.abs(p.y - (y + dy)) < 13)) {
            dy = dy > 0 ? -dy : -dy + 11;
            if (Math.abs(dy) > 44) break;
        }

        placed.push({ x, y: y + dy });
        return { ...item, x, y: y + dy, nudged: dy !== 0 };
    });
}

/**
 * ESTA PÁGINA ES SOLO COLOMBIANA, Y YA NO ES UN INTERRUPTOR (2026-08-07).
 *
 * Había una casilla «Solo medios colombianos», activada por omisión, que podía
 * apagarse para añadir Euronews, DW, France 24, El País de España, Reuters, la
 * NYT y el resto. Se retira por decisión de Jose: lo que este mapa describe es
 * la concentración de la propiedad EN COLOMBIA, y mezclar en el mismo gráfico a
 * la BBC con El Tiempo no hace más completo el retrato, lo desdibuja —los
 * dueños de un medio francés no compiten por el espacio mediático colombiano ni
 * pesan en lo que un lector de Bogotá tiene a mano—.
 *
 * Los medios internacionales SIGUEN en el catálogo y siguen aportando cobertura;
 * lo que dejan de hacer es contar como parte del mapa de propiedad. No es
 * retirar a nadie (ver el criterio de no silenciar medios): es que la pregunta
 * de esta página tiene un sujeto, y el sujeto es Colombia.
 */
/**
 * El nombre del icono vive en `mediaOwnership.js`, junto al tipo; aquí solo se
 * resuelve al componente. Así no hay dos listas de iconos que mantener.
 */
const ICONOS = { Building2, Sprout, Users, Landmark, Globe };

/**
 * Distintivo de control: a quién responde la sala de redacción.
 *
 * `enfasis` resalta los dos extremos que un lector pregunta —grupo económico e
 * independiente—. Los otros tres se muestran igual, en tono discreto: un diario
 * regional de propiedad familiar no es ninguna de las dos cosas y forzarlo a un
 * bando sería afirmar lo que su ficha no dice.
 *
 * Sin ficha verificada NO se pinta distintivo, se dice «sin documentar». Un
 * medio del que no se ha comprobado nada no es independiente por defecto.
 */
const Distintivo = ({ mediaId }) => {
    const b = getOwnerBadge(mediaId);
    if (!b) {
        /*
          * DOS AUSENCIAS DISTINTAS, Y NO SE PUEDEN PINTAR IGUAL. «Nadie lo ha
          * mirado» y «se buscó el 11 de agosto en tres sitios y no consta» son
          * afirmaciones muy diferentes sobre nuestro propio trabajo, y la
          * segunda es la que le dice al lector que el hueco no es pereza.
          */
        const ausencia = ausenciaDeclarada(mediaId);
        if (ausencia) {
            return (
                <span
                    className="duenio-badge duenio-noconsta"
                    title={`Se buscó el ${ausencia.consultadoEl} en ${ausencia.buscadoEn.length} sitio(s) y no consta quién lo controla. Abra la ficha para ver dónde se buscó.`}
                >
                    <FileSearch size={13} aria-hidden="true" />
                    no consta
                </span>
            );
        }
        return <span className="duenio-badge duenio-sin" title="Propiedad no verificada todavía">sin documentar</span>;
    }
    const Icono = ICONOS[b.icono];
    return (
        <span
            className={`duenio-badge duenio-${b.tipo}${b.enfasis ? ' duenio-enfasis' : ''}`}
            title={`${b.label}. ${b.explica}`}
        >
            {Icono && <Icono size={13} aria-hidden="true" />}
            {b.corto}
        </span>
    );
};

/**
 * QUIÉN ESCRIBE. Va al lado del distintivo de propiedad porque responde a la
 * misma pregunta —de dónde viene esto— y porque el lector que mira quién es el
 * dueño es el mismo que querría saber si hay una redacción detrás.
 */
const DistintivoRedaccion = ({ medio }) => {
    if (!esRedaccionAutomatizada(medio)) return null;
    const r = REDACCIONES.automatizada;
    return (
        <span className="redaccion-badge" title={r.explica}>
            <Bot size={13} aria-hidden="true" />
            {r.etiqueta}
        </span>
    );
};

/**
 * MARCA DE FICHA PRIORITARIA — y sobre todo, CON QUÉ CERTEZA.
 *
 * Las veinte fichas del tramo no se ganaron el sitio de la misma manera: trece
 * por audiencia medida en una encuesta ajena, siete por el volumen que nosotros
 * mismos contamos. Enseñarlas con la misma marca sugeriría que sabemos de las
 * siete lo que sabemos de las trece, y no es así.
 *
 * Por eso hay dos: la sólida para lo medido y la discontinua para lo estimado,
 * el mismo signo que ya usa la ausencia de propiedad. Un lector que solo mire
 * las formas ya distingue lo comprobado de lo aproximado.
 */
const MarcaPrioritaria = ({ mediaId }) => {
    const p = prioridadDe(mediaId);
    if (!p) return null;

    const medida = p.certeza === 'medida';
    return (
        <span
            className={`prioridad-marca ${medida ? 'prioridad-medida' : 'prioridad-estimada'}`}
            title={
                medida
                    ? `Ficha prioritaria n.º ${p.puesto} de ${TAMANO_TRAMO}. Audiencia medida: ${p.cifra} ${p.unidad} (${FUENTE_AUDIENCIA.nombre}).`
                    : `Ficha prioritaria n.º ${p.puesto} de ${TAMANO_TRAMO}, por VOLUMEN y no por audiencia: ${p.cifra} ${p.unidad}, medidas el ${AMPLIACION_POR_VOLUMEN.medidoEl}. Nadie ha medido públicamente cuánta gente lo lee.`
            }
        >
            {p.puesto}
        </span>
    );
};

const ES_COLOMBIANO = (medio) => medio.country === 'CO';
const MEDIOS_COLOMBIANOS = MEDIA_REGISTRY.filter(ES_COLOMBIANO);

/** Cuántos hay de cada alcance. Se calcula una vez: el catálogo no cambia. */
const CUANTOS_POR_ALCANCE = MEDIOS_COLOMBIANOS.reduce((cuenta, medio) => {
    const alcance = alcanceDe(medio);
    return { ...cuenta, [alcance]: (cuenta[alcance] ?? 0) + 1 };
}, /** @type {Record<string, number>} */ ({}));

/**
 * Con qué alcances arranca la página.
 *
 * LOS REGIONALES EMPIEZAN APAGADOS, y conviene entender por qué antes de
 * encenderlos «por completitud». El catálogo va de 10 medios regionales a uno
 * por departamento: encendidos por omisión serían la mitad de los puntos, y lo
 * que esta página existe para enseñar —que tres dueños concentran la mitad de
 * lo publicado— se leería peor con el doble de puntos que no participan de esa
 * concentración.
 *
 * Están a un clic y con su ficha entera. No es silenciarlos: es que la pregunta
 * de esta página tiene un sujeto, igual que cuando se sacaron del mapa los
 * medios internacionales.
 */
const ALCANCES_POR_OMISION = ['nacional', 'independiente'];

/**
 * Minúsculas y sin acentos, para buscar. Vive fuera del componente porque es
 * pura: dentro se recreaba en cada render y arrastraba consigo la memoización
 * de la tabla.
 */
const normalizarTexto = (s) =>
    (s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const MediaMap = () => {
    const [view, setView] = useState('mapa');
    const [alcances, setAlcances] = useState(ALCANCES_POR_OMISION);
    const [selectedId, setSelectedId] = useState(null);
    const [conteos, setConteos] = useState(null);
    const [ventanaHoras, setVentanaHoras] = useState(72);
    const [busqueda, setBusqueda] = useState('');
    const titleId = useId();

    const busquedaNorm = normalizarTexto(busqueda.trim());

    /**
     * Coincidencia por nombre, grupo o dominio. Se busca sobre el texto
     * normalizado para que «voragine» encuentre a Vorágine: quien busca un medio
     * rara vez escribe los acentos.
     */
    const coincideMedio = (m) =>
        !busquedaNorm ||
        normalizarTexto(m.name).includes(busquedaNorm) ||
        normalizarTexto(m.group || '').includes(busquedaNorm) ||
        normalizarTexto(m.domain || '').includes(busquedaNorm);

    /**
     * ESTAR EN EL CATÁLOGO NO ES LO MISMO QUE APORTAR COBERTURA.
     *
     * El mapa presentaba a todos los medios por igual, y no lo son: medido el
     * 2026-08-07, varios llevan días sin una sola pieza en la ventana —Vorágine
     * publica una cada 74,7 h y Noticias Uno es un noticiero de fin de semana—.
     * Enseñarlos junto a los que publican cientos de notas sugiere una
     * comparación que no está ocurriendo.
     *
     * (Aquí se citaba también a W Radio «porque no tiene RSS propio». Sí lo
     * tiene: apareció el 2026-08-08 en la ruta de Arc que nadie había probado.
     * Su bajo volumen es real, pero la causa que se daba era falsa.)
     *
     * No se retiran: su ficha de propiedad es contenido valioso por sí misma y
     * el criterio del proyecto es no silenciar a nadie. Lo que cambia es que se
     * dice cuáles están aportando y cuáles no.
     */
    useEffect(() => {
        if (!isApiConfigured) return undefined;
        let vivo = true;

        fetchPanorama().then((r) => {
            if (!vivo || !r.ok) return;
            setConteos(r.medios);
            setVentanaHoras(r.retentionHours ?? 72);
        });

        return () => { vivo = false; };
    }, []);

    /** id del medio → artículos en la ventana. `null` mientras no se sepa. */
    const aportePorMedio = useMemo(() => {
        if (!conteos?.length) return null;
        return new Map(conteos.map((c) => [c.sourceId, c.articulos ?? 0]));
    }, [conteos]);

    /**
     * Los medios que se están mirando. El desplazamiento anticolisión se
     * calcula DESPUÉS de filtrar, no antes: si se calculara sobre el catálogo
     * entero, apagar los regionales dejaría huecos donde estaban y los puntos
     * que quedan seguirían apartados de vecinos que ya no se ven.
     */
    const media = useMemo(
        () =>
            MEDIOS_COLOMBIANOS
                .filter((medio) => alcances.includes(alcanceDe(medio)))
                .sort((a, b) => a.bias - b.bias),
        [alcances]
    );

    /**
     * SIN SILENCIAR AL LINTER, y sin memoizar tampoco.
     *
     * Esto venía envuelto en `useMemo` con la comprobación de dependencias
     * apagada por una directiva. Funcionaba, pero al fusionarlo con el resto de
     * la página el compilador de React dejó de aceptarlo: la función de
     * coincidencia es un cierre nuevo en cada render y la memoización no se
     * podía preservar.
     *
     * Filtrar setenta y seis elementos no cuesta nada, así que la memoización
     * manual no compraba nada y sí costaba una directiva puesta para siempre.
     * Se quita: el compilador memoiza solo si le compensa.
     */
    const mediosTabla = media.filter(coincideMedio);

    /**
     * Los que SE PUEDEN DIBUJAR. Un medio sin factualidad medida no tiene
     * altura en este gráfico: colocarlo exigiría inventarle una, y ponerlo en
     * el suelo o en la media diría algo que no sabemos.
     *
     * Siguen en la tabla, con «sin medir» en su columna. Es la misma regla de
     * siempre: el hueco se declara, no se rellena.
     */
    const puntos = useMemo(() => spread(media.filter(tieneFactualidad)), [media]);
    const sinFactualidad = media.length - puntos.length;

    /** Los que se están viendo y cuya propiedad no se ha podido establecer. */
    const sinPropiedad = useMemo(() => conAusenciaDeclarada(media), [media]);

    /** Los que se están viendo y no tienen audiencia medida por nadie. */
    const sinMedicion = useMemo(() => sinAudienciaMedida(media), [media]);

    /**
     * Cuántas de las que se ven llevan firma.
     *
     * Se cuenta en vivo y no se escribe en la frase: el aviso de la cabecera
     * decía «ninguna ha pasado por revisión formal» y dejó de ser cierto el
     * 2026-08-18 sin que nada lo delatara. Un dato viejo dentro de una promesa
     * de verificabilidad es el peor sitio donde puede envejecer un número.
     */
    const firmadas = useMemo(() => media.filter((m) => m.reviewedAt).length, [media]);

    /** Encender o apagar un alcance. Nunca se pueden apagar los tres. */
    const alternarAlcance = (clave) => {
        setAlcances((previos) => {
            if (!previos.includes(clave)) return [...previos, clave];
            // Quedarse sin ninguno dejaría un mapa vacío que parece una avería.
            return previos.length === 1 ? previos : previos.filter((p) => p !== clave);
        });
    };

    /**
     * `null` = todavía no se sabe, y se trata distinto de «no aporta». Marcar un
     * medio como silencioso mientras carga sería afirmar algo por no tener el
     * dato aún.
     */
    const aporta = (id) => (aportePorMedio ? (aportePorMedio.get(id) ?? 0) > 0 : null);

    const selected = media.find((m) => m.id === selectedId) ?? null;

    return (
        <div className="media-map-page">
            <header className="map-hero">
                <h1>Mapa mediático de Colombia</h1>
                <p className="map-lede">
                    Cada punto es un medio del catálogo. La posición horizontal es la línea
                    editorial que le atribuimos; la vertical, su historial de rigor factual.
                    Ninguna de las dos evalúa la noticia que usted esté leyendo: describen a la
                    organización que la publica.
                </p>
                {/*
                  * ESTE AVISO DECÍA «NINGUNA HA PASADO POR REVISIÓN FORMAL» Y
                  * DEJÓ DE SER CIERTO EL 2026-08-18, cuando se firmaron las
                  * cinco primeras. Se pasa a contarlas en vivo por el mismo
                  * motivo por el que el aviso de la portada calcula sus cifras:
                  * un número escrito a mano en una frase sobre verificabilidad
                  * es el peor sitio del sitio para tener un dato viejo.
                  */}
                <p className="map-warning">
                    <Info size={15} aria-hidden="true" />
                    <span>
                        {firmadas === 0 ? (
                            <>
                                Las {media.length} clasificaciones que se ven son juicios
                                editoriales argumentados y <strong>ninguna está firmada
                                todavía</strong>.
                            </>
                        ) : (
                            <>
                                De las {media.length} clasificaciones que se ven,{' '}
                                <strong>{firmadas} están firmadas</strong> —con las fuentes
                                que las sostienen— y el resto son juicios argumentados
                                todavía sin firmar.
                            </>
                        )}{' '}
                        Cada una lleva su justificación al lado, para que se pueda discutir.
                    </span>
                </p>
            </header>

            <div className="map-controls">
                <div className="map-view-toggle" role="group" aria-label="Forma de ver los datos">
                    <button
                        className={view === 'mapa' ? 'active' : ''}
                        onClick={() => setView('mapa')}
                        aria-pressed={view === 'mapa'}
                    >
                        <ScatterChart size={15} aria-hidden="true" /> Mapa
                    </button>
                    <button
                        className={view === 'tabla' ? 'active' : ''}
                        onClick={() => setView('tabla')}
                        aria-pressed={view === 'tabla'}
                    >
                        <Table2 size={15} aria-hidden="true" /> Tabla
                    </button>
                </div>

                <div className="map-search-wrapper" role="search">
                    <Search size={14} className="map-search-icon" aria-hidden="true" />
                    <input
                        type="search"
                        placeholder="Buscar medio (ej. Semana, Vorágine, RCN)..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="map-search-input"
                        aria-label="Buscar medio en el mapa o tabla"
                    />
                    {busqueda && (
                        <button
                            type="button"
                            className="map-search-clear"
                            onClick={() => setBusqueda('')}
                            aria-label="Limpiar búsqueda"
                        >
                            <X size={14} aria-hidden="true" />
                        </button>
                    )}
                </div>

                {/*
                  * SUBCATEGORÍAS POR ALCANCE. Casillas y no pestañas: se pueden
                  * combinar, porque «nacionales + independientes» es la vista
                  * por omisión y tiene que poder existir.
                  */}
                <fieldset className="map-alcances">
                    <legend>Qué medios se muestran</legend>
                    {Object.entries(ALCANCES).map(([clave, { label, descripcion }]) => (
                        <label key={clave} className="map-alcance" title={descripcion}>
                            <input
                                type="checkbox"
                                checked={alcances.includes(clave)}
                                onChange={() => alternarAlcance(clave)}
                            />
                            <span>{label}</span>
                            <span className="map-alcance-cifra">{CUANTOS_POR_ALCANCE[clave] ?? 0}</span>
                        </label>
                    ))}
                </fieldset>
            </div>

            {/*
              * POR QUÉ ESTO NO ES UNA PILA DE NUEVE AVISOS (2026-08-18).
              *
              * Lo era. Entre la cabecera y el gráfico había nueve recuadros
              * seguidos, y el efecto es el contrario del buscado: un lector que
              * se encuentra nueve advertencias no lee ninguna, y las que de
              * verdad importan —las que dicen que algo falta— quedan enterradas
              * entre las que explican cómo funciona una columna.
              *
              * EL CRITERIO QUE LOS SEPARA, y conviene respetarlo al añadir uno
              * nuevo:
              *
              *   · Un aviso que informa de UN HUECO O DE UN ESTADO —algo falta,
              *     algo no cuadra, esta cifra no existe— se queda VISIBLE. Es el
              *     que el lector necesita justo cuando cuenta los puntos y no le
              *     salen las cuentas.
              *   · Un aviso que EXPLICA EL MÉTODO —qué mide una columna, qué
              *     significa un símbolo— se pliega en «Cómo se lee este mapa».
              *
              * NO SE BORRA NADA. Plegar no es esconder: el texto sigue entero, a
              * un clic, y en el sitio donde uno lo busca, que es cuando le surge
              * la duda y no antes. Borrarlo sí habría sido esconderlo.
              */}
            {!alcances.includes('regional') && (
                <p className="map-nota-alcance">
                    <Info size={15} aria-hidden="true" />
                    <span>
                        Faltan aquí <strong>{CUANTOS_POR_ALCANCE.regional ?? 0} medios
                        regionales</strong>: esta vista mide la concentración de la propiedad
                        en el espacio nacional, y un diario de provincia no compite ahí. Sus
                        fichas están completas y se ven marcando «Regionales».
                    </span>
                </p>
            )}

            {sinPropiedad.length > 0 && (
                <p className="map-nota-ausencia">
                    <FileSearch size={15} aria-hidden="true" />
                    <span>
                        <strong>
                            {sinPropiedad.length === 1
                                ? 'De uno de estos medios no sabemos quién lo controla'
                                : `De ${sinPropiedad.length} de estos medios no sabemos quién los controla`}
                        </strong>{' '}
                        ({sinPropiedad.map((m) => m.name).join(', ')}). Su ficha dice en qué
                        fecha se buscó y en qué registros, en vez de rellenar el hueco con una
                        suposición. Si tiene documentos, escríbanos a{' '}
                        <a href={`${CONTACT_MAILTO}?subject=${encodeURIComponent('Propiedad de un medio del catálogo')}`}>
                            {CONTACT_EMAIL}
                        </a>.
                    </span>
                </p>
            )}

            <details className="map-como-se-lee">
                <summary>Cómo se lee este mapa</summary>

                {/*
                  * LAS VEINTE FICHAS, Y POR QUÉ SIETE VALEN MENOS QUE TRECE.
                  *
                  * Esta nota existe porque la marca numerada de la tabla, sola,
                  * mentiría por omisión: un «14» al lado de El Heraldo y un «2»
                  * al lado de El Tiempo parecen la misma clase de dato y no lo
                  * son. Uno sale de preguntarle a la gente qué lee; el otro, de
                  * contar cuánto publica un RSS.
                  */}
                <p>
                    <strong>Los números al lado de {TAMANO_TRAMO} medios</strong> marcan las
                    fichas de propiedad prioritarias: las que más gente lee, y por tanto donde
                    un error nuestro haría más daño. Se ordenan con{' '}
                    <strong>dos grados de certeza distintos</strong>:{' '}
                    <span className="prioridad-marca prioridad-medida">1</span>{' '}
                    los <strong>trece con audiencia medida</strong> por la encuesta del Reuters
                    Institute, en personas;{' '}
                    <span className="prioridad-marca prioridad-estimada">14</span>{' '}
                    los <strong>siete añadidos por volumen</strong> —piezas que ingerimos,
                    contadas por nosotros el {AMPLIACION_POR_VOLUMEN.medidoEl}—, que{' '}
                    <strong>no es audiencia</strong>. Ningún estimado adelanta a un medido:
                    mezclarlos exigiría convertir piezas en lectores, y eso no se puede hacer.
                </p>

                {/*
                  * DÓNDE SE ACABA LA MEDICIÓN DE AUDIENCIA.
                  *
                  * La tabla dice «sin medir» en la mayoría de las filas, y sin
                  * esta nota eso se lee como una tarea pendiente nuestra. No lo
                  * es: en Colombia no hay medición pública de audiencia por
                  * debajo de la quincena de marcas que encuesta el Reuters
                  * Institute, y la que usa el sector es de pago y no
                  * republicable. El dato que lo explica mejor está en la propia
                  * encuesta: TODA la prensa regional junta cabe en una sola fila.
                  */}
                {sinMedicion.length > 0 && (
                    <p>
                        El <strong>alcance semanal</strong> es el porcentaje de colombianos que
                        dice haber usado cada marca en la última semana, según el{' '}
                        <a href={FUENTE_AUDIENCIA.url} target="_blank" rel="noopener noreferrer">
                            {FUENTE_AUDIENCIA.nombre}
                        </a>. Mide <strong>personas, no visitas</strong>, e incluye televisión y
                        radio. <strong>{sinMedicion.length} de los {media.length} medios que se
                        ven aparecen como «sin medir»</strong>, y no es un pendiente nuestro: la
                        encuesta llega a dieciséis marcas y por debajo de ahí no existe medición
                        pública en Colombia. La prensa regional entera cabe en una sola fila
                        agregada, así que ni El Colombiano ni El Heraldo ni El País de Cali
                        tienen cifra propia pese a estar entre los que más publican.
                    </p>
                )}

                <p>
                    La columna <strong>«Responde a»</strong> dice a quién debe cuentas cada
                    redacción, y lo que manda es la naturaleza del interés:{' '}
                    <span className="duenio-badge duenio-conglomerado duenio-enfasis">
                        <Building2 size={13} aria-hidden="true" />Grupo económico
                    </span>{' '}
                    frente a{' '}
                    <span className="duenio-badge duenio-independiente duenio-enfasis">
                        <Sprout size={13} aria-hidden="true" />Independiente
                    </span>. El apellido —nacional, regional o internacional— dice el alcance
                    del dueño, no cambia la respuesta: «internacional» dice dónde está el dueño,
                    no qué es —al Grupo Prisa lo controla un banquero de inversión—. Esto{' '}
                    <strong>no afirma</strong> que esos dueños tengan negocios en otros
                    sectores: donde los hay, constan con su fuente en la ficha del medio.
                </p>

                {aportePorMedio && (
                    <p>
                        Los círculos <strong>huecos</strong> son medios que no han publicado
                        nada en las últimas {ventanaHoras} horas. Siguen aquí porque su ficha de
                        propiedad es parte del mapa, pero{' '}
                        <strong>no entran en ninguna comparación de cobertura</strong>. Algunos
                        publican poco por oficio —investigación, periodicidad de fin de
                        semana—, no por avería.
                    </p>
                )}
            </details>

            <div className="map-legend" aria-hidden="true">
                {['left', 'center', 'right'].map((key) => (
                    <span key={key} className="legend-item">
                        <span className="legend-dot" style={{ background: SPECTRUM_FILL[key] }} />
                        {SPECTRUM_LABEL[key]}
                    </span>
                ))}
            </div>

            {/*
              * Si faltan puntos en el gráfico hay que decirlo AQUÍ, y no solo
              * en la tabla. Un lector que cuenta los puntos y los compara con
              * la cifra del catálogo tiene que encontrar la explicación en el
              * mismo sitio donde nota que algo no cuadra.
              */}
            {view === 'mapa' && sinFactualidad > 0 && (
                <p className="map-warning">
                    <Info size={15} aria-hidden="true" />
                    <span>
                        <strong>{sinFactualidad}</strong>{' '}
                        {sinFactualidad === 1 ? 'medio no aparece' : 'medios no aparecen'} en el
                        gráfico: sin historial de rigor factual medido no hay altura que darle
                        en el eje vertical, y colocar{sinFactualidad === 1 ? 'lo' : 'los'} en la
                        media afirmaría algo que no sabemos.{' '}
                        <strong>Están todos en la tabla</strong>, con «sin medir» en esa columna.
                    </span>
                </p>
            )}

            {view === 'mapa' ? (
                <div className="map-figure">
                    <svg
                        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                        className="map-svg"
                        role="img"
                        aria-labelledby={titleId}
                    >
                        <title id={titleId}>
                            {`Dispersión de ${puntos.length} medios: orientación editorial en el eje horizontal, factualidad en el vertical.`}
                        </title>

                        {/* Bandas del espectro: contexto de fondo, deliberadamente recesivo. */}
                        {SPECTRUM_BANDS.map((band) => (
                            <g key={band.id}>
                                <rect
                                    x={xScale(band.min)}
                                    y={PAD.top}
                                    width={xScale(band.max) - xScale(band.min)}
                                    height={PLOT_H}
                                    className="map-band"
                                />
                                <text
                                    x={(xScale(band.min) + xScale(band.max)) / 2}
                                    y={PAD.top - 10}
                                    className="map-band-label"
                                >
                                    {band.label}
                                </text>
                            </g>
                        ))}

                        {/* Rejilla horizontal */}
                        {[0.75, 0.8, 0.85, 0.9, 0.95].map((tick) => (
                            <g key={tick}>
                                <line
                                    x1={PAD.left} x2={WIDTH - PAD.right}
                                    y1={yScale(tick)} y2={yScale(tick)}
                                    className="map-grid"
                                />
                                <text x={PAD.left - 10} y={yScale(tick) + 4} className="map-tick">
                                    {fmtPct(tick)}
                                </text>
                            </g>
                        ))}

                        {/* Eje X */}
                        <line
                            x1={PAD.left} x2={WIDTH - PAD.right}
                            y1={PAD.top + PLOT_H} y2={PAD.top + PLOT_H}
                            className="map-axis"
                        />
                        {[-1, -0.5, 0, 0.5, 1].map((tick) => (
                            <text
                                key={tick}
                                x={xScale(tick)}
                                y={PAD.top + PLOT_H + 20}
                                className="map-tick map-tick-x"
                            >
                                {fmtBias(tick)}
                            </text>
                        ))}

                        <text x={WIDTH / 2} y={HEIGHT - 8} className="map-axis-label">
                            Línea editorial  ·  izquierda ← → derecha
                        </text>
                        <text
                            transform={`translate(16 ${PAD.top + PLOT_H / 2}) rotate(-90)`}
                            className="map-axis-label"
                        >
                            Factualidad del medio
                        </text>

                        {puntos.map((item) => {
                            const spectrum = classifySpectrum(item.bias);
                            const isSelected = item.id === selectedId;
                            const isMatched = busquedaNorm ? coincideMedio(item) : false;
                            const isDimmed = busquedaNorm ? !isMatched : false;

                            return (
                                <g key={item.id} className="map-point-group">
                                    {item.nudged && (
                                        <line
                                            x1={item.x} y1={yScale(item.factuality)}
                                            x2={item.x} y2={item.y}
                                            className="map-nudge-line"
                                        />
                                    )}
                                    <circle
                                        cx={item.x}
                                        cy={item.y}
                                        r={isSelected ? 10 : isMatched ? 8 : 6}
                                        // Hueco cuando el medio no aporta nada a
                                        // la ventana: sigue en el mapa, pero se
                                        // ve que no está en la comparación.
                                        fill={aporta(item.id) === false ? 'transparent' : SPECTRUM_FILL[spectrum]}
                                        stroke={isMatched ? 'var(--text-main)' : SPECTRUM_FILL[spectrum]}
                                        strokeWidth={isMatched ? 2.5 : aporta(item.id) === false ? 2 : 0}
                                        className={`map-point ${isSelected ? 'selected' : ''} ${isMatched ? 'matched' : ''} ${isDimmed ? 'dimmed' : ''}`}
                                        tabIndex={0}
                                        role="button"
                                        aria-label={
                                            `${item.name}. Orientación ${fmtBias(item.bias)}, ` +
                                            `factualidad ${fmtPct(item.factuality)}. ` +
                                            'Abrir ficha.'
                                        }
                                        onClick={() => setSelectedId(isSelected ? null : item.id)}
                                        onKeyDown={(e) => {
                                             if (e.key === 'Enter' || e.key === ' ') {
                                                 e.preventDefault();
                                                 setSelectedId(isSelected ? null : item.id);
                                             }
                                        }}
                                    />
                                    {/*
                                      * UNA SOLA CADENA, no tres nodos. React
                                      * exige que los hijos de <title> sean un
                                      * único texto —el navegador solo sabe
                                      * leer texto ahí dentro— y esta forma
                                      * escupía un aviso por cada punto: 36 en
                                      * cada renderizado de servidor.
                                      */}
                                    <title>
                                        {`${item.name} · ${fmtBias(item.bias)} · ${fmtPct(item.factuality)}`}
                                    </title>
                                </g>
                            );
                        })}
                    </svg>

                    <p className="map-hint">
                        Toque o seleccione un punto para ver por qué está donde está.
                        Los puntos que coincidían se desplazaron en vertical, unidos a su
                        posición real por una línea fina.
                    </p>
                </div>
            ) : (
                <div className="map-table-wrap">
                    <table className="map-table">
                        <caption className="visually-hidden">
                            Medios del catálogo con su orientación, factualidad, banda y grupo propietario
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col">Medio</th>
                                {/*
                                  * LA AUDIENCIA VA JUNTO AL NOMBRE, antes que
                                  * la orientación: es lo que dice si el juicio
                                  * editoral que viene detrás afecta a media
                                  * Colombia o a un municipio.
                                  */}
                                <th scope="col" title={FUENTE_AUDIENCIA.metodo}>
                                    Alcance semanal
                                </th>
                                <th scope="col">Orientación</th>
                                <th scope="col">Banda</th>
                                <th scope="col">Factualidad</th>
                                <th scope="col">Grupo</th>
                                <th scope="col">Responde a</th>
                                <th scope="col">Piezas ({ventanaHoras} h)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mediosTabla.length > 0 ? (
                                mediosTabla.map((item) => (
                                    <tr key={item.id}>
                                        <th scope="row">
                                            <MarcaPrioritaria mediaId={item.id} />
                                            <button
                                                className="map-table-link"
                                                onClick={() => setSelectedId(item.id)}
                                            >
                                                {item.name}
                                            </button>
                                        </th>
                                        <td className="num">
                                            {alcanceMaximo(item.id) === null
                                                ? <span className="sin-medir">sin medir</span>
                                                : `${alcanceMaximo(item.id)}%`}
                                        </td>
                                        <td className="num">{fmtBias(item.bias)}</td>
                                        <td>{getBand(item.bias).label}</td>
                                        <td className="num">{fmtPct(item.factuality)}</td>
                                        <td>{item.group}</td>
                                        <td><Distintivo mediaId={item.id} /> <DistintivoRedaccion medio={item} /></td>
                                        <td>
                                            {aporta(item.id) === null
                                                ? '—'
                                                : aporta(item.id)
                                                    ? `${aportePorMedio.get(item.id)}`
                                                    : 'sin piezas'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                        No se encontraron medios que coincidan con «{busqueda}».
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Va DESPUÉS del mapa, no antes: el mapa responde «dónde está cada
                medio» y esto responde «cuánto pesa cada dueño». Lo segundo solo
                se entiende habiendo visto lo primero. */}
            <PanoramaMediatico conteosExternos={conteos} />

            {selected && <MediaProfile media={selected} onClose={() => setSelectedId(null)} />}
        </div>
    );
};

/**
 * LO QUE NO SABEMOS, CON FECHA Y CON RECIBO.
 *
 * Es la contrapartida honesta de haber dado de alta medios cuya propiedad no se
 * ha podido establecer. Sin este bloque, el alta sería una rebaja del listón; con
 * él, es una forma distinta de aplicarlo: se publica la búsqueda en vez del
 * resultado que no hay.
 *
 * TRES COSAS Y NINGUNA MÁS: dónde se buscó y qué dio cada sitio, qué documento
 * cerraría el hueco, y cómo ayudar. Nada de conjeturas sobre quién podría ser el
 * dueño —esa es justo la afirmación que no se puede hacer—.
 *
 * EL AVISO NO VA EN ROJO, por lo mismo que los de conflicto de interés: no es
 * una alarma sobre el medio. Que no publique su mástil puede ser opacidad o
 * puede ser una web pequeña sin página de créditos, y decidir cuál sería
 * exactamente lo que no podemos documentar.
 */
const AusenciaDeclarada = ({ ausencia, medio }) => (
    <div className="profile-ausencia">
        <h4>
            <FileSearch size={15} aria-hidden="true" />
            No sabemos quién controla este medio
        </h4>

        <p className="profile-ausencia-lede">
            Se buscó el <strong>{ausencia.consultadoEl}</strong> y no consta. Lo que
            sigue es dónde se miró, para que se pueda repetir la comprobación o
            señalar dónde no miramos. No decimos «independiente» ni ninguna otra
            cosa: <strong>una suposición cómoda ocuparía el sitio de un dato</strong>.
        </p>

        {ausencia.buscadoEn.length > 0 && (
            <ul className="profile-buscado">
                {ausencia.buscadoEn.map((intento) => (
                    <li key={intento.fuente}>
                        {intento.url ? (
                            <a href={intento.url} target="_blank" rel="noopener noreferrer">
                                {intento.fuente}
                                <ExternalLink size={11} aria-hidden="true" />
                            </a>
                        ) : (
                            <span className="profile-buscado-fuente">{intento.fuente}</span>
                        )}
                        <span className="profile-buscado-resultado">{intento.resultado}</span>
                    </li>
                ))}
            </ul>
        )}

        {ausencia.falta.length > 0 && (
            <>
                <p className="profile-ausencia-falta-titulo">Qué cerraría el hueco</p>
                <ul className="profile-list">
                    {ausencia.falta.map((f) => <li key={f}>{f}</li>)}
                </ul>
            </>
        )}

        {/*
          * LA PETICIÓN AL LECTOR, y va aquí y no en una página de contacto
          * porque este es el momento en que alguien de Montería está mirando
          * justo el hueco que quizá pueda llenar.
          *
          * PIDE DOCUMENTOS, NO OPINIONES, y la diferencia es la misma regla de
          * siempre: el pulgar arriba/abajo de más arriba señala dónde mirar y no
          * cambia nada; un certificado de Cámara de Comercio sí cambia la ficha.
          * Prometer lo segundo a cambio de lo primero sería mentir sobre cómo
          * funciona esto.
          */}
        <p className="profile-ausencia-ayuda">
            <Mail size={14} aria-hidden="true" />
            <span>
                ¿Tiene un documento que diga quién es dueño de {medio.name} —un
                certificado de Cámara de Comercio, un registro mercantil, un
                comunicado del propio medio—? Escríbanos a{' '}
                <a href={`${CONTACT_MAILTO}?subject=${encodeURIComponent(`Propiedad de ${medio.name}`)}`}>
                    {CONTACT_EMAIL}
                </a>{' '}
                y lo publicamos con su enlace. Solo sirven documentos consultables:
                sin eso no podemos publicarlo, por mucha razón que tenga quien lo
                cuente.
            </span>
        </p>
    </div>
);

/** Ficha de un medio: por qué está donde está, y quién está detrás. */
const MediaProfile = ({ media, onClose }) => {
    const ownership = getOwnership(media.id);
    const documented = hasDocumentedOwnership(media.id);
    const ausencia = ausenciaDeclarada(media.id);
    const audiencia = audienciaDe(media.id);
    const prioridad = prioridadDe(media.id);
    const ownerType = ownership ? OWNER_TYPES[ownership.ownerType] : null;
    const grupo = ownership?.controlGroup ? CONTROL_GROUPS[ownership.controlGroup] : null;
    const personas = grupo?.personas ?? [];
    const sectoresDelDueno = grupo?.sectores ?? [];
    const presentation = getMediaByName(media.name);

    return (
        <aside className="media-profile" aria-label={`Ficha de ${media.name}`}>
            <div className="profile-head">
                <div className="profile-identity">
                    <MediaLogo media={presentation} size={30} />
                    <div>
                        <h2>{media.name}</h2>
                        <p className="profile-domain">{media.domain}</p>
                    </div>
                </div>
                <button className="profile-close" onClick={onClose} aria-label="Cerrar ficha">
                    ×
                </button>
            </div>

            {/* Antes de las cifras: a quién responde la redacción es lo que da
                contexto a todo lo demás, incluida la línea editorial. */}
            <p className="profile-duenio">
                <Distintivo mediaId={media.id} />
                <DistintivoRedaccion medio={media} />
            </p>

            <div className="profile-metrics">
                <div className="profile-metric">
                    <span className="metric-label">Línea editorial</span>
                    <span className="metric-value">{fmtBias(media.bias)}</span>
                    <span className="metric-sub">{getBand(media.bias).label}</span>
                </div>
                <div className="profile-metric">
                    <span className="metric-label">Factualidad</span>
                    <span className="metric-value">{fmtPct(media.factuality)}</span>
                    <span className="metric-sub">historial del medio</span>
                </div>
                {/*
                  * CUÁNTA GENTE LO LEE. Va junto al sesgo y a la factualidad
                  * porque responde la tercera pregunta obvia sobre un medio, y
                  * porque cambia cómo se leen las otras dos: una orientación
                  * discutible en un medio que ve el 30 % del país pesa distinto
                  * que la misma en uno que ven cuatro personas.
                  *
                  * Solo aparece cuando hay medición. La mayoría del catálogo no
                  * la tiene, y el hueco se dice abajo en voz alta en vez de
                  * ponerle aquí un guion que parezca un cero.
                  */}
                {audiencia && (
                    <div className="profile-metric">
                        <span className="metric-label">Alcance semanal</span>
                        <span className="metric-value">
                            {alcanceMaximo(media.id)}%
                        </span>
                        <span className="metric-sub">
                            {audiencia.online !== null && audiencia.offline !== null
                                ? `${audiencia.online}% en internet · ${audiencia.offline}% fuera`
                                : audiencia.online !== null
                                    ? 'en internet'
                                    : 'fuera de internet'}
                        </span>
                    </div>
                )}
                <div className="profile-metric">
                    <span className="metric-label">Revisión</span>
                    <span className="metric-value small">
                        {media.reviewedAt ?? 'Provisional'}
                    </span>
                    <span className="metric-sub">
                        {media.reviewedAt ? 'firmada' : 'sin firmar'}
                    </span>
                </div>
            </div>

            {/*
              * LA CIFRA DE AUDIENCIA NO ES NUESTRA Y SE DICE DE QUIÉN ES. Es el
              * único número de esta ficha que no producimos: el sesgo lo
              * juzgamos nosotros y la factualidad la medimos, pero esto lo
              * midió una encuesta ajena y tiene que poder rastrearse hasta ella.
              */}
            {/*
              * Por qué esta ficha se trabaja antes que otras, dicho en la propia
              * ficha. Y con la salvedad delante cuando toca: que un medio esté
              * en el tramo por volumen no significa que sepamos cuánta gente lo
              * lee.
              */}
            {prioridad && (
                <p className={`profile-prioridad prioridad-${prioridad.certeza}`}>
                    <span className={`prioridad-marca prioridad-${prioridad.certeza}`}>
                        {prioridad.puesto}
                    </span>
                    <span>
                        <strong>Ficha prioritaria</strong> n.º {prioridad.puesto} de{' '}
                        {TAMANO_TRAMO}.{' '}
                        {prioridad.certeza === 'medida' ? (
                            <>Su audiencia está medida: {prioridad.cifra} {prioridad.unidad}.</>
                        ) : (
                            <>
                                Entra por <strong>volumen, no por audiencia</strong>:{' '}
                                {prioridad.cifra} {prioridad.unidad}, contadas por nosotros
                                el {AMPLIACION_POR_VOLUMEN.medidoEl}.{' '}
                                <strong>Nadie ha medido en público cuánta gente lo lee</strong>,
                                así que su puesto es una aproximación por el peso que tiene, no
                                una cifra de lectores.
                            </>
                        )}
                    </span>
                </p>
            )}

            {audiencia && (
                <p className="profile-fuente-audiencia">
                    «{audiencia.marca}» en el{' '}
                    <a href={FUENTE_AUDIENCIA.url} target="_blank" rel="noopener noreferrer">
                        {FUENTE_AUDIENCIA.nombre}
                        <ExternalLink size={11} aria-hidden="true" />
                    </a>{' '}
                    del {FUENTE_AUDIENCIA.editor}. {FUENTE_AUDIENCIA.advertencia}
                </p>
            )}

            <section className="profile-section">
                <h3>Por qué lo clasificamos así</h3>
                <p>{media.biasRationale}</p>
            </section>

            <section className="profile-section">
                <h3>Quién está detrás</h3>
                <p className="profile-group">
                    <strong>{media.group}</strong>
                    {ownerType && <span className="owner-type"> · {ownerType.label}</span>}
                </p>
                {ownerType && <p className="owner-type-desc">{ownerType.description}</p>}

                {/**
                 * HASTA QUIÉN LLEGA EL HILO.
                 *
                 * Un nombre de grupo —«Valorem», «Grupo Gilinski»— es un vehículo,
                 * y quien decide es una persona. Enseñarlas aquí, con su enlace,
                 * es lo que convierte el mapa de propiedad en algo verificable en
                 * vez de en una lista de razones sociales.
                 *
                 * Se nombra el CONTROL —«preside la junta», «accionista
                 * mayoritario»—, que es un hecho societario documentado, y no el
                 * patrimonio, que sería interpretación.
                 */}
                {personas.length > 0 && (
                    <div className="profile-personas">
                        <h4>En quién termina</h4>
                        {personas.map((p) => (
                            <p key={p.nombre} className="persona">
                                <span className="persona-nombre">{p.nombre}</span>
                                {p.desde && <span className="persona-desde">desde {p.desde}</span>}
                                <span className="persona-papel">{p.papel}</span>
                                <span className="profile-sources persona-fuentes">
                                    {p.fuentes.map((url) => (
                                        <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                                            {url.replace(/^https?:\/\//, '').split('/')[0]}
                                            <ExternalLink size={11} aria-hidden="true" />
                                        </a>
                                    ))}
                                </span>
                            </p>
                        ))}
                    </div>
                )}

                {/**
                 * El aviso que Jose pidió para Cambio, generalizado: un medio
                 * etiquetado como independiente cuyos dueños SÍ tienen negocios
                 * documentados en otros sectores. No cambia la etiqueta —seguir
                 * llamándolo independiente es correcto: no lo posee un grupo—
                 * pero callar que sus socios están en la siderurgia o los seguros
                 * sería esconder justo lo que este mapa existe para enseñar.
                 */}
                {sectoresDelDueno.length > 0 && ownership?.ownerType === 'independiente' && (
                    <p className="profile-aviso-sectores">
                        Aunque no lo posee un grupo económico, sus dueños tienen negocios
                        documentados en <strong>{sectoresDelDueno.join(', ')}</strong>.
                    </p>
                )}

                {documented ? (
                    <>
                        {ownership.holdings.length > 0 && (
                            <ul className="profile-list">
                                {ownership.holdings.map((h) => <li key={h}>{h}</li>)}
                            </ul>
                        )}
                        {ownership.notes.length > 0 && (
                            <ul className="profile-list">
                                {ownership.notes.map((n) => <li key={n}>{n}</li>)}
                            </ul>
                        )}
                        <ul className="profile-sources">
                            {ownership.sources.map((url) => (
                                <li key={url}>
                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                        {url.replace(/^https?:\/\//, '').split('/')[0]}
                                        <ExternalLink size={12} aria-hidden="true" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                        {/*
                          * LA FECHA DE COMPROBACIÓN, A LA VISTA. Una ficha de
                          * propiedad sin fecha se lee como si fuera de hoy, y no
                          * lo es: los dueños cambian. Decir cuándo se comprobó
                          * deja que el lector calcule por su cuenta cuánto
                          * confiar, en vez de tener que confiar del todo o nada.
                          */}
                        {ownership.verifiedAt && (
                            <p className="profile-fecha">
                                Comprobado contra estas fuentes el <strong>{ownership.verifiedAt}</strong>.
                            </p>
                        )}
                    </>
                ) : !ausencia && (
                    <p className="profile-missing">
                        <strong>Ficha de propiedad pendiente de documentar.</strong> Quiénes son
                        las personas dueñas, qué otros negocios tiene el grupo y qué señalamientos
                        registra son afirmaciones sobre gente y empresas identificables. No las
                        publicamos hasta poder enlazar dónde constan. Preferimos dejar el hueco a
                        la vista antes que llenarlo con algo verosímil.
                    </p>
                )}

                {ausencia && <AusenciaDeclarada ausencia={ausencia} medio={media} />}

                {/* Solo cuando hay algo que juzgar: preguntar «¿es correcta?»
                    sobre una ficha vacía no tiene respuesta posible. */}
                {documented && <ReportePropiedad mediaId={media.id} />}
            </section>

            <a
                className="profile-visit"
                href={`https://${media.domain}`}
                target="_blank"
                rel="noopener noreferrer"
            >
                Ir a {media.name} <ExternalLink size={13} aria-hidden="true" />
            </a>
        </aside>
    );
};

export default MediaMap;
