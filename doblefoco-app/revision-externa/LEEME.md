# Revisión externa — carpeta de trabajo

Para pasar las fichas de orientación a otros modelos de lenguaje y recoger sus
objeciones.

```
revision-externa/
├── LEEME.md              ← este archivo
├── PROMPT.md             ← lo que se copia y pega al modelo. Empieza aquí
├── CONTEXTO.md           ← se pega DESPUÉS del prompt: reglas y evidencia
├── respuestas/           ← una carpeta por modelo, con lo que devuelva
│   └── PLANTILLA.md
└── pendientes.md         ← qué medios faltan por revisar
```

## Cómo se usa

1. Abrir `PROMPT.md`, copiarlo entero.
2. Pegar debajo el contenido de `CONTEXTO.md`.
3. Pegar debajo la ficha del medio, de `../fichas/<medio>.md`.
4. Enviar al modelo.
5. Guardar la respuesta literal en `respuestas/<modelo>-<medio>.md`, usando
   `respuestas/PLANTILLA.md`. **Sin editarla ni resumirla**: si se recorta, se
   pierde justo lo que pueda incomodar.

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
