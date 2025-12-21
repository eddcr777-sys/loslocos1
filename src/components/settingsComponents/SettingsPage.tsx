import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { User, Lock, Bell, Moon, ChevronRight } from 'lucide-react';
import ProfileSettings from './ProfileSettings';
import AccountSettings from './AccountSettings';
import NotificationSettings from './NotificationSettings';
import AppearanceSettings from './AppearanceSettings';
import './SettingsPage.css';

const SettingsPage = () => {
  return (
    <div className="settings-layout">
      <aside className="settings-sidebar">
        <h1 className="settings-title">Configuración</h1>
        <nav className="settings-nav">
          <NavLink 
            to="/settings/profile" 
            className={({ isActive }) => `settings-nav-item ${isActive ? 'active' : ''}`}
          >
            <User size={20} />
            <span>Perfil</span>
            <ChevronRight size={16} className="arrow" />
          </NavLink>
          
          <NavLink 
            to="/settings/account" 
            className={({ isActive }) => `settings-nav-item ${isActive ? 'active' : ''}`}
          >
            <Lock size={20} />
            <span>Cuenta y Seguridad</span>
            <ChevronRight size={16} className="arrow" />
          </NavLink>
          
          <NavLink 
            to="/settings/notifications" 
            className={({ isActive }) => `settings-nav-item ${isActive ? 'active' : ''}`}
          >
            <Bell size={20} />
            <span>Notificaciones</span>
            <ChevronRight size={16} className="arrow" />
          </NavLink>
          
          <NavLink 
            to="/settings/appearance" 
            className={({ isActive }) => `settings-nav-item ${isActive ? 'active' : ''}`}
          >
            <Moon size={20} />
            <span>Apariencia</span>
            <ChevronRight size={16} className="arrow" />
          </NavLink>
        </nav>
      </aside>

      <main className="settings-content">
        <Routes>
          <Route path="/" element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfileSettings />} />
          <Route path="account" element={<AccountSettings />} />
          <Route path="notifications" element={<NotificationSettings />} />
          <Route path="appearance" element={<AppearanceSettings />} />
        </Routes>
      </main>
    </div>
  );
};

export default SettingsPage;