// @ts-check
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Info } from 'lucide-react';
import { fetchPanorama, isApiConfigured } from '../services/apiClient';
import { MEDIA_REGISTRY } from '../../shared/mediaRegistry';
import { repartoPorDueno, repartoPorEspectro, duenosParaLaMitad } from '../../shared/panorama.js';
import './PanoramaMediatico.css';

/**
 * EL ESPACIO MEDIÁTICO POR DUEÑO Y POR VOLUMEN — F3-16.
 *
 * Responde en cinco segundos la pregunta que el mapa cartesiano no puede
 * responder: ¿cuántos dueños hay detrás de lo que leo?
 *
 * DOS BARRAS Y UNA CIFRA, y el orden importa:
 *
 *   · Arriba, el espectro contado de dos formas. Por número de medios el
 *     catálogo parece casi repartido; por volumen publicado no. Poner las dos
 *     juntas es el argumento: contar cabezas esconde la asimetría.
 *
 *   · Debajo, el reparto por dueño. Es donde se ve que varias marcas distintas
 *     son un mismo propietario.
 *
 * NO SE USA UNA BIBLIOTECA DE GRÁFICOS. Son barras proporcionales: CSS basta, y
 * evita meter un tercero en una página cuyo argumento es la independencia. La
 * CSP del sitio tampoco permitiría cargarlo desde una CDN.
 */
const PanoramaMediatico = () => {
    const [conteos, setConteos] = useState(null);
    const [estado, setEstado] = useState(isApiConfigured ? 'cargando' : 'sin-datos');

    useEffect(() => {
        if (!isApiConfigured) return undefined;
        let vivo = true;

        fetchPanorama().then((r) => {
            if (!vivo) return;
            if (r.ok && r.medios.length) {
                setConteos(r.medios);
                setEstado('listo');
            } else {
                setEstado('sin-datos');
            }
        });

        return () => { vivo = false; };
    }, []);

    const datos = useMemo(() => {
        if (!conteos) return null;
        const dueños = repartoPorDueno(conteos, MEDIA_REGISTRY);
        return {
            dueños,
            espectro: repartoPorEspectro(conteos, MEDIA_REGISTRY),
            mitad: duenosParaLaMitad(dueños),
        };
    }, [conteos]);

    // Sin datos no se dibuja una barra vacía: una barra a cero se lee como «no
    // hay concentración», que es lo contrario de lo que significa.
    if (estado !== 'listo' || !datos || !datos.dueños.total) return null;

    const { dueños, espectro, mitad } = datos;

    return (
        <section className="panorama">
            <header className="panorama-header">
                <h2><Building2 size={18} aria-hidden="true" /> Quién publica lo que usted lee</h2>
                <p className="panorama-lede">
                    El mapa de arriba sitúa a cada medio, y le da a todos el mismo tamaño. Esto
                    los pesa por cuánto publican, que es lo que de verdad llega a una portada.
                </p>
            </header>

            <p className="panorama-titular">
                <strong>{mitad}</strong>{' '}
                {mitad === 1 ? 'dueño concentra' : 'dueños concentran'} la mitad de todo lo
                publicado en las últimas 72 horas.
            </p>

            <div className="panorama-bloque">
                <h3>El espectro, contado de dos formas</h3>
                <p className="panorama-nota">
                    La misma realidad medida de dos maneras. Si las dos filas no coinciden, la
                    primera está escondiendo algo.
                </p>

                {[
                    { clave: 'pctMedios', titulo: 'Por número de medios', unidad: 'medios' },
                    { clave: 'pctVolumen', titulo: 'Por volumen publicado', unidad: 'artículos' },
                ].map((fila) => (
                    <div key={fila.clave} className="panorama-fila">
                        <span className="panorama-fila-titulo">{fila.titulo}</span>
                        <div className="panorama-barra">
                            {espectro.map((banda) => (
                                banda[fila.clave] > 0 && (
                                    <div
                                        key={banda.id}
                                        className={`panorama-seg espectro-${banda.id}`}
                                        style={{ width: `${banda[fila.clave]}%` }}
                                        title={`${banda.label}: ${
                                            fila.clave === 'pctMedios' ? banda.medios : banda.articulos
                                        } ${fila.unidad} (${banda[fila.clave].toFixed(1)} %)`}
                                    >
                                        {banda[fila.clave] > 12 && (
                                            <span>{banda[fila.clave].toFixed(0)}%</span>
                                        )}
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                ))}

                <ul className="panorama-leyenda">
                    {espectro.map((banda) => (
                        <li key={banda.id}>
                            <span className={`panorama-punto espectro-${banda.id}`} aria-hidden="true" />
                            {banda.label}: {banda.medios} medios ·{' '}
                            {banda.articulos.toLocaleString('es-CO')} artículos
                        </li>
                    ))}
                </ul>
            </div>

            <div className="panorama-bloque">
                <h3>El mismo volumen, agrupado por dueño</h3>

                <div className="panorama-barra panorama-barra-duenos">
                    {dueños.grupos.map((g, i) => (
                        <div
                            key={g.grupoId}
                            className={`panorama-seg dueno-${i % 8} ${g.grupoId === 'sin-documentar' ? 'sin-documentar' : ''}`}
                            style={{ width: `${g.porcentaje}%` }}
                            title={`${g.label}: ${g.articulos.toLocaleString('es-CO')} artículos (${g.porcentaje.toFixed(1)} %)`}
                        />
                    ))}
                </div>

                <ol className="panorama-duenos">
                    {dueños.grupos.map((g, i) => (
                        <li key={g.grupoId}>
                            <span className={`panorama-punto dueno-${i % 8}`} aria-hidden="true" />
                            <span className="dueno-label">{g.label}</span>
                            <span className="dueno-pct">{g.porcentaje.toFixed(1)} %</span>
                            <span className="dueno-medios">
                                {g.medios.map((m) => m.nombre).join(' · ')}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>

            {/* Sin esta nota la vista afirmaría más de lo que el dato aguanta.
                No es letra pequeña: es la condición para publicarla. */}
            <p className="panorama-limite">
                <Info size={14} aria-hidden="true" />
                <span>
                    Esto mide <strong>presencia en nuestro corpus</strong>, no cuota de mercado ni
                    audiencia. El volumen sale de lo que cada medio expone en su canal público:
                    uno que publique poco ahí aparece pequeño sin serlo. La propiedad de cada
                    medio está documentada, con su fuente, en las fichas del{' '}
                    <Link to="/transparencia">apartado de transparencia</Link>.
                </span>
            </p>
        </section>
    );
};

export default PanoramaMediatico;
