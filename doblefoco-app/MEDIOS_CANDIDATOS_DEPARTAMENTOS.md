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
abajo. Los cinco en blanco: **Amazonas, Córdoba, Guainía, Nariño y Vaupés**.

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

Doce fichas escritas (2026-08-09), ninguna firmada. Se hacen por tandas y con
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

### Faltan por ficha (con feed vivo verificado)

Arauca, Archipiélago de San Andrés, Caquetá, Casanare, Cundinamarca, Guaviare,
Putumayo, Quindío, Sucre y Vichada.

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
