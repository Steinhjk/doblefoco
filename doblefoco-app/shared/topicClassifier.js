// @ts-check
/**
 * Clasificación de artículos POR CONTENIDO.
 *
 * POR QUÉ EXISTE
 * --------------
 * Hasta ahora la categoría de un artículo se heredaba del feed por el que
 * entró: `category: feedConfig.category` en ingestDaemon. Eso no describía de
 * qué trata la noticia, describía CÓMO CONFIGURAMOS LA INGESTA. Con 24 de los
 * 39 feeds declarados como «Política», casi todo era Política por definición, y
 * un partido de fútbol publicado en el feed político de un medio entraba como
 * política.
 *
 * La consecuencia visible: la interfaz ofrecía once categorías y los feeds solo
 * declaraban cuatro (Política, Internacional, Judicial, Economía), así que seis
 * baldosas —Salud, Medio Ambiente, Tecnología, Infraestructura, Educación y
 * Deportes— no podían llenarse nunca. No estaban vacías: no tenían cañería.
 * Es además el mismo campo que ya había bloqueado los puntos de énfasis
 * recurrente, que necesitaban saber de qué habla un medio y solo podían leer de
 * qué feed lo sacamos nosotros.
 *
 * QUÉ SE MIDIÓ ANTES DE ELEGIR CÓMO
 * ---------------------------------
 * Sondeo del 2026-08-03 sobre los 39 feeds vivos, 816 artículos:
 *
 *   · `<category>` publicado por el propio medio ... 32 %
 *   · sección en la ruta de la URL ................. 96 % (engañoso, ver abajo)
 *   · titular y entradilla ......................... 100 %
 *
 * El 96 % de la URL es falso. El segmento más frecuente del corpus era
 * `articles`, con 300 apariciones: son exactamente los diez feeds que pasan por
 * Google News, cuyos enlaces son redirecciones de news.google.com. Un 37 % del
 * catálogo llega sin sección utilizable. Y del resto, el vocabulario mezcla
 * tema con geografía (`bucaramanga`, `cartagena`) y con formato (`video`,
 * `galerias`, `en-vivo`).
 *
 * El `<category>` del medio está peor: entre las etiquetas más frecuentes
 * aparecen `destacadas`, `portada`, `emisión 02 de agosto 2026`, `el colombiano`
 * y `abelardo de la espriella`. Son secciones de portada y nombres propios, no
 * temas.
 *
 * De ahí el diseño: lo único disponible para el 100 % de los artículos es el
 * texto que ya guardamos —titular y entradilla—, así que ahí vive la
 * clasificación. La URL y el `<category>` entran como REFUERZO cuando existen,
 * nunca como fuente única.
 *
 * POR QUÉ LÉXICO Y NO UN MODELO
 * -----------------------------
 * Es determinista, no cuesta nada por artículo, no depende de la red en el
 * ciclo de ingesta, y —lo que importa aquí— es AUDITABLE: se puede decir por
 * qué una noticia cayó en Deportes. En una página cuyo argumento entero es que
 * el lector pueda comprobar lo que afirmamos, una caja negra clasificando el
 * catálogo sería incoherente. Encaja además con `assessArticle` y
 * `analyzeHeadlineTone`, que ya son analizadores deterministas sobre el titular.
 *
 * DOS EJES, NO UNO
 * ----------------
 * `Internacional` NO es un tema, es un ÁMBITO, y estaba en la misma columna que
 * Política y Economía. Eso obligaba a elegir: un mundial de fútbol era
 * internacional o era deportivo, no las dos cosas. Aquí se separan, porque el
 * caso que lo motivó —la geopolítica de qué países participan en una
 * competición— es justo el que necesita ser deportivo E internacional a la vez.
 *
 * MULTIETIQUETA Y CON EL PULGAR EN LA BALANZA
 * -------------------------------------------
 * Una reforma a las EPS es Salud y es Política. Obligar a elegir pierde
 * exactamente las historias que más se cubren. Y por decisión de producto
 * (2026-08-03) el umbral se inclina a ASIGNAR antes que a dejar vacío: una
 * noticia sin tema no aparece en ningún filtro, así que el coste de no
 * clasificar lo paga el lector que busca, mientras que el coste de clasificar
 * de más es una noticia algo fuera de sitio, que se ve y se corrige.
 *
 * «Un poco» tiene un límite, y por eso existe `resumirClasificacion()`: mide
 * qué proporción se está asignando por señal débil. Sin esa cifra, «forzar un
 * poco» se convierte en forzar mucho sin que nadie se entere.
 *
 * LO QUE ESTO NO HACE
 * -------------------
 * No toca el sesgo. El espectro de una historia sale del valor del medio en el
 * registro y de ningún otro sitio; el tema es un eje independiente y no
 * alimenta la clasificación ideológica ni al revés. Tampoco reescribe titulares:
 * lee el literal del medio, como todo lo demás aquí.
 */

/** Quita tildes y baja a minúsculas, igual que hace contentQuality. */
function normalizar(texto) {
    return String(texto ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
}

/**
 * PESOS.
 *
 * Un término fuerte en el titular basta por sí solo para asignar el tema: el
 * titular es lo que el medio eligió poner delante. En la entradilla vale menos
 * porque ahí aparecen menciones de pasada («…dijo el ministro de Salud») que no
 * son de lo que trata la pieza.
 *
 * La sección de la URL pesa casi como un término fuerte porque la puso el
 * propio medio al archivar la pieza, pero no llega a bastar sola: hay secciones
 * cajón de sastre («actualidad», «colombia») que ya se filtran en el mapa, y
 * otras que archivan por autor o por región.
 */
const PESO = {
    fuerteTitular: 3,
    fuerteEntradilla: 1.8,
    debilTitular: 1.5,
    debilEntradilla: 0.8,
    seccionUrl: 2.5,
    categoriaMedio: 2,
};

/** A partir de aquí el tema se asigna sin discusión. */
export const UMBRAL_ASIGNA = 3;

/**
 * Suelo del rescate. Por debajo de esto no se asigna nada.
 *
 * Este es el número que materializa el «forzarlo un poco»: si ningún tema llega
 * a `UMBRAL_ASIGNA`, se rescata el mejor siempre que tenga al menos una señal
 * real (un término débil en el titular, o la sección de la URL). Lo que NO se
 * rescata es una única mención de pasada en la entradilla, que es ruido.
 */
export const UMBRAL_RESCATE = 1.5;

/**
 * TEMAS.
 *
 * `fuertes`: si aparecen, la pieza trata de esto. Se eligen términos que en
 * español colombiano no significan otra cosa.
 *
 * `debiles`: apuntan al tema pero son ambiguos o genéricos. Suman, no deciden
 * —PERO SOLO CUANDO HAY CON QUIÉN COMPETIR, y esa mitad de la frase faltaba
 * aquí—. Un débil en el titular vale 1,5 y `UMBRAL_RESCATE` es exactamente 1,5,
 * así que un débil suelto, sin ningún otro tema puntuando, se rescata y decide.
 * Es por diseño: el rescate existe para eso. Pero al elegir un término débil hay
 * que leerlo dos veces —¿qué archiva cuando es la ÚNICA señal del titular?—, que
 * es donde se cayeron `nasa` y `ciencia` en la tanda de 2026-08-14.
 *
 * SOBRE LA AMBIGÜEDAD, que es donde estos ficheros se rompen. El precedente
 * está escrito en contentQuality: un patrón de lotería descartó «obras de
 * rehabilitación del CDI El Dorado» porque buscaba la subcadena. Aquí el riesgo
 * equivalente es «partido» (político o de fútbol), «nacional» (el club o el
 * ámbito), «corte» (el tribunal o el recorte) y «reforma» (la ley o la obra).
 * Todos ellos van como débiles o exigen contexto en el mismo patrón.
 *
 * TRES QUE SE MIDIERON PARA CIENCIA Y SE DEJARON FUERA, con el número al lado
 * para que nadie los vuelva a proponer de memoria:
 *
 *   · `cometa` — 0 aciertos y 7 falsos. En Colombia agosto es la temporada de
 *     volar cometas: festivales en Floridablanca, avisos de riesgo eléctrico de
 *     CENS, y un ciclista apodado «El Cometa». Es «Huracán» otra vez.
 *   · `marte` sin frontera se come «mar-tes», que es el 100 % de lo que pillaba:
 *     sorteos de la Kábala, el S&P 500 y la vuelta a clases.
 *   · `eclipse` — el que motivaba todo esto, y el que más claro queda fuera. Son
 *     142 artículos, y **no son de ciencia**: una mujer que se ahoga en un
 *     embalse tras verlo, las gafas que acaban en vertederos, Björk y los
 *     skaters, el tráfico de vuelta que preocupa a la DGT, partidos aplazados.
 *     El eclipse es un SUCESO, como el terremoto, y un suceso no es un tema.
 */
export const TEMAS = [
    {
        id: 'politica',
        nombre: 'Política',
        fuertes: [
            /\b(congreso|senado|camara de representantes|plenaria)\b/,
            /\b(petro|casa de narino|presidencia de la republica)\b/,
            /\b(presidente|presidenta|expresidente|mandatario|gabinete|posesion presidencial)\b/,
            /\b(ministr[oa]s?|minhacienda|mininterior|cancilleria|canciller)\b/,
            /\b(elecciones|electoral|(pre)?candidat[oa]s?|campana electoral|registraduria)\b/,
            /\bpolitica (exterior|interna|nacional)\b/,
            /\b(gobernador|alcalde|alcaldesa|concejo de|asamblea departamental)\b/,
            /\b(consulta popular|referendo|constituyente|plebiscito)\b/,
            /\b(oposicion|coalicion|bancada|uribismo|petrismo)\b/,
        ],
        debiles: [
            /\breforma\b/,
            /\bgobierno\b/,
            /\bpartido (politico|liberal|conservador|verde|de la u)\b/,
            /\b(decreto|proyecto de ley|ponencia)\b/,
            /\bpoliticas? publicas?\b/,
        ],
    },
    {
        id: 'economia',
        nombre: 'Economía',
        fuertes: [
            /\b(inflacion|ipc|dane)\b/,
            /\b(banco de la republica|tasa de interes|tasas de interes)\b/,
            /\b(reforma tributaria|dian|impuestos?)\b/,
            /\b(pib|producto interno bruto|desempleo|salario minimo)\b/,
            /\b(ecopetrol|bolsa de valores|bvc|deuda publica|deficit fiscal)\b/,
            /\b(exportaciones|importaciones|balanza comercial)\b/,
            /\b(presupuesto (general|nacional)|marco fiscal)\b/,
        ],
        debiles: [
            /\b(dolar|euro|divisa|trm)\b/,
            /\b(empresa|empresas|empresarial|inversion|inversionistas?)\b/,
            /\b(mercado|mercados|economia|economico)\b/,
            /\b(precio|precios|costo de vida)\b/,
            /\b(banco|bancos|credito|creditos)\b/,
        ],
    },
    {
        id: 'salud',
        nombre: 'Salud',
        fuertes: [
            /\b(eps|adres|minsalud|invima|supersalud)\b/,
            /\b(hospital|hospitales|clinica|clinicas|urgencias)\b/,
            /\b(pacientes?|medic[oa]s?|enfermer[oa]s?|cirugia)\b/,
            /\b(vacuna|vacunacion|epidemia|pandemia|brote|contagios?)\b/,
            /\b(dengue|malaria|fiebre amarilla|covid|viruela|sarampion)\b/,
            /\b(sistema de salud|reforma a la salud|reforma de la salud)\b/,
            /\b(medicamentos?|farmaceutic[oa]s?)\b/,
        ],
        debiles: [
            /\b(salud mental|salud publica)\b/,
            /\b(enfermedad|enfermedades|sintomas?|diagnostico)\b/,
            /\b(cancer|diabetes|obesidad|vih)\b/,
        ],
    },
    {
        /**
         * DESASTRES Y EMERGENCIAS — añadido el 2026-08-10, decisión de Jose.
         *
         * POR QUÉ HACÍA FALTA UNA SECCIÓN ENTERA. Medido sobre 400 artículos del
         * terremoto del Chocó, el hecho más cubierto del año: 236 se quedaban sin
         * tema y los 164 restantes se repartían entre TRECE secciones. El
         * Congreso aplazando sesión iba a Política; los bancos reabriendo, a
         * Economía; el Ejército activando sus emisoras para buscar
         * desaparecidos, a Justicia; Shakira, a Entretenimiento; el partido
         * aplazado, a Deportes. Sesenta y tres de ellos por rescate, es decir
         * por una única señal débil.
         *
         * «Gobierno declara desastre nacional tras terremoto en Chocó que deja
         * 71 muertos» puntuaba 1,5 en Política —la palabra «gobierno»— y nada le
         * competía, porque no había contra qué. Un lector que quisiera saber qué
         * pasó con el terremoto no tenía dónde ir.
         *
         * No es un problema del terremoto: vuelve con cada ola invernal.
         *
         * LA SECCIÓN ES EL HECHO Y SU RESPUESTA. Los albergues, la ayuda
         * humanitaria y los bancos reabriendo son cobertura del desastre, no de
         * otra cosa. Por eso el nombre lleva «y emergencias».
         *
         * SOBRE LA AMBIGÜEDAD, que es donde estos ficheros se rompen. Aquí el
         * riesgo es el uso metafórico, que en la prensa en español es constante:
         * «el epicentro del escándalo», «un tsunami de críticas», «temblor en
         * los mercados», «réplica» como respuesta, «sala de emergencias». Todos
         * esos van como débiles o exigen contexto en el mismo patrón. Lo que va
         * como fuerte es lo que en español colombiano no significa otra cosa:
         * «damnificados», «rescatistas», «desastre natural».
         */
        id: 'desastres',
        nombre: 'Desastres y accidentes',
        fuertes: [
            /*
             * LOS ACCIDENTES VAN AQUÍ, y no es una licencia: es la forma que
             * tiene la categoría equivalente del estándar del oficio. IPTC Media
             * Topics —el vocabulario que usan las agencias— llama a la suya
             * «disaster, accident and emergency incident», los tres juntos.
             *
             * Medido antes de decidirlo, sobre 4 000 artículos: 56 eran
             * accidentes y tenían el mismo problema que los desastres, 25 sin
             * tema y el resto dispersos. Las tres colombianas muertas en el
             * helicóptero caían en Medio Ambiente; el concejal muerto por el
             * desplome de una viga, en Tecnología; los accidentes viales, en
             * Infraestructura. Y en una semana sin terremoto los accidentes son
             * el flujo constante, no el pico.
             *
             * IPTC además separa «weather», y aquí NO se separa. Su motivo es el
             * pronóstico diario que mueven las agencias, y este sitio no ingiere
             * pronósticos —`contentQuality` los descartaría como formato sin
             * encuadre, igual que la TRM—. Medidos: 14 artículos de meteorología
             * en 4 000. Copiar la división sin el contenido que la justifica
             * dejaría una sección vacía.
             */
            /\baccidente (de transito|vial|aereo|de trafico|laboral|de trabajo)\b/,
            /\b(siniestro vial|choque multiple|volcamiento|descarrilamiento)\b/,
            /\b(naufragio|naufrag[oa]|embarcacion (se hundio|volcada))\b/,
            // «de una viga» fallaba con `(un|el|la)`: el `\b` del final caía a
            // mitad de «una». Van los artículos completos.
            /\b(derrumbe|desplome|desprendimiento) de (un|una|el|la|los|las)\b/,
            /\bcolapso (de|del) (un |una |el |la )?(edificio|puente|techo|colegio|muro|estructura)\b/,
            /\b(mineros? atrapad[oa]s|derrumbe en (una|la) mina)\b/,

            // «sismo» y «terremoto» no tienen uso metafórico corriente;
            // «temblor» y «epicentro» sí, y por eso están abajo.
            /\b(terremoto|sismos?|sismicos?|movimiento telurico|maremoto)\b/,
            /\b(replicas? (sismicas?|del (sismo|terremoto)))\b/,
            /\b(damnificad[oa]s?|desastre (natural|nacional)|calamidad publica|zona de desastre)\b/,
            /\b(ungrd|gestion del riesgo de desastres|defensa civil|rescatistas?|socorristas?)\b/,
            /\b(erupcion|volcan|volcanica|ceniza volcanica)\b/,
            /\b(tormenta tropical|onda tropical|depresion tropical|ciclon|tornado)\b/,
            /\b(incendio forestal|avalancha|creciente subita)\b/,
            /\b(deslizamiento de tierra|remocion en masa)\b/,

            /*
             * «INCENDIO» A SECAS, añadido el 2026-08-14 tras medirlo.
             *
             * Arriba solo estaba «incendio forestal», y eso dejaba fuera el
             * incendio urbano, que por IPTC es la misma categoría: su rúbrica es
             * «disaster, accident and emergency incident», no «desastre natural».
             *
             * Medido sobre el corpus con `npm run medir:termino`: **85 artículos
             * hoy sin tema** lo llevan en el titular —«Incendio en centro
             * comercial de El Cairo deja dos personas muertas», «Alarma por
             * incendio en el municipio de Yumbo»— y de los 90 que ya tienen tema
             * y lo contienen, **60 están ya en Desastres**. Los demás no son
             * falsos positivos sino piezas multietiqueta de incendios reales: el
             * de Economía es «Voraz incendio en zona rural de El Banco deja
             * heridos y pérdidas materiales».
             *
             * VA COMO FUERTE porque en español colombiano no significa otra cosa,
             * que es la regla de esta lista. Compárese con «escombros», abajo.
             */
            /\bincendi(o|os|arse|aron|ada?s?)\b/,

            /*
             * «ESCOMBROS» EXIGE LA PREPOSICIÓN, Y LA PRIMERA VERSIÓN ESTABA MAL.
             * Añadido y corregido el mismo día, 2026-08-14.
             *
             * Suelto rendía 70 artículos y coincidía con Desastres en 99 de 123,
             * así que se metió como débil dando por hecho que era seguro. Al
             * trazar qué hacía apareció el fallo: **«CAR impuso medidas
             * preventivas a predio en Suba por mala disposición de escombros»**
             * se rescataba como desastre, y eso es residuo de obra.
             *
             * Y LO TAPABA LA PRUEBA QUE SE ESCRIBIÓ PRIMERO. Se comprobaba con
             * «Metro de Bogotá: la enorme cantidad de escombros…», que pasaba —
             * pero no porque el término se portara bien, sino porque
             * Infraestructura puntuaba 4,5 y ganaba—. Sin competidor fuerte el
             * falso positivo salía igual. Una prueba que pasa por el motivo
             * equivocado es peor que no tenerla.
             *
             * Con la preposición el término deja de ser ambiguo, y por eso está
             * aquí arriba y no entre los débiles: estar BAJO o ENTRE los
             * escombros, o ser rescatado DE ellos, no significa otra cosa en
             * español. «Disposición de escombros» y «cantidad de escombros» son
             * la obra, y no casan.
             *
             * SE PIERDE ALCANCE A PROPÓSITO: «La vida surge de los escombros» es
             * un rescate real y no casa. Se acepta. Una etiqueta falsa afirma
             * algo; una ausente solo calla.
             */
            /\b(entre|bajo|sepultad[oa]s? (en|entre|bajo)|rescatad[oa]s? de|remocion de|retiro de) (los |las )?escombros\b/,
        ],
        debiles: [
            /*
             * «HURACÁN» NO ESTÁ EN NINGUNA DE LAS DOS LISTAS, y merece la pena
             * dejar escrito por qué para que nadie lo «arregle» añadiéndolo.
             *
             * El Club Atlético Huracán juega el clásico con San Lorenzo en el
             * Nuevo Gasómetro, y la prensa colombiana lo cubre. Como término
             * fuerte se llevaba a esta sección la tabla de posiciones del Torneo
             * Clausura. Bajarlo a débil tampoco bastó: las entradillas de
             * Infobae hacían casar un patrón fuerte por su cuenta —1,8— y con el
             * 1,5 del titular se cruzaba el umbral igual. «San Lorenzo y Huracán
             * animarán una nueva edición del clásico» acababa empatado a 3,3 con
             * Deportes y ganaba esta sección por orden de array.
             *
             * Colombia no cubre huracanes propios casi nunca —San Andrés
             * aparte—, así que el término aporta poco y ensucia mucho. Lo que sí
             * identifica el fenómeno sin ambigüedad es «onda tropical»,
             * «depresión tropical» y «tormenta tropical», que están arriba como
             * fuertes. El caso real que había en el corpus —«Nueva onda tropical
             * pone en alerta al Atlántico: ¿podría convertirse en huracán?»— se
             * clasifica por ahí.
             */

            // Metafóricos frecuentes: suman, no deciden.
            /\b(temblor|epicentro|escala de richter)\b/,
            /\b(tsunami|alerta de tsunami)\b/,
            /\b(emergencia|emergencias|evacuacion|evacuad[oa]s?)\b/,
            /\b(inundacion(es)?|deslizamiento|sequia|granizada|vendaval|ola invernal)\b/,
            /\b(albergues?|ayuda humanitaria|centro de acopio|damnificados)\b/,


            /*
             * «accidente» suelto va aquí y no arriba por «accidente
             * cerebrovascular», que es un ictus y pertenece a Salud. Como débil
             * suma 1,5 y deja que el término fuerte de Salud decida.
             */
            /\baccidente\b/,
            /\b(avioneta|helicoptero|rescate|atrapad[oa]s|desaparecid[oa]s)\b/,
        ],
    },
    {
        id: 'ambiente',
        nombre: 'Medio Ambiente',
        fuertes: [
            /\b(deforestacion|reforestacion|amazonia|amazonas)\b/,
            /\b(cambio climatico|crisis climatica|emisiones de carbono|cop\d{2})\b/,
            /\b(biodiversidad|especies? (en peligro|amenazada)|fauna silvestre)\b/,
            /\b(paramo|paramos|humedal|manglar|arrecife)\b/,
            /\b(transicion energetica|energias? renovables?|parque eolico|solar fotovoltaic)\b/,
            /\b(contaminacion|vertimiento|derrame de (crudo|petroleo))\b/,
            /\b(minambiente|corpo(guajira|amazonia|boyaca)|anla)\b/,
        ],
        debiles: [
            /\b(ambiental|ecosistema|sostenibilidad)\b/,
            /\b(sequia|inundacion|incendio forestal|deslizamiento)\b/,
            /\b(mineria|minera|glifosato)\b/,
            /\b(rio|rios|cuenca|acuifero)\b/,
        ],
    },
    {
        id: 'tecnologia',
        nombre: 'Tecnología',
        fuertes: [
            // `ia` como palabra suelta: en español no es una palabra, así que
            // la frontera de palabra la deja segura y recupera los titulares
            // que usan la sigla («IA generará fuerte impacto en el empleo»).
            /\b(inteligencia artificial|ia|chatgpt|algoritmos?)\b/,
            /\b(ciberseguridad|ciberataque|hacker|ransomware|filtracion de datos)\b/,
            /\b(software|hardware|aplicacion movil|app movil)\b/,
            /\b(criptomoneda|bitcoin|blockchain)\b/,
            /\b(redes? sociales?|tiktok|instagram|whatsapp|facebook|youtube)\b/,
            /\b(datos personales|habeas data|proteccion de datos)\b/,
            /\bred(es)? 5g\b/,

            // CIENCIA. No es un tema aparte: los dos mapas de sección de aquí
            // abajo archivan `ciencia` en Tecnología desde que existen. Lo que
            // faltaba era el léxico, y se notaba: la ciencia solo entraba si el
            // medio había etiquetado la sección, y entraba rescatada con 2,5.
            // Sin sección se caía entera — «Un telescopio detecta dos agujeros
            // negros a punto de fusionarse» no tenía una sola señal propia.
            /\b(astronomi(a|c[oa]s?)|astronaut(a|as)|telescopio)\b/,
            /\bobservatorio astronomico\b/,
            /\b(asteroide|meteorito|agujeros? negros?|via lactea|galaxias?)\b/,
            /\b(estacion|caminata|carrera|sonda) espacial\b/,
        ],
        debiles: [
            /\b(tecnologia|tecnologic[oa]s?|digitalizacion)\b/,
            // `ciencia`, `cientificos` y `nasa` SE MIDIERON Y NO ENTRAN, ni
            // siquiera de débiles. Ver la nota sobre el rescate en la cabecera
            // de `debiles`: aquí un débil solo tampoco es inofensivo.
            //   · `ciencia` es muletilla de periodismo de servicio —«según la
            //     ciencia, las vacaciones mejor largas y cortas»—, y de débil se
            //     rescataba a Tecnología. Sus aciertos ya los recoge Desastres.
            //   · `nasa` ES TAMBIÉN EL PUEBLO INDÍGENA NASA DEL CAUCA. Hoy no
            //     aparece ni una vez en el corpus, pero de débil mandaba
            //     «Comunidad Nasa bloquea la vía Panamericana» a Tecnología, y
            //     el Cauca entra en portada cuando hay conflicto. Aportaba dos
            //     artículos exclusivos, los dos del eclipse. No compensa.
            /\b(internet|conectividad|banda ancha|fibra optica)\b/,
            /\b(celular|celulares|smartphone|dispositivo)\b/,
            /\b(startup|plataforma digital|comercio electronico)\b/,
            /\b(transformacion|brecha|economia) digital\b/,
        ],
    },
    {
        id: 'infraestructura',
        nombre: 'Infraestructura',
        fuertes: [
            /\b(metro de bogota|transmilenio|transmilenio|regiotram)\b/,
            /\b(aeropuerto|aeropuertos|puerto de (buenaventura|cartagena|santa marta))\b/,
            /\b(peaje|peajes|concesion vial|invias|ani)\b/,
            /\b(tunel|tuneles|viaducto|puente vehicular)\b/,
            /\bvias? (4g|5g|terciarias?|nacionales?)\b/,
            /\b(acueducto|alcantarillado|planta de tratamiento)\b/,
            /\b(ferrocarril|tren de cercanias|navegabilidad del (rio )?magdalena)\b/,
        ],
        debiles: [
            /\b(carretera|carreteras|autopista|via nacional)\b/,
            /\b(obra|obras|megaobra|construccion de)\b/,
            /\b(transporte|movilidad|infraestructura)\b/,
        ],
    },
    {
        id: 'justicia',
        nombre: 'Justicia',
        /**
         * Los feeds dicen `Judicial` y la interfaz decía `Justicia`, y como el
         * filtro comparaba por nombre exacto la baldosa mostraba 0 con cinco
         * historias dentro. Aquí el id manda y el nombre es solo etiqueta, así
         * que ese desajuste no puede repetirse.
         */
        fuertes: [
            /\b(fiscalia|fiscal general|procuraduria|contraloria|defensoria del pueblo)\b/,
            /\b(corte (suprema|constitucional)|consejo de estado|consejo superior de la judicatura)\b/,
            /\b(jep|tribunal|juzgado|juez|jueza|magistrad[oa]s?)\b/,
            // «Condenan al narcofiscal…» no lo cazaba la forma sustantiva sola:
            // el titular de una condena casi siempre va en verbo conjugado.
            /\bcondena(n|r|do|da|ron)?\b/,
            /\b(sentencia|fallo judicial|absuelt[oa]|prescribio el caso)\b/,
            /\b(captur[aoó]|detenid[oa]s?|imputacion|imputad[oa]|medida de aseguramiento)\b/,
            /\b(extradicion|extraditad[oa]|carcel|penitenciaria|inpec)\b/,
            /\b(investigacion penal|proceso judicial|demanda judicial|tutela)\b/,
        ],
        debiles: [
            /\b(delito|delitos|crimen|crimenes|corrupcion|soborno|peculado)\b/,
            /\b(abogad[oa]s?|defensa juridica|acusacion)\b/,
            /\b(homicidio|asesinato|secuestro|masacre)\b/,
        ],
    },
    {
        id: 'educacion',
        nombre: 'Educación',
        fuertes: [
            /\b(icetex|mineducacion|sena|icfes)\b/,
            /\b(universidad|universidades|rector|rectora)\b/,
            /\b(colegio|colegios|estudiantes?|docentes?|profesor[ae]s?)\b/,
            /\b(pruebas saber|matricula cero|educacion superior)\b/,
            /\b(fecode|calendario escolar|jornada unica)\b/,
        ],
        debiles: [
            /\b(educacion|educativ[oa]s?|academic[oa]s?)\b/,
            /\b(beca|becas|posgrado|maestria|doctorado)\b/,
            /\b(alfabetizacion|desercion escolar)\b/,
        ],
    },
    {
        id: 'deportes',
        nombre: 'Deportes',
        /**
         * `partido` y `nacional` NO están aquí sueltos a propósito: son «partido
         * político» y «gobierno nacional» con la misma frecuencia que el
         * encuentro y el club. Van exigiendo contexto o no van.
         *
         * Esta categoría existe porque se decidió abarcar de más: se objetó que
         * el deporte casi nunca trae carga izquierda/derecha, y la respuesta fue
         * que los casos donde sí la trae —deportistas trans, la geopolítica de
         * qué países compiten— son justo los que se perderían al excluirla.
         */
        fuertes: [
            /\b(futbol|futbolista|balompie)\b/,
            /\bseleccion colombia\b/,
            /\b(liga betplay|dimayor|copa libertadores|copa sudamericana|champions league)\b/,
            /\b(mundial de (futbol|clubes)|eliminatorias|copa america)\b/,
            /\b(ciclismo|ciclista|tour de francia|giro de italia|vuelta a espana)\b/,
            /\b(olimpic[oa]s?|juegos olimpicos|panamericanos)\b/,
            /\b(atletas?|deportistas?|deportiv[oa]s?|deporte)\b/,
            /\b(tenis|baloncesto|nba|beisbol|voleibol|patinaje|natacion|boxeo)\b/,
            /\b(formula 1|motogp|automovilismo)\b/,
            /\b(gol|goles|golead[oa]r|arquero|delantero|mediocampista)\b/,
            /\b(atletico nacional|america de cali|junior de barranquilla|deportivo cali|independiente santa fe)\b/,

            /**
             * `millonarios` EXIGE CONTEXTO, y esta es la lección de este
             * archivo. Suelto clasificó como deportiva «Puerta giratoria:
             * periodistas con historial de millonarios contratos con el
             * Estado», que es una investigación sobre contratación pública.
             * Es el mismo error que «El Dorado» en contentQuality: la
             * subcadena existe, el sentido no.
             */
            /\bmillonarios (fc|de bogota)\b/,
            /\b(contra|ante|vs\.?) millonarios\b/,
            /\bmillonarios (gano|perdio|empato|vencio|goleo|enfrenta|derroto|jugara|ficho)\b/,
        ],
        debiles: [
            /\b(fichaje|fichajes|traspaso|refuerzo)\b/,
            /\b(entrenador|tecnico del|director tecnico|dt del)\b/,
            /\b(torneo|campeonato|clasificacion|final del)\b/,
            /\b(medalla|podio|record|campeon|campeona)\b/,
            /\b(estadio|hincha|hinchada|barra brava)\b/,
        ],
    },

    /**
     * LOS TRES QUE FALTABAN.
     *
     * La primera medición dejó 47 % de los artículos sin tema, y al leer esa
     * lista el patrón era evidente: no eran piezas inclasificables, eran tres
     * temas que el catálogo heredado no contemplaba. Paramilitares, disidencias
     * y líderes sociales amenazados; feminicidios, aborto y migración; y
     * libertad de prensa y cultura. En un agregador colombiano dejar fuera el
     * conflicto armado no es una omisión menor: es el asunto del país.
     */
    {
        id: 'conflicto',
        nombre: 'Conflicto y paz',
        fuertes: [
            /\b(paramilitar|paramilitares|autodefensas|clan del golfo|agc)\b/,
            /\b(guerrilla|eln|farc|disidencias?|segunda marquetalia|estado mayor central)\b/,
            /\b(acuerdo de paz|paz total|proceso de paz|desmovilizacion|reincorporacion)\b/,
            // El prefijo «narco-» es productivo en el español periodístico
            // colombiano y aparece pegado a cualquier sustantivo: narcofiscal,
            // narcopolítica, narcoparamilitar. Se caza el prefijo, no la lista.
            /\bnarco\w*\b/,
            /\b(cartel de|cocaina|erradicacion|cultivos? ilicitos?)\b/,
            /\b(lider(es)? social(es)?|defensor(es)? de derechos humanos)\b/,
            /\b(masacres?|desplazamiento forzado|desaparicion forzada|falsos positivos)\b/,
            /\b(minas? antipersonal|artefactos? explosivos?|hostigamientos?|atentados?)\b/,
            /\b(victimas del conflicto|restitucion de tierras|unidad de victimas)\b/,
        ],
        debiles: [
            /\b(secuestros?|extorsion(es)?|vacuna extorsiva)\b/,
            /\b(orden publico|fuerza publica|militares|ejercito|policia)\b/,
            /\b(campesin[oa]s?|zona de reserva campesina|tecam)\b/,
            /\b(amenazad[oa]s?|amenazas)\b/,
        ],
    },
    {
        id: 'derechos',
        nombre: 'Derechos y sociedad',
        fuertes: [
            // El plural importa y casi se escapa: `\bfeminicidio\b` NO caza
            // «Aumentan los feminicidios», que es como se titula la noticia.
            // El mismo cuidado hace falta en el resto de sustantivos de aquí.
            /\b(feminicidios?|violencia de genero|violencia intrafamiliar)\b/,
            /\b(aborto|interrupcion voluntaria del embarazo|derechos reproductivos)\b/,
            /\b(lgbti?q?\+?|diversidad sexual)\b/,
            // `trans` suelta: en español no aparece como palabra independiente
            // salvo referida a personas trans —«transporte», «transición» y
            // «TransMilenio» son palabras distintas y la frontera las excluye—.
            // Es además el caso que motivó incluir Deportes: «atletas trans».
            /\btrans\b/,
            /\b(migrantes?|migracion|refugiad[oa]s?|deportaciones?|deportad[oa]s?)\b/,
            /\b(pueblos? indigenas?|comunidades? (indigenas?|afro|negras)|consulta previa)\b/,
            /\b(derechos humanos|discriminacion|racismo|xenofobia)\b/,
            /\b(acoso sexual|abuso sexual|violencia sexual)\b/,
            /\b(trabajo infantil|reforma laboral|sindicat[oa]s?)\b/,
        ],
        debiles: [
            /\b(protesta|manifestacion|marcha|paro nacional|movilizacion)\b/,
            /\b(pobreza|desigualdad|hambre|inseguridad alimentaria)\b/,
            /\b(vivienda|subsidio|programa social)\b/,
            /\b(mujeres|genero|feminista)\b/,
        ],
    },
    /**
     * «CULTURA Y MEDIOS» ERA TRES COSAS EN UNA CAJA.
     *
     * Nació como el cajón de lo que sobraba y se notaba: metía en el mismo tema
     * el cine y los museos, la libertad de prensa, y la telenovela con el
     * influencer. Se partió el 2026-08-04, a petición de Jose, que la señaló
     * como difusa antes de que nadie mirara el léxico.
     *
     * Lo que la lista de patrones dejaba ver, y la baldosa no: la libertad de
     * prensa —el asunto más propio de este sitio— estaba clasificada junto a
     * «reggaetón» y «farándula». No era un desorden estético; era el tema
     * central del producto sin sección donde aparecer.
     *
     * LA FRONTERA ENTRE LAS TRES, que es lo que habrá que releer cuando alguien
     * dude dónde poner un patrón nuevo:
     *
     *   - `cultura`         — la obra y la institución: cine, música,
     *                         literatura, museos, teatro, patrimonio, fiestas.
     *   - `medios`          — el oficio y sus condiciones: quién informa, quién
     *                         lo impide y quién lo financia.
     *   - `entretenimiento` — el consumo: televisión, streaming, famosos.
     *
     * Un concierto es cultura y un reality es entretenimiento, y sí, la línea
     * entre los dos es discutible en los bordes. Se elige que la música y el
     * cine se queden en cultura porque son industria cultural con crítica,
     * festivales e instituciones detrás; la pantalla de consumo masivo no.
     */
    {
        id: 'cultura',
        nombre: 'Cultura',
        /**
         * LOS PLURALES, OTRA VEZ. Este bloque venía escrito en singular estricto
         * y por tanto no cazaba «estrenó su temporada de conciertos», ni
         * «museos», ni «películas», ni «documentales»: `\bconcierto\b` exige
         * frontera después de la `o` y la `s` no lo es. Es literalmente el mismo
         * fallo que ya está anotado en `derechos` sobre `feminicidio`, y aquí
         * afectaba a casi todos los sustantivos del tema. Lo destapó una prueba
         * al partir la sección; llevaba vivo desde que se escribió.
         */
        fuertes: [
            /\b(cine|peliculas?|documentales?|festivales? de cine)\b/,
            /\b(musica|musicales?|albumes?|album|conciertos?|cantantes?|vallenato|reggaeton)\b/,
            /\b(literatura|novelas?|escritor[ae]?s?|editorial literaria|feria del libro)\b/,
            /\b(museos?|exposiciones? artisticas?|exposicion artistica|galerias? de arte|patrimonio cultural)\b/,
            /\b(carnavales?|festivales? de|ferias? de (cali|manizales))\b/,
            /\b(teatros?|danza|artistas? plastic[oa]s?)\b/,
        ],
        debiles: [
            /\b(cultura|cultural|artistas?)\b/,
            /\b(mincultura|biblioteca publica|casa de la cultura)\b/,
        ],
    },
    {
        id: 'medios',
        nombre: 'Medios y libertad de prensa',
        /**
         * EL TEMA MÁS FÁCIL DE ENVENENAR DE TODO EL ARCHIVO, porque su
         * vocabulario es el de la propia redacción. Dos trampas concretas:
         *
         * `rueda de prensa` NO ENTRA, ni siquiera como débil. Es la forma en
         * que se convoca a los periodistas, no una noticia sobre la prensa: la
         * escribe cualquier nota de política, de deportes o de sucesos. Con ese
         * patrón dentro, esta sección se habría llenado de gobierno.
         *
         * `prensa` suelta tampoco. Aparece en «prensa internacional dice…», que
         * es una cita de fuente, no un asunto. Va exigiendo adjetivo.
         *
         * `editorial` tampoco: choca de frente con la «editorial literaria» de
         * Cultura y con «casa editorial» como nombre de empresa.
         */
        fuertes: [
            /\b(libertad de (prensa|expresion)|fundacion para la libertad de prensa|flip)\b/,
            /\b(censura|censurad[oa]s?|mordaza|autocensura)\b/,
            /\bperiodistas? (amenazad[oa]s?|asesinad[oa]s?|agredid[oa]s?|exiliad[oa]s?)\b/,
            /\b(agresiones? (a|contra) la prensa|estigmatizacion (a|de) la prensa)\b/,
            /\b(medios de comunicacion|concentracion de medios|propiedad de los medios)\b/,
            /\b(desinformacion|noticias falsas|fake news|verificacion de hechos)\b/,
            /\b(pauta oficial|publicidad oficial)\b/,
            /\b(rtvc|sistema de medios publicos)\b/,
        ],
        debiles: [
            /\b(periodismo|periodistas?|reporter[oa]s?)\b/,
            /\bprensa (nacional|colombiana|independiente|regional)\b/,
            /\b(columnistas?|caricaturistas?)\b/,
            /\b(noticier[oa]s?|emisoras?)\b/,
        ],
    },
    {
        id: 'entretenimiento',
        nombre: 'Entretenimiento',
        /**
         * `serie` y `temporada` SE QUEDAN FUERA aunque sean el vocabulario
         * obvio. «Una serie de ataques» y «la temporada de lluvias» son español
         * corriente en titular de sucesos y de clima; es la misma trampa de
         * «partido» en Deportes y de «El Dorado» en contentQuality. Se cazan
         * las formas que no significan otra cosa.
         */
        fuertes: [
            // `realities` es como lo escribe la prensa colombiana, más que
            // `realitys`; las dos formas entran, y el singular con ellas.
            /\b(telenovelas?|realit(y|ys|ies)|reality show)\b/,
            /\b(netflix|hbo|disney\+?|prime video|streaming)\b/,
            /\b(farandula|celebridades?|influencers?)\b/,
            /\b(la casa de los famosos|masterchef|desafio the box)\b/,
            /\b(series? de television|programas? de television)\b/,
        ],
        debiles: [
            /\b(television|tv abierta)\b/,
            /\b(youtubers?|tiktokers?|podcasts?)\b/,
            /\b(episodios?|estreno de la (serie|temporada))\b/,
        ],
    },
];

/**
 * SECCIONES DE URL → tema.
 *
 * Solo entran las inequívocas. Quedan fuera a propósito los cajones de sastre
 * (`actualidad`, `colombia`, `nacion`, `inicio`), la geografía (`bucaramanga`,
 * `cartagena`, `area-metropolitana`) y el formato (`video`, `galerias`,
 * `en-vivo`, `clasificados`), que en el sondeo eran una parte enorme de los
 * segmentos y no dicen nada del tema.
 */
export const SECCION_URL_A_TEMA = {
    politica: 'politica',
    'politica-y-gobierno': 'politica',
    gobierno: 'politica',
    congreso: 'politica',
    elecciones: 'politica',
    economia: 'economia',
    globoeconomia: 'economia',
    economica: 'economia',
    negocios: 'economia',
    empresas: 'economia',
    finanzas: 'economia',
    business: 'economia',
    salud: 'salud',
    ambiente: 'ambiente',
    'medio-ambiente': 'ambiente',
    medioambiente: 'ambiente',
    sostenibilidad: 'ambiente',
    tecnologia: 'tecnologia',
    tecnosfera: 'tecnologia',
    tech: 'tecnologia',
    ciencia: 'tecnologia',
    infraestructura: 'infraestructura',
    movilidad: 'infraestructura',
    transporte: 'infraestructura',
    justicia: 'justicia',
    judicial: 'justicia',
    judiciales: 'justicia',
    tribunales: 'justicia',
    educacion: 'educacion',
    deportes: 'deportes',
    deporte: 'deportes',
    futbol: 'deportes',
    sports: 'deportes',
    conflicto: 'conflicto',
    'conflicto-armado': 'conflicto',
    paz: 'conflicto',
    'proceso-de-paz': 'conflicto',
    migracion: 'derechos',
    'derechos-humanos': 'derechos',
    genero: 'derechos',
    cultura: 'cultura',
    // Las secciones de ocio de los medios son entretenimiento, no cultura. Las
    // cuatro apuntaban a `cultura` cuando eran el mismo tema; ahora que están
    // separados, `gente` y `ocio` describen exactamente la sección de famosos.
    entretenimiento: 'entretenimiento',
    espectaculos: 'entretenimiento',
    gente: 'entretenimiento',
    ocio: 'entretenimiento',
};

/**
 * ETIQUETAS `<category>` del medio → tema.
 *
 * Mismo criterio, sobre el vocabulario real medido. Quedan fuera `destacadas`,
 * `portada`, `en vivo`, `columna`, `galería`, los nombres propios y las
 * emisiones fechadas, que fue lo que apareció al medir.
 */
export const CATEGORIA_MEDIO_A_TEMA = {
    politica: 'politica',
    'politica y gobierno': 'politica',
    gobierno: 'politica',
    congreso: 'politica',
    economia: 'economia',
    globoeconomia: 'economia',
    'economia y sociedad': 'economia',
    empresas: 'economia',
    sectores: 'economia',
    finanzas: 'economia',
    salud: 'salud',
    'medio ambiente': 'ambiente',
    ambiente: 'ambiente',
    sostenibilidad: 'ambiente',
    tecnologia: 'tecnologia',
    ciencia: 'tecnologia',
    justicia: 'justicia',
    judicial: 'justicia',
    educacion: 'educacion',
    deportes: 'deportes',
    futbol: 'deportes',
    paz: 'conflicto',
    conflicto: 'conflicto',
    campesinado: 'conflicto',
    'derechos humanos': 'derechos',
    'movimientos sociales': 'derechos',
    genero: 'derechos',
    cultura: 'cultura',
    entretenimiento: 'entretenimiento',
};

// ── Ámbito ───────────────────────────────────────────────────────────────────

/**
 * Marcas de que la pieza habla de Colombia aunque la publique un medio de
 * fuera, y al revés. El ámbito ya no se deduce de la categoría del feed.
 */
const MARCA_COLOMBIA = [
    /\bcolombia|colombian[oa]s?\b/,
    /\b(bogota|medellin|cali|barranquilla|cartagena|bucaramanga|cucuta|pereira|manizales|ibague|villavicencio|santa marta|monteria|neiva|popayan|pasto|armenia|sincelejo|valledupar|riohacha|quibdo|florencia|yopal|arauca|mocoa|leticia)\b/,
    /\b(petro|casa de narino|congreso de la republica|corte constitucional|fiscalia general)\b/,
    /\b(antioquia|cundinamarca|valle del cauca|santander|atlantico|bolivar|narino|cauca|magdalena|cesar|huila|tolima|meta|caqueta|choco|guajira|casanare|putumayo|arauca|boyaca|caldas|risaralda|quindio|sucre|cordoba|vichada|guainia|vaupes|amazonas|guaviare|san andres)\b/,
];

const MARCA_EXTERIOR = [
    /\b(estados unidos|eeuu|ee\.? ?uu|washington|trump|casa blanca|pentagono)\b/,
    /\b(venezuela|maduro|caracas|ecuador|peru|chile|argentina|brasil|mexico|bolivia|uruguay|paraguay|panama|cuba|nicaragua|haiti|honduras)\b/,
    /\b(union europea|bruselas|espana|madrid|francia|paris|alemania|berlin|reino unido|londres|italia|roma|portugal)\b/,
    /\b(china|pekin|beijing|japon|tokio|india|corea del (norte|sur)|taiwan|filipinas|indonesia)\b/,
    /\b(rusia|putin|moscu|ucrania|kiev|zelenski)\b/,
    /\b(israel|palestina|gaza|hamas|cisjordania|iran|teheran|siria|libano|irak|arabia saudi|turquia|egipto)\b/,
    /\b(otan|onu|naciones unidas|fmi|banco mundial|oms|oea)\b/,
    /\b(africa|nigeria|sudafrica|etiopia|marruecos|argelia|sudan|congo|kenia)\b/,
];

const cuenta = (patrones, texto) => patrones.reduce((n, p) => n + (p.test(texto) ? 1 : 0), 0);

/**
 * ¿Colombia o el mundo?
 *
 * El país del medio es el punto de partida, no la respuesta: El País de España
 * publica sobre Colombia y El Tiempo publica sobre Gaza. Manda el contenido, y
 * el medio solo desempata.
 *
 * Cuando hay marcas de los dos lados gana Colombia, y es deliberado: «Petro se
 * reunió con Lula» es una noticia colombiana con contexto exterior, no una
 * noticia internacional. Al revés se llenaría la pestaña internacional de
 * política nacional.
 *
 * @param {{texto: string, paisDelMedio?: string}} entrada
 * @returns {'nacional'|'internacional'}
 */
export function clasificarAmbito({ texto, paisDelMedio }) {
    const t = normalizar(texto);
    const colombia = cuenta(MARCA_COLOMBIA, t);
    const exterior = cuenta(MARCA_EXTERIOR, t);

    if (colombia > 0) return 'nacional';
    if (exterior > 0) return 'internacional';
    return paisDelMedio && paisDelMedio !== 'CO' ? 'internacional' : 'nacional';
}

// ── Clasificación de tema ────────────────────────────────────────────────────

/** Segmentos de ruta que nunca son una sección temática. */
const RUIDO_URL = /^(\d+|www|noticias|news|articulos?|article|nota|amp|rss|feed|index|home|co|es|en)$/;

/** ¿Este segmento es el slug del titular y no una sección? */
const esSlug = (s) => s.length > 28 || s.split('-').length > 4 || /\.html?$/.test(s);

/**
 * La sección temática de una URL, si es que la hay.
 *
 * Devuelve null para los enlaces de Google News, que son redirecciones
 * (`news.google.com/rss/articles/CBM…`) y no llevan sección: son el 37 % del
 * catálogo y fingir que sí la tienen sería peor que no mirarla.
 *
 * SE ELIGE EL PRIMER SEGMENTO QUE MAPEA A UN TEMA, NO EL PRIMERO A SECAS
 * ----------------------------------------------------------------------
 * Esto devolvía el primer segmento que no fuera ruido, y con eso perdía la
 * sección de cualquier medio que anteponga el país o la región. El caso medido
 * es Infobae, que archiva como `/{país}/{sección}/{fecha}/{slug}`:
 *
 *   infobae.com/colombia/deportes/2026/08/14/el-futbolista-jhon-arias…
 *                └ devolvía esto  └ y la sección era esta
 *
 * De sus 2 041 artículos, **1 460 tenían por «sección» un país** —526 «america»,
 * 339 «espana», 328 «mexico», 166 «peru», 150 «colombia», 51 «estados-unidos»—.
 * Ninguno mapea a un tema, así que la señal de sección se perdía entera y el
 * medio se iba sin clasificar en el 51 % de sus piezas: 1 050 artículos, el 38 %
 * de todo el «sin tema» del corpus. No era el léxico: era mirar el segmento
 * equivocado.
 *
 * NO SE LISTAN PAÍSES NI SE TRATA A INFOBAE APARTE, a propósito. Una lista de
 * países habría que mantenerla y solo arregla a quien ya conocemos. Preferir el
 * segmento que mapea funciona para cualquier estructura y no puede empeorar
 * nada: si el primer segmento ya mapeaba, sigue ganando él.
 *
 * Se conserva el respaldo de devolver el primer segmento plausible aunque no
 * mapee. No influye en la clasificación —`classifyTopics` solo usa la sección si
 * está en `SECCION_URL_A_TEMA`— pero sí es lo que leen los diagnósticos, y ahí
 * saber que un medio archiva por ciudad es información.
 *
 * @param {string} link
 * @returns {string|null}
 */
export function seccionDeLaUrl(link) {
    try {
        const url = new URL(link);
        if (/(^|\.)news\.google\.com$/.test(url.hostname)) return null;

        /** El primero plausible, por si ninguno mapea. */
        let respaldo = null;

        for (const parte of url.pathname.split('/').filter(Boolean)) {
            const limpio = normalizar(decodeURIComponent(parte));
            if (RUIDO_URL.test(limpio)) continue;
            if (esSlug(limpio)) continue;

            if (SECCION_URL_A_TEMA[limpio]) return limpio;
            if (respaldo === null) respaldo = limpio;
        }

        return respaldo;
    } catch {
        /* enlace ilegible: no es motivo para descartar el artículo */
    }
    return null;
}

/**
 * Clasifica un artículo.
 *
 * @param {object} [entrada]
 * @param {string}  [entrada.headline]       titular literal del medio; sin él
 *                                           la clasificación sale vacía, que es
 *                                           el caso que cubre la prueba de
 *                                           entrada vacía
 * @param {string}  [entrada.snippet]        entradilla real, o vacío
 * @param {string}  [entrada.link]           enlace canónico
 * @param {string[]}[entrada.feedCategories] etiquetas `<category>` del ítem RSS
 * @param {string}  [entrada.paisDelMedio]   código de país del medio (registro)
 * @returns {{
 *   temas: string[],
 *   principal: string|null,
 *   ambito: 'nacional'|'internacional',
 *   rescatado: boolean,
 *   puntajes: Record<string, number>
 * }}
 */
export function classifyTopics({
    headline,
    snippet = '',
    link = '',
    feedCategories = [],
    paisDelMedio = 'CO',
} = {}) {
    const titular = normalizar(headline);
    const entradilla = normalizar(snippet);

    /** @type {Record<string, number>} */
    const puntajes = {};

    /**
     * Temas que tienen alguna señal FUERA de la entradilla.
     *
     * Existe por lo que se vio al medir. La entradilla es texto largo y lleno de
     * menciones de pasada, así que dos términos débiles incidentales sumaban
     * 1,6 y disparaban el rescate: «Jay Clayton asume como director de
     * Inteligencia Nacional» acabó en Economía por palabras que estaban en el
     * cuerpo y no en lo que la pieza trata.
     *
     * Forzar la clasificación un poco no puede significar aceptar como única
     * prueba lo que aparece de refilón. El rescate exige que el titular, la
     * sección de la URL o la etiqueta del medio digan algo; la entradilla suma,
     * pero no decide sola.
     */
    const conSenalDeContexto = new Set();

    const sumar = (id, peso, esContexto) => {
        puntajes[id] = (puntajes[id] ?? 0) + peso;
        if (esContexto) conSenalDeContexto.add(id);
    };

    for (const tema of TEMAS) {
        for (const patron of tema.fuertes) {
            if (patron.test(titular)) sumar(tema.id, PESO.fuerteTitular, true);
            else if (entradilla && patron.test(entradilla)) sumar(tema.id, PESO.fuerteEntradilla, false);
        }
        for (const patron of tema.debiles) {
            if (patron.test(titular)) sumar(tema.id, PESO.debilTitular, true);
            else if (entradilla && patron.test(entradilla)) sumar(tema.id, PESO.debilEntradilla, false);
        }
    }

    const seccion = seccionDeLaUrl(link);
    if (seccion && SECCION_URL_A_TEMA[seccion]) {
        sumar(SECCION_URL_A_TEMA[seccion], PESO.seccionUrl, true);
    }

    for (const cruda of feedCategories) {
        const etiqueta = normalizar(cruda).trim();
        if (CATEGORIA_MEDIO_A_TEMA[etiqueta]) {
            sumar(CATEGORIA_MEDIO_A_TEMA[etiqueta], PESO.categoriaMedio, true);
        }
    }

    const ordenados = Object.entries(puntajes).sort((a, b) => b[1] - a[1]);
    let temas = ordenados.filter(([, p]) => p >= UMBRAL_ASIGNA).map(([id]) => id);
    let rescatado = false;

    // El pulgar en la balanza: si nada llegó al umbral pero hay una señal real,
    // se asigna igualmente. Se marca como rescatado para poder medir cuánto del
    // catálogo se está clasificando así.
    if (temas.length === 0) {
        const candidato = ordenados.find(
            ([id, p]) => p >= UMBRAL_RESCATE && conSenalDeContexto.has(id)
        );
        if (candidato) {
            temas = [candidato[0]];
            rescatado = true;
        }
    }

    return {
        temas,
        principal: temas[0] ?? null,
        ambito: clasificarAmbito({ texto: `${headline ?? ''} ${snippet ?? ''}`, paisDelMedio }),
        rescatado,
        puntajes,
    };
}

/**
 * Reparto sobre un lote, para vigilar el clasificador.
 *
 * `rescatados` es la cifra que importa: es la proporción del catálogo asignada
 * por señal débil. Si crece, «forzar un poco» dejó de ser un poco.
 */
export function resumirClasificacion(articulos) {
    const porTema = {};
    let sinTema = 0;
    let rescatados = 0;
    let multiples = 0;
    const porAmbito = { nacional: 0, internacional: 0 };

    for (const articulo of articulos) {
        const r = classifyTopics(articulo);
        porAmbito[r.ambito] += 1;
        if (r.rescatado) rescatados += 1;
        if (r.temas.length === 0) sinTema += 1;
        if (r.temas.length > 1) multiples += 1;
        for (const t of r.temas) porTema[t] = (porTema[t] ?? 0) + 1;
    }

    return { total: articulos.length, porTema, porAmbito, sinTema, rescatados, multiples };
}
