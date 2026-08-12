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

## ABIERTO · Categoría de canales de YouTube

**Planteado:** en una sesión anterior (fecha sin registrar — se perdió).
**Retomado:** 2026-08-11.

### La idea

Una **categoría con los canales de YouTube distribuidos**.

Es lo que Jose dijo, textual en lo esencial. Se anota así, corto y sin adornar,
porque cualquier ampliación a estas alturas sería invención.

### Lo que hace falta preguntar

- **«Distribuidos» ¿según qué eje?** El espectro político es el eje del producto
  y es la lectura más probable, pero no está dicho.
- **Qué canales entran.** ¿Los de los medios que ya están en el catálogo
  —Noticias Caracol, Noticias RCN, City TV publican ahí—, canales que solo
  existen en YouTube, o los dos?
- **¿Un canal es un medio?** Si lleva ficha de propiedad, valor de sesgo y entra
  en el mapa, o si es una capa aparte con sus propias reglas.
- **Qué se muestra**: ¿los vídeos como piezas dentro del feed normal, o una
  pantalla propia?

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
