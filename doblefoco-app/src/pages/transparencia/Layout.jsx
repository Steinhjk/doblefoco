import { NavLink, Outlet } from 'react-router-dom';
import './Transparencia.css';
import './Layout.css';

/**
 * TRANSPARENCIA — armazón con índice a la izquierda.
 *
 * POR QUÉ SE PARTIÓ (2026-08-09, decisión de Jose). Era una sola página con
 * ocho bloques largos: para qué existe el sitio, el manifiesto, la financiación,
 * qué significan izquierda y derecha, los datos personales, lo que no funciona y
 * cómo corregirnos. Nadie lee ocho ensayos seguidos, y peor: **todo ese
 * contenido competía bajo una sola URL** en el buscador.
 *
 * Partirla en sub-páginas reales —y no en anclas dentro del mismo documento— es
 * lo único que descarga de verdad la lectura, y de paso cada tema gana su propio
 * título y su propia descripción.
 *
 * `/sobre-nosotros` ENTRA AQUÍ como una sección más, que era la otra mitad de la
 * decisión: eran dos páginas que decían cosas contiguas en sitios distintos, y
 * unirlas libera una pestaña de la navegación principal.
 *
 * La ruta vieja se mantiene como redirección permanente. Está indexada por
 * Google y enlazada desde varias páginas del propio sitio; romperla perdería lo
 * que costó ganar con el renderizado en servidor.
 */

const SECCIONES = [
    { to: '/transparencia', end: true, label: 'Para qué existe' },
    { to: '/transparencia/sobre-nosotros', label: 'Sobre nosotros' },
    { to: '/transparencia/clasificacion', label: 'Izquierda y derecha' },
    { to: '/transparencia/dinero', label: 'De dónde sale el dinero' },
    { to: '/transparencia/datos', label: 'Qué hacemos con sus datos' },
    { to: '/transparencia/limitaciones', label: 'Lo que no funciona' },
];

const TransparenciaLayout = () => (
    <div className="tr-layout">
        <header className="tr-hero">
            <h1>Transparencia</h1>
            <p className="tr-lede">
                Un sitio que clasifica la línea editorial de otros medios está obligado a
                exponer la suya. Aquí está de dónde sale el dinero, qué hacemos con los
                datos, qué sabemos hacer y qué no.
            </p>
        </header>

        <div className="tr-cuerpo">
            {/*
              * `aria-label` y no un <h2> oculto: es navegación, y un lector de
              * pantalla la anuncia mejor como región de navegación con nombre.
              */}
            <nav className="tr-indice" aria-label="Secciones de transparencia">
                <ul>
                    {SECCIONES.map((s) => (
                        <li key={s.to}>
                            <NavLink
                                to={s.to}
                                end={s.end}
                                className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                            >
                                {s.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <main className="tr-contenido">
                <Outlet />
            </main>
        </div>
    </div>
);

export default TransparenciaLayout;
