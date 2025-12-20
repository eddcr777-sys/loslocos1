import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Bell, User } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bottom-nav-item active' : 'bottom-nav-item';

  return (
    <nav className="bottom-nav">
      <NavLink to="/home" className={getNavLinkClass}>
        <Home size={24} />
        <span>Inicio</span>
      </NavLink>
      <NavLink to="/search" className={getNavLinkClass}>
        <Search size={24} />
        <span>Explorer</span>
      </NavLink>
      <NavLink to="/notifications" className={getNavLinkClass}>
        <Bell size={24} />
        <span>Notificaciones</span>
      </NavLink>
      <NavLink to="/profile" className={getNavLinkClass}>
        <User size={24} />
        <span>Perfil</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;