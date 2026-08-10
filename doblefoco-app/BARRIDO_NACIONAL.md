# Barrido nacional de medios — 2026-08-09

Se hizo tras cerrar las 22 fichas departamentales, para comprobar si había una
vía sistemática de encontrar medios en vez de ir departamento por departamento.

**La respuesta es que no la hay, y esa es la conclusión principal.**

---

## Lo que se hizo

| Paso | Herramienta | Resultado |
|---|---|---|
| Cosecha | `npm run medios:cosechar` | 468 medios colombianos en Wikidata, 258 artículos en Wikipedia |
| Filtrado | mismo script | 124 dominios nuevos tras quitar catálogo y revistas académicas |
| Comprobación | `npm run feed:descubrir` | **42 con feed vivo**, 19 publicando en las últimas 72 h |

---

## La conclusión, que no era la buscada

| | |
|---|---|
| Medios colombianos en Wikidata | **468** |
| …con departamento asignado | **19** |
| Departamentos con categoría propia en Wikipedia | **15 de 33** |

**La prensa regional colombiana no está en las bases de datos estructuradas.**
Casi todo lo que sale es de Bogotá, Medellín y Cali. El hueco del mapa
departamental no es solo de nuestro catálogo: es de todo el registro público.

Eso reencuadra el trabajo de las 22 fichas. Buscar medio por medio y
departamento por departamento **no fue torpeza del método: no hay atajo**. El
Manduco publica a diario en el Guaviare y El Morichal lleva una década en la
Orinoquía; para Wikidata no existen.

---

## Lo que sí apareció y sirve

De los 42 vivos, la mayoría son radio musical, televisión religiosa, revistas
académicas o medios ya conocidos. **Cinco valen la pena:**

| Medio | Feed | Último | Por qué importa |
|---|---|---|---|
| **Boyacá Digital** | `boyacadigital.com/rss.xml` | 1 h · 20 art. | **Boyacá tiene por fin un candidato con propiedad por investigar** que no es EL DIARIO, cuya alta quedó bloqueada por no saber de quién es |
| **Telecafé** | `telecafe.gov.co/feed/` | 35 h | Canal público regional del Eje Cafetero. Cubre **Quindío**, que hoy solo tiene un medio anónimo |
| **La Libertad** | `diariolalibertad.com/feed` | 1 h · 50 art. | Segunda voz del Atlántico, que hoy depende de El Heraldo y Telecaribe |
| **Canal TRO** | `canaltro.com/feed/` | 2 h | Segunda voz de Norte de Santander |
| **Melodía Stereo** | `melodiastereo.com/feed/` | 1 h | Muy activo; **falta identificar de dónde es** |

**Telecafé es el hallazgo con más recorrido**: es canal público regional, así
que su ficha de propiedad se resuelve sola —depende de las gobernaciones del
Eje Cafetero— y eso es justo lo que bloqueó a los cuatro candidatos de la
cuarta tanda.

---

## Dos correcciones a lo que se dijo antes de mirar los datos

**Telepacífico y Teleislas siguen sin entrar.** Se afirmó a mitad del barrido
que estaban entre los encontrados; **no es cierto**. Telepacífico responde pero
no declara ni expone feed en ninguna de las 23 rutas probadas, y
`teleislas.com.co` no responde. Siguen exactamente donde estaban.

**Diario del Sur volvió a salir con los `<pubDate>` vacíos**, esta vez por una
vía independiente de la primera comprobación. Confirma el diagnóstico de
`fichas/diario-del-sur.md` en lugar de repetirlo.

---

## Una fuente que se decidió no usar

**prensaescrita.com** tiene el mejor listado de prensa regional colombiana por
ciudad que se encontró. Devuelve **403 a nuestro bot y 200 a un navegador**: es
un bloqueo deliberado.

No se saltó. Cambiar el `User-Agent` para evadirlo contradiría lo que el propio
motor declara —«si nos bloquean, que sepan a quién»— y sería incoherente con lo
que hacemos cuando nos bloquea un medio, que es escribirle. **Si ese listado
hace falta, se pide permiso.**

---

## Lo pendiente, por orden de rendimiento

1. **La FLIP.** «Cartografías de la Información» mapea los medios de 141
   municipios y visitó justo nuestros huecos: Guaviare, Putumayo, Caquetá,
   Chocó, Casanare, Cauca, Bajo Cauca y Catatumbo. **Su web devolvía 502 el
   2026-08-09.** Es la mejor fuente que existe para lo regional y merece varios
   intentos.
2. **Escribir a prensaescrita.com** pidiendo permiso o una copia del listado.
3. **Identificar Melodía Stereo** y darle departamento.
4. **Telecafé y Boyacá Digital**: ficha de propiedad y alta.
5. **SembraMedia por su API**, si la tiene. El raspado de su directorio devolvió
   dos fichas de once páginas; el selector estaba mal y no se depuró.

---

## Cómo repetirlo

```
npm run medios:cosechar                       # informe con los candidatos
npm run medios:cosechar -- --lista > d.txt    # solo dominios
npm run feed:descubrir -- d.txt               # cuáles publican de verdad
```

Ninguna de las dos herramientas decide nada: encuentran y comprueban. Quién
entra al catálogo lo sigue decidiendo una ficha de propiedad y una firma.
