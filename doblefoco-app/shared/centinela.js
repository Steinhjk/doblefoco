/**
 * QUÉ VIGILA EL CENTINELA EN CADA MEDIO.
 *
 * Ejecuta esto `scripts/centinela.mjs`, con `npm run centinela`.
 *
 * Por qué existe
 * --------------
 * El 2026-08-17, al comprobar la ficha de Diario La Libertad el día en que se
 * mandaba a revisión externa, apareció un conflicto de interés que la ficha no
 * tenía: **la directora del periódico había anunciado su candidatura en su
 * propio periódico**, once meses antes. No estaba escondido. Estaba publicado,
 * con titular, y salió de escribir dos palabras en el buscador del propio sitio.
 *
 * Eso es lo que esto automatiza. No la lectura ni el juicio —eso sigue siendo
 * trabajo de una persona—, sino **la parte que un programa hace mejor que
 * nosotros: mirar todas las semanas, en 76 sitios, si han publicado algo que
 * toque lo que su ficha afirma.**
 *
 * LA REGLA DE ESTE ARCHIVO: CADA TÉRMINO VIGILA UNA AFIRMACIÓN CONCRETA
 * --------------------------------------------------------------------
 * El campo `vigila` no es documentación de cortesía: es la razón por la que el
 * término está aquí, y sin ella el centinela degenera en una alerta de Google.
 * Si al leer un aviso no se puede decir QUÉ frase de la ficha queda en duda, el
 * término sobra. Un vigilante que avisa de todo enseña a ignorarlo — la misma
 * lección que fijó el umbral de 14 días en `comprobarMedios.mjs`.
 *
 * POR QUÉ SON POCOS MEDIOS
 * ------------------------
 * Arranca con los tres de la cola de revisión, que además son los tres casos de
 * conexión distintos que existen —API abierta, buscador HTML y sitio que no se
 * puede preguntar—. Se extiende medio a medio, cuando su ficha esté escrita:
 * vigilar una afirmación que nadie ha escrito todavía no significa nada.
 */

/**
 * @typedef {object} Consulta
 * @property {string} consulta  Lo que se le pregunta al buscador del medio.
 * @property {string} vigila    Qué afirmación de la ficha queda en duda si sale algo.
 * @property {boolean} [enTitular=true]
 *   Si `true`, solo cuentan las piezas cuyo TITULAR contiene el término. El
 *   buscador de WordPress también encuentra menciones de pasada en el cuerpo, y
 *   esas son casi todas ruido: de 72 resultados por «Tcherassi» en La Libertad,
 *   21 lo llevaban en el titular y el resto eran menciones sueltas.
 */

/** @type {Record<string, { consultas: Consulta[] }>} */
export const VIGILANCIA = {
    'diario-la-libertad': {
        consultas: [
            {
                consulta: 'Tcherassi',
                vigila:
                    'Que la compra anunciada en enero de 2025 sigue SIN cerrarse. Si el diario publica que se cerró —o que se cayó—, `ownerType` deja de ser null y hay que decidir aviso de conflicto de interés y controlGroup con El Espacio.',
            },
            {
                consulta: 'Esper',
                vigila:
                    'Que Luz Marina Esper Fayad sigue siendo la directora, y que la casa se sigue describiendo como propiedad de la familia. Son los tres indicios en los que hoy se apoya que la operación no se cerró.',
            },
            {
                consulta: 'contienda electoral',
                vigila:
                    'En qué queda la candidatura que la directora anunció el 12-10-2025 —«no lo pongas en duda, voy para la contienda electoral»—. Es el conflicto de interés mejor acreditado de esta ficha y el que decide si hay que publicar un aviso.',
            },
        ],
    },

    'la-nacion-neiva': {
        consultas: [
            {
                consulta: 'Olave',
                vigila:
                    'Que Felipe Olave Blackburn sigue siendo el comprador de 2024 y no ha vuelto a cambiar de manos. Casi toda la evidencia de esa ficha es del propio diario, así que el propio diario es donde primero se vería.',
            },
            {
                consulta: 'Huila Stéreo',
                vigila:
                    'Si crece el grupo. Olave compró la emisora después del diario; una tercera compra convertiría esto en un grupo regional y pediría controlGroup.',
            },
        ],
    },

    /**
     * Cablenoticias entra sabiendo que HOY NO SE PUEDE PREGUNTAR: su sitio no es
     * WordPress y no expone buscador consultable, así que el centinela lo
     * declarará «no comprobable» en cada pasada.
     *
     * Se deja escrito a propósito. Una lista que solo contiene lo que sí se puede
     * mirar da la impresión de cobertura completa, y esta ficha es justamente la
     * que más vigilancia necesita: su propiedad está documentada al detalle y
     * toda la documentación es de 2018.
     */
    cablenoticias: {
        consultas: [
            {
                consulta: 'Cable Noticias TV',
                vigila:
                    'Cualquier señal de quién lo controla hoy. La estructura societaria conocida —accionistas venezolanos, sociedad última en Panamá— viene de una fuente cuya última actualización es de marzo de 2018.',
            },
        ],
    },
};

/** Los medios vigilados, para que los informes y las pruebas no repitan la forma. */
export const MEDIOS_VIGILADOS = Object.keys(VIGILANCIA);
