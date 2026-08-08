import { useMemo, useState, useId, useEffect } from 'react';
import { fetchPanorama, isApiConfigured } from '../services/apiClient';
import {
    ExternalLink, Table2, ScatterChart, Info,
    Building2, Sprout, Users, Landmark, Globe,
} from 'lucide-react';
import { MEDIA_REGISTRY, SPECTRUM_BANDS, getBand } from '../../shared/mediaRegistry';
import PanoramaMediatico from '../components/PanoramaMediatico';
import ReportePropiedad from '../components/ReportePropiedad';
import { classifySpectrum } from '../../shared/biasAnalysis';
import { OWNER_TYPES, getOwnership, hasDocumentedOwnership, getOwnerBadge } from '../../shared/mediaOwnership';
import MediaLogo from '../components/MediaLogo';
import { getMediaByName } from '../data/mediaLogos';
import './MediaMap.css';

/**
 * MAPA MEDIÁTICO — dispersión sesgo × factualidad.
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

const SPECTRUM_LABEL = {
    left: 'Izquierda',
    center: 'Sin línea marcada',
    right: 'Derecha',
};

const fmtBias = (bias) => `${bias >= 0 ? '+' : '−'}${Math.abs(bias).toFixed(2)}`;
const fmtPct = (value) => `${Math.round(value * 100)}%`;

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

const ES_COLOMBIANO = (medio) => medio.country === 'CO';
const MEDIOS_COLOMBIANOS = MEDIA_REGISTRY.filter(ES_COLOMBIANO);

const MediaMap = () => {
    const [view, setView] = useState('mapa');
    const [selectedId, setSelectedId] = useState(null);
    const [conteos, setConteos] = useState(null);
    const [ventanaHoras, setVentanaHoras] = useState(72);
    const titleId = useId();

    /**
     * ESTAR EN EL CATÁLOGO NO ES LO MISMO QUE APORTAR COBERTURA.
     *
     * El mapa presentaba a todos los medios por igual, y no lo son: medido el
     * 2026-08-07, varios llevan días sin una sola pieza en la ventana —Vorágine
     * publica una cada 74,7 h, Noticias Uno es un noticiero de fin de semana, W
     * Radio no tiene RSS propio—. Enseñarlos junto a los que publican cientos de
     * notas sugiere una comparación que no está ocurriendo.
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

    const media = useMemo(
        () => spread([...MEDIOS_COLOMBIANOS].sort((a, b) => a.bias - b.bias)),
        []
    );

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
                <p className="map-warning">
                    <Info size={15} aria-hidden="true" />
                    <span>
                        Las {MEDIOS_COLOMBIANOS.length} clasificaciones son juicios editoriales
                        argumentados y <strong>ninguna ha pasado por revisión formal todavía</strong>.
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
            </div>

            <p className="map-warning">
                <Info size={15} aria-hidden="true" />
                <span>
                    En la tabla, la columna <strong>«Responde a»</strong> dice a quién
                    debe cuentas cada redacción. Los dos distintivos destacados son los
                    extremos:{' '}
                    <span className="duenio-badge duenio-conglomerado duenio-enfasis">
                        <Building2 size={13} aria-hidden="true" />Grupo económico
                    </span>{' '}
                    para los controlados por un grupo con intereses en otros sectores, y{' '}
                    <span className="duenio-badge duenio-independiente duenio-enfasis">
                        <Sprout size={13} aria-hidden="true" />Independiente
                    </span>{' '}
                    para los que viven de donaciones o membresías. Los demás —familiar
                    regional, público, internacional— <strong>no son ni una cosa ni la
                    otra</strong>, y forzarlos a un bando diría algo que su ficha no
                    dice. Cada distintivo sale de la propiedad documentada con fuentes;
                    donde no la hay, dice «sin documentar» en vez de suponer.
                </span>
            </p>

            {aportePorMedio && (
                <p className="map-warning">
                    <Info size={15} aria-hidden="true" />
                    <span>
                        Los círculos <strong>huecos</strong> son medios del catálogo que no
                        han publicado nada en las últimas {ventanaHoras} horas. Siguen aquí
                        porque su ficha de propiedad es parte del mapa, pero{' '}
                        <strong>no están entrando en ninguna comparación de cobertura</strong>.
                        Algunos publican poco por oficio —investigación, periodicidad
                        semanal—, no por avería.
                    </span>
                </p>
            )}

            <div className="map-legend" aria-hidden="true">
                {['left', 'center', 'right'].map((key) => (
                    <span key={key} className="legend-item">
                        <span className="legend-dot" style={{ background: SPECTRUM_FILL[key] }} />
                        {SPECTRUM_LABEL[key]}
                    </span>
                ))}
            </div>

            {view === 'mapa' ? (
                <div className="map-figure">
                    <svg
                        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                        className="map-svg"
                        role="img"
                        aria-labelledby={titleId}
                    >
                        <title id={titleId}>
                            Dispersión de {media.length} medios: sesgo editorial en el eje
                            horizontal, factualidad en el vertical.
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

                        {media.map((item) => {
                            const spectrum = classifySpectrum(item.bias);
                            const isSelected = item.id === selectedId;

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
                                        r={isSelected ? 9 : 6}
                                        // Hueco cuando el medio no aporta nada a
                                        // la ventana: sigue en el mapa, pero se
                                        // ve que no está en la comparación.
                                        fill={aporta(item.id) === false ? 'transparent' : SPECTRUM_FILL[spectrum]}
                                        stroke={SPECTRUM_FILL[spectrum]}
                                        strokeWidth={aporta(item.id) === false ? 2 : 0}
                                        className={`map-point ${isSelected ? 'selected' : ''}`}
                                        tabIndex={0}
                                        role="button"
                                        aria-label={
                                            `${item.name}. Sesgo ${fmtBias(item.bias)}, ` +
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
                                    <title>
                                        {item.name} · {fmtBias(item.bias)} · {fmtPct(item.factuality)}
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
                            Medios del catálogo con su sesgo, factualidad, banda y grupo propietario
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col">Medio</th>
                                <th scope="col">Sesgo</th>
                                <th scope="col">Banda</th>
                                <th scope="col">Factualidad</th>
                                <th scope="col">Grupo</th>
                                <th scope="col">Responde a</th>
                                <th scope="col">Piezas ({ventanaHoras} h)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {media.map((item) => (
                                <tr key={item.id}>
                                    <th scope="row">
                                        <button
                                            className="map-table-link"
                                            onClick={() => setSelectedId(item.id)}
                                        >
                                            {item.name}
                                        </button>
                                    </th>
                                    <td className="num">{fmtBias(item.bias)}</td>
                                    <td>{getBand(item.bias).label}</td>
                                    <td className="num">{fmtPct(item.factuality)}</td>
                                    <td>{item.group}</td>
                                    <td><Distintivo mediaId={item.id} /></td>
                                    <td>
                                        {aporta(item.id) === null
                                            ? '—'
                                            : aporta(item.id)
                                                ? `${aportePorMedio.get(item.id)}`
                                                : 'sin piezas'}
                                    </td>
                                </tr>
                            ))}
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

/** Ficha de un medio: por qué está donde está, y quién está detrás. */
const MediaProfile = ({ media, onClose }) => {
    const ownership = getOwnership(media.id);
    const documented = hasDocumentedOwnership(media.id);
    const ownerType = ownership ? OWNER_TYPES[ownership.ownerType] : null;
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
                    </>
                ) : (
                    <p className="profile-missing">
                        <strong>Ficha de propiedad pendiente de documentar.</strong> Quiénes son
                        las personas dueñas, qué otros negocios tiene el grupo y qué señalamientos
                        registra son afirmaciones sobre gente y empresas identificables. No las
                        publicamos hasta poder enlazar dónde constan. Preferimos dejar el hueco a
                        la vista antes que llenarlo con algo verosímil.
                    </p>
                )}

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
