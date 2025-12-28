import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/images/Untitled__1_-removebg-preview.png';
import Button from '../../components/ui/Button';
import './LoginPage.css';
import './WelcomePage.css'; // Reutilizando el fondo

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const { error } = await login({ email, password });

    setLoading(false);
    if (error) {
      setErrorMsg(error.message === 'Invalid login credentials' ? 'Credenciales de inicio de sesión inválidas.' : 'Ocurrió un error. Inténtalo de nuevo.');
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="login-page">
      <div className="welcome-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="login-container">
        <div className="login-header">
          <Link to="/">
            <div className="logo-container">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={logo} alt="Logo" style={{ width: '200px', height: '200px', objectFit: 'cover' }} />
      
        </div>
            </div>
          </Link>
          <h1 className="login-title">Inicia Sesión</h1>
          <p className="login-subtitle">Nos alegra verte de nuevo.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {errorMsg && <p className="error-message">{errorMsg}</p>}
          <div className="input-group">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading} style={{ width: '100%', height: '48px', fontSize: '1rem' }}>
            {loading ? 'Iniciando...' : 'Entrar'}
          </Button>
        </form>

        <p className="register-link">
          ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
