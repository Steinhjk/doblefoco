// @ts-check
import { BrowserRouter as Router } from 'react-router-dom';
import Shell from './Shell';
import './App.css';

/**
 * La aplicación en el NAVEGADOR.
 *
 * Todo lo que se pinta vive en <Shell />, compartido con el renderizado en
 * servidor. Aquí solo se elige el enrutador: es la única diferencia legítima
 * entre los dos entornos.
 */
function App() {
    return (
        <Router>
            <Shell />
        </Router>
    );
}

export default App;
