// @ts-check

/**
 * ETIQUETADO GEOGRÁFICO — de qué departamento habla una noticia.
 *
 * PARA QUÉ (2026-08-09, decisión de Jose)
 * ---------------------------------------
 * Muchas noticias no son de incidencia nacional: una captura, un homicidio, un
 * caso de corrupción ocurren en un sitio. Etiquetarlas permite que alguien en
 * Nariño o en Arauca filtre por lo suyo, que es lo que hoy no puede hacer.
 *
 * EL PROBLEMA, Y NO ES MENOR
 * --------------------------
 * La toponimia colombiana está llena de trampas:
 *
 *   · **Córdoba** es departamento, y también municipio de Bolívar, Nariño y
 *     Quindío. Y apellido.
 *   · **Santander** es departamento, y también municipio del Cauca
 *     (Santander de Quilichao). Y prócer.
 *   · **Bolívar** es departamento, municipio de Cauca y Valle, y sobre todo el
 *     apellido del Libertador: «la espada de Bolívar» no es una noticia del
 *     Caribe.
 *   · **La Plata** está en Huila, y también en Argentina.
 *
 * Por eso el detector es DELIBERADAMENTE CORTO DE VISTA: ante la duda no
 * etiqueta. Una noticia sin etiqueta se pierde en un filtro; una noticia con
 * etiqueta equivocada manda un hecho de Cúcuta al departamento de otro, y eso es
 * peor —el lector que filtra por su región recibe algo que no le corresponde y
 * deja de fiarse del filtro entero—.
 *
 * QUÉ MIRA Y QUÉ NO
 * -----------------
 * Solo el TITULAR. El extracto viene truncado y arrastra pies de foto y
 * secciones («Cúcuta | Redacción»), que producirían falsos positivos sistemáticos
 * por medio, no aleatorios: La Opinión saldría siempre etiquetada en Norte de
 * Santander aunque hablara de Bogotá.
 *
 * NO se usa el departamento del MEDIO como etiqueta por defecto, por lo mismo:
 * convertiría «quién lo publica» en «de dónde es la noticia», que son cosas
 * distintas y es justo la confusión que este campo viene a deshacer.
 */

/**
 * Capitales y ciudades grandes. Son la señal FUERTE: nombrarlas casi nunca es
 * ambiguo, y quien escribe un titular sobre un hecho local nombra la ciudad
 * antes que el departamento.
 */
const CIUDADES = {
    'Bogotá D.C.': ['bogota', 'bogotá'],
    Antioquia: ['medellin', 'medellín', 'bello', 'itagui', 'itagüi', 'envigado', 'apartado', 'apartadó', 'rionegro'],
    'Valle del Cauca': ['cali', 'buenaventura', 'palmira', 'tulua', 'tuluá', 'buga', 'cartago', 'yumbo'],
    Atlántico: ['barranquilla', 'soledad', 'malambo', 'sabanalarga'],
    Bolívar: ['cartagena', 'magangue', 'magangué', 'turbaco'],
    Santander: ['bucaramanga', 'floridablanca', 'giron', 'girón', 'piedecuesta', 'barrancabermeja'],
    'Norte de Santander': ['cucuta', 'cúcuta', 'ocana', 'ocaña', 'pamplona', 'villa del rosario', 'tibu', 'tibú', 'catatumbo'],
    Cundinamarca: ['soacha', 'zipaquira', 'zipaquirá', 'facatativa', 'facatativá', 'fusagasuga', 'fusagasugá', 'chia', 'chía', 'girardot', 'mosquera'],
    Caldas: ['manizales', 'la dorada', 'chinchina', 'chinchiná', 'villamaria', 'villamaría'],
    Risaralda: ['pereira', 'dosquebradas', 'santa rosa de cabal'],
    Quindío: ['armenia', 'calarca', 'calarcá', 'montenegro', 'circasia'],
    Tolima: ['ibague', 'ibagué', 'espinal', 'melgar', 'honda', 'chaparral'],
    Huila: ['neiva', 'pitalito', 'garzon', 'garzón'],
    Nariño: ['pasto', 'tumaco', 'ipiales', 'tuquerres', 'túquerres'],
    Cauca: ['popayan', 'popayán', 'santander de quilichao', 'puerto tejada', 'corinto', 'caloto', 'toribio', 'toribío'],
    Magdalena: ['santa marta', 'cienaga', 'ciénaga', 'fundacion', 'fundación', 'el banco'],
    Cesar: ['valledupar', 'aguachica', 'agustin codazzi', 'agustín codazzi', 'la jagua'],
    Córdoba: ['monteria', 'montería', 'lorica', 'sahagun', 'sahagún', 'cerete', 'cereté', 'tierralta'],
    Sucre: ['sincelejo', 'corozal', 'san marcos', 'sampues', 'sampués'],
    'La Guajira': ['riohacha', 'maicao', 'uribia', 'manaure', 'fonseca', 'albania'],
    Boyacá: ['tunja', 'duitama', 'sogamoso', 'chiquinquira', 'chiquinquirá', 'paipa'],
    Meta: ['villavicencio', 'acacias', 'acacías', 'granada meta', 'puerto lopez', 'puerto lópez'],
    Casanare: ['yopal', 'aguazul', 'villanueva casanare', 'paz de ariporo', 'tauramena'],
    Arauca: ['arauca', 'saravena', 'arauquita', 'tame'],
    Caquetá: ['florencia', 'san vicente del caguan', 'san vicente del caguán', 'cartagena del chaira', 'cartagena del chairá'],
    Putumayo: ['mocoa', 'puerto asis', 'puerto asís', 'orito', 'valle del guamuez'],
    Chocó: ['quibdo', 'quibdó', 'istmina', 'condoto', 'bahia solano', 'bahía solano', 'riosucio choco'],
    'Archipiélago de San Andrés': ['san andres', 'san andrés', 'providencia'],
    Guaviare: ['san jose del guaviare', 'san josé del guaviare', 'calamar guaviare'],
    Vichada: ['puerto carreno', 'puerto carreño'],
    Guainía: ['inirida', 'inírida'],
    Vaupés: ['mitu', 'mitú'],
    Amazonas: ['leticia', 'puerto narino', 'puerto nariño'],
    'Valle del Cauca-2': [],
};
delete CIUDADES['Valle del Cauca-2'];

/**
 * Nombres de departamento que NO son ambiguos: nombrarlos es hablar del
 * departamento y de poco más.
 */
const DEPARTAMENTOS_CLAROS = [
    'antioquia', 'cundinamarca', 'boyaca', 'boyacá', 'santander', 'atlantico', 'atlántico',
    'magdalena', 'guajira', 'casanare', 'putumayo', 'caqueta', 'caquetá', 'vichada',
    'guainia', 'guainía', 'vaupes', 'vaupés', 'amazonas', 'arauca', 'choco', 'chocó',
    'risaralda', 'quindio', 'quindío', 'caldas', 'tolima', 'huila', 'narino', 'nariño',
    'cauca', 'cesar', 'sucre', 'meta', 'guaviare',
];

/** A qué departamento corresponde cada nombre claro. */
const NOMBRE_A_DEPARTAMENTO = {
    antioquia: 'Antioquia', cundinamarca: 'Cundinamarca', boyaca: 'Boyacá', 'boyacá': 'Boyacá',
    santander: 'Santander', atlantico: 'Atlántico', 'atlántico': 'Atlántico',
    magdalena: 'Magdalena', guajira: 'La Guajira', casanare: 'Casanare', putumayo: 'Putumayo',
    caqueta: 'Caquetá', 'caquetá': 'Caquetá', vichada: 'Vichada', guainia: 'Guainía',
    'guainía': 'Guainía', vaupes: 'Vaupés', 'vaupés': 'Vaupés', amazonas: 'Amazonas',
    arauca: 'Arauca', choco: 'Chocó', 'chocó': 'Chocó', risaralda: 'Risaralda',
    quindio: 'Quindío', 'quindío': 'Quindío', caldas: 'Caldas', tolima: 'Tolima',
    huila: 'Huila', narino: 'Nariño', 'nariño': 'Nariño', cauca: 'Cauca', cesar: 'Cesar',
    sucre: 'Sucre', meta: 'Meta', guaviare: 'Guaviare',
};

/**
 * Nombres que NO se aceptan sueltos, con el motivo.
 *
 * Se listan para que quede escrito por qué faltan, y no parezca un olvido.
 */
export const AMBIGUOS = {
    bolivar: 'apellido del Libertador y municipio de Cauca y Valle, además de departamento',
    'bolívar': 'apellido del Libertador y municipio de Cauca y Valle, además de departamento',
    cordoba: 'municipio de Bolívar, Nariño y Quindío, y apellido, además de departamento',
    'córdoba': 'municipio de Bolívar, Nariño y Quindío, y apellido, además de departamento',
    // «Cesar» va en los claros porque en un titular casi siempre es el
    // departamento; «César» con tilde sería nombre de pila, y se distingue solo
    // porque la comparación NO normaliza tildes en este caso.
};

/**
 * Todos los topónimos aplanados y ordenados de más largo a más corto, para que
 * el más específico gane. Ver la nota en `detectarDepartamento`.
 */
const CIUDADES_POR_LONGITUD = Object.entries(CIUDADES)
    .flatMap(([departamento, ciudades]) => ciudades.map((ciudad) => ({ departamento, ciudad })))
    .sort((a, b) => b.ciudad.length - a.ciudad.length);

/** Normaliza para comparar: minúsculas y sin signos, conservando las tildes. */
const normalizar = (t) => String(t).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

/** ¿Aparece `aguja` como palabra completa en `texto`? */
function contienePalabra(texto, aguja) {
    const i = texto.indexOf(aguja);
    if (i < 0) return false;
    const antes = i === 0 ? ' ' : texto[i - 1];
    const despues = i + aguja.length >= texto.length ? ' ' : texto[i + aguja.length];
    return /\s/.test(antes) && /\s/.test(despues);
}

/**
 * ¿De qué departamento habla este titular?
 *
 * @param {string|null|undefined} titular
 * @returns {{ departamento: string|null, senal: string|null, termino: string|null }}
 */
export function detectarDepartamento(titular) {
    const vacio = { departamento: null, senal: null, termino: null };
    if (typeof titular !== 'string' || !titular.trim()) return vacio;

    const t = ` ${normalizar(titular)} `;

    // 1. Ciudad: la señal fuerte. Se prueba primero y gana.
    //
    // DE MÁS LARGO A MÁS CORTO, y no en el orden de la tabla. «Cartagena del
    // Chairá» está en Caquetá, pero contiene «cartagena», que está en Bolívar:
    // recorriendo la tabla por orden, ese hecho del Caquetá acabaría etiquetado
    // en el Caribe. Gana siempre el topónimo más específico.
    for (const { departamento, ciudad } of CIUDADES_POR_LONGITUD) {
        if (contienePalabra(t, ciudad)) return { departamento, senal: 'ciudad', termino: ciudad };
    }

    // 2. Nombre de departamento, solo los no ambiguos.
    for (const nombre of DEPARTAMENTOS_CLAROS) {
        if (contienePalabra(t, nombre)) {
            return { departamento: NOMBRE_A_DEPARTAMENTO[nombre], senal: 'departamento', termino: nombre };
        }
    }

    return vacio;
}

/** Los 33 (32 departamentos + Bogotá), para la vista y los filtros. */
export const DEPARTAMENTOS = Object.keys(CIUDADES).sort((a, b) => a.localeCompare(b, 'es'));
