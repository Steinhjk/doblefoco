# Decisiones de DobleFoco

Una entrada por decisión, la más reciente arriba. Qué se decidió, con qué
evidencia, y qué se descartó.

**Por qué existe este archivo y no basta el ROADMAP.** El ROADMAP es la lista de
*tareas*: qué falta y qué se hizo. Las decisiones acababan enterradas dentro de
una tarea que además se cierra, así que para saber por qué el umbral de
agrupamiento es 0,34 hay que saber primero que existe una tarea llamada F1-05.
Esto se lee al revés: se busca la decisión, no la tarea. El detalle sigue
viviendo donde estaba —el ROADMAP, o el comentario del código— y aquí solo se
enlaza.

**Las decisiones anteriores al 2026-08-06 no se han migrado.** Están en el
ROADMAP, dentro de su tarea, y moverlas a mano habría sido reescribir historia
con riesgo de perder matices. Lo que se decida a partir de ahora se anota aquí.

---

## 2026-08-13 · Un dueño histórico documentado no basta para marcar dueño compartido

**Al dar de alta El Nuevo Día (Ibagué) NO se le asigna `controlGroup: 'galvis'`**,
pese a que está documentado que la familia Galvis —dueña de Vanguardia, en este
catálogo— fundó y controló el periódico.

**La evidencia, y por qué no alcanza.** Galvis creó **Editorial Aguasclaras S.A.**
en 1992 con empresarios tolimenses que tomaron el 30 %. Esa sociedad consta hoy
como **EN LIQUIDACIÓN JUDICIAL, con la matrícula cancelada** (NIT 800052169), y el
impreso cerró el 22-10-2023. Lo que publica hoy es **EL NUEVO DÍA DIGITAL S.A.S.**,
otra sociedad, que no publica NIT, socios ni representante legal. **Ningún
documento consultable enlaza una con otra.**

**Qué se estaba decidiendo de verdad.** No es una duda de catalogación: con
`controlGroup: 'galvis'`, la vista de concentración **afirmaría** ante el lector
que Vanguardia y El Nuevo Día responden a la misma familia. Es una afirmación
sobre personas identificables, y la sostendríamos con un hecho de 1992 sobre una
empresa que ya no existe.

**La regla que queda.** *La propiedad histórica documentada es una pista, no un
grupo de control.* Para marcar dueño compartido hace falta evidencia de que la
estructura está **vigente**; si no la hay, la pista se escribe en la ficha —donde
se puede leer y refutar— y el campo se queda vacío.

**Lo que se descartó.** Marcarlo «provisionalmente» y corregirlo si aparecía algo:
un aviso de concentración no admite provisionalidad, porque el daño lo hace al
mostrarse. Y también lo contrario, no anotar nada: eso borraría del expediente la
única pista que existe.

**Es simétrico con Pulzo**, donde tampoco se asignó grupo, y con la analogía
descartada en EL DIARIO de Boyacá el día 12. La diferencia es que allí las fuentes
se contradecían y aquí simplemente no llegan hasta hoy. Es además la **regla del
presente** aplicada por primera vez para **no añadir** un vínculo.

Detalle en `fichas/el-nuevo-dia.md` y en el comentario de `shared/mediaOwnership.js`.

---

## 2026-08-13 · La factualidad no medida se publica «sin medir», nunca «0%»

Corrección de un defecto, anotada aquí porque toca una decisión anterior. El
catálogo público imprimía **«factualidad 0%»** para los 18 medios con
`factuality: null`.

**Anulaba la decisión del 2026-08-09** que hizo válida la factualidad no medida.
Aquella existe para no tener que inventar un número de rigor al dar de alta un
medio; convertido en 0, el número inventado volvía por la puerta de atrás y encima
era el más dañino posible.

**La regla:** un valor ausente se muestra como ausente, con la misma palabra en
todas las pantallas. La interfaz ya decía «sin medir» (`fmtPct` en `MediaMap.jsx`);
ahora el catálogo también, y hay prueba que lo exige.

**Lo que enseña sobre las comprobaciones:** `check:registry` no lo detectó porque
compara el archivo generado contra `renderCatalog()` — y los dos producían el mismo
0 %. **Una comprobación de coherencia no ve un error que está en el generador.**

---

## 2026-08-12 · Los regionales sin ficha de propiedad se quedan como desconocidos, y la tarea se anota

**Decisión de Jose.** Un medio regional del que no se ha podido establecer la
propiedad **entra y se queda con `ownerType: null`** —desconocido, declarado con
fecha— en vez de esperar a resolverlo. **Y la tarea de resolverlo queda anotada**,
no cerrada.

**Qué la motiva.** Es la generalización de la regla del 2026-08-11: la ausencia de
dueño se declara. Ese día se aplicó a un medio (La Razón.co) y el 12 a tres más
(EL DIARIO de Boyacá, Vive el Meta, Lente Regional). Jose la eleva a política:
**por defecto, desconocido y anotado.** Deja de haber que decidir caso por caso si
un medio se queda fuera por no saber de quién es.

**Lo que NO autoriza.** No autoriza dejar de buscar, y no autoriza una ficha vacía:
`check:registry` sigue exigiendo `consultadoEl`, `buscadoEn` y `falta` para
aceptar un `ownerType: null`. La diferencia entre «desconocido» y «no lo hemos
mirado» es esa lista, y sin ella el alta no pasa.

**El coste que se asume.** Los certificados de Cámara de Comercio pendientes son
ya once, todos trámite manual. La lista crece más rápido de lo que se cierra, y
esta decisión hace explícito que se acepta: **es preferible un catálogo con huecos
declarados a un mapa con departamentos en blanco.**

Dónde vive el detalle: `AUSENCIA DECLARADA` en `shared/mediaOwnership.js`, y la
lista de lo que falta en cada ficha.

---

## 2026-08-08 · Cambio sale de Google News; cinco medios se quedan y se dice por qué

**Decisión.** Cambio pasa a su RSS propio. RTVC, Revista RAYA, La FM, Noticias
RCN, Noticias Caracol y Blu Radio se quedan en Google News, y queda escrito qué
se probó para que nadie repita la búsqueda.

**Cambio: de 7 a 22 artículos en un ciclo.**

```
gnews    100 ítems ·  5/15 frescos · mediana 155,6 h
propio    20 ítems · 15/15 frescos · piezas de hoy
```

Su feed **no está en ninguna ruta convencional**: vive en `/feeds/articulos/`.
No habría aparecido probando rutas a ciegas — se encontró leyendo el
`<link rel="alternate">` de su propio HTML, que pasa a ser el primer sitio donde
mirar.

**Publica con fechas de hasta dos días en el futuro** porque programa sus piezas.
No hizo falta tocar nada: `parsePublishedAt` ya rechaza cualquier fecha a más de
30 minutos vista, así que esas entradas entran cuando les llega su hora. Se
comprueba en esa función y no en la ficha del medio, para que la regla valga para
todos los feeds y no solo para este.

**Los cinco que se quedan, con lo que se probó:** ninguno tiene feed propio por
las tres vías (HTML declarado, Arc, rutas convencionales). Noticias Caracol y Blu
Radio **declaran un `.atom` que devuelve la página, no un feed** — una pista
falsa que cuesta media hora si no está anotada.

**RTVC es distinto y ya estaba bien documentado.** Publica `rss.xml`, pero está
abandonado: entrada más reciente de mayo de 2026 y de ahí salta a junio de 2024.
Su ficha ya lo decía desde julio con esas mismas fechas; esta vez solo se
reconfirmó. No había nada que arreglar.

**Se anota en el helper `gnews()`**, no en una ficha suelta: es el sitio donde
mira quien vaya a añadir un medio, y ahí queda tanto el coste de esa vía como el
orden de búsqueda que sí funciona.

---

## 2026-08-08 · RTVC conserva su nombre, y se apunta una previsión antes de que ocurra

**Decisión de Jose.** La entidad recuperó su nombre legal —Inravisión, con
redirección permanente desde rtvc.gov.co— pero en el catálogo **se sigue llamando
RTVC**: es el nombre con el que el medio se presenta ante su audiencia, y aquí los
medios se nombran como el lector los conoce, no como figuran en el registro
mercantil.

**Y una previsión suya, anotada A PROPÓSITO ANTES de que pase.** Espera que RTVC
cambie de dirección en los próximos días y pase a cubrir la actualidad desde una
posición oficialista con el gobierno que entró el 7 de agosto. Su valor de
orientación (−0,35) se fijó bajo el gobierno anterior.

**Por qué escribirla antes.** Si el ajuste llega y no hay constancia previa,
sería imposible distinguir una corrección honesta de una racionalización a
posteriori. Escrita antes, la previsión se puede contrastar: o el medio se
mueve como se esperaba, o no, y las dos cosas enseñan algo. Queda en `notes` de
su ficha de propiedad, marcada como **previsión declarada, no medición**.

Es además el único medio del catálogo cuyo dueño —el Estado— cambia de manos en
una fecha conocida, y por eso el único con caducidad prevista.

---

## 2026-08-08 · Orientación y sesgo son dos cosas distintas

**Decisión de Jose.** Separar dos conceptos que compartían una palabra:

|  | Qué es | Cómo se establece |
|---|---|---|
| **Orientación** | Propiedad del **medio**: de dónde viene, a quién responde, qué considera noticia | Estructural. Se documenta |
| **Sesgo** | Propiedad de una **pieza**: qué palabras elige, a quién cita | Frase por frase. **Todavía no se mide** |

**Cómo surgió.** Yo buscaba un adjetivo mejor que «Sin línea marcada» y ofrecí
cuatro; Jose propuso en cambio cambiar el marco. Su propuesta era mejor y resolvió
el problema de raíz: el conflicto no estaba en la etiqueta sino en que un solo
número tenía que decir a la vez algo del medio y algo del texto.

**LO QUE ESTO CORRIGIÓ NO ES VOCABULARIO.** La interfaz decía «Sesgo medio de la
cobertura» sobre un número que promedia **la orientación declarada de los medios
que publicaron**. Eso afirmaba haber analizado la cobertura cuando lo que hicimos
fue promediar quién la firmaba. Ahora dice «Orientación media de quienes lo
publicaron», que es lo que el número contiene.

**«Sin línea marcada» pasa a «Orientación mixta», y la primera era falsa.**
Medidos los siete medios colombianos de esa banda, **seis pertenecen a grupos
económicos**:

```
La Silla Vacía  −0,10   Juanita León y socios     ← el único independiente
W Radio          0,00   Grupo Prisa
El Tiempo       +0,05   Sarmiento Angulo (Aval)
Caracol Radio   +0,05   Grupo Prisa
Noticias Caracol +0,10  Santo Domingo (Valorem)
Portafolio      +0,10   Sarmiento Angulo (Aval)
La República    +0,15   Ardila Lülle
```

Portafolio y La República son **diarios económicos**: su línea es el capital,
declarada y evidente. Decir de ellos que no tienen línea marcada era el falso
balance que este proyecto existe para no producir. Lo que el número dice de
verdad es que su orientación **no se sitúa en el eje izquierda-derecha**, no que
no exista.

**Se descartaron cuatro adjetivos** —«Fuera del eje», «Sin ubicar en el eje»,
«Línea difusa», «Sin inclinación constante»— y toda la familia que suena a virtud
(«no partidista», «línea propia», «transversal», «equidistante»): elogiar a El
Tiempo por no tener bando es exactamente el falso equilibrio. También «mixta» y
«oscilante» como descripciones de SESGO, porque afirmarían que la posición varía
y el número no distingue variar de inclinarse siempre un poco hacia el mismo
lado. Bajo el marco de ORIENTACIÓN, en cambio, «mixta» es una afirmación
estructural y sí se sostiene.

**Otros dos nombres cayeron con la taxonomía:**

- `describeBias()` → **`describirOrientacionMedia()`**. Mantener el nombre viejo
  habría dejado viva en el código la confusión que se acababa de quitar de la
  pantalla.
- «Solo medios con línea marcada» → **«Solo medios de izquierda y derecha»**
  (constante `SOLO_EJE_MIN_SOURCES`). Si se afirma que todos los medios tienen
  línea, distinguir a unos como «los que la tienen» se contradice con el resto
  del sitio. La señal dice que el hecho solo interesó a medios situados en el
  eje, y que ninguno de orientación mixta lo cubrió.

**El campo se sigue llamando `bias`** en el registro, en la base y en la API. Es
deliberado: renombrar `sources.bias` obliga a migrar la base y a romper la API por
un cambio que el lector no ve. Lo que cambia es todo lo que el lector lee.

**Y una copia que se retira**: `MediaMap.jsx` tenía su propio `SPECTRUM_LABEL`.
Dos listas de etiquetas para el mismo concepto son dos listas que se separan, y
esa pantalla es donde menos se habría notado.

**De paso, el `shortName` de Caracol Radio.** Era «Caracol» a secas, y lo señaló
Jose. «Noticias Caracol» es otra empresa de otro dueño —Prisa contra Santo
Domingo—; en un sitio cuyo argumento central es quién posee qué, esa abreviatura
invitaba justo a la confusión que el mapa existe para deshacer.

---

## 2026-08-08 · Responder no es alimentar: se auditan los 39 feeds

**Decisión de Jose**, tras el arreglo de los tres feeds: revisar los demás para
asegurar los flujos. Se cambió lo que `check:feeds` considera un feed sano y se
encontraron dos fallos que llevaban meses invisibles.

**El criterio viejo era `items.length > 0`.** Con ese listón, el feed de W Radio
estuvo meses en verde sirviendo piezas de hace cuatro años: devolvía 100 títulos,
así que ✓. Ahora se mide sobre **los 15 ítems que el motor toma de verdad**:
cuántos caen dentro de la ventana, la mediana de edad, si traen imagen, si el
enlace apunta al medio, y **si el feed viene ordenado por fecha**.

**Ese último dato es el que evita una acusación injusta.** Una mediana alta
significa dos cosas opuestas según el orden:

- **Cronológico y viejo** → el medio publica despacio. Vorágine saca una pieza
  cada 74,7 h. Es su oficio, no una avería, y el informe lo dice en una sección
  aparte titulada «publican despacio, y no es un fallo».
- **Desordenado y viejo** → orden por relevancia: existen piezas más nuevas que
  ese feed no nos está dando.

Sin esa distinción, el informe habría señalado como rotos a Vorágine, Cuestión
Pública, Razón Pública, Colombia Informa y Noticias Uno — justo el periodismo de
investigación que el producto quiere conservar.

**FALLO 1 — El Universal, y la causa es una query.** La misma ruta, con y sin
`?outputType=xml`:

```
sin query   100 ítems ·   0 frescos · mediana 475,3 h  (veinte días)
con query   100 ítems · 100 frescos · mediana  27,9 h
```

No es una regla de Arc: El Heraldo, Vanguardia y El País de Cali usan esa ruta
sin query y sus cien ítems son recientes. Hay que medir instalación por
instalación.

**FALLO 2 — La Opinión: 133 fotografías bloqueadas en el navegador.** El medio
migró a `laopinion.co` y el registro seguía diciendo `laopinion.com.co`. Sus
imágenes se descargaban, **pasaban la validación** —`urlDeImagenValida` compara
contra el dominio del propio artículo, no contra la CSP—, se guardaban en la
base… y el navegador las bloqueaba al pintarlas, porque `laopinion.co` no estaba
en el `img-src` de vercel.json.

Es el peor tipo de fallo del catálogo: **invisible desde el servidor y total para
el lector**. Ni un registro, ni un aviso, ni una prueba en rojo. Solo un hueco
gris donde iba la foto.

**POR QUÉ NO LO VIO LA PRUEBA QUE EXISTE PARA ESTO, que es la parte instructiva.**
`src/services/csp.test.js` ya comprueba que la CSP cubre el dominio de todo medio
con feed, y había saltado tres veces antes. Estaba en verde porque el registro
decía `laopinion.com.co` y la CSP decía `laopinion.com.co`: **las dos listas
coincidían y las dos estaban equivocadas.** Comparar dos copias del mismo dato no
detecta que el dato haya dejado de ser cierto.

Se llegó a escribir un `check:csp` que hacía justamente esa comparación otra vez.
**Se retiró al descubrir que duplicaba la prueba existente** y que, por tanto,
tampoco habría encontrado nada.

**Lo que sí lo encuentra es contrastar el registro contra la REALIDAD**, no
contra otra copia de sí mismo: la comprobación de dominio del enlace añadida a
`check:feeds`, que mira a dónde apuntan de verdad los enlaces del feed y avisa
cuando no coinciden con el `domain` declarado. Fue la que dio el aviso. Regla
general que queda: una comprobación entre dos artefactos nuestros solo detecta
desincronización; para detectar un dato caduco hay que ir a la fuente externa.

**Constantes compartidas.** `ITEMS_PER_FEED` y `RETENTION_MS` se exportan desde
`ingestDaemon.js` en vez de copiarse al script: una copia se habría
desincronizado el día que cambien, y la comprobación mediría un motor imaginario.

---

## 2026-08-08 · Google News ordena por relevancia, y eso nos silenció medios

**Decisión.** El Espectador, Caracol Radio y W Radio salen de Google News y pasan
a su RSS propio.

**Cómo apareció.** Jose preguntó por qué El Espectador termina pareciendo de
izquierda teniendo los dueños que tiene. Al ir al corpus a contrastarlo con
conducta observable, la respuesta fue que **no se puede contrastar**: aportaba 24
artículos en 72 h, con coincidencias de dos y tres casos. No hay señal, hay ruido.

```
El Espectador ....  24        Semana ........... 695
Noticias Caracol .   6        El Heraldo ....... 383
Noticias RCN .....  23        El País (Cali) ... 271
Noticias Uno .....   0        El Tiempo ........ 234
W Radio ..........   2
```

El segundo diario nacional aportaba la décima parte que su par, y menos que
cualquier regional. El patrón parte en dos el catálogo:

| Vía | Medios | Artículos | Media |
|---|---|---|---|
| Feed directo | 20 | 2 672 | **134** |
| Google News | 10 | 162 | **16** |

**LA PRIMERA EXPLICACIÓN ERA FALSA, y conviene dejarlo escrito.** Supuse que
Google devolvía pocos ítems o viejos que la ventana descartaba. Medido, devuelve
100 y 82 están dentro de la ventana. La causa real es el ORDEN:

```
                 gnews         propio
mediana edad     39,9 h         1,5 h
con imagen        0/15         15/15
enlace       news.google.com   elespectador.com
```

**Google ordena por relevancia, no por fecha.** Cada 30 minutos pedimos los 15
«más relevantes» y devuelve casi los mismos, con mediana de casi dos días. Se
deduplican contra lo que ya teníamos y no se acumula nada. Un feed cronológico
trae en cada sondeo lo publicado desde el anterior. Eso explica de paso por qué
esos medios nunca tenían foto —0 de 15— y por qué sus enlaces iban a Google.

**El peor caso era W Radio**: mediana de **32 551 horas, casi cuatro años**, con
1 de 15 ítems dentro de la ventana. No aportaba poco: servía archivo viejo con
apariencia de actualidad, que es peor que estar mudo.

**Los feeds existían y nadie los había buscado donde estaban.** Los tres usan
Arc, el mismo gestor que El Heraldo, El Universal, Vanguardia, El País de Cali y
Semana, que ya entraban por ahí. La ficha de W Radio incluso afirmaba «SIGUE SIN
PUBLICAR RSS PROPIO» tras probar cinco rutas — ninguna era la de Arc.

**Efecto medido en UN ciclo:** El Espectador 24 → 38, Caracol Radio 54 → 67,
W Radio 2 → 4, y todos los nuevos con fotografía mientras que de los 24 viejos de
El Espectador ninguno la tenía.

**LO QUE ESTO CONTAMINA, y hay que decirlo antes de que alguien lo cite.**
Publicamos que la izquierda es el **3,3 % del volumen**, y sobre esa cifra se
reconstruyó la función de puntos ciegos. Esa cifra está medida sobre un corpus en
el que la principal contraparte nacional de Semana aportaba una décima parte de
lo que le corresponde. **No es un hecho limpio sobre el país: lleva dentro un
artefacto de qué feeds nos funcionaban.** Habrá que volver a medirla en unos días
y corregir lo que haga falta.

**Quedan siete medios en Google News** —Noticias Caracol, Noticias RCN, Blu Radio,
La FM, Cambio, RTVC y Revista RAYA—. Se probó Arc en todos: no lo tienen.
Noticias Caracol y Blu Radio declaran un `.atom` en su HTML que devuelve la
página, no un feed. Siguen pendientes.

---

## 2026-08-08 · También las instituciones tienen dueño

**Decisión de Jose**, que corrigió la mía. Yo propuse cerrar los cuatro medios
que faltaban con la fórmula «no hay una persona: el dueño es un partido, el
Estado, una fundación». Su respuesta: *«Todas las instituciones tienen dueño.
Hasta de las org independientes deberíamos tratar de dar con las personas detrás
de los medios.»*

**Por qué tenía razón, y el argumento es más fuerte que el de completar fichas.**
Nombrar a Alejandro Santo Domingo y a los Gilinski, y en cambio dejar en
«institución» a quien dirige el medio público o el semanario de un partido, es
**aplicar el escrutinio de forma desigual**. Esa asimetría es exactamente el
sesgo que este mapa existe para no cometer. Una institución no disuelve la
pregunta de quién manda: la traslada a un cargo, y el cargo lo ocupa alguien con
nombre y apellido.

**Lo que se documentó, cada uno con su fuente:**

| Medio | Persona | Relación |
|---|---|---|
| RTVC | Hollman Felipe Morris Rincón | Gerente. Dirige, no posee |
| RTVC | El presidente en ejercicio | Control efectivo: lo designa vía MinTIC |
| Semanario VOZ | Jaime Caycedo Turriago | Secretario general del PCC, dueño del medio |
| Semanario VOZ | Zabier Hernández Buelvas | Director. Dirige, no posee |
| Razón Pública | Hernando Gómez Buendía | Fundador, director y editor general |
| Razón Pública | Consejo editorial | Orientan sin poseer |

**Se mantiene la regla de la tanda anterior: dirigir no es poseer**, y se dice
cuál de las dos cosas es en cada línea. Sin esa distinción, nombrar a Morris
insinuaría que el medio público es suyo.

**Dos hallazgos que no se buscaban:**

1. **RTVC ya no se llama RTVC.** `rtvc.gov.co` devuelve un 301 permanente a
   `inravision.gov.co`: la entidad recuperó su nombre histórico, Inravisión. La
   prueba es el propio redirect, comprobado hoy. **El catálogo sigue diciendo
   RTVC** — cambiar el nombre visible de un medio es decisión editorial, no mía,
   y queda anotado para que Jose decida.
2. **La ficha de RTVC tiene fecha de caducidad conocida.** El período
   presidencial terminó el 7 de agosto de 2026, o sea ayer. Quien designa al
   gerente cambió de manos. Por eso **no se nombra al presidente concreto**: se
   nombra el cargo. Un catálogo que envejece con el gobierno de turno es un
   catálogo que miente a los pocos meses.

**Colombia Informa pasa de «sin documentar» a «pendiente con procedimiento», que
no es lo mismo.** Se encontró la razón social —**Corporación Colombia Informa,
NIT 900.408.141-8**—, su financiación declarada y su articulación con la ALBA de
los Movimientos Sociales. Lo que falta es un solo dato, el representante legal, y
ya no por falta de rastro sino por un trámite: el certificado del RUES con ese
NIT exige un formulario manual. **No se escribe ningún nombre hasta tenerlo.** Es
el único medio colombiano cuyo hilo no termina todavía en una persona natural.

**El linter dijo algo que ninguna prueba dijo.** Al documentar el último medio,
`pending()` —la plantilla de ficha vacía— se quedó sin usos. Se retira en vez de
silenciar el aviso: si algún día entra un medio sin documentar, que el hueco haya
que escribirlo a mano y se note.

**Dos pruebas se apoyaban en que existiera un medio sin documentar** y se rompieron
al no haberlo. Se arreglaron **cambiando el sujeto, no el listón**: ahora usan un
id inventado. Ataban una prueba sobre el reparto por dueños a un hecho sobre
Colombia Informa, así que documentarlo rompía algo que no hablaba de él. La que
contaba fichas vacías pasa a exigir **cero**, y es cuando más protege: el
siguiente hueco entraría sin que nada más lo delate.

---

## 2026-08-08 · Distintivo de a quién responde cada redacción

> **Actualizado el mismo día.** El reparto de abajo dice «1 sin documentar». Ya
> no: ver la entrada «También las instituciones tienen dueño». Se deja el número
> original porque era el correcto cuando se tomó esta decisión.

**Decisión de Jose.** El mapa debe dejar ver de un vistazo qué medios responden a
un grupo económico y cuáles hacen periodismo independiente.

**Cómo quedó, tras una corrección suya que mejoró el diseño.** La primera versión
mostraba los cinco tipos de `ownerType` tal cual y destacaba solo `conglomerado`
e `independiente`. Jose objetó, con razón: **`ownerType` responde «quién es el
dueño» cuando la pregunta que importa es «qué naturaleza tiene ese interés»**, y
tres de los cinco cajones —conglomerado, familiar e internacional— son la misma
respuesta con distinto alcance.

Así que se invierte: manda **«Grupo económico»** y el origen queda de apellido —
nacional, regional, internacional—. `Público` e `Independiente` se quedan solos
porque sí responden otra cosa.

**Reparto resultante**, que ahora dice algo de un vistazo:

```
19  Grupo económico   (10 nacional · 7 regional · 2 internacional)
 9  Independiente
 1  Público
 1  sin documentar
```

**LO QUE ESTO AFIRMA Y LO QUE NO**, porque es lo que sostiene el cambio. NO se
dice que las familias dueñas de diarios regionales tengan negocios ocultos en
otros sectores: eso seguiría sin fuente y no se publica. Se dice que **controlar
la empresa que publica un diario ya es un interés económico**, y eso consta en
cada ficha. Es un cambio de qué cuenta como grupo económico, no una afirmación
sobre patrimonios indocumentados. Donde SÍ hay negocios en otros sectores, están
en `holdings` con su enlace.

**Y la evidencia que respalda los dos casos que Jose señaló**, encontrada al
revisar las fichas:

- **Caracol Radio y W Radio**: «internacional» decía dónde está el dueño, no qué
  es. Su ficha dice que el Grupo Prisa está «controlado desde 2003 por el
  banquero de inversión Joseph Oughourlian», y que W Radio tiene además un 14,4 %
  de Inversiones Ferines, de la familia Londoño.
- **El Colombiano y La Opinión** figuraban como familiares y ya no lo son: al
  primero un grupo de empresarios antioqueños le compró el **51 %** en 2022
  —entre ellos Manuel Santiago Mejía, del grupo Corbeta— y al segundo el Grupo
  Empresarial Catalítico el **100 %** en 2024.

**Sin ficha verificada no se pinta distintivo: dice «sin documentar».** Un medio
del que no se ha comprobado nada no es independiente por defecto ni conglomerado
por defecto. Rellenarlo con una suposición sería la clase de afirmación sin
fuente que `mediaOwnership.js` existe para impedir.

**Reparto real** sobre los medios colombianos: 10 grupo económico · 9
independientes · 7 familiares regionales · 2 internacionales · 1 público · 1 sin
documentar.

**Detalle**: el nombre del icono vive junto al tipo en `mediaOwnership.js`, no en
la pantalla, para que no acabe habiendo un mapa de iconos distinto en cada sitio
que lo muestre.

---

## 2026-08-08 · CI comprueba que la base se levanta desde cero

**Decisión.** Un job de CI aplica `schema.sql` sobre un Postgres vacío en cada
push, comprueba que es idempotente, y encima restaura un respaldo mínimo.

**Por qué, y no en abstracto.** Los tres fallos que hacían el respaldo
irrestaurable habrían saltado aquí automáticamente. Ninguno era detectable contra
producción —allí las tablas ya existen— y el patrón reaparece cada vez que
alguien añade un `ALTER` o un bloque `DO`.

**El paso de restauración no sobra.** El esquema por sí solo no prueba que un
respaldo sirva: hace falta recorrer el camino entero. Dos ciclos de prueba bastan
para comprobar que el formato encaja y que el orden de tablas no viola ninguna
clave foránea.

**Salvaguarda**: el script exige `DATABASE_URL_PRUEBA`, distinta de la de
producción, y se niega a arrancar sin ella. Lo primero que hace es `DROP SCHEMA`,
así que no puede quedar a merced de un descuido de configuración.

---

## 2026-08-08 · El ciclo publica la ventana efectiva

**Decisión.** Cada ciclo informa de **cuántas horas de historia cubre realmente
el corpus** —la edad del artículo más antiguo que sobrevivió a la poda— en el
registro y en la serie (`ingest_runs.ventana_horas`).

**Por qué esta versión y no la apuntada en la auditoría.** Allí decía «avisar si
el techo recortó», que solo se entera el día del problema. La ventana efectiva se
publica **siempre**, incluso cuando todo va bien: un número que solo aparece al
fallar no deja línea base, y encontrárselo por primera vez el día malo obliga a
averiguar entonces si es raro o normal.

**Lo que habría evitado.** Del 2026-07-30 al 2026-08-07 la ventana real bajó a
~62 h con la retención declarada en 72. La tasa multifuente dejó de crecer el
mismo día y pasaron **once días** hasta que alguien fue a mirar por qué. Ese
número, publicado desde el primer ciclo, lo habría delatado en el acto.

En la serie, además, el estrechamiento se ve **venir** a lo largo de semanas en
vez de descubrirse cuando ya ocurrió. Queda nula en los ciclos anteriores, que es
lo correcto: no se inventa hacia atrás un dato que no se midió.

---

## 2026-08-08 · El respaldo se restauró por primera vez, y no funcionaba

**Qué se hizo.** Se descargó un artefacto REAL de la copia diaria (run
31247573013), se levantó un Postgres desechable en Docker y se restauró ahí. No
contra producción, obviamente.

**Resultado: 671 ciclos restaurados**, del 2026-07-27 al 2026-08-08, con 88 501
artículos acumulados. Restaurar dos veces no duplica: la segunda pasada inserta
0 filas. El camino de vuelta funciona.

**Pero solo después de arreglar dos fallos que lo hacían imposible.** Ninguno se
veía contra producción, porque las tablas ya existían; los dos hacían que
`schema.sql` fuera inaplicable **sobre una base vacía**, que es exactamente la
situación de una recuperación real:

1. El `ALTER TABLE stories` para admitir `'center'` estaba cien líneas antes de
   que `stories` se creara. Lo había introducido yo el mismo día.
2. **Anterior y peor**: el bloque de migración de `moderation` ponía las dos
   condiciones en un solo `IF ... AND NOT EXISTS (SELECT 1 FROM moderation)`, y
   PL/pgSQL prepara la expresión entera antes de evaluarla. Sin la tabla,
   fallaba y se llevaba por delante el resto del archivo.
3. Y una tercera: `moderation` referencia `admin_users`, que se creaba después.

**Lo que esto significa.** Durante un tiempo indeterminado, el respaldo diario
corría en verde, subía su artefacto, y **no se podía restaurar**. La confianza
descansaba en que el script de volcado no daba error — y el que fallaba era el
otro extremo, el que nadie había ejecutado nunca.

**Regla que queda:** todo `ALTER` va después de su `CREATE`, y un bloque `DO` que
consulte una tabla tiene que comprobar antes que exista. Y sobre todo: **un
respaldo no está probado hasta que se restaura sobre una base vacía**. Conviene
repetirlo cada vez que el esquema cambie de forma.

---

## 2026-08-08 · Estar en el catálogo no es lo mismo que aportar cobertura

**Decisión.** El mapa distingue los medios que están publicando de los que no:
círculo hueco en el gráfico, columna «Piezas (72 h)» en la tabla, y un aviso que
lo explica.

**Por qué.** El mapa los presentaba a todos por igual, y no lo son. Medido el
2026-08-07, varios llevan días sin una sola pieza en la ventana —Vorágine publica
una cada 74,7 h, Noticias Uno es un noticiero de fin de semana, W Radio no tiene
RSS propio—. Enseñarlos junto a los que publican cientos de notas sugiere una
comparación que no está ocurriendo.

**No se retira a nadie**: su ficha de propiedad es contenido valioso por sí misma
y el criterio del proyecto es no silenciar a ningún medio. Lo que cambia es que
se dice cuáles están aportando, y el aviso aclara que **algunos publican poco por
oficio —investigación, periodicidad semanal—, no por avería**. Sin esa frase, el
círculo hueco se leería como una acusación de dejadez.

**«Todavía no se sabe» se trata distinto de «no aporta».** Mientras cargan los
datos, los círculos se pintan llenos. Marcar un medio como silencioso por no
tener el dato aún sería afirmar algo por ignorancia.

**Detalle de implementación**: los conteos se piden una vez en `MediaMap` y se
pasan a `PanoramaMediatico`, que antes hacía su propia llamada al mismo
endpoint. El componente sigue funcionando suelto si nadie se los pasa.

---

## 2026-08-08 · Un punto ciego solo se afirma si la ausencia sorprende

**Decisión de Jose.** Un espectro ausente solo se señala cuando esa ausencia es
improbable dada la frecuencia con la que ese espectro aparece en el corpus:
P(ausencia) ≈ (1 − q)^n < 0,05.

**Por qué.** Medido sobre 4 807 historias, la función insignia del producto solo
sabía decir una cosa:

```
puntos ciegos declarados ... 30 de izquierda, 0 de derecha
tasa base de aparición ..... centro 54,0 % · derecha 43,2 % · izquierda 2,8 %
de 35 historias con 4+ medios: 33 sin izquierda, 1 sin derecha
```

La izquierda faltaba en el 94 % de las historias evaluables **porque publica el
3 % del volumen, no porque decidiera callar**. El aviso medía cadencia de
publicación y lo presentaba como comportamiento editorial. Un lector que ve
treinta «punto ciego de la izquierda» y ninguno de la derecha concluye algo que
los datos no sostienen.

**Efecto, dicho sin suavizar: la función queda en cero.**

```
                 antes   ahora        medios necesarios
izquierda ....... 30       0          105 → imposible
derecha .......... 0       0            6 → posible (máximo hoy: 7)
```

Los treinta avisos falsos desaparecen y no los sustituye ninguno verdadero. Se
acepta a sabiendas: **un punto ciego que se afirma siempre no es un hallazgo, es
una constante**, y publicar cero es más honesto que publicar treinta acusaciones
que solo reflejan quién publica más.

**Falla cerrado.** Sin tasas base, `analyzeCoverage` no afirma nada. Quien llame
sin decir cada cuánto aparece cada espectro no obtiene una acusación por omisión.
Eso obligó a pasarlas también en `feedStore`: sin ese cambio la función habría
desaparecido del sitio en silencio, que es un modo de fallo peor que el que se
estaba corrigiendo.

**Lo que esto dejó a la vista, y se resolvió el mismo día.** El espectro cuya
ausencia sí es significativa con 4 medios es el **centro**. Decisión de Jose:
se añade como señal propia, **«Solo medios con línea marcada»**.

No se llama punto ciego y no lo es: **no afirma que nadie omitiera nada**. Dice
que el hecho solo interesó a medios con posición declarada, y que ninguno de los
que no la tienen lo cubrió. Con los medios sin línea marcada en el 54 % de las
apariciones, que falten todos es raro y dice algo del hecho, no de quien calla.

Va la última de las tres: si alguna vez se pudiera afirmar un punto ciego de
izquierda o de derecha, esa afirmación es más fuerte y tiene prioridad.

**Ajustada el mismo día tras ver la salida real.** Con 4 medios disparó seis
veces y **dos eran fútbol**: un gol de Luis Díaz cubierto por cuatro medios de
derecha. Cierto y vacío — revela qué medios tienen sección de deportes, no un
encuadre. Sube a **6 medios**, y con eso sobrevive el caso que la justifica:
«Uribe llegó a Cali para la investidura», 7 medios, ninguno sin línea marcada.

**En una constante APARTE**, `SOLO_LINEA_MARCADA_MIN_SOURCES`. Jose señaló el
riesgo antes de que ocurriera: `BLINDSPOT_MIN_SOURCES` vale 4 porque él lo bajó
de 6 el 2026-07-30, y subirlo en global habría deshecho esa decisión de paso y en
silencio para el punto ciego de izquierda y derecha.

**Se descartó restringir la señal a temas políticos**, que era la otra vía para
quitar el fútbol. Razón de Jose: un hecho deportivo puede reflejar algo
interesante el día menos pensado, y excluirlo por categoría lo dejaría fuera para
siempre. Subir el listón **no excluye ningún tema, exige más evidencia**: si un
día una noticia deportiva reúne seis medios y todos tienen línea marcada, la
señal aparecerá.

---

## 2026-08-07 · Vigilancia del sitio y de los medios mudos

**Decisión.** Un workflow cada 6 horas comprueba que `doblefoco.co` y la API
responden, que la API no se declara «degradado», y que ningún medio con feed
lleva **14 días o más** sin aportar un artículo.

**El umbral es generoso a propósito.** El catálogo tiene medios que publican poco
POR OFICIO: Vorágine saca una pieza cada 74,7 h —más despacio que la ventana de
retención— y Noticias Uno es un noticiero de fin de semana. Un umbral de dos o
tres días los marcaría cada semana, y un aviso que grita cuando no pasa nada
enseña a ignorarlo. Es el mismo error que costó los correos falsos de Actions,
y se evitó a propósito.

**Hizo falta memoria durable.** `articles` retiene 72 horas, así que un medio
ausente desde ayer y otro desde hace un mes son indistinguibles: los dos tienen
cero filas. Se añadió `sources.last_article_at`, que rellena la propia
comprobación —no el ciclo de ingesta, porque no vale un UPDATE por medio cada 30
minutos para un umbral de 14 días—.

**Los «sin registro» no cuentan como fallo.** La columna nació hoy y solo se
rellena con lo que hay en la ventana de 72 h, así que un medio callado en ese
momento aparece sin fecha sin que eso signifique avería. Un aviso que nace en
rojo se ignora desde el primer día.

**Lo que esto NO es**: un monitor de disponibilidad. Corre cada 6 horas y el cron
de GitHub se retrasa; una caída de una hora puede pasar desapercibida. Detecta lo
que hoy no se ve en absoluto —que algo lleve roto desde ayer—, y así está dicho
en la cabecera del workflow para que nadie crea que hay una red que no existe.

---

## 2026-08-07 · El despliegue de Fly se comprueba solo

**Decisión.** `/api/health` publica el commit y el número de feeds del código que
corre; un workflow diario los compara con `main` y falla si hay desfase.

**Por qué.** Empujar a `main` publica el cliente pero NO la API ni el motor: eso
sale a mano. Olvidarlo no produce ningún error. Ya mordió dos veces, la peor con
**seis días leyendo 37 feeds cuando el registro tenía 39** y tres secciones
contando en cero.

**Dos comprobaciones, no una.** El commit es más preciso pero exige que la imagen
esté marcada; **el número de feeds funciona igual**, y fue así como se detectó el
desfase la primera vez.

**Si no se puede comprobar, se dice.** Un `fly deploy` a secas deja la imagen sin
marcar y la comprobación responde «no verificable» en vez de dar el despliegue
por bueno. Callar ahí daría confianza sin respaldo, que es justo el patrón que
esto viene a romper.

**Cambia la costumbre**: se despliega con `npm run deploy`, que pasa el commit y
además **se niega a desplegar con cambios sin confirmar** —marcar la imagen con
un commit cuyo contenido no es el desplegado convertiría la comprobación en una
mentira—.

**Nota de portabilidad**: va en un script y no en una línea de `package.json`
porque `$(git rev-parse HEAD)` no se expande en Windows. Habría funcionado en un
portátil y fallado en silencio en otro.

---

## 2026-08-07 · El algoritmo de sesgo se diseña desde cero y por fases

**Decisión.** Antes de tocar un solo valor de `bias`, se escribe el método. Está
en `DISENO_ALGORITMO_SESGO.md`: ocho fases, cada una con entregable propio y con
permiso explícito para terminar en «no se puede».

**Por qué.** Los tres medios que motivaron la conversación —Semana, Blu Radio, El
Colombiano— ya están clasificados como derecha (+0,45, +0,25, +0,35, con
`SPECTRUM_THRESHOLD` en 0,2). Lo que da impresión de centro es que la banda «Sin
línea marcada» ocupa de −0,2 a +0,2, la más ancha del mapa. Subir sus valores a
mano para que «se vean» más a la derecha habría sido mover la afirmación más
fuerte del sitio sin evidencia, que es justo lo que F1-13 existe para impedir.

**Lo que aporta el diseño nuevo.** Responde la pregunta 7a de
`CONTEXTO_ALGORITMO_SESGO.md` —de dónde sale una etiqueta que no hayamos escrito
nosotros— con la arquitectura que usan los tres trabajos de referencia del campo:
**escala externa e independiente + conducta observable que anclas y medios
comparten**. Nunca pedirle al corpus de medios que produzca la escala solo, que
es lo que se intentó con la co-cobertura y por eso dio un bloque y cinco medios
sueltos.

**Se descartó**: subir los valores ahora; y también dar por sentado que el eje es
izquierda-derecha. El número de dimensiones se decide mirando los valores
propios, no antes.

**Riesgo asumido y declarado**: la Fase 1 puede concluir que no existe el anclaje
externo. Sería un resultado legítimo, y dejaría como respuesta honesta el juicio
editorial declarado y sujeto a réplica.

---

## 2026-08-07 · El mapa mediático es solo colombiano

**Decisión.** `MediaMap` y `PanoramaMediatico` muestran únicamente medios con
`country === 'CO'`. Se retira la casilla «Solo medios colombianos», que venía
activada pero podía apagarse.

**Por qué.** La pregunta de esa página tiene un sujeto —la concentración de la
propiedad en Colombia— y mezclar a la BBC con El Tiempo no hacía el retrato más
completo, lo desdibujaba. En el reparto por dueños era peor que estético: el
volumen de Euronews o El País de España entraba en el denominador, así que
cuantos más medios extranjeros hubiera, **menos concentrado parecía el mercado
colombiano**. Justo lo contrario de lo que el dato debe mostrar.

**Qué NO cambia.** Los medios internacionales siguen en el catálogo y siguen
aportando cobertura. No es retirar a nadie; es que esta página responde una
pregunta sobre Colombia.

**Dónde.** `src/pages/MediaMap.jsx`, `src/components/PanoramaMediatico.jsx`.

---

## 2026-08-07 · El techo expulsa por comparabilidad, no por antigüedad

**Decisión.** Cuando el corpus supera `MAX_ARTICLES`, se expulsa primero la
noticia **internacional que ningún otro medio del catálogo cubrió**, y solo
después por edad. Con periodo de gracia de 12 h y solo cuando el techo aprieta:
no se borra nada, se elige a quién dejar fuera cuando no cabe todo.

**Evidencia.** Medido sobre el corpus de 72 h (5 794 artículos):

| | |
|---|---|
| internacional | 42,8 % |
| internacional que nadie más cubrió | **39,8 %** (2 305 artículos) |
| corpus comparable restante | 3 489 — muy por debajo del techo de 8 000 |

Infobae Colombia publica 1 897 piezas en 72 h y el **89,2 % son
internacionales** —España, Argentina, México, Perú, Brasil—: su feed sirve el
cable panhispánico, no noticia colombiana. Solo el **5 %** de lo suyo llega a
compararse, frente al 25 % de El Tiempo o El Colombiano. Mientras tanto Vorágine
publica una pieza cada 74,7 h, más despacio que la propia ventana, y quedaba
excluido de forma sistemática. **El cable extranjero de un medio estaba
desalojando al periodismo de investigación colombiano.**

**Se aplica a todos por igual**, incluidos Euronews, DW, France 24 y El País de
España. Lo que sobrevive de ellos es lo internacional *relevante* —lo que un
medio colombiano también cubrió—, que es lo que pide F1-16. Una excepción por
medio habría sido una regla sobre quién publica, no sobre qué se puede comparar.

**No es un filtro de calidad**, y por eso no vive en `contentQuality.js`: no dice
que esas piezas sean peores, dice que cuando no cabe todo se elige por
comparabilidad.

**Efecto colateral buscado.** Los medios lentos —Vorágine, Noticias Uno— vuelven
a entrar sin necesidad de ninguna regla especial para ellos.

**Se descartó**: una ventana de retención asimétrica que conservara más tiempo a
los medios de bajo volumen. Compensaba el desequilibrio en vez de corregirlo, y
habría sido una regla sobre quién publica.

**Dónde.** `pruneArticles` en `server/services/ingestDaemon.js`.

---

## 2026-08-07 · F1-01: la serie no se estabilizó, topó

**Decisión.** `MAX_ARTICLES` sube de 5 000 a 8 000. No se tocan
`ITEMS_PER_FEED`, la retención ni el agrupamiento.

**Evidencia.** 595 ciclos y 12 días. El corpus llegó a 5 000 el 2026-07-30 a las
14:25 y se quedó ahí 348 ciclos; la tasa multifuente dejó de crecer el mismo día
(34 → 150 → 302 → 346, y luego once días entre 330 y 351). El techo mordía antes
que la retención: cubrir 72 h reales pedía 5 786 artículos, así que 790 (13,6 %)
estaban dentro de la política de retención y no entraban al agrupamiento. La
ventana efectiva era de ~62 h.

Coste medido antes de decidir: 19,3 s de ciclo con 5 000 artículos, contra
cadencia de 30 min y timeout de 10; worker con 512 MB para un conjunto de ~10 MB.

**Pendiente.** Volver a leer la serie una semana después para ver dónde se
estabiliza de verdad.

**Dónde.** ROADMAP F1-01 (cerrada), constante en `ingestDaemon.js`.

---

## 2026-08-06 · Renderizar en servidor las páginas que no dependen de la base

**Decisión.** `/mapa-medios`, `/transparencia` y `/sobre-nosotros` se renderizan
en Fly. La portada, `/categorias` y `/tendencias` no, de momento.

**Por qué.** Llegaban al buscador como 2 300 bytes con un `<div id="root">`
vacío. Son las páginas con lo único que este proyecto publica y nadie más tiene
reunido. Estas tres se construyen enteras desde el registro, así que
`render(url)` las produce sin pasarles datos; las otras necesitan precargar las
historias y es más trabajo.

**Cuidado al continuar.** `obtenerPlantilla()` pide la plantilla a la raíz del
sitio. El día que se renderice la portada, el servidor se llamaría a sí mismo en
bucle: hay que cambiar antes de dónde sale la plantilla.

**Orden de despliegue.** Primero `fly deploy`, después el merge a `main`. Al
revés, Vercel manda la ruta a un servidor que aún no la conoce.

---

## 2026-08-06 · Cerrar la API pública de Supabase

**Decisión.** RLS activada en las 14 tablas, permisos retirados a `anon` y
`authenticated`, permisos por omisión revocados, y `public` fuera de los
esquemas expuestos.

**Por qué.** El aviso de Supabase decía «tabla de acceso público»; medido, era
más: `anon` —el rol de la clave pública, la que se incrusta en un navegador—
tenía SELECT, INSERT, UPDATE, DELETE y TRUNCATE en todas. Podía leer
`admin_users` y borrar `ingest_runs`, la serie que no se reconstruye.

**Dónde.** Bloque 12 de `server/db/schema.sql`, idempotente y en la migración.

---

## 2026-08-06 · Saltar por el cerrojo no es fallar

**Decisión.** `ingest:once` sale con **0** cuando otro proceso tiene el cerrojo.
El 1 queda para «no se pudo persistir». Y el cron de Actions baja de 30 min a
2 h.

**Por qué.** El motor de Fly y el cron corren los dos cada media hora; al
cruzarse, uno se salta el ciclo —que es lo previsto— y mandaba un correo de
fallo. Un aviso que grita cuando no pasa nada enseña a ignorarlo. A cadencia de
30 min el cron no era un respaldo sino el mismo trabajo hecho dos veces, con 37
medios recibiendo nuestras peticiones el doble de veces.

**Además.** El proceso terminaba y no se moría: entre 51 s y 9 min de sockets
abiertos, cuatro ejecuciones canceladas por el timeout en 36 h. Ahora sale
explícitamente tras vaciar stdout.
