// @ts-check
/**
 * MAPA DE DEPARTAMENTOS — el filtro geográfico del feed.
 *
 * TRES DECISIONES QUE NO SE VEN EN EL CÓDIGO PERO SE VEN EN PANTALLA
 * ------------------------------------------------------------------
 *
 * 1. **NI ROJO NI AZUL.** En este sitio el rojo es la izquierda y el azul la
 *    derecha —así están pintados el feed entero, las tarjetas y el mapa
 *    mediático—. Un coropleto en rojo diría que Antioquia es de izquierdas.
 *    La rampa es monocroma, de la propia paleta editorial, y no colisiona con
 *    nada de lo que el color ya significa aquí.
 *
 * 2. **EL SVG NO ES INTERACTIVO PARA EL TECLADO, la lista sí.** Treinta y tres
 *    trazados con `tabIndex` meterían treinta y tres paradas en el tabulador
 *    para llegar a un control que ya existe al lado. El mapa lleva
 *    `aria-hidden` y los `<button>` de la lista son el control de verdad; con
 *    el ratón se puede pulsar el mapa, que es donde el ratón es bueno. Es la
 *    misma regla de `MediaMap`: la información existe entera fuera del gráfico.
 *
 * 3. **EL CERO SE PINTA, NO SE OMITE.** Con rayado, distinguible del escalón
 *    más bajo, y seleccionable igual. Quien viva en Vaupés tiene derecho a ver
 *    que no tenemos nada suyo en vez de a no encontrar su departamento.
 */

import { useId, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { DEPARTAMENTOS } from '../../shared/geografia.js';
import { TRAZADOS, VISTA, INSULAR } from '../data/mapaColombia.js';
import { ESCALONES, escalonDe } from '../lib/geografiaDelFeed.js';
import './MapaDepartamentos.css';

/** El recuadro del archipiélago, en coordenadas del lienzo. */
const RECUADRO = { x: 14, y: 16, ancho: 236, alto: 196 };

const MapaDepartamentos = ({ conteos, maximo, etiquetadas, total, vacios, seleccionado, onSeleccionar }) => {
    /** Lo que está bajo el cursor. Solo pinta; no cambia el filtro. */
    const [rozado, setRozado] = useState(/** @type {string|null} */ (null));

    const idRayado = useId();
    const destacado = rozado ?? seleccionado;

    /** Clase de un departamento, la misma en el mapa y en la lista. */
    const claseDe = (nombre) => {
        const escalon = escalonDe(conteos[nombre] ?? 0, maximo);
        return [
            'mapa-pieza',
            `mapa-e${escalon}`,
            seleccionado === nombre ? 'es-seleccionado' : '',
            destacado === nombre ? 'es-destacado' : '',
        ]
            .filter(Boolean)
            .join(' ');
    };

    /** Pulsar el que ya está puesto lo quita: es el gesto que se espera. */
    const alternar = (nombre) => onSeleccionar(seleccionado === nombre ? null : nombre);

    const relleno = (nombre) =>
        (conteos[nombre] ?? 0) === 0 ? `url(#${idRayado})` : undefined;

    const conteoDestacado = destacado ? conteos[destacado] ?? 0 : null;

    return (
        <div className="mapa-deptos">
            <div className="mapa-deptos-cuerpo">
                <figure className="mapa-lienzo">
                    {/*
                      * `aria-hidden`: todo lo que hay aquí está también en la
                      * lista de al lado, con nombre y cifra exacta. Ver la nota
                      * 2 de la cabecera.
                      */}
                    <svg
                        viewBox={`0 0 ${VISTA.ancho} ${VISTA.alto}`}
                        className="mapa-svg"
                        aria-hidden="true"
                        focusable="false"
                        onMouseLeave={() => setRozado(null)}
                    >
                        <defs>
                            {/*
                              * EL CERO: un fondo tenue Y un rayado encima, los
                              * dos dentro del patrón.
                              *
                              * Textura y no simplemente un gris más flojo,
                              * porque en modo de contraste forzado los rellenos
                              * se aplanan y «cero» volvería a confundirse con
                              * «poco», que es justo la distinción que importa.
                              *
                              * Y con fondo, no solo rayas, porque sobre cien
                              * historias hay 25 departamentos a cero: a rayas
                              * sueltas el patrón es continuo de una pieza a la
                              * siguiente y Vichada y Guainía se leían como una
                              * sola mancha. El fondo devuelve el borde.
                              */}
                            <pattern
                                id={idRayado}
                                width="9"
                                height="9"
                                patternTransform="rotate(45)"
                                patternUnits="userSpaceOnUse"
                            >
                                <rect width="9" height="9" className="mapa-vacio" />
                                <line x1="0" y1="0" x2="0" y2="9" className="mapa-rayado" />
                            </pattern>
                        </defs>

                        {TRAZADOS.map(([nombre, trazado]) => (
                            <path
                                key={nombre}
                                d={trazado}
                                className={claseDe(nombre)}
                                fill={relleno(nombre)}
                                onMouseEnter={() => setRozado(nombre)}
                                onClick={() => alternar(nombre)}
                            />
                        ))}

                        {/* El archipiélago, fuera de sitio y dicho en la nota. */}
                        <g
                            onMouseEnter={() => setRozado(INSULAR)}
                            onClick={() => alternar(INSULAR)}
                        >
                            <rect
                                x={RECUADRO.x}
                                y={RECUADRO.y}
                                width={RECUADRO.ancho}
                                height={RECUADRO.alto}
                                className="mapa-recuadro"
                            />
                            <ellipse
                                cx={RECUADRO.x + RECUADRO.ancho * 0.42}
                                cy={RECUADRO.y + RECUADRO.alto * 0.62}
                                rx="26"
                                ry="38"
                                className={claseDe(INSULAR)}
                                fill={relleno(INSULAR)}
                            />
                            <ellipse
                                cx={RECUADRO.x + RECUADRO.ancho * 0.66}
                                cy={RECUADRO.y + RECUADRO.alto * 0.34}
                                rx="15"
                                ry="20"
                                className={claseDe(INSULAR)}
                                fill={relleno(INSULAR)}
                            />
                            <text
                                x={RECUADRO.x + RECUADRO.ancho / 2}
                                y={RECUADRO.y + RECUADRO.alto - 16}
                                className="mapa-recuadro-texto"
                            >
                                S. Andrés
                            </text>
                        </g>
                    </svg>

                    <figcaption className="mapa-pie">
                        {/*
                          * Una línea que cambia al pasar por encima. Sin ella
                          * el mapa no dice ningún nombre, y los nombres son la
                          * mitad de para qué está.
                          */}
                        <span className="mapa-lectura" aria-hidden="true">
                            {destacado
                                ? `${destacado} · ${conteoDestacado} ${conteoDestacado === 1 ? 'historia' : 'historias'}`
                                : 'Pasa por encima para ver el departamento'}
                        </span>

                        <span className="mapa-escala">
                            <span className="mapa-escala-tope">0</span>
                            <span className="mapa-muestra mapa-e0" />
                            {Array.from({ length: ESCALONES }, (_, i) => (
                                <span key={i} className={`mapa-muestra mapa-e${i + 1}`} />
                            ))}
                            <span className="mapa-escala-tope">{maximo}</span>
                        </span>
                    </figcaption>
                </figure>

                {/*
                  * ALFABÉTICA, no por volumen. Es una lista para ENCONTRAR el
                  * departamento de uno, y ordenada por cifra habría que barrer
                  * treinta y tres nombres para dar con «Nariño». El volumen ya
                  * lo cuenta el color, y la cifra exacta está en cada fila.
                  */}
                <div className="mapa-lista">
                    <ul>
                        {DEPARTAMENTOS.map((nombre) => {
                            const n = conteos[nombre] ?? 0;
                            return (
                                <li key={nombre}>
                                    <button
                                        type="button"
                                        className={`mapa-fila ${seleccionado === nombre ? 'es-seleccionado' : ''}`}
                                        aria-pressed={seleccionado === nombre}
                                        onClick={() => alternar(nombre)}
                                        onMouseEnter={() => setRozado(nombre)}
                                        onMouseLeave={() => setRozado(null)}
                                        onFocus={() => setRozado(nombre)}
                                        onBlur={() => setRozado(null)}
                                    >
                                        <span
                                            className={`mapa-punto mapa-e${escalonDe(n, maximo)}`}
                                            aria-hidden="true"
                                        />
                                        <span className="mapa-fila-nombre">{nombre}</span>
                                        <span className="mapa-fila-cifra">{n}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>

            {seleccionado && (
                <div className="mapa-activo">
                    <MapPin size={13} aria-hidden="true" />
                    <span>
                        Filtrando por <strong>{seleccionado}</strong>
                    </span>
                    <button type="button" className="mapa-quitar" onClick={() => onSeleccionar(null)}>
                        <X size={12} aria-hidden="true" /> Quitar
                    </button>
                </div>
            )}

            {/*
              * LA NOTA NO ES UN DESCARGO, ES PARTE DEL DATO. Un departamento en
              * blanco se lee como «ahí no pasa nada», y lo que dice de verdad es
              * «ahí no tenemos medios». Mismo problema que resolvió el aviso de
              * desequilibrio del espectro, y misma solución: la cifra se calcula
              * en vivo y el texto explica qué significa el hueco.
              */}
            <p className="mapa-nota">
                Estas cifras salen de <strong>{etiquetadas}</strong> de las{' '}
                <strong>{total}</strong> historias cargadas: solo se etiqueta cuando el titular
                nombra el sitio, y ante la duda no se etiqueta. Se cuentan las historias que
                tienes delante, no el catálogo entero — al cargar más, crecen.{' '}
                {vacios > 0 && (
                    <>
                        <strong>{vacios}</strong> departamentos están a cero, y eso es una
                        afirmación sobre nuestro catálogo de medios, no sobre esos territorios.{' '}
                    </>
                )}
                El archipiélago de San Andrés se dibuja en un recuadro: está a 700 km de la
                costa y a esta escala no cabe en su sitio.
            </p>
        </div>
    );
};

export default MapaDepartamentos;
