import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import Logo from './components/ui/logo';
import Menu from './Menu';
import { Home, TrendingUp, Bell, User, Search, Shield, Calendar } from 'lucide-react';
import './Aside.css';
import { useAuth } from './context/AuthContext';
import { usePWAStatus } from './hooks/usePWAStatus';

const Aside = () => {
  const { unreadNotifications, isAdmin, isInstitutional } = useAuth();
  const { isStandalone } = usePWAStatus();
// Log removed for production
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'aside-nav-item active' : 'aside-nav-item';

  return (
    <aside className="app-aside">
      <div>
        <div className="aside-logo">
          <Logo size="large" to="/home" text="UniFeed" />
        </div>
        <nav className="aside-nav">
          {!isStandalone ? (
            <>
              <NavLink to="/home" className={getNavLinkClass}>
                <Home size={20} />
                <span>Inicio</span>
              </NavLink>
              <NavLink to="/search" className={getNavLinkClass}>
                <Search size={20} />
                <span>Explorer</span>
              </NavLink>
              <NavLink to="/events" className={getNavLinkClass}>
                <Calendar size={20} />
                <span>Eventos</span>
              </NavLink>
              <NavLink to="/trends" className={getNavLinkClass}>
                <TrendingUp size={20} />
                <span>Tendencias</span>
              </NavLink>
              <NavLink to="/notifications" className={getNavLinkClass}>
                <div className="nav-item-wrapper">
                  <Bell size={20} />
                  {unreadNotifications > 0 && (
                    <span className="notification-badge">{unreadNotifications}</span>
                  )}
                </div>
                <span>Notificaciones</span>
              </NavLink>
              <NavLink to="/profile" className={getNavLinkClass} end>
                <User size={20} />
                <span>Perfil</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/events" className={getNavLinkClass}>
                <Calendar size={20} />
                <span>Eventos</span>
              </NavLink>
              <NavLink to="/trends" className={getNavLinkClass}>
                <TrendingUp size={20} />
                <span>Tendencias</span>
              </NavLink>
            </>
          )}
          
          {isAdmin && (
            <NavLink to="/admin" className={getNavLinkClass}>
              <Shield size={20} />
              <span>Panel Admin</span>
            </NavLink>
          )}
          {isInstitutional && (
            <NavLink to="/institutional" className={getNavLinkClass}>
              <Shield size={20} />
              <span>Panel Institucional</span>
            </NavLink>
          )}
        </nav>
      </div>
      {/* Menú de usuario en la parte inferior */}
      <div className="aside-menu">
        <Menu hideAdmin={true} hideInstitutional={true} />
      </div>
    </aside>
  );
};

export default Aside;