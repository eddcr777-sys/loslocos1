import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Layout.css';

const Sidebar = () => {
  const { user, logout, unreadNotifications } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        UniFeed
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/home" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span>🏠</span> Inicio
        </NavLink>

        <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span>#️⃣</span> Explorar
        </NavLink>

        <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span>🔔</span> Notificaciones
          {unreadNotifications > 0 && (
              <span style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  padding: '2px 6px',
                  fontSize: '0.75rem',
                  marginLeft: 'auto'
              }}>
                  {unreadNotifications}
              </span>
          )}
        </NavLink>
        


        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span>👤</span> Perfil
        </NavLink>

        <div onClick={handleLogout} className="nav-item" style={{ cursor: 'pointer', marginTop: 'auto' }}>
            <span>🚪</span> Cerrar sesión
        </div>
      </nav>

      <button className="sidebar-post-btn" onClick={() => navigate('/home')}>
        Publicar
      </button>
    </aside>
  );
};

export default Sidebar;
