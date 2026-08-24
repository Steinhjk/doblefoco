# Estudio — por qué no hay ni un solo punto ciego

**2026-08-21.** Pedido por Jose: revisar el motor en lo que toca a los puntos
ciegos, entender debilidades y oportunidades, ahora que hay más masa informativa.

**El resultado corto:** el catálogo lleva **0 puntos ciegos** en 6 299 historias,
y no es por falta de datos. Hay **dos fallos independientes**, y el segundo no se
arregla con más masa.

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

## 2. El fallo de modelo: a menor voz, más difícil decir que falta

`probabilidadDeAusencia(q, n) = (1 - q)^n` pregunta: *si los medios eligieran qué
cubrir con independencia de su línea, ¿qué probabilidad hay de que este espectro
no aparezca entre los n que cubren el hecho?* Se declara punto ciego si esa
probabilidad baja del 5 %.

### Las tasas base reales del corpus

Sobre **7 559 apariciones medio-historia**:

| Espectro | Apariciones | Cuota |
|---|---:|---:|
| Izquierda | 249 | **3,29 %** |
| Mixta | 4 938 | 65,33 % |
| Derecha | 2 372 | 31,38 % |

### Lo que exige el umbral

Cuántos medios tienen que cubrir **una sola historia** para que la ausencia de
cada espectro baje del 5 %:

| Espectro ausente | Medios necesarios |
|---|---:|
| Izquierda | **90** |
| Mixta | 3 |
| Derecha | 8 |

**La historia más cubierta de todo el corpus tiene 16 medios. El catálogo entero
son 76.** «Punto ciego de la izquierda» no es una señal exigente: es
**inalcanzable**, y lo seguiría siendo si los 76 medios cubrieran la misma
noticia el mismo día.

### La cuota que haría falta, por tamaño de historia

| Medios en la historia | Cuota mínima del espectro |
|---:|---:|
| 4 | 52,7 % |
| 6 | 39,3 % |
| 8 | 31,2 % |
| 10 | 25,9 % |
| 16 | 17,1 % |
| 30 | 9,5 % |

Para disparar en la historia más grande que existe hoy, la izquierda tendría que
ser el **17,1 %** de todas las apariciones del corpus: multiplicarla por 5,2.

> **La propiedad perversa del modelo, dicha sin rodeos: cuanto más pequeña es la
> voz de un espectro, más difícil se vuelve afirmar que falta.** Un espectro que
> aporta el 52,7 % puede declararse ausente con 4 medios; uno que aporta el
> 3,29 % no puede declararse ausente nunca.
>
> Eso contradice el propósito editorial escrito de este proyecto —exponer el
> desequilibrio, no buscar falso balance—. El modelo es conservador en la
> dirección correcta cuando los espectros están equilibrados, y ciego justo donde
> el desequilibrio es mayor.

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
| y la ausencia sorprende | **0** ← exige 90 medios |

| Rama 3 · Solo medios del eje | Pasan |
|---|---:|
| con ≥ 6 medios | 31 |
| y mixta ≤ 15 % | **0** |

**Lo que hay que mirar es el 77.** Setenta y siete historias cumplen todas las
condiciones sustantivas del punto ciego de la izquierda y mueren en la última,
que es la imposible. No falta evidencia: falta que la prueba pueda superarse.

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
| **D. Reconocer que la rama de la izquierda es inalcanzable** | Deja de prometer lo que no puede dar | El producto pierde una señal que nunca tuvo | Bajo |
| **E. Mover el peso al énfasis** | Da una afirmación real en el 19,5 % de historias grandes | No es una afirmación sobre ausencia | Bajo |
| **F. Declarar la asimetría como contexto** | Dice la verdad estructural: «la izquierda es el 3,3 % de este catálogo» | No es una señal por historia | Medio |

**Lo que este estudio recomienda**, y queda a decisión de Jose:

**A + D + F.** El fallo de costura se arregla porque es un fallo, cueste lo que
cueste hoy. La rama de la izquierda se declara inalcanzable **con este modelo y
este catálogo**, con el número escrito, en vez de dejarla ahí aparentando que
vigila algo. Y el desequilibrio se cuenta donde de verdad está: no en que un
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
