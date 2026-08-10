# Por dónde seguir

Nota de traspaso del **2026-08-09**, escrita al cerrar. Rama
`filtro-mapa-departamentos`, empujada, árbol limpio, todo en verde.

---

## Lo que quedó funcionando

| | |
|---|---|
| **Filtro «Mapa»** en la portada | Coropleto de los 33 departamentos + lista. `?depto=` en la URL |
| **Subcategorías** en `/mapa-medios` | Nacionales 14 · Independientes 11 · Regionales 20. Los regionales, apagados por omisión |
| **Catálogo** | 59 medios · **18 de 33 departamentos** con medio propio (eran 8) |
| **24 fichas** en `fichas/` | **Ninguna firmada.** Diez medios dados de alta con `reviewedAt: null` |
| **Dos herramientas nuevas** | `npm run medios:cosechar` y `npm run feed:descubrir` |

Los tres informes: `MEDIOS_CANDIDATOS_DEPARTAMENTOS.md`, `BARRIDO_NACIONAL.md` y
este.

---

## Lo primero al volver, por rendimiento

1. **El preview de Vercel**, si no se miró. La rama está empujada.
2. **Escribir a El Meridiano** (`elmeridiano.co`). Cubre Córdoba **y** Sucre: un
   solo obstáculo técnico —Next.js sin feed, 403 a los bots— deja dos
   departamentos sin voz. Es lo que más desbloquea por menos trabajo.
3. **La afiliación de Ecos del Combeima a Blu Radio.** Decide si el Tolima tiene
   voz propia o una afiliada de Valorem. Está en `fichas/ecos-del-combeima.md`
   como alta condicionada.
4. **Ocho certificados de Cámara de Comercio** — Neiva, Tunja, Santa Marta,
   Villavicencio (con NIT en mano), Pereira, Arauca, San Andrés, Montería.
   Desbloquean fichas ya escritas y a la espera. No se pueden tramitar desde
   aquí.
5. **La FLIP.** «Cartografías de la Información» mapea 141 municipios y visitó
   justo nuestros huecos. Su web dio 502 y luego 404 el 2026-08-09: está rota,
   no bloqueándonos. Es la mejor fuente pendiente.

---

## Decisiones tomadas hoy que conviene no volver a discutir

**`factuality: null` es válido y significa «no medida».** Antes era obligatoria,
y esa obligación forzaba a inventar un historial de rigor para dar de alta a
cualquiera — lo mismo que la Fase 0 quitó del motor. La tabla dice «sin medir» y
el gráfico no coloca esos puntos.

**Los medios con redacción de IA se admiten, marcados.** Entró Boyacá Digital,
el primero. Campo `redaccion: 'automatizada'` y distintivo propio. La marca no es
decorativa: el sitio se apoya en «cuántos medios distintos cubren este hecho», y
una redacción que reescribe lo que ya publicaron otros suma sin aportar una voz.

**Los bloqueos de robots se respetan.** `prensaescrita.com` devuelve 403 a
nuestro bot y 200 a un navegador. No se cambia el User-Agent: contradiría lo que
el motor declara de sí mismo y sería incoherente con lo que hacemos cuando nos
bloquea un medio, que es escribirle.

**El mapa lleva contorno, no hueco.** Un coropleto no es un gráfico de barras: la
silueta es el dato. Pintar el borde del color de la superficie hacía el mapa
invisible en tema claro.

---

## Lo que no se arregla buscando más

**Amazonas, Guainía y Vaupés no tienen medios web.** Tres búsquedas con ángulos
distintos —municipales, radio comunitaria, comunicación indígena— y ni uno. Allí
la comunicación existe y es radio: RTVC abrió estudios en Leticia dirigidos por
una comunicadora murui, y el MinTIC abrió en agosto concesiones de radiodifusión
comunitaria indígena.

Un agregador de RSS no alcanza eso. **No es un fallo del catálogo, es un límite
del formato**, y decirlo en la vista departamental es más honesto que dejar tres
departamentos en blanco como si allí no pasara nada.

---

## La idea que quedó apuntada y no se ha empezado

En un medio de redacción automatizada **la orientación debería ser más medible,
no menos**. En una redacción humana el sesgo se reparte entre personas y días; en
una configurada es una propiedad del sistema y su salida es sistemática. Con
corpus suficiente, su deriva debería calcularse más directamente que la de un
medio humano, y **una alteración de su configuración debería verse como un salto
y no como ruido**.

Boyacá Digital es el primer caso de prueba. Está escrito en
`shared/mediaRegistry.js`, junto al campo, que es donde se buscará.

---

## Lo que sigue sin resolver del mapa

Los conteos del mapa son de **las historias cargadas, no del catálogo**: el
departamento se detecta en el navegador porque no está en la base. Persistirlo
—columna `articles.departamento` y llamada a `detectarDepartamento` en la
ingesta— es trabajo de la API, **y la API se despliega en Fly, no en Vercel**.
Empujar a `main` publica el mapa, no el endpoint.
