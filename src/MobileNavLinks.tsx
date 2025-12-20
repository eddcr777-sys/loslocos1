import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Bell, User } from 'lucide-react';
import './MobileNavLinks.css';

interface MobileNavLinksProps {
  onLinkClick: () => void;
}

const MobileNavLinks: React.FC<MobileNavLinksProps> = ({ onLinkClick }) => {
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'mobile-nav-item active' : 'mobile-nav-item';

  return (
    <nav className="mobile-nav-links">
      <NavLink to="/home" className={getNavLinkClass} onClick={onLinkClick}>
        <Home size={20} />
        <span>Inicio</span>
      </NavLink>
      <NavLink to="/search" className={getNavLinkClass} onClick={onLinkClick}>
        <Search size={20} />
        <span>Explorer</span>
      </NavLink>
      <NavLink to="/notifications" className={getNavLinkClass} onClick={onLinkClick}>
        <Bell size={20} />
        <span>Notificaciones</span>
      </NavLink>
      <NavLink to="/profile" className={getNavLinkClass} onClick={onLinkClick}>
        <User size={20} />
        <span>Perfil</span>
      </NavLink>
    </nav>
  );
};

export default MobileNavLinks;