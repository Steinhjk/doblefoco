# Por dónde seguir

Nota de traspaso del **2026-08-11**, escrita al cerrar.

Todo está en `main`. **449 tests** en verde, lint y typecheck limpios, árbol
limpio. **Vercel y Fly desplegados**, base migrada, portada y mapa verificados en
producción con captura y sin errores de consola.

No queda nada a medias. Lo de abajo es trabajo nuevo, no arrastre.

---

## Qué se hizo el 10 de agosto, y por qué

Empezó con una pregunta de Jose: el terremoto del Chocó, con 111 muertos, no era
portada. Resultaron ser tres cosas distintas, en tres capas.

**1. Nada envejecía.** El orden era `medios DESC, published_at DESC`: la fecha
solo desempataba. El radar mostraba a Jorge Messi y un ataque con drones, ambos
de dos días antes. → `shared/relevancia.js`, vida media de 24 h.

**2. La fragmentación castigaba lo importante.** El terremoto eran 22 medios y
104 artículos repartidos en 20 historias de 3 a 7 medios. El ranking cuenta
medios *por historia*, así que un hecho grande genera más ángulos, se parte más y
pesa menos cada trozo. Un nombramiento, que solo admite una forma de contarse,
ganaba con 8 limpios. → `shared/sucesos.js` y la ruta `/api/portada`.

**3. El titular lo daba la pieza más cubierta.** Y esa puede ser una galería de
fotos: el accidente con tres muertas se titulaba «Las últimas fotos de las
turistas colombianas». → `shared/titularDeSuceso.js`.

Y por el camino apareció una cuarta, que era el defecto que Jose veía en la
tarjeta: **los desastres no tenían sección** y se repartían entre trece. →
`desastres` en la taxonomía, y `nombreDeSeccion` en `src/lib/seccion.js`.

Calibración reproducible: `npm run eval:sucesos` y `npm run recategorizar`
(ensayo por defecto los dos).

---

## Lo del 11 de agosto

**El feed estuvo diez horas parado** (01:45–12:10 UTC). `factuality: null` se
decidió válida el día 9 y se aplicó a `stories`, no a `sources`, que es la
proyección del registro: once medios entran sin medir, así que la proyección
fallaba entera y el worker moría con código 1 hasta que Fly se rindió («max
restart count of 10»). No estalló antes porque Fly llevaba sin desplegarse desde
el día 8. **El desfase de despliegue no da números peores: acumula una bomba.**

**La vigilancia lo detectó y no avisó.** Falló en rojo a las 06:53 y nadie lo
vio. Ahora abre un issue con la salida completa y lo cierra sola al recuperarse
— probado de punta a punta en una rama desechable. Mejora *que te enteres*, no
*cuándo*: la ventana sigue siendo de seis horas.

**El departamento ya se persiste.** `stories.departamento` lo calcula la ingesta
y `/api/departamentos` cuenta el catálogo entero, así que el mapa dejó de contar
lo descargado. Va en `stories` y no en `articles` —contra lo que decía esta
nota— porque el detector mira solo el titular de la historia, y persistirlo por
artículo obligaría a cambiar esa decisión.

---

## Lo primero al volver

1. **La foto del destacado.** Es lo único de la portada del terremoto que quedó
   sin mirar: viene con crédito de Telemedellín y no está claro que sea del
   sismo. Jose lo señaló y no se tocó.
2. **Escribir a El Meridiano** (`elmeridiano.co`). Cubre Córdoba **y** Sucre: un
   solo obstáculo técnico deja dos departamentos sin voz. Sigue siendo lo que más
   desbloquea por menos trabajo.
3. **La afiliación de Ecos del Combeima a Blu Radio.** Decide si el Tolima tiene
   voz propia o una afiliada de Valorem. Está en `fichas/ecos-del-combeima.md`
   como alta condicionada.
4. **Ocho certificados de Cámara de Comercio** — Neiva, Tunja, Santa Marta,
   Villavicencio, Pereira, Arauca, San Andrés, Montería. No se tramitan desde
   aquí.
5. **La FLIP** y sus «Cartografías de la Información», que mapean 141 municipios
   y visitaron justo los huecos del catálogo. Su web daba 502 y 404 el 9 de
   agosto: estaba rota, no bloqueando.

---

## Decisiones tomadas hoy que conviene no volver a discutir

**La vida media son 24 h y está medida.** Cualquier decaimiento barre lo rancio
—el salto está entre «sin decaimiento» y el resto, no entre los valores—. Lo que
separa unos de otros es el monocultivo: a 6 h el top 10 son ocho piezas del mismo
hecho. 24 h además se explica sin enseñar la fórmula, y un parámetro de orden que
no se puede explicar es uno que nadie va a auditar.

**Un suceso agrupa para ordenar y presentar, nunca para fusionar.** Cada historia
conserva su titular y su recuento. **No se bajó el umbral de `clustering.js`**:
está en 0,34 con medición detrás. «Estas piezas hablan del terremoto» y «estas
piezas son el mismo hecho» son afirmaciones distintas, y solo la segunda
inventaría cobertura.

**Agrupamiento por líder, no por encadenamiento.** Un umbral laxo con enlace
simple encadena: A se parece a B, B a C, y C acaba dentro sin parecerse a A.

**El titular se elige por FORMATO, nunca por tema ni por importancia** — mismo
criterio que `contentQuality.js`. Y no se descarta nada: la galería sigue en el
suceso con su recuento; lo único que no puede es dar nombre al conjunto.

**El medoide se probó y se descartó.** Sobre los seis sucesos de 3+ ángulos:
cambiaba el titular en los seis, acertaba en dos y empeoraba en tres. Metía «En
directo: Netanyahu rechaza el plan…» como titular de Gaza. La centralidad mide
parecido, no vocación de titular.

**Los accidentes van en Desastres, la meteorología no se separa.** La forma la
zanjó IPTC Media Topics, el vocabulario de las agencias: su categoría es
«disaster, accident and emergency incident». Separa «weather» por el pronóstico
diario, que aquí no se ingiere —14 artículos en 4 000—. Copiar una división sin
el contenido que la justifica deja una sección vacía.

---

## Dos hallazgos que no estaban previstos

**El vocabulario pesa más que el umbral.** Con el IDF de las 100 historias de una
página, 6 de 19 agrupaciones eran falsas: «Colombia reconoce la soberanía de
Marruecos sobre el Sáhara» se unía a «reconoce soberanía de Israel sobre el
Golán» porque «soberania» salía dos veces en cien y parecía rarísima. Con el IDF
de los 4 684 titulares del corpus, **sin tocar el umbral**, desaparecen las seis.

Es la advertencia que `evalClustering.mjs` ya llevaba escrita —«un IDF sobre 144
titulares no dice lo mismo»— ahora con la medida al lado. Y es la razón de que el
agrupamiento viva en el servidor: el navegador solo descarga la página.

**`category` no es el campo de presentación.** Es la sección heredada del feed, y
`recategorizar.mjs` la conserva intacta a propósito: es el archivo de lo que el
sitio mostró antes de cada migración. Pero cuatro componentes la pintaban como
etiqueta, así que la tarjeta decía «Política» mientras la historia vivía en
Desastres — dos respuestas distintas a la misma pregunta en la misma pantalla.
Ahora se pinta `nombreDeSeccion`, con el mismo orden de preferencia que
`perteneceA` para que no puedan divergir.

---

## Trampas que ya mordieron, para no repetirlas

- **Añadir una sección toca TRES sitios**: `TEMAS` (`shared/topicClassifier.js`),
  `categories.js` y la lámina de `CategoryMark.jsx`. Hay una prueba por cada uno,
  y las tres avisan.
- **«Huracán» es un equipo de fútbol** argentino que la prensa colombiana cubre.
  Está fuera de las listas de `desastres` a propósito, con prueba. Y **«accidente
  cerebrovascular» es un ictus**: por eso «accidente» suelto va como débil.
- **Tokenizar dentro del bucle de comparación es O(n²)** y con miles de historias
  no termina. Está precomputado; no deshacer.
- **Nada de backticks dentro de una plantilla SQL** en `feedStore.js`: rompen el
  template literal y el error que da es un parse error críptico.
- **Lo que el registro produce, el esquema tiene que admitirlo.** `factuality:
  null` era válida en `mediaRegistry` y `NOT NULL` en `sources`, y esa
  contradicción tumbó el feed diez horas. Hay prueba que las compara. Un valor
  que uno genera y el otro rechaza es una caída diferida hasta el despliegue.
- **En YAML, un escalar plano no puede contener `": "`.** Un `run:` de una línea
  con dos puntos y espacio deja el workflow inválido, y GitHub lo reporta como
  una ejecución fallida de 0 s, no como un error de sintaxis. Usa un bloque `|`.
- **El orden del despliegue importa**: primero `main` (Vercel), luego
  `npm run deploy` (Fly), y la recategorización DESPUÉS de Fly — si no, el worker
  sigue ingiriendo con el léxico viejo.

---

## Lo que no se arregla buscando más

**Amazonas, Guainía y Vaupés no tienen medios web.** Tres búsquedas con ángulos
distintos y ni uno. Allí la comunicación existe y es radio. Un agregador de RSS
no alcanza eso: **no es un fallo del catálogo, es un límite del formato**, y
decirlo en la vista departamental es más honesto que dejar tres departamentos en
blanco como si allí no pasara nada.

---

## La idea apuntada que sigue sin empezar

En un medio de redacción automatizada **la orientación debería ser más medible,
no menos**. En una redacción humana el sesgo se reparte entre personas y días; en
una configurada es una propiedad del sistema. Con corpus suficiente su deriva
debería calcularse más directamente, y **una alteración de su configuración
debería verse como un salto y no como ruido**.

Boyacá Digital es el primer caso de prueba. Está en `shared/mediaRegistry.js`,
junto al campo `redaccion`, que es donde se buscará.
