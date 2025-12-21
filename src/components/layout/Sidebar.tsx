import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Layout.css';

const Sidebar = () => {
  const { user, logout, unreadNotifications } = useAuth();
  const navigate = useNavigate();

  console.log('Sidebar - rendering. unreadNotifications:', unreadNotifications);

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
          <span style={{ fontSize: '1.25rem' }}>🏠</span> 
          <span style={{ marginLeft: '12px' }}>Inicio</span>
        </NavLink>

        <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span style={{ fontSize: '1.25rem' }}>#️⃣</span> 
          <span style={{ marginLeft: '12px' }}>Explorar</span>
        </NavLink>

        <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '1.25rem' }}>🔔</span>
            {unreadNotifications > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                border: '2px solid white',
                padding: '0 4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {unreadNotifications}
              </span>
            )}
          </div>
          <span style={{ marginLeft: '12px' }}>Notificaciones</span>
        </NavLink>
        
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span style={{ fontSize: '1.25rem' }}>👤</span> 
          <span style={{ marginLeft: '12px' }}>Perfil</span>
        </NavLink>

        <div onClick={handleLogout} className="nav-item" style={{ cursor: 'pointer', marginTop: 'auto' }}>
            <span style={{ fontSize: '1.25rem' }}>🚪</span> 
            <span style={{ marginLeft: '12px' }}>Cerrar sesión</span>
        </div>
      </nav>

      <button className="sidebar-post-btn" onClick={() => navigate('/home')}>
        Publicar
      </button>
    </aside>
  );
};

export default Sidebar;
