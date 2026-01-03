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
      if (!themeColorMeta) return;

      // Obtenemos el color de fondo de la app (u otro color representativo del header)
      // Usamos el color de fondo del body o una variable CSS dedicada
      const style = getComputedStyle(document.documentElement);
      const bgColor = style.getPropertyValue('--bg-primary').trim() || '#ffffff';
      
      themeColorMeta.setAttribute('content', bgColor);
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

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return null; // No renderiza nada
};

export default ThemeColorSync;
