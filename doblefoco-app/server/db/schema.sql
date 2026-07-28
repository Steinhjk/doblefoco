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

CREATE INDEX IF NOT EXISTS articles_published_idx ON articles (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS articles_source_idx    ON articles (source_id);

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

-- ── 7. Lista de espera (F0-07 / F3-05) ───────────────────────────────────────
-- Ley 1581 de 2012: dato personal. No sale en ninguna exportación pública de
-- contenido, y `deleted_at` permite atender una solicitud de supresión sin
-- perder el registro de que se atendió.

CREATE TABLE IF NOT EXISTS waitlist (
    email        TEXT PRIMARY KEY,
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,                  -- doble opt-in; NULL = sin confirmar
    deleted_at   TIMESTAMPTZ
);
