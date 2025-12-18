import React from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1>Bienvenidos a ConociendoGente</h1>
      <p style={styles.subtitle}>qlq tdod fino?</p>
      
      <div style={styles.buttonContainer}>
        <button onClick={() => navigate('/login')} style={styles.button}>
          Iniciar Sesión
        </button>
        <button onClick={() => navigate('/register')} style={{ ...styles.button, backgroundColor: '#28a745' }}>
          Crear Cuenta
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    textAlign: 'center',
    padding: '20px',
  },
  subtitle: { fontSize: '1.2rem', color: '#666', marginBottom: '2rem' },
  buttonContainer: { display: 'flex', gap: '1rem' },
  button: {
    padding: '10px 20px',
    fontSize: '1rem',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
  },
};

export default WelcomePage;