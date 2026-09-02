# Plan del archivo permanente — la opción B

**Decidido por Jose el 2026-09-02:** se hace, y se acepta el coste de 25 USD al
mes. Este documento estructura el trabajo; **no da nada por implementado**. La
cuenta la sigue llevando `MINUTA.md`.

Sucede a la decisión del punto 1 de la sesión de decisiones, que eligió la
opción C —retención interna de 30 días sin páginas permanentes— como paso
intermedio. C sigue en pie y en producción; B se construye encima.

---

## Lo que ya está hecho, y no es poco

Tres de las piezas difíciles existen desde antes de decidir esto:

| Pieza | Estado |
|---|---|
| Los artículos sobreviven más de 72 h | **Hecho** (30 días, `RETENCION_BASE_MS`) |
| La cobertura se guarda **calculada**, no derivada al leer | **Hecho.** Si mañana se revisa el sesgo de un medio, la historia conserva la medición que se le mostró al lector. Es media respuesta al problema de fondo de un archivo |
| Cada historia tiene URL estable con su slug | **Hecho** (`/noticia/:id`) |

---

## El obstáculo real, y no es el dinero

**Hoy las historias son una proyección efímera.** `persistStories` recalcula el
conjunto entero en cada ciclo y termina con esto:

```sql
DELETE FROM stories
 WHERE id <> ALL($1::text[])
   AND id NOT IN (SELECT story_id FROM moderation)
```

Es decir: **una historia que el ciclo actual ya no produce se borra**, y hoy eso
ocurre a las 72 h, cuando sus artículos salen de la ventana de agrupamiento. La
única excepción son las historias con decisión de moderación.

Archivar no es «subir un número»: es **dejar de borrar**, y eso cambia lo que
significa la tabla. Hoy `stories` es «lo que hay ahora»; después será «todo lo
que hubo». Cada consulta que hoy lee `stories` sin filtro empezaría a leer el
archivo entero.

---

## Las cuatro etapas, en orden de dependencia

### A · Congelar en vez de borrar

- Columna `archivada_el TIMESTAMPTZ` en `stories`. Una historia que el ciclo ya
  no produce **no se borra: se sella** con la fecha.
- Todo lo que hoy sirve la portada, el feed y las secciones filtra por
  `archivada_el IS NULL`. **Esta es la parte con riesgo**: cada consulta que se
  olvide del filtro empieza a servir noticias de hace meses como si fueran de
  hoy. Va con una prueba que recorra `feedStore.js` y exija el filtro.
- El agrupamiento **no cambia**: sigue trabajando sobre las 72 h de memoria. Una
  historia sellada no vuelve a recalcularse nunca, y eso es lo que la hace
  archivo y no una historia vieja mal mantenida.
- **Coste:** 2–3 días. **Riesgo:** medio, y todo está en las consultas.

### B · La página de una historia archivada

- `/noticia/:id` deja de dar 404 cuando la historia ya no está viva.
- La página **dice que es archivo**, con la fecha, y no se presenta como noticia
  del día.
- `robots`: se indexa, que es el punto de tener archivo.
- **Coste:** 1–2 días. **Riesgo:** bajo.

### C · Las fichas fechadas — aprobado por Jose el 2026-09-02

Es la pieza que convierte el archivo en algo defendible, y la que yo puse como
condición para pagar.

**El problema.** Una página archivada sigue afirmando lo que afirmaba. Si
mañana cambia el dueño de un medio, una historia de hace seis meses mostraría
**la ficha de hoy sobre una cobertura vieja**. Eso no es archivar: es reescribir
el pasado.

**Tres salidas, de menos a más trabajo:**

1. **Decirlo.** La página archivada muestra la ficha actual con un aviso: «esta
   ficha de propiedad se comprobó el D; la cobertura es del D′». Medio día, y no
   miente. Es lo mínimo aceptable.
2. **Instantánea por historia.** Guardar con cada historia sellada lo que decía
   la ficha ese día. Es exacto y duplica datos en cada fila.
3. **Fichas con vigencia.** `mediaOwnership` guarda versiones con fecha de
   inicio y fin, y la página pide la vigente en la fecha de la historia. Es lo
   correcto a largo plazo, sirve también al mapa de medios, y es el más caro:
   3–5 días, más el trabajo de datar lo que ya existe.

**Mi recomendación: 1 ahora y 3 cuando cambie la primera ficha de verdad.** La
opción 2 parece intermedia y es la peor de las tres: duplica sin resolver, y el
día que se corrija un error en una ficha habría que reescribir las
instantáneas ya guardadas, que es justo lo que un archivo no debe permitir.

**Decisión pendiente de Jose: cuál de las tres.**

### D · El buscador

- Columna `tsvector` con configuración de español e índice GIN. Postgres lo trae
  de fábrica; es lo mismo que ya se usa para `stories.topics`.
- La consulta es logarítmica: buscar en un año no cuesta más que en tres días.
- **Sin sobrecosto propio**, y sin él el archivo es un cementerio: nadie llega a
  una historia de hace cinco meses por la portada.
- **Coste:** 2–3 días. **Riesgo:** bajo.

---

## El dinero, medido el 2026-09-02

**Hoy:**

| Concepto | Al mes |
|---|---|
| Fly — API, 256 MB | ~2,00 USD |
| Fly — worker, 512 MB | ~3,30 USD |
| Supabase Free | 0 |
| Vercel Hobby | 0 |
| **Total de infraestructura** | **~5,30 USD** |

El dominio va aparte y lo lleva Jose en Porkbun. La factura exacta de Fly está
en su panel; estas cifras son la tarifa de las máquinas que hay levantadas.

**Con el archivo:**

| Concepto | Al mes |
|---|---|
| Lo de arriba | ~5,30 USD |
| Supabase Pro — 8 GB | 25,00 USD |
| **Total** | **~30,30 USD** (~364 al año) |

**Cuándo hay que pagarlo, y no es hoy.** Con 30 días de retención la base se
estabiliza en ~290 MB, dentro de los 500 MB del plan gratuito. El límite se
alcanza cuando la retención pase de unos **55 días**, o sea a finales de
octubre si se deja crecer. **A un año vista serían ~3,2 GB de los 8 GB del
plan Pro**, con margen para unos dos años y medio antes de volver a decidir.

**Lo que el Pro trae además del espacio, y conviene tenerlo en cuenta porque
cambia trabajo por dinero:** copias de seguridad automáticas diarias con
retención de siete días. Hoy eso lo hace un flujo propio que respalda seis
tablas y **no incluye `articles`**. Con el archivo, `articles` pasa a ser
irreemplazable y el respaldo propio tendría que crecer; el Pro lo cubre sin
escribir código. **Antes de contratar conviene mirar en el panel de Supabase el
consumo de ancho de banda**, que en el plan gratuito es el otro techo y no se
ha medido nunca.

---

## Lo que este plan NO propone

- **Ampliar la ventana de agrupamiento.** Guardar es barato; volver a agrupar,
  no: el primer paso de `clusterArticles` es cuadrático y 30 días tardarían más
  que el propio intervalo entre ciclos. El archivo guarda historias **ya
  formadas**; no las recalcula. Si algún día hace falta más ventana, lo que hay
  que cambiar es el algoritmo, no el plan de precios.
- **Archivar los artículos para siempre.** Lo que gana valor con el tiempo es la
  **historia** —el hecho y quién lo cubrió—, y esa ocupa una fracción. Mantener
  cada artículo original a perpetuidad multiplica el coste sin añadir una
  afirmación nueva. Propuesta: historias permanentes, artículos con la retención
  que se decida.

---

## Orden propuesto

1. **C.1** — el aviso de ficha fechada. Medio día, y desbloquea todo lo demás
   sin comprometer nada.
2. **A** — congelar en vez de borrar, con la prueba del filtro.
3. **B** — la página archivada.
4. **D** — el buscador.
5. **Contratar el Pro** cuando la retención vaya a pasar de 55 días, no antes.

Entre 1 y 4 hay **una semana y media de trabajo**. El pago es el último paso y
el más fácil de revertir.
