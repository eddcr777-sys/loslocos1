import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { User, Lock, Bell, Moon, ChevronRight, Shield, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ProfileSettings from './ProfileSettings';
import AccountSettings from './AccountSettings';
import NotificationSettings from './NotificationSettings';
import AppearanceSettings from './AppearanceSettings';
import LegalSettings from './LegalSettings';
import './SettingsPage.css';

const SettingsPage = () => {
  const { isAdmin, isInstitutional, profile } = useAuth();
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

          <NavLink 
            to="/settings/legal" 
            className={({ isActive }) => `settings-nav-item ${isActive ? 'active' : ''}`}
          >
            <FileText size={20} />
            <span>Legal e Información</span>
            <ChevronRight size={16} className="arrow" />
          </NavLink>

          <div className="settings-nav-divider" />

          {isAdmin && (
            <NavLink 
              to="/admin" 
              className="settings-nav-item admin-item"
            >
              <Shield size={20} color="#f59e0b" />
              <span>Panel Administrador</span>
              <ChevronRight size={16} className="arrow" />
            </NavLink>
          )}

          {isInstitutional && (
            <NavLink 
              to="/institutional" 
              className="settings-nav-item admin-item"
            >
              <Shield size={20} color="#10b981" />
              <span>Panel Institucional</span>
              <ChevronRight size={16} className="arrow" />
            </NavLink>
          )}

          {!isAdmin && !isInstitutional && (
            <NavLink 
              to="/verify-admin" 
              className="settings-nav-item"
            >
              <Shield size={20} />
              <span>Verificación Oficial</span>
              <ChevronRight size={16} className="arrow" />
            </NavLink>
          )}
        </nav>
      </aside>

      <main className="settings-content">
        <Routes>
          <Route path="/" element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfileSettings />} />
          <Route path="account" element={<AccountSettings />} />
          <Route path="notifications" element={<NotificationSettings />} />
          <Route path="appearance" element={<AppearanceSettings />} />
          <Route path="legal" element={<LegalSettings />} />
        </Routes>
      </main>
    </div>
  );
};

export default SettingsPage;