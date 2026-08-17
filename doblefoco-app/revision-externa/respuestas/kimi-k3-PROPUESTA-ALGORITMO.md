# Propuesta de algoritmo — Kimi K3, cierre del ciclo 1

| | |
|---|---|
| **Modelo** | Kimi K3 |
| **Fecha** | 2026-08-18 (entregada el 2026-08-17) |
| **Qué es** | El documento 21 del ciclo. No revisa una ficha: propone cómo medir el sesgo con un algoritmo, a partir de lo que las 20 revisiones dejaron a la vista |
| **Estado** | **Recibida y sin adoptar.** Ninguna de sus bandas es una medición ejecutada; son proyecciones argumentadas desde piezas fechadas, y el propio documento lo dice |

> **Va LITERAL, sin editar ni resumir**, igual que las respuestas por ficha. La
> lectura crítica está aparte, en `../ciclo-1-conclusiones.md`.
>
> **Procedencia.** Llegó en `.docx`; aquí va el texto extraído de ese archivo. Se
> pierde el formato de Word, no el contenido.

---

## PROPUESTA LITERAL

```
Propuesta de algoritmo aplicado — DobleFoco
Autor: Kimi K3 (revisor externo) · Fecha: 18-08-2026 Base empírica: el ciclo completo de revisión externa de las 20 fichas (documentos kimi-k3-*.md, fichas 01 a 20)

1. Qué demostró el ciclo de 20 fichas
Antes del algoritmo, el diagnóstico. Revisar las 20 fichas con verificación de campo produjo cuatro hallazgos sistémicos que el algoritmo debe resolver:
El patrón sin criterio escrito. Los siete diarios regionales estaban clasificados a la derecha (+0,15 a +0,35) sin que ninguna ficha citara evidencia del presente. La ficha 20 lo formuló: “un revisor externo que lo detecte tumba las siete de una vez”. Tras mi ciclo, los siete tienen evidencia fechada — pero la tuvo que aportar el revisor, no el sistema.
Las lagunas declaradas sin búsqueda. En al menos ocho fichas (03, 11, 13, 14, 15, 16, 17, 20), la ficha declaraba “no hay evidencia” o “no consta” sobre hechos que estaban archivados y eran encontrables en menos de una hora: el endoso de El Heraldo, las series editoriales de El Colombiano, El Universal y Vanguardia, el patrón Postobón de La República, la sucesión Galvis. La laguna era de método, no de mundo.
Cadenas de propiedad vencidas citadas como presentes. Cuatro fichas con titulares fallecidos (03, 17, 18: Ardila Lülle †2021, Gaviria †2021, Galvis †2021), una premisa estructural muerta (16: “El País es del dueño de Semana”, vendido en jun-2025), un medio fantasma (04: W Radio, fusionado con Caracol Radio el 13-01-2026) y una fusión no registrada (03: Carbe, dic-2022). La propiedad se citaba de MOM 2013–2015 o de memoria.
Valores-calibración circular. El subsistema económico (La República, Portafolio, Valora Analitik) y el trío Valorem (Noticias Caracol, El Tiempo, El Espectador) estaban calibrados unos contra otros sin ancla externa: “X está en +0,10 porque toma como referencia a Y”, y Y no tenía evidencia propia.
Un algoritmo no reemplaza el juicio editorial de las fichas. Lo que hace es mover la carga de la prueba: que ningún valor exista sin medición reproducible, y que la ficha pase de ser el instrumento de clasificación a ser el instrumento de adjudicación de discrepancias entre la medición y el juicio.
2. El algoritmo
2.1 Fórmula
sesgo(m, t) = w₁ · slant_textual(m, t) + w₂ · balance_fuentes(m, t) + w₃ · divergencia_agenda(m, t)
con w₁ + w₂ + w₃ = 1, pesos públicos y versionados (propuesta inicial: 0,5 / 0,3 / 0,2), ventana móvil t de 90 días, y todo componente publicado con su n y su intervalo de confianza.
2.2 Componentes
slant_textual (adaptación de Gentzkow–Shapiro al español de Colombia). Se construye un diccionario de frases-idea a partir del corpus político colombiano: discursos del Congreso y comunicados de partidos como textos de referencia etiquetados (Pacto Histórico = −1, Centro Democrático/Defensores de la Patria = +1, y así). Las frases cuya frecuencia predice el bando (p. ej. “paz total”, “gobierno del cambio”, “dictadura”, “establecimiento”, “oligarquía”, “regimenes de excepción”) se convierten en regresores. El slant de un medio es la probabilidad de bando que su texto implica, centrada en 0. Se calcula por separado para: noticias, editoriales firmados por la casa, columnas y programas de opinión, y se agrega ponderando por audiencia — porque el ciclo demostró que el formato decide: La FM (+0,35) y Noticias RCN (+0,25) son la misma casa y se separan 0,10 porque una transcribe editoriales del director y el otro es un noticiero (fichas 03 y 12). Un algoritmo que no descompone por formato confunde el formato con la orientación.
balance_fuentes. Proporción y tratamiento (verbo, adjetivo, posición en el titular y el lead) de actores políticos citados. No mide “a quién citan” sino la asimetría gramatical: quién es sujeto de verbos de acción y quién de verbos de escándalo. Ejemplo calibrador del ciclo: la pieza de La República sobre el salario mínimo (29-12-2025) cita exclusivamente el lado empresarial-jurídico; El Universal tituló su serie de balance “Lo bueno/Lo malo/Lo feo” y ejecutó las tres partes. Ambos datos son computables sin juicio humano.
divergencia_agenda. Distancia entre la distribución temática del medio y la del corpus completo, con filtro de agencia obligatorio: el contenido atribuido a Colprensa, EFE y similares se excluye antes de computar, porque el ciclo demostró (fichas 15, 18, 19, 20) que la “coincidencia de agenda” entre regionales mide la dieta de agencia compartida, no la afinidad editorial. La agenda propia es la señal; la agenda de agencia es ruido de plomería.
2.3 La compuerta de evidencia (gate)
Regla dura: ningún valor se publica si n efectivo es insuficiente o si el feed está roto. La ficha 13 (Noticias Uno) mostró el caso: el catálogo mantenía un −0,40 sobre la premisa de un “noticiero semanal” que no existe — es diario — con un feed muerto. Con la compuerta, ese valor no se pudría en silencio: n = 0 → estado SUSPENDIDO POR MEDICIÓN, visible, con fecha. La ausencia deja de ser invisible.
2.4 Eventos discretos codificados
Además de los tres componentes continuos, un registro de eventos editoriales discretos con codebook público: endoso electoral firmado por la casa (El Heraldo, 24-05-2026 = evento tipo E1), editorial de balance con concesión explícita al adversario (El País 01-08-2026, El Universal 04-08-2026 = tipo E3), cobertura del accionista sin nota de conflicto (La República/Postobón = tipo E5). Cada evento tiene peso y caducidad (12 meses). Los eventos no mueven el valor directamente: obligan a explicación escrita si el valor no se mueve. Eso convierte la regla “el acuerdo no se registra como validación” en “el evento no explicado se registra como deuda”.
2.5 La capa ficha, redefinida
La ficha deja de producir el número y pasa a hacer tres cosas que el algoritmo no puede: 1. Adjudicar discrepancias: cuando |algoritmo − valor ficha| > 0,10, la ficha debe escribir por qué (ejemplo del ciclo: el recorrido Valorem de 0,45 se explicó por primera vez en este ciclo — estructuras a nivel de director, no de dueño: fichas 01, 02, 07). 2. Vigilar conflictos de interés pieza por pieza (Postobón en La República, ibiDs/Secop en El País, Corbeta/Conconcreto en El Colombiano, salud/seguros de Catalítico en La Opinión, banca Aval en El Tiempo): el algoritmo no sabe que el accionista vende gaseosas; la ficha sí. 3. Mantener el nivel 1 con verificación mercantil propia: certificado de Cámara de Comercio anual por medio (~COP $17.000 cada uno; menos de $400.000 al año para todo el catálogo), porque el ciclo demostró que ninguna fuente pública agregada está al día.
3. Aplicación medio por medio
Tabla resumen (valor de ficha vs. banda que la evidencia encontrada en el ciclo soportaría bajo el algoritmo) y explicación de cada caso. La banda algorítmica es una proyección argumentada desde las piezas fechadas, no una medición ejecutada — ejecutarla es el trabajo que propongo.
#
Medio
Valor ficha
Banda algorítmica proyectada
Estado
01
Noticias Caracol
+0,10
0,00 a +0,15
Firmable con IC publicado
02
El Tiempo
+0,05
−0,05 a +0,10
Firmable
03
Noticias RCN
+0,25
+0,10 a +0,25
Requiere descomposición por formato
04
Caracol Radio
+0,05
+0,05 a +0,20
Requiere descomposición por programa
05
Semana
+0,45
+0,40 a +0,55
Confirmado por medición textual
06
Pulzo
0,00
−0,05 a +0,05
Confirmado
07
El Espectador
−0,20
−0,15 a 0,00
La ficha se sostenía en historia
08
Blu Radio
+0,25
+0,15 a +0,30
Firmable con piezas
09
Infobae Colombia
+0,15
0,00 a +0,15
Agenda propia domina el cálculo
10
CNN en Español
−0,15
No medible (feed nulo)
Suspender o justificar por piezas
11
La Silla Vacía
−0,10
−0,10 a 0,00
Firmable
12
La FM
+0,35
+0,30 a +0,45
El editorial firmado manda
13
Noticias Uno
−0,40
Gate falla (feed roto, premisa falsa)
Rehacer desde cero
14
El Heraldo
+0,20
+0,20 a +0,35
Evento E1 (endoso) exige piso
15
El Colombiano
+0,35
+0,30 a +0,40
Confirmado con 4 editoriales
16
El País (Cali)
+0,30
+0,25 a +0,35
Confirmado post-venta
17
La República
+0,15
+0,10 a +0,20
+ monitor de conflicto Postobón
18
El Universal
+0,20
+0,15 a +0,25
El mejor calibrado del tramo
19
La Opinión
+0,30
+0,20 a +0,30
Neutralidad electoral baja el techo
20
Vanguardia
+0,25
+0,20 a +0,30
Confirmado con serie 2026
Las explicaciones
01 · Noticias Caracol (+0,10). Noticiero: el formato restringe el slant textual de la información, así que el componente dominante es divergencia_agenda (qué historias entran al lineup). Mi revisión encontró la estructura de propiedad al día (Valorem 93,49 %, SFC 14-05-2025) y corrigió un error del CONTRA. Bajo el algoritmo, +0,10 queda dentro de un IC que probablemente toca el cero: publicar el n y el IC es lo que separa “leve derecha” de “centro con ruido”. La explicación del recorrido Valorem (+0,10/+0,05/−0,20) quedó escrita en este ciclo: opera a nivel de director (Cano, J.R. Vargas, Morales), no de dueño — exactamente el tipo de hecho que la capa ficha debe adjudicar.
02 · El Tiempo (+0,05). Mi revisión corrigió el dato de que habría endosado en 2026: no endosó (el que endosó fue El Heraldo). Página de opinión plural, noticias con slant bajo: el algoritmo lo ubica en el rango de −0,05 a +0,10, consistente con la ficha. La vigilancia real es el conflicto Aval: cobertura de banca y regulación financiera pieza por pieza (el mismo tratamiento que Postobón). La fuente Semana-2012 que la ficha usaba queda reemplazada por la medición trimestral.
03 · Noticias RCN (+0,25). Encontré las cinco piezas críticas fechadas que la ficha declaraba ausentes, pero son noticias, no editoriales: el slant textual de un noticiero es estructuralmente bajo, y el +0,25 probablemente captura selección de historias (agenda), no tono. El algoritmo lo separa: si el número viene de agenda, se reporta como agenda. Además: cadena de propiedad con titulares fallecidos (Ardila Lülle †13-08-2021, Gaviria †30-05-2021), fusión Carbe (05-12-2022) no registrada (Parklake 86,28 %) y Consejero Presidencial Juan Lozano en la sala — todo eso va al nivel 1 corregido, no al valor.
04 · Caracol Radio (+0,05). La radio hablada es el caso donde la descomposición por programa es obligatoria: Pombo, Villar y Sánchez Cristo no son el noticiero. Mi revisión corrigió el error “Oughourlian controla Prisa desde 2003” y documentó el hecho corporativo mayor del catálogo en 2026: la fusión W Radio → Caracol Radio (13-01-2026), que dejó un medio fantasma en el catálogo. Con el algoritmo, el valor de Caracol Radio sería el promedio ponderado por audiencia de sus programas — y casi con seguridad supera el +0,05 si las mesas de opinión entran en el corpus.
05 · Semana (+0,45). El valor más alto del catálogo y el más fácil de medir: portadas como “La encuesta que querían callar” (22-05-2026) y el encuadre anti-Cepeda del 20-06-2026 son texto con slant extremo y fechado. El retorno de Vicky Dávila con máxima autoridad editorial (08-07-2026) es el evento de gobernanza que la ficha futura debe registrar. El algoritmo confirma +0,45 o más; la utilidad real es temporal: con ventana de 90 días, cualquier moderación post-transición se vería en el número de noviembre sin esperar al ciclo anual.
06 · Pulzo (0,00). El nativo digital de SEO: su agenda la fija el trending, no una línea — divergencia_agenda ≈ 0 por construcción y slant ≈ 0 por redacción despersonalizada. El 0,00 queda confirmado por medición, no por ausencia de evidencia (que era la fragilidad de su ficha). Mi revisión tumbó la afirmación de unicidad (Parklake/Cablenoticias, Panamá) y actualizó la gobernanza (Franco retirado jun-2018; CEO Murcia desde dic-2023). La lección de Pulzo es de método: los nativos digitales se salen del filtro RSS/prensa-de-referencia — el algoritmo debe muestrear por audiencia (Reuters DNR), no por formato.
07 · El Espectador (−0,20). El caso donde la ficha se sostenía en historia (el coche bomba contra Cano como argumento implícito de épica antioficialista). Los editoriales que encontré (01-02-2026, 14-03-2026, 11-08-2026) no sostienen −0,20; la transformación a ESAL (2025) y la estructura Fidel Cano-director + familia con 0,7 % explican la diferencia Valorem por debajo del dueño. Banda proyectada: −0,15 a 0,00. Nota: el Oráculo Electoral de Unilibre lo codifica como “alineado” con el oficialismo saliente — una fuente externa de codificación que el algoritmo puede usar como validación cruzada, no como verdad.
08 · Blu Radio (+0,25). Mi revisión cerró la laguna falsa (Blu es sociedad de Caracol Televisión S.A., no entidad sin rastro) y documentó el vínculo Morales–Duque y el episodio “Topos” (13-08-2026). Mismo tratamiento que Caracol Radio: descomposición por programa, ponderación por audiencia, y la crisis de acoso del MinTrabajo (mar–abr 2026) como evento de gobernanza registrado. Banda +0,15 a +0,30: el valor actual es defendible.
09 · Infobae Colombia (+0,15). El 92 % de agenda propia que refuté al CONTRA tiene lectura algorítmica directa: si la agenda no se parece a la de nadie, divergencia_agenda mide distancia al corpus, y el slant se calcula sobre originales — la agencia internacional queda filtrada. Eurnekian (20 % desde 2018) va al nivel 1. El rumor de venta de Hadad (15-08-2026) quedó declarado no verificado: con la compuerta de evidencia, el rumor no entra al valor, entra a la lista de vigilancia.
10 · CNN en Español (−0,15). La ficha tenía una contradicción interna (feed nulo + CONTRA con contenido) que el algoritmo resuelve por construcción: si no hay corpus, no hay número — la compuerta devuelve SUSPENDIDO POR MEDICIÓN. Para medios internacionales propuse en el ciclo la pregunta Q4: medir solo el subcorpus Colombia-relevante. La actualización de gobernanza (fusión firmada 27-02-2026, juicio mar-2027; Hudson fuera desde feb-2025; proximidad Ellison/Trump) pertenece al nivel 1.
11 · La Silla Vacía (−0,10). Mi revisión corrigió la dirección del episodio Ecopetrol (la firma familiar vendió $65.000M a Ecopetrol 2018–2021, no al revés) y detectó que la página de financiación citada era de 2020 (los SúperAmigos son solo 8 %; hay sponsors). La conducta electoral 2026 fue consistente con un valor cercano a cero. Banda −0,10 a 0,00. Para medios financiados por donantes, el componente que falta en la fórmula lo aporta la ficha: vigilancia de la cobertura de los propios financiadores.
12 · La FM (+0,35). El caso que mejor demuestra por qué el formato importa: La FM transcribe a diario los editoriales del director (/carta-del-director) — texto firmado, con slant alto y medible, que un noticiero no tiene. El +0,35 frente al +0,25 de RCN (misma casa) es un efecto de formato documentado por primera vez en este ciclo, con la llegada de Lozano a la dirección (04-10-2024) como variable de gobernanza. El algoritmo lo captura solo, sin excepciones manuales: editoriales firmados → componente de texto con peso pleno.
13 · Noticias Uno (−0,40). El peor caso del catálogo: premisa falsa (“noticiero semanal” — es diario), feed roto, y un valor heredado de la era Coronell-2019. Mi revisión encontró que la evidencia disponible apunta a ~0,00 por la regla “fiscalizar al poder” (la misma que la ficha aplicó a Chocó 7 Días y no aplicó aquí: inconsistencia Q2). Con la compuerta, este medio no tendría número podrido: tendría estado SUSPENDIDO y una orden de reconstrucción. La regla Q2 debe escribirse: el eje mide relación con el poder vigente, no con un poder fijo.
14 · El Heraldo (+0,20). El espécimen del evento discreto E1: endoso editorial firmado (24-05-2026) + editoriales celebratorios (01-06, 22-06-2026) + línea premiada anti-Petro. Bajo el algoritmo, un E1 sin explicación escrita es deuda; con explicación, el piso es +0,20 y el debate abierto es +0,25/+0,35, condicionado a si cumple su promesa de vigilar al gobierno De la Espriella (editorial del 05-08-2026 sugiere que aún no). La ventana de 90 días lo resuelve sola en noviembre.
15 · El Colombiano (+0,35). Cuatro editoriales fechados (05-08-2025, 30-12-2025, 13-01-2026, 07-08-2026) sostienen el valor sin apelar a la “tradición”. El nivel 1 quedó corregido (Alianza San Felipe 57 %, no 51 %; versión Forbes de la oferta Gilinski inexistente). Vigilancia estructural: cobertura de Corbeta, Conconcreto, Sura y la Alcaldía de Medellín — los beneficiarios documentados de las chequeras del accionariado.
16 · El País (Cali) (+0,30). La lección mayor del ciclo: una ficha entera construida sobre propiedad vencida. Vendido en jun-2025; los cuatro editoriales post-venta sostienen +0,30, y el del 01-08-2026 (reconocimiento de logros de Petro) es el evento E3 que explica la distancia con Semana mejor que cualquier análisis societario. Bajo el algoritmo, la pregunta de los 0,15 nunca se formula como problema de dueños: se formula como distancia textual medida entre dos corpus. Conflicto a vigilar: ibiDs/Secop.
17 · La República (+0,15). El patrón Postobón (seis piezas favorables, cero críticas, silencio sobre el impuesto saludable que su accionista quiere eliminado) es el prototipo de lo que ningún slant textual captura: el sesgo por omisión sobre el dueño. Por eso la fórmula necesita la capa ficha con monitor de cobertura-del-accionista. El slant de sus editoriales (17-12-2025, concesiones al balance incluidas) proyecta +0,10 a +0,20. Y para el subsistema económico (con Portafolio y Valora Analitik), el ancla propuesta: asimetría de fuentes en noticias de datos y de verbos en titulares macro idénticos.
18 · El Universal (+0,20). La serie “Lo bueno/Lo feo” (04/06-08-2026) es el balance ejecutado como formato — el algoritmo lo vería como slant bimodal deliberado, y el codebook debería codificarlo como E3 estructural. Sin endoso, con vínculo político del bloque local documentado (Araujo Perdomo, con gerente general de la familia) y con el error de titular fallecido corregido (Galvis †15-01-2021). El mejor calibrado del tramo regional.
19 · La Opinión (+0,30). Línea hawkish de seguridad con neutralidad cívica electoral (20-06-2026): el algoritmo la pondría en +0,20/+0,30, y yo registré la opción argumentada de +0,25. Lo que ningún algoritmo ve: el asesinato del exreportero Cristian Herrera (06-06-2026) y el entorno de amenaza del Catatumbo — la ficha debe llevar esa nota permanente para no leer como sesgo lo que también es supervivencia, y para vigilar los silencios que la amenaza produce.
20 · Vanguardia (+0,25). Serie anti-Petro (24-04, 29-07, 01-08-2026) con transición medida (08-08-2026: “ni renovación de la esperanza ni pasaporte al infierno”) y sin endoso. Sucesión documentada (Alejandro Galvis Blanco, gerente y representante legal). Tres directores en tres años con línea estable: evidencia de que la orientación es de la casa — el dato que responde, empíricamente y a favor del criterio, la pregunta de fondo de su ficha.
4. Reglas transversales que el ciclo deja escritas
Q8 (nueva): política MOM-staleness. Ninguna ficha cita MOM como vigente sin verificación mercantil propia del año en curso. Cuatro titulares fallecidos citados como presentes en un solo ciclo bastan como justificación.
Filtro de agencia en toda métrica de coincidencia (Colprensa/EFE): cuatro fichas regionales con anomalías ficticias lo demuestran.
Regla del endoso (E1): un endoso editorial presidencial firmado por la casa es, por sí solo, evidencia suficiente para un valor distinto de cero, y exige explicación escrita si el valor no se mueve.
Descomposición por formato y por programa en radio y TV: la orientación de un medio hablado es el promedio ponderado por audiencia de sus franjas, nunca un número único sin descomponer.
Compuerta de evidencia: n insuficiente o feed roto → suspensión visible, nunca valor heredado en silencio (caso Noticias Uno).
Q2 escrita: el eje mide relación con el poder vigente; la inconsistencia Chocó 7 Días / Noticias Uno / La Silla se resuelve enunciándola.
Monitor de cobertura-del-accionista por ficha, con la tabla de piezas adjunta (modelo: Postobón en La República).
Certificado de Cámara de Comercio anual por medio: el cierre barato que habría evitado los cuatro errores de titulares fallecidos y la premisa muerta de la ficha 16.
5. Hoja de ruta
Noviembre 2026 (fecha ya fijada por las fichas): primera medición ejecutada con ventana de 90 días, filtro de agencia activo, y comparación publicada valor-ficha vs. valor-algoritmo por medio, con adjudicación escrita de toda discrepancia > 0,10.
Diciembre 2026: codebook de eventos discretos v1 y certificados de Cámara de los 20 medios.
Continuo: corpus archivado más allá de la retención de 72 h — sin archivo, ninguna medición es auditable y todo el edificio vuelve a ser memoria.

Kimi K3 — revisor externo DobleFoco. Este documento cierra el ciclo de 20 fichas: cada afirmación sobre un medio remite a su revisión individual (kimi-k3-<medio>.md), con fuentes y fechas.
```
