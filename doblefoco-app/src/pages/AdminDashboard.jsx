import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    X, ShieldAlert, RotateCcw, Download,
    Loader2, Users, Activity, AlertTriangle,
} from 'lucide-react';
import { exportSubscribersForOperator, getWaitlistCount } from '../services/storageService';
import { fetchHealth, requestIngestion, isApiConfigured, fetchErrors, resolveError } from '../services/apiClient';
import {
    decideStory,
    fetchCounts,
    fetchDecided,
    fetchPending,
    fetchReports,
} from '../services/moderationClient';
import './AdminDashboard.css';

/**
 * Panel de moderación.
 *
 * QUÉ CAMBIÓ (tarea F2-02)
 * ------------------------
 * Las decisiones vivían en el localStorage de este navegador. Dos personas del
 * equipo veían colas distintas, un borrado de datos perdía el trabajo y los
 * visitantes no veían nada de ello. Ahora vienen y van a la base, se comparten
 * y quedan firmadas con quién las tomó.
 *
 * QUÉ SE RETIRÓ, Y POR QUÉ
 * ------------------------
 * La edición de la historia. Eran dos campos y ninguno debía existir:
 *
 *   · El TÍTULO es el titular literal del medio representativo del grupo.
 *     Poder reescribirlo aquí es exactamente el mecanismo que publicaba
 *     titulares que ningún medio escribió, y que costó las tareas F0-01 y
 *     F0-03 desmontar. Que el campo estuviera en el panel y no en el motor no
 *     lo hacía menos grave: el resultado publicado era el mismo.
 *   · La CATEGORÍA se recalcula en cada ciclo de ingesta a partir del feed de
 *     origen. Una edición aquí se revertiría sola en menos de media hora, sin
 *     avisar. Ofrecer un control que no hace nada es peor que no ofrecerlo.
 *
 * Moderar es decidir si una historia se publica, no reescribirla.
 */
const AdminDashboard = () => {
    const [pending, setPending] = useState([]);
    const [decided, setDecided] = useState([]);
    const [counts, setCounts] = useState(null);
    const [reports, setReports] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const [health, setHealth] = useState(null);
    const [ingesting, setIngesting] = useState(false);
    const [ingestMessage, setIngestMessage] = useState(null);

    // Errores de producción (F2-11). Un panel que solo muestra lo que va bien
    // no es un panel de operación.
    const [errores, setErrores] = useState(null);
    const [resolviendo, setResolviendo] = useState(null);

    /**
     * Trae los tres listados. No toca el estado: separar la obtención de su
     * aplicación permite descartar el resultado si el componente ya se
     * desmontó, y de paso deja el efecto sin llamadas a setState en su cuerpo.
     */
    const fetchAll = useCallback(
        () =>
            Promise.all([
                fetchPending({ limit: 50 }),
                fetchDecided({ limit: 30 }),
                fetchCounts(),
                fetchReports({ days: 14, limit: 15 }),
            ]),
        []
    );

    const apply = useCallback(([pendingResult, decidedResult, countsResult, reportsResult]) => {
        if (pendingResult.ok) setPending(pendingResult.stories);
        if (decidedResult.ok) setDecided(decidedResult.stories);
        if (countsResult.ok) setCounts(countsResult.counts);
        if (reportsResult.ok) setReports(reportsResult);

        const failure = [pendingResult, decidedResult, countsResult, reportsResult].find((r) => !r.ok);
        setError(
            failure
                ? failure.expired
                    ? 'La sesión caducó. Vuelve a entrar para seguir moderando.'
                    : failure.error
                : null
        );

        setLoading(false);
    }, []);

    /** Recarga desde el servidor. Para el botón y para después de decidir. */
    const refresh = useCallback(() => {
        setLoading(true);
        return fetchAll().then(apply);
    }, [fetchAll, apply]);

    useEffect(() => {
        let active = true;
        fetchAll().then((results) => {
            if (active) apply(results);
        });
        return () => { active = false; };
    }, [fetchAll, apply]);

    // Estado real del motor. Antes el panel mostraba un badge verde fijo que
    // decía "● Sincronización Automática Activa" estuviera el backend encendido
    // o apagado.
    useEffect(() => {
        if (!isApiConfigured) return undefined;

        let cancelled = false;
        const check = () => {
            fetchHealth().then((result) => {
                if (!cancelled) setHealth(result.ok ? result.health : { status: 'inalcanzable' });
            });
        };

        check();
        const timer = setInterval(check, 60_000);
        return () => { cancelled = true; clearInterval(timer); };
    }, []);

    // Fallos de producción, en la misma cadencia que la salud del motor.
    const cargarErrores = useCallback(async () => {
        if (!isApiConfigured) return;
        const resultado = await fetchErrors();
        if (resultado.ok) setErrores(resultado);
    }, []);

    // Mismo patrón que la sonda de salud de arriba: la bandera evita escribir
    // estado sobre un componente ya desmontado si la respuesta llega tarde.
    useEffect(() => {
        if (!isApiConfigured) return undefined;

        let cancelado = false;
        const cargar = () => {
            fetchErrors().then((resultado) => {
                if (!cancelado && resultado.ok) setErrores(resultado);
            });
        };

        cargar();
        const timer = setInterval(cargar, 60_000);
        return () => { cancelado = true; clearInterval(timer); };
    }, []);

    const handleResolver = async (huella) => {
        setResolviendo(huella);
        await resolveError(huella);
        await cargarErrores();
        setResolviendo(null);
    };

    const handleDecide = async (storyId, state) => {
        setBusyId(storyId);

        const reason =
            state === 'rechazada'
                ? window.prompt('Motivo del rechazo (opcional, queda registrado):') ?? null
                : null;

        const result = await decideStory(storyId, state, reason);
        setBusyId(null);

        if (!result.ok) {
            setError(
                result.expired
                    ? 'La sesión caducó. Vuelve a entrar para seguir moderando.'
                    : result.error
            );
            return;
        }

        // Se recarga desde el servidor en vez de retocar el estado local: es la
        // única forma de ver lo que decidió otra persona mientras tanto, que es
        // justamente el motivo de esta tarea.
        await refresh();
    };

    const handleRunIngestion = async () => {
        setIngesting(true);
        setIngestMessage(null);

        const result = await requestIngestion();

        setIngesting(false);
        setIngestMessage(
            result.ok
                ? { tone: result.queued ? 'ok' : 'warn', text: result.message }
                : { tone: 'error', text: result.error }
        );

        // No se recarga: el ciclo aún no ha ocurrido. Tarda entre uno y tres
        // minutos y lo ejecuta otro proceso; recargar ahora mostraría los
        // mismos datos y daría la impresión de que no pasó nada.
    };

    const handleExportSubscribers = () => {
        const count = getWaitlistCount();
        const confirmed = window.confirm(
            `Vas a descargar ${count} correo(s) de la lista de espera.\n\n` +
            'Son datos personales protegidos por la Ley 1581 de 2012. ' +
            'Guárdalos de forma segura y elimínalos cuando dejen de ser necesarios.\n\n' +
            '¿Continuar?'
        );
        if (confirmed) exportSubscribersForOperator({ confirmed: true });
    };

    const healthTone =
        !isApiConfigured ? 'off' :
        health?.status === 'ok' ? 'ok' :
        health ? 'warn' : 'off';

    return (
        <div className="admin-dashboard-page">
            <div className="admin-header-row">
                <div className="admin-title-section">
                    <h1>Panel de moderación</h1>
                    <p>Cola de ingesta y aprobación de contenido.</p>
                </div>
                <div className="admin-header-actions">
                    <button className="restore-defaults-btn" onClick={refresh} disabled={loading}>
                        <RotateCcw size={14} aria-hidden="true" /> Recargar
                    </button>
                    <button className="restore-defaults-btn" onClick={handleExportSubscribers}>
                        <Users size={14} aria-hidden="true" /> Exportar lista de espera
                    </button>
                </div>
            </div>

            {error && (
                <div className="admin-storage-warning" role="alert">
                    <AlertTriangle size={16} aria-hidden="true" />
                    <span>{error}</span>
                </div>
            )}

            {/*
                TRES CIFRAS, NO CUATRO, y las etiquetas dicen lo que miden.
                · «Aprobadas» desapareció con el estado: en un modelo de
                  publicar-todo-y-retirar, aprobar no producía ningún efecto.
                · «Pendientes» era engañoso. Sugería una cola que retiene algo
                  antes de publicarlo, y no retenía nada: las 3 301 estaban
                  todas visibles. Ahora dice «Sin revisar», que es la verdad, y
                  el pie del bloque aclara que están publicadas igual.
            */}
            <div className="admin-stats-summary">
                <div className="admin-stat-card admin-stat-destacada">
                    <span className="stat-num">{counts?.rechazadas ?? '—'}</span>
                    <span className="stat-lbl">Retiradas del sitio</span>
                </div>
                <div className="admin-stat-card">
                    <span className="stat-num">{counts?.sinRevisar ?? '—'}</span>
                    <span className="stat-lbl">Sin revisar</span>
                </div>
                <div className="admin-stat-card">
                    <span className="stat-num">{health?.database?.stories ?? '—'}</span>
                    <span className="stat-lbl">Historias en el motor</span>
                </div>
            </div>

            <p className="admin-stats-nota">
                Se publica todo y la moderación sirve para <strong>retirar</strong>. «Sin
                revisar» no es una cola de espera: esas historias están visibles en el sitio
                ahora mismo. Las garantías del producto —titular literal, enlace verificable,
                ausencia declarada— las da el motor, no una persona pulsando un botón.
            </p>

            <div className="google-scraper-box">
                <div className="scraper-box-header">
                    <div className="scraper-title">
                        <Activity size={20} className="scraper-icon" aria-hidden="true" />
                        <h2>Motor de ingesta</h2>
                    </div>
                    <span className={`scraper-badge tone-${healthTone}`}>
                        {!isApiConfigured && 'Sin backend configurado'}
                        {isApiConfigured && !health && 'Consultando…'}
                        {isApiConfigured && health?.status === 'ok' && 'Operativo'}
                        {isApiConfigured && health?.status === 'degradado' && 'Degradado'}
                        {isApiConfigured && health?.status === 'inalcanzable' && 'Inalcanzable'}
                    </span>
                </div>

                {!isApiConfigured ? (
                    <p className="scraper-desc">
                        Este build no tiene <code>VITE_API_URL</code>, así que el motor de ingesta
                        no está conectado y el sitio muestra el catálogo de demostración.
                    </p>
                ) : (
                    <>
                        <p className="scraper-desc">
                            {health?.ingestion?.lastRunAt
                                ? `Último ciclo: ${new Date(health.ingestion.lastRunAt).toLocaleString('es-CO')}.`
                                : 'Todavía no se ha registrado ningún ciclo de ingesta.'}
                            {health?.database?.persistent === false &&
                                ' Sin persistencia: un reinicio borrará lo ingerido.'}
                            {health?.ingestion?.failedFeeds?.length > 0 &&
                                ` Feeds con error: ${health.ingestion.failedFeeds.map((f) => f.feed).join(', ')}.`}
                        </p>

                        <div className="scraper-actions">
                            <button className="run-scrape-btn" onClick={handleRunIngestion} disabled={ingesting}>
                                {ingesting ? (
                                    <><Loader2 size={16} className="spin-icon" aria-hidden="true" /> Solicitando…</>
                                ) : (
                                    <><Download size={16} aria-hidden="true" /> Solicitar ciclo de ingesta</>
                                )}
                            </button>

                            {ingestMessage && (
                                <span className={`scraper-status tone-${ingestMessage.tone}`} role="status">
                                    {ingestMessage.text}
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>

            {errores?.errores?.length > 0 && (
                <div className="staging-queue-section errores-section">
                    <h2>Fallos en producción</h2>
                    <p className="reports-caption">
                        {errores.resumen.total} sin atender · {errores.resumen.ocurrencias}{' '}
                        ocurrencia{errores.resumen.ocurrencias === 1 ? '' : 's'}. Se agrupan por
                        tipo, no por vez: un fallo repetido suma en el contador en lugar de
                        llenar la lista. Marcar como atendido no lo borra, y si vuelve a
                        ocurrir reaparece solo.
                    </p>

                    <ul className="errores-list">
                        {errores.errores.map((e) => (
                            <li key={e.huella} className="error-row">
                                <div className="error-cabecera">
                                    <span className={`error-proceso error-proceso-${e.proceso}`}>
                                        {e.proceso === 'api' ? 'API' : 'motor'}
                                    </span>
                                    <span className="error-tipo">{e.tipo}</span>
                                    {e.veces > 1 && (
                                        <span className="error-veces" title="Ocurrencias agrupadas">
                                            ×{e.veces}
                                        </span>
                                    )}
                                    {e.ruta && <code className="error-ruta">{e.ruta}</code>}
                                </div>

                                <p className="error-mensaje">{e.mensaje}</p>

                                <div className="error-pie">
                                    <time dateTime={e.ultima_vez}>
                                        {new Date(e.ultima_vez).toLocaleString('es-CO')}
                                    </time>
                                    <button
                                        type="button"
                                        className="error-resolver"
                                        onClick={() => handleResolver(e.huella)}
                                        disabled={resolviendo === e.huella}
                                    >
                                        {resolviendo === e.huella ? 'Marcando…' : 'Marcar atendido'}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {reports?.stories?.length > 0 && (
                <div className="staging-queue-section">
                    <h2>Señalado por lectores</h2>
                    <p className="reports-caption">
                        Últimos 14 días. No son votos de validación: son pistas de dónde
                        mirar. Cada categoría corresponde con una pregunta abierta del
                        ROADMAP.
                    </p>

                    <ul className="reports-list">
                        {reports.stories.map((r) => (
                            <li key={r.story_id} className="report-row">
                                <Link to={`/noticia/${r.story_id}`} className="report-title">
                                    {r.title}
                                </Link>
                                <span className="report-tags">
                                    {r.historiasDistintas > 0 && (
                                        <span className="report-tag" title="F1-05: posible fusión incorrecta">
                                            hechos distintos agrupados · {r.historiasDistintas}
                                        </span>
                                    )}
                                    {r.medioMalClasificado > 0 && (
                                        <span className="report-tag" title="F1-13: revisión del sesgo declarado">
                                            medio mal clasificado · {r.medioMalClasificado}
                                        </span>
                                    )}
                                    {r.faltaIzquierda > 0 && (
                                        <span className="report-tag" title="F1-12: equilibrio del catálogo">
                                            falta izquierda · {r.faltaIzquierda}
                                        </span>
                                    )}
                                    {r.faltaDerecha > 0 && (
                                        <span className="report-tag" title="F1-12: equilibrio del catálogo">
                                            falta derecha · {r.faltaDerecha}
                                        </span>
                                    )}
                                    {r.conformes > 0 && (
                                        <span className="report-tag neutral">
                                            sin objeción · {r.conformes}
                                        </span>
                                    )}
                                    {/*
                                        Ráfaga: varios reportes concentrados en
                                        muy poco tiempo. No prueba coordinación
                                        —puede ser un enlace compartido— pero es
                                        justo el dato que hace desconfiar a
                                        tiempo, y sin él doce reportes en cuatro
                                        minutos se ven igual que doce en diez
                                        días.
                                    */}
                                    {r.problemas >= 3 && r.minutosDeRafaga !== null &&
                                     r.minutosDeRafaga < 30 && (
                                        <span className="report-tag alerta">
                                            {r.problemas} en {r.minutosDeRafaga} min — posible ráfaga
                                        </span>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="staging-queue-section">
                <h2>Cola de moderación</h2>

                {loading && pending.length === 0 ? (
                    <div className="empty-queue-alert" role="status">
                        <Loader2 size={40} className="spin-icon" aria-hidden="true" />
                        <p>Cargando la cola…</p>
                    </div>
                ) : pending.length === 0 ? (
                    <div className="empty-queue-alert">
                        <ShieldAlert size={48} className="empty-icon" aria-hidden="true" />
                        <h3>Nada retirado</h3>
                        <p>
                            Ninguna historia está oculta del sitio. Esta lista no es una cola de
                            espera: aquí aparecen las que hay que revisar por algún motivo
                            —normalmente porque un lector las señaló—, no todas las nuevas.
                        </p>
                    </div>
                ) : (
                    <div className="staging-list">
                        {pending.map((story) => (
                            <StoryCard
                                key={story.id}
                                story={story}
                                busy={busyId === story.id}
                                onDecide={handleDecide}
                            />
                        ))}
                    </div>
                )}
            </div>

            {decided.length > 0 && (
                <div className="staging-queue-section">
                    <h2>Decisiones recientes</h2>
                    <ul className="decided-list">
                        {decided.map((story) => (
                            <li key={story.id} className={`decided-row state-${story.state}`}>
                                <span className={`decided-badge state-${story.state}`}>
                                    {story.state === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                                </span>
                                <span className="decided-title">{story.title}</span>
                                <span className="decided-meta">
                                    {story.reviewer} · {new Date(story.decidedAt).toLocaleString('es-CO')}
                                    {story.reason && ` · ${story.reason}`}
                                </span>
                                <button
                                    type="button"
                                    className="admin-btn edit"
                                    onClick={() => handleDecide(story.id, 'pendiente')}
                                    disabled={busyId === story.id}
                                >
                                    <RotateCcw size={14} aria-hidden="true" /> Devolver a la cola
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

/**
 * Tarjeta de una historia en la cola.
 *
 * Muestra la cobertura por espectro porque es el dato que decide: una historia
 * con un solo medio no se puede contrastar, y saberlo antes de aprobarla evita
 * publicar como "cobertura contrastada" lo que es una nota suelta.
 */
const StoryCard = ({ story, busy, onDecide }) => {
    const total = story.coverage.left + story.coverage.center + story.coverage.right;

    return (
        <div className="staging-card">
            <div className="staging-card-meta">
                <span className="staging-id">{story.id}</span>
                <span className="staging-timestamp">
                    {story.publishedAt
                        ? new Date(story.publishedAt).toLocaleString('es-CO')
                        : 'sin fecha'}
                </span>
            </div>

            <div className="staging-card-view">
                <h3 className="staging-title">{story.title}</h3>
                <p className="staging-summary">
                    Titular de <strong>{story.titleSource ?? 'medio no catalogado'}</strong>.
                    Cita literal: no es editable.
                </p>

                <div className="staging-specs">
                    <span>Categoría: <strong>{story.category ?? '—'}</strong></span>
                    <span>Medios: <strong>{total}</strong></span>
                    <span>
                        Cobertura:{' '}
                        <strong>
                            {story.coverage.left} izq · {story.coverage.center} centro ·{' '}
                            {story.coverage.right} der
                        </strong>
                    </span>
                    {story.insufficientCoverage && (
                        <span className="staging-warning">
                            Cobertura insuficiente para afirmar un punto ciego
                        </span>
                    )}
                    {story.blindspotSpectrum && (
                        <span className="staging-warning">
                            Punto ciego: {story.blindspotSpectrum === 'left' ? 'izquierda' : 'derecha'}
                        </span>
                    )}
                </div>

                {/* Solo retirar. El botón «Aprobar» se quitó porque no hacía
                    nada: la historia ya estaba publicada antes de pulsarlo y
                    seguía igual después. Un botón de efecto nulo es peor que su
                    ausencia — invita a pulsarlo creyendo que sirve. */}
                <div className="staging-card-actions">
                    <div className="publish-actions">
                        <button
                            className="admin-btn reject"
                            onClick={() => onDecide(story.id, 'rechazada')}
                            disabled={busy}
                        >
                            <X size={14} aria-hidden="true" /> Retirar del sitio
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
