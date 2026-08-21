# Por dónde seguir

## 2026-08-21 · Las cinco ramas ya están en producción. Lo que queda es de producto

**Todo lo que la sesión del 19 dejó sin fusionar está publicado**, en el commit
`68f0230`. Fly y Vercel en el mismo commit, sin desfase.

`npm run invariantes` pasa **7/7** contra producción. Los tres números que
estaban rotos:

| | Antes | Ahora |
|---|---|---|
| Portada con tema | 30/100 | **96/100** |
| Historias internacionales | 3 | **94** |
| Historias que pierden el tema de sus artículos | 4 219 | **0** |

Lo del ámbito era el daño callado: el catálogo entero se declaraba nacional
mientras la API respondía `internacional: 0` sirviendo piezas cuya sección
heredada era literalmente «Internacional».

### Una lección que costó un susto, y conviene no repetir

La primera lectura de los invariantes, **seis segundos** después de que el worker
arrancara, daba todavía 6/7 y 4 189 historias rotas. Parecía que el arreglo no
había servido. No era eso: **el motor rehidrata y recompone al arrancar**, y
minuto y medio después reescribió las 6 443 historias de una vez.

> **Medir un despliegue en el instante en que termina mide la máquina anterior.**
> Aquí la diferencia entre las dos lecturas era la que hay entre «arreglado» y
> «no sirvió». Antes de creerle a un invariante después de un despliegue, dejar
> pasar un ciclo.

### Lo primero de mañana: mirarlo con los ojos

**Nada de esto se ha abierto en un navegador.** Se probó con pruebas (597/597),
tipos, compilación e invariantes, que es mucho, pero **el punto ciego de este
proyecto son las costuras** —JSX↔CSS, base↔memoria, API↔cliente— y las pruebas no
cubren ninguna. Los cuatro fallos del 19 vivían justo ahí.

Tres pantallas, en este orden:

1. **`/mapa`** — los puntos que estaban invisibles, y el realce de la búsqueda.
2. **Categorías** — que ya no enseñe catorce ceros.
3. **El panel de administración** — trae `EstadoDeLaAuditoria`, componente nuevo
   que nadie ha visto funcionando. Lee de `auditoria/estado.json` y
   `auditoria/hallazgos.json`, empaquetados en el build: no depende de la API.

### Lo que queda, y es todo decisión tuya

Está en **`MINUTA.md`**, en la raíz, con el detalle y lo que costaría cada una.
Ninguna es de código:

- **`opinion` no se persiste.** Hermano del fallo de `topics` que hoy se arregló,
  y sin arreglar: la opinión reentra al agrupamiento en cada arranque. **Es el
  único de los cinco que sí es trabajo de código** — columna, INSERT, lectura y
  migración— y ya está diagnosticado.
- **Infobae se muestrea al 38 %** y nadie lo decidió. Margen contra la red de
  seguridad de 2 h: 0,09.
- **Permanencia.** Hoy una noticia dura 72 h y se borra. 30 días son gratis; un
  año, 25 USD/mes.
- **Ventana de agrupamiento a 7 días.** Cabe, está medido. Falta medir qué le
  hace a los falsos agrupamientos, y esa medida va antes que el cambio.
- **Razón Pública puede ser falso positivo** —publica por tandas—. Es el caso de
  estreno de `aceptado` con nota en el libro de hallazgos.

Y **23 hallazgos abiertos** en `auditoria/hallazgos.json`: cinco sitios que
devuelven 200 a cualquier ruta, tres fuentes que ya no resuelven, cuatro feeds
parados. El jueves corre la segunda pasada y ahí empiezan a tener antigüedad.

---

## F1-17 insistencia: medida, y el bloqueo no era el que decía el plan

Rama **`f1-17-insistencia`**. Nuevo **`npm run insistencia`**, de solo lectura.
Nada desplegado: esto es medición, no producto.

**La dependencia que bloqueaba la tarea ya no existía.** El ROADMAP la archivó el
30-07 por faltar «detección de tema a partir del titular»; eso se construyó el
03-08 y vive en `articles.topics`. El script la usa y **no toca
`articles.category`**, así que la circularidad que se temía —medir nuestra propia
configuración de feeds y presentarla como hallazgo sobre el medio— queda evitada.

### El bloqueo real es la RETENCIÓN, y no estaba anotado

La ingesta borra a las **72 h** (`RETENTION_MS`). El corpus cubre **4 días y nunca
cubrirá más**. *Una agenda no se mide en tres días.* Sobre `articles` esta tarea no
se puede cerrar por mucho que se afine el índice.

### Lo que da la medida hoy, y por qué no se publica

```
Izquierda  · Cultura              ×1,72    26 piezas   2 de 3 días
Izquierda  · Derechos y sociedad  ×1,58    14 piezas   2 de 3 días
Derecha    · Entretenimiento      ×1,64    60 piezas   3 de 4 días
Derecha    · Desastres            ×1,28   891 piezas   (el de más masa)
```

**La señal discrimina poco.** El índice más alto es ×1,72; no hay ningún «×2,0» que
titular. Las tres bandas cubren aproximadamente lo mismo en proporciones parecidas,
y los tres hallazgos están en **temas de poca masa** — justo donde el propio ROADMAP
avisaba de que el índice se dispara. Publicar «la izquierda insiste en Cultura» con
26 piezas de cuatro días sería vender ruido. Es el caso de `npm run conducta` otra
vez: se mide, y la medida dice que todavía no.

> **Un dato que cambió y conviene rehacer:** la izquierda pesa hoy el **8,0 %** del
> volumen con tema, no el 3,3 % que cita F3-16. Antes de seguir usando esa cifra en
> ningún argumento, volver a calcularla.

### Lo que lo desbloquea, y es barato

**Un agregado diario persistente**: día, banda, tema, piezas, total de la banda.
Son unas pocas filas al día, sobreviven a la poda, y con semanas de serie
«insiste» pasa de ser una foto a ser una afirmación. **Es decisión de producto**:
tabla nueva y escritura en cada ciclo de ingesta.

---

## Altas de La Nación (Neiva) y Diario La Libertad — EN PRODUCCIÓN

**Autorizadas por Jose.** Catálogo **74 → 76 medios**, verificado en `sources`.
Ninguna desbloquea departamento: añaden **segunda voz** al Huila y al Atlántico,
donde solo estaban Diario del Huila y El Heraldo.

| Medio | Feed | Imágenes |
|---|---|---|
| La Nación (Neiva) | 10 ítems, **10/10 en ventana**, mediana 16,2 h | 10 |
| Diario La Libertad | 50 ítems, **15/15 en ventana**, mediana 2,7 h | **0** — dependerá del enriquecedor por `og:image`, como El Tiempo y Cambio |

### ⚠ LO QUE APARECIÓ AL INVESTIGAR LA PROPIEDAD, Y NO ESTABA EN LAS FICHAS DEL 14

**Los dos diarios cambiaron de manos hace poco, y uno de los casos es serio.**

**DIARIO LA LIBERTAD — el dueño anunciado aspira a la alcaldía que el periódico
cubre.** En enero de 2025 se anunció que **Samuel Tcherassi** pasaba a ser socio
controlante, junto con las dos emisoras La Libertad y la marca de **El Espacio**
(Bogotá). **Tcherassi es candidato anunciado a la Alcaldía de Barranquilla para
2027** y fue contratista de esa misma alcaldía —el Malecón del Río, bajo Álex Char,
de quien hoy es crítico público—. Es el conflicto de interés más directo del
catálogo **si se confirma**.

**Y no consta que se confirmara.** Las fuentes divergen justo ahí: La Silla Vacía lo
da como socio controlante confirmado por la propia directora; **Valora Analitik
precisa que lo firmado fue un MEMORANDO DE ENTENDIMIENTO** y que Luz Marina Esper
seguía dirigiendo. Un memorando no es una compraventa, y **no hay una sola pieza
posterior a mayo de 2025**. Su sociedad histórica, además, consta **en liquidación**:
es El Nuevo Día otra vez.

Por eso se declara y no se asigna. Con `ownerType` puesto, el catálogo afirmaría que
un aspirante a alcalde es hoy dueño del periódico; con la ficha en blanco, callaría
un conflicto que el lector necesita para pesar lo que lee sobre Barranquilla.

> **Es la ficha que antes hay que cerrar de todo el catálogo**, y el certificado de
> la Cámara de Comercio de Barranquilla no es aquí un trámite de rutina: decide si
> hay que publicar un aviso de conflicto de interés.

**LA NACIÓN (Neiva).** Felipe Olave Blackburn la adquirió en **2024** y después
compró las emisoras **Huila Stéreo**. Casi toda la evidencia es del propio diario,
que además publica con regularidad piezas sobre él — nivel 4, y el protocolo prohíbe
sostener una ficha solo en eso. Si se confirma, hay `controlGroup` que marcar y
concentración regional que declarar; hoy no, por lo mismo que no se marcó «galvis»
en El Nuevo Día.

**A ninguna se le puso el +0,20 de los diarios regionales.** Serían el octavo y el
noveno caso de la analogía que el catálogo tiene señalada como circular desde el 12
de agosto y sin resolver. Las dos entran en **0,00 por Regla 2**, con cero corpus. Y
para La Libertad queda **una hipótesis falsable a mano**: comparar cómo cubre a la
Alcaldía frente a El Heraldo, mismo mercado y ya en el catálogo.

### El hueco que destapó el alta, y por qué NO se tocó el léxico

**La Nación entró con 80 % sin tema** (8 de 10 en su primera pasada), frente al 19 %
de Cablenoticias. No es página social: son **sucesos locales del Huila** —«Menor fue
hallado sin vida en Isnos», «Asesinado adulto mayor en La Argentina», «Sorprendido
con un arma de fuego y dosis de base de coca»—.

**La causa es estructural y vale para toda la prensa regional:** `seccionDeLaUrl`
devuelve `null` en los diez, porque publica en la raíz del dominio
(`lanacion.com.co/<slug>`). **Se queda sin los 2,5 puntos de sección que sostienen a
Infobae**, así que depende enteramente del léxico — y el léxico está escrito sobre
titulares nacionales.

**Medido, y no se metió nada:**

```
asesinad[oa]s?        +7    ya cae en Justicia 10 · Conflicto 7 · Derechos 1
hallad[oa] sin vida   +3    ya cae en Desastres 10 · Justicia 2
hurto                 +3    ya cae en Conflicto 3 · Justicia 1 · Economía 1
arma de fuego         +2    Justicia 1
```

**`asesinado` es `heridos` otra vez**: se reparte casi por mitades entre Justicia y
Conflicto —un homicidio común y un soldado muerto en combate no son lo mismo—, y
como fuerte en cualquiera de los dos archivaría mal la otra mitad. Los cuatro juntos
suman ~15 artículos. **El 80 % es de una muestra de diez en la primera pasada: hay
que volver a medirlo con corpus, no arreglarlo a ojo hoy.**

> Nota sobre la cifra global: `sin tema` pasó de 29 % a 32 %, y **no es culpa de las
> altas** —ninguna de las tres aparece en el top 15—. El corpus bajó de 9 158 a
> 7 139 al rotar la ventana: salió el eclipse, que entraba clasificado por sección,
> y quedó proporcionalmente más Infobae.

---

## Alta de Cablenoticias — EN PRODUCCIÓN

**Autorizada por Jose.** Catálogo **73 → 74 medios**. Investigación de campo del
14-08; alta desplegada el 16-08 con el orden de siempre: `main` (Vercel) →
`npm run deploy` (Fly) → recategorizar. **Comprobado en base: 31 artículos suyos
ingeridos**, presente en `sources`, que ya va por 74.

Feed: **50 ítems, 15 de 15 en ventana, 15 con imagen, mediana 7,9 h.** Es de los
mejores del catálogo.

**Lo que desbloqueó el alta** —anotado desde el barrido del 12 como «decisión de
producto»— era si duplicaba a Noticias Uno, que emite en este canal y aporta cero.
**No lo duplica**: agenda propia y firmas de casa con correo corporativo. Alquilar
espacio de emisión no comparte redacción. Y **no arregla lo de Noticias Uno**, que
publica en ráfagas de fin de semana: eran dos problemas juntados en una frase.

### Entra con `ownerType: null`, y no porque no se sepa nada

Es el caso **contrario** al de los regionales. Ahí no aparece ni un nombre; aquí hay
estructura societaria completa —**CABLE NOTICIAS TV S.A.S.**, al 100 % entre
**Alberto Federico Ravell** y **Tobías Carrero Nácar**, junta con el hijo de uno y
el yerno del otro, **sociedad última registrada en PANAMÁ**— y **la fuente que la
trae declara su última actualización el 14-03-2018**. La compra es de 2011.

**Ninguna fuente acredita quién lo controla hoy.** Es la regla del presente por
cuarta vez —tras Semana, EL DIARIO y El Nuevo Día— y la segunda que sirve para *no*
afirmar algo. Con un `ownerType` asignado, la interfaz le diría al lector que hoy lo
controlan dos venezolanos, y eso no consta: consta que lo controlaban.

**Y ningún `ownerType` le servía.** `internacional` significa sede fuera de Colombia
con agenda extranjera, y este canal tiene redacción en Bogotá, firmas colombianas y
agenda colombiana: **los extranjeros son los dueños, no el medio**. Etiquetarlo así
lo habría echado al saco del cable extranjero, que es justo lo que este producto
trabaja para no confundir. Tampoco se le deduce orientación de la biografía política
venezolana de sus dueños: sería la traslación sin justificar que el catálogo tiene
pendiente con los trece internacionales, y encima sobre datos de hace ocho años.

### Dos trampas en la URL, y las dos callan cuando fallan

1. **Es `/rss`, no `/feed/`** — que responde 200 con **cero ítems**, sirviendo el
   bundle de la SPA.
2. **Es `cablenoticias.com`, no `.tv`.** Los artículos y las 50 imágenes viven en el
   `.com`. **Lo di de alta con `.tv` y lo cazó `check:feeds`**: «los enlaces apuntan
   a cablenoticias.com». Con el dominio cruzado habrían fallado a la vez la
   resolución del medio y la CSP de imágenes.

**Queda abierto:** el certificado de la Cámara de Comercio de Bogotá —**undécimo
pendiente**, y aquí el *único* documento que cierra la ficha, porque la vía
societaria termina en Panamá— y la ficha del canal ante el MinTIC, que en televisión
por suscripción sí tiene titular público.

---

## Lo operativo del 14, por la noche: Sucre cerrado, W Radio sin vía, tres fichas

Rama **`operativo-14-agosto`**. **Ningún alta**: las tres candidatas quedan con
ficha escrita y comprobada de campo, que es lo que las bloqueaba.

### Sucre se cierra, y la vía que esta nota proponía NO sirve

Las cuatro vías, agotadas y comprobadas el 14 por la noche:

| Vía | Resultado |
|---|---|
| `korraleja.co` | `/feed/` **404 real** siguiendo la redirección a `www` |
| `sucrenoticias.com` | Feed sano con 10 ítems, pero **el medio sigue dormido**: última pieza del **26-07**, hace 19 días. El diagnóstico del 14 por la mañana se sostiene entero |
| `elmeridiano.co` | 308 → **404**. Sigue sin declarar feed |
| **`mapeomedios.com`** | **No sirve como fuente, y esto es lo nuevo** |

**`mapeomedios.com` sí enlaza medios —en `/mapa`, no en la portada—**, así que la
nota anterior se equivocaba al decir que «no los enlaza desde su HTML»: se miró el
sitio equivocado. Lista **25 dominios de Sucre**. Pero los dominios **no están
verificados**, y de los 16 no-radiales que probé:

- **12 no resuelven** (`ovejasdigital`, `sampuesnoticias`, `majagualhoy`,
  `lospalmitoshoy`… nombres construidos a partir del municipio).
- **`buenavistanoticias.com` es una radio de San Luis Potosí, MÉXICO** —
  «BuenaVista Radio XHSCBY»—, con titulares sobre la FENAPO, Matehuala y el
  gobernador Gallardo. Buenavista también es municipio mexicano. **Casi lo doy por
  voz de Sucre**: tiene feed y publicó ayer.
- **`sucredigital.com` devuelve 43 815 bytes exactos para cualquier ruta**,
  incluida una inventada, y sus fechas son de 2021-2022 (algunas ni válidas:
  «2022-10-32»). Landing muerta.
- `toludigital.com` y `costatv.com`: feed sin ítems.

**Sucre solo se abre escribiendo a alguien** —Korraleja, que solo tiene que
reactivar una casilla de WordPress, o El Meridiano—. No hay vía técnica.

### W Radio: no hay salida técnica, y Google News no es la muleta que parecía

**Ni por Arc ni por Google News.** Su RSS de Arc responde 200 con `lastBuildDate`
de hoy y **cero `<item>`**; probadas `/category/actualidad/` y `news-sitemap`,
las tres vacías. Por la ruta idéntica, **Caracol Radio funciona**.

**Y Google News tampoco:** devuelve 100 ítems de los que **41 son de 2025, 14 de
2021, 7 de 2019 y uno de 2012**. Solo 16 de 2026. Es archivo ordenado por
relevancia, no un feed.

> **EL HALLAZGO, Y REFINA LA REGLA QUE TENÍAMOS.** No es que Google News esté
> roto: **La FM va por esa vía y está sana** —100 ítems, todos de 2026, 12 de 15 en
> ventana—. La diferencia es el volumen del medio: con uno que publica mucho, las
> 100 piezas «más relevantes» son todas recientes; con uno que publica poco, Google
> rellena con archivo. **La muleta de Google News solo funciona para los medios que
> menos la necesitan.** Antes de ponérsela a alguien, mirar el reparto por años.

Queda escribirle. **No se mutea**: sigue en el catálogo aportando cero.

### Tres fichas nuevas, y las tres con el feed comprobado hoy

| Candidato | Feed | Propiedad |
|---|---|---|
| `fichas/la-nacion-neiva.md` | 10 ítems, 23:06 de hoy | **COMUNICACIONES OLAVE S.A.S.**, con tres cargos nombrados |
| `fichas/diario-la-libertad.md` | **50 ítems**, 02:18 UTC | Nada. Ni una persona en todo el sitio |
| `fichas/cablenoticias.md` | 50 ítems, 23:29 de hoy (por `/rss`, **no** `/feed/`) | Nada por HTTP: es una SPA |

**La Nación (Neiva) es la única que declara editora**, y aun así no cierra: el
apellido Olave está en la sociedad y en el presidente del consejo editorial, y eso
**no es el accionariado**. Es el caso de Vive el Meta otra vez. Y **no se le pone
+0,20 por analogía con los otros diarios regionales**: eso sería el octavo caso del
razonamiento circular que el catálogo tiene anotado desde el 12 y sin resolver.

**Cablenoticias: la decisión de producto queda resuelta a falta de tu visto bueno.**
No duplica a Noticias Uno — tiene agenda propia y firmas con correo corporativo
(`jeyson.calderon@`, `miguel.rodriguez@`). Que Noticias Uno emita en ese canal no
hace que los artículos sean los mismos. Lo que **no** arregla es que Noticias Uno
siga aportando cero: eran dos problemas juntados en una frase.

### Una trampa nueva, que afina la de Quindío Noticias

En Diario La Libertad, `/nosotros`, `/equipo` y `/contacto` dan 200 con **tres
tamaños distintos** —127 kB, 153 kB, 75 kB—, y los di por páginas institucionales
reales. No lo son: `/nosotros` es un artículo de **2020 sobre un jugador del
Junior** («*Nosotros* como cualquier trabajador colombiano…») y `/equipo` uno de
**2023 sobre el equipo anticontrabando** del Magdalena. El slug coincide con una
palabra del titular.

**Quindío Noticias se detectó comparando tamaños. Aquí los tamaños son distintos y
tampoco son las páginas que se piden.** La regla corregida: *tamaños distintos
prueban que no es la misma página, no que sea la que pediste.* Hay que leer el
contenido.

---

## Ciencia: el léxico entró, el tema no, y el eclipse era un suceso

**En producción** (`d70aefb`, Vercel + Fly + recategorizado). 503 pruebas, lint y
typecheck limpios. Rama `tema-ciencia`, fusionada.

**El número que motivaba la tarea no se sostuvo.** Esta nota decía que `eclipse`
rinde 102 artículos y que faltaba un tema de Ciencia. La cuenta era cierta; el
argumento, no. Trazados los **142 artículos** con eclipse en el titular, los que
se quedan sin tema **no son de ciencia**: una mujer que se ahoga en un embalse
tras verlo, las gafas que acaban en vertederos, Björk y los skaters, el tráfico
de vuelta que preocupa a la DGT, partidos aplazados. **El eclipse es un suceso,
como el terremoto.**

**La ciencia real son ~12 artículos en 9 158**, y su destino ya estaba decidido
en el código: los dos mapas de sección archivan `ciencia → tecnologia` desde que
existen. Faltaba léxico, y se notaba —la ciencia solo entraba si el medio había
etiquetado la sección, y entraba rescatada con 2,5—. **Decisión de Jose: no se
crea el tema.** Ver `DECISIONES.md` del 2026-08-14.

Entran de fuertes `astronomia`, `astronauta`, `telescopio`, `observatorio
astronomico`, `asteroide`, `meteorito`, `agujero negro`, `via lactea`, `galaxia`
y las cuatro formas de `espacial`. Descartados con prueba: **`cometa`** (0
aciertos, 7 falsos: agosto es temporada de volar cometas, y hay un ciclista
apodado El Cometa), **`marte`** sin frontera (se come «mar-**tes**») y `eclipse`.

`sin tema 29,1 % → 29,0 %`. Minúsculo, y eso *es* el resultado.

### Lo que hay que leer de aquí, porque vale para TODO el léxico

**Un término débil suelto SÍ decide, y la doc de este fichero decía lo
contrario.** Describía los débiles como «suman, no deciden». Falta media frase:
un débil en titular vale **1,5** y `UMBRAL_RESCATE` es **1,5**, así que un débil
sin competidor se rescata y decide solo.

Costó dos términos. `nasa` y `ciencia` entraron primero como débiles fiándome de
esa frase, y con ellos dentro «Comunidad Nasa bloquea la vía Panamericana» se
clasificaba como Tecnología —**NASA es también el pueblo indígena Nasa del
Cauca**— y «según la ciencia, las vacaciones mejor largas» también. Fuera los
dos; la frase, corregida donde induce el error.

**Y mi prueba del pueblo Nasa pasaba por el motivo equivocado**, igual que la de
`escombros` la sesión anterior: la comprobaba con un titular que llevaba
«disidencias» y «hostigamiento», así que ganaba Conflicto con 6 y el término
nunca se examinaba. **Un término se prueba con un titular SIN competidor**, o la
prueba no prueba nada.

### Un falso positivo que se dejó a propósito

«Así capturó un satélite el eclipse solar» cae en **Justicia**, porque
`captur[aoó]` acierta 23 de 38 y los 4 que ganaría son capturas policiales
reales. Complicar un término que funciona por 1 caso en 9 158 sale más caro que
el caso. Anotado, no arreglado.

### Estado de los feeds, y un diagnóstico falso que casi se escribe

**67 de 71 feeds.** Cuatro son medios lentos que el propio script da por no-fallo
—CasaMacondo, Noticias Uno, Telecafé y La Patria, todos «responden pero nada
entra en la ventana»—.

**Seguimiento.co dio 0 ítems en la primera pasada y está perfectamente.** A la
segunda: 10 de 10 en ventana, mediana 6 h. El 0 era el **arranque en frío** del
sitio, que tardó 4 s; en repeticiones responde en 0,13 s. Habría sido el quinto
diagnóstico falso de la semana. **Un feed a cero se repite antes de anotarlo.**

**W Radio sí está mudo, y es fallo suyo.** Su RSS de Arc responde 200 con
`lastBuildDate` de hoy y **cero `<item>`** — 754 bytes de canal vacío. Probadas
las variantes de Arc (`/category/actualidad/`, `news-sitemap`) y las rutas
clásicas: las tres de Arc vacías, las otras 404. **Caracol Radio usa la ruta
idéntica y funciona**, así que es la configuración de W Radio, no la nuestra.
Pendiente de decidir: se le escribe, o se le pone Google News como a La FM
—sabiendo que rinde 8 veces menos—. **No se mutea.**

---

## El clasificador: 30 % → 28 % sin tema, y medir mató la solución obvia

**En producción** (`4d2c201`, Vercel + Fly + recategorizado, 71 de 71 feeds OK).

Dos herramientas nuevas de **solo lectura**, que son lo que queda para la próxima
vez: **`npm run diag:sintema`** y **`npm run medir:termino -- "patron"`**.

**LO PRIMERO QUE DIJO LA MEDIDA: NO HAY QUE BAJAR EL UMBRAL.** Artículos que se
quedan entre 1 y 1,5 —rozando el rescate— son **cero**. Ni uno. La solución obvia
no habría ganado un solo artículo. El **66 % puntúa cero absoluto**: falta
vocabulario, no calibración.

**Infobae era el 38 % de todo el «sin tema», y no por léxico.** Archiva como
`/{país}/{sección}/{fecha}/{slug}` y `seccionDeLaUrl` devolvía el **primer**
segmento, o sea el país: 1 460 de sus 2 041 artículos tenían por «sección» un país.
Ahora se prefiere el primer segmento **que mapea a un tema** — sin listas de países
y sin caso especial. Deportes de Infobae pasa de 53 a 161.

**Dos términos, medidos antes de meterlos:** `incendio` (+85; solo estaba «incendio
forestal» y el urbano es la misma categoría por IPTC) y `escombros`, que exige
preposición — ver abajo.

### El fallo que conviene leer, porque lo tapaba mi propia prueba

`escombros` suelto rendía 70 y coincidía con Desastres en 99 de 123, así que entró
como débil. Al **trazar qué hacía** apareció que rescataba como desastre «CAR
impuso medidas preventivas por mala disposición de escombros», que es residuo de
obra.

**La prueba que lo cubría pasaba por el motivo equivocado:** se comprobaba con
«Metro de Bogotá: la enorme cantidad de escombros…», y pasaba **no porque el
término se portara bien, sino porque Infraestructura puntuaba 4,5 y ganaba**. Sin
competidor fuerte, el falso positivo salía igual.

Con la preposición —`bajo`, `entre`, `rescatado de`— deja de ser ambiguo y pasa a
fuerte. **Se pierde alcance a propósito.** Una etiqueta falsa afirma algo; una
ausente solo calla.

### Resultado y lo que queda

```
sin tema     30,4 %  →  28,4 %
rescatados   14,6 %  →  14,2 %     (se clasifica más y se fuerza menos)
Desastres NO se infló: 36 %. Deportes 5 % → 6 %, que es Infobae.
```

**Lo que la medida deja pendiente y NO se tocó:** `eclipse` rinde **102 artículos**
y **no hay tema de Ciencia**. Añadir un tema toca tres sitios —`TEMAS`,
`categories.js` y `CategoryMark.jsx`— y es **decisión de taxonomía, no de léxico**.
Otros medidos y descartados: `heridos` (+40, pero ya se reparte entre Desastres 45,
Conflicto 30 y Justicia 21 — meterlo en Desastres archivaría la guerra como
accidente), `pico y placa` (+19) y `sorteo|lotería` (+9, contenido de servicio).

---

## Lo del 14 de agosto, por la tarde

### Arauca entra, y Sucre queda cerrado con diagnóstico

Rama **`alta-arauca`**. **28 departamentos con voz propia.** Catálogo **73 medios**.
En blanco quedan cuatro: Amazonas, Guainía, Vaupés y Sucre.

**Al Aire Noticias (Arauca)** entra en 0,00 con `ownerType: null`. Su ficha del 9 de
agosto lo dejaba fuera por la regla vieja, y **volvía a estar caducada en cinco
días**: decía que no tenía página de equipo ni de «quiénes somos», y tiene las dos,
con cuatro personas y un modelo de financiación declarado —donaciones de lectores
por Nequi y Daviplata—.

**Es la cuarta ficha que caduca en menos de una semana**, tras EL DIARIO, Vive el
Meta y El Nuevo Día. El patrón ya no admite otra lectura: **una ficha de propiedad
de prensa digital regional caduca en días, no en meses.**

Se anota en la ficha que Arauca es departamento de frontera con presencia armada, y
que un medio sostenido por donaciones tiene un perfil de presión distinto del que
vive de la pauta de la gobernación. **Se declara, no se premia con el número.**

### Sucre no es un hueco de prensa, es un hueco de RSS

Y esa distinción cambia lo que se puede decir en la vista departamental. **Amazonas,
Guainía y Vaupés están en blanco porque allí la comunicación es radio.** Sucre está
en blanco **teniendo al menos cinco medios web**, y ninguno sindica:

- `korraleja.co` — WordPress **con el RSS desactivado** (404 real) y API en 403
- `sucrenoticias.com` — tiene RSS y **el medio está dormido** desde el 26-07; su
  API de WordPress lo confirma, así que no es un feed rancio sobre un sitio vivo
- `marchadigital.com` y `sucrecomunicaciones.com` — sin feed por ninguna ruta
- `lapiragua.co` — el dominio no resuelve
- `elmeridiano.co` — responde 200 y no declara feed

**Lo que lo abriría, de menor a mayor coste:** escribir a Korraleja (solo tiene que
reactivar el RSS de su WordPress: es una casilla), escribir a El Meridiano —que
desbloquearía Sucre *y* reforzaría Córdoba—, o entrar por `mapeomedios.com`, el
mapeo de medios de Sucre de la UAJS de Sincelejo, que dice tener 20 medios digitales
y no los enlaza desde su HTML.

---

## Lo del 14 de agosto, por la mañana

### Seis departamentos dejan de estar en blanco: de 21 a 27 con voz propia

Rama **`altas-seis-departamentos`**. Catálogo 66 → **72 medios**, 59 colombianos.

| Departamento | Medio | Frescura |
|---|---|---|
| Cundinamarca | Periodismo Público (Soacha) | 0,6 h |
| Magdalena | Seguimiento.co (Santa Marta) | 0,2 h |
| Quindío | Quindío Noticias (Armenia) | 0,3 h |
| Nariño | Abra Noticias | 1,9 h |
| Casanare | Prensa Libre Casanare (Yopal) | 15,1 h |
| San Andrés | The Archipielago Press | 30,7 h |

Los seis con 200 y **10 de 10 ítems en ventana**, comprobados de campo sitio por
sitio. Todos en **0,00 y `ownerType: null`**.

**Que salgan los seis opacos no es que se buscara mal.** La prensa digital
departamental colombiana no publica quién la posee, y el patrón se repitió idéntico
en las altas del 9, del 11, del 12 y del 13. **Cuando una ausencia se repite en
veinte de veinte, deja de ser un hueco de nuestra investigación y pasa a ser un
hallazgo sobre el sector.**

**Tres cosas que salieron al comprobar:**

- **Quindío Noticias responde 200 a cualquier ruta** devolviendo la portada.
  `/about/` y `/aviso-legal/` dan los mismos 106 kB y no existen. Quien las pruebe
  creerá haber mirado sus páginas institucionales. Hubo que comparar tamaños.
- **Abra Noticias tiene los datos de contacto de la plantilla sin editar** — un
  teléfono `+202-555-0156` y una dirección en Hagerstown, Maryland. Su contenido es
  local y real; lo que dice el dato es que **no hay a quién pedirle una
  rectificación**. Declarado en su ficha.
- **The Archipielago Press no publica un solo nombre** y entra igual, argumentado:
  es la única voz web de un departamento insular de 60 000 habitantes. Su pista
  buena es la **licencia de Radio Archipiélago**, que tiene titular público.

**Quedan cinco departamentos en blanco** y tres son huecos reales —Amazonas, Guainía
y Vaupés, donde la comunicación es radio—. **Los alcanzables son Sucre y Arauca**, y
en Arauca el candidato ya existe con ficha: `fichas/al-aire-noticias.md`, pendiente
de alta, no de búsqueda.

### EL DIARIO de Boyacá volvió solo

Sus servidores de nombres respondían de nuevo el 14 por la mañana. Feed con **10 de
10 en ventana** y siguió publicando durante la caída, así que era solo el DNS. Fly
pasó de 62 a **64 feeds OK, cero fallidos**. No hizo falta tocar el catálogo, y
**Boyacá 7 Días baja de prioridad** porque Boyacá recupera sus dos voces.

---

## Lo del 13 de agosto, por la tarde

### El Meridiano nunca nos bloqueó, y prensaescrita da 73 feeds regionales vivos

Rama **`limpiar-diagnosticos-falsos`**, un commit, **sin fusionar**. Detalle
completo en **`BARRIDO_2026-08-13.md`**.

Eran dos tareas de limpieza y destaparon la mayor cosecha regional del proyecto.

**`elmeridiano.co` responde 200.** Figuraba desde el 9 de agosto como «devuelve 403
a los bots», y sobre esa frase se dio Córdoba por bloqueado y se escribió que «un
solo obstáculo técnico deja dos departamentos sin voz». **Era la tilde otra vez.**
Sigue sin poder ingerirse porque **no declara feed** — pero eso es otro problema y
tiene otra salida: a un medio sin RSS se le escribe, a uno que te bloquea no.

**`prensaescrita.com/america/colombia.php`: 145 medios, 109 candidatos nuevos, 73
con feed fresco.** Wikidata el día 12 dio 40 de 103. Es la fuente más productiva
que ha tenido el proyecto y la única buena para lo regional. Ya está escrito en
`cosecharMedios.mjs` cómo se cosecha, para integrarla.

**SEIS DEPARTAMENTOS EN BLANCO TIENEN CANDIDATO VIVO** —departamento tomado de la
cabecera del propio sitio, sin ficha todavía—:

| Departamento | Candidato | Frescura |
|---|---|---|
| Cundinamarca | `periodismopublico.com` | 0 h |
| Magdalena | `seguimiento.co` | 2 h |
| Quindío | `quindionoticias.com` | 2 h |
| Nariño | `abranoticias.com` | 1 h |
| Casanare | `prensalibrecasanare.com` | 15 h |
| San Andrés | `thearchipielagopress.co` | 30 h |

**No son altas.** Cada una necesita ficha de propiedad y de orientación comprobada
de campo, y ya se vio con EL DIARIO lo que pasa al copiar una ficha de tres días.

**Sucre y Arauca siguen sin salida.** Sucre porque su único candidato lleva 18 días
quieto; Arauca porque los dos suyos no declaran feed — aunque ahí el candidato ya
existe y tiene ficha: `fichas/al-aire-noticias.md`, pendiente de alta, no de
búsqueda.

**Y `boyaca7dias.com.co` publica ahora mismo**, que importa hoy porque EL DIARIO de
Boyacá tiene el DNS caído.

**El cuarto fallo propio de la semana, y este dentro del propio arreglo:** mi filtro
de ruido llevaba `as.com` sin anclar, así que descartó `sucrenoticias.com`,
`quindionoticias.com` y `araucanoticias.com.co` por la subcadena «as.com» — justo
los de los departamentos que faltaban. Queda avisado en el código.

---

## Lo del 13 de agosto, por la mañana

### El Tolima ya tiene voz: alta de El Nuevo Día (Ibagué)

Rama **`alta-el-nuevo-dia`**, dos commits, **sin fusionar todavía**. Catálogo
65 → **66 medios**, 53 colombianos. Departamentos con voz propia viva: 20 → **21**
—sin contar Bogotá D.C.—. Feed probado: 200, **10 de 10 ítems en ventana, mediana
5,9 h**.

**LO IMPORTANTE NO ES EL ALTA, ES LO QUE NO SE MARCÓ.** La nota del barrido decía
«es de la familia Galvis, la de Vanguardia — si entra, hay dueño compartido que
marcar». **Es falso hoy**, y comprobarlo era el trabajo:

- La sociedad que Galvis cofundó en 1992, **Editorial Aguasclaras S.A.**, consta
  **EN LIQUIDACIÓN JUDICIAL con la matrícula cancelada** (NIT 800052169). El
  impreso cerró el 22-10-2023.
- Lo que publica hoy es **EL NUEVO DÍA DIGITAL S.A.S.**, otra sociedad, que no
  publica NIT, ni socios, ni representante legal.
- **No hay ni un documento que enlace las dos.** Con `controlGroup: 'galvis'` el
  mapa de concentración *afirmaría* que Vanguardia y El Nuevo Día responden a la
  misma familia. No se marca; la pista queda escrita en `mediaOwnership.js`.

Es la **regla del presente por tercera vez en una semana** —tras Semana y tras EL
DIARIO— y la primera que sirve para **no añadir** un vínculo en vez de para
quitarlo. Y otra vez pagó no copiar la ficha vieja: la del 9 de agosto se cerró
sin número por la liquidación y dejó escrito qué la reabriría. Pasó exactamente
eso.

**Lo que NO cierra:** el NIT de la S.A.S. no está en ninguna fuente abierta que
responda, así que el certificado de la **Cámara de Comercio de Ibagué** es el
noveno pendiente manual. Y **Ecos del Combeima sigue vivo como alta condicionada**:
esta alta no lo sustituye.

### El catálogo público decía que 18 medios tienen 0 % de rigor factual

Salió al regenerar el catálogo con el medio nuevo. `fmtFactuality` no miraba el
tipo, así que `factuality: null` se imprimía **«factualidad 0%»** — la peor nota
posible, con nombre y apellidos, sobre medios a los que no se ha medido nada.

**No lo detectaba nada, y la razón importa:** `check:registry` compara el archivo
generado contra `renderCatalog()`, y los dos producían el mismo 0 %. Una
comprobación de coherencia no ve un error que está en el generador.

La interfaz ya lo hacía bien —`fmtPct` en `MediaMap.jsx` dice «sin medir»—, así
que era además una divergencia entre el mapa y el catálogo. Arreglado con la misma
palabra y con cuatro pruebas en `scripts/generateCatalogDoc.test.mjs`. **490
pruebas** en verde.

### EL DIARIO de Boyacá se cayó, y no es cosa nuestra

`check:feeds` lo da con **0 ítems** un día después de darlo de alta. El diagnóstico
está hecho y **el fallo es suyo**: `curl` da exit 6 —no resuelve el host— y el
resolver público de Google devuelve *«Name servers did not respond
[63.250.39.105]»* en la delegación de `eldiarioboyaca.com`, mientras
`viveelmeta.com` resuelve bien desde el mismo sitio. **Sus servidores de nombres
están caídos.**

**Decisión de Jose: no se toca el catálogo, se vigila.** Boyacá conserva voz con
Boyacá Digital. Revisar en unos días; si no vuelve, buscarle otra vía —no se mutea
a nadie—.

> Y esta vez se comprobó contra un resolver externo **antes** de escribir la nota,
> que es justo lo que no se hizo con la tilde del User-Agent ni con el 504 de
> Wikidata.

### Lo siguiente en esta rama, si se sigue por aquí

1. **Fusionar** `alta-el-nuevo-dia`, y antes `fichas-tramo-prioritario-y-barrido`,
   que sigue pendiente. Orden de siempre: `main` (Vercel) → `npm run deploy`
   (Fly) → recategorizar.
2. Del barrido quedan **Cablenoticias** (decisión de producto: es el canal donde
   emite Noticias Uno, que aporta cero), **La Nación (Neiva)** y **Diario La
   Libertad (Barranquilla)**.
3. **`prensaescrita.com`**: la nota falsa sigue en `cosecharMedios.mjs`.
4. **Los 16 dominios del día 11**, los únicos que pudo marcar mal el User-Agent.

---

## Lo del 12 de agosto, por la tarde

### Las 20 fichas del tramo prioritario están escritas

**Jose las revisa hoy con Kimi K3 y Fable 5.** Eran 2 de 20 por la mañana. La cola
completa, con qué propone cada una y cinco preguntas que atraviesan varias, está en
**`revision-externa/pendientes.md`**.

**Ninguna propone firmar.** Cinco se cierran con búsqueda documental —Noticias RCN,
La FM, El Colombiano, Semana y La Opinión necesitan tres a cinco piezas fechadas del
último año—, y la de Semana es la más cerca de firmarse de todo el catálogo: le falta
cambiar una frase y añadir cinco enlaces.

**Lo que salió al escribirlas, y no se resuelve ficha por ficha:**

- **«Fiscalizar al poder» se resuelve de tres formas distintas** en el catálogo:
  Chocó 7 Días va a la mixta porque «denunciar al poder es el oficio y no una
  orientación»; Noticias Uno está en −0,40 justamente por eso; La Silla Vacía en
  −0,10 por lo mismo sin decirlo. **Las tres no pueden tener razón.**
- **Los siete diarios regionales están todos a la derecha**, de +0,15 a +0,35. Si el
  criterio es «familia empresarial regional → derecha moderada», eso es la regla 5.1
  al revés y hay que escribirlo o sustituirlo por evidencia.
- **Los trece internacionales están clasificados en el eje de su país**, no en el
  colombiano. Nadie ha justificado la traslación.
- **Noticias Uno es el caso de El Espectador otra vez**, con la mitad de la
  justificación histórica, la propiedad sin cerrar y cero corpus — y con el valor más
  extremo del catálogo.

**Nuevo: `npm run conducta`** mide la conducta de nivel 2 —agenda propia, compañía
media, con quién coincide— y `revision-externa/CONDUCTA-MEDIDA.md` explica **por qué
hoy casi no discrimina**: tres días, corpus dominado por el terremoto, y compañía
media saturada entre +0,08 y +0,19 para los veinte. Si un revisor la usa para mover
un número, es una objeción válida contra la ficha.

### El barrido nacional está hecho, y estaba bloqueado por nuestra propia consulta

Detalle en **`BARRIDO_2026-08-12.md`**. Wikidata nunca estuvo caído: el 502 y el 504
los daba **nuestra** consulta, demasiado pesada para el límite de tiempo del
endpoint. Partida en siete —una por tipo— con reintentos, pasa. **103 candidatos
nuevos, 40 con feed vivo.**

**Es el mismo error de diagnóstico que la tilde del User-Agent, en la misma semana:
las dos veces el fallo era nuestro y la nota culpaba al otro lado.** Y de paso queda
comprobado que **`prensaescrita.com` responde 200** — la nota del código que decía
que nos bloqueaba era falsa y está corregida.

**Lo que hay que hacer con eso:**

1. **El Nuevo Día (Ibagué) publica cada dos horas** y está fuera del catálogo. **Es
   el único candidato que desbloquea un departamento entero, el Tolima.** Ojo: es de
   la familia Galvis, la de Vanguardia — si entra, hay dueño compartido que marcar.
2. **Cablenoticias publica cada hora**, y es el canal donde emite Noticias Uno, que
   hoy aporta cero artículos.
3. **La Nación (Neiva)** cada 4 h y **Diario La Libertad (Barranquilla)** con 50
   ítems al día. No desbloquean departamento; añaden voz donde hay una sola.

### Dos arreglos pequeños que evitaban avisos en falso

- **`check:registry` daba falsa alarma en Windows**: comparaba cadenas exactas y git
  deja el catálogo con CRLF tras un checkout, así que anunciaba «desactualizado» un
  archivo idéntico. Pasó dos veces hoy. Ahora normaliza los saltos de línea.
- **La política de propiedad desconocida ya es política**, no caso por caso: ver
  `DECISIONES.md` del 2026-08-12.

---

## Los tres que faltaban ya están dentro (2026-08-12)

**Fusionado y en producción**, con el orden de siempre: `main` (Vercel) →
`npm run deploy` (Fly, commit `540e95c`) → recategorizar. Fly va por 63 feeds con
60 OK y **cero caídos**. En el mapa, Caquetá pasó de 1 historia a 3, Meta de 23 a
25 y Boyacá de 19 a 26.

Rama **`altas-boyaca-meta-caqueta`**. **EL DIARIO de Boyacá, Vive el Meta y
Lente Regional** entran con `ownerType: null` declarado con fecha. **Meta y
Caquetá dejan de estar en blanco**: de 18 departamentos con voz propia viva a
**20**. Catálogo: 62 → **65 medios**, 52 colombianos, cero firmados.

**No se copió ninguna ficha: se comprobaron los tres sitios de campo el día 12.**
Y esa decisión pagó sola:

- **La ficha de EL DIARIO había caducado en tres días.** Daba como nivel 1 a un
  cofundador que seguía dirigiendo, y hoy su web no menciona a ninguno de los dos
  nombres que citaba. Cambió de manos en junio: **Ricardo Rodríguez Puerto lo
  dirige y además compró participación accionaria a la familia propietaria**
  ([Orfetv, 17-06-2026](https://www.orfetv.com/2026/06/17/el-periodico-el-diario-inicia-una-nueva-etapa/)).
  La regla del presente no va solo de los años noventa.
- **Vive el Meta sí declara su editora**, y la ficha lo daba por desconocido:
  «La persona jurídica **Grupo La Independencia S.A.S** es propietaria y editora
  de viveelmeta.com», NIT 901092043-9, en tres páginas suyas. Quién controla esa
  sociedad sigue sin constar — es el caso de Pulzo a escala departamental.
- **Lente Regional** nombra a cinco personas con cargo y a ninguna como
  propietaria. Sin razón social ni NIT: no hay ni por dónde entrar al registro.

**Los tres entran en 0,00 por la Regla 2** —ausencia de evidencia, no evidencia
de equilibrio—. EL DIARIO venía con +0,20 propuesto por analogía con los diarios
comerciales regionales y **se descartó la analogía**: aquellos son sociedades
conocidas y de este no se sabe ni cuál lo edita. Decisión de Jose.

Verificado: 486 pruebas, lint, typecheck, `check:registry` limpio, `docs:catalog`
regenerado y los tres feeds probados con `check:feeds` —200, dentro de ventana,
medianas de 16 h, 42 h y 41 h—. La CSP lleva sus tres dominios; de paso quedó
ordenada alfabéticamente, sin perder ninguna entrada de las 124 anteriores.

**Lo que NO se cerró:** los tres certificados de Cámara de Comercio —Tunja,
Villavicencio y Caquetá— siguen siendo trámite manual. El de Villavicencio es el
más fácil, porque el NIT ya está en la mano.

---

## Fusionada y desplegada (2026-08-12)

`fichas-propiedad-ausencia-y-altas` está **en `main` y en producción**. Se
verificó antes de fusionar —486 pruebas, lint, typecheck, `check:registry` sin
errores de integridad y `npm run build` limpio— y se siguió el orden escrito:
`main` (Vercel) → `npm run deploy` (Fly) → recategorizar.

- **Fly va por el commit `d2141e0`**, el mismo que `main`. Sin desfase.
- **Ingesta viva**: 56 feeds OK, **cero caídos**, última pasada 11:50 UTC.
- **Recategorización aplicada** sobre 6 794 artículos y 5 479 historias. El
  reparto salió idéntico al que ya había en base salvo la corrección de **EFE
  como medio español** —Fly venía ingiriendo sin EFE en el registro, así que su
  país caía al valor por defecto—. Eso es exactamente lo que este paso viene a
  arreglar y por lo que va después de Fly, no antes.
- Comprobado en producción: portada, `/medios` y `/api/departamentos` responden
  200 y con contenido coherente.

**Dos números para mirar con calma, que NO los trae este despliegue** —ya
estaban en base y siguen igual—:

- **Desastres se lleva el 37 %** del corpus (2 505 de 6 794). El terremoto copa
  la portada entera, así que puede ser real; conviene confirmarlo cuando el
  hecho envejezca, no ahora.
- **El 29 % de los artículos se queda sin tema** (1 997), y un 14 % entra solo
  rescatado por señal débil.

---

## PENDIENTES ABIERTOS (2026-08-11)

Los dos que Jose pidió anotar al cerrar, antes que nada de lo demás:

1. **Enviar las fichas a las IAs externas.** Lo hace Jose, con modelos de ventana
   grande. El circuito está montado en `revision-externa/` y **no se ha enviado
   nada**: hay 17 fichas con valor propuesto y `respuestas/` está vacía. Los
   medios grandes —Noticias Caracol, El Tiempo, Semana, Caracol Radio, Noticias
   RCN, La FM— **no tienen ficha que enviar**. Detalle en
   `revision-externa/pendientes.md`.

2. **La categoría de canales de YouTube.** Una categoría con los canales
   distribuidos. Se habló en una sesión anterior y no quedó nada escrito; el hilo
   reconstruido está en **`PLANEACION.md`**, con lo que falta preguntar y lo que
   ya se sabe del terreno.

**Y a partir de ahora, lo que se hable de planeación se anota en
`PLANEACION.md` en el momento**, no al cerrar. Justo por lo que pasó con lo de
YouTube.

---

## Lo del 11 de agosto, por la tarde

**Rama `fichas-propiedad-ausencia-y-altas`** — fusionada el 2026-08-12, ver
arriba. Cinco commits, 486 pruebas en verde, lint y typecheck limpios.

**La ausencia de dueño se declara con fecha.** `ownerType: null` pasa a ser un
estado válido si la ficha dice dónde y cuándo se buscó y qué documento cerraría
el hueco; lo exige `check:registry`. La regla vieja —dar de alta obliga a
declarar dueño— dejaba departamentos en blanco por no saber. **Quedan por
reevaluar EL DIARIO de Boyacá, Vive el Meta y Lente Regional**, que están fuera
por ese motivo y hoy podrían entrar.

**«Mayor cobertura» es audiencia, no volumen** (aclaración de Jose). Nuevo
`shared/audiencia.js` con el Digital News Report del Reuters Institute, sacado de
los CSV de sus gráficos. Tramo prioritario de 20 fichas con **dos grados de
certeza marcados**: 13 medidas y 7 estimadas por volumen propio. Ningún estimado
adelanta a un medido.

**Tres altas: Pulzo, La Razón.co (Montería) y la ingesta de EFE.** Pulzo es el
cuarto medio más consumido del país y faltaba: lo destapó cambiar el criterio de
orden. Su propiedad **no se cerró** —sus tres fuentes públicas se contradicen— y
por eso NO lleva `controlGroup`; ver `fichas/pulzo.md`.

**El despliegue ya se hizo** el 2026-08-12, en ese orden. Los tres medios nuevos
están dentro.

**El punto flojo:** EFE va por Google News con mediana de 41 h y enlaces a
`news.google.com`. Sus feeds propios están desactivados en el servidor; su API
REST de WordPress sería mejor vía, pero el motor solo lee RSS.

---

Nota de traspaso del **2026-08-11**, escrita al cerrar la sesión de la mañana.

Todo está en `main`. **460 tests** en verde, lint y typecheck limpios, árbol
limpio. **Vercel y Fly desplegados**, base migrada, portada y mapa verificados en
producción con captura y sin errores de consola.

No queda nada a medias. Lo de abajo es trabajo nuevo, no arrastre.

---

## Qué se hizo el 10 de agosto, y por qué

Empezó con una pregunta de Jose: el terremoto del Chocó, con 111 muertos, no era
portada. Resultaron ser tres cosas distintas, en tres capas.

**1. Nada envejecía.** El orden era `medios DESC, published_at DESC`: la fecha
solo desempataba. El radar mostraba a Jorge Messi y un ataque con drones, ambos
de dos días antes. → `shared/relevancia.js`, vida media de 24 h.

**2. La fragmentación castigaba lo importante.** El terremoto eran 22 medios y
104 artículos repartidos en 20 historias de 3 a 7 medios. El ranking cuenta
medios *por historia*, así que un hecho grande genera más ángulos, se parte más y
pesa menos cada trozo. Un nombramiento, que solo admite una forma de contarse,
ganaba con 8 limpios. → `shared/sucesos.js` y la ruta `/api/portada`.

**3. El titular lo daba la pieza más cubierta.** Y esa puede ser una galería de
fotos: el accidente con tres muertas se titulaba «Las últimas fotos de las
turistas colombianas». → `shared/titularDeSuceso.js`.

Y por el camino apareció una cuarta, que era el defecto que Jose veía en la
tarjeta: **los desastres no tenían sección** y se repartían entre trece. →
`desastres` en la taxonomía, y `nombreDeSeccion` en `src/lib/seccion.js`.

Calibración reproducible: `npm run eval:sucesos` y `npm run recategorizar`
(ensayo por defecto los dos).

---

## Lo del 11 de agosto

**El feed estuvo diez horas parado** (01:45–12:10 UTC). `factuality: null` se
decidió válida el día 9 y se aplicó a `stories`, no a `sources`, que es la
proyección del registro: once medios entran sin medir, así que la proyección
fallaba entera y el worker moría con código 1 hasta que Fly se rindió («max
restart count of 10»). No estalló antes porque Fly llevaba sin desplegarse desde
el día 8. **El desfase de despliegue no da números peores: acumula una bomba.**

**La vigilancia lo detectó y no avisó.** Falló en rojo a las 06:53 y nadie lo
vio. Ahora abre un issue con la salida completa y lo cierra sola al recuperarse
— probado de punta a punta en una rama desechable. Mejora *que te enteres*, no
*cuándo*: la ventana sigue siendo de seis horas.

**El departamento ya se persiste.** `stories.departamento` lo calcula la ingesta
y `/api/departamentos` cuenta el catálogo entero, así que el mapa dejó de contar
lo descargado. Va en `stories` y no en `articles` —contra lo que decía esta
nota— porque el detector mira solo el titular de la historia, y persistirlo por
artículo obligaría a cambiar esa decisión.

---

## Valora Analitik, y la tilde que lo bloqueaba

**Alta el 2026-08-11**, a petición de Jose. Medio económico y bursátil, ~51
artículos/día, 11.º del catálogo por volumen. Sesgo **+0,10** —el de Portafolio—,
`factuality: null`, ficha sin firmar.

Lo edita **Valora Inversiones S.A.S.** (NIT 900.811.192-0), de sus dos
fundadores, **sin ningún grupo detrás**. La misma sociedad vende una plataforma
de pago para inversionistas sobre las emisoras que su redacción cubre: está
declarado en la ficha como desvelamiento, no como acusación.

**Figuraba «sin feed», y el problema era nuestro.** El User-Agent llevaba una
tilde —«periodística»—, una cabecera HTTP solo admite ASCII y los cortafuegos la
rechazaban con un 403. Lo peor: quedó escrito como decisión que
«prensaescrita.com nos bloquea y se respeta». **Nunca nos bloqueó.** Sin la
tilde responde 200.

Queda una tarea que sale de ahí: **repasar el barrido de 124 dominios**, porque
no se sabe cuántos candidatos se apuntaron como mudos por esto.

---

## El titular que no se actualizaba

Jose lo vio en el terremoto: la portada decía «71 muertos» cuando las piezas de
esa misma historia ya iban por 111. El titular salía del medio **más cercano al
centro sea cual sea su hora**, así que en un hecho en desarrollo se congelaba en
lo que ese medio dijo primero. Medido: el 40 % de las historias multifuente
llevaba más de una hora de desfase, el 18 % más de seis, y la peor 58,8 h.

Ahora se elige el más centrado **de entre los recientes**, con ventana de 6 h
calibrada. Después del arreglo: **0 % por encima de seis horas** y el retraso
medio baja de 4,24 h a 45 minutos.

**Desacoplado del id a propósito**: `storyId()` deriva el id del titular, y ese
id es la URL. Si el titular arrastrara el id, cada actualización renombraría la
historia y rompería los enlaces. El id sigue anclado al más centrista de todos.

**Lo que queda de eso, y es decisión de producto:** dos sucesos del terremoto
conviven diciendo «111 muertos» y «169». Su similitud es **0,200** contra un
umbral de **0,22** — se quedan a dos centésimas. Lo que los separa son las
cifras: el tokenizador conserva los números porque «distinguen hechos», cierto
para fechas, pero **en un balance de víctimas el número cambia precisamente
porque es el mismo hecho actualizándose**. Bajar el umbral reintroduce las
fusiones falsas que costó calibrar; tratar los números aparte afecta al
agrupamiento entero. No se tocó.

---

## Lo primero al volver

1. **Terminar el barrido nacional.** Se hizo con los 16 dominios que el informe
   nombra y aparecieron dos que sí publican: **larazon.co** (Montería, Córdoba,
   hace 2 h) y **narinoahora.com** (Nariño, hace 21 h), ambos en departamentos
   que estaban bloqueados. Los otros 124 no se pudieron rehacer:
   **`query.wikidata.org` devolvía 502** las dos veces que se intentó. Reintentar
   `npm run medios:cosechar -- --lista` cuando su servicio vuelva. **El
   2026-08-12 responde 200: ya se puede rehacer.**
2. **La foto del destacado.** Es lo único de la portada del terremoto que quedó
   sin mirar: viene con crédito de Telemedellín y no está claro que sea del
   sismo. Jose lo señaló y no se tocó.
3. **Escribir a El Meridiano** (`elmeridiano.co`). Cubre Córdoba **y** Sucre: un
   solo obstáculo técnico deja dos departamentos sin voz. Sigue siendo lo que más
   desbloquea por menos trabajo.
4. **La afiliación de Ecos del Combeima a Blu Radio.** Decide si el Tolima tiene
   voz propia o una afiliada de Valorem. Está en `fichas/ecos-del-combeima.md`
   como alta condicionada.
5. **Ocho certificados de Cámara de Comercio** — Neiva, Tunja, Santa Marta,
   Villavicencio, Pereira, Arauca, San Andrés, Montería. No se tramitan desde
   aquí.
6. **La FLIP** y sus «Cartografías de la Información», que mapean 141 municipios
   y visitaron justo los huecos del catálogo. Su web daba 502 y 404 el 9 de
   agosto: estaba rota, no bloqueando.

---

## Decisiones tomadas hoy que conviene no volver a discutir

**La vida media son 24 h y está medida.** Cualquier decaimiento barre lo rancio
—el salto está entre «sin decaimiento» y el resto, no entre los valores—. Lo que
separa unos de otros es el monocultivo: a 6 h el top 10 son ocho piezas del mismo
hecho. 24 h además se explica sin enseñar la fórmula, y un parámetro de orden que
no se puede explicar es uno que nadie va a auditar.

**Un suceso agrupa para ordenar y presentar, nunca para fusionar.** Cada historia
conserva su titular y su recuento. **No se bajó el umbral de `clustering.js`**:
está en 0,34 con medición detrás. «Estas piezas hablan del terremoto» y «estas
piezas son el mismo hecho» son afirmaciones distintas, y solo la segunda
inventaría cobertura.

**Agrupamiento por líder, no por encadenamiento.** Un umbral laxo con enlace
simple encadena: A se parece a B, B a C, y C acaba dentro sin parecerse a A.

**El titular se elige por FORMATO, nunca por tema ni por importancia** — mismo
criterio que `contentQuality.js`. Y no se descarta nada: la galería sigue en el
suceso con su recuento; lo único que no puede es dar nombre al conjunto.

**El medoide se probó y se descartó.** Sobre los seis sucesos de 3+ ángulos:
cambiaba el titular en los seis, acertaba en dos y empeoraba en tres. Metía «En
directo: Netanyahu rechaza el plan…» como titular de Gaza. La centralidad mide
parecido, no vocación de titular.

**Los accidentes van en Desastres, la meteorología no se separa.** La forma la
zanjó IPTC Media Topics, el vocabulario de las agencias: su categoría es
«disaster, accident and emergency incident». Separa «weather» por el pronóstico
diario, que aquí no se ingiere —14 artículos en 4 000—. Copiar una división sin
el contenido que la justifica deja una sección vacía.

---

## Dos hallazgos que no estaban previstos

**El vocabulario pesa más que el umbral.** Con el IDF de las 100 historias de una
página, 6 de 19 agrupaciones eran falsas: «Colombia reconoce la soberanía de
Marruecos sobre el Sáhara» se unía a «reconoce soberanía de Israel sobre el
Golán» porque «soberania» salía dos veces en cien y parecía rarísima. Con el IDF
de los 4 684 titulares del corpus, **sin tocar el umbral**, desaparecen las seis.

Es la advertencia que `evalClustering.mjs` ya llevaba escrita —«un IDF sobre 144
titulares no dice lo mismo»— ahora con la medida al lado. Y es la razón de que el
agrupamiento viva en el servidor: el navegador solo descarga la página.

**`category` no es el campo de presentación.** Es la sección heredada del feed, y
`recategorizar.mjs` la conserva intacta a propósito: es el archivo de lo que el
sitio mostró antes de cada migración. Pero cuatro componentes la pintaban como
etiqueta, así que la tarjeta decía «Política» mientras la historia vivía en
Desastres — dos respuestas distintas a la misma pregunta en la misma pantalla.
Ahora se pinta `nombreDeSeccion`, con el mismo orden de preferencia que
`perteneceA` para que no puedan divergir.

---

## Trampas que ya mordieron, para no repetirlas

- **Añadir una sección toca TRES sitios**: `TEMAS` (`shared/topicClassifier.js`),
  `categories.js` y la lámina de `CategoryMark.jsx`. Hay una prueba por cada uno,
  y las tres avisan.
- **«Huracán» es un equipo de fútbol** argentino que la prensa colombiana cubre.
  Está fuera de las listas de `desastres` a propósito, con prueba. Y **«accidente
  cerebrovascular» es un ictus**: por eso «accidente» suelto va como débil.
- **Tokenizar dentro del bucle de comparación es O(n²)** y con miles de historias
  no termina. Está precomputado; no deshacer.
- **Nada de backticks dentro de una plantilla SQL** en `feedStore.js`: rompen el
  template literal y el error que da es un parse error críptico.
- **Lo que el registro produce, el esquema tiene que admitirlo.** `factuality:
  null` era válida en `mediaRegistry` y `NOT NULL` en `sources`, y esa
  contradicción tumbó el feed diez horas. Hay prueba que las compara. Un valor
  que uno genera y el otro rechaza es una caída diferida hasta el despliegue.
- **En YAML, un escalar plano no puede contener `": "`.** Un `run:` de una línea
  con dos puntos y espacio deja el workflow inválido, y GitHub lo reporta como
  una ejecución fallida de 0 s, no como un error de sintaxis. Usa un bloque `|`.
- **`npm run dev:server` INGIERE CONTRA LA BASE DE PRODUCCIÓN.** No hay base de
  desarrollo: `.env.local` apunta a la misma Postgres que Fly, y el servidor
  arranca su propio ciclo de ingesta al levantarse. Levantarlo «para mirar una
  página» escribe artículos reales, y si el registro local va por delante del de
  Fly, deja los dos desincronizados. Pasó el 2026-08-12 y no rompió nada porque
  el despliegue iba detrás; con un cambio de esquema por medio habría sido la
  caída de las diez horas otra vez.
- **Y ese servidor no sirve páginas**: es solo API. El SSR lo hace Vercel, así
  que `curl http://localhost:5000/medios` devuelve «Cannot GET». Para ver una
  pantalla, `npm run dev` o el preview de Vercel.
- **El orden del despliegue importa**: primero `main` (Vercel), luego
  `npm run deploy` (Fly), y la recategorización DESPUÉS de Fly — si no, el worker
  sigue ingiriendo con el léxico viejo.

---

## Lo que no se arregla buscando más

**Amazonas, Guainía y Vaupés no tienen medios web.** Tres búsquedas con ángulos
distintos y ni uno. Allí la comunicación existe y es radio. Un agregador de RSS
no alcanza eso: **no es un fallo del catálogo, es un límite del formato**, y
decirlo en la vista departamental es más honesto que dejar tres departamentos en
blanco como si allí no pasara nada.

---

## La idea apuntada que sigue sin empezar

En un medio de redacción automatizada **la orientación debería ser más medible,
no menos**. En una redacción humana el sesgo se reparte entre personas y días; en
una configurada es una propiedad del sistema. Con corpus suficiente su deriva
debería calcularse más directamente, y **una alteración de su configuración
debería verse como un salto y no como ruido**.

Boyacá Digital es el primer caso de prueba. Está en `shared/mediaRegistry.js`,
junto al campo `redaccion`, que es donde se buscará.
