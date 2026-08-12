# Planeación — lo que se habla, anotado en el momento

## Para qué existe este archivo

Pedido de Jose el **2026-08-11**, y con un motivo concreto: **la idea de la
categoría de canales de YouTube se habló largo en una sesión anterior y no quedó
ni una línea en el repositorio.** Se perdió entera. Cuando se retomó, hubo que
reconstruirla de memoria.

La regla, entonces:

> **Todo lo que se hable de planeación se anota aquí, en el turno en que se
> habla.** No al cerrar la sesión, no «cuando esté claro», no solo en la cabeza
> del asistente. Aquí, local, en el repositorio.

Esto es distinto de `DECISIONES.md` —que guarda decisiones tomadas, con su
razón— y de `SIGUIENTE.md` —que es la nota de traspaso de una sesión—. **Esto
guarda lo que todavía es una idea**: media conversación, un rumbo, algo que
todavía no tiene forma de tarea. Justo lo que más fácil se pierde.

**Se anota aunque esté incompleto.** Una idea a medias escrita vale más que una
idea completa olvidada. Si falta detalle, se escribe qué falta y quién lo sabe.
**No se rellena con suposiciones**: si no se dijo, va como pregunta abierta.

---

## ABIERTO · Medios alternativos — la categoría de canales de YouTube

**Planteado:** en una sesión anterior (fecha sin registrar — se perdió).
**Retomado:** 2026-08-11. **Contexto dado por Jose:** 2026-08-12.

### La idea, ya con forma

**Una categoría grande llamada «Medios alternativos», al lado de Tendencias**,
con los canales de YouTube más prominentes que hacen noticias, **cada uno con su
sesgo político declarado**: mixta, izquierda o derecha.

Ejemplos que Jose nombró: **Daniel Coronell, María Jimena Duzán, Diego Ruzzarin,
Daniel Briceño**, «etc.». La lista no está cerrada y **la investigación está por
hacer**.

### Lo que el contexto del 12 de agosto ya resuelve

- **Dónde vive:** categoría propia y grande, hermana de Tendencias. No es una
  etiqueta dentro del feed normal. → contesta la pregunta de «qué se muestra».
- **Qué entran:** canales prominentes de noticias, y por los ejemplos se ve que
  son **personas, no cabeceras** — Coronell, Duzán, Ruzzarin, Briceño no son
  medios del catálogo. → contesta «qué canales entran»: los que solo existen ahí.
- **Se etiqueta el sesgo**, con las mismas bandas del producto.

### Lo que esto cambia respecto a un medio normal, y hay que resolver

- **«En muchos casos son personas naturales y ellos mismos determinan su
  orientación»** (Jose). Eso es un cambio de fondo, no un detalle: en un medio la
  orientación se infiere de la propiedad y de la conducta; **en un canal
  personal, el autor la declara**. Es evidencia de nivel 4 —lo que dice de sí
  mismo— convertida en la fuente principal, que es justo lo contrario de lo que
  manda el protocolo para los medios.
  - A favor: una declaración propia y pública es contrastable, y clasificar a
    Briceño como derecha o a Coronell como izquierda no se lo inventa nadie.
  - En contra: **el protocolo prohíbe apoyar una ficha solo en niveles 4 y 5.**
    O se le hace una excepción escrita para canales personales, o se les exige
    también conducta medida. **No decidido.**
- **La propiedad no aplica igual.** Un canal personal no tiene sociedad editora
  ni accionistas: el dueño es la persona, y lo que importa es **de qué vive** —
  patrocinios, membresías, quién le paga—. Habría que decidir si eso va en el
  campo de propiedad o en uno nuevo.
- **Qué es «prominente».** Ya hay precedente: la cobertura se mide por audiencia,
  no por volumen (`shared/audiencia.js`). Para YouTube el equivalente sería
  suscriptores o visualizaciones, y hay que decidir cuál y con qué corte.

### Lo que ya se sabe del terreno y sirve

- El motor **solo sabe leer RSS** (`via: 'direct' | 'gnews'`). YouTube publica
  feed RSS por canal:
  `https://www.youtube.com/feeds/videos.xml?channel_id=<ID>`. Es RSS estándar, así
  que por ahí no habría que tocar el motor.
- La CSP de `vercel.json` tendría que admitir las miniaturas
  (`i.ytimg.com`), y eso choca con la regla de **imagen real del medio o
  ninguna**: una miniatura de YouTube la elige el canal, no es foto periodística.
  Aunque aquí la regla podría leerse al revés: **la miniatura SÍ es del autor**,
  que es de quien se predica la orientación. Merece decidirse aparte.
- Si un canal cuenta como medio, arrastra ficha de propiedad y valor de sesgo, y
  ambos exigen el protocolo entero. No es un alta barata — y por eso lo de la
  autodeclaración hay que resolverlo antes y no sobre la marcha.
- **EL DIARIO de Boyacá, ya en el catálogo, presume de ser el canal número uno
  de YouTube entre los medios de Boyacá** y publica entrevistas ahí (EDtv). Es
  el caso mixto —cabecera con canal— que la categoría no cubre y conviene tener
  a la vista.

### Lo que falta, y es trabajo, no pregunta

**La investigación de los canales está sin empezar.** Ni lista cerrada, ni
identificadores de canal, ni suscriptores, ni orientación declarada por cada uno.

### Lo que ya se sabe y sirve

- El motor **solo sabe leer RSS** (`via: 'direct' | 'gnews'`). YouTube publica
  feed RSS por canal:
  `https://www.youtube.com/feeds/videos.xml?channel_id=<ID>`. Es RSS estándar, así
  que por ahí no habría que tocar el motor.
- La CSP de `vercel.json` tendría que admitir las miniaturas
  (`i.ytimg.com`), y eso choca con la regla de **imagen real del medio o
  ninguna**: una miniatura de YouTube la elige el canal, no es foto periodística.
- Si un canal cuenta como medio, arrastra ficha de propiedad y valor de sesgo, y
  ambos exigen el protocolo entero. No es un alta barata.

**Nada de esto decide nada.** Es lo que ya está comprobado del terreno, para que
la conversación empiece más adelante de donde empezó la vez pasada.

---

## ABIERTO · Auditoría de sesgo con IAs externas

**Planteado:** antes del 2026-08-08 (existe `revision-externa/` desde entonces).
**Reafirmado:** 2026-08-11.

**Lo hace Jose**, con modelos de ventana grande, para que analicen el sesgo real
de cada medio con evidencia fáctica. Las fichas que ya están escritas se les pasan
para contraste o confirmación.

Estado y lista de lo que hay listo para enviar: `revision-externa/pendientes.md`.
Resumen: **circuito montado, 17 fichas con valor propuesto, cero respuestas
recogidas.**

**No es un pendiente de código.** Aquí solo se anota para que no desaparezca del
mapa de lo que está en marcha.

---

## CERRADO · Criterio de orden de las fichas de propiedad

**Cerrado el 2026-08-11.** «Mayor cobertura nacional» significa **cantidad de
lectores**, no volumen de piezas. Fuente: Reuters Institute. Tramo prioritario de
20 fichas con dos grados de certeza marcados.

Implementado en `shared/audiencia.js`. Se anota aquí porque empezó como
conversación de planeación y conviene que el hilo quede completo.

---

## CERRADO · Qué hacer con los medios de dueño desconocido

**Cerrado el 2026-08-11.** Se declara la ausencia con fecha de consulta en vez de
dejar el medio fuera del catálogo. Implementado en `shared/mediaOwnership.js`.

Consecuencia ejecutada el **2026-08-12**: **EL DIARIO de Boyacá, Vive el Meta y
Lente Regional** entraron con la ausencia declarada. Meta y Caquetá dejan de
estar en blanco. Los tres se volvieron a comprobar de campo antes del alta, y
menos mal: la ficha de EL DIARIO había caducado en tres días.
