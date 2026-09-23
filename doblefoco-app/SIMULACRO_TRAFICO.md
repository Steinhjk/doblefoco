# Simulacro de tráfico — 2026-09-22 (M1.4 del plan del MVP)

**Qué se preguntó:** cuántas visitas aguanta el sitio antes de romperse, qué
pieza cede primero y qué se hace el día que un tuit funcione. Lo autorizó Jose
el 2026-09-22; el sitio todavía no está lanzado.

**Cómo:** una copia de la API (`doblefoco-carga`, app aparte de Fly, en `gru`)
con el límite por IP relajado, leyendo **la base de producción**. Una máquina
generadora con k6 (`scripts/simulacro.k6.js`) en la misma región. Una «visita»
son las peticiones que hace un navegador de verdad, medidas ese día contra
producción: la portada son 5 llamadas a la API y la noticia son 3. Reparto:
70 % portada y 30 % noticia. Escalones de 2 minutos. **La copia se borró al
terminar.** Costo: unos 40 minutos de tres máquinas pequeñas, por debajo de
0,05 USD.

---

## Lo que salió

**Primera corrida, 1 máquina de API:**

| Visitas/s | Peticiones/s | Mediana | p95 | Fallos |
|---|---|---|---|---|
| 1 | 4,6 | 0,18 s | 1,1 s | 0 % |
| 2 | 7,8 | 2,3 s | **8,1 s** | 0 %: se detuvo por lentitud |

**Segunda corrida, 3 máquinas de API:** se detuvo en **3 visitas/s** con
**10,4 % de fallos**, p95 de 5,9 s y máximo de 12,8 s.

> **El sitio se satura hacia las 2 visitas por segundo**: unas 120 personas por
> minuto llegando a la vez. Un tuit que funcione trae más que eso.

## Qué cede primero: la conexión a la base, no la máquina

Los registros de la segunda corrida lo dicen literalmente:

```
(EMAXCONNSESSION) max clients reached in session mode -
max clients are limited to pool_size: 15
```

1. **Supabase admite 15 conexiones a la vez** en el modo en que nos conectamos
   (pooler en «session mode», puerto 5432), y las comparten **todos** los
   procesos.
2. **Cada proceso reserva hasta 8** (`DATABASE_POOL_MAX`, por defecto 8 en
   `server/db/pool.js`). La API y el motor ya suman **16**, por encima del tope
   **sin tráfico ninguno**. Hoy no revienta porque rara vez las usan todas a la
   vez.
3. **Cada visita vuelve a hacer el trabajo entero contra la base**: lee 100
   historias con sus artículos, cuenta el corpus, calcula el vocabulario y
   reagrupa los sucesos. Medido sin carga: ~0,7 s de servidor para
   `/api/feed` (1,4 MB de JSON) y ~0,5 s para `/api/portada`. **Los datos solo
   cambian cada 30 minutos**, con el ciclo del motor, y aun así se recalculan
   para cada visitante.
4. **Por eso más máquinas no ayudan: empeoran.** Con 3 máquinas hay 3 fondos de
   conexiones peleándose por las mismas 15. La receta obvia, `fly scale count`,
   **es la que no hay que aplicar**.

**La compresión no es el problema.** La hace el proxy de Fly (`content-encoding:
br`), no nuestra API.

## El efecto sobre producción, dicho entero

La copia leía la misma base que producción. **Durante la segunda corrida
(00:04 a 00:08 UTC), la API de producción también dio `EMAXCONNSESSION`**:
unos 4 minutos de portadas que fallaban o salían degradadas. Con un sitio ya
lanzado, esto no se habría podido correr así. **La próxima vez: contra una
copia de la base**, no contra producción.

**Aparte, y sin relación con el simulacro:** el vigilante que medía producción
cada 10 s registró tiempos agotados sueltos (20 s sin respuesta) **antes,
durante y después** de la prueba, y siguió viéndolos con la copia ya borrada
(1 de cada 20). Esos no dejan ningún error de base en los registros. Queda
abierto, y hay que mirarlo antes de lanzar.

---

## La receta: qué hacer, en orden

### Antes de lanzar (trabajo de código, no de emergencia)

1. **Guardar las respuestas unos segundos en memoria.** Si `/api/feed`,
   `/api/portada`, `/api/panorama` y `/api/departamentos` se calculan una vez y
   se sirven desde memoria durante 60 s —y se recalcula uno solo aunque lleguen
   cien a la vez—, la base recibe **una consulta por minuto en vez de una por
   visita**. Los datos cambian cada 30 minutos, así que 60 s de retraso no se
   notan. **Es el arreglo que cambia el orden de magnitud**, y hay que volver a
   medirlo con el simulacro después.
2. **Que la API y el motor no pasen juntos de 15 conexiones.** Por ejemplo,
   `DATABASE_POOL_MAX=5` para la API y `4` para el motor. O pasar al pooler en
   modo transacción de Supabase (puerto 6543), que reparte muchas más
   conexiones. Esto último cambia la cadena de conexión: **es gesto de Jose**,
   con el procedimiento de rotación de la credencial.

### El día de un pico

1. **Mirar** `https://api.doblefoco.co/api/health` y
   `fly logs -a doblefoco | grep EMAXCONN`. Si aparece ese error, es la base.
2. **No escalar máquinas** (`fly scale count`): con la base como límite,
   empeora.
3. Con el arreglo 1 hecho, una máquina debería aguantar muchísimo más. Hay que
   **volver a correr el simulacro** para saber cuánto, y escribir aquí el número
   nuevo.

## Cómo repetirlo

`scripts/simulacro.k6.js` explica el guion. La orden para la máquina generadora
y la configuración de la copia (solo el proceso `api`, con
`RATE_LIMIT_MAX` alto y **sin el motor**, para no duplicar la ingesta) están
descritas en `MINUTA.md`, 2026-09-22. **La copia hay que borrarla al terminar:
sus conexiones abiertas le quitan cupo a producción.**
