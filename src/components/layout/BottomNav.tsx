import React from 'react';
import { NavLink } from 'react-router-dom';
import '../../styles/Layout.css';
import { useAuth } from '../../context/AuthContext';

const BottomNav = () => {
  const { unreadNotifications } = useAuth();
  return (
    <nav className="mobile-bottom-nav">
      <NavLink to="/home" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="bottom-nav-icon">🏠</span>
        <span>Inicio</span>
      </NavLink>
      
      <NavLink to="/search" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="bottom-nav-icon">🔍</span>
        <span>Explorar</span>
      </NavLink>

      <NavLink to="/notifications" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <div style={{ position: 'relative' }}>
            <span className="bottom-nav-icon">🔔</span>
            {unreadNotifications > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#ef4444',
                    borderRadius: '50%',
                    border: '1px solid white'
                }} />
            )}
        </div>
        <span>Alertas</span>
      </NavLink>

      <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="bottom-nav-icon">👤</span>
        <span>Perfil</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
