# Plan de lanzamiento del MVP — desde el 2026-09-22

**Sucede a `PLAN_PRODUCTO_FINAL.md`**, como aquel sucedió a `PLAN_CONTINUIDAD.md`.
De aquel quedan abiertas pocas filas, y cada una aparece aquí con su número
entre paréntesis. Sus tablas llevan desde hoy la columna «Estado al 22-09»,
comprobada contra `origin/main`, el código y `gh`.

**Qué cambia de horizonte.** El plan anterior perseguía el producto
*terminado*, y su lista de cierre no tiene fecha porque depende de corpus y de
firmas. Este persigue algo más corto y con fecha: **salir a la calle**, es
decir, promocionar el sitio y aguantar lo que eso trae. El MVP no es el
producto terminado. Es el punto a partir del cual un error deja de ser un error
privado y pasa a ser uno público. Por eso casi todo lo que sigue va sobre qué
afirma el sitio y qué pasa cuando alguien lo pone a prueba, y muy poco sobre
funciones nuevas.

**Qué no está aprobado.** Las fechas son una propuesta. Las decisiones marcadas
**Jose** son suyas, y las de juicio editorial se firman (ver
`PROTOCOLO_JUICIO_EDITORIAL.md`): aquí se ponen la evidencia y las opciones, no
el veredicto. La cuenta de lo pendiente la sigue llevando `MINUTA.md`.

> **Avance del 2026-09-22, el mismo día en que se escribió.** Todo lo de
> código de M0 y M1 está hecho y en PR, a falta de fusionar:
>
> | Tarea | Estado | Dónde |
> |---|---|---|
> | M0.1 desfase del bot | ✅ en producción | PR #40 |
> | M0.2 migración + PR #37 | ✅ en producción | — |
> | M0.3 issues #4 y #5 | ✅ cerrados | — |
> | M0.4 aviso del techo | 🔶 el aviso ya cuenta lo que expulsa. **El techo de 8 000 deja fuera ~29 % de la ventana: decisión de Jose** | PR #43 |
> | M0.5 «sin medir» y «no noticioso» en `/transparencia` | ✅ en PR | PR #44 |
> | M0.6 enlaces que caducan | ✅ los multifuente sobreviven; la 404 dice por qué | PR #42 |
> | M1.1 firmas | 🔶 decididas VOZ −0,80, Colombia Informa −0,55 y el rumbo de Semana (+0,70). **Falta la revisión externa, aplazada por Jose** | PR #41 |
> | M1.2 analítica / M1.3 privacidad | ⏳ decisiones de Jose | — |
> | M1.4 capacidad | ✅ **de 2 a 12 visitas/s** con la caché de respuestas; quedan el pool de conexiones y un fallo de red hacia Fly | PR #48, `SIMULACRO_TRAFICO.md` |
> | M1.5 móvil | ✅ el mapa ya muestra el espectro entero; `mirar` incluye `/noticia` | PR #45 |
> | M1.6 accesibilidad | ✅ de 146 fallos a 0 (con #44); `npm run accesibilidad` | PR #46 |
> | M1.7 lo que se promete / M1.8 panel no noticiosos | ⏳ Jose | — |

---

## Dónde estamos, en un párrafo

El producto funciona y está en el aire desde el 30 de julio. Tiene 78 medios, 77
feeds respondiendo, 29 de 33 departamentos, páginas de noticia y metadatos
renderizados en servidor, tarjeta social con reparto por espectro, archivo de 30 días, siete
vigilantes programados y un aviso de desfase visible al lector. De la ingeniería
de fondo del plan anterior está hecho casi todo: 21 de 29 filas. **Lo que separa
esto de un lanzamiento no es código, son cuatro cosas:** que el despliegue vuelva
a estar al día (hoy no lo está), que entre lo decidido el 16-09 (PR #37), que lo
que el sitio afirma sobre los medios esté firmado en la parte que más se va a
discutir, y que antes de traer gente sepamos medir su llegada y cuánta aguanta
la máquina.

---

## El criterio de orden, en una frase

**Primero, que lo que ya está en el aire sea verdad y esté al día. Después, lo
que se va a leer y discutir en cuanto haya tráfico. Después, lo que dan los
datos de un mes. Y solo entonces se sale: primero a un círculo pequeño y luego
a la calle.**

---

# FASE M0 · Suelo firme — del 22 al 30 de septiembre

Objetivo verificable: **`main`, Fly y Vercel sirven lo mismo; la PR #37 está en
el aire; no hay issues de vigilante sin leer.**

| # | Tarea | Origen | Quién | Cuánto |
|---|---|---|---|---|
| M0.1 | **Que el desfase deje de volver cada semana.** Los commits del bot de auditoría y del centinela tocan `auditoria/*.json` y `centinela/estado.json`, que entran en la imagen, pero no disparan `desplegar-motor.yml`. Hay dos salidas limpias, y hay que elegir una: sacar esos ficheros de la huella del desfase y de la imagen, si el motor no los lee en tiempo de ejecución, o hacer que esos commits disparen el despliegue. Después, cerrar el #38 | 0.2, #38 | código | medio día |
| M0.2 | **Correr `npm run db:migrate` contra producción y fusionar la PR #37**, en ese orden: `sources.bias` es `NOT NULL` en la base que corre, y el motor nuevo sin la migración no persiste | MINUTA 16-09 y 18-09 | **Jose** (migración y fusión) | 20 min |
| M0.3 | **Leer y cerrar el issue #4 del centinela**: la esquela de Chocó 7 Días, Telecafé y Diario del Norte, y las dos piezas de La Libertad del 21-09. Cerrar también el #5, la auditoría del 27-08, que el libro ya concilia pasada a pasada | 0.10 | **Jose** | 30 min |
| M0.4 | **El aviso `RECORTADA POR EL TECHO` que parpadea.** Mover el umbral a donde signifique algo (el estrechamiento a ~62 h), o pasarlo a la serie. Un vigilante que parpadea se ignora | MINUTA, punto 27 | código | 2 h |
| M0.5 | **Metodología al día con la PR #37**: que `/transparencia` explique «sin medir» y «no noticioso» con el mismo nombre que usa el mapa. Comprobar con `mirar` y abriendo la captura | 4 (papeles) | código | medio día |
| M0.6 | **Comprobar que un enlace compartido no se muere.** Tomar tres historias multifuente de hace 10 días y comprobar que responden y se leen. Comprobar también qué ve quien abre una de un solo medio que ya caducó. El 31-08 esto era un 404, y el archivo de la Etapa A dice que ya no debería serlo | PLANEACION, mercadeo, punto 2 | código | 1 h |

# FASE M1 · Lo que se va a leer — del 29 de septiembre al 17 de octubre

Objetivo verificable: **lo que el sitio afirma de los medios que más se van a
discutir está firmado; se puede medir la llegada de gente sin perfilarla; se
sabe cuánto aguanta la máquina; y el sitio se ha mirado en un teléfono.**

| # | Tarea | Origen | Quién | Cuánto |
|---|---|---|---|---|
| M1.1 | **Una tanda de firma antes de salir.** Hoy hay 5 fichas firmadas de 65, y ninguna de izquierda: es el flanco que el estudio de mercadeo señaló el 31-08. **Qué medios y cuántos lo decide Jose.** Como insumo, dos criterios que no se excluyen: los medios que más gente lee (la lista de audiencia del Reuters Institute cubre 13) y al menos uno de cada bloque, para que nadie pueda decir que solo se firmó un lado. Cada firma pone `reviewedAt` en el registro. Así también quedan firmados los números dictados el 16-09 | 2.5, 3.5, F1-13 | **Jose** firma; el código prepara el expediente de cada una | 2–3 sesiones de Jose |
| M1.2 | **Analítica sin perfilado.** La decisión es de Jose: Plausible, Umami o la de Vercel, todas sin cookies. Lo que no encaja es Google Analytics, en un sitio que habla de manipulación. Después hay que ponerla, ajustar la CSP y declararla en `/transparencia/datos`. Con ella se desbloquea `utm_*` en el texto que se comparte (decisión del 15-09) | PLANEACION, mercadeo, punto 5 | **Jose** decide; código | 1 día |
| M1.3 | **Aviso de privacidad completo (Ley 1581).** `/transparencia/datos` ya dice qué se guarda y cómo pedir el borrado, pero **no nombra al responsable del tratamiento**. Con promoción crecerá la lista de espera del boletín, y con ella los datos personales. Hay que nombrar al responsable, poner la finalidad y un canal. Si se añade analítica, decir también qué mide | ROADMAP, F3-05 | **Jose** (quién es el responsable); código | medio día |
| M1.4 | **Saber qué número rompe la máquina.** Una prueba de carga contra la portada y contra `/noticia/:id` en una máquina de Fly igual a la de producción, no contra producción. De ahí salen dos números: las peticiones por segundo que aguanta y el primer síntoma de que se está rompiendo. Con eso se escribe una receta de una página: qué se mira el día que un tuit funcione y qué se escala (`fly scale`). Aprovechar para evaluar la región `bog` (I-10) | PLANEACION, mercadeo, punto 6; Etapa 4 | código | 1–2 días |
| M1.5 | **Mirar el sitio en un teléfono.** El mapa cartesiano, `/noticia` con sus tres columnas (F3-04) y el mapa mediático. Añadir `/noticia/:id` a las rutas de `mirar`, que hoy lo deja fuera | F3-04, Etapa 4 | código, y **Jose mira** | 1 día |
| M1.6 | **Una pasada mínima de accesibilidad.** Pasar axe por las diez rutas de `mirar`, arreglar lo grave (contraste, etiquetas, foco al cambiar de ruta) y dejarlo como comprobación. No es la auditoría completa de F3-11, pero es lo que un lanzamiento público no se puede saltar | F3-11 | código | 1–2 días |
| M1.7 | **Lo que prometemos al salir.** Un párrafo para el lanzamiento, y la portada coherente con él. Se promete lo que ya se sostiene: **el reparto por espectro de cada historia y quién es dueño de quién**. No se promete el punto ciego como función insignia: la izquierda está declarada «no medible» y el énfasis tiene ceguera direccional escrita. Prometerlo es lo único que podría costar credibilidad de verdad | PLANEACION, mercadeo | **Jose** escribe; código ajusta la portada | medio día |
| M1.8 | **El frente estético y el panel de los no noticiosos.** El panel está decidido y espera al frente estético de Jose. **Hay que decidir si entra en el MVP o va después.** Si no entra, los seis no noticiosos siguen accesibles desde la nota del mapa, que ya los nombra | MINUTA 16-09 | **Jose** decide | — |

# FASE M2 · Los datos de un mes — del 1 al 24 de octubre

Casi todo esto ya tenía fecha. Se agrupa aquí porque **cae justo antes del
lanzamiento**, y lanzar con estas re-mediciones sin hacer sería salir con números
que ya sabemos que se van a mover.

| # | Fecha | Tarea | Origen | Quién |
|---|---|---|---|---|
| M2.1 | 2 oct | **Regla uniforme por cadencia**, con 30 días de `cadencia_piezas`. Y **medir el tamaño de la base**: si pasa de ~300 MB, hay que decidir | 3.9, MINUTA 21 | código, y Jose si pasa de 300 MB |
| M2.2 | 1 oct | **Vorágine.** La pasada del 17-09 lo volvió a dejar roto, con 222 h sin pieza. Siendo «no noticioso», decidir si su cadencia es su oficio (`aceptado` con nota) o un feed averiado | 3.6, MINUTA 22 | **Jose** |
| M2.3 | principios de octubre | **Re-medir RTVC** con ~30 días de su feed propio, y compararlo con la previsión del 08-08 | MINUTA 28 | código mide, **Jose** firma |
| M2.4 | 13 oct | **Telecaribe y W Radio**: vence su `aceptado`. W Radio dejó de publicar texto hacia el 01-09. Si no volvió a escribir, se decide si sigue en el catálogo, que fue la condición de Jose en el punto 7 | MINUTA 23 | **Jose** |
| M2.5 | mediados de octubre | **Re-medir Colombia Informa** con un mes sin catástrofe en el corpus | MINUTA 29 | código mide, **Jose** firma |
| M2.6 | cuando haya ciclo | **Volver a medir el aislamiento** de los seis medios de izquierda de raíz plana, ahora con las marcas de opinión puestas | MINUTA 25 | código |
| M2.7 | antes del 24 oct | **Cerrar las fuentes rotas de más de 30 días**: El Pilón y Boyacá Digital (404, desde el 20-08). Sin esto no se cumple la línea 4 de la lista de cierre, y es trabajo de ficha | Etapa 4 | código |

# LA SALIDA · En dos pasos

**Revisión de la puerta: martes 27 de octubre.** Se pasa la lista de abajo, y
cada línea es comprobable. Si una falla, se corre la fecha; la lista no se
recorta.

1. **Salida discreta: del 27 de octubre al 9 de noviembre.** El enlace va a un
   círculo pequeño que Jose elija: periodistas, académicos, gente que va a
   criticar. Aquí se estrena de verdad el procedimiento de objeción de un medio
   (acuse en 5 días, respuesta en 15, publicación junto a la ficha). Y se mira
   la analítica para saber si la gente vuelve.
2. **Lanzamiento público: martes 10 de noviembre**, si la salida discreta no
   dejó nada que arreglar antes. Si lo dejó, se arregla primero y se pone
   fecha nueva.

## La lista de la puerta — qué significa «MVP listo»

1. **Al día:** `main`, Fly y Vercel sirven el mismo commit, y el vigilante del
   desfase lleva **14 días seguidos en verde**.
2. **Sin pendientes de vigilante:** ningún issue de vigilante abierto con más de
   7 días sin comentario de Jose.
3. **Lo decidido está en el aire:** la PR #37 está fusionada y la metodología
   dice «sin medir» y «no noticioso».
4. **Lo discutible está firmado:** la tanda de M1.1 está firmada, con
   `reviewedAt` en el registro, e incluye al menos un medio de cada bloque.
5. **Lo que se promete se sostiene:** ninguna frase del lanzamiento ni de la
   portada afirma una señal que la metodología declare no medible.
6. **Se puede medir sin perfilar:** la analítica está puesta y declarada, y el
   aviso de privacidad nombra al responsable.
7. **Se sabe cuánto aguanta:** el número de la prueba de carga y la receta del
   día del pico están escritos.
8. **Se ha mirado:** `mirar` sale 10/10 más `/noticia/:id`, con
   `VITE_API_URL=same-origin` y la captura abierta, también en móvil. Y axe no
   da nada grave.
9. **El catálogo está en paz:** ningún hallazgo `roto` con más de 30 días sin
   nota.

---

# DESPUÉS DEL MVP — lo que no bloquea salir

Se deja escrito para que nadie lo meta por la puerta de atrás antes del 10 de
noviembre.

- **Diciembre, con fecha:** revisar la opción B del archivo permanente: página
  por historia, ficha fechada y buscador, a 25 USD/mes (MINUTA 24). La
  analítica de la salida dirá si alguien busca.
- **El boletín de verdad (F3-05):** con proveedor de correo, y solo cuando
  M1.3 esté hecho.
- **Los internacionales en inglés:** NYT, FT y Reuters esperan a la capa de
  equivalencia de titulares entre idiomas, que es motor nuevo (decisión del
  16-09).
- **Sucre:** sigue sin abrirse hasta que alguien escriba a Korraleja o a El
  Meridiano. El MVP sale con 29 de 33, y la ausencia está declarada.
- **La banda «Derecha» vacía (F1-12):** es un defecto del instrumento, no un
  retrato del país. Se trabaja con fichas y firma, no con el umbral.
- **F1-17 (insistencia), F3-07 (dieta informativa) y F2-08 (tipos y Zod):**
  mejoras, no condiciones.
- **Las dudas 5, 6 y 9 de `DUDAS_ABIERTAS`:** la cifra de patrocinio, las
  moderadas huérfanas y Google News.

# LO QUE NO SE HACE PARA LLEGAR A TIEMPO

- **Recortar la lista de la puerta.** Si una línea falla, se mueve la fecha.
- **Bajar el umbral del punto ciego para tener algo que enseñar el día del
  lanzamiento.** Está descartado desde el estudio.
- **Firmar por delegación.** Que un modelo esté de acuerdo no vale como firma
  (`PROTOCOLO_JUICIO_EDITORIAL.md`).
- **Ampliar el catálogo antes de salir.** El medio 79 no mueve nada. Que lo que
  se afirma de los 78 sea cierto, sí.

## Cómo se sabe que esto avanza

Como siempre: **la cuenta la lleva `MINUTA.md`.** Cada tarea que se cierra se
anota allí con su fecha. Este plan solo cambia si cambia una fecha o entra una
decisión, y cuando pase la puerta se marca cumplido.
