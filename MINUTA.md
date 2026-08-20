# Minuta — el hilo de lo que queda pendiente

## Para qué existe, y qué la obliga

**Pedida por Jose el 2026-08-19**, y con un motivo que salió de una crítica a mi
propio trabajo: la auditoría automática que se montó ese mismo día produce
hallazgos, abre un issue y **no sabe qué pasó después**. Si nadie lee el issue,
en tres meses la auditoría será otro comentario que describe una intención que ya
no ocurre — que es justo la enfermedad que este proyecto tuvo hoy cuatro veces
seguidas.

> **Todo lo que una auditoría o una revisión deja pendiente se anota aquí, con su
> fecha y con lo que se decidió.** Un hallazgo que no está en esta lista no está
> pendiente: está olvidado, y las dos cosas se ven igual.

Esto es distinto de los otros tres archivos, y conviene no mezclarlos:

| Archivo | Qué guarda |
|---|---|
| `PLANEACION.md` | Ideas a medio hablar, rumbos, lo que todavía no es tarea |
| `DECISIONES.md` | Decisiones tomadas, con su razón |
| `SIGUIENTE.md` | La nota de traspaso de una sesión |
| **`MINUTA.md`** | **Lo que una revisión encontró y todavía no se ha hecho** |

## Cómo se cruza con el libro de hallazgos

`doblefoco-app/auditoria/hallazgos.json` es **el libro que lleva la máquina**:
cada defecto que la auditoría sabe detectar, con su id estable, su `primeraVez`
que no se toca nunca, y su estado. Se concilia solo en cada pasada.

**Esta minuta es más ancha que el libro**, y esa es la razón de que existan las
dos. El libro solo sabe de lo que la auditoría sabe mirar —feeds, fuentes, rutas—.
Casi todo lo grave que se encontró hoy **no lo habría visto ninguna auditoría**:
salió de leer código. Eso también es una revisión, y también deja pendientes.

Las dos reglas del cruce:

1. **Si un hallazgo tiene id en el libro, se cita aquí por su id.** Así se puede
   ir del uno al otro sin adivinar.
2. **Silenciar un hallazgo del libro exige escribir por qué.** Se marca
   `"estado": "aceptado"` con su `nota`, y la nota se copia aquí. La auditoría
   avisa de los aceptados sin motivo: aceptar sin decir por qué no es aceptar, es
   esconder, y a los tres meses nadie sabrá cuál de las dos cosas fue.

---

# ABIERTO

## De la revisión de código del 2026-08-19

Ninguno de estos lo habría encontrado la auditoría. Los cuatro primeros comparten
forma: **la intención está escrita en el código y en su comentario, y el
comportamiento es el contrario.**

### `opinion` no se persiste, y la exclusión del agrupamiento se deshace en cada arranque

- **Origen:** revisión de código, 2026-08-19.
- **Qué pasa:** el 2026-08-09 se decidió que la opinión no forma historias
  —agrupar columnas con noticias mezcla «quién informó» con «quién opinó»—. Pero
  `opinion` no tiene columna en `articles`: no se guarda. Tras cada arranque los
  artículos rehidratados vuelven sin la marca y **reentran al agrupamiento**.
- **Estado:** ABIERTO. Diagnosticado, no arreglado.
- **Qué pide:** columna nueva, escritura en el INSERT, lectura en la
  rehidratación, y migración. Es hermano del fallo de `topics`, ya corregido.

### Infobae se muestrea al 38 % y nadie lo decidió

- **Origen:** auditoría del 2026-08-19 (`infobae/feed`).
- **Qué pasa:** Infobae publica **1 936 piezas al día** y su feed cubre 1,2 h. El
  motor toma 15 cada media hora: entran unas 40 de cada 100. **Nos quedamos con
  el 38 %.**
- **Por qué importa aunque se pueda defender:** puede que muestrear al medio más
  voluminoso esté bien —ya era el 32,5 % del corpus—, pero es el mismo caso que
  el techo de `MAX_ARTICLES`, del que este repositorio escribió que «convertía una
  constante de protección en el límite real del producto sin que nadie lo
  decidiera». Ha vuelto a pasar un nivel más abajo.
- **Y hay un riesgo puro:** su margen contra la red de seguridad de 2 h es
  **0,09**. El día que el motor se caiga y solo quede el cron de Actions,
  perdemos el 91 % de Infobae sin que nada avise.
- **Estado:** ABIERTO. **Decisión de producto de Jose**, no de código.

### Permanencia: una noticia dura 72 h y se borra

- **Origen:** `ESTUDIO_GROUND_NEWS.md`, 2026-08-19.
- **Qué pasa:** `pruneExpiredArticles` borra la fila a las 72 h. No hay archivo.
  Todo el juicio que este proyecto invierte por medio —propiedad, espectro,
  conflicto de interés— se evapora en tres días.
- **Lo que cuesta:** la base crece 4,7 MB al día. 30 días caben en el plan
  gratuito de Supabase; un año son ~2 GB y **25 USD/mes**. El buscador que lo
  acompaña es `tsvector` + índice GIN, sin sobrecosto propio.
- **Estado:** ABIERTO. **Decisión de producto.** El estudio está hecho y la
  pregunta que queda no es técnica: un archivo permanente convierte cada historia
  en una página que seguirá afirmando lo que afirmaba, con la ficha de propiedad
  que era cierta ese día.

### Ventana de agrupamiento: 7 días caben, 30 no

- **Origen:** `ESTUDIO_GROUND_NEWS.md`, 2026-08-19.
- **Medido:** el primer paso de `clusterArticles` compara cada artículo contra
  todos los grupos ya formados y es cuadrático. En el worker de Fly, 7 días serían
  1–2 min por ciclo contra una cadencia de 30; 30 días serían 10–50 min, o sea más
  que el propio intervalo.
- **Estado:** ABIERTO. Subir a 7 días multiplicaría por 2,3 la ventana en que una
  historia puede juntar medios de distinto espectro, que es el núcleo del
  producto. **Nadie ha medido qué le hace eso a los falsos agrupamientos**, y esa
  medida va antes que el cambio.

## De la auditoría automática del 2026-08-19

**Primera pasada del libro: 23 hallazgos abiertos** — 15 de feed, 5 de rutas, 3
de fuentes. Todos nacen con fecha de hoy, así que todavía no hay antigüedad que
enseñar; la tendrán a partir de la pasada del jueves. El detalle vivo está en
`doblefoco-app/auditoria/hallazgos.json`; aquí solo lo que pide una decisión.

### Cinco sitios devuelven 200 a cualquier ruta

- **Ids:** `canal-capital/rutas`, `el-heraldo/rutas`, `quindio-noticias/rutas`,
  `cablenoticias/rutas`, `efe/rutas`.
- **Qué significa:** en esos sitios, el 200 de una página «quiénes somos» **no
  prueba que la página exista**. Las fuentes institucionales que se apoyaban en
  eso ya bajan solas a «no comprobable» en la auditoría.
- **Estado:** ABIERTO. La detección funciona; **qué fuente sustituye a la que ya
  no prueba nada es trabajo de ficha**, y ahí no llega el código.
- **Nota:** Quindío Noticias es reincidente por diseño — es el caso que enseñó
  esta trampa la primera vez.

### Tres fuentes de fichas ya no resuelven

- **Ids:** `boyaca-digital/fuente/...` (404), `el-pilon/fuente/...` (404),
  `dw/fuente/...` (503).
- **Estado:** ABIERTO. Pide sustituir la fuente en la ficha, o declarar la
  ausencia con la regla que ya existe.

### Cuatro feeds están parados

- **Ids:** `telemedellin/feed`, `telecafe/feed`, `w-radio/feed`, `razon-publica/feed`.
- **Qué significa:** parado no es lento. Telemedellín publica 51 piezas al día y
  llevaba 146 horas sin una sola; W Radio sirve piezas de hace diez meses;
  Telecafé responde pero **ninguna pieza trae fecha**, así que no se puede
  auditar. Los que publican despacio —Vorágine, CasaMacondo, Telecaribe, La
  Patria, RTVC— **no** están aquí: eso es su cadencia y la auditoría ya los
  distingue.
- **Estado:** ABIERTO. Pide buscar otra vía de feed para cada uno.

> **Razón Pública puede ser un falso positivo, y conviene decidirlo y no
> discutirlo cada semana.** Publica **por tandas**: sus 10 ítems cubren 36,6 h
> —una pieza cada 4,1 h— y luego lleva 74 h en silencio. La medida es correcta y
> aun así la conclusión puede no serlo, porque un semanario de análisis se ve
> igual que un feed averiado. **Es exactamente para esto que existe `aceptado`
> con nota:** si Jose decide que publicar por tandas es su oficio, se marca en el
> libro con el motivo escrito y deja de avisar, sin desaparecer.
>
> Lo que NO se hizo: mover el umbral para que Razón Pública deje de salir.
> Ajustar una medida hasta que calle al que molesta es como se estropea un
> vigilante.

---

# CERRADO

## 2026-08-19 · Categorías enseñaba catorce ceros

`hydrateArticles` no leía `articles.topics` ni `articles.ambito`. El motor
rehidrata hasta 4 000 artículos en cada arranque y todos volvían sin tema; como
una historia se compone con la unión de los temas de sus artículos, **99 de las
100 historias del feed tenían `topics: []`** sobre un catálogo de 6 408 que sí
estaban clasificadas. El ámbito cayó por lo mismo: **todo el catálogo marcado
como nacional**, con la API respondiendo `internacional: 0`.

**Hecho:** rama `motor/rehidratacion-pierde-tema`. El mapeo salió de la consulta
para poder probarlo, y la prueba va en dos sentidos —que el mapeo devuelva los
campos y que la consulta los pida—.

> ⚠ **Esto vive en el servidor: no basta con empujar a `main`, hace falta
> `npm run deploy` a Fly.** Mientras no se despliegue, sigue roto en producción.

## 2026-08-19 · Puntos invisibles en el mapa de medios

Los medios sin publicar en 72 h se pintaban `fill="transparent"` con el contorno
confiado a un atributo `stroke`. Pero `.map-point` fija `stroke` en la hoja de
estilos y **una regla CSS gana siempre a un atributo de presentación SVG**: el
aro salía del color del fondo y el punto no se veía. Vorágine entre ellos.

Por lo mismo llevaba tiempo sin verse el realce de la búsqueda.

**Hecho:** rama `mapa/puntos-sin-color`. Todos los puntos llevan su color y lo
que cambia es la opacidad; la clave salió del desplegable a la leyenda; y va
también en palabras, no solo en color.

## 2026-08-19 · No existían invariantes de producción

`npm run invariantes`, colgado de `vigilancia.yml` (cada 6 h). Comprueba que lo
que el sitio dice **pueda ser cierto**, que es distinto de que el sitio esté en
pie —lo del 19 de agosto pasó con el sitio perfectamente en pie—.

**La regla del archivo: una contradicción, nunca un umbral.** No se comprueba
«el 40 % de las historias debería tener tema», porque ese número no lo respalda
nada y el día que falle nadie sabrá si el roto es el sitio o el umbral. Se
comprueba que el sitio no se contradiga: si una historia se compone con la unión
de los temas de sus artículos, **una historia sin ningún tema cuyos artículos sí
lo tienen es imposible por construcción**. Eso no necesita número y no envejece.

> **Una corrección a lo que dije antes, que salió de correr esto.** Medí «99 de
> 100 historias sin tema» y era cierto en ese momento, pero **el daño no es
> permanente: se rehace en cada arranque.** Al reiniciar, el motor rehidrata sin
> temas y reconstruye las historias vacías; después la ingesta fresca va
> devolviendo temas a las nuevas. Horas más tarde el mismo feed daba 42 de 100.
>
> Eso dejó ver que **los seis invariantes que miran la API no bastaban**: pasaban
> los siete días de la semana salvo el del despliegue. El que sí lo caza siempre
> mira la base, donde la contradicción está permanentemente visible — y al
> escribir esto marcó **4 050 historias** sin tema teniendo artículos con tema.

## 2026-08-19 · La auditoría no dejaba rastro

Escribía una foto que se sobrescribía cada semana. No se podía responder cuánto
llevaba roto nada, ni qué se había decidido.

**Hecho:** rama `auditoria/trazabilidad`. `auditoria/hallazgos.json` con id
estable, `primeraVez` que no se toca, lo resuelto que no se borra, y las
reincidencias contadas. Y esta minuta.
