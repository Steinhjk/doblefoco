# Las2Orillas — ficha de orientación

| | |
|---|---|
| **Valor actual** | **−0,35** · `reviewedAt: null` |
| **Propuesta** | **NO FIRMAR todavía.** Su nivel 2 está contaminado por un defecto nuestro, y hasta medirlo aparte el número no se sostiene |
| **Firma** | ☐ pendiente — Jose Arbeláez |
| **Fecha** | 2026-09-08 |
| **Protocolo** | `PROTOCOLO_JUICIO_EDITORIAL.md` |
| **Nivel 2** | `npm run expediente -- --medio=las2orillas`, medido el 2026-09-08 |
| **Corrección** | El conteo de artículos de este expediente salió inflado un 1,6 %: `expedienteDeMedio.mjs` contaba una fila por historia. Corregido el 2026-09-09; al firmar hay que volver a correrlo |

---

## EVIDENCIA ADMISIBLE

### Nivel 1 — Propiedad, vigente y declarada, con una laguna declarada

**Fundación Las Dos Orillas**, NIT 900.615.503-8, sin ánimo de lucro, Bogotá.
Fundado en 2013. **No tiene dueño único ni grupo empresarial detrás**: es una
fundación con trece fundadores y asociados declarados, entre ellos María Elvira
Bonilla (fundadora y directora), Elisa Pastrana, Adriana Arcila, León Valencia,
Jorge Enrique Botero y Rafael Santos.

- [Las2Orillas — Quiénes somos](https://www.las2orillas.co/quienes-somos/)

**Dos nombres piden contexto, y se anotan como desvelamiento y no como
acusación:** León Valencia dirige la Fundación Paz y Reconciliación (Pares), que
opina habitualmente sobre los mismos asuntos que el medio cubre; Rafael Santos
fue directivo de EL TIEMPO y pertenece a la familia Santos, presente en varios
medios de este catálogo.

> **LA FINANCIACIÓN NO ESTÁ DOCUMENTADA.** Su «Quiénes somos» declara la figura
> jurídica y el NIT, pero no de dónde salen los ingresos. Es un hueco de nivel 1
> y se deja constar, como en CasaMacondo.

### Nivel 2 — Conducta medida en nuestro corpus (30 días)

| | |
|---|---|
| Artículos | 174 |
| Historias en las que entra | 55 |
| Historias compartidas con otro medio | 11 |
| Cadencia | una pieza cada 1,3 h |
| Última pieza | 2026-09-08 |

**Coincide con menos de la mitad de medios que sus pares de volumen:**

| Socios | Historias | Medio |
|---:|---:|---|
| **13** | 55 | **Las2Orillas** |
| 30 | 51 | Quindío Noticias |
| 34 | 51 | Telemedellín |

**En qué se aparta de la agenda común:**

| Tema | Suyo | Corpus | Se aparta |
|---|---:|---:|---:|
| Medio Ambiente | 4,1 % | 1,8 % | 2,3× |
| Cultura | 8,2 % | 4,3 % | 1,9× |
| Política | 31,1 % | 19,2 % | 1,6× |
| Educación | 4,9 % | 3,0 % | 1,6× |
| Economía | 7,4 % | 11,5 % | 0,6× |

Con quién coincide, cuando coincide: La República (+0,15), Pulzo (0,00), Canal
Capital (0,00), El Diario de Pereira (+0,20). **Ningún patrón de bloque**: son
pocos hechos y repartidos.

---

## ARGUMENTO — por qué −0,35 y no 0,00

El valor de hoy se propuso «por comparación con CasaMacondo (−0,35) y por debajo
de la investigación militante (Vorágine, Cuestión Pública)», y esa justificación
**no es evidencia de nivel 1-3**: es una colocación relativa dentro de nuestra
propia escala.

Lo que sí sostiene el nivel 2 medido hoy es que **tiene agenda propia**: cubre
medio ambiente al doble y economía a la mitad que el corpus, y coincide con la
mitad de medios que sus pares de volumen. Un medio con agenda propia y una
selección sostenida es clasificable; uno que solo replica la agenda común, no.

**Pero eso dice que se aparta, no hacia dónde**, y ese es exactamente el paso
que esta ficha no puede dar hoy.

---

## CONTRA — el mejor caso encontrado en contra, y es un defecto NUESTRO

**Su nivel 2 no mide lo mismo que el de los demás medios del catálogo.**

`detectarOpinion` es una función pura de la URL —tres expresiones sobre la ruta—
y las URL de Las2Orillas son planas: `las2orillas.co/titulo-de-la-pieza`, sin
`/opinion/` ni `/columnistas/`. **Así que sus columnas entran al
agrupamiento sin marcar, mientras que las de El Espectador o Vanguardia se
quedan fuera.** El registro ya lo anotaba para este medio; lo que no estaba
medido es el tamaño:

| Medio | Piezas | Opinión detectada | En historias |
|---|---:|---:|---:|
| El Espectador | 1 342 | 177 | **0** de las 177 |
| Vanguardia | 751 | 69 | **0** de las 69 |
| **Las2Orillas** | 177 | **0** | 59 |

De las 631 piezas de opinión que el filtro ha marcado en todo el corpus,
**ninguna es suya**. No es que no publique columnas —es «un portal de análisis y
columna» por su propia descripción—: es que no se las puede ver.

> **Medido el 2026-09-08: 22 de los 70 medios con datos publican en la raíz —
> 2 179 piezas, el 6,3 % del corpus— y SEIS de ellos son de la banda de
> izquierda:** Las2Orillas, Razón Pública, Semanario VOZ, Volcánicas, Colombia
> Informa y Cuestión Pública. Ver la entrada del 2026-09-08 en `MINUTA.md`.

Las tres consecuencias, en orden de gravedad:

1. **El aislamiento puede ser un artefacto.** Una columna no coincide con la
   cobertura de nadie porque no cubre un hecho: opina sobre él. Si buena parte de
   esas 174 piezas son columnas —y su propia descripción dice que es un portal de
   análisis y columna—, sus 13 socios frente a los 30 de Quindío Noticias miden
   nuestro filtro, no su agenda.
2. **El reparto por temas también.** Medio ambiente al 2,3× puede ser lo que
   cubre o lo que opina, y aquí no se distinguen.
3. **Y la asimetría cae del lado que peor documentado está**, que es el que
   sostiene la tasa del modelo de puntos ciegos.

**Segundo contra, menor pero real:** es una plataforma que «le da la palabra a la
ciudadanía para que publique sus historias». Lo que se mide entonces puede ser la
mezcla de quien le escribe, no una línea de la casa. La casa elige qué publica
—eso sigue siendo línea— pero el argumento es más débil que en un medio con
redacción propia.

---

## REFUTACIÓN — qué observación concreta cambiaría el número

- **Si se separa su opinión de su reportería** —marcándola por otra vía que la
  URL— y su aislamiento se mantiene con solo la reportería: el argumento del
  nivel 2 queda limpio y el número se puede firmar.
- **Si al separarla su co-cobertura sube a la altura de sus pares** (unos 30
  socios con 55 historias): el aislamiento era nuestro filtro y esta ficha se
  cae entera.
- **Si documenta su financiación**: se cierra el hueco de nivel 1 y puede
  aparecer evidencia que hoy no tenemos en ninguna dirección.

---

## LO QUE HAY QUE HACER ANTES DE FIRMAR ESTA FICHA

Medir su opinión sin depender de la URL, al menos para los 22 medios de raíz
plana. Hasta entonces, **el valor se queda en −0,35 con `reviewedAt: null`**, que
es lo que ya dice: un juicio argumentado y sin firmar.

---

## REVISIÓN EXTERNA

☐ Pendiente. Va al circuito con la instrucción de **argumentar EN CONTRA**, y con
una pregunta concreta: si el filtro de opinión ciego para 22 medios invalida el
nivel 2 de todos ellos o solo el de los que publican mucha columna.
