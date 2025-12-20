import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Navbar.css';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/logo';

const Navbar: React.FC = () => {
  const { user, logout, unreadNotifications } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar-header">
      <div className="navbar-logo">
        <Logo size="small" to={user ? '/home' : '/'} />
      </div>
      <nav className="navbar-nav">
        <ul>
          <li><Link to="/home">Inicio</Link></li>
          <li><Link to="/about">Acerca de</Link></li>
          {user ? (
            <>
              <li>
                <Link to="/notifications">
                  Notificaciones
                  {unreadNotifications > 0 && <span className="notification-badge">{unreadNotifications}</span>}
                </Link>
              </li>
              <li><Link to={`/profile/${user.id}`}>Perfil</Link></li>
              <li>
                <button onClick={handleLogout} className="logout-button">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;