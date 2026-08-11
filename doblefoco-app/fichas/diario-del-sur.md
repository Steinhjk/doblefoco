# Diario del Sur (Pasto) — ficha de orientación

| | |
|---|---|
| **Valor propuesto** | **ninguno** — el alta no se recomienda todavía |
| **Firma** | ☐ no procede: no hay número que firmar |
| **Fecha** | 2026-08-09 (candidatura) |
| **Protocolo** | `PROTOCOLO_JUICIO_EDITORIAL.md` |
| **Departamento** | Nariño |

> **Dos bloqueos independientes, y cualquiera de los dos basta.** Uno es de
> gobernanza: su editora tiene la matrícula cancelada. El otro es técnico y
> nuestro: su feed no trae fechas, y sin fecha el motor no puede hacer su
> trabajo.

---

## EVIDENCIA ADMISIBLE

### Nivel 1 — Quién lo posee, hoy

| Dato | Valor | Fuente |
|---|---|---|
| Empresa editora | **Grupo Editorial Diario del Sur S.A.S. EN LIQUIDACIÓN** | [RUES vía empresas.larepublica.co](https://empresas.larepublica.co/colombia/narino/pasto/grupo-editorial-diario-del-sur-sas-891222292) |
| NIT | 891222292 | ídem |
| Matrícula RUES | **Cancelada** | ídem |
| Constitución | 26-08-1983 | DataCrédito Empresas |
| Propietario | **Hernando Suárez Burgos** | DataCrédito Empresas |
| Gerente | **Ronald Tupaz Bustos** | ídem |
| Circulación | Nariño y Putumayo, de lunes a domingo | Wikipedia (nivel 4) |
| Gremio | Afiliado a Andiarios | ídem |

Persona natural identificada y sociedad identificada: el nivel 1 está mejor
cubierto aquí que en varias fichas del catálogo. **El problema no es que falte
información, es lo que la información dice.**

### Nivel 2 — Conducta medida: NO EXISTE, y no podría existir tal como está

**Su feed trae los `<pubDate>` VACÍOS.** No es una suposición; se descargó y se
miró: diez artículos, la etiqueta presente en los diez, sin contenido dentro.

```xml
<title>Karol G sorprende a sus seguidores con novedades sobre su nuevo álbum</title>
<pubDate></pubDate>
```

**Por qué esto es descalificante y no un detalle de formato:**

- Sin `publishedAt`, la **poda por retención** no sabe cuándo caducan sus
  artículos: se quedarían en el corpus indefinidamente o se irían todos a la vez.
- **«Más recientes» no puede ordenarlos.** Entrarían al feed en una posición
  arbitraria.
- La **cronología de cobertura** de cualquier historia que toquen quedaría
  falseada.

Y la salida fácil —ponerles la fecha de la descarga— es justamente la que no se
puede tomar: **convertiría a Diario del Sur en el medio más al día del catálogo
por un defecto de su feed**, y sería un dato inventado presentado como medido.
Eso es la fabricación que este proyecto se quitó de encima en la Fase 0.

### Sobre el titular que salió en la muestra

El artículo más reciente de su feed era sobre el nuevo álbum de Karol G. Un
titular no es una muestra y **no lo uso como evidencia de nada** — se anota
solo porque quien lea esta ficha verá el ejemplo de arriba y merece saber que no
se eligió para insinuar nada sobre su agenda.

---

## POR QUÉ NO SE PROPONE NÚMERO

Igual que en la ficha de El Nuevo Día: hay nivel 1 sólido, pero lo que dice no
sitúa al medio en el eje, sino que pone en duda la estabilidad de la casa. Regla
4 del protocolo: *es mejor que quede sin firmar.*

---

## LO QUE ESTO DEJA ABIERTO, Y ES INCÓMODO

**Diario del Sur era el único candidato de Nariño con feed.** No hay plan B
verificado. Nariño es un departamento de casi dos millones de habitantes, con
Tumaco y la frontera con Ecuador dentro, y se queda en blanco en el mapa.

Antes de darlo por perdido, en este orden:

1. **Escribirles.** Un `<pubDate>` vacío en WordPress suele ser un plugin mal
   configurado, y se arregla en una tarde. Es la vía más barata y la que además
   respeta la regla de no silenciar a nadie.
2. **Buscar otro medio pastuso.** No agoté Nariño: probé un dominio. Quedan por
   mirar las emisoras y los medios de Tumaco e Ipiales.
3. **Solo si lo anterior falla**, decidir explícitamente qué fecha se les pone
   y **declararlo en la página de transparencia** — nunca en silencio.

---

## REFUTACIÓN — qué reabriría el expediente

1. **Que el feed empiece a traer fechas.** Comprobable en un minuto con
   `npm run feed:descubrir -- diariodelsur.com.co`: la salida avisa «SIN FECHA».
2. **Que aparezca una editora con matrícula activa** tras la liquidación.
3. **Que se documente el accionariado** de la sociedad y el papel actual de
   Hernando Suárez Burgos, que hoy consta como propietario de una sociedad
   cancelada — una combinación que pide explicación.
