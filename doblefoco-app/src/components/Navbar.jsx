import { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/themeContext';
import { useStories } from '../hooks/useStories';
import { MEDIA_REGISTRY } from '../../shared/mediaRegistry';
import { rutaDeHistoria } from '../../shared/storyPath';
import { classifySpectrum, SPECTRUM_LABEL } from '../../shared/biasAnalysis';
import { Sun, Moon, Search, Newspaper, Radio, CornerDownLeft } from 'lucide-react';
import './Navbar.css';

const normalizar = (s) =>
    String(s ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpenSuggestions, setIsOpenSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchContainerRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { stories } = useStories({ limit: 60 });

    const toggleMenu = () => setMenuOpen((prev) => !prev);
    const closeMenu = () => {
        setMenuOpen(false);
        setIsOpenSuggestions(false);
    };

    // Atajo de teclado global: '/' o 'Ctrl+K' / 'Cmd+K' para enfocar búsqueda
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isTypingInInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
                document.activeElement?.tagName || ''
            );

            if (
                (e.key === '/' && !isTypingInInput) ||
                ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')
            ) {
                e.preventDefault();
                inputRef.current?.focus();
                setIsOpenSuggestions(true);
            } else if (e.key === 'Escape') {
                setIsOpenSuggestions(false);
                inputRef.current?.blur();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Cerrar sugerencias al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(e.target)
            ) {
                setIsOpenSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const queryNorm = normalizar(searchQuery);

    // Sugerencias predictivas de historias y medios
    const suggestions = useMemo(() => {
        if (queryNorm.length < 2) return { stories: [], media: [], allItems: [] };

        const matchedStories = stories
            .filter((s) => normalizar(s.title).includes(queryNorm) || normalizar(s.summary).includes(queryNorm))
            .slice(0, 4)
            .map((s) => ({
                type: 'story',
                id: s.id,
                title: s.title,
                category: s.category,
                url: rutaDeHistoria(s),
            }));

        const matchedMedia = MEDIA_REGISTRY
            .filter((m) => normalizar(m.name).includes(queryNorm) || normalizar(m.group).includes(queryNorm))
            .slice(0, 3)
            .map((m) => ({
                type: 'media',
                id: m.id,
                title: m.name,
                spectrum: classifySpectrum(m.bias),
                url: '/mapa-medios',
            }));

        const allItems = [
            ...matchedStories,
            ...matchedMedia,
            { type: 'search_all', id: 'search_all', title: `Buscar todas las noticias sobre «${searchQuery.trim()}»`, url: `/buscar?q=${encodeURIComponent(searchQuery.trim())}` },
        ];

        return { stories: matchedStories, media: matchedMedia, allItems };
    }, [queryNorm, stories, searchQuery]);

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        const trimmed = searchQuery.trim();

        if (selectedIndex >= 0 && suggestions.allItems[selectedIndex]) {
            const item = suggestions.allItems[selectedIndex];
            navigate(item.url);
            setSearchQuery('');
            setIsOpenSuggestions(false);
            closeMenu();
            return;
        }

        if (trimmed.length >= 2) {
            navigate(`/buscar?q=${encodeURIComponent(trimmed)}`);
            setSearchQuery('');
            setIsOpenSuggestions(false);
            closeMenu();
        }
    };

    const handleKeyDownInput = (e) => {
        if (!isOpenSuggestions || suggestions.allItems.length === 0) {
            if (e.key === 'ArrowDown') setIsOpenSuggestions(true);
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev < suggestions.allItems.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.allItems.length - 1));
        } else if (e.key === 'Enter') {
            handleSearchSubmit(e);
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

                <div className="navbar-search-container" ref={searchContainerRef}>
                    <form className="navbar-search" onSubmit={handleSearchSubmit} role="search">
                        <input
                            ref={inputRef}
                            type="search"
                            placeholder="Buscar noticias o medios..."
                            aria-label="Buscar noticias o medios"
                            aria-autocomplete="list"
                            aria-expanded={isOpenSuggestions && suggestions.allItems.length > 0}
                            value={searchQuery}
                            onFocus={() => setIsOpenSuggestions(true)}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setIsOpenSuggestions(true);
                                setSelectedIndex(-1);
                            }}
                            onKeyDown={handleKeyDownInput}
                        />
                        <div className="search-badges-group">
                            <span className="search-shortcut-badge" title="Atajo de teclado: presiona / para buscar">
                                /
                            </span>
                            <button type="submit" className="search-submit-btn" aria-label="Buscar">
                                <Search size={15} />
                            </button>
                        </div>
                    </form>

                    {/* Popover de Búsqueda Predictiva */}
                    {isOpenSuggestions && queryNorm.length >= 2 && (
                        <div className="predictive-search-dropdown" role="listbox" aria-label="Sugerencias de búsqueda">
                            {suggestions.stories.length > 0 && (
                                <div className="predictive-section">
                                    <span className="predictive-section-title">
                                        <Newspaper size={12} aria-hidden="true" /> Noticias
                                    </span>
                                    {suggestions.stories.map((story) => {
                                        const globalIdx = suggestions.allItems.findIndex((i) => i.id === story.id);
                                        const isSelected = selectedIndex === globalIdx;
                                        return (
                                            <Link
                                                key={story.id}
                                                to={story.url}
                                                className={`predictive-item ${isSelected ? 'active' : ''}`}
                                                onClick={() => {
                                                    setIsOpenSuggestions(false);
                                                    setSearchQuery('');
                                                }}
                                            >
                                                <div className="predictive-item-content">
                                                    <span className="predictive-item-title">{story.title}</span>
                                                    {story.category && (
                                                        <span className="predictive-item-badge">{story.category}</span>
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {suggestions.media.length > 0 && (
                                <div className="predictive-section">
                                    <span className="predictive-section-title">
                                        <Radio size={12} aria-hidden="true" /> Medios del catálogo
                                    </span>
                                    {suggestions.media.map((item) => {
                                        const globalIdx = suggestions.allItems.findIndex((i) => i.id === item.id);
                                        const isSelected = selectedIndex === globalIdx;
                                        return (
                                            <Link
                                                key={item.id}
                                                to={item.url}
                                                className={`predictive-item ${isSelected ? 'active' : ''}`}
                                                onClick={() => {
                                                    setIsOpenSuggestions(false);
                                                    setSearchQuery('');
                                                }}
                                            >
                                                <div className="predictive-item-content">
                                                    <span className="predictive-item-title">{item.title}</span>
                                                    <span className={`predictive-spectrum-badge ${item.spectrum}`}>
                                                        {SPECTRUM_LABEL[item.spectrum]}
                                                    </span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            <Link
                                to={`/buscar?q=${encodeURIComponent(searchQuery.trim())}`}
                                className={`predictive-footer-link ${selectedIndex === suggestions.allItems.length - 1 ? 'active' : ''}`}
                                onClick={() => {
                                    setIsOpenSuggestions(false);
                                    setSearchQuery('');
                                }}
                            >
                                <span>Ver todos los resultados para «<strong>{searchQuery.trim()}</strong>»</span>
                                <span className="predictive-enter-hint">
                                    <CornerDownLeft size={11} aria-hidden="true" /> Enter
                                </span>
                            </Link>
                        </div>
                    )}
                </div>

                <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    <form className="navbar-search-mobile" onSubmit={handleSearchSubmit} role="search">
                        <input
                            type="search"
                            placeholder="Buscar noticias o medios..."
                            aria-label="Buscar noticias o medios"
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
                                Categorías
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
