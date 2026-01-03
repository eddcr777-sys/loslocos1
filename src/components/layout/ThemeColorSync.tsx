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
      
      // 1. Sync Styles
      document.documentElement.style.backgroundColor = bgColor;
      document.documentElement.style.colorScheme = colorScheme;
      body.style.backgroundColor = bgColor;
      body.style.colorScheme = colorScheme;

      // 2. Refresh Meta Tags
      const refreshMeta = () => {
        // theme-color
        document.querySelectorAll('meta[name="theme-color"]').forEach(el => el.remove());
        const themeMeta = document.createElement('meta');
        themeMeta.name = 'theme-color';
        themeMeta.content = bgColor;
        document.head.appendChild(themeMeta);

        // apple-mobile-web-app-status-bar-style
        document.querySelectorAll('meta[name="apple-mobile-web-app-status-bar-style"]').forEach(el => el.remove());
        const appleMeta = document.createElement('meta');
        appleMeta.name = 'apple-mobile-web-app-status-bar-style';
        appleMeta.content = isDark ? 'black-translucent' : 'default';
        document.head.appendChild(appleMeta);
      };

      refreshMeta();
      // Second pass after 100ms for PWA shell update
      setTimeout(refreshMeta, 100);
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
