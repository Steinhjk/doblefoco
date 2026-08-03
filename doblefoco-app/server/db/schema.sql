-- =============================================================================
--  DOBLEFOCO.CO — ESQUEMA DE PERSISTENCIA (tarea F2-01)
-- =============================================================================
--  Estado: escrito y sin aplicar. No hay todavía ninguna base de datos
--  conectada; el motor sigue guardando artículos en memoria y pierde todo al
--  reiniciar. Lo único que ya persiste es la serie de métricas, en JSONL
--  (server/services/metricsStore.js), porque no podía esperar a esto.
--
--  Orden de aplicación recomendado
--  -------------------------------
--   1. ingest_runs  — cinco columnas, y empieza a acumular la serie de F1-01
--                     desde el primer ciclo. Migra las líneas del JSONL.
--   2. sources      — deriva de shared/mediaRegistry.js, que sigue siendo la
--                     fuente de verdad. Esta tabla es una PROYECCIÓN suya, no
--                     un segundo catálogo: se regenera desde el registro. Si
--                     alguien edita el sesgo aquí, vuelve el problema F1-04.
--   3. articles     — lo grande. Requiere reescribir el Map por consultas.
--   4. stories / story_articles — el agrupamiento, una vez el resto funcione.
--
--  Postgres gestionado (Supabase o Neon). Supabase tiene una ventaja que no es
--  la base de datos: su capa de autenticación cierra también F2-04, y hoy la
--  clave del panel viaja en el bundle del navegador.
-- =============================================================================

-- ── 1. Serie de ingesta ──────────────────────────────────────────────────────
-- Espejo exacto de las líneas del JSONL, para poder migrarlas con un INSERT por
-- línea sin transformar nada.

CREATE TABLE IF NOT EXISTS ingest_runs (
    id                      BIGSERIAL PRIMARY KEY,
    -- UNIQUE para que importar el JSONL sea repetible: la migración se puede
    -- correr dos veces sin duplicar la serie, y una importación interrumpida se
    -- reanuda sola. El instante de arranque identifica al ciclo porque el motor
    -- no permite ciclos solapados (ingestionInProgress).
    at                      TIMESTAMPTZ NOT NULL UNIQUE,
    duration_ms             INTEGER,
    feeds_ok                SMALLINT NOT NULL DEFAULT 0,
    feeds_failed            SMALLINT NOT NULL DEFAULT 0,
    active_feeds            SMALLINT NOT NULL DEFAULT 0,
    new_articles            INTEGER  NOT NULL DEFAULT 0,
    total_articles          INTEGER  NOT NULL DEFAULT 0,
    total_stories           INTEGER  NOT NULL DEFAULT 0,
    multi_source_stories    INTEGER  NOT NULL DEFAULT 0,
    cross_spectrum_stories  INTEGER  NOT NULL DEFAULT 0,
    blindspot_stories       INTEGER  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ingest_runs_at_idx ON ingest_runs (at DESC);

-- Artículos descartados por el filtro de formatos (F1-14): sorteos, horóscopos,
-- cotizaciones del día. Se registra para poder VIGILAR el filtro: uno demasiado
-- goloso solo se descubre echando en falta noticias que nadie sabe que
-- faltaron. Con la cifra en la serie, un salto se ve el mismo día.
ALTER TABLE ingest_runs ADD COLUMN IF NOT EXISTS filtered_articles INTEGER NOT NULL DEFAULT 0;

-- ── 2. Medios ────────────────────────────────────────────────────────────────
-- PROYECCIÓN de shared/mediaRegistry.js. Se regenera; no se edita a mano.
-- El sesgo vive en el registro y en ningún otro sitio: esa fue la tarea F1-04 y
-- costó cuatro documentos contradictorios descubrirlo.

CREATE TABLE IF NOT EXISTS sources (
    id              TEXT PRIMARY KEY,          -- el mismo id del registro
    name            TEXT NOT NULL,
    domain          TEXT NOT NULL UNIQUE,
    country         CHAR(2) NOT NULL,
    media_group     TEXT,
    bias            REAL NOT NULL CHECK (bias BETWEEN -1 AND 1),
    factuality      REAL NOT NULL CHECK (factuality > 0 AND factuality <= 1),
    bias_rationale  TEXT NOT NULL,
    reviewed_at     DATE,                      -- NULL = clasificación provisional
    synced_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. Artículos ─────────────────────────────────────────────────────────────
-- El enlace canónico es la clave natural: es lo que hace la deduplicación
-- idempotente entre ejecuciones. Ya funciona así en memoria.

CREATE TABLE IF NOT EXISTS articles (
    id              TEXT PRIMARY KEY,          -- hash FNV-1a del enlace (F1-11)
    canonical_url   TEXT NOT NULL UNIQUE,
    source_id       TEXT NOT NULL REFERENCES sources (id),
    headline        TEXT NOT NULL,             -- LITERAL del medio; nunca editado
    raw_title       TEXT,
    snippet         TEXT,                      -- real o NULL; nunca redactado
    category        TEXT,
    tone            JSONB,                     -- anotación de carga (headlineTone)
    published_at    TIMESTAMPTZ,
    ingested_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- La imagen que el propio medio publicó con la pieza, tal cual viene en su RSS
-- (media:content, media:thumbnail o enclosure). NULL cuando el feed no trae
-- ninguna, que es el caso más frecuente y NO se rellena con nada.
--
-- POR QUÉ ESTA COLUMNA EXISTE. La portada ilustraba cada noticia con una foto de
-- archivo de Unsplash elegida por hash del titular: «Condenan a Carlos Caicedo a
-- cerca de 10 años de cárcel» salía con la foto etiquetada «Indicadores
-- Económicos». Una imagen junto a un titular se lee como documental, así que era
-- la misma fabricación que la Fase 0 eliminó del texto, sobreviviendo en el
-- apartado visual. O es la imagen del medio, o no hay imagen.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Cuándo se miró la PÁGINA del artículo buscando su og:image. NULL = nunca.
--
-- ES LA COLUMNA QUE HACE QUE ESTO ESCALE, y sin ella el diseño entero no se
-- sostiene: 18 de los 33 feeds no publican imagen en su RSS, así que la única
-- vía para ellos es leer la etiqueta og:image de la página. Sin marcar el
-- intento no habría forma de distinguir «no se ha mirado» de «se miró y no
-- tiene», y cada ciclo volvería a pedir las mismas miles de páginas para
-- siempre. Con la marca, cada artículo se consulta UNA vez en su vida.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_checked_at TIMESTAMPTZ;

-- Los candidatos a enriquecer: sin imagen y sin mirar. Parcial porque la
-- consulta solo pregunta por esas filas y el índice encoge a medida que se
-- resuelven.
CREATE INDEX IF NOT EXISTS articles_sin_imagen_idx
    ON articles (published_at DESC NULLS LAST)
 WHERE image_url IS NULL AND image_checked_at IS NULL;

-- TEMA Y ÁMBITO — dos ejes que estaban colapsados en `category`.
--
-- POR QUÉ HAY DOS COLUMNAS NUEVAS Y NO UNA. `category` guardaba la categoría
-- del FEED por el que entró el artículo, no el tema de la noticia: con 24 de
-- los 39 feeds declarados como «Política», casi todo era política por
-- definición. Y metía «Internacional» en la misma columna que «Economía»,
-- aunque no es un tema sino un ámbito, de modo que una noticia tenía que
-- elegir entre ser internacional o ser deportiva. El caso que lo rompió es
-- real: la geopolítica de qué países compiten en un mundial es las dos cosas.
--
-- `topics` es un array porque la clasificación es MULTIETIQUETA. Una reforma a
-- las EPS es Salud y es Política, y obligar a elegir pierde exactamente las
-- historias que más se cubren. Los valores son los `id` de shared/
-- topicClassifier.js, no sus nombres visibles: el desajuste entre el `Judicial`
-- de los feeds y el `Justicia` de la interfaz dejaba esa baldosa en cero con
-- cinco historias dentro, y con ids eso no puede repetirse.
--
-- `category` SE CONSERVA, sin uso nuevo. Guarda lo que se le mostró al lector
-- antes de esta migración, igual que las métricas de cobertura se guardan
-- calculadas para poder auditar qué decía el sitio y cuándo.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS topics TEXT[];
ALTER TABLE articles ADD COLUMN IF NOT EXISTS ambito TEXT
    CHECK (ambito IS NULL OR ambito IN ('nacional', 'internacional'));

CREATE INDEX IF NOT EXISTS articles_published_idx ON articles (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS articles_source_idx    ON articles (source_id);

-- Los candidatos a recategorizar: lo ingerido antes de que existiera el
-- clasificador. Parcial, así que encoge conforme se resuelven y desaparece
-- cuando no quede ninguno.
CREATE INDEX IF NOT EXISTS articles_sin_tema_idx
    ON articles (published_at DESC NULLS LAST) WHERE topics IS NULL;

-- La ventana de retención pasa a ser una consulta, no un barrido en memoria:
--   DELETE FROM articles WHERE COALESCE(published_at, ingested_at) < now() - interval '72 hours';

-- ── 4. Historias ─────────────────────────────────────────────────────────────
-- Las métricas de cobertura se guardan CALCULADAS porque dependen del catálogo
-- en el momento del cálculo. Si mañana se revisa el sesgo de un medio (F1-13),
-- las historias viejas conservan la medición que se le mostró al lector: se
-- puede auditar qué decía el sitio y cuándo.

CREATE TABLE IF NOT EXISTS stories (
    id                   TEXT PRIMARY KEY,
    title                TEXT NOT NULL,        -- titular del medio representativo
    title_source_id      TEXT REFERENCES sources (id),
    title_url            TEXT,
    category             TEXT,
    published_at         TIMESTAMPTZ,
    first_seen_at        TIMESTAMPTZ,
    mean_bias            REAL,
    polarization         REAL,
    coverage_left        SMALLINT NOT NULL DEFAULT 0,
    coverage_center      SMALLINT NOT NULL DEFAULT 0,
    coverage_right       SMALLINT NOT NULL DEFAULT 0,
    dominant_spectrum    TEXT CHECK (dominant_spectrum IN ('left', 'center', 'right')),
    insufficient_coverage BOOLEAN NOT NULL DEFAULT TRUE,
    blindspot_spectrum   TEXT CHECK (blindspot_spectrum IN ('left', 'right')),
    factuality           REAL,                 -- NULL cuando no se puede calcular
    computed_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Número de MEDIOS DISTINTOS que cubren la historia, guardado en vez de
-- calculado. El ciclo de ingesta ya lo conoce cuando arma el grupo.
--
-- No es optimización prematura: está medido. Calcularlo al leer obligaba a la
-- consulta del feed a recorrer stories, story_articles y articles enteras y
-- ordenar dos veces, 115 ms por petición con 1 800 historias. Con diez veces
-- los datos serían del orden de un segundo, en CADA carga de la portada.
-- Guardado, el feed es un ORDER BY sobre un índice con LIMIT.
ALTER TABLE stories ADD COLUMN IF NOT EXISTS source_count INTEGER NOT NULL DEFAULT 0;

-- Tema y ámbito de la historia, agregados desde sus artículos. Ver el comentario
-- de `articles.topics`: mismos ids, misma razón para que sean dos columnas.
--
-- Una historia hereda la UNIÓN de los temas de sus artículos, no la
-- intersección. Si El Tiempo titula por el lado sanitario y Semana por el
-- político, la historia es las dos cosas: quedarse con lo que ambos comparten
-- borraría justo la diferencia de encuadre que este sitio existe para enseñar.
ALTER TABLE stories ADD COLUMN IF NOT EXISTS topics TEXT[];
ALTER TABLE stories ADD COLUMN IF NOT EXISTS ambito TEXT
    CHECK (ambito IS NULL OR ambito IN ('nacional', 'internacional'));

-- El orden exacto del feed: primero las historias con más medios distintos,
-- luego las más recientes. Con este índice la consulta lee solo las filas que
-- devuelve, no la tabla entera.
CREATE INDEX IF NOT EXISTS stories_feed_idx
    ON stories (source_count DESC, published_at DESC NULLS LAST);

-- GIN porque la consulta del feed pregunta por PERTENENCIA a un array
-- (`topics && ARRAY['deportes']`), y un B-tree no puede responder eso: tendría
-- que recorrer la tabla entera en cada filtro de categoría.
CREATE INDEX IF NOT EXISTS stories_topics_idx ON stories USING GIN (topics);

-- El ámbito separa la portada en dos pestañas con paginación propia, así que se
-- filtra en cada carga.
CREATE INDEX IF NOT EXISTS stories_ambito_idx
    ON stories (ambito, source_count DESC, published_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS story_articles (
    story_id    TEXT NOT NULL REFERENCES stories (id) ON DELETE CASCADE,
    article_id  TEXT NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
    PRIMARY KEY (story_id, article_id)
);

CREATE INDEX IF NOT EXISTS story_articles_article_idx ON story_articles (article_id);

-- ── 5. Moderación (F2-02) ────────────────────────────────────────────────────
-- Antes las aprobaciones vivían en el localStorage de UN navegador: no se
-- compartían con el equipo ni con los visitantes, y un borrado de datos del
-- navegador las perdía. El panel no era un CMS, era una nota adhesiva.
--
-- Una fila aquí es una DECISIÓN sobre una historia, no una copia de ella. La
-- historia sigue viviendo en `stories` y se recalcula en cada ciclo; lo que se
-- guarda es quién dijo qué sobre ella y cuándo.

-- Migración desde la forma anterior de la tabla, que guardaba el revisor como
-- texto libre porque todavía no existían cuentas. Solo actúa si la tabla está
-- VACÍA: con decisiones dentro no se toca nada y la aplicación fallará de forma
-- visible, que es preferible a perder trabajo editorial en silencio. Cuando
-- haya datos en producción esto pedirá una herramienta de migraciones de
-- verdad; hoy hay una base y la tabla nació hace horas.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'moderation' AND column_name = 'reviewer'
    ) AND NOT EXISTS (SELECT 1 FROM moderation) THEN
        DROP TABLE moderation;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS moderation (
    story_id     TEXT PRIMARY KEY REFERENCES stories (id) ON DELETE CASCADE,
    -- 'aprobada' SIGUE PERMITIDA AQUÍ pero YA NO SE ESCRIBE desde ninguna
    -- parte: la API la rechaza desde el 2026-07-29 (ver moderationRoutes.js).
    -- En un modelo de publicar-todo-y-moderar-para-retirar, aprobar no
    -- producía ningún efecto —la historia ya era visible antes y seguía igual
    -- después—, así que el botón se retiró.
    --
    -- No se estrecha la restricción a propósito: 'aprobada' y «sin fila» son
    -- funcionalmente idénticas —ambas visibles—, de modo que una fila
    -- histórica no cambia el comportamiento de nada, y apretar el CHECK
    -- rompería la migración en cualquier base que ya tuviera alguna.
    state        TEXT NOT NULL CHECK (state IN ('aprobada', 'rechazada')),
    -- Quién decidió. Las cuentas se desactivan pero no se borran (admin_users
    -- .disabled_at), justamente para que esta referencia no se quede huérfana:
    -- saber quién aprobó qué es lo que hace auditable al panel.
    reviewer_id  TEXT NOT NULL REFERENCES admin_users (id),
    reason       TEXT,
    decided_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moderation_state_idx    ON moderation (state);
CREATE INDEX IF NOT EXISTS moderation_reviewer_idx ON moderation (reviewer_id);

-- No existe el estado 'pendiente'. Pendiente es la AUSENCIA de fila, y por eso
-- se quitó del CHECK: si estuviera, habría dos formas de representar lo mismo
-- —sin fila, o con fila 'pendiente'— y toda consulta tendría que contemplar las
-- dos. Lo pendiente es un LEFT JOIN sin coincidencia.

-- ── 6. Acceso al panel (F2-04) ───────────────────────────────────────────────
-- Sustituye a AdminGate, que comparaba una passphrase incrustada en el bundle
-- del navegador. Eso no es una cerradura: cualquiera la lee en las herramientas
-- de desarrollo. Aquí la contraseña no viaja nunca al cliente y lo que el
-- navegador guarda es una cookie httpOnly que su propio JavaScript no puede
-- leer.

CREATE TABLE IF NOT EXISTS admin_users (
    id             TEXT PRIMARY KEY,
    email          TEXT NOT NULL UNIQUE,
    -- scrypt: sal + parámetros + derivada, todo en una cadena. Nunca la
    -- contraseña. Ver server/auth/passwords.js.
    password_hash  TEXT NOT NULL,
    display_name   TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at  TIMESTAMPTZ,
    -- Desactivar en vez de borrar: las decisiones de moderación que firmó esta
    -- persona siguen apuntando aquí, y perder el rastro de quién aprobó qué
    -- sería perder justo lo que este proyecto promete poder auditar.
    disabled_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS admin_sessions (
    -- Se guarda el HASH del testigo, no el testigo. Si alguien se lleva un
    -- volcado de esta tabla, no se lleva ninguna sesión utilizable: tendría que
    -- invertir un SHA-256 de 32 bytes aleatorios. Es el mismo razonamiento por
    -- el que no se guardan contraseñas en claro, aplicado a las sesiones.
    token_hash   TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_agent   TEXT,
    ip           TEXT
);

CREATE INDEX IF NOT EXISTS admin_sessions_user_idx    ON admin_sessions (user_id);
CREATE INDEX IF NOT EXISTS admin_sessions_expires_idx ON admin_sessions (expires_at);

-- Las sesiones caducadas se barren al validar, no con un cron:
--   DELETE FROM admin_sessions WHERE expires_at < now();

-- ── 7. Reportes del lector (F2-07) ───────────────────────────────────────────
-- Los votos del lector se quedaban en el localStorage de su navegador y no los
-- veía nadie, ni siquiera él mismo desde otro dispositivo.
--
-- NO es "validación comunitaria". Un voto de lectores anónimos no valida un
-- análisis, y publicar "el 84 % está de acuerdo" sería repetir exactamente el
-- fallo que corrigió F0-08: una cifra decorativa presentada como medición.
-- Estos reportes son INSTRUMENTACIÓN: señalan dónde mirar.
--
-- Las cuatro categorías de desacuerdo corresponden una a una con las preguntas
-- abiertas más difíciles del proyecto:
--   falta-izquierda / falta-derecha  → F1-12, equilibrio del catálogo
--   medio-mal-clasificado            → F1-13, revisión de los valores de sesgo
--   historias-distintas              → F1-05, fusiones incorrectas
-- Esa última es la misma señal que se obtuvo etiquetando 72 pares a mano, pero
-- continua y sobre tráfico real.
--
-- SIN DATOS PERSONALES, y por eso no hay columna de IP ni de identificador de
-- sesión: solo qué se reportó, sobre qué historia y cuándo. El abuso se
-- contiene con el límite de peticiones en memoria, que no persiste nada. Así
-- esta tabla queda fuera del alcance de la Ley 1581 por construcción, no por
-- política.

CREATE TABLE IF NOT EXISTS reader_reports (
    id          BIGSERIAL PRIMARY KEY,
    story_id    TEXT NOT NULL REFERENCES stories (id) ON DELETE CASCADE,
    kind        TEXT NOT NULL CHECK (kind IN (
                    'preciso',
                    'falta-izquierda',
                    'falta-derecha',
                    'medio-mal-clasificado',
                    'historias-distintas'
                )),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reader_reports_story_idx ON reader_reports (story_id);
CREATE INDEX IF NOT EXISTS reader_reports_kind_idx  ON reader_reports (kind, created_at DESC);

-- ── 7 bis. Reportes sobre las FICHAS DE PROPIEDAD ────────────────────────────
-- Tabla aparte y no una columna más en reader_reports: aquello cuelga de una
-- historia con clave foránea, y esto habla de un MEDIO. Meterlos juntos
-- obligaría a hacer `story_id` anulable, es decir, a debilitar la restricción
-- que hace que aquella tabla no pueda tener filas huérfanas.
--
-- QUÉ SE HACE CON ESTO, Y QUÉ NO. No cambia ninguna ficha ni dispara nada
-- automático. Es una PISTA sobre dónde mirar. La regla del proyecto es que
-- corregir una ficha de propiedad exige producir la fuente donde consta, y un
-- recuento de reportes no es una fuente: si bastara, cualquiera con tiempo
-- podría reescribir quién es dueño de un medio pulsando un botón.
--
-- SIN DATOS PERSONALES, igual que la de arriba: qué medio, qué veredicto y
-- cuándo. Ni IP ni identificador de sesión. Queda fuera del alcance de la Ley
-- 1581 por construcción y no por política.
CREATE TABLE IF NOT EXISTS reportes_propiedad (
    id          BIGSERIAL PRIMARY KEY,
    media_id    TEXT NOT NULL REFERENCES sources (id) ON DELETE CASCADE,
    veredicto   TEXT NOT NULL CHECK (veredicto IN ('correcta', 'incorrecta')),
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reportes_propiedad_medio_idx
    ON reportes_propiedad (media_id, creado_en DESC);

-- ── 8. Límite de peticiones compartido (F2-06) ───────────────────────────────
-- El contador vivía en la memoria de cada proceso. Con una sola instancia
-- funcionaba; con la API sin estado, cada invocación tendría su propio contador
-- y el límite de ocho intentos de acceso dejaría de limitar nada.
--
-- SIN DATOS PERSONALES: se guarda el HASH de la clave, no la clave. Un
-- limitador por IP normalmente almacena la IP, que es dato personal. Aquí la
-- columna contiene sha256('login:ip:...') y no hay forma de recuperar la
-- dirección desde la tabla. Cuenta exactamente igual.
--
-- VENTANA FIJA, no deslizante. Una deslizante exigiría guardar cada intento con
-- su instante y barrerlos después; esto es una fila por ventana y clave, y se
-- actualiza con un solo UPSERT. La contrapartida conocida es que a caballo
-- entre dos ventanas se pueden colar hasta el doble de intentos —dieciséis en
-- lugar de ocho—, que para frenar fuerza bruta sigue siendo irrelevante.

CREATE TABLE IF NOT EXISTS rate_limits (
    bucket        TEXT NOT NULL,          -- sha256 de la clave, nunca la clave
    window_start  TIMESTAMPTZ NOT NULL,
    hits          INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (bucket, window_start)
);

CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON rate_limits (window_start);

-- Las ventanas viejas se barren al contar, no con una tarea programada:
--   DELETE FROM rate_limits WHERE window_start < now() - interval '1 day';

-- ── 9. Solicitudes de ciclo (F2-12) ──────────────────────────────────────────
-- El panel puede pedir un ciclo de ingesta inmediato sin hablar con el motor.
--
-- POR QUÉ ASÍ Y NO CON UNA LLAMADA HTTP. La ingesta tarda minutos, así que vive
-- en una máquina propia y no en una función. Para que el panel la dispare por
-- red haría falta exponer esa máquina: un puerto abierto, un mecanismo de
-- autenticación propio y una superficie de ataque para una función que se usa
-- tres veces al mes.
--
-- Con una fila, el motor NO NECESITA CONECTIVIDAD ENTRANTE. Nadie puede
-- alcanzarlo; él mira esta tabla en cada vuelta y actúa. Y funciona igual esté
-- alojado donde esté, que es lo que permite cambiar de proveedor sin tocar el
-- panel.

CREATE TABLE IF NOT EXISTS ingest_requests (
    id           BIGSERIAL PRIMARY KEY,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    requested_by TEXT REFERENCES admin_users (id),
    claimed_at   TIMESTAMPTZ,      -- cuándo la tomó el motor
    finished_at  TIMESTAMPTZ,
    outcome      TEXT              -- resumen legible del ciclo, o el error
);

-- Solo puede haber UNA solicitud sin atender a la vez. Sin esto, pulsar el
-- botón cinco veces encolaría cinco ciclos contra los mismos 34 medios.
CREATE UNIQUE INDEX IF NOT EXISTS ingest_requests_pendiente_idx
    ON ingest_requests ((claimed_at IS NULL)) WHERE claimed_at IS NULL;

-- ── 10. Lista de espera (F0-07 / F3-05) ──────────────────────────────────────
-- Ley 1581 de 2012: dato personal. No sale en ninguna exportación pública de
-- contenido, y `deleted_at` permite atender una solicitud de supresión sin
-- perder el registro de que se atendió.

CREATE TABLE IF NOT EXISTS waitlist (
    email        TEXT PRIMARY KEY,
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,                  -- doble opt-in; NULL = sin confirmar
    deleted_at   TIMESTAMPTZ
);

-- ── 11. Errores de producción (F2-11) ────────────────────────────────────────
-- Hasta aquí los fallos solo iban a console.error, que en Fly acaba en un
-- registro que nadie mira y que además no se conserva. El 2026-07-29 se
-- encontraron tres fallos en producción y los tres se descubrieron sondeando a
-- mano: /api/health respondía 503 permanente, publicaba «0 artículos» sirviendo
-- 2 400 historias, y una noticia cacheada apuntaba a un asset inexistente.
-- Ninguno avisó.
--
-- SE AGREGA POR HUELLA, UNA FILA POR CLASE DE ERROR, no una por ocurrencia.
-- La diferencia importa: un fallo dentro del ciclo de ingesta, que recorre
-- 2 600 artículos, escribiría miles de filas idénticas y convertiría un
-- incidente en dos —el fallo original y una base llena. Aquí el mismo error
-- repetido incrementa `veces` y mueve `ultima_vez`.

CREATE TABLE IF NOT EXISTS errores (
    huella       TEXT PRIMARY KEY,   -- proceso + tipo + mensaje + ruta, hasheado
    proceso      TEXT NOT NULL,      -- 'api' | 'motor'
    origen       TEXT NOT NULL,      -- 'peticion' | 'promesa' | 'excepcion' | 'tarea'
    tipo         TEXT NOT NULL,      -- nombre de la clase de error
    mensaje      TEXT NOT NULL,
    ruta         TEXT,               -- ruta HTTP, cuando el error viene de una
    pila         TEXT,               -- primeras líneas, recortada
    veces        INTEGER NOT NULL DEFAULT 1,
    primera_vez  TIMESTAMPTZ NOT NULL DEFAULT now(),
    ultima_vez   TIMESTAMPTZ NOT NULL DEFAULT now(),
    resuelto_en  TIMESTAMPTZ         -- se marca desde el panel; no se borra
);

-- El panel lista lo más reciente primero, y solo lo no resuelto.
CREATE INDEX IF NOT EXISTS errores_recientes_idx
    ON errores (ultima_vez DESC) WHERE resuelto_en IS NULL;
