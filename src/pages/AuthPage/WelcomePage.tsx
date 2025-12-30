import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/images/Untitled__1_-removebg-preview.png';
import { ArrowRight, UserPlus, LogIn } from 'lucide-react';
import './LoginPage.css';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <main className="auth-main">
        {/* Elite Sidebar Branding (Extra Wide) */}
        <section className="brand-sidebar" style={{ flex: 1.4 }}>
          <div className="brand-id">
            <img src={logo} alt="UniFeed" />
            <span>UniFeed.</span>
          </div>
          <div className="brand-tagline">
            <h1 style={{ fontSize: '7rem' }}>UniFeed.</h1>
            <p style={{ fontSize: '1.8rem', opacity: 0.9 }}>
                La red académica más influyente donde el talento se encuentra con las oportunidades.
            </p>
          </div>
        </section>

        {/* Action Right Area */}
        <section className="form-section">
          <div className="auth-card">
            <header className="auth-header" style={{ marginBottom: '4rem' }}>
              <h2>Empieza ahora</h2>
              <p>Conecta con líderes de tu facultad y comparte el conocimiento que importa.</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <button 
                onClick={() => navigate('/login')}
                className="btn-continue"
                style={{ height: '70px', fontSize: '1.2rem' }}
              >
                Acceder a mi cuenta <LogIn size={26} />
              </button>
              
              <button
                onClick={() => navigate('/register')}
                className="btn-reverse"
                style={{ height: '70px', fontSize: '1.2rem', color: 'var(--text-primary)', border: '2px solid var(--text-primary)', fontWeight: 800 }}
              >
                Crear cuenta profesional <UserPlus size={26} />
              </button>
            </div>

            <footer style={{ marginTop: 'auto', paddingTop: '6rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 700, textAlign: 'center' }}>
               © 2025 UNIFEED — NETWORK FOR ACADEMIA
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
};

export default WelcomePage;
