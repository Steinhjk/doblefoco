import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { noNoticiososConHistoria } from '../lib/noNoticiosos';
import { rutaDeHistoria } from '../../shared/storyPath.js';
import './PanelNoNoticiosos.css';

/**
 * El acceso a los medios de investigación y análisis (M1.8).
 *
 * Por qué existe: el 2026-09-16 salieron del mapa mediático porque no compiten
 * en el ciclo diario, y un medio que desaparece de la vista sin que nadie diga
 * adónde fue se lee como silenciado. La nota del mapa explica su ausencia; este
 * panel les da entrada desde la portada.
 *
 * Cada medio enlaza a su propio sitio —DobleFoco no tiene página por medio— y,
 * si aparece en una historia de las cargadas, a esa historia, que es donde su
 * trabajo se ve junto al de los demás.
 *
 * Es el estilo actual a propósito: Jose lo metió en el MVP el 2026-09-28 y se
 * rehará con el frente estético. Por eso reutiliza las piezas del lateral y no
 * inventa ninguna.
 *
 * @param {{ stories: any[] }} props
 */
const PanelNoNoticiosos = ({ stories }) => {
    const filas = useMemo(() => noNoticiososConHistoria(stories), [stories]);

    return (
        <>
            <p className="panel-nn-nota">
                Su trabajo es la investigación y el análisis, no la noticia del día, así que
                no están en el <Link to="/mapa-medios">mapa de medios</Link>. Sí aparecen en
                las historias que cubren.
            </p>
            <ul className="panel-nn-lista">
                {filas.map(({ medio, historia }) => (
                    <li key={medio.id} className="panel-nn-item">
                        <a
                            href={`https://${medio.domain}`}
                            className="panel-nn-medio"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${medio.name} (abre su sitio en otra pestaña)`}
                        >
                            <span className="panel-nn-nombre">{medio.name}</span>
                            <ExternalLink size={12} aria-hidden="true" />
                        </a>
                        <span className="panel-nn-grupo">{medio.group}</span>
                        {historia && (
                            <Link to={rutaDeHistoria(historia)} className="panel-nn-historia">
                                En portada: {historia.title}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </>
    );
};

export default PanelNoNoticiosos;
