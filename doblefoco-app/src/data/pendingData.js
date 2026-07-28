// Fixture de la cola de moderación.
// Los ids eran 101, 102 y 103, que colisionan con noticias reales de
// mockData.js (ids 1..200). Al aprobar cualquiera de las tres, /noticia/101
// dejaba de mostrar la noticia original y React emitía warning de key
// duplicada. Ahora llevan prefijo, que además los hace reconocibles como
// datos de muestra.
export const pendingIngestionData = [
    {
        id: "demo_staging_101",
        title: "Reforma laboral entra en su recta final de aprobación legislativa con consensos mínimos",
        summary: "El Senado inicia la discusión del último bloque de artículos de la reforma laboral, centrándose en el recargo nocturno y los contratos de aprendizaje.",
        body: [
            "La plenaria del Senado colombiano agendó para esta semana el debate definitivo del proyecto de reforma laboral. Aunque el Gobierno logró concertar con los ponentes algunos artículos sobre estabilidad laboral reforzada, el gremio de comerciantes mantiene su rechazo.",
            "Los puntos de mayor fricción continúan siendo la hora de inicio del recargo nocturno (propuesta para las 7:00 PM) y el pago del 100% de los recargos dominicales, medidas que según Fenalco destruirían miles de empleos en hotelería, gastronomía y seguridad."
        ],
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop",
        category: "Economía",
        bias: -0.1,
        factuality: 0.9,
        timestamp: "Recién extraído (Hace 10 min)",
        sources: [
            { name: "Cambio", bias: -0.4 },
            { name: "Portafolio", bias: 0.2 },
            { name: "El Tiempo", bias: 0.1 }
        ],
        perspectives: {
            left: {
                source: "Cambio",
                headline: "Reforma laboral devolverá derechos históricos arrebatados a la clase trabajadora",
                snippet: "El proyecto dignificará la jornada laboral recuperando el pago completo del dominical y el recargo desde las 7 PM, terminando con décadas de precarización laboral impuesta."
            },
            center: {
                source: "El Tiempo",
                headline: "Senado debate último bloque de la reforma laboral: ¿Cuáles artículos se aprobarían?",
                snippet: "El Gobierno busca destrabar el proyecto negociando la gradualidad de los recargos para las micro y pequeñas empresas. Expertos alertan sobre la necesidad de un balance fiscal."
            },
            right: {
                source: "Portafolio",
                headline: "Fenalco advierte que reforma laboral provocará una ola de desempleo en el comercio formal",
                snippet: "El gremio comercial señala que encarecer la jornada nocturna forzará a miles de establecimientos a cerrar temprano y suspender la contratación de jóvenes y estudiantes de medio tiempo."
            }
        }
    },
    {
        id: "demo_staging_102",
        title: "Cancillería suspende licitación de pasaportes por presuntas faltas a la libre competencia",
        summary: "El Ministerio de Relaciones Exteriores detuvo provisionalmente el proceso licitatorio de pasaportes tras advertencias sobre pliegos de condiciones amañados.",
        body: [
            "El canciller anunció la suspensión de la licitación pública para el suministro y personalización de libretas de pasaportes. La decisión responde a observaciones de la Procuraduría y varios oferentes que alegaron que los requisitos favorecían desproporcionadamente a Thomas Greg & Sons.",
            "La empresa multinacional, que ha manejado el contrato durante los últimos años, afirmó que cumple con todas las garantías de seguridad y que los pliegos exigían certificaciones internacionales indispensables para un documento de seguridad nacional."
        ],
        image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=600&auto=format&fit=crop",
        category: "Política",
        bias: 0.0,
        factuality: 0.92,
        timestamp: "Recién extraído (Hace 15 min)",
        sources: [
            { name: "El Espectador", bias: -0.3 },
            { name: "La Silla Vacía", bias: -0.2 },
            { name: "Semana", bias: 0.5 }
        ],
        perspectives: {
            left: {
                source: "El Espectador",
                headline: "Cancillería frena licitación amarrada para acabar con monopolios históricos en pasaportes",
                snippet: "La suspensión busca abrir la contratación a nuevos oferentes internacionales y locales, garantizando que el dinero público no se asigne a pliegos diseñados a la medida de un solo contratista."
            },
            center: {
                source: "La Silla Vacía",
                headline: "Detrás de la suspensión de la licitación de pasaportes: pugnas y pliego de cargos",
                snippet: "El ente diplomático intenta blindar jurídicamente el proceso. Sin embargo, gremios advierten el riesgo latente de un desabastecimiento de libretas si la prórroga actual expira antes de adjudicar."
            },
            right: {
                source: "Semana",
                headline: "Improvisación total: Cancillería pone en riesgo la expedición de pasaportes por caprichos ideológicos",
                snippet: "La decisión de suspender un proceso técnico comprobado amenaza con desatar el caos en oficinas nacionales y consulados. Oposición advierte posibles demandas millonarias contra el Estado."
            }
        }
    },
    {
        id: "demo_staging_103",
        title: "Emergencia en el Chocó: Desbordamiento del río Atrato deja más de 5.000 familias damnificadas",
        summary: "Las lluvias torrenciales provocaron inundaciones severas en cabeceras municipales de Lloró y Medio Atrato, requiriendo auxilio humanitario inmediato.",
        body: [
            "La Unidad Nacional para la Gestión del Riesgo de Desastres (UNGRD) declaró la calamidad pública en el departamento del Chocó. El incremento del caudal del río Atrato inundó viviendas, cultivos de pancoger y escuelas locales.",
            "Líderes sociales solicitan la instalación urgente de albergues temporales y el envío de brigadas de salud para prevenir brotes epidémicos, denunciando que las ayudas del Gobierno central tardan días en arribar debido al mal estado de las vías fluviales."
        ],
        image: "https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=600&auto=format&fit=crop",
        category: "Ambiente",
        bias: -0.15,
        factuality: 0.95,
        timestamp: "Recién extraído (Hace 30 min)",
        sources: [
            { name: "El Espectador", bias: -0.3 },
            { name: "RCN Radio", bias: 0.1 },
            { name: "El Colombiano", bias: 0.3 }
        ],
        perspectives: {
            left: {
                source: "El Espectador",
                headline: "Chocó bajo el agua: el abandono geográfico y la desatención del cambio climático en el Atrato",
                snippet: "Las inundaciones demuestran la urgencia de reubicación y de planes de adaptación al cambio climático en las regiones con mayores índices de pobreza multidimensional de Colombia."
            },
            center: {
                source: "RCN Radio",
                headline: "UNGRD envía 10 toneladas de ayuda humanitaria a municipios afectados por inundaciones en Chocó",
                snippet: "La dirección del riesgo coordinó el despacho de kits de aseo, colchonetas y alimentos. Se evalúa el censo definitivo para coordinar subsidios temporales agrícolas."
            },
            right: {
                source: "El Colombiano",
                headline: "Desidia oficial agrava la tragedia invernal en el Chocó: damnificados claman por asistencia real",
                snippet: "Comunidades denuncian retrasos graves de la UNGRD en la entrega de suministros. Denuncian presuntas irregularidades en la contratación de botes y ayudas que no llegan a los corregimientos periféricos."
            }
        }
    }
];
