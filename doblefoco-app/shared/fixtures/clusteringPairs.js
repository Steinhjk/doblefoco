/**
 * CONJUNTO DE PRUEBA DEL AGRUPAMIENTO — tarea F1-05.
 *
 * 72 pares de titulares REALES, extraídos del corpus el 2026-07-28 con muestreo
 * estratificado por bandas de similitud Jaccard entre 0,20 y 0,60. Solo pares
 * entre MEDIOS DISTINTOS, que es lo que interesa agrupar.
 *
 * REGLA DE ETIQUETADO, aplicada de forma uniforme:
 *   mismoHecho: true  solo si AMBOS titulares reportan el mismo suceso
 *                     concreto. Una reacción a un hecho es un hecho distinto
 *                     del hecho. Dos personas distintas reaccionando son dos
 *                     sucesos.
 *   Ante la duda → false. El ROADMAP establece que fusionar dos hechos es peor
 *   que separar uno, porque inventa una cobertura que no existe; el conjunto de
 *   prueba se inclina en esa misma dirección a propósito.
 *
 * QUIÉN ETIQUETÓ: las etiquetas las puso Claude en sesión con Jose el
 * 2026-07-28. NO son verdad revelada: son un juicio, y por eso están aquí en
 * texto plano, versionadas y con nota en los casos discutibles, para que
 * cualquiera pueda revisarlas y corregirlas. Si una etiqueta cambia, la métrica
 * cambia — así debe ser.
 *
 * Reparto: 53 mismo hecho · 19 hechos distintos
 */

export const CLUSTERING_PAIRS = [
    {
        "a": "¿Abelardo de la Espriella se posesionará en Cali? Radican en Senado propuesta para votar el cambio de ciudad",
        "medioA": "El Colombiano",
        "b": "Vuelve al Senado el debate para trasladar la posesión de Abelardo a Cali",
        "medioB": "La Silla Vacía",
        "mismoHecho": true,
        "jaccard": 0.214
    },
    {
        "a": "“Es mi mayor verdugo”: el crudo relato de Angie Rodríguez sobre la noche del 13 de enero cuando Petro la “presionó” para salir del Dapre",
        "medioA": "Semana",
        "b": "La versión de Petro: Angie Rodríguez es una mentirosa",
        "medioB": "La Silla Vacía",
        "mismoHecho": false,
        "jaccard": 0.214,
        "nota": "Su relato frente a la versión de él: dos declaraciones distintas."
    },
    {
        "a": "\"Vente Venezuela\", partido de Maria Corina Machado, convocó a movilizaciones",
        "medioA": "Blu Radio",
        "b": "Venezuela vive ola de protestas tras los terremotos: simpatizantes de María Corina Machado exigen respetar los resultados electorales de 2024",
        "medioB": "El Tiempo",
        "mismoHecho": false,
        "jaccard": 0.222
    },
    {
        "a": "Alcalde de Cali propone la Plaza de Cayzedo para recibir la posesión de Abelardo de la Espriella",
        "medioA": "Blu Radio",
        "b": "Las verdaderas razones detrás del cambio de sede en la posesión de Abelardo de la Espriella - CAMBIO Colombia",
        "medioB": "Cambio",
        "mismoHecho": false,
        "jaccard": 0.2,
        "nota": "Una propuesta concreta de plaza frente a un análisis de por qué cambió la sede."
    },
    {
        "a": "Angie Rodríguez no fue declarada insubsistente, pese a petición del presidente Petro: esta fue la razón",
        "medioA": "Portafolio",
        "b": "Mininterior designado arremete contra el presidente Petro por publicar el historial clínico de Angie Rodríguez como “un acto de venganza”",
        "medioB": "El Heraldo",
        "mismoHecho": false,
        "jaccard": 0.235
    },
    {
        "a": "Asociación Colombiana de Psiquiatría pide evitar señalamientos “peyorativos” al referirse a las enfermedades mentales",
        "medioA": "El Heraldo",
        "b": "Asociación Colombiana de Psiquiatría pide a Petro respetar la salud mental de Angie Rodríguez",
        "medioB": "El Colombiano",
        "mismoHecho": true,
        "jaccard": 0.25
    },
    {
        "a": "Congreso evalúa trasladar su sesión del 7 de agosto a Cali para el acto de posesión presidencial de Abelardo De La Espriella",
        "medioA": "Semana",
        "b": "Bancada del Pacto Histórico no iría a posesión de Abelardo de la Espriella: van a convocar marchas en Cali",
        "medioB": "El Colombiano",
        "mismoHecho": false,
        "jaccard": 0.222
    },
    {
        "a": "Desde Colombiamoda, el presidente electo Abelardo De La Espriella promete respaldo total al sector textil",
        "medioA": "Semana",
        "b": "De la Espriella anuncia apoyo al sector de la moda y la confección durante Colombiamoda 2026",
        "medioB": "El Heraldo",
        "mismoHecho": true,
        "jaccard": 0.2
    },
    {
        "a": "El presidente de Panamá aterriza en Perú para asistir a la investidura de Keiko Fujimori",
        "medioA": "Infobae Colombia",
        "b": "José Manuel Restrepo ya está en Perú para la posesión de Keiko Fujimori: así va la agenda",
        "medioB": "El Espectador",
        "mismoHecho": false,
        "jaccard": 0.214
    },
    {
        "a": "Fuerte terremoto de magnitud 7,1 sacude el sur de Japón y provoca una alerta de tsunami",
        "medioA": "Blu Radio",
        "b": "Fuerte terremoto en Japón deja decenas de heridos y daños en viviendas e infraestructura",
        "medioB": "La Opinión",
        "mismoHecho": true,
        "jaccard": 0.2
    },
    {
        "a": "Heridos y edificios colapsados tras terremoto de magnitud 7,1 en Japón",
        "medioA": "Caracol Radio",
        "b": "Videos muestran cómo se vivió el terremoto de 7,1 que sacudió Japón",
        "medioB": "El Colombiano",
        "mismoHecho": true,
        "jaccard": 0.2
    },
    {
        "a": "La revelación de Zinedine Zidane tras asumir como DT de Francia y la inesperada pregunta que surgió en su presentación",
        "medioA": "Infobae Colombia",
        "b": "Zinedine Zidane se prepara para dar rienda suelta a la potencia ofensiva de Francia",
        "medioB": "La República",
        "mismoHecho": true,
        "jaccard": 0.2,
        "nota": "Ambos cubren su presentación como técnico de Francia."
    },
    {
        "a": "Milei llama \"delincuente\" a Lula da Silva y eleva la tensión diplomática entre Brasil y Argentina",
        "medioA": "Euronews Español",
        "b": "El Gobierno de Argentina no pedirá disculpas por las críticas de Javier Milei a Lula da Silva",
        "medioB": "La República",
        "mismoHecho": false,
        "jaccard": 0.267,
        "nota": "El insulto y la negativa posterior a disculparse son dos desarrollos."
    },
    {
        "a": "No sean brutos: Petro cuestiona llamada entre Rodrigo Lara y Angie Rodríguez",
        "medioA": "La Opinión",
        "b": "“He decidido actuar penalmente”: Petro anuncia demanda contra Angie Rodríguez tras sus denuncias",
        "medioB": "El Heraldo",
        "mismoHecho": false,
        "jaccard": 0.2
    },
    {
        "a": "Petro pide declarar insubsistente a Angie Rodríguez por “razones psiquiátricas”",
        "medioA": "Blu Radio",
        "b": "Angie Rodríguez dice que Petro la señala por problemas psiquiátricos cuando “la persona que más necesita ayuda es él”",
        "medioB": "Semana",
        "mismoHecho": false,
        "jaccard": 0.2
    },
    {
        "a": "Precio del dólar en casas de cambio para el martes, 28 de julio de 2026",
        "medioA": "Semana",
        "b": "Últimas noticias | 28 julio 2026 - Tarde",
        "medioB": "Euronews Español",
        "mismoHecho": false,
        "jaccard": 0.2,
        "nota": "Par basura: cotización contra un boletín genérico."
    },
    {
        "a": "Soda Stereo vuelve a Medellín después de 31 años",
        "medioA": "El Colombiano",
        "b": "La banda de rock Soda Stereo anuncia dos fechas de conciertos en Bogotá y Medellín",
        "medioB": "La República",
        "mismoHecho": true,
        "jaccard": 0.231
    },
    {
        "a": "Un fuerte terremoto en el sur de Japón provoca cortes de electricidad y del transporte",
        "medioA": "La República",
        "b": "Fuerte terremoto en Japón deja decenas de heridos y daños en viviendas e infraestructura",
        "medioB": "La Opinión",
        "mismoHecho": true,
        "jaccard": 0.214
    },
    {
        "a": "¿Cuál es la enfermedad que tiene Angie Rodríguez?",
        "medioA": "Blu Radio",
        "b": "La versión de Petro: Angie Rodríguez es una mentirosa",
        "medioB": "La Silla Vacía",
        "mismoHecho": false,
        "jaccard": 0.333
    },
    {
        "a": "“El presidente Petro es mi mayor victimario”: Angie Rodríguez tras denunciar presunta corrupción en el Gobierno",
        "medioA": "El Colombiano",
        "b": "Angie Rodríguez denunció presunta red de mujeres con poder dentro del Gobierno Petro: “Mezcló el corazón con la política”",
        "medioB": "El País (Cali)",
        "mismoHecho": true,
        "jaccard": 0.278,
        "nota": "Ambos reportan su denuncia, con distinto entresacado."
    },
    {
        "a": "“Sede alterna del Gobierno es una oportunidad para destrabar obras en Barranquilla”: Concejal Vergara",
        "medioA": "El Heraldo",
        "b": "Barranquilla, como sede de gobierno",
        "medioB": "Semana",
        "mismoHecho": false,
        "jaccard": 0.333,
        "nota": "Declaración de un concejal frente a una columna de opinión."
    },
    {
        "a": "Abelardo de la Espriella realizará su posesión presidencial en la Arena USC de Cali",
        "medioA": "El País (Cali)",
        "b": "Esta es la proposición que busca trasladar a Cali la posesión de De la Espriella",
        "medioB": "KienyKe",
        "mismoHecho": false,
        "jaccard": 0.273,
        "nota": "Sede confirmada frente a la proposición para cambiar de ciudad."
    },
    {
        "a": "Angie Rodríguez no fue declarada insubsistente, pese a petición del presidente Petro: esta fue la razón",
        "medioA": "Portafolio",
        "b": "Presidente Gustavo Petro anuncia acciones legales contra Angie Rodríguez",
        "medioB": "Blu Radio",
        "mismoHecho": false,
        "jaccard": 0.308
    },
    {
        "a": "Bancada del Pacto Histórico no irá a la posesión de De la Espriella y anuncia resistencia en las calles",
        "medioA": "Portafolio",
        "b": "Petro, Cepeda y congresistas del Pacto Histórico no asistirán a la posesión de Abelardo De La Espriella, ¿por qué?",
        "medioB": "Semana",
        "mismoHecho": true,
        "jaccard": 0.286
    },
    {
        "a": "Congreso evalúa trasladar su sesión del 7 de agosto a Cali para el acto de posesión presidencial de Abelardo De La Espriella",
        "medioA": "Semana",
        "b": "Vuelve al Senado el debate para trasladar la posesión de Abelardo a Cali",
        "medioB": "La Silla Vacía",
        "mismoHecho": true,
        "jaccard": 0.286
    },
    {
        "a": "De la Espriella se pronuncia sobre las explosivas declaraciones de Angie Rodríguez",
        "medioA": "Noticias RCN",
        "b": "¿Cuál es la enfermedad que tiene Angie Rodríguez?",
        "medioB": "Blu Radio",
        "mismoHecho": false,
        "jaccard": 0.286,
        "nota": "Su pronunciamiento frente a una pieza explicativa sobre la enfermedad."
    },
    {
        "a": "El mensaje de Mauricio Gaona tras ser designado por Abelardo de la Espriella como embajador de Colombia ante la ONU",
        "medioA": "Semana",
        "b": "De la Espriella anuncia al jurista Mauricio Gaona como embajador ante las Naciones Unidas",
        "medioB": "El Colombiano",
        "mismoHecho": true,
        "jaccard": 0.308,
        "nota": "Ambos reportan la designación; uno añade su mensaje posterior."
    },
    {
        "a": "Fuerte terremoto de 7,1 sacude el sur de Japón; hay más de 50 heridos y 12 edificios derrumbados",
        "medioA": "El País (Cali)",
        "b": "Alerta de tsunami tras un fuerte terremoto en el suroeste de Japón",
        "medioB": "Euronews Español",
        "mismoHecho": true,
        "jaccard": 0.273
    },
    {
        "a": "Hallan con vida a un oficial y tres patrulleros de la Policía reportados como desaparecidos en El Tambo, Cauca",
        "medioA": "El Tiempo",
        "b": "Fueron encontrados con vida los cuatro policías que estaban desaparecidos en el Tambo, Cauca",
        "medioB": "Infobae Colombia",
        "mismoHecho": true,
        "jaccard": 0.286
    },
    {
        "a": "Juicio por Loan Peña, en vivo: todas las declaraciones y las últimas noticias hoy 28 de julio",
        "medioA": "Infobae Colombia",
        "b": "Últimas noticias | 28 julio 2026 - Tarde",
        "medioB": "Euronews Español",
        "mismoHecho": false,
        "jaccard": 0.273,
        "nota": "Juicio en Argentina contra un boletín genérico."
    },
    {
        "a": "Los incendios forestales ponen a prueba a los bomberos de Europa",
        "medioA": "DW Español",
        "b": "Los incendios ponen a prueba a Francia y España ante una nueva ola de calor",
        "medioB": "Euronews Español",
        "mismoHecho": true,
        "jaccard": 0.273
    },
    {
        "a": "No sean brutos: Petro cuestiona llamada entre Rodrigo Lara y Angie Rodríguez",
        "medioA": "La Opinión",
        "b": "La versión de Petro: Angie Rodríguez es una mentirosa",
        "medioB": "La Silla Vacía",
        "mismoHecho": false,
        "jaccard": 0.273,
        "nota": "Dos declaraciones distintas de Petro el mismo día."
    },
    {
        "a": "Policía activa brigadas especiales en Cali para reforzar recompensa de $200 millones por el caso de María Camila Potosí",
        "medioA": "El País (Cali)",
        "b": "Activan brigadas especiales para hallar a los asesinos de María Camila Potosí y a su bebé de 8 meses de gestación desaparecida en la ladera de Cali",
        "medioB": "El Tiempo",
        "mismoHecho": true,
        "jaccard": 0.286
    },
    {
        "a": "Posesión presidencial de Abelardo De la Espriella el 7 de agosto en Cali sería en el centro de eventos Arena USC",
        "medioA": "El Heraldo",
        "b": "Confirman lugar de posesión del presidente Abelardo De La Espriella: será en el UCS Arena, auditorio de la Universidad Santiago de Cali",
        "medioB": "Semana",
        "mismoHecho": true,
        "jaccard": 0.278
    },
    {
        "a": "Terremoto de 7,1 en Japón deja 50 heridos, edificios colapsados y miles de personas sin electricidad",
        "medioA": "El Colombiano",
        "b": "Decenas de personas quedaron atrapadas en un centro comercial del sur de Japón tras el fuerte terremoto de magnitud 7,1: hay más edificios colapsados",
        "medioB": "El Tiempo",
        "mismoHecho": true,
        "jaccard": 0.294
    },
    {
        "a": "Un fuerte terremoto en el sur de Japón provoca cortes de electricidad y del transporte",
        "medioA": "La República",
        "b": "Alerta de tsunami tras un fuerte terremoto en el suroeste de Japón",
        "medioB": "Euronews Español",
        "mismoHecho": true,
        "jaccard": 0.273
    },
    {
        "a": "¿Dónde será la posesión presidencial de De La Espriella en Cali? Opciones y detalles claves",
        "medioA": "Vanguardia",
        "b": "Abelardo de la Espriella realizará su posesión presidencial en la Arena USC de Cali",
        "medioB": "El País (Cali)",
        "mismoHecho": true,
        "jaccard": 0.364
    },
    {
        "a": "“La salud mental no es un argumento de desacreditación”: el mensaje de los psiquiatras tras caso Angie Rodríguez",
        "medioA": "Vanguardia",
        "b": "“La salud mental no se usa para desacreditar”: duro mensaje de psiquiatras a Petro por revelar la historia clínica de Angie Rodríguez",
        "medioB": "Semana",
        "mismoHecho": true,
        "jaccard": 0.375
    },
    {
        "a": "Abelardo de la Espriella designa a Mauricio Gaona como embajador de Colombia ante la ONU",
        "medioA": "El Espectador",
        "b": "¿Quién es Mauricio Gaona, el nuevo embajador de Colombia ante las Naciones Unidas?",
        "medioB": "KienyKe",
        "mismoHecho": true,
        "jaccard": 0.364
    },
    {
        "a": "Abelardo De la Espriella ratifica en el sur del Atlántico obras para reactivar el Canal del Dique y anuncia una ofensiva contra la inseguridad",
        "medioA": "El Tiempo",
        "b": "Así reaccionaron desde el Caribe tras el anuncio de Abelardo De La Espriella de reactivar obras del Canal del Dique",
        "medioB": "Semana",
        "mismoHecho": false,
        "jaccard": 0.375,
        "nota": "El anuncio frente a las reacciones al anuncio."
    },
    {
        "a": "Angie Rodríguez no fue declarada insubsistente, pese a petición del presidente Petro: esta fue la razón",
        "medioA": "Portafolio",
        "b": "MinHacienda contradice a Petro tras no declarar “insubsistente” a Angie Rodríguez como él pidió: esta es la razón",
        "medioB": "El Colombiano",
        "mismoHecho": true,
        "jaccard": 0.385
    },
    {
        "a": "Arena USC sería el escenario para la posesión presidencial de De la Espriella",
        "medioA": "La República",
        "b": "Revelan el lugar donde sería la posesión presidencial de Abelardo de la Espriella en Cali",
        "medioB": "La Opinión",
        "mismoHecho": true,
        "jaccard": 0.364
    },
    {
        "a": "Condenan a más de 20 años de prisión a Hernán Giraldo, exjefe paramilitar, por abusos sexuales contra tres menores",
        "medioA": "El Heraldo",
        "b": "21 años de cárcel a exjefe paramilitar Giraldo Serna por abuso de menores",
        "medioB": "El Nuevo Siglo",
        "mismoHecho": true,
        "jaccard": 0.357
    },
    {
        "a": "Contraloría detectó hallazgos fiscales por $176.795 millones en el FOMAG",
        "medioA": "El País (Cali)",
        "b": "Modelo de salud implementado por Petro para los maestros deja hallazgos fiscales por $176.795 millones",
        "medioB": "Portafolio",
        "mismoHecho": true,
        "jaccard": 0.357
    },
    {
        "a": "Cuba reacciona al anuncio de Abelardo De la Espriella de romper relaciones bilaterales: “Es una acción hostil”",
        "medioA": "El Heraldo",
        "b": "Cuba responde a Abelardo De La Espriella tras anuncio de ruptura de relaciones con la dictadura de la isla",
        "medioB": "Semana",
        "mismoHecho": true,
        "jaccard": 0.357
    },
    {
        "a": "Defensa de alias ‘Papá Pitufo’ denuncia penalmente a Petro por injuria y calumnia",
        "medioA": "El Heraldo",
        "b": "Papá Pitufo denunció al presidente Gustavo Petro por los delitos de injuria y calumnia",
        "medioB": "Semana",
        "mismoHecho": true,
        "jaccard": 0.385
    },
    {
        "a": "El mensaje de Mauricio Gaona tras ser designado por Abelardo de la Espriella como embajador de Colombia ante la ONU",
        "medioA": "Semana",
        "b": "Mauricio Gaona, nuevo embajador de Colombia ante la ONU en Nueva York",
        "medioB": "El Nuevo Siglo",
        "mismoHecho": true,
        "jaccard": 0.417
    },
    {
        "a": "Fiscalía judicializa a exviceministro de Defensa por presuntas irregularidades en millonario contrato de helicópteros MI-17",
        "medioA": "El Tiempo",
        "b": "Fiscalía imputó a exviceministro de Defensa del gobierno Petro por contrato de helicópteros",
        "medioB": "El País (Cali)",
        "mismoHecho": true,
        "jaccard": 0.417
    },
    {
        "a": "Fuerte terremoto de magnitud 7,1 sacude el sur de Japón y provoca una alerta de tsunami",
        "medioA": "Blu Radio",
        "b": "Terremoto de magnitud 7,1 sacude el sur de Japón y deja al menos un muerto",
        "medioB": "KienyKe",
        "mismoHecho": true,
        "jaccard": 0.417
    },
    {
        "a": "José Manuel Restrepo, ya está en Lima: participará en la toma de posesión de Keiko Fujimori",
        "medioA": "Semana",
        "b": "Vicepresidente electo, José Manuel Restrepo, llegó a Perú para representar al gobierno de Abelardo De La Espriella en la posesión de Keiko Fujimori",
        "medioB": "El Tiempo",
        "mismoHecho": true,
        "jaccard": 0.353
    },
    {
        "a": "La Presidencia ya firmó los contratos para la posesión de De la Espriella: esto costará",
        "medioA": "El Espectador",
        "b": "Revelan cuánto costará la posesión de Abelardo de la Espriella: ya firmaron los contratos",
        "medioB": "La FM",
        "mismoHecho": true,
        "jaccard": 0.364
    },
    {
        "a": "Mauricio Gaona será el embajador de Colombia ante las Naciones Unidas en el gobierno de De la Espriella",
        "medioA": "El Heraldo",
        "b": "Abelardo De La Espriella ya eligió a su embajador ante la ONU: este es Mauricio Gaona",
        "medioB": "Vanguardia",
        "mismoHecho": true,
        "jaccard": 0.364
    },
    {
        "a": "Petro pidió declarar insubsistente a Angie Rodríguez tras sus denuncias sobre presuntas irregularidades en el Gobierno",
        "medioA": "La FM",
        "b": "Petro pide declarar insubsistente a Angie Rodríguez por “razones psiquiátricas”",
        "medioB": "Blu Radio",
        "mismoHecho": true,
        "jaccard": 0.385
    },
    {
        "a": "Terremoto de magnitud 7,1 sacude Japón y deja varios heridos",
        "medioA": "Vanguardia",
        "b": "Fuerte terremoto de 7,1 sacude el sur de Japón; hay más de 50 heridos y 12 edificios derrumbados",
        "medioB": "El País (Cali)",
        "mismoHecho": true,
        "jaccard": 0.364
    },
    {
        "a": "¿Por qué Lula y Milei vuelven a enfrentarse y qué papel juega el hijo de Jair Bolsonaro en la nueva crisis diplomática entre Brasil y Argentina?",
        "medioA": "El Tiempo",
        "b": "Nueva crisis diplomática Argentina-Brasil por insultos de Milei contra Lula",
        "medioB": "France 24 Español",
        "mismoHecho": true,
        "jaccard": 0.467
    },
    {
        "a": "“Nos confirmó que ha sido amenazada”: Rodrigo Lara sobre Angie Rodríguez",
        "medioA": "El Universal",
        "b": "Angie Rodríguez fue amenazada por denunciar irregularidades: Rodrigo Lara",
        "medioB": "La Opinión",
        "mismoHecho": true,
        "jaccard": 0.5
    },
    {
        "a": "Abelardo de la Espriella designa a Mauricio Gaona como embajador de Colombia ante la ONU",
        "medioA": "El Espectador",
        "b": "Mauricio Gaona será el embajador de Colombia ante las Naciones Unidas en el gobierno de De la Espriella",
        "medioB": "El Heraldo",
        "mismoHecho": true,
        "jaccard": 0.455
    },
    {
        "a": "Abelardo de la Espriella designó a Mauricio Gaona como embajador de Colombia ante la ONU: así se oficializó su nombramiento",
        "medioA": "Infobae Colombia",
        "b": "De la Espriella nombra a Mauricio Gaona embajador de Colombia ante la ONU",
        "medioB": "Portafolio",
        "mismoHecho": true,
        "jaccard": 0.5
    },
    {
        "a": "Abelardo De La Espriella designó a Mauricio Gaona como embajador de Colombia ante las Naciones Unidas",
        "medioA": "Semana",
        "b": "Abelardo De La Espriella ya eligió a su embajador ante la ONU: este es Mauricio Gaona",
        "medioB": "Vanguardia",
        "mismoHecho": true,
        "jaccard": 0.455
    },
    {
        "a": "Angie Rodríguez critica a Petro por revelar su historia clínica y dice que quien necesita ayuda psicológica es él",
        "medioA": "Portafolio",
        "b": "Lara critica a Petro por revelar historia clínica de Angie Rodríguez: fue un “acto de venganza”",
        "medioB": "El Colombiano",
        "mismoHecho": false,
        "jaccard": 0.5,
        "nota": "Dos personas distintas criticando lo mismo: reacciones separadas."
    },
    {
        "a": "Brasil y Corea del Sur crearon un grupo de trabajo para destrabar acuerdo comercial con el Mercosur",
        "medioA": "Infobae Colombia",
        "b": "Brasil y Corea del Sur avanzan en negociaciones para un acuerdo comercial con el Mercosur",
        "medioB": "La República",
        "mismoHecho": true,
        "jaccard": 0.5
    },
    {
        "a": "Congreso evalúa trasladar su sesión del 7 de agosto a Cali para el acto de posesión presidencial de Abelardo De La Espriella",
        "medioA": "Semana",
        "b": "Radicaron proposición en el Senado para trasladar sesión a Cali por posesión de Abelardo De la Espriella",
        "medioB": "El Heraldo",
        "mismoHecho": true,
        "jaccard": 0.429
    },
    {
        "a": "Cuatro policías completan 24 horas desaparecidos en El Tambo, Cauca",
        "medioA": "Blu Radio",
        "b": "Así fueron las labores de búsqueda por casi 48 horas de los cuatro policías que permanecieron desaparecidos en El Tambo, Cauca",
        "medioB": "El Tiempo",
        "mismoHecho": true,
        "jaccard": 0.5
    },
    {
        "a": "De la Espriella nombra a Mauricio Gaona embajador de Colombia ante la ONU",
        "medioA": "Portafolio",
        "b": "Mauricio Gaona, nuevo embajador de Colombia ante la ONU en Nueva York",
        "medioB": "El Nuevo Siglo",
        "mismoHecho": true,
        "jaccard": 0.5
    },
    {
        "a": "El mensaje de Mauricio Gaona tras ser designado por Abelardo de la Espriella como embajador de Colombia ante la ONU",
        "medioA": "Semana",
        "b": "Mauricio Gaona será el embajador de Abelardo ante la ONU",
        "medioB": "La Silla Vacía",
        "mismoHecho": true,
        "jaccard": 0.556
    },
    {
        "a": "Fueron encontrados con vida los cuatro policías que estaban desaparecidos en el Tambo, Cauca",
        "medioA": "Infobae Colombia",
        "b": "Fueron encontrados los cuatro policías desaparecidos en el cerro Santa Ana de El Tambo, Cauca",
        "medioB": "El País (Cali)",
        "mismoHecho": true,
        "jaccard": 0.545
    },
    {
        "a": "Japón: un terremoto de magnitud 7,1 deja decenas de heridos y graves daños en el sur del país",
        "medioA": "France 24 Español",
        "b": "Fuerte terremoto en Japón deja decenas de heridos y daños en viviendas e infraestructura",
        "medioB": "La Opinión",
        "mismoHecho": true,
        "jaccard": 0.462
    },
    {
        "a": "Juliana Guerrero renuncia al Consejo Superior de la Universidad Popular del Cesar",
        "medioA": "KienyKe",
        "b": "Juliana Guerrero renunció al Consejo Superior de la U. del Cesar",
        "medioB": "El Nuevo Siglo",
        "mismoHecho": true,
        "jaccard": 0.556
    },
    {
        "a": "Mauricio Gaona será el embajador de Abelardo ante la ONU",
        "medioA": "La Silla Vacía",
        "b": "De la Espriella nombra a Mauricio Gaona embajador de Colombia ante la ONU",
        "medioB": "Portafolio",
        "mismoHecho": true,
        "jaccard": 0.5
    },
    {
        "a": "Ola de calor: contrarreloj contra los incendios en Francia y España",
        "medioA": "DW Español",
        "b": "Los incendios ponen a prueba a Francia y España ante una nueva ola de calor",
        "medioB": "Euronews Español",
        "mismoHecho": true,
        "jaccard": 0.556
    },
    {
        "a": "Posesión presidencial de Abelardo De la Espriella el 7 de agosto en Cali sería en el centro de eventos Arena USC",
        "medioA": "El Heraldo",
        "b": "Abelardo de la Espriella realizará su posesión presidencial en la Arena USC de Cali",
        "medioB": "El País (Cali)",
        "mismoHecho": true,
        "jaccard": 0.583
    },
    {
        "a": "Rodrigo Lara anuncia protección para Angie Rodríguez",
        "medioA": "Blu Radio",
        "b": "Angie Rodríguez fue amenazada por denunciar irregularidades: Rodrigo Lara",
        "medioB": "La Opinión",
        "mismoHecho": true,
        "jaccard": 0.444
    }
];
