import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Settings, LogOut, Shield } from 'lucide-react';
import './Menu.css';

interface MenuProps {
  hideAdmin?: boolean;
  hideInstitutional?: boolean;
  onItemClick?: () => void;
}

const Menu: React.FC<MenuProps> = ({ 
  hideAdmin = false, 
  hideInstitutional = false,
  onItemClick 
}) => {
  const { logout, user, isAdmin, isInstitutional } = useAuth();
  const navigate = useNavigate();

  const handleAction = (action: () => void) => {
    action();
    if (onItemClick) onItemClick();
  };

  const handleLogout = async () => {
    await logout();
    if (onItemClick) onItemClick();
  };

  const goToSettings = () => {
    handleAction(() => navigate('/Settings'));
  };

  if (!user) return null;

  return (
    <nav className="user-menu">
      {isAdmin && !hideAdmin && (
        <button onClick={() => handleAction(() => navigate('/admin'))} className="user-menu-item admin-highlight">
          <Shield size={20} color="#f59e0b" />
          <span>Panel Administrador</span>
        </button>
      )}

      {isInstitutional && !hideInstitutional && (
        <button onClick={() => handleAction(() => navigate('/institutional'))} className="user-menu-item admin-highlight">
          <Shield size={20} color="#10b981" />
          <span>Panel Institucional</span>
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