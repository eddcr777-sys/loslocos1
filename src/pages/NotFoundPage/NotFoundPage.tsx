import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Logo from '../../components/ui/logo';

const NotFoundPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <Logo size="large" />
      </div>
      
      <h1 style={{ 
        fontSize: '4rem', 
        fontWeight: '800', 
        marginBottom: '1rem',
        color: 'var(--primary)' 
      }}>
        404
      </h1>
      
      <h2 style={{ 
        fontSize: '2rem', 
        marginBottom: '1rem',
        color: 'var(--text-primary)'
      }}>
        Página no encontrada
      </h2>
      
      <p style={{ 
        color: 'var(--text-secondary)', 
        marginBottom: '2rem',
        fontSize: '1.1rem',
        maxWidth: '400px'
      }}>
        Parece que te has perdido. La página que buscas no existe o ha sido movida.
      </p>

      <Link to="/home">
        <Button size="large">
          Volver al Inicio
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
