import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/ui/logo';
import Button from '../../components/ui/Button';
import './LoginPage.css';
import './WelcomePage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!formData.name || !formData.email || !formData.password) {
      setErrorMsg('Por favor completa todos los campos.');
      setLoading(false);
      return;
    }

    // Llamamos a register pasando el nombre, email y password
    const { error } = await register({
      email: formData.email,
      password: formData.password,
      name: formData.name,
    });

    setLoading(false);
    if (error) {
      setErrorMsg(error.message || 'Ocurrió un error durante el registro.');
    } else {
      // Si es exitoso, redirigimos al home
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
            <Logo size="medium" />
          </Link>
          <h1 className="login-title">Crea tu Cuenta</h1>
          <p className="login-subtitle">Únete a la comunidad. Es rápido y fácil.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {errorMsg && <p className="error-message">{errorMsg}</p>}
          <div className="input-group">
            <label htmlFor="name">Nombre completo</label>
            <input id="name" type="text" name="name" placeholder="Nombre" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" name="email" placeholder="tu@email.com" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
          </div>
          <Button type="submit" disabled={loading} style={{ width: '100%', height: '48px', fontSize: '1rem' }}>
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </Button>
        </form>

        <p className="register-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
