import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
    return (
        <div className="not-found-page">
            <span className="not-found-code">404</span>
            <h1>Pagina no encontrada</h1>
            <p>La pagina que buscas no existe, fue movida o el enlace es incorrecto.</p>
            <div className="not-found-actions">
                <Link to="/" className="not-found-btn primary">Ir al inicio</Link>
                <Link to="/categorias" className="not-found-btn secondary">Ver categorias</Link>
            </div>
        </div>
    );
};

export default NotFound;
