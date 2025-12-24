import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu as MenuIcon, X, Home, TrendingUp, Bell, User, Search, Shield } from 'lucide-react';
import Menu from './Menu';
import './MobileHeader.css';
import Logo from './components/ui/logo';
import { useAuth } from './context/AuthContext';

const MobileHeader = () => {
  const { unreadNotifications, isAdmin, isInstitutional } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="mobile-header">
      <div className="mobile-header-content">
        <Logo size="small" variant="icon" to="/home" className="header-logo" />

        <nav className="mobile-header-nav">
          <NavLink to="/home" className={({ isActive }) => isActive ? 'header-nav-item active' : 'header-nav-item'}>
            <Home size={24} />
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => isActive ? 'header-nav-item active' : 'header-nav-item'}>
            <Search size={24} />
          </NavLink>
          <NavLink to="/trends" className={({ isActive }) => isActive ? 'header-nav-item active' : 'header-nav-item'}>
            <TrendingUp size={24} />
          </NavLink>
          <NavLink to="/notifications" className={({ isActive }) => isActive ? 'header-nav-item active' : 'header-nav-item'}>
            <div className="nav-item-container">
              <Bell size={24} />
              {unreadNotifications > 0 && (
                <span className="notification-badge">{unreadNotifications}</span>
              )}
            </div>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'header-nav-item active' : 'header-nav-item'}>
            <User size={24} />
          </NavLink>
          
          {(!isAdmin && !isInstitutional) && (
            <NavLink to="/verify-admin" className={({ isActive }) => isActive ? 'header-nav-item active' : 'header-nav-item'}>
              <Shield size={24} />
            </NavLink>
          )}
        </nav>

        <div className="menu-section" ref={menuRef}>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="menu-button">
            {isMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
          {isMenuOpen && (
            <div className="menu-popover">
              <Menu />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;