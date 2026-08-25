# Plan de acción — lo accionable de la revisión de Kimi K3

**Escrito el 2026-08-24.** Responde a
`revision-externa/respuestas/kimi-k3-estructura-y-puntos-ciegos.md`.

Este documento **no decide nada**: propone, ordena y pone precio. La firma sigue
siendo de Jose. Lo que se apruebe pasa a `MINUTA.md` y sale de aquí.

## El criterio de corte

«Reingeniería exigente» aquí significa una de estas tres:

1. **Cambia un parámetro de producto ya abierto** en la minuta (la retención de
   72 h, la ventana de agrupamiento).
2. **Necesita datos que hoy no existen** y que tardan semanas en acumularse.
3. **Abre una superficie editorial nueva** que hay que diseñar, escribir y
   mantener.

Todo lo que no cae en ninguna de las tres está abajo, en Fase 1 o Fase 2.

---

## LA TRAMPA DE SECUENCIA, antes de cualquier otra cosa

**Hay un cambio de dos líneas que NO debe salir solo, y es el más tentador de
todos.**

Corregir la nula a hipergeométrica (su O1 / Alt-1) es literalmente cambiar el
denominador. Comprobado hoy:

| Catálogo | Primer `n` que baja del 5 % |
|---|---:|
| 13 de 78 (el del estudio) | 15 |
| **14 de 78 (hoy, con Las2Orillas)** | **14** |

La historia más cubierta del corpus tiene **16 medios**. Así que la rama de la
izquierda **pasa de no disparar nunca a disparar**.

Y eso, solo, **empeora el producto**: dispararía justo donde está medido que la
ausencia de la izquierda ocurre el **78 %** de las veces en historias de 10+
medios. Estaríamos publicando como hallazgo la situación por defecto — que es
exactamente lo que el estudio se negó a hacer bajando el umbral.

> **Regla de esta fase: la corrección de la nula (T1-5) NO se despliega sin la
> corrección de la justificación de D (T1-4).** Van en el mismo commit o no van.

---

# FASE 1 — Directo, sin reingeniería

Seis cosas. Ninguna toca un parámetro de producto ni necesita datos nuevos.

### T1-1 · Cerrar el sentido que falta de la costura base↔memoria

**Su M3, y resulta que está medio hecho.** `contentStore.test.js` ya tiene una
prueba que lee el TEXTO del archivo y comprueba que el SQL de `hydrateArticles`
selecciona toda columna que el mapeo lee. Esa es la mitad lectura↔consulta, y
nació del fallo de `topics`.

**Lo que no existe es el otro sentido: que el INSERT escriba toda columna que el
mapeo lee.** Hoy, comprobado a mano, no falta ninguna —12 leídas, 13 escritas,
cero huecos— pero **nada lo vigila**, así que el día que alguien añada un campo
al mapeo y olvide el INSERT, vuelve el fallo de Categorías por el otro lado.

- **Qué:** una tercera prueba en el mismo archivo y con el mismo estilo, que
  extraiga la lista de columnas del `INSERT INTO articles` y afirme que contiene
  cada `row.X` que lee `articuloDesdeFila`.
- **Coste:** ~15 líneas. Media hora.
- **Qué se rompe:** nada.
- **Por qué primero:** Kimi lo llama «el arreglo más barato de toda la lista, y
  habría cazado el fallo más caro». Con la mitad ya hecha, es aún más barato.

### T1-2 · Los comentarios que prometen lo que no existe

**Su M4.** Siguen ahí, en cuatro sitios:

```
shared/opinion.js:20        «alimenta el agregado de formadores de opinión»
shared/opinion.js:44        «No sirve para el índice de columnistas»
server/db/contentStore.js:122   «el día que haga falta consultarlo en SQL —el índice de columnistas»
server/services/ingestDaemon.js:853  «agregado de formadores de opinión»
```

**No son el mismo caso, y tratarlos igual sería un error.** El de
`contentStore.js` es **condicional** —«el día que haga falta»— y por tanto
honesto: describe una puerta abierta, no un consumidor vivo. Los otros tres
afirman en presente que algo existe. Ninguno de los dos agregados existe: el
único consumidor de `opinion` en todo el código es el filtro del agrupamiento.

- **Qué:** reescribir los tres que afirman en presente para que digan lo que
  pasa —«hoy su único consumidor es el filtro del agrupamiento»— y dejar el
  condicional como está.
- **Coste:** veinte minutos.
- **Qué se rompe:** nada.

### T1-3 · El check de CI contra el comentario-aspiración

La segunda mitad de su M4, y la que evita que vuelva.

- **Qué:** un script que falle si un comentario nombra entre comillas o en
  `backticks` un identificador exportado que no existe en el código. Imperfecto
  y suficiente, como él mismo dice. Va detrás de `check:registry` en `ci.yml`,
  que ya corre lint, typecheck, test, build y check:registry.
- **Coste:** un día, contando los falsos positivos que habrá que callar.
- **Qué se rompe:** la costumbre de escribir comentarios-intención. Se pierde
  algo de expresividad; se gana que lo escrito sea verdad.
- **Aviso honesto:** este es el único de la Fase 1 con riesgo real de acabar
  ignorado. Un check ruidoso se silencia y entonces es peor que nada. Si al
  montarlo salen más de ~15 falsos positivos, **mejor no montarlo** y quedarse
  con T1-2.

### T1-4 · Rehacer la sección 2 del estudio con la nula correcta

**Su O1 + O5 + O7, que son tres correcciones al mismo documento.**

`ESTUDIO_PUNTOS_CIEGOS.md` afirma que la rama de la izquierda «seguiría siendo
inalcanzable aunque los 76 medios cubrieran la misma noticia el mismo día». Eso
**solo vale para la `q` ponderada por apariciones**, y la nula que el propio
estudio declara habla de **medios que eligen**, no de apariciones.

Hay que corregir tres cosas en el texto:

1. **La nula y su número.** Con la nula de catálogo el umbral es `n = 14`, no
   90. La rama es alcanzable; el problema no es de potencia.
2. **La justificación de la opción D.** Hoy se apoya en el 90 —que se cae en
   cuanto se corrige la nula, o en cuanto crece el catálogo— y tiene que
   apoyarse en el **78 %**, que sobrevive a las dos correcciones porque ataca la
   especificidad y no la potencia.
3. **Las ramas 1 y 3.** El estudio presenta su cero como resultado del embudo.
   Kimi mide que tienen el mismo vicio que la 2 —umbrales fijados sin contrastar
   contra la tasa base del espectro que nombran— y sus números cuadran:
   `P(mixta ≤ 15 % | n=6) = 1,7×10⁻³` y `2×10⁻⁵` con `n=16`. Solo la rama 2 lo
   tenía escrito en símbolos.

- **Coste:** medio día de escritura. Cero código.
- **Qué se rompe:** nada, salvo que el estudio deja de poder citarse para decir
  «inalcanzable».

### T1-5 · La nula hipergeométrica en el código

**Su Alt-1, versión barata.** Cambiar `probabilidadDeAusencia(q, n)` por el
cálculo hipergeométrico `C(total−espectro, n) / C(total, n)`, con el tamaño del
catálogo en vez de la cuota de apariciones.

- **Coste:** una tarde, como él dice. Es cambiar el denominador y sus pruebas.
- **Qué se rompe:** **la señal empieza a disparar.** Ver la trampa de secuencia
  arriba. **No sale sin T1-4.**
- **Decisión previa que hace falta:** si al disparar se publica o no. Mi
  recomendación: **implementarlo y dejarlo apagado tras la opción D**, es decir,
  que el veredicto se calcule y se registre pero la rama de la izquierda se
  declare «no medible» en pantalla con el 78 % escrito al lado. Así el número
  existe para medirlo y no se publica un hallazgo que es la norma.

### T1-6 · Que el motor se despliegue solo

**Su M1, la mitad barata.** Hoy `desfase.yml` compara el commit de Fly con el de
`main` y **solo avisa**. La pieza que falta ya existe y está probada: el
predicado `llegaALaImagen` de `shared/rutasDeLaImagen.js`, con 19 pruebas.

- **Qué:** un workflow que, al empujar a `main`, despliegue Fly **si algún
  commit toca una ruta que llega a la imagen**, salvo marca explícita
  `[solo-cliente]` en el mensaje.
- **Coste:** media jornada. El predicado, el secreto de Fly y el workflow.
- **Qué se rompe:** la posibilidad de publicar un arreglo de cliente sin tocar
  el motor. Se recupera con la marca, que al menos es una decisión escrita y no
  un olvido.
- **Por qué vale la pena aquí y ahora:** ha mordido dos veces, y hoy volvió a
  estar a punto — `story.js` y `mediaRegistry.js` llegan a la imagen.

---

# FASE 2 — Acotado, pero ya es trabajo

### T2-1 · Handshake de versión en tiempo de ejecución

La otra mitad de su M1, y la que de verdad cierra la costura. El cliente lleva
incrustado en el build el commit que espera del motor; `/api/health` **ya expone
el suyo**, así que solo falta comparar y degradar de forma visible.

- **Coste:** 1–2 días.
- **Qué gana sobre T1-6:** T1-6 evita el desfase; esto lo hace **imposible de
  ignorar** cuando ocurra igualmente (un despliegue a medias, un rollback).

### T2-2 · Una sola consulta compartida en la portada

**Su M2.** Cuatro componentes piden los mismos datos por su cuenta. Su caso no
es hipotético: con un ciclo de 30 minutos, dos componentes que piden a un lado y
otro del relevo enseñan **estados de dos mundos distintos** — el hero con una
historia que el feed ya no tiene.

- **Qué:** elevar la petición al `Home` de 28 líneas, que para eso no tiene
  lógica propia, o meter un cliente de consultas con caché.
- **Coste:** 2–3 días, refactor acotado de cuatro componentes.
- **Qué se rompe:** la propiedad «cada componente es autosuficiente y se puede
  soltar en cualquier página». Vale algo, y vale menos que la coherencia de la
  portada.

### T2-3 · Empezar a registrar la cadencia por medio

**Aparece en tres sitios de su respuesta**: es prerrequisito de la opción B
(revivir los mudos sin trato de favor), de la nula por propensiones, y de
distinguir «sano y lento» de «roto».

- **Qué:** una tabla `cadencias` y un job que anote, por medio, el intervalo
  entre publicaciones observado en cada ciclo. **Solo acumular**, sin usarlo
  todavía.
- **Coste:** un día ahora. La utilidad llega sola en 30–90 días.
- **Por qué en Fase 2 y no en la 3:** porque **empezar a grabar es barato y
  esperar es lo que cuesta**. Si esto no arranca hoy, dentro de tres meses
  seguiremos sin poder hacer nada de lo que depende de ello.
- **Qué NO es:** no es la separación de ventanas (su Alt-3). Es solo el dato.

### T2-4 · La configuración del modelo, publicada y con fecha

Si se adopta la opción D —«no medible, y este es el número»— ese número
**necesita fecha y regeneración automática**, o será el próximo comentario que
promete algo falso. Vale también para los umbrales (0,20; 15 %; 0,05; 72 h; 4
medios) y las tasas base.

- **Qué:** un `npm run docs:modelo` que genere el documento desde las constantes
  y el corpus vivo, con la fecha dentro. Hay precedente exacto:
  `docs:catalog` ya hace esto con el catálogo, y `check:registry` falla si el
  documento está desactualizado.
- **Coste:** un día.
- **Qué se rompe:** nada. Y mata de raíz la caducidad silenciosa que este
  proyecto lleva persiguiendo todo el mes.

---

# FUERA DE ALCANCE, y por qué

No porque no tengan razón, sino porque cada uno cae en el criterio de corte.

| Propuesta | Por qué no ahora | Qué habría que decidir antes |
|---|---|---|
| **Alt-3 · Separar ventana de estimación (30–90 d) de la de agrupamiento (72 h)** | Depende de la retención, que es **decisión de producto ya abierta** en la minuta | Si se archiva. 30 días son gratis; un año, 25 USD/mes |
| **Alt-2 · Balance agregado como superficie editorial** | Superficie nueva: metodología visible, actualización periódica, intervalos de Wilson | Si el producto acepta cambiar «punto ciego detectado hoy» por «balance de las últimas cuatro semanas» |
| **M5 · Modo de arranque de prueba del sistema** | Es infraestructura de test, no un test | Ver más abajo: creo que hay un atajo del 90 % |
| **Lazo de calidad del agrupamiento** | Necesita una muestra etiquetada a mano | Quién etiqueta, y cuántas |
| **Vía de corrección de orientaciones** | Superficie de producto y de reputación | Cómo se recibe y se resuelve una disputa |
| **Nula por propensiones `∏(1−p_m)`** | Necesita historial por medio | Depende de T2-3 y de Alt-3 |

**Alt-4 (declarar el catálogo como parte del instrumento) es un caso aparte:**
es puro texto y podría ir en Fase 1. Lo dejo fuera solo porque afirma algo que
Jose tiene que querer afirmar — «ampliar el catálogo por la izquierda ES
calibrar el instrumento» — y eso no lo decido yo.

---

# LO QUE DESCUBRÍ TRABAJANDO, Y ES IMPLEMENTABLE YA

Esto no sale de Kimi. Sale de lo que costó trabajar hoy.

### D-1 · Un proxy de desarrollo, y se acaba el puente CORS

**El problema, medido hoy:** para mirar un cambio en local contra datos reales
hubo que montar a mano un puente CORS dentro del navegador —interceptar cada
petición, reenviarla sin origen, quitar `content-encoding` porque el cuerpo ya
viene descomprimido y añadir la cabecera—. **Sin eso, `localhost` enseña ceros
que no son el fallo sino el bloqueo**, y estuve a punto de diagnosticar un bug
que no existía.

**El arreglo:** un `server.proxy` en `vite.config.js` que mande `/api/*` a
`https://doblefoco.fly.dev`. Al ser mismo origen, **la CORS desaparece**.

- **Coste:** seis líneas de configuración.
- **Qué gana:** cualquiera puede previsualizar contra producción con
  `npm run dev`, sin saber nada de esto.
- **Por qué importa más de lo que parece:** hoy la fricción de mirar con los ojos
  es lo único que separa este proyecto de sus fallos de costura. Bajarla a cero
  es la intervención más barata de todo el documento.

### D-2 · `npm run mirar` — la prueba de costura que no necesita infraestructura

**Este es el punto importante.** Kimi dice que las pruebas de costura no existen
porque falta un «modo de arranque de prueba del sistema» (su M5), y que esa es
la pieza que falta más que los tests. **Tiene razón sobre el diagnóstico y hay
un atajo que él no vio**, porque no sabía que existe el despliegue de Fly.

No hace falta un sistema de mentira: **ya hay un sistema de verdad al que
apuntar.** El script que improvisé hoy conduce un navegador contra el servidor
de desarrollo y la API real, y afirma tres cosas:

1. **Cero errores de consola** en cada ruta.
2. **Ningún elemento se sale de su contenedor** (`rect.right > padre.right`).
3. **Ningún texto queda recortado** (`scrollWidth > clientWidth`).

Con eso, hoy, encontré **tres defectos que las 629 pruebas no vieron**: el título
que se pintaba encima del vecino, los nombres cortados a media palabra y la
columna vacía comiéndose un tercio del ancho. Los tres eran visibles y ninguno
rompía un test.

- **Qué:** convertirlo en `scripts/mirar.mjs` + `npm run mirar`, con una lista de
  rutas y los tres asertos. Playwright como `devDependency` —hoy no está, hubo
  que instalarlo en un directorio temporal—.
- **Coste:** un día, y la mitad ya está escrita.
- **Qué NO es:** no sustituye al e2e con base de prueba. No comprueba lógica,
  comprueba que lo que se pinta se puede leer. Es el 10 % del coste de M5 y
  cubre la clase de fallo que más veces ha mordido.
- **Dónde va:** manual al principio. En CI solo cuando esté demostrado que no da
  falsos positivos, porque un check que parpadea se ignora y entonces sobra.

### D-3 · `group` y `controlGroup` pueden discrepar, y nadie lo mira

**Lo descubrí metiendo el bug yo mismo.** Al dar de alta NTN24 escribí
«Organizacion Ardila Lulle» sin tildes, y **la casa quedó partida en dos cubos**
al agrupar por `group`. Lo vi por casualidad al contar.

Y hay una discrepancia de fondo que no es un error de tecleo: por `group` la
casa Ardila Lülle tiene **tres** medios; por `controlGroup` —que es quien
manda— tiene **cuatro**, porque La República figura como «Editorial La
República». Son dos conceptos distintos, y está bien que lo sean; lo que está
mal es que nada avise cuando se leen como si fueran el mismo.

- **Qué:** dos comprobaciones en `check:registry`:
  1. Dos medios con el mismo `controlGroup` que **discrepen en `group`** → aviso
     con los dos valores, para que sea una decisión y no un descuido.
  2. Dos cadenas `group` que solo se diferencien en tildes o mayúsculas → error.
- **Coste:** dos horas.
- **Qué se rompe:** nada. Habría cazado mi fallo de hoy en el acto.

### D-4 · Ya arreglado hoy, se anota para no perderlo

- **La auditoría escribe texto que un humano lee** (`shared/auditoria.js`), cosa
  que no era evidente: parecía código de diagnóstico. Salió al barrer los
  decimales, y por eso `numeros.js` acabó en `shared/` y no en `src/lib/`.
- **`git merge -F-` no lee de la entrada estándar.** Cuesta un intento fallido
  cada vez. Los mensajes largos van a un archivo.

---

# ORDEN PROPUESTO

**Semana 1 — lo que no puede salir mal.**
T1-1 (media hora), T1-2 (veinte minutos), D-1 (seis líneas), D-3 (dos horas).
Cuatro cosas, un día entre todas, y ninguna cambia lo que ve el lector.

**Semana 1–2 — lo que evita el próximo incidente.**
T1-6 (el despliegue automático) y D-2 (`npm run mirar`). Los dos atacan la clase
de fallo que más veces ha mordido este proyecto.

**Semana 2 — el bloque del modelo, junto y en un solo commit.**
T1-4 + T1-5. **No se separan.** Y antes de empezar hace falta la decisión de
Jose sobre si la rama de la izquierda se declara «no medible» en pantalla.

**Después, por orden de rédito:** T2-4 (configuración con fecha), T2-3 (empezar
a grabar cadencias), T2-1 (handshake), T2-2 (consulta compartida).

**T1-3 (el check de comentarios) va al final a propósito**, y con permiso para
abandonarlo si sale ruidoso.

---

# LO QUE NO HARÍA, Y POR QUÉ

- **Adoptar la opción C** (umbral por tamaño medido empíricamente). Kimi la mata
  por una segunda vía que el estudio no había visto: a α = 0,05 sobre 77
  historias se esperan **3,9 falsos positivos**, y los tests no son
  independientes. Conviene enterrarla **por las dos razones**, porque si muere
  solo por el 78 % alguien la resucitará cuando cambie el corpus.
- **Adoptar la opción E sin escribir su límite.** El énfasis dispara 23 veces
  para la derecha y **0 para la izquierda**. Sigue siendo la opción correcta,
  pero adoptarla callando eso deja al producto afirmando cosas sobre la derecha
  y nada, nunca, sobre la izquierda. Si se acepta, que se acepte escrito.
- **Tocar la retención de 72 h para «arreglar» los medios lentos.** Alargarla
  «para estos cinco» es trato de favor con nombre propio y contamina la tasa
  base en la dirección contraria. Solo es limpio como **regla uniforme por
  cadencia**, y eso depende de T2-3.
