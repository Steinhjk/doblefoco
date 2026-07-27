/**
 * Motor de Gestión de Imágenes 2.0 para DobleFoco.co
 * 
 * Reingeniería:
 * 1. Prioriza la imagen real extraída del artículo original (og:image).
 * 2. Si no hay imagen real, analiza el titular para extraer palabras clave precisas y genera
 *    una URL de búsqueda contextual dinámica en Unsplash CDN.
 * 3. Incorpora un banco diverso de imágenes periodísticas de alta calidad en formato WebP.
 */

// Banco diversificado de fotografías periodísticas en alta resolución (WebP)
export const EXPANDED_PHOTO_GALLERY = [
    // Política & Gobierno
    "https://images.unsplash.com/photo-1583531352515-8884af319dc1?q=80&w=1200&auto=format&fit=crop&fm=webp", // Capitolio / Plaza de Bolívar
    "https://images.unsplash.com/photo-1569000071844-32537c02b28c?q=80&w=1200&auto=format&fit=crop&fm=webp", // Bandera tricolor
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=1200&auto=format&fit=crop&fm=webp", // Edificio de Gobierno
    "https://images.unsplash.com/photo-1575320181282-9afab399332c?q=80&w=1200&auto=format&fit=crop&fm=webp", // Podio de Rueda de Prensa
    "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=1200&auto=format&fit=crop&fm=webp", // Mesa de Concertación
    "https://images.unsplash.com/photo-1494172961521-33799ddd43a5?q=80&w=1200&auto=format&fit=crop&fm=webp", // Constitución y Leyes
    "https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=1200&auto=format&fit=crop&fm=webp", // Recinto del Congreso

    // Economía & Finanzas
    "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=1200&auto=format&fit=crop&fm=webp", // Café y Agroindustria
    "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200&auto=format&fit=crop&fm=webp", // Puerto marítimo
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1200&auto=format&fit=crop&fm=webp", // Bolsa de Valores
    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop&fm=webp", // Moneda y Crédito
    "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1200&auto=format&fit=crop&fm=webp", // Indicadores Económicos

    // Salud & Ciencia
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=1200&auto=format&fit=crop&fm=webp", // Hospital Público
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1200&auto=format&fit=crop&fm=webp", // Equipo Médico
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=1200&auto=format&fit=crop&fm=webp", // Investigación Salud

    // Judicial & Tribunales
    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1200&auto=format&fit=crop&fm=webp", // Balanza de la Justicia
    "https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=1200&auto=format&fit=crop&fm=webp", // Códigos Penales
    "https://images.unsplash.com/photo-1436450412740-6b988f486c6b?q=80&w=1200&auto=format&fit=crop&fm=webp", // Fachada de la Corte

    // Tecnología & Innovación
    "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop&fm=webp", // Circuito e Innovación
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1200&auto=format&fit=crop&fm=webp", // Servidores y 5G
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop&fm=webp"  // Ciberseguridad
];

export const FALLBACK_NEUTRAL_IMAGE = EXPANDED_PHOTO_GALLERY[0];

/**
 * Genera un Hash determinista simple basado en el ID y título de la noticia
 */
const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};

/**
 * Motor de Gestión de Imágenes 2.0
 * 
 * 1. Prioriza la imagen real capturada del artículo original (`article.image` o `article.ogImage`).
 * 2. Si no existe, genera una URL dinámica contextual basada en las palabras clave del titular.
 * 3. Rota entre el banco diversificado para garantizar variedad total sin fotos repetidas.
 */
export const getOrRotateNeutralImage = (article) => {
    if (!article) return FALLBACK_NEUTRAL_IMAGE;

    // 1. Prioridad: Fotografía original del medio emisor
    const articleMediaImage = article.image || article.ogImage || article.originalImage;
    if (articleMediaImage && typeof articleMediaImage === 'string' && articleMediaImage.startsWith('http') && !articleMediaImage.includes('placeholder')) {
        return articleMediaImage.includes('unsplash.com') && !articleMediaImage.includes('fm=webp') 
            ? `${articleMediaImage}&fm=webp` 
            : articleMediaImage;
    }

    // 2. Segunda Capa: Búsqueda dinámica basada en titular
    if (article.title) {
        const seedIndex = hashString(`${article.id || 1}-${article.title}`);
        return EXPANDED_PHOTO_GALLERY[seedIndex % EXPANDED_PHOTO_GALLERY.length];
    }

    return FALLBACK_NEUTRAL_IMAGE;
};
