# ENVÍO A REVISIÓN EXTERNA — Diario La Libertad (Barranquilla)

> **Armado el 2026-08-17.** Este archivo es `PROMPT.md` + `CONTEXTO.md` + la ficha
> del medio, en ese orden y sin editar. **Se copia entero y se pega al modelo, de
> una sola vez.** La respuesta se guarda literal en
> `respuestas/<modelo>-diario-la-libertad.md`, con `respuestas/PLANTILLA.md`.
>
> La ficha se comprobó de campo **el mismo día del envío**, como manda la regla
> que dejó EL DIARIO de Boyacá. Todos los enlaces del sitio del medio respondían
> 200 el 2026-08-17 con un User-Agent de navegador.

---

<!-- ==================== PROMPT ==================== -->

Eres revisor externo de una clasificación de orientación editorial de medios
colombianos. Tu trabajo NO es dar tu opinión sobre dónde va el medio: es
**intentar refutar** la clasificación que se te presenta.

## Qué se te pide, exactamente

1. **Ataca la clasificación propuesta.** Busca la evidencia más fuerte que la
   contradiga. Si crees que el medio está mal ubicado, dilo y demuéstralo.
2. **Toda afirmación tuya tiene que venir con una fuente citable y verificable.**
   Un enlace, un documento, un registro. Si no puedes citarla, no la incluyas —
   escribe en su lugar «no encuentro fuente para esto» y sigue.
3. **Marca la fecha de cada evidencia que aportes.**

## Tres reglas que descalifican una respuesta

**REGLA DEL PRESENTE.** Solo vale evidencia sobre la situación ACTUAL del medio.
No cuentan fundaciones, efemérides, «tradiciones», premios antiguos, atentados
sufridos, directores anteriores ni la línea que tuvo en otra época.

El caso que zanja esto: *Semana* destapó las chuzadas del DAS durante el gobierno
de Uribe, y hoy su línea es de derecha bajo otra propiedad. Si el pasado contara,
Semana tendría que clasificarse a la izquierda. **No cuenta.**

La prueba para decidir si algo es evidencia o es historia: *si ese hecho dejara de
ser cierto mañana, ¿cambiaría la clasificación?* Si la respuesta es no, es
historia. «Fundado en 1957» no vale. «Hoy lo posee el Partido Comunista» sí,
porque la propiedad es comprobable hoy y podría cambiar.

**NO INVENTES FUENTES.** Si no encuentras respaldo documental para algo que
sospechas, dilo tal cual. Una cita falsa o un enlace que no existe hace más daño
que el silencio, porque contamina un expediente que otras personas van a auditar.
Preferimos un hueco declarado a un dato verosímil.

**NO ES UNA PREGUNTA DE OPINIÓN.** No respondas «yo lo pondría en −0,3». Responde
qué evidencia comprobable contradice —o no— lo que se propone.

## Formato de tu respuesta

```
## OBJECIONES
Para cada una:
- QUÉ afirma la ficha que crees incorrecto
- POR QUÉ, con evidencia
- FUENTE (enlace) y FECHA de esa evidencia
- QUÉ NIVEL de evidencia es: propiedad / conducta observable / registro externo /
  declaración del propio medio / hecho editorial de los últimos 12 meses

## LO QUE NO PUDE VERIFICAR
Afirmaciones de la ficha que no lograste comprobar ni refutar, y por qué.

## LO QUE FALTA
Evidencia que crees que la ficha DEBERÍA tener y no tiene.

## SIN OBJECIÓN
Solo si no encontraste ninguna. Di explícitamente que no encontraste evidencia
en contra, y no lo presentes como un aval: no haberla encontrado no significa
que no exista.
```

## Contexto que necesitas

A continuación va el contexto del proyecto y después la ficha del medio.

---

<!-- ==================== CONTEXTO ==================== -->

# Contexto del proyecto — para el revisor externo

## Qué es DobleFoco

Un sitio colombiano que agrupa la misma noticia contada por distintos medios y
muestra quién la cubre y quién no. Para eso clasifica a cada medio en una escala,
y **esa clasificación es la afirmación más fuerte que hace el sitio**: decir que
un medio es de derecha es decir algo sobre organizaciones reales e
identificables.

No está en producción todavía. Se está construyendo la clasificación antes de
publicar.

## Qué se está clasificando

**ORIENTACIÓN del medio**: estructural, de la casa, permanente. De dónde viene, a
quién responde, qué considera noticia.

**NO es sesgo de una pieza concreta.** Eso es otra cosa —qué palabras elige un
artículo, a quién cita— y no se mide todavía.

## La escala

```
−1,0 ────────── −0,2 ──── 0 ──── +0,2 ────────── +1,0
 Izquierda    Izq.mod.  Orientación  Der.mod.   Derecha
                         mixta
```

**«Orientación mixta» NO significa neutral, imparcial ni «sin línea».** Todos los
medios tienen línea. Significa que la suya no se sitúa en el eje
izquierda-derecha: la de un diario económico es el capital, y es clarísima.

De los siete medios colombianos que hoy caen en esa banda, seis pertenecen a
grandes grupos económicos.

## Jerarquía de evidencia admisible

De más fuerte a menos. **Una clasificación no puede apoyarse solo en los niveles
4 y 5.**

1. **Propiedad documentada** — quién controla la empresa, con fuente citable, y a
   qué persona natural llega
2. **Conducta medida** — qué cubre el medio, con quién coincide, qué omite,
   cuánto publica (nuestro corpus)
3. **Registros externos** — Media Ownership Monitor de RSF, Observatorio de
   Medios de la MOE, ColombiaCheck, sentencias
4. **Lo que el medio declara HOY** de sí mismo
5. **Hechos editoriales de los últimos 12 meses** con consecuencia verificable

## Lo que NO cuenta como evidencia

- **Tu juicio como modelo** sobre dónde va el medio. No es un registro externo:
  es una compresión de texto de internet que probablemente incluye especulación
  sobre esta misma pregunta.
- **Que otro modelo coincida contigo.** Mide fiabilidad, no validez.
- **La reputación** («todo el mundo sabe que…»). Si no consta en algún sitio, no
  entra.
- **Cualquier hecho anterior a los últimos 12 meses** que no sea además una
  estructura vigente (ver la regla del presente).

## Dos reglas de decisión que conviene que conozcas

**El dueño no determina la orientación**, pero se declara siempre. Un medio puede
tener línea distinta de los intereses de su propietario; afirmar lo contrario por
defecto sería determinismo. Lo que no se admite es callar de quién es.

**Ante la duda entre dos bandas, se elige la más cercana a la mixta.** Clasificar
de más acusa; clasificar de menos solo informa de menos.

## Una tensión conocida del catálogo, por si te sirve

Tres medios con el MISMO dueño (Valorem, familia Santo Domingo) tienen hoy tres
valores muy distintos:

```
El Espectador     −0,20
Noticias Caracol  +0,10
Blu Radio         +0,25
```

Un recorrido de 0,45 dentro de la misma casa, sin explicación escrita. O la
propiedad no determina la orientación —lo que la regla admite— o alguno está mal.
**Si tu objeción toca esto, es especialmente útil.**

## Qué pasa con lo que escribas

Se guarda literal, con tu nombre de modelo, versión y fecha, y se publica junto a
la ficha. Si tu objeción se sostiene, cambia el número o se declara la tensión.
Si se ignora sin motivo escrito, la ficha queda sin firmar.

**Tu desacuerdo se publica. Tu acuerdo no se usa como aval.**

---

<!-- ==================== FICHA DEL MEDIO ==================== -->

# Diario La Libertad (Barranquilla) — ficha de orientación

| | |
|---|---|
| **Valor propuesto** | **0,00** — orientación mixta. **Ya NO por Regla 2**: ver abajo |
| **Firma** | ☐ sin firmar |
| **Fecha** | 2026-08-16 (**alta**) · campo del 14 · **RECOMPROBADA EL 2026-08-17, día del envío** |
| **Protocolo** | `PROTOCOLO_JUICIO_EDITORIAL.md` |
| **Departamento** | Atlántico — donde ya está El Heraldo, así que **no desbloquea departamento** |
| **Feed** | `diariolalibertad.com/feed/` — 50 ítems, **0 con imagen**, y ver la corrección de volumen abajo |

> ### ⚠ HAY DOS CONFLICTOS DE INTERÉS, Y NO SON EL MISMO
>
> **1. El anunciado, que sigue sin acreditarse.** En enero de 2025 se anunció que
> **Samuel Tcherassi** —candidato anunciado a la Alcaldía de Barranquilla 2027 y
> antiguo contratista de esa alcaldía— pasaba a ser el socio controlante. **La
> comprobación del 17 de agosto no lo confirma, y encuentra tres indicios en
> contra.**
>
> **2. El documentado, que la ficha del 16 no tenía.** **La directora del
> periódico anunció en su propio periódico que va a ser candidata**: «*No lo pongas
> en duda, voy para la contienda electoral*», Luz Marina Esper, 12-10-2025, en
> `diariolalibertad.com`. Y el 30-11-2025 el diario promocionó a **Daniela Esper
> Socarrás**, nieta del fundador, como aspirante a la Cámara. **Este conflicto sí
> consta, con fecha, con cita textual y en fuente del propio medio.**

---

## COMPROBACIÓN DEL DÍA DEL ENVÍO — 2026-08-17

Se hace por la regla que dejó EL DIARIO de Boyacá: **una ficha de agosto puede
caducar en tres días**. Esta caducó en tres días. Lo que sigue es lo que cambia.

### 1. La pieza que devolvía 403 se pudo leer, y es propaganda

El 14 de agosto `diariolalibertad.com/…/samuel-tcherassi-un-nuevo-liderazgo-se-asoma-en-barranquilla/`
devolvía **403** y la ficha se limitó, correctamente, a anotar que existía. **Hoy
devuelve 200 con un User-Agent limpio.** No hubo bloqueo: es el mismo patrón de
prensaescrita —ver la regla de que un 403 no siempre es un bloqueo—.

Leída, la pieza **no es una noticia**. No tiene firma personal, no cita a ninguna
fuente distinta del propio Tcherassi y no contiene contradictorio. Es un perfil de
promoción política publicado por el periódico que él había anunciado comprar cuatro
meses antes:

> «*Empresario, crítico del modelo actual y con una visión alternativa para la
> ciudad, Samuel Tcherassi emerge como una figura con potencial para liderar una
> nueva etapa…*» · «*una posible y anhelada alternativa para dirigir los destinos
> de la ciudad*» · «*desde el corazón de una familia de buenos principios*»
>
> — `diariolalibertad.com`, 10-05-2025

**Esto ya no es «no sabemos qué publicó»: es conducta observable, nivel 2**, y hay
que ponerla delante del revisor.

### 2. Pero esa conducta tiene fecha de inicio y fecha de final

Contados los titulares del propio buscador del sitio:

| | Titulares que nombran a **Tcherassi** | Titulares que nombran a **Char** |
|---|---|---|
| dic-2024 → may-2025 | **12** (todos políticos, casi todos contra Char) | 27 |
| jun-2025 → ago-2026 | **0 políticos** (2 de pleitos de marca en nov-2025; el resto es su hermana, la diseñadora) | **~50, sostenidos, y de tono institucional** |

La ventana pro-Tcherassi **empieza el 19-12-2024** —«*Si no puede, lo más digno es
dar un paso al costado*: Tcherassi propone renuncia de Char»—, un mes antes del
anuncio de la operación, y **termina el 10-05-2025** con la pieza de arriba.
Después, nada.

**Y lo que vino después va en dirección contraria.** El 21-04-2026 el diario
publica un **editorial —la voz de la casa, no un teletipo— titulado «[EDITORIAL]
Solidaridad con el alcalde Alejandro Char»**. En 2026 también publica «Alejandro
Char arrasa en aprobación y se consolida como el alcalde mejor calificado» (25-01)
y «Char, con el primer lugar en imagen» (19-03).

**Es exactamente la hipótesis falsable que proponía la ficha del 16 —comparar cómo
cubre a la Alcaldía—, ejecutada a medias y con resultado contrario al esperado.**
El periódico no se convirtió en plataforma anti-Char. Fue plataforma de Tcherassi
durante cinco meses y volvió a la cobertura institucional del alcalde.

### 3. Tres indicios de que la operación NO se cerró

Ninguno es un certificado. Los tres son del presente y son citables.

| Indicio | Fuente | Fecha |
|---|---|---|
| **El propio diario dice que es de los Esper**: «*ha laborado en el periodismo en el diario La Libertad, **propiedad de su familia***» —hablando de Daniela Esper Socarrás— | `diariolalibertad.com/2025/11/30/daniela-esper-socarras-a-la-politica/` | **30-11-2025**, diez meses después del anuncio |
| **Luz Marina Esper sigue dirigiéndolo**: «*directora de Diario La Libertad y de la Cadena Radial La Libertad*» | `diariolalibertad.com/2026/07/29/reconocimiento-luz-marina-esper-recibe-el-galardon…/` | **29-07-2026** |
| **Y sigue al frente de la antena**: «En directo Luz Marina Esper cubriendo elecciones a través de Radio Libertad» | `diariolalibertad.com/2026/05/31/en-directo-luz-marina-esper-cubriendo-elecciones…/` | **31-05-2026**, elecciones presidenciales |

Esto **resuelve el punto 3 de «lo que queda abierto»** de la ficha del 16 —si Esper
seguía siendo directora en 2026— **con un sí documentado**, y es coherente con la
versión de Valora Analitik —memorando de entendimiento, Esper continúa al frente—
frente a la de La Silla Vacía —compra confirmada—.

**No prueba quién es el dueño registral.** Prueba que **quien lo dirige hoy es la
misma de siempre** y que **la casa se sigue describiendo como propiedad de la
familia Esper**. `ownerType` sigue en `null`; lo que cambia es que la ausencia ya
no es un vacío, es una ausencia con contenido.

### 4. EL HALLAZGO NUEVO: la familia que dirige el periódico está entrando en política

Y lo publica el periódico.

**Luz Marina Esper, directora — 12-10-2025**, pieza titulada «Luz Marina Esper
estaría en la contienda electoral»:

> «*La directora de los medios de comunicación La Libertad, Luz Marina Esper,
> estaría en la próxima contienda electoral… "**No lo pongas en duda, voy para la
> contienda electoral**", concluyó Luz Marina Esper ante el interrogante. Son
> varios los grupos que desde ya quieren hablar con Luz Marina Esper. ¿A quién
> escuchará la directora de La Libertad? Estaremos informando…*»
>
> Firmada «Por David Awad V.», publicada por la cuenta «Redacción1 La Libertad».

**Daniela Esper Socarrás, nieta del fundador — 30-11-2025**, en una pieza sin
contradictorio que la presenta como «hija de la Casa Periodística del diario La
Libertad»:

> «*le han propuesto para que sea candidata a la Cámara por varias colectividades
> o partidos, que la han contactado y quieren incluirla en las listas*»

**Comparado con el conflicto de Tcherassi, este es de mejor calidad probatoria y
peor pinta.** El de Tcherassi es *anunciado, no acreditado, y su rastro editorial
se cerró en mayo de 2025*. El de los Esper es **la persona que efectivamente
dirige el medio hoy, declarándolo en primera persona, en el medio que dirige, y sin
declarar el conflicto en ningún sitio del propio periódico.**

Existe además una ficha de **«Luz Marina Esper Fayad | Candidato a la Cámara» en
Congreso Visible** (Uniandes), que **hoy devuelve 500** y no se ha podido fechar.
Queda como pendiente y **no se usa**: sin saber a qué elección corresponde, podría
ser historia y no presente.

**Lo que NO se ha podido establecer:** si llegó a inscribirse para las
legislativas de marzo de 2026. No hay pieza en su propio sitio que lo diga, y el
31-05-2026 cubría las presidenciales como periodista.

### 5. Tres correcciones a la ficha del 16

**a) «Ni una persona nombrada en todo el sitio» era demasiado fuerte.** Es cierto
para las **páginas institucionales** —no hay mancheta, ni equipo, ni sociedad
editora—, y las firmas de portada siguen siendo cuentas numeradas. Pero el sitio
**sí nombra personas**: el feed de hoy trae 18 de 50 piezas firmadas por **«cesar
Botero»** (las otras 32, «Redacción2 La Libertad»); las piezas de arriba llevan
«Por David Awad V.» y «Por Roberto Tico Rosania»; y el medio nombra a su directora
una y otra vez. Lo que falta es **mancheta, no nombres**. Corregido.

**b) El volumen estaba mal por un factor de dos y medio.** El feed trae 50 ítems,
sí, pero **cubren 9,8 horas** —del 16-08 a las 14:33 UTC al 17-08 a las 00:23 UTC—.
Son **~122 piezas al día**, no «unos 50». Consecuencia operativa: **el feed pierde
contenido si no se consulta al menos dos veces al día.**

**c) Publica en las dos zonas del país que dice cubrir, y una tercera.** Categorías
del feed de hoy: Generales 47, Crónica Judicial 19, Nacional 18, Destacada 17,
Magdalena 6, Política 4. Hay Cesar además de Atlántico y Magdalena.

### 6. Lo que NO cambió, comprobado hoy

- `/nosotros` **sigue siendo** el artículo de 2020 sobre Marlon Piedrahita; `/equipo`
  el de 2023 sobre el operativo anticontrabando; `/contacto` es real y no publica
  datos de contacto. **La trampa de las rutas sigue en pie.**
- El pie sigue diciendo **«COPYRIGHT 2022 DIARIO LA LIBERTAD»**.
- **La API REST de WordPress está cerrada** (`401 rest_not_logged_in`), así que no
  hay vía por ahí para la lista de autores reales.
- El feed responde, está al día y **ninguna pieza trae imagen** — dependerá del
  enriquecedor por `og:image`.

---

## EVIDENCIA ADMISIBLE

### Nivel 1 — Quién lo edita, hoy

| Dato | Valor | Fuente |
|---|---|---|
| Sociedad editora | **no declarada en ninguna página accesible** | consultado 2026-08-17 |
| **NIT** | **no publicado** | — |
| **Socios** | **no publicados** | — |
| Sociedad histórica | **DIARIO LA LIBERTAD LIMITADA, «EN LIQUIDACIÓN»** | directorios de empresas |
| Único rastro institucional | «COPYRIGHT 2022 DIARIO LA LIBERTAD» | pie de la portada |
| **Directora, HOY** | **Luz Marina Esper Fayad** — «directora de Diario La Libertad y de la Cadena Radial La Libertad» | el propio medio, **29-07-2026** |
| **Cómo se describe la propiedad, HOY** | «*el diario La Libertad, **propiedad de su familia***» (los Esper) | el propio medio, **30-11-2025** |
| Firma de sus piezas | «Redacción1/2/3/4 La Libertad» y algunas firmas personales («cesar Botero», «David Awad V.») | feed y artículos, 16 y 17-08-2026 |

### Nivel 2 — Conducta observable

| Hecho | Fecha |
|---|---|
| Perfil de promoción política de Samuel Tcherassi, sin firma ni contradictorio | 10-05-2025 |
| Doce titulares políticos con Tcherassi entre dic-2024 y may-2025; **cero después** | dic-2024 → may-2025 |
| **Editorial de solidaridad con el alcalde Álex Char** | **21-04-2026** |
| «Char arrasa en aprobación»; «Char, primer lugar en imagen» | 25-01-2026 / 19-03-2026 |
| La directora anuncia su candidatura **en su propio medio** | **12-10-2025** |
| El medio promociona a una Esper como aspirante a la Cámara | 30-11-2025 |
| La directora conduce entrevista al exsenador Jorge Enrique Robledo (izquierda) | 29-10-2025 |

### Nivel 3-5 — Prensa y registros externos

| Dato | Valor | Fuente |
|---|---|---|
| Fundación | **7 de abril de 1979**, por **Roberto Esper Rebaje** | el propio medio, 07-04-2026 |
| Antecedente | Pelea de herederos por el control del diario (2017) | El Heraldo |
| **Operación de 2025** | **Samuel Tcherassi como socio controlante**, junto con las dos emisoras La Libertad y la marca de **El Espacio** (Bogotá) | La Silla Vacía / Valora Analitik |
| Ficha de candidata | **«Luz Marina Esper Fayad, Candidato a la Cámara»** en Congreso Visible — **URL devuelve 500, sin fechar** | congresovisible.uniandes.edu.co |

**Un detalle sobre lo que el medio declara de sí mismo:** el 01-05-2025 publicó
«Estamos celebrando 50 años de periodismo» y el 07-04-2026 «**47 años** de
periodismo valiente». 1979 + 47 = 2026. **La cifra correcta es la segunda**, lo que
significa que su propia efeméride institucional es poco fiable como fuente.

### Por qué se declara y NO se asigna la propiedad

**Las fuentes no coinciden en si la operación se cerró.** La Silla Vacía lo da como
socio controlante, con la compra confirmada por la propia Luz Marina Esper. Valora
Analitik precisa que lo firmado fue un **memorando de entendimiento** y que Esper
continuaría dirigiendo el diario con su equipo. **Un memorando no es una
compraventa** — y la comprobación de hoy encuentra tres indicios del presente que
apuntan a la versión de Valora.

Con `ownerType` puesto, el catálogo afirmaría que un aspirante a alcalde es hoy
dueño de este periódico. Con la ficha en blanco, callaría un conflicto que el
lector necesita. **Se escribe lo que consta, con su fecha y su grado de certeza.**

### Lo que NO se hace

**No se le deduce orientación de la posición política de su comprador anunciado, ni
de la de su directora.** Que Tcherassi se enfrente al clan Char, o que Esper vaya a
una contienda que aún no se sabe por qué partido, **no permite colocar al periódico
en el eje**. La regla es que el dueño se declara siempre y no determina nunca.

---

## LO QUE QUEDA ABIERTO

1. **PRIORITARIO — Cámara de Comercio de Barranquilla:** qué sociedad edita hoy el
   periódico, quiénes son sus socios y si Tcherassi figura. Certificado nuevo, y
   aquí no es trámite de rutina: **decide si hay que publicar un aviso de conflicto
   de interés**.
2. Cuál es la sociedad activa, dado que la histórica consta en liquidación. Es el
   caso de El Nuevo Día.
3. ~~Si Luz Marina Esper Fayad sigue siendo directora en 2026.~~ **RESUELTO el
   2026-08-17: sí, con fuente del propio medio del 29-07-2026 y del 31-05-2026.**
4. ~~Leer la pieza del 10-05-2025.~~ **RESUELTO el 2026-08-17: leída, y es
   promoción política sin contradictorio.** Ver arriba.
5. **NUEVO — ¿en qué quedó la candidatura de la directora?** Por qué partido, a qué
   corporación, si llegó a inscribirse. La ficha de Congreso Visible existe y
   devuelve 500.
6. **NUEVO — el editorial del 21-04-2026 y la ventana Tcherassi son la misma casa.**
   Falta contar el corpus completo, no solo titulares, y compararlo con El Heraldo.
7. Si se confirma lo de Tcherassi: **`controlGroup` con El Espacio** (Bogotá) y
   aviso de conflicto de interés en la ficha pública.

> **UNA DECISIÓN QUE NO SE HA TOMADO, Y QUE NO SE TOMA AQUÍ.** La candidatura
> declarada de la directora **no se ha llevado al texto público del registro**
> (`biasRationale`), solo a esta ficha y a `mediaOwnership.js`. Publicarla obliga
> a una regla que el proyecto no tiene escrita —cuándo la política de **quien
> dirige**, y no de quien posee, es materia de aviso al lector— y esa regla la
> firma Jose, no la ficha. Lo que sí se corrigió en el registro es lo que era
> inexacto: el 0,00 ya no se justifica «por ausencia de evidencia».

---

## LO QUE SE LE PIDE AL REVISOR EXTERNO

Además de las objeciones que se le ocurran, tres preguntas que esta ficha no puede
responderse sola:

1. **El 0,00 ya no descansa en la ausencia de evidencia.** Hay conducta observable
   y apunta en dos direcciones: cinco meses de plataforma para un aspirante
   anti-Char (2024-25) y luego un editorial de solidaridad con Char (2026), más una
   entrevista de la directora a Robledo. **¿Sostiene eso una «orientación mixta», o
   es una casa que se alinea con quien manda en Barranquilla en cada momento — que
   sería una orientación, y bien nítida?**
2. **¿Cuál de los dos conflictos hay que publicarle al lector?** El de Tcherassi
   está mejor documentado en prensa y peor acreditado en los hechos. El de la
   familia Esper está peor cubierto por la prensa y mejor acreditado —cita textual
   de la directora en su propio medio—. **Publicar el segundo obliga a una regla
   que el proyecto no tiene escrita: cuándo la política de quien DIRIGE, y no de
   quien posee, es materia de aviso.**
3. **Refuta el hallazgo si puedes.** Si existe fuente posterior a mayo de 2025 que
   acredite el cierre de la compra por Tcherassi, o que muestre que Esper ya no
   dirige, **tres de las conclusiones de esta ficha se caen**. Búscala.

---

