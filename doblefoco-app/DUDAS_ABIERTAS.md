# DUDAS ABIERTAS

Preguntas que me han surgido trabajando y que **no puedo resolver yo solo**:
porque son decisiones editoriales, porque exigen mirar el sitio en un navegador,
o porque dependen de información que no tengo.

Abierto el 2026-07-30 a petición de Jose. Se van tachando, no borrando: saber
qué se preguntó y cómo se decidió vale más que una lista corta.

---

## Estéticas y de interfaz

**1. «La info de abajo queda corrida al verse muy apretada» (2026-07-30).**
No he podido reproducirlo sin ver la pantalla. El pie está centrado con
`flex-direction: column`, así que si se ve desplazado la causa más probable es
que algún elemento de la página sea más ancho que la ventana y provoque
desplazamiento horizontal — con scroll lateral, lo centrado se ve corrido.
*Qué necesito:* en qué ancho de pantalla pasa (móvil o escritorio) y si aparece
una barra de desplazamiento horizontal. Con eso lo localizo en minutos.

**2. Revisión estética general.** Jose la aplazó explícitamente. Cuando toque,
mis candidatos: la densidad de la tarjeta de noticia, la jerarquía tipográfica
entre titular y metadatos, y el mapa cartesiano en móvil.

---

## Decisiones editoriales pendientes

**3. Las historias sin imagen.** Quedan ~5 multifuente donde NINGÚN medio publicó
foto. Hoy salen sin imagen y el diseño se adapta.
*La pregunta:* ¿dejarlas así, o poner un marcador claramente NO fotográfico —el
logo del medio sobre un fondo— que se lea como «no hay imagen» y no como «esta
es la imagen»? Lo que NO se hará es buscar una foto «relacionada»: sería la
fabricación que se retiró el 2026-07-30.

**4. `ITEMS_PER_FEED = 15`.** El RSS de Semana expone 100 artículos y solo
miramos 15. Subirlo daría más cobertura y más volumen de ingesta.
*La pregunta:* ¿cuánto volumen es aceptable? Afecta al coste de la base y al
tráfico que generamos a terceros.

**5. La cifra de patrocinio.** Se quitó de /transparencia por decisión de Jose,
pero sigue en `src/docs/plantilla_solicitud_patrocinio.md` y en la copia de la
raíz del repositorio. Es un documento para enviar a un patrocinador, así que ahí
una cifra concreta puede tener sentido.
*La pregunta:* ¿se quita también, o se queda?

**6. Historias moderadas huérfanas.** El agrupamiento deja de producir algunas
historias que ya tenían decisión de moderación. Se conservan por la salvaguarda
de F2-02, pero nadie ha decidido qué hacer con ellas. Riesgo MEDIO en el ROADMAP
desde hace días.

---

## Técnicas, con una recomendación mía

**7. La portada tarda 1-2 s en aparecer.** Mitigado el 2026-07-30 con un
esqueleto de carga, que quita el vacío pero no la espera. La solución de fondo
sería renderizar la portada en el servidor, como ya se hace con `/noticia/:id`.
*Mi recomendación:* no hacerlo todavía. Con el esqueleto ya no parece rota, y el
renderizado en servidor de la portada es trabajo real que compite con F1-13.

**8. El «Vercel Security Checkpoint».** El 2026-07-29 devolvió 403 a todo el
sitio —incluidos `robots.txt` y `sitemap.xml`— durante unas horas, y el 30 había
desaparecido solo. Nunca supimos por qué se activó.
*Mi recomendación:* mirar una vez el panel de Vercel → Firewall para saber si
está en automático, y priorizar F2-11: un 403 sobre todo el sitio no aparecería
en ningún registro nuestro.

**9. Los enlaces vía Google News son redirecciones**, no URLs canónicas. Afecta
a 7 medios. Está asumido y declarado, pero cada uno que migre a RSS propio quita
una dependencia de un tercero.

**10. `securityService.js` no se aplica en ningún sitio.** Marcado como tal el
2026-07-30. Es una lista de cabeceras con aspecto de configuración que no
protege nada; la CSP real está en `vercel.json`.
*La pregunta:* ¿se borra, o se deja como referencia?

---

## Preguntas de fondo sobre el producto

**11. ¿«Punto ciego» es la métrica correcta para la izquierda?** F1-12 lo dejó
planteado y sigue sin respuesta: los medios de izquierda del catálogo no cubren
el ciclo diario, cubren OTRA agenda. Un punto ciego exige que 6 medios cubran el
mismo hecho y falten los de un lado; si un bloque no participa del hecho diario,
quizá lo que hay que medir es **agenda divergente** y no ausencia.

**12. ¿Qué pasa cuando un medio nos escriba?** No hay procedimiento escrito para
una objeción formal de un medio sobre su clasificación de sesgo o su ficha de
propiedad. Los reportes de lector ya tienen camino (panel); un medio, no.
