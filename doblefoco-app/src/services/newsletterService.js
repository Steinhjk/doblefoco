/**
 * Lista de espera del boletín.
 *
 * Qué hacía antes y por qué se cambió
 * -----------------------------------
 * Este servicio guardaba el correo en localStorage, hacía `console.log` del
 * cuerpo del mensaje y devolvía a la interfaz: "Correo de bienvenida enviado
 * desde sincuentoco@gmail.com". No existe ni existió ningún envío. Era una
 * afirmación falsa al usuario sobre el tratamiento de su dato personal.
 *
 * Mientras no haya proveedor de correo conectado (tarea F3-05 del ROADMAP),
 * esto es explícitamente una LISTA DE ESPERA y así se le dice a la persona.
 */

const WAITLIST_KEY = 'doblefoco-newsletter-waitlist';

// La dirección vive en src/lib/contacto.js. Aquí solo se reexporta para no
// romper a quien ya la importaba desde este servicio.
export { CONTACT_EMAIL } from '../lib/contacto';

/** Validación razonable sin pretender cubrir todo el RFC 5322. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value) {
    return typeof value === 'string' && EMAIL_PATTERN.test(value.trim());
}

function readWaitlist() {
    try {
        const stored = localStorage.getItem(WAITLIST_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Registra un correo en la lista de espera local.
 *
 * Devuelve `emailSent: false` siempre, de forma explícita, para que ninguna
 * interfaz pueda afirmar lo contrario por descuido.
 */
export function joinWaitlist(rawEmail) {
    const email = String(rawEmail ?? '').trim().toLowerCase();

    if (!isValidEmail(email)) {
        return { ok: false, error: 'Escribe un correo electrónico válido.' };
    }

    try {
        const list = readWaitlist();
        const alreadyIn = list.some((entry) => entry.email === email);

        if (!alreadyIn) {
            list.push({ email, joinedAt: new Date().toISOString() });
            localStorage.setItem(WAITLIST_KEY, JSON.stringify(list));
        }

        return {
            ok: true,
            alreadyIn,
            emailSent: false,
            storedLocally: true,
            message: alreadyIn
                ? 'Ya estabas en la lista de espera.'
                : 'Quedaste en la lista de espera.',
        };
    } catch (error) {
        console.error('No se pudo guardar en la lista de espera', error);
        return { ok: false, error: 'Tu navegador no permitió guardar el registro.' };
    }
}

/** Número de inscritos, sin exponer las direcciones. */
export function getWaitlistCount() {
    return readWaitlist().length;
}
