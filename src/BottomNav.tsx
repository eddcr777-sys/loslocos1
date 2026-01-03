import { NavLink } from 'react-router-dom';
import { Home, Search, Bell, User } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import './BottomNav.css';

const BottomNav = () => {
  const { unreadNotifications } = useAuth();
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
        <div style={{ position: 'relative' }}>
          <Bell size={24} />
          {unreadNotifications > 0 && (
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              background: 'var(--error)',
              color: 'white',
              fontSize: '10px',
              minWidth: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--surface-color)'
            }}>
              {unreadNotifications}
            </span>
          )}
        </div>
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