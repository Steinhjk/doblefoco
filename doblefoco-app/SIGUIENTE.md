# Por dónde seguir

Nota de traspaso del **2026-08-10**. Rama `orden-por-importancia`, empujada,
árbol limpio, **430 tests** en verde, lint y typecheck limpios.

El mapa por departamentos ya está en `main` (`10a1419`) y publicado en Vercel.

---

## Lo que se hizo hoy, y por qué

El terremoto del Chocó no era portada. No era una causa, eran dos.

| | |
|---|---|
| **Nada envejecía** | `medios DESC, published_at DESC`: la fecha solo desempataba. El radar mostraba a Jorge Messi y un ataque con drones, ambos del 8 de agosto |
| **La fragmentación castigaba lo importante** | 22 medios y 104 artículos repartidos en 20 historias de 3 a 7 medios. Un nombramiento, que solo admite una forma de contarse, ganaba con 8 limpios |
| **El titular lo daba la pieza más cubierta** | Y esa puede ser una galería de fotos. El accidente con tres muertas se titulaba «Las últimas fotos de las turistas colombianas» |

Tres módulos nuevos: `shared/relevancia.js`, `shared/sucesos.js` y
`shared/titularDeSuceso.js`. Ruta nueva `/api/portada`. Calibración reproducible
con `npm run eval:sucesos`.

---

## Lo primero al volver

1. **Fusionar a `main` y desplegar Fly**, en ese orden. Empujar a `main` publica
   el cliente; la API la despliega `npm run deploy`. **No hay prisa entre los
   dos pasos**: si `/api/portada` todavía no existe, la portada se cae sola al
   orden por historias sin romperse ni avisar. Está hecho a propósito.
2. **La categoría del terremoto es «Política»**, porque el titular dice
   «Gobierno declara desastre nacional». Un sismo con 111 muertos no es
   política. No hay sección de desastres en la taxonomía y la más cercana sería
   Ambiente: **es decisión de producto, no se tocó.**
3. **La foto del destacado** viene con crédito de Telemedellín y conviene
   mirarla: no está claro que sea del sismo.

---

## Decisiones tomadas hoy que conviene no volver a discutir

**La vida media son 24 h y está medida.** Cualquier decaimiento barre lo rancio
—el salto está entre «sin decaimiento» y el resto, no entre los valores—. Lo que
separa unos de otros es el monocultivo: a 6 h el top 10 son ocho piezas del
mismo hecho. 24 h además se explica sin enseñar la fórmula, y un parámetro de
orden que no se puede explicar es uno que nadie va a auditar.

**Un suceso agrupa para ordenar y presentar, nunca para fusionar.** Cada historia
conserva su titular y su recuento. No se bajó el umbral de `clustering.js`: está
en 0,34 con medición detrás. «Estas piezas hablan del terremoto» y «estas piezas
son el mismo hecho» son afirmaciones distintas, y solo la segunda inventaría
cobertura.

**Agrupamiento por líder, no por encadenamiento.** Un umbral laxo con enlace
simple encadena: A se parece a B, B a C, y C acaba dentro sin parecerse a A.

**El titular se elige por FORMATO, nunca por tema ni por importancia.** Mismo
criterio que `contentQuality.js`. Y no se descarta nada: la galería sigue en el
suceso con su recuento y su enlace; lo único que no puede es dar nombre al
conjunto.

**El medoide se probó y se descartó.** Sobre los seis sucesos de 3+ ángulos del
día: cambiaba el titular en los seis, acertaba en dos y empeoraba en tres.
Metía «En directo: Netanyahu rechaza el plan…» como titular de Gaza. La
centralidad mide parecido, no vocación de titular.

---

## El hallazgo que no estaba previsto

**El vocabulario pesa más que el umbral.** Con el IDF de las 100 historias de una
página, 6 de 19 agrupaciones eran falsas —«Colombia reconoce la soberanía de
Marruecos sobre el Sáhara» unida a «reconoce soberanía de Israel sobre el
Golán», porque «soberania» salía dos veces en cien y parecía rarísima—. Con el
IDF de los 4 684 titulares del corpus, y **sin tocar el umbral**, desaparecen las
seis.

Es la advertencia que `evalClustering.mjs` ya llevaba escrita desde antes —«un
IDF sobre 144 titulares no dice lo mismo»— ahora con la medida al lado. Y es la
razón de que el agrupamiento viva en el servidor: el navegador solo descarga la
página y no tiene con qué hacerlo bien.

---

## Lo que sigue pendiente de antes

Sin tocar desde la nota del 9 de agosto:

1. **Escribir a El Meridiano** (`elmeridiano.co`). Cubre Córdoba **y** Sucre. Es
   lo que más desbloquea por menos trabajo.
2. **La afiliación de Ecos del Combeima a Blu Radio.** Decide si el Tolima tiene
   voz propia. Está en `fichas/ecos-del-combeima.md` como alta condicionada.
3. **Ocho certificados de Cámara de Comercio.** No se tramitan desde aquí.
4. **La FLIP** y sus «Cartografías de la Información». Su web daba 502 y 404.

Y del mapa: los conteos siguen siendo **de las historias cargadas, no del
catálogo**. Persistir `articles.departamento` es trabajo de la API, y ahora que
hay que desplegar Fly de todas formas, es buen momento para hacerlo en el mismo
viaje.
