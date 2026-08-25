# Estudio — por qué no hay ni un solo punto ciego

**2026-08-21.** Pedido por Jose: revisar el motor en lo que toca a los puntos
ciegos, entender debilidades y oportunidades, ahora que hay más masa informativa.

**El resultado corto:** el catálogo lleva **0 puntos ciegos** en 6 299 historias,
y no es por falta de datos. Hay **dos fallos independientes**, y el segundo no se
arregla con más masa.

> **Este documento se ha corregido dos veces sobre la marcha, y las dos veces
> hacia abajo.** El §5 daba por averiados unos medios que no lo estaban —los
> callaba nuestra ventana de 72 h, §8—, y el §2 daba por imposible una rama que
> solo era imposible bajo una nula mal planteada —90 medios era un artefacto;
> son 14—. Las correcciones están donde estaba el error, no en un apéndice: un
> estudio al que hay que llegar hasta el final para saber que la mitad no vale
> es peor que no tenerlo. **Lo que ninguna de las dos correcciones tumbó es la
> conclusión**, y por eso sigue en pie.

---

## 1. El fallo de costura: el veredicto del servidor no llega a la pantalla

El servidor calcula bien:

```js
server/db/feedStore.js:234    const coverage = analyzeCoverage(sources, tasasBase);
```

El cliente lo recalcula, y **sin tasas base**:

```js
src/lib/story.js:146          const coverage = analyzeCoverage(sources);
```

Sin `tasasBase`, `sorprende()` devuelve `false` por diseño —«ante la duda,
callar»— así que `blindspot` sale `null` **siempre**. Y `normalizeStory`
construye un objeto nuevo que **nunca copia `raw.blindspot`**, de modo que el
veredicto que sí viene en la respuesta se descarta por el camino.

Es el fallo que esa misma función tiene documentado en un comentario:

> «Este normalizador construye un objeto NUEVO, así que un campo que no se copie
> aquí desaparece sin error. Es lo que pasó al añadir la imagen.»

Volvió a pasar, con los puntos ciegos.

**Cuánto se nota hoy: nada, y esa es la parte incómoda.** Como el servidor
tampoco encuentra ninguno —ver el punto 2—, el fallo está tapado. El día que el
modelo empiece a encontrarlos, la pantalla seguiría sin enseñarlos.

**Dónde se nota que existe:** `MobileSidebar` tiene una pestaña entera llamada
«Puntos ciegos» (`src/components/MobileSidebar.jsx:39`) que solo puede enseñar su
estado vacío. Todos los consumidores —`NewsCard`, `MobileSidebar`— leen
`story.coverage.blindspot`, el recalculado.

---

## 2. El fallo de modelo: la nula preguntaba por el volumen, no por quién existe

> **Corregido el 2026-08-25.** Lo que sigue es la sección tal como quedó después
> de arreglar el modelo. Lo que decía el 21 de agosto —que hacían falta **90
> medios** para afirmar que falta la izquierda— **era cierto bajo la nula de
> entonces, y esa nula preguntaba lo que no era**. El número real es **14**. La
> corrección no rescata la rama, pero cambia de quién es la culpa, y eso cambia
> qué hay que hacer. Se cuenta entera porque el error importa más que el número.

### Lo que preguntaba antes

`probabilidadDeAusencia(q, n) = (1 - q)^n`, con `q` = **cuota de apariciones** de
ese espectro en el corpus. O sea: *de cada 100 artículos leídos, ¿cuántos salen
de medios de este lado?* Para la izquierda, 249 de 7 559 apariciones: **3,29 %**.

Con eso, para bajar del 5 % hacían falta 90 medios en una sola historia. El
catálogo entero eran 76. La conclusión que sacó este estudio —«la rama es
inalcanzable»— era correcta sobre el modelo que había, y de ahí salió la
recomendación D.

### Por qué esa pregunta era la equivocada

Un punto ciego afirma **que alguien no se presentó**. La población que podía
presentarse es **el catálogo**: los medios que este sitio lee. No el registro de
apariciones.

Y `q` mezclaba dos cosas que no son la misma:

- **cuántos medios existen de ese lado** — 13 de 72 con feed, un **18 %**;
- **cuánto publica cada uno** — donde Cambio y El País ponen el 88,6 % de la voz
  de la izquierda y cinco medios ponen cero.

Al multiplicar las dos, un catálogo con 13 medios de izquierda se comportaba en
la fórmula como si tuviera **dos y medio**. **La nula castigaba a la izquierda
dos veces: una por ser pocos y otra por publicar poco.** Y la segunda no es una
propiedad de la noticia, es una propiedad de nuestra ventana de 72 h —§8—, o sea
**una decisión nuestra entrando en el veredicto como si fuera del mundo**.

Peor todavía: la fórmula era **circular en la dirección que no conviene**. Cuanto
más callaba un espectro, más bajaba `q`; cuanto más bajaba `q`, más medios se
exigían para poder decir que faltaba. Un espectro silenciado se volvía, por
construcción, imposible de echar en falta.

### Lo que pregunta ahora

`probabilidadDeAusenciaEnCatalogo(delEspectro, total, n)`: *si los n medios que
cubren este hecho se hubieran sacado del catálogo al azar, ¿qué probabilidad hay
de que no salga ninguno de este lado?*

Es la hipergeométrica —`C(total − espectro, n) / C(total, n)`, escrita como
producto para no desbordar— y solo cuenta **quién existe**, que es lo que la
afirmación necesita. Catálogo de hoy, contando solo medios **con feed**:

| Espectro | Medios | Cuota del catálogo |
|---|---:|---:|
| Izquierda | 13 | 18,1 % |
| Mixta | 41 | 56,9 % |
| Derecha | 18 | 25,0 % |
| **Total** | **72** | |

*(El registro tiene 78; seis todavía no tienen feed y no pueden aparecer, así que
tampoco cuentan como ausentes.)*

### Lo que exige el umbral, corregido

| Espectro ausente | Antes (apariciones) | **Ahora (catálogo)** |
|---|---:|---:|
| Izquierda | 90 | **14** |
| Mixta | 3 | **4** |
| Derecha | 8 | **10** |

De 90 a 14. Deja de ser aritméticamente imposible: 14 cabe en el catálogo, y es
un tamaño que una noticia grande de verdad puede alcanzar.

**Pero sigue sin disparar, y por otra razón.** La historia más cubierta de hoy
tiene **10 medios**. La rama ya no muere de imposible: muere de que aquí no pasan
cosas suficientemente grandes, que es un diagnóstico distinto y con arreglo
distinto.

### Lo que la corrección NO arregla, y hay que decirlo

Con la nula nueva, que falte la izquierda en una historia de 10 medios tiene una
probabilidad del **11,7 %** bajo azar. No baja del 5 %. Y eso **no es un defecto
de la fórmula**: 13 de 72 es de verdad una fracción pequeña, y de verdad no
sorprende que no salga ninguno en un puñado de diez.

Lo que dice la medida, dicho sin adornos: **con este catálogo, la ausencia de la
izquierda casi nunca puede sorprender, porque es lo esperable.** Y lo empírico lo
confirma desde el otro lado — hoy, en producción, falta la izquierda en el
**87 %** de las 93 historias con 4 medios o más.

> **La propiedad perversa se estrechó, no desapareció.** Antes el modelo hacía
> imposible afirmar la ausencia de una voz pequeña **aunque el catálogo la
> tuviera bien representada**, porque medía volumen. Eso era un fallo y está
> arreglado. Lo que queda es la parte honesta del mismo hecho: si un lado son 13
> de 72, su ausencia en una historia mediana es la norma, y ninguna medida seria
> puede llamar hallazgo a la norma.
>
> La consecuencia de producto es el `ausencia` del 2026-08-25: se publica **el
> hecho** —«aquí no hay ningún medio de izquierda»— con su frecuencia al lado, y
> se reserva la palabra «punto ciego» para cuando de verdad sorprenda.

### El vicio no estaba solo en la nula

Merece quedar escrito, porque es el patrón y no el caso: **la nula era una de
tres constantes calibradas contra una distribución que este catálogo no tiene.**
Se arregló una y quedan dos, las dos en el §3:

| Dónde | La condición | Contra qué choca |
|---|---|---|
| ~~Nula del punto ciego~~ | ~~`(1 − q)^n < 5 %`~~ | ~~arreglada: ahora mira el catálogo~~ |
| Rama 1 (derecha) | `leftRatio > 15 %` y `counts.left >= 2` | la izquierda es el 3,3 % de las apariciones: pasar del 15 % **con dos medios** casi no ocurre |
| Rama 3 (solo eje) | `centerRatio <= 15 %` | la mixta es el 65 % de las apariciones: bajar del 15 % no ocurre nunca |

Las tres cometían el mismo error: **un porcentaje fijo, escrito cuando se
suponían los espectros más o menos parejos, aplicado a un catálogo que no lo
está.** Una constante así no se comporta como el filtro barato que aparenta ser
—se supone que la prueba dura viene después, en la nula— sino como **una segunda
prueba de significancia, no declarada y de dureza desconocida**.

Y se puede medir cuánto. Poniendo cada condición en las mismas unidades que la
nula —la probabilidad de que ocurra por azar bajo las tasas base del corpus—:

| n | Rama 3 · `centerRatio ≤ 15 %` | ¿Cuánto más dura que el 5 % de la nula? |
|---:|---:|---:|
| 6 | 1,7×10⁻³ | 29 × |
| 8 | 3,4×10⁻³ | 15 × |
| 10 | 5,0×10⁻⁴ | 100 × |
| 16 | 2,0×10⁻⁵ | **2 509 ×** |

**En ningún tamaño la rama 3 pide menos de 15 veces lo que la nula considera
sorprendente, y en la historia más grande que ha existido —16 medios— pide dos
mil quinientas.** El filtro previo es la prueba de verdad; la nula, que es la que
está escrita como prueba, es decorado. Por eso su cero no es «el embudo funcionando»: es una condición
que nunca se pensó como test y actúa como el más severo del sistema.

Y hay algo peor, que no es de calibración sino de construcción: **la dureza no
crece con `n`, va a saltos y hacia los dos lados.** De 6 a 8 medios la condición
se afloja a la mitad, y de 8 a 10 se endurece siete veces. No lo decidió nadie:
sale de que `15 % de n` se redondea hacia abajo a un número entero de medios —a
n=8 caben 1 mixto, a n=10 también caben 1—. Una historia de 10 medios tiene que
ser **siete veces más rara** que una de 8 para pasar el mismo filtro, y eso no
está escrito en ninguna parte porque nadie lo escribió.

La rama 1 comparte el vicio pero **en otra escala, y conviene no exagerarlo**: va
de 8 × más dura que la nula con 4 medios a 1,2 × con 10. Es severa, no absurda.
Su cero se explica mejor por el `counts.left >= 2` —que con 13 medios de
izquierda de los que dos ponen el 88,6 % de la voz es lo que de verdad no pasa—
que por el 15 %.

**Lo que esto deja pendiente** es decidir si esas dos ramas se recalibran contra
el catálogo —como se hizo con la nula—, si el 15 % pasa a ser un número de medios
en vez de una fracción —que quitaría los saltos—, o si se declaran sin disparo
previsible por escrito, como pide la opción D. No se ha tocado ninguna: la nula
era un fallo claro y estas dos son decisión de producto.

---

## 3. El embudo: dónde muere cada rama

Sobre las **118 historias con 4 medios o más** (de 6 299):

| Rama 1 · Punto ciego de la DERECHA | Pasan |
|---|---:|
| derecha ≤ 15 % de la cobertura | 13 |
| y izquierda > 15 % | 3 |
| y al menos 2 medios de izquierda | **0** |
| y la ausencia sorprende | 0 |

| Rama 2 · Punto ciego de la IZQUIERDA | Pasan |
|---|---:|
| izquierda ≤ 15 % | 104 |
| y derecha > 15 % | 94 |
| y al menos 2 medios de derecha | **77** |
| y la ausencia sorprende | **0** ← exigía 90; hoy 14, y la mayor tiene 10 |

| Rama 3 · Solo medios del eje | Pasan |
|---|---:|
| con ≥ 6 medios | 31 |
| y mixta ≤ 15 % | **0** |

**Lo que hay que mirar es el 77.** Setenta y siete historias cumplen todas las
condiciones sustantivas del punto ciego de la izquierda y mueren en la última.

> **Actualizado el 2026-08-25.** Cuando se escribió esto, esa última condición
> era imposible —90 medios— y la frase era «falta que la prueba pueda
> superarse». Con la nula corregida —§2— la prueba **se puede superar**: pide 14.
> Sigue muriendo ahí, pero ahora por tamaño y no por aritmética. Y las 77 dejaron
> de ser invisibles: desde el 2026-08-25 se publican como `ausencia`, con su
> frecuencia al lado. Hoy son **42 de las últimas 100**.

La rama 1 muere en `counts.left >= 2`: con la izquierda al 3,29 %, una historia
donde supere el 15 % tiene casi siempre **un solo** medio de izquierda — y el
umbral de 2 existe por una buena razón, que «con uno solo, lo que hay no es un
lado que omite sino un periódico que decidió cubrirlo».

La rama 3 muere porque **ninguna** de las 31 historias grandes baja del 15 % de
medios mixtos. Su comentario dice «con esos en el 54 % de las apariciones»; hoy
la mixta es el **65,33 %**. La premisa caducó y nadie lo notó.

---

## 4. La comprobación empírica: no es cosa del umbral

Si el modelo binomial se sustituyera por la frecuencia observada, el resultado no
cambia — y conviene saberlo antes de tocar ninguna constante.

**En cuántas historias aparece cada espectro, por tamaño:**

| Tamaño | Historias | ≥1 izq | ≥1 der | ≥1 mixta |
|---|---:|---:|---:|---:|
| 2–3 | 602 | 6 % | 64 % | 86 % |
| 4–5 | 87 | 15 % | 87 % | 95 % |
| 6–7 | 17 | 6 % | 94 % | 100 % |
| 8–9 | 5 | 20 % | 100 % | 100 % |
| 10+ | 9 | **22 %** | 100 % | 100 % |

En las historias de 10 medios o más, **que falte la izquierda pasa el 78 % de las
veces**. No es raro: es lo normal. Ningún umbral honesto convierte lo habitual en
hallazgo.

Y al revés: la derecha y la mixta aparecen en el **100 %** de las historias de 8
medios o más, así que **su** ausencia sí sería informativa. Solo que no ocurre
nunca.

---

## 5. La otra mitad del diagnóstico: la izquierda calla, y no por lo que parecía

El 3,29 % no es solo composición editorial. De los **13 medios de izquierda del
catálogo**:

| Apariciones | Medio |
|---:|---|
| 139 | Cambio |
| 117 | El País (España) |
| 11 | Semanario VOZ |
| 7 | Volcánicas |
| 6 | Cuestión Pública |
| 4 | RTVC Noticias |
| 3 | Revista RAYA |
| 2 | Colombia Informa |
| **0** | CasaMacondo |
| **0** | Vorágine |
| **0** | Razón Pública |
| **0** | Noticias Uno |
| **0** | The New York Times |

**Cinco de trece aportan cero, y dos —Cambio y El País de España— aportan el
88,6 %.** Quitando a El País, que es español, la izquierda **colombiana** del
corpus es aún más delgada de lo que dice el 3,29 %.

> ⚠ **Esta sección se escribió suponiendo que los mudos estaban averiados, y al
> ir a arreglarlos resultó que no.** La minuta los tenía anotados como fallo de
> infraestructura —Vorágine y Razón Pública caen desde la IP de Actions—, y con
> ese antecedente di por hecho que la causa era esa. **No lo es:** los seis
> responden HTTP 200 con diez ítems. Lo que los calla es nuestra ventana de 72 h.
> El diagnóstico correcto está en el **§8**, y es de los dos que este estudio
> corrige sobre la marcha.

**Y arreglarlos no desbloquea la señal, venga de donde venga la mudez.** Aunque
los cinco rindieran como los activos, la izquierda pasaría de ~3,3 % a quizá
5–6 %. Haría falta 17 %. Hay que arreglarlos por sí mismos —y por la regla de no
silenciar a nadie—, no como cura del punto ciego.

---

## 6. Lo que sí funciona hoy: el énfasis

La señal hermana, que mira la concentración en vez de la ausencia, sí dispara.
Sobre las mismas 118 historias:

| Señal | Dispara |
|---|---:|
| Énfasis de la derecha | 23 |
| Énfasis de la izquierda | 0 |
| **Puntos ciegos (las tres ramas)** | **0** |

**19,5 % de las historias grandes** llevan una afirmación verdadera y comprobable
sobre el desequilibrio de su cobertura. El énfasis no necesita rechazar una
hipótesis nula: describe lo que hay. Por eso funciona en un corpus asimétrico y
el punto ciego no.

Que el énfasis de la izquierda sea 0 no es un fallo del énfasis: es el mismo
hecho del catálogo, dicho sin pretender que sea un hallazgo sobre la noticia.

---

## 7. Opciones, con lo que cada una arregla y lo que no

| | Qué arregla | Qué NO arregla | Coste |
|---|---|---|---|
| **A. Pasar el veredicto del servidor al cliente** | Que un punto ciego encontrado se vea | No hace que se encuentre ninguno | Bajo |
| **B. Revivir los 5 medios mudos de izquierda** | El corpus, la regla de no silenciar, toda otra medida | La izquierda llegaría a ~6 %, hace falta 17 % | Medio |
| **C. Umbral por tamaño, medido empíricamente** | Honestidad del modelo | Nada: empíricamente la ausencia de la izquierda es lo normal (78 %) | Medio |
| **D. Reconocer que la rama de la izquierda no va a disparar** | Deja de prometer lo que no puede dar | El producto pierde una señal que nunca tuvo | Bajo |
| **E. Mover el peso al énfasis** | Da una afirmación real en el 19,5 % de historias grandes | No es una afirmación sobre ausencia | Bajo |
| **F. Declarar la asimetría como contexto** | Dice la verdad estructural: «la izquierda es el 3,3 % de este catálogo» | No es una señal por historia | Medio |

**Lo que este estudio recomienda**, y queda a decisión de Jose:

**A + D + F.** El fallo de costura se arregla porque es un fallo, cueste lo que
cueste hoy. La rama de la izquierda se declara **sin disparo previsible con este
catálogo**, con el número escrito, en vez de dejarla ahí aparentando que vigila
algo.

> **La justificación de D cambió, y conviene no dejar la vieja en pie.** Se
> apoyaba en los 90 medios: «es imposible, punto». Ese número era un artefacto de
> la nula mal planteada, y con la nula corregida la exigencia es **14** — cabe en
> el catálogo. Lo que sostiene D hoy no es la aritmética sino **la medida**: la
> izquierda falta en el **87 %** de las historias evaluables de producción, y en
> el **78 %** de las de 10 medios o más del corpus histórico —§4—. Una señal que
> dispara sobre lo que ocurre cuatro de cada cinco veces no es un hallazgo.
> **D sobrevive a su propia corrección**, y esa es la única razón por la que
> sigue recomendada: si hubiera caído con el 90, habría que haberla retirado. Y el desequilibrio se cuenta donde de verdad está: no en que un
medio de izquierda faltara en una noticia, sino en que la izquierda sea el 3,3 %
de todo lo que este sitio lee.

**B va aparte y va igual**, porque cinco medios mudos son cinco medios mudos.

**Lo que este estudio NO recomienda: bajar `UMBRAL_SORPRESA` hasta que algo
salga.** Está medido que haría falta llevarlo a un terreno donde el 78 % de lo
normal se presentaría como hallazgo. Ajustar una medida hasta que diga lo que
queríamos oír es lo mismo que se rechazó con Razón Pública, con la diferencia de
que aquí el que sale perjudicado es el lector.


---

## 8. Addendum — los medios mudos no están rotos: los callamos nosotros

Al ir a arreglar los cinco medios de izquierda sin apariciones, resultó que
ninguno está averiado. **Probados en vivo, los seis medios mudos con feed
configurado responden HTTP 200 con 10 ítems:**

| Medio | Espectro | HTTP | Ítems | Pieza más nueva | Dentro de 72 h |
|---|---|---|---:|---:|---:|
| CasaMacondo | izq | 200 | 10 | 111 h | **0** |
| Vorágine | izq | 200 | 10 | 113 h | **0** |
| Razón Pública | izq | 200 | 10 | 97 h | **0** |
| Noticias Uno | izq | 200 | 10 | 94 h | **0** |
| Telecaribe | mixta | 200 | 10 | 181 h | **0** |
| El Manduco | mixta | 200 | 10 | 126 h | **0** |

El motor los consulta con éxito cada media hora y **tira todo lo que trae**,
porque `pruneArticles` borra por edad con `RETENTION_MS = 72 h` y su pieza más
reciente ya nació fuera de la ventana.

Los otros seis mudos —Financial Times, La Vanguardia, CNN en Español, Reuters,
The Wall Street Journal y The New York Times— no tienen feed de ingesta. Es el
bloqueo de F1-16 que ya está anotado, no este.

### El comentario del código dice que esto ya estaba resuelto

`pruneArticles` lleva escrito, a propósito de la decisión del 2026-08-07:

> «Y los que caían fuera por edad eran los medios lentos: Vorágine publica una
> pieza cada 74,7 h, más despacio que la propia ventana, así que quedaba excluido
> de forma sistemática. [...] deja de morder y la ventana se alarga sola para
> todo lo que si se compara. **No hace falta ninguna regla especial para los
> medios lentos; se arregla como efecto.**»

**No se arregló.** Aquella decisión cambió a quién expulsa EL TECHO, y eso sí
funcionó. Pero el corte por edad es una deleción aparte que corre **primero y
sin condición**, antes de mirar siquiera el techo:

```js
const cutoff = Date.now() - RETENTION_MS;
for (...) if (stamp < cutoff) articlesByLink.delete(link);   // incondicional
if (articlesByLink.size <= MAX_ARTICLES) return;             // el techo, despues
```

Es la enfermedad de siempre: la intención escrita en el comentario y el
comportamiento contrario. Y esta vez el comentario nombra a Vorágine como caso
resuelto mientras Vorágine lleva cero apariciones.

### Y hay sitio de sobra

| | Artículos |
|---|---:|
| En la ventana hoy | 9 613 |
| Techo `MAX_ARTICLES` | 8 000 |
| Internacionales sin comparación (primeros en la cola de expulsión) | 2 580 |
| **Corpus tras expulsarlos** | **7 033** |
| **Huecos libres bajo el techo** | **967** |
| Lo que aportarían los seis mudos | **~60** |

Los seis caben en el **6 %** del margen que ya sobra.

### Por qué esto importa para los puntos ciegos

Cuatro de los seis son de izquierda. La ventana de 72 h no es neutral: **calla al
38 % de los medios de izquierda del catálogo y al 6 % de los de derecha**, porque
en Colombia el periodismo de investigación y análisis —Vorágine, Razón Pública,
CasaMacondo, Cuestión Pública, Revista RAYA— publica más despacio que el diario.

O sea que **el 3,29 % de la izquierda es en parte una consecuencia de nuestra
propia ventana**, no solo del catálogo. No basta para desbloquear el punto ciego
—harían falta 17 %— pero es la primera vez que aparece una causa nuestra.

### Lo que NO se ha hecho, porque es decisión de producto

Cambiar `RETENTION_MS` toca el límite que el propio proyecto tiene abierto como
decisión en la minuta («Permanencia: una noticia dura 72 h y se borra»). Y una
excepción por medio chocaría con lo que ese mismo comentario decidió: «una
excepción por medio habría sido una regla sobre quién publica y no sobre qué se
puede comparar».
