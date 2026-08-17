# La Nación (Neiva) — ficha de orientación

| | |
|---|---|
| **Valor propuesto** | **0,00** — orientación mixta por Regla 2 |
| **Firma** | ☐ sin firmar |
| **Fecha** | 2026-08-16 (**alta**, autorizada por Jose) · campo del 14 |
| **Protocolo** | `PROTOCOLO_JUICIO_EDITORIAL.md` |
| **Departamento** | Huila — donde ya está Diario del Huila, así que **no desbloquea departamento**: añade una segunda voz |
| **Feed** | `lanacion.com.co/feed/` — 10 ítems, **10 de 10 en ventana**, 10 con imagen, mediana 16,2 h |

> **Lee «0,00» como «no sabemos», no como «equilibrado».** Es la Regla 2.

---

## LO QUE SE COMPROBÓ DE CAMPO HOY

**Feed vivo y fresco.** `lanacion.com.co/feed/`, `/rss` y `/?feed=rss2` responden
las tres con **10 ítems**, el último del **14-08-2026 a las 23:06 UTC**.

**Cuidado con `/nosotros/`: no es una página institucional.** Devuelve un artículo
de opinión titulado «Nosotros, los ahora huérfanos». Quien pruebe esa ruta y mire
solo el código 200 creerá haber leído la página de la casa. La propiedad está en la
**mancheta del pie de la portada**, no ahí.

---

## EVIDENCIA ADMISIBLE

### Nivel 1 — Quién lo edita, hoy

| Dato | Valor | Fuente |
|---|---|---|
| Sociedad editora | **COMUNICACIONES OLAVE S.A.S.** | mancheta del pie de `lanacion.com.co` (consultado 2026-08-14) |
| **NIT** | **no publicado** | — |
| **Socios** | **no publicados** | — |
| Presidente Consejo Editorial | **Felipe Olave Blackburn** | ídem |
| Presidenta | **Claudia Marcela Medina García** | ídem |
| Editor General | **Jesús Antonio Rojas Serrano** | ídem |
| Sede | Neiva, Huila, Calle 11 # 5-82 | ídem |
| Modelo | Suscripción de pago: digital $150 000/año, impresa $350 000/año | su página de suscripciones |

### CAMBIÓ DE MANOS EN 2024, y lo cuenta sobre todo él mismo

**El empresario huilense Felipe Olave Blackburn adquirió el diario en 2024**, y
después compró las emisoras **Huila Stéreo**, presentadas por el propio medio como
paso para consolidar su independencia editorial en la región.

**La fuente de casi todo eso es el propio diario**, que además publica con
regularidad piezas sobre Olave —su visión de la ciudad, su paso por un programa
local, su encuentro con arquitectos jóvenes—. Que un medio cubra a su dueño no es
en sí una irregularidad, pero convierte su palabra en **evidencia de nivel 4**, y el
protocolo prohíbe sostener una ficha solo en eso.

**Si se confirma que Olave controla el diario y Huila Stéreo, hay `controlGroup` que
marcar** y concentración regional que declarar en el mapa. Hoy no se marca, por la
misma razón por la que no se marcó «galvis» en El Nuevo Día: un vínculo que el mapa
de concentración *afirma* necesita documento, no una nota del interesado.

### El apellido está en la sociedad y en la cabecera, y eso NO cierra la propiedad

**Olave** aparece a la vez en la razón social —COMUNICACIONES OLAVE S.A.S.— y en el
presidente del consejo editorial, Felipe Olave Blackburn. Es la señal habitual de
diario regional de familia empresarial, y **aun así no consta el accionariado**: la
sociedad no publica NIT ni socios. Es exactamente el caso de Vive el Meta —editora
declarada, control sin declarar—, así que se aplica lo mismo: `ownerType` declarado
con la ausencia fechada, no deducido del apellido.

**Lo que lo cerraría:** certificado de existencia y representación de la **Cámara de
Comercio de Neiva**. Neiva ya estaba en la lista de certificados pendientes, así que
esto no añade un trámite nuevo: le da por fin un destinatario concreto.

---

## POR QUÉ NO SE PROPONE UN NÚMERO DISTINTO DE 0,00

**Y esta es la parte que hay que discutir antes de firmarla.** La tentación es
+0,20 o +0,25 «como los otros diarios regionales». El propio catálogo tiene ese
problema anotado desde el 12 de agosto:

> *Los siete diarios regionales están todos a la derecha, de +0,15 a +0,35. Si el
> criterio es «familia empresarial regional → derecha moderada», eso es la regla
> 5.1 al revés y hay que escribirlo o sustituirlo por evidencia.*

Poner a La Nación en la derecha por analogía sería **el octavo caso del mismo
razonamiento circular**, y encima antes de que el problema esté resuelto. La
analogía ya se descartó una vez, con EL DIARIO de Boyacá, y por decisión de Jose.

**Cero corpus todavía**: el medio no está en el catálogo, así que no hay ni una
pieza suya medida. Cualquier número hoy sería opinión.

---

## LO QUE FALTA PARA QUE ESTO SEA UN ALTA

1. **Decisión de Jose sobre el valor**, con el problema de los diarios regionales
   resuelto o explícitamente aplazado.
2. Certificado de la Cámara de Comercio de Neiva (NIT y socios).
3. `feedUrl`, entrada en `mediaRegistry`, dominio en la CSP de `vercel.json`.
4. Corpus propio antes de cualquier valor distinto de 0,00.
