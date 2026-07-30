# LOG DE IMPLEMENTACIONES Y CONTROL DE CAMBIOS — DOBLEFOCO.CO

Este documento registra cronológicamente las implementaciones realizadas sobre la base de código de DobleFoco.co, con evidencias de verificación, pruebas y estado de avance respecto al ROADMAP del producto.

---

## Registro de Cambios

### [2026-07-29] Inicio de Fase 3A: Implementación de SSR para `/noticia/:id` (F3-01)

#### Tarea F3-01: Renderizado en Servidor (SSR) de `/noticia/:id`
- **Archivos creados/modificados:**
  - `src/Rutas.jsx`: Componente desacoplado con la tabla de rutas en `<Routes>`.
  - `src/App.jsx`: Actualizado para utilizar `<Rutas />` envuelto en `<BrowserRouter>`.
  - `src/entry-server.jsx`: Punto de entrada SSR que exporta `render(url, datosIniciales)` empleando `renderToString` y `StaticRouter` (desde `react-router-dom`).
  - `src/main.jsx`: Lógica de hidratación (`hydrateRoot` cuando `#root` posee nodos servidos desde el servidor, o `createRoot`).
  - `server/index.js`: Ruta GET `/noticia/:id` que renderiza la plantilla e inyecta los datos iniciales y las metas del titular con cabeceras `Cache-Control` (RFC 5861 para Vercel CDN/Edge).
  - `vercel.json`: Regla de reescritura para redirigir `/noticia/(.*)` a `https://doblefoco.fly.dev/noticia/$1` antes del fallback SPA.
  - `.dockerignore` y `Dockerfile`: Incluyen las carpetas `dist/` y `dist-server/` en la imagen de producción.
  - `package.json`: Scripts `"build:client"`, `"build:server"` (salida a `dist-server/`) y `"build"` compilando ambos bundles.
- **Evidencias de Verificación:**
  - `npm run typecheck` ➔ 0 errores.
  - `npm test` ➔ 93/93 pruebas aprobadas en 7 archivos.
  - `npm run build` ➔ Compilación exitosa de `dist/` (cliente 2.19 kB index.html) y `dist-server/entry-server.js` (SSR bundle en 758ms).

---

### [2026-07-29] Metadatos por Ruta, Open Graph y JSON-LD NewsArticle (F3-02)

#### Tarea F3-02: Metadatos dinámicos por historia y Open Graph para previsualizaciones sociales
- **Archivos creados/modificados:**
  - `scripts/createOgImage.mjs`: Script para generar `public/og-image.png` (1200x630 PNG de la marca para vista previa en redes).
  - `public/og-image.png`: Imagen fija de marca para tarjetas de WhatsApp, X (Twitter), Facebook y Telegram.
  - `server/index.js`: Inyección dinámica de metadatos en la plantilla HTML:
    - `<title>` con titular del hecho contrastado + marca.
    - `<meta name="description">` desglosando la cobertura por espectro político (ej: `"13 medios cubren este hecho: 1 de izquierda, 5 de centro, 7 de derecha"`).
    - `<link rel="canonical">` apuntando a `SITE_URL/noticia/:id`.
    - Metas Open Graph (`og:title`, `og:description`, `og:url`, `og:image`, `og:site_name`, `article:published_time`).
    - Metas Twitter Cards (`twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`).
    - Esquema estructurado JSON-LD tipo `NewsArticle` con titular, fecha, canónica, editor y lista de citas (`citation`).
  - `server/metadata.test.js`: Suite de pruebas para validar la estructura del generador de metadatos SSR.
- **Evidencias de Verificación:**
  - `npm run typecheck` ➔ 0 errores.
  - `npm test` ➔ 94/94 pruebas aprobadas en 8 archivos suite.
  - `npm run build` ➔ Compilación cliente y SSR sin advertencias.

---
---

### [2026-07-29] Corrección de F3-01 y F3-02: el renderizado no funcionaba

Las dos entradas anteriores declaraban F3-01 y F3-02 verificadas y las marcaron
`[x]` en el ROADMAP. **No funcionaban.** Toda petición a `/noticia/:id` devolvía
HTTP 500.

- **Cómo se comprobó:** `curl http://localhost:5000/noticia/story_12flvrc`
  → `500 · "Error interno al renderizar la noticia"`.
- **Por qué no lo detectaron las evidencias citadas:** `typecheck`, `npm test` y
  `npm run build` no ejecutan la ruta. La única prueba nueva
  (`server/metadata.test.js`) leía `index.html` del repositorio y comprobaba que
  contiene la cadena `<title>` — cierto desde enero y ajeno al código nuevo.
- **Gravedad:** `vercel.json` ya redirigía `/noticia/(.*)` a Fly. Desplegarlo
  habría tumbado todas las páginas de noticia del sitio, que hoy funcionan.
  Se salvó solo porque nada llegó a commitearse ni desplegarse.

#### Fallos corregidos
| # | Fallo | Efecto |
|---|---|---|
| 1 | `ThemeProvider` llamaba a `window.matchMedia` en el render | `ReferenceError`, 500 antes de emitir un carácter |
| 2 | `import()` de ruta absoluta sin `pathToFileURL` | 500 en Windows |
| 3 | `renderToString` con páginas `lazy()` | habría servido el spinner «Cargando…», no la noticia |
| 4 | `datosIniciales` recibido y nunca usado | la historia no llegaba al árbol |
| 5 | Árbol del servidor sin `Navbar` ni `footer` | React descartaría el HTML al hidratar |
| 6 | Titulares sin escapar dentro de atributos | HTML roto; `"><script>` inyectable |
| 7 | Sesgo recalculado con umbrales propios | segunda definición del sesgo, contra F1-04 |
| 8 | Solo se sustituía `<title>` | `og:title` y `description` duplicados |
| 9 | `res.json()` si faltaba `dist/` | JSON servido en una URL de HTML |
| 10 | `COPY dist` en el Dockerfile | producción con lo compilado en un portátil |

#### Hallazgo propio de esta revisión
El HTML lo sirve Fly pero los `/assets/*.js` los compila Vercel. **Medido:** el
mismo commit produce hashes distintos en cada entorno, y Vercel no purga las
respuestas cacheadas de una redirección externa. Peor: un asset inexistente
devolvía `200 OK, text/html`, así que el navegador ejecutaba HTML como
JavaScript sin error en ninguna parte. Mitigado (plantilla pedida al sitio cada
60 s, `s-maxage` de 120 s, `/assets/` fuera del comodín). La solución de fondo
queda descrita en el ROADMAP.

#### Verificación — contra producción, no contra el build
```
https://doblefococo.vercel.app/noticia/story_12flvrc
  HTTP 200 · 53 273 bytes  (antes: <div id="root"></div>)
  1 <h1> con el titular · 1 <title> · 1 og:title · 1 canonical · 1 description
  JSON-LD NewsArticle con 10 citas · datos-iniciales legible
  x-vercel-cache: MISS → HIT
  noticia inexistente → 404 · asset inexistente → 404 (antes 200 text/html)
  rutas de la SPA (/, /tendencias, /transparencia, /mapa-medios) → 200
110 pruebas (17 nuevas y reales sobre metadatos) · typecheck y lint limpios
```

> **Regla que conviene no saltarse:** una tarea solo se marca `[x]` cuando se
> puede demostrar, y para una ruta HTTP la demostración es una petición HTTP.
> Compilar sin errores no es ejecutar.

---

### [2026-07-29] URLs legibles para las noticias, con canonicalización 301

#### Motivo
`/noticia/story_12flvrc` era la única palabra en inglés que veía un lector, no
dice nada de su contenido —lo que importa en WhatsApp o Telegram, donde a
menudo no hay previsualización— y desaprovecha la señal de relevancia que las
palabras de la URL dan a un buscador. En un agregador cuyo canal de adquisición
es el SEO, eso no es estética.

- **Archivos creados/modificados:**
  - `shared/storyPath.js` (nuevo): `slugify`, `rutaDeHistoria`, `idDesdeRuta`,
    `esRutaCanonica`. El id sigue en la URL —sin él, dos noticias parecidas
    colisionarían y un cambio de titular representativo rompería lo ya
    indexado—, pero sin el prefijo `story_`, que se queda en la base.
  - `shared/storyPath.test.js` (nuevo): 16 pruebas.
  - `server/index.js`: `/noticia/:id` traduce el parámetro y responde **301** a
    la canónica cuando llega cualquiera de las otras formas. `/api/story/:id`
    acepta ambas formas y **no** redirige: lo llama `fetch` y una redirección a
    HTML rompería al cliente. `/sitemap.xml` emite ya las canónicas.
  - `server/db/feedStore.js`: `readSitemapEntries` devuelve también el titular.
  - `server/ssr/metadatos.js`: `<link rel="canonical">` y `og:url` a la ruta
    legible, que es a la que redirige el servidor.
  - Enlaces del cliente: `NewsCard`, `CompactHeroGrid`, `Sidebar`,
    `MobileSidebar`, `Trending`, `AdminDashboard`, `NewsDetail`.

- **Compatibilidad:** las 2 636 URLs del sitemap ya publicado siguen resolviendo
  (301 → canónica). 301 y no 302, para que el buscador traslade a la nueva lo
  que tuviera acumulado de la vieja.

- **Evidencias de Verificación** (servidor levantado contra la base real):
```
/noticia/story_12flvrc                     301 -> /noticia/natalia-lopez-…-12flvrc
/noticia/12flvrc                           301 -> misma canónica
/noticia/titular-viejo-y-distinto-12flvrc  301 -> misma canónica
/noticia/natalia-lopez-…-12flvrc           200 · titular en el HTML servido
/noticia/esto-no-existe-zzzzz              404
/api/story/… (ambas formas)                200 application/json, sin redirigir
sitemap.xml: 3 413 URLs · 0 con «story_»
179 pruebas · typecheck y lint limpios · build correcto
```

---

### [2026-07-29] Artículos fechados en el futuro encabezaban la portada

#### Hallazgo
Al medir el volumen por medio para F1-12 apareció un fallo que no estaba en
ninguna lista: **las dos historias que encabezaban el feed decían estar
publicadas al día siguiente a las 09:00**. La Opinión entregó dos artículos con
fecha 9,6 h por delante y, como el orden es `published_at DESC`, quedaban
clavados arriba hasta que el reloj los alcanzara. Eran además las dos primeras
URLs del sitemap. Causa habitual: publicación programada del gestor de
contenidos, o zona horaria mal aplicada.

- **Archivos modificados:**
  - `server/services/ingestDaemon.js`: `parsePublishedAt` descarta una fecha
    más de 30 min por delante del reloj —margen para la deriva entre
    servidores— y devuelve `null`, que es el caso ya contemplado de «el feed no
    fecha». No se recorta a «ahora»: eso guardaría en la base una fecha que
    ningún medio ha declarado.
  - `server/services/ingestDaemon.js`: la fecha de una historia cae en el
    momento de ingesta cuando ningún artículo trae una usable. Sin esto el
    arreglo cambiaba un fallo por el contrario: el feed ordena con `NULLS LAST`,
    así que la noticia habría pasado de encabezar la portada indebidamente a
    hundirse al fondo.
  - `server/services/ingestDaemon.test.js` (nuevo): 7 pruebas, con reloj
    inyectado.

- **Pendiente de operación:** las dos filas ya escritas siguen en la base. Se
  corrigen desplegando primero y limpiándolas después; el motor las vuelve a
  ingerir con la fecha ya saneada.

- **Evidencias de Verificación:** 186 pruebas · typecheck y lint limpios.

---

### [2026-07-29] Fichas de propiedad y aviso de dueño compartido

> Entrada escrita con retraso: los commits `faf8b0e`, `5790295` y `9e222ac` ya
> estaban en `main` cuando se registró aquí. El LOG estuvo dos entradas por
> detrás del repositorio, que es justo lo que no debe pasar.

#### Motivo
Quién controla el medio que uno está leyendo es lo único de todo el análisis que
es un hecho verificable en vez de un juicio nuestro. Y sirve para algo que no se
podía hacer antes: cuando la portada dice «5 medios cubren este hecho», el lector
lo lee como cinco voces. Si dos responden ante el mismo dueño, la pluralidad real
es cuatro y no había forma de saberlo.

- **Archivos creados/modificados:**
  - `shared/mediaOwnership.js`: fichas de los once medios de más peso, cada
    afirmación con su enlace; `CONTROL_GROUPS`, que convierte al dueño en un
    identificador comparable en vez de prosa; y `gruposCompartidos()`, que dado
    el conjunto de medios que cubre un hecho devuelve los grupos que aportan más
    de uno.
  - `src/components/DuenoCompartido.jsx` y `.css` (nuevos): el aviso. Recuadro
    neutro, nunca rojo, y dice de forma explícita que no afirmamos coordinación.
  - `src/pages/NewsDetail.jsx`: el aviso en la página de la noticia.
  - `src/pages/Transparency.jsx`: deja de decir que las fichas están vacías.

- **Lo que apareció al ponerlo junto:** Semana y El País (Cali) son de Gilinski;
  El Espectador y Blu Radio, de Valorem; Noticias RCN y La FM, de Ardila Lülle.
  Y Caracol Radio (Prisa) y Noticias Caracol (Santo Domingo) **no** tienen
  ninguna relación de propiedad, pese al nombre.

- **Una afirmación se cayó al comprobarla:** la compra de El Heraldo por el Grupo
  Gilinski se anunció con memorando en junio de 2023 y se deshizo en agosto.
  Estaba a punto de escribirse como concentración consumada. La regla de citar
  evitó exactamente el fallo para el que se escribió.

- **Evidencias de Verificación:** 190 pruebas · `check:registry` sin errores de
  integridad · desplegado y comprobado en producción: el aviso sale en
  `doblefoco.fly.dev/noticia/19gtktu`, donde «2 medios cubren este hecho» y los
  dos son de Gilinski.

---

### [2026-07-29] Las 29 fichas de propiedad que faltaban

#### Motivo
Con once fichas, toda cifra de concentración era un piso y no una medida: el
aviso solo podía dispararse entre los once medios documentados. Los otros
veintinueve eran invisibles para el cálculo, así que la ausencia de aviso no
significaba nada.

- **Archivos modificados:**
  - `shared/mediaOwnership.js`: 28 fichas nuevas —39 de los 40 medios del
    catálogo— y 23 grupos de control nuevos. `sectores` poblado donde consta en
    las fuentes: Gilinski (banca, alimentos), Valorem (retail, logística,
    transporte, entretenimiento, industria, inmobiliario, turismo), Prisa
    (educación editorial).
  - `shared/mediaOwnership.test.js`: 6 pruebas nuevas. Una de las viejas se
    apoyaba en que Vanguardia, La Patria y La Opinión NO estuvieran
    documentadas; ahora lo están y el aserto se había vuelto vacío, así que se
    reescribió con lo que de verdad comprueba.
  - `src/pages/Transparency.jsx`: el conteo, y un límite nuevo declarado —lo que
    publicamos es quién *figura* como accionista; un testaferro o una sociedad en
    el exterior no aparecerían ahí—.

- **Lo que apareció al completarlo. Tres tríos, no tres parejas:**
  · Ardila Lülle controla **tres**: Noticias RCN, La FM y **La República**.
  · Prisa controla **tres**: Caracol Radio, W Radio y **El País (España)**.
  · Valorem controla **tres**: El Espectador, Blu Radio y **Noticias Caracol**.
  · Sarmiento Angulo controla **dos**: El Tiempo y **Portafolio** —un diario
    económico cuyo dueño es el mayor banquero del país—.
  Once medios que el lector ve como voces distintas son cinco dueños.

- **Segunda colisión de nombre del catálogo:** El País de Cali es de Gilinski y
  El País de España es de Prisa. Sin relación entre sí, y se dispararía justo en
  una noticia internacional. Tiene su propia prueba, como los dos Caracol.

- **Una afirmación se cayó al comprobarla, otra vez.** Una búsqueda devolvía que
  Galvis Ramírez era dueña de El Universal de Cartagena, lo que habría añadido
  una pareja. Al ir a las fuentes su participación es del **50 %**, junto a la
  familia Araujo: coposesión, no control. Como el aviso afirma «pertenecen a»,
  el dato quedó en la ficha —donde el lector lo ve con su matiz— y **fuera** del
  cálculo automático. Documentado en el archivo y con prueba propia.

- **Lo que sigue vacío:** `colombia-informa`, el único. Su razón social aparece
  en directorios de registro mercantil, pero no se localizó fuente consultable
  sobre quién la controla. Vacío y visible antes que verosímil. Lo que hace falta
  es el certificado del RUES o sus estatutos.

- **Medición contra la base real** (no contra el build):
```
Historias totales 3 644 · multifuente 298 · fichas documentadas 39 de 40
Con dueño compartido ANTES (11 fichas) ...... 14  (4,7 %)
Con dueño compartido AHORA (39 fichas) ...... 21  (7,0 %)   x1,5
Aportan aviso: Gilinski 13 · Sarmiento/Aval 6 · Valorem 3
Historias donde TODA la cobertura es de un solo dueño: 8
```
  Ardila Lülle y Prisa aportan 0 en esta ventana: los tríos existen en la
  propiedad, pero esos medios no coincidieron en un mismo hecho en las 72 h
  medidas. El aviso está listo para cuando ocurra.

- **Evidencias de Verificación** (servidor levantado contra la base real):
```
/noticia/1o92g6h  301 -> canónica · 200 · «2 medios, un solo dueño»
                  Portafolio y El Tiempo pertenecen a Sarmiento Angulo — Aval
/noticia/qkxl88   301 -> canónica · 200 · «2 medios, un solo dueño» (Valorem)
/noticia/17mqcbj  301 -> canónica · 200 · «9 medios, 7 dueños distintos»
                  dos grupos en una sola noticia, renderizados en servidor
204 pruebas · typecheck, lint y build limpios · check:registry sin errores
```

---

### [2026-07-30] Las imágenes de las noticias no eran de las noticias

#### Hallazgo
Jose pidió revisar las imágenes. Ninguna era real, y el código decía lo
contrario.

`imageEngineService.js` tenía un banco de 21 fotos de archivo de Unsplash y
elegía una con `hash(id + titular) % 21`. Su comentario afirmaba «genera una URL
de búsqueda contextual basada en las palabras clave del titular»: **no analizaba
ninguna palabra**. El ejemplo sacado de la propia base: «Condenan a Carlos
Caicedo a cerca de 10 años de cárcel por escándalo de corrupción» se ilustraba
con la foto que el archivo etiquetaba «Indicadores Económicos».

Tres agravantes:
1. La rama que «prioriza la imagen real del artículo» **nunca se ejecutaba**: no
   había columna de imagen en la base ni extracción en el motor, así que
   `article.image` no existía en ningún caso. Código muerto que hacía parecer que
   el sistema usaba fotos reales.
2. Estaba también en la página de detalle a tamaño grande, que es la que se
   renderiza en servidor y se indexa.
3. Cada tarjeta cargaba desde `images.unsplash.com`, más un `preconnect` en
   `index.html`. Es el mismo problema de privacidad que ya se había arreglado con
   los logos: cada petición a un tercero revela qué está leyendo esa persona.

Una imagen junto a un titular se lee como documental. Era la fabricación que la
Fase 0 eliminó del texto, sobreviviendo en el apartado visual.

#### Lo que se hizo
- `schema.sql`: `articles.image_url`, NULL cuando el feed no trae ninguna.
- `ingestDaemon.js`: `extractImage()` lee `media:content`, `media:thumbnail` y
  `enclosure`. Exige **https** y que el host sea del medio.
- `mediaRegistry.js`: campo `imageHosts` por medio. Hizo falta al medirlo — de
  los 12 feeds con imagen, 9 la sirven desde su dominio y 3 desde la
  infraestructura de su gestor de contenidos (Semana y El País de Cali desde la
  CDN de Arc Publishing, BBC Mundo desde ichef.bbci.co.uk). Se declaran **uno a
  uno, sin comodines**: `*.arc-cdn.net` admitiría cientos de medios ajenos al
  catálogo, y si un medio cambia de CDN sus fotos dejan de salir en vez de
  abrirse un agujero.
- `feedStore.js`: la imagen es la del medio que pone el titular, o del primero
  que la tenga, y viaja con el nombre del medio para acreditarla.
- `StoryImage.jsx` (nuevo): la imagen o nada. Si falla al cargar, tampoco se
  sustituye. `referrerPolicy="no-referrer"`.
- `story.js`: `image` en el normalizador. **Fallo silencioso encontrado al
  verificar:** el normalizador construye un objeto nuevo, así que el campo
  llegaba en la respuesta y se perdía ahí sin ningún error.
- Retirados el banco de fotos, el `preconnect` y la etiqueta «Imagen
  ilustrativa» de la página de detalle, que era el reconocimiento de que la foto
  no era del hecho.

#### El fallo que `curl` no podía detectar
El `img-src` de **vercel.json** permitía `https://images.unsplash.com` y nada
más. Es decir: el motor guardaba la foto de El Tiempo, el servidor la servía en
el HTML y **el navegador del lector la bloqueaba**. Nada fallaba en el servidor,
nada aparecía en los registros y una petición con `curl` —que no aplica CSP—
pasaba la verificación sin enterarse.

`img-src` se regeneró desde el registro y `src/services/csp.test.js` (nuevo)
falla si un medio con feed no está cubierto. La prueba **ya sirvió**: al
reactivar W Radio y RTVC saltó sola porque sus dominios no estaban.

También se marcó `securityService.js` como NO APLICADO. No se importa desde
ningún sitio: un archivo llamado «security» que no protege nada hace pensar que
el asunto está resuelto, y estuve a punto de editar su CSP creyendo que regía.

- **Evidencias de Verificación** (contra la base y los feeds reales):
```
extractImage sobre feeds en vivo: el-heraldo 20/20 · semana 20/20
                                 el-pais-cali 20/20 · bbc-mundo 20/20
/noticia/1wsy1te → imagen real de imagenes2.eltiempo.com
                   crédito «Foto: El Tiempo» · no-referrer · 0 unsplash
237 pruebas · typecheck, lint y build limpios · check:registry sin errores
```

---

### [2026-07-30] W Radio y RTVC Noticias vuelven al catálogo

#### Motivo
Decisión de Jose: **no se silencia a ningún medio.** Los dos llevaban dos días
retirados por una decisión tomada en otra sesión que quedó escrita como si fuera
criterio del proyecto, y él no la había pedido.

#### Cómo, sin volver a meter la basura que motivó el retiro
- Los dos entran por Google News con búsqueda `site:`, la misma vía que Caracol
  Radio. RTVC ya devuelve titulares reales por ahí y no las páginas de etiqueta
  («Gustavo Petro», «principal») que motivaron el retiro. Su `rss.xml` propio
  sigue inservible: lo más reciente es del 30 de mayo y de ahí salta a junio de
  **2024**, con una entrada titulada «sitio en mantenimiento».
- W Radio sigue sin RSS propio: se reprobaron `/feed/`, `/rss/`, `/rss.xml`,
  `/feeds/rss/` y `/feed/rss/` y los cinco dan 404. Se busca por `site:` y NO por
  nombre: buscar «W Radio» trae piezas de otros medios que la mencionan, que es
  la misatribución que costó F1-07.
- **Regla `no-es-articulo`** en `contentQuality.js`. Su feed entregó «Noticias y
  Radio Online» fechada el día anterior, que sobrevivía a la ventana de 72 h y
  llegó a la base como noticia de W Radio. Los patrones están anclados al titular
  COMPLETO (`^...$`) para no repetir el error de F1-14, donde un patrón de
  lotería descartó «obras de rehabilitación del CDI El Dorado».
- `cleanHeadline` aprendió a quitar el sufijo « - dominio» que Google añade en
  las búsquedas `site:`. No era solo de W Radio: afectaba a 6 artículos de 4
  medios, y cada uno era un titular que no era literal.

#### Qué aportan, dicho sin adornos
**Cero artículos visibles.** Los dos responden y sus feeds se leen; lo que traen
queda fuera de la ventana de 72 h. Es un hecho sobre su ritmo de publicación, no
una avería nuestra, y es lo que F1-12 describe. Importa que estén: RTVC es el
único medio público del catálogo.

El reparto pasa a 1 izquierda · 5 centro-izq. · 14 centro · 13 centro-der. · 0
derecha. Con eso F1-06 se cumple **en el recuento**, que es justo lo que F1-12
advierte que no significa nada: esos 6 medios suman el 0,9 % de los artículos.

- **Evidencias de Verificación:**
```
36 feeds responden (antes 34) · w-radio 0 art. · rtvc 0 art.
«Noticias y Radio Online» descartada por la regla nueva (filtrados 21 → 24)
0 titulares con sufijo de dominio entre los ingeridos tras el cambio
237 pruebas · check:registry sin errores de integridad
```

> **Queda uno silenciado:** Las2Orillas, que responde 403 a nuestro User-Agent.
> Por la misma decisión, habría que reactivarlo — pero ahí el 403 es del servidor
> del medio, así que hay que probar la vía de Google News o acordar acceso.
