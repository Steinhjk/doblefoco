# Razón Pública — ficha de orientación

| | |
|---|---|
| **Valor actual** | **−0,40** · `reviewedAt: null` |
| **Propuesta** | **NO FIRMAR, y hay una pregunta anterior al número:** casi todo lo que publica es análisis, y el filtro de opinión no puede verlo |
| **Firma** | ☐ pendiente — Jose Arbeláez |
| **Fecha** | 2026-09-08 |
| **Protocolo** | `PROTOCOLO_JUICIO_EDITORIAL.md` |
| **Nivel 2** | `npm run expediente -- --medio=razon-publica`, medido el 2026-09-08 |

---

## EVIDENCIA ADMISIBLE

### Nivel 1 — Propiedad, vigente y declarada, con una laguna declarada

**Fundación sin ánimo de lucro ni carácter partidista**, constituida en 2008 como
punto de convergencia de académicos e intelectuales colombianos. La dirige
**Hernando Gómez Buendía**, su director y editor general. Se sostiene con
donaciones directas y con aportes de miembros de su propio consejo directivo, que
figuran como miembros financiadores.

- [Razón Pública — Quiénes somos](https://razonpublica.com/quienes-somos/)
- [Razón Pública — Qué es Razón Pública](https://razonpublica.com/que-es-razon-publica/)

> **NO PUBLICA LA IDENTIDAD DE SUS PATROCINADORES INSTITUCIONALES:** su página de
> aliados muestra logos sin identificarlos. Es un hueco de transparencia y se
> deja constatado, no rellenado.

### Nivel 2 — Conducta medida en nuestro corpus (30 días)

| | |
|---|---|
| Artículos | 28 |
| Historias en las que entra | 15 |
| Historias compartidas con otro medio | **1** |
| Cadencia | una pieza cada 7,6 h |
| Última pieza | 2026-09-08 |

| Socios | Historias | Medio |
|---:|---:|---|
| **1** | 15 | **Razón Pública** |
| 3 | 15 | EL DIARIO (Boyacá) |
| 25 | 18 | Al Aire Noticias |
| 6 | 12 | Chocó 7 Días |

| Tema | Suyo | Corpus | Se aparta |
|---|---:|---:|---:|
| Economía | 47,4 % | 11,5 % | **4,1×** |
| Derechos y sociedad | 10,5 % | 3,1 % | 3,4× |
| Política | 26,3 % | 19,3 % | 1,4× |
| Desastres y accidentes | 5,3 % | 9,7 % | 0,5× |

**Casi la mitad de lo que publica es economía**, contra el 11,5 % del corpus. Y
prácticamente no cubre sucesos, que es el 9,7 % de la agenda común.

### Nivel 2 — Sus titulares, literales, del 07 y 08 de septiembre

- «Caricatura Muertos en bolsas Abelardo»
- «¿Qué se está sincerando?»
- «PGN 2027: el costo de sincerar la asfixia fiscal»
- «¿Es conveniente para Colombia retirarse de la Corte Penal Internacional?»
- «La política exterior de De la Espriella y Bula: alineamiento y aislamiento»
- «El difícil tránsito de los fósiles a las energías limpias»
- «Que solo el dentista nos meta los dedos a la boca»

---

## LA PREGUNTA QUE VA ANTES DEL NÚMERO

**Ninguno de esos siete titulares es una noticia. Los siete son análisis, y uno
es literalmente una caricatura.**

`detectarOpinion` nombra tres cosas por su nombre —editorial, caricatura y
columna— y las saca del agrupamiento. Razón Pública publica en la raíz
(`razonpublica.com/titulo`), así que **el filtro no ve ninguna de las tres**. De
las 631 piezas de opinión que ha marcado en todo el corpus, **cero son suyas** —y
15 de sus historias están dentro del feed como si fueran cobertura.

Es el caso extremo de la entrada del 2026-09-08 en `MINUTA.md`: donde Las2Orillas
mezcla reportería y columna, **Razón Pública es una revista de análisis y punto**.
Su propio «Quiénes somos» lo dice: un punto de convergencia de académicos.

**Y eso convierte el nivel 2 en algo que no se puede leer:**

- Su 47,4 % de economía no dice qué cubre: dice **sobre qué opinan sus
  columnistas**, que son de distintas casas y firman por separado.
- Su socio único con 15 historias no mide agenda propia: un análisis del
  presupuesto no coincide con la cobertura de nadie porque no cubre un hecho.
- **Y su presencia en 15 historias del feed es, muy probablemente, opinión
  presentada al lector como cobertura**, que es exactamente lo que el commit
  593ad40 quitó del producto en agosto.

**Esto es más grande que una ficha**, y por eso se anota aquí y en la minuta en
vez de resolverse: la pregunta no es qué número lleva Razón Pública, sino si sus
piezas deberían estar entrando al agrupamiento.

---

## ARGUMENTO — el que se podría hacer, y por qué no se hace hoy

Un medio de análisis firmado por académicos de varias corrientes es, por
construcción, difícil de situar: lo que se mediría es la selección de firmas de
la casa. Eso es línea editorial y es clasificable —quién invitas a escribir es
una decisión— pero exige una medida que hoy no existe: **quién firma, con qué
frecuencia, y desde dónde**. `detectarOpinion` extrae el columnista de la URL
cuando la URL lo trae; aquí no lo trae.

Sin esa medida, cualquier número sería una impresión de lectura, y el protocolo
la excluye por escrito.

---

## CONTRA — el mejor caso a favor de firmar igualmente

1. **El nivel 1 es sólido y suficiente para muchos medios del catálogo.** Una
   fundación de académicos con director conocido y sin partido detrás es
   exactamente el perfil de la banda mixta o de una izquierda moderada suave. Se
   podría firmar por nivel 1 y declarar el nivel 2 como no disponible.
2. **La regla 3 no obliga a lo contrario.** Dice que sin evidencia de nivel 1-3
   no se mueve el número; aquí hay nivel 1, así que moverlo sería admisible.
3. **Dejarlo sin firmar tiene un coste:** su valor sigue contando en la tasa de
   la izquierda del modelo de puntos ciegos, firmado o no. No firmar no es
   neutral; es dejar el número heredado haciendo su efecto.

**El punto 3 es el que más pesa, y por eso esta ficha no dice «ya veremos»: dice
que hay una decisión que tomar, y cuál es.**

---

## REFUTACIÓN — qué observación concreta cambiaría el número

- **Si se marca su opinión por otra vía que la URL** —el feed, la categoría del
  ítem RSS— y queda alguna reportería suya en el corpus: se mide esa y se firma
  sobre ella.
- **Si al marcarla resulta que el 100 % es análisis**: entonces la decisión no es
  de ficha sino de catálogo, y hay que decidir si un medio de solo análisis entra
  al agrupamiento o se queda como medio de referencia, con su ficha y su sitio en
  el mapa —que es lo que ya se hizo con El Manduco por otra razón—.
- **Si publica la identidad de sus patrocinadores institucionales**: se cierra el
  hueco de nivel 1.

---

## NOTA DE CONTABILIDAD — su hallazgo del libro sigue abierto

`razon-publica/feed` figura como **resuelto** en la última pasada de la auditoría
(2026-09-03) tras haber estado marcado como parado. Publica por tandas, y esa es
su cadencia: una pieza cada 7,6 h medida hoy. No hay avería que investigar.

---

## REVISIÓN EXTERNA

☐ Pendiente. Va al circuito con **dos** encargos: argumentar en contra de no
firmar, y responder si un medio cuyo contenido es íntegramente análisis debe
entrar al agrupamiento de noticias.
