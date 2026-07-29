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
