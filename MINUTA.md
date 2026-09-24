# Minuta — el hilo de lo que queda pendiente

## Para qué existe, y qué la obliga

**Pedida por Jose el 2026-08-19**, y con un motivo que salió de una crítica a mi
propio trabajo: la auditoría automática que se montó ese mismo día produce
hallazgos, abre un issue y **no sabe qué pasó después**. Si nadie lee el issue,
en tres meses la auditoría será otro comentario que describe una intención que ya
no ocurre — que es justo la enfermedad que este proyecto tuvo hoy cuatro veces
seguidas.

> **Todo lo que una auditoría o una revisión deja pendiente se anota aquí, con su
> fecha y con lo que se decidió.** Un hallazgo que no está en esta lista no está
> pendiente: está olvidado, y las dos cosas se ven igual.

Esto es distinto de los otros tres archivos, y conviene no mezclarlos:

| Archivo | Qué guarda |
|---|---|
| `PLANEACION.md` | Ideas a medio hablar, rumbos, lo que todavía no es tarea |
| `DECISIONES.md` | Decisiones tomadas, con su razón |
| `SIGUIENTE.md` | La nota de traspaso de una sesión |
| `doblefoco-app/PLAN_CONTINUIDAD.md` | El orden en que conviene atacar lo ya identificado |
| **`MINUTA.md`** | **Lo que una revisión encontró y todavía no se ha hecho** |

## Cómo se cruza con el libro de hallazgos

`doblefoco-app/auditoria/hallazgos.json` es **el libro que lleva la máquina**:
cada defecto que la auditoría sabe detectar, con su id estable, su `primeraVez`
que no se toca nunca, y su estado. Se concilia solo en cada pasada.

**Esta minuta es más ancha que el libro**, y esa es la razón de que existan las
dos. El libro solo sabe de lo que la auditoría sabe mirar —feeds, fuentes, rutas—.
Casi todo lo grave que se encontró hoy **no lo habría visto ninguna auditoría**:
salió de leer código. Eso también es una revisión, y también deja pendientes.

Las dos reglas del cruce:

1. **Si un hallazgo tiene id en el libro, se cita aquí por su id.** Así se puede
   ir del uno al otro sin adivinar.
2. **Silenciar un hallazgo del libro exige escribir por qué.** Se marca
   `"estado": "aceptado"` con su `nota`, y la nota se copia aquí. La auditoría
   avisa de los aceptados sin motivo: aceptar sin decir por qué no es aceptar, es
   esconder, y a los tres meses nadie sabrá cuál de las dos cosas fue.

---

# ABIERTO

## 2026-09-22 · El simulacro de tráfico: conclusiones, y lo que queda (M1.4, ABIERTO)

Lo autorizó Jose: «a cualquier hora, igual no he lanzado la página». El
informe completo, con cifras y cómo repetirlo, está en
`doblefoco-app/SIMULACRO_TRAFICO.md` (PR #48, que sustituye a la #47).

### Las conclusiones

1. **Sin caché, el sitio se saturaba en 2 visitas por segundo.** Lo que cedía
   era el pooler de Supabase (`EMAXCONNSESSION … pool_size: 15`), no la
   máquina: cada visita recalculaba el feed completo contra la base, aunque
   los datos cambian cada 30 minutos. **Escalar máquinas empeoraba**: con 3,
   el sitio se caía a las 3 visitas por segundo.
2. **Con `server/cacheDeRespuestas.js`** (60 s, ya serializado y de un solo
   vuelo) **aguanta 12 visitas por segundo con p95 de 0,08 s**: unas 43 000
   por hora con una sola `shared-cpu-1x`. Durante esas corridas, producción no
   dio ni un `EMAXCONNSESSION`. El siguiente techo es la CPU, y ahí escalar sí
   ayudaría.
3. **La segunda corrida sin caché le dio unos 4 minutos de errores de
   conexión a producción** (00:04 a 00:08 UTC), porque la copia leía la misma
   base. Sin público, no hubo daño. Queda la regla: **contra producción, solo
   con permiso y con cuidado. Contra una copia de la base, no, porque tiene
   datos personales** (lista de espera, usuarios del panel, reportes). Esto
   último lo frenó el sistema de permisos y lo decidió Jose.
4. **Descartado: los tiempos agotados por IPv6.** La red de casa no tiene
   IPv6 para ningún sitio, y los navegadores lo esquivan solos.
5. **Descartado: Vercel bloqueando el sitio.** Su Security Checkpoint se
   encendió solo contra la IP de las sondas, que pasó de 200 a 403 a mitad de
   camino. Desde el móvil con datos, el sitio cargó normal.
6. **El costo quedó en cero.** La app de prueba se borró con sus máquinas e
   IPs. Producción quedó igual que antes: 1 API de 256 MB, el motor de 512 MB
   y su reserva apagada. Gasto total: centavos de dólar.

### Lo que queda abierto, con dueño

| | Qué | Quién |
|---|---|---|
| a | **Fusionar la PR #48** | Jose |
| b | ~~`DATABASE_POOL_MAX`~~ **HECHO el mismo día** (en la PR #48): 4 por defecto. El motor procesa 4 feeds a la vez, así que no necesita más. API + motor + una tarea programada = 12, frente a un tope de 15 | código |
| c | **Tiempos agotados por IPv4 hacia la IP compartida de Fly** desde la red de casa: 5 de 80, mientras Vercel y Google respondían. **Acotado el mismo día: es el camino desde esa red, no el servidor.** Desde dentro de Fly, cero fallos. Desde GitHub, `vigilancia.yml` hizo ~40 corridas en 10 días, sin reintentos y con cero fallos de conexión; su única falla fue de datos. Desde casa, las peticiones entraban a Fly por **iad** (Virginia), no por gru. **Lo que falta saber es si otros usuarios del mismo proveedor lo sufren.** Si pasa, las salidas son una IPv4 dedicada (~2 USD/mes, sin garantía de cambiar la ruta) o servir la API a través de Vercel, que es decisión de producto | Jose, si reaparece |
| d | Volver a medir con el simulacro cuando cambie algo grande. **El número de referencia hoy: 12 visitas/s** | — |

---

## 2026-09-24 · La misma noticia, ocho veces en portada: las recompuestas no se borraban (ABIERTO)

**Salió de la vigilancia en rojo del 24-09 (issue #51)**, siguiendo el hilo de
un invariante que parecía menor. La historia del huracán Polo estaba enlazada a
un artículo que colgaba a la vez de **otra** historia viva. Medido ese mismo día
en producción:

- **564 artículos** de 46 medios cuelgan de más de una historia viva. El
  2026-09-09 se midieron **cero**.
- **82 de las 100 primeras historias del feed público** comparten artículos con
  otra historia viva. El traslado de los 76 presos de las ACSN salía como
  **ocho** historias.

**La causa**, en `persistStories`: el arreglo del 2026-09-08 (`e56b72d`, «solo
se archiva lo que envejeció») dejó de sellar las multifuente que el
agrupamiento recompone. Pero el borrado siguió pidiendo `source_count <= 1`. Así
una multifuente recompuesta **ni se archivaba ni se borraba**: seguía viva, sin
recalcularse, con los mismos artículos que su sucesora. El commit y la prueba
decían «se borra», y el código no lo hacía. La prueba solo miraba la mitad del
archivo. **En producción desde el 15-09**, con la tanda de la #32.

**El arreglo**, en la rama `investigacion/articulo-en-dos-historias`:
- El borrado deja de filtrar por número de medios. Va después del sellado, así
  que lo maduro ya está archivado y no entra.
- La prueba exige que el borrado no mire `source_count` y que vaya después del
  sellado. Se comprobó que falla con el código de `main`.
- **Invariante nuevo: «cada artículo está en una sola historia viva»**, en
  `invariantes.mjs`, que corre con la vigilancia cada 6 h. Contra producción da
  ✗, como debe.
- No hay moderación ni reportes de lectores sobre historias, así que el borrado
  en cascada no se lleva nada editorial. Comprobado el 24-09.

### Lo que falta

1. **Fusionar y mirar el primer ciclo.** Ese ciclo borrará de una vez las ~440
   multifuente huérfanas: saldrá un `−N obsoletas` grande, y una sola vez.
   Después, `node scripts/invariantes.mjs` debe dar 8/8, salvo el punto 3.
2. **Decisión de Jose: el enlace a una historia recompuesta.** Con el arreglo
   da «Noticia no encontrada», y el texto de esa página dice que las de varios
   medios «se conservan en el archivo», lo que para estas deja de ser verdad. Ya
   pasaba con las de un solo medio. Las salidas: (a) redirigir a la sucesora, la
   historia viva que se quedó con más artículos suyos, lo que pide una tabla y
   una migración; (b) corregir solo el texto; (c) dejarlo. Sin público todavía,
   el daño es pequeño; después del lanzamiento, cada enlace de WhatsApp de una
   historia recompuesta moriría en horas.
3. **Aparte y menor: el invariante de la unión (#51).** La BBC actualiza el
   artículo **bajo la misma URL**. La base guarda el titular del 22-09 («…en
   tiempo récord»), clasificado como **«deportes»**, y el motor compone con el
   titular de hoy, que no tiene tema. Quedan dos preguntas: qué hacer con una
   pieza que cambia de titular sin cambiar de URL, y un falso positivo de
   «récord».
4. **La decisión del techo (M0.4) se midió el mismo día**, antes de encontrar
   esto. Las cifras están en la conversación del 24-09 y se pasan al plan al
   decidir. Las duplicadas no tocan el techo, porque el techo cuenta artículos
   y no historias. Las dos cosas se deciden por separado.

---

## 2026-09-16 · La sesión de decisiones: seis dictadas en una sentada, y un tipo nuevo de medio

Jose pidió pasar las decisiones pendientes una por una, con su evidencia
delante. Las seis quedaron dictadas el mismo día; lo que cada una mueve está
en la rama `decisiones/sesion-del-16-de-septiembre` y en las dos tareas de
código que abre (abajo).

| # | Decisión | Qué se dictó |
|---|---|---|
| 4 | Colombia Informa | **Baja a −0,55.** La banda fuerte la empujaba la misión declarada sobre un mes con catástrofe. **Se re-mide con un mes limpio** (~mediados de octubre) |
| 5+7 | El trío y Razón Pública | **Nace el tipo «no noticioso»**: Vorágine, Cuestión Pública, RAYA, CasaMacondo, Volcánicas y Razón Pública. Siguen en ingesta y agrupamiento, **salen del mapa mediático** (con nota visible que lo explica), y el trío queda «sin medir». Las2Orillas y Cambio se quedan en el mapa: son mucho más frecuentes. Resuelve de paso la pregunta de Razón Pública |
| 6 | RTVC | **«Sin medir»**, re-medición a principios de octubre con ~30 días de su feed propio. La previsión del 08-08 queda como contraste — Jose espera oficialismo, y el número se moverá solo si las piezas lo dicen |
| 8 | El buscador | **Opción A: el motor manda el resumen** — el `snippet` del artículo que pone el titular, acreditado a su medio, como la foto |
| 9 | W Radio | **`revisarEl: 2026-10-13`** (con Telecaribe). Y al ir a asegurar el flujo apareció el hallazgo: **dejó de publicar noticias escritas ~01-09** — feed de Arc en 0, Google News sin nada suyo desde esa fecha, portada solo de programas; Caracol (misma casa) entrega 100. El texto parece haber quedado en caracol.com.co, que ya ingerimos. Nota completa en `hallazgos.json` |
| — | Los internacionales en inglés | **Opción C: esperan** la capa de equivalencia de titulares entre idiomas. NYT, FT y Reuters quedan como cita; los datos de feeds, en el registro |

### Lo que la sesión deja pendiente, con dueño

1. **Panel de acceso a los no noticiosos en el inicio** — decidido que existirá,
   decidido que **todavía no se construye**. Espera al frente estético de Jose.
2. ~~**`bias: null` de verdad** para el trío y RTVC~~ — **HECHO el 2026-09-18**,
   con los doce consumidores decididos uno a uno. La entrada completa, abajo en
   CERRADO. **Deja una tarea que NO es de código y es de Jose: correr
   `npm run db:migrate` contra producción ANTES de fusionar** — la columna
   `sources.bias` es `NOT NULL` en la base que está corriendo.
3. ~~**El motor manda `summary`**~~ (decisión 8) — **HECHO el 2026-09-16**, con
   su prueba de ida y vuelta en el contrato de historia.

> Del lado de compartir: **Jose ya comprobó en vivo** que la tarjeta en X sale
> con su imagen (la caché cedió con la URL versionada) y que WhatsApp lleva el
> texto del reparto. Los pasos 3 y 4 de esa entrada quedan HECHOS el 2026-09-16.

---

## 2026-09-16 · Los internacionales sin ingesta: dos entran, y los de inglés esperan una decisión (ABIERTA LA DECISIÓN)

A petición de Jose («integremos nuevos medios»), se revisaron los siete medios
del catálogo que seguían sin feed de ingesta, con la herramienta de la casa
(`npm run feed:descubrir`) y sondeo manual el 2026-09-16.

### Entraron dos, y ya están en el aire

> **Fusionado a `main` el mismo día (PR #35)** y comprobado en producción: motor
> y bundle sirven la huella nueva `43dc5ac4296b` con 77 feeds, y el primer ciclo
> trajo 15 piezas de cada uno — al tope del techo por ciclo. De paso, **el aviso
> de desfase hizo su primer ciclo de vida real**: encendido con razón en el
> preview (77 contra 75), apagado solo al desplegar.

| Medio | Vía | Estado al probarlo |
|---|---|---|
| La Vanguardia | directa, `rss/home.xml` — el que su HTML declara | 145 ítems, el último de hace 0 h |
| CNN en Español | Google News, como EFE: no publica RSS por ninguna de las tres vías | 100 ítems, el último de hace minutos |

El catálogo pasa de 75 a 77 feeds. La CSP los admite (`img-src`, y su prueba
lo vigila), los documentos derivados están regenerados, y las razones de cada
vía están donde la casa las guarda: en el comentario del registro.

### La decisión abierta: NYT, FT y Reuters publican en inglés

**El feed no es el obstáculo; el idioma sí.** El agrupamiento compara
titulares con coseno TF-IDF sobre un corpus en español (`shared/sucesos.js`):
un titular en inglés no comparte tokens con la cobertura nacional del mismo
hecho, así que cada pieza entraría como historia aislada de un solo medio —
ruido en portada sin lo único que se les pide, que es verse **junto a** la
cobertura colombiana del hecho.

Lo comprobado el 2026-09-16, anotado también en el registro para no repetir
la búsqueda: NYT tiene vivo su feed de Américas (su edición en español cerró
en 2019); FT tiene dos feeds vivos; Reuters no publica RSS desde 2020 y su
sitio responde 401 a clientes que no son navegador, así que ni con decisión
habría hoy vía directa. **WSJ es caso aparte: su RSS existe pero está
congelado en enero de 2025 — un feed parado no es un feed.**

**Las opciones, de menos a más trabajo:** (1) quedan como cita sin ingesta y
la metodología lo dice; (2) se ingieren aceptando que agrupan solos — y es
medible: contar cuántas historias de un solo medio añaden a portada; (3) una
capa de equivalencia de titulares entre idiomas antes del agrupamiento, que
es motor nuevo. **DECIDIDO el 2026-09-16 (sesión de decisiones): la 3 —
esperan a esa capa.** Hasta entonces siguen como cita, y los datos de sus
feeds quedan en el registro para el día que llegue.

El séptimo sin feed es El Manduco, y ese está fuera **a propósito** (decisión
del 2026-09-02, PR #18): no se toca.

---

## 2026-09-15 · Compartir desde la tarjeta, y el diálogo que solo fallaba al pulsarlo (EN RAMA)

Rama `compartir/desde-la-tarjeta`. **No está en `main`**: espera mirada sobre el
preview, que es el procedimiento.

### El botón ya existía, y lo que no existía era todo lo demás

`ShareModal` llevaba meses publicado en la página de la noticia. Lo que faltaba
era compartir **sin entrar**, que es donde se comparte. Ahora lo llevan la
tarjeta del feed, la destacada y las tres laterales — catorce botones en la
portada. El `MobileSidebar` se deja fuera a propósito: es una lista de enlaces de
navegación, y un botón por línea la convierte en otra cosa.

### El defecto que ninguna prueba podía ver

El velo del diálogo es `position: fixed` con las cuatro esquinas a cero. Colgado
de la tarjeta **no cubría la pantalla**: se encajaba dentro de la tarjeta.

> **La causa no se ve leyendo el componente.** Si un ancestro tiene `transform`,
> el navegador posiciona el «fijo» respecto a ESE ancestro. Y
> `.news-card:hover` lleva `transform: translateY(-2px)`.

Y de ahí sale lo peor: como el `transform` solo existe **mientras el puntero está
encima**, fallaba exactamente cuando alguien pulsa el botón, y no cuando se
comprueba sin pasar por encima. Lint, `tsc` y 872 pruebas en verde con el fallo
dentro. Lo cazó abrir la captura. Arreglado con `createPortal` a `document.body`,
y hay prueba de que el portal siga puesto.

### Y una falsa alarma del propio vigilante, que conviene conocer

La primera pasada de `npm run mirar` dijo **«0 tarjetas en la portada»** y no era
verdad: Vite reoptimiza las dependencias cuando aparecen ficheros nuevos y fuerza
un recargue, así que la comprobación miró una página a medio cargar. Comprobado
con el navegador a mano —10 tarjetas, 14 botones, cero errores de consola— y
confirmado después con `mirar` en 20/20. **Si `mirar` falla en la primera pasada
tras crear ficheros nuevos, conviene repetirla antes de creerla.**

### Lo que se arregló de camino, y es lo que más viaja

`server/ssr/metadatos.js` decía **«de centro»** mientras el sitio entero dice
«orientación mixta» — la barra de cada tarjeta, la página de clasificación, el
aviso de desequilibrio—. Y esa frase es la `og:description`: **el texto que va en
cada enlace compartido y el que lee Google**. El renombrado se quedó a medias
justo en el sitio que sale del sitio.

Ahora las bandas se nombran en `shared/repartoDeCobertura.js` y de ahí beben los
tres consumidores. Hay una prueba que pone el texto del servidor y el del cliente
uno al lado del otro: si vuelven a separarse, falla.

También se retiró **«Cobertura contrastada»** del texto que se comparte y
**«Cobertura periodística contrastada»** de la descripción de respaldo. Es el
mismo adjetivo de virtud que se quitó del `twitter:title` el 2026-09-01, y había
vuelto a entrar por la puerta de atrás.

### Decidido con Jose el 2026-09-15

| | |
|---|---|
| Qué texto viaja | **El reparto por espectro.** Es el dato que nadie más puede dar y no afirma ninguna virtud |
| Dónde va el botón | **En todas las tarjetas** |
| WhatsApp | **Sí**, y primero: es el canal del país. Enlace `wa.me`, no SDK — la CSP es `script-src 'self'` |
| `utm_*` | **No, todavía.** Sin analítica no miden nada, y la analítica es decisión abierta |

### La tarjeta en X salía sin imagen, y la culpa era de la caché de X (2026-09-16)

Jose lo vio al probar: la página bien, y la tarjeta compartida en X **sin
imagen**. El servidor estaba impecable —se midió ese día: metadatos correctos
en portada y noticia, `og-image.png` en 200 y 51 KB también para `Twitterbot`,
SSR en 381 ms, sin `X-Robots-Tag`—. La causa es que **X guarda su veredicto por
URL durante días**: la tarjeta se reemplazó el 01-09 (del rectángulo de 3,6 KB
a la tarjeta real) conservando el nombre, y X siguió sirviendo el veredicto de
la vieja. Su validador de tarjetas ya no existe para forzar el refresco.

El remedio es el estándar: **la URL de la imagen lleva versión**
(`og-image.png?v=20260901`) en los tres sitios que la nombran —`index.html`,
`server/ssr/metadatos.js`, `server/ssr/paginasEstaticas.js`— y la prueba de
metadatos la exige. Si `og:generar` reescribe la tarjeta, la versión sube.
Queda en esta misma rama.

### Lo que falta

1. Mirar el preview de Vercel y aprobarlo.
2. Fusionar.
3. **Comprobar una tarjeta real en WhatsApp** una vez publicado: es lo único que
   no se puede verificar desde aquí.
4. **Reintentar la tarjeta en X un rato después del despliegue** — con la URL
   versionada X la trata como imagen nueva; si aun así no la trae, el
   diagnóstico de arriba queda invalidado y hay que volver a mirar.

---

## 2026-09-22 · Primera tanda de firma (M1.1): decidida, y en espera de la revisión externa (ABIERTO)

Jose decidió los números con cada ficha delante. El detalle está en
`DECISIONES.md` (2026-09-22) y en cada ficha. **No hay nada firmado ni se tocó
el registro**: lo que el sitio muestra cambia al firmar.

| Medio | Lo que va a revisión | Pregunta para el revisor |
|---|---|---|
| Semanario VOZ | −0,80, con la magnitud declarada como juicio | — |
| Colombia Informa | −0,55 (dictado el 16-09); re-medición a mediados de octubre | — |
| Semana | **+0,70**, banda Derecha (hoy +0,45) | Confirmar o refutar que Semana difundió **133 videos** de campaña sin marcarlos |
| El Nuevo Siglo | +0,55, ficha nueva: su justificación era historia | ¿Existe hoy un vínculo orgánico con el Partido Conservador? |
| El Colombiano | +0,35, reabierta como réplica; la firma sigue en pie | ¿Qué lo separa hoy de El Nuevo Siglo? |

**Lo que falta, en orden:**
1. **Jose pega los cinco envíos en Kimi K3**, con búsqueda web y una
   conversación por medio. **Se aplazó el 2026-09-22 por decisión suya.** Los
   envíos se regeneran ese día con `npm run envio -- <medio>`: no valen los de
   hoy, porque son una foto con fecha.
2. Se comprueban sus fuentes y se escribe la tabla de objeciones de cada ficha.
3. Jose firma: `reviewedAt` en el registro y ☑ en la ficha.

**Ojo con Tania Gilinski Bacal**, nombrada embajadora en Israel el 21-09. Hay
que confirmar su parentesco con el dueño de Semana antes de escribirlo en
`mediaOwnership.js`.

---

## 2026-09-22 · El estado real, vuelto a medir, y el plan del MVP (ABIERTO)

Jose pidió revisar el estado del proyecto, poner al día las tablas de
implementación y escribir un plan a mediano plazo para lanzar el MVP. Las
tablas de `PLAN_PRODUCTO_FINAL.md` llevan ahora una columna «Estado al 22-09»;
`ROADMAP.txt` queda congelado como histórico, con el estado real al principio y
una nota bajo cada tarea abierta; y el plan nuevo es
**`doblefoco-app/PLAN_LANZAMIENTO_MVP.md`**. Todo se comprobó contra
`origin/main` (`ab60db4`), el código, `gh` y `/api/health`, no contra esta
minuta.

### Dos cosas que no estaban anotadas en ningún sitio

1. **El desfase ha vuelto, y va a volver cada semana.** Issue #38, abierto
   desde el 2026-09-17; `desfase.yml` falla a diario desde entonces. Fly sirve
   `1c892be` y `main` está en `ab60db4`. **La causa es estructural:** los
   commits de `github-actions[bot]` de la auditoría (jueves) y del centinela
   (lunes) tocan `auditoria/*.json` y `centinela/estado.json`, que entran en la
   imagen, y no disparan `desplegar-motor.yml`. El vigilante tiene razón y el
   arreglo no es callarlo. Es **M0.1** del plan.
   **Arreglo en la PR #40, el mismo día.** Esos JSON sí llegan a la imagen: el
   panel los importa y Vite los mete en `dist/`, así que perdonarlos en
   `rutasDeLaImagen.js` habría sido mentir. En su lugar, tras su `git push`,
   los dos flujos lanzan `desplegar-motor.yml` por `workflow_dispatch`, la
   excepción que GitHub deja pasar con `GITHUB_TOKEN`.
   **(a) Hecho el 2026-09-22:** Jose fusionó la #40 (`adc9d57`) y lanzó a mano
   un despliegue forzado. Fly pasó a servir `adc9d57` con 77/77 feeds, y
   `desfase.yml`, lanzado a mano, salió en verde y cerró solo el #38.
   **Queda por hacer:** (b) comprobar que se lanza sola el jueves 24-09, con la
   auditoría, y el lunes 28-09, con el centinela.
2. **Vorágine volvió a `abierto`/roto** en la pasada del 17-09, con 222 h sin
   pieza. Había pasado a `resuelto` el 03-09. Su `revisarEl` sigue siendo el
   1 de octubre. Es **M2.2**.

### Y dos cifras que conviene tener a mano

- Del plan anterior, **21 de 29 filas están cerradas**. De la lista de cierre
  se cumplen 3 de 6, una a medias y dos no.
- **Fichas: 65; firmadas, 5**, todas del 18-08 y ninguna de izquierda. Lo
  dictado el 16-09 sigue sin `reviewedAt`.

### Lo que falta, con dueño

El orden y las fechas están en el plan. Las fechas son una propuesta: puerta el
27 de octubre y lanzamiento público el 10 de noviembre. **Nada de eso está
aprobado todavía.**

---

## 2026-09-09 · Las siete ramas, verificadas juntas — y una prueba que solo falla junta (ABIERTO)

Se armó `integracion/tanda-del-8-de-septiembre` desde `main` y se fusionaron las
siete en el orden que dejó escrito el traspaso del 08-09: **#24 → #28 → #29**
encadenadas, y **#25, #26, #27 y #30** sueltas. Es el procedimiento del
2026-08-21 —fusionar a una rama de integración, verificar el resultado **junto**
y no rama por rama—, y esta vez el procedimiento se pagó solo.

### La prueba que solo falla junta

**`archivo.test.js`, la red que trae la #24, cazó a `expedienteDeMedio.mjs`, que
trae la #30.** Por separado las dos ramas están en verde; juntas, no. La red
barre todo `server/` y `scripts/` buscando consultas que lean `stories` sin
filtrar lo archivado ni declararlo, y el expediente tiene una: el denominador de
la elevación.

**La respuesta correcta no era filtrarla, era declararla.** Ese denominador
cuenta todas las historias porque el numerador también las cuenta todas: una
ficha mide **treinta días de conducta**, no la portada de hoy. Filtrar solo el
denominador le daría el doble de elevación a un medio con la mitad de sus
historias congeladas, que es un artefacto de la fecha en que se corrió el
expediente y no un hecho sobre el medio.

> **Y el arreglo se llevó a la rama de la #30 (`a99e283`), no solo a la de
> integración.** Si se fusionan una detrás de otra sin él, `main` se queda en
> rojo aunque las dos PR pasen por separado. Es la trampa exacta de fusionar en
> cadena sin probar el resultado.

### Los conflictos fueron tres, y ninguno de código

| Fichero | Qué pasaba | Cómo se resolvió |
|---|---|---|
| `MINUTA.md` (×2) | Dos entradas nuevas al principio de la misma sección | Se quedan las dos |
| `SIGUIENTE.md` | Dos versiones del **mismo** traspaso del mismo día | Se queda la de seis PR, que es posterior y cubre a la otra |
| `package.json` | Dos entradas distintas de `scripts` en la misma línea | Se quedan las dos, con la sangría alineada |

### Verificado sobre el resultado fusionado

Lint limpio · `tsc` sin errores · **828/828 pruebas** · build correcto ·
`check:comentarios` y `check:registry` en verde · **7/7 invariantes** contra
producción.

**Y sí se ha mirado**, que es la parte que faltaba: `npm run mirar` sobre las
diez páginas de escritorio con la rama montada. `/transparencia/sobre-nosotros`
responde —era el 404 que arregla la #26— y la portada sale entera. Lo que sigue
sin verificarse es el motor: la rama no está desplegada en Fly.

### Y mirar de verdad destapó que el que mira no mira

**`npm run mirar` dijo «Nada que reprochar a lo que se ve» sobre una portada
completamente vacía.** Cero historias, los esqueletos de carga sin resolver,
«Mostrando 0 de 0 cargadas», y aun así las diez páginas salieron con su ✓.

La causa inmediata es local y no del repositorio: este `.env.local` lleva
`VITE_API_URL=http://localhost:5000`, un puerto donde no hay nada, mientras
`.env.example` dice `same-origin` y la cabecera de `vite.config.js` dice que la
variable **tiene que quedar vacía** para que el proxy de desarrollo funcione.
Corriendo `VITE_API_URL=same-origin npm run mirar` la portada se llena.

> **Pero el defecto que importa no es ese, es el otro:** el ritual que este
> proyecto usa antes de publicar **no distingue una portada llena de una vacía**.
> Es la enfermedad de siempre —un vigilante que no puede fallar— y esta vez le
> tocaba al que se supone que mira. Queda **ABIERTO** en la lista de abajo.

---

## 2026-09-09 · Lo que queda pendiente, en una sola lista

Escrito a petición de Jose, para que no haya que reconstruirlo leyendo la minuta
entera. Lo que no está aquí no está pendiente: está olvidado.

> **Puesta al día del 2026-09-09, al cerrar la jornada.** Se cerraron **ocho
> puntos de código** —13, 14, 15, 16, 17, 18, 19 y 20— y se abrieron dos, el 25 y
> el 26. **Con eso la parte de código de esta lista queda vacía**: todo lo que
> sigue abierto o es un gesto de Jose, o es una decisión editorial, o tiene fecha.
> Los ocho van dentro de `integracion/tanda-del-8-de-septiembre` (PR #32), junto
> con las siete PR originales, y **nada de eso está en el aire hasta que se
> fusione**, que es el punto 1.

> **Puesta al día del 2026-09-10.** Se cerró el **punto 26** —el resumen que es
> el titular repetido—, que sale en la rama
> `resumen/el-titular-repetido-no-es-resumen`, hija de la de integración porque
> toca la firma del gestor del punto 16. **De código solo queda abierto el 25**,
> y ese espera a que el corpus tenga las marcas de opinión, o sea a la fusión y
> a unos días de ciclo. El punto 1 sigue siendo el que desbloquea todo.

> **Puesta al día del 2026-09-15.** **El punto 1 está hecho: la tanda entró a
> `main`** —#33 al escalón intermedio, luego #32 de una sola fusión— y con ella
> los dos despliegues salieron solos. **Y la lista del día del despliegue se
> ejecutó entera el mismo día**: 10, 11, 11b, 12 y 12b. De los gestos de Jose
> quedan el 2 y el 3; de código sigue abierto solo el 25, que ya no espera a la
> fusión sino a unos días de ciclo con las marcas de opinión puestas.

### Gestos que solo puede hacer Jose

| | Qué | Desde |
|---|---|---|
| 1 | ~~**Fusionar**~~ · **HECHO el 2026-09-15.** La vía recomendada resultó ser la buena: #33 a la rama de integración y una sola fusión de esta a `main` (`d6deb1c`). Cinco PR se cerraron solas; la #28 y la #29 hubo que cerrarlas a mano porque iban encadenadas | 2026-09-08 |
| 2 | **Issue #4 del centinela** | 2026-09-02 |
| 3 | ~~**Sacar el repositorio de OneDrive**~~ · **DECIDIDO el 2026-09-16: se queda.** Jose lo prefiere dentro como copia extra («para evitar perder el proyecto»), y el riesgo señalado —locks de la sincronización sobre `.git`— se asume con receta: si git falla con `index.lock` o «unable to write», pausar OneDrive y reintentar, no reparar nada | 2026-09-01 |

### Decisiones editoriales medidas y esperando firma

| | Qué se decide | Dónde está la evidencia |
|---|---|---|
**Las seis se dictaron el 2026-09-16, en una sola sesión** — el detalle, en la
entrada «La sesión de decisiones» de ese día:

| 4 | ~~Colombia Informa~~ · **DECIDIDO: baja a −0,55**, re-medición con un mes sin catástrofe | `fichas/colombia-informa.md` |
| 5 | ~~El trío~~ · **DECIDIDO: tipo «no noticioso»**, fuera del mapa, «sin medir» | `fichas/voragine.md` |
| 6 | ~~RTVC~~ · **DECIDIDO: «sin medir»**, re-medición a principios de octubre | `fichas/rtvc.md` |
| 7 | ~~Razón Pública~~ · **DECIDIDO: es «no noticioso»** — entra al agrupamiento, no al mapa | `MINUTA.md`, 2026-09-08 |
| 8 | ~~El buscador~~ · **DECIDIDO: el motor manda el resumen** (snippet acreditado) | `MINUTA.md`, 2026-09-08 |
| 9 | ~~W Radio~~ · **DECIDIDO: `revisarEl` 2026-10-13** — y el hallazgo: dejó de publicar texto ~01-09 | `auditoria/hallazgos.json` |

### A ejecutar el día del despliegue, en este orden

| | Qué | Por qué no antes |
|---|---|---|
| 10 | ~~`npm run archivo:huerfanas`~~ · **HECHO el 2026-09-15**: no eran 1 554 sino **3 392 de 4 253**, porque el criterio viejo siguió sellando seis días más. La proporción no cambió (79 % el 08-09, 80 % hoy), que es lo que dice que el diagnóstico era correcto y solo se aplazó | Antes de que Fly sirva la #24, el ciclo vuelve a llenar el archivo con el criterio viejo |
| 11 | ~~Mirar una línea del ciclo~~ · **HECHO**: `6367 hist. (620 escritas)`. Las dos cifras ya no son iguales, así que el `WHERE` filtra | Es la prueba de que H4 funcionó, y se lee sola |
| 11b | ~~`enlaces +N −M`~~ · **HECHO**: `enlaces +676 −122`, un orden por debajo de los 7 500 que habrían delatado el borrado entero. Y es el ciclo de **arranque**, el que más escribe | Misma idea, para la otra mitad de H4 |
| 12 | ~~Abrir el sitio y correr `npm run mirar`~~ · **HECHO**: 10/10 rutas de escritorio en verde con `VITE_API_URL=same-origin`, `/transparencia/sobre-nosotros` incluida, y **mirada la captura**: la portada sale llena, con destacado de 22 medios. El sitio publicado responde 200 en las seis rutas | Nadie lo ha mirado con todo desplegado. En local está en verde, pero el motor de la rama no está en Fly |
| 12b | ~~`npm run db:contrato`~~ · **HECHO**: el artículo baja y vuelve entero, `feedCategories` incluido, y deja `ROLLBACK` | La ida y vuelta del artículo contra la base. No hace falta antes, pero es lo que caza un SQL roto sin esperar a que falle una ingesta |

> **La migración YA está aplicada** (`npm run db:migrate`, 2026-09-09), y el orden
> importaba: los dos despliegues salen solos con el push a `main`, así que si el
> motor nuevo hubiera arrancado antes que la columna `feed_categories`,
> `persistArticles` habría fallado en cada ciclo y en silencio.

### Código, sin orden obligado

**Los ocho puntos de código de esta lista se cerraron el 2026-09-09** —13, 14,
15, 16, 17, 18, 19 y 20—, cada uno con su entrada en CERRADO y su número. Lo que
queda abierto de código es lo que abrió ese mismo trabajo:

| | Qué |
|---|---|
| 25 | **Volver a medir el aislamiento de los seis medios de izquierda de raíz plana** cuando sus marcas de opinión hayan entrado. Es lo que invalidaba su nivel 2, y hasta que el corpus esté marcado la cifra vieja sigue sin valer. **Desde el 2026-09-15 ya no espera a la fusión: el motor que pone las marcas está sirviendo, así que lo único que falta es ciclo.** **MEDIDO el 2026-09-23**, solo sobre las piezas desde el 15-09, cuando el 100 % ya trae etiqueta del feed. El filtro los ve: Las2Orillas 29 de 122 son opinión, Razón Pública 5 de 18, VOZ 5 de 26, Volcánicas 1 de 10. **Ninguna pieza de opinión entra en una historia.** En aislamiento frente a pares de volumen parecido: **Las2Orillas sigue aislada** (14 % de historias compartidas y 6 socios, frente a 66 % y 31), así que es su agenda y no nuestro filtro. **VOZ ya no sale aislada** (33 % y 2 socios, frente a 27 % y 3), y eso debilita uno de los dos pilares del −0,80 decidido el 22-09; está escrito en su CONTRA, **para que Jose lo vea antes de firmar**. Razón Pública y Volcánicas comparten como sus pares o más. Colombia Informa y Cuestión Pública tienen muestras mínimas (3 y 0 historias). **Muestra de 8 días: repetir sobre el mes entero hacia el 15 de octubre**, cuando las piezas sin etiqueta salgan de la ventana |
| 27 | **El aviso `⚠ RECORTADA POR EL TECHO` parpadea.** Salta cuando la ventana efectiva baja de 71 h, y el 2026-09-15 los ciclos iban entre **70,4 y 71,9 h**: se enciende y se apaga solo. No es el estrechamiento a ~62 h para el que se escribió —ese sí importaba—, es el margen de una hora quedándose corto. **Un vigilante que parpadea se ignora, y entonces sobra**, que es la regla que este proyecto ya se aplicó a `mirar` en el CI. O el umbral se mueve donde signifique algo, o el aviso pasa a la serie y deja de gritar en cada ciclo. **CORREGIDO EL DIAGNÓSTICO el 2026-09-22: no parpadeaba, el techo muerde siempre.** El corpus del motor estuvo en **8 000 artículos, el techo exacto, en los 48 ciclos del 15-09**, y en el techo desde el **2026-08-13**. La base tiene **11 326 artículos publicados en las últimas 72 h**, y el motor agrupa 8 000: **cerca del 29 % de la ventana declarada queda fuera del agrupamiento**. La ventana efectiva baja hasta **64,8 h**; Infobae pone 4 944 de los 11 326. El aviso ahora cuenta lo que expulsa el techo (`desalojadosPorTecho`, PR del 22-09) en vez de comparar edades. **Lo que queda abierto es una decisión, y cuesta**: subir `MAX_ARTICLES` (el ciclo ya tarda 55 s de media y 88 s como máximo, frente a 19 s con 5 000, y el worker tiene 512 MB), bajar el techo de Infobae, o declarar en `/transparencia` que la ventana real es menor de 72 h. Es M0.4 del plan del MVP |
| 26 | ~~**El resumen que es el titular repetido más el usuario del gestor**~~ · **HECHO el 2026-09-10**: eran 1 018, la causa principal era Google News y no el gestor, y de paso apareció la firma de WordPress en español, que nadie quitaba. Entrada en CERRADO |

### Con fecha, y no dependen de nadie

| | Cuándo | Qué |
|---|---|---|
| 21 | **2 de octubre** | Medir el tamaño de la base (30 días de retención más Infobae con techo 60; si pasa de ~300 MB hay que decidir) y arrancar la regla por cadencia (3.9) con 30 días de serie |
| 22 | **1 de octubre** | Se revisa Vorágine: su hallazgo está `resuelto` con esa fecha de vuelta |
| 23 | **13 de octubre** | Caducan los `aceptado` de Telecaribe **y de W Radio** (este con hallazgo del 16-09: dejó de publicar texto; se comprueba si volvió a escribir) |
| 24 | **Diciembre** | Revisar la opción B del archivo permanente |
| 28 | **Principios de octubre** | Re-medir RTVC con ~30 días de su feed propio y contrastar la previsión del 08-08 (decisión 6 del 16-09) |
| 29 | **Mediados de octubre** | Re-medir Colombia Informa con un mes sin catástrofe en el corpus (decisión 4 del 16-09) |

## 2026-09-08 · El buscador dice buscar en el resumen, y el resumen no existe (ABIERTO)

**Lo encontró la prueba de ida y vuelta del contrato en su primera pasada**, que
es exactamente para lo que la revisión externa la pedía.

`componerHistoria` no manda `summary`. La interfaz lo lee en **seis sitios**:

- `CompactHeroGrid.jsx`, `NewsCard.jsx` y `NewsDetail.jsx` tienen un bloque
  `{story.summary && …}` que **no puede pintarse nunca**.
- **Y el buscador del sitio dice buscar dentro del resumen** —`Navbar.jsx` y
  `SearchResults.jsx` incluyen `summary` en lo que comparan— cuando en realidad
  solo busca en el titular. Nadie lo nota: la búsqueda funciona, solo que
  encuentra menos de lo que su código promete.

**No se arregló en la PR del contrato a propósito, porque no es un defecto de la
costura: es una decisión de producto.** Las dos salidas:

1. **Que el motor mande un resumen.** Y entonces hay que decidir de quién es ese
   texto. En este proyecto nunca es de la casa —«el titular de referencia no lo
   escribimos»—, así que el candidato natural es el `snippet` del artículo que
   pone el titular, con su medio al lado, igual que la imagen.
2. **Que la interfaz deje de prometerlo.** Se quitan los tres bloques muertos y
   el buscador dice lo que hace.

**DECIDIDO el 2026-09-16 (sesión de decisiones, punto 8): la 1.** El motor
manda `summary` — el `snippet` literal del artículo que pone el titular, sin
caída a otra pieza, o null si esa no trae entradilla. El contrato de historia
lo lleva como `copia` con su motivo, los tres bloques muertos se pintan por
fin, y el buscador hace lo que promete. En la rama de la sesión.
## 2026-09-09 · Tercera tanda: la izquierda queda cubierta, y la herramienta contaba de más (ABIERTO)

Colombia Informa, Vorágine y RTVC. **Con estas tres, los nueve medios de
izquierda que estaban sin ficha desde el 2026-08-26 ya tienen expediente.** La
banda pasa de las **3 fichas de 14 medios** que se midieron aquel día a **12 de
13**, y el único que queda sin ficha es The New York Times, que es internacional.

| Ficha | Propuesta | Por qué |
|---|---|---|
| `colombia-informa.md` | **FIRMAR −0,65** | Es la segunda de la banda cuyo número no es una colocación relativa: el medio declara su posición hoy —«agencia de comunicación de los pueblos», articulada con la ALBA de los Movimientos Sociales— y el léxico de sus titulares la acompaña |
| `voragine.md` | **no firmar** | Su nivel 2 no es débil: es inexistente, y una parte medible de la ausencia es nuestra |
| `rtvc.md` | **no firmar, y el −0,35 está caducado** | Lo dice su propia ficha de propiedad, no esta |

### Colombia Informa es la primera propuesta de firma desde Semanario VOZ

Y el argumento tiene la misma forma con un escalón menos: en VOZ la posición
está en la **propiedad** —el partido que lo posee—, aquí está en la **misión
declarada**, que es nivel 4. Sostiene la banda con firmeza y la magnitud peor, y
la ficha lo dice en su CONTRA en vez de esconderlo.

**La decisión es de banda, no de decimales:** la frontera está en −0,60, así que
firmar −0,65 o bajar a −0,55 son dos cosas distintas y las dos son defendibles.
Lo que no lo es —y es lo único que la ficha descarta— es dejarlo en −0,65 sin
decir cuál de las dos se hizo.

**Un aviso sobre esa ficha, porque el número engaña y el confusor está al lado:**
el expediente le da **7 socios de cobertura**, más que casi todos los de su
volumen. Comprobado historia por historia, **los siete salen de UNA historia** —el
asesinato de dos líderes sociales en Cajibío, que cubrieron ocho medios— y esa
historia ya está archivada. Las otras tres son de fuente única. No participa de
la conversación general: coincidió una vez.

### La pregunta del trío, que dejó abierta la ficha de Revista RAYA, tiene respuesta

Se preguntaba si Vorágine (−0,50), Cuestión Pública (−0,45) y Revista RAYA
(−0,55) pueden llevar tres números distintos sin nada que los separe. Medido ya
el tercero: **el que está en medio es el que menos evidencia tiene de los tres.**
Vorágine aporta 5 piezas, de las cuales una es un cómic en inglés y otra la
convocatoria a un taller. **Quedan tres reportajes**, y sobre tres reportajes no
se afirma una línea.

Las tres salidas están escritas en `fichas/voragine.md` con su precio. La que
menos inventa es marcar las tres «sin medir», como ya se hizo con el
`factuality: null` de los nueve regionales.

### RTVC es la ficha que la regla del polo fijo tenía calendarizada, y la cita no se pudo cumplir

El protocolo escribió que «la transición de agosto de 2026 es la ocasión más
limpia que va a tener este catálogo en años». Un mes después: **6 piezas, ninguna
de política, y la última del 2026-09-01**. Sus tres historias están archivadas,
así que **hoy el medio público no aparece por ninguna parte del sitio.**

La previsión que Jose dejó escrita el 2026-08-08 —que el medio pasaría a cubrir
desde una posición oficialista con el nuevo gobierno— **no se puede ni confirmar
ni desmentir**, y no por culpa del medio: entra por Google News, que rinde unas
ocho veces menos, y su `rss.xml` propio sigue abandonado. Antes de darlo por
callado hay que probarle otra ruta, como enseñó Cambio.

**La tensión que hay que resolver, y es de Jose:** la regla 3 dice «sin evidencia
de nivel 1-3 no se mueve el número» y la ficha de propiedad dice «esto caduca el
7 de agosto». Las dos no pueden tener razón a la vez. Tres salidas, en la ficha.
La que propone es marcarlo **sin medir**.

**Y falta un nivel 1 que sí se puede tener hoy: quién lo dirige.** El período
presidencial terminó el 7 de agosto y la ficha no nombra al director actual. El
catálogo nombra a los accionistas de los grandes; callar a quien dirige el medio
público sería escrutinio desigual.

### HALLAZGO · El expediente contaba artículos de más, y ya está corregido

`expedienteDeMedio.mjs` usaba `count(*)` sobre un `LEFT JOIN` con
`story_articles`, que devuelve **una fila por cada historia en la que el artículo
aparece**. Y un artículo aparece en varias: el agrupamiento se rehace en cada
ciclo y las historias que envejecen **se congelan en vez de borrarse**, así que
una misma pieza queda dentro de la historia archivada de ayer y de la de hoy.

**Lo primero que había que comprobar, y salió bien:** de los **1 589 artículos del
corpus que están en más de una historia, NINGUNO está en más de una historia
VIVA**. Eso habría sido un defecto del producto —la misma pieza contada dos veces
en portada— y no lo es: es el archivo funcionando como se diseñó.

Inflación medida el 2026-09-09, y no es despreciable:

| Medio | Limpio | Con el conteo viejo | |
|---|---:|---:|---:|
| RTVC | 6 | 7 | **+16,7 %** |
| Cuestión Pública | 7 | 8 | **+14,3 %** |
| Vanguardia | 737 | 810 | +9,9 % |
| Cambio | 398 | 435 | +9,3 % |
| El Espectador | 1 398 | 1 441 | +3,1 % |
| Las2Orillas | 186 | 189 | +1,6 % |

**Consecuencia sobre lo ya escrito:** las cifras de artículos y de cadencia de la
primera y la segunda tanda salieron del conteo viejo. Semanario VOZ, Razón
Pública y Revista RAYA no se mueven —su inflación es cero—; **Cambio, Las2Orillas
y Cuestión Pública sí**, y llevan ya la nota. Al firmar cualquiera de ellas hay
que volver a correr el expediente, que además mide sobre un corpus distinto.

De paso, el expediente ahora dice **cuántas de esas historias siguen vivas**, que
en RTVC era la diferencia entre «entra en 3 historias» y «no está en el sitio».

### HALLAZGO · Vorágine es el medio peor clasificado del corpus, y hay una causa concreta

**5 de 5 piezas sin tema, el 100 %**, contra el 39,9 % del corpus. Es el primero
de la lista, por delante de La Patria (88,2 %) y El Morichal (75 %).

La causa se puede señalar con el dedo: el clasificador lee titular y resumen, y
**dos de sus cinco resúmenes son la plantilla de WordPress** —«The post … appeared
first on Voragine.»—, es decir, el titular repetido en inglés y nada más. Un
tercero es la nota de financiación del patrocinador, también en inglés.

**Tamaño real, para no inflarlo:** esa plantilla aparece en **8 piezas de todo el
corpus** —6 de Chocó 7 Días y 2 de Vorágine— y **las 8 están sin tema**. Es
diminuto y con puntería: cero excepciones. Arreglarlo es descartar ese resumen
cuando encaja con el patrón, para que el clasificador se quede con el titular en
vez de con ruido en otro idioma.

Y hay un segundo tapón, más ancho: **la categoría declarada del feed se estampa
en bloque**. Las cinco piezas de Vorágine entran como «Judicial», incluidos el
cómic y la convocatoria del taller. No clasifica; solo tapa.

> **Es la misma enfermedad que la ruta plana** —2,5 puntos de clasificación
> temática en los regionales, y el filtro de opinión ciego para 22 medios—: el
> sistema falla siempre del mismo lado, el de los medios pequeños, y los pequeños
> de este catálogo son casi todos de la banda peor documentada. **ABIERTO.**

## 2026-09-08 · Segunda tanda de fichas, y una pregunta de catálogo que no es de ficha (ABIERTO)

Razón Pública, Cuestión Pública y Revista RAYA. **Ninguna se propone firmar**, y
los motivos son tres y distintos:

| Ficha | Por qué no |
|---|---|
| `razon-publica.md` | Todo lo que publica es análisis, y el filtro no puede verlo |
| `cuestion-publica.md` | Ocho piezas en treinta días: no hay nivel 2 |
| `revista-raya.md` | Ocho piezas, y su orden relativo con Vorágine y Cuestión Pública no está medido |

### Lo nuevo, y no es de ficha: hay opinión sirviéndose como cobertura

**Razón Pública es el caso extremo del filtro ciego, y lo enseña sin discusión.**
Sus siete titulares del 7 y 8 de septiembre son siete análisis, y **uno es
literalmente una caricatura** —«Caricatura Muertos en bolsas Abelardo»—, que es
una de las tres cosas que `detectarOpinion` nombra por su nombre.

Publica en la raíz, así que el filtro no ve ninguna. **Y 15 de sus historias
están hoy en el feed como si fueran cobertura.**

Comprobado el mismo día contra el corpus: de las **631 piezas** que el filtro ha
marcado como opinión, **cero están dentro de una historia** —funciona
exactamente como promete— y **cero son de los seis medios de raíz plana**, que
entre ellos tienen **96 de sus 267 artículos dentro de historias**.

> **LA PREGUNTA ES DE CATÁLOGO Y ES DE JOSE:** ¿un medio cuyo contenido es
> íntegramente análisis debe entrar al agrupamiento de noticias? Si la respuesta
> es no, la salida no es bajarle el número: es lo que ya se hizo con El Manduco
> por otra razón —se le retira el feed y se queda como medio de referencia, con
> su ficha y su sitio en el mapa—. Eso no es silenciar a nadie: es no presentar
> una columna como cobertura.

### Y un hallazgo sobre nuestro propio catálogo, no sobre los medios

**Vorágine (−0,50), Cuestión Pública (−0,45) y Revista RAYA (−0,55) son el mismo
perfil**: fundación de periodistas, investigación, poco volumen, ninguna con
nivel 2 suficiente. Llevan tres números distintos y **nada de lo medido justifica
la distancia entre ellos**: el orden es una colocación nuestra dentro de nuestra
propia escala, como el −0,35 de Las2Orillas que se propuso «por comparación con
CasaMacondo».

O se mide lo que las separa, o se declara que el catálogo no distingue entre
ellas y llevan el mismo valor. Las dos son defendibles; tres decimales distintos
sin evidencia, no.

## 2026-09-08 · El filtro de opinión es ciego para 22 medios, y seis son de la izquierda (ABIERTO)

**Salió al preparar el nivel 2 de las fichas**, comprobando un confusor antes de
escribirlo en un CONTRA.

`detectarOpinion` es una **función pura de la URL** —tres expresiones sobre la
ruta— y eso se eligió a propósito: no analizar el texto de la pieza es una
decisión escrita del proyecto, y una revisión externa la señaló como acierto.
El precio es que **un medio cuyas URL no digan de qué sección es queda fuera del
filtro**, y sus columnas entran al agrupamiento sin marcar.

> **CÓMO FUNCIONA DE VERDAD, porque la primera versión de esta entrada lo dijo
> mal.** La opinión NO se filtra al entrar: los artículos de opinión se guardan
> en `articles` como los demás —el `opinion` se deriva de la URL— y de lo que se
> excluye es del AGRUPAMIENTO. Medido el 2026-09-08: **631 piezas del corpus
> están marcadas como opinión y CERO de ellas está dentro de una historia.** El
> filtro funciona exactamente como promete, para quien puede ver.

El registro ya lo anotaba **para Las2Orillas**, con la frase «queda MEDIDO como
riesgo, no descubierto después». Lo que no estaba medido es el tamaño:

> **22 de los 70 medios con datos publican en la raíz** —`medio.co/titulo`, sin
> sección—, y son **2 179 piezas, el 6,3 % del corpus**.

**Y el reparto no es neutro.** Seis de esos 22 son de la banda de izquierda:
Las2Orillas, Razón Pública, Semanario VOZ, Volcánicas, Colombia Informa y
Cuestión Pública.

**La cifra que lo dice todo:** de las 631 piezas de opinión que el filtro ha
marcado en el corpus, **cero son de esos seis medios** — y 96 de sus 267
artículos están dentro de una historia. No es que no publiquen opinión: Razón
Pública es una revista de análisis y el 08-09-2026 tenía una **caricatura** en el
corpus, que es una de las tres cosas que el filtro nombra por su nombre. Es que
no se la puede ver.

Comparación directa, del mismo día:

| Medio | Piezas | Opinión detectada | En historias |
|---|---:|---:|---:|
| El Espectador | 1 342 | 177 | 0 de las 177 |
| Vanguardia | 751 | 69 | 0 de las 69 |
| **Las2Orillas** | 177 | **0** | 59 |
| **Razón Pública** | 28 | **0** | 15 |
| **Semanario VOZ** | 27 | **0** | 7 |

Las consecuencias, en orden:

1. **Invalida el nivel 2 de esas seis fichas mientras no se separe.** El
   aislamiento medido —Las2Orillas coincide con 13 medios donde sus pares
   coinciden con 30— puede ser el filtro y no su agenda: una columna no coincide
   con la cobertura de nadie porque no cubre un hecho, opina sobre él.
2. **Toca la `q` del modelo de puntos ciegos.** La tasa de la izquierda se
   calcula sobre apariciones, y las de estos seis incluyen columnas que en los
   demás medios no cuentan. La tasa está inflada por una asimetría nuestra, en la
   banda que sostiene el modelo.
3. **Y es el mismo defecto que «regionales sin sección en la URL»**, que ya cuesta
   2,5 puntos de clasificación temática. La causa es una sola: la ruta plana.

**Lo que NO se propone:** analizar el texto de la pieza. Eso cambiaría una
decisión de diseño del proyecto entero por un problema de seis medios.

**Salidas posibles, sin decidir:** marcar la opinión por el feed —muchos medios
publican sus columnas en un feed aparte—, por la categoría declarada del ítem
RSS, o declarar el hueco en la metodología y descontar esos medios del cálculo de
la tasa. La tercera es la única que no requiere tocar la ingesta.

**Estado: ABIERTO.** Bloquea la firma de las fichas de Las2Orillas y —por lo
menos— de las otras cinco de raíz plana.

## 2026-09-08 · Las fichas de la izquierda: la herramienta y la primera tanda

**Decisión de Jose de hoy:** que yo prepare el expediente y él firme. La regla no
cambia —el número lo pone y lo firma Jose— pero el trabajo que no es juicio
—contar, comparar y citar— deja de costar una tarde por ficha.

**`npm run expediente -- --medio=<id>`** produce el nivel 2 que el protocolo pide
y que no producía nada: volumen y cadencia, temas contra la agenda común,
co-cobertura con elevación, aislamiento **con su confusor al lado** —un medio
pequeño coincide poco porque publica poco, y sin esa comparación la cifra
acusaría a los pequeños de ser raros— y sus titulares literales para leer.

**Lo primero que dijo, y no lo esperaba:** los nueve medios de izquierda sin
ficha **están publicando**, todos, con piezas de esta semana. El diagnóstico de
agosto —«5 de sus 13 medios aportan cero»— era de la ventana de 72 h; con los 30
días de retención el panorama es otro.

**Primera tanda, escrita y sin firmar:**

| Ficha | Propuesta | Por qué |
|---|---|---|
| `semanario-voz.md` | **firmar −0,80** | Único medio cuyo nivel 1 fija la orientación solo: es el órgano del PCC, que hoy lo posee. Cero socios de cobertura donde sus pares tienen entre 2 y 14 |
| `las2orillas.md` | **no firmar** | Su nivel 2 está contaminado por el filtro de opinión ciego (entrada de arriba) |
| `cambio.md` | **no firmar −0,40, y revisarlo hacia la mixta** | Ver abajo |

**Lo de Cambio es lo gordo de la tanda.** Es el medio con más peso de la banda
—381 de las ~644 piezas de toda la izquierda en el corpus— y la evidencia del
presente no sostiene su −0,40: fiscaliza a los dos gobiernos (lo que la regla del
polo fijo excluye expresamente como evidencia), no tiene agenda propia medible
—38 socios, la mediana de su volumen— y **sus siete socios de mayor elevación son
de la mixta o de la derecha, ninguno de la izquierda**: El Nuevo Siglo (+0,55) a
4,3×, La FM (+0,35) a 3,4×.

**Y eso mueve el modelo.** Si Cambio pasa a la mixta, la tasa base de la
izquierda baja de golpe y cambia qué historias se marcan como punto ciego. No es
motivo para dejar el número donde está: es motivo para no decidirlo deprisa y
para volver a medir la 3.2 el día que se firme.

## De la auditoría de integración del 2026-09-01

Pedida por Jose: una auditoría de la integración entre sistemas, con sus
hallazgos en `doblefoco-app/AUDITORIA_INTEGRACION_2026-09.md` y un plan que
sucede al de continuidad: `doblefoco-app/PLAN_PRODUCTO_FINAL.md`. Todo se
midió contra el sistema vivo. Lo nuevo que queda pendiente, con su código:

- **I-2 · El vigilante del desfase no abre issue** — es el único de los cinco
  sin timbre; su fallo del 31/08 no lo vio nadie y el desfase que acusaba (Fly
  en `2c82323`, main en `c872ddb`) sigue vivo. Copiarle el patrón de
  `vigilancia.yml`. **HECHO el 2026-09-01 en `integracion/etapa-0`**; además
  la cabecera de `comprobarDesfase.mjs` ya no afirma que «GitHub ya avisa»,
  porque el 31/08 demostró que no. Se cierra al fusionar.
- **I-3 · Los issues de los vigilantes no llegan a ninguna bandeja leída** — el
  del centinela lleva desde el 24/08 sin abrirse. Abrirlos con `--assignee`
  para que GitHub mande correo. **HECHO el 2026-09-01 en la rama**: los siete
  issues de vigilante (vigilancia, auditoría ×2, centinela ×2, copia, y los
  nuevos de desfase y archivo) se abren asignados.
- **I-4 · Nada avisa si la copia deja de CORRER** (el fallo sí avisa; la
  ausencia no). Hombre-muerto en la vigilancia: última ejecución exitosa de
  `backup.yml` con más de 48 h, se acusa. **HECHO el 2026-09-01 en la rama**,
  y cubre también `archivo.yml` —que resultó ser el ÚLTIMO flujo que escribe
  algo irreemplazable sin timbre propio: ahora abre issue al fallar, como la
  copia—.
- **I-5 · Configuración muerta que instruye:** `public/_headers` (CSP vieja,
  aún con unsplash; Vercel no lo lee), `public/_redirects` (catch-all que
  rompería el SSR en otro host) y `securityService.js` (cero imports, duda
  10). Borrar los tres y corregir el comentario de `.env.example` que manda
  mantenerlos. **HECHO el 2026-09-01 en la rama**: borrados los tres, y los
  comentarios de `.env.example` y `server/index.js` dicen ahora dónde vive la
  única CSP. También el `.env*` huérfano del `.gitignore` de la raíz.
- **I-6 · `api.doblefoco.co` está en la CSP y el DNS no existe.** Crear el
  CNAME (recomendado: despega al cliente del hostname de Fly) o retirarlo.
  **HECHO el 2026-09-02.** Jose eligió crearlo: certificado en Fly
  (`flyctl certs add`) y, como Fly pidió A y AAAA en vez de CNAME, esos dos
  registros en Porkbun —que es quien lleva el DNS de `doblefoco.co`; Vercel
  solo recibe el tráfico—. Verificado desde fuera: `/api/health` responde el
  mismo commit que Fly, CORS acepta `https://doblefoco.co` (petición y
  preflight), y sitemap, robots, transparencia y mapa-medios dan 200 por el
  hostname nuevo. El cliente cambia en la PR #8 (`vercel.json`, proxy de
  desarrollo, scripts que miden la API); los workflows de despliegue y de
  desfase siguen mirando `doblefoco.fly.dev` a propósito, porque auditan la
  máquina y no el DNS. La preview de Vercel está protegida con login y no se
  pudo abrir desde fuera; la portada se miró con `npm run mirar` contra el
  hostname nuevo.
- **Hallazgo de paso, y no es de hoy: `/sobre-nosotros` da 404** en Fly, por
  `api.doblefoco.co` y en `doblefoco.co`. `paginasEstaticas.js` dice que es
  una redirección permanente a `/transparencia/sobre-nosotros`, y
  `vercel.json` la reescribe al motor, que responde 404. Dos artefactos
  nuestros que dicen cosas distintas. Pequeño; **ABIERTO**, para la siguiente
  rama de pulido.
- **I-8 · El relevo a la red de seguridad de 2 h es silencioso** y con Infobae a
  margen 0,09 pierde el 91 % sin aviso. Acusar desde la vigilancia cuando la
  ingesta lleve horas sin pasada del motor. **HECHO el 2026-09-01 en la rama**:
  columna `actor` en `ingest_runs` (motor / red-de-seguridad / manual, firmada
  por cada punto de entrada), y la vigilancia acusa si el motor calla 3 h
  mientras otro lo suple —sin acusar mientras la columna no tenga firmas, para
  que el aviso no nazca en rojo—.
- **I-9 · El repositorio vive dentro de OneDrive** — locks y sync de
  `node_modules` y `.git`. Excluirlo de la sincronización. **DECIDIDO el
  2026-09-16: se queda dentro, por voluntad de Jose** — lo ve como copia
  extra. El modo de fallo queda anotado en el gesto 3 de la lista única:
  ante `index.lock`, pausar la sincronización, no reparar.
- **I-1 / 0.1 y 0.2 · `FLY_API_TOKEN` y el primer despliegue automático del
  motor: HECHO el 2026-09-02.** Fly sirve `6a4bf31` (el merge de la PR #7),
  el handshake tiene por fin un motor que publica `registroHash`, y el
  desfase que arrastraba desde el 31/08 quedó cerrado. Lección de fontanería:
  el token hay que guardarlo con `gh secret set --body` desde una variable
  recortada; con una tubería de PowerShell llega con `\r` y Fly lo rechaza
  con «token validation error».

Lo demás que encontró la auditoría ya estaba en esta minuta con otro nombre
(I-1 es el secreto de Fly; I-7 es el handshake 2-B) y no se duplica.

> **I-7 / 2-B, el handshake: HECHO el 2026-09-01 en la rama.** Y no compara
> commits, a propósito: compara la huella del registro de medios que cada lado
> lleva compilado (`registroHash` en `/api/health`, `__REGISTRO_HASH_ESPERADO__`
> en el bundle), porque el commit también cambia con la prosa y acusar por él
> es la alarma falsa que ya se pagó una vez con el vigilante del desfase. El
> aviso (`AvisoDesfase`) solo existe cuando los catálogos difieren, habla en
> lenguaje de lector y manda lo técnico a la consola. Sin datos no acusa: un
> motor anterior a la función produce silencio, no un estreno en rojo. El
> extremo a extremo queda pendiente del primer despliegue del motor tras 0.1.

## Del repaso de memos y auditorías del 2026-08-26

Pedido de Jose: poner los memos y las auditorías al día del estado real y
retirar lo que ya no sirva. Comprobar cada afirmación contra el repositorio y
contra Actions destapó cuatro cosas que nadie estaba mirando. Las dos primeras
son la misma enfermedad de siempre —un vigilante que acusa y nadie que lea la
acusación—.

> **La primera, la copia de seguridad, está CERRADA el 2026-08-31** y su
> desenlace está abajo. Las otras tres siguen abiertas.

### El motor no se despliega solo: el workflow está y el secreto no

- **Origen:** T1-6 del `PLAN_REVISION_KIMI.md`, cerrado el 2026-08-24.
- **Comprobado el 2026-08-26:** `gh secret list` devuelve **un solo secreto,
  `DATABASE_URL`**. `desplegar-motor.yml` existe, está bien escrito y su propia
  cabecera lo dice —«QUÉ HACE FALTA PARA QUE FUNCIONE: el secreto
  `FLY_API_TOKEN`»—, pero **nunca ha podido ejecutarse**.
- **Qué significa:** el despliegue del motor sigue siendo a mano, con la bomba
  que explota al desplegar descrita el 2026-08-11. Lo que sí funciona es
  `desfase.yml`, que compara a diario lo desplegado con `main` y hoy pasó en
  verde: el desfase **se ve**, lo que no se ha ganado es que **se cierre solo**.
- **Estado: ABIERTO, y es trámite de Jose**, no de código:
  `fly tokens create deploy` y `printf '%s' "$TOKEN" | gh secret set FLY_API_TOKEN`
  —sin pegar el valor en el chat, según el procedimiento de la credencial de
  Supabase—.

### Las fichas de sesgo cubren el catálogo al revés de lo que dice el propósito

- **Medido el 2026-08-26:** 50 de los 78 medios tienen ficha (las otras 7 fichas
  del directorio son candidaturas del barrido departamental, sin medio en el
  registro). Repartidas por banda:

  | Banda | Medios | Con ficha |
  |---|---:|---:|
  | Izquierda (≤ −0,6) | 2 | **0** |
  | Izquierda moderada | 12 | 3 |
  | Orientación mixta | 46 | 33 |
  | Derecha moderada | 19 | 14 |

  **La izquierda entera: 3 de 14 (21 %)**, contra el 72 % de la mixta y el 74 %
  de la derecha moderada. Sin ficha: Semanario VOZ, Colombia Informa,
  Las2Orillas, Revista RAYA, Vorágine, Cuestión Pública, Razón Pública, Cambio y
  RTVC.
- **Por qué importa y no es una laguna cualquiera:** la `q` sobre la que se
  apoya el modelo de puntos ciegos —el **3,29 %**— es la tasa de la izquierda, y
  de los 14 medios que la componen solo 3 tienen expediente. El producto afirma
  un desequilibrio apoyándose justo en los valores que menos ha documentado.
- **Y la laguna se movió, no siguió igual:** el reproche del 2026-08-11 era que
  los medios grandes no tenían ficha. **Eso se cerró** — El Tiempo, Semana,
  Noticias Caracol, Noticias RCN, Caracol Radio y La FM ya la tienen. Lo que
  quedó descubierto es el otro extremo.
- **Estado: ABIERTO.** Es trabajo de ficha, y va detrás del alta desde el
  2026-08-24 por decisión de Jose. Se anota para que la prioridad sea suya y no
  del orden en que fueron cayendo.

### El centinela tiene una pieza sin leer desde el 24 (issue #4)

- **Chocó 7 Días** publicó «Falleció Yenny Cañadas» y el centinela lo marcó
  porque la ficha vigila que **Iván Cañadas Garrido** siga siendo propietario y
  editor. El aviso lleva abierto desde el 2026-08-24 sin que nadie lo lea.
- **Dos «NO COMPROBABLE» que pueden ser la IP y no el medio:** Telecafé (403) y
  Diario del Norte (fetch failed). El propio aviso lo dice. Toca probarlos desde
  aquí antes de anotarlos como bloqueo ajeno — es la trampa del User-Agent con
  tilde otra vez.
- **Estado: ABIERTO.**

## De la revisión de código del 2026-08-19

Ninguno de estos lo habría encontrado la auditoría: salieron de leer código.

El cuarto de esta lista —`opinion`, que era el que compartía forma con los fallos
de aquel día, **la intención escrita en el código y el comportamiento
contrario**— se cerró el 2026-08-21 y está abajo. Los tres que quedan son de otra
naturaleza: no hay nada roto que arreglar, hay algo que **nadie ha decidido**.

### Infobae se muestrea al 38 % y nadie lo decidió

- **Origen:** auditoría del 2026-08-19 (`infobae/feed`).
- **Qué pasa:** Infobae publica **1 936 piezas al día** y su feed cubre 1,2 h. El
  motor toma 15 cada media hora: entran unas 40 de cada 100. **Nos quedamos con
  el 38 %.**
- **Por qué importa aunque se pueda defender:** puede que muestrear al medio más
  voluminoso esté bien —ya era el 32,5 % del corpus—, pero es el mismo caso que
  el techo de `MAX_ARTICLES`, del que este repositorio escribió que «convertía una
  constante de protección en el límite real del producto sin que nadie lo
  decidiera». Ha vuelto a pasar un nivel más abajo.
- **Y hay un riesgo puro:** su margen contra la red de seguridad de 2 h es
  **0,09**. El día que el motor se caiga y solo quede el cron de Actions,
  perdemos el 91 % de Infobae sin que nada avise.
- **Estado:** **HECHO el 2026-09-02.** Jose decidió (punto 4, opción B): techo
  general de 15 y techo propio por feed para quien publique más de 15 en media
  hora. Infobae lleva 60 (publica 42 cada media hora, medido ese día). Lo que
  cambia en el corpus está en la entrada de CERRADO de esa fecha. El riesgo de
  la red de 2 h sigue —60 de las ~170 que publica en dos horas— pero desde el
  1/09 la vigilancia acusa cuando el motor calla (I-8).

### Permanencia: una noticia dura 72 h y se borra

- **Origen:** `ESTUDIO_GROUND_NEWS.md`, 2026-08-19.
- **Qué pasa:** `pruneExpiredArticles` borra la fila a las 72 h. No hay archivo.
  Todo el juicio que este proyecto invierte por medio —propiedad, espectro,
  conflicto de interés— se evapora en tres días.
- **Lo que cuesta:** la base crece 4,7 MB al día. 30 días caben en el plan
  gratuito de Supabase; un año son ~2 GB y **25 USD/mes**. El buscador que lo
  acompaña es `tsvector` + índice GIN, sin sobrecosto propio.
- **Estado:** ABIERTO. **Decisión de producto.** El estudio está hecho y la
  pregunta que queda no es técnica: un archivo permanente convierte cada historia
  en una página que seguirá afirmando lo que afirmaba, con la ficha de propiedad
  que era cierta ese día.

### Ventana de agrupamiento: 7 días caben, 30 no

- **Origen:** `ESTUDIO_GROUND_NEWS.md`, 2026-08-19.
- **Medido:** el primer paso de `clusterArticles` compara cada artículo contra
  todos los grupos ya formados y es cuadrático. En el worker de Fly, 7 días serían
  1–2 min por ciclo contra una cadencia de 30; 30 días serían 10–50 min, o sea más
  que el propio intervalo.
- **Estado:** ABIERTO. Subir a 7 días multiplicaría por 2,3 la ventana en que una
  historia puede juntar medios de distinto espectro, que es el núcleo del
  producto. **Nadie ha medido qué le hace eso a los falsos agrupamientos**, y esa
  medida va antes que el cambio.

### Los puntos ciegos: 0 en 6 299 historias, y no es por falta de datos

- **Origen:** `ESTUDIO_PUNTOS_CIEGOS.md`, 2026-08-21, pedido por Jose.
- **Dos fallos independientes.** Uno es de costura: el servidor calcula el punto
  ciego con tasas base y el cliente lo recalcula **sin ellas**, además de no
  copiar `raw.blindspot` en `normalizeStory`. El veredicto no llega nunca a la
  pantalla, y `MobileSidebar` tiene una pestaña «Puntos ciegos» que solo puede
  enseñar su estado vacío.
- **El otro es de modelo, y no lo cura más masa.** `(1-q)^n < 0,05` con la
  izquierda al **3,29 %** exige **90 medios en una sola historia**; la mayor del
  corpus tiene 16 y el catálogo son 76. **77 historias cumplen todas las demás
  condiciones y mueren en esa.**
- **La propiedad perversa:** cuanto más pequeña es la voz de un espectro, más
  difícil se vuelve afirmar que falta. Contradice el propósito editorial escrito.
- **Comprobado que no es cosa del umbral:** en historias de 10+ medios, que falte
  la izquierda ocurre el **78 %** de las veces. Es lo normal, no lo raro.
- **Y la izquierda calla en parte por nuestra propia ventana, no por avería.**
  5 de sus 13 medios aportan cero y dos aportan el 88,6 %. Fui a arreglar los
  mudos dando por hecho lo que decía esta minuta —Vorágine y Razón Pública caen
  desde la IP de Actions— y **no era eso**: los seis mudos con feed responden
  HTTP 200 con 10 ítems. Lo que los borra es `RETENTION_MS = 72 h`, porque su
  pieza más nueva ya nace fuera de la ventana. Detalle en el §8 del estudio.
- **Estado:** **la costura está arreglada y fusionada.** `c80de64` (8 pruebas
  propias) está en `main` desde el 2026-08-24: el cliente deja de recalcular sin
  tasas y trasplanta el veredicto del servidor. Esta minuta lo daba por «sin
  fusionar»; **comprobado el 2026-08-26, ninguna rama del remoto queda fuera de
  `main`.** Lo demás sigue ABIERTO y es **decisión
  de producto**: declarar inalcanzable la rama de la izquierda con el número
  escrito, y llevar el desequilibrio a donde sí se puede afirmar —el énfasis
  dispara en el 19,5 % de las historias grandes—. Lo que el estudio NO recomienda
  es bajar el umbral hasta que algo salga.

## De la revisión externa de Kimi K3 del 2026-08-25

**Primera respuesta de clase «diseño» y «estructura» del proyecto.** Literal en
`revision-externa/respuestas/kimi-k3-estructura-y-puntos-ciegos.md`. Se le pidió
objeción **y alternativa**, y juicio en los dos sentidos.

**Comprobé todos sus cálculos y cuadran uno por uno**: la tabla hipergeométrica
(0,215 / 0,142 / 0,060 / 0,038), el `(1−0,0329)^76 = 0,0787`, las razones de
verosimilitud (1,4 / 1,7 / 2,7) y las probabilidades de la rama 3 (1,7×10⁻³ y
2×10⁻⁵). No inventó ni un número.

### Corrigió una afirmación NUESTRA, y hay que rehacerla

`ESTUDIO_PUNTOS_CIEGOS.md` dice que la rama de la izquierda «seguiría siendo
inalcanzable aunque los 76 medios cubrieran la misma noticia el mismo día».
**Eso solo es cierto para la formulación con `q` ponderada por apariciones.**

La nula que el propio estudio declara es *«los medios eligen qué cubrir con
independencia de su línea»* — y **quien elige es el medio, no la aparición**. Con
la nula de catálogo el cálculo es hipergeométrico, `C(total−izq, n)/C(total, n)`,
y entonces:

| Catálogo | Primer `n` que baja del 5 % |
|---|---:|
| 13 de 78 (el del estudio) | **15** |
| **14 de 78 (hoy, con Las2Orillas)** | **14** |

**La mayor historia del corpus tiene 16 medios.** O sea que bajo la nula que
decimos usar, la rama de la izquierda **no es inalcanzable: es alcanzable hoy**.

**Y eso NO es una buena noticia**, que es lo que hace valiosa la objeción.
Corregir la nula hace que la señal dispare justo donde el 78 % dice que la
ausencia es la situación por defecto. El problema deja de ser de potencia y pasa
a ser de **especificidad**: dispararía marcando lo normal.

- **Estado: CERRADO el 2026-08-25** (commit `T1-4`). La sección 2 del estudio
  está rehecha: cuenta el error entero —por qué la `q` de apariciones era la
  pregunta equivocada, y que castigaba a la izquierda dos veces, una por ser
  pocos y otra por publicar poco, siendo lo segundo culpa de nuestra ventana de
  72 h—. El número es **14**, no 90.

  La justificación de D ya no se apoya en la aritmética sino en la medida: la
  izquierda falta en el **87 %** de las evaluables de producción y en el **78 %**
  de las de 10+ medios del corpus histórico. **D sobrevivió a su propia
  corrección**, que era la prueba que había que pasar.

  Una nota de contabilidad, porque los dos números andan sueltos por ahí: la
  tabla de arriba cuenta **14 de 78** —el registro entero— y el modelo cuenta
  **13 de 72** —solo los medios con feed, que son los que pueden aparecer—. Las
  dos cuentas dan 14 medios, así que la conclusión no depende de cuál se use.
  La del código es la correcta: un medio sin feed no puede estar ausente.

### Lo demás que dejó abierto, y que es decisión de producto

- **La `q` se estima con el mismo pipeline que se evalúa** (su O3). La tasa base
  contra la que se juzga cada ausencia está fabricada por las mismas decisiones
  —qué medios entran, retención de 72 h, deduplicación— que producen las
  ausencias juzgadas. Su Alt-3: **separar la ventana de estimación (30–90 días)
  de la de agrupamiento (72 h)**. Dice que es prerrequisito de cualquier arreglo
  serio, y que abre una pregunta que hoy está escondida: **¿por qué 72 h es la
  ventana correcta para agrupar? Posiblemente nadie lo midió.**
- **El énfasis tiene la misma ceguera direccional** (su O6): 23 para la derecha,
  0 para la izquierda. «El énfasis funciona» quiere decir «funciona para la
  derecha». No es argumento contra la opción E —sigue siendo la correcta— sino
  contra adoptarla sin escribir esa línea.
- **Las ramas 1 y 3 tienen el mismo vicio que la 2** (su O5) y el estudio no lo
  decía: umbrales fijados sin contrastar contra la tasa base del espectro que
  nombran. Solo la rama 2 lo tenía escrito en símbolos.
  **Medido y escrito el 2026-08-25**, y salió peor de lo que decía la objeción:
  puesta en las unidades de la nula, la rama 3 exige de entrada entre **15 y
  2 509 veces** menos probable que el 5 % que la nula llama sorprendente — o sea
  que **el filtro previo es la prueba de verdad y la nula es decorado**. Y su
  dureza no crece con `n`: va a saltos en los dos sentidos, porque «15 % de n» se
  redondea a un número entero de medios. Una historia de 10 tiene que ser siete
  veces más rara que una de 8 para pasar el mismo filtro, y nadie lo decidió.
  La rama 1 comparte el vicio en otra escala —de 8× a 1,2×— y lo que de verdad la
  mata es `counts.left >= 2`.
  **Sigue ABIERTO lo que hay que decidir:** recalibrar contra el catálogo, o
  cambiar el 15 % por un número de medios —que quitaría los saltos—, o declararlas
  sin disparo previsible. No se ha tocado ninguna: son decisión de producto.
- **Nadie contó los tests** (su O4): a α = 0,05 sobre 77 historias se esperan 3,9
  falsos positivos. Mata la opción C por segunda vía, y conviene enterrarla por
  las dos, porque si muere solo por el 78 % alguien la resucitará cuando el
  corpus cambie.

> **HAY PLAN ESCRITO, y desde el 2026-08-26 tiene sucesor:**
> `doblefoco-app/PLAN_CONTINUIDAD.md` absorbe lo que quedaba de este y le añade
> lo que ha salido después. El original,
> `doblefoco-app/PLAN_REVISION_KIMI.md`, del 2026-08-24.
> Clasifica lo accionable en dos fases, deja fuera lo que depende de una
> decisión de producto ya abierta, y avisa de una trampa de secuencia: corregir
> la nula sin corregir la justificación de D **empeora** el producto, porque
> haría disparar la señal justo donde la ausencia es lo normal el 78 % de las
> veces. Nada de ese plan está aprobado.

### Y cinco hallazgos de estructura

Todos con su caso concreto. Los cuatro primeros piden trabajo de código, el
último es de infraestructura de prueba:

1. **El vigilante del desfase que solo avisa es la peor posición intermedia.**
   Propone un *handshake* de versión en tiempo de ejecución: el cliente lleva
   incrustado el commit esperado del motor y degrada visiblemente si difieren.
2. **Cuatro componentes pidiendo los mismos datos** producen pantallas
   internamente inconsistentes en el cambio de ciclo de 30 min — el hero enseña
   una historia que el feed ya no tiene.
3. **La rehidratación es un segundo serializador escrito a mano.** Pide una sola
   función usada en ambas direcciones más un test de ida y vuelta. Lo llama «el
   arreglo más barato de toda la lista, y habría cazado el fallo más caro».
4. **Un check de CI que falle si un comentario nombra un identificador que no
   existe.** Contra la enfermedad del 19. **HECHO el 2026-08-25**:
   `npm run check:comentarios`, ya en `ci.yml`. En su primera pasada acusó a 4 y
   **ninguna era falsa**; las tres primeras llevaban meses ahí. Lo que quitó el
   ruido fueron dos reglas: solo se acusan citas con **mayúscula interior** —la
   prosa no va en camello— y se exime el párrafo que ya dice que eso se retiró,
   que es documentación buena y no una mentira. De 29 acusaciones a 4.
5. **Falta un modo de arranque de prueba del sistema**, y esa es la razón real de
   que las costuras no estén cubiertas — no que nadie supiera escribir los tests.

**Lo que dijo que está bien**, y conviene no perderlo porque también es
información: los invariantes contra producción («la respuesta correcta, no un
parche»), el libro de hallazgos con motivo obligatorio, la detección de opinión
como función pura de la URL, no analizar el texto de la pieza y decirlo, el
comprobador de integridad del registro, y la regla de los 2 medios con su razón
escrita.

Y sobre lo mejor del método: *«es capaz de decir cero en 6 299 historias y de
demostrarlo (…) un sistema que puede exhibir su fracaso con números es un sistema
que puede arreglarse.»*

---

## Del trabajo del 2026-08-25

### El punto ciego dispara con UN medio del lado que dice que falta

**Encontrado al medir para `docs:modelo`, no buscándolo.** El 2026-08-25 la señal
disparó por primera vez desde que se corrigió la nula — y las dos veces sobre
historias donde el lado «ausente» **sí estaba**:

| Historia | Medios | Cobertura | Lo que se publica |
|---|---:|---|---|
| Murió Dolly Parton a los 80 años | 15 | izq 1 · mixta 7 · der 7 | «Punto ciego de la izquierda» |
| Migrantes: qué propone De la Espriella | 14 | izq 1 · mixta 7 · der 6 | «Punto ciego de la izquierda» |

La causa es que la rama compara una **proporción** —`leftRatio <= 15 %`— mientras
que el nombre, la etiqueta `Sin medios de izquierda` y la palabra «ausencia»
prometen un **cero**. Con historias pequeñas las dos cosas coincidían: a 4 medios,
uno solo es el 25 % y no pasa el filtro. **Dejan de coincidir a partir de 7
medios**, que es un tamaño que este corpus no alcanzaba hasta ahora. El defecto
estaba latente desde el principio y se volvió alcanzable esta semana.

Hoy son **5 de las 44** historias marcadas. La descripción sí dice la verdad
—«Solo 1 de izquierda lo reportan»— así que lo que hay en pantalla es un titular
que se contradice con su propia frase, no una mentira limpia. Y en un caso es
peor de lo que parece: «Murió el padre Javier Giraldo: así fue su defensa de los
derechos humanos» sale marcada como sin medios de izquierda, teniendo uno.

- **Estado: CERRADO el 2026-08-25.** Jose eligió **las dos señales separadas**:
  `Sin medios de X` exige cero y solo esa puede llamarse punto ciego; `Apenas N
  medios de X` cubre el tramo entre uno y el 15 %, y su titular es la propia
  etiqueta.

  **Y debajo del rótulo había un fallo peor, que salió al arreglarlo: la prueba
  no probaba la afirmación.** Se decía «apenas uno» y se calculaba la
  probabilidad de «ninguno», que es un suceso distinto y bastante más raro
  —P(izq=0 | n=15) = 0,034 frente a P(izq≤1 | n=15) = 0,184—. Con la prueba
  puesta sobre lo que de verdad se dice, aquella historia no sorprende: harían
  falta 22 medios, no 15. La nula se generalizó a
  `probabilidadDeComoMuchoEnCatalogo(K, N, n, k)` y la de ausencia es su caso
  `k = 0`.

  Comprobado en producción: **0 etiquetas falsas, 5 marcadas «Apenas 1 medio de
  izquierda», 0 puntos ciegos.** El aviso del feed también decía algo falso —«no
  aparece ningún medio»— y ahora dice la regla que de verdad selecciona.

### Hay una rama sin fusionar del 2026-08-20 con trabajo de verdad

`tendencias/una-sola-lista`, encontrada al limpiar las 43 ramas ya fusionadas.
Rehace la página de Tendencias: quita el segundo bloque, convierte el ranking en
un `<ol>` de verdad y añade `Trending.layout.test.js` (155 líneas) que prohíbe los
selectores por etiqueta.

**Su premisa se volvió a medir el 2026-08-25 y sigue siendo cierta: 8 de las 10
historias del segundo bloque son exactamente las 8 tarjetas del primero**, bajo
dos encabezados que prometen medidas distintas.

- **Estado: CERRADO el 2026-08-25.** Fusionada, resolviendo el conflicto hacia
  la rama —su solución del `h3`/`h2` es estructural: ningún selector apunta ya a
  una etiqueta, y hay pruebas que lo obligan— pero llevándole encima lo que
  `main` aprendió después: el `overflow-wrap: anywhere` del titular, que salió el
  25 cuando `npm run mirar` pilló «"patrocinadores» saliéndose de tres tarjetas.

---

## De la auditoría automática del 2026-08-19

**Primera pasada del libro: 23 hallazgos abiertos** — 15 de feed, 5 de rutas, 3
de fuentes. Todos nacen con fecha de hoy, así que todavía no hay antigüedad que
enseñar; la tendrán a partir de la pasada del jueves. El detalle vivo está en
`doblefoco-app/auditoria/hallazgos.json`; aquí solo lo que pide una decisión.

### Cinco sitios devuelven 200 a cualquier ruta

- **Ids:** `canal-capital/rutas`, `el-heraldo/rutas`, `quindio-noticias/rutas`,
  `cablenoticias/rutas`, `efe/rutas`.
- **Qué significa:** en esos sitios, el 200 de una página «quiénes somos» **no
  prueba que la página exista**. Las fuentes institucionales que se apoyaban en
  eso ya bajan solas a «no comprobable» en la auditoría.
- **Estado:** ABIERTO. La detección funciona; **qué fuente sustituye a la que ya
  no prueba nada es trabajo de ficha**, y ahí no llega el código.
- **Nota:** Quindío Noticias es reincidente por diseño — es el caso que enseñó
  esta trampa la primera vez.

### Tres fuentes de fichas ya no resuelven

- **Ids:** `boyaca-digital/fuente/...` (404), `el-pilon/fuente/...` (404),
  `dw/fuente/...` (503).
- **Estado:** ABIERTO. Pide sustituir la fuente en la ficha, o declarar la
  ausencia con la regla que ya existe.

### Cuatro feeds están parados

- **Ids:** `telemedellin/feed`, `telecafe/feed`, `w-radio/feed`, `razon-publica/feed`.
- **Qué significa:** parado no es lento. Telemedellín publica 51 piezas al día y
  llevaba 146 horas sin una sola; W Radio sirve piezas de hace diez meses;
  Telecafé responde pero **ninguna pieza trae fecha**, así que no se puede
  auditar. Los que publican despacio —Vorágine, CasaMacondo, Telecaribe, La
  Patria, RTVC— **no** están aquí: eso es su cadencia y la auditoría ya los
  distingue.
- **Estado:** ABIERTO. Pide buscar otra vía de feed para cada uno.

> **Razón Pública puede ser un falso positivo, y conviene decidirlo y no
> discutirlo cada semana.** Publica **por tandas**: sus 10 ítems cubren 36,6 h
> —una pieza cada 4,1 h— y luego lleva 74 h en silencio. La medida es correcta y
> aun así la conclusión puede no serlo, porque un semanario de análisis se ve
> igual que un feed averiado. **Es exactamente para esto que existe `aceptado`
> con nota:** si Jose decide que publicar por tandas es su oficio, se marca en el
> libro con el motivo escrito y deja de avisar, sin desaparecer.
>
> Lo que NO se hizo: mover el umbral para que Razón Pública deje de salir.
> Ajustar una medida hasta que calle al que molesta es como se estropea un
> vigilante.

---

# CERRADO

## 2026-09-18 · El «sin medir» del sesgo existe en el código, y la izquierda del catálogo baja de 13 a 9

Punto 2 de la sesión del 16-09. El «sin medir» estaba decidido para cuatro
medios —Vorágine, Cuestión Pública, Revista RAYA y RTVC— y **no existía en el
código**: `bias` era obligatorio en el registro, `NOT NULL` en la base, y la
función que reparte a los medios por espectro leía cualquier cosa que no fuera
un número como un cero.

> **Un cero no es «no se sabe»: es la banda mixta.** El default silencioso
> convertía la ausencia de medición en la única afirmación que este proyecto se
> niega a hacer —que un medio está en el centro—, y lo hacía sin fallar, sin
> escribir nada en ningún registro y sin que ninguna prueba lo viera.

### Qué se decidió en cada consumidor, que era el encargo

`classifySpectrum` devuelve ahora `null`, y `null` no indexa un objeto de
conteo: **rompe en voz alta en vez de callar**, así que hubo que decidir los
doce sitios. En resumen:

| Consumidor | Qué hace con el «sin medir» |
|---|---|
| Nula de catálogo (`catalogo()`) | **Cuenta en el total, en ninguna banda.** Puede cubrir, así que es competidor real; sacarlo del universo haría parecer más raro que falte un espectro |
| `analyzeCoverage` | **Dos tamaños**: `total` son los medios que cubren —lo que ve el lector— y `medidos` es la unidad de todo lo que habla de bandas. `sinMedir` viaja al lado |
| Media de orientación | `null`, no 0. `describirOrientacionMedia` dice «Orientación sin medir» |
| Umbral para afirmar una ausencia | Sobre `medidos`: cuatro medios de los que dos no están medidos sostienen lo mismo que dos |
| «Solo medios de izquierda y derecha» | **Se calla si alguno está sin medir**: ese «solo» sería literalmente falso. Se publica el hecho con la etiqueta que sí es cierta |
| Frases de los veredictos | Con alguno sin medir, el denominador se nombra: «de 6 medios con orientación medida», no «de 7 medios que cubren el hecho» — una cuenta que se pueda restar es una cuenta que alguien va a restar |
| Tasas del corpus (base y de ausencia) | Fuera del numerador **y** del denominador |
| Panorama por espectro | **Cuarta banda visible, «Sin medir».** Publican: dejarlos fuera haría que el reparto no sumara lo que circula, y esta vista existe para que las cuentas no escondan nada |
| Mapa mediático | **Fuera del gráfico, con su aviso propio** —`xScale(null)` es `NaN` y el punto desaparecía en silencio— y enteros en la tabla, con «sin medir» en su columna. Es la misma regla que ya tenía el eje vertical |
| Cronología de cobertura | Sigue en la lista —cubrió, y a esa hora— pero no abre ningún espectro, y una historia sin ninguno medido dice que no se puede saber por dónde entró |
| Compartir y Open Graph | El reparto lleva su resto: «19 medios cubren este hecho: 1 de izquierda, 14 de orientación mixta, 3 de derecha, 1 sin medir» |
| `getBand` | `null` en vez de la banda del 0, que es lo que ponía el nombre de una banda en la ficha de RTVC |

### Lo que el cambio movió, medido

| | Antes | Ahora |
|---|---:|---:|
| Izquierda en el catálogo con feed | 13 de 73 | **9 de 73** |
| Medios para que una ausencia de la izquierda sorprendiera | 14 | **20** |
| Sin medir | 0 | 4 |

**La segunda fila es la que importa y conviene no leerla al revés.** La historia
más cubierta del corpus ronda los 16 medios, así que la rama de la izquierda
—que ya estaba declarada no medible por decisión de Jose (opción D, 02-09)—
queda todavía más lejos de poder afirmarse. **Esto no es una pérdida: es que
cuatro de los medios que sostenían esa cuenta nunca tuvieron con qué
sostenerla.** El aviso de la portada lo dice ya con los números nuevos: «de los
73 medios que seguimos, 9 son de izquierda —el 12 % del catálogo— pero publican
el 3,3 % de los artículos».

Las dos pruebas que fijaban el tamaño **a mano** —el caso de Dolly Parton, 15
medios— ahora lo toman del catálogo: miden la propiedad, no el número, y si el
catálogo se mueve otra vez se mueven con él.

### La migración, que es lo único que puede romper el despliegue

`sources.bias` era `NOT NULL`. **Hay que correr `npm run db:migrate` contra
producción antes de fusionar**, y no después: `prepareStorage` proyecta el
catálogo en cada arranque, así que sin la migración la primera proyección falla
entera con «null value in column "bias" violates not-null constraint», el
servidor arranca declarándose «sin persistencia» y el worker no ingiere.

> **Ya pasó, con la columna de al lado.** El `factuality: null` se decidió el
> 2026-08-09 y se desplegó sin migrar: **diez horas de feed parado el
> 2026-08-11, y nada avisó.** El `ALTER` va en `schema.sql` con esa nota
> encima, y `db:migrate` aplica el esquema y proyecta el catálogo en la misma
> ejecución, en ese orden.

Comprobado antes de subir: 893 pruebas (12 nuevas, en `shared/sinMedir.test.js`),
lint, tipos, comentarios, `check:registry` sin errores, los dos documentos
generados regenerados, y `mirar` en 10/10 con las capturas abiertas — la nota
del mapa sobre RTVC y la banda gris del panorama se ven en ellas.

## 2026-09-15 · Podar ramas destapó un comentario que llevaba quince días mintiendo

La poda era cosmética: veintisiete ramas locales de PR ya fusionadas. Veinticinco
se borraron con `-d` sin discusión —`git` mismo certifica que su contenido está en
`main`—. **Las otras dos pedían `-D`, o sea forzar, y ahí es donde había que
mirar en vez de teclear.**

| Rama | Qué llevaba | Veredicto |
|---|---|---|
| `arreglo/categorias-no-llevan-a-ningun-lado` (`78c8628`) | El arreglo de Categorías **y** la corrección del comentario del proxy | El arreglo entró por la #21; **la corrección no entró nunca** |
| `copia/avisar-de-la-ausencia` (`8b0dc1c`) | Vigilar que `backup.yml` se ejecute | Entró **mejorado**: `main` vigila la copia *y* el archivo |

### Lo que se había quedado fuera

`vite.config.js` decía, sobre el proxy de desarrollo, que **`VITE_API_URL` debe
quedar VACÍA**. Y `src/services/apiBase.js`, tres ficheros más allá, declara lo
contrario en su propia cabecera: el vacío está **reservado para el MODO
DEMOSTRACIÓN**, en el que no se intenta ninguna petición; lo que produce rutas
relativas es `same-origin`.

> **El comentario se corrigió el 2026-08-31 y la corrección se quedó en la rama.**
> Así que siguió mintiendo en `main` nueve días más, y el **2026-09-09 mordió**:
> `npm run mirar` dio el visto bueno a una portada completamente vacía, y hubo
> que averiguar por qué desde cero. La causa se anotó aquel día como «local y no
> del repositorio». **Era del repositorio**: el comentario que mandaba hacerlo
> mal estaba en `main`, y su arreglo estaba escrito desde hacía nueve días en
> una rama que nadie fusionó.

Corregido ahora en `main`, y el comentario nuevo dice además que estuvo mal, que
es lo único que impide que alguien lo «arregle» de vuelta.

### La lección, que es de procedimiento

**Una rama sin fusionar no es basura por defecto, y el estado de la PR no lo
dice.** Las dos de hoy estaban igual de abandonadas y una llevaba dentro un
arreglo vivo. Antes de `git branch -D`, `git diff main...<rama>` fichero a
fichero — no basta con comprobar que *algún* fichero suyo ya está en `main`, que
es lo que estuvo a punto de bastar aquí.

**Y las dos ramas se borraron con su SHA escrito arriba**, que es lo que las hace
recuperables: `git checkout 78c8628` las trae de vuelta mientras el recolector de
basura no pase.

### Y al ir a por el remoto, la misma rama escondía 154 líneas de planeación

Con lo local ya podado quedaban **46 ramas remotas, 44 de ellas dentro de
`main`**. Jose pidió podarlas «si no tiene ningún efecto de fondo», y considerar
los escenarios. Los cinco que podían morder:

| Escenario | Comprobación | Resultado |
|---|---|---|
| Borrar la rama de una PR **abierta** la cierra | `gh pr list --state open` | Ninguna abierta |
| Una PR **cerrada sin fusionar** deja su código solo en la rama | `mergedAt == null` | Solo la #28 y la #29, y sus commits son antepasados de `main` |
| Un **flujo** que apunte a una rama deja de disparar | `grep branches:` en `.github/workflows` | Los tres dicen `[main]` |
| Una **URL de preview** citada en el repo se muere | `grep vercel.app` | Una sola, y es el alias del proyecto, no de una rama |
| **Commits que solo viven ahí** | `git diff main...<rama>` fichero a fichero | **Aquí estaba el problema** |

`78c8628` llevaba dentro **154 líneas de `PLANEACION.md` que no estaban en
ningún `.md` de `main`**: el estudio de «Salir a hacer mercadeo» que Jose pidió
el 2026-08-31 —qué mirar antes de rotar la página por ahí—. `main` tenía 455
líneas de ese fichero; la rama, 609.

> **La regla de este proyecto es que lo que no está en `PLANEACION.md` se
> pierde.** Estaba escrito, medido contra producción, y a un `git branch -D` de
> distancia. Y no lo salvó ninguna red: lo salvó abrir la rama antes de borrarla.

Rescatado a `main` **sin retocar el texto** —es una medición con fecha— y con una
tabla encima que dice cuál de sus premisas sigue en pie. De sus nueve puntos,
**cinco ya se arreglaron** (los dos de `/limitaciones`, la tarjeta social, la
retención y T2-2) y **cuatro siguen vivos**: no hay analítica de ninguna clase
—comprobado hoy contra producción—, no se sabe qué número rompe la máquina de
Fly, no hay procedimiento para cuando un medio objete, y los puntos ciegos siguen
sin calibrar para prometerlos como función insignia.

**Y de camino, un desfase más:** `PLAN_CONTINUIDAD.md` seguía diciendo que si un
flujo programado dejara de correr «nadie se enteraría». Falso desde el 31 de
agosto — `vigilancia.yml` pregunta por la última ejecución con éxito de
`backup.yml` y `archivo.yml` y falla a las 48 h. El texto no se actualizó por lo
mismo: vivía en la rama sin fusionar. Corregido, y dicho lo que **sí** sigue
descubierto (los demás flujos: ingesta, centinela, auditoría, desfase).

---

## 2026-09-15 · La tanda del 8 de septiembre entra a `main`, y el día del despliegue se ejecuta el mismo día (punto 1 y puntos 10 a 12b)

Ocho días parada, y con eso basta para que el aplazamiento se note en las
cifras. Lo que se hizo, en orden, y lo que cada paso enseñó.

### El escalón intermedio no lo vigila nadie, así que se vigiló a mano

La #33 —el punto 26— apuntaba a la rama de integración, no a `main`, y el CI
solo se dispara en `push` a `main` y en `pull_request` contra `main`. **Su
código nunca había pasado por CI**, que es exactamente lo que quedó anotado en
`c0af7a5`. Antes de fusionarla se verificó en local sobre el resultado exacto de
la fusión —la rama del 26 es descendiente directa de la de integración, así que
el resultado era su propio `HEAD`—: lint, `tsc`, **860/860 pruebas**, build,
`check:comentarios` y `check:registry`.

> **Y el escalón se cubrió solo después:** fusionada la #33, la #32 sí apunta a
> `main`, así que su CI volvió a correr con el punto 26 dentro. Verde: lint,
> tipos, pruebas, build, integridad del catálogo, comentarios y esquema. Esa es
> la forma barata de dar CI a una PR intermedia — fusionarla hacia arriba antes
> de tocar `main`.

### La fusión, y las dos que no se cerraron solas

`gh pr merge 33 --merge` y luego `gh pr merge 32 --merge` (`d6deb1c`). De las
siete originales, **cinco se cerraron solas**; la **#28** y la **#29** se
quedaron abiertas porque iban encadenadas (#24 → #28 → #29) y GitHub no siempre
reconoce el encadenado. Se comprobó que sus commits de cabeza son antepasados de
`main` —`c536dfa` y `8919581`— y se cerraron a mano con el motivo escrito. **Una
PR cerrada a mano sin decir por dónde entró su código se lee igual que una
descartada**, y eso es lo que había que evitar.

### Los despliegues, y la comprobación que sí hace el motor

Los dos salieron solos con el push. El de Fly incluye un paso que conviene
recordar porque es el que evita la mentira más cara —«se desplegó» sin que lo
desplegado sea lo empujado—: **«Comprobar que lo que corre es lo que se
empujó»**, y pasó.

### Las 1 554 huérfanas eran 3 392

| | El 2026-09-08 | El 2026-09-15 |
|---|---|---|
| Archivo sellado | 1 975 | 4 253 |
| A borrar | 1 554 | **3 392** |
| Proporción | 79 % | 80 % |

**La proporción no se movió, y eso es lo que importa.** El criterio viejo siguió
sellando ocho días más, así que el número creció con el calendario; si la
proporción hubiera cambiado, el diagnóstico del 08-09 habría sido otra cosa.
Borradas las 3 392, el sitemap deja de anunciarlas en la próxima petición.

> **Lo que se leyó antes de borrar**, porque el informe enseña horas negativas y
> eso asusta sin el contexto: **negativo significa que el artículo más nuevo de
> la historia es posterior al sello.** Sus piezas siguieron vivas después de
> archivarla, que es la forma más limpia de no haber envejecido. La más joven de
> la muestra iba a −47,8 h.

### Las dos cifras de H4, leídas en producción

Primer ciclo del motor nuevo, el de arranque —el que más escribe—:

```
6367 hist. (620 escritas) · enlaces +676 −122
```

**Punto 11:** las dos cifras ya no son iguales; el `WHERE` filtra. **Punto 11b:**
676 altas y 122 bajas de enlace, no los ~7 500 que habrían significado que
`story_articles` se sigue borrando y reescribiendo entera.

### Y lo que se miró, de verdad

`npm run db:contrato` en verde: el artículo baja y vuelve entero —`feedCategories`
incluido— y deja `ROLLBACK`. `npm run mirar` con `VITE_API_URL=same-origin`:
**10/10 rutas de escritorio**, `/transparencia/sobre-nosotros` entre ellas, que
era el 404 de la #26. **Y se abrió la captura**, que es la parte que el 09-09 se
descubrió que faltaba: la portada sale llena, destacado de 22 medios, el aviso
de «aquí falta un lado» en su sitio. El sitio publicado responde 200 en las seis
rutas probadas.

**7/7 invariantes contra producción** con el motor nuevo sirviendo: 6 333
historias, 507 multifuente, 86/100 con tema, ninguna vacía, ningún contrasentido
de espectro.

---

## 2026-09-10 · El resumen que es el titular repetido, y la firma del gestor en español (punto 26)

**El campo estaba lleno y no decía nada.** El punto lo abrió el caso de RTVC
—«…wfvasquez@cont… Mar, 01/09/2026»—, y al medirlo la causa principal resultó
ser otra y mucho más grande: **Google News no tiene el resumen del medio**, así
que sirve el titular seguido del nombre de la fuente. «<titular> Blu Radio»,
«<titular> ntn24.com».

### Cuánto era, medido pasando el corpus por la función de verdad

**1 018 artículos, el 3,42 % de los 29 737 que tienen resumen**, en 17 medios.
La cifra que aguanta es **la proporción**: repetida una hora después, con la
ingesta corriendo y 88 artículos más en la base, daba 1 020 de 29 825 y el
mismo 3,42 %.

| Medio | | Medio | |
|---|---|---|---|
| La FM | 290 | Revista RAYA | 10 |
| Blu Radio | 279 | RTVC | 6 |
| NTN24 | 162 | Diario La Libertad | 6 |
| Noticias Caracol | 88 | Pulzo | 11 |
| Noticias RCN | 80 | y otros siete | 1 cada uno |
| EFE | 79 | | |

### Por qué se quita, y NO es por la clasificación

Se reclasificaron los 1 018 con y sin resumen: **cero cambian de tema**. Es el
mismo resultado del punto 16 y por la misma razón —lo que el resumen repite ya
puntúa por el titular—, y se comprobó antes de escribir la regla justamente
porque el 16 enseñó lo que cuesta suponerlo.

**Lo que sí arregla son dos afirmaciones falsas sobre nuestro propio trabajo:**

1. `analyzeArticleTone` devolvía **`analizoEntradilla: true` en los 1 018**.
   Decíamos haber analizado una entradilla que no existe.
2. En **25** de ellos un término cargado quedaba anotado en el titular **y** en
   la entradilla —«brutal», «impactante», «contundente»—. Y ese `donde` no es
   un detalle: el producto defiende que en el titular es una decisión de
   portada y en la entradilla una de redacción. Contar la misma palabra dos
   veces convierte una decisión en dos.

Más el motivo del 16, que sigue valiendo: es texto que se guarda y que un día
se enseña, porque el buscador ya dice buscar dentro del resumen (punto 8).

### La regla no tiene listón, y eso costó decidirlo

«No dice nada» significa **que no queda nada**, no que quede poco. De los 2 187
resúmenes que repiten el titular, los que quedan exactamente vacíos —quitados
el titular, el nombre del medio, su dominio, el correo del gestor, la fecha y
la hora— son los 1 018, y **el siguiente ya dice algo de verdad**: «Rosa
Angélica Tarazona», el nombre completo de quien el titular llama 'La Bebesita'.

Un umbral de palabras parecía lo natural y habría sido peor: se probó, y con
«menos de 4 palabras» se llevaba por delante entradillas cortas que informan
—«Estos son los riegos», «El 52,8 % de los votantes votaron por el no»—. La
medición de dónde ponerlo es lo que enseñó que no hacía falta ponerlo.

**Se queda fuera un caso conocido**, el de La Patria —«Grados Alejandro
Calderin Mié, 09/09/2026 - 00:00»—, porque para cazarlo hay que reconocer el
nombre de un autor suelto, y eso es adivinar. Prefiero perder ese uno a meter
una regla que no sé medir.

### Y un hallazgo que nadie había anotado: la firma del gestor en español

El punto 16 quitó «The post … appeared first on …» y **solo miró el inglés**.
WordPress emite la misma firma en castellano —«La entrada … se publicó primero
en …»— cuando el sitio está en español, y en número de medios es **más ancha
que la inglesa**: 218 artículos de **doce** medios —72 de MiPutumayo, 36 de
Noticias Uno, 29 de Razón Pública, 22 del Diario del Huila, 17 de Lente
Regional, y el resto repartido—.

De esos 218: en **80 el artículo se queda sin resumen** (en 70 la firma era el
resumen entero, en 10 lo que sobra no llega al suelo de 30 caracteres) y a los
**138 restantes solo se les corta la coleta**.

> Con los dos cambios juntos, **1 106 resúmenes pasan a `null` y 591 se
> acortan**. Los 8 que caen por la firma inglesa ya los arreglaba el punto 16.

### Dónde quedó, y qué se reutilizó

En `extractSnippet`, que ahora recibe también el titular y el nombre y dominio
del medio: **el resumen no se puede juzgar solo**. Los tres son opcionales, así
que una llamada de un argumento sigue valiendo y no aplica la regla.

«Cómo se nombra el medio a sí mismo» es **la misma lista que usa
`cleanHeadline`** —nombre, dominio, `www.` más dominio— porque es el mismo
fenómeno por el otro extremo del ítem: Google News le pega la marca al titular
por un lado y al resumen por el otro. Tener dos nociones distintas de «cómo se
llama este medio» sería pedir que se separen algún día.

### Verificado

**859/859 pruebas** —11 nuevas, y las que importan son las cinco de lo que
**no** se toca: la entradilla corta que sí informa, el nombre propio que el
titular no da, la entradilla que empieza repitiendo el titular, el resumen que
nombra al medio sin repetirlo, y la llamada sin titular—. Lint limpio, `tsc`
sin errores, `check:comentarios` en verde, build correcto y `npm run mirar`
10/10 en verde. La comprobación contra el corpus se hizo **con la función real
importada**, no con una reimplementación, que es lo que dio las cifras de
arriba.

> **Y una observación sobre el CI, que no es de este cambio pero se vio aquí.**
> `ci.yml` se dispara con `pull_request: branches: [main]`, así que **una PR
> contra la rama de integración no pasa `verify` ni `esquema`**: la #33 solo
> tiene los dos checks de Vercel. No es grave hoy —lo que se fusiona a `main`
> es la #32, y esa sí los pasa con todo dentro—, pero significa que **el CI no
> vigila el escalón intermedio**, que es justo donde se resuelven los
> conflictos. Los tres pasos se corrieron a mano y en verde; `esquema` no,
> porque exige `DATABASE_URL_PRUEBA` y borra el esquema que apunta —el
> guardarraíl hizo su trabajo—, y este cambio no toca SQL.

## 2026-09-09 · Los vínculos también dejan de reescribirse enteros (punto 15 · la otra mitad de H4)

H4 quitó el 8 de septiembre el despilfarro de `stories`. **`story_articles`
seguía borrándose y reinsertándose completa en cada ciclo**, y esa era la mitad
que quedaba.

**Medido antes de tocar nada:** 7 586 enlaces de historias vivas × **51 ciclos en
las últimas 24 h** = **386 886 filas escritas al día**. Y esa cifra se queda
corta: cada `DELETE` deja además su propia versión muerta de la fila para que la
recoja el recolector después.

El argumento es el mismo que el de H4, y sigue siendo cierto: **el corpus se
mueve en los bordes.** Un artículo entra o sale de una historia de vez en cuando;
los otros siete mil quinientos vínculos son exactamente los mismos que hace media
hora.

### Cómo quedó: una sola sentencia con tres partes

| | Qué hace |
|---|---|
| `deseado` | los vínculos que este ciclo quiere, filtrados por que el artículo exista de verdad |
| `sobran` | borra los que la historia tenía y ya no quiere |
| `faltan` | inserta los que quiere y no tenía |

Van juntas en una sentencia para que las tres vean el mismo estado de la base.

**`faltan` usa `NOT EXISTS`, y no solo `ON CONFLICT DO NOTHING`, y esa es la
diferencia entre ahorrar y creer que se ahorra:** Postgres resuelve el conflicto
insertando una fila especulativa y matándola después, así que «no hacer nada» al
chocar **sigue costando escritura**. Con el `ON CONFLICT` a secas, los 7 586
enlaces se habrían escrito igual y el ahorro habría sido imaginario. El
`ON CONFLICT` se queda para el único caso que el `NOT EXISTS` no cubre: que el
mismo par venga dos veces dentro del propio lote.

### Comprobado contra la base, mirando el `xmin` de cada fila

`xmin` es la transacción que escribió la fila: si no cambia, Postgres no la
reescribió. Todo dentro de una transacción terminada en `ROLLBACK`, sobre una
historia real de seis enlaces:

| Escenario | Resultado |
|---|---|
| **Nada cambia** —el caso de casi todos los ciclos— | `borrados: 0, insertados: 0` · **0 filas reescritas de 6** |
| Entra un artículo y sale otro | `borrados: 1, insertados: 1` · las **5 restantes con el mismo `xmin`**, intactas |

No es una estimación: es la base diciendo qué filas tocó.

### Y se lee desde el ciclo, como la de H4

La línea del ciclo añade **`enlaces +N −M`** cuando hay algo que decir. Antes se
reescribían los 7 586 en cada pasada; si vuelven a salir números de ese orden, el
diferencial dejó de filtrar y se ve de un vistazo, sin creerse ningún comentario.

### Verificado

**847/847 pruebas** —4 nuevas, y vigilan la forma, que es lo que puede volver
atrás sin que nadie se entere: que ya no exista el `DELETE ... WHERE story_id =
ANY`, que la sentencia calcule deseado/sobran/faltan, que `faltan` lleve su
`NOT EXISTS`, y que el ciclo informe de las dos cifras—. Lint limpio, `tsc` sin
errores, `check:comentarios` en verde y build correcto. No se corre `mirar`: esto
no toca una línea de la interfaz.

## 2026-09-09 · La costura base↔memoria deja de estar escrita dos veces (punto 14 · 2.4)

`persistArticles` escribía columnas a mano y `articuloDesdeFila` las leía a mano:
**dos serializadores escritos por separado para la misma costura**. Cuando se
separan no falla nada —la fila se guarda, el artículo vuelve— y solo falta un
campo que nadie echa de menos hasta que una pantalla enseña un cero.

Ha pasado tres veces, y la tercera fue **hoy mismo, escribiendo esta misma
costura**:

| Cuándo | Qué se perdió | Qué se vio |
|---|---|---|
| 2026-08-19 | `topics` y `ambito`: se escribían y no se leían | 99 de las 100 historias de portada sin tema, y Categorías con catorce ceros |
| 2026-08-21 | La marca de opinión al rehidratar | 71 columnas reentrando al agrupamiento en cada arranque |
| **2026-09-09** | El parámetro **`$14`** de `feed_categories` | Nada: lint, `tsc` y **845 pruebas en verde** con el fallo dentro |

### Qué se hizo: una lista que se USA, no que se comprueba

`server/db/contratoDeArticulo.js`, con la misma forma que `contratoDeHistoria`
tiene para la otra costura. De esa lista salen, generados:

- la lista de columnas del `INSERT`,
- las expresiones de su `SELECT` —incluidos los dos `CASE WHEN` que parten los
  arrays que viajan como cadena—,
- los `$n::tipo[]` del `unnest` **y sus valores en el mismo orden**,
- las columnas que pide la rehidratación,
- y el objeto que vuelve a memoria.

**Un campo nuevo es una línea ahí y nada más.** Olvidarse de un parámetro deja de
ser posible porque ya nadie los numera a mano: era, literalmente, el fallo de
esta mañana.

Lo que NO sale del contrato, a propósito: el `ON CONFLICT`. Qué se rellena al
reencontrar una fila es política de escritura, se decide caso por caso y se lee
mejor donde se toma.

### Y una lista para lo que no se guarda, con el motivo escrito

`CAMPOS_QUE_NO_SE_GUARDAN` explica por qué `outlet` sale del JOIN y por qué la
marca de `opinion` se deriva en vez de guardarse. Existe para que la prueba pueda
exigir que **todo campo esté decidido**: hay una que lee el literal
`const article = {…}` de la ingesta y exige que cada uno de sus campos tenga
columna o motivo. Añadir un campo sin decidir qué pasa con él deja de ser posible
en silencio.

### Las dos pruebas, y la diferencia entre ellas importa

1. **`contratoDeArticulo.test.js` (12 pruebas, sin base).** La ida y vuelta que
   la revisión externa pedía por su nombre: un artículo baja, vuelve y se compara
   campo a campo. Incluye los casos que costaron dinero —«Bogotá, D.C.» como
   etiqueta, que es la razón de que el separador sea el tabulador; vacío contra
   NULL en `topics`— y **el fallo del `$14` convertido en prueba**: tantos
   valores como parámetros, tantos parámetros como columnas.
2. **`npm run db:contrato` (nuevo).** La misma ida y vuelta **contra la base de
   verdad**, dentro de una transacción que termina en `ROLLBACK`. Es lo que las
   pruebas no pueden hacer: comprobar que el SQL es válido. Los 14 campos vuelven
   enteros, incluidos los tres que Postgres transforma.

> Se probó también el camino del fallo, rompiendo un campo a propósito: dice
> «1 campo(s) no sobreviven el viaje» y sale con código 1. Un vigilante que nunca
> se ha visto fallar no está comprobado.

### Una prueba vieja cambió de forma, y no se borró en silencio

`contentStore.test.js` tenía tres comprobaciones que leían el texto del archivo
para verificar que el mapeo, la consulta y el `INSERT` coincidían. Existían
porque eran tres listas a mano que podían separarse. **Ahora salen de una sola,
así que comprobar que coinciden es comprobar que `map` funciona.** Se sustituyen
por lo que el contrato no puede saber: que las columnas del medio —las del
JOIN— siguen pidiéndose. El motivo queda escrito ahí mismo.

### Verificado

**843/843 pruebas**, lint limpio, `tsc` sin errores —el contrato lleva su
`@typedef` porque el compilador no infiere claves de un bucle, y hay prueba de
que el typedef y la lista dicen lo mismo—, `check:comentarios` en verde, build
correcto y `npm run db:contrato` con los 14 campos enteros. No se corre `mirar`:
esto no toca una línea de la interfaz.

## 2026-09-09 · La portada dejó de pedir las mismas historias cinco veces (punto 13 · T2-2)

**Medido sobre el sitio publicado, antes de tocar nada: la portada hace cinco
peticiones a `/api/feed`** —`limit=60`, `limit=40`, `limit=60`, `limit=100` y
`limit=60`—, una por cada componente que se traía los datos por su cuenta: la
barra de navegación, el destacado, las dos barras laterales y el feed.

**Lo que importa no es el número de peticiones, es que son cinco fotografías de
cinco instantes distintos.** El ciclo de ingesta entra cada 30 minutos y
reordena la portada; si cae entre dos de esas peticiones, la página enseña dos
mundos a la vez y nadie se entera.

Y hay un caso peor que el del relevo, que es el que se ve todos los días: **la
barra de navegación dura toda la sesión y las páginas se montan debajo**. Su
buscador seguía respondiendo con la lista del primer minuto mientras la página
que estabas mirando ya tenía otra.

### Cómo quedó: un proveedor, y dos tuberías solo cuando hacen falta

`ProveedorDeHistorias` envuelve el árbol de `Shell` —por encima de la barra y de
las rutas— y es **el único sitio del proyecto que llama a `useStories`**. Los
componentes leen con `useHistorias({ limit })` o, el feed, con
`useFeedDeHistorias()`.

Hay dos tuberías porque el feed tiene un filtro de ÁMBITO que el resto de la
página no tiene:

| | Qué pide | Quién la lee |
|---|---|---|
| **ambiente** | `ambito: 'all'` | destacado, laterales, buscador de la barra, secciones, tendencias, búsqueda |
| **feed** | la misma, salvo que el lector filtre | el feed |

Si todo colgara de una sola, filtrar el feed a «internacional» cambiaría también
el destacado. **Eso no era la incoherencia que había que arreglar**: es una
pregunta distinta y deliberada del lector.

**El ámbito no hizo falta levantarlo a estado: ya vive en la URL** desde F3-06,
así que el proveedor y el feed leen la misma fuente sin pasarse nada.

### Medido después

| | `/api/feed` | |
|---|---:|---|
| Publicado (portada) | **5** | 60, 40, 60, 100, 60 |
| Esta rama (portada) | **1** | 100 |
| Esta rama (portada filtrada) | **2** | la de ambiente y la del ámbito |
| Esta rama (`/tendencias`) | **1** | antes eran 2, con la barra aparte |

*(En desarrollo cada una sale duplicada: es `StrictMode`, que monta los efectos
dos veces. Las cifras de arriba son las reales.)*

### El recorte no es un detalle

`useHistorias({ limit: 40 })` devuelve **las primeras 40**, no las que haya. Sin
eso, un componente que pide 40 vería 200 en cuanto el lector hubiera pulsado
«cargar más» en el feed, y las cifras que se calculan sobre lo descargado
—«reparto sobre las 100 historias con más cobertura»— cambiarían según por dónde
hubiera navegado antes. Con el recorte, cada uno ve exactamente lo que veía
cuando se traía sus propios datos.

### Lo que costó, dicho para que nadie lo eche de menos

**La propiedad de que «cada componente es autosuficiente».** Un componente ya no
se puede montar suelto: necesita el proveedor encima. Era el precio que el plan
de continuidad ya había aceptado, y por eso los hooks fallan ruidosamente
—`throw`— si alguien los usa fuera: un estado vacío de mentira dejaría la página
diciendo «sin datos» sin que nadie supiera por qué.

### Y una trampa que ninguna prueba vio, y que cazó abrir el navegador

El interruptor nuevo de `useStories` se llamó `activo`… y dentro de su efecto ya
había un `let activo` que es la bandera de cancelación. **La página entera se
caía con «Cannot access 'activo' before initialization»** y salía el cortafuegos
del `ErrorBoundary`.

**Lint, `tsc` y las 851 pruebas pasaron con el fallo dentro.** Lo encontró contar
las peticiones con un navegador de verdad. Se renombró a `encendido`, y hay
prueba de que no se vuelvan a llamar igual.

> Es la tercera vez este mes que el defecto está en la costura y las pruebas
> pasan por encima. Justifica sola el ritual de mirar antes de publicar — y esta
> vez `npm run mirar` sí lo habría cazado, porque desde esta mañana se niega a
> dar el ✓ sobre una portada sin historias.

### Verificado

**854/854 pruebas** —3 nuevas, y son de invariante: que nadie más llame a
`useStories`, que el proveedor siga por encima de la barra y de las rutas, y que
el interruptor no se llame como la bandera—, lint limpio, `tsc` sin errores,
`check:comentarios` en verde, build correcto y **`npm run mirar --movil`: 20/20
rutas**.

## 2026-09-09 · RTVC no estaba mudo: tenía feed propio y nadie lo había encontrado (punto 20)

**`https://www.rtvcnoticias.com/noticias/rss.xml` — RSS 2.0, diez ítems, el más
reciente de hace tres horas.** Por Google News el medio llevaba «sin publicar
desde el 2026-09-01», sus tres historias estaban archivadas y **hoy el canal
público no aparecía por ninguna parte del sitio**. La ventana era nuestra, no
suya.

`/rss.xml` sigue siendo el abandonado que se midió en julio —ítem más nuevo del
30 de mayo, luego un salto a junio de 2024, uno titulado «sitio en
mantenimiento»—, así que aquella conclusión era correcta **sobre la ruta que se
probó**. La viva estaba una carpeta más adentro.

### Por qué no la encontró el descubridor, que es lo que hay que arreglar

`descubrirFeed` prueba `/rss/noticias` y `/noticias/feed`, pero no
`/noticias/rss.xml`. **Es el caso de El Pilón otra vez**: aquella vez la lección
se anotó como «añadir `/api/rss`», cuando la lección de verdad era que **la ruta
puede colgar de una sección**. Añadidas `/noticias/rss.xml` y
`/actualidad/rss.xml`, con el porqué escrito al lado de la lista.

### Lo que gana el medio al salir de Google News

**Sus URL llevan sección** —`/justicia/`, `/actualidad/cultura/`,
`/actualidad/educacion/`—, mientras que las de Google News son redirecciones sin
ruta. Nueve de los diez ítems se clasifican con tema, contra el 39,6 % del corpus
que se queda sin ninguno, y `detectarOpinion` vuelve a poder verlo. Pasadas las
diez piezas por las reglas de ingesta —`cleanHeadline`, `assessArticle`,
`parsePublishedAt`—, **entran las diez**.

### HALLAZGO · El `http` del feed lleva a Coljuegos

El feed declara `xml:base="http://www.rtvcnoticias.com/"`, así que todos sus
enlaces salen en `http`. Y ese `http` **no lleva al artículo**: responde `302`
hacia `https://www.coljuegos.gov.co/publicaciones/301824`, el regulador del
juego. En `https` el mismo enlace responde `200`.

**Sin verlo a tiempo, cada noticia de RTVC habría mandado al lector a Coljuegos**,
y el enlace verificable es la mitad de este producto. Lo arregla
`canonicalizeLink`, que ahora sube a `https` los enlaces **del propio medio**,
decidiendo «del propio medio» con la misma regla que ya usaba
`urlDeImagenValida` para las imágenes. Un enlace a un tercero se queda como
viene: no sabemos si ese tercero sirve `https`, y promocionarlo a ciegas
convertiría un enlace que funciona en uno roto.

De paso alcanza a los **667 enlaces `http` que ya había en el corpus, todos de
Euronews**, que redirigen con `301` a su propio `https`: ahí solo ahorra un
salto.

### Dos cosas que se vieron y no se tocaron

1. **El resumen es el titular repetido más el usuario del gestor**
   —«…wfvasquez@cont… Mar, 01/09/2026»—. Es el caso hermano de la plantilla de
   WordPress del punto 16. Queda anotado como punto 26.
2. **El medio publica la misma pieza dos veces**, con dos slugs
   (`…-cuatro` y `…-cuatro-0`). Las dos entran como artículos distintos del mismo
   medio. Es un duplicado suyo, no nuestro, y el agrupamiento cuenta medios
   distintos, no piezas; queda dicho por si aparece en una cifra.

### Y una observación editorial que no es de código, y es de Jose

**El medio se llama a sí mismo «Inravisión, Sistema de Medios Públicos»** en sus
titulares, y tiene una sección `/actualidad/inravision/`. En el catálogo sigue
como «RTVC Noticias». Además, tres de sus diez piezas son sobre sus propios
conflictos institucionales —una tutela de Iván Cepeda por las Emisoras de Paz, el
cese de emisión de cuatro emisoras de paz, y una rectificación a La Silla Vacía—.

Eso es **conducta observable del presente**, que es justo lo que la ficha de RTVC
decía no tener: la previsión escrita el 2026-08-08 ya se puede empezar a
contrastar. La ficha sigue sin firmar y el número sigue siendo de Jose.

### Verificado

**851/851 pruebas** —6 nuevas sobre `canonicalizeLink`, incluida la del dominio
que solo *se parece*—, lint limpio, `tsc` sin errores, `check:registry` sin
errores tras regenerar `catalogo_medios.txt`, `check:comentarios` en verde y
build correcto. `npm run mirar` no alcanza a este cambio: es del motor, y la rama
no está desplegada en Fly.

## 2026-09-09 · El filtro de opinión deja de ser ciego para 22 medios (punto 18)

**Decisión de Jose el 2026-09-09, entre las tres salidas que la entrada del 08-09
dejó escritas: la etiqueta que el propio medio le pone al ítem en su RSS.**

### Lo que se midió antes de proponer, que es lo que decidió

Los 22 medios que publican en la raíz **son los 22 WordPress**, y **el 100 % de
sus ítems trae `<category>`**. No es una señal que haya que ir a buscar: ya
viaja en el mismo ítem que se parsea, y ya se usaba como refuerzo del
clasificador de temas.

Aplicando la lista de etiquetas a lo que publicaban ese día:

| Medio | Marcaría | Marca hoy |
|---|---:|---:|
| Las2Orillas | **38 de 150 ítems** | 0 de 177 piezas del corpus |
| Volcánicas | **6 de 40** | 0 |
| Razón Pública | **3 de 10** —la caricatura incluida— | 0 |

Y los titulares no dejan lugar a duda: «Caricatura: Impuesto saludable», «Si para
estar seguros necesitamos armarnos, el Estado ya perdió», «Cepeda y De la
Espriella: dos maneras de construir una mayoría».

**Es la misma clase de señal que la ruta**, y por eso es admisible con el mismo
argumento: la escribe el medio al publicar. No se analiza el texto de la pieza
—eso sigue fuera de este proyecto—, se lee cómo la clasificó quien la publicó.

### La decisión de diseño que evita el daño peor

**Coincidencia EXACTA de la etiqueta entera, nunca subcadena.** Marcar como
opinión una noticia real la saca del agrupamiento, y ese es el daño que
`shared/opinion.js` lleva declarando desde agosto —«se prefiere quedarse
corto»—. El precedente está en contentQuality: un patrón de lotería descartó
«obras de rehabilitación del CDI El Dorado» por buscar la subcadena. Con
coincidencia exacta, `Editorial Planeta` y `Opinión pública en Colombia` no son
opinión, y hay prueba de las dos.

Las tildes sí se ignoran, porque en el catálogo real conviven «Opinión»,
«Opinion» y «opiniòn» con acento grave —Proclama del Pacífico— y las tres son la
misma sección de la misma casa.

**Lo que se dejó fuera a propósito, y conviene que esté escrito:**

- **`Nota Ciudadana`** (Las2Orillas, 18 ítems): es contenido de lectores, que no
  es lo mismo que una columna. Se decide mirándolo, no de paso.
- **`Análisis`**: Razón Pública publica análisis y solo análisis, y si eso debe
  entrar al agrupamiento es el punto 7, que sigue abierto. Meterlo aquí sería
  contestarlo de tapadillo.

### Y el hallazgo de arquitectura: se guarda la ENTRADA, nunca el veredicto

La marca de opinión **no se guarda**: `articuloDesdeFila` la deriva de la URL en
cada rehidratación, y el comentario del 2026-08-21 explica por qué —la URL ya
está guardada, así que el veredicto sería un duplicado, y el día que se afine la
detección los valores viejos seguirían mintiendo—.

**La segunda señal no estaba guardada en ninguna parte**, así que la respuesta no
era guardar el veredicto sino guardar **la otra entrada**: la columna nueva
`articles.feed_categories`. Con eso la propiedad se conserva entera: **cambiar la
lista de etiquetas vuelve a marcar bien el corpus en el siguiente arranque, sin
una sola escritura.**

Y el `ON CONFLICT` rellena las etiquetas de las filas que se guardaron antes de
que existiera la columna, igual que ya hacía con la imagen. Es lo que evita que
los 22 tengan que esperar a que su corpus entero se renueve: **lo que siga
apareciendo en su feed se completa solo.**

### Los límites, dichos ahora y no cuando se noten

- **La marca no llega de golpe.** Hoy las 40 793 filas tienen `feed_categories`
  en NULL. Se van llenando conforme cada feed reexpone sus piezas, así que el
  techo del primer ciclo es lo que quepa en el feed: ~38 de Las2Orillas, 6 de
  Volcánicas, 3 de Razón Pública.
- **Lo que ya salió del feed y no vuelva se queda sin etiqueta y sin marcar.**
  Se cura al caer de la ventana de 30 días.
- **El nivel 2 de las seis fichas sigue sin valer hasta que el corpus esté
  marcado.** Queda anotado como punto 25.

### Verificado

**845/845 pruebas** —9 nuevas, con etiquetas reales leídas de los feeds ese
día—, lint limpio, `tsc` sin errores, `check:comentarios` en verde y build
correcto.

**Y el SQL nuevo se probó contra la base de verdad sin dejar nada**: el `ALTER`
y el `INSERT` de 14 parámetros dentro de una transacción terminada en `ROLLBACK`
—el DDL de Postgres es transaccional—, comprobando además que el relleno del
`ON CONFLICT` completa una fila que tenía NULL.

> **La migración ya está aplicada en producción** (`npm run db:migrate`,
> 2026-09-09). Importaba el orden: los dos despliegues salen solos con el push a
> `main`, y si el motor nuevo hubiera arrancado antes que la columna,
> `persistArticles` habría fallado en cada ciclo —en silencio, porque pasa por
> `safeQuery`—. Añadir una columna que nadie lee todavía no le hace nada al motor
> vigente.

## 2026-09-09 · La etiqueta de la mitad de la portada era nuestra, no de la noticia (puntos 16 y 17)

Los dos puntos venían del mismo hallazgo de la tercera tanda de fichas —«el
sistema falla siempre del mismo lado»— y los dos se midieron antes de tocar
nada. **Uno era mucho más grande de lo escrito y el otro no existía.**

### El 17 · `[]` y `null` significaban lo mismo, y no lo son

`nombreDeSeccion` tenía una sola rama para las dos cosas: `topics` **ausente**
—«esta API todavía no manda el campo»— y `topics` **vacío** —«se miró y esta
historia no tiene tema»—. Las dos caían a `category`, la sección heredada del
feed por el que entró la pieza, que es un registro de archivo y no un campo de
presentación.

**Medido sobre las 6 313 historias vivas del 2026-09-09: 2 364, el 37,4 %,
llevaban una etiqueta que no era suya sino nuestra.** No cinco piezas de
Vorágine: la mitad larga de lo que se ve.

| Lo que decía la tarjeta | Cuántas |
|---|---:|
| «Internacional» | 1 369 |
| «Política» | 940 |
| «Economía» | 34 |
| «Politica» (sin tilde, del registro) | 19 |
| «Judicial» | 2 |

Dos ejemplos de portada, los dos marcados **«Política»**: el contrato
«salvavidas» que le proponen a James en la B de Italia, y una alerta de que El
Niño puede aumentar las consultas por infecciones respiratorias. Ninguna de las
dos es política; las dos entraron por un feed que configuramos así.

**Y 80 decían «Internacional» mientras nuestro propio clasificador las tenía por
nacionales**: dos respuestas contrarias a la misma pregunta en la misma tarjeta.

#### El arreglo: tema → ámbito → (solo si la API no manda `topics`) el feed → nada

**El ámbito sí se puede enseñar**, y por eso entra en medio de la escalera: no se
hereda del feed, lo calcula el clasificador sobre el texto. El reparto que deja:

- **1 358** conservan «Internacional», que ahora es verdad medida y no una
  herencia.
- **1 006** se quedan **sin etiqueta**, que es lo honesto. Quien la pinta
  comprueba que no esté vacía, así que no queda una baldosa hueca en la tarjeta.
- **80** dejan de contradecir al clasificador.

El respaldo de despliegue —Vercel y Fly se publican por separado, y hay ratos en
que la API vigente no manda `topics`— **sigue exactamente igual**, y ahora tiene
prueba propia que lo distingue del caso vacío.

#### De paso, dos fugas más de la misma columna

1. **«Más en X»** en la página de la noticia agrupaba con
   `s.category === story.category`: juntaba piezas cuyo único parentesco era
   haber entrado por la misma cañería nuestra. Ahora pregunta con `perteneceA`,
   igual que la pantalla de secciones, y si la historia no tiene sección el
   bloque no se pinta.
2. **La sugerencia del buscador** pintaba `story.category` en crudo.

**Lo que se deja a propósito:** `SearchResults` sigue buscando dentro de
`story.category`. Ahí no es una etiqueta que se le enseñe a nadie sino un pajar
donde se busca, y quitarlo es parte de la decisión del resumen (punto 8).

### El 16 · La plantilla de WordPress es cuatro veces más común, y no rinde nada

**Lo escrito decía 8 piezas de 2 medios. Son 452 de cuatro**: 360 de La Silla
Vacía, 74 de Canal Capital, 16 de Chocó 7 Días y 2 de Vorágine. En 8 de ellas el
resumen entero es la firma y nada más; en las demás va pegada al final de un
resumen de verdad.

**Y la premisa del punto era falsa, que es lo que importa.** Se reclasificaron
las 452 con y sin firma: **cero cambian de tema**. Visto de cerca tiene sentido
—el titular que la firma repite ya puntúa por el titular de verdad, y «appeared
first on» no está en ningún léxico—, así que **las que no tienen tema no lo
tienen por esto**. La causa de que Vorágine sea el peor clasificado del corpus
sigue estando en otro sitio.

> Es el mismo error de forma que «rinde 102»: una observación cierta —la firma
> está ahí, y las piezas que la llevan están sin tema— convertida en una causa
> que no se había comprobado.

Se limpia igual, y ahora por el motivo correcto: **es texto que se guarda y que
un día se enseña**. El buscador ya dice buscar dentro del resumen, y si el motor
acaba mandándolo (punto 8), 452 piezas le enseñarían al lector su propio titular
repetido en inglés. Se quita en `extractSnippet`, antes del recorte a 400, para
que el corte no deje media firma.

### Verificado

**836/836 pruebas** —8 nuevas—, lint limpio, `tsc` sin errores,
`check:comentarios` en verde, build correcto y `npm run mirar` en verde sobre las
diez rutas. Y se ha mirado una historia de las que se quedan sin etiqueta
—«Cartagena fortalece su alumbrado público», hoy marcada «Política»—: la
cabecera queda entera sin la baldosa.

## 2026-09-09 · `mirar` ya no da el ✓ a una página vacía (punto 19)

**El vigilante que mira antes de publicar no distinguía una portada llena de una
vacía.** Sus tres comprobaciones miran la FORMA —que nada se salga, que nada se
recorte, que nadie pise al vecino— y **una página en blanco las pasa todas**. Es
la enfermedad de siempre de este proyecto, un vigilante que no puede fallar, y
esta vez le tocaba al último paso del ritual de publicación.

### Lo que se le añadió: una cuarta comprobación, en tres afirmaciones

| | Qué afirma | Qué caza |
|---|---|---|
| a | No quedan esqueletos de carga sin resolver | La página que nunca terminó de cargar: lo que se ve no es lo que se publica |
| b | El contenido tiene al menos 400 caracteres de texto | La página en blanco y el error de arranque |
| c | Las **señales declaradas** de esa ruta están ahí | La portada entera y sin una sola historia |

Las señales solo se declaran para **las cuatro páginas cuyo contenido lo sirve el
motor** —`/`, `/categorias`, `/tendencias`, `/mapa-medios`—, que son las únicas
que pueden salir vacías sin que nada falle. Las seis de Transparencia son prosa
del repositorio: o sale con la página, o no hay página, y solo se les exige el
suelo de texto.

**Los mínimos son deliberadamente bajos** —1 destacada, 3 tarjetas, 5 secciones,
3 tendencias, 10 medios en el mapa—. Esto no mide cuántas historias hay: separa
«hay» de «no hay». Un vigilante que parpadea se acaba ignorando, y entonces
sobra.

### Comprobado en los dos sentidos, que es lo que faltaba la vez pasada

- **Con el motor de producción**: 10/10 rutas en verde en escritorio, y 20/20
  añadiendo móvil. Ningún falso positivo.
- **Con el motor muerto** (`API_DEV=http://127.0.0.1:5999 npm run mirar -- /`):
  la portada sale ✗ y dice por qué —«sin la historia destacada: 0 en la página»,
  «sin las tarjetas del feed: 0 en la página»—. **Antes ese mismo caso daba
  «Nada que reprochar a lo que se ve».**

Lint limpio y `check:comentarios` en verde. No toca nada que importe a las
pruebas: `scripts/mirar.mjs` solo lo nombran `package.json` y la configuración
de ESLint.

### Y una corrección sobre la causa que se escribió ayer

Se dejó escrito que había que correrlo como `VITE_API_URL=same-origin npm run
mirar` porque este `.env.local` apunta a `http://localhost:5000`. **Hoy no hace
falta, y conviene saber por qué**: `arrancarVite()` ya le mete
`VITE_API_URL: 'same-origin'` al proceso de Vite, y Vite da **prioridad a la
variable inline sobre la del fichero `.env.local`**. Corriendo `npm run mirar` a
secas, sin prefijo, la portada sale llena — y la captura lo enseña.

Así que el `.env.local` no es la causa que se le atribuyó. La portada vacía de
ayer tuvo otra —la más probable, que la API no contestara en ese momento—, que
es exactamente el caso que la comprobación de arriba ahora sí caza. **El defecto
que importaba era el segundo, y ese era real y está arreglado.**

## 2026-09-08 · El archivo se llenó de huérfanas, y la red que lo vigilaba tenía agujeros (PR #24)

**Seis días después de estrenar el archivo, cuatro de cada cinco páginas
archivadas no debían estar ahí.** Salió de mirar `/api/health` al volver:
`historiasArchivadas: 1975` en seis días, para un corpus de 6 234 vivas.

### Se archivaba lo que el agrupamiento recomponía, no solo lo que envejecía

Una historia deja de producirse por dos motivos que no se parecen en nada: sus
artículos salieron de la ventana —el hecho envejeció, y eso es archivo— o un
artículo nuevo unió dos grupos y ahora cuelgan de otro id, que no es archivo
sino la misma noticia con otro nombre, con su URL y anunciada en el sitemap.

**Medido contra producción:** de 1 975 archivadas, **1 554 (79 %)** tenían su
artículo más nuevo con menos de 48 h y 695 con menos de doce. Solo 421 son
archivo de verdad. De las 1 554, **864 comparten artículo con otra historia**
—recomposición demostrada— y las otras 690 dejaron de producirse con sus piezas
frescas, que tampoco es envejecer.

Se archiva ahora por **madurez**: cuando el artículo más reciente ya pasó de dos
tercios de la ventana de agrupamiento —48 h de 72—. Es una fracción y no un
número de horas, para que siga significando lo mismo si la ventana cambia. El
criterio evidente —«sin artículos en la ventana»— **está medido y no funciona**:
el techo de `MAX_ARTICLES` expulsa por comparabilidad antes de que cumplan la
edad, así que con él el archivo se habría quedado vacío para siempre.

- **El arreglo estaba escrito desde el 2026-09-02 y sin comprometer**, en la
  copia de trabajo, junto al commit de la Etapa B. Seis días a un `git checkout`
  de distancia.

### La red que vigila el archivo miraba dos ficheros de los ocho

`archivo.test.js` nació mirando `feedStore` y `contentStore`, que son los que
sirven la portada. **Seis consultas de fuera de esos dos** seguían tratando
`stories` como «lo que hay ahora», y ninguna fallaba nada:

- **`recategorizar` REESCRIBÍA historias congeladas.** Volver a clasificarlas
  con el léxico de hoy cambia una página que el lector cree fija.
- **El invariante de la unión acusaba historias archivadas**, que nadie puede
  arreglar porque ningún ciclo las recompone. Un aviso que no se puede cerrar es
  como se estropea un vigilante. Y ahora devuelve **los ids**: acusó «1
  historia» el 7 y el 8 de septiembre y las dos veces estaba limpio cuando
  alguien fue a mirar.
- **`evalSucesos` y `cleanFiltered`** prometían del archivo cosas que no ocurren.
- **Moderación, reportes y el informe de migración SÍ deben verlo**, y ahora lo
  declaran: una historia sellada sigue siendo pública, así que tiene que poder
  retirarse y reportarse.

El barrido es ahora todo `server/**` y `scripts/**`: un fichero nuevo entra en
la red sin que nadie se acuerde de añadirlo. Comprobado con un fichero de
mentira, que lo acusa.

- **Estado: HECHO, en la PR #24.** Se cierra al fusionar.

### Lo que queda por hacer A MANO, y en este orden

`npm run archivo:huerfanas` aplica el mismo criterio hacia atrás —en seco por
defecto, con la lista a la vista y respetando la salvaguarda de moderación—.
Hoy borraría 1 554. **Se ejecuta DESPUÉS de que Fly sirva la PR #24**, no antes:
si no, el ciclo siguiente vuelve a llenar el archivo. Decisión de Jose del
2026-09-08, con las otras dos opciones —dejarlas o desarchivarlas— medidas y
descartadas: desarchivar no sirve porque sus artículos acabarán madurando y el
ciclo las archivaría igual, duplicando la historia viva que las absorbió.
## 2026-09-08 · El timbre de los vigilantes no podía sonar: la tubería se comía el fallo (PR #25)

**El 31 de agosto y el 1 de septiembre se les puso timbre a los cinco
vigilantes. El mismo cambio se lo quitó.** Para meter la salida completa dentro
del issue, cada paso pasó a escribirse `programa 2>&1 | tee fichero`. El shell
por defecto de Actions es `bash -e {0}` —sin `pipefail`—, así que el código de
una tubería es el de `tee`, que es 0 siempre. El paso queda en verde, y con él
`steps.<id>.outcome`, que es lo que deciden los `if:` que abren el issue y los
que ponen el job en rojo.

**La prueba está en Actions y no hace falta razonar sobre ella:** la vigilancia
del 2026-09-08 a las 15:45 UTC imprimió «✗ HAY QUE MIRAR ESTO · 1 medio(s) con
feed llevan 14+ días sin aportar: Telecaribe (26d)» y GitHub la marcó como
exitosa. **Doce días acusando a un medio mudo sin que naciera un solo aviso**, y
no por falta de detección —la detección funcionaba— sino porque el aviso no
llegaba a nacer. Los dos aspas del 7 y el 8 las causó el invariante de la unión,
que es uno de los dos pasos que sí rescataban `PIPESTATUS`.

Es la enfermedad de siempre —un vigilante que detecta y nadie que se entere—
pero un escalón más abajo que las otras veces: aquí ni siquiera había una
acusación que ignorar.

- **Arreglados los cinco pasos** que deciden por el código de salida:
  vigilancia, desfase, copia y los dos del archivo.
- **La auditoría y el centinela deciden por su resumen en JSON**, no por el
  código. Eso era verdad y estaba escrito en prosa; ahora está DECLARADO con una
  frase que la prueba reconoce, en vez de parecerse por casualidad al fallo.
- **`server/flujos.test.js`** vigila el patrón en todos los flujos. Comprobado
  quitándole el rescate a la copia: la acusa por su nombre.
- **Estado: HECHO, en la PR #25.** Se cierra al fusionar.

### Y la vigilancia lee ya el libro de hallazgos, con caducidad

`aceptado` significa desde que se escribió que una persona miró el caso y
decidió que deje de avisar «sin desaparecer». La vigilancia no leía el libro, así
que Telecaribe —aceptado el 2026-09-02— seguía saliendo en rojo cada seis horas.
Dos vigilantes que se contradicen sobre el mismo medio no son el doble de
vigilancia: son uno al que se le empieza a hacer caso y otro al que no.

**Decisión de Jose (2026-09-08): respetarlo, pero con caducidad.** Se añade
`revisarEl` al libro; pasada esa fecha la vigilancia vuelve a acusar y dice que
el plazo venció. **La fecha no se inventó**: Telecaribe ya la tenía escrita en su
propia nota —«si el 13 de octubre de 2026 sigue sin publicar, deja de ser un
silencio y pasa a ser una baja que hay que decidir»—, solo que en prosa, donde
ninguna máquina la lee.

**Los otros tres aceptados se quedan sin plazo** porque su motivo es estructural
—el feed de W Radio expone dos ítems y eso no cambia con el calendario— y la
auditoría los lista aparte para que se vea cuáles son. **Vorágine es el que
conviene mirar**: su nota dice «se revisa si la cadencia grabada muestra más de
30 días sin publicar», que es una regla y no una fecha, y hoy no la comprueba
nadie. Convertirla en `revisarEl` es una línea, pero la fecha la pone Jose.

## 2026-09-02 · Dos defectos que Jose ve y las pruebas no: la categoría que no lleva a ningún lado y el número pegado al titular

**Los dos son de la misma familia:** la página se pinta, no falla nada —ni la
consola, ni el build, ni 789 pruebas— y aun así no sirve.

### Elegir una categoría no llevaba a ningún lado

**El arreglo estaba escrito desde el 31 de agosto y nunca se fusionó.** Vivía en
la rama `arreglo/categorias-no-llevan-a-ningun-lado`, que quedó atrás de `main`
por casi 5 000 líneas. Se trajo el commit suelto, no la rama.

**Qué pasaba, medido de nuevo hoy:** el clic funcionaba —la tarjeta quedaba
marcada y la lista se pintaba con sus historias— pero debajo de una rejilla de
diecisiete tarjetas, y la página no se movía. En escritorio los resultados
caían a 1 474 px (1,6 pantallas) y en móvil a 4 679 px (5,5 pantallas). Desde
el lado del visitante eso no es una lista lejana: es un botón que no hace nada.

Ahora la vista va a los resultados **y el foco también** —un desplazamiento no
le dice nada a quien navega con teclado o lector de pantalla—, respetando
`prefers-reduced-motion`. Comprobado en las dos anchuras: el encabezado de
resultados queda arriba de la pantalla y el foco en su `h2`.

### Los números de tendencias, pegados al titular

**Reportado por Jose como «se sobreponen».** Medido: no se solapaban en
píxeles —el número acababa en la x 967 y el titular empezaba en la 967— y por
eso ninguna comprobación geométrica lo habría visto. **Pero sin un solo píxel
entre los dos se leen como una palabra: «#1Corte Constitucional».** Y con
`align-items: center` el número flotaba a media altura de un titular de tres
líneas, metido entre la segunda y la tercera.

Arreglado en los dos paneles, el de escritorio y el móvil, que llevaban el
mismo patrón y el mismo defecto: separación explícita, el número alineado con
la primera línea del titular, y ni el número ni el conteo se encogen —`width`
a secas es una sugerencia dentro de un contenedor flex, así que un «#10» habría
empujado el titular—. Ahora hay 10 px de aire y la diferencia de altura entre
cifra y titular es 0.

**La lección, y ya van tres:** lo que este proyecto no ve son las costuras y lo
que se ve con los ojos. `npm run mirar` existe para eso y no cubre estas dos
pantallas.
## 2026-09-02 · Etapa A del archivo: las historias multifuente se congelan (ya no se borran)

**La pieza que convierte los 30 días en archivo.** Hasta hoy una historia que
el ciclo ya no producía se BORRABA; ahora las multifuente se sellan con
`stories.archivada_el` y no se recalculan nunca más.

**Solo las multifuente, y es una decisión medida:** de 6 434 historias vivas,
664 tenían más de un medio. Una historia de una sola fuente es un titular
suelto —no hay cobertura que comparar, que es lo único que este sitio existe
para enseñar— y son el 90 % del volumen. Esas se siguen borrando.

**La trampa que había debajo, y que no era obvia:** `story_articles` cae en
CASCADE con el artículo. Sin tocar la poda, una historia sellada habría perdido
todos sus enlaces al cumplir los 30 días —se quedaría con sus números y sin un
solo enlace al medio que la publicó— y además habría desaparecido de la
consulta, que hace JOIN con sus artículos. Ahora la poda no se lleva lo que
sostiene una historia archivada. **No se duplica nada en una instantánea**: el
artículo ya está ahí y su titular es una cita literal, la misma razón por la
que `opinion` se deriva y no se guarda.

**El riesgo de verdad está en las consultas**, y por eso hay red: `stories` pasó
de ser «lo que hay ahora» a «todo lo que hubo», y una consulta que se olvide
del filtro sirve noticias de hace meses **sin fallar**. Una prueba lee el
fuente y acusa a cualquier consulta sobre `stories` sin filtro ni excepción
declarada; **se comprobó quitando un filtro a propósito, y acusó**. Excepciones
escritas: `readStory` —su página es lo que el archivo sirve— y el sitemap.

**Probado contra la base viva, no solo con pruebas.** Un ciclo real archivó 25
historias y borró 216 de una sola fuente. Después: ninguna archivada aparece en
el feed; `readStory` devuelve una de 7 medios con sus 7 fuentes; 64 artículos
quedan protegidos de la poda; y su página responde 200 con su título y sus
medios. El ciclo y `/api/health` informan ahora de las archivadas aparte, para
que el archivo creciendo no se lea como una portada que se llena.

**Lo que queda del plan:** la página archivada tiene que DECIRSE archivo (etapa
B) —hoy se sirve idéntica a una viva, y eso es lo único que aún no es honesto—,
y el buscador (etapa D).


## 2026-09-02 · Las fichas dicen cuándo se comprobaron, y las que no, lo declaran

**Decisión de Jose:** de las tres salidas para las fichas fechadas, la primera
—avisar con la fecha—. Es el paso C.1 de `PLAN_ARCHIVO_PERMANENTE.md`.

**El hueco era el silencio, no la falta de fecha.** El comentario del código
decía desde el principio que «una ficha de propiedad sin fecha se lee como si
fuera de hoy, y no lo es», y la pantalla hacía justo eso: enseñaba la fecha
cuando la había y **callaba cuando no la había**. Medido: de los 78 medios, 52
tienen dueño documentado con fecha, 15 declaran la ausencia con su
`consultadoEl`, y **11 afirman quién manda sin decir cuándo se comprobó**. Esos
once se leían como recién verificados.

**Qué se hizo.** `vigenciaDeFicha()` y la ficha del mapa dice siempre una de tres
cosas: la fecha; la fecha más «le toca revisión» si pasa de doce meses; o que no
consta, con la advertencia de que puede haber cambiado. **Los doce meses no son
un número elegido aquí: son la revisión ordinaria del protocolo (§7).** No se
inventó ninguna fecha —la de un commit diría cuándo se escribió la ficha, que no
es cuándo se comprobó—. `check:registry` avisa ahora de las once.

**Lo que NO se toca:** los medios con ausencia declarada, que ya publican su
propia fecha de búsqueda; decirles además «no registra cuándo se comprobó» sería
contradecirse dos párrafos más abajo.

**Deuda que esto deja a la vista, ABIERTA:** esas once fichas siguen sin fecha.
Ahora se ve, que es distinto de que no exista. Ponerles la fecha exige
volver a comprobarlas, y eso es trabajo de ficha que firma Jose.


## 2026-09-02 · El archivo permanente se hace: plan escrito y coste aceptado

**Decisión de Jose:** adelante con la opción B, con sus 25 USD al mes. El plan
está en `doblefoco-app/PLAN_ARCHIVO_PERMANENTE.md`, y **no da nada por hecho**.

**Lo que ya estaba resuelto sin saberlo:** los artículos ya sobreviven 30 días,
cada historia ya tiene URL estable, y la cobertura ya se guarda CALCULADA —así
que revisar el sesgo de un medio mañana no reescribe lo que una historia vieja
le mostró al lector—. Eso último es media respuesta al problema de fondo de
cualquier archivo.

**El obstáculo real, y no es el dinero:** `persistStories` BORRA cada ciclo las
historias que ya no produce. Archivar es dejar de borrar, y eso cambia lo que
significa la tabla: hoy `stories` es «lo que hay ahora» y pasaría a ser «todo lo
que hubo». Cada consulta que se olvide de filtrar empezaría a servir noticias
de hace meses como si fueran de hoy. Va con prueba.

**Cuatro etapas:** congelar en vez de borrar (2–3 días), la página archivada
(1–2), las fichas fechadas (medio día la versión mínima) y el buscador (2–3).
Semana y media en total.

**El dinero, medido hoy:** la infraestructura cuesta ~5,30 USD/mes (Fly; Supabase
y Vercel en plan gratuito). Con el Pro serían ~30,30 al mes, unos 364 al año.
**No hay que pagarlo todavía**: con 30 días la base se estabiliza en ~290 MB de
los 500 gratuitos, y el techo se alcanza cuando la retención pase de ~55 días.
El pago es el último paso y el más fácil de revertir.

**Decisión que queda de Jose:** cuál de las tres salidas para las fichas
fechadas —decirlo con un aviso, instantánea por historia, o fichas con
vigencia—. Recomendada la primera ahora y la tercera cuando cambie la primera
ficha de verdad; la intermedia es la peor de las tres y el plan dice por qué.

**Y una comprobación antes de contratar:** el consumo de ancho de banda de
Supabase, que es el otro techo del plan gratuito y no se ha medido nunca.


## 2026-09-02 · El aviso de dueño compartido sale de la página de la noticia

**Decisión de Jose**, anotada en `DECISIONES.md`: la concentración por dueño no le
parece tan relevante en el ecosistema de hoy. Se retira el bloque entero del
detalle de la noticia, con su componente y su CSS. **Las fichas de propiedad no
se tocan**: el mapa de medios sigue igual.

**Lo que se pierde:** era el único sitio donde la propiedad aparecía junto a una
cobertura concreta. Quien lea una noticia de trece medios ya no verá que dos son
de la misma casa sin ir al mapa.

**Lo que no se borró:** `gruposCompartidos()` y sus quince pruebas, con la nota que
dice por qué se queda sin consumidor. Un módulo huérfano sin motivo escrito es
lo que se retiró en `securityService.js`; con el motivo escrito, es una pieza
guardada.
## 2026-09-02 · Los tres medios parados, decididos: dos aceptados y El Manduco fuera de la ingesta

**Decisión de Jose sobre lo que la Etapa 4 dejó medido.** Las notas completas
están en el libro de hallazgos; aquí el resumen y lo que cuesta.

- **W Radio: aceptado.** No está parado —publica a diario—; su feed Arc expone
  dos ítems, uno de hace 4,6 años, y de ese par salía el «2 909 h» del libro.
  Se queda como está: por Google News se ganaba una pieza y se perdían todos
  sus enlaces canónicos.
- **Telecaribe: aceptado, con fecha de revisión.** Feed sano, sin publicar
  desde el 13 de agosto. Es un canal público y se espera que vuelva. **Si el
  13 de octubre de 2026 sigue callado, deja de ser un silencio y pasa a ser una
  baja que hay que decidir.**
- **El Manduco: FUERA DE LA INGESTA.** Sitio entero en HTTP 500, 40 ciclos
  seguidos, cero artículos en la base, última pieza conocida de marzo. Se le
  retira el feed y **se queda en el catálogo como medio de referencia**, con su
  ficha y su sitio en el mapa: no se borra el trabajo hecho.

**Lo que cuesta, y se dice aquí para que no se descubra luego: el Guaviare era
suyo y solo suyo.** La cobertura departamental baja de **29 a 28**, y el
catálogo pasa de 72 medios con feed a 71. Vuelve descomentando una línea de
`shared/mediaRegistry.js` el día que su sitio responda; la comprobación es a
mano, porque el centinela vigila fichas y no feeds.

**Y un defecto del libro que sale de aquí, ABIERTO:** la conciliación marcará
`el-manduco/feed` como «resuelto» en la próxima pasada, porque el medio ya no
se audita. Un medio retirado no es un defecto arreglado, y hoy el libro no
sabe distinguirlos. La nota lo avisa; el arreglo sería un estado «retirado», o
que la conciliación respete `aceptado` cuando el medio desaparece del barrido.


## 2026-09-02 · El coste de guardar, vuelto a medir: 6,4 MB al día, no 4,7

**Pregunta de Jose:** si los 25 USD/mes del archivo permanente valen la pena.
Antes de opinar había que rehacer la cuenta, porque **la que circulaba es de
agosto y el catálogo ya no es el de agosto**: con el techo propio de Infobae
(60 piezas por ciclo, decidido ayer) entran 4 097 artículos al día en vez de
unos 2 500.

Medido el 2026-09-02 sobre la base viva:

| | |
|---|---|
| Coste por artículo, con índices | **1,6 KB** (igual que en agosto) |
| Artículos nuevos en 24 h | **4 097** |
| Crecimiento de `articles` | **6,4 MB/día** (antes se decía 4,7) |
| Crecimiento total con historias e índices | ~8,6 MB/día |

Y lo que sale de ahí, que **cambia una de las suposiciones del plan**:

| Retención | Tamaño en régimen | Plan | Coste |
|---|---|---|---|
| 30 días (hoy) | **~290 MB** | Supabase gratuito (500 MB) | 0 USD |
| 90 días | **~810 MB** | ya NO cabe en el gratuito | 25 USD/mes |
| 1 año | ~3,2 GB | Pro (8 GB), con margen para ~2,5 años | 25 USD/mes |

**Lo que estaba mal en el plan:** decía «90 días caben justo en el gratuito, sin
margen». Con el volumen de hoy, no caben: 810 MB contra un techo de 500. Los 30
días que se decidieron ayer sí caben y **se estabilizan en unos 290 MB**,
porque la poda borra a la misma velocidad a la que entra. Margen sobre el techo
gratuito: **40 %**.

**Pendiente que sale de esto, y es barato:** nada vigila el tamaño de la base.
Hoy hay 40 % de margen, pero un medio nuevo de volumen o una subida de techo se
lo come sin que nadie se entere hasta que Supabase corte las escrituras. Un
aviso en la vigilancia cuando la base pase del 80 % del plan es media hora de
trabajo. **ABIERTO.**

**Y la parte que no es de dinero.** La opción B no se decide con esta tabla.
Una página permanente **seguirá afirmando lo que afirmaba, con la ficha de
propiedad que era cierta ese día**, y hoy las fichas no guardan historial: si
mañana cambia el dueño de un medio, la página de una historia de hace seis
meses mostraría la ficha nueva sobre una cobertura vieja. Eso no es archivar:
es reescribir el pasado. Antes de pagar por el archivo hacen falta dos cosas
—la ficha fechada en la página de la historia y el buscador, porque un archivo
sin buscador es un cementerio— y ninguna de las dos cuesta 25 USD: cuestan
días. La cuenta de arriba solo dice que **el dinero no es el obstáculo**.

## 2026-09-02 · Cinco páginas renderizadas que el sitio nunca pedía, y el 404 que las delató

**Salió de ir a arreglar el 404 de `/sobre-nosotros`**, que estaba anotado como
«pequeño» desde ayer. Lo era; lo que había detrás no.

### El 404, y por qué el cliente creía estar redirigiendo

`/sobre-nosotros` se retiró el 2026-08-09 y se dejó una redirección permanente
a `/transparencia/sobre-nosotros`… **en el enrutador del cliente**. Pero
`vercel.json` seguía mandando esa ruta al motor, que ya no la renderiza a
propósito. Resultado: quien tecleaba o seguía un enlace a `/sobre-nosotros`
recibía un 404 del motor, y el `<Navigate>` del cliente **nunca llegaba a
correr**, porque para eso la aplicación tiene que cargarse primero. Una
redirección la tiene que hacer quien atiende la petición. Ahora es un
`redirects` de Vercel, permanente, y el `<Navigate>` se queda solo para la
navegación dentro de la aplicación.

### Lo gordo: el sitio servía las cinco sub-páginas con el título equivocado

Al comprobar las rutas una por una apareció esto, medido en producción el
2026-09-02:

| Ruta | Lo que sirve el motor | Lo que servía el sitio |
|---|---|---|
| `/transparencia/sobre-nosotros` | «Sobre DobleFoco.co: comparar cómo cubre cada medio…» | el título genérico del sitio |
| `/transparencia/clasificacion` | «Qué significan izquierda y derecha…» | ídem |
| `/transparencia/dinero` | «De dónde sale el dinero de DobleFoco.co» | ídem |
| `/transparencia/datos` | «Qué hace DobleFoco con sus datos» | ídem |
| `/transparencia/limitaciones` | «Lo que DobleFoco todavía no hace bien» | ídem |

El motor las renderizaba con sus metadatos, el sitemap las anunciaba a los
buscadores, y **`vercel.json` solo reescribía `/transparencia` exacto**: las
cinco caían en el catch-all y se servían con el `index.html` genérico. El
comentario que justificó partirlas —«cada tema gana ahora su propio título y su
propia descripción, que es lo que un buscador puede mostrar a quien pregunta
justo por eso»— describía algo que llevaba **casi un mes sin ocurrir**. Nada
fallaba: se servía la página correcta con la etiqueta equivocada.

### Qué se hizo, y la decisión que hay dentro

- `vercel.json` manda ahora `/transparencia/(.*)` al motor. **Un comodín y no
  las cinco rutas enumeradas**, a propósito: una lista enumerada es una segunda
  copia de `RUTAS_RENDERIZADAS` y divergiría en cuanto alguien añadiera una
  página, que es exactamente lo que acaba de pasar.
- El precio del comodín es que una sub-página inventada llega al motor, y el
  motor respondía el 404 por omisión de Express —un «Cannot GET» sin estilos—.
  Ahora responde **404 de verdad con la plantilla de la aplicación**, el mismo
  trato que da la ruta de noticia a un id que no existe.
- **Una prueba lee `vercel.json` y `RUTAS_RENDERIZADAS` y los compara**: cada
  ruta renderizada tiene que llegar al motor, el catch-all tiene que ir el
  último, y `/sobre-nosotros` tiene que redirigir y no reescribirse. Es la
  misma forma que `schema.test.js` usa con el .sql, y por el mismo motivo: dos
  artefactos declarativos que pueden divergir en silencio.

Probado contra el motor local: las cinco sirven su título, la inventada da 404
con la aplicación y `/api/health` sigue en pie. **El `redirects` de Vercel solo
se puede comprobar de verdad después de desplegar.**
## 2026-09-02 · Los cuatro feeds parados: uno era culpa nuestra, y los otros tres no tienen vía (Etapa 4)

**Es lo que el punto 7 de la sesión de decisiones dejó pendiente:** reintentar
la vía de Telecaribe, El Manduco, W Radio y Telecafé, y traer el resultado para
que Jose decida si alguno sale del catálogo. Reintentados uno por uno el
2026-09-02, cada uno por su feed y por Google News.

### Telecafé no estaba roto: la fecha la perdíamos nosotros (ARREGLADO)

**Su feed emite `<pubdate>` en minúsculas.** XML distingue mayúsculas, así que
rss-parser no lo reconoce como el `<pubDate>` de RSS 2.0 y lo descartaba: sus
diez piezas entraban **sin fecha**, y sin fecha se ordenan por el momento en
que las vimos. Estábamos publicando como de hoy piezas de hace tres días.

**Lo delató una contradicción entre dos herramientas nuestras**, y las dos
tenían razón sobre su propio método: `npm run feed:descubrir` decía «último
hace 70 h» —lee el XML como texto, con una expresión insensible a la caja— y la
auditoría decía «ninguna pieza trae fecha», porque usa el parser. Medido sobre
los 76 feeds: **Telecafé es el único así**.

Arreglado en `shared/rssItems.js`, que ahora es el único sitio donde se declara
qué se le pide a un ítem de RSS. Los tres parsers —motor, auditoría y
`check:feeds`— repetían la lista a mano y dos leían la fecha con su propia
expresión; ahora importan lo mismo, y una prueba lo comprueba. **No se
normaliza el XML entero a minúsculas**: sería tocar el parseo de los 76 feeds
por culpa de uno.

**Efecto medido, y es a la baja a propósito:** Telecafé pasa de 10 piezas sin
fecha a 10 fechadas, de las cuales **3 caen dentro de la ventana de 72 h**.
Aporta menos y deja de mentir sobre cuándo se publicó. Su cadencia ya se puede
medir, así que el hallazgo «responde, pero ninguna pieza trae fecha» se cierra
solo en la próxima pasada.

### W Radio: no está parado, su feed expone dos piezas (DECISIÓN DE JOSE)

El libro dice «el feed está parado: una pieza cada 2 909 h». **Ese número es un
artefacto:** su feed Arc trae exactamente **2 ítems**, uno de hace 15 h y otro
de hace 4,6 años; la cadencia se calcula entre esos dos. El medio publica todos
los días —Google News tiene 100 piezas suyas, la última de hace 13 h—.

Probadas siete rutas (Arc por categoría y sección, `/feed/`, `/rss/`,
`/rss.xml`, sitemap de noticias): ninguna otra responde. Queda Google News, y
**medido, no compensa**:

| Vía | Piezas dentro de la ventana | Enlaces |
|---|---|---|
| Su feed Arc (hoy) | 1 | canónicos, a wradio.com.co |
| Google News | 2 | redirecciones de news.google.com |

Subir su techo por feed no cambia nada: con 15, 30, 60 o 100 ítems siguen
siendo 2 los que caen en la ventana, porque Google News ordena por relevancia y
el resto es viejo. **Cambiar una pieza por perder todos sus enlaces canónicos
no parece un trato bueno, y es la duda 9 —que ya afecta a 9 medios— un poco
peor.** Recomendación: dejarlo como está y aceptar el hallazgo con nota, que es
para lo que existe `aceptado`. **Decisión de Jose.**

### Telecaribe y El Manduco: no hay vía porque no hay qué traer

- **Telecaribe.** Su feed responde y está sano; lo que pasa es que **no publica
  desde hace unos veinte días**, y Google News dice lo mismo (última pieza hace
  501 h). Coincide con lo que enseñó la cadencia grabada el 1 de septiembre:
  ninguna pieza desde el 13 de agosto. No es lentitud: es un silencio largo.
- **El Manduco.** **El sitio entero devuelve HTTP 500**, no solo el feed —la
  portada también—, y así lleva los cuatro ciclos que `cadencia_huecos` tiene
  grabados. Google News fecha su última pieza hace **5,5 meses**. Está caído.

Los dos siguen en el catálogo y en el mapa, con su ficha: **la regla de no
silenciar a nadie no se toca por una avería ajena.** Lo que Jose tiene que
decidir es si se quedan como están —con su hallazgo aceptado y una nota que
diga desde cuándo callan— o si salen. Mi lectura: Telecaribe es un canal
público vivo que volverá, y El Manduco lleva medio año sin publicar con el
sitio caído, que es otra cosa.

### Un defecto de la auditoría que salió de paso, y queda ABIERTO

**La cadencia de un feed con un ancla vieja no significa nada.** El «2 909 h»
de W Radio sale de dos ítems separados por cuatro años y medio. Un feed que
expone su última pieza y un artículo fijo de 2022 produce el mismo número que
un medio moribundo. La auditoría debería calcular la cadencia sobre la mediana
de los intervalos, no sobre el rango entre el primero y el último, o declararla
no calculable con menos de tres piezas recientes. Es media hora de trabajo y no
se hizo aquí para no mezclarlo con el arreglo de Telecafé.

## 2026-09-02 · El punto ciego dice la verdad de sí mismo (3.2)

**Decisión de Jose, punto 3 (D, E y número fijo para 1-D).** Tres cosas en
`shared/biasAnalysis.js`, y cada una con su prueba:

- **La rama de la izquierda se declara no medible** (`RAMAS_NO_MEDIBLES`):
  aunque la nula sorprenda, una ausencia de la izquierda nunca se llama «punto
  ciego»; se publica como hecho, con la frecuencia viva al lado. El número en
  pantalla sale de la medida del día, no de una cifra escrita: hoy, 84 % de las
  113 historias evaluables. La caja del feed lo dice con esas palabras, y la
  página de limitaciones también.
- **El énfasis se adopta con su ceguera direccional escrita**: el panel lateral
  cuenta hacia qué lado apunta hoy (28 a la derecha, 0 a la izquierda al
  medirlo) y dice que no es un hallazgo sobre las noticias. El documento del
  modelo lo mide también (`modelo_medido.json`, campo `enfasis`).
- **El «15 % de n» se sustituye por «como mucho un medio»**
  (`BLINDSPOT_MAX_PRESENTES = 1`). Medido antes de elegir el número, sobre la
  base viva (tabla en el comentario de la constante): cero apagaba la tercera
  rama, dos vaciaba la de la izquierda a la mitad, uno coincide con la
  etiqueta que el lector lee y quita los saltos. Efecto principal: la rama
  «solo medios del eje» pasa de 1 a 5 disparos, todos con la nula a favor.

**Lo que se descartó, otra vez:** bajar `UMBRAL_SORPRESA` hasta que algo salga.
Y lo que queda abierto con fecha: revisar `RAMAS_NO_MEDIBLES` cuando entren
medios de izquierda al catálogo (tarea 3.5, las 11 fichas) o cuando la tasa
medida baje de la mitad.

## 2026-09-02 · La base conserva 30 días; el motor sigue agrupando 72 h (3.1)

**Decisión de Jose, punto 1, opción C.** Dos ventanas con nombre en el motor:
`RETENTION_MS` (72 h) sigue siendo lo que se agrupa, se muestra y se rehidrata;
`RETENCION_BASE_MS` (30 días) es cuánto viven los artículos en la base. **El
cambio de conducta es una línea** —la poda— y todo lo demás es dejar escrito
que son dos cosas: en `/api/health` (`database.retencion`), en el esquema, en
la metodología pública, en el mensaje de `npm run insistencia` y en el motivo
por el que la copia sigue sin respaldar `articles`. Una prueba lee el fuente
y acusa si alguien vuelve a unificar las dos ventanas en cualquier dirección.

**Lo que NO cambia, y es la parte que importa:** ninguna historia vieja vuelve
a la portada ni tiene URL. Las historias se recalculan cada ciclo sobre las
72 h de memoria, como siempre. Sin páginas permanentes: eso es la opción B,
que se revisa a los 90 días de serie (≈ diciembre de 2026).

**Lo que desbloquea desde hoy:** la serie de `npm run insistencia` se llena un
día por día (antes: cuatro días y nunca más); la ventana de estimación del
modelo de puntos ciegos puede separarse de la de agrupamiento (3.2); y la
regla por cadencia (3.9) tendrá artículos y no solo piezas.

**Punto de partida, medido el 2026-09-02:** `articles` 14 MB, 8 478 filas; la
base entera, 43 MB. **Pendiente con fecha: medir el tamaño hacia el 2 de
octubre.** Con el techo propio de Infobae la estimación de 4,7 MB/día de
agosto se queda corta; si el mes cierra por encima de ~300 MB, hay que
decidir entre bajar el techo de Infobae o los 30 días, y es decisión de Jose.

**Hallazgo de paso, arreglado en la misma rama: la metodología pública se leía
con las tildes rotas.** `src/docs/metodologia.txt` —que `/transparencia/sobre-nosotros`
importa tal cual— tenía 132 secuencias de doble codificación («artÃ­culos»)
junto a 23 tildes sanas de ediciones recientes; `criterios_clasificacion_medios`,
`loop_ingestion_doc` y `plan_motor` igual. Se deshizo solo en las secuencias
que lo delatan, sin tocar lo que estaba bien. Llevaba así desde que se escribió
el archivo, y ninguna prueba lo miraba.

## 2026-09-02 · La regla de quien dirige, escrita, y el aviso de La Libertad a la vista (3.4)

**Decisión de Jose, punto 5.** La regla está en el protocolo (§1, «REGLA DE
QUIEN DIRIGE»): se avisa con candidatura o cargo público vigente de quien
dirige la redacción, con fecha y fuente; nunca por afinidad ni militancia; el
aviso caduca con el cargo y no se borra. En código: el campo `direccion` de la
ficha, `avisosDeDireccion` (filtra los caducados), el bloque en la ficha del
mapa de medios —sin rojo, con fecha, fuente y la frase de que no cambia la
clasificación— y el check del registro, que rechaza un aviso sin fecha, sin
fuente, con un hecho que no sea candidatura o cargo, o cuya fuente no esté en
`sources`.

**Publicado: Diario La Libertad**, directora con candidatura anunciada el
12-10-2025, fuente del propio diario. Hasta hoy estaba en la sexta de nueve
notas de la ficha; ahora abre «Quién está detrás». **Y al ir a publicarlo hubo
que comprobar «vigente»**: el anuncio no decía a qué elección, y las
legislativas fueron en marzo de 2026. Comprobado el 2026-09-02: no figura
entre los 76 candidatos del Atlántico ni en los resultados; sí fue candidata
liberal en 2014, que es la ficha que Congreso Visible conserva. El aviso dice
exactamente eso —anuncio sin retiro conocido, no inscrita en 2026, siguiente
contienda en 2027— y la comprobación quedó en `buscadoEn` con fecha. **Es
juicio editorial y lo firma Jose: si prefiere que un anuncio sin inscripción
no sea aviso, se pone `hasta` y desaparece sin borrarse.**

**No publicado: La Nación (Neiva), y es un hallazgo.** Se venía citando como
caso hermano desde agosto. Al aplicar la regla, la ficha no contiene ninguna
candidatura ni cargo de quien dirige: lo que documenta es que el diario cubre a
su dueño, Felipe Olave, y eso es asunto de la ficha de propiedad, no de esta
regla. Publicar un aviso sin el hecho sería inventarlo. Jose pidió los dos
casos; queda uno, y este es el motivo. Si aparece la candidatura o el cargo,
es una entrada en `direccion` y nada más.
## 2026-09-02 · Las historias sin foto llevan marcador, no hueco ni foto ajena (3.7)

**Decisión de Jose, punto 8a (duda 3).** Componente nuevo `MarcadorSinImagen`:
el logo del medio que abre la historia —o sus iniciales, si no hay logo, como
en el resto del sitio— sobre un fondo plano con trama, y la frase «Sin imagen
del medio». Va en la tarjeta de noticia, en la destacada de la portada y, en
versión compacta, en las miniaturas del bloque secundario. La tarjeta ya no
colapsa a una columna: la lista se alinea y el hueco dice lo que es.

Lo que sigue prohibido, y ahora está escrito en el componente: la foto
«relacionada». El marcador es plano, lleva texto y no tiene nada que se lea
como fotografía. La regla `.sin-imagen` de la tarjeta se retiró porque ya no
se emite: no dejar configuración muerta.
## 2026-09-02 · El techo por feed: Infobae deja de muestrearse a escondidas (3.3)

**Decisión de Jose, punto 4, opción B.** `ITEMS_PER_FEED` sigue en 15 como
techo general; un feed puede declarar `techo` en el registro y el motor,
la auditoría y `check:feeds` miden sobre ese mismo número (`techoDelFeed`).
`check:registry` rechaza un techo por debajo del general —sería un muestreo
escondido con nombre propio— o por encima de 100.

**Lo medido el 2026-09-02, antes de fijar el número:** Infobae, 100 ítems que
cubren 1,18 h, **42 piezas cada media hora**; Semana, 100 ítems en 6,55 h,
8 cada media hora; El Tiempo, 1,3. Solo Infobae supera el techo general.
**Infobae queda en 60:** cubre media hora de su producción con margen para un
ciclo que llegue tarde.

**La consecuencia que conviene tener presente:** Infobae pasa de ~720 a
~1 900 piezas al día en el corpus, y ya era el medio más voluminoso (32,5 %
antes de esto). Las cifras del espacio mediático —la cuota de la izquierda, los
tres dueños que son la mitad— se moverán en su contra al recalcularse. No es
un defecto del cambio: es que el muestreo las estaba suavizando. Si el peso
resulta excesivo, el techo se baja en una línea del registro, con esta fecha
como referencia.

La frase de la metodología que lo declara se lee del registro: si mañana otro
medio necesita techo, aparece sola.
## 2026-09-02 · Un medio ya tiene a dónde escribir, y sabe qué pasa después (3.8)

**La única ausencia que se notaba desde fuera** (duda 12). Decisión de Jose del
2026-09-02, punto 8c: el contacto es el mismo correo del boletín. Lo que se
hizo: una sección nueva en `/transparencia/limitaciones` —«Si usted es un
medio del catálogo»— con los tres compromisos (acuse en 5 días, respuesta por
escrito en 15, publicación de objeción y respuesta junto a la ficha con fecha,
cambie o no la clasificación), la regla en la sección 7 del protocolo, y la
descripción de la página en el SSR. Lo que NO se prometió: un resultado. La
reclasificación sigue el protocolo, no la insistencia. El mecanismo para
publicar la objeción es la `note` de la ficha que ya existe; se estrenará con
el primer caso.
## 2026-09-02 · `aceptado` se estrena con Vorágine (3.6)

**Primer uso del estado desde que existe** (2026-08-19). `voragine/feed` pasa
de `abierto` a `aceptado`, y la nota, copiada aquí como manda la regla del
cruce:

> Decisión de Jose, 2026-09-02 (sesión de decisiones, punto 7): es
> investigación y publica despacio; es su oficio, no una avería. Medido en
> `cadencia_piezas` el 2026-09-02: una pieza cada 3,3 días, la última del
> 2026-09-01, feed 200. Estreno del estado «aceptado». Se revisa si la cadencia
> grabada muestra más de 30 días sin publicar: eso ya no sería cadencia, sería
> parón.

Lo que cambia: sigue apareciendo y contándose, pero deja de ser pendiente y de
abrir aviso; el libro pasa de 22 abiertos a 21. Lo que NO cambió: el umbral. Si
la cadencia grabada enseña un parón, la conciliación lo mantiene en
`aceptado` igual —el estado lo pone una persona y lo quita una persona—, así
que la revisión de los 30 días es de la minuta, no de la máquina.

## 2026-09-02 · La sesión de decisiones: los ocho puntos, en una sesión

**El cuello de botella del proyecto, vaciado.** Jose contestó los ocho puntos
de la Etapa 1 sobre `SESION_DECISIONES.md`, y cada respuesta se anotó en
`DECISIONES.md` en el momento. La Etapa 3 de `PLAN_PRODUCTO_FINAL.md` quedó
reescrita con nueve tareas concretas (3.1 a 3.9) y una revisión con fecha:
**a los 90 días de serie, revisar si se hace el archivo permanente (opción B)**.

**Lo que abre trabajo de código ya:** retención interna de 30 días (3.1), el
punto ciego que dice la verdad (3.2), techo por feed (3.3), la regla de quien
dirige con sus dos avisos (3.4), `aceptado` con Vorágine (3.6), el marcador con
logo (3.7) y el contacto para medios (3.8). Lo que espera: la regla por
cadencia (3.9), a la serie de 30 días; y las fichas de izquierda (3.5), a las
tandas que firme Jose.

**Lo que sigue siendo suyo:** decidir, cuando la Etapa 4 haya reintentado los
feeds, si Telecaribe, El Manduco, W Radio y Telecafé salen del catálogo.

## 2026-09-01 · La cadencia por medio empieza a grabarse (2.1 / 2-A / T2-3)

**La tarea urgente por calendario del plan de producto**, y la única de la
Etapa 2 que no podía esperar: cada día sin grabar era un día menos de la serie
de 30–90 días que necesita la regla por cadencia (1-B). Rama
`cadencia/empezar-a-grabar`. La decisión, con lo que se descartó, está en
`DECISIONES.md` (2026-09-01).

**Qué se hizo.** Dos tablas —`cadencia_piezas` (medio, hash, fecha declarada,
primera vista, regla de descarte) y `cadencia_huecos` (medio, ciclo, error)—,
escritas en cada ciclo desde el bucle del feed y ANTES de la poda, y la columna
`ingest_runs.cadencia_nuevas`. Copia y restauración las conocen. Pruebas 755/755,
lint y tipos limpios. Esquema aplicado a la base viva y **estrenado con un
ciclo manual el 2026-09-01 a las 23:46 UTC**.

**Lo que enseñó el primer ciclo, y es la prueba del diseño:**

| | |
|---|---|
| Piezas observadas | 924, de 71 medios |
| Ya fuera de la ventana de 72 h | **123, de 18 medios** — `articles` no las vio ni las verá |
| Medios con TODAS sus piezas fuera | **3**: Casa Macondo, La Patria, Telecaribe |
| Sin fecha del medio | 32 (Valora Analitik 15, Telecafé 10, Cambio 7) — se guardan como NULL |
| Descartadas por el filtro editorial | 6 (sorteo 4, índice 1, horóscopo 1) |
| Huecos | 1: El Manduco, 500 |

Telecaribe lleva desde el 13 de agosto sin publicar y La Patria muestra piezas
desde abril: el archivo ya distingue lo que hasta hoy se veía igual, «sano y
lento» de «roto». Nada lo lee todavía, a propósito.

**Lo que queda abierto, y no es de esta tarea:**

- ~~Hasta que exista `FLY_API_TOKEN` (0.1), el motor de Fly no archiva.~~
  **Cerrado el 2026-09-02 a las 00:29 UTC:** Jose creó el token, el
  despliegue automático corrió por primera vez (run 33574808256, tras un
  primer intento con el token roto por la tubería de PowerShell, que le añade
  retorno de carro) y el primer ciclo del motor archivó 128 piezas nuevas con
  `actor = motor`. Ya no hay ventana de pérdida.
- La vigilancia no acusa si `cadencia_nuevas` deja de crecer. Se ve en la
  serie; añadir el aviso es una tarde, y conviene hacerlo cuando el motor ya
  escriba, para que no nazca en rojo.
- **En 30 días** (hacia el 1 de octubre) hay serie suficiente para la primera
  lectura; la regla por cadencia (Etapa 3) se implementa con esa serie, no
  antes.

## 2026-09-01 · La 2.2 ya estaba hecha desde el 24 de agosto, y dos planes la daban por pendiente

Al ir a hacer la **2.2** del plan de producto —el check de `group` /
`controlGroup` en `check:registry` (2-C / D-3)— resultó que **ya existe**:
entró el 2026-08-24 en `3f35b9d`, el mismo día de la revisión de Kimi que la
pidió, con las dos comprobaciones que pedía D-3 (la discrepancia entre casa y
marca se enseña como información, y las variantes por tildes o mayúsculas son
error). `npm run check:registry` pasa hoy con 78 medios y sin errores.

**Lo que falló no es el código: es la cuenta.** `PLAN_CONTINUIDAD.md` (del 26)
y `PLAN_PRODUCTO_FINAL.md` (del 1 de septiembre) la listaron como pendiente de
dos horas, porque nadie la anotó aquí al cerrarla. Es la enfermedad del 19 al
revés: un documento que describe una tarea que ya ocurrió. Se anota ahora, se
marca en la tabla del plan, y no se rehace.

## 2026-09-01 · Lo que el sitio afirmaba de sí mismo, y la tarjeta vacía

**Salió del estudio de mercadeo del 31 de agosto**, y lo que unía a las cuatro
cosas es que **ninguna se ve desde dentro del sitio**: son lo que ve quien lo
comparte, o quien lo lee con el tema claro, o quien va a la letra pequeña. Por
eso aguantaron meses.

### La tarjeta que se compartía estaba vacía

`public/og-image.png` era **un rectángulo oscuro con un borde dorado, y nada
más**. El generador anterior, `createOgImage.mjs`, pintaba los píxeles a mano y
**no tenía forma de dibujar texto**: hacía exactamente lo que sabía hacer, y
nadie miró el resultado. Desde el **2026-07-29**.

Y no estaba en un rincón: `metadatos.js` y `paginasEstaticas.js` la sirven como
`og:image` de **todas** las páginas de noticia. Cada vez que alguien compartía
una historia de DobleFoco en WhatsApp o en X, lo que se veía era el rectángulo.

> Esto corrige algo que yo mismo escribí el 31 de agosto. Dije que **«las páginas
> de noticia están impecables»** mirando sus etiquetas, que efectivamente lo
> están. Miré el `og:image` como cadena de texto y di por buena la imagen sin
> abrirla. La etiqueta apuntaba a un archivo vacío.

- **Estado: HECHO.** `npm run og:generar` la compone con Playwright —ya era
  dependencia, `npm run mirar` lo usa— sobre un HTML con la tipografía y la
  paleta del propio sitio.
- **Dos decisiones de diseño que conviene no deshacer.** No lleva **barra de
  espectro**: habría que darle un ancho a cada tramo, y tres tramos iguales
  **afirman que el espacio mediático colombiano está repartido en tercios**, que
  es el falso equilibrio contra el que existe el proyecto; con la proporción real
  sería un dato con fecha dentro de una imagen que nadie regenera. Y **no lleva
  ningún número**, por lo mismo. Tampoco nada que lata ni que arda: acompaña a la
  peor noticia del día igual que a las demás.

### La portada anunciaba un sitio que no es este

Las etiquetas de `index.html` son el sitio entero para quien lo ve compartido y
no llega a entrar. Venían de antes de que el proyecto tuviera criterio editorial:

- **«Información Objetiva y Moderna»** en `twitter:title` y **«Sin sesgos
  ocultos»** en su descripción — mientras `/transparencia/clasificacion` dice,
  literal, «no significa neutral, imparcial ni objetivo». El sitio se desmentía a
  sí mismo, y la versión que ganaba era la que se ve sin entrar.
- **«más de 20 fuentes nacionales»**, cuando son 78 medios.
- Sin `og:image` teniendo el archivo, y con `summary_large_image` declarado: se
  prometía una imagen grande y no se mandaba ninguna.
- Open Graph y Twitter **decían cosas distintas**.

- **Estado: HECHO**, y con la regla escrita en el propio archivo: **se dice lo
  que el sitio HACE, nunca lo que el sitio ES**, y no van cifras, porque esta
  cabecera no se regenera con el catálogo. Lo sostiene `src/metadatos.test.js`.

### Las dos páginas de transparencia se contradecían con su propio contador

**Este es el peor de los cuatro**, porque está en la página que promete que no
hacemos esto:

- `/transparencia/limitaciones` decía, en la misma línea: *«**Ninguna** de las 78
  clasificaciones está firmada. **5** han pasado por revisión editorial formal.»*
  El «Ninguna» era texto fijo de cuando el contador valía 0.
- `/transparencia/sobre-nosotros` repetía la versión vieja, ya falsa.
- Las dos afirmaban que **de todos** los medios consta quién los controla «con
  una excepción», cuando **son quince** los que llevan `ownerType: null`.
- Y `sobre-nosotros` abría con el lema **«Información objetiva para un ciudadano
  informado»**, a dos clics de la página que dice lo contrario.

**Es el defecto que este repositorio persigue en el código —una afirmación que
describe algo que dejó de ocurrir— pero en la prosa.** La cifra ya se calculaba
sola; lo escrito a mano era **la frase que la interpreta**, y una frase también
envejece.

- **Estado: HECHO.** Las frases se generan en `src/lib/catalogo.js` y son ciertas
  con cualquier número, incluidos el cero y el total. `EstadoDelCatalogo` cuenta
  ahora desde ahí en vez de repetir la definición.
- **Y la misión se reescribió con lo que el proyecto sí sostiene**: que no se
  busca el equilibrio sino que se vea el desequilibrio. Estaba en la memoria y en
  el ROADMAP, no en la página.

### El encabezado era blanco sobre blanco, y su regla de estilo no se aplicaba

En `/transparencia/sobre-nosotros`, `.about-hero` fijaba `color: white` sobre un
degradado que en el tema **claro** vale `#f8fafc → #f1f5f9`. Contraste
**1,03:1**: el título de la página y su lema eran **invisibles** para quien no usa
el tema oscuro. Ahora es 17,06:1.

**Y debajo había un segundo fallo, el mismo de siempre:** la hoja estilaba
`.about-hero h1` y el JSX pinta `<h2 className="sn-titulo">`. La regla del tamaño
**no se aplicó nunca**. Es la **tercera vez** que este proyecto pierde estilos en
la costura JSX↔CSS —los puntos del mapa el 19 de agosto, el titular de Tendencias
el 21— y tres veces es un patrón. La defensa, ya aplicada las tres veces: **el
CSS apunta a la clase, no a la etiqueta.**

- **Estado: HECHO**, con `SobreNosotros.layout.test.js`.

### Las tres pruebas nuevas se rompieron a propósito para ver que acusan

Metiendo «objetiva» en las etiquetas: acusa, y de paso acusa que Open Graph y
Twitter dejaron de coincidir. Dejando la tarjeta lisa: acusa. Devolviendo el CSS
a `.about-hero h1`: acusa dos veces. **Deshecho con la edición inversa**, no con
`git checkout`.

## 2026-08-31 · Trece días sin copia de seguridad, y la restauración tampoco sabía

**Encontrado el 26 de agosto mirando `gh run list`, arreglado el 31.**

`backup.yml` falló **trece días seguidos, del 19 al 31 de agosto**. La última
copia buena era del 18. Los artículos se descartan a las 72 h, así que fueron
trece días en los que perder la base habría sido irreversible.

**La causa, y no es un fallo:** el 2026-08-18 entró el archivo de conducta con
dos tablas nuevas, `conducta_archivo` y `conducta_archivo_runs`. El guardián de
`backup.mjs` —el que exige que toda tabla esté clasificada con su motivo— las
vio sin decidir y rompió la ejecución, **que es exactamente lo que se le pidió
que hiciera**.

> **La ironía conviene no perderla:** la tabla que rompió el respaldo era
> precisamente la que se creó por ser lo único del corpus imposible de
> reconstruir después.

**Lo que sí falló fue el aviso**, y era un defecto de diseño nuestro: de los
cuatro flujos con vigilante, `backup.yml` era **el único que no abría issue**.
Vigilancia, auditoría y centinela sí. Un rojo en Actions no lo mira nadie — que
es palabra por palabra lo que este proyecto escribió el 2026-08-11 al montar la
Vigilancia, repetido en el único sitio donde no se aplicó la lección.

### Lo que se hizo, y son tres cosas, no dos

1. **Las dos tablas entran en `TABLAS`, no en `EXCLUIDAS`**, con su motivo
   escrito. Cumplen las dos condiciones del respaldo de forma más literal que
   ninguna otra: irreemplazables —se archivan justo porque la purga se las
   llevaba— y sin datos personales, porque son dos identificadores y una fecha,
   ni un titular ni un enlace. `conducta_archivo_runs` va con ella y no sin
   ella: restaurar la conducta sin sus huecos declarados sería restaurar una
   serie que miente.
2. **`backup.yml` abre, comenta y cierra issue** como los otros tres, con
   etiqueta `copia`, y el cuerpo lleva la salida del guardián — que ya dice qué
   hacer, así que copiarla es copiar la instrucción entera. El job sigue
   quedando en rojo: el issue es el aviso, el aspa es el registro.
3. **Y al arreglarlo salió un agujero peor, que nadie buscaba.**
   `scripts/restore.mjs` tiene **su propia lista** de tablas, escrita a mano y
   distinta de la de `backup.mjs`. Las dos tablas nuevas iban a entrar en la
   copia y **salir por la restauración sin decir una palabra**: no da error, da
   una restauración incompleta que parece completa. Es el defecto que este
   repositorio persigue en todas partes —dos listas nuestras que pueden
   divergir— y aquí la dirección del fallo es silenciosa. Añadidas a `ORDEN`, y
   **puesto el guardián recíproco**: un `.ndjson` en la copia que la
   restauración no conozca ahora rompe la ejecución, igual que hace el de
   `backup.mjs` con una tabla sin clasificar.

**Comprobado, no supuesto.** `npm run backup` corre en verde y se lleva
**43 284 pares de conducta y 15 ejecuciones** que nunca habían estado en un
respaldo. El viaje de vuelta con `--dry-run` devuelve las seis tablas con las
mismas cuentas. Y el guardián nuevo se probó rompiéndolo a propósito —un
`.ndjson` inventado, **en una carpeta de usar y tirar, no en el árbol de
trabajo**— y falla con código 1 y el mensaje que toca. 714 pruebas,
`check:comentarios` y `check:registry` en verde.

**Lo que queda sin cubrir, dicho para que no se crea cubierto:** el aviso avisa
del fallo, no de la ausencia. Si el flujo dejara de ejecutarse —no fallar, sino
no correr— nadie se enteraría, porque no hay nada que vigile que la copia se
hizo. No se arregla hoy y no se olvida.

## 2026-08-26 · Los memos: tres retirados, diecisiete corregidos

Pedido de Jose. Los memos son las notas de memoria del asistente
(`~/.claude/projects/<proyecto>/memory/`), que es donde viven los criterios
editoriales que él dicta de viva voz y que no se deducen del código. Eran 46,
y dos de ellos ni siquiera estaban en el índice que se carga en cada sesión.
**Se comprobó cada afirmación contra el repositorio**, no contra el recuerdo.

**Antes de borrar nada se escribió aquí qué decía y por qué se va**, que es la
condición que puso Jose y la misma regla que ya rige para silenciar un hallazgo
del libro: retirar sin motivo escrito y olvidar se ven igual a los tres meses.

### Los tres que se retiran, con lo que decían

**1. `doblefoco-investigacion-propiedad`** (escrito el 2026-08-08).

- *Qué decía:* que ninguna ficha de propiedad del catálogo estaba vacía y que
  quedaba **un solo dato pendiente** en todo el mapa: quién representa
  legalmente a Colombia Informa, que exige el certificado del RUES con el NIT
  900.408.141-8. Traía además la corrección de una razón social sacada de un
  directorio.
- *Por qué se va:* **su afirmación central es falsa desde hace semanas.** Hoy hay
  78 perfiles para 78 medios, pero **15 llevan `ownerType: null`** y el propio
  registro dice que el hilo se para antes de llegar a persona natural en al
  menos cinco medios —Colombia Informa, Pulzo, los tres de Ardila Lülle y
  Cablenoticias—. «Falta un dato» describía un mapa que ya no existe, y leerlo
  hoy induce a error sobre cuánto queda por hacer.
- *Qué sobrevive y dónde:* el NIT, la razón social y la nota de que es un
  problema estructural están en `shared/mediaOwnership.js`, que es la fuente y
  no envejece a espaldas de nadie. La regla —una afirmación sobre el dueño se
  publica con el enlace donde consta o no se publica— ya vive en
  `doblefoco-ausencia-de-dueno-se-declara`, adonde se ha trasladado el único
  pendiente vivo (el certificado del RUES).

**2. `doblefoco-feeds-mudos-no-se-arreglan`** (escrito el 2026-07-29, corregido
el 30).

- *Qué decía:* que un feed mudo es mejor que uno que miente —el caso de W Radio
  y RTVC, cuyos feeds entregaban páginas de etiqueta como si fueran piezas— y
  que por eso no había que «arreglarlos». Al día siguiente se le añadió una
  corrección en mayúsculas diciendo que esa segunda mitad ya no aplicaba, porque
  Jose había fijado el criterio contrario.
- *Por qué se va:* **su título afirma lo contrario de lo que decide el
  proyecto**, y llevaba un mes sostenido por una corrección interna que ocupaba
  más que la nota. Un memo cuyo nombre hay que desmentir al leerlo no es una
  memoria, es una trampa. Lo que queda de él es una regla de código —qué titular
  se acepta— que vive en `shared/contentQuality.js` con sus pruebas.
- *Qué sobrevive y dónde:* la frase que sí decide —no se ingiere un titular que
  no es una pieza, con patrones anclados al titular completo— se ha trasladado a
  `doblefoco-no-silenciar-medios`, que es el memo que manda sobre esto y que
  siempre lo fue.

**3. `doblefoco-clasificacion-forzada-y-recategorizar`** (escrito el 2026-08-03).

- *Qué decía:* dos decisiones del mismo día. Recategorizar lo ya ingerido en vez
  de esperar a que la ventana de 72 h lo renovara sola, y «forzar un poco» la
  clasificación —inclinar el umbral a asignar tema antes que a dejarlo vacío—.
- *Por qué se va:* la primera es **un acto que ya se ejecutó** y hoy es una
  herramienta del repositorio (`npm run recategorizar`, ensayo por defecto,
  documentada en `doblefoco-taxonomia-de-secciones`); no es un criterio que
  aplicar mañana. La segunda es la misma preferencia de «abarcar de más a de
  menos» que ya estaba escrita en el memo hermano del mismo día. **Además nunca
  estuvo en el índice `MEMORY.md`**, así que en la práctica llevaba tres semanas
  sin cargarse en ninguna sesión.
- *Qué sobrevive y dónde:* el sesgo hacia asignar —y su límite, que «un poco»
  solo se sabe dónde acaba con el número delante— se ha trasladado a
  `doblefoco-clasificar-por-contenido-no-por-feed`, que sí queda indexado.

### Lo que se corrigió sin retirarlo

Diecisiete memos afirmaban algo que ya no era cierto. Los tres de más peso:

- **`doblefoco-dos-despliegues-vercel-y-fly`** decía «no hay workflow que
  despliegue la API». Ya lo hay desde el 24 —y no funciona por falta del
  secreto—, que es un estado distinto de los dos y el que hay que saber.
- **`doblefoco-auditoria-de-sesgo-la-hace-jose`** decía que `respuestas/` seguía
  vacía y que los medios grandes no tenían ficha. Hay 22 respuestas del ciclo 1
  y los grandes ya tienen ficha; el hueco de hoy es la izquierda.
- **`doblefoco-no-silenciar-medios`** dejaba a Las2Orillas anotado como el único
  medio silenciado. Entró al catálogo el 2026-08-24, y no estaba mudo: lo
  callaba nuestra tilde en el User-Agent.

El resto eran cifras que se movieron y se han vuelto a medir: departamentos con
medio propio (18 → **29 de 33**), internacionales con feed (6 → **7 de 13**),
medios que entran por Google News (7 → **8**, con Cambio ya en feed directo),
fichas firmadas (2 → **5**), y el `.radar-pulse-dot` que el memo de los adornos
daba por suelto en `Sidebar.css` y hoy es un comentario que cuenta que se
retiró.

## 2026-08-21 · La opinión vuelve a quedarse fuera del agrupamiento

Medido contra producción antes de tocar nada: **71 de los 4 000 artículos en
memoria eran opinión** —62 columnas, 7 editoriales, 2 caricaturas— y reentraban
al agrupamiento en cada arranque. Formaban **135 historias, 3 de ellas
multifuente**, que son las que corrompen el producto. La peor era exactamente el
caso que Jose describió el 2026-08-09:

```
HISTORIA: «Pereira y Risaralda: La hora de la solidaridad y la reconstrucción»
   [OPINIÓN/columna]    el-diario-pereira
   [OPINIÓN/editorial]  diario-del-norte
```

Dos opiniones y ni un solo hecho reportado, presentadas como historia
multifuente. Otra juntaba una noticia de Pulzo con una columna de El Espectador:
el sitio anunciaba dos fuentes cruzando espectro cuando una era una columna.

**Después del despliegue (`593ad40`): 0, 0 y 0.** Las 6 310 historias se
recompusieron y el total bajó de 6 443 a 6 310 — las ~133 que faltan eran
historias que solo eran una columna. Los 7 invariantes siguen pasando.

### Se deriva, no se guarda, y esta minuta pedía lo contrario

Esta minuta pedía «columna nueva, escritura en el INSERT, lectura en la
rehidratación, y migración», por analogía con `topics`. **La analogía era falsa y
conviene dejar escrito por qué**, porque el criterio sirve para el próximo caso:

`detectarOpinion` es **función pura de la URL** —tres expresiones regulares sobre
el pathname, sin registro ni estado— y la URL ya es permanente: `canonical_url`
es la clave del ON CONFLICT y no se reescribe nunca. `topics` había que guardarlo
porque **se pierde si no se guarda**: es el resultado de una clasificación que no
se puede rehacer desde la fila. La opinión no. Guardarla sería duplicar un dato
que ya está.

Y la versión derivada es **mejor**, no solo más barata:

1. **No cierra ninguna puerta.** El día que haga falta consultarla en SQL —el
   índice de columnistas— la columna se rellena entera desde `canonical_url`.
2. **Se cura sola.** La detección está declarada incompleta. Un valor guardado
   seguiría mintiendo sobre los artículos viejos cuando se añada un patrón; este
   se corrige en el siguiente arranque.
3. Cuesta **6,3 ms** para los 4 000, medido.

### Lo que enseñó sobre los comentarios de este repositorio

Los comentarios prometen que la opinión «alimenta el agregado de formadores de
opinión» y «el índice de columnistas». **Ninguno de los dos existe.** El único
consumidor de `opinion` en todo el código es el filtro del agrupamiento. Es la
misma enfermedad del 2026-08-19 —el comentario describe una intención, no un
comportamiento—, y esta vez apareció en el comentario que yo mismo iba a usar
como prueba de que hacía falta una columna.

## 2026-08-21 · El vigilante del desfase gritaba por la prosa

`comprobarDesfase.mjs` comparaba el commit de Fly con el de `main` por igualdad
estricta. Al actualizar esta minuta, `main` avanzó y el vigilante quedó listo
para avisar de que «Fly está 1 commit por detrás» por dos archivos `.md`. **Hubo
que pagar un despliegue entero de Fly solo para callarlo.**

**Hecho:** rama `vigilancia/desfase-solo-lo-que-llega`. Ahora pregunta si algún
commit entre Fly y main tocó una ruta que **llega a la imagen**, que es lo que la
cabecera del workflow decía querer saber desde el principio.

**Esto no es bajar un umbral para que deje de molestar**, que es como se estropea
un vigilante y está escrito aquí mismo a propósito de Razón Pública. Es corregir
QUÉ mide para que responda la pregunta que dice responder. La diferencia está en
que **la lista es de lo que se perdona, no de lo que cuenta**: cualquier ruta que
no encaje se trata como desfase, porque los dos errores no cuestan lo mismo
—perdonar de más silencia la avería que este workflow existe para cazar, y que ya
mordió dos veces—.

Probado en los dos sentidos con una salud falsa: un commit de solo prosa sale 0 y
lo dice en voz alta; un commit que toca `server/` sale 1 y nombra el archivo.
El predicado tiene 19 pruebas propias en `shared/rutasDeLaImagen.test.js`.


## 2026-08-21 · Las cuatro ramas del 19 entran a `main`, y el motor se despliega

Todo lo que quedó sin fusionar la sesión anterior está en producción, en el
commit **`68f0230`**. Se fusionó primero a una rama de integración, se verificó
el resultado **junto** —no rama por rama— y se desplegó desde `main` con el árbol
limpio, para que la imagen de Fly quede marcada con el commit que de verdad
sirve.

| Rama | Dónde vive |
|---|---|
| `motor/rehidratacion-pierde-tema` | Fly (`npm run deploy`) |
| `auditoria/trazabilidad` | Ambos: la auditoría corre fuera, el panel va en el cliente |
| `mapa/puntos-sin-color` | Vercel |
| `estudio/ground-news` | Solo documentos |

Verificado sobre el resultado fusionado: lint limpio, `tsc` sin errores,
**597/597 pruebas**, build correcto, y **7/7 invariantes** contra producción.
El conflicto que se temía en `PLANEACION.md` no se materializó.

**Fly y Vercel quedaron en el mismo commit**, que es la condición que
`desfase.yml` comprueba y la que este proyecto rompe con más facilidad, porque
empujar a `main` publica uno de los dos y no el otro.

**Lo que se tocó de más, y por qué:** `.claude/` entró en `.gitignore`.
`npm run deploy` aborta con el árbol sucio —y hace bien—, pero lo que lo
ensuciaba era el worktree de la herramienta, que no es del proyecto.

**Lo que NO está verificado:** nadie ha abierto el mapa ni Categorías en un
navegador. Hay preview de Vercel para la rama de integración y el sitio
responde 200, pero eso no es haberlo mirado.


## 2026-08-19 · Categorías enseñaba catorce ceros

`hydrateArticles` no leía `articles.topics` ni `articles.ambito`. El motor
rehidrata hasta 4 000 artículos en cada arranque y todos volvían sin tema; como
una historia se compone con la unión de los temas de sus artículos, **99 de las
100 historias del feed tenían `topics: []`** sobre un catálogo de 6 408 que sí
estaban clasificadas. El ámbito cayó por lo mismo: **todo el catálogo marcado
como nacional**, con la API respondiendo `internacional: 0`.

**Hecho:** rama `motor/rehidratacion-pierde-tema`. El mapeo salió de la consulta
para poder probarlo, y la prueba va en dos sentidos —que el mapeo devuelva los
campos y que la consulta los pida—.

> ✅ **DESPLEGADO el 2026-08-21 en el commit `68f0230`**, Fly y Vercel en el
> mismo commit. `npm run invariantes` pasa **7/7**. La portada pasó de 30/100
> historias con tema a **96/100**, y lo internacional de **3 a 94** — ese era el
> daño callado: el catálogo entero se declaraba nacional.
>
> **Y enseñó algo sobre cómo se mide un despliegue.** La primera medición, seis
> segundos después de que el worker arrancara, daba todavía 6/7 y 4 189 historias
> rotas; parecía que el arreglo no servía. No era eso: el motor rehidrata y
> recompone **al arrancar**, y a las 02:06:47 reescribió las 6 443 historias de
> una vez. **Medir un despliegue en el instante en que termina mide la máquina
> anterior**, y en este proyecto la diferencia entre las dos lecturas era la que
> hay entre «arreglado» y «no sirvió».

## 2026-08-19 · Puntos invisibles en el mapa de medios

Los medios sin publicar en 72 h se pintaban `fill="transparent"` con el contorno
confiado a un atributo `stroke`. Pero `.map-point` fija `stroke` en la hoja de
estilos y **una regla CSS gana siempre a un atributo de presentación SVG**: el
aro salía del color del fondo y el punto no se veía. Vorágine entre ellos.

Por lo mismo llevaba tiempo sin verse el realce de la búsqueda.

**Hecho:** rama `mapa/puntos-sin-color`. Todos los puntos llevan su color y lo
que cambia es la opacidad; la clave salió del desplegable a la leyenda; y va
también en palabras, no solo en color.

## 2026-08-19 · No existían invariantes de producción

`npm run invariantes`, colgado de `vigilancia.yml` (cada 6 h). Comprueba que lo
que el sitio dice **pueda ser cierto**, que es distinto de que el sitio esté en
pie —lo del 19 de agosto pasó con el sitio perfectamente en pie—.

**La regla del archivo: una contradicción, nunca un umbral.** No se comprueba
«el 40 % de las historias debería tener tema», porque ese número no lo respalda
nada y el día que falle nadie sabrá si el roto es el sitio o el umbral. Se
comprueba que el sitio no se contradiga: si una historia se compone con la unión
de los temas de sus artículos, **una historia sin ningún tema cuyos artículos sí
lo tienen es imposible por construcción**. Eso no necesita número y no envejece.

> **Una corrección a lo que dije antes, que salió de correr esto.** Medí «99 de
> 100 historias sin tema» y era cierto en ese momento, pero **el daño no es
> permanente: se rehace en cada arranque.** Al reiniciar, el motor rehidrata sin
> temas y reconstruye las historias vacías; después la ingesta fresca va
> devolviendo temas a las nuevas. Horas más tarde el mismo feed daba 42 de 100.
>
> Eso dejó ver que **los seis invariantes que miran la API no bastaban**: pasaban
> los siete días de la semana salvo el del despliegue. El que sí lo caza siempre
> mira la base, donde la contradicción está permanentemente visible — y al
> escribir esto marcó **4 050 historias** sin tema teniendo artículos con tema.

## 2026-08-19 · La auditoría no dejaba rastro

Escribía una foto que se sobrescribía cada semana. No se podía responder cuánto
llevaba roto nada, ni qué se había decidido.

**Hecho:** rama `auditoria/trazabilidad`. `auditoria/hallazgos.json` con id
estable, `primeraVez` que no se toca, lo resuelto que no se borra, y las
reincidencias contadas. Y esta minuta.
