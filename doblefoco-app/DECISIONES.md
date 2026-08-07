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
