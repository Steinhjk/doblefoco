import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/themeContext';
import { Sun, Moon, Search } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const toggleMenu = () => setMenuOpen(prev => !prev);
    const closeMenu = () => setMenuOpen(false);

    const handleSearch = (e) => {
        e.preventDefault();
        const trimmed = searchQuery.trim();
        if (trimmed.length >= 2) {
            navigate(`/buscar?q=${encodeURIComponent(trimmed)}`);
            setSearchQuery('');
            closeMenu();
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <Link to="/" onClick={closeMenu} className="brand-link">
                        DobleFoco<span className="brand-suffix">.co</span>
                    </Link>
                </div>
                <form className="navbar-search" onSubmit={handleSearch} role="search">
                    <input
                        type="search"
                        placeholder="Buscar noticias..."
                        aria-label="Buscar noticias"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="search-submit-btn" aria-label="Buscar">
                        <Search size={16} />
                    </button>
                </form>
                <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    <form className="navbar-search-mobile" onSubmit={handleSearch} role="search">
                        <input
                            type="search"
                            placeholder="Buscar noticias..."
                            aria-label="Buscar noticias"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="search-submit-btn-mobile" aria-label="Buscar">
                            <Search size={18} />
                        </button>
                    </form>
                    <ul>
                        <li>
                            <NavLink to="/tendencias" onClick={closeMenu}>
                                Tendencias
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/categorias" onClick={closeMenu}>
                                Categorias
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/mapa-medios" onClick={closeMenu}>
                                Mapa mediático
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/transparencia" onClick={closeMenu}>
                                Transparencia
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/sobre-nosotros" onClick={closeMenu}>
                                Sobre nosotros
                            </NavLink>
                        </li>
                    </ul>
                </div>
                <div className="navbar-actions">
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                        title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                    >
                        {theme === 'dark' ? <Sun size={20} className="theme-toggle-icon" /> : <Moon size={20} className="theme-toggle-icon" />}
                    </button>
                    <button
                        className={`navbar-hamburger ${menuOpen ? 'active' : ''}`}
                        onClick={toggleMenu}
                        aria-label={menuOpen ? 'Cerrar menu' : 'Abrir menu'}
                        aria-expanded={menuOpen}
                    >
                        <span className="hamburger-line" />
                        <span className="hamburger-line" />
                        <span className="hamburger-line" />
                    </button>
                </div>
            </div>
            {menuOpen && <div className="navbar-overlay" onClick={closeMenu} />}
        </nav>
    );
};

export default Navbar;
