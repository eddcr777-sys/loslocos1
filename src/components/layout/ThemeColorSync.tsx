import { useEffect } from 'react';

/**
 * ThemeColorSync
 * 
 * Este componente se encarga de sincronizar el color de la barra de estado 
 * del teléfono (meta theme-color) con el tema actual de la app.
 */
const ThemeColorSync = () => {
  useEffect(() => {
    // Función para actualizar el color basado en las variables CSS
    const updateThemeColor = () => {
      const body = document.body;
      const isDark = body.classList.contains('dark');
      const bgColor = isDark ? '#0b0f1a' : '#ffffff';
      const colorScheme = isDark ? 'dark' : 'light';
      
      // 1. Sync Root Styles
      document.documentElement.style.backgroundColor = bgColor;
      document.documentElement.style.colorScheme = colorScheme;
      body.style.backgroundColor = bgColor;
      body.style.colorScheme = colorScheme;

      // 2. Refresh Meta Tags
      const refreshMeta = () => {
        const computedStyle = getComputedStyle(document.body);
        const bgColor = computedStyle.getPropertyValue('--bg-color').trim() || (isDark ? '#0b0f1a' : '#ffffff');
        
        // Exact update of existing meta tags
        const lightMeta = document.getElementById('theme-color-light');
        const darkMeta = document.getElementById('theme-color-dark');
        
        if (lightMeta) lightMeta.setAttribute('content', bgColor);
        if (darkMeta) darkMeta.setAttribute('content', bgColor);
        
        const appleMeta = document.getElementById('apple-status-meta');
        if (appleMeta) appleMeta.setAttribute('content', isDark ? 'black-translucent' : 'default');

        // Force a re-discovery by the browser (crucial for some Android versions)
        if (darkMeta) {
          const parent = darkMeta.parentNode;
          if (parent) {
            parent.removeChild(darkMeta);
            parent.appendChild(darkMeta);
          }
        }

        // Update body and html backgrounds again to be sure
        document.documentElement.style.backgroundColor = bgColor;
        document.body.style.backgroundColor = bgColor;
      };

      refreshMeta();
      // Second pass after 200ms for PWA transition completion
      setTimeout(refreshMeta, 200);
    };

    // Listen for system theme changes if set to system
    const systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => updateThemeColor(); // Changed syncTheme to updateThemeColor
    systemMediaQuery.addEventListener('change', handleSystemChange);

    // Al montar y en cada cambio del DOM (por si cambia la clase dark/light)
    updateThemeColor();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' || mutation.attributeName === 'style') {
          updateThemeColor();
        }
      });
    });

    // Observamos el body porque es donde se aplica la clase 'dark'
    observer.observe(document.body, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return null; // No renderiza nada
};

export default ThemeColorSync;
