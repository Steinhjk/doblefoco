// @ts-check

/**
 * LÁMINAS DE SECCIÓN.
 *
 * Qué sustituyen: un emoji por categoría —🗞️ 🏛️ 📈 🏥— pintado a 2,5 rem.
 * Un emoji no es una decisión de diseño: lo dibuja el sistema operativo, así
 * que la misma pantalla salía con las láminas de Microsoft en Windows, las de
 * Apple en un iPhone y las de Google en Android. Tres sitios distintos, y
 * ninguno de los tres se parecía al resto de DobleFoco, que es una paleta
 * pizarra sobria con radios de 3 px. Además el emoji es a color por definición
 * y no obedece al tema claro/oscuro.
 *
 * QUÉ SON AHORA. Cada sección tiene una composición geométrica propia, todas
 * construidas con el mismo juego de reglas para que se lean como una familia:
 *
 *   - lienzo de 64×64, misma caja para todas;
 *   - `currentColor` en todo: heredan el color del texto y por tanto siguen al
 *     tema sin una sola regla de color aquí dentro;
 *   - dos planos y solo dos — el CAMPO (`.mark-field`, atenuado, es el
 *     contexto: barras, terreno, la multitud) y la FIGURA (trazo pleno, es el
 *     asunto);
 *   - trazo de 1,5 y remates rectos, como los separadores del sitio.
 *
 * No son pictogramas de librería a propósito. Ya está `lucide-react` en las
 * dependencias y habría sido media hora de trabajo; el encargo era justamente
 * que no fueran iconos. Estas son diagramas del sector: el hemiciclo del
 * Congreso, la curva de nivel del territorio, el tramo colgante del puente, la
 * línea que se rompe y vuelve a unirse.
 */

/**
 * Geometría de cada sección, indexada por el id del tema.
 *
 * La clave es el id y NO el nombre visible. Es la misma lección que dejó
 * escrita el clasificador: el `Judicial` de los feeds contra el `Justicia` de
 * la interfaz dejó una baldosa en cero con cinco historias dentro. Un nombre
 * se traduce y se reescribe; un id no.
 */
const LAMINAS = {
    /* Todo el catálogo: una plana de periódico — el bloque de apertura y el
       cuerpo de texto bajo el filete de cabecera. */
    ultimas: (
        <>
            <path d="M8 13h48" strokeWidth="2.5" />
            <rect className="mark-field" x="8" y="20" width="20" height="14" />
            <path d="M8 40h20M8 46h20M8 52h14" />
            <path d="M34 20h22M34 26h22M34 32h22M34 38h22M34 44h22M34 50h16" className="mark-field" />
        </>
    ),

    /* Congreso: el hemiciclo visto en planta, con la mesa directiva al centro. */
    politica: (
        <>
            <path d="M8 48h48" />
            <path className="mark-field" d="M8 48a24 24 0 0 1 48 0" />
            <path className="mark-field" d="M15 48a17 17 0 0 1 34 0" />
            <path d="M22 48a10 10 0 0 1 20 0" />
            <circle cx="32" cy="48" r="2.5" fill="currentColor" stroke="none" />
        </>
    ),

    /* Serie: las barras son el dato bruto, la línea es la tendencia. */
    economia: (
        <>
            <path d="M8 50h48" />
            <g className="mark-field" fill="currentColor" stroke="none">
                <rect x="12" y="42" width="7" height="8" />
                <rect x="23" y="36" width="7" height="14" />
                <rect x="34" y="40" width="7" height="10" />
                <rect x="45" y="28" width="7" height="22" />
            </g>
            <path d="M10 44l10-6 10 3 10-11 12-9" />
            <circle cx="52" cy="21" r="2.5" fill="currentColor" stroke="none" />
        </>
    ),

    /* Trazo de monitor: reposo, complejo, reposo. */
    salud: (
        <>
            <rect className="mark-field" x="8" y="16" width="48" height="32" rx="2" />
            <path d="M8 36h13l4 0 3-15 4 27 4-19 3 7h17" />
        </>
    ),

    /* Curvas de nivel: el territorio, que es de lo que trata la sección —
       deforestación, páramos, transición. No una hoja.

       Las tres curvas empezaron paralelas y separadas por 8, y a 56 px se leían
       como un único trazo grueso. Ahora se separan y la de arriba es más corta:
       es lo que hace que se vean como cotas de una ladera y no como un adorno. */
    /* Sismograma: la línea de base y el registro. Se dibuja el INSTRUMENTO y no
       la catástrofe —ni escombros ni casas partidas— por lo mismo que el sitio
       no ilustra con fotos de archivo: la lámina anuncia una sección, no aporta
       dramatismo. El trazo plano a izquierda y derecha es lo que hace legible el
       pico; sin él se lee como un garabato. */
    desastres: (
        <>
            <path d="M6 34h12" className="mark-field" />
            <path d="M18 34l4-9 4 18 4-24 4 30 4-21 4 12 4-6" />
            <path d="M46 34h12" className="mark-field" />
            <path d="M6 52h52" strokeWidth="2.5" />
        </>
    ),

    ambiente: (
        <>
            <path className="mark-field" d="M16 28c8-6 14-3 20-8" />
            <path className="mark-field" d="M8 40c10-8 18-4 26-10 8-6 16-2 22-8" />
            <path d="M8 50c10-8 18-4 26-10 8-6 16-2 22-8" />
            <path d="M6 57h52" strokeWidth="2.5" />
        </>
    ),

    /* Circuito integrado: el encapsulado y sus patillas. */
    tecnologia: (
        <>
            <rect x="18" y="18" width="28" height="28" />
            <rect className="mark-field" x="26" y="26" width="12" height="12" fill="currentColor" stroke="none" />
            <path d="M25 18v-7M32 18v-7M39 18v-7M25 46v7M32 46v7M39 46v7M18 25h-7M18 32h-7M18 39h-7M46 25h7M46 32h7M46 39h7" />
        </>
    ),

    /* Puente colgante: tablero, torres, cable principal y péndolas. */
    infraestructura: (
        <>
            <path d="M6 40h52" strokeWidth="2.5" />
            <path d="M18 16v36M46 16v36" />
            <path d="M6 30L18 16q14 22 28 0l12 14" />
            <path className="mark-field" d="M25 24v16M32 27v13M39 24v16" />
            <path className="mark-field" d="M6 52h52" />
        </>
    ),

    /* Balanza en fiel. Nivelada a propósito: la baldosa nombra un sector, no
       emite un juicio sobre él. */
    justicia: (
        <>
            <path d="M32 14v38M22 52h20" />
            <path d="M14 22h36" />
            <path d="M14 22v8M50 22v8" className="mark-field" />
            <path d="M8 30a6 6 0 0 0 12 0M44 30a6 6 0 0 0 12 0" />
            <circle cx="32" cy="18" r="2.5" fill="currentColor" stroke="none" />
        </>
    ),

    /* Libro abierto sobre su lomo. */
    educacion: (
        <>
            <path d="M32 21v25" />
            <path d="M32 21c-8-4-18-4-24-2v25c6-2 16-2 24 2" />
            <path d="M32 21c8-4 18-4 24-2v25c-6-2-16-2-24 2" />
            <path className="mark-field" d="M13 27h13M13 33h13M38 27h13M38 33h13" />
        </>
    ),

    /* Bandera de meta.

       Se probó primero la pista de atletismo, con dos y con tres calles
       anidadas, y en las dos versiones el óvalo exterior se comía al interior:
       a 56 px salía una cápsula, que es lo que parece un eslabón. El damero no
       tiene ese problema porque no depende de que dos curvas paralelas se
       distingan, sino del contraste entre casillas — y eso aguanta cualquier
       tamaño. */
    deportes: (
        <>
            <path d="M12 12v42" strokeWidth="2" />
            <rect x="12" y="14" width="40" height="26" />
            <g fill="currentColor" stroke="none">
                <rect x="12" y="14" width="13.33" height="8.67" />
                <rect x="38.67" y="14" width="13.33" height="8.67" />
                <rect x="25.33" y="22.67" width="13.33" height="8.67" />
                <rect className="mark-field" x="12" y="31.33" width="13.33" height="8.67" />
                <rect className="mark-field" x="38.67" y="31.33" width="13.33" height="8.67" />
            </g>
        </>
    ),

    /* Globo con meridianos y paralelos. */
    internacional: (
        <>
            <circle cx="32" cy="32" r="20" />
            <ellipse className="mark-field" cx="32" cy="32" rx="9" ry="20" />
            <path d="M12 32h40" />
            <path className="mark-field" d="M14 23h36M14 41h36" />
        </>
    ),

    /* Dos partes enfrentadas y la línea donde se encuentran. Conflicto Y paz: el
       choque y la mesa son la misma geometría vista dos veces.

       Van cuatro intentos, y los tres primeros enseñaron lo mismo. Una línea
       rota con montículo y falla: tres gestos pequeños que a 56 px no sumaban
       ninguno. Un arco sobre el vacío: como arrancaba donde acababa el suelo,
       todo se leía como una loma. Dos orillas y un tablón encima: legible, pero
       era un PUENTE, y el puente ya es la lámina de Infraestructura — dos
       secciones no pueden compartir la misma imagen. Esta no se parece a
       ninguna otra de la cuadrícula. */
    conflicto: (
        <>
            <g className="mark-field" fill="currentColor" stroke="none">
                <path d="M6 18L28 32 6 46z" />
                <path d="M58 18L36 32 58 46z" />
            </g>
            <path d="M6 18L28 32 6 46z" />
            <path d="M58 18L36 32 58 46z" />
            <path d="M32 10v44" strokeWidth="2.5" />
        </>
    ),

    /* Una fila de personas sobre una misma línea. La garantía es esa línea:
       corre por debajo de todas y es la única igual para todas.

       Antes había además un individuo destacado dentro de un marco, y el marco
       partía la fila justo por el medio: se leía como una jeringa. Una lámina
       de 56 px aguanta una idea, no dos. */
    derechos: (
        <>
            <g className="mark-field">
                <circle cx="10" cy="26" r="4" />
                <path d="M10 32v12" />
                <circle cx="54" cy="26" r="4" />
                <path d="M54 32v12" />
            </g>
            <circle cx="21" cy="26" r="4" />
            <path d="M21 32v12" />
            <circle cx="32" cy="26" r="4" />
            <path d="M32 32v12" />
            <circle cx="43" cy="26" r="4" />
            <path d="M43 32v12" />
            <path d="M6 50h52" strokeWidth="2.5" />
        </>
    ),

    /* Frontón y columnas: la obra y la institución que la sostiene —el museo, el
       teatro, la biblioteca—. Es un templo laico y no se confunde con el
       hemiciclo de Política, que es curvo y se apoya en un solo punto. */
    cultura: (
        <>
            <path className="mark-field" fill="currentColor" stroke="none" d="M6 26L32 12 58 26z" />
            <path d="M6 26L32 12 58 26z" />
            <path d="M8 30h48" />
            <path d="M14 30v20M24 30v20M40 30v20M50 30v20" />
            <path d="M6 54h52" strokeWidth="2.5" />
        </>
    ),

    /* Torre emisora. La señal sale y se propaga: es el oficio de informar, y su
       contrario —el silencio— se ve como ausencia de esas ondas. */
    medios: (
        <>
            <path d="M24 54L32 16 40 54" />
            <path d="M26 44h12M28 34h8" />
            <circle cx="32" cy="14" r="2.5" fill="currentColor" stroke="none" />
            <path className="mark-field" d="M24 20a11 11 0 0 1 16 0" />
            <path className="mark-field" d="M18 24a19 19 0 0 1 28 0" />
        </>
    ),

    /* Planos superpuestos: lo que se emite, se reencuadra y se vuelve a emitir.
       Era la lámina de «Cultura y medios» y se queda con Entretenimiento, que
       es a lo que de verdad se parecía: pantallas. */
    entretenimiento: (
        <>
            <rect className="mark-field" x="9" y="14" width="30" height="22" rx="2" />
            <rect className="mark-field" x="16" y="21" width="30" height="22" rx="2" />
            <rect x="23" y="28" width="30" height="22" rx="2" />
            <circle cx="28" cy="45" r="2" fill="currentColor" stroke="none" />
        </>
    ),
};

/**
 * Lámina de una sección.
 *
 * `aria-hidden` porque el nombre de la sección va escrito al lado, en texto. Un
 * `alt` aquí lo haría leer dos veces al lector de pantalla.
 *
 * Una sección sin lámina no rompe la cuadrícula: devuelve `null` y la baldosa se
 * pinta sin ella. Es el caso de un tema nuevo en el clasificador que todavía no
 * tenga dibujo, y prefiero un hueco a un signo de interrogación.
 *
 * @param {{ id: string, className?: string }} props
 */
const CategoryMark = ({ id, className = '' }) => {
    const lamina = LAMINAS[id];
    if (!lamina) return null;

    return (
        <svg
            className={`category-mark ${className}`.trim()}
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
            aria-hidden="true"
            focusable="false"
        >
            {lamina}
        </svg>
    );
};

export default CategoryMark;
