import { ShieldCheck } from 'lucide-react';
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
    </>
);

export default TrDatos;
