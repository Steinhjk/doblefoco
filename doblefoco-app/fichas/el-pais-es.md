# El País (España) — ficha de orientación

| | |
|---|---|
| **Valor actual** | **−0,20** · `reviewedAt: null` |
| **Propuesta** | **NO FIRMAR, y es el mejor caso del catálogo para decidir antes la pregunta de los internacionales.** Su −0,20 es una posición en el eje **español**, y es el único medio extranjero con corpus colombiano propio suficiente para medirlo en el eje de aquí |
| **Firma** | ☐ pendiente — Jose Arbeláez |
| **Fecha** | 2026-08-18 (alta de la ficha) |
| **Protocolo** | `PROTOCOLO_JUICIO_EDITORIAL.md` |
| **Audiencia** | **No medida en Colombia.** No está en el tramo prioritario de `shared/audiencia.js`, que es de medios colombianos |

> **Ojo con el nombre: son dos medios distintos y los dos están en el catálogo.**
> Este es el diario español del Grupo Prisa. **El País (Cali)** es colombiano y
> desde junio de 2025 pertenece a un grupo encabezado por el empresario dominicano
> Eduardo Hernández Incháustegui. Mismo nombre, ninguna relación. Es la segunda
> colisión de nombre del catálogo, después de los dos Caracol.

---

## EVIDENCIA ADMISIBLE

### Nivel 1 — Propiedad, corregida el 2026-08-18

Lo edita el **Grupo Prisa**, sociedad cotizada española. Su primer accionista es
**Amber Capital**, el vehículo de **Joseph Oughourlian**, que **preside el grupo
desde febrero de 2021** y ronda el **29,8 % del capital** — a las puertas del 30 %,
el umbral que obligaría a lanzar una OPA por el 100 %.

Detrás vienen **Vivendi (11,8 %)**, del grupo Bolloré; la familia **Polanco** a
través de Rucandio (7,6 %); **Global Alconaba** (7,1 %); y la empresa familiar de
**Carlos Slim**, Control Empresarial de Capitales (7,0 %).

El mismo grupo controla **Caracol Radio** en Colombia, que aparece igualmente en
este catálogo. Fuera de la prensa, Prisa es dueña de la editorial educativa
Santillana.

> **Tres correcciones al entrar esta ficha**, y las tres son del mismo tipo que el
> ciclo 1 encontró quince veces:
>
> 1. La ficha de propiedad decía que Oughourlian mantiene su participación **«desde
>    hace más de quince años»**. Amber ha ido **construyendo** la posición y sigue
>    comprando: lo verificable es que preside desde febrero de 2021 y que hoy está
>    cerca del 30 %.
> 2. Decía que el grupo controla **«Caracol Radio y W Radio… tres medios, un
>    dueño»**. W Radio se fusionó con Caracol Radio el **13-01-2026**: son dos.
> 3. Decía que El País de Cali **«es del Grupo Gilinski»**. Dejó de serlo en
>    **junio de 2025**. Era el último sitio del repositorio donde sobrevivía ese
>    dato, después de haberlo corregido en las tres fichas del tramo.

**Hecho de gobernanza vigente, y se declara:** hay un pulso abierto en el
accionariado. Accionistas próximos al Gobierno español han buscado aumentar su
posición para contrarrestar a Oughourlian, y en 2025 llegaron a demandarlo. No se
usa como argumento de orientación —la regla 5.1 lo prohíbe— pero es exactamente lo
que la ficha de propiedad existe para revelar: **la línea de este diario es materia
de disputa societaria abierta**.

- [Prisa — accionistas significativos](https://prisa.labolsavirtual.com/accionistas-prisa.html)
- [Red de Periodistas — cómo queda el accionariado del Grupo Prisa](https://www.reddeperiodistas.com/asi-queda-el-accionariado-del-grupo-prisa-no-solo-joseph-oughourlian/)
- [Bolsamanía — Amber alcanza el 29,84 % del capital](https://www.bolsamania.com/noticias/insiders/amber-capital-compra-300000-acciones-prisa-alcanza-2984-capital--7231734.html)
- [The Objective — accionistas afines a Moncloa frente a Oughourlian](https://theobjective.com/medios/2025-01-29/accionistas-moncloa-prisa-arrinconar-oughourlian/)

### Nivel 2 — Conducta medida, ventana del 2026-08-16 al 2026-08-18

```
artículos ............................ 141
historias ............................ 139  ·  multifuente 21
agenda propia ........................ 85 %
compañía media ....................... +0,104  sobre 54 apariciones
coincide más con ..................... El Espectador 4 · El Heraldo 4 · Euronews 4
```

**Y aquí está lo que hace especial a esta ficha: 47 de esos 141 artículos son de la
edición Colombia**, con redacción propia en Bogotá, y entran al corpus como
**colombianos** y no como internacionales.

| Día | Portada España (Internacional) | **Edición Colombia (Política)** |
|---|---|---|
| 16-08-2026 | 26 | **15** |
| 17-08-2026 | 35 | **15** |
| 18-08-2026 | 33 | **17** |

Titulares de la edición Colombia en la ventana: «Rescatistas recuperan los últimos
cinco cuerpos bajo los escombros del Hospital…», «De la Espriella envía a su
ministro de Comercio a Estados Unidos…», «El PIB del segundo trimestre en Colombia
acelera al 3,5 %». **Es cobertura política colombiana corriente, no despachos de
agencia sobre España.**

> **Esa separación no era gratis y conviene saber por qué está.** El clasificador
> de ámbito desempata por país cuando el titular no trae marca geográfica: sin
> marca y medio extranjero, la pieza se va a Internacional. Medido antes de
> arreglarlo, **8 de 19 piezas de la edición Colombia acababan en Internacional**
> —el incendio de Andrés Carne de Res, los afectados del terremoto—. El feed
> secundario declara `country: 'CO'` y eso lo corrige. Hay prueba que lo protege en
> `shared/mediaRegistry.test.js`.

---

## ARGUMENTO

**La justificación actual —«diario español de referencia con línea editorial
socialdemócrata»— es probablemente correcta y está en el eje equivocado.**

«Socialdemócrata» ubica a este medio en el sistema político **español**. Este
catálogo clasifica en el eje político **colombiano**: así está calibrado, con el
Semanario VOZ en el extremo izquierdo y El Nuevo Siglo en +0,55. **Nadie ha
justificado nunca la traslación de un eje al otro**, y esta ficha no la va a
inventar.

Es la **pregunta transversal 4** del ciclo 1, y sigue abierta: hay **trece medios
internacionales** en el catálogo con valores entre −0,25 y +0,30, todos puestos con
el mismo tipo de frase sobre su propio país.

### Por qué este medio es el que puede cerrar esa pregunta

Cuando la ficha de CNN en Español planteó lo mismo, apareció una objeción de coste:
si se opta por medir «cómo cubre a Colombia», **para un medio con cobertura escasa
el número lo decidirían tres piezas**, y habría que fijar un umbral mínimo antes de
adoptar el criterio.

**Aquí ese problema no existe.** Este medio produce **~16 piezas de política
colombiana al día**, con redacción propia en Bogotá abierta para cubrir la región.
En noventa días son más de mil cuatrocientas. Es, con diferencia, el mayor
sub-corpus colombiano de cualquier medio extranjero del catálogo — y por tanto **el
único de los trece donde la respuesta "se clasifica por cómo cubre a Colombia" se
puede ejecutar de verdad hoy**.

Dicho al revés: si la regla de los internacionales se decide mirando a CNN, se
decide sobre el caso donde no hay datos. Si se decide mirando aquí, se decide sobre
el caso donde sí los hay.

---

## CONTRA — el mejor caso en contra de no firmar

**El −0,20 puede ser el número correcto por una vía que esta ficha no explora.** Un
diario con línea socialdemócrata declarada cubre Colombia desde esa línea: su
selección de temas —desigualdad, derechos, medio ambiente, memoria del conflicto— y
su encuadre no se apagan al cruzar el Atlántico. Si eso es así, trasladar la
posición del eje español al colombiano no sería un error de método sino un atajo
razonable.

Es una lectura sólida, y tiene a su favor un dato: su compañía media es **+0,104**,
la más baja de los medios con corpus real del tramo alto — se acompaña de medios
más al centro que la media del catálogo. Pero con 54 apariciones eso es ruido, y la
métrica está saturada de todos modos (ver `revision-externa/CONDUCTA-MEDIDA.md`).

**El problema del atajo es que no está escrito ni comprobado**, y afecta a trece
medios a la vez.

---

## REFUTACIÓN — qué cerraría esta ficha

1. **Decidir la regla de los medios internacionales**, y aplicarla a los trece. Es
   decisión de producto y bloquea a todos. **Esta ficha propone decidirla aquí**,
   por lo dicho en el argumento.
2. **Medir el encuadre del sub-corpus Colombia**, que es lo que ningún otro
   internacional permite: a quién cita, qué temas selecciona, cómo trata al
   gobierno entrante y al saliente. Con ~16 piezas diarias hay con qué.
3. **Aplicar la regla del polo fijo al resultado.** Buena parte de su cobertura
   colombiana del período es sobre el gobierno saliente y el entrante: criticar a
   cualquiera de los dos **no** lo desplaza en el eje. Lo que contaría es la
   asimetría entre ambos.
4. **Vigilar el pulso accionario de Prisa.** Un cambio de control en el grupo
   cambiaría el nivel 1 de este medio y el de Caracol Radio a la vez. Y sigue en
   pie la escisión anunciada de los medios latinoamericanos.
5. **Nombrar a quien dirige la redacción de Bogotá.** No se encontró en fuente
   citable; se declara el hueco en vez de deducirlo.

---

## REVISIÓN POR MODELOS

Se pide **argumentar en contra**. El acuerdo no se registra como validación.

| Modelo | Versión | Fecha | Objeción | Resolución |
|---|---|---|---|---|
| Claude Opus 5 | claude-opus-5 | 2026-08-18 | Redactor de esta ficha | — |
| Kimi K3 | | | | |
| Fable 5 | | | | |

**Aviso al revisor:** la pregunta útil aquí no es si El País es socialdemócrata en
España — probablemente lo sea y no está en discusión. Es si eso dice algo sobre el
eje colombiano, que es el eje de este producto. Y si tu respuesta es que sí, **el
sitio para demostrarlo es su edición Colombia**, que publica a diario y se puede
leer entera.

---

## ESTADO

**Sin firmar, y de alta con ficha el 2026-08-18.** Sigue en −0,20 con
`reviewedAt: null`. Su feed de la edición Colombia **está alimentando el sitio
correctamente** —47 piezas en la ventana, clasificadas como colombianas—, y su
nivel 1 quedó corregido en tres puntos que estaban vencidos.

Lo que queda abierto no es propio de este medio: es la regla de los trece
internacionales. **Pero este es el caso donde esa regla se puede decidir con datos
en vez de con criterio**, y por eso conviene decidirla aquí.
