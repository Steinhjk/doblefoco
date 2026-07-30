# Conclusiones y Análisis Técnico: Ground News vs. DobleFoco

Este documento reúne las conclusiones sobre la arquitectura de agregación de noticias, la metodología de análisis de contenido y las estrategias técnicas frente a barreras como las paredes de pago (paywalls).

---

## 1. ¿Ground News y DobleFoco solo analizan titulares o el contenido completo?

### Respuesta corta
Ground News y DobleFoco procesan principalmente los **titulares (headlines)**, **las bajadas/entradillas (leads/subheads/snippets)** y **los metadatos estructurados**, además de evaluar la **intención editorial** a través del tono de lenguaje y el encuadre (framing).

### Alcance específico del Motor de DobleFoco.co:
1. **Ingestión de Entradillas (Primer Párrafo)**:
   - El motor de ingesta de DobleFoco lee los canales públicos RSS/Atom oficiales. Estos feeds no solo transmiten el titular, sino también el `summary` o `contentSnippet`, que corresponde a la entradilla o primer párrafo resumen elaborado por la redacción del medio.
2. **Evaluación de Intención Editorial y Tono**:
   - Mediante el analizador de lenguaje valorativo (`headlineTone.js`), el motor detecta la carga emocional, el uso de adjetivos calificativos y juicios de valor en el titular y bajada, cruzándolo con la matriz de sesgo (`biasAnalysis.js`) y el registro de medios (`mediaRegistry.js`).
3. **Razones para no almacenar el cuerpo completo de cada nota**:
   - **Derechos de Autor y Fair Use**: Replicar el cuerpo entero de miles de noticias al día violaría los derechos de propiedad intelectual de los medios. Los agregadores citan el titular/bajada y redirigen el tráfico original mediante enlaces.
   - **Pirámide Invertida & Eficiencia PLN**: El titular y la entradilla concentran más del 80% de la carga semántica y la intención editorial. Su análisis permite procesar miles de historias por minuto a bajo costo y con latencias de milisegundos.

---

## 2. Acceso a noticias con Pared de Pago (Paywall)

Para un sistema de agregación y análisis mediático, la presencia de paredes de pago representa un desafío técnico. Existen dos categorías principales de paywalls y distintas estrategias para superarlos:

### A. Paredes de Pago Suaves (Soft Paywalls / Client-side JS)

En este esquema, el servidor envía el contenido completo al navegador, pero un script ejecutable en JavaScript oculta el texto o despliega una ventana emergente de suscripción.

**Técnicas de Ingestión y Scraping:**
1. **Extracción de Metadatos JSON-LD / Schema.org**:
   - Para ser indexados por Google, los periódicos incluyen el texto estructurado o extractos extensos en el HTML inicial dentro de etiquetas `<script type="application/ld+json">` o metadatos OpenGraph (`og:description`).
   - El backend de scraping realiza la petición `HTTP GET` sin ejecutar JavaScript, leyendo la información original antes de que se active el bloqueo.
2. **User-Agent de Googlebot**:
   - Muchos medios entregan el artículo sin restricciones a los rastreadores de motores de búsqueda. Enviar la cabecera `User-Agent: Googlebot/2.1` permite obtener el HTML limpio.
3. **Canales RSS/Atom y Versiones AMP (Accelerated Mobile Pages)**:
   - Los canales RSS públicos y las versiones AMP de las notas periodísticas suelen emitir extractos extensos o textos completos sin scripts de pago.
4. **Consultas a APIs de Archivos Web (Wayback Machine / Archive.today)**:
   - Integración con servicios de caché (ej. `archive.is` o `web.archive.org`) para recuperar capturas históricas sin muro de pago.

### B. Paredes de Pago Duras (Hard Paywalls / Server-side Auth)

En este modelo (usado por publicaciones como *The Wall Street Journal* o *Financial Times*), el servidor exige un token de autenticación o sesión válida antes de entregar el HTML.

**Técnicas de Integración:**
1. **Licenciamiento B2B y APIs Oficiales**:
   - Agregadores a gran escala firman acuerdos comerciales directos con agencias de noticias (Reuters, AP, EFE) o distribuidores institucionales (LexisNexis, Factiva) para recibir los cables periodísticos estructurados en tiempo real.
2. **Scraping con Navegadores Headless y Sesión Autenticada**:
   - Despliegue de trabajadores aislados (con Puppeteer o Playwright) que mantienen tokens de sesión o suscripciones institucionales para extraer el contenido respetando cuotas de uso.
3. **Ingestión Asistida por Usuarios o Resúmenes Comunitarios**:
   - Permitir que usuarios suscritos reporten la cobertura de medios protegidos bajo esquemas de verificación colaborativa.

---

## 3. Matriz Comparativa de Implementación

| Criterio | Ground News (Internacional) | DobleFoco.co (Colombia) |
| :--- | :--- | :--- |
| **Unidad de Análisis Primaria** | Titulares + Leads | Titulares + Entradillas/Snippets RSS + Tono Editorial |
| **Fuentes Analizadas** | > 50,000 fuentes globales | Catálogo verificado de medios colombianos |
| **Tratamiento de Paywalls** | Redirección directa + Acuerdos B2B | Scraping de metadatos públicos + Redirección |
| **Transparencia de Sesgo** | Puntuaciones de Ad Fontes / AllSides | Criterios editoriales propios con justificación abierta |
