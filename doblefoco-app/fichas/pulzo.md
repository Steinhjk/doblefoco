# PULZO — ficha de orientación

| | |
|---|---|
| **Valor propuesto** | **0.00** — orientación mixta, provisional |
| **Firma** | ☐ sin firmar (`reviewedAt: null`) |
| **Fecha** | 2026-08-11 (alta) |
| **Protocolo** | `PROTOCOLO_JUICIO_EDITORIAL.md` |
| **Alcance semanal** | **19 % en internet** — 4.º del país (Reuters Institute, DNR 2026) |

---

## POR QUÉ NO ESTABA, Y QUÉ LO DESTAPÓ

Pulzo es **el cuarto medio más consumido de Colombia** y llevaba ausente del
catálogo desde el primer día. No estaba por descuido, estaba por un sesgo del
método: el catálogo se armó mirando quién publica RSS y quién es prensa «de
referencia», y ese filtro se salta justo a los nativos digitales de gran público.

Lo destapó cambiar el criterio de orden. Mientras «mayor cobertura» significó
volumen de piezas ingeridas, Pulzo no aparecía por ningún lado. Al ordenar por
audiencia —aclaración de Jose del 2026-08-11— salió por delante de tres medios
que sí estaban:

| Medio | Alcance semanal en internet |
|---|---|
| El Tiempo | 30 % |
| Noticias Caracol | 22 % |
| Semana | 20 % |
| **Pulzo** | **19 %** |
| El Espectador | 16 % |
| Caracol Radio | 16 % |
| Blu Radio | 15 % |

Fuente: `shared/audiencia.js`.

---

## EVIDENCIA ADMISIBLE

### Nivel 1 — Propiedad: el hilo llega a una sociedad y se para

| Dato | Valor |
|---|---|
| Sociedad editora | **INQLAB S.A.S.**, con el 100 % de las acciones |
| Otras participaciones de INQLAB | Quantum (49 %), Chicplace (43 %), Appto (15 %) |
| Quién controla INQLAB | **no consta en ninguna fuente abierta** |

Fuente: ficha de Pulzo.com en el **Media Ownership Monitor** de Colombia.

**Es el único medio colombiano del catálogo cuyo hilo no termina en personas**,
junto con Colombia Informa. Y a diferencia de aquel, aquí sí hay nombres
circulando: lo que pasa es que no se sostienen.

### Nivel 2 — Conducta medida: NO EXISTE

Ingerido desde el 2026-08-11 por `/rss/nacion`. Sin `factuality`.

---

## TRES FUENTES QUE NO COINCIDEN

Esta es la parte que hay que leer antes de tocar la ficha.

| Fuente | Qué dice |
|---|---|
| **Media Ownership Monitor** | 100 % a nombre de INQLAB S.A.S. Fundador y CEO: Guillermo Eduardo Franco Morales. Representante legal: Julio Mario Camacho |
| **Wikipedia** | INQLAB está registrada en Panamá y **pertenece al grupo Santo Domingo**. Fundado en 2014 por Luis Fernando Santos, Guillermo Franco y otros |
| **SembraMedia** (la única referencia que Wikipedia cita para eso) | **No menciona ni a Santo Domingo ni a INQLAB.** Da otro fundador —Andrés Murcia—, otro año —2012— y describe una sociedad con fines de lucro financiada por publicidad |
| **La República** | Lo llama «un portal web del Grupo Santo Domingo» **en el titular**, y el cuerpo de la nota no lo afirma en ninguna línea |

**Wikipedia se contradice con su propia fuente.** Es la comprobación que decidió
esta ficha.

---

## POR QUÉ NO SE LE ASIGNÓ `controlGroup: valorem`

Porque el aviso de dueño compartido diría entonces que **cuatro medios de este
catálogo** —El Espectador, Blu Radio, Noticias Caracol y Pulzo— responden ante la
familia Santo Domingo. Sería la concentración más grande que este mapa habría
enseñado nunca, y saldría en cada noticia que cubran dos de los cuatro.

Construida sobre un titular sin cuerpo y una nota de Wikipedia que su propia
referencia desmiente.

Es exactamente el error de la compra de El Heraldo por Gilinski, que se anunció
en junio de 2023 y se deshizo en agosto, con el agravante de que aquí el aviso
sería recurrente y automático.

**La contradicción sí se publica** en las `notes` de la ficha. Que la propiedad
última del cuarto medio más leído del país esté en disputa entre sus tres fuentes
públicas es un hecho sobre el espacio mediático colombiano, no un defecto de
nuestra investigación que convenga esconder.

---

## POR QUÉ 0.00

Su volumen es de titular rápido, agregación y virales, no de línea editorial
declarada. Nada de la evidencia admisible —lo que el medio declara hoy como su
misión, § 2 del protocolo— lo mueve del centro.

Como en los regionales: **es mixta por ausencia de evidencia, no por evidencia de
equilibrio.**

Hay una acusación en circulación —un blog partidista sostiene que «los dueños de
Pulzo protegen a Francisco Santos»— que **no es evidencia admisible** y no se
tuvo en cuenta.

---

## NOTAS TÉCNICAS

- **No hay feed general.** El patrón es `/rss/<sección>`; las válidas son
  `nacion`, `economia`, `mundo`, `deportes` y `entretenimiento`. Cualquier otra
  devuelve `Invalid section.` en texto plano, no un 404.
- **`/feeds/rss` devuelve un volcado de depuración de Symfony**, no un feed. Si
  alguien lo prueba y ve un 200, que no lo dé por bueno.
- **Devuelve 600 ítems** y el motor se queda con los 15 primeros, como con todos.
- **El primer ítem es de junio de 2025**, delante de los frescos. Gasta un hueco
  de los quince. Si algún día parece que Pulzo entra poco, mirar aquí.
- Sirve las imágenes desde `d2yoo3qu6vrk5d.cloudfront.net`, no desde su dominio.

---

## REFUTACIÓN — qué reabriría el expediente

1. **Certificado de Cámara de Comercio de INQLAB S.A.S.**: accionistas y
   representante legal actuales. Es lo único que zanja el asunto Santo Domingo en
   una dirección o en la otra.
2. **Si se confirma el control de Santo Domingo**, hay que añadir `controlGroup:
   'valorem'` y revisar el aviso de dueño compartido: pasaría de tres medios a
   cuatro y sería el mayor del mapa.
3. **Medir su encuadre** cuando haya corpus. Es un medio de mucho volumen y
   titular rápido: es de los que más se puede medir y de los que menos se sabe.
4. **Comprobar si la ficha del Media Ownership Monitor se ha actualizado.** La
   suya es vieja —Franco ya se retiró— y este proyecto ya se quemó una vez
   citando fichas de ese monitor sin mirar su fecha.
