// @ts-check
import './Esqueleto.css';

/**
 * Marcador de carga para la portada.
 *
 * POR QUÉ EXISTE. Al recargar, la página se quedaba en blanco uno o dos
 * segundos y luego aparecía todo de golpe. No era un fallo —el HTML llega
 * enseguida y lo que tarda es la petición del feed— pero desde fuera es
 * indistinguible de una página rota, que es la lectura más cara posible en un
 * sitio que le pide credibilidad al lector.
 *
 * Dibuja la FORMA de lo que va a llegar, no un girador: así el contenido no
 * empuja el diseño al aparecer, y el hueco se lee como «esto se está cargando»
 * en vez de como «esto está vacío».
 *
 * NO es la solución de fondo. Esa sería renderizar la portada en el servidor,
 * como ya se hace con /noticia/:id. Esto quita el síntoma —el vacío— y deja el
 * tiempo de espera donde estaba.
 */
export const EsqueletoTarjetas = ({ cuantas = 4 }) => (
    <div className="esqueleto-lista" aria-hidden="true">
        {Array.from({ length: cuantas }, (_, i) => (
            <div key={i} className="esqueleto-tarjeta">
                <div className="esqueleto-imagen" />
                <div className="esqueleto-cuerpo">
                    <div className="esqueleto-linea corta" />
                    <div className="esqueleto-linea" />
                    <div className="esqueleto-linea" />
                    <div className="esqueleto-barra" />
                </div>
            </div>
        ))}
    </div>
);

export const EsqueletoHero = () => (
    <div className="esqueleto-hero" aria-hidden="true">
        <div className="esqueleto-hero-principal">
            <div className="esqueleto-imagen alta" />
            <div className="esqueleto-cuerpo">
                <div className="esqueleto-linea corta" />
                <div className="esqueleto-linea" />
                <div className="esqueleto-barra" />
            </div>
        </div>
        <div className="esqueleto-hero-lado">
            {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="esqueleto-hero-mini">
                    <div className="esqueleto-imagen mini" />
                    <div className="esqueleto-cuerpo">
                        <div className="esqueleto-linea" />
                        <div className="esqueleto-linea corta" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);
