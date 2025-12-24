import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Settings, LogOut, Shield } from 'lucide-react';
import './Menu.css';

const Menu = () => {
  const { logout, user, isAdmin, isInstitutional } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  const goToSettings = () => {
    navigate('/Settings');
  };

  if (!user) return null;

  return (
    <nav className="user-menu">
      {isAdmin && (
        <button onClick={() => navigate('/admin')} className="user-menu-item admin-highlight">
          <Shield size={20} color="#f59e0b" />
          <span>Panel Administrador</span>
        </button>
      )}

      {isInstitutional && (
        <button onClick={() => navigate('/institutional')} className="user-menu-item admin-highlight">
          <Shield size={20} color="#10b981" />
          <span>Panel Institucional</span>
        </button>
      )}

      {!isAdmin && !isInstitutional && (
        <button onClick={() => navigate('/verify-admin')} className="user-menu-item">
          <Shield size={20} />
          <span>Verificación Oficial</span>
        </button>
      )}

      <button onClick={goToSettings} className="user-menu-item">
        <Settings size={20} />
        <span>Configuración</span>
      </button>
      <button onClick={handleLogout} className="user-menu-item">
        <LogOut size={20} />
        <span>Cerrar Sesión</span>
      </button>
    </nav>
  );
};

export default Menu;