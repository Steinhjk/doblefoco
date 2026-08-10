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
| **Boyacá Digital** | `boyacadigital.com/rss.xml` | 1 h · 20 art. | **NO ENTRA: su redacción son agentes de IA** — ver abajo |
| **Telecafé** | `telecafe.gov.co/feed/` | 35 h | Canal público regional del Eje Cafetero. **DADO DE ALTA** — ver la corrección de abajo |
| **La Libertad** | `diariolalibertad.com/feed` | 1 h · 50 art. | Segunda voz del Atlántico, que hoy depende de El Heraldo y Telecaribe |
| **Canal TRO** | `canaltro.com/feed/` | 2 h | Segunda voz de Norte de Santander |
| **Melodía Stereo** | `melodiastereo.com/feed/` | 1 h | Muy activo; **falta identificar de dónde es** |

### Telecafé entró; Boyacá Digital, no

**Telecafé está dado de alta** con orientación mixta provisional, como los otros
tres canales públicos del catálogo. Su ficha de propiedad se resolvía sola: la
dirección la designan las gobernaciones de Caldas, Risaralda y Quindío.

**Y hay que corregir lo que decía este mismo informe**: se anotó que Telecafé
«cubre Quindío, que hoy solo tiene un medio anónimo», dando a entender que le
daba a Quindío un medio propio. No es así. El campo `departamento` dice de
dónde ES el medio, y Telecafé emite desde Manizales, o sea Caldas. **Quindío
sigue sin medio suyo.** Lo que sí llegará son titulares que nombren Armenia o
Calarcá, y esos los etiqueta el detector geográfico.

**Boyacá Digital NO entra, y no por falta de papeles.** Declara ser «un medio
operado por una redacción de agentes de inteligencia artificial bajo supervisión
editorial» y se anuncia como el primer periódico autónomo con agentes de IA de
Colombia. No hay responsable identificable, su orientación es una propiedad de
su configuración y no de una casa, y contarlo como una redacción más en el
recuento de pluralidad sería volver a cruzar la línea que la Fase 0 trazó al
retirar 600 citas fabricadas. El razonamiento entero está en
`fichas/boyaca-digital.md`, y la decisión de si el catálogo admite
redacciones automatizadas es de Jose.

**Ojo con lo que esto anuncia.** Si Boyacá Digital es el primero, habrá más, y
llegarán a los departamentos vacíos antes que los medios humanos: montar un
portal automatizado para Vaupés cuesta mucho menos que sostener una redacción
allí. El mapa podría llenarse de departamentos «cubiertos» sin nadie
reporteando.

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
4. **Decidir si el catálogo admite redacciones automatizadas**, y con qué marca
   visible. Lo obliga Boyacá Digital y no puede esperar a que lleguen tres más.
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

---

## Segunda vuelta, dirigida — 2026-08-09

Tras ver que las fuentes estructuradas no sirven para lo regional, se atacaron a
mano **los cinco departamentos que seguían sin ningún candidato**. Resultado: dos
se desbloquean y tres se confirman como huecos reales.

### Córdoba y Nariño dejan de estar bloqueados

Los dos figuraban como imposibles: Córdoba porque El Meridiano devuelve 403 a
los bots, y Nariño porque Diario del Sur tiene la editora en liquidación y el
feed sin fechas. **Ninguno de los dos era el único medio de su departamento.**

| Departamento | Medio | Feed | Último |
|---|---|---|---|
| **Córdoba** | Chicanoticias | `chicanoticias.com/feed/` | 1 h · 25 art. |
| **Córdoba** | La Razón | `larazon.co/feed/` | 1 h |
| **Córdoba** | Río Noticias | `rionoticias.co/feed/` | 5 h |
| **Nariño** | Nariño Ahora | `narinoahora.com/feed/` | 29 h |
| **Nariño** | Abra Noticias | `abranoticias.com/feed/` | 27 h |

Descartados en la misma vuelta: `eldiariodecordoba.co` lleva **21 meses** sin
publicar, e `ipitimes.com` no expone feed.

**La lección se repite**: dar un departamento por perdido porque su medio más
conocido está bloqueado es el mismo error que dar un medio por mudo sin probar
el `<link rel="alternate">`. En los dos casos el fallo fue detenerse en el
primero.

### Amazonas, Guainía y Vaupés: el hueco es real

Tercera búsqueda con ángulos nuevos —medios municipales, radio comunitaria,
comunicación indígena— y **sigue sin aparecer un solo medio con presencia web**.
Lo que sí hay:

- **RTVC montó estudios de radio y televisión en Leticia**, dirigidos por Nelly
  Kuiru, comunicadora indígena del pueblo Murui, con emisión en lenguas de la
  región.
- **El MinTIC abrió en agosto de 2026** —resolución 03202 del 3 de agosto— las
  condiciones para concesiones de radiodifusión comunitaria indígena.

Es decir: **en esos tres departamentos la comunicación existe y es radio, no
web**. Un agregador de RSS no puede alcanzarla, y eso no es un fallo del
catálogo sino un límite del formato. Decirlo en la vista departamental es más
honesto que dejar tres departamentos en blanco como si allí no hubiera nadie
contando nada.

### FLIP, tercer intento fallido

`flip.org.co/cartografias-informacion` devolvió 502 y después 404 en dos rutas
distintas. Su sitio está roto o reestructurado, no bloqueándonos. Sigue siendo
la mejor fuente pendiente.
