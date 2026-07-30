import { Link } from 'react-router-dom';
import { ShieldCheck, HandCoins, Eye, AlertTriangle, Mail } from 'lucide-react';
import { MEDIA_REGISTRY } from '../../shared/mediaRegistry';
import './Transparency.css';

/**
 * TRANSPARENCIA.
 *
 * Regla de esta página: no puede contener ninguna afirmación que el propio
 * sitio no cumpla hoy. Es la página donde más tienta escribir en futuro
 * ("contamos con", "garantizamos") y donde más caro sale.
 *
 * Las cifras se cuentan del catálogo. Los patrocinadores se listan desde
 * SPONSORS, que hoy está vacío a propósito: cuando no hay, se dice que no hay.
 */

const ACTIVE_FEEDS = MEDIA_REGISTRY.filter((m) => m.feed?.url).length;
const REVIEWED = MEDIA_REGISTRY.filter((m) => m.reviewedAt).length;

/**
 * Patrocinadores con acuerdo firmado.
 *
 * Vacío significa vacío: el proyecto se sostiene hoy sin financiación externa.
 * Cuando entre el primero, se añade aquí con monto y fecha, y aparece solo.
 */
const SPONSORS = [];

const Transparency = () => (
    <div className="transparency-page">
        <header className="tr-hero">
            <h1>Transparencia</h1>
            <p className="tr-lede">
                Un sitio que clasifica la línea editorial de otros medios está obligado a
                exponer la suya. Aquí está de dónde sale el dinero, qué hacemos con los
                datos, qué sabemos hacer y qué no.
            </p>
        </header>

        <section className="tr-section">
            <h2><Eye size={18} aria-hidden="true" /> Para qué existe DobleFoco</h2>
            <p>
                Cuando un hecho importa, distintos medios lo cuentan distinto: cambian el
                titular, el ángulo, a quién citan y qué omiten. Casi nadie tiene tiempo de
                abrir siete periódicos para notarlo. DobleFoco reúne esa cobertura en un
                mismo lugar y la muestra junta.
            </p>
            <p>
                El producto no es decirle a nadie qué pensar. Es enseñar quién está contando
                un hecho, quién no lo está contando, y con qué palabras. La ausencia de
                cobertura es información: cuando ningún medio de un sector publicó sobre
                algo, lo decimos en lugar de rellenar el hueco.
            </p>
            <p className="tr-scope">
                Hoy leemos los canales públicos de {ACTIVE_FEEDS} medios. Los titulares se
                citan literales y siempre con enlace al original. Nunca los reescribimos,
                ni siquiera para "neutralizarlos": editar la frase de otro y publicarla con
                su firma no es neutralizar.
            </p>
        </section>

        <section className="tr-section tr-manifesto">
            <h2><AlertTriangle size={18} aria-hidden="true" /> Declaración contra la posverdad</h2>

            <p className="tr-manifesto-lede">
                La manipulación informativa rara vez consiste en mentir. Casi siempre
                consiste en elegir: qué se cuenta, qué se calla, qué palabra se usa y a
                quién se le da el micrófono. Por eso una plataforma que quiera enfrentarla
                no puede limitarse a desmentir; tiene que hacer visible la elección.
            </p>

            <ol className="tr-principles">
                <li>
                    <strong>No publicamos nada que no podamos verificar contra su fuente.</strong>{' '}
                    Ni un titular, ni una cita, ni una cifra. Cuando falta un dato, se declara
                    que falta. Un hueco visible es honesto; uno rellenado con texto verosímil
                    es una falsificación, por bienintencionada que sea.
                </li>
                <li>
                    <strong>No corregimos las palabras de nadie.</strong> Medimos la carga
                    emocional de un titular y la anotamos aparte. El titular se muestra tal y
                    como lo escribió su redacción, con enlace para comprobarlo.
                </li>
                <li>
                    <strong>No fingimos precisión que no tenemos.</strong> Si una historia no
                    reúne fuentes suficientes para afirmar que existe un punto ciego, decimos
                    que no hay datos suficientes. Un porcentaje inventado sobre cuatro fuentes
                    no es un análisis: es ruido con aspecto de hallazgo.
                </li>
                <li>
                    <strong>Nuestras clasificaciones son discutibles y las publicamos como
                    tales.</strong> Clasificar la línea editorial de un medio real es la
                    afirmación más fuerte que hace este sitio. Cada valor lleva su
                    justificación escrita al lado, para que se pueda rebatir con argumentos.
                </li>
                <li>
                    <strong>Cuando nos equivoquemos, lo corregimos a la vista.</strong> Sin
                    borrar el error. El registro de lo que estuvo mal es parte de la
                    credibilidad, no una mancha que se limpia.
                </li>
            </ol>

            <p className="tr-manifesto-close">
                Nada de esto exige que usted nos crea. Exige que pueda comprobarlo, que es
                distinto y mucho mejor.
            </p>
        </section>

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
                Buscamos patrocinio institucional de $2.000.000 COP anuales, destinado a
                infraestructura, captura de feeds y mantenimiento. Las condiciones son
                públicas de antemano, y son estas:
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

        <section className="tr-section">
            <h2><ShieldCheck size={18} aria-hidden="true" /> Qué hacemos con sus datos</h2>
            <p>
                Si deja su correo en la lista de espera del boletín, ese correo se guarda y
                nada más: <strong>hoy no enviamos ningún correo</strong>, porque todavía no
                existe el boletín. Es una lista de espera y así se llama.
            </p>
            <p>
                Puede pedir que borremos su dato escribiendo a contacto@doblefoco.co, según
                la Ley 1581 de 2012 de protección de datos personales. No compartimos ni
                vendemos correos a terceros, y no aparecen en ninguna exportación pública
                del contenido del sitio.
            </p>
            <p>
                El sitio no usa rastreadores publicitarios. Sus preferencias de lectura y su
                historial se guardan en su propio navegador y no salen de él.
            </p>
        </section>

        <section className="tr-section">
            <h2><AlertTriangle size={18} aria-hidden="true" /> Lo que todavía no funciona</h2>
            <p>
                Esta lista existe porque un sitio sobre transparencia que solo cuenta sus
                aciertos ya está fallando en lo que promete.
            </p>
            <ul className="tr-limits">
                <li>
                    <strong>Ninguna de las {MEDIA_REGISTRY.length} clasificaciones está
                    firmada.</strong> {REVIEWED === 0 ? 'Cero' : REVIEWED} han pasado por
                    revisión editorial formal. Se publican marcadas como provisionales.
                </li>
                <li>
                    <strong>El catálogo está desequilibrado.</strong> Tenemos muchos más
                    medios de centro y centro-derecha que de izquierda. Eso hace que los
                    puntos ciegos hacia la izquierda sean más difíciles de detectar que los
                    del otro lado. Es una limitación real y afecta a lo que usted ve.
                </li>
                <li>
                    <strong>No verificamos si una noticia es cierta.</strong> No somos un
                    verificador de datos. Mostramos quién publica qué; la veracidad de cada
                    pieza es otro oficio.
                </li>
                <li>
                    <strong>Las fichas de propiedad están a medias.</strong> Once medios —los
                    de más peso en lo que se publica— ya tienen documentado quién los
                    controla, con la fuente al lado. Los demás siguen vacíos, y seguirán así
                    hasta poder citar dónde consta cada afirmación: saber quién es dueño de un
                    medio importa tanto como su línea editorial, y por eso mismo no se afirma
                    de oídas.
                </li>
            </ul>
            <p>
                El detalle de cómo clasificamos, con sus fórmulas y sus umbrales, está en la{' '}
                <Link to="/sobre-nosotros">metodología</Link>, y el catálogo completo con la
                justificación de cada medio, en el <Link to="/mapa-medios">mapa mediático</Link>.
            </p>
        </section>

        <section className="tr-section tr-contact">
            <h2><Mail size={18} aria-hidden="true" /> Corregirnos</h2>
            <p>
                Si cree que una clasificación está mal, escríbanos con ejemplos concretos de
                cobertura a <strong>contacto@doblefoco.co</strong>. Los valores están hechos
                para ser discutidos; por eso cada uno se publica con su argumento al lado.
            </p>
        </section>
    </div>
);

export default Transparency;
