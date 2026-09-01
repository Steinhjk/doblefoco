# Plan de continuidad — DobleFoco, desde el 2026-08-26

**Sucede a `PLAN_REVISION_KIMI.md`**, cuya Fase 1 está cerrada y del que quedan
tres tareas de Fase 2. No lo sustituye: lo absorbe y le añade lo que ha salido
después, incluido lo que apareció al poner los memos al día ese mismo día.

**Qué es y qué no es.** Es el orden en que conviene atacar lo que ya está
identificado. No inventa trabajo nuevo: cada línea de aquí sale de `MINUTA.md`,
del plan de Kimi, del `ESTUDIO_PUNTOS_CIEGOS.md` o de una medida hecha el 26 de
agosto contra el repositorio y contra Actions. **Nada de esto está aprobado**;
los tramos 1 y 3 dependen de decisiones que no son de código.

---

## El estado real, medido el 2026-08-26

| | |
|---|---|
| Medios en el catálogo | **78** (72 con feed, 6 sin) |
| Con perfil de propiedad | 78 de 78 — **15 con `ownerType: null`** y su búsqueda declarada |
| Con ficha de orientación | **50 de 78** — 3 de los 14 de izquierda, 33 de 46 mixtos, 14 de 19 de derecha moderada |
| Firmadas por Jose | **5** (El Espectador, La República, El Heraldo, El País de Cali, El Colombiano) |
| Departamentos con medio propio | **29 de 33** |
| Ramas sin fusionar | **ninguna** — las 20 del remoto están todas en `main` |
| Hallazgos abiertos en el libro | **23**, ninguno aceptado con nota; última pasada 2026-08-20, la siguiente cae el jueves |
| Vigilantes que corren solos | ingesta (2 h), vigilancia (6 h), desfase (diario), archivo de conducta (diario), copia (diario), centinela (lunes), auditoría (jueves) |
| Vigilantes en rojo | **la copia de seguridad, desde el 2026-08-19** |

---

## El criterio de orden, en una frase

**Primero lo que está roto ahora, después lo que solo Jose puede desbloquear,
después lo que se puede hacer sin preguntar, y al final lo que necesita
corpus.** Dentro de cada tramo, antes lo que evita perder información que no se
puede reconstruir.

---

# TRAMO 0 · Lo que está roto hoy

Tres cosas, ninguna larga, y la primera es la única de todo el documento que
puede costar algo irreversible.

### 0-A · La copia de seguridad lleva ocho días sin correr

`backup.yml` falla desde el 2026-08-19: `conducta_archivo` y
`conducta_archivo_runs` no están clasificadas en `backup.mjs`. Los artículos se
descartan a las 72 h, así que la copia es lo único permanente del proyecto.

- **Clasificarlas en `TABLAS`, no en `EXCLUIDAS`**, con su motivo: el archivo de
  conducta es precisamente el registro que sobrevive a la ventana, y excluirlo
  sería respaldar todo menos lo único que no se puede rehacer.
- **Y que `backup.yml` abra issue como los otros tres vigilantes.** Es el único
  que no lo hace, y por eso el fallo tardó ocho días en descubrirse. Sin esto,
  el arreglo de arriba solo aplaza el siguiente susto.
- **Media jornada las dos cosas.** No necesita decisión de nadie.

### 0-B · El motor no se despliega solo porque falta un secreto

`desplegar-motor.yml` existe desde el 24 y nunca se ha ejecutado: el repositorio
solo tiene `DATABASE_URL`. **Es trámite de Jose**, no trabajo de código —
`fly tokens create deploy`, y el valor se propaga sin pegarlo en el chat, con el
mismo gesto que la credencial de Supabase. Diez minutos, y cierra la clase de
fallo que más veces ha mordido este proyecto.

### 0-C · Leer el aviso del centinela (issue #4, abierto desde el 24)

Chocó 7 Días publicó una esquela con el apellido que la ficha vigila —Iván
Cañadas Garrido como propietario y editor—. Y dos «no comprobable» que **pueden
ser nuestra IP y no el medio**: Telecafé (403) y Diario del Norte (fetch
failed). Se prueban desde aquí antes de anotarlos como bloqueo ajeno; es la
trampa del User-Agent con tilde, que ya nos costó dos departamentos y un medio.

---

# TRAMO 1 · Lo que solo Jose puede desbloquear

**Ninguna se puede empezar sin él, y varias bloquean trabajo del tramo 2.** Van
en orden de cuánto desbloquean, no de dificultad.

### 1-A · ¿Se archiva, o la noticia sigue muriendo a las 72 h?

Es la decisión con más consecuencias abiertas del proyecto, y de ella cuelgan
otras tres. Hoy `pruneExpiredArticles` borra la fila a las 72 h y todo el juicio
invertido por medio —propiedad, espectro, conflicto de interés— se evapora.

- **Lo medido:** la base crece 4,7 MB al día. 30 días caben en el plan gratuito
  de Supabase; un año son ~2 GB y **25 USD/mes**. El buscador que lo acompaña es
  `tsvector` + GIN, sin sobrecosto propio.
- **Lo que no es técnico:** un archivo permanente convierte cada historia en una
  página que seguirá afirmando lo que afirmaba, con la ficha de propiedad que era
  cierta ese día.
- **Y lo que cambia si se archiva:** desbloquea separar la ventana de estimación
  (30–90 días) de la de agrupamiento (72 h), que la revisión externa llama
  prerrequisito de cualquier arreglo serio del modelo de puntos ciegos.

### 1-B · La ventana de 72 h no es neutral, y hay que decidir qué se hace

**Calla al 38 % de los medios de izquierda del catálogo y al 6 % de los de
derecha**, porque el periodismo de investigación colombiano publica más despacio
que el diario. Cinco de los trece medios de izquierda con feed aportan cero, y
sus feeds responden 200: no están averiados, nacen fuera de la ventana.

- **Lo que NO se hace:** alargar la retención «para estos cinco». Es trato de
  favor con nombre propio y contamina la tasa base en dirección contraria.
- **Lo único limpio es una regla uniforme por cadencia**, y eso depende de tener
  cadencias grabadas — tarea 2-A, que se puede empezar hoy sin decidir esto.

### 1-C · El punto ciego: declarar lo que no se puede medir, y escribir el límite del que sí

El estudio y la revisión externa dejaron el diagnóstico cerrado; lo que falta es
la decisión. Dos partes, y conviene tomarlas juntas:

- **La rama de la izquierda (opción D):** su ausencia es la situación por defecto
  —falta en el **78 %** de las historias de 10+ medios— así que marcarla sería
  marcar la norma. Declararla **no medible, con el número escrito en pantalla**,
  es la salida honesta. Lo que el estudio NO recomienda es bajar el umbral hasta
  que algo salga.
- **El énfasis (opción E):** es la señal correcta y **dispara 23 veces para la
  derecha y 0 para la izquierda**. Adoptarla callando eso deja al producto
  afirmando cosas sobre un lado y nada, nunca, sobre el otro. **Si se acepta, que
  se acepte escrito.**

### 1-D · Las ramas 1 y 3 del punto ciego, sin recalibrar

Medido el 25 de agosto y salió peor que la objeción: la rama 3 exige de entrada
entre **15 y 2 509 veces** menos probable que el 5 % que la nula llama
sorprendente —o sea que el filtro previo es la prueba de verdad y la nula es
decorado—, y su dureza va a saltos porque «15 % de n» se redondea a medios
enteros: una historia de 10 tiene que ser **siete veces más rara** que una de 8
para pasar el mismo filtro. Tres salidas, y son excluyentes: recalibrar contra el
catálogo, cambiar el 15 % por un número de medios —que quita los saltos—, o
declararlas sin disparo previsible.

### 1-E · Infobae se muestrea al 38 % y nadie lo decidió

1 936 piezas al día, feed de 1,2 h, 15 cada media hora. Es el mismo caso que el
techo de `MAX_ARTICLES`, un nivel más abajo. **Y hay un riesgo puro:** su margen
contra la red de seguridad de 2 h es **0,09**; el día que el motor se caiga y
solo quede el cron, se pierde el 91 % de Infobae sin que nada avise.

### 1-F · La Libertad: ¿se publica que la directora es candidata?

Está en la ficha y en `mediaOwnership.js`, no en el texto que ve el lector.
Publicarlo obliga a escribir una regla que el proyecto no tiene: **cuándo la
política de quien DIRIGE, y no de quien posee, es materia de aviso.** Caso
hermano esperando la misma regla: La Nación (Neiva).

### 1-G · La prioridad de las fichas que faltan

50 de 78 medios tienen ficha, y **solo 3 de los 14 de izquierda**. Desde el 24 de
agosto el alta va por delante de la ficha por decisión suya, así que esto no es
un reproche: es que la `q` del modelo de puntos ciegos **es** la tasa de la
izquierda, y se apoya en los valores menos documentados del catálogo. **Quién va
primero lo decide él.**

---

# TRAMO 2 · Lo que se puede hacer sin preguntar

En este orden, y el primero es el único urgente por una razón de calendario.

### 2-A · Empezar a grabar la cadencia por medio (T2-3)

**Aparece en tres sitios distintos como prerrequisito**: de revivir a los mudos
sin trato de favor (1-B), de la nula por propensiones, y de distinguir «sano y
lento» de «roto» —que hoy se ven exactamente igual—. Una tabla y un job que
anote el intervalo observado entre publicaciones. **Solo acumular, sin usarlo.**

- **Un día ahora; la utilidad llega sola en 30–90 días.** Por eso va el primero:
  empezar a grabar es barato y **esperar es lo que cuesta**. Si no arranca esta
  semana, en noviembre seguiremos sin poder decidir nada de lo que depende de él.

### 2-B · Handshake de versión en tiempo de ejecución (T2-1)

El cliente lleva incrustado el commit que espera del motor; `/api/health` ya
expone el suyo. Falta comparar y degradar de forma visible. **1–2 días.** Lo que
gana sobre 0-B: aquello evita el desfase, esto lo hace imposible de ignorar
cuando ocurra igualmente —un despliegue a medias, un rollback—.

### 2-C · `group` y `controlGroup` pueden discrepar y nadie lo mira (D-3)

Dos horas, un check en `check:registry`. Es exactamente la clase de defecto que
este proyecto lleva un mes persiguiendo: dos artefactos nuestros que pueden
decir cosas distintas sin que nada salte.

### 2-D · Una sola consulta compartida en la portada (T2-2)

Cuatro componentes piden los mismos datos por su cuenta, y en el relevo de los 30
minutos enseñan estados de dos mundos: el hero con una historia que el feed ya no
tiene. **2–3 días.** Cuesta la propiedad «cada componente es autosuficiente», que
vale algo y vale menos que la coherencia de la portada.

---

# TRAMO 3 · Catálogo, y va detrás porque no bloquea a nadie

- **Sucre.** Único departamento sin medio cuya ausencia no es un límite del
  formato. Las cuatro vías técnicas están agotadas; **lo que lo abre es escribir
  a Korraleja o a El Meridiano**, y por eso lleva doce días parado.
- **Los feeds parados del libro de hallazgos** —Telemedellín, Telecafé, W Radio,
  Razón Pública—. Telemedellín publica 51 piezas al día y llevaba 146 horas sin
  una; W Radio se quedó sin sus dos vías. **Razón Pública puede ser un falso
  positivo**: publica por tandas, y un semanario de análisis se ve igual que un
  feed averiado. Si Jose decide que ese es su oficio, se marca `aceptado` **con
  nota** y deja de avisar sin desaparecer. Lo que NO se hace es mover el umbral
  para que deje de salir.
- **Las cinco rutas que devuelven 200 a cualquier cosa** —Canal Capital, El
  Heraldo, Quindío Noticias, Cablenoticias, EFE—: ahí un 200 no prueba que la
  página exista, y las fuentes que se apoyaban en eso ya bajaron solas a «no
  comprobable». Sustituirlas es trabajo de ficha, no de código.
- **Los seis internacionales sin feed** —Reuters, CNN en Español, NYT, WSJ,
  Financial Times, La Vanguardia—. Incluyen los dos extremos del rango, así que
  su ausencia es la que mantiene lo internacional apiñado en el centro y bloquea
  F1-16.

---

# LO QUE NO ENTRA, Y POR QUÉ

- **Bajar el umbral del punto ciego hasta que dispare algo.** Es la tentación
  obvia y está explícitamente descartada por el estudio.
- **La opción C** (umbral por tamaño medido empíricamente). Muere por dos vías
  independientes —el 78 % y los 3,9 falsos positivos esperables a α = 0,05 sobre
  77 historias— y conviene enterrarla **por las dos**, porque si muere solo por
  una alguien la resucitará cuando cambie el corpus.
- **El modo de arranque de prueba del sistema.** Es infraestructura de test, no
  un test, y `npm run mirar` ya cubre el 90 % de lo que se buscaba con él.
- **Balance agregado como superficie editorial** (Alt-2). Superficie nueva:
  metodología visible, actualización periódica, intervalos de Wilson. Antes hay
  que decidir si el producto acepta cambiar «punto ciego detectado hoy» por
  «balance de las últimas cuatro semanas».

---

# CÓMO SE SABE QUE ESTO AVANZA

**Este documento no lleva la cuenta: la lleva `MINUTA.md`.** Cada cosa de aquí
que se cierre se anota allí con su fecha y con lo que se decidió, y cada cosa que
se decida NO hacer se anota igual, con el motivo. Un plan que se actualiza a sí
mismo acaba describiendo intenciones que ya no ocurren — que es la enfermedad
contra la que se escribió la minuta, y la razón por la que este archivo puede
quedarse quieto sin mentir.
