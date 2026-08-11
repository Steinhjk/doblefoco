# Valora Analitik — ficha de orientación

| | |
|---|---|
| **Valor propuesto** | **+0,10** · Derecha moderada — **provisional de alta** |
| **Firma** | ☐ pendiente — Jose Arbeláez |
| **Fecha** | 2026-08-11 (alta a petición de Jose) |
| **Protocolo** | `PROTOCOLO_JUICIO_EDITORIAL.md` |
| **Departamento** | Antioquia (sede en Medellín) — pero su agenda es nacional |

---

## EVIDENCIA ADMISIBLE

### Nivel 1 — Quién lo controla, hoy

Lo edita **Valora Inversiones S.A.S.**, NIT **900.811.192-0**, constituida el
**20 de enero de 2015** y domiciliada en Medellín, Carrera 43A n.º 5A-113,
oficina 2020 (Edificio One Plaza).

Sus dueños son **sus dos fundadores**: **Camilo Silva**, gerente, y **Alejandro
Montoya**, CFO, con capital propio. **No pertenece a ningún grupo de medios ni a
ningún conglomerado**, y eso hay que decirlo con el mismo cuidado que se dice lo
contrario: en este catálogo tres dueños concentran la mitad de lo publicado, así
que la independencia societaria es la excepción. Pero **independencia societaria
no es independencia editorial**: solo quita un conflicto conocido, no todos.

Se financia con pauta, **suscripciones a un servicio premium** y **avisos de ley
pagados** —convocatorias, liquidaciones, escisiones— de empresas.

Fuentes: [Términos y condiciones de Valora Inversiones (PDF del propio
medio)](https://www.valoraanalitik.com/Terminos_Condiciones_Valora_Inversiones.pdf),
[DataCrédito Empresas](https://www.datacreditoempresas.com.co/directorio/valora-inversiones-sas.html),
[Wikipedia](https://es.wikipedia.org/wiki/Valora_Analitik).

### Nivel 2 — Conducta medida: NO EXISTE

No hay corpus propio todavía: el medio entra hoy. `factuality` queda en `null`
—«no medida»— y no se inventa un historial de rigor para justificar el alta, que
es exactamente lo que la Fase 0 quitó del motor.

Lo que sí se leyó, a mano y antes de proponer el número, son sus dos secciones
más cargadas políticamente. Está abajo, en el argumento.

---

## EL CONFLICTO DE INTERÉS, QUE ES LO PRIMERO QUE HAY QUE DECIR

La misma sociedad opera **[una plataforma de pago para inversionistas del
mercado accionario colombiano](https://plataforma.valoraanalitik.com/plataforma/index.php)**,
con gráficos de análisis técnico y análisis financiero de las acciones que
cotizan en la Bolsa de Valores de Colombia. **Su redacción cubre a esas mismas
emisoras.**

Y los **avisos de ley** son una relación comercial con empresas sobre las que
informa, del mismo tipo que la pauta.

**Esto es desvelamiento, no acusación**, y la diferencia importa: la plataforma
es de autoservicio, no ofrece asesoría personalizada ni recomendaciones de
compra. No se ha medido ninguna distorsión; se señala dónde habría que mirar si
alguien quisiera buscarla. Es el mismo trato que reciben Portafolio —cuyo dueño
es el mayor banquero del país— y La República —cuyo dueño fabrica las bebidas
sobre las que informa—.

---

## ARGUMENTO

**+0,10, el mismo que Portafolio, y no +0,15 como La República.**

Lo que empuja hacia la derecha moderada es estructural y no discutible: es un
medio de mercados con **audiencia inversionista**, su producto de pago se dirige
a quien tiene acciones, y su encuadre por defecto es el de la empresa y el
indicador. En la escala de este proyecto eso no es «neutral con sesgo»: es una
orientación clarísima, la del capital, igual que la de Portafolio.

Lo que impide subirlo a +0,15 es que **su cobertura laboral no tiene encuadre
patronal**. Leídos sus titulares de la sección de reforma laboral el 2026-08-11:

- «Recargo dominical para trabajadores en Colombia ya subió: esto deben pagarle
  de más si trabaja…»
- «Salario de trabajadores no bajará con nueva jornada laboral en Colombia»
- «Empresas tendrán prohibido hacer cambios en el salario de los trabajadores»
- «Corte da freno a Colpensiones: Sentencia favorece a ciudadanos a puertas de
  la pensión»

Eso es periodismo de servicio escrito **desde el trabajador**, no desde el coste
que la reforma supone para la empresa. Un medio de mercados alineado con el
gremio patronal habría titulado lo segundo, y es lo que se esperaría encontrar.

---

## CONTRA — el mejor caso en contra

**El caso para +0,15 es real y hay que dejarlo escrito.**

En la sección política del mismo día aparece «**Empresarios celebran** anuncio
del gobierno De la Espriella de eliminar impuesto al patrimonio». Ese titular
elige a los empresarios como sujeto que valora una medida fiscal: es
literalmente reportar una reacción, pero la elección de *qué* reacción se
titula es encuadre.

Y la plataforma de pago no es un detalle del modelo de negocio: alinea los
incentivos del medio con los de quien invierte en las emisoras que cubre, que es
un vínculo más directo que el de un dueño con negocios en otro sector.

**Contra el +0,00 (orientación mixta)** el argumento es más corto: la banda mixta
ya tiene 21 medios y es la más poblada del catálogo. Meter ahí a un medio cuya
orientación —el capital— es perfectamente identificable sería usar el 0,00 como
cajón de sastre, que es justo lo que `biasAnalysis.js` advierte que no significa.

---

## REFUTACIÓN — qué cambiaría el número

**Sube a +0,15 o más si:**

- aparece un patrón sostenido de encuadre patronal en las reformas laboral o
  pensional, y no los titulares de servicio medidos hoy;
- se documenta cobertura complaciente con emisoras concretas que su plataforma
  de pago promociona;
- el medio empieza a editorializar sobre política fiscal más allá de reportar
  reacciones.

**Baja hacia 0,00 si:**

- la cobertura política resulta ser mayoritariamente institucional y de dato, y
  la muestra de hoy —dominada por el terremoto del Chocó— resultó atípica.

**Se revisa sí o sí** cuando haya corpus propio suficiente para medir tono y
reparto, que es cuando `factuality` deja de ser `null` y esta ficha deja de
apoyarse en una lectura a mano de dos secciones en un solo día.

---

## NOTA TÉCNICA

Este medio figuró como **«sin feed»** hasta hoy, y el problema era nuestro: el
User-Agent del proyecto llevaba una tilde —«periodística»—, una cabecera HTTP
solo admite ASCII, y su cortafuegos la rechazaba con un 403. Sin la tilde
responde 200. Ver `shared/userAgent.js`.

Publica **~51 artículos al día**, todos con imagen. Sería el 11.º del catálogo
por volumen, un 2,5 % del corpus.
