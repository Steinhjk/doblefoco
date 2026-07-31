# Contexto para diseñar la clasificación de sesgo

**Para quien retome este problema.** Escrito el 2026-07-31. Todas las cifras de
aquí están medidas contra la base real, no estimadas. Si vas a proponer un
método, léelo entero primero: hay cuatro caminos que ya se recorrieron y se
descartaron **con datos**, y volver a proponerlos cuesta una sesión.

---

## 1. Qué hace el producto, en una frase

DobleFoco reúne la cobertura de un mismo hecho por varios medios colombianos y
muestra **quién lo está contando y quién no**. No verifica si una noticia es
cierta, no puntúa la calidad de un artículo y no mide el sesgo de una pieza
concreta. **Clasifica organizaciones, no piezas.**

## 2. Cómo funciona hoy

1. Cada medio tiene un valor entre −1 y +1 en `shared/mediaRegistry.js`,
   asignado por una persona con cuatro criterios: propiedad y estructura
   económica, selección de agenda, encuadre, y balance de fuentes citadas.
2. Cada historia **hereda** los valores de los medios que la cubren. El texto del
   titular NO interviene.
3. Sobre ese conjunto se calculan distribución, polarización, puntos ciegos y
   énfasis (`shared/biasAnalysis.js`).

El valor es **constante**: vive en un archivo versionado en git, nada lo
actualiza solo, y editarlo desde el panel está descartado por diseño. Los 41
están marcados como provisionales (`reviewedAt: null`), y firmar uno **obliga** a
citar dónde consta — `npm run check:registry` falla si no.

Existe además `shared/headlineTone.js`, que detecta lenguaje valorativo en
titular y entradilla. **Se anota aparte y NO alimenta el sesgo.**

## 3. Las reglas que no se negocian

Vienen de la Fase 0, cuando el sistema fabricaba titulares y citas. No son
preferencias de estilo:

- **Nada se publica sin poder verificarlo contra su fuente.** Ni un titular, ni
  una cita, ni una cifra.
- **Los titulares son literales.** No se reescriben «para neutralizarlos»: editar
  la frase de otro y publicarla con su firma no es neutralizar.
- **Cuando falta un dato, se declara que falta.** Un hueco visible es honesto;
  uno rellenado con algo verosímil es una falsificación.
- **No se finge precisión que no se tiene.** Un porcentaje sobre cuatro fuentes
  es ruido con aspecto de hallazgo.

---

## 4. Caminos ya descartados, con la medición que los descartó

### 4.1 Deducir el sesgo del léxico de los titulares — CIRCULAR

El diccionario de carga emocional **lo escribimos nosotros**. Un sesgo deducido
de él heredaría nuestras suposiciones y las presentaría como medición. Es el
motivo de que `headlineTone` esté deliberadamente separado del sesgo.

**Medido el 2026-07-31** sobre 5 944 artículos: la carga se detecta en el
**3,0 %**. Por banda: sin línea 2,6 %, derecha 3,7 %, izquierda 2,5 %. Con solo
**159 artículos de izquierda en todo el corpus**, esa última cifra son 4 casos:
no permite comparar bloques.

### 4.2 Inferir el sesgo desde la propiedad — ES UNA TESIS, NO UN DATO

Hay 39 fichas de propiedad documentadas con fuente (`shared/mediaOwnership.js`),
y dan hallazgos fuertes: tres dueños concentran la mitad de lo publicado.

Pero que El Tiempo sea de Sarmiento **informa** el juicio editorial; meterlo en
una fórmula sería *inferir* la línea editorial desde el dueño, que es una tesis
discutible. La distinción está adoptada: **la propiedad informa la revisión, no
la sustituye ni entra en ningún cálculo automático.**

### 4.3 Partición empírica por co-cobertura — NO PRODUCE BLOQUES IDEOLÓGICOS

`npm run analyze:cocoverage` construye un grafo de qué medios cubren los mismos
hechos, **sin usar el sesgo declarado de nadie**. Era el camino limpio.

**Medido el 2026-07-31**, con densidad del 42,5 % (por encima del umbral del
25 %, que la primera vez no se alcanzó):

```
Bloque 1 —  1 medio  · sesgo declarado −0,45
Bloque 2 —  1 medio  · sesgo declarado +0,25
Bloque 3 —  1 medio  · sesgo declarado −0,35
Bloque 4 —  1 medio  · sesgo declarado −0,50
Bloque 5 —  1 medio  · sesgo declarado −0,65
Bloque 6 — 27 medios · sesgo declarado  +0,11
```

**No hay dos bloques ideológicos: hay uno grande y cinco medios sueltos.** Y los
sueltos están sueltos porque publican tan poco que casi nunca coinciden con
nadie, no porque formen un bloque.

La estructura real del ecosistema **no es izquierda contra derecha**: es quién
participa del ciclo diario y quién no.

### 4.4 TF-IDF + coseno para el agrupamiento — DESCARTADO CON DATOS

Medido contra 72 pares etiquetados a mano. En el punto de operación del proyecto
no mejora a Jaccard. El código se conserva y la medición se puede repetir.

---

## 5. El problema de fondo: el desequilibrio del corpus

Medido el 2026-07-31 sobre **5 944 artículos** de 34 feeds:

| Banda | Medios | % medios | Artículos | % volumen |
|---|---|---|---|---|
| Izquierda | 8 | 25,0 % | 163 | **2,8 %** |
| Sin línea marcada | 11 | 34,4 % | 3 156 | 53,7 % |
| Derecha | 13 | 40,6 % | 2 556 | 43,5 % |

**Por cada artículo de izquierda hay 35 del resto.** Cualquier método que aprenda
del corpus aprenderá de un corpus donde un lado casi no existe.

Y no es un defecto de captura: los medios de izquierda del catálogo hacen
investigación y análisis, no noticia diaria. Publican poco **porque ese es su
oficio**.

---

## 6. Trampas de medición que ya nos han mordido

Cada una parecía un hallazgo y era un artefacto nuestro. Conviene tenerlas
presentes porque la próxima tendrá la misma pinta:

1. **`articles.category` no describe el tema.** Se copia de la configuración del
   feed en el registro. Usarla para medir agendas produce «la derecha
   sobre-representa Política ×2,0», que mide **nuestra propia configuración**.
2. **El volumen sale del RSS, no de la audiencia.** El Espectador aparece con 34
   artículos frente a 474 de Semana; ese no es su tamaño real.
3. **La entradilla no está disponible por igual.** Medido: 73 % de los artículos
   la tienen, pero **Semana (642 artículos) y El País de Cali (329) dan 0 %**.
   Los dos son del Grupo Gilinski y están entre los que más publican. Cualquier
   método basado en texto tendrá sistemáticamente menos material de ellos.
4. **Contar medios esconde la asimetría.** La izquierda es el 25 % del catálogo
   y el 2,8 % del volumen. Siete veces de diferencia.
5. **Los enlaces vía Google News son redirecciones**, y buscar por NOMBRE de
   medio en vez de por `site:` trae piezas de otros medios que lo mencionan. Eso
   ya costó una misatribución (F1-07).

---

## 7. Las preguntas abiertas

**a) ¿De dónde sale una etiqueta que no hayamos escrito nosotros?** Es la
pregunta central. Sin un anclaje externo, cualquier clasificador aprende lo que
ya creemos. Candidatos localizados y no explotados: el Observatorio de Medios de
la MOE (sesgo de cobertura en elecciones), informes de la FLIP, el Media
Ownership Monitor de RSF, ColombiaCheck.

**b) ¿Constante o evolutiva?** Hoy constante, y hay un argumento fuerte para que
siga siéndolo: un medio de propiedad abiertamente de derecha podría parecer de
izquierda en una semana concreta, y **hay noticias sin ninguna carga
ideológica**. Si el valor se moviera solo, además, habría que resolver algo que
hoy no existe: cómo auditar qué decía el sitio de un medio **el día** que publicó
una historia concreta.

**c) ¿Es «punto ciego» la métrica correcta para la izquierda?** Un punto ciego
exige que varios medios cubran un hecho y falten los de un lado. Pero ese lado no
cubre el ciclo diario: cubre **otra agenda**. Quizá lo que hay que medir es
*agenda divergente* y no ausencia.

**d) El detector de carga emocional sí parece prometedor.** Es la única señal
que mira el texto sin pretender deducir ideología de él: dice «este titular usa
lenguaje valorativo», no «este medio es de derecha». Hoy dispara en el 3 % — el
salto grande no vino de ampliar el diccionario sino de **arreglar la flexión**
(el léxico estaba en masculino singular y el español flexiona). Ampliarlo tiene
un riesgo conocido y escrito: el léxico sensacionalista se puede ampliar porque
«escalofriante» lo reconoce cualquiera; **decidir qué palabra es «de izquierda»
es justo el juicio que este proyecto no debe imponer.**

---

## 8. Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Valores de sesgo y catálogo | `shared/mediaRegistry.js` |
| Cálculo sobre historias | `shared/biasAnalysis.js` |
| Carga emocional | `shared/headlineTone.js` |
| Fichas de propiedad | `shared/mediaOwnership.js` |
| Agrupamiento de hechos | `shared/clustering.js` |
| Reparto por dueño y volumen | `shared/panorama.js` |
| Metodología pública | `src/docs/metodologia.txt` |
| Historial de decisiones | `ROADMAP.txt`, sección «Decisiones y descartes» |
| Qué se hizo y por qué | `LOG_IMPLEMENTACIONES.md` |

Mediciones repetibles: `npm run analyze:cocoverage`, `npm run report:ingest`,
`npm run check:registry`, `npm run check:feeds`.

---

## 9. Decisiones editoriales de Jose que condicionan el diseño

No son preferencias sueltas: son restricciones. Un método que las contradiga se
va a rechazar aunque funcione bien, así que conviene conocerlas antes de diseñar.

**La clasificación NO puede ser movible.** Dicho por él el 2026-07-31, con dos
argumentos propios: *«un medio abiertamente por su posesión de derecha podría
parecer de izquierda»* en una ventana corta, y *«existen noticias sin carga de
sesgo ideológica»*. Un valor que se mueve solo confunde el ruido de una semana
con un cambio de línea.

**El propósito NO es el falso balance.** En Colombia el ecosistema no está
repartido, y el producto no debe fingir simetría donde no la hay. Su valor está
en lo contrario: que el desequilibrio se vea, y que el lector entienda el grado
de manipulación al que está sometido. Un clasificador que «equilibre» los bloques
para que queden bonitos estaría trabajando contra el objetivo.

**No se silencia a ningún medio.** Ante un feed pobre se busca otra vía, no se
retira el medio del catálogo. Se aplicó reactivando W Radio y RTVC aunque aporten
cero artículos.

**Pero sí hay un criterio de INCLUSIÓN, y es relevante aquí.** Las2Orillas quedó
fuera porque es un recolector de columnas de opinión: no tiene una línea
editorial propia que clasificar, y asignarle un valor describiría a quien más
publicó esa semana, no al medio. **La unidad que el producto clasifica es una
sala de redacción con línea propia.** Cualquier método debería preguntarse si esa
unidad existe en cada caso.

**«Centro» se retiró como categoría.** La banda media se llama **«Sin línea
marcada»**. Jose no da por sentado que exista un centro político, y llamarlo así
le atribuye una posición que nadie ha demostrado.

Y lo que más importa para un clasificador: **también se descartaron «Objetivo»,
«Factible» y «Sin sesgo»**, por el motivo CONTRARIO. Afirman una cualidad que la
medición no puede sostener. Un valor cerca de cero significa solo que no se
detectó inclinación consistente, y eso admite lecturas muy distintas —cobertura
equilibrada, señal insuficiente, sesgos que se cancelan entre temas, o
alineamiento con el poder institucional que no cabe en el eje izquierda-derecha—.
**Si el algoritmo produce una salida cerca de cero, no puede llamarla neutral.**

**Jose sostiene que la clasificación actual se queda corta en la derecha.**
El Colombiano (+0,35) y Semana (+0,45) deberían salir más a la derecha, y que la
banda «Derecha» (≥ +0,6) esté vacía con cero medios lo considera un defecto del
instrumento, no un retrato del país. Es una hipótesis que un método nuevo debería
poder confirmar o refutar.

**Umbral de punto ciego bajado de 6 a 4 medios** (2026-07-31), con una condición
que él mismo formuló como «2 de izquierda y 2 de derecha»: el lado que SÍ cubre
debe aportar al menos dos medios. Con uno solo, lo que hay no es «un lado omite
esto» sino «un periódico decidió cubrirlo».

**Puntos de énfasis: pedidos, implementados y medidos como casi redundantes.**
La idea era mostrar «no solo ausencia sino exceso o insistencia». La mitad por
historia está hecha, y la medición dice que con 4 a 6 medios «un lado concentra»
y «el otro falta» son casi la misma frase (con umbral 0,60: 25 historias con
énfasis, **1 sin punto ciego**). **La mitad que importa es temporal** —un bloque
que vuelve una y otra vez sobre un tema— y no se puede construir con
`articles.category` por la trampa nº 1 de la sección 6.

---

## 10. Leer el artículo completo: lo técnico, lo legal y el muro de pago

Preguntado por Jose el 2026-07-31. Respuesta corta: **lo técnico es lo fácil, lo
legal se resuelve con una decisión de diseño, y el muro de pago es lo que
realmente decide.**

**Técnico — la parte menor.** Ya se pide la cabecera de cada artículo para el
`og:image`: se leen ~47 kB y se corta en `</head>` (ver
`server/services/imageEnricher.js`, que ya trae los límites de concurrencia,
pausa por dominio y tope por ciclo). Leer el cuerpo añade peso y el problema
conocido de extraer el artículo de entre menús y publicidad. Hay algoritmos
estándar.

**Derechos de autor — la distinción que importa.** Guardar el texto completo es
reproducción; analizarlo y descartarlo, no. Hoy se guardan titular, entradilla y
enlace, que es la postura estándar de un agregador con atribución. **La
recomendación es no almacenar NUNCA el cuerpo**: descargar, extraer rasgos,
descartar. Lo que queda en la base son números, no obra ajena. Esto necesita
confirmación de alguien con criterio jurídico; aquí solo se deja planteada la
distinción.

**El muro de pago — y esto es lo que decide.** No es un problema legal sino de
medición: **corrompería la comparación que el producto existe para hacer.**

Semana, El Tiempo y El Espectador tienen muro; los medios pequeños e
independientes, no. Un análisis de texto tendría material completo de unos y
truncado de otros. **Y ya está pasando con la entradilla**, medido el
2026-07-31:

| Medio | Artículos | Con entradilla |
|---|---|---|
| Semana | 642 | **0 %** |
| El País (Cali) | 329 | **0 %** |
| Infobae Colombia | 1 776 | 66 % |
| El Colombiano | 326 | 99 % |

Los dos que dan cero son del Grupo Gilinski y están entre los que más publican.
Con artículos completos la brecha se ensancharía, y la medición del sesgo pasaría
a depender de **quién tiene muro de pago**. Es la misma clase de artefacto que la
sección 6 recoge tres veces. Saltarse un muro no es opción.

**La alternativa que ya existe.** `analyzeArticleTone` analiza titular Y
entradilla, no solo el titular. Es un material más pobre pero **disponible en
condiciones más parecidas para todos** — con la salvedad de los dos ceros de
arriba, que hay que tener presente igual.
