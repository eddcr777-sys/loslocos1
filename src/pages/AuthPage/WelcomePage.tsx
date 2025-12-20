import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import './WelcomePage.css';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-page">
      {/* Fondo animado */}
      <div className="welcome-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div
        className="welcome-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          padding: '2rem',
          maxWidth: '550px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="welcome-header">
          <div className="logo-container">
          </div>
          <h1 className="welcome-title">
            Bienvenido a <span className="text-gradient">UniFeed</span>
          </h1>
          <p className="welcome-subtitle">
            La red social exclusiva para conectar, compartir y descubrir todo lo que sucede en tu comunidad universitaria.
          </p>
        </div>

        <div className="welcome-actions">
          <Button
            onClick={() => navigate('/login')}
            style={{ width: '100%', justifyContent: 'center', height: '48px', fontSize: '1rem' }}
          >
            Iniciar Sesión
          </Button>
          
          <div className="divider">
            <span>o</span>
          </div>

          <Button
            variant="ghost"
            onClick={() => navigate('/register')}
            style={{ width: '100%', justifyContent: 'center', height: '48px', fontSize: '1rem' }}
          >
            Crear cuenta nueva
          </Button>
        </div>

        <footer className="welcome-footer">
          <p>© 2024 UniFeed. Conectando el campus.</p>
        </footer>
      </div>
    </div>
  );
};

export default WelcomePage;