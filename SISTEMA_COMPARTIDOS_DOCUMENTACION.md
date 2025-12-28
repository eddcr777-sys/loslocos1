# SISTEMA DUAL DE COMPARTIDOS - DOCUMENTACIÓN COMPLETA

## 📋 RESUMEN EJECUTIVO

Se ha implementado un sistema completo de compartidos dual (Repost + Quote) para la red social universitaria, siguiendo las especificaciones del Prompt Maestro.

## 🗄️ ARQUITECTURA DE BASE DE DATOS

### Tablas Principales

1. **`shares`** - Para Reposts rápidos
   - `id`: UUID (PK)
   - `user_id`: UUID (FK → profiles)
   - `post_id`: UUID (FK → posts)
   - `created_at`: TIMESTAMPTZ
   - **UNIQUE(user_id, post_id)** - Evita duplicados

2. **`posts`** - Extendida para Quotes
   - `original_post_id`: UUID (FK → posts) - NULL para posts normales
   - `is_quote`: BOOLEAN - TRUE si es un quote
   - `deleted_at`: TIMESTAMPTZ - Para soft delete

3. **`notifications`** - Sistema inteligente
   - `group_count`: INTEGER - Para agrupamiento "Juan y 3 más..."
   - `post_id`: UUID - Deep linking
   - `entity_id`: UUID - Para quotes (ID del nuevo post)
   - `type`: TEXT - 'repost', 'quote', 'like', etc.

### Políticas RLS (Row Level Security)

✅ **shares**: Solo el dueño puede insertar/eliminar
✅ **notifications**: Solo el dueño puede ver/actualizar sus notificaciones
✅ Todas las tablas tienen RLS habilitado

## 🔧 FUNCIONES RPC (PostgreSQL)

### 1. `toggle_repost(post_id_param UUID)`
**Propósito**: Implementa la lógica TikTok/IG de toggle
**Retorna**: BOOLEAN (TRUE = agregado, FALSE = removido)
**Lógica**:
```sql
- Si existe el repost → Eliminar (deshacer)
- Si no existe → Crear
```

### 2. `soft_delete_post(post_id_param UUID)`
**Propósito**: Marca posts como eliminados sin borrarlos
**Retorna**: BOOLEAN (éxito/fallo)
**Efecto**: Los quotes muestran "Contenido no disponible"

### 3. `get_priority_feed()`
**Propósito**: Feed con prioridad por facultad
**Retorna**: Posts ordenados (misma facultad primero)
**Características**:
- Incluye datos del autor (JSONB)
- Incluye datos del post original para quotes
- Filtra posts soft-deleted
- Límite de 50 posts

### 4. `get_profile_shares(user_id_param UUID)`
**Propósito**: Obtener todos los compartidos de un usuario
**Retorna**: UNION de Reposts + Quotes
**Orden**: Cronológico descendente

## ⚡ TRIGGERS INTELIGENTES

### 1. `handle_repost_notification()`
**Dispara**: AFTER INSERT ON shares
**Lógica de Agrupamiento (Smart Batching)**:
```
1. Buscar notificación no leída existente del mismo post
2. Si existe:
   - Incrementar group_count
   - Actualizar actor_id (último que compartió)
   - Actualizar created_at
3. Si no existe:
   - Crear nueva notificación
```
**Regla de Silencio**: No notifica si es auto-repost

### 2. `handle_quote_notification()`
**Dispara**: AFTER INSERT ON posts
**Lógica**:
```
1. Verificar que sea un quote (tiene original_post_id y content)
2. Crear notificación individual (no agrupa)
3. Aplicar regla de silencio
```

## 🎨 COMPONENTES REACT

### 1. `ShareModal.tsx`
**Ubicación**: `src/components/posts/ShareModal.tsx`
**Propósito**: Modal premium para elegir entre Repost o Quote

**Características**:
- Diseño moderno con animaciones suaves
- Dos opciones claramente diferenciadas:
  - **Repost**: Compartir rápidamente (icono Repeat, color verde)
  - **Quote**: Añadir comentario (icono Quote, color accent)
- Overlay con blur
- Responsive y accesible

**Props**:
```typescript
interface ShareModalProps {
    postId: string;
    isOpen: boolean;
    onClose: () => void;
}
```

### 2. `EmbeddedPost.tsx`
**Ubicación**: `src/components/posts/EmbeddedPost.tsx`
**Propósito**: Mostrar posts embebidos en quotes

**Características**:
- Manejo elegante de posts eliminados
- Placeholder con icono AlertCircle
- Mensaje: "Contenido no disponible - Esta publicación fue eliminada"
- Hover effects
- Click para navegar al post original

**Props**:
```typescript
interface EmbeddedPostProps {
    post: PostType | null;
    isDeleted?: boolean;
}
```

### 3. `Post.tsx` (Actualizado)
**Mejoras Implementadas**:
- Integración con `ShareModal`
- Uso de `EmbeddedPost` para quotes
- Lógica de detección:
  ```typescript
  const isRepost = !!post.original_post && !post.content;
  const isQuote = !!post.original_post && !!post.content;
  ```
- Header de repost: "Juan compartió esto"
- Soporte para agrupamiento: "Juan y 3 más compartieron esto"

## 📊 FLUJOS DE USUARIO

### Flujo 1: Repost (Acción Rápida)
```
1. Usuario hace clic en botón "Compartir"
2. Se abre ShareModal
3. Usuario selecciona "Repost"
4. Sistema ejecuta toggle_repost()
5. Si es nuevo:
   - Se crea registro en tabla shares
   - Trigger crea/actualiza notificación
   - Mensaje: "¡Publicación compartida con éxito!"
6. Si ya existía:
   - Se elimina registro
   - Mensaje: "Has quitado esta publicación de tus compartidos"
```

### Flujo 2: Quote (Con Comentario)
```
1. Usuario hace clic en botón "Compartir"
2. Se abre ShareModal
3. Usuario selecciona "Citar"
4. Navega a /crear-post?quote=POST_ID
5. Usuario escribe su comentario
6. Se crea nuevo post con:
   - original_post_id = POST_ID
   - is_quote = true
   - content = comentario del usuario
7. Trigger crea notificación individual
```

### Flujo 3: Borrado de Post Original
```
1. Autor ejecuta soft_delete_post()
2. Se marca deleted_at = now()
3. Efectos:
   - Reposts: Se eliminan en cascada (ON DELETE CASCADE)
   - Quotes: Permanecen, pero EmbeddedPost muestra placeholder
```

## 🎯 REGLAS DE NEGOCIO IMPLEMENTADAS

✅ **Evitar Duplicados**: UNIQUE constraint en shares(user_id, post_id)
✅ **Toggle Logic**: toggle_repost() maneja crear/eliminar
✅ **Agrupamiento**: Trigger agrupa notificaciones de repost
✅ **Regla de Silencio**: No notifica auto-compartidos
✅ **Soft Delete**: Posts marcados, no eliminados físicamente
✅ **Cascada**: Reposts se eliminan, quotes persisten
✅ **Segmentación**: get_priority_feed() prioriza por facultad
✅ **RLS**: Nadie puede borrar compartidos ajenos

## 📁 ARCHIVOS CREADOS/MODIFICADOS

### Nuevos Archivos
1. `init_sharing_complete.sql` - Script SQL completo
2. `src/components/posts/ShareModal.tsx` - Modal de compartir
3. `src/components/posts/EmbeddedPost.tsx` - Post embebido

### Archivos Modificados
1. `src/components/posts/Post.tsx` - Integración del sistema
2. `src/services/api.ts` - Funciones RPC
3. `src/pages/ProfilePage/ProfilePage.tsx` - Pestaña compartidos
4. `src/pages/NotificationsPage/NotificationsPage.tsx` - Notificaciones

## 🚀 INSTRUCCIONES DE DESPLIEGUE

### Paso 1: Ejecutar SQL
```bash
# En Supabase SQL Editor, ejecutar:
init_sharing_complete.sql
```

### Paso 2: Verificar Tablas
```sql
-- Verificar que existan:
SELECT * FROM shares LIMIT 1;
SELECT * FROM notifications WHERE type IN ('repost', 'quote') LIMIT 1;
```

### Paso 3: Probar Funciones
```sql
-- Probar toggle_repost
SELECT toggle_repost('POST_ID_AQUI');

-- Probar feed prioritario
SELECT * FROM get_priority_feed();
```

### Paso 4: Compilar Frontend
```bash
npm start
```

## 🔍 TESTING CHECKLIST

- [ ] Crear un repost → Verificar que aparece en "Compartidos"
- [ ] Hacer repost del mismo post → Verificar que se elimina
- [ ] Crear un quote con comentario → Verificar que aparece en feed
- [ ] Borrar post original → Verificar placeholder en quotes
- [ ] Recibir 3 reposts → Verificar agrupamiento "Juan y 2 más..."
- [ ] Verificar prioridad de facultad en feed
- [ ] Intentar borrar compartido ajeno → Verificar que falla (RLS)

## 📈 MÉTRICAS DE ÉXITO

- **Seguridad**: RLS en todas las tablas críticas
- **Performance**: Índices en user_id, post_id, created_at
- **UX**: Feedback inmediato en todas las acciones
- **Integridad**: Cero posts rotos por borrados
- **Escalabilidad**: Agrupamiento reduce spam de notificaciones

## 🎨 DISEÑO VISUAL

### ShareModal
- **Colores**:
  - Repost: Verde (--success)
  - Quote: Accent (--accent-color)
- **Animaciones**: Hover effects, transform translateY
- **Accesibilidad**: Botones grandes (48px), texto claro

### EmbeddedPost
- **Estados**:
  - Normal: Border sólido, hover effect
  - Eliminado: Border dashed, icono AlertCircle, opacity 0.7
- **Responsive**: Se adapta al contenedor padre

## 🔐 SEGURIDAD

### Políticas RLS Implementadas
```sql
-- SHARES
- shares_select_all: Todos pueden ver
- shares_insert_own: Solo insertar propios
- shares_delete_own: Solo eliminar propios

-- NOTIFICATIONS
- notifications_select_own: Solo ver propias
- notifications_update_own: Solo actualizar propias
```

### Validaciones en RPC
```sql
-- toggle_repost: Verifica auth.uid()
-- soft_delete_post: WHERE user_id = auth.uid()
```

## 📞 SOPORTE

Para cualquier problema:
1. Verificar que el SQL se ejecutó correctamente
2. Revisar logs de Supabase
3. Verificar que las políticas RLS están activas
4. Comprobar que el usuario está autenticado

---

**Versión**: 1.0.0
**Fecha**: 2025-12-28
**Arquitecto**: Senior Fullstack Expert
