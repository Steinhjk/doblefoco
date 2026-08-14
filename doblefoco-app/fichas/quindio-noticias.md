# Quindío Noticias (Armenia) — ficha de orientación

| | |
|---|---|
| **Valor propuesto** | **0,00** — orientación mixta por Regla 2 |
| **Firma** | ☐ sin firmar |
| **Fecha** | 2026-08-14 (alta) |
| **Protocolo** | `PROTOCOLO_JUICIO_EDITORIAL.md` |
| **Departamento** | Quindío — **es el primero del departamento en el catálogo** |

> **Lee «0,00» como «no sabemos», no como «equilibrado».** Es la Regla 2: no hay
> nada que sitúe a este medio en el eje, y la banda más cercana a la mixta es lo
> que el protocolo manda entonces. No es un elogio ni una absolución.

**No publica absolutamente nada sobre sí mismo**, y su servidor tiende una trampa a
quien intente comprobarlo.

---

## EVIDENCIA ADMISIBLE

### Nivel 1 — Quién lo edita, hoy

| Dato | Valor | Fuente |
|---|---|---|
| **Sociedad** | **no publicada** | — |
| **NIT** | **no publicado** | — |
| **Director / editor** | **no publicado** | — |
| Marca | «Quindío Noticias® — 2011-2025», con símbolo de marca registrada | pie de su portada |

### Cierra el hueco que el informe del 9 de agosto dejó anotado

Aquel informe corrigió el error de dar el Quindío por cubierto con Telecafé, que
emite desde Manizales —o sea Caldas—, y dejó escrito que **«Quindío sigue sin medio
suyo»**. Este lo cierra.

### AVISO DE COMPROBACIÓN: su servidor responde 200 a cualquier ruta

`/quienes-somos/`, `/nosotros/`, `/about/`, `/equipo/` y `/aviso-legal/` devuelven
**los mismos 106 kB de la portada**. Es un catch-all: ninguna de esas páginas
existe.

**Quien las pruebe y vea «200» creerá haber mirado sus páginas institucionales.** La
comprobación del 2026-08-14 tuvo que hacerse comparando tamaños de respuesta.

Es la misma clase de falso positivo que el feed que responde con cien titulares
rancios y pasa por bueno — el que obligó a añadir la comprobación de frescura a
`check:feeds`.

### El ® es la única puerta

El símbolo del pie **afirma** una marca registrada, lo que implicaría un titular
identificable ante la Superintendencia de Industria y Comercio.

No se afirma que el registro exista: se afirma que **el medio dice tenerlo**, y que
es la vía más prometedora sin recorrer.

---

## POR QUÉ 0,00

Nada. No hay declaración editorial, ni sección de opinión identificable, ni nombres
a los que atribuir una línea. **La ausencia es total**, y por eso el número es 0,00
por Regla 2.

**Se descartó la analogía regional**, por lo mismo que en EL DIARIO de Boyacá y El
Nuevo Día.

---

## EL FEED

```
https://quindionoticias.com/feed
HTTP 200 · 10 ítems · 10 de 10 dentro de la ventana de 72 h
más reciente 0,3 h · mediana 4,7 h
```

Sirve las fotos por la CDN de Jetpack (`i0.wp.com`), no desde su dominio: por eso
lleva `imageHosts` explícito en el registro. Comprobado el 2026-08-14.

---

## LO QUE FALTA

1. **El titular de la marca «Quindío Noticias»** en la Superintendencia de Industria
   y Comercio. Es la única vía de entrada que su propio sitio sugiere.
2. **Cualquier nombre propio.** Es, junto con The Archipielago Press, la ficha con
   menos asideros del catálogo.
3. **La razón social**, para poder pedir el certificado en la Cámara de Comercio de
   Armenia.

---

## REFUTACIÓN — qué movería este número

1. **Que el registro de marca dé un titular.** Es el hilo más corto y hoy sin tirar.
2. **Que aparezca una sección de opinión** o una línea editorial declarada. Sería
   nivel 3.
3. **Corpus propio.** Entra hoy; ver `revision-externa/CONDUCTA-MEDIDA.md`.
