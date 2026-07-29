# Imagen de la API y el motor de DobleFoco.
#
# Desde F3-01 incluye también el renderizado en servidor de las noticias, así
# que la imagen contiene el bundle de servidor (dist-server/) y la plantilla
# (dist/index.html). El bundle del NAVEGADOR lo sigue sirviendo Vercel: aquí
# dist/ existe solo como plantilla y como respaldo.

FROM node:22-alpine AS deps
WORKDIR /app

# Se copian solo los manifiestos primero para que la capa de dependencias se
# reutilice mientras no cambien, aunque cambie el código.
COPY package.json package-lock.json ./

# `npm ci` respeta el lock exactamente; `npm install` podría resolver versiones
# distintas a las probadas. --omit=dev deja fuera vite, eslint y vitest.
RUN npm ci --omit=dev && npm cache clean --force

# -----------------------------------------------------------------------------
# Compilación DENTRO de la imagen, y no copiando dist/ desde fuera.
#
# La versión anterior hacía `COPY dist ./dist`, lo que metía en producción lo
# que hubiera compilado en la máquina de quien desplegaba: de otra rama, o de
# hace semanas, sin que nada lo delatara. Compilando aquí, la imagen es función
# únicamente del código del repositorio.
# -----------------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# Sin --omit=dev: aquí SÍ hacen falta vite y el plugin de React.
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

# Node emite avisos y elige rutas de código según esto.
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY server ./server
COPY shared ./shared
COPY scripts ./scripts
COPY certs ./certs

# Producto de la etapa de compilación, nunca del contexto de construcción.
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server

# Verificación del certificado del servidor de base de datos. La ruta es la del
# contenedor, no la del repositorio.
ENV DATABASE_CA_CERT=/app/certs/supabase-prod-ca-2021.crt

# La imagen de Node trae un usuario `node` sin privilegios. Correr como root
# dentro del contenedor no aporta nada y amplía lo que puede hacer un fallo.
USER node

EXPOSE 5000

# Orden por defecto: la API. El motor se lanza con su propia orden desde el
# grupo de procesos de fly.toml, sobre esta misma imagen.
#
# Sin capa de npm por medio: así las señales de parada llegan directas a Node y
# el proceso puede cerrar el pool de conexiones antes de morir. Con `npm start`,
# npm se come la señal y Fly acaba matando el proceso a los pocos segundos,
# dejando transacciones abiertas con bloqueos sobre `stories`.
CMD ["node", "server/index.js"]
