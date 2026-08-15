# Diario La Libertad (Barranquilla) — ficha de orientación

| | |
|---|---|
| **Valor propuesto** | **0,00** — orientación mixta por Regla 2 |
| **Firma** | ☐ sin firmar |
| **Fecha** | 2026-08-14 (candidatura; **no es un alta**) |
| **Protocolo** | `PROTOCOLO_JUICIO_EDITORIAL.md` |
| **Departamento** | Atlántico — donde ya está El Heraldo, así que **no desbloquea departamento** |

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

**Lo que lo cerraría:** Cámara de Comercio de Barranquilla. Es un **certificado
nuevo**, no estaba entre los nueve pendientes.

---

## LO QUE FALTA PARA QUE ESTO SEA UN ALTA

1. Certificado de la Cámara de Comercio de Barranquilla — hoy es la única vía, y
   las páginas del sitio ya están agotadas.
2. Decisión de Jose sobre el valor. Con cero corpus y cero propiedad, **0,00 por
   Regla 2** es lo único defendible.
3. `feedUrl`, entrada en `mediaRegistry`, dominio en la CSP de `vercel.json`.
