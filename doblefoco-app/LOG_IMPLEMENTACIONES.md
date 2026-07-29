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
