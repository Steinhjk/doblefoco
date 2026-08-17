// @ts-check
import { useMemo } from 'react';
import { Layers, CalendarClock, Radar, CircleSlash } from 'lucide-react';
import { MEDIA_REGISTRY } from '../../shared/mediaRegistry.js';
import { OWNERSHIP_PROFILES } from '../../shared/mediaOwnership.js';
import { VIGILANCIA } from '../../shared/centinela.js';
import estadoCentinela from '../../centinela/estado.json';
import './EstadoDelCatalogo.css';

/**
 * ESTADO DEL CATÁLOGO — lo que las comprobaciones ya saben, sin tener que correrlas.
 *
 * Por qué existe
 * --------------
 * Las comprobaciones del proyecto —`check:registry`, `check:sources`, el
 * centinela— dicen la verdad pero solo cuando alguien se acuerda de ejecutarlas,
 * y cada una escupe su informe en una terminal que nadie vuelve a mirar. Esto es
 * lo contrario: **lo que ya está escrito en el repositorio, leído y contado en la
 * pantalla que se abre igualmente.**
 *
 * DE DÓNDE SALEN LOS NÚMEROS, Y POR QUÉ NO HAY LLAMADA A LA API
 * ------------------------------------------------------------
 * De `shared/` y de `centinela/estado.json`, que se empaquetan con el cliente.
 * No hay endpoint nuevo, y eso es deliberado: añadir uno obligaría a desplegar
 * Fly aparte de Vercel, que es exactamente el desfase que `desfase.yml` vigila.
 * El coste es que estas cifras son **las del último despliegue**, no las de este
 * segundo — y por eso el panel dice la fecha del estado en vez de aparentar que
 * está en vivo. Un panel que miente sobre su frescura es peor que no tenerlo.
 *
 * LO QUE ESTE PANEL NO HACE
 * -------------------------
 * No juzga. No dice qué ficha está bien: dice cuándo se miró por última vez y
 * qué falta por mirar. La lectura y la firma siguen siendo de una persona.
 */

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Días transcurridos desde una fecha `YYYY-MM-DD`. Sin fecha, `null`, que se
 * pinta como «—»: no saber cuántos días han pasado no es lo mismo que cero.
 */
function diasDesde(fecha, hoy) {
    if (!fecha || !hoy) return null;
    const t = Date.parse(`${fecha}T00:00:00Z`);
    return Number.isNaN(t) ? null : Math.max(0, Math.round((hoy - t) / DIA_MS));
}

/** Cuántas filas de la tabla se muestran antes del «y N más». */
const FILAS_VISIBLES = 12;

/**
 * El reloj se lee UNA vez, al cargar el módulo, y no en cada render.
 *
 * No es un atajo: leerlo durante el render es impuro —lo prohíbe la propia regla
 * de lint del proyecto— y además el servidor y el navegador podrían calcular
 * números distintos para el mismo HTML. Este panel es de administración y se
 * carga bajo demanda, así que «al abrir la página» es exactamente la precisión
 * que hace falta para contar días.
 */
const AHORA = Date.now();

const EstadoDelCatalogo = () => {
    const datos = useMemo(() => {
        const sinFirmar = MEDIA_REGISTRY.filter((m) => !m.reviewedAt).length;
        const fichas = Object.values(OWNERSHIP_PROFILES);
        const sinComprobar = fichas.filter((f) => !f.verifiedAt).length;

        /*
         * LA TABLA MIRA LAS 76 FICHAS, NO SOLO LAS DE AUSENCIA DECLARADA.
         *
         * La primera versión listaba únicamente las 15 con `ownerType: null` y
         * salían las quince diciendo «reciente», porque son justo las que se
         * acaban de dar de alta. Las que llevaban más tiempo sin mirarse eran las
         * OTRAS: 40 fichas con la misma fecha de comprobación y once que no
         * tienen fecha ninguna. Una tabla que ordena por antigüedad y esconde a
         * las antiguas no sirve de nada.
         *
         * Y NO SE INVENTA UN UMBRAL DE CADUCIDAD. No hay medida que respalde «a
         * los N días una ficha caduca», y lo poco medido va en contra: la de EL
         * DIARIO de Boyacá caducó en tres días. Así que se muestra el número y se
         * ordena por él; el juicio lo pone quien mira. El único estado que sí es
         * un defecto objetivo —y por eso es el único que se marca— es que una
         * ficha NO DIGA cuándo se comprobó: eso no se puede auditar.
         */
        const comprobaciones = MEDIA_REGISTRY.map((m) => {
            const ficha = OWNERSHIP_PROFILES[m.id];
            if (!ficha) return null;
            const fecha = ficha.consultadoEl ?? ficha.verifiedAt ?? null;
            return {
                id: m.id,
                nombre: m.shortName || m.name,
                fecha,
                dias: diasDesde(fecha, AHORA),
                ausencia: ficha.ownerType === null,
                falta: ficha.falta?.length ?? 0,
            };
        })
            .filter(Boolean)
            // Sin fecha primero: es el único defecto que esta tabla afirma.
            .sort((a, b) => {
                if (!a.fecha !== !b.fecha) return a.fecha ? 1 : -1;
                return String(a.fecha).localeCompare(String(b.fecha));
            });

        const sinFecha = comprobaciones.filter((c) => !c.fecha).length;
        const ausencias = comprobaciones.filter((c) => c.ausencia).length;

        const vigilados = Object.keys(VIGILANCIA).map((id) => {
            const medio = MEDIA_REGISTRY.find((m) => m.id === id);
            const guardado = estadoCentinela.medios?.[id];
            const consultas = VIGILANCIA[id].consultas.map(({ consulta, vigila }) => ({
                consulta,
                vigila,
                conocidas: guardado?.consultas?.[consulta]?.vistos?.length ?? 0,
            }));
            return {
                id,
                nombre: medio?.shortName || medio?.name || id,
                canal: guardado?.canal ?? null,
                ultima: guardado?.ultimaComprobacion ?? null,
                consultas,
            };
        });

        const ultimaPasada = vigilados
            .map((v) => v.ultima)
            .filter(Boolean)
            .sort()
            .at(-1);

        return {
            totalMedios: MEDIA_REGISTRY.length,
            sinFirmar,
            sinComprobar,
            comprobaciones,
            sinFecha,
            ausencias,
            vigilados,
            ultimaPasada,
            diasUltimaPasada: diasDesde(ultimaPasada, AHORA),
        };
    }, []);

    return (
        <section className="catalogo-estado">
            <div className="catalogo-cabecera">
                <h2>
                    <Layers size={18} aria-hidden="true" /> Estado del catálogo
                </h2>
                <p>
                    Lo que las comprobaciones ya saben, sin ejecutarlas. Sale de{' '}
                    <code>shared/</code> y de <code>centinela/estado.json</code>, así que{' '}
                    <strong>son las cifras del último despliegue</strong>, no las de este segundo.
                </p>
            </div>

            <div className="catalogo-cifras">
                <div className="catalogo-cifra">
                    <span className="cifra-num">{datos.totalMedios}</span>
                    <span className="cifra-lbl">Medios en el catálogo</span>
                </div>
                <div className="catalogo-cifra">
                    <span className="cifra-num">{datos.sinFirmar}</span>
                    <span className="cifra-lbl">Sin sesgo firmado</span>
                </div>
                <div className="catalogo-cifra">
                    <span className="cifra-num">{datos.sinComprobar}</span>
                    <span className="cifra-lbl">Propiedad sin comprobar</span>
                </div>
                <div className="catalogo-cifra">
                    <span className="cifra-num">{datos.ausencias}</span>
                    <span className="cifra-lbl">Con ausencia declarada</span>
                </div>
                <div className="catalogo-cifra">
                    <span className="cifra-num">{datos.sinFecha}</span>
                    <span className="cifra-lbl">Sin fecha de comprobación</span>
                </div>
                <div className="catalogo-cifra">
                    <span className="cifra-num">
                        {datos.vigilados.length}
                        <span className="cifra-de">/{datos.totalMedios}</span>
                    </span>
                    <span className="cifra-lbl">Vigilados por el centinela</span>
                </div>
            </div>

            <div className="catalogo-columnas">
                <div className="catalogo-bloque">
                    <h3>
                        <CalendarClock size={16} aria-hidden="true" /> Cuándo se comprobó cada ficha
                    </h3>
                    <p className="catalogo-nota">
                        Las {datos.totalMedios} fichas de propiedad, de la más antigua a la más
                        reciente. <strong>No es una medida de riesgo</strong> — la de EL DIARIO de
                        Boyacá caducó en tres días y la de La Libertad cambió entera en otros tres,
                        así que aquí no se inventa ningún umbral: se enseña el número. Lo único que
                        sí se marca es que una ficha <strong>no diga</strong> cuándo se comprobó,
                        porque eso no se puede auditar.
                    </p>

                    <table className="catalogo-tabla">
                        <thead>
                            <tr>
                                <th scope="col">Medio</th>
                                <th scope="col">Comprobado</th>
                                <th scope="col">Días</th>
                            </tr>
                        </thead>
                        <tbody>
                            {datos.comprobaciones.slice(0, FILAS_VISIBLES).map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        {c.nombre}
                                        {c.ausencia && (
                                            <span
                                                className="tabla-falta"
                                                title={`Propiedad no comprobada, declarada como tal · ${c.falta} cosa(s) por buscar`}
                                            >
                                                ausencia declarada
                                            </span>
                                        )}
                                    </td>
                                    <td className="tabla-fecha">
                                        {c.fecha ?? <span className="tabla-estado avisa">sin fecha</span>}
                                    </td>
                                    <td className="tabla-dias">{c.dias ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {datos.comprobaciones.length > FILAS_VISIBLES && (
                        <p className="catalogo-nota catalogo-nota-final">
                            Y {datos.comprobaciones.length - FILAS_VISIBLES} más, todas más recientes
                            que estas.
                        </p>
                    )}
                </div>

                <div className="catalogo-bloque">
                    <h3>
                        <Radar size={16} aria-hidden="true" /> Centinela
                    </h3>
                    <p className="catalogo-nota">
                        {datos.ultimaPasada ? (
                            <>
                                Última pasada guardada: <strong>{datos.ultimaPasada}</strong>
                                {datos.diasUltimaPasada !== null && (
                                    <> ({datos.diasUltimaPasada === 0 ? 'hoy' : `hace ${datos.diasUltimaPasada} día(s)`})</>
                                )}
                                . Corre sola los lunes y avisa por issue solo si hay algo nuevo.
                            </>
                        ) : (
                            <>Todavía no hay ninguna pasada guardada.</>
                        )}
                    </p>

                    <ul className="centinela-lista">
                        {datos.vigilados.map((v) => (
                            <li key={v.id}>
                                <div className="centinela-medio">
                                    <span className="centinela-nombre">{v.nombre}</span>
                                    {v.canal ? (
                                        <span className="centinela-canal">{v.canal}</span>
                                    ) : (
                                        <span className="centinela-canal sin">
                                            <CircleSlash size={12} aria-hidden="true" /> no comprobable
                                        </span>
                                    )}
                                </div>
                                <ul className="centinela-consultas">
                                    {v.consultas.map((c) => (
                                        <li key={c.consulta} title={c.vigila}>
                                            <span className="consulta-termino">«{c.consulta}»</span>
                                            <span className="consulta-num">{c.conocidas}</span>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>

                    <p className="catalogo-nota catalogo-nota-final">
                        El número de cada término son las piezas ya conocidas: sobre esa memoria se
                        decide qué es nuevo. «No comprobable» no es un aprobado — es que ese sitio
                        no se puede preguntar.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default EstadoDelCatalogo;
