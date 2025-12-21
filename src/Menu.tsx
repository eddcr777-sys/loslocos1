import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Settings, LogOut } from 'lucide-react';
import './Menu.css';

const Menu = () => {
  const { logout, user } = useAuth();
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