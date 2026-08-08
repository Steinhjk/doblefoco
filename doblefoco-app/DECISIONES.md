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
