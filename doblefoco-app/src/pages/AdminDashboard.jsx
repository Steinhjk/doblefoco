import { useCallback, useEffect, useState } from 'react';
import {
    Check, X, ShieldAlert, Edit2, RotateCcw, Download,
    Loader2, Database, Activity, AlertTriangle, Users,
} from 'lucide-react';
import { pendingIngestionData } from '../data/pendingData';
import {
    exportContentBackup,
    exportSubscribersForOperator,
    getApprovedStories,
    getPendingStories,
    getWaitlistCount,
    saveApprovedStories,
    savePendingStories,
    subscribeToPending,
} from '../services/storageService';
import { fetchHealth, triggerIngestion, isApiConfigured } from '../services/apiClient';
import './AdminDashboard.css';

const AdminDashboard = () => {
    // Estado inicial leído en el render, no en un efecto: así el panel pinta
    // los datos correctos de una vez en lugar de vacío y luego relleno.
    const [pending, setPending] = useState(() => {
        const stored = getPendingStories();
        return stored.length ? stored : pendingIngestionData;
    });
    const [approved, setApproved] = useState(getApprovedStories);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState(null);

    const [health, setHealth] = useState(null);
    const [ingesting, setIngesting] = useState(false);
    const [ingestMessage, setIngestMessage] = useState(null);

    const loadPending = useCallback(() => {
        const stored = getPendingStories();
        setPending(stored.length ? stored : pendingIngestionData);
    }, []);

    // El efecto solo suscribe a cambios externos, que es para lo que sirven
    // los efectos. No siembra el estado inicial.
    useEffect(() => subscribeToPending(loadPending), [loadPending]);

    // Estado real del motor. Antes el panel mostraba un badge verde fijo que
    // decía "● Sincronización Automática Activa" estuviera el backend
    // encendido o apagado.
    useEffect(() => {
        if (!isApiConfigured) return undefined;

        let cancelled = false;
        const check = async () => {
            const result = await fetchHealth();
            if (!cancelled) setHealth(result.ok ? result.health : { status: 'inalcanzable' });
        };

        check();
        const timer = setInterval(check, 60_000);
        return () => { cancelled = true; clearInterval(timer); };
    }, []);

    const persistApproved = (list) => {
        setApproved(list);
        saveApprovedStories(list);
    };

    const persistPending = (list) => {
        setPending(list);
        savePendingStories(list);
    };

    const handleApprove = (storyId) => {
        const target = pending.find((s) => String(s.id) === String(storyId));
        if (!target) return;

        const finalStory =
            editingId === storyId && editData ? { ...target, ...editData } : { ...target };

        persistApproved([finalStory, ...approved]);
        persistPending(pending.filter((s) => String(s.id) !== String(storyId)));

        setEditingId(null);
        setEditData(null);
    };

    const handleReject = (storyId) => {
        persistPending(pending.filter((s) => String(s.id) !== String(storyId)));
        if (editingId === storyId) {
            setEditingId(null);
            setEditData(null);
        }
    };

    const handleRunIngestion = async () => {
        setIngesting(true);
        setIngestMessage(null);

        const result = await triggerIngestion();

        setIngesting(false);
        setIngestMessage(
            result.ok
                ? {
                    tone: 'ok',
                    text: `Ciclo completado: ${result.report?.newArticles ?? 0} artículos nuevos, ` +
                          `${result.report?.totalStories ?? 0} historias. ` +
                          `${result.report?.feedsFailed?.length ?? 0} feeds fallaron.`,
                }
                : { tone: 'error', text: result.error }
        );
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

    const handleRestore = () => {
        persistPending(pendingIngestionData);
        persistApproved([]);
        setEditingId(null);
        setEditData(null);
    };

    const updateField = (field, value) =>
        setEditData((prev) => ({ ...prev, [field]: value }));

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
                    <button className="restore-defaults-btn" onClick={exportContentBackup}>
                        <Database size={14} aria-hidden="true" /> Exportar contenido
                    </button>
                    <button className="restore-defaults-btn" onClick={handleExportSubscribers}>
                        <Users size={14} aria-hidden="true" /> Exportar lista de espera
                    </button>
                    <button className="restore-defaults-btn" onClick={handleRestore}>
                        <RotateCcw size={14} aria-hidden="true" /> Restaurar cola
                    </button>
                </div>
            </div>

            <div className="admin-storage-warning">
                <AlertTriangle size={16} aria-hidden="true" />
                <span>
                    Las aprobaciones se guardan <strong>solo en este navegador</strong>. No se
                    comparten con el equipo ni con los visitantes del sitio. Es un puente hasta
                    que exista la base de datos.
                </span>
            </div>

            <div className="admin-stats-summary">
                <div className="admin-stat-card">
                    <span className="stat-num">{pending.length}</span>
                    <span className="stat-lbl">Pendientes</span>
                </div>
                <div className="admin-stat-card">
                    <span className="stat-num">{approved.length}</span>
                    <span className="stat-lbl">Aprobadas</span>
                </div>
                <div className="admin-stat-card">
                    <span className="stat-num">{health?.database?.stories ?? '—'}</span>
                    <span className="stat-lbl">Historias en el motor</span>
                </div>
            </div>

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
                            {health?.ingestion?.failedFeeds?.length > 0 &&
                                ` Feeds con error: ${health.ingestion.failedFeeds.map((f) => f.feed).join(', ')}.`}
                        </p>

                        <div className="scraper-actions">
                            <button className="run-scrape-btn" onClick={handleRunIngestion} disabled={ingesting}>
                                {ingesting ? (
                                    <><Loader2 size={16} className="spin-icon" aria-hidden="true" /> Ejecutando ciclo…</>
                                ) : (
                                    <><Download size={16} aria-hidden="true" /> Forzar ciclo de ingesta</>
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

            <div className="staging-queue-section">
                <h2>Cola de moderación</h2>

                {pending.length === 0 ? (
                    <div className="empty-queue-alert">
                        <ShieldAlert size={48} className="empty-icon" aria-hidden="true" />
                        <h3>Cola vacía</h3>
                        <p>No hay noticias pendientes de revisión.</p>
                        <button className="secondary-restore-btn" onClick={handleRestore}>
                            Cargar cola de muestra
                        </button>
                    </div>
                ) : (
                    <div className="staging-list">
                        {pending.map((story) => {
                            const isEditing = editingId === story.id;
                            const active = isEditing ? editData : story;

                            return (
                                <div key={story.id} className="staging-card">
                                    <div className="staging-card-meta">
                                        <span className="staging-id">{story.id}</span>
                                        <span className="staging-timestamp">{story.timestamp}</span>
                                    </div>

                                    {isEditing ? (
                                        <div className="editing-form-container">
                                            <div className="form-group">
                                                <label htmlFor={`title-${story.id}`}>Título</label>
                                                <input
                                                    id={`title-${story.id}`}
                                                    type="text"
                                                    value={active.title}
                                                    onChange={(e) => updateField('title', e.target.value)}
                                                    className="admin-form-input"
                                                />
                                            </div>

                                            <div className="form-row-grid">
                                                <div className="form-group">
                                                    <label htmlFor={`cat-${story.id}`}>Categoría</label>
                                                    <select
                                                        id={`cat-${story.id}`}
                                                        value={active.category}
                                                        onChange={(e) => updateField('category', e.target.value)}
                                                        className="admin-form-select"
                                                    >
                                                        {['Política', 'Economía', 'Salud', 'Justicia', 'Medio Ambiente',
                                                          'Internacional', 'Educación', 'Tecnología', 'Infraestructura',
                                                          'Deportes'].map((c) => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Los titulares por espectro ya no son editables desde
                                                aquí: son citas literales de terceros. Editarlos era
                                                exactamente el mecanismo que permitía publicar
                                                titulares que ningún medio escribió. Lo que se puede
                                                corregir es la clasificación del medio, no lo que
                                                el medio dijo. */}
                                            <p className="editing-note">
                                                Los titulares de cada medio no son editables: son citas
                                                literales verificables contra su enlace original.
                                            </p>

                                            <div className="edit-actions-row">
                                                <button
                                                    className="cancel-edit-btn"
                                                    onClick={() => { setEditingId(null); setEditData(null); }}
                                                >
                                                    Cancelar
                                                </button>
                                                <button className="save-approve-btn" onClick={() => handleApprove(story.id)}>
                                                    <Check size={16} aria-hidden="true" /> Guardar y aprobar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="staging-card-view">
                                            <h3 className="staging-title">{story.title}</h3>
                                            <p className="staging-summary">{story.summary}</p>

                                            <div className="staging-specs">
                                                <span>Categoría: <strong>{story.category}</strong></span>
                                                <span>Fuentes: <strong>{story.sources?.length ?? 0}</strong></span>
                                            </div>

                                            <div className="staging-card-actions">
                                                <button
                                                    className="admin-btn edit"
                                                    onClick={() => { setEditingId(story.id); setEditData({ ...story }); }}
                                                >
                                                    <Edit2 size={14} aria-hidden="true" /> Editar
                                                </button>
                                                <div className="publish-actions">
                                                    <button className="admin-btn reject" onClick={() => handleReject(story.id)}>
                                                        <X size={14} aria-hidden="true" /> Rechazar
                                                    </button>
                                                    <button className="admin-btn approve" onClick={() => handleApprove(story.id)}>
                                                        <Check size={14} aria-hidden="true" /> Aprobar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
