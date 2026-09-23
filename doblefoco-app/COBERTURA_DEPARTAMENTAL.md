# ¿Tiene cada departamento un medio propio que funcione?

> **Actualización del 2026-09-23 sobre Amazonas, Guainía y Vaupés: el motivo
> que daba la de abajo era inexacto.** Se buscó otra vez a petición de Jose, y
> esta vez con una fuente que las búsquedas anteriores no tenían: el censo
> **«Desiertos de noticias locales»** de la Fundación Gabo y la FLIP
> ([tablero](https://desiertosdenoticiaslocales.fundaciongabo.org/dashboard/),
> [datos](https://desiertosdenoticiaslocales.fundaciongabo.org/data.json)), que
> nombra uno por uno los medios de Leticia (2024), Inírida (2025) y Mitú (2025).
> **No es que allí solo haya radio: hay periodismo digital local, pero vive en
> Facebook y WhatsApp, sin un sitio que se pueda sindicar.**
>
> | Departamento | Resultado |
> |---|---|
> | **Amazonas** | **Hay un candidato: LeticiaHoy** (`taleoi.com`, dominio de 2012). Su sección Leticia tiene un feed vivo (`taleoi.com/taxonomy/term/5/feed`: 10 ítems, el último del 22-09, comprobado con nuestro User-Agent). El `rss.xml` general está parado desde 2025-08, y `feed:descubrir` solo encontraba ese. **Debilidades:** dueño oculto tras Domains By Proxy, con un solo contacto de Gmail, así que sería `ownerType: null` declarado; piezas cortas firmadas por la cuenta de la casa, sin fuentes citadas; y cadencia irregular (7 piezas del 07 al 22-09, antes una al mes). Periódico Umarí, el que se había probado, lleva ~18 meses caído (último 200 en Wayback: 2025-03-21). Amazonas News Radio no publica desde el 2026-05-18. `noticiasamazonas.com` y `amazoniaaldia.com` son del Amazonas **peruano** |
> | **Guainía** | **Ningún medio propio con sitio.** El censo nombra 8 en Inírida: dos emisoras de Policía y Ejército, una educativa, la Iglesia, El Morichal (de Vichada) y tres nativos digitales que trabajan «principalmente en Facebook» (Inírida En Vivo, Entérate Ya Guainía, Inírida-Guainía Tendencia Digital). Ninguno con dominio. `guainiaaldia.com` es una página de «próximo lanzamiento»: **volver a mirar**. Una salida posible, **decisión de Jose**: el feed de la categoría Guainía de **El Morichal** (`elmorichal.com/category/guainia/feed/`) está vivo, con 7 piezas del 26-08 al 18-09. No sería un medio nuevo, sino dejar que las piezas de Guainía de un medio de Vichada cuenten en Guainía |
> | **Vaupés** | **Ningún medio con sitio.** El censo nombra 6 en Mitú: La Marandúa (periódico, en Facebook), Yuruparí Estéreo (comunitaria), el magazín Arú Pacomá, el grupo de WhatsApp Mitú Al Día y dos emisoras de Policía y Ejército; todos «de manera voluntaria». Ningún dominio conecta. **Trampa de nombre:** `marandua.com.co` es una emisora de **Guaviare** |
>
> **Consonante**, el laboratorio de periodismo local de la FLIP, tiene
> secciones con feed vivo para Amazonas y Guainía, pero publica una o dos
> piezas al mes y es una red nacional, no un medio del departamento. Se deja
> como ficha de candidatura, si acaso. **Y un dato para esa ficha, sin
> confirmar:** su reportera de Inírida figura como «Esperanza Castro Torres»,
> y El Morichal publicó el 26-08 que «la periodista María Esperanza Castro se
> posesionó como concejal de Inírida». Si es la misma persona, es materia de
> la regla de quien dirige.
>
> Todo lo buscado —dominios, feeds y sitios probados el 2026-09-23— está en el
> informe de la búsqueda, en `MINUTA.md` del mismo día.

> **Actualización del 2026-08-26, y es la que manda.** El catálogo tiene hoy
> medios propios en **29 de los 33 departamentos**. Faltan cuatro, y cada uno por
> un motivo distinto que conviene no confundir: **Amazonas, Guainía y Vaupés no
> tienen medios web** —allí la comunicación es radio comunitaria e indígena, que
> un agregador de RSS no alcanza; es un límite del formato, no del catálogo— y
> **Sucre está cerrado por vía técnica**: las cuatro vías se agotaron el
> 2026-08-14, hay ficha de candidatura escrita y lo que lo abre es **escribirle a
> Korraleja o a El Meridiano**. Es correo, no búsqueda, y por eso lleva parado.
> Todo lo de abajo es de agosto y se conserva por lo que enseña del método.
>
> **Actualización del 2026-08-12.** Entraron tres medios más —EL DIARIO de
> Boyacá, Vive el Meta y Lente Regional— con la propiedad declarada como no
> comprobada. **Meta y Caquetá dejan de estar en blanco**, así que el recuento
> de abajo pasa de **18 a 20 departamentos con voz propia viva** y de 15 a 13
> sin ningún medio propio. Los tres feeds se verificaron ese día: 200, dentro de
> ventana, medianas de 16 h, 42 h y 41 h. El resto del barrido no se ha
> rehecho, así que las cifras siguientes son las del día 11.

Barrido del **2026-08-11**, a petición de Jose. Se comprueban dos cosas
distintas y se informan por separado, porque tener medio en el catálogo y tener
voz viva no son lo mismo:

1. que el departamento tenga un medio propio en `mediaRegistry`;
2. que ese medio **responda, traiga artículos y haya publicado en 72 h**.

---

## La respuesta corta

| | |
|---|---|
| Departamentos con medio propio **vivo** | **18 de 33** |
| Medios departamentales **rotos** | **0** |
| Sin ningún medio propio en el catálogo | **15** |

**Lo que falta no está averiado: no existe en el catálogo.** Los 22 medios
departamentales dados de alta respondieron los 22, y todos habían publicado
dentro de la ventana. El hueco es de cobertura, no de salud.

---

## Los 18 con voz propia viva

Antioquia · Atlántico · Bogotá D.C. · Bolívar · Boyacá · Caldas · Cauca ·
Cesar · Chocó · Guaviare · Huila · La Guajira · Norte de Santander · Putumayo ·
Risaralda · Santander · Valle del Cauca · Vichada

El más rezagado del grupo es **El Manduco** (Guaviare), con 47 h desde su última
pieza; el resto publicó el mismo día o el anterior.

---

## Siete departamentos que se pueden cerrar YA

Feeds probados en vivo el 2026-08-11 y **verificados con `detectarDepartamento`**
—el mismo detector que etiqueta el mapa— sobre sus titulares reales, no por el
nombre del dominio:

| Departamento | Candidato | Feed | Titulares suyos |
|---|---|---|---|
| **Nariño** | `narinoahora.com` | `/feed/` | **11 de 11** |
| **Cundinamarca** | `noticiasdiaadia.com` | `/feed.xml` | 7 de 13 |
| **Tolima** | `ecosdelcombeima.com` | `/rss.xml` | 5 de 10 |
| **Arauca** | `lavozdelcinaruco.com` | `/feed/` | 4 de 11 |
| **Magdalena** | `seguimiento.co` | `/rss.xml` | 3 de 10 |
| **Córdoba** | `larazon.co` | `/feed/` | 3 de 11 |
| **Archipiélago de San Andrés** | `elisleño.com` | Joomla, punycode | 2 de 10 |

Todos publicaron **hace 0-2 horas**. Con los siete, el mapa pasaría de **18 a
25 de 33**.

**Segundas opciones ya verificadas**, por si alguna ficha se cae: `diariodelsur.com.co`
(Nariño) y `elnuevodia.com.co` (Tolima).

**`extra.com.co` NO entra**: publica de varios departamentos a la vez (Nariño,
Valle) porque es una cadena con ediciones regionales. No es un medio
departamental y etiquetarlo como tal mandaría noticias al departamento
equivocado.

**Esto no es un alta.** Cada uno necesita su ficha de propiedad y la firma de
Jose, igual que los 22 que ya están. Lo que este barrido afirma es que **existe
una vía técnica**, que es lo que hasta hoy se daba por cerrado.

---

## Cuatro que siguen resistiéndose

Tienen medio conocido pero **sin feed utilizable**, comprobado hoy:

| Departamento | Medio | Qué pasa |
|---|---|---|
| Sucre y Córdoba | `elmeridiano.co` | Sin feed declarado ni en rutas convencionales |
| Quindío | `cronicadelquindio.com` | Sin feed declarado ni en rutas convencionales |
| Caquetá | `caquetaaldia.com` | Sin feed declarado |
| Casanare | — | Los dominios probados no responden |

Córdoba queda cubierto igualmente por `larazon.co`, así que **el que El Meridiano
sigue bloqueando en solitario es Sucre**. Eso reordena la prioridad de escribirle:
ya no desbloquea dos departamentos, desbloquea uno.

---

## Tres que no se arreglan buscando más

**Amazonas, Guainía y Vaupés.** Ya estaba documentado tras tres búsquedas con
ángulos distintos, y este barrido no lo contradice: allí la comunicación existe
y es **radio**. Un agregador de RSS no alcanza eso.

**No es un fallo del catálogo, es un límite del formato**, y decirlo en la vista
departamental es más honesto que dejar tres departamentos en blanco como si allí
no pasara nada.

---

## Por qué aparecen ahora y no antes

Varios de estos figuraban como mudos en el barrido de agosto. El motivo era
nuestro: el User-Agent llevaba una tilde, una cabecera HTTP solo admite ASCII y
los cortafuegos la rechazaban con un 403. Ver `shared/userAgent.js`.

Queda pendiente rehacer el barrido completo de 124 dominios con el User-Agent
arreglado: `query.wikidata.org` devolvió 502 las dos veces que se intentó el
2026-08-11.
