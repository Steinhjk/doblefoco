# Diario La Libertad (Barranquilla) — ficha de orientación

| | |
|---|---|
| **Valor propuesto** | **0,00** — orientación mixta por Regla 2 |
| **Firma** | ☐ sin firmar |
| **Fecha** | 2026-08-16 (**alta**, autorizada por Jose) · campo del 14 |
| **Protocolo** | `PROTOCOLO_JUICIO_EDITORIAL.md` |
| **Departamento** | Atlántico — donde ya está El Heraldo, así que **no desbloquea departamento** |
| **Feed** | `diariolalibertad.com/feed/` — 50 ítems, **15 de 15 en ventana**, mediana 2,7 h, **0 con imagen** (dependerá del enriquecedor por `og:image`) |

> ### ⚠ ESTA FICHA HAY QUE CERRARLA ANTES QUE NINGUNA OTRA
>
> En enero de 2025 se anunció que **Samuel Tcherassi** pasaba a ser el socio
> controlante de este periódico. **Tcherassi es candidato anunciado a la Alcaldía
> de Barranquilla para 2027** y fue contratista de esa misma alcaldía. Un medio
> cuyo dueño aspira a gobernar la ciudad que el medio cubre a diario es el
> conflicto de interés más directo del catálogo — **si se confirma**, y no consta
> que se haya confirmado. Ver abajo.

---

## LO QUE SE COMPROBÓ DE CAMPO HOY

**El feed es el más productivo de los tres candidatos del barrido.** `/feed/`,
`/rss` y `/?feed=rss2` responden las tres con **50 ítems**, el último del
**15-08-2026 a las 02:18 UTC**. Coincide con lo que anotó el barrido del 12 de
agosto: unos 50 ítems al día.

**Cubre Atlántico y Magdalena**, y tiene cadena radial propia. Sus secciones son
Crónica, Judicial, Nacional, Atlántico, Magdalena, Política, Económica y Cadena
Radial.

### La trampa en la que caí, porque afina la de Quindío Noticias

`/nosotros`, `/equipo` y `/contacto` devuelven **200 con tres tamaños distintos**
—127 kB, 153 kB y 75 kB—, y di por hecho que eran tres páginas institucionales
reales. **No lo son:**

- `/nosotros` → un artículo del **4 de mayo de 2020** sobre Marlon Piedrahita, del
  Junior de Barranquilla. El slug coincide con la primera palabra del titular
  («*Nosotros* como cualquier trabajador colombiano…»).
- `/equipo` → un artículo del **2 de noviembre de 2023** sobre el *equipo*
  anticontrabando de la Gobernación del Magdalena.
- `/contacto` → sí es una página real, y **no publica datos de contacto**: solo el
  listado de última hora.

**Quindío Noticias devolvía la portada a cualquier ruta y se detectó comparando
tamaños. Aquí los tamaños son distintos y aun así ninguna es lo que pide la ruta.**
La lección se corrige: **tamaños distintos prueban que no es la misma página, no
que sea la página que pediste.** Hay que leer el contenido, siempre.

---

## EVIDENCIA ADMISIBLE

### Nivel 1 — Quién lo edita, hoy

| Dato | Valor | Fuente |
|---|---|---|
| Sociedad editora | **no declarada en ninguna página accesible** | consultado 2026-08-14 |
| **NIT** | **no publicado** | — |
| **Socios** | **no publicados** | — |
| Único rastro institucional | «COPYRIGHT 2022 DIARIO LA LIBERTAD» | pie de la portada |
| Firma de sus piezas | **«Redacción3 La Libertad», «Redacción4 La Libertad»** — cuentas numeradas, sin nombre de periodista | sus artículos del 14-08 |

**Ni una persona nombrada en todo el sitio.** El medio publica 50 piezas al día
firmadas por cuentas numeradas, y el único rastro de la casa es un aviso de
copyright congelado en 2022. Es el patrón repetido en veinte de veinte altas
regionales, aquí en su versión más cerrada: **no hay ni a quién pedirle una
rectificación**, como en Abra Noticias.

### Lo que su sitio calla, la prensa sí lo cuenta

| Dato | Valor | Fuente |
|---|---|---|
| Fundación | **1979**, por **Roberto Esper Rebaje** | Wikipedia, El Heraldo |
| Directora y CEO | **Luz Marina Esper Fayad**, hija del fundador | La Silla Vacía, Valora |
| Sociedad histórica | **DIARIO LA LIBERTAD LIMITADA, «EN LIQUIDACIÓN»** | directorios de empresas |
| Antecedente | Pelea de herederos por el control del diario (2017) | El Heraldo |
| **Operación de 2025** | **Samuel Tcherassi como socio controlante**, junto con las dos emisoras La Libertad y la marca de **El Espacio** (Bogotá) | La Silla Vacía, Valora Analitik |

**Quién es Samuel Tcherassi.** Empresario de Barranquilla con intereses en moda,
construcción e infraestructura. **Fue contratista de la Alcaldía de Barranquilla**
—el Malecón del Río— bajo la segunda administración de Álex Char, de quien hoy es
crítico público. Y **es candidato anunciado a la Alcaldía de Barranquilla para
2027**, por firmas y como independiente.

### Por qué se declara y NO se asigna

**Las fuentes no coinciden en si la operación se cerró.** La Silla Vacía lo da como
socio controlante, con la compra confirmada por la propia Luz Marina Esper. Valora
Analitik precisa que lo firmado fue un **memorando de entendimiento** y que Esper
continuaría dirigiendo el diario con su equipo. **Un memorando no es una
compraventa.**

**Y no hay nada posterior a mayo de 2025.** Diecinueve meses de silencio no prueban
que la operación siguiera adelante ni que se cayera. Es la regla del presente: lo
que no consta hoy, no se afirma hoy.

Con `ownerType` puesto, el catálogo afirmaría que un aspirante a alcalde es hoy
dueño de este periódico. Con la ficha en blanco, callaría un conflicto que el lector
necesita para pesar lo que lee sobre Barranquilla. **Se escribe lo que consta, con
su fecha y su grado de certeza** — que es exactamente para lo que existe el campo de
ausencia declarada.

### Un punto donde mirar, sin caracterizarlo todavía

El propio diario publicó el **10-05-2025** una pieza titulada **«Samuel Tcherassi:
un nuevo liderazgo se asoma en Barranquilla»**. **No se ha podido leer** —el sitio
devolvió 403—, así que aquí no se afirma que sea cobertura favorable ni de qué
género es. Se anota que existe, con título y fecha, porque es justo donde habría
que mirar primero.

### Lo que NO se hace

**No se le deduce orientación de la posición política de su comprador anunciado.**
Que Tcherassi se enfrente al clan Char no permite colocar al periódico en el eje.
Hace falta corpus propio — y hay **una hipótesis falsable a mano**: comparar cómo
cubre este diario a la Alcaldía de Barranquilla frente a **El Heraldo**, que es del
mismo mercado y ya está en el catálogo.

---

## LO QUE QUEDA ABIERTO

1. **PRIORITARIO — Cámara de Comercio de Barranquilla:** qué sociedad edita hoy el
   periódico, quiénes son sus socios y si Tcherassi figura. Certificado nuevo, y
   aquí no es trámite de rutina: **decide si hay que publicar un aviso de conflicto
   de interés**.
2. Cuál es la sociedad activa, dado que la histórica consta en liquidación. Es el
   caso de El Nuevo Día.
3. Si Luz Marina Esper Fayad sigue siendo directora en 2026.
4. Leer la pieza del 10-05-2025 y revisar cómo cubre a Tcherassi y a la Alcaldía.
5. Si se confirma: **`controlGroup` con El Espacio** (Bogotá), que entró en la misma
   operación, y aviso de conflicto de interés en la ficha pública.
