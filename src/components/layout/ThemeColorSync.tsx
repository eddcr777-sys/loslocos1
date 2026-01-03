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
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
      const body = document.body;
      const html = document.documentElement;
      const isDark = body.classList.contains('dark');

      // Colores hardcodeados para asegurar compatibilidad total en móviles
      const bgColor = isDark ? '#0b0f1a' : '#ffffff';
      
      // Sincronizar clase dark y estilos en html/body para que el navegador sepa el tema global
      // Esto ayuda a que la barra de navegación del sistema (Android) siga el tema
      if (isDark) {
        html.classList.add('dark');
        html.style.backgroundColor = bgColor;
        html.style.colorScheme = 'dark';
        body.style.backgroundColor = bgColor;
        body.style.colorScheme = 'dark';
      } else {
        html.classList.remove('dark');
        html.style.backgroundColor = bgColor;
        html.style.colorScheme = 'light';
        body.style.backgroundColor = bgColor;
        body.style.colorScheme = 'light';
      }

      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', bgColor);
      }

      if (colorSchemeMeta) {
        colorSchemeMeta.setAttribute('content', isDark ? 'dark' : 'light');
      }

      // Sync specific iOS status bar
      const appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (appleStatusMeta) {
        appleStatusMeta.setAttribute('content', isDark ? 'black-translucent' : 'default');
      }
    };

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
