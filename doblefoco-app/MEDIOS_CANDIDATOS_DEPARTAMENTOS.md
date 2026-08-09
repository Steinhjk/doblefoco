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
| Departamentos con medio propio | **8** | **29** |
| Departamentos en blanco | 25 | **4** |

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
| Nariño | Diario del Sur | `diariodelsur.com.co/feed/` | **sin fecha** ⚠ |
| Putumayo | MiPutumayo | `miputumayo.com.co/feed/` | 51 h |
| Quindío | Quindío Noticias | `quindionoticias.com/feed` | 0 h |
| Risaralda | El Diario | `eldiario.com.co/feed/` | 5 h · 99 art. |
| Sucre | Sucre Noticias | `sucrenoticias.com/feed/` | **332 h** ⚠ |
| Tolima | El Nuevo Día | `elnuevodia.com.co/rss.xml` | 1 h |
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
