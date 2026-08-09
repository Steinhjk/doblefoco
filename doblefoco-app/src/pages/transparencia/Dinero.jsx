import { HandCoins } from 'lucide-react';
import './Transparencia.css';

/**
 * Sección de /transparencia. Extraída de la página única el 2026-08-09 al
 * partirla en sub-páginas: eran ocho bloques largos bajo una sola URL.
 *
 * El texto NO se reescribió al mover —se partió con un script— para que el
 * cambio de estructura no arrastrara cambios de contenido sin querer.
 */
/**
 * Patrocinadores con acuerdo firmado.
 *
 * Vacío significa vacío: el proyecto se sostiene hoy sin financiación externa.
 * Cuando entre el primero, se añade aquí con monto y fecha, y aparece solo.
 */
const SPONSORS = [];

const TrDinero = () => (
    <>
    <section className="tr-section">
        <h2><HandCoins size={18} aria-hidden="true" /> De dónde sale el dinero</h2>

        {SPONSORS.length === 0 ? (
            <div className="tr-callout">
                <p>
                    <strong>Hoy DobleFoco no tiene ningún patrocinador.</strong> El proyecto
                    se sostiene con recursos propios de quienes lo desarrollan. No hay
                    publicidad, no hay contenido pagado y no hay acuerdos con partidos,
                    campañas ni medios de los que aparecen en el catálogo.
                </p>
            </div>
        ) : (
            <ul className="tr-sponsors">
                {SPONSORS.map((sponsor) => (
                    <li key={sponsor.name}>
                        <strong>{sponsor.name}</strong> · {sponsor.amount} · desde {sponsor.since}
                    </li>
                ))}
            </ul>
        )}

        <h3>Si algún día lo tiene</h3>
        <p>
            Está abierta la posibilidad de recibir patrocinio institucional destinado a
            infraestructura, captura de feeds y mantenimiento. No hay una cifra fijada de
            antemano; lo que sí está fijado, y es lo que importa, son las condiciones bajo
            las que se aceptaría. Son públicas antes de que exista el primero:
        </p>
        <ul className="tr-conditions">
            <li>
                Todo patrocinador aparece en esta página con su nombre, el monto y la
                fecha. No existe el patrocinio discreto.
            </li>
            <li>
                El patrocinio no otorga influencia, veto ni injerencia sobre la línea
                editorial, sobre qué medios entran o salen del catálogo, sobre las
                clasificaciones de sesgo ni sobre qué noticias se muestran.
            </li>
            <li>
                No aceptamos dinero de partidos políticos, campañas electorales,
                entidades públicas con competencia sobre medios, ni de ningún medio
                incluido en el catálogo. Un agregador financiado por uno de los medios
                que clasifica no vale nada.
            </li>
            <li>
                Si un patrocinador aparece en una noticia del feed, no se le da trato
                distinto. Si alguna vez ocurriera lo contrario, esta página sería la
                primera en no poder sostenerse.
            </li>
        </ul>
    </section>
    </>
);

export default TrDinero;
