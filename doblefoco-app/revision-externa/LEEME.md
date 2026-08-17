# Revisión externa — carpeta de trabajo

Para pasar las fichas de orientación a otros modelos de lenguaje y recoger sus
objeciones.

```
revision-externa/
├── LEEME.md              ← este archivo
├── PROMPT.md             ← lo que se copia y pega al modelo. Empieza aquí
├── CONTEXTO.md           ← se pega DESPUÉS del prompt: reglas y evidencia
├── envios/               ← SE GENERA, no se versiona. Ver abajo
├── respuestas/           ← una carpeta por modelo, con lo que devuelva
│   └── PLANTILLA.md
└── pendientes.md         ← qué medios faltan por revisar
```

## Cómo se usa

**La vía corta, y la normal:**

```
npm run envio -- diario-la-libertad     # uno
npm run envio -- --tramo                # los 20 de mayor audiencia
npm run envio -- --todos                # todos los que tengan ficha
```

Deja en `envios/<fecha>-<medio>.md` el prompt, el contexto y la ficha ya unidos.
Se copia entero y se pega.

**`envios/` NO SE VERSIONA, y es a propósito.** Un envío es una foto con fecha:
dice «armado el día X, y estas fuentes respondían ese día». Guardarlo en el
repositorio lo convierte en un archivo que seguirá afirmándolo dentro de seis
meses, cuando ya no sea verdad — la misma caducidad silenciosa contra la que
existe todo lo demás de esta carpeta. Se genera cuando se va a usar, que cuesta
un comando. Lo que sí se versiona es la ficha y **la respuesta del modelo**.

**El armador comprueba las fuentes al armar.** Pide todas las URL de la ficha de
propiedad y estampa el resultado en la cabecera del archivo. Si alguna no
resuelve, el envío se arma igual pero lo dice arriba: mandar a un revisor un
expediente con enlaces muertos es hacerle perder el tiempo, y el error vuelve
como objeción.

**La vía larga**, por si hace falta armarlo a mano:

1. Abrir `PROMPT.md`, copiarlo entero.
2. Pegar debajo el contenido de `CONTEXTO.md`.
3. Pegar debajo la ficha del medio, de `../fichas/<medio>.md`.
4. Enviar al modelo.
5. Guardar la respuesta literal en `respuestas/<modelo>-<medio>.md`, usando
   `respuestas/PLANTILLA.md`. **Sin editarla ni resumirla**: si se recorta, se
   pierde justo lo que pueda incomodar.

**Antes de armar el envío, la ficha se comprueba de campo ESE MISMO DÍA.** No es
formalismo: la ficha de EL DIARIO de Boyacá caducó en tres días, y la de Diario La
Libertad cambió en tres —se pudo leer una pieza que antes daba 403 y apareció un
conflicto de interés que la ficha no tenía—. Por eso los archivos de `envios/`
llevan fecha en el nombre: **un envío es válido para el día en que se armó.**

## Las dos reglas que hacen que esto sirva

**Se pide objeción, no opinión.** Al modelo no se le pregunta si está de acuerdo
ni qué número pondría él. Se le pide que **ataque** la clasificación propuesta con
evidencia. Un modelo que asiente no aporta nada; uno que objeta, sí.

**El acuerdo no se registra como validación.** Los modelos comparten datos de
entrenamiento y se equivocan de forma correlacionada: que cuatro coincidan puede
ser el mismo prejuicio repetido cuatro veces. Lo que se publica es el desacuerdo.

## Qué NO hace falta darles

No hace falta acceso al repositorio ni a la base de datos. Toda la evidencia va
dentro del texto que se pega, con sus enlaces, para que el modelo pueda
comprobarla y para que la revisión sea repetible por cualquiera.

## Qué se hace con lo que devuelvan

- **Objeción con fuente comprobable** → se verifica la fuente. Si se sostiene, se
  cambia el número o se declara la tensión en la ficha.
- **Objeción sin fuente** → se anota como no admisible, con su texto.
- **Acuerdo** → se anota que no hubo objeción. No cuenta como respaldo.

Una objeción sólida que se ignore sin motivo escrito **invalida la firma**.
