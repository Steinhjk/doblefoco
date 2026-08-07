# Diseño de un algoritmo auditable de posición editorial

Documento de diseño. No describe lo que el sitio hace hoy —hoy los valores de
`bias` son juicios editoriales declarados— sino **cómo construir desde cero una
medición que un auditor externo pueda verificar**.

Se escribe sobre lo ya medido en `CONTEXTO_ALGORITMO_SESGO.md`, que descarta con
datos tres caminos: deducir el sesgo del léxico (circular, el diccionario lo
escribimos nosotros), inferirlo de la propiedad (es una tesis, no un dato) y
particionar por co-cobertura (produce un bloque grande y cinco medios sueltos,
no dos bloques ideológicos). Ninguno se vuelve a proponer aquí.

---

## 0. El criterio de éxito, antes que el método

Un auditor externo no pregunta «¿acierta?». Pregunta cinco cosas, y el diseño
entero existe para poder responderlas:

1. **¿De dónde sale la escala?** Si el patrón que define «derecha» lo escribimos
   nosotros, el resultado es nuestra opinión con notación matemática.
2. **¿Se puede reproducir?** Mismos datos y mismo código, mismo número.
3. **¿Cuánta incertidumbre tiene?** Un número sin intervalo no es una medición.
4. **¿Qué lo falsaría?** Un método que no puede fallar no está midiendo.
5. **¿Qué pasa cuando no hay datos suficientes?** Debe decir «no evaluable», no
   inventar un cero.

El punto 5 no es menor en este proyecto: Semanario VOZ, Vorágine, Razón Pública,
RAYA y Colombia Informa **no coinciden ni una vez con nadie** en el corpus
actual. Cualquier método que les asigne un número los está inventando.

---

## 1. Separar cuatro cosas que hoy viajan juntas

La confusión más cara en este campo es tratar como uno solo cuatro constructos
distintos. Se miden con datos distintos y fallan de formas distintas.

| Constructo | Qué pregunta | Se mide con |
|---|---|---|
| **Selección** | ¿Qué decide cubrir? | Qué hechos aparecen y cuáles no |
| **Encuadre** | ¿Cómo lo cuenta? | Lenguaje, actores citados, orden |
| **Atención** | ¿A quién da espacio? | Quién aparece nombrado |
| **Factualidad** | ¿Es fiable lo que afirma? | Correcciones, rectificaciones, verificación |

**La factualidad no es un punto del mismo eje** y no se puede inferir de ninguno
de los otros tres. Va en la sección 6, con método propio. Confundirla con el
sesgo es el error que convierte una medición en un juicio moral.

---

## 2. La arquitectura que resuelve la pregunta 7a

La pregunta abierta del documento anterior es: *¿de dónde sale una etiqueta que
no hayamos escrito nosotros?*

Los tres trabajos de referencia del campo responden con **la misma arquitectura**,
y conviene verla porque no es obvia:

- **Groseclose y Milyo (2005).** No clasifican medios. Toman una escala externa e
  independiente —las puntuaciones ADA de los congresistas de EE. UU., calculadas
  por terceros a partir de votaciones— y observan qué *think tanks* citan tanto
  los congresistas como los medios. El medio hereda su posición de los anclajes
  que comparte con él.
- **Gentzkow y Shapiro (2010).** El anclaje es el *Congressional Record*: qué
  frases usan demócratas y republicanos. Un medio se sitúa por cuánto se parece
  su vocabulario al de cada bando. La escala la fija el Congreso, no el
  investigador.
- **Barberá (2015).** El anclaje son las posiciones conocidas de actores
  políticos; los medios se sitúan por la audiencia que comparten con ellos.

En los tres casos: **una escala externa e independiente + una conducta
observable que anclas y medios exhiben a la vez.** Nunca se le pide al corpus de
medios que produzca la escala por sí solo — que es exactamente lo que se intentó
con la co-cobertura y por eso salió un bloque y cinco sueltos.

### 2.1 La traducción a Colombia

**Anclaje candidato: los actores políticos con posición documentada por
terceros.** En Colombia existen registros públicos e independientes de cómo vota
cada congresista y a qué partido y coalición pertenece —Congreso Visible de la
Universidad de los Andes, las gacetas del Congreso, los registros del CNE—. Esa
escala no la escribimos nosotros y se puede auditar sin pedirnos permiso.

**Conducta observable: a quién nombra cada medio en sus titulares.** Está en la
base, es literal del medio y es verificable pieza por pieza.

De ahí sale la formulación:

> La posición de un medio es la media ponderada de las posiciones —externamente
> documentadas— de los actores políticos a los que da espacio, **relativa a la
> media del ecosistema**.

### 2.2 La objeción que hay que responder antes de escribir una línea de código

**Nombrar no es respaldar.** Un medio muy crítico con Petro lo nombra
constantemente. Medido en bruto, la crítica y el apoyo son indistinguibles.

Es la crítica clásica a Groseclose y Milyo y no se puede despachar. Tres
mitigaciones, y ninguna la resuelve del todo:

1. **Medir propensión relativa, no volumen.** No «cuántas veces nombra a X» sino
   «cuánto más que la media del ecosistema, dado su tamaño».
2. **Cruzar con el detector de carga**, que ya existe y es la única señal que
   mira el texto sin pretender deducir ideología de él (dice «este titular usa
   lenguaje valorativo», no «este medio es de derecha»).
3. **Llamarlo por su nombre.** Si solo se puede medir a quién se da espacio,
   entonces la métrica se llama **atención**, no ideología. Es honesto y sigue
   siendo información valiosa: quién ocupa el espacio público en cada medio es
   un hallazgo por sí mismo.

**Recomendación: publicar la capa de atención como lo que es, y no llamarla
sesgo hasta que la capa de encuadre (sección 5) la sostenga.**

---

## 3. El eje no se supone: se descubre

Aquí hay una decisión de fondo con respaldo en estudios políticos, y va en contra
de lo que el sitio asume hoy.

Dar por sentado que el eje es izquierda-derecha es una importación. En la
política colombiana de las últimas dos décadas, la línea que más ha ordenado las
posiciones no es necesariamente la económica: el clivaje del proceso de paz y del
uribismo/antiuribismo ha estructurado alineamientos que cruzan la división
izquierda-derecha clásica —hay antiuribismo de derecha y hay conservadurismo
social en la izquierda—. Un eje único obliga a proyectar dos cosas distintas
sobre una sola recta, y ahí es donde se producen los «centros» que no existen.

**Método:** no fijar el número de dimensiones. Construir la matriz medio × actor,
aplicar análisis de correspondencias o un modelo de puntos ideales, y **mirar los
valores propios**. Si la primera dimensión explica mucho más que la segunda, el
eje único está justificado y se dice. Si hay dos comparables, el mapa es
bidimensional y forzarlo a una recta sería el error.

Esto también da una respuesta empírica a «no existe el centro»: en un modelo de
puntos ideales, la acumulación en el medio se puede distinguir entre **posición
central real** y **falta de información** mirando la incertidumbre de cada
estimación. Son cosas distintas y hoy el sitio no puede separarlas.

---

## 4. El modelo estadístico, en concreto

### 4.1 Matriz de incidencia

Filas: medios. Columnas: actores políticos con posición externa documentada.
Celda: número de piezas del medio *i* que nombran al actor *j* en la ventana.

### 4.2 Normalización: nada de conteos crudos

Los conteos crudos miden tamaño, no posición: Infobae publica 1 889 piezas en
72 h y Semanario VOZ 8. Y ya sabemos que **el volumen sale del RSS, no de la
audiencia**.

Se usa **propensión relativa con encogimiento bayesiano** (empirical Bayes): la
propensión observada de un medio pequeño se acerca a la media del ecosistema en
proporción a lo poco que se ha observado. Es lo que impide que un medio con tres
artículos aparezca en un extremo por accidente — el artefacto que ya produjo una
«elevación de 24,9» calculada sobre **dos historias compartidas**.

### 4.3 Escalado: modelo de puntos ideales

La formulación natural: cada medio tiene una posición latente θᵢ; cada actor,
parámetros de dificultad y discriminación. La probabilidad de que el medio *i*
nombre al actor *j* se modela con una función logística de (θᵢ − βⱼ) escalada por
la discriminación αⱼ. Es la misma familia de modelos —teoría de respuesta al
ítem— con la que se estiman posiciones de legisladores a partir de votaciones
(NOMINATE, Clinton–Jackman–Rivers).

Encaja bien porque resuelve tres problemas a la vez:

- **Actores que no discriminan** (los que nombra todo el mundo) reciben αⱼ bajo y
  dejan de contaminar la escala, sin que nadie decida a mano cuáles son.
- **Cada θᵢ sale con intervalo de credibilidad**, no como punto.
- **Los datos faltantes se tratan como faltantes**, no como ceros. Un medio que
  publica poco sale con intervalo ancho, que es la respuesta correcta.

**Identificación.** El modelo determina la escala salvo desplazamiento, cambio de
escala y reflexión. Se fija: media 0, desviación 1, y la orientación con dos
anclas declaradas públicamente. **Ese es el único punto donde entra un juicio
nuestro, y por eso debe ir escrito en la portada del método, no en una nota al
pie.**

### 4.4 Cuándo el modelo debe callarse

Regla dura, decidida antes de ver resultados: si el intervalo de credibilidad de
un medio es más ancho que un umbral fijado de antemano, **no se publica número**.
Se publica «datos insuficientes».

Con el corpus de hoy eso afectaría a la mayoría de los medios de izquierda. **Esa
es la respuesta correcta y hay que poder sostenerla**: es preferible decir «no
podemos situar a Vorágine con este método» que situarlo mal con dos decimales.

---

## 5. La capa de encuadre

La capa de atención dice a quién se da espacio. El encuadre —cómo se cuenta— pide
otro método.

**Método recomendado: log-odds ratio con prior de Dirichlet informativo** (Monroe,
Colaresi y Quinn, 2008). Es el estándar para comparar uso de palabras entre
grupos, y existe precisamente porque las alternativas obvias fallan: la
frecuencia bruta premia palabras comunes y tf-idf premia rarezas irrelevantes.
Su ventaja aquí es que **da una medida de incertidumbre por palabra**, así que
las diferencias que son ruido se ven como ruido.

**No sustituye la escala; la valida.** Si los medios que la capa de atención sitúa
juntos usan además vocabulario distinguible, las dos señales se refuerzan. Si no,
la escala mide otra cosa y hay que decirlo.

**Limitación que hay que declarar ya:** el 27 % de los artículos no trae
entradilla, y **Semana y El País de Cali dan 0 %** —los dos del Grupo Gilinski, y
de los que más publican—. Cualquier medida de texto tendrá sistemáticamente menos
material de ellos. Eso es un sesgo del instrumento y va en el informe.

---

## 6. Factualidad: constructo aparte, método aparte

No se deduce de nada de lo anterior. Se construye como **rúbrica documentada**,
con evidencia fechada y verificable por medio:

1. **¿Publica correcciones?** ¿Existen, se fechan, se enlazan desde la pieza?
2. **Tasa de acuerdo con verificadores independientes** (ColombiaCheck, el
   Detector de Mentiras de La Silla Vacía): piezas del medio evaluadas y su
   resultado.
3. **Transparencia de fuentes**: proporción de piezas que citan fuente
   identificable.
4. **Conducta ante el error**: rectificación, retirada silenciosa, o nada.

Cada punto con su evidencia y su fecha. Un auditor debe poder abrir la ficha y
seguir cada enlace. **Es más trabajo manual que estadístico, y está bien que lo
sea**: la factualidad es un historial, no una inferencia.

---

## 7. Validación: lo que el auditor va a revisar

Sin esto, todo lo anterior es un ejercicio.

1. **Preinscripción.** Umbrales, anclas y reglas de exclusión se fijan y se
   publican **antes** de correr el modelo sobre los datos definitivos. Ajustarlos
   después de ver el resultado es cómo se fabrica cualquier conclusión.
2. **Validación cruzada.** Estimar con parte de los datos, predecir la otra
   parte. Un modelo que no predice cobertura no vista no está midiendo nada
   estable.
3. **Acuerdo entre codificadores humanos.** Una muestra —200 a 300 piezas—
   codificada por dos o tres personas de forma independiente, con **alfa de
   Krippendorff** como medida. Si los humanos no se ponen de acuerdo sobre qué es
   encuadre de derecha, ningún algoritmo puede aprenderlo. Este paso es además el
   más barato de todos y probablemente el más informativo.
4. **Contraste con clasificaciones externas.** MOE, FLIP, el Media Ownership
   Monitor de RSF. No como verdad —también son juicios— sino para poder decir
   dónde coincidimos y dónde no, y por qué.
5. **Contraste con los valores declarados de hoy.** Correlación de Spearman entre
   la escala nueva y los `bias` actuales. **Una correlación muy alta sería mala
   señal**: significaría que reprodujimos nuestras suposiciones.
6. **Análisis de sensibilidad.** Mover cada decisión —umbral, ventana, anclas— y
   enseñar cuánto se mueve el resultado. Si se mueve mucho, el número es frágil y
   hay que decirlo.

---

## 8. «Vivo»: cómo, sin volverlo inauditable

La pregunta 7b del documento anterior sigue en pie: un valor que se mueve solo
crea el problema de saber **qué decía el sitio el día** que publicó una historia.

**Diseño propuesto:** ventana móvil larga —trimestral, no semanal—, recalculada
con cadencia fija, y **cada recálculo se congela como una versión con fecha**. La
ficha del medio muestra la vigente; la historia guarda la versión con la que se
la clasificó. Así el valor evoluciona y a la vez cada afirmación pasada sigue
siendo auditable.

Trimestral y no semanal por una razón sustantiva: un medio de línea conocida
puede parecer lo contrario en una semana concreta, y hay hechos sin ninguna carga
ideológica. Una ventana corta mide la agenda de la semana, no la línea editorial.

---

## 9. Plan por fases

Cada fase deja algo utilizable y **puede terminar en «no se puede»**, que es un
resultado legítimo y debe poder publicarse como tal.

### Fase 1 — Construir el anclaje (sin modelo)
Lista de actores políticos con posición externa documentada y fuente por cada
uno. Sin esto no hay nada. **Entregable:** el conjunto de anclas, publicado.
**Puede fallar así:** que no haya un registro externo suficientemente completo,
en cuyo caso toda la arquitectura de la sección 2 se cae y hay que replantear.

### Fase 2 — Detección de menciones y su verificación
Extraer actores de los titulares. **Entregable:** precisión y exhaustividad
medidas contra una muestra revisada a mano. Si la detección es mala, lo demás
sobra.

### Fase 3 — Descriptivo, sin escala
Matriz medio × actor, propensiones relativas con encogimiento. **Entregable:**
quién da espacio a quién. Ya es publicable y ya es información, sin afirmar
ideología de nadie.

### Fase 4 — Dimensionalidad
Valores propios. **Entregable:** cuántos ejes hay de verdad, con el gráfico.
Responde empíricamente si el eje único está justificado.

### Fase 5 — Puntos ideales con incertidumbre
El modelo de 4.3. **Entregable:** posición e intervalo por medio, y la lista
explícita de los medios que quedan como «datos insuficientes».

### Fase 6 — Validación
Todo lo de la sección 7, incluida la codificación humana. **Entregable:** el
informe de validación. **Hasta aquí nada se publica en el sitio.**

### Fase 7 — Encuadre
La capa léxica de la sección 5, como validación independiente.

### Fase 8 — Publicación y gobernanza
Metodología publicada, código y datos abiertos, versiones fechadas, y una vía
para que un medio discuta su clasificación con derecho a réplica visible.

---

## 10. Lo que este diseño NO promete

- **No promete coincidir con la intuición.** Si sitúa a un medio donde no
  esperábamos, o el modelo está mal o la intuición lo estaba; se investiga, no se
  ajusta el umbral hasta que salga lo esperado.
- **No promete cubrir a todos los medios.** Con el corpus actual, buena parte de
  la izquierda quedará sin número.
- **No sustituye el juicio editorial.** Lo hace explícito, acotado y discutible.
  Los valores declarados de hoy no son ilegítimos por ser juicios; lo serían por
  presentarse como medición sin serlo.
- **No mide calidad periodística.** Ni pretende.

---

## 11. El paso siguiente, y por qué es ese

**Fase 1: averiguar si existe el anclaje externo.**

Es barato, no necesita código y es el único punto donde el proyecto entero puede
morir: si no hay un registro público, independiente y suficientemente completo de
posiciones de actores políticos colombianos, la arquitectura de la sección 2 no
se sostiene y hay que buscar otra —o aceptar que el juicio editorial declarado y
bien argumentado es lo máximo que se puede hacer con honestidad.

Y esa última posibilidad hay que decirla en voz alta desde el principio: **es un
resultado aceptable.** Un juicio editorial declarado, argumentado y sujeto a
réplica es más honesto que un número inventado con aparato estadístico alrededor.
