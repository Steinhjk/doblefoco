# El Espectador — ficha de orientación

| | |
|---|---|
| **Valor actual** | −0,20 · `reviewedAt: null` |
| **Valor propuesto** | **−0,15** |
| **Firma** | ☐ pendiente — Jose Arbeláez |
| **Fecha de la propuesta** | 2026-08-08 |
| **Protocolo** | `PROTOCOLO_JUICIO_EDITORIAL.md`, fijado en `bf63e66` antes de examinar este medio |

---

## EVIDENCIA

### Nivel 1 — Propiedad documentada

Lo publica **Comunican S.A.**, del holding **Valorem**, controlado por la familia
Santo Domingo. Valores Bavaria —hoy Valorem— compró la mayoría accionaria el 12
de noviembre de 1997. Tras la muerte de Julio Mario Santo Domingo Pumarejo en
2011, la dirección del grupo pasó a **Alejandro Santo Domingo Dávila**.

Valorem opera además en retail (almacenes D1 vía Koba International), logística
(Suppla, Ditransa), entretenimiento (Cine Colombia), industria (Biofilm, Gases
del Caribe), inmobiliario y turismo.

**Y tiene otros dos medios en este mismo catálogo**: Blu Radio y Noticias
Caracol.

- [MOM/RSF — El Espectador](https://colombia.mom-gmr.org/es/media/detail/outlet/el-espectador/)
- [MOM/RSF — Valorem S.A.](https://colombia.mom-gmr.org/es/proprietarios/companies-database/detail/company/company/show/valorem-sa/)

### Nivel 2 — Conducta medida en nuestro corpus

Medido el 2026-08-08, **tras corregir su feed ese mismo día**:

```
artículos ............................ 83   (eran 24 con el feed de Google News)
historias ............................ 82   ·  multifuente 15
agenda propia (nadie más la cubre) ... 67 de 82 = 82 %
compañía media ....................... +0,205  sobre 32 apariciones
coincide más con ..................... La Opinión 5 · El Heraldo 4 · Infobae 3
```

**Esta evidencia es débil y hay que decirlo**: son tres días de datos. La cifra
de «agenda propia» está inflada porque un medio recién incorporado aún no ha
tenido tiempo de coincidir con nadie, y la «compañía media» refleja sobre todo
quién domina el corpus, no con quién se alinea él.

### Nivel 3 — Registros externos

El Media Ownership Monitor de RSF y FECOLPER registra que el diario **«ha estado
asociado desde su fundación a la defensa de ideas liberales»**, fundado por el
periodista Fidel Cano Gutiérrez, y que el digital «conserva la línea editorial
del periódico impreso».

### Nivel 4 — Lo que el medio declara de sí

Tradición liberal desde 1887. Es la evidencia que sostenía el valor actual: la
justificación en el registro dice *«diario nacional con tradición liberal;
énfasis en derechos humanos y proceso de paz»* — una frase sin fuente ni fecha.

---

## ARGUMENTO

**La evidencia más fuerte —nivel 1— apunta a la derecha, y la que sostiene el
valor actual es de nivel 3-4 y de carácter histórico.**

El dato que más pesa es una **inconsistencia interna de nuestro propio
catálogo**: tres medios, un mismo dueño, tres valores muy distintos.

```
El Espectador     −0,20        Valorem · Santo Domingo
Noticias Caracol  +0,10        Valorem · Santo Domingo
Blu Radio         +0,25        Valorem · Santo Domingo
```

Un recorrido de 0,45 dentro de la misma casa. **O la propiedad no determina la
orientación —lo que la regla 5.1 del protocolo admite explícitamente— o uno de
los tres valores está mal.** Las dos cosas no pueden sostenerse a la vez sin
explicación, y hoy no hay ninguna escrita.

La tradición liberal es real y está documentada por una fuente externa, pero
**describe su fundación en 1887, no su cobertura de 2026**. Un rasgo histórico no
puede pesar más que la estructura de propiedad actual sin evidencia de conducta
que lo sostenga — y la conducta que tenemos son tres días.

Por la **regla 5.2** —ante la duda entre dos bandas, la más cercana a la mixta,
porque el error de clasificar de más acusa— el movimiento correcto es hacia el
centro de la escala, no más a la izquierda.

**Se propone −0,15**: reconoce la tradición liberal manteniéndolo en el lado
izquierdo del cero, y deja de afirmar una posición de izquierda sobre el diario
del mayor grupo económico del país sin conducta medida que la respalde.

### Un efecto colateral que conviene: sale de una costura del código

En **−0,20 exacto las dos funciones de clasificación se contradicen**:

```
bias    classifySpectrum     getBand
−0,25   left                 Izquierda moderada     ✓ coherente
−0,20   left                 Orientación mixta      ✗ CONTRADICCIÓN
−0,15   center               Orientación mixta      ✓ coherente
```

Hoy el mapa mediático muestra a El Espectador como «Orientación mixta» mientras
el análisis de cobertura lo cuenta como izquierda. **Es un fallo real de nuestro
código y hay que arreglarlo aparte** —no se puede usar como argumento para mover
el número—, pero conviene saber que el valor actual está sobre esa junta.

---

## CONTRA — el mejor caso en contra de esta propuesta

**El determinismo de propiedad es exactamente lo que el protocolo prohíbe.** La
regla 5.1 dice que el dueño no determina la orientación. Mover a El Espectador
hacia el centro *porque es de los Santo Domingo* es aplicar precisamente el
razonamiento que se declaró inadmisible, con otro nombre.

Y hay un contraejemplo histórico serio: **El Espectador denunció a Pablo Escobar
cuando eso costaba la vida**; su director Guillermo Cano fue asesinado en 1986 y
su sede fue destruida con un coche bomba en 1989. Un diario que sostuvo esa línea
contra el poder real de su época no se explica por su accionista.

**La evidencia de conducta no respalda el movimiento.** Tres días de datos no
sirven ni para confirmarlo ni para desmentirlo, y la regla 5.3 dice que sin
evidencia de nivel 1-3 no se mueve el número. Aquí hay nivel 1 y nivel 3 — pero
apuntan en direcciones opuestas, y quien decide el empate es el criterio de
prudencia, no un dato.

**Un revisor razonable podría concluir que lo correcto es no mover nada y esperar
tres meses de corpus.** Esa posición es defendible y queda registrada.

---

## REFUTACIÓN — qué cambiaría el número

1. **Si a los 90 días** (a partir del 2026-11-06) su compañía media en historias
   multifuente se sitúa **por debajo de 0,00**, la conducta contradice esta
   propuesta y el valor vuelve a −0,20 o más a la izquierda.
2. **Si su tasa de agenda propia se mantiene sobre el 50 %** con más de 300
   historias, eso es evidencia de línea independiente del volumen dominante y
   pesa a favor de la lectura liberal.
3. **Si se documenta una intervención del accionista en la línea editorial**
   —una fuente citable, no un rumor—, el valor se mueve a la derecha, no al
   centro.
4. **Si cambia la propiedad**, revisión extraordinaria inmediata.

---

## REVISIÓN POR MODELOS

Pendiente. Según el §3 del protocolo, a cada modelo se le pide **argumentar en
contra** de la propuesta de −0,15, nunca si está de acuerdo, y **el acuerdo no se
registra como validación**.

| Modelo | Versión | Fecha | Objeción | Resolución |
|---|---|---|---|---|
| Claude Opus 5 | claude-opus-5 | 2026-08-08 | Redactor. La objeción de determinismo de propiedad, arriba en CONTRA, la formuló contra su propia propuesta | Declarada, no resuelta |
| Kimi K3 | | | | |
| Fable | | | | |
| ChatGPT | | | | |

**Nota de honestidad sobre este cuadro**: el redactor y el primer objetor son el
mismo modelo, lo que limita el valor de esa primera objeción. Las tres filas
restantes son las que aportan independencia real, y aun así comparten datos de
entrenamiento con él.

---

## ESTADO

**Propuesta sin firmar.** El número del registro sigue siendo −0,20 y `reviewedAt`
sigue en `null` hasta que Jose firme. Cambiar el valor antes de la firma
convertiría el protocolo en decoración.
