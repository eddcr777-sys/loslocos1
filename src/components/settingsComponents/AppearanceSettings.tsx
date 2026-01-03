import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor, Palette, Sparkles } from 'lucide-react';
import SettingsCard from './ui/SettingsCard';
import SettingsToggle from './ui/SettingsToggle';
import '../../components/settingsComponents/SettingsPage.css';
import { useAuth } from '../../context/AuthContext';

const AppearanceSettings = () => {
  const { user } = useAuth(); // Need to import useAuth
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [highContrast, setHighContrast] = useState(false);

  // Sync with DB on load
  useEffect(() => {
    if (user?.id) {
        import('../../services/api').then(({ api }) => {
            api.getSettings(user.id).then(({ data }) => {
                if (data) {
                    if (data.theme) setTheme(data.theme);
                    if (data.high_contrast !== undefined) setHighContrast(data.high_contrast);
                }
            });
        });
    }
  }, [user]);

  useEffect(() => {
    // Apply theme
    document.body.classList.remove('light', 'dark');
    
    // Sincronizar también con documentElement para la barra de navegación de móvil
    document.documentElement.classList.remove('light', 'dark');
    
    if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.add(isDark ? 'dark' : 'light');
        document.documentElement.classList.add(isDark ? 'dark' : 'light');
    } else {
        document.body.classList.add(theme);
        document.documentElement.classList.add(theme);
    }
    localStorage.setItem('theme', theme);

    // Apply High Contrast
    if (highContrast) document.body.classList.add('high-contrast');
    else document.body.classList.remove('high-contrast');

    // Save to DB
    if (user?.id) {
        // Debounce or just save
        import('../../services/api').then(({ api }) => {
            api.updateSettings(user.id, { theme, high_contrast: highContrast });
        });
    }

  }, [theme, highContrast, user]);

  return (
    <div className="settings-section animate-fade-in">
      <div className="settings-section-header">
        <h2>Apariencia</h2>
        <p>Personaliza el estilo visual de tu aplicación para que se adapte a tu gusto.</p>
      </div>

      <SettingsCard 
        title="Tema de la Aplicación" 
        description="Selecciona el modo visual que prefieras o deja que el sistema lo decida."
        icon={<Palette size={24} />}
      >
        <div className="theme-grid">
          <button 
            onClick={() => setTheme('light')}
            className={`theme-option-btn ${theme === 'light' ? 'active' : ''}`}
          >
            <div className="theme-icon-box">
                <Sun size={24} />
            </div>
            <span className="theme-name">Claro</span>
          </button>

          <button 
            onClick={() => setTheme('dark')}
            className={`theme-option-btn ${theme === 'dark' ? 'active' : ''}`}
          >
            <div className="theme-icon-box">
                <Moon size={24} />
            </div>
            <span className="theme-name">Oscuro</span>
          </button>

          <button 
            onClick={() => setTheme('system')}
            className={`theme-option-btn ${theme === 'system' ? 'active' : ''}`}
          >
            <div className="theme-icon-box">
                <Monitor size={24} />
            </div>
            <span className="theme-name">Sistema</span>
          </button>
        </div>
      </SettingsCard>

      <SettingsCard 
        title="Accesibilidad y Efectos" 
        description="Ajustes adicionales para mejorar tu experiencia."
        icon={<Sparkles size={24} />}
      >
        <SettingsToggle 
          title="Alto Contraste"
          description="Aumenta la distinción entre colores para facilitar la lectura."
          checked={highContrast}
          onChange={() => setHighContrast(!highContrast)}
        />
      </SettingsCard>
    </div>
  );
};

export default AppearanceSettings;
