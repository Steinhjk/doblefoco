# Auditoría de integración — 2026-09-01

**Alcance:** las costuras entre los sistemas — cliente en Vercel, motor y API en
Fly, base en Supabase, los nueve flujos de Actions — y lo que hace falta para que
el conjunto sea un producto integrado, automático y autosuficiente. No repite la
auditoría de agosto (algoritmos y corpus) ni el libro de hallazgos (feeds y
fuentes): mira lo que queda **entre** las piezas.

**Método:** todo lo que se afirma aquí se comprobó hoy contra el sistema vivo —
la base de producción, `/api/health`, las cabeceras que sirve Vercel, los
secretos y las ejecuciones de Actions, y la suite local—. Donde algo no se pudo
medir, se dice.

**Qué pasa con lo pendiente:** por la regla de la minuta, cada hallazgo de aquí
que quede sin hacer está anotado en `MINUTA.md` con su fecha. Este documento es
la foto; la cuenta la lleva la minuta.

---

## El estado medido hoy

| | |
|---|---|
| Suite local | **731 pruebas en 44 archivos, todas en verde**; lint y tipos limpios |
| `check:registry` | sin errores de integridad; 15 medios con `ownerType: null` declarado |
| Base | 7 568 artículos · 5 986 historias · persistente |
| Ingesta | viva (última pasada 15:44 UTC de hoy) · 74 de 76 feeds en verde |
| Fly sirve | `2c82323` — **main va en `c872ddb`: 3 commits de desfase, real ahora mismo** |
| Actions | todo en verde salvo **Desplegar el motor (falló hoy)** y **Desfase (falló el 31/08)** |
| Secretos del repositorio | **solo `DATABASE_URL`** |
| Issues abiertos | #4 (centinela, desde el 24/08, sin leer) · #5 (auditoría, 22 sin cerrar) |
| Libro de hallazgos | 22 abiertos, 6 resueltos, **0 aceptados con nota** |

## Lo que está bien, y es más de lo habitual

Conviene decirlo primero porque cambia el tamaño de lo que falta. **El producto
funciona hoy**: el sitio responde, la ingesta corre sola cada 30 minutos con red
de seguridad cada 2 horas, la copia diaria excluye datos personales con el motivo
escrito, la restauración **se prueba en CI contra una base vacía en cada push**
—eso casi nadie lo tiene—, hay RLS en toda la base, invariantes contra
producción, un libro de hallazgos con memoria, y una prueba que impide que la CSP
y el registro de medios diverjan. La disciplina documental (MINUTA, DECISIONES,
libro) es la infraestructura que hace barato todo lo demás.

Lo que separa esto de un producto terminado **no son funcionalidades**: son
(a) un lazo de despliegue y avisos que aún no cierra solo, (b) una cola de
decisiones de producto que bloquea tres tramos del plan, y (c) trabajo editorial
de fichas. De eso es esta auditoría.

---

## Hallazgos

### I-1 · El despliegue es automático a medias, y la mitad manual es la que falla
**Severidad: alta — es la causa del desfase que está ocurriendo ahora mismo**

El cliente se despliega solo (Vercel, en cada push a `main`). El motor no: a
`desplegar-motor.yml` le falta `FLY_API_TOKEN` —`gh secret list` devuelve solo
`DATABASE_URL`— y **falla en cada push desde que existe**; hoy mismo, a las
04:29 UTC. Consecuencias medidas:

- Fly sirve `2c82323` y `main` está 3 commits por delante. El desfase que
  `desfase.yml` acusó el 31/08 **sigue abierto hoy** porque nada puede cerrarlo.
- Cada push produce una ejecución en rojo que no significa nada nuevo. Un rojo
  que se repite sin remedio **enseña a ignorar el rojo**, que es la enfermedad
  exacta que costó los trece días de copia.

**Remedio:** el trámite de 10 minutos que ya está escrito en la minuta
(`fly tokens create deploy` → `gh secret set FLY_API_TOKEN`, sin pegar el valor
en el chat). No hay trabajo de código; hay un gesto de Jose que desbloquea el
único eslabón manual que queda en todo el ciclo de publicación.

### I-2 · El vigilante del desfase ve, pero no tiene a quién decírselo
**Severidad: media-alta — falló el 31/08 y nadie se enteró**

`desfase.yml` compara a diario lo desplegado con `main` y funciona. Pero es el
único vigilante de los cinco que **no abre issue**: `comprobarDesfase.mjs` no
recibe token ni tiene paso de aviso. Su rojo se queda en la pestaña de Actions,
que es exactamente donde se quedó el de la copia trece días. Comprobado: la
ejecución del 31/08 falló, el desfase que acusaba sigue vivo, y no hay issue.

**Remedio:** copiarle el patrón de aviso de `vigilancia.yml` (buscar por
etiqueta, abrir o comentar, cerrar al recuperarse — «volvió a coincidir» es un
hecho comprobable, así que aquí el cierre automático es legítimo). Una hora.

### I-3 · Los avisos llegan a una bandeja que nadie mira
**Severidad: alta en la práctica — es la meta-causa de tres incidentes**

La cadena de vigilancia termina en issues de GitHub, y la evidencia de un mes
dice que ahí se detiene: el del centinela lleva **ocho días sin leer** (#4), el
de la auditoría acumula 22 sin cerrar (#5), y la copia estuvo trece días en rojo
sin issue pero también sin nadie mirando Actions. El proyecto ya escribió la
frase: *un vigilante que acusa donde nadie lee no es un vigilante*. Se aplicó a
la copia; falta aplicarla al canal entero.

**Remedio (el más barato primero):** que cada issue de vigilante se abra con
`--assignee Steinhjk` — GitHub manda correo al asignado, y el correo sí es una
bandeja que se mira. Si eso no basta en la práctica, el paso siguiente es un
aviso push (ntfy/Telegram) desde los mismos workflows. Media hora la primera
opción, y convierte cinco vigilantes en cinco timbres.

### I-4 · La copia avisa del fallo, no de la ausencia
**Severidad: media — el agujero que la propia minuta deja anotado**

`backup.yml` ya abre issue si la copia falla. Lo que nada cubre es que el flujo
**deje de correr** —un cron deshabilitado por inactividad del repositorio, un
cambio de rama, un workflow borrado—: eso no produce ningún fallo que avisar.

**Remedio:** un hombre-muerto barato en `vigilancia.yml` (que ya corre cada 6 h
con acceso a la base y a `gh`): preguntar por la última ejecución **exitosa** de
`backup.yml` y acusar si tiene más de 48 h. Dos o tres horas con su prueba.

### I-5 · Hay configuración muerta que da instrucciones vivas
**Severidad: media — es la clase de divergencia silenciosa que el proyecto persigue**

Comprobado archivo por archivo y contra las cabeceras que Vercel sirve de verdad:

- **`public/_headers` no lo lee nadie** — es convención de Netlify/Cloudflare;
  Vercel lo ignora y el servidor de Fly tampoco lo abre. Y su CSP es **la
  vieja**: aún permite `images.unsplash.com` y le faltan decenas de dominios que
  `vercel.json` sí tiene. La CSP viva (medida en `doblefoco.co`, también en las
  rutas SSR reescritas a Fly) es la de `vercel.json`, que además está guardada
  por `csp.test.js`. Dos CSP divergentes donde solo una manda es exactamente el
  defecto que ese test existe para impedir — solo que el test no sabe que hay
  una segunda copia.
- **`public/_redirects` tampoco lo lee nadie**, y es peor que inútil: si el
  sitio migrara algún día a un host que sí lo lea, su catch-all `/* →
  /index.html` rompería las reescrituras SSR **en silencio**.
- **`.env.example` ordena mantener las dos** («en vercel.json Y en
  public/_headers»), así que la instrucción escrita apunta a un archivo muerto.
- **`securityService.js` sigue sin un solo import** (duda 10, abierta desde el
  30/07). Es una lista de cabeceras con aspecto de configuración que no protege
  nada.

**Remedio:** borrar `_headers`, `_redirects` y `securityService.js`; corregir el
comentario de `.env.example`. Una sesión corta, y tres sitios menos donde una
verdad puede desdoblarse.

### I-6 · La CSP permite un origen que no existe
**Severidad: baja-media — hoy inofensivo, mañana una decisión**

`connect-src` incluye `https://api.doblefoco.co` y ese DNS **no resuelve**
(NXDOMAIN, comprobado). O se crea el CNAME hacia Fly —recomendado: despega al
cliente del hostname `doblefoco.fly.dev`, y una futura migración del motor
dejaría de exigir tocar CSP, `vercel.json` y el build del cliente a la vez— o se
retira de la CSP para que la lista solo afirme lo que es verdad.

### I-7 · No hay handshake de versión entre cliente y motor
**Severidad: media-alta mientras I-1 siga abierto**

Confirmado en código: `apiClient.js` y `apiBase.js` no comparan ningún commit, y
`/api/health` ya publica el suyo. Es la tarea 2-B del plan de continuidad, y esta
auditoría solo añade un dato: **el desfase contra el que protege está ocurriendo
hoy**. El vigilante diario lo ve con hasta 24 h de retraso; el handshake lo haría
visible en el minuto uno, incluido el caso que ningún cron ve — un despliegue a
medias, un rollback.

### I-8 · Dos ingestas concurrentes con capacidades distintas, y el relevo no avisa
**Severidad: media — el riesgo ya está medido, falta el timbre**

El motor de Fly ingesta cada 30 min; Actions cada 2 h como red de seguridad. El
diseño es bueno y la base los distingue (`lastRunSource`). Lo que falta: si el
motor muere y queda solo la red de 2 h, **se pierde el 91 % de Infobae sin que
nada lo diga** (margen 0,09, medido en la minuta). El relevo silencioso convierte
una degradación en una mentira estadística.

**Remedio:** que la vigilancia acuse cuando la ingesta lleve horas viniendo solo
de la red de seguridad. Va bien pegado a I-4: mismo archivo, mismo patrón.

### I-9 · El repositorio vive dentro de OneDrive
**Severidad: operativa, baja-media — hasta el día que muerda**

`node_modules`, `dist` y `.git` se sincronizan a la nube en cada build. Además
del coste, OneDrive toma locks sobre archivos que git quiere mover: es una
fuente conocida de índices corruptos y de builds que fallan de forma
irreproducible. **Remedio:** excluir la carpeta del proyecto de la
sincronización (el remoto de GitHub ya es la copia) o mover el working copy
fuera de OneDrive.

### I-10 · Menudencias que mienten en voz baja

- **`.gitignore` de la raíz:** la negación `!.env.example` queda arriba y un
  `.env*` posterior la anula. Hoy no muerde porque `.env.example` ya está
  rastreado, pero el archivo dice una cosa y hace otra.
- **Región de Fly `gru` (São Paulo)** para un producto que se lee desde
  Colombia. Si el plan permite `bog`, las rutas SSR ganan decenas de
  milisegundos por ida y vuelta sin tocar código. Verificarlo cuesta un
  `fly platform regions`.
- **La cola de `aceptado` con nota está sin estrenar:** 22 hallazgos abiertos y
  varios son permanentes por naturaleza (Google News ordena por relevancia,
  cadencias lentas). El mecanismo existe justo para eso; mientras no se use, el
  libro acumula ruido que tapa lo nuevo. Es decisión por hallazgo, no código.

---

## Lo que NO encontré, y lo digo porque lo busqué

- **Secretos en el repositorio:** ninguno. `.env.local` fuera de git, el
  respaldo excluye las tablas con datos personales, la CA de Supabase es pública
  por diseño.
- **Deuda de pruebas en lo nuevo:** la suite cubre las costuras que fallaron
  antes (esquema, restauración, CSP↔registro, comentarios que mienten).
- **Ramas perdidas:** ninguna; el remoto está entero en `main`.
- **Desorden en la base:** artículos e historias en proporción sana, ingesta al
  día, 74/76 feeds respondiendo.

## La conclusión, en tres frases

El sistema está a **un secreto, dos timbres y una limpieza** de ser
operativamente autosuficiente: nada de eso suma más de una semana. Lo que de
verdad separa esto de un producto final no está en el código sino en la **cola
de decisiones de producto** —archivo, ventana, punto ciego, Infobae, fichas—
que ya tiene todos sus estudios escritos y solo espera una sesión de decisión.
El plan que acompaña a esta auditoría (`PLAN_PRODUCTO_FINAL.md`) ordena las dos
cosas.
