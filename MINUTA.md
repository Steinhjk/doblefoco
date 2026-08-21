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

Ninguno de estos lo habría encontrado la auditoría: salieron de leer código.

El cuarto de esta lista —`opinion`, que era el que compartía forma con los fallos
de aquel día, **la intención escrita en el código y el comportamiento
contrario**— se cerró el 2026-08-21 y está abajo. Los tres que quedan son de otra
naturaleza: no hay nada roto que arreglar, hay algo que **nadie ha decidido**.

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

### Los puntos ciegos: 0 en 6 299 historias, y no es por falta de datos

- **Origen:** `ESTUDIO_PUNTOS_CIEGOS.md`, 2026-08-21, pedido por Jose.
- **Dos fallos independientes.** Uno es de costura: el servidor calcula el punto
  ciego con tasas base y el cliente lo recalcula **sin ellas**, además de no
  copiar `raw.blindspot` en `normalizeStory`. El veredicto no llega nunca a la
  pantalla, y `MobileSidebar` tiene una pestaña «Puntos ciegos» que solo puede
  enseñar su estado vacío.
- **El otro es de modelo, y no lo cura más masa.** `(1-q)^n < 0,05` con la
  izquierda al **3,29 %** exige **90 medios en una sola historia**; la mayor del
  corpus tiene 16 y el catálogo son 76. **77 historias cumplen todas las demás
  condiciones y mueren en esa.**
- **La propiedad perversa:** cuanto más pequeña es la voz de un espectro, más
  difícil se vuelve afirmar que falta. Contradice el propósito editorial escrito.
- **Comprobado que no es cosa del umbral:** en historias de 10+ medios, que falte
  la izquierda ocurre el **78 %** de las veces. Es lo normal, no lo raro.
- **Y la izquierda calla en parte por avería:** 5 de sus 13 medios aportan cero
  —Vorágine y Razón Pública entre ellos, ya diagnosticados como fallo de IP— y
  dos medios aportan el 88,6 %.
- **Estado:** ABIERTO. **Decisión de producto.** El estudio recomienda arreglar la
  costura, declarar inalcanzable la rama de la izquierda con el número escrito, y
  llevar el desequilibrio a donde sí se puede afirmar —el énfasis dispara en el
  19,5 % de las historias grandes—. Lo que NO recomienda es bajar el umbral hasta
  que algo salga.

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

## 2026-08-21 · La opinión vuelve a quedarse fuera del agrupamiento

Medido contra producción antes de tocar nada: **71 de los 4 000 artículos en
memoria eran opinión** —62 columnas, 7 editoriales, 2 caricaturas— y reentraban
al agrupamiento en cada arranque. Formaban **135 historias, 3 de ellas
multifuente**, que son las que corrompen el producto. La peor era exactamente el
caso que Jose describió el 2026-08-09:

```
HISTORIA: «Pereira y Risaralda: La hora de la solidaridad y la reconstrucción»
   [OPINIÓN/columna]    el-diario-pereira
   [OPINIÓN/editorial]  diario-del-norte
```

Dos opiniones y ni un solo hecho reportado, presentadas como historia
multifuente. Otra juntaba una noticia de Pulzo con una columna de El Espectador:
el sitio anunciaba dos fuentes cruzando espectro cuando una era una columna.

**Después del despliegue (`593ad40`): 0, 0 y 0.** Las 6 310 historias se
recompusieron y el total bajó de 6 443 a 6 310 — las ~133 que faltan eran
historias que solo eran una columna. Los 7 invariantes siguen pasando.

### Se deriva, no se guarda, y esta minuta pedía lo contrario

Esta minuta pedía «columna nueva, escritura en el INSERT, lectura en la
rehidratación, y migración», por analogía con `topics`. **La analogía era falsa y
conviene dejar escrito por qué**, porque el criterio sirve para el próximo caso:

`detectarOpinion` es **función pura de la URL** —tres expresiones regulares sobre
el pathname, sin registro ni estado— y la URL ya es permanente: `canonical_url`
es la clave del ON CONFLICT y no se reescribe nunca. `topics` había que guardarlo
porque **se pierde si no se guarda**: es el resultado de una clasificación que no
se puede rehacer desde la fila. La opinión no. Guardarla sería duplicar un dato
que ya está.

Y la versión derivada es **mejor**, no solo más barata:

1. **No cierra ninguna puerta.** El día que haga falta consultarla en SQL —el
   índice de columnistas— la columna se rellena entera desde `canonical_url`.
2. **Se cura sola.** La detección está declarada incompleta. Un valor guardado
   seguiría mintiendo sobre los artículos viejos cuando se añada un patrón; este
   se corrige en el siguiente arranque.
3. Cuesta **6,3 ms** para los 4 000, medido.

### Lo que enseñó sobre los comentarios de este repositorio

Los comentarios prometen que la opinión «alimenta el agregado de formadores de
opinión» y «el índice de columnistas». **Ninguno de los dos existe.** El único
consumidor de `opinion` en todo el código es el filtro del agrupamiento. Es la
misma enfermedad del 2026-08-19 —el comentario describe una intención, no un
comportamiento—, y esta vez apareció en el comentario que yo mismo iba a usar
como prueba de que hacía falta una columna.

## 2026-08-21 · El vigilante del desfase gritaba por la prosa

`comprobarDesfase.mjs` comparaba el commit de Fly con el de `main` por igualdad
estricta. Al actualizar esta minuta, `main` avanzó y el vigilante quedó listo
para avisar de que «Fly está 1 commit por detrás» por dos archivos `.md`. **Hubo
que pagar un despliegue entero de Fly solo para callarlo.**

**Hecho:** rama `vigilancia/desfase-solo-lo-que-llega`. Ahora pregunta si algún
commit entre Fly y main tocó una ruta que **llega a la imagen**, que es lo que la
cabecera del workflow decía querer saber desde el principio.

**Esto no es bajar un umbral para que deje de molestar**, que es como se estropea
un vigilante y está escrito aquí mismo a propósito de Razón Pública. Es corregir
QUÉ mide para que responda la pregunta que dice responder. La diferencia está en
que **la lista es de lo que se perdona, no de lo que cuenta**: cualquier ruta que
no encaje se trata como desfase, porque los dos errores no cuestan lo mismo
—perdonar de más silencia la avería que este workflow existe para cazar, y que ya
mordió dos veces—.

Probado en los dos sentidos con una salud falsa: un commit de solo prosa sale 0 y
lo dice en voz alta; un commit que toca `server/` sale 1 y nombra el archivo.
El predicado tiene 19 pruebas propias en `shared/rutasDeLaImagen.test.js`.


## 2026-08-21 · Las cuatro ramas del 19 entran a `main`, y el motor se despliega

Todo lo que quedó sin fusionar la sesión anterior está en producción, en el
commit **`68f0230`**. Se fusionó primero a una rama de integración, se verificó
el resultado **junto** —no rama por rama— y se desplegó desde `main` con el árbol
limpio, para que la imagen de Fly quede marcada con el commit que de verdad
sirve.

| Rama | Dónde vive |
|---|---|
| `motor/rehidratacion-pierde-tema` | Fly (`npm run deploy`) |
| `auditoria/trazabilidad` | Ambos: la auditoría corre fuera, el panel va en el cliente |
| `mapa/puntos-sin-color` | Vercel |
| `estudio/ground-news` | Solo documentos |

Verificado sobre el resultado fusionado: lint limpio, `tsc` sin errores,
**597/597 pruebas**, build correcto, y **7/7 invariantes** contra producción.
El conflicto que se temía en `PLANEACION.md` no se materializó.

**Fly y Vercel quedaron en el mismo commit**, que es la condición que
`desfase.yml` comprueba y la que este proyecto rompe con más facilidad, porque
empujar a `main` publica uno de los dos y no el otro.

**Lo que se tocó de más, y por qué:** `.claude/` entró en `.gitignore`.
`npm run deploy` aborta con el árbol sucio —y hace bien—, pero lo que lo
ensuciaba era el worktree de la herramienta, que no es del proyecto.

**Lo que NO está verificado:** nadie ha abierto el mapa ni Categorías en un
navegador. Hay preview de Vercel para la rama de integración y el sitio
responde 200, pero eso no es haberlo mirado.


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

> ✅ **DESPLEGADO el 2026-08-21 en el commit `68f0230`**, Fly y Vercel en el
> mismo commit. `npm run invariantes` pasa **7/7**. La portada pasó de 30/100
> historias con tema a **96/100**, y lo internacional de **3 a 94** — ese era el
> daño callado: el catálogo entero se declaraba nacional.
>
> **Y enseñó algo sobre cómo se mide un despliegue.** La primera medición, seis
> segundos después de que el worker arrancara, daba todavía 6/7 y 4 189 historias
> rotas; parecía que el arreglo no servía. No era eso: el motor rehidrata y
> recompone **al arrancar**, y a las 02:06:47 reescribió las 6 443 historias de
> una vez. **Medir un despliegue en el instante en que termina mide la máquina
> anterior**, y en este proyecto la diferencia entre las dos lecturas era la que
> hay entre «arreglado» y «no sirvió».

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
