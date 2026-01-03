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
      // const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]'); // No longer needed as we remove and recreate
      // const colorSchemeMeta = document.getElementById('color-scheme-meta'); // Will be handled dynamically
      // const appleStatusMeta = document.getElementById('apple-status-meta'); // Will be handled dynamically
      const html = document.documentElement;
      const body = document.body;
      const isDark = body.classList.contains('dark');
      const bgColor = isDark ? '#0b0f1a' : '#ffffff';
      const colorScheme = isDark ? 'dark' : 'light';
      
      // 1. Sync Styles directly on both root elements
      html.style.backgroundColor = bgColor;
      html.style.colorScheme = colorScheme;
      body.style.backgroundColor = bgColor;
      body.style.colorScheme = colorScheme;

      // 2. Force Refresh Meta Tags (Android/iOS chrome often requires tag replacement)
      
      // Remove all existing theme-color tags
      document.querySelectorAll('meta[name="theme-color"]').forEach(el => el.remove());
      
      // Create fresh ones
      const themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      themeMeta.content = bgColor;
      document.head.appendChild(themeMeta);

      // Support color-scheme meta
      let colorSchemeMeta = document.getElementById('color-scheme-meta');
      if (!colorSchemeMeta) {
        colorSchemeMeta = document.createElement('meta');
        colorSchemeMeta.id = 'color-scheme-meta';
        colorSchemeMeta.setAttribute('name', 'color-scheme');
        document.head.appendChild(colorSchemeMeta);
      }
      colorSchemeMeta.setAttribute('content', colorScheme);

      // iOS Status bar specific logic
      document.querySelectorAll('meta[name="apple-mobile-web-app-status-bar-style"]').forEach(el => el.remove());
      const appleMeta = document.createElement('meta');
      appleMeta.name = 'apple-mobile-web-app-status-bar-style';
      // 'black-translucent' allows background-color to bleed into the status bar area
      appleMeta.content = isDark ? 'black-translucent' : 'default';
      document.head.appendChild(appleMeta);
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
