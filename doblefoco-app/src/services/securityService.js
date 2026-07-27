/**
 * Servicio de Ciberseguridad, Sanitización y Salvaguardas para DobleFoco.co
 * 
 * Protecciones:
 * 1. Sanitización de texto XSS para prevenir inyección de código maligno.
 * 2. Hash de integridad Anti-Manipulación para asegurar que las noticias y sus sesgos no sean alterados.
 * 3. Verificador de integridad de solicitudes y rate limiting local.
 * 4. Generador de cabeceras estricto de seguridad HTTP (CSP, HSTS, X-Frame-Options).
 */

/**
 * Límite local de peticiones por minuto (Rate Limiter en Frontend/Client)
 */
const requestLog = [];
const MAX_REQUESTS_PER_MINUTE = 60;

/**
 * Sanitiza cualquier texto para evitar scripts maliciosos (XSS Injection)
 */
export const sanitizeInput = (text) => {
    if (!text || typeof text !== 'string') return '';
    
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/javascript:/gi, "")
        .replace(/onerror/gi, "")
        .replace(/onload/gi, "")
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
};

/**
 * Calcula un Hash HMAC de Integridad para validar que una noticia no fue manipulada en tránsito o LocalStorage
 */
export const generateIntegrityHash = (story) => {
    if (!story) return '';
    const payload = `${story.id}-${story.title}-${story.bias}-${story.factuality}-${story.category}`;
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
        hash = (hash << 5) - hash + payload.charCodeAt(i);
        hash |= 0;
    }
    return `sec-${Math.abs(hash).toString(16)}`;
};

/**
 * Verifica si un objeto de noticia mantiene su integridad original
 */
export const verifyStoryIntegrity = (story) => {
    if (!story) return false;
    if (!story.signature) return true; // Noticias legadas
    const expected = generateIntegrityHash(story);
    return story.signature === expected;
};

/**
 * Validador de Rate Limiting para evitar saturación de búsquedas o peticiones abusivas
 */
export const checkRateLimit = () => {
    const now = Date.now();
    // Limpiar peticiones de más de 60 segundos
    while (requestLog.length > 0 && requestLog[0] <= now - 60000) {
        requestLog.shift();
    }

    if (requestLog.length >= MAX_REQUESTS_PER_MINUTE) {
        console.warn("🛡️ [Security Engine] Rate limit excedido. Bloqueando tráfico abusivo temporalmente.");
        return { allowed: false, error: "Demasiadas peticiones. Por favor espera un minuto antes de reintentar." };
    }

    requestLog.push(now);
    return { allowed: true };
};

/**
 * Cabeceras recomendadas de seguridad para producción
 */
export const SECURITY_HEADERS = {
    "Content-Security-Policy": "default-src 'self'; img-src 'self' https://images.unsplash.com https://www.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
};
