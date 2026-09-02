# Sesión de decisiones — servida el 2026-09-02

**Es la Etapa 1 de `PLAN_PRODUCTO_FINAL.md`, y el cuello de botella del proyecto.**
Todo lo que hay aquí ya tiene su estudio escrito; ninguno de los ocho puntos
necesita investigación nueva. Lo que hace este documento es ponerlos en fila,
con lo que se sabe, las opciones cerradas y **una recomendación mía en cada
uno, marcada como tal**: la recomendación es evidencia y estado, el juicio lo
firma Jose (`PROTOCOLO_JUICIO_EDITORIAL.md`).

**Cómo se usa.** Se contesta en el orden que está, porque los tres primeros se
condicionan entre sí. Cada respuesta —aunque sea «todavía no»— se anota en
`DECISIONES.md` y en `MINUTA.md` **en el momento**, no al final. Medio día.

**Lo que ya no está en la cola.** La Etapa 0 de código está entera en `main` y
desplegada: el motor sale solo con cada push (desde el 2026-09-02), los cinco
vigilantes abren issue asignado, la copia avisa de su propia ausencia, el
handshake cliente↔motor está vivo, y el cliente habla con `api.doblefoco.co`.
De la Etapa 0 quedan dos gestos que no son decisiones: leer el issue #4 y sacar
el repositorio de OneDrive (al final de este documento).

---

## 1 · ¿Se archiva, o la noticia muere a las 72 h? (1-A)

**La de más consecuencias.** Hoy `pruneExpiredArticles` borra a las 72 h y todo
el juicio invertido por medio se evapora con la pieza.

**Lo medido.** La base crece 4,7 MB al día. 30 días caben en el plan gratuito
de Supabase; un año son ~2 GB y **25 USD/mes**. El buscador que lo acompaña
(`tsvector` + GIN) no tiene sobrecosto propio.

**Lo que no es técnico.** Un archivo permanente convierte cada historia en una
página que seguirá afirmando lo que afirmaba, con la ficha de propiedad que era
cierta ese día.

**Lo que desbloquea si se archiva.** Separar la ventana de estimación (30–90
días) de la de agrupamiento (72 h): la revisión externa lo llama prerrequisito
de cualquier arreglo serio del modelo de puntos ciegos, y es lo que el punto 3
necesita.

**Opciones.**
- **A.** Seguir como hoy: 72 h y nada más.
- **B.** Archivo permanente con página por historia, ficha fechada y buscador.
  25 USD/mes al año vista; 1–2 semanas de código.
- **C.** **Retención interna de 30 días sin páginas permanentes:** las piezas
  viven 30 días en la base para estimar, pero la portada y las URL siguen
  siendo de 72 h. Gratis dentro del plan actual, desbloquea lo mismo que B
  para el modelo, y aplaza la pregunta editorial de B sin cerrarla.

**Mi recomendación: C ahora, y B como decisión aparte cuando haya 90 días de
serie.** C es reversible en las dos direcciones y no afirma nada nuevo ante el
lector.

## 2 · La ventana de 72 h y los medios lentos (1-B)

**Lo medido.** La ventana calla al 38 % de los medios de izquierda del catálogo
y al 6 % de los de derecha: el periodismo de investigación publica más despacio
que el diario. Cinco medios con feed sano aportan cero.

**Lo que NO se hace:** alargar la retención «para estos cinco». Es trato de
favor con nombre propio y contamina la tasa base en dirección contraria.

**Lo nuevo desde el 2026-09-01.** La cadencia por medio **ya se graba** (tarea
2.1, `cadencia_piezas`). En el primer día ya se ve lo que antes era invisible:
La Patria publica cada 5,6 días, Vorágine cada 3,3, Casa Macondo cada 1,4, y
Telecaribe lleva desde el 13 de agosto sin publicar. Hacia el **1 de octubre**
habrá 30 días de serie.

**Lo que se decide hoy no es la regla: es el compromiso.** Que la única salida
limpia es una **regla uniforme por cadencia** —la ventana de cada medio se
deriva de su propio ritmo, con la misma fórmula para todos— y que se implementa
cuando la serie tenga 30 días (Etapa 3), no antes.

**Mi recomendación: comprometerse hoy con la regla uniforme y con la fecha.**
Con el punto 1 en C, la regla tiene dónde vivir.

## 3 · El punto ciego: declarar lo no medible, y escribir el límite (1-C y 1-D)

**El diagnóstico está cerrado** (`ESTUDIO_PUNTOS_CIEGOS.md` y la revisión
externa); falta la decisión, en tres partes que van juntas.

- **La rama de la izquierda (opción D).** Su ausencia es la norma: falta en el
  **78 %** de las historias de 10+ medios, así que marcarla sería marcar la
  norma. Salida honesta: declararla **no medible, con ese número en pantalla**.
  Lo que el estudio NO recomienda es bajar el umbral hasta que algo salga.
- **El énfasis (opción E).** Es la señal correcta, y **dispara 23 veces para la
  derecha y 0 para la izquierda**. Si se adopta, que se adopte con esa ceguera
  direccional escrita donde el lector la vea.
- **Las ramas 1 y 3 (1-D).** Medidas el 25 de agosto: la rama 3 exige de
  entrada entre 15 y 2 509 veces menos probable que el 5 % de la nula, y su
  dureza va a saltos porque «15 % de n» se redondea a medios enteros. Tres
  salidas excluyentes: recalibrar contra el catálogo, **cambiar el 15 % por un
  número fijo de medios** (quita los saltos), o declararlas sin disparo
  previsible.

**Mi recomendación: D y E escritas, y el número fijo de medios para 1-D.** Es la
combinación que deja al modelo diciendo la verdad de sí mismo (lista de cierre,
punto 3) sin esperar a la serie larga.

## 4 · Infobae al 38 % e `ITEMS_PER_FEED = 15` (1-E, duda 4)

**Lo medido.** Infobae publica 1 936 piezas al día; su feed cubre 1,2 h; con 15
piezas cada media hora se muestrea el 38 %. Y un riesgo puro: su margen contra
la red de seguridad de 2 h es **0,09** —el día que solo quede el cron se pierde
el 91 % de Infobae— aunque desde el 2026-09-01 la vigilancia sí acusa cuando el
motor calla y otro lo suple (I-8).

**Opciones.**
- **A.** Ratificar el muestreo y **declararlo** en la página de metodología:
  «de los medios de altísimo volumen se toma una muestra».
- **B.** Techo por feed: 15 por defecto y un valor propio para los que
  publiquen más de 15 piezas en 30 min (hoy solo Infobae y quizá Semana).
- **C.** Subir el techo general. Más tráfico a 78 medios por un problema de uno.

**Mi recomendación: A hoy, y B solo si el punto 1 queda en C o B** (con 72 h
de retención, ingerir más de Infobae solo cambia qué 15 se pierden).

## 5 · La Libertad y La Nación (Neiva): la regla que falta (1-F)

**El caso.** La directora de Diario La Libertad anunció su candidatura en su
propio diario. Está en la ficha y en `mediaOwnership.js`, **no en el texto que
ve el lector**. Caso hermano: La Nación (Neiva). Publicarlo obliga a escribir
una regla que el proyecto no tiene: **cuándo la política de quien DIRIGE, y no
de quien posee, es materia de aviso.**

**Borrador de regla, para que sea una decisión y no un caso.** Se avisa cuando
quien dirige la redacción tiene **candidatura o cargo público vigente**, con
fecha y fuente, y el aviso caduca con el cargo o la candidatura. No se avisa por
afinidad, militancia pasada ni opinión: eso es orientación, y la orientación ya
tiene su instrumento. El aviso es desvelamiento, no acusación, como los de
propiedad.

**Mi recomendación: adoptar el borrador, publicar los dos casos con fecha, y
revisar la regla al primer caso que no encaje.**

## 6 · Prioridad de las 28 fichas que faltan (1-G)

**Lo medido.** 50 de 78 medios tienen ficha, y **solo 3 de los 14 de
izquierda**. Desde el 24 de agosto el alta va por delante de la ficha por
decisión de Jose, así que esto no es un reproche. Pero la `q` del modelo de
puntos ciegos **es** la tasa de la izquierda, y se apoya en los valores menos
documentados del catálogo (lista de cierre, punto 5).

**Mi recomendación de orden:** primero los 11 de izquierda sin ficha —por
tandas de 3 o 4, para que cada tanda sea revisable—, después los más leídos
según Reuters Institute que falten, y al final el resto por departamento.
**Quién va primero lo decide Jose**; lo que pido es el orden, no la ficha.

## 7 · Los `aceptado` con nota del libro de hallazgos

**El mecanismo existe** (`estado: aceptado` con `nota` en
`auditoria/hallazgos.json`) y **nunca se ha usado**; mientras tanto, el libro
acumula ruido que tapa lo nuevo. Con un día de cadencia grabada ya hay
evidencia por medio:

| Medio | Estado en el libro | Lo que dice la cadencia (1 día) | Propuesta |
|---|---|---|---|
| Razón Pública | resuelto | 10 piezas en 2 días, una cada 0,2 días | Ya no es caso: publica a diario. Nada que aceptar. |
| Telemedellín | resuelto | 10 piezas en 2 días | Igual: resuelto de verdad. |
| Vorágine | abierto desde el 20/08 | 10 piezas, una cada **3,3 días**, la última el 1/09 | **Aceptado con nota:** «investigación, cadencia lenta». Es su oficio. |
| Telecaribe | abierto desde el 20/08 | 10 piezas, una cada 6,9 días, **ninguna desde el 13/08** | No aceptar todavía: parece **parado**, no lento. Buscar otra vía de feed (Etapa 4). |
| El Manduco | abierto desde el 27/08 | 4 ciclos con HTTP 500 en `cadencia_huecos` | No es cadencia: es **avería del feed**. Sigue abierto. |
| W Radio | abierto desde el 20/08 | 2 piezas, una fechada en **2022** | Feed que miente en fechas. Otra vía (Etapa 4). |
| Telecafé | abierto desde el 20/08 | 10 piezas **sin fecha** | Feed sin fechas; la cadencia no puede medirlo. Otra vía. |

**Mi recomendación: estrenar `aceptado` con Vorágine, y solo con él.** El resto
son averías con nombre, no cadencias.

## 8 · Las tres dudas cortas (DUDAS_ABIERTAS 3, 5 y 12)

- **Duda 3 · Historias sin imagen.** ~5 multifuente donde ningún medio publicó
  foto. Opciones: dejarlas sin imagen (hoy), o un marcador claramente NO
  fotográfico —el logo del medio sobre fondo— que se lea como «no hay imagen».
  Nunca una foto «relacionada». *Mi recomendación:* el marcador con logo.
- **Duda 5 · La cifra de patrocinio.** Se quitó de `/transparencia`; sigue en la
  plantilla de solicitud. *Mi recomendación:* se queda en la plantilla —es un
  documento para un patrocinador, ahí la cifra tiene sentido— y fuera de todo lo
  público.
- **Duda 12 · Cuando un medio nos escriba.** Es la única cuya falta se nota
  desde fuera. *Borrador de procedimiento:* un correo de contacto publicado en
  `/transparencia`; acuse en 5 días y respuesta en 15; la objeción y la
  respuesta se publican **junto a la ficha**, con fecha, tanto si cambia la
  clasificación como si no; y la reclasificación, si la hay, sigue el protocolo
  de juicio editorial, no la presión.

---

## Los dos gestos que no son decisiones

- **Issue #4 del centinela (20 min).** Leer la esquela de Chocó 7 Días («Falleció
  Yenny Cañadas») y decidir si toca la ficha de Iván Cañadas Garrido; correr
  `npm run centinela` desde el PC para Telecafé y Diario del Norte, que pueden
  ser nuestra IP. Después, comentar y cerrar el issue.
- **Sacar el repositorio de OneDrive (15 min).** Con OneDrive en pausa, mover la
  carpeta entera a una ruta fuera de OneDrive; nunca desmarcarla en «Elegir
  carpetas», que la borra del equipo. Al abrir Claude Code desde la ruta nueva,
  pedir que copie la memoria de la ruta vieja.
