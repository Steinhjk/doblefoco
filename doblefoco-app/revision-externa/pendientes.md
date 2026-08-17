# Cola de revisión

> ## ESTA COLA ES AHORA EL ÚLTIMO PASO DEL TRABAJO, NO EL QUE VA DETRÁS
>
> **Decisión de Jose, 2026-08-17:** *el punto final de cada prueba de sesgo son las
> fichas para las IAs.* Ninguna medición se cierra dentro de casa. Una ficha no está
> terminada cuando se escribe, sino cuando ha pasado por aquí y sus objeciones están
> resueltas o declaradas. Y **cada alta nueva entra en esta cola**: dar de alta un
> medio ya no acaba en el registro.
>
> Sigue en pie lo de `LEEME.md`: **se pide objeción, no opinión**, el **acuerdo no
> cuenta como aval**, y **la firma es de Jose**. Las IAs son el examen, no el
> examinador. Ver `DECISIONES.md` del 2026-08-17.

Estado al **2026-08-17**. **76 medios en el catálogo, 56 fichas escritas, CERO
firmadas**, y `respuestas/` sigue vacía: **no se ha enviado nada todavía**. Lo que
sí hay ya es **el primer envío armado y comprobado**: Diario La Libertad, abajo.

**La distancia entre lo publicado y lo auditado es hoy todo el catálogo, y creció
once medios en cinco días.** Eran 65 el día 12. Entraron: Al Aire Noticias (Arauca),
los seis departamentales del día 14, El Nuevo Día (Ibagué), y las tres del 14-16 —
**Cablenoticias, La Nación (Neiva) y Diario La Libertad**.

### ✅ DIARIO LA LIBERTAD: COMPROBADO Y LISTO PARA ENVIAR (2026-08-17)

**Es el primer envío armado del proyecto.** Está en
**`envios/2026-08-17-diario-la-libertad.md`** — prompt, contexto y ficha unidos.
Se copia entero y se pega. La respuesta va literal a
`respuestas/<modelo>-diario-la-libertad.md`.

**La comprobación del día del envío cambió la ficha, y esto es lo que hay que
saber antes de leerla:**

1. **La pieza que devolvía 403 se pudo leer.** No había bloqueo, era el
   User-Agent otra vez. Es un perfil de **promoción política de Tcherassi sin
   firma ni contradictorio** (10-05-2025). Pasa de anotación pendiente a conducta
   observable.
2. **Pero esa conducta se acabó.** Doce titulares políticos con Tcherassi entre
   dic-2024 y may-2025, **cero** desde entonces — y el **21-04-2026 el diario
   publica un editorial de solidaridad con el alcalde Char**. La ventana
   pro-Tcherassi coincide con la operación anunciada y se cerró con ella.
3. **Tres indicios de que la compra no se cerró**, todos del propio medio y del
   presente: se llama a sí mismo «propiedad de la familia Esper» (30-11-2025) y
   sigue llamando directora a Luz Marina Esper (29-07-2026, 31-05-2026).
4. **EL HALLAZGO: la directora anunció su candidatura en su propio periódico.**
   «No lo pongas en duda, voy para la contienda electoral» (12-10-2025). Y el
   30-11-2025 el diario promociona a otra Esper como aspirante a la Cámara.
   **Ese conflicto está mejor acreditado que el de Tcherassi**, y el periódico no
   lo declara en ninguna parte.
5. **Queda una decisión para Jose, sin tomar:** si eso se publica en el texto que
   ve el lector. Hoy está solo en la ficha y en `mediaOwnership.js`. Publicarlo
   obliga a escribir una regla que no existe — cuándo la política de **quien
   dirige** es materia de aviso.

`ownerType` sigue en `null` y el sesgo en 0,00, **pero ya no por Regla 2**: ahora
hay conducta observable y apunta en dos direcciones. Esa es la primera pregunta
que se le hace al revisor.

### Las otras dos altas de la tanda

| Medio | Ficha | Qué hay que contrastar |
|---|---|---|
| La Nación (Neiva) | `fichas/la-nacion-neiva.md` | Felipe Olave Blackburn la compró en 2024 y luego adquirió Huila Stéreo. Casi toda la evidencia es del propio diario — nivel 4 |
| Cablenoticias | `fichas/cablenoticias.md` | Propiedad completa pero de 2018, con sociedad última en Panamá. Entró con ausencia declarada |

**Las tres entraron en 0,00 por Regla 2 y con `ownerType: null`**, así que lo que
hay que contrastar no es un número sino **si la ausencia está bien declarada**.

---

## EL TRAMO PRIORITARIO YA ESTÁ LISTO PARA ENVIAR (2026-08-12)

**Jose hace la comprobación hoy con Kimi K3 y Fable 5.** Lo que faltaba eran las
fichas de los medios de mayor relevancia nacional, y ya están: **los 20 del tramo
prioritario de `shared/audiencia.js` tienen ficha.** Eran 2 de 20 esta mañana.

### Las 20, en orden de audiencia

| # | Medio | Valor | Ficha | Qué propone la ficha |
|---|---|---|---|---|
| 1 | Noticias Caracol | +0,10 | `fichas/noticias-caracol.md` | No firmar: sin evidencia propia, y 21 artículos de corpus |
| 2 | El Tiempo | +0,05 | `fichas/el-tiempo.md` | No firmar: el número calibra el resto del catálogo y no está fundado |
| 3 | Noticias RCN | +0,25 | `fichas/noticias-rcn.md` | **Cerca de firmable**: la afirmación es del presente, faltan las piezas |
| 4 | Caracol Radio | +0,05 | `fichas/caracol-radio.md` | No firmar: su justificación **no afirma nada** sobre orientación |
| 5 | Semana | +0,45 | `fichas/semana.md` | **La más cerca de firmarse.** Cambiar una frase y añadir cinco enlaces |
| 6 | Pulzo | 0,00 | `fichas/pulzo.md` | Ficha del 2026-08-11 |
| 7 | El Espectador | −0,20 | `fichas/el-espectador.md` | **NO FIRMAR**, sin base admisible (ficha del 08-08) |
| 8 | Blu Radio | +0,25 | `fichas/blu-radio.md` | No firmable **por separado**: vértice de los 0,45 de Valorem |
| 9 | Infobae Colombia | +0,15 | `fichas/infobae-co.md` | No firmar: **confunde factualidad con orientación** |
| 10 | CNN en Español | −0,15 | `fichas/cnn-es.md` | No firmar: clasificado en un eje que no es el colombiano |
| 11 | La Silla Vacía | −0,10 | `fichas/la-silla-vacia.md` | No firmar: su propia justificación apunta a 0,00 |
| 12 | La FM | +0,35 | `fichas/la-fm.md` | No firmar: afirmación buena, cero evidencia, 11 artículos |
| 13 | Noticias Uno | −0,40 | `fichas/noticias-uno.md` | **No firmar**: mitad histórica, propiedad sin cerrar, cero corpus |
| 14 | El Heraldo | +0,20 | `fichas/el-heraldo.md` | No firmar: mejor ficha de propiedad, justificación más vacía |
| 15 | El Colombiano | +0,35 | `fichas/el-colombiano.md` | No firmar: «tradición conservadora» es histórico |
| 16 | El País (Cali) | +0,30 | `fichas/el-pais-cali.md` | No firmable por separado: mismo dueño que Semana |
| 17 | La República | +0,15 | `fichas/la-republica.md` | No firmar: el conflicto de interés más nítido del catálogo, sin mencionar |
| 18 | El Universal | +0,20 | `fichas/el-universal.md` | No firmar: vínculo político de los dueños documentado y no citado |
| 19 | La Opinión | +0,30 | `fichas/la-opinion.md` | No firmar: cambió de dueño en 2024 y la justificación es anterior |
| 20 | Vanguardia | +0,25 | `fichas/vanguardia.md` | No firmar: el caso puro del patrón regional sin criterio escrito |

### Antes de enviarlas: lee esto y decide si va con ellas

**`CONDUCTA-MEDIDA.md`**, en esta misma carpeta. Explica de dónde salen las tres
cifras de nivel 2 de cada ficha y **por qué hoy casi no discriminan**: son tres
días, el corpus está dominado por el terremoto, y la compañía media está saturada
—los veinte medios van de +0,08 a +0,19—. Si un revisor usa la compañía media para
mover un número, eso es una objeción válida contra la ficha, y conviene que lo
sepa.

Se puede recalcular en cualquier momento: `npm run conducta`.

### Cinco preguntas que atraviesan varias fichas

Salieron al escribirlas y **ninguna se resuelve ficha por ficha**. Merece la pena
llevarlas a los modelos como preguntas propias:

1. **Los tres de Valorem** —Noticias Caracol +0,10, Blu Radio +0,25, El Espectador
   −0,20—: **0,45 de recorrido en la misma casa, sin explicación escrita.** Es lo
   primero que encuentra un auditor. Enviar las tres juntas.
2. **«Fiscalizar al poder» se resuelve de tres formas distintas.** Chocó 7 Días va a
   la mixta porque «denunciar al poder es el oficio y no una orientación»; Noticias
   Uno va a −0,40 justamente por su vigilancia al establecimiento; La Silla Vacía
   está en −0,10 por lo mismo sin decirlo. **Las tres no pueden tener razón.**
3. **Los siete diarios regionales están todos a la derecha**, de +0,15 a +0,35,
   ninguno en la mixta. Si el criterio es «familia empresarial regional → derecha
   moderada», eso es la regla 5.1 al revés y hay que escribirlo o sustituirlo.
4. **Los trece medios internacionales están clasificados en el eje de su país**, no
   en el colombiano. Nadie ha justificado la traslación. Bloquea las trece fichas.
5. **La prensa económica no tiene ancla.** La República, Portafolio y Valora
   Analitik están calibrados unos con otros —Valora entró tomando «el de
   Portafolio»— y ninguno tiene evidencia propia.

### Dos más, que salieron del trabajo del 12 al 17 de agosto

6. **UN TERCIO DEL CATÁLOGO ESTÁ EN 0,00 Y OTRO CUARTO SIN DUEÑO DECLARADO.**
   30 de 76 medios llevan sesgo 0,00 y **18 fichas de propiedad tienen
   `ownerType: null`**. La regla dice que 0,00 se lee como «no sabemos» y no como
   «equilibrado», y que la ausencia de dueño vale si está fechada y documentada.
   **La pregunta para los modelos es si eso se sostiene a esta escala**: cuando el
   «no sabemos» es un tercio del catálogo, ¿sigue siendo una declaración honesta o
   se ha vuelto un lugar donde aparcar lo que no se investigó? Es la objeción más
   fuerte que se le puede hacer hoy a este proyecto, y conviene provocarla.

7. **DOS DIARIOS REGIONALES CAMBIARON DE DUEÑO Y EL COMPRADOR TIENE AGENDA
   POLÍTICA PROPIA.** Diario La Libertad —Samuel Tcherassi, candidato a la Alcaldía
   de Barranquilla 2027, y antes contratista de esa alcaldía— y La Nación de Neiva
   —Felipe Olave Blackburn, 2024, que compró después Huila Stéreo—. En los dos
   casos la evidencia es incompleta y en los dos se optó por **declarar y no
   asignar**. La pregunta: **¿dónde está el umbral entre desvelar un conflicto de
   interés y afirmar una propiedad que no consta?** Ninguna regla escrita lo fija
   hoy, y la respuesta cambia las dos fichas.

### Lo que las fichas piden y NO es opinión de modelo

Cinco de ellas se cierran con **búsqueda documental**, no con juicio: Noticias RCN,
La FM, El Colombiano, Semana y La Opinión necesitan **tres a cinco piezas fechadas
de los últimos 12 meses**. Si los modelos aportan eso con enlaces comprobables,
esas cinco pasan de «no firmar» a firmables.

---

## PENDIENTE ABIERTO: enviar las fichas a las IAs externas

Pedido de Jose el **2026-08-11**. Lo hace él, con modelos de ventana grande, para
que analicen el sesgo real de cada medio con evidencia fáctica.

**El circuito está montado.** `LEEME.md` explica el procedimiento, `PROMPT.md` y
`CONTEXTO.md` son lo que se pega, y **`respuestas/` sigue vacía salvo la
plantilla**. El envío es del 2026-08-12, con Kimi K3 y Fable 5.

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
