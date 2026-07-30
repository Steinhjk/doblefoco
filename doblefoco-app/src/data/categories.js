/**
 * Categorías del sitio.
 *
 * Extraídas de src/data/mockData.js al retirarlo (F2-03). Son lo ÚNICO que
 * merecía sobrevivir de aquel archivo: definen la estructura de navegación del
 * sitio, no afirman nada sobre ningún medio ni sobre ninguna noticia.
 *
 * Todo lo demás que había allí —200 historias con 600 citas inventadas
 * atribuidas a 32 medios reales, y ocho "temas en tendencia" con contadores de
 * artículos fabricados— se eliminó.
 */

export const categories = [
    {
        "id": "ultimas",
        "name": "Últimas Noticias",
        "icon": "🗞️",
        "description": "Todo el catálogo, nacional e internacional."
    },
    {
        "id": "politica",
        "name": "Política",
        "icon": "🏛️",
        "description": "Congreso, altas cortes, gobierno y elecciones 2026."
    },
    {
        "id": "economia",
        "name": "Economía",
        "icon": "📈",
        "description": "Inflación, tasa de interés, divisas y finanzas públicas."
    },
    {
        "id": "salud",
        "name": "Salud",
        "icon": "🏥",
        "description": "Sistema de salud, EPS, ADRES y reformas públicas."
    },
    {
        "id": "ambiente",
        "name": "Medio Ambiente",
        "icon": "🌱",
        "description": "Transición energética, deforestación y biodiversidad."
    },
    {
        "id": "tecnologia",
        "name": "Tecnología",
        "icon": "💻",
        "description": "Inteligencia artificial, conectividad 5G y ciberseguridad."
    },
    {
        "id": "infraestructura",
        "name": "Infraestructura",
        "icon": "🛣️",
        "description": "Vías 4G/5G, puertos, aeropuertos y transporte fluvial."
    },
    {
        "id": "justicia",
        "name": "Justicia",
        "icon": "⚖️",
        "description": "Fiscalía, Corte Suprema, JEP y procesos judiciales."
    },
    {
        "id": "educacion",
        "name": "Educación",
        "icon": "🎓",
        "description": "Educación superior, ICETEX y formación regional."
    },
    {
        "id": "deportes",
        "name": "Deportes",
        "icon": "🏅",
        "description": "Selección Colombia, atletas olímpicos y liga profesional."
    },
    {
        "id": "internacional",
        "name": "Internacional",
        "icon": "🌎",
        "description": "Cobertura global y su impacto en Colombia."
    }
];
