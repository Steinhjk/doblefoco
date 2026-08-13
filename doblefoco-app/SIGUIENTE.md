# Por dónde seguir

## Lo del 13 de agosto

### El Tolima ya tiene voz: alta de El Nuevo Día (Ibagué)

Rama **`alta-el-nuevo-dia`**, dos commits, **sin fusionar todavía**. Catálogo
65 → **66 medios**, 53 colombianos. Departamentos con voz propia viva: 20 → **21**
—sin contar Bogotá D.C.—. Feed probado: 200, **10 de 10 ítems en ventana, mediana
5,9 h**.

**LO IMPORTANTE NO ES EL ALTA, ES LO QUE NO SE MARCÓ.** La nota del barrido decía
«es de la familia Galvis, la de Vanguardia — si entra, hay dueño compartido que
marcar». **Es falso hoy**, y comprobarlo era el trabajo:

- La sociedad que Galvis cofundó en 1992, **Editorial Aguasclaras S.A.**, consta
  **EN LIQUIDACIÓN JUDICIAL con la matrícula cancelada** (NIT 800052169). El
  impreso cerró el 22-10-2023.
- Lo que publica hoy es **EL NUEVO DÍA DIGITAL S.A.S.**, otra sociedad, que no
  publica NIT, ni socios, ni representante legal.
- **No hay ni un documento que enlace las dos.** Con `controlGroup: 'galvis'` el
  mapa de concentración *afirmaría* que Vanguardia y El Nuevo Día responden a la
  misma familia. No se marca; la pista queda escrita en `mediaOwnership.js`.

Es la **regla del presente por tercera vez en una semana** —tras Semana y tras EL
DIARIO— y la primera que sirve para **no añadir** un vínculo en vez de para
quitarlo. Y otra vez pagó no copiar la ficha vieja: la del 9 de agosto se cerró
sin número por la liquidación y dejó escrito qué la reabriría. Pasó exactamente
eso.

**Lo que NO cierra:** el NIT de la S.A.S. no está en ninguna fuente abierta que
responda, así que el certificado de la **Cámara de Comercio de Ibagué** es el
noveno pendiente manual. Y **Ecos del Combeima sigue vivo como alta condicionada**:
esta alta no lo sustituye.

### El catálogo público decía que 18 medios tienen 0 % de rigor factual

Salió al regenerar el catálogo con el medio nuevo. `fmtFactuality` no miraba el
tipo, así que `factuality: null` se imprimía **«factualidad 0%»** — la peor nota
posible, con nombre y apellidos, sobre medios a los que no se ha medido nada.

**No lo detectaba nada, y la razón importa:** `check:registry` compara el archivo
generado contra `renderCatalog()`, y los dos producían el mismo 0 %. Una
comprobación de coherencia no ve un error que está en el generador.

La interfaz ya lo hacía bien —`fmtPct` en `MediaMap.jsx` dice «sin medir»—, así
que era además una divergencia entre el mapa y el catálogo. Arreglado con la misma
palabra y con cuatro pruebas en `scripts/generateCatalogDoc.test.mjs`. **490
pruebas** en verde.

### EL DIARIO de Boyacá se cayó, y no es cosa nuestra

`check:feeds` lo da con **0 ítems** un día después de darlo de alta. El diagnóstico
está hecho y **el fallo es suyo**: `curl` da exit 6 —no resuelve el host— y el
resolver público de Google devuelve *«Name servers did not respond
[63.250.39.105]»* en la delegación de `eldiarioboyaca.com`, mientras
`viveelmeta.com` resuelve bien desde el mismo sitio. **Sus servidores de nombres
están caídos.**

**Decisión de Jose: no se toca el catálogo, se vigila.** Boyacá conserva voz con
Boyacá Digital. Revisar en unos días; si no vuelve, buscarle otra vía —no se mutea
a nadie—.

> Y esta vez se comprobó contra un resolver externo **antes** de escribir la nota,
> que es justo lo que no se hizo con la tilde del User-Agent ni con el 504 de
> Wikidata.

### Lo siguiente en esta rama, si se sigue por aquí

1. **Fusionar** `alta-el-nuevo-dia`, y antes `fichas-tramo-prioritario-y-barrido`,
   que sigue pendiente. Orden de siempre: `main` (Vercel) → `npm run deploy`
   (Fly) → recategorizar.
2. Del barrido quedan **Cablenoticias** (decisión de producto: es el canal donde
   emite Noticias Uno, que aporta cero), **La Nación (Neiva)** y **Diario La
   Libertad (Barranquilla)**.
3. **`prensaescrita.com`**: la nota falsa sigue en `cosecharMedios.mjs`.
4. **Los 16 dominios del día 11**, los únicos que pudo marcar mal el User-Agent.

---

## Lo del 12 de agosto, por la tarde

### Las 20 fichas del tramo prioritario están escritas

**Jose las revisa hoy con Kimi K3 y Fable 5.** Eran 2 de 20 por la mañana. La cola
completa, con qué propone cada una y cinco preguntas que atraviesan varias, está en
**`revision-externa/pendientes.md`**.

**Ninguna propone firmar.** Cinco se cierran con búsqueda documental —Noticias RCN,
La FM, El Colombiano, Semana y La Opinión necesitan tres a cinco piezas fechadas del
último año—, y la de Semana es la más cerca de firmarse de todo el catálogo: le falta
cambiar una frase y añadir cinco enlaces.

**Lo que salió al escribirlas, y no se resuelve ficha por ficha:**

- **«Fiscalizar al poder» se resuelve de tres formas distintas** en el catálogo:
  Chocó 7 Días va a la mixta porque «denunciar al poder es el oficio y no una
  orientación»; Noticias Uno está en −0,40 justamente por eso; La Silla Vacía en
  −0,10 por lo mismo sin decirlo. **Las tres no pueden tener razón.**
- **Los siete diarios regionales están todos a la derecha**, de +0,15 a +0,35. Si el
  criterio es «familia empresarial regional → derecha moderada», eso es la regla 5.1
  al revés y hay que escribirlo o sustituirlo por evidencia.
- **Los trece internacionales están clasificados en el eje de su país**, no en el
  colombiano. Nadie ha justificado la traslación.
- **Noticias Uno es el caso de El Espectador otra vez**, con la mitad de la
  justificación histórica, la propiedad sin cerrar y cero corpus — y con el valor más
  extremo del catálogo.

**Nuevo: `npm run conducta`** mide la conducta de nivel 2 —agenda propia, compañía
media, con quién coincide— y `revision-externa/CONDUCTA-MEDIDA.md` explica **por qué
hoy casi no discrimina**: tres días, corpus dominado por el terremoto, y compañía
media saturada entre +0,08 y +0,19 para los veinte. Si un revisor la usa para mover
un número, es una objeción válida contra la ficha.

### El barrido nacional está hecho, y estaba bloqueado por nuestra propia consulta

Detalle en **`BARRIDO_2026-08-12.md`**. Wikidata nunca estuvo caído: el 502 y el 504
los daba **nuestra** consulta, demasiado pesada para el límite de tiempo del
endpoint. Partida en siete —una por tipo— con reintentos, pasa. **103 candidatos
nuevos, 40 con feed vivo.**

**Es el mismo error de diagnóstico que la tilde del User-Agent, en la misma semana:
las dos veces el fallo era nuestro y la nota culpaba al otro lado.** Y de paso queda
comprobado que **`prensaescrita.com` responde 200** — la nota del código que decía
que nos bloqueaba era falsa y está corregida.

**Lo que hay que hacer con eso:**

1. **El Nuevo Día (Ibagué) publica cada dos horas** y está fuera del catálogo. **Es
   el único candidato que desbloquea un departamento entero, el Tolima.** Ojo: es de
   la familia Galvis, la de Vanguardia — si entra, hay dueño compartido que marcar.
2. **Cablenoticias publica cada hora**, y es el canal donde emite Noticias Uno, que
   hoy aporta cero artículos.
3. **La Nación (Neiva)** cada 4 h y **Diario La Libertad (Barranquilla)** con 50
   ítems al día. No desbloquean departamento; añaden voz donde hay una sola.

### Dos arreglos pequeños que evitaban avisos en falso

- **`check:registry` daba falsa alarma en Windows**: comparaba cadenas exactas y git
  deja el catálogo con CRLF tras un checkout, así que anunciaba «desactualizado» un
  archivo idéntico. Pasó dos veces hoy. Ahora normaliza los saltos de línea.
- **La política de propiedad desconocida ya es política**, no caso por caso: ver
  `DECISIONES.md` del 2026-08-12.

---

## Los tres que faltaban ya están dentro (2026-08-12)

**Fusionado y en producción**, con el orden de siempre: `main` (Vercel) →
`npm run deploy` (Fly, commit `540e95c`) → recategorizar. Fly va por 63 feeds con
60 OK y **cero caídos**. En el mapa, Caquetá pasó de 1 historia a 3, Meta de 23 a
25 y Boyacá de 19 a 26.

Rama **`altas-boyaca-meta-caqueta`**. **EL DIARIO de Boyacá, Vive el Meta y
Lente Regional** entran con `ownerType: null` declarado con fecha. **Meta y
Caquetá dejan de estar en blanco**: de 18 departamentos con voz propia viva a
**20**. Catálogo: 62 → **65 medios**, 52 colombianos, cero firmados.

**No se copió ninguna ficha: se comprobaron los tres sitios de campo el día 12.**
Y esa decisión pagó sola:

- **La ficha de EL DIARIO había caducado en tres días.** Daba como nivel 1 a un
  cofundador que seguía dirigiendo, y hoy su web no menciona a ninguno de los dos
  nombres que citaba. Cambió de manos en junio: **Ricardo Rodríguez Puerto lo
  dirige y además compró participación accionaria a la familia propietaria**
  ([Orfetv, 17-06-2026](https://www.orfetv.com/2026/06/17/el-periodico-el-diario-inicia-una-nueva-etapa/)).
  La regla del presente no va solo de los años noventa.
- **Vive el Meta sí declara su editora**, y la ficha lo daba por desconocido:
  «La persona jurídica **Grupo La Independencia S.A.S** es propietaria y editora
  de viveelmeta.com», NIT 901092043-9, en tres páginas suyas. Quién controla esa
  sociedad sigue sin constar — es el caso de Pulzo a escala departamental.
- **Lente Regional** nombra a cinco personas con cargo y a ninguna como
  propietaria. Sin razón social ni NIT: no hay ni por dónde entrar al registro.

**Los tres entran en 0,00 por la Regla 2** —ausencia de evidencia, no evidencia
de equilibrio—. EL DIARIO venía con +0,20 propuesto por analogía con los diarios
comerciales regionales y **se descartó la analogía**: aquellos son sociedades
conocidas y de este no se sabe ni cuál lo edita. Decisión de Jose.

Verificado: 486 pruebas, lint, typecheck, `check:registry` limpio, `docs:catalog`
regenerado y los tres feeds probados con `check:feeds` —200, dentro de ventana,
medianas de 16 h, 42 h y 41 h—. La CSP lleva sus tres dominios; de paso quedó
ordenada alfabéticamente, sin perder ninguna entrada de las 124 anteriores.

**Lo que NO se cerró:** los tres certificados de Cámara de Comercio —Tunja,
Villavicencio y Caquetá— siguen siendo trámite manual. El de Villavicencio es el
más fácil, porque el NIT ya está en la mano.

---

## Fusionada y desplegada (2026-08-12)

`fichas-propiedad-ausencia-y-altas` está **en `main` y en producción**. Se
verificó antes de fusionar —486 pruebas, lint, typecheck, `check:registry` sin
errores de integridad y `npm run build` limpio— y se siguió el orden escrito:
`main` (Vercel) → `npm run deploy` (Fly) → recategorizar.

- **Fly va por el commit `d2141e0`**, el mismo que `main`. Sin desfase.
- **Ingesta viva**: 56 feeds OK, **cero caídos**, última pasada 11:50 UTC.
- **Recategorización aplicada** sobre 6 794 artículos y 5 479 historias. El
  reparto salió idéntico al que ya había en base salvo la corrección de **EFE
  como medio español** —Fly venía ingiriendo sin EFE en el registro, así que su
  país caía al valor por defecto—. Eso es exactamente lo que este paso viene a
  arreglar y por lo que va después de Fly, no antes.
- Comprobado en producción: portada, `/medios` y `/api/departamentos` responden
  200 y con contenido coherente.

**Dos números para mirar con calma, que NO los trae este despliegue** —ya
estaban en base y siguen igual—:

- **Desastres se lleva el 37 %** del corpus (2 505 de 6 794). El terremoto copa
  la portada entera, así que puede ser real; conviene confirmarlo cuando el
  hecho envejezca, no ahora.
- **El 29 % de los artículos se queda sin tema** (1 997), y un 14 % entra solo
  rescatado por señal débil.

---

## PENDIENTES ABIERTOS (2026-08-11)

Los dos que Jose pidió anotar al cerrar, antes que nada de lo demás:

1. **Enviar las fichas a las IAs externas.** Lo hace Jose, con modelos de ventana
   grande. El circuito está montado en `revision-externa/` y **no se ha enviado
   nada**: hay 17 fichas con valor propuesto y `respuestas/` está vacía. Los
   medios grandes —Noticias Caracol, El Tiempo, Semana, Caracol Radio, Noticias
   RCN, La FM— **no tienen ficha que enviar**. Detalle en
   `revision-externa/pendientes.md`.

2. **La categoría de canales de YouTube.** Una categoría con los canales
   distribuidos. Se habló en una sesión anterior y no quedó nada escrito; el hilo
   reconstruido está en **`PLANEACION.md`**, con lo que falta preguntar y lo que
   ya se sabe del terreno.

**Y a partir de ahora, lo que se hable de planeación se anota en
`PLANEACION.md` en el momento**, no al cerrar. Justo por lo que pasó con lo de
YouTube.

---

## Lo del 11 de agosto, por la tarde

**Rama `fichas-propiedad-ausencia-y-altas`** — fusionada el 2026-08-12, ver
arriba. Cinco commits, 486 pruebas en verde, lint y typecheck limpios.

**La ausencia de dueño se declara con fecha.** `ownerType: null` pasa a ser un
estado válido si la ficha dice dónde y cuándo se buscó y qué documento cerraría
el hueco; lo exige `check:registry`. La regla vieja —dar de alta obliga a
declarar dueño— dejaba departamentos en blanco por no saber. **Quedan por
reevaluar EL DIARIO de Boyacá, Vive el Meta y Lente Regional**, que están fuera
por ese motivo y hoy podrían entrar.

**«Mayor cobertura» es audiencia, no volumen** (aclaración de Jose). Nuevo
`shared/audiencia.js` con el Digital News Report del Reuters Institute, sacado de
los CSV de sus gráficos. Tramo prioritario de 20 fichas con **dos grados de
certeza marcados**: 13 medidas y 7 estimadas por volumen propio. Ningún estimado
adelanta a un medido.

**Tres altas: Pulzo, La Razón.co (Montería) y la ingesta de EFE.** Pulzo es el
cuarto medio más consumido del país y faltaba: lo destapó cambiar el criterio de
orden. Su propiedad **no se cerró** —sus tres fuentes públicas se contradicen— y
por eso NO lleva `controlGroup`; ver `fichas/pulzo.md`.

**El despliegue ya se hizo** el 2026-08-12, en ese orden. Los tres medios nuevos
están dentro.

**El punto flojo:** EFE va por Google News con mediana de 41 h y enlaces a
`news.google.com`. Sus feeds propios están desactivados en el servidor; su API
REST de WordPress sería mejor vía, pero el motor solo lee RSS.

---

Nota de traspaso del **2026-08-11**, escrita al cerrar la sesión de la mañana.

Todo está en `main`. **460 tests** en verde, lint y typecheck limpios, árbol
limpio. **Vercel y Fly desplegados**, base migrada, portada y mapa verificados en
producción con captura y sin errores de consola.

No queda nada a medias. Lo de abajo es trabajo nuevo, no arrastre.

---

## Qué se hizo el 10 de agosto, y por qué

Empezó con una pregunta de Jose: el terremoto del Chocó, con 111 muertos, no era
portada. Resultaron ser tres cosas distintas, en tres capas.

**1. Nada envejecía.** El orden era `medios DESC, published_at DESC`: la fecha
solo desempataba. El radar mostraba a Jorge Messi y un ataque con drones, ambos
de dos días antes. → `shared/relevancia.js`, vida media de 24 h.

**2. La fragmentación castigaba lo importante.** El terremoto eran 22 medios y
104 artículos repartidos en 20 historias de 3 a 7 medios. El ranking cuenta
medios *por historia*, así que un hecho grande genera más ángulos, se parte más y
pesa menos cada trozo. Un nombramiento, que solo admite una forma de contarse,
ganaba con 8 limpios. → `shared/sucesos.js` y la ruta `/api/portada`.

**3. El titular lo daba la pieza más cubierta.** Y esa puede ser una galería de
fotos: el accidente con tres muertas se titulaba «Las últimas fotos de las
turistas colombianas». → `shared/titularDeSuceso.js`.

Y por el camino apareció una cuarta, que era el defecto que Jose veía en la
tarjeta: **los desastres no tenían sección** y se repartían entre trece. →
`desastres` en la taxonomía, y `nombreDeSeccion` en `src/lib/seccion.js`.

Calibración reproducible: `npm run eval:sucesos` y `npm run recategorizar`
(ensayo por defecto los dos).

---

## Lo del 11 de agosto

**El feed estuvo diez horas parado** (01:45–12:10 UTC). `factuality: null` se
decidió válida el día 9 y se aplicó a `stories`, no a `sources`, que es la
proyección del registro: once medios entran sin medir, así que la proyección
fallaba entera y el worker moría con código 1 hasta que Fly se rindió («max
restart count of 10»). No estalló antes porque Fly llevaba sin desplegarse desde
el día 8. **El desfase de despliegue no da números peores: acumula una bomba.**

**La vigilancia lo detectó y no avisó.** Falló en rojo a las 06:53 y nadie lo
vio. Ahora abre un issue con la salida completa y lo cierra sola al recuperarse
— probado de punta a punta en una rama desechable. Mejora *que te enteres*, no
*cuándo*: la ventana sigue siendo de seis horas.

**El departamento ya se persiste.** `stories.departamento` lo calcula la ingesta
y `/api/departamentos` cuenta el catálogo entero, así que el mapa dejó de contar
lo descargado. Va en `stories` y no en `articles` —contra lo que decía esta
nota— porque el detector mira solo el titular de la historia, y persistirlo por
artículo obligaría a cambiar esa decisión.

---

## Valora Analitik, y la tilde que lo bloqueaba

**Alta el 2026-08-11**, a petición de Jose. Medio económico y bursátil, ~51
artículos/día, 11.º del catálogo por volumen. Sesgo **+0,10** —el de Portafolio—,
`factuality: null`, ficha sin firmar.

Lo edita **Valora Inversiones S.A.S.** (NIT 900.811.192-0), de sus dos
fundadores, **sin ningún grupo detrás**. La misma sociedad vende una plataforma
de pago para inversionistas sobre las emisoras que su redacción cubre: está
declarado en la ficha como desvelamiento, no como acusación.

**Figuraba «sin feed», y el problema era nuestro.** El User-Agent llevaba una
tilde —«periodística»—, una cabecera HTTP solo admite ASCII y los cortafuegos la
rechazaban con un 403. Lo peor: quedó escrito como decisión que
«prensaescrita.com nos bloquea y se respeta». **Nunca nos bloqueó.** Sin la
tilde responde 200.

Queda una tarea que sale de ahí: **repasar el barrido de 124 dominios**, porque
no se sabe cuántos candidatos se apuntaron como mudos por esto.

---

## El titular que no se actualizaba

Jose lo vio en el terremoto: la portada decía «71 muertos» cuando las piezas de
esa misma historia ya iban por 111. El titular salía del medio **más cercano al
centro sea cual sea su hora**, así que en un hecho en desarrollo se congelaba en
lo que ese medio dijo primero. Medido: el 40 % de las historias multifuente
llevaba más de una hora de desfase, el 18 % más de seis, y la peor 58,8 h.

Ahora se elige el más centrado **de entre los recientes**, con ventana de 6 h
calibrada. Después del arreglo: **0 % por encima de seis horas** y el retraso
medio baja de 4,24 h a 45 minutos.

**Desacoplado del id a propósito**: `storyId()` deriva el id del titular, y ese
id es la URL. Si el titular arrastrara el id, cada actualización renombraría la
historia y rompería los enlaces. El id sigue anclado al más centrista de todos.

**Lo que queda de eso, y es decisión de producto:** dos sucesos del terremoto
conviven diciendo «111 muertos» y «169». Su similitud es **0,200** contra un
umbral de **0,22** — se quedan a dos centésimas. Lo que los separa son las
cifras: el tokenizador conserva los números porque «distinguen hechos», cierto
para fechas, pero **en un balance de víctimas el número cambia precisamente
porque es el mismo hecho actualizándose**. Bajar el umbral reintroduce las
fusiones falsas que costó calibrar; tratar los números aparte afecta al
agrupamiento entero. No se tocó.

---

## Lo primero al volver

1. **Terminar el barrido nacional.** Se hizo con los 16 dominios que el informe
   nombra y aparecieron dos que sí publican: **larazon.co** (Montería, Córdoba,
   hace 2 h) y **narinoahora.com** (Nariño, hace 21 h), ambos en departamentos
   que estaban bloqueados. Los otros 124 no se pudieron rehacer:
   **`query.wikidata.org` devolvía 502** las dos veces que se intentó. Reintentar
   `npm run medios:cosechar -- --lista` cuando su servicio vuelva. **El
   2026-08-12 responde 200: ya se puede rehacer.**
2. **La foto del destacado.** Es lo único de la portada del terremoto que quedó
   sin mirar: viene con crédito de Telemedellín y no está claro que sea del
   sismo. Jose lo señaló y no se tocó.
3. **Escribir a El Meridiano** (`elmeridiano.co`). Cubre Córdoba **y** Sucre: un
   solo obstáculo técnico deja dos departamentos sin voz. Sigue siendo lo que más
   desbloquea por menos trabajo.
4. **La afiliación de Ecos del Combeima a Blu Radio.** Decide si el Tolima tiene
   voz propia o una afiliada de Valorem. Está en `fichas/ecos-del-combeima.md`
   como alta condicionada.
5. **Ocho certificados de Cámara de Comercio** — Neiva, Tunja, Santa Marta,
   Villavicencio, Pereira, Arauca, San Andrés, Montería. No se tramitan desde
   aquí.
6. **La FLIP** y sus «Cartografías de la Información», que mapean 141 municipios
   y visitaron justo los huecos del catálogo. Su web daba 502 y 404 el 9 de
   agosto: estaba rota, no bloqueando.

---

## Decisiones tomadas hoy que conviene no volver a discutir

**La vida media son 24 h y está medida.** Cualquier decaimiento barre lo rancio
—el salto está entre «sin decaimiento» y el resto, no entre los valores—. Lo que
separa unos de otros es el monocultivo: a 6 h el top 10 son ocho piezas del mismo
hecho. 24 h además se explica sin enseñar la fórmula, y un parámetro de orden que
no se puede explicar es uno que nadie va a auditar.

**Un suceso agrupa para ordenar y presentar, nunca para fusionar.** Cada historia
conserva su titular y su recuento. **No se bajó el umbral de `clustering.js`**:
está en 0,34 con medición detrás. «Estas piezas hablan del terremoto» y «estas
piezas son el mismo hecho» son afirmaciones distintas, y solo la segunda
inventaría cobertura.

**Agrupamiento por líder, no por encadenamiento.** Un umbral laxo con enlace
simple encadena: A se parece a B, B a C, y C acaba dentro sin parecerse a A.

**El titular se elige por FORMATO, nunca por tema ni por importancia** — mismo
criterio que `contentQuality.js`. Y no se descarta nada: la galería sigue en el
suceso con su recuento; lo único que no puede es dar nombre al conjunto.

**El medoide se probó y se descartó.** Sobre los seis sucesos de 3+ ángulos:
cambiaba el titular en los seis, acertaba en dos y empeoraba en tres. Metía «En
directo: Netanyahu rechaza el plan…» como titular de Gaza. La centralidad mide
parecido, no vocación de titular.

**Los accidentes van en Desastres, la meteorología no se separa.** La forma la
zanjó IPTC Media Topics, el vocabulario de las agencias: su categoría es
«disaster, accident and emergency incident». Separa «weather» por el pronóstico
diario, que aquí no se ingiere —14 artículos en 4 000—. Copiar una división sin
el contenido que la justifica deja una sección vacía.

---

## Dos hallazgos que no estaban previstos

**El vocabulario pesa más que el umbral.** Con el IDF de las 100 historias de una
página, 6 de 19 agrupaciones eran falsas: «Colombia reconoce la soberanía de
Marruecos sobre el Sáhara» se unía a «reconoce soberanía de Israel sobre el
Golán» porque «soberania» salía dos veces en cien y parecía rarísima. Con el IDF
de los 4 684 titulares del corpus, **sin tocar el umbral**, desaparecen las seis.

Es la advertencia que `evalClustering.mjs` ya llevaba escrita —«un IDF sobre 144
titulares no dice lo mismo»— ahora con la medida al lado. Y es la razón de que el
agrupamiento viva en el servidor: el navegador solo descarga la página.

**`category` no es el campo de presentación.** Es la sección heredada del feed, y
`recategorizar.mjs` la conserva intacta a propósito: es el archivo de lo que el
sitio mostró antes de cada migración. Pero cuatro componentes la pintaban como
etiqueta, así que la tarjeta decía «Política» mientras la historia vivía en
Desastres — dos respuestas distintas a la misma pregunta en la misma pantalla.
Ahora se pinta `nombreDeSeccion`, con el mismo orden de preferencia que
`perteneceA` para que no puedan divergir.

---

## Trampas que ya mordieron, para no repetirlas

- **Añadir una sección toca TRES sitios**: `TEMAS` (`shared/topicClassifier.js`),
  `categories.js` y la lámina de `CategoryMark.jsx`. Hay una prueba por cada uno,
  y las tres avisan.
- **«Huracán» es un equipo de fútbol** argentino que la prensa colombiana cubre.
  Está fuera de las listas de `desastres` a propósito, con prueba. Y **«accidente
  cerebrovascular» es un ictus**: por eso «accidente» suelto va como débil.
- **Tokenizar dentro del bucle de comparación es O(n²)** y con miles de historias
  no termina. Está precomputado; no deshacer.
- **Nada de backticks dentro de una plantilla SQL** en `feedStore.js`: rompen el
  template literal y el error que da es un parse error críptico.
- **Lo que el registro produce, el esquema tiene que admitirlo.** `factuality:
  null` era válida en `mediaRegistry` y `NOT NULL` en `sources`, y esa
  contradicción tumbó el feed diez horas. Hay prueba que las compara. Un valor
  que uno genera y el otro rechaza es una caída diferida hasta el despliegue.
- **En YAML, un escalar plano no puede contener `": "`.** Un `run:` de una línea
  con dos puntos y espacio deja el workflow inválido, y GitHub lo reporta como
  una ejecución fallida de 0 s, no como un error de sintaxis. Usa un bloque `|`.
- **`npm run dev:server` INGIERE CONTRA LA BASE DE PRODUCCIÓN.** No hay base de
  desarrollo: `.env.local` apunta a la misma Postgres que Fly, y el servidor
  arranca su propio ciclo de ingesta al levantarse. Levantarlo «para mirar una
  página» escribe artículos reales, y si el registro local va por delante del de
  Fly, deja los dos desincronizados. Pasó el 2026-08-12 y no rompió nada porque
  el despliegue iba detrás; con un cambio de esquema por medio habría sido la
  caída de las diez horas otra vez.
- **Y ese servidor no sirve páginas**: es solo API. El SSR lo hace Vercel, así
  que `curl http://localhost:5000/medios` devuelve «Cannot GET». Para ver una
  pantalla, `npm run dev` o el preview de Vercel.
- **El orden del despliegue importa**: primero `main` (Vercel), luego
  `npm run deploy` (Fly), y la recategorización DESPUÉS de Fly — si no, el worker
  sigue ingiriendo con el léxico viejo.

---

## Lo que no se arregla buscando más

**Amazonas, Guainía y Vaupés no tienen medios web.** Tres búsquedas con ángulos
distintos y ni uno. Allí la comunicación existe y es radio. Un agregador de RSS
no alcanza eso: **no es un fallo del catálogo, es un límite del formato**, y
decirlo en la vista departamental es más honesto que dejar tres departamentos en
blanco como si allí no pasara nada.

---

## La idea apuntada que sigue sin empezar

En un medio de redacción automatizada **la orientación debería ser más medible,
no menos**. En una redacción humana el sesgo se reparte entre personas y días; en
una configurada es una propiedad del sistema. Con corpus suficiente su deriva
debería calcularse más directamente, y **una alteración de su configuración
debería verse como un salto y no como ruido**.

Boyacá Digital es el primer caso de prueba. Está en `shared/mediaRegistry.js`,
junto al campo `redaccion`, que es donde se buscará.
