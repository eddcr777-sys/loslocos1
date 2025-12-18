import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Navbar.css';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Si no hay usuario, no mostrar el navbar
  if (!user) {
    return null;
  }

  return (
    <header className="navbar-header">
      <div className="navbar-logo">
        <Link to="/home">MiApp</Link>
      </div>
      <nav className="navbar-nav">
        <ul>
          <li><Link to="/home">Inicio</Link></li>
          <li><Link to="/about">Acerca de</Link></li>
          {user ? (
            <>
              <li><Link to="/profile">Perfil</Link></li>
              <li>
                <button onClick={handleLogout} className="logout-button">Logout</button>
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