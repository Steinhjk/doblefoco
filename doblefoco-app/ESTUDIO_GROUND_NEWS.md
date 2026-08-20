# Ground News frente a DobleFoco, y qué costaría acercarse

**Pedido por Jose el 2026-08-19.** Tres preguntas: cómo hace Ground News para
abarcar tanto espectro político, cómo se comparan sus métricas con las nuestras
—con el foco puesto en el total de medios de Colombia frente al de EE. UU.—, y
si ampliar el buscador, la actualización y la permanencia de las noticias
tropieza con sobrecostos o con imposibilidades técnicas.

**Todo lo que aquí se afirma está comprobado el 2026-08-19**, y cada cifra dice
de dónde sale. Las de Ground News se verificaron en sus propias páginas, no en
el informe `Ground News_ Análisis Técnico y Replicación.docx` que ya estaba en
el repositorio: ese documento acierta en los números grandes —se comprobaron
uno por uno— pero es un informe generado y sus citas no se pueden seguir.

---

## 1. Cómo abarca Ground News tanto espectro: no lo mide, lo compra

Esta es la respuesta corta y es casi todo lo que hay que saber.

> «based on the average rating of three independent news monitoring
> organizations» — [ground.news/rating-system](https://ground.news/rating-system)

**Ground News no clasifica el sesgo de ningún medio.** Promedia las
calificaciones de **AllSides, Ad Fontes Media y Media Bias/Fact Check**. La
factualidad sale del promedio de dos de ellas —Ad Fontes y MBFC—. Y lo dice sin
rodeos: *«Outlets without any ratings aren't included in their bias
assessment»*. Un medio que nadie haya calificado sencillamente no tiene barra.

Eso cambia por completo la pregunta. La amplitud de Ground News **no es un logro
de su método, es un logro del mercado en el que opera**: existe en Estados
Unidos una industria de calificación de sesgo con veinte años de recorrido, y
Ground News es, en este punto concreto, una capa de presentación encima de ella.
AllSides sola tiene entre 1 400 y 2 400 fuentes calificadas.

Lo que sí es suyo, y es la parte cara, es la propiedad:

> «We researched, analyzed and hand-coded ownership data for 2,276 news outlets
> and counting.» — [ground.news/about](https://ground.news/about)

**A mano.** Sobre más de 50 000 fuentes. Es decir, el propio Ground News resuelve
a mano exactamente el mismo problema que nosotros, y lo resuelve para el 4,6 %
de su catálogo.

### Por qué este método no se puede importar a Colombia

No hay a quién comprarle. **No existe un AllSides colombiano, ni un Ad Fontes,
ni un MBFC con cobertura nacional.** MBFC mantiene un perfil de país y ha
calificado unos pocos medios colombianos sueltos —ColombiaCheck, Colombia
Reports, este último un medio en inglés para extranjeros—; nada parecido a una
cobertura del sistema mediático del país.

De modo que la vía de Ground News aquí no está disponible, y la alternativa no
es una variante más barata: es el trabajo entero. Es la razón de que este
proyecto tenga un `PROTOCOLO_JUICIO_EDITORIAL.md`, de que cada ficha se firme y
de que el catálogo sean 76 medios y no 7 600. **No es una limitación de recursos
que se pueda comprar: es que la clasificación es el producto.**

---

## 2. Las métricas, una al lado de otra

| | Ground News | DobleFoco |
|---|---|---|
| Fuentes en el catálogo | **+50 000** | **76** |
| Artículos procesados al día | **~60 000** | **~2 900** |
| Medios con propiedad investigada a mano | **2 276** | **76** |
| …sobre el total del catálogo | **4,6 %** | **100 %** |
| Origen de la calificación de sesgo | Promedio de 3 casas ajenas | Juicio propio, firmado |
| Medios sin calificación de sesgo | Se excluyen de la barra | **Ninguno** |
| Permanencia de una noticia | Página de historia permanente | **72 horas, y se borra** |
| Buscador de noticias | Sí | **No existe** |

Fuentes: Ground News, sus propias páginas *about* y *rating-system*, consultadas
el 2026-08-19. DobleFoco, `/api/health` y consulta directa a la base el mismo
día.

### La comparación que sí dice algo, y la que no

**No dice nada comparar 76 con 50 000.** Son denominadores distintos: Ground News
es global y agrega por rastreo masivo; nosotros somos un país y agregamos por
catálogo curado. Poner las dos cifras juntas invita a una conclusión falsa en
cualquiera de los dos sentidos.

**Sí dice algo el 4,6 % contra el 100 %.** En lo único que las dos plataformas
hacen igual —averiguar a mano quién es el dueño— nosotros lo tenemos entero y
ellos lo tienen para uno de cada veintidós medios que muestran. Un lector de
Ground News que abra una fuente al azar tiene un 95 % de probabilidades de no
encontrar ficha de propiedad. En DobleFoco, ninguna.

Y dice algo el trato de los medios sin calificar: **Ground News los deja fuera de
la barra; nosotros no dejamos a ninguno sin firmar.** Es la misma diferencia por
el otro lado — ellos pueden permitirse el hueco porque tienen 50 000; nosotros no
podemos permitírnoslo porque tenemos 76 y cada hueco sería una cuarta parte de un
departamento.

---

## 3. Colombia frente a EE. UU.: el tamaño del terreno

| | Colombia | EE. UU. |
|---|---|---|
| Emisoras de radio con licencia | **1 596** (1 243 FM · 353 AM), 2025 | **26 310** AM/FM, 2023 |
| Estaciones de TV | — | **7 145** VHF/UHF, 2023 |
| Total de emisoras licenciadas | — | **33 455** |
| Medios digitales | **~640** (MinTIC), de ellos **306** nativos | — |
| Redacciones contadas como tales | — | **~3 100** |

Fuentes: recuentos de MinTIC y de prensa económica colombiana para Colombia;
FCC y el *State of Local News* de Northwestern para EE. UU.

**El terreno estadounidense es del orden de veinte veces el colombiano** en
emisoras licenciadas. Pero esa proporción no es la que manda. La que manda es
que allí **el trabajo de clasificar ya está hecho por terceros**, y aquí no. Un
Ground News colombiano con la arquitectura de Ground News tendría 50 000 fuentes
sin una sola barra de sesgo.

Puesto de otro modo: nuestro catálogo de 76 medios cubre una fracción pequeña de
los ~640 medios digitales del país, y esa es la brecha real que se puede cerrar
con trabajo. La brecha con las 50 000 fuentes de Ground News no es una brecha:
es otro producto.

---

## 4. Buscador, actualización y permanencia: qué cuesta y qué no se puede

Aquí hay que separar tres cosas que se confunden con facilidad, porque **solo una
de las tres tropieza con un muro técnico**.

### Lo que hay hoy, medido

| | Hoy |
|---|---|
| Retención | **72 h**, y después `pruneExpiredArticles` **borra la fila** |
| Techo de artículos en memoria | 8 000 (la ventana real pide 5 786) |
| Cadencia del motor | 30 min (red de seguridad de Actions, 2 h) |
| Base de datos | **37 MB** · 8 734 artículos (14 MB) · 6 408 historias (7,6 MB) |
| Coste por artículo | **~1,6 KB** con índices |
| Crecimiento | **~4,7 MB al día** |
| Infraestructura | Supabase gratuito (0 USD) + Fly: API 256 MB (2,02 USD) y worker 512 MB (3,32 USD) |
| Índice de texto completo | **No existe** |
| Ruta de búsqueda de noticias | **No existe** |

### 4.1 Permanencia — barata, y es lo que más valor daría

**Hoy una noticia dura 72 horas y desaparece.** No se archiva: la fila se borra.
Es, con diferencia, la distancia más grande con Ground News, cuyas páginas de
historia son permanentes.

Y almacenar no es el problema:

| Permanencia | Tamaño estimado | Plan | Coste |
|---|---|---|---|
| 72 h (hoy) | 37 MB | Supabase gratuito | **0 USD** |
| 30 días | ~170 MB | Supabase gratuito | **0 USD** |
| 90 días | ~500 MB | justo en el límite del gratuito | **0 USD**, sin margen |
| 1 año | **~2 GB** | Supabase Pro (8 GB) | **25 USD/mes** |

**Guardar un año de noticias colombianas cuesta 25 dólares al mes.** No hay
imposibilidad técnica ninguna, y a 30 días ni siquiera hay sobrecosto.

### 4.2 Buscador — barato, y no hay muro

No existe ni índice ni ruta. Lo que hace falta es una columna `tsvector` con la
configuración de español y un índice GIN sobre ella; Postgres lo trae de fábrica
y es lo mismo que ya se usa para `stories.topics`. El índice añade del orden de
un tercio sobre el texto indexado —sobre 2 GB de artículos, medio giga— y sigue
cabiendo de sobra en los 8 GB del plan Pro. La consulta es logarítmica, no
lineal: buscar en un año de archivo no cuesta más que buscar en tres días.

**Sin sobrecosto propio y sin imposibilidad.** Su único requisito de verdad es el
anterior: un buscador sobre 72 horas de noticias no le sirve a nadie. El buscador
vale lo que valga el archivo que hay debajo.

### 4.3 Ampliar la ventana de AGRUPAMIENTO — aquí sí hay muro, y está medido

Esto es lo distinto, y conviene no confundirlo con la permanencia. Guardar
artículos es barato; **volver a agruparlos en historias, no**.

El primer paso de `clusterArticles` compara cada artículo contra **todos los
grupos ya formados**. No usa índice invertido —el segundo paso, el de fusión, sí
lo usa—. Eso lo hace cuadrático.

Medido hoy, con titulares reales del catálogo:

| Artículos | Grupos | Tiempo |
|---|---|---|
| 500 | 351 | 64 ms |
| 1 000 | 642 | 170 ms |
| 2 000 | 1 117 | 524 ms |
| 4 000 | 2 921 | 2 088 ms |
| 6 000 | 4 921 | 5 616 ms |
| 8 000 | 6 921 | 9 750 ms |

El exponente medido va de **n^1,5** —con titulares reales, hasta 2 331— a
**n^2,2** en el tramo alto, donde hubo que completar con titulares sintéticos de
vocabulario real y por tanto se forman más grupos de los que se formarían de
verdad. **El valor real está entre los dos**, y esto es una extrapolación, no una
medición: se dice para que nadie la lea como otra cosa.

Llevado a la máquina que de verdad corre esto —el worker de Fly, que el propio
código midió en **19,3 s con 5 000 artículos**, unas seis veces más lento que la
máquina de esta prueba—:

| Ventana de agrupamiento | Artículos | Ciclo estimado |
|---|---|---|
| 72 h (hoy) | 5 786 | **~19 s** (medido) |
| 7 días | ~13 500 | **1–2 min** |
| 30 días | ~58 000 | **10–50 min** |
| 90 días | ~174 000 | **1–8 h** |

**Y contra qué choca:** el motor cicla cada **30 minutos** y el flujo de
seguridad tiene `timeout-minutes: 10`. A 30 días de ventana, un ciclo tardaría
más que el intervalo entre ciclos. Eso no es un sobrecosto: es que el diseño deja
de funcionar.

**Los 7 días sí caben.** Un ciclo de uno o dos minutos contra una cadencia de
treinta es perfectamente sano, y multiplicaría por 2,3 la ventana en la que una
historia puede juntar medios de distinto espectro — que es justo lo que hace
falta para que un punto ciego se note.

**Y hay una salida para más, si algún día se quiere:** el muro no es la cantidad
de artículos sino el barrido lineal del primer paso. El segundo paso ya
resuelve el mismo problema con un índice invertido por token. Llevar esa misma
técnica al primero convertiría el coste en aproximadamente lineal. Es trabajo de
algoritmo, no de infraestructura, y no hace falta gastar un peso más para
hacerlo.

---

## 5. Resumen para decidir

1. **La amplitud de Ground News no se puede copiar**: es comprada a tres casas
   calificadoras que en Colombia no existen. Nuestra vía —clasificar en casa y
   firmar— no es la versión pobre de la suya, es la única disponible.
2. **En propiedad les ganamos**: 100 % del catálogo contra su 4,6 %.
3. **Permanencia y buscador son baratos**: 0 USD hasta 30 días, 25 USD/mes para
   un año de archivo con buscador incluido. **Es la mejora de mayor valor por
   peso gastado, y hoy es el hueco más grande del producto.**
4. **Ampliar la ventana de agrupamiento a 7 días cabe; a 30 no**, y no por
   dinero sino porque el ciclo tardaría más que el intervalo. Si algún día hace
   falta más, lo que hay que cambiar es el algoritmo, no el plan.

---

## Lo que este documento NO afirma

- **No afirma cuántos medios hay en Colombia.** Las cifras de radio y de medios
  digitales vienen de recuentos oficiales y de prensa, se citan como tales, y no
  suman un total: nadie publica uno fiable.
- **No compara calidad.** Que Ground News tome sus calificaciones de terceros no
  las hace peores; las hace ajenas, que es otra cosa.
- **Los tiempos de ciclo de la tabla de arriba de 7 días son extrapolación.**
  Antes de tocar la ventana, la medida hay que rehacerla con el corpus real del
  tamaño que se pretenda.
