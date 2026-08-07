# Auditoría de DobleFoco — agosto de 2026

> **Estado al 2026-08-07.** La Fase A.1 está hecha y cambió el diagnóstico de
> H2: la serie de F1-01 demostró que el techo de 5 000 no solo recortaba la
> ventana, sino que **era el que fijaba la tasa multifuente del producto**. La
> decisión está escrita en el ROADMAP (F1-01, ahora cerrada) y el techo subió a
> 8 000. H2 pasa de «pérdida silenciosa» a «corregido, pendiente de volver a
> medir en una semana».

Alcance: funcionalidades, algoritmos y flujo de trabajo. Todo lo que se afirma
aquí está medido contra la base de producción o contra los registros de
ejecución, con la consulta al lado para que se pueda repetir. Donde no pude
medir, lo digo.

**Lo primero, porque cambia cómo hay que leer el resto.** Este proyecto está
mejor documentado y es más autocrítico que la mayoría. El ROADMAP no solo dice
qué se hizo: dice qué se midió, qué se descartó y por qué. Varias cosas que a
primera vista parecían defectos resultaron ser decisiones tomadas con datos —el
caso más claro, TF-IDF implementado y NO adoptado tras medirlo contra 72 pares
etiquetados—. Esta auditoría se concentra por eso en lo que **no** aparece en
ninguno de los tres documentos de planificación.

---

## Lo que está bien y no hay que tocar

- **Agrupamiento.** Umbral calibrado con datos reales, fusión de grupos con
  índice invertido, y el caso Gaona documentado de punta a punta. El coste
  cuadrático ya está resuelto.
- **Renderizado de las noticias.** Título, canónica, JSON-LD con `citation` a las
  fuentes, redirección 301 a una sola URL por noticia, y `noindex` en las
  historias de un solo medio. Mejor que muchos medios establecidos.
- **Imágenes: 97,6 %** de los artículos tienen la foto del propio medio
  (5 676 de 5 814). El «1 de cada 100» que menciona un comentario antiguo está
  resuelto de sobra.
- **Seguridad de la base.** Cerrada el 2026-08-06: RLS en las 14 tablas, sin
  permisos para `anon`, API de datos sin esquema expuesto.
- **La serie de F1-01 ya tiene 11 días** (595 ciclos, del 27 de julio al 7 de
  agosto). La tarea pedía 7. **El análisis que esperaba esos datos ya se puede
  hacer**, y ese es el desbloqueo más barato que hay ahora mismo.

---

## Hallazgos

### H1 · El corpus está tan desequilibrado que el punto ciego casi no se puede medir
**Severidad: alta — afecta a la afirmación central del producto**

Volumen por banda en 72 horas:

| banda | medios | artículos | % del volumen |
|---|---|---|---|
| sin línea marcada | 21 | 3 732 | 64,5 % |
| derecha | 12 | 2 030 | 35,1 % |
| **izquierda** | **10** | **26** | **0,4 %** |

Y el detalle de la izquierda: VOZ 8, Cambio 6, RTVC 5, Cuestión Pública 3, Razón
Pública 2, Colombia Informa 1, RAYA 1, y tres en cero.

Comprobé si era una tubería rota. **No lo es**: siete de los diez medios de
izquierda están publicando y sus artículos entran. Son medios pequeños y de baja
frecuencia. El desequilibrio es real.

El problema no es el dato, es lo que se construye encima. **Infobae Colombia
publica 1 889 artículos en 72 horas: 72 veces el espectro de izquierda entero, y
el 32,5 % de todo el corpus.** Con la izquierda en el 0,4 %, la probabilidad de
que un hecho cualquiera tenga cobertura de izquierda es casi nula por
construcción, así que «la izquierda no cubrió esto» es cierto casi siempre y
deja de ser información. Hoy solo **26 historias de 4 330** tienen punto ciego
declarado, y solo **9 historias llegan a los 6 medios** que F1-03 exige para
afirmarlo.

Esto no se arregla metiendo más medios de izquierda —sería el falso balance que
el proyecto rechaza a propósito—. Se arregla **cambiando la unidad de medida**:
normalizar por medio y no por artículo, para que la cadencia de publicación de
Infobae no decida lo que el sitio concluye. Y declarando el límite donde se
afirma un punto ciego.

### H2 · El techo de 5 000 recorta la ventana de 72 horas, y nadie lo ve
**Severidad: alta — pérdida silenciosa**

`MAX_ARTICLES = 5 000` en `ingestDaemon.js:63`, con retención declarada de 72 h.
Medido:

```
artículos en la base ................ 5 814
dentro de la ventana de 72 h ........ 5 790
excluidos por el techo ................ 790   (13,6 %)
corte real ....................... ~62 horas, no 72
```

790 artículos que están dentro de la política de retención **nunca participan en
el agrupamiento**. El corte lo fija el volumen de Infobae, no una decisión: a
más publique un solo medio, más corta se vuelve la ventana para todos.

Ninguno de los tres documentos de planificación menciona `MAX_ARTICLES`. El
informe de cada ciclo tampoco lo dice. Es la clase de pérdida que solo aparece
si alguien va a buscarla.

### H3 · El 92 % de las historias son de un solo medio
**Severidad: media — es el tamaño real del producto**

4 330 historias · 3 981 de un solo medio · 349 multifuente · 9 con seis o más
medios · máximo observado: 9 medios.

La comparación de coberturas —lo que el producto es— se apoya en el 8 % del
corpus. El diseño ya lo asume bien (`esIndexable` marca `noindex` las de un solo
medio, y el sitemap trae exactamente esas 349). Pero conviene saber si ese 8 % es
el techo real del corpus colombiano o si el agrupamiento está separando de más.
**Se puede responder**: existe `shared/fixtures/clusteringPairs.js` con 72 pares
etiquetados y `scripts/evalClustering.mjs`. Es medir, no adivinar.

### H4 · Cada ciclo reescribe la base entera
**Severidad: media — coste y desgaste**

```
historias reescritas por ciclo ....... 4 330
filas de enlace ...................... 4 996
ciclos por día ........................... 48
≈ 447 000 escrituras diarias  para ~1 500 historias nuevas al día
```

Se reescribe todo aunque no haya cambiado nada. Con un hash del contenido del
grupo se escribiría solo lo que cambió, que es en torno al 3 %. Importa por el
plan de Supabase y porque hoy no hay margen medido antes de que empiece a doler.

### H5 · El catálogo dice 43 medios; comparando hay 33
**Severidad: media — coherencia de lo que se afirma**

- **7 sin feed declarado**: Agencia EFE, Reuters, CNN en Español, The New York
  Times, The Wall Street Journal, Financial Times, La Vanguardia. Es lo que
  bloquea F1-16 y está documentado.
- **3 con feed pero sin aportar nada en 72 h**: Vorágine, Noticias Uno, W Radio.
  Los dos últimos son colombianos y prolíficos en la realidad; cero artículos es
  sospechoso y hay que mirarlo uno por uno.

El mapa de medios y el panorama presentan 43 medios sin distinguir cuáles
aportan cobertura. No es engaño —la ficha de propiedad de los 43 es real y es
valiosa— pero conviene separar «está en el catálogo» de «está aportando
cobertura», que son dos cosas distintas.

### H6 · Nada avisa de nada
**Severidad: media — es el patrón que ya nos mordió dos veces**

No hay ni una mención de alertas o monitoreo en ROADMAP, LOG ni DUDAS. Hoy:

- Que Fly se quede atrás **no avisa**. Estuvo 6 días con 37 feeds cuando `main`
  tenía 39, y el síntoma no era un error sino tres secciones contando en cero.
- Que un medio lleve días mudo **no avisa**. Vorágine lleva 0 artículos y nadie
  lo habría notado.
- La tabla `errores` existe y funciona, pero hay que entrar al panel a mirarla.
- No hay comprobación de que el sitio esté en pie.

Los dos incidentes de esta semana —los correos falsos de Actions y el desfase de
Fly— son el mismo patrón: **el sistema falla en silencio y se entera quien vaya a
mirar**.

### H7 · El respaldo nunca se ha restaurado
**Severidad: media — riesgo no acotado**

Existe `scripts/backup.mjs`, corre a diario y sube el artefacto. Existe
`scripts/restore.mjs`. **No encontré constancia en ningún documento de que la
restauración se haya probado ni una vez.** Un respaldo que nunca se restauró no
es un respaldo: es un archivo que se supone que sirve. Y lo que protege —la
serie de F1-01— es justamente lo irreemplazable.

### H8 · No hay entorno de pruebas
**Severidad: baja-media — asumible hoy, no a medio plazo**

Las migraciones van directas a producción; hoy mismo lo hicimos. El esquema es
idempotente y con `IF NOT EXISTS`, lo que reduce mucho el riesgo, pero no hay
dónde probar un cambio destructivo antes de aplicarlo.

---

## Plan de mejora

Ordenado por **relación entre lo que aporta y lo que cuesta**, no por severidad.
Cada fase deja el sistema en un estado coherente; se puede parar entre fases.

### Fase A · Ver lo que ya tenemos (1–2 sesiones)
Nada de código nuevo de producto. Solo mirar datos que ya existen.

1. **Explotar la serie de F1-01.** Once días, 595 ciclos, sin analizar. Es el
   desbloqueo más barato y puede cambiar las prioridades de todo lo demás.
2. **Medir el agrupamiento contra los 72 pares etiquetados** (H3). Responde si
   el 8 % multifuente es el techo real o hay margen.
3. **Diagnosticar los tres medios mudos** (H5): Vorágine, Noticias Uno, W Radio.

### Fase B · Dejar de perder datos en silencio (1 sesión)
4. **Alinear el techo con la retención** (H2). Subir `MAX_ARTICLES` hasta cubrir
   72 h reales, o declarar el recorte en el informe del ciclo. Lo que no puede
   quedarse es invisible.
5. **Que el informe del ciclo diga si el techo recortó** y cuántos artículos.

### Fase C · Que el sistema hable cuando falle (1–2 sesiones)
6. **Alerta de desfase de Fly**: comparar la versión desplegada con `main`.
7. **Alerta de medio mudo**: N días sin artículos de un medio con feed.
8. **Comprobación de que el sitio responde**, con aviso.

Las tres son baratas y atacan el patrón de H6, que es el que ya nos costó dos
incidentes esta semana.

### Fase D · Metodología (la conversación de fondo)
9. **Normalizar por medio y no por artículo** (H1). Es la decisión con más
   consecuencias de toda esta lista y **no es técnica, es editorial**: cambia lo
   que el sitio afirma. Merece discutirse antes de tocar código.
10. **Separar en la interfaz «en el catálogo» de «aportando cobertura»** (H5).

### Fase E · Cuando haya holgura
11. Escribir solo lo que cambió (H4).
12. Probar la restauración del respaldo, una vez, y dejarlo escrito (H7).
13. Entorno de pruebas (H8).

---

## Lo que decidí NO proponer, y por qué

- **Cambiar la métrica de similitud.** Ya se midió contra 72 pares etiquetados y
  TF-IDF no mejora en el extremo conservador donde opera el proyecto. Proponerlo
  sería ignorar la medición.
- **Bajar el umbral de 0,34.** Se revisaron los 8 pares entre 0,28 y 0,34:
  arreglaría dos y rompería tres.
- **Añadir medios de izquierda para equilibrar.** Sería el falso balance que el
  proyecto rechaza por escrito. El desequilibrio es el hallazgo, no el error.
- **Retirar los medios mudos del catálogo.** La ficha de propiedad de los 43 es
  contenido valioso por sí misma, y retirar un medio por tener un feed pobre va
  contra el criterio establecido.
