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

## Después del arreglo: de 2 a 12 visitas por segundo

Se repitió el mismo día contra una copia de la API con `cacheDeRespuestas.js`
(ver «La receta» abajo). **Contra producción, pero con cuidado**, por decisión
de Jose: una sola máquina, un máximo de 3 conexiones a la base y parada al
primer 1 % de fallos. Se descartó copiar la base porque incluye datos
personales (la lista de espera, los usuarios del panel y los reportes).

| Visitas/s | Sin memoria | Memoria de 60 s | Memoria + JSON ya serializado |
|---|---|---|---|
| 1 | p95 1,1 s | p95 0,06 s | — |
| 2 | **se rompe** (p95 8,1 s) | p95 0,06 s | — |
| 4 | — | p95 0,06 s | — |
| 8 | — | p95 0,06 s | p95 0,08 s |
| 12 | — | **se rompe** (p95 8,1 s) | **p95 0,08 s, 0 fallos** |
| 16 | — | — | **se rompe** |

- **Durante esas dos corridas, producción no dio ni un solo
  `EMAXCONNSESSION`**: la base dejó de ser el límite.
- Con la base fuera del camino, el techo pasó a ser **la CPU**: `res.json`
  convertía 1,4 MB a texto en cada respuesta. Por eso la caché guarda el texto
  ya serializado, que es la tercera columna.
- **Hoy, con una máquina `shared-cpu-1x`, el sitio aguanta unas 12 visitas por
  segundo**, unas 43 000 por hora. El siguiente techo es la CPU compartida de
  esa máquina. Ahora **sí** escalar ayudaría, porque ya no se pelean por la
  base: `fly scale count api=2` o una máquina con más CPU. Hay que medirlo
  antes de afirmarlo.

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

**Aparte, y sin relación con el simulacro, tres cosas vistas ese día:**

1. **Tiempos agotados sueltos contra la API**: 20 s sin conexión, más o menos
   1 de cada 20 peticiones, antes, durante y después de las pruebas. **No dejan
   error en el servidor.** Se investigó y tiene dos capas:
   - **IPv6**: la red desde la que se probó **no tiene IPv6 para ningún sitio**
     (tampoco Google ni Cloudflare), y `curl` a veces probaba IPv6 primero. Los
     navegadores prueban las dos vías a la vez y usan la que responde, así que
     **esto no afecta a lectores**.
   - **IPv4**: forzando IPv4 siguió pasando, y **en ese mismo instante Vercel y
     Google respondían**. Falla solo la conexión a la IP compartida de Fly desde
     esa red: 4 de 55 en una sonda de 8 minutos. Desde dentro de Fly, la
     generadora no vio ni un fallo. **Queda abierto**: puede ser el camino entre
     ese proveedor y Fly. Hay que comprobar si pasa desde otras redes (el móvil
     con datos, o `vigilancia.yml` desde GitHub). Si se confirma, una IPv4
     dedicada en Fly cuesta unos 2 USD al mes.
2. **Vercel activó su «Security Checkpoint»** (`X-Vercel-Mitigated:
   challenge`), el mismo del 2026-07-29 (duda 8). Al final de la sesión, todas
   las peticiones automáticas a `doblefoco.co` recibían 403, incluidas las que
   se presentaban como Googlebot o como un Chrome normal, y las que salían de
   los servidores de Anthropic. **No se sabe si lo disparó el tráfico de las
   sondas o si afecta a todo el mundo**, y eso decide si Google y las tarjetas
   de WhatsApp y X están bloqueados. Se comprueba en el panel de Vercel →
   Firewall, y abriendo el sitio desde un navegador normal y desde el móvil con
   datos.

---

## La receta: qué hacer, en orden

### Antes de lanzar (trabajo de código, no de emergencia)

1. ~~**Guardar las respuestas unos segundos en memoria.**~~ **HECHO y medido el
   2026-09-22** (`server/cacheDeRespuestas.js`): feed, portada, panorama,
   departamentos y la historia de cada noticia, 60 s y ya serializadas; y 15 s
   lo que `/api/health` consulta a la base. Cuando una entrada caduca, cien
   peticiones a la vez calculan una sola vez. **De 2 a 12 visitas por
   segundo.** `CACHE_RESPUESTAS_MS=0` la apaga.
2. **Que la API y el motor no pasen juntos de 15 conexiones.** Por ejemplo,
   `DATABASE_POOL_MAX=5` para la API y `4` para el motor. O pasar al pooler en
   modo transacción de Supabase (puerto 6543), que reparte muchas más
   conexiones. Esto último cambia la cadena de conexión: **es gesto de Jose**,
   con el procedimiento de rotación de la credencial.

### El día de un pico

1. **Mirar** `https://api.doblefoco.co/api/health` y
   `fly logs -a doblefoco | grep EMAXCONN`. Si aparece ese error, es la base.
2. **Si NO aparece ese error y la API va lenta, es la CPU**: con la caché
   puesta, `fly scale count api=2 -a doblefoco` reparte la carga. **Hay que
   bajar antes `DATABASE_POOL_MAX`**: cada máquina de más reserva conexiones, y
   la API y el motor ya suman 16 contra un tope de 15.
3. **Si aparece `EMAXCONNSESSION`, no escalar**: más máquinas son más
   conexiones peleándose por las mismas 15.
4. **La cifra de hoy: unas 12 visitas por segundo con una máquina.** Un pico
   que pase de ahí es la señal para el paso 2.

## Cómo repetirlo

`scripts/simulacro.k6.js` explica el guion. Los pasos de la copia, desde
`doblefoco-app/`:

1. **Configuración aparte**: una copia de `fly.toml` con `app =
   'doblefoco-carga'`, **sin el proceso `worker` ni su `[[vm]]`** —si no, habría
   dos motores ingiriendo en la base de producción— y con `RATE_LIMIT_MAX =
   '1000000'` en `[env]`. No se versiona.
2. `fly apps create doblefoco-carga -o personal`, y `fly secrets set --stage`
   con `DATABASE_URL`, **leída de `.env.local` a una variable y nunca escrita en
   pantalla**, y con `ALLOWED_ORIGINS`.
3. `fly deploy -a doblefoco-carga --config <la copia> --ha=false --remote-only`.
4. La generadora: `fly machine run grafana/k6:latest -a doblefoco-carga -r gru
   --vm-size shared-cpu-2x --vm-memory 1024 --restart no --rm --file-local
   /simulacro.js=scripts/simulacro.k6.js --file-local /simulacro.sh=<bucle>
   --entrypoint sh --detach -- /simulacro.sh`. El bucle corre `k6 run -q -e
   BASE=https://doblefoco-carga.fly.dev -e RATE=$r /simulacro.js` por cada
   escalón y se detiene al primer fallo. Cada escalón deja una línea
   `RESULTADO {…}` en `fly logs -a doblefoco-carga`.
5. **`fly apps destroy doblefoco-carga` al terminar.** Sus conexiones abiertas
   le quitan cupo a producción.

(En este equipo, `flyctl` está en `~/.fly/bin/flyctl.exe`. El 2026-09-22
estaba roto por una actualización a medias y se restauró copiando
`flyctl.exe.old`.)
