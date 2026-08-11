# Medios candidatos para los departamentos sin cobertura

Investigación del **2026-08-09**. Sale de que el mapa por departamento dejaba
**25 de los 33 en blanco**, y un departamento en blanco no dice «ahí no pasa
nada»: dice que no tenemos medios suyos.

**Esto es una lista de candidatos verificados contra la red, no un alta.**
Ninguno entra al catálogo sin ficha de orientación firmada
(`PROTOCOLO_JUICIO_EDITORIAL.md`) y sin registro de propiedad.

---

## Cómo se verificó

Se probaron **43 dominios**. Para cada uno, en este orden:

1. El `<link rel="alternate" type="application/rss+xml">` declarado en el HTML
   de la portada — la vía que funcionó con Cambio y la única que encuentra
   rutas raras. **Dar un medio por mudo sin probar esto es el error que ya se
   cometió con Telepacífico y Teleantioquia.**
2. Veintitantas rutas convencionales, incluidas las de Joomla, Blogger y
   `/api/rss`. Esa última es la que destapó a El Pilón, que por la vía normal
   figuraba como mudo.

De cada feed se cuenta cuántos artículos trae y la fecha del más reciente,
porque «responde» y «publica» no son lo mismo.

---

## Lo que cambia

| | Antes | Después |
|---|---|---|
| Departamentos con medio propio | **8** | **28** |
| Departamentos en blanco | 25 | **5** |

Eran 29 y 4 hasta que la investigación de propiedad descartó a Nariño — ver más
abajo. Los cinco en blanco eran **Amazonas, Córdoba, Guainía, Nariño y Vaupés**. Tras la
segunda vuelta del barrido (ver BARRIDO_NACIONAL.md) **Córdoba y Nariño tienen
candidatos vivos**; los tres amazónicos se confirman como huecos reales, donde la
comunicación existe pero es radio comunitaria y no web.

---

## Con feed vivo — 21 departamentos nuevos

Ordenados por departamento. La antigüedad es del artículo más reciente en el
momento de la comprobación.

| Departamento | Medio | Feed | Último |
|---|---|---|---|
| Arauca | Al Aire Noticias | `alairenoticias.com/feed/` | 38 h |
| Archipiélago de San Andrés | El Isleño | `xn--elisleo-9za.com/index.php?format=feed&type=rss` | 5 h |
| Boyacá | El Diario de Boyacá | `eldiarioboyaca.com/feed/` | 3 h |
| Caquetá | Lente Regional | `lenteregional.com/feed/` | 29 h |
| Casanare | Prensa Libre Casanare | `prensalibrecasanare.com/rss.xml` | 19 h |
| Cauca | Proclama del Pacífico | `proclamadelpacifico.com/feed/` | 2 h |
| Cesar | El Pilón | `elpilon.com.co/api/rss` | 0 h |
| Chocó | Chocó 7 Días | `choco7dias.com/feed/` | 2 h |
| Cundinamarca | Diario de Cundinamarca | `diariodecundinamarca.com/blog-feed.xml` | **437 h** ⚠ |
| Guaviare | El Manduco | `elmanduco.com.co/feed/` | 66 h |
| Huila | Diario del Huila | `diariodelhuila.com/feed/` | 1 h |
| La Guajira | Diario del Norte | `diariodelnorte.net/feed` | 3 h · 100 art. |
| Magdalena | El Informador | `elinformador.com.co/index.php?format=feed&type=rss` | 19 h |
| Meta | Vive el Meta | `viveelmeta.com/feed/` | 20 h |
| Nariño | ~~Diario del Sur~~ | `diariodelsur.com.co/feed/` | **descartado** ✕ |
| Putumayo | MiPutumayo | `miputumayo.com.co/feed/` | 51 h |
| Quindío | Quindío Noticias | `quindionoticias.com/feed` | 0 h |
| Risaralda | El Diario | `eldiario.com.co/feed/` | 5 h · 99 art. |
| Sucre | Sucre Noticias | `sucrenoticias.com/feed/` | **332 h** ⚠ |
| Tolima | Ecos del Combeima | `ecosdelcombeima.com/rss.xml` | 2 h |
| Vichada | El Morichal | `elmorichal.com/feed/` | 55 h |

### Segundos de su departamento, también vivos

No se descartan: donde el primero flojee, estos evitan que la región dependa de
una sola voz, que es justo lo que la vista venía a romper.

| Departamento | Medio | Feed | Último |
|---|---|---|---|
| Casanare | Diario de Casanare | `diariodecasanare.com/feed/` | 51 h |
| Casanare | Qué Pasa Yopal | `quepasayopal.com/feed/` | 80 h |
| Huila | La Nación | `lanacion.com.co/feed/` | 4 h |
| Tolima | Ecos del Combeima | `ecosdelcombeima.com/rss.xml` | 2 h |
| Boyacá | Última Hora Boyacá | `ultimahoraboy.com/feed/` | 449 h ⚠ |
| Chocó | Diario del Chocó | `diariodelchoco.com/feed/` | **2 302 h** ⚠ |
| Tolima | El Nuevo Día | `elnuevodia.com.co/rss.xml` | 1 h · **editora en liquidación** ✕ |

---

## Lo que apareció al investigar la propiedad, y cambió dos recomendaciones

Al hacer las fichas de los cuatro departamentos grandes (2026-08-09) salieron
**dos casos que la comprobación de feeds no podía ver**, porque un feed sano no
dice nada de la salud de la empresa:

- **El Nuevo Día (Tolima)**: Editorial Aguasclaras S.A. está **en liquidación
  judicial** y su matrícula RUES, cancelada. Cerró la rotativa tras 31 años y el
  Ministerio de Trabajo le abrió averiguación por impago de salarios. Sigue
  publicando en digital. **Para el Tolima se propone Ecos del Combeima**, que
  además fue quien reportó el cierre de su competidor.
- **Diario del Sur (Nariño)**: Grupo Editorial Diario del Sur S.A.S. **en
  liquidación**, matrícula cancelada — y encima el feed sin fechas. Dos bloqueos
  independientes. **Nariño se queda sin candidato** y hay que volver a buscar.

Detalle y fuentes en `fichas/el-nuevo-dia.md` y `fichas/diario-del-sur.md`.

**La lección para las 17 fichas que faltan: mirar el RUES ANTES que el feed.**
Comprobar que publica es barato y no dice lo importante.

---

## Los tres avisos, que no son detalles

**Diario del Sur (Nariño) trae los `<pubDate>` VACÍOS.** El feed responde, tiene
diez artículos y ninguno lleva fecha. Sin `publishedAt` la retención no puede
podarlos y «más recientes» no puede ordenarlos: entrarían al feed como si
fueran de cualquier momento. **Es el único candidato de Nariño con feed**, así
que o se les escribe, o se busca otro medio pastuso, o se decide qué fecha
ponerles y se declara — pero inventar una fecha silenciosamente, no.

**Diario del Chocó lleva 96 días sin publicar** y Última Hora Boyacá, 19. No
están rotos, están quietos. Como en ambos departamentos hay un primero que sí
publica, entran como segundos o no entran, pero no deben ser la única voz de su
región.

**Cundinamarca y Sucre solo tienen candidatos de dos semanas de antigüedad.**
Son los únicos que encontré. Merecen otra vuelta antes de darlos por buenos.

---

## Los cuatro que siguen en blanco

**Ninguno se declara mudo: los cuatro tienen medio, y el medio tiene un
obstáculo concreto.**

| Departamento | Medio que existe | Qué lo bloquea |
|---|---|---|
| **Córdoba** | El Meridiano (`elmeridiano.co`) | Next.js sin feed y devuelve **403 a los bots**. Es el grupo dominante de Córdoba y Sucre: dejarlo fuera es dejar fuera al que manda allí. |
| **Amazonas** | Periódico Umarí (`periodicoumari.com`) | El dominio resuelve, pero **el handshake TLS falla** desde dos redes distintas y por HTTP devuelve 409. No es nuestra IP: es su servidor. |
| **Vaupés** | La Marandúa | **Solo Facebook.** Periódico impreso dirigido por Emerson Castro; no tiene sitio propio. |
| **Guainía** | — | No encontré ningún medio con presencia web. El Morichal, de Puerto Carreño, cubre Guainía desde Vichada, pero es de Vichada. |

Para Córdoba y Amazonas la vía pendiente es escribirles: los dos publican y el
problema es de configuración, no de voluntad. Para Vaupés y Guainía, la pregunta
es más de fondo y no la resuelve un feed.

---

## Lo que falta antes de que ninguno entre

Por cada medio que se dé de alta:

1. **Ficha de orientación** en `fichas/<id>.md` con valor propuesto y **la firma
   de Jose pendiente**. El juicio editorial no lo firma un modelo.
2. **Registro de propiedad** en `mediaOwnership.js` — quién es el dueño. Es la
   mitad del proyecto y en medios regionales suele ser lo más difícil y lo más
   revelador: varios de estos son de familias con cargo político en la región.
3. **`departamento`** en la entrada del registro. Es de dónde ES el medio, no lo
   que cubre.
4. Pasar `npm run check:feeds` con el medio ya dentro.

Son 21 medios. **Hacerlo en bloque y de prisa sería exactamente lo que este
proyecto no hace**: veintiuna clasificaciones sin evidencia valen menos que
tres con ella.

---

## Estado de las fichas

Veintidós fichas escritas (2026-08-09), ninguna firmada. **Ya no falta ninguna**:
todos los candidatos con feed verificado tienen la suya. Se hacen por tandas y con
el registro mercantil por delante, no en bloque.

| Departamento | Medio | Ficha | Estado |
|---|---|---|---|
| Cesar | El Pilón | `fichas/el-pilon.md` | +0,20 provisional · nivel 1 completo |
| Huila | Diario del Huila | `fichas/diario-del-huila.md` | +0,20 provisional · falta accionariado |
| Cauca | Proclama del Pacífico | `fichas/proclama-del-pacifico.md` | 0,00 provisional · en SembraMedia |
| Boyacá | EL DIARIO | `fichas/el-diario-boyaca.md` | +0,20 provisional · **objeción de método sin resolver** |
| Tolima | Ecos del Combeima | `fichas/ecos-del-combeima.md` | **alta condicionada**: ¿es afiliada de Blu Radio? |
| Magdalena | El Informador | `fichas/el-informador.md` | **sin número**: nivel 1 a medias |
| La Guajira | Diario del Norte | `fichas/diario-del-norte.md` | +0,20 provisional · **publica su accionariado** |
| Risaralda | El Diario | `fichas/el-diario-pereira.md` | +0,20 provisional · absorbió al diario rival |
| Chocó | Chocó 7 Días | `fichas/choco-7-dias.md` | 0,00 provisional · única voz viva del Chocó |
| Meta | Vive el Meta | `fichas/vive-el-meta.md` | 0,00 provisional · **propietario desconocido** |
| Tolima | El Nuevo Día | `fichas/el-nuevo-dia.md` | **sin número**: editora en liquidación |
| Arauca | Al Aire Noticias | `fichas/al-aire-noticias.md` | **sin número**: solo una razón social |
| Casanare | Prensa Libre Casanare | `fichas/prensa-libre-casanare.md` | **sin número**: hay editor, no hay sociedad |
| Quindío | Quindío Noticias | `fichas/quindio-noticias.md` | **sin número**: nivel 1 vacío del todo |
| Sucre | Sucre Noticias | `fichas/sucre-noticias.md` | **sin número**: nivel 1 vacío + feed parado 14 días |
| Vichada | El Morichal | `fichas/el-morichal.md` | 0,00 provisional · **sin ánimo de lucro**, cubre también Guainía |
| Guaviare | El Manduco | `fichas/el-manduco.md` | 0,00 provisional · cuatro cargos, un apellido |
| Putumayo | MiPutumayo | `fichas/miputumayo.md` | 0,00 provisional · fundador-director desde 2004 |
| Caquetá | Lente Regional | `fichas/lente-regional.md` | 0,00 provisional · pide «apoyo sin restricciones» |
| San Andrés | El Isleño | `fichas/el-isleno.md` | **sin número**: solo un nombre comercial |
| Cundinamarca | Diario de Cundinamarca | `fichas/diario-de-cundinamarca.md` | **sin número**: nivel 1 vacío + 18 días parado |
| Nariño | Diario del Sur | `fichas/diario-del-sur.md` | **sin número**: editora en liquidación + feed sin fechas |

### Lo que se aprendió haciéndolas

**El +0,20 de los regionales se pone por parecido con los que ya están, y un
parecido no es evidencia.** Está escrito en el apartado CONTRA de cada ficha.
Si la banda regional del catálogo está mal calibrada, estas fichas la replican
y encima le dan aspecto de método. Es lo primero que habría que atacar cuando
haya corpus.

**Tres trámites de Cámara de Comercio desbloquearían tres fichas**: Neiva
(Editora del Huila), Tunja (EL DIARIO) y Santa Marta (Editorial Magdalena). Son
en línea y de pago simbólico. Es la vía más barata que queda y la única que
convierte «lo dice su web» en nivel 1 de verdad.

**Un feed sano no dice nada de la salud de la empresa.** Dos de los ocho
publican con normalidad y tienen la editora en liquidación.



### Lo que apareció en la tercera tanda

**Pereira ya no tiene dos diarios, tiene uno.** El Diario nace en 2016 de
fusionar *La Tarde* y *Diario del Otún*, y quedó en manos de los hermanos
Ramírez Múnera, que ya eran dueños del segundo. Poner a El Diario como «el medio
de Risaralda» es exacto y a la vez engañoso: es el único que queda, no el que
ganó una competencia que siga existiendo. **Ese hecho merece salir en la propia
vista departamental**, porque es información sobre pluralidad y de eso trata el
sitio.

**Diario del Norte publica su accionariado con porcentajes** —Demis Pacheco
Fernández 80 %, y dos socias al 10 %— cosa que no hace ningún otro. Y no es solo
un periódico: **Sistema Cardenal S.A.S. emite radio en Valledupar, San Juan del
Cesar y Riohacha**, así que el dueño del único medio de La Guajira también tiene
voz en el Cesar. Perdió tres emisoras en 2024, que pasaron a la radio adventista.

**Un accionista al 80 % no tiene contrapeso interno**, y en el departamento del
Cerrejón eso importa: su independencia declarada descansa en la voluntad de una
persona, no en una estructura.

### El patrón, tras doce fichas

Los medios se parten en dos grupos, y no por su línea:

- **Los que dicen quiénes son** — Diario del Norte (accionariado con
  porcentajes), El Pilón (junta y accionista mayoritario), El Diario de Pereira
  (dueños nombrados). Sus fichas se sostienen.
- **Los que solo dicen cómo se llaman** — El Informador, Vive el Meta, EL DIARIO
  de Boyacá, Chocó 7 Días. Nombre de empresa, a veces un NIT, y ningún dueño.
  Sus fichas van sin número o con objeción de método sin resolver.

**La transparencia de propiedad no correlaciona con el tamaño ni con la región:
correlaciona con la decisión de publicarla.** Es, en sí mismo, un hallazgo del
proyecto.

### La cuarta tanda no dio ni un número, y ese es el resultado

Arauca, Casanare, Quindío y Sucre: **los cuatro sin valor propuesto**, todos por
la misma razón. Ninguno publica quién lo edita.

Lo que se encontró de cada uno, entero:

- **Al Aire Noticias** (Arauca) — «Al Aire Comunicar S.A.S.» en un pie de
  copyright. Ni NIT ni personas.
- **Prensa Libre Casanare** — un nombre, Miguel Ángel Cristancho, editor, con
  correo de Gmail. Ninguna sociedad. **Es el único de los cuatro al que se le
  puede escribir**, y eso lo convierte en el más fácil de desbloquear.
- **Quindío Noticias** — nada, con más de 527 000 seguidores en Facebook.
- **Sucre Noticias** — nada, y encima el feed lleva catorce días parado.

**Que la tanda entera saliera sin número no es un fracaso de la investigación:
es el dato.** Cuatro departamentos cuyo medio digital más visible no dice quién
lo sostiene. En Casanare, que vive de regalías petroleras, y en Arauca, que es
frontera con presencia armada, eso no es un descuido administrativo.

### Dos gestiones que desbloquean cinco departamentos

1. **El Meridiano** (`elmeridiano.co`) se define como el medio de «Córdoba,
   Sucre y la región Caribe». Un solo obstáculo técnico —Next.js sin feed y 403
   a los bots— **deja dos departamentos sin voz**. Resolverlo es la gestión más
   rentable que queda.
2. **La Crónica del Quindío** y **El Quindiano** son WordPress sin feed en las
   23 rutas probadas. Un WordPress sin feed suele estar desactivado a propósito,
   no ausente. La Crónica es el diario tradicional del departamento y sería
   preferible al medio anónimo que hoy es el único candidato del Quindío.

Y queda una pista sin explorar para Sucre: [mapeomedios.com](https://www.mapeomedios.com/),
una plataforma que mapea el ecosistema de medios del departamento.

---

## Cerrada la serie: 22 fichas, ninguna firmada

Todos los candidatos con feed verificado tienen ficha. El balance:

| | |
|---|---|
| Con valor provisional propuesto | **11** |
| Sin número, por falta de nivel 1 o por bloqueo | **11** |

**Once de veintidós no publican quién los edita.** No es una casualidad
regional: pasa en Magdalena, Arauca, Casanare, Quindío, Sucre, San Andrés y
Cundinamarca por igual.

### Lo que trajo la quinta tanda

**El Morichal (Vichada) es el único sin ánimo de lucro de los veintidós**, y el
único que cuenta su propia cadena societaria incluida una liquidación. Además
**cubre Guainía** —Inírida y Barrancominas— con un cofundador indígena nacido
allí. Guainía no deja de estar en blanco en la vista, porque el medio es de
Vichada, pero el diagnóstico cambia: no es que nadie cuente Guainía, es que
quien la cuenta está al lado.

**El Morichal destapa además una decisión de producto.** Es regional e
independiente a la vez, y `alcanceDe` mira primero el departamento: quedaría
**oculto por omisión en el mapa de propiedad**. El compromiso estaba escrito al
hacer el filtro, pero conviene verlo con un caso real: el primer medio
independiente de provincia que llega es justo el que la regla esconde.

**El Manduco (Guaviare) tiene cuatro cargos y un apellido**: fundador, director,
director emérito y gerente son cuatro Díaz. En un departamento de 90 000
habitantes, basta con que un Díaz tenga un interés para que el medio lo tenga.

**Cundinamarca merece decidirse, no buscarse.** Rodea a Bogotá, y su cobertura
la hacen El Tiempo, El Espectador, Semana y Blu, que ya están dentro. Un lector
de Soacha que filtre por su departamento recibirá prensa bogotana, y el mapa
dirá que está cubierto cuando lo que está es absorbido. Hay tres salidas y están
escritas en `fichas/diario-de-cundinamarca.md`.

### Lo que queda, y ya no es investigación

1. **La afiliación de Ecos del Combeima a Blu Radio.** Lo más urgente.
2. **Certificados de Cámara de Comercio**: Neiva, Tunja, Santa Marta,
   Villavicencio (con NIT), Pereira, Arauca, San Andrés, Vichada.
3. **Escribir a El Meridiano** — desbloquea Córdoba y Sucre de una vez.
4. **Escribir a La Crónica del Quindío** — WordPress sin feed, y sería
   preferible al medio anónimo que hoy es el único candidato del Quindío.
5. **Escribir a Prensa Libre Casanare y a MiPutumayo**, que tienen persona
   identificable, para preguntar sociedad y financiación.
6. **Buscar prensa municipal** en Soacha/Girardot (Cundinamarca) y en Tumaco o
   Ipiales (Nariño), los dos departamentos grandes sin candidato viable.

---

## ALTA — 2026-08-09

**Nueve medios dentro.** Los departamentos con medio propio pasan de **8 a 17**.

| Departamento | Medio | Orientación provisional |
|---|---|---|
| Cesar | El Pilón | +0,20 |
| Huila | Diario del Huila | +0,20 |
| La Guajira | Diario del Norte | +0,20 |
| Risaralda | El Diario (Pereira) | +0,20 |
| Cauca | Proclama del Pacífico | 0,00 |
| Chocó | Chocó 7 Días | 0,00 |
| Guaviare | El Manduco | 0,00 |
| Putumayo | MiPutumayo | 0,00 |
| Vichada | El Morichal | 0,00 |

Los nueve entran con `reviewedAt: null`, como los otros 45. **Ninguno está
firmado.**

### `factuality: null` en los nueve, y hubo que abrir la puerta para ello

`checkRegistry` **exigía** un número de factualidad para dar de alta a
cualquiera. Esa obligación tenía un efecto perverso: para meter un medio había
que inventarle un historial de rigor factual. Es exactamente lo que la Fase 0
quitó del motor —fijaba 0.88 para todo y la interfaz lo mostraba como
«Factualidad IA: 88 %»— y volvía a colarse por la puerta del catálogo.

Ahora `null` es válido y significa **no medida**. Se avisa, no se falla. En
consecuencia:

- La tabla del mapa mediático dice **«sin medir»** en esa columna.
- El gráfico **no los coloca**: sin factualidad no tienen altura en el eje
  vertical, y ponerlos en la media o en el suelo afirmaría algo que no sabemos.
  La página dice cuántos faltan y por qué.

### Trece candidatos NO entraron, y por tres motivos distintos

- **Nueve** porque su ficha quedó sin número.
- **Uno**, Ecos del Combeima, porque su alta está condicionada a resolver si es
  afiliada de Blu Radio.
- **Tres** —EL DIARIO de Boyacá, Vive el Meta y Lente Regional— porque dar de
  alta obliga a declarar un `ownerType`, es decir, a afirmar de quién es el
  medio, **y de esos tres no lo sé**. Sus propias fichas ya decían que debían ir
  sin número; esto es la consecuencia práctica.

### Lo que saltó al hacerlo

La prueba de la CSP falló al añadirlos: los nueve dominios podían traer imagen
en su feed y `img-src` no los permitía. Es la regla de «imágenes reales o
ninguna» funcionando — se añadieron a `public/_headers` y a `vercel.json`.

De los nueve, **ocho tienen logo**; Diario del Norte devolvió 404 y se pintará
con monograma.

---

## Balance final de la jornada — 2026-08-09

| | |
|---|---|
| Candidatos investigados | **27** |
| Fichas escritas | **24** (una es conjunta para cuatro medios) |
| **Dados de alta** | **10** — nueve regionales + Telecafé + Boyacá Digital |
| Departamentos con medio propio | **de 8 a 18** |
| Sin número, por falta de nivel 1 | **14** |

**Diecisiete de los veintisiete candidatos no publican quién los edita.** Es el
hallazgo más consistente de toda la jornada, y no correlaciona con el tamaño ni
con la región: correlaciona con la decisión de publicarlo.

### Lo que desbloquea más departamentos por menos trabajo

1. **El Meridiano** (Córdoba) — cubre también Sucre. Un solo obstáculo técnico
   deja dos departamentos sin voz. Escribirles.
2. **Ocho certificados de Cámara de Comercio** — Neiva, Tunja, Santa Marta,
   Villavicencio, Pereira, Arauca, San Andrés, Montería. Desbloquean fichas ya
   escritas y a la espera.
3. **La afiliación de Ecos del Combeima a Blu Radio** — decide si el Tolima
   tiene voz propia o una afiliada de Valorem.
4. **La FLIP**, cuando su web vuelva.

### Lo que no se arregla buscando más

**Amazonas, Guainía y Vaupés** no tienen medios web, y tras tres búsquedas con
ángulos distintos eso es un resultado, no una carencia del método. Allí la
comunicación es radio comunitaria e indígena. Un agregador de RSS no la alcanza.

Decirlo en la vista departamental —«aquí no llegamos, y esta es la razón»— es
más honesto que dejar tres departamentos en blanco como si nadie contara nada.
