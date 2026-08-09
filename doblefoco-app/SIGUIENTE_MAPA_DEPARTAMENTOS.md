# Siguiente: mapa interactivo por departamento

Nota de traspaso escrita el **2026-08-09** al cerrar la sesión. Lo que sigue
arranca desde aquí sin tener que reconstruir el contexto.

---

## Lo que Jose pidió, literal

Un mapa interactivo en la zona de filtros que **separe por colores los
departamentos con su nombre**, y que al seleccionar el suyo el filtro saque las
noticias de ese departamento.

---

## Lo que YA está hecho y funciona

| Pieza | Dónde | Estado |
|---|---|---|
| Detector geográfico | `shared/geografia.js` | 10 pruebas. **27,3 % de los titulares** reciben departamento (743 de 2 718) |
| Lista de los 33 | `DEPARTAMENTOS` en ese módulo | ordenada, lista para pintar |
| Campo del medio | `departamento` en `mediaRegistry.js` | relleno en los 10 regionales, cubre 8 |
| Separación de opinión | `shared/opinion.js` | la opinión ya no entra al agrupamiento |

**No hace falta tocar la ingesta para el mapa**: el detector es una función pura
sobre el titular y puede llamarse al vuelo desde el servidor o el cliente.

---

## Lo que falta, por orden

1. **Persistir la etiqueta.** Hoy se detecta al vuelo. Para filtrar en la base
   hace falta una columna `articles.departamento` y llamar a `detectarDepartamento`
   en la ingesta, junto a donde ya se llama a `detectarOpinion`.
2. **Endpoint de conteos por departamento**, para colorear el mapa por volumen.
3. **El SVG.** Es la decisión de más peso, ver abajo.
4. **El filtro**, enlazado al mapa y también como lista —el mapa solo no basta,
   ver accesibilidad—.

---

## Decisiones que conviene tomar ANTES de escribir código

### El SVG de Colombia: de dónde sale

Hace falta un mapa de los 32 departamentos + Bogotá con sus códigos DANE. **No
inventarlo ni copiarlo de cualquier sitio**: tiene que poder citarse la fuente,
como todo lo demás en este proyecto. Candidatos con licencia abierta: los
límites del DANE, o los de Natural Earth.

Peso: un SVG de Colombia detallado puede pesar cientos de kB. Conviene
simplificar la geometría antes de meterlo al paquete.

### El mapa NO puede ser el único camino

Un mapa clicable es inaccesible con teclado y con lector de pantalla si no lleva
al lado **la misma lista en texto**. La regla que ya sigue el sitio: en
`MediaMap` toda la información existe también como tabla, y no como concesión
sino porque es la forma correcta de leer valores exactos.

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

Deben pintarse distinguibles de «cero por poco» y de «no hay datos», y ser
seleccionables igualmente: quien vive en Vaupés tiene derecho a ver que no
tenemos nada suyo, en vez de que el departamento no exista en el filtro.

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
