# Cola de revisión

Estado al **2026-08-11**. **62 medios en el catálogo, 49 colombianos, CERO
firmados.** La cifra de firmados no ha subido desde que existe este archivo.

---

## PENDIENTE ABIERTO: auditar las fichas de sesgo con IAs externas

Pedido de Jose el **2026-08-11**. Es el pendiente de mayor alcance de la cola: no
va sobre un medio, va sobre **el método entero**.

**Qué hay que hacer.** Pasar las fichas de sesgo por modelos externos para que
las auditen antes de firmar ninguna. La infraestructura ya está aquí:
`PROMPT.md`, `CONTEXTO.md` y la carpeta `respuestas/`.

**CÓMO SE LES PREGUNTA, y esto no es un detalle de forma.** Se les pide
**refutar**, no opinar. Un modelo al que se le pregunta «¿está bien este +0,45?»
tiende a decir que sí, y ese sí no vale nada: **el acuerdo de un modelo no es un
aval**. Lo que sirve es lo que consiga tumbar. Quien firme al final es Jose, y
firma contra las objeciones que sobrevivieron, no con el respaldo de nadie.

**Por dónde empezar, ahora que hay criterio de orden.** Desde el 2026-08-11 el
catálogo tiene un tramo prioritario de 20 fichas ordenado por audiencia
(`shared/audiencia.js`). Ese mismo orden vale aquí y es mejor que el de «mayor
volumen» que esta cola usaba en el punto 3: **un sesgo mal puesto en Noticias
Caracol lo ven 42 de cada 100 colombianos; en un semanario de provincia, nadie.**

Los seis primeros del tramo, por orden: Noticias Caracol, El Tiempo, Noticias
RCN, Caracol Radio, Semana y Pulzo.

**Ojo con los tres del tramo que ni siquiera tienen ficha razonada todavía**:
Noticias Caracol, Caracol Radio y La FM entraron antes del protocolo y su
`biasRationale` es una frase suelta sin evidencia enlazada.

---

## PENDIENTE ABIERTO: lo de YouTube

Pedido de Jose el **2026-08-11**, anotado aquí para que no se pierda.

**No hay detalle escrito todavía, y no me lo invento.** No aparece nada de
YouTube en el repositorio —ni en el registro, ni en el roadmap, ni en las notas
de traspaso—, así que esto es un marcador, no una tarea especificada.

Lo que hay que aclarar antes de empezar, porque cada lectura es un trabajo
distinto:

- **¿Los canales de YouTube de los medios que ya están?** Noticias Caracol,
  Noticias RCN y City TV publican ahí antes que en su web, y sería una vía para
  medios que hoy entran mudos o por Google News.
- **¿O YouTube como espacio informativo propio?** Los canales de opinión política
  colombianos que no son medios registrados. Eso abre la pregunta de qué cuenta
  como medio y toca la taxonomía entera.
- **¿O el dato de audiencia?** En el ranking de Semrush, `youtube.com` sale como
  el sitio de «noticias» más visitado de Colombia, por delante de El Tiempo. Es
  ruido de su categorización, pero apunta a algo real sobre dónde se consumen
  noticias.

**Preguntar a Jose cuál de las tres antes de tocar nada.**

## Listas para pasar a revisión externa

| Medio | Valor actual | Ficha | Estado |
|---|---|---|---|
| El Espectador | −0,20 | `fichas/el-espectador.md` | **Lista.** Propone NO FIRMAR: su justificación era puramente histórica y cayó con la regla del presente |
| CasaMacondo | −0,35 | `fichas/casa-macondo.md` | **Lista.** Medio nuevo, valor derivado de su declaración vigente |
| Volcánicas | −0,50 | `fichas/volcanicas.md` | **Lista.** Medio nuevo, financiación declarada con porcentajes |

## Prioridad siguiente, y por qué en este orden

**1. Los otros dos de Valorem** — Noticias Caracol (+0,10) y Blu Radio (+0,25).
No por ellos mismos: porque cierran la tensión de los tres medios del mismo dueño
con 0,45 de recorrido entre ellos. Es la incoherencia más visible del catálogo y
la que un auditor encontraría primero.

**2. Los cuatro con justificación que apela al pasado** — Semanario VOZ, La
Patria, El Colombiano, El Nuevo Siglo. En los cuatro la cláusula histórica va
junto a una afirmación del presente, así que probablemente sobrevivan; conviene
confirmarlo y reescribir la justificación sin la parte histórica.

**3. ~~Los de mayor volumen~~ → los de mayor AUDIENCIA.** Sustituido el
2026-08-11: el criterio era Semana, El Heraldo, El País de Cali y El Tiempo por
número de artículos, y el volumen no mide a cuánta gente llega un error. Usar el
tramo prioritario de `shared/audiencia.js`, que ordena por lectores. Ver el
pendiente de arriba.

**4. RTVC** — revisión extraordinaria ya prevista: su gerencia depende del
gobierno y el período cambió el 7 de agosto de 2026. Su ficha de propiedad lleva
anotada la previsión de que gire a una posición oficialista. **Esa previsión se
escribió ANTES**, así que al revisarla se puede contrastar en vez de
racionalizar.

## Los que hay que esperar

Los medios cuyo feed se corrigió el 2026-08-08 —**El Espectador, Caracol Radio,
W Radio, Cambio, El Universal**— no tienen todavía conducta medida suficiente.
Su corpus arranca de cero ese día.

**Primera fecha con datos utilizables: 2026-11-06** (90 días). Antes de eso, la
evidencia de nivel 2 para ellos es ruido.

## Recordatorio de por qué ninguno está firmado

Los **62** medios del catálogo tienen `reviewedAt: null`. Cada valor es un juicio
nuestro con una frase de justificación y ninguna evidencia enlazada. **Esto no es
un defecto que estas fichas introduzcan: es el estado actual, que las fichas
vienen a hacer visible y a corregir uno por uno.**

Y la cifra sube, no baja: el 2026-08-11 entraron tres medios más —**Pulzo, La
Razón.co de Montería y la ingesta de EFE**—, los tres sin firmar como el resto.
El catálogo crece más rápido de lo que se audita, y eso es una decisión implícita
que conviene tomar en voz alta alguna vez.
