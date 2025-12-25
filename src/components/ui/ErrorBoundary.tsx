import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          textAlign: 'center',
          padding: '20px'
        }}>
          <h1 style={{ marginBottom: '1rem', fontSize: '2rem' }}>¡Ups! Algo salió mal.</h1>
          <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', maxWidth: '500px' }}>
            Ha ocurrido un error inesperado en la aplicación. No te preocupes, puedes intentar recargar la página.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button onClick={this.handleReload}>
              Recargar Página
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Ir al Inicio
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre style={{ 
              marginTop: '40px', 
              textAlign: 'left', 
              background: '#333', 
              color: '#fff', 
              padding: '1rem', 
              borderRadius: '8px',
              maxWidth: '800px',
              overflow: 'auto'
            }}>
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
