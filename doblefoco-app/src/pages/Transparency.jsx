import { Link } from 'react-router-dom';
import { ShieldCheck, HandCoins, Eye, AlertTriangle, Mail, Scale } from 'lucide-react';
import { MEDIA_REGISTRY } from '../../shared/mediaRegistry';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../lib/contacto';
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

        <section className="tr-section">
            <h2><Scale size={18} aria-hidden="true" /> Qué queremos decir con izquierda y derecha</h2>
            <p>
                Clasificamos <strong>organizaciones, no noticias</strong>. Cuando decimos que
                un medio se inclina hacia un lado no estamos calificando el artículo que usted
                acaba de leer: estamos describiendo un patrón sostenido en su cobertura. Estas
                son las definiciones con las que trabajamos, y publicarlas es la única forma
                de que usted pueda decir que están mal.
            </p>

            <dl className="tr-spectrum">
                <dt className="tr-spectrum-left">Izquierda</dt>
                <dd>
                    Cobertura que tiende a situar la causa de los problemas públicos en
                    estructuras —desigualdad, concentración de la propiedad, abandono
                    estatal—, que da relevancia sostenida a derechos laborales, protesta
                    social, medio ambiente y víctimas del conflicto, y que cita con más
                    frecuencia a organizaciones sociales, sindicatos y academia crítica.
                </dd>

                <dt className="tr-spectrum-right">Derecha</dt>
                <dd>
                    Cobertura que tiende a situar la causa de los problemas públicos en
                    decisiones individuales, en la acción del gobierno de turno o en la
                    inseguridad, que da relevancia sostenida a orden público, crecimiento
                    económico, empresa privada y gasto estatal, y que cita con más frecuencia
                    a fuentes oficiales de seguridad, gremios empresariales y centros de
                    pensamiento afines.
                </dd>

                <dt className="tr-spectrum-center">Orientación mixta</dt>
                <dd>
                    <strong>No significa neutral, imparcial ni objetivo — y tampoco significa
                    que no tenga línea.</strong> Todos los medios tienen una. Significa que la
                    suya no se sitúa en el eje izquierda-derecha, que es el único que aquí se
                    mide. La de un diario económico es el capital: clarísima, declarada, y sin
                    lugar en ese eje.
                    <br />
                    Esta banda se llamó «Sin línea marcada» hasta agosto de 2026, y se cambió
                    porque era falsa. Seis de los siete medios colombianos que caen aquí
                    pertenecen a grupos económicos —El Tiempo y Portafolio a Sarmiento Angulo,
                    Noticias Caracol a los Santo Domingo, La República a Ardila Lülle, Caracol
                    Radio y W Radio a Prisa—. Decir de ellos que no tienen línea marcada era
                    exactamente el falso equilibrio que este sitio existe para no producir.
                    Quién es dueño de cada uno está documentado, con su fuente, en el{' '}
                    <Link to="/mapa-medios">mapa mediático</Link>.
                    <br />
                    Tampoco se llama «Centro»: dar por sentado que existe un centro político
                    equivale a conceder que hay un punto neutral desde el cual se mira todo lo
                    demás, y eso es precisamente lo que este sitio no da por sentado.
                </dd>
            </dl>

            <p>
                Los valores numéricos, las bandas y los cuatro criterios con que se asigna cada
                uno —propiedad y estructura económica, selección de agenda, encuadre y balance
                de fuentes citadas— están en la{' '}
                <Link to="/sobre-nosotros">metodología</Link>.
            </p>
        </section>

        <section className="tr-section">
            <h2><ShieldCheck size={18} aria-hidden="true" /> Qué hacemos con sus datos</h2>
            <p>
                Si deja su correo en la lista de espera del boletín, ese correo se guarda y
                nada más: <strong>hoy no enviamos ningún correo</strong>, porque todavía no
                existe el boletín. Es una lista de espera y así se llama.
            </p>
            <p>
                Puede pedir que borremos su dato escribiendo a{' '}
                <a href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a>, según
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
                    <strong>El catálogo está desequilibrado, y más de lo que parece.</strong>{' '}
                    Contando medios, los de izquierda son cerca de un cuarto del catálogo.
                    Pesando lo que cada uno publica, son el 3 % de los artículos: siete veces
                    menos. Eso hace que los puntos ciegos hacia la izquierda sean mucho más
                    difíciles de detectar que los del otro lado, y afecta directamente a lo
                    que usted ve. Las dos cifras, una al lado de la otra, están en el{' '}
                    <Link to="/mapa-medios">mapa mediático</Link>.
                </li>
                <li>
                    <strong>No verificamos si una noticia es cierta.</strong> No somos un
                    verificador de datos. Mostramos quién publica qué; la veracidad de cada
                    pieza es otro oficio.
                </li>
                <li>
                    <strong>Falta un nombre propio.</strong> Todos los medios del catálogo
                    tienen documentado quién los controla, con la fuente al lado, y en los
                    colombianos el hilo llega hasta las personas. Con una excepción: de{' '}
                    <strong>Colombia Informa</strong> conocemos la razón social —Corporación
                    Colombia Informa, NIT 900.408.141-8—, cómo se financia y con qué red
                    trabaja, pero no quién la representa legalmente. Ese dato es público y está
                    en el RUES; hasta tenerlo en la mano no escribimos ningún nombre. Saber
                    quién es dueño de un medio importa tanto como su línea editorial, y por eso
                    mismo no se afirma de oídas.
                </li>
                <li>
                    <strong>Mandar no es lo mismo que poseer, y lo decimos.</strong> Cuando el
                    dueño es una institución —el Estado, un partido, una fundación— la pregunta
                    de quién manda no desaparece: se traslada a un cargo, y el cargo lo ocupa
                    alguien. Por eso nombramos también a quien dirige el medio público o el
                    semanario de un partido, siempre aclarando cuál de las dos cosas es.
                    Nombrar a los accionistas de los grandes grupos y dejar en «institución» a
                    los demás sería aplicar el escrutinio de forma desigual.
                </li>
                <li>
                    <strong>La propiedad documentada no es la propiedad real.</strong> Lo que
                    publicamos es lo que consta en fuentes consultables: quién figura como
                    accionista. Un testaferro, un acuerdo privado entre socios o una sociedad
                    en el exterior no aparecerían ahí, y no tenemos forma de verlos.
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
                cobertura a <a href={CONTACT_MAILTO}><strong>{CONTACT_EMAIL}</strong></a>. Los
                valores están hechos
                para ser discutidos; por eso cada uno se publica con su argumento al lado.
            </p>
        </section>
    </div>
);

export default Transparency;
