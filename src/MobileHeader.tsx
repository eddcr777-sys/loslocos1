import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate, matchPath } from 'react-router-dom';
import { Menu as MenuIcon, X, Home, TrendingUp, Bell, User, Search, Calendar } from 'lucide-react';
import Menu from './Menu';
import './MobileHeader.css';

import Logo from './components/ui/logo';
import { useAuth } from './context/AuthContext';
import SubPageHeader from './components/layout/SubPageHeader';

import { usePWAStatus } from './hooks/usePWAStatus';

const MobileHeader = () => {
  const { unreadNotifications, isAdmin, isInstitutional, user } = useAuth();
  const { isStandalone } = usePWAStatus();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // ... (rest of the detection logic)
  const isProfileDetail = matchPath('/profile/:userId', location.pathname);
  const isPostDetail = matchPath('/post/:postId', location.pathname);
  const isFollowList = matchPath('/profile/:userId/followers', location.pathname) || matchPath('/profile/:userId/following', location.pathname);
  const isSettings = location.pathname.startsWith('/settings');
  
  const isSubPage = !!(isProfileDetail || isPostDetail || isFollowList || isSettings);

  let pageTitle = '';
  if (isProfileDetail) pageTitle = 'Perfil';
  else if (isPostDetail) pageTitle = 'Publicación';
  else if (isFollowList) pageTitle = location.pathname.includes('followers') ? 'Seguidores' : 'Siguiendo';
  else if (isSettings) pageTitle = 'Ajustes';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (isSubPage) {
     return <SubPageHeader title={pageTitle} />;
  }

  return (
    <header className={`mobile-header ${isStandalone ? 'standalone' : ''}`}>
      <div className="mobile-header-content">
        <Logo size="small" variant="icon" text="UniFeed" to="/home" className="header-logo" />
        
        <nav className="mobile-header-nav">
          {isStandalone ? (
            <>
              {/* Solo iconos no presentes en BottomNav para no duplicar */}
              <NavLink to="/events" className={({ isActive }) => isActive ? 'header-nav-item active' : 'header-nav-item'}>
                <Calendar size={22} />
              </NavLink>
              <NavLink to="/trends" className={({ isActive }) => isActive ? 'header-nav-item active' : 'header-nav-item'}>
                <TrendingUp size={22} />
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/home" className={({ isActive }) => isActive ? 'header-nav-item active' : 'header-nav-item'}>
                <Home size={22} />
              </NavLink>
              <NavLink to="/search" className={({ isActive }) => isActive ? 'header-nav-item active' : 'header-nav-item'}>
                <Search size={22} />
              </NavLink>
              <NavLink to="/events" className={({ isActive }) => isActive ? 'header-nav-item active' : 'header-nav-item'}>
                <Calendar size={22} />
              </NavLink>
              <NavLink to="/trends" className={({ isActive }) => isActive ? 'header-nav-item active' : 'header-nav-item'}>
                <TrendingUp size={22} />
              </NavLink>
              <NavLink to="/notifications" className={({ isActive }) => isActive ? 'header-nav-item active' : 'header-nav-item'}>
                <div className="nav-item-container">
                  <Bell size={22} />
                  {unreadNotifications > 0 && (
                    <span className="notification-badge">{unreadNotifications}</span>
                  )}
                </div>
              </NavLink>
              <NavLink to="/profile" end className={({ isActive }) => isActive ? 'header-nav-item active' : 'header-nav-item'}>
                <User size={22} />
              </NavLink>
            </>
          )}
        </nav>

        <div className="menu-section" ref={menuRef}>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="menu-button">
            {isMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
          {isMenuOpen && (
            <div className="menu-popover">
              <Menu onItemClick={() => setIsMenuOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;