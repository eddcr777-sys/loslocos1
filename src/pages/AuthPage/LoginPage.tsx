import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/images/Untitled__1_-removebg-preview.png';
import { LogIn, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setErrorMsg(error.message === 'Invalid login credentials' ? 'Credenciales incorrectas.' : 'Error de conexión.');
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="login-page">
      <main className="auth-main">
        <section className="brand-sidebar">
          <Link to="/" className="brand-id">
            <span>UniFeed</span>
          </Link>
          <div className="brand-tagline">
            <h1>Bienvenido <br/>de Nuevo.</h1>
            <p>Accede a tu cuenta profesional y continúa conectando con tu facultad.</p>
          </div>
        </section>

        <section className="form-section">
          <div className="auth-card">
            <header className="auth-header">
              <h2>Iniciar Sesión</h2>
              <p>Por favor ingresa tus credenciales de acceso.</p>
            </header>

            <form onSubmit={handleSubmit} className="auth-form">
              {errorMsg && <div className="form-error" style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid #fecaca' }}>{errorMsg}</div>}
              
              <div className="form-field">
                <label>Correo Universitario</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    className="input-pro"
                    style={{ paddingLeft: '44px' }}
                    placeholder="usuario@dominio.edu" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              
              <div className="form-field">
                <label>Contraseña</label>
                <div className="password-input-wrapper">
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="input-pro"
                    style={{ paddingLeft: '44px', paddingRight: '44px' }}
                    placeholder="Tu contraseña secreta" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                  <div className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
              </div>
              
              <button type="submit" className="btn-continue" disabled={loading} style={{ marginTop: '1rem' }}>
                {loading ? 'Validando...' : <>Entrar <LogIn size={22} /></>}
              </button>
            </form>

            <footer className="auth-footer" style={{ marginTop: '3rem' }}>
               ¿No tienes cuenta? <Link to="/register" style={{ fontWeight: 800 }}>Regístrate ahora</Link>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;
