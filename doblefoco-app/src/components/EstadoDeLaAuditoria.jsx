// @ts-check
import { useMemo } from 'react';
import { ClipboardCheck, Rss, Link2, SearchX, AlertTriangle } from 'lucide-react';
import {
    RED_HORAS,
    VERSION_AUDITORIA,
    estadosDe,
    peorEstado,
    porGravedad,
    resumirAuditoria,
} from '../../shared/auditoria.js';
import estadoAuditoria from '../../auditoria/estado.json';
import './EstadoDeLaAuditoria.css';

/**
 * LA AUDITORÍA, EN LA PANTALLA — el resultado de correr los chequeos, no la invitación a correrlos.
 *
 * Qué lo distingue del panel de al lado
 * -------------------------------------
 * `EstadoDelCatalogo` cuenta lo que el repositorio YA AFIRMA: cuándo dice cada
 * ficha que se comprobó, qué vigila el centinela. Es la declaración. Esto es la
 * COMPROBACIÓN: lo que salió de pedirle a cada medio su feed, sus fuentes y una
 * ruta que no existe. Uno dice lo que creemos y el otro lo que se midió, y
 * cuando discrepan la discrepancia es el hallazgo.
 *
 * De dónde salen los números
 * --------------------------
 * De `auditoria/estado.json`, que escribe `npm run auditoria` —a mano o desde el
 * flujo semanal— y que va versionado en el repositorio. Igual que el estado del
 * centinela: no hay endpoint, y no lo hay a propósito. Añadirlo obligaría a
 * desplegar Fly aparte de Vercel, que es justo el desfase que `desfase.yml`
 * vigila.
 *
 * Lo que se dice en voz alta, y no se disimula
 * --------------------------------------------
 * LA FECHA DE LA PASADA, siempre y arriba. Un panel de comprobaciones que no
 * dice cuándo comprobó es peor que ninguno: invita a leer como «está bien» lo
 * que en realidad es «estaba bien hace tres semanas». Y si la última pasada fue
 * parcial —de un solo medio, con `--medio=`— también se dice, porque entonces la
 * fecha solo vale para ese.
 */

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * El reloj se lee una vez al cargar el módulo y no en cada render: leerlo
 * durante el render es impuro, lo prohíbe la regla de lint del proyecto, y el
 * servidor y el navegador podrían calcular números distintos para el mismo HTML.
 */
const AHORA = Date.now();

const diasDesde = (fecha) => {
    if (!fecha) return null;
    const t = Date.parse(`${fecha}T00:00:00Z`);
    return Number.isNaN(t) ? null : Math.max(0, Math.round((AHORA - t) / DIA_MS));
};

/**
 * La palabra que se pinta, y su clase. **Palabra siempre**, color solo de apoyo:
 * en este proyecto el rojo y el azul están tomados por el espectro político, y
 * un medio en rojo se leería como un medio de izquierda.
 */
const ETIQUETA = {
    roto: { texto: 'roto', clase: 'es-roto' },
    revisar: { texto: 'revisar', clase: 'es-revisar' },
    'no-comprobable': { texto: 'no comprobable', clase: 'es-incognita' },
    sano: { texto: 'sano', clase: 'es-sano' },
};

const Estado = ({ estado }) => {
    const e = ETIQUETA[estado] ?? ETIQUETA['no-comprobable'];
    return <span className={`auditoria-estado ${e.clase}`}>{e.texto}</span>;
};

const EstadoDeLaAuditoria = () => {
    const datos = useMemo(() => {
        /*
         * SI EL FORMATO NO ES EL QUE ESPERAMOS, SE DICE Y NO SE PINTA NADA. Este
         * archivo lo escribe un bot cada semana; leerlo a ciegas es la manera de
         * que un cambio de formato reviente el panel de administración entero y
         * solo se descubra al abrirlo.
         */
        const compatible = estadoAuditoria?.version === VERSION_AUDITORIA;
        if (!compatible) return { compatible: false };

        const resumen = resumirAuditoria(estadoAuditoria);

        const filas = Object.entries(estadoAuditoria.medios ?? {})
            .map(([id, m]) => ({ id, ...m, peor: peorEstado(estadosDe(m)) }))
            .sort(
                (a, b) =>
                    porGravedad(a.peor, b.peor) || String(a.nombre).localeCompare(String(b.nombre)),
            );

        const pendientes = filas.filter((f) => f.peor !== 'sano');

        /*
         * El margen de la RED DE SEGURIDAD no clasifica a nadie —mientras el
         * motor viva, el reloj que manda es el suyo— pero sí se lista aparte:
         * son los medios que empezaríamos a perder el día que el motor se caiga
         * y solo quedara el cron de dos horas. Hoy nadie sabría decir cuáles son.
         */
        const enRiesgoSiCaeElMotor = filas
            .filter((f) => f.feed?.margenRed !== null && f.feed?.margenRed < 1)
            .sort((a, b) => a.feed.margenRed - b.feed.margenRed);

        return {
            compatible: true,
            resumen,
            pendientes,
            enRiesgoSiCaeElMotor,
            ultimaPasada: estadoAuditoria.ultimaPasada ?? null,
            dias: diasDesde(estadoAuditoria.ultimaPasada),
            parcial: Boolean(estadoAuditoria.parcial),
        };
    }, []);

    if (!datos.compatible) {
        return (
            <section className="auditoria">
                <div className="auditoria-cabecera">
                    <h2>
                        <ClipboardCheck size={18} aria-hidden="true" /> Auditoría del catálogo
                    </h2>
                    <p className="auditoria-aviso">
                        <AlertTriangle size={14} aria-hidden="true" /> El archivo{' '}
                        <code>auditoria/estado.json</code> no tiene el formato que este panel sabe
                        leer. <strong>No se muestra nada</strong>, que es mejor que mostrar cifras de
                        un formato que ya no es el nuestro. Vuelve a correr{' '}
                        <code>npm run auditoria</code>.
                    </p>
                </div>
            </section>
        );
    }

    const { resumen } = datos;

    return (
        <section className="auditoria">
            <div className="auditoria-cabecera">
                <h2>
                    <ClipboardCheck size={18} aria-hidden="true" /> Auditoría del catálogo
                </h2>
                <p>
                    Lo que salió de <strong>correr</strong> los chequeos: pedirle a cada medio su
                    feed, sus fuentes y una ruta que no existe. El panel de arriba dice lo que el
                    repositorio afirma; esto dice lo que se midió.
                </p>
                <p className="auditoria-cuando">
                    {datos.ultimaPasada ? (
                        <>
                            Última pasada: <strong>{datos.ultimaPasada}</strong>
                            {datos.dias !== null && (
                                <> ({datos.dias === 0 ? 'hoy' : `hace ${datos.dias} día(s)`})</>
                            )}
                            . Corre sola cada semana; a mano, <code>npm run auditoria</code>.
                        </>
                    ) : (
                        <>Todavía no se ha corrido ninguna pasada.</>
                    )}
                    {datos.parcial && (
                        <>
                            {' '}
                            <span className="auditoria-parcial">
                                <AlertTriangle size={13} aria-hidden="true" /> La última pasada fue
                                de un solo medio, así que esa fecha no vale para el resto.
                            </span>
                        </>
                    )}
                </p>
            </div>

            <div className="auditoria-cifras">
                <div className="auditoria-cifra">
                    <span className="cifra-num">{resumen.medios}</span>
                    <span className="cifra-lbl">Medios auditados</span>
                </div>
                <div className="auditoria-cifra">
                    <span className="cifra-num">{resumen.feedsRotos}</span>
                    <span className="cifra-lbl">Feeds rotos</span>
                </div>
                <div className="auditoria-cifra">
                    <span className="cifra-num">{resumen.feedsARevisar}</span>
                    <span className="cifra-lbl">Feeds a revisar</span>
                </div>
                <div className="auditoria-cifra">
                    <span className="cifra-num">{resumen.fuentesRotas}</span>
                    <span className="cifra-lbl">Fuentes que no resuelven</span>
                </div>
                <div className="auditoria-cifra">
                    <span className="cifra-num">{resumen.rutasTrampa}</span>
                    <span className="cifra-lbl">Sitios que responden 200 a todo</span>
                </div>
                <div className="auditoria-cifra">
                    <span className="cifra-num">{resumen.noComprobables}</span>
                    <span className="cifra-lbl">No comprobables desde aquí</span>
                </div>
            </div>

            {resumen.rescatadosPorUa > 0 && (
                <p className="auditoria-nota">
                    <SearchX size={14} aria-hidden="true" />{' '}
                    <strong>{resumen.rescatadosPorUa}</strong> medio(s) solo respondieron al
                    reintentar con el User-Agent limpio. Un puñado es normal; si un día son muchos,
                    lo que hay que revisar es nuestra cabecera y no sus servidores.
                </p>
            )}

            <div className="auditoria-bloque">
                <h3>
                    <AlertTriangle size={16} aria-hidden="true" /> Lo que pide una mirada
                </h3>

                {datos.pendientes.length === 0 ? (
                    <p className="auditoria-nota">
                        Nada. Los {resumen.medios} medios respondieron, sus fuentes resuelven y
                        ningún sitio contestó 200 a una ruta inventada.
                    </p>
                ) : (
                    <>
                        <p className="auditoria-nota">
                            Ordenado por lo que más urge. <strong>«No comprobable» no es un
                            aprobado</strong>: es que no se pudo saber desde donde corrió la pasada
                            —hay medios que responden desde una máquina de casa y fallan desde la
                            nube por la IP—.
                        </p>

                        <table className="auditoria-tabla">
                            <thead>
                                <tr>
                                    <th scope="col">Medio</th>
                                    <th scope="col">Estado</th>
                                    <th scope="col">Feed</th>
                                    <th scope="col">Qué mirar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datos.pendientes.map((f) => {
                                    const fuentesMal = (f.fuentes ?? []).filter(
                                        (s) => s.estado !== 'sano',
                                    );
                                    return (
                                        <tr key={f.id}>
                                            <td className="celda-medio">{f.nombre}</td>
                                            <td>
                                                <Estado estado={f.peor} />
                                            </td>
                                            <td className="celda-feed">
                                                {f.feed?.ventanaHoras !== null &&
                                                f.feed?.ventanaHoras !== undefined ? (
                                                    <>
                                                        <span title="ítems frescos sobre los que toma el motor">
                                                            {f.feed.frescos}/{f.feed.tomados}
                                                        </span>{' '}
                                                        <span
                                                            className="celda-tenue"
                                                            title="ventana que cubre el feed entero"
                                                        >
                                                            {f.feed.ventanaHoras} h
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="celda-tenue">—</span>
                                                )}
                                            </td>
                                            <td className="celda-motivo">
                                                {f.feed?.estado !== 'sano' && f.feed?.motivo && (
                                                    <span className="motivo">
                                                        <Rss size={12} aria-hidden="true" />{' '}
                                                        {f.feed.motivo}
                                                    </span>
                                                )}
                                                {f.rutas?.respondeATodo && (
                                                    <span className="motivo">
                                                        <SearchX size={12} aria-hidden="true" />{' '}
                                                        {f.rutas.motivo}
                                                    </span>
                                                )}
                                                {fuentesMal.map((s) => (
                                                    <span className="motivo" key={s.url}>
                                                        <Link2 size={12} aria-hidden="true" />{' '}
                                                        {s.motivo ?? s.estado}
                                                        <a
                                                            className="motivo-url"
                                                            href={s.url}
                                                            target="_blank"
                                                            rel="noreferrer noopener"
                                                        >
                                                            {s.url}
                                                        </a>
                                                    </span>
                                                ))}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </>
                )}

                <p className="auditoria-nota auditoria-nota-final">
                    {resumen.medios - datos.pendientes.length} medio(s) salieron sanos y no se
                    listan: una tabla de comprobaciones que enseña sobre todo lo que está bien se
                    deja de mirar.
                </p>
            </div>

            {datos.enRiesgoSiCaeElMotor.length > 0 && (
                <div className="auditoria-bloque">
                    <h3>
                        <Rss size={16} aria-hidden="true" /> Si el motor se cayera
                    </h3>
                    <p className="auditoria-nota">
                        Estos medios publican más de lo que cabe en un sondeo de {RED_HORAS} h, que
                        es la cadencia de la <strong>red de seguridad</strong> de GitHub Actions.
                        Mientras el motor viva no pasa nada —él sondea cada media hora—; el día que
                        se caiga, de estos empezaríamos a perder piezas <em>sin que nada lo dijera</em>.
                    </p>
                    <ul className="auditoria-riesgo">
                        {datos.enRiesgoSiCaeElMotor.map((f) => (
                            <li key={f.id}>
                                <span className="riesgo-nombre">{f.nombre}</span>
                                <span className="riesgo-dato">
                                    {f.feed.piezasPorDia} piezas/día · cabría {f.feed.margenRed}× en
                                    la red
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
};

export default EstadoDeLaAuditoria;
