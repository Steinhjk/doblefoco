# Mapa interactivo por departamento

Nota abierta el **2026-08-09** al cerrar una sesión y **actualizada el mismo día
al construirlo**. La primera mitad ya no es un plan: es lo que hay.

---

## Lo que Jose pidió, literal

Un mapa interactivo en la zona de filtros que **separe por colores los
departamentos con su nombre**, y que al seleccionar el suyo el filtro saque las
noticias de ese departamento. Añadido al pedirlo: **que no sea tan grande,
directo y profesional**.

---

## Lo que YA está hecho y funciona

| Pieza | Dónde | Estado |
|---|---|---|
| Detector geográfico | `shared/geografia.js` | **27,3 % de los titulares** reciben departamento |
| Slugs de URL | `slugDepartamento` en ese módulo | `?depto=norte-de-santander`; los 33 distintos, ida y vuelta probada |
| Geometría | `src/data/mapaColombia.js` | Natural Earth, 32 continentales + San Andrés en recuadro, 40 kB |
| Generador | `scripts/generarMapaColombia.mjs` | `npm run mapa:generar`; descarga, simplifica y reescribe |
| Reparto y escala | `src/lib/geografiaDelFeed.js` | conteos, escala de raíz, exclusión de lo internacional |
| El mapa | `src/components/MapaDepartamentos.jsx` | coropleto + lista de los 33; se carga al abrirlo |
| El filtro | `depto` en `useFiltrosDeFeed` | vive en la URL como los demás, validado contra la lista |

**No hizo falta tocar la ingesta**: el detector es una función pura sobre el
titular y se llama en el navegador sobre lo descargado.

---

## Lo que falta

1. **Persistir la etiqueta.** Sigue detectándose al vuelo, así que **los conteos
   del mapa son de las historias cargadas, no del catálogo** — sobre 100
   historias salen 28 etiquetadas y 25 departamentos a cero. La vista lo declara
   en su nota, que es lo honesto, pero no es lo bueno. Hace falta una columna
   `articles.departamento` y llamar a `detectarDepartamento` en la ingesta,
   junto a donde ya se llama a `detectarOpinion`.
2. **Endpoint de conteos por departamento**, una vez exista la columna. Es lo
   que convierte las cifras del mapa en cifras del catálogo, igual que pasó con
   las pestañas de ámbito.
3. **Subir la cobertura del detector.** 27,3 % es el techo de mirar solo el
   titular. El extracto no sirve —arrastra pies de foto—, pero los titulares de
   los otros medios del mismo grupo sí, si se resuelve el desempate.

Ojo con el orden: 1 y 2 son de la API, y **la API se despliega en Fly, no en
Vercel**. Empujar a `main` publica el mapa pero no el endpoint.

---

## Decisiones ya tomadas, con su motivo

### El SVG salió de Natural Earth

`ne_10m_admin_1_states_provinces`, dominio público y por tanto citable, que era
la condición. Trae los 33 con código ISO 3166-2. **No son los límites oficiales
del DANE**: para pintar cuántas noticias hablan de cada sitio bastan; para
cualquier afirmación sobre territorio, no.

Se simplifica con Douglas-Peucker a 0,012° antes de entrar al paquete: 40 kB,
15,8 kB comprimidos. Aun así **es más de la mitad del JavaScript de la portada**,
así que el componente se carga con `lazy()` y solo lo paga quien abre el mapa.

Bogotá y Cundinamarca comparten el código `CO-CUN` en Natural Earth; se separan
por el campo `name`. El generador se cae si no encuentra 32 piezas
continentales, para que un renombrado no borre un departamento en silencio.

### El mapa NO es el único camino

Lo cumple, y no como se esperaba. El SVG lleva `aria-hidden` y **los controles
de verdad son los 33 `<button>` de la lista de al lado**: treinta y tres
trazados con `tabIndex` meterían treinta y tres paradas en el tabulador para
llegar a un control que ya existe. Con el ratón el mapa sí se pulsa.

La lista va **alfabética y no por volumen**: sirve para encontrar el
departamento de uno, y ordenada por cifra habría que barrer 33 nombres para dar
con «Nariño». El volumen ya lo dice el color, y la cifra exacta está en la fila.

### Ni rojo ni azul

En este sitio el rojo es la izquierda y el azul la derecha. Un coropleto rojo
diría que Antioquia es de izquierdas: una afirmación política escrita sin
querer. La rampa es **monocroma**, sacada del gris pizarra de la paleta, y está
comprobada con el validador del sistema de diseño contra las dos superficies
reales (luminosidad monótona, salto mínimo de 0,06, el escalón más flojo por
encima de 2:1 contra su fondo).

La escala es de **raíz cuadrada y anclada en 1**. Lineal, Valle del Cauca se
llevaba el tono fuerte y los otros 32 quedaban indistinguibles. Anclada en cero,
con el máximo real de una tanda —12, no 219— una sola historia caía ya en el
segundo tono y el primero no lo alcanzaba nadie.

### Lo internacional no se etiqueta

«Santander» es departamento colombiano, banco y ciudad de España, y a diferencia
de «Bolívar» o «Córdoba» **no estaba en la lista de ambiguos**. Sin cortar por
`ambito`, un titular de El País de Madrid mandaba noticias a Bucaramanga. En la
pestaña Internacional el mapa ni se ofrece: saldría entero a cero y parecería
una avería en vez de una decisión.

### El color tiene que decir algo, y hay que decir qué

Colorear por volumen de noticias es lo obvio, pero **hay un sesgo que declarar en
la propia vista**:

```
219  Valle del Cauca   ← El País de Cali aporta 248 artículos y nombra Cali sin parar
 78  Atlántico
 71  Antioquia
 64  Bogotá D.C.
```

**El mapa muestra tanto dónde ocurren las noticias como dónde están nuestros
medios.** Amazonas, Vaupés, Guainía y Vichada salen en cero, y eso es una
afirmación sobre nuestro catálogo, no sobre esos territorios. Sin esa nota, un
departamento gris se lee como «allí no pasa nada».

Es el mismo problema que ya se resolvió en el aviso de desequilibrio del
espectro: la cifra se calcula en vivo y el texto explica qué significa el hueco.

### Departamentos sin noticias

Se pintan con **rayado y no con un gris más flojo**: en modo de contraste
forzado los rellenos se aplanan y «cero» volvería a confundirse con «poco», que
es justo la distinción que importa. Y son **seleccionables igual** — quien vive
en Vaupés tiene derecho a ver que no tenemos nada suyo, en vez de que su
departamento no exista en el filtro.

El rayado lleva además **un fondo tenue dentro del propio patrón**, y eso solo
se descubrió mirando el mapa pintado: con 25 de 33 departamentos a cero, a rayas
sueltas el patrón es continuo de una pieza a la siguiente y **Vichada y Guainía
se leían como una sola mancha**. El fondo devuelve el borde.

---

## Lo que sigue pendiente de la sesión, aparte del mapa

- **Formadores de opinión** — nombre ya fijado. Falta el criterio de entrada
  (umbral de audiencia + actividad) y el registro de canales. La máquina de
  comprobación ya existe: `scripts/comprobarCanales.mjs`.
- **URLs de canales** que Jose iba a pasar: Coronell, María Jimena Duzán,
  Yolanda Ruiz, Jerome. **No adivinar handles**: de seis intentos fallaron tres,
  y `@danielcoronell` resolvió a un canal EN SU CONTRA.
- **Índice de columnistas** — la opinión ya se separa y el nombre se extrae de la
  URL en los medios que lo publican. Falta persistirlo y calcular por medio el
  centro de gravedad (orientación) y la dispersión (pluralismo).
- **Revisión externa** — `revision-externa/` está lista con el prompt adversarial.
  Pendiente pasarla por los otros modelos.
- **Medios institucionales de otras regiones**: Telepacífico y Teleantioquia no
  publican feed en rutas convencionales. Quedan por buscar por la vía del
  `<link rel="alternate">` del HTML, que es la que funcionó con Cambio.
