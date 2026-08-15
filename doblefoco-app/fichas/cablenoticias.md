# Cablenoticias — ficha de orientación

| | |
|---|---|
| **Valor propuesto** | **0,00** — orientación mixta por Regla 2 |
| **Firma** | ☐ sin firmar |
| **Fecha** | 2026-08-14 (candidatura; **no es un alta**) |
| **Protocolo** | `PROTOCOLO_JUICIO_EDITORIAL.md` |
| **Ámbito** | Nacional (canal de televisión por suscripción, Bogotá) |

---

## LA DECISIÓN DE PRODUCTO QUE LO BLOQUEABA, Y LO QUE LA MEDIDA DICE

El barrido del 12 de agosto lo dejó anotado así: *«Cablenoticias publica cada hora,
y es el canal donde emite Noticias Uno, que hoy aporta cero artículos.»* La duda de
fondo era si darlo de alta **duplicaría** a un medio que ya está en el catálogo.

**No lo duplica, y esto sí se puede comprobar.** Su RSS trae **50 ítems**, el
último del **14-08-2026 a las 23:29 UTC**, con agenda nacional propia —la explosión
en la mina de Cucunubá, los créditos exprés del Valle tras el terremoto, el cierre
del colegio de Cajicá, las excarcelaciones en Venezuela— y **firmas de casa con
correo corporativo**: `jeyson.calderon@cablenoticias.tv`,
`miguel.rodriguez@cablenoticias.tv`, `pracweb2@cablenoticias.tv`, más
colaboradores externos.

**Es una redacción propia produciendo texto propio**, no la web de un noticiero
ajeno. Noticias Uno alquila espacio de emisión; eso no hace que sus artículos sean
los mismos. **La decisión de producto queda resuelta a favor de tratarlos como dos
medios**, pendiente de que Jose la confirme.

> **Lo que NO resuelve:** Noticias Uno sigue aportando cero artículos, y esta alta
> no lo arregla. Son dos problemas distintos que la nota del barrido había juntado.

---

## EVIDENCIA ADMISIBLE

### Nivel 1 — Quién lo edita, hoy

| Dato | Valor | Fuente |
|---|---|---|
| Sociedad editora | **no obtenible por HTTP** | consultado 2026-08-14 |
| **NIT** | **no publicado** | — |
| **Socios** | **no publicados** | — |
| Redacción | Al menos dos periodistas con correo corporativo nombrados en el feed | su RSS |
| Único rastro societario | «S.A.S.» suelto y «COPYRIGHT 2021» en el bundle | portada |

### Su web no se puede auditar por rutas, y hay que decirlo

**`cablenoticias.tv` devuelve exactamente 220 175 bytes para cualquier ruta**,
incluidas `/politica-de-privacidad`, `/programacion` y una inventada
(`/ruta-inventada-zzz`). Es una aplicación de página única que sirve el mismo
bundle y resuelve el contenido en el navegador.

**Consecuencia práctica:** quien pruebe sus páginas institucionales con `curl` verá
200 en todas y creerá haberlas leído. Es el caso de Quindío Noticias, y aquí la
comparación de tamaños lo detecta de inmediato porque son idénticos. Para leer sus
páginas haría falta ejecutar JavaScript, que es fuera del alcance de este trabajo.

---

## LO QUE FALTA PARA QUE ESTO SEA UN ALTA

1. **Confirmación de Jose** de que Cablenoticias y Noticias Uno son dos medios.
2. Propiedad: sin web auditable, la vía es el registro —**Cámara de Comercio de
   Bogotá**— o la ficha del canal ante la ANTV/MinTIC, que en televisión por
   suscripción sí tiene titular público (la pista que funcionó con The Archipielago
   Press y su licencia de Radio Archipiélago).
3. Decisión sobre el valor. Con cero corpus, **0,00 por Regla 2**.
4. `feedUrl` (`/rss`, **no `/feed/`**, que devuelve 0 ítems), `mediaRegistry`, CSP.
