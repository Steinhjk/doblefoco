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
  `node_modules` y `.git`. Excluirlo de la sincronización. **ABIERTO —
  trámite de Jose, 15 min.**
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
