# Protocolo del juicio editorial de orientación

**Fijado el 2026-08-08, ANTES de examinar ningún medio.** El orden importa y es
comprobable en el historial de git: este archivo se confirma en un commit propio,
y las fichas de cada medio vienen después. Si los criterios se escribieran
mirando ya el resultado, serían una racionalización con aspecto de método.

---

## 0. Por qué existe

La calibración por documentos de partido falló (§24 de
`DISENO_ALGORITMO_SESGO.md`): el RILE de programas municipales no reproduce el
orden de los registros de expertos, y publicar un número apoyado en una
correlación de 0,39 con n=7 sería el aparato estadístico alrededor de una
opinión.

El diseño previó esta salida desde su sección 0: **el juicio editorial declarado,
argumentado y sujeto a réplica es un resultado aceptable**. Este protocolo lo
convierte en un procedimiento en vez de en una excusa.

**Lo que cambia respecto a hoy no es que haya juicio —los 43 valores actuales ya
lo son— sino que deja de ser invisible.** Hoy cada medio tiene un número con una
frase de justificación y `reviewedAt: null`. Después de esto, cada número tendrá
evidencia citada, un argumento, su mejor contra-argumento, la condición que lo
refutaría y **un nombre y una fecha**.

---

## 1. Qué se está juzgando, y qué no

Se juzga la **ORIENTACIÓN del medio**: estructural, permanente, de la casa. No el
sesgo de una pieza concreta, que es otra cosa y todavía no se mide (ver la nota
de `SPECTRUM_LABEL` en `shared/biasAnalysis.js`).

Escala existente, sin cambios: **−1,0 a +1,0**, con las cinco bandas de
`SPECTRUM_BANDS`. El 0,0 es **orientación mixta**: la del medio no se sitúa en el
eje izquierda-derecha, no que no tenga.

### REGLA DEL POLO FIJO (añadida el 2026-08-18 por Jose, tras el ciclo 1 de revisión externa)

**El eje mide la posición del medio respecto de un polo fijo, no su postura
frente a quien gobierne.**

Izquierda y derecha son posiciones ideológicas. No son «a favor del gobierno» y
«en contra del gobierno»: si lo fueran, el mismo medio cambiaría de signo cada
cuatro años sin haber cambiado de línea, y el eje mediría al gobierno de turno en
vez de al medio.

**Consecuencia directa: fiscalizar al poder NO es evidencia de orientación**, ni
en un sentido ni en el otro. Denunciar la corrupción de quien manda es el oficio.
Un medio no se desplaza a la izquierda por investigar a un gobierno de derecha,
ni a la derecha por investigar a uno de izquierda.

**La prueba, y es la misma forma que la regla del presente.** Si el gobierno
cambiara mañana y el medio mantuviera exactamente la misma conducta, ¿cambiaría
su clasificación? Si la respuesta es sí, no se está midiendo al medio: se está
midiendo contra quién le tocó ejercer.

#### Lo que sí sigue siendo evidencia, y es la parte que hay que saber leer

La regla **no** deja sin clasificar a los medios beligerantes. Lo que descarta es
la crítica al gobierno de turno; lo que admite es **la asimetría sostenida a
través de un cambio de gobierno**:

- Un medio que fiscaliza con dureza a quien manda, y sigue haciéndolo cuando
  manda el otro lado, está haciendo periodismo. Eso es **mixta**.
- Un medio que fiscalizaba con dureza y pasa a celebrar cuando llega su lado
  —o al revés— ha revelado una posición. **Eso sí es orientación, y se mide.**

Por eso el criterio no puede aplicarse sobre una foto de un solo gobierno. Y por
eso mismo **la transición de agosto de 2026 es la ocasión más limpia que va a
tener este catálogo en años**: cualquier medio clasificado por su dureza con el
gobierno saliente queda ahora sujeto a la única comprobación que vale, que es
cómo trata al entrante. Está calendarizado en las fichas afectadas.

#### Qué NO toca esta regla

Un **endoso editorial** no es fiscalización: es tomar partido, y sigue siendo
evidencia de primer orden. Lo mismo vale para el encuadre asimétrico entre
candidatos, la cobertura del propio accionista y la línea declarada por la casa.
Esta regla acota una sola cosa —la crítica al poder vigente— y no las demás.

---

## 2. Jerarquía de la evidencia

Ordenada de más a menos fuerte. **Una ficha no puede apoyarse solo en niveles 4
y 5.**

| | Nivel | Qué vale | Dónde está |
|---|---|---|---|
| 1 | **Propiedad documentada** | Quién controla la empresa, con fuente citable y persona natural | `shared/mediaOwnership.js` |
| 2 | **Conducta medida en nuestro corpus** | Qué cubre, con quién coincide, qué omite, cuánto publica | base de datos, `scripts/coCoverage.mjs` |
| 3 | **Registros externos** | MOM/RSF, Observatorio de Medios de la MOE, ColombiaCheck, sentencias | enlace directo |
| 4 | **Declaraciones del propio medio** | Su manifiesto, su línea declarada, su historia institucional | enlace directo |
| 5 | **Hechos editoriales notorios** | Portadas, coberturas o decisiones que tuvieron consecuencia pública verificable | enlace directo |

### REGLA DEL PRESENTE (añadida el 2026-08-08 por Jose, tras la primera ficha)

**Toda evidencia de orientación tiene que ser sobre el presente. Estrictamente.**

Un hecho del pasado —por notable, heroico o infame que sea— no dice nada de la
línea de hoy. El caso que zanja la discusión es **Semana**: destapó las chuzadas
del DAS bajo el gobierno de Uribe, y hoy está clasificada en **+0,45**. Misma
cabecera, línea opuesta. Si el pasado contara como evidencia, Semana tendría que
estar a la izquierda.

Lo que esto excluye, aunque esté bien documentado y sea cierto:

- fundaciones, efemérides y «tradiciones» («diario de tradición liberal»)
- hechos editoriales notables de otra época —premios, denuncias, atentados
  sufridos, directores asesinados—
- la línea de un dueño o un director **anteriores**
- la afirmación de un registro externo cuando esa afirmación es histórica: MOM
  dice que El Espectador «ha estado asociado **desde su fundación** a la defensa
  de ideas liberales», y eso describe 1887, no 2026

**Esto invalidó las dos mitades de la primera ficha**, la que apoyaba la
propuesta y la que la atacaba. La regla no se aplica solo cuando incomoda al
argumento contrario.

**Lo que sí sobrevive del pasado**: un hecho antiguo que además **sea una
estructura vigente**. «Fundado en 1957» no vale; «es el órgano del Partido
Comunista, que hoy lo posee» sí, porque la propiedad es comprobable hoy. La
prueba: si el hecho dejara de ser cierto mañana, ¿cambiaría la clasificación? Si
la respuesta es no, es historia y no evidencia.

**Consecuencia para el nivel 5** de la tabla de arriba: «hechos editoriales
notorios» solo cuenta si son **de los últimos 12 meses**.

### Lo que NO cuenta como evidencia

- **El juicio de un modelo de lenguaje sobre la posición del medio.** Es una
  compresión de texto de internet que probablemente incluye especulación sobre
  esta misma pregunta. Rompe la procedencia y no es reproducible entre versiones.
- **La coincidencia entre varios modelos.** Mide fiabilidad, no validez:
  comparten datos de entrenamiento y se equivocan de forma correlacionada.
- **La reputación** («todo el mundo sabe que…»). Si no hay dónde consta, no entra.
- **El volumen de reportes de lectores.** Un recuento de quejas no es una fuente.

---

## 3. El papel de la IA, invertido

**El modelo no dictamina: redacta y ataca.**

1. **Redacción.** Compone el borrador de la ficha a partir de la evidencia de los
   niveles 1-5, con cada afirmación enlazada. No añade nada que no pueda enlazar.
2. **Ataque.** A cada modelo consultado se le pide **argumentar EN CONTRA** de la
   clasificación propuesta, con evidencia. No se le pregunta si está de acuerdo.

**El acuerdo no se registra como validación.** Si los modelos coinciden, la ficha
no gana nada: puede ser el mismo prejuicio repetido. **Lo que se publica es el
desacuerdo**, con el nombre del modelo, su versión y la fecha — porque las
versiones cambian y una revisión de agosto de 2026 no es repetible en 2027.

Si una objeción resulta sólida, **se cambia el número o se declara la tensión en
la ficha**. Una objeción que se ignora sin motivo escrito invalida la firma.

---

## 4. Forma de la ficha

```
MEDIO · valor propuesto · firma · fecha
├─ EVIDENCIA     por niveles, cada punto con su enlace
├─ ARGUMENTO     por qué ese valor y no el contiguo
├─ CONTRA        el mejor caso en contra que se encontró
├─ REFUTACIÓN    qué observación concreta cambiaría el número
└─ REVISIÓN      qué objetó cada modelo · versión · fecha
```

**El campo REFUTACIÓN es obligatorio y no admite fórmulas vagas.** «Si cambiara
su línea» no vale. Vale: «si en tres meses su cobertura de X deja de coincidir
con Y», o «si se documenta que Z entró en el capital».

---

## 5. Reglas de decisión

1. **El dueño no determina la orientación, pero se declara siempre.** Un medio
   puede tener línea distinta de los intereses de su propietario; afirmar lo
   contrario por defecto sería determinismo, no evidencia. Lo que no se admite es
   omitir de quién es.
2. **Ante la duda entre dos bandas, se elige la más cercana a la mixta.** El
   error de clasificar de más es más caro que el de clasificar de menos: acusa.
3. **Sin evidencia de nivel 1-3, no se mueve el número.** Se deja el actual y se
   marca la ficha como incompleta.
4. **Un medio puede quedar sin firmar.** Es mejor que firmarlo sin fundamento.
5. **La ficha se publica entera**, incluido el contra-argumento. Publicar solo la
   conclusión convertiría el ejercicio en autoridad, que es lo contrario de lo
   que busca.

---

## 6. Quién firma y qué significa

Firma **Jose Arbeláez**, como responsable editorial de DobleFoco. La firma
significa: *he leído la evidencia, el argumento y la objeción, y sostengo este
número públicamente y sujeto a réplica.*

No significa que el número sea correcto. Significa que **hay alguien a quien
preguntarle por qué**, que es exactamente lo que hoy no hay.

---

## 7. Revisión

- **Ordinaria**: cada 12 meses.
- **Extraordinaria**: cambio de propiedad, cambio de dirección, o cumplimiento de
  la condición escrita en REFUTACIÓN.
- **Por réplica**: cualquier lector puede impugnar una ficha aportando evidencia
  de nivel 1-3. Una impugnación con fuente obliga a responder por escrito.
- **Por objeción del medio** (añadido el 2026-09-02 por Jose, duda 12): si el
  propio medio objeta su clasificación, su ficha o un aviso, escribiendo desde
  una cuenta suya a `doblefoco.co@gmail.com`, **se acusa recibo en 5 días y se
  responde por escrito en 15**. La objeción y la respuesta **se publican junto a
  la ficha, con fecha**, cambie o no la clasificación —como una `note` de
  `mediaOwnership.js`, con la fecha de recepción y, si el medio publicó su
  objeción, el enlace—. La reclasificación, si la hay, sigue este protocolo
  entero: evidencia de nivel 1-3, regla del presente, refutación. Un dato de
  hecho demostrado errado —dueño, fecha, cargo— se corrige siempre. La
  insistencia no es evidencia. El procedimiento está publicado en
  `/transparencia/limitaciones`; si los plazos cambian, cambian en los dos sitios.

**El caso previsto**: la ficha de RTVC ya lleva anotado que su gerencia depende
del gobierno de turno y que el período cambió el 7 de agosto de 2026. Es la
primera revisión extraordinaria que tocará hacer.
