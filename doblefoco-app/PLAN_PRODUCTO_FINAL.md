# Plan hacia el producto final — desde el 2026-09-01

**Sucede a `PLAN_CONTINUIDAD.md`** igual que aquel sucedió al plan de Kimi: lo
absorbe entero —ninguna de sus tareas se pierde, cada una aparece aquí con su
código original entre paréntesis— y le añade los hallazgos de la auditoría de
integración de hoy (`AUDITORIA_INTEGRACION_2026-09.md`, códigos I-1 a I-10).

**Qué persigue.** Un producto **terminado, pulido, eficiente y autosuficiente**.
Este plan define qué significa cada palabra (al final, en la lista de cierre) y
ordena el camino en cuatro etapas. La diferencia con el plan anterior no es de
contenido sino de horizonte: aquel ordenaba lo identificado; este dice además
**cuándo se acaba**.

**Qué no está aprobado.** Nada. La Etapa 1 entera es decisión de Jose, y las
etapas 3 y 4 dependen de lo que ahí se decida. La cuenta la lleva `MINUTA.md`,
como siempre: este archivo puede quedarse quieto sin mentir.

---

## El criterio de orden, en una frase

**Primero que el sistema se despliegue y avise solo (una semana de código),
después una única sesión que vacíe la cola de decisiones (medio día de Jose),
después ejecutar lo decidido, y de último el pulido de catálogo y rendimiento.**
La cola de decisiones es el cuello de botella real del proyecto: todo lo demás
son días; eso lleva semanas esperando.

---

# ETAPA 0 · Autosuficiencia operativa — una semana de calendario

Objetivo verificable: **ningún eslabón manual en el ciclo de publicación, y
ningún vigilante sin timbre.** Al cerrar esta etapa, el sistema se despliega,
se vigila y reclama atención él solo.

| # | Tarea | Origen | Quién | Cuánto |
|---|---|---|---|---|
| 0.1 | Crear `FLY_API_TOKEN` y ponerlo como secreto | I-1 / 0-B | **Jose** | 10 min |
| 0.2 | Desplegar el motor y cerrar el desfase de hoy (3 commits) | I-1 | automático tras 0.1 | — |
| 0.3 | Que `desfase.yml` abra issue como los otros vigilantes | I-2 | código | 1 h |
| 0.4 | Issues de vigilantes con `--assignee` para que llegue correo | I-3 | código | 30 min |
| 0.5 | Hombre-muerto de la copia en la vigilancia (última exitosa < 48 h) | I-4 | código | 2–3 h |
| 0.6 | Aviso si la ingesta lleva horas viniendo solo de la red de 2 h | I-8 | código | 2 h |
| 0.7 | Handshake de versión cliente↔motor con degradación visible | I-7 / 2-B | código | 1–2 días |
| 0.8 | Limpieza: `_headers`, `_redirects`, `securityService.js`, comentario de `.env.example`, `.gitignore` | I-5, I-10 | código | 2 h |
| 0.9 | Decidir `api.doblefoco.co`: crear el CNAME o quitarlo de la CSP | I-6 | Jose (1 frase) + código | 30 min |
| 0.10 | Leer el issue #4 del centinela (Chocó 7 Días; Telecafé y Diario del Norte desde local) | 0-C | **Jose** | 20 min |
| 0.11 | Excluir el proyecto de la sincronización de OneDrive | I-9 | **Jose** | 15 min |

De Jose son tres gestos cortos (0.1, 0.10, 0.11) y una frase (0.9). Todo lo
demás es código que no necesita permiso y cabe en una semana.

# ETAPA 1 · La sesión de decisiones — medio día de Jose, con todo servido

**Es el cuello de botella del proyecto entero.** Cada punto ya tiene su estudio
escrito y sus opciones cerradas; ninguno necesita investigación nueva. La
propuesta es una sola sesión que los recorra en este orden —los tres primeros
van juntos porque se condicionan entre sí— y que cada decisión se anote en
`DECISIONES.md` y en la minuta **en el momento**, no al final.

1. **¿Se archiva, o la noticia muere a las 72 h?** (1-A) — la de más
   consecuencias: desbloquea separar ventana de estimación y de agrupamiento
   (Alt-3 de Kimi), el buscador, y cambia el coste (~25 USD/mes al año vista).
2. **La ventana de 72 h y los medios lentos** (1-B) — la única salida limpia es
   la regla uniforme por cadencia; la cadencia se empieza a grabar en 2.1 y la
   regla se podrá aplicar en 30–90 días. Lo que se decide hoy es el compromiso.
3. **El punto ciego: opciones D y E** (1-C) — declarar no medible la rama de la
   izquierda con el número en pantalla, y adoptar el énfasis con su ceguera
   direccional escrita. Con 1-D detrás: recalibrar las ramas 1 y 3, cambiar el
   15 % por un número de medios, o declararlas sin disparo previsible.
4. **Infobae al 38 % e `ITEMS_PER_FEED = 15`** (1-E, duda 4) — ratificar el
   muestreo o subir el techo, pero que quede decidido y escrito.
5. **La Libertad / La Nación (Neiva)** (1-F) — la regla que falta: cuándo la
   política de quien dirige, y no de quien posee, es materia de aviso.
6. **Prioridad de las 28 fichas que faltan** (1-G) — la izquierda es 3 de 14 y
   es la `q` del modelo; quién va primero lo decide Jose.
7. **Los `aceptado` con nota del libro** — Razón Pública (publica por tandas),
   Vorágine, Telecaribe, El Manduco (cadencia lenta): decidir cuáles son su
   oficio y no una avería, y estrenar el mecanismo que existe para eso.
8. **Las tres dudas cortas:** historias sin imagen (duda 3), la cifra de
   patrocinio (duda 5), y el procedimiento para cuando un medio nos escriba
   (duda 12 — la única cuya falta se nota desde fuera).

# ETAPA 2 · Lo que no espera a nadie — una a dos semanas de código

Puede empezar hoy, en paralelo con las etapas 0 y 1.

| # | Tarea | Origen | Cuánto |
|---|---|---|---|
| 2.1 | **Grabar la cadencia por medio** — solo acumular, sin usar. **Hecha y estrenada el 2026-09-01** (PR #7); ver `MINUTA.md` | 2-A / T2-3 | 1 día, **y es urgente por calendario**: su utilidad llega sola a los 30–90 días |
| 2.2 | Check de `group`/`controlGroup` en `check:registry` — **ya estaba hecho desde el 2026-08-24 (`3f35b9d`)**; ver `MINUTA.md` | 2-C / D-3 | — |
| 2.3 | Una sola consulta compartida en la portada | 2-D / T2-2 | 2–3 días |
| 2.4 | Serializador único de rehidratación + prueba de ida y vuelta | Kimi E-3 | 1 día |
| 2.5 | Fichas nuevas según la prioridad que salga de 1.6 — el alta ya no espera a la ficha, pero la deuda se paga | 1-G | continuo, por tandas |

# ETAPA 3 · Ejecutar lo decidido — dos a cuatro semanas, según la Etapa 1

El contenido exacto lo fija la sesión de decisiones; estas son las ramas
posibles ya dimensionadas:

- **Si se archiva (1):** migración de retención, páginas de historia permanente
  con su ficha fechada, buscador `tsvector` + GIN, y separar ventana de
  estimación (30–90 d) de la de agrupamiento (72 h). 1–2 semanas.
- **Regla por cadencia (2):** se implementa cuando `2.1` tenga 30 días de serie
  — cae a mitad de esta etapa por sí sola. 2–3 días.
- **Punto ciego (3):** rotular lo no medible con el número, adoptar énfasis con
  su límite escrito, y recalibrar o declarar las ramas 1 y 3. 3–5 días, más la
  actualización de `/transparencia` y del doc del modelo.
- **Lo que se decida sobre Infobae, La Libertad y las dudas cortas:** días
  sueltos cada una.

# ETAPA 4 · Pulido de producto final — el cierre

- **Catálogo:** escribir a Korraleja o El Meridiano por Sucre (lo único que lo
  abre); otra vía de feed para los cuatro parados (Telemedellín, Telecafé,
  W Radio, Razón Pública si no quedó aceptado); sustituir las fuentes 404/503 de
  las fichas; los seis internacionales sin feed que bloquean F1-16.
- **Eficiencia:** escribir solo lo que cambió en cada ciclo (H4 — hoy son
  ~447 000 escrituras diarias para ~1 500 historias nuevas); evaluar la región
  `bog` de Fly (I-10).
- **Interfaz:** las historias sin imagen según la duda 3, el pie corrido (duda
  1, con `npm run mirar` como juez), y la revisión móvil del mapa cartesiano.
- **Papeles en regla:** DUDAS_ABIERTAS y los memos reflejando lo decidido, y la
  página de metodología al día con el modelo final.

---

# LA LISTA DE CIERRE — qué significa «terminado»

El producto se declara terminado cuando todo esto sea verdad a la vez, y cada
línea es comprobable sin interpretar:

1. **Autosuficiente:** un push a `main` publica cliente Y motor sin ningún gesto
   manual; los cinco vigilantes tienen timbre que llega a una bandeja leída; la
   copia avisa de su propia ausencia; el desfase es imposible de ignorar
   (handshake en el cliente).
2. **Sin cola de decisiones:** los ocho puntos de la Etapa 1 tienen su línea en
   `DECISIONES.md`, ejecutada o descartada con motivo.
3. **El modelo dice la verdad de sí mismo:** lo no medible está declarado en
   pantalla con su número; ninguna señal afirma más de lo que su prueba prueba.
4. **El catálogo está en paz:** ningún hallazgo `roto` con más de 30 días sin
   nota; los permanentes, `aceptado` con motivo; 33 de 33 departamentos o la
   ausencia de Sucre declarada como decisión.
5. **Las fichas cubren la afirmación central:** la banda cuya tasa sostiene el
   modelo de puntos ciegos no es la menos documentada del catálogo.
6. **Eficiente:** las escrituras por ciclo son proporcionales a lo que cambió,
   no al corpus.

## Cómo se sabe que esto avanza

Igual que siempre: **este documento no lleva la cuenta, la lleva `MINUTA.md`.**
Cada tarea cerrada se anota allí con fecha y desenlace; cada cosa que se decida
no hacer, también, con su motivo. Cuando la lista de cierre sea toda verdad,
este archivo se marca cumplido y no se toca más.
