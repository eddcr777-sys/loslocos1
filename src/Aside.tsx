import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import Logo from './components/ui/logo';
import Menu from './Menu';
import { Home, TrendingUp, Bell, User, Search } from 'lucide-react';
import './Aside.css';

const Aside = () => {
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'aside-nav-item active' : 'aside-nav-item';

  return (
    <aside className="app-aside">
      <div>
        <div className="aside-logo">
    <h1>UniFeed</h1>
        </div>
        <nav className="aside-nav">
          <NavLink to="/home" className={getNavLinkClass}>
            <Home size={20} />
            <span>Inicio</span>
          </NavLink>
          <NavLink to="/search" className={getNavLinkClass}>
            <Search size={20} />
            <span>Explorer</span>
          </NavLink>
          <NavLink to="/trends" className={getNavLinkClass}>
            <TrendingUp size={20} />
            <span>Tendencias</span>
          </NavLink>
          <NavLink to="/notifications" className={getNavLinkClass}>
            <Bell size={20} />
            <span>Notificaciones</span>
          </NavLink>
          <NavLink to="/profile" className={getNavLinkClass}>
            <User size={20} />
            <span>Perfil</span>
          </NavLink>
        </nav>
      </div>
      {/* Menú de usuario en la parte inferior */}
      <div className="aside-menu">
        <Menu />
      </div>
    </aside>
  );
};

export default Aside;