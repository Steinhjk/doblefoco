# Cola de revisión

Estado al **2026-08-12**. **65 medios en el catálogo, 52 colombianos, CERO
firmados.** La cifra de firmados no ha subido desde que existe este archivo; la
del catálogo subió tres el día 12 —EL DIARIO de Boyacá, Vive el Meta y Lente
Regional—, así que **la distancia entre lo que se publica y lo que se ha
auditado vuelve a crecer**.

---

## PENDIENTE ABIERTO: enviar las fichas a las IAs externas

Pedido de Jose el **2026-08-11**. Lo hace él, con modelos de ventana grande, para
que analicen el sesgo real de cada medio con evidencia fáctica.

**El circuito está montado y no se ha enviado nada.** `LEEME.md` explica el
procedimiento, `PROMPT.md` y `CONTEXTO.md` son lo que se pega, y **`respuestas/`
está vacía salvo la plantilla**. Ese es el estado, y es el único dato que hacía
falta aquí.

**Hay 21 fichas con valor propuesto**, listas para enviar —este archivo decía 17
y «catorce regionales», y ninguna de las dos cifras cuadraba con su propia
lista; contadas una por una son 3 + 18—. Las tres que ya marcaba —El Espectador,
CasaMacondo, Volcánicas— más dieciocho regionales con valor provisional de alta:
Boyacá Digital, Chocó 7 Días, Diario del Huila, Diario del Norte, Ecos del
Combeima, EL DIARIO de Boyacá, El Diario de Pereira, El Manduco, El Morichal, El
Pilón, La Razón.co, Lente Regional, MiPutumayo, Proclama del Pacífico, Pulzo,
Telecafé, Valora Analitik y Vive el Meta.

**Tres de esa lista dejaron de ser candidatos y ya están publicándose**: EL
DIARIO de Boyacá, Lente Regional y Vive el Meta entraron el 2026-08-12. Su ficha
sigue igual de pendiente de revisión; lo que cambió es que ahora el lector ya ve
su número. **EL DIARIO entró en 0,00 y no en el +0,20 que proponía su ficha** —
si se manda a revisión, es ese valor el que hay que contrastar.

**Los medios grandes no tienen ficha.** Noticias Caracol, El Tiempo, Semana,
Caracol Radio, Noticias RCN y La FM entraron antes del protocolo: su
`biasRationale` es una frase en el registro, no un expediente. No hay nada que
enviar de ellos hasta que se escriba.

---

## PENDIENTE ABIERTO: la categoría de canales de YouTube

Pedido de Jose, retomado el **2026-08-11**. Se le dedicó tiempo en una sesión
anterior y **no quedó nada escrito en el repositorio**, así que se reconstruye
desde aquí.

**La idea, con sus palabras:** una **categoría con los canales distribuidos**.

Lo que falta por concretar antes de tocar código —preguntar, no suponer—:

- **Distribuidos ¿según qué?** El espectro es el eje del producto, pero puede ser
  otra cosa.
- **Qué canales entran**: los de los medios que ya están en el catálogo, canales
  que solo existen en YouTube, o ambos.
- **Si un canal cuenta como medio** a efectos de propiedad, sesgo y ficha, o es
  una capa aparte.

Ver `PLANEACION.md` en la raíz de la app, donde vive el hilo completo.

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
Razón.co de Montería y la ingesta de EFE**— y el 2026-08-12 otros tres —**EL
DIARIO de Boyacá, Vive el Meta y Lente Regional**—, los seis sin firmar como el
resto. El catálogo crece más rápido de lo que se audita, y eso es una decisión
implícita que conviene tomar en voz alta alguna vez.

**Un dato del día 12 que vale para toda la cola:** al comprobar de campo las
tres fichas antes del alta, **una había caducado en tres días**. La de EL DIARIO
apoyaba su nivel 1 en dos cargos que el medio ya no publicaba, porque había
cambiado de manos en junio. Si una ficha de agosto envejece así, **las fichas que
se manden a revisión externa hay que comprobarlas el día que se mandan**, no
darlas por buenas porque estén escritas.
