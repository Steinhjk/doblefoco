import { BarChart3, ShieldCheck, UserCheck } from 'lucide-react';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../../lib/contacto';
import './Transparencia.css';

/**
 * Sección de /transparencia. Extraída de la página única el 2026-08-09 al
 * partirla en sub-páginas: eran ocho bloques largos bajo una sola URL.
 *
 * El texto NO se reescribió al mover —se partió con un script— para que el
 * cambio de estructura no arrastrara cambios de contenido sin querer.
 */
const TrDatos = () => (
    <>
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
        <h2><BarChart3 size={18} aria-hidden="true" /> Qué medimos de las visitas</h2>
        <p>
            Contamos visitas con <strong>Vercel Web Analytics</strong>, el servicio de la
            empresa que aloja el sitio. No usa cookies ni crea un perfil suyo: sabemos
            cuántas personas leyeron una página, desde qué país, con qué tipo de
            dispositivo y de qué sitio llegaron, <strong>no quién es usted</strong>. Para no
            contar dos veces a la misma persona en un día, Vercel usa una huella
            temporal que se descarta a las 24 horas.
        </p>
        <p>
            Antes de enviar una visita le quitamos a la dirección todo lo que va detrás
            del <code>?</code>, salvo las etiquetas <code>utm_</code> que dicen por dónde
            llegó un enlace compartido. Así, lo que usted escribe en el buscador no sale
            de su navegador.
        </p>
    </section>
    <section className="tr-section">
        <h2><UserCheck size={18} aria-hidden="true" /> Quién responde por sus datos</h2>
        <p>
            El responsable del tratamiento de los datos personales de este sitio es{' '}
            <strong>Jose Arbelaez</strong>, persona natural, en Colombia. La única
            finalidad es avisarle cuando exista el boletín al que se inscribió, y medir
            en conjunto cuántas personas leen el sitio.
        </p>
        <p>
            Para conocer, actualizar, corregir o borrar sus datos, o para retirar su
            autorización, escriba a <a href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a>. Si no le
            respondemos, puede acudir a la Superintendencia de Industria y Comercio.
        </p>
    </section>
    </>
);

export default TrDatos;
