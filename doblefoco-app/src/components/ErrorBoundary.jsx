import { Component } from 'react';
import { ShieldAlert, RotateCcw, Home } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, errorInfo: error.toString() };
    }

    componentDidCatch(error, errorInfo) {
        console.error("🛡️ [Security ErrorBoundary] Capturado fallo o excepción inesperada:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, errorInfo: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '40px 20px',
                    textAlign: 'center',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    backgroundColor: '#18191c',
                    color: '#f8fafc'
                }}>
                    <div style={{
                        background: '#202226',
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: '40px 30px',
                        maxWidth: '480px',
                        width: '100%',
                        borderRadius: '4px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }}>
                        <ShieldAlert size={54} style={{ color: '#ef4444', marginBottom: 16 }} />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: 12 }}>
                            Protección Activa de Sistema
                        </h1>
                        <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: 24, lineHeight: 1.5 }}>
                            El cortafuegos interno de DobleFoco.co aisló un evento inesperado para resguardar la integridad de los datos.
                        </p>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                onClick={this.handleReset}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 3,
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    background: '#ffffff',
                                    color: '#000000',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6
                                }}
                            >
                                <Home size={14} /> Volver al Inicio Seguro
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
