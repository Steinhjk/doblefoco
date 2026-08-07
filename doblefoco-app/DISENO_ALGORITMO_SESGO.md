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

## 11. FASE 1, EJECUTADA — el anclaje externo existe

**Buscado el 2026-08-07. Resultado: no hay uno, hay cinco, y son independientes
entre sí.** La arquitectura de la sección 2 se sostiene.

### 11.1 Registros de posición de partidos (el anclaje primario)

| Registro | Qué es | Cobertura | Acceso |
|---|---|---|---|
| **CHES-LA 2020** (Chapel Hill) | Encuesta a 160 expertos | 112 partidos y presidentes en 12 países, **Colombia incluida** | CSV, Stata, R + codebook |
| **Global Party Survey** (Norris, Harvard) | 1 861 expertos | 1 043 partidos en 163 países, Colombia incluida; 2.ª ola 2023 con ítems de democracia y autoritarismo | Harvard Dataverse |
| **V-Party** (V-Dem) | 665 expertos de país | 1 955 partidos, 169 países, 1970-2019 | ZIP con datos, codebook y unidades |

Los tres son académicos, revisados, descargables y **ninguno lo escribimos
nosotros**. Es exactamente lo que pedía la pregunta 7a.

**Y hay un beneficio que no esperaba: se pueden cruzar entre sí.** Tres encuestas
independientes sobre los mismos partidos colombianos permiten medir el acuerdo
del propio anclaje. Donde coinciden, el ancla es firme; donde discrepan, sabemos
que ese partido es discutible **antes** de construir nada encima. Un auditor
puede repetir esa comprobación sin pedirnos nada.

### 11.2 El eslabón intermedio: de partido a persona

Los tres registros puntúan **partidos**, y nuestros datos contienen **personas**.
El puente:

- **Congreso Visible** (Universidad de los Andes, desde 1998): perfiles de
  congresistas y ex congresistas, proyectos de ley y **votaciones nominales** de
  senadores y representantes, con filtros por congresista y por partido.
- Registros del CNE y gacetas del Congreso para la militancia formal.

Congreso Visible además permite algo mejor que heredar la posición del partido:
**derivar la posición del legislador de sus propias votaciones**, que es el dato
con el que trabajan NOMINATE y los modelos de puntos ideales. Un congresista que
vota contra su bancada deja de heredar una etiqueta que no le corresponde.

### 11.3 Validación externa específica de medios

- **MOE — Observatorio de Medios y Democracia**: analiza discursos mediáticos,
  pluralidad informativa, visibilidad de candidaturas y **desequilibrios de
  cobertura**, con informes por ciclo electoral. Con las presidenciales de 2026
  (primera vuelta el 31 de mayo, segunda el 21 de junio) hay material reciente.
- **FLIP** y el **Media Ownership Monitor de RSF** para propiedad y libertad de
  prensa; **ColombiaCheck** para la capa de factualidad de la sección 6.

MOE **no se usa como insumo del modelo**: se usa para contrastar el resultado. Si
nuestra medición y la suya discrepan, hay que explicar por qué, y esa explicación
es parte del informe.

### 11.4 Las tres limitaciones que hay que declarar ya

1. **Los anclajes están fechados.** CHES-LA es de 2020, GPS de 2019 con ola de
   2023, V-Party llega a 2019. El sistema de partidos colombiano ha cambiado
   mucho desde entonces —el gobierno de 2022 y el ciclo de 2026—. Para actores
   nuevos no hay ancla, y eso hay que decirlo, no interpolarlo.
2. **Partido ≠ persona.** Mitigado con las votaciones de Congreso Visible, no
   resuelto: fuera del Congreso —ministros, empresarios, militares— no hay
   registro de votaciones del que derivar posición.
3. **Nombrar sigue sin ser respaldar.** La sección 2.2 no se resuelve porque
   exista el anclaje. Es el motivo de que la primera entrega se llame
   **atención** y no ideología.

**Conclusión de la Fase 1: se puede continuar.** El punto donde el proyecto podía
morir está superado.

---

## 12. Cómo dejar de decir «izquierda» y «derecha»

Es una objeción con fundamento y no de vocabulario. «Derecha» mete en la misma
caja a un libertario y a un ultranacionalista, que discrepan en casi todo;
«izquierda», a un anarquista y a un socialdemócrata. Un eje único obliga a
proyectar cosas distintas sobre una recta, y eso **fabrica** los centros que no
existen: dos posiciones opuestas en dimensiones distintas se promedian a cero.

**La salida no es ser más vago, es ser más específico.** Y encaja con lo que
pides: menos ambigüedad, no más.

### 12.1 Ejes con nombre, en vez de una etiqueta

Los tres registros de 11.1 ya vienen separados en dimensiones. Se adoptan las que
ellos miden, en vez de inventar una escala propia:

| Eje | Polos | De dónde sale |
|---|---|---|
| **Economía** | más Estado ↔ más mercado | `lrecon` (CHES), GPS |
| **Orden y derechos** | tradición y autoridad ↔ apertura y derechos | `galtan` (CHES) |
| **Conflicto armado** | salida negociada ↔ salida militar | específico de Colombia |
| **Relación con el poder** | oficialismo ↔ oposición | fechado, cambia con el gobierno |

Un medio deja de «ser de derecha» y pasa a tener **una coordenada por eje, con su
intervalo**. Blu Radio puede quedar pro-mercado y a la vez favorable a garantías;
eso hoy es indecible y es información real.

### 12.2 El eje que no es una posición: pluralismo

La distinción que de verdad separa a un fascista de un neoliberal **no es dónde
está en el eje económico**, y por eso el eje no puede capturarla. V-Party lo mide
aparte, con el índice de iliberalismo: compromiso con el pluralismo político,
demonización del adversario, respeto a derechos de minorías, tolerancia con la
violencia política.

**Eso no es una posición, es una conducta**, y se puede observar en un medio:
¿describe al adversario como enemigo? ¿trata a un grupo como amenaza? ¿normaliza
la violencia? Es medible con el detector de carga que ya existe, y es
probablemente **más informativo para un lector que cualquier etiqueta
izquierda-derecha**.

### 12.3 Cómo se dice sin ambigüedad

En vez de «Semana es de derecha»:

> **Semana** — Economía: pro-mercado (0,6 ± 0,1) · Orden: tradición (0,4 ± 0,2) ·
> Conflicto: salida militar (0,5 ± 0,3) · Pluralismo: sin señal de demonización.
> *Basado en 340 piezas de los últimos 90 días.*

Es más largo y más directo. Cada afirmación se puede discutir por separado, y una
puede ser falsa sin arrastrar a las demás. Con «es de derecha» no se puede
discutir nada: o se acepta o se rechaza en bloque.

### 12.4 Y esto resuelve lo del centro

Con ejes con nombre, la banda del medio se vuelve innecesaria: nadie está «en el
centro», cada medio está **en un punto de cada eje**. Y la acumulación cerca de
cero se puede separar en tres cosas que hoy son indistinguibles:

- posición intermedia real, con intervalo estrecho;
- **falta de datos**, con intervalo ancho → «no evaluable»;
- **posiciones opuestas en ejes distintos**, que la recta única promediaba a cero
  y que ahora se ven separadas.

Esa tercera es la que da la razón empírica a «no existe el centro»: buena parte
de lo que hoy aparece en la banda media probablemente no sea moderación, sino dos
dimensiones aplastadas en una.

---

## 13. MEDIDO — concordancia entre los registros de expertos

**Ejecutado el 2026-08-07.** Descargados CHES-LA 2020 (agregado, 125 partidos en
12 países) y Global Party Survey 2019 (1 043 partidos en 163 países). Colombia:
11 partidos en CHES y 10 en GPS; **10 emparejados a mano**, y el emparejamiento
va escrito en el script para que se pueda revisar.

### 13.1 El resultado

| Eje | Pearson *r* | Spearman *ρ* | Desv. media | IC 95 % de *r* |
|---|---|---|---|---|
| **Sociocultural** (CHES `galtan` vs GPS V6) | **0,943** | 0,921 | 1,04 pts | 0,75 – 0,99 |
| **Económico** (CHES `lrecon` vs GPS V4) | **0,706** | 0,766 | 1,94 pts | 0,14 – 0,92 |

Escalas 0-10. Intervalos por transformación z de Fisher; *n* es 9 y 10, así que
son anchos y hay que leerlos como tales.

**Los dos registros concuerdan fuerte en lo sociocultural y solo moderadamente en
lo económico.** Y con *n* = 10, el intervalo del eje económico llega a bajar
hasta 0,14: no se puede descartar que la concordancia real sea débil.

### 13.2 Dónde discrepan, que es lo que importa

Eje económico, diferencias mayores (CHES − GPS):

```
Centro Democrático     9,1  vs  5,8   →  +3,3
Alianza Verde          5,1  vs  2,0   →  +3,1
Lista de la Decencia   3,1  vs  5,5   →  −2,4
Liberal                6,3  vs  4,0   →  +2,3
```

**El desacuerdo se concentra en el partido más consecuente del espectro.** CHES
sitúa al Centro Democrático como el MÁS pro-mercado de los diez; GPS lo pone en
el sexto puesto, en mitad de la tabla. No es un matiz: es el partido cuya
posición más pesa en cualquier clasificación de medios colombianos.

En el eje sociocultural, en cambio, la mayor diferencia real es de 2,3 puntos y
siete de nueve partidos quedan dentro de 1,7.

### 13.3 Qué implica para el diseño

1. **El anclaje sociocultural es sólido; el económico es contestado.** Si hay que
   empezar por un eje, es el de orden y derechos: es donde los especialistas
   convergen. El económico entra con incertidumbre mucho mayor, y esa
   incertidumbre debe propagarse hasta el número que vea el lector.
2. **Es un argumento empírico a favor de la sección 12.** Si dos encuestas
   independientes de expertos discrepan 3,3 puntos sobre dónde está el Centro
   Democrático en economía, resumir eso —y el eje sociocultural, donde sí
   coinciden— en la palabra «derecha» destruye la única parte que es firme.
3. **El tercer registro llegó, y arbitra.** Ver 13.5.

### 13.4 Una trampa de medición, para el registro

La primera pasada dio 0,655 en el eje sociocultural y una diferencia de **9,0
puntos** en Opción Ciudadana. Era un fallo mío: `Number('')` en JavaScript
devuelve `0`, no `NaN`, así que las casillas VACÍAS del GPS entraron como ceros y
fabricaron un desacuerdo máximo donde solo había un dato ausente. Corregido, el
mismo eje sube a **0,943**.

Se anota junto a las otras trampas del `CONTEXTO_ALGORITMO_SESGO.md` porque tiene
la misma forma: parecía un hallazgo y era un artefacto nuestro. Y porque en un
método que va a ser auditado, un valor ausente tratado como cero es
suficiente para invertir una conclusión.

### 13.5 V-Party entra y resuelve el desacuerdo

Descargado el CPD (*Country-Party-Date*) de V-Party v2. Colombia: 81 filas desde
1931; la elección más reciente codificada es **2018, con 6 partidos y 7
codificadores cada uno**. Trae `codelow`, `codehigh`, desviación típica y número
de codificadores por variable — es decir, **la incertidumbre viene de fábrica**,
que es justo lo que la sección 4.3 exige y que los otros dos no dan.

Sobre los 6 partidos presentes en los tres registros:

| Partido | CHES (gen) | GPS (econ) | V-Party | antipluralismo | populismo |
|---|---|---|---|---|---|
| Alianza Verde | 3,9 | 2,0 | −0,64 | 0,14 | **0,67** |
| Liberal | 5,9 | 4,0 | −0,28 | 0,42 | 0,48 |
| Partido de la U | 6,5 | 5,0 | 0,58 | 0,37 | 0,47 |
| Cambio Radical | 7,6 | 7,0 | 1,57 | 0,74 | 0,33 |
| Conservador | 8,4 | 7,5 | 2,36 | 0,71 | 0,34 |
| Centro Democrático | 9,2 | **5,8** | **2,68** | **0,80** | 0,36 |

Concordancia entre pares (*n* = 6):

```
CHES general   vs  V-Party     r = 0,962    ρ = 1,000   ← orden idéntico
CHES económico vs  V-Party     r = 0,980    ρ = 1,000
GPS económico  vs  V-Party     r = 0,855    ρ = 0,829
CHES general   vs  GPS         r = 0,875    ρ = 0,829
```

**CHES y V-Party ordenan los seis partidos exactamente igual.** El que se
descuelga es el GPS — y encaja con que tenga **4 expertos por partido colombiano**
frente a los 7 de V-Party y los 7-14 de CHES.

**Veredicto sobre el Centro Democrático:** dos de tres registros lo sitúan en el
extremo derecho, y son los dos con más codificadores. El GPS es el atípico. **El
anclaje se sostiene**, y la regla operativa queda: CHES y V-Party como base, GPS
como tercera opinión con menos peso para Colombia.

### 13.6 El hallazgo que no buscábamos

En los mismos 6 partidos:

```
V-Party izquierda-derecha  vs  populismo        r = −0,879
V-Party izquierda-derecha  vs  antipluralismo   r = +0,929
```

**El populismo corre en dirección CONTRARIA al eje izquierda-derecha en
Colombia**: el partido más populista de los seis es Alianza Verde (0,67) y los
tres menos populistas son los tres de derecha. El antipluralismo va al revés,
creciendo hacia la derecha (Centro Democrático, 0,80).

Es decir: dos rasgos que el habla corriente mete en el mismo saco —«populista»,
«extremista»— apuntan a lados **opuestos** del eje. La etiqueta «derecha» no
transporta ninguno de los dos, y son probablemente lo que más le importa saber a
un lector.

Es el argumento empírico más fuerte que hemos encontrado a favor de la sección
12: **no es que «izquierda» y «derecha» sean imprecisas; es que borran
información que los propios registros ya traen separada.**

**Con n = 6 hay que ser prudente con la magnitud**: el intervalo de la
correlación con el antipluralismo va de 0,48 a 0,99, y el del populismo de −0,99
a −0,24. La dirección es fiable; el tamaño, no.

### 13.7 Reproducirlo

`node scripts/concordanciaAnclajes.mjs`, con los tres archivos descargados. El
emparejamiento de partidos entre registros va escrito a mano dentro del script,
a la vista, porque es la decisión más discutible de todo el cálculo.

---

## 14. FASE 2, MEDIDA — el puente de partido a persona

**Ejecutado el 2026-08-07.** La fuente de militancia es **Wikidata** (SPARQL
público, sin credenciales, auditable por cualquiera): personas con nacionalidad
colombiana y partido declarado.

```
Actores en Wikidata ....................... 1 002
  con partido de posición conocida ........... 735
Titulares analizados (72 h) ............... 5 737
Actores detectados en titulares ............... 38
  de ellos con posición conocida .............. 27
Menciones totales ............................ 479
Menciones con posición ....................... 132   ← 2,3 % de los titulares
```

**Es viable, y hoy es débil.** Cuatro obstáculos concretos, todos medidos.

### 14.1 La detección por nombre completo pierde la mayoría

| Actor | nombre completo / apellido | recall |
|---|---|---|
| Gustavo Petro | 55 / 264 | **21 %** |
| María Fernanda Cabal | 7 / 12 | 58 % |
| Iván Cepeda | 13 / 20 | 65 % |
| Abelardo de la Espriella | 299 / 447 | 67 % |

Los titulares dicen «Petro», no «Gustavo Petro». Buscar el nombre completo
descarta **cuatro de cada cinco** menciones del actor más citado del país.

Y el apellido suelto no es la solución sin más: «Santos», «Duque», «Barreras» y
«Cabal» son palabras comunes del español. Hace falta desambiguación, no un
`includes()` más corto.

### 14.2 La militancia histórica asigna posiciones falsas

Petro figura en Wikidata con **cinco partidos** —Polo, Vía Alterna, MIR, Colombia
Humana, Alianza Democrática—. El script se quedó con el primero que tenía
posición conocida y le asignó **2,4: el valor del Polo Democrático**, un partido
que dejó hace más de una década. Lo mismo con Iván Cepeda.

Tiene arreglo —las declaraciones P102 de Wikidata llevan calificadores de fecha
de inicio y fin— pero **hay que usarlos**. Sin eso, el método sitúa a la gente
donde estaba, no donde está.

### 14.3 El actor más mencionado no tiene ancla

**Abelardo de la Espriella: 447 menciones en 19 medios, el más citado del corpus
por amplio margen, y Wikidata lo registra como «político independiente».** No
está en CHES 2020 ni en V-Party 2018 porque en esas fechas no era un actor
nacional.

Lo mismo con **Pacto Histórico, Colombia Humana y Lista de la Decencia**, y con
Francia Márquez y Gustavo Bolívar: sin ancla.

Esto es la limitación 11.4.1 apareciendo con toda su fuerza: **los anclajes
llegan a 2018-2020 y el ciclo político colombiano cambió por completo desde
entonces.** Y no es un hueco aleatorio: falta sistemáticamente lo NUEVO, así que
una medición construida así describiría el país de 2018 y lo presentaría como el
de hoy.

### 14.4 Un aviso sobre los falsos positivos

Aparece **Álvaro Gómez Hurtado**, asesinado en 1995, con 6 menciones. Puede ser
referencia histórica legítima o coincidencia de nombre. Cualquier detección
necesita una revisión manual de precisión antes de usarse — es la Fase 2 tal como
estaba planteada, y esta prueba confirma que ese paso no es opcional.

### 14.5 Qué queda en pie

La arquitectura sigue siendo correcta y la fuente de militancia existe y es
gratuita. Lo que esta medición cambia es el **orden de trabajo**: antes de
modelar nada hay que resolver detección con desambiguación, fechas de militancia,
y sobre todo **qué hacer con los actores sin ancla**.

Tres salidas posibles para eso último, en orden de coste:

1. **Declararlos «sin ancla»** y excluirlos del cálculo. Honesto, pero hoy
   dejaría fuera al actor más mencionado del país: la medición hablaría de todo
   menos de lo que se está publicando.
2. **Derivar su posición de con quién aparecen**: si un actor nuevo se menciona
   sistemáticamente junto a actores anclados, hereda posición con incertidumbre.
   Es barato y usa datos que ya tenemos, pero es inferencia sobre inferencia.
3. **Encuesta propia a especialistas** sobre los actores nuevos, con el mismo
   cuestionario de CHES para que sea comparable. Es lo más caro y lo más sólido,
   y convertiría a DobleFoco en productor de datos, no solo en consumidor.

---

## 15. DESCARTADO CON DATOS — heredar posición por co-mención

**Medido el 2026-08-07**, sobre los mismos 5 737 titulares:

```
Titulares con al menos un actor detectado ....... 448
  con DOS o más actores .......................... 28
  con uno anclado y uno sin ancla ................ 16
Actores sin ancla que podrían heredar ............. 3
```

Y el resultado de heredar:

| Actor | co-menciones | heredaría | rango de los anclados |
|---|---|---|---|
| Abelardo de la Espriella | 11 | 5,4 | 2,4 – 9,2 |
| **Francia Márquez** | 3 | **6,9** | 2,4 – 9,2 |
| Aída Quilcué | 2 | 2,4 | — |

**Francia Márquez heredaría 6,9: derecha moderada.** Es una figura de la
izquierda colombiana y el método la coloca al otro lado. No hace falta discutir
el umbral: el caso más claro sale invertido.

**Por qué falla, y por qué era previsible.** Las noticias co-mencionan
ADVERSARIOS, no aliados: un titular sobre un debate nombra a los dos lados. La
co-mención mide conflicto, no alineación. Es la misma objeción de la sección
2.2 —nombrar no es respaldar— aplicada a los actores en vez de a los medios.

De la Espriella lo enseña con claridad: aparece junto a actores que van de 2,4 a
9,2, y el promedio da 5,4, un centro que no describe nada. **Promediar el
espectro entero produce el punto medio del espectro, no la posición de nadie.**

Se une a la lista de caminos descartados con medición. No volver a proponerlo sin
datos nuevos que expliquen por qué ahora sí.

---

## 16. La IA como extractor, nunca como fuente

Propuesta de Jose (2026-08-07): usar modelos de lenguaje —y ciclos de consulta
entre varios— para determinar la militancia de los actores sin ancla.

**Hay una versión que rompe el diseño y otra que lo sirve, y la diferencia es
exactamente dónde se pone el modelo.**

### 16.1 Lo que NO se puede hacer

**Preguntarle a un modelo si un actor es de izquierda o de derecha, y usar la
respuesta.** Rompe tres criterios de la sección 0 a la vez:

- **Procedencia.** Toda la arquitectura existe para tener una etiqueta que no
  hayamos escrito nosotros. El juicio de un modelo no es un registro externo: es
  una compresión de texto de internet, que probablemente incluye especulación
  sobre esta misma pregunta. Es el camino 4.1 —deducir el sesgo de un léxico que
  escribimos nosotros— con otra ropa.
- **Reproducibilidad.** Un auditor no puede repetir «qué pensaba el modelo»: la
  respuesta cambia con la versión.
- **Cobertura donde importa.** Los modelos son más débiles con los actores
  recientes, que son justamente los que no tienen ancla. La herramienta falla
  precisamente donde se la necesita.

**Y cruzar dos modelos no lo arregla.** Coincidir mide FIABILIDAD, no validez:
comparten datos de entrenamiento y se equivocan de forma correlacionada. Que
Gemini y este modelo coincidan no es evidencia de que acierten.

### 16.2 Lo que SÍ se puede hacer

**Extracción con cita.** El modelo busca en fuentes públicas —Registraduría, CNE,
web del partido, prensa, Wikidata— y devuelve:

```
actor · partido declarado · fecha de inicio · fecha de fin · URL de la fuente
```

**Lo que se guarda en la ficha es la fuente, no la respuesta del modelo.** El
modelo hace recuperación y extracción, no juicio, y la cadena de auditoría queda
intacta: cualquiera abre el enlace y comprueba. Si no hay documento, no hay dato;
no se rellena con lo que el modelo «cree recordar».

Esto ataca directamente 14.2 (fechas de militancia) y 14.3 (actores nuevos), que
son problemas de **búsqueda documental**, no de juicio político. Es trabajo que
una persona haría igual, más rápido.

### 16.3 Dónde sí sirve consultar a varios modelos

Como **triaje**, no como fuente: los casos donde dos modelos extraen documentos
distintos, o uno no encuentra nada, son los que van primero a revisión humana.
Convierte una lista de cientos de actores en una cola priorizada.

### 16.4 Protocolo propuesto

1. Lista de actores sin ancla, ordenada por menciones en el corpus. Hoy la
   encabeza De la Espriella con 447.
2. Extracción con cita obligatoria; sin documento, el actor queda «sin ancla».
3. Segunda pasada con otro modelo **solo para detectar discrepancias**.
4. Revisión humana de las discrepancias y de una muestra aleatoria del resto —la
   muestra no es opcional: sin ella no se conoce la tasa de error de lo que
   nadie revisó.
5. La militancia verificada entra en el registro **con su fuente y sus fechas**.
   La posición sigue viniendo de CHES y V-Party, nunca del modelo.

**Lo que este protocolo NO resuelve:** para un partido que no existe en CHES 2020
ni en V-Party 2018 —Pacto Histórico, y el vehículo con el que De la Espriella
llegó a la presidencia— saber la militancia no da posición. Ahí solo quedan la
encuesta propia a especialistas (11.4 / 14.5, opción 3) o esperar a una ola nueva
de los registros externos.

---

## 17. PRIMERA TANDA DE EXTRACCIÓN — ejecutada

**2026-08-07.** Protocolo de 16.4 aplicado a los actores más mencionados sin
ancla. Resultado en `shared/actoresPoliticos.js`, con fuentes comprobables.

### 17.1 El protocolo detectó una contradicción, que era su trabajo

Dos fuentes daban militancias distintas para De la Espriella —«Defensores de la
Patria» y «candidato de Salvación Nacional»—. Ir al documento lo resolvió:

- Se inscribió el **2026-03-12 como Grupo Significativo de Ciudadanos**
  «Defensores de la Patria», **no con aval de partido**.
- **Salvación Nacional lo respaldó** el 2025-08-27, pero **no fue su aval de
  inscripción**.
- Defensores de la Patria obtuvo **personería jurídica como partido el
  2026-08-03**, después de la elección.

**El resumen del buscador estaba equivocado y el documento lo desmintió.** Es la
demostración de por qué la regla es «se guarda la fuente, no la respuesta».

### 17.2 Correcciones a Wikidata

- **Iván Cepeda** figura solo como Polo Democrático; se inscribió por el **Pacto
  Histórico** el 2026-03-11.
- **Aída Quilcué** aparece en MAIS; fue **fórmula vicepresidencial de Cepeda**.
- **«Partido de la Unión por la Gente» es el Partido de la U**, que CHES sí
  puntúa. Hernán Penagos y Dilian Francisca Toro estaban «sin ancla» por un
  nombre, no por falta de dato. Corregido en `ALIAS_PARTIDOS`.

### 17.3 Un falso positivo confirmado

**Teófilo Forero** fue un dirigente comunista asesinado en 1989, pero en los
titulares de hoy el nombre designa casi siempre a la columna móvil de las FARC
bautizada en su honor. Atribuirle esas menciones —y con ellas una posición—
habría sido la misatribución que ya costó F1-07. Excluido explícitamente.

### 17.4 El muro, ahora con nombre y cifra

La militancia se puede verificar. **La posición no**, porque los partidos son
nuevos:

| Partido | ¿En CHES-LA 2020? | ¿En V-Party 2018? |
|---|---|---|
| Defensores de la Patria | no (creado en 2025-26) | no |
| Pacto Histórico | no | no |
| Colombia Humana | no | no |

**Los dos candidatos de la segunda vuelta de 2026 y el partido de gobierno
entrante no tienen posición externa que heredar**, y entre ellos concentran la
mayoría de las menciones del corpus. Verificar la militancia no lo arregla:
mueve el problema del actor al partido.

Queda una tentación que conviene descartar por escrito: Wikipedia describe a
Defensores de la Patria como «extrema derecha, antisistema y populista», citando
BBC, El País y el Wall Street Journal. **Eso es caracterización periodística, no
encuesta de expertos.** Usarla como ancla en un producto que mide el sesgo de la
prensa sería tomar como vara de medir aquello que se quiere medir. No se usa.

### 17.5 Entonces las opciones se reducen a dos

1. **Encuesta propia a especialistas** con el cuestionario de CHES, para los
   partidos posteriores a 2020. Es la única salida que produce una posición con
   la misma procedencia que el resto del anclaje.
2. **Publicar solo la capa de atención** —a quién da espacio cada medio—, sin
   traducirla a posición, hasta que exista esa encuesta o una ola nueva de los
   registros externos.

La opción 2 se puede hacer ya y no afirma nada que no se pueda sostener. La 1 es
la que haría posible todo lo demás.

---

## 18. LA SALIDA — codificar documentos, no encuestar expertos

**Decisión de Jose (2026-08-07): no se contratan especialistas. Hay que llegar a
un producto objetivo con lo que hay.** Y se puede. Lo que faltaba no era gente:
era un libro de códigos público.

### 18.1 Qué significa «objetivo» aquí

Objetivo **no** quiere decir que no haya juicio humano. Quiere decir que el
juicio sea **reglado, explícito y comprobable**: mismo documento más mismo libro
de códigos igual a mismo resultado, lo aplique quien lo aplique. Es el estándar
del análisis de contenido, no una versión rebajada de nada.

La estimación de variable latente (secciones 4 y 5) es solo **una** de las cuatro
familias del campo. La otra que aplica aquí —y que se descartó demasiado
rápido— es **codificar los documentos que los propios partidos publican**.

### 18.2 El Manifesto Project, y por qué lo cambia todo

MARPOR (WZB Berlín) lleva desde 1979 codificando programas electorales con
análisis de contenido cuantitativo, en más de 50 países y todas las elecciones
libres desde 1945. **Incluye Colombia**, y existe una colección específica de
Sudamérica.

Pero lo decisivo no es su dataset: **su libro de códigos es público**. Está
publicado precisamente para que otros lo apliquen. Es decir:

> Para los partidos que MARPOR ya codificó, se usa su dato.
> Para los que no —Defensores de la Patria, Pacto Histórico—, **aplicamos su
> mismo libro de códigos a los documentos de esos partidos**.

El resultado es comparable con el de MARPOR por construcción, y cualquiera puede
repetir la codificación. Eso es exactamente la procedencia externa que pedía la
sección 2, obtenida sin encuestar a nadie.

### 18.3 Los documentos existen y son obligatorios

En Colombia no hay que buscarlos ni pedirlos por favor:

- **Programa de gobierno**: los candidatos deben inscribirlo ante la
  Registraduría. Es la posición en palabras del propio candidato.
- **Estatutos y plataforma ideológica**: los partidos los radican ante el CNE
  para obtener y conservar la personería jurídica.

Son públicos, están fechados y no los escribimos nosotros. **La posición sale de
lo que el partido dijo que quería hacer, citando la frase.**

### 18.4 El producto objetivo, en cuatro capas

1. **Atención** — a quién da espacio cada medio. Totalmente objetiva: contar
   menciones no exige ningún juicio. Se puede publicar ya.
2. **Posición anclada** — para los partidos en CHES, V-Party o MARPOR, la
   posición externa que ya existe.
3. **Posición codificada** — para los partidos nuevos, codificación de sus
   documentos con el libro de códigos de MARPOR, publicando el documento, la
   versión del libro y las frases que sostienen cada categoría.
4. **Fiabilidad** — dos codificaciones independientes de una muestra y **alfa de
   Krippendorff** publicado. Sin esa cifra, la capa 3 es una opinión con formato;
   con ella, es una medición con error conocido.

Un modelo de lenguaje puede ser **uno** de los dos codificadores, nunca los dos:
lo que valida la codificación es el acuerdo entre codificadores independientes, y
dos modelos no son independientes (sección 16.1).

### 18.5 Qué se gana y qué se pierde

**Se gana** un método reproducible, con procedencia externa, aplicable a los
actores de hoy y no solo a los de 2018, y **contestable en el detalle**: un medio
que discrepe puede señalar la frase concreta y el código concreto, no una nube.

**Se pierde** la elegancia estadística de los puntos ideales con intervalo. La
codificación da una posición argumentada, no una distribución posterior. Es un
intercambio consciente y hay que decirlo en la metodología pública, no
disimularlo.

**Y sigue en pie el límite honesto**: codificar programas es trabajo manual. Para
seis u ocho partidos nuevos es acotado; no lo es para cientos de actores. Por eso
la capa 1 —atención— es la que se publica primero y la que sostiene el producto
mientras las otras se construyen.

---

## 19. El paso siguiente, y por qué es ese

La Fase 1 ya está hecha (sección 11) y salió bien: el anclaje existe. Lo que
sigue es **la Fase 2, y conviene empezarla por su parte más barata y más
reveladora: la concordancia entre los tres registros de expertos.**

Descargar CHES-LA, GPS y V-Party, quedarse con los partidos colombianos y
calcular cuánto coinciden entre sí en cada eje. Es una tarde de trabajo, no
necesita nada de nuestro corpus, y responde antes de invertir en detección de
menciones:

- **Si los tres coinciden**, el anclaje es firme y se puede construir encima.
- **Si discrepan mucho**, el problema no es nuestro método: es que la posición de
  los partidos colombianos no tiene consenso ni entre especialistas, y entonces
  cualquier medición nuestra heredará esa incertidumbre. Saberlo antes cambia
  todo lo demás, y de hecho **sería un hallazgo publicable por sí solo**.

Y sigue en pie lo que ya estaba escrito: si en algún punto el método no se
sostiene, **el juicio editorial declarado, argumentado y sujeto a réplica es un
resultado aceptable** — más honesto que un número inventado con aparato
estadístico alrededor.
