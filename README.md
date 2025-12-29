# ConociendoGente - Red Social

Una plataforma de red social moderna y completa construida con **React**, **TypeScript** y **Supabase**. Este proyecto permite a los usuarios conectar, compartir contenido multimedia, interactuar en tiempo real y gestionar perfiles con un sistema avanzado de roles.

## 🚀 Características Principales

*   **Autenticación y Perfiles**:
    *   Registro e inicio de sesión seguro.
    *   Perfiles de usuario con roles jerárquicos: *Común, Popular, Admin, CEO, Institucional*.
    *   Restricciones de actualización de perfil (ej. cambio de nombre cada 30 días).
*   **Feed Inteligente ("Smart Feed")**:
    *   Algoritmo que prioriza contenido relevante y tendencias.
    *   Soporte para **Reposts** y **Citas** de publicaciones.
*   **Interacciones Sociales**:
    *   Publicaciones con texto e imágenes.
    *   Sistema de "Me gusta" y comentarios anidados (respuestas).
    *   Seguir/Dejar de seguir usuarios.
*   **Historias (Stories)**: Publicación de contenido efímero con expiración automática.
*   **Notificaciones**: Sistema de alertas en tiempo real para interacciones, menciones y nuevos seguidores.
*   **Panel de Administración**:
    *   Dashboard para el CEO/Admin con estadísticas de crecimiento.
    *   Logs de acciones administrativas.
    *   Programación de publicaciones (Scheduled Posts).
*   **Búsqueda**: Buscador de usuarios integrado.

## 🛠️ Tecnologías Utilizadas

*   **Frontend**: React.js, TypeScript.
*   **Estilos**: CSS Modules, Lucide React (Iconografía).
*   **Backend (BaaS)**: Supabase (PostgreSQL, Auth, Storage, Edge Functions).
*   **Gestión de Estado**: React Context API y Hooks personalizados.

## ⚙️ Configuración del Entorno

Para que la aplicación funcione correctamente, debes crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
REACT_APP_SUPABASE_URL=tu_url_de_supabase
REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

Asegúrate de configurar las políticas de **Row Level Security (RLS)** en tu base de datos Supabase para proteger los datos de forma adecuada.
