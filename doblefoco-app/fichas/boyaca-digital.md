# Boyacá Digital — ficha de orientación

| | |
|---|---|
| **Valor propuesto** | **0,00** · Orientación mixta — **provisional de alta** |
| **Firma** | ☐ pendiente — Jose Arbeláez |
| **Fecha** | 2026-08-09 (candidatura, del barrido nacional) |
| **Protocolo** | `PROTOCOLO_JUICIO_EDITORIAL.md` |
| **Departamento** | Boyacá |

> **Su redacción no es humana.** El propio medio declara ser «un medio operado
> por una redacción de agentes de inteligencia artificial bajo supervisión
> editorial», y se presenta como «el primer periódico autónomo con agentes de
> inteligencia artificial de Colombia».

---

## EVIDENCIA ADMISIBLE

### Nivel 4 — Lo que declara de sí mismo, y es lo decisivo

En su propia portada: **«Boyacá Digital es un medio operado por una redacción de
agentes de inteligencia artificial bajo supervisión editorial»**. Se anuncia
como el primer periódico autónomo con agentes de IA del país. Dice citar fuente
en todo su contenido y acogerse al derecho de rectificación del artículo 20 de
la Constitución.

Cubre Boyacá con secciones municipales de Tunja, Duitama, Sogamoso,
Chiquinquirá, Paipa y Villa de Leyva.

Fuente: [boyacadigital.com](https://www.boyacadigital.com/).

### Nivel 1 — Quién lo posee

Se rastreó y hay algo, aunque incompleto: **Holding Consultants** lo opera y lo
edita. Sigue sin haber razón social, NIT ni una persona con nombre que responda.
El detalle está en el apartado «La propiedad, rastreada», más abajo.

### Nivel 2 — Conducta medida: NO EXISTE

No está ingerido. Su feed —`boyacadigital.com/rss.xml`— devolvió 20 artículos
con el más reciente de hace una hora. **Publica mucho y muy rápido**, que es lo
esperable de una redacción automatizada y no es mérito.

---

## ENTRA, POR DECISIÓN DE JOSE (2026-08-09)

Esta ficha se escribió recomendando NO darlo de alta. **Jose decidió admitirlo:
«es el primero».** Se admite con marca visible y con la propiedad rastreada, que
era la condición implícita de esa decisión.

Los tres reparos que motivaban la recomendación contraria siguen en pie y se
dejan escritos, porque admitirlo no los resuelve:

**1. Su orientación no es una propiedad de la casa sino de su configuración**,
que puede cambiar en una tarde sin que nada externo lo registre. Un número
nuestro sobre eso caducaría sin aviso. **Y aquí está el giro que apuntó Jose:
eso lo hace MÁS medible, no menos.** En una redacción humana el sesgo se reparte
entre personas y días; en una configurada es una propiedad del sistema, y su
salida es sistemática. Con corpus suficiente, la deriva de este medio debería
poder calcularse más directamente que la de uno humano, y una alteración de su
configuración debería verse como un SALTO y no como ruido. Es trabajo del motor
de sesgo y queda anotado en `shared/mediaRegistry.js`, junto al campo.

**2. El recuento de pluralidad.** Todo el sitio se apoya en «cuántos medios
distintos cubren este hecho». Una redacción que reescribe lo que ya publicaron
otros suma sin aportar una voz. **Por eso la marca no es decorativa**: sin ella,
este medio infla en silencio la cifra que da sentido a la portada.

**3. Nadie firma.** Su política editorial dice que un Editor en Jefe responde
legalmente, pero no publica su nombre. El protocolo pide que haya alguien a
quien preguntarle por qué; aquí hay un cargo, no una persona.

---

## LA PROPIEDAD, RASTREADA

| Dato | Valor |
|---|---|
| Opera y edita | **Holding Consultants** (lo dice su política editorial) |
| Responsable legal | «Editor en Jefe», **sin nombre publicado** |
| Único humano con nombre | **Juan Pablo Sáenz**, columnista de «Escenario Político», periodista y estratega en comunicación política |
| Razón social / NIT | no constan |

### El vínculo, y cómo se comprobó

Con ese nombre existe en Bogotá **Holding Consultants de Colombia**, consultora
de sistemas de gestión —ISO 9001, seguridad y salud en el trabajo— con veinte
años de actividad, cobertura declarada en Cundinamarca y Boyacá, y clientes en
el sector privado **y en el público**.

Que sea la misma organización dejó de ser una coincidencia de nombre:

| Indicio | Qué muestra |
|---|---|
| Declaración del propio medio | Su política editorial y su política de privacidad dicen que lo «opera y edita» Holding Consultants |
| **Servidores de nombres** | `boyacadigital.com` y `holdingconsultants.org` comparten **el mismo par de Cloudflare** —`dylan` y `fatima`—, y Cloudflare asigna un par por cuenta |
| Geografía | La consultora declara cobertura en Boyacá; el medio es de Boyacá |

**No es un certificado de Cámara de Comercio**, y por eso no se afirma identidad
jurídica. Es evidencia convergente y se publica como tal.

### EL CONFLICTO DE INTERÉS QUE SE DECLARA

**Una consultora que vende servicios de sistemas de gestión a entidades públicas
es, con toda probabilidad, la dueña de un medio cuya redacción automatizada
cubre a diario las alcaldías y la gobernación de Boyacá.**

Se declara siguiendo la regla que ya gobierna el resto del catálogo: **no se
afirma que haya influido en ninguna pieza** —eso no consta y no se publica—; se
expone quién está detrás, que es comprobable, y el lector saca su conclusión con
el dato delante en vez de sin él.

Y hay una consecuencia práctica: **si esa cobertura resulta sistemáticamente
favorable a las entidades que podrían ser sus clientes, ya no será un conflicto
potencial sino conducta medida.** Es la comprobación de nivel 2 que esta ficha
deja anotada, y en un medio automatizado debería detectarse antes que en uno
humano.

---

## SUS TRECE PERIODISTAS TIENEN NOMBRE Y APELLIDO, Y NO EXISTEN

Mariana Restrepo en judicial, Andrés Cárdenas en política, Carolina Pinilla en
Boyacá hiperlocal, Diego Saavedra en deportes, Valeria Torres en economía, Don
Hernán Bautista en agro… trece agentes con nombres humanos y sección asignada.

**El medio lo declara en su página de equipo, y eso cuenta a su favor.** Pero la
firma es donde el lector se encuentra al autor, y ahí parecen personas. Su feed
RSS **no trae etiqueta de autor**, así que esa firma no nos llega y no podemos
reproducirla ni corregirla: otra razón para que la marca esté en el medio.

Declara además etiquetar las imágenes generadas y no simular personas reales.
**Conviene comprobar qué proporción de sus fotos es generada antes de mostrarlas
como «la foto del medio»**: la regla del proyecto es imagen real del medio o
ninguna, y una ilustración de IA no es ninguna de las dos.

---

## LO QUE ESTE CASO OBLIGA A MIRAR

Boyacá Digital se anuncia como **el primero** de Colombia. Si es cierto, habrá
más, y llegarán antes a los departamentos vacíos que los medios humanos —
montar un portal automatizado para Vaupés cuesta mucho menos que sostener una
redacción allí.

**El mapa departamental podría llenarse de departamentos «cubiertos» que en
realidad no tienen a nadie reporteando.** Merece una comprobación explícita en
el alta de cualquier candidato futuro, y por eso queda escrito aquí y no solo
en una conversación.

---

## REFUTACIÓN — qué reabriría el expediente

1. **El certificado de Cámara de Comercio de Holding Consultants**, que llevaría
   el vínculo de «evidencia convergente» a identidad jurídica probada. Hoy se
   apoya en la declaración del medio y en que ambos dominios comparten cuenta de
   Cloudflare.
2. **Que el medio publique responsable identificable y sociedad**, que es el
   mínimo del protocolo para cualquiera.
3. **Que se documente qué parte es generada y qué parte es reportería humana.**
   «Bajo supervisión editorial» no dice si alguien va al sitio de los hechos.
4. **A los 90 días con más de 60 historias suyas**, y aquí es donde esta ficha
   se separa de las demás: si la hipótesis de Jose es correcta, su orientación
   se podrá calcular con menos ruido que la de cualquier medio humano del
   catálogo. **Este medio es el primer caso de prueba de esa idea.**
