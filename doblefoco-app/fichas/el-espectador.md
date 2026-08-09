# El Espectador — ficha de orientación

| | |
|---|---|
| **Valor actual** | −0,20 · `reviewedAt: null` |
| **Propuesta** | **NO FIRMAR. Sin base admisible para ningún número.** |
| **Firma** | ☐ pendiente — Jose Arbeláez |
| **Fecha** | 2026-08-08 (v2, rehecha tras la regla del presente) |
| **Protocolo** | `PROTOCOLO_JUICIO_EDITORIAL.md` §2, regla del presente |

> **Esta ficha se rehízo entera.** La v1 proponía −0,15 apoyándose en la
> tradición liberal del diario y contra-argumentaba con el asesinato de Guillermo
> Cano y el coche bomba de 1989. Jose señaló que **la evidencia de orientación
> tiene que ser sobre el presente, estrictamente**, con el caso de Semana: destapó
> las chuzadas del DAS y hoy está en +0,45. Eso invalidó **las dos mitades** de la
> v1 — la que sostenía la propuesta y la que la atacaba.

---

## EVIDENCIA ADMISIBLE

### Nivel 1 — Propiedad, vigente

Lo publica **Comunican S.A.**, del holding **Valorem**, controlado por la familia
Santo Domingo; la dirección del grupo la ejerce **Alejandro Santo Domingo Dávila**
desde 2011. Valorem opera en retail (D1 vía Koba), logística (Suppla, Ditransa),
entretenimiento (Cine Colombia), industria (Biofilm, Gases del Caribe).

Es una estructura **comprobable hoy**, no una efeméride: si Valorem vendiera
mañana, la ficha cambiaría. Pasa la prueba de la regla del presente.

- [MOM/RSF — El Espectador](https://colombia.mom-gmr.org/es/media/detail/outlet/el-espectador/)
- [MOM/RSF — Valorem S.A.](https://colombia.mom-gmr.org/es/proprietarios/companies-database/detail/company/company/show/valorem-sa/)

### Nivel 2 — Conducta medida, 2026-08-06 a 2026-08-09

```
artículos ............................ 83   (eran 24 antes de corregir su feed)
historias ............................ 82   ·  multifuente 15
agenda propia ........................ 67 de 82 = 82 %
compañía media ....................... +0,205  sobre 32 apariciones
coincide más con ..................... La Opinión 5 · El Heraldo 4 · Infobae 3
```

**Son tres días.** El 82 % de agenda propia está inflado porque un medio recién
incorporado no ha tenido tiempo de coincidir con nadie, y la compañía media
refleja quién domina el corpus. **No decide nada, en ninguna dirección.**

---

## EVIDENCIA RETIRADA POR LA REGLA DEL PRESENTE

| Qué decía | Cuándo | Por qué sale |
|---|---|---|
| «Tradición liberal» (justificación actual del registro) | desde 1887 | La palabra misma afirma sobre el pasado |
| MOM: «asociado desde su fundación a la defensa de ideas liberales» | 1887 | Fuente externa sólida, afirmación histórica |
| Guillermo Cano asesinado; sede destruida con coche bomba | 1986, 1989 | Era mi contra-argumento. Cae igual |

**Lo que queda al retirarlas es el hallazgo de esta ficha.**

---

## ARGUMENTO

**El valor actual de −0,20 no tiene ninguna justificación admisible.**

De los 30 medios colombianos, cinco tienen justificaciones que apelan al pasado.
En cuatro, la cláusula histórica va acompañada de una afirmación del presente que
sí se sostiene sola —el Semanario VOZ **es hoy** órgano del PCC, El Nuevo Siglo
declara **hoy** línea conservadora—. **El Espectador es el único cuya
justificación entera es histórica.** Quitada esa frase, no queda nada.

Y lo admisible que hay apunta en dirección contraria a su valor actual:

- **Propiedad**: el mayor grupo económico del país.
- **Los otros dos medios del mismo dueño** están en +0,10 (Noticias Caracol) y
  +0,25 (Blu Radio). Un recorrido de 0,45 dentro de la misma casa, sin ninguna
  explicación escrita en el catálogo.
- **La conducta de tres días** lo pone acompañado de medios en +0,205 de media.

### Y aun así NO se propone mover el número

Sería sustituir un número sin fundamento por otro número sin fundamento.

- La **regla 5.1** dice que la propiedad no determina la orientación. Es lo único
  fuerte que hay, y por sí sola no ubica a nadie.
- La **conducta**, que es lo que sí podría ubicarlo, tiene tres días.
- Mover a −0,15 —lo que proponía la v1— sería aplicar una regla de prudencia
  sobre un empate entre dos evidencias, cuando en realidad **no hay empate: hay
  una sola evidencia admisible y es insuficiente**.

**La propuesta es declarar el valor como no sostenido y esperar la medición.** Es
menos satisfactorio que un número nuevo y es lo único honesto que permite la
evidencia de hoy.

---

## CONTRA — el mejor caso en contra de no firmar

**Dejar −0,20 en pantalla mientras se declara que no tiene fundamento es peor que
moverlo.** El lector sigue viendo el número; la declaración vive en un archivo que
casi nadie abre. Si sabemos que no se sostiene, mantenerlo publicado es una
afirmación activa, no una abstención.

Una salida coherente con esa objeción sería **marcar el medio como «orientación
en revisión» en la interfaz** hasta tener corpus. Tiene un coste: si se aplica el
mismo criterio a los otros 42 medios con `reviewedAt: null`, habría que marcar el
catálogo entero, y un aviso que aparece en todos no informa de nada.

**No está resuelto.** Es la decisión que Jose tiene que tomar al firmar.

---

## REFUTACIÓN — qué cerraría esta ficha

1. **A los 90 días** (2026-11-06), con más de 300 historias suyas en el corpus:
   si su compañía media queda **bajo 0,00**, el −0,20 recupera fundamento y se
   firma. Si queda **sobre +0,10**, se mueve a la derecha.
2. **Si la agenda propia se mantiene sobre el 50 %** con ese volumen, es evidencia
   de línea independiente del bloque dominante, y pesa por sí sola.
3. **Si se documenta una intervención del accionista en la línea editorial**, con
   fuente citable y **de los últimos 12 meses**, se mueve a la derecha.

---

## PENDIENTE APARTE — un fallo del código

En **−0,20 exacto** `classifySpectrum` devuelve `left` y `getBand` devuelve
«Orientación mixta»: el mapa lo muestra como mixto mientras el análisis de
cobertura lo cuenta como izquierda. **Es un fallo real y se arregla por separado**
— no se usa como argumento para mover ningún número.

---

## REVISIÓN POR MODELOS

Se pide **argumentar en contra** de la propuesta de no firmar. El acuerdo no se
registra como validación.

| Modelo | Versión | Fecha | Objeción | Resolución |
|---|---|---|---|---|
| Claude Opus 5 | claude-opus-5 | 2026-08-08 | Redactor. Su v1 fue invalidada por la regla del presente | — |
| Kimi K3 | | | | |
| Fable | | | | |
| ChatGPT | | | | |

---

## ESTADO

**Sin firmar, y sin propuesta de número.** El registro sigue en −0,20 con
`reviewedAt: null`, ahora con la constancia de que ese valor no tiene base
admisible. La primera medición que puede cerrarla es del **2026-11-06**.
