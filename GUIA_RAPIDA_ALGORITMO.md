# 🎓 ALGORITMO DE DISTRIBUCIÓN UNIVERSITARIA - GUÍA RÁPIDA

## ✅ LO QUE SE HA IMPLEMENTADO

### 1. **Sistema de Scoring Inteligente**
- ✅ Prioridad Máxima (+50 pts): Misma facultad
- ✅ Prioridad Alta (+30 pts): Usuario que sigues
- ✅ Prioridad Media (+10 pts): Misma universidad, otra facultad
- ✅ Factor de Frescura: Decaimiento temporal (40 pts → 1 pt)
- ✅ Bonus por Engagement: Likes, comments, shares

### 2. **Agrupamiento Anti-Spam**
- ✅ Reposts del mismo post se agrupan
- ✅ Mensaje dinámico: "Juan y 3 más de tu facultad..."
- ✅ Avatars apilados (máx 3 visibles)
- ✅ Componente `RepostersHeader.tsx` creado

### 3. **Sistema de Trending (Viralidad)**
- ✅ Tabla `trending_posts` con períodos (day, week, month, year)
- ✅ Función `calculate_viral_score()` con diversidad de facultades
- ✅ Badge visual "🔥 Trending del día/semana/mes/año"
- ✅ Auto-actualización con triggers

### 4. **Integridad del Feed**
- ✅ Verificación de posts eliminados
- ✅ Reposts de posts borrados: NO se muestran
- ✅ Quotes de posts borrados: Placeholder elegante

## 📁 ARCHIVOS CREADOS

1. **`algoritmo_distribucion_universitaria.sql`** - SQL completo del algoritmo
2. **`ALGORITMO_DISTRIBUCION_DOCS.md`** - Documentación técnica
3. **`src/components/posts/RepostersHeader.tsx`** - Componente de agrupamiento
4. **`src/services/api.ts`** - Funciones `getSmartFeed()`, `getTrendingPosts()`

## 🚀 INSTRUCCIONES DE DESPLIEGUE

### Paso 1: Ejecutar SQL (OBLIGATORIO)

```bash
# En Supabase SQL Editor, ejecutar EN ORDEN:

1. init_sharing_complete.sql (si no lo ejecutaste antes)
2. algoritmo_distribucion_universitaria.sql (NUEVO)
```

### Paso 2: Actualizar FeedContext

**Archivo**: `src/context/FeedContext.tsx`

```typescript
// ANTES:
const { data, error } = await api.getPosts();

// DESPUÉS:
const { data, error } = await api.getSmartFeed();
```

### Paso 3: Verificar Compilación

```bash
npm start
```

## 🎯 CÓMO FUNCIONA

### Ejemplo Real

```
Usuario: Juan (Facultad de Ingeniería)
Hora actual: 10:00 AM

FEED ORDENADO POR SCORE:

1. [TRENDING 🔥] Post de María (Medicina, 9:00 AM)
   - Compartido por Pedro (Ingeniería) y 5 más de tu facultad
   - Score: 50 (facultad) + 40 (frescura) + 25 (5 reposts × 5) + trending_bonus
   - Total: ~115 pts

2. Post de Ana (Ingeniería, 8:00 AM)
   - Score: 50 (facultad) + 30 (frescura) + 10 (engagement)
   - Total: 90 pts

3. Post de Luis (Derecho, ayer)
   - Score: 10 (otra facultad) + 10 (frescura) + 5 (engagement)
   - Total: 25 pts
```

### Agrupamiento Visual

```
┌─────────────────────────────────────────────────────┐
│ 🔁 [👤][👤][👤] Juan y 5 personas más de tu        │
│                  facultad compartieron esto    🔥   │
├─────────────────────────────────────────────────────┤
│ [Post Original de María]                            │
│ "Nuevo laboratorio de Medicina inaugurado..."      │
└─────────────────────────────────────────────────────┘
```

## 📊 VERIFICACIÓN

### 1. Verificar que el SQL se ejecutó

```sql
-- En Supabase SQL Editor:

-- Verificar función smart feed
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'get_smart_feed';

-- Verificar tabla trending
SELECT * FROM trending_posts LIMIT 5;

-- Probar el feed
SELECT * FROM get_smart_feed() LIMIT 5;
```

### 2. Verificar en el Frontend

1. **Hacer un repost** de un post
2. **Otro usuario de tu facultad** hace repost del mismo post
3. **Recargar el feed** → Deberías ver:
   - Un solo card (no duplicado)
   - Header con avatars apilados
   - Mensaje "Usuario y 1 persona más de tu facultad..."

### 3. Verificar Trending

```sql
-- Crear actividad en un post
-- (likes, shares, comments de diferentes facultades)

-- Actualizar trending
SELECT update_trending_posts();

-- Ver trending del día
SELECT * FROM get_trending_posts('day');
```

## ⚙️ CONFIGURACIÓN OPCIONAL

### Actualizar Trending Automáticamente

**Opción 1: Job Programado (Recomendado)**

En Supabase Dashboard → Database → Cron Jobs:

```sql
-- Ejecutar cada hora
SELECT cron.schedule(
    'update-trending-hourly',
    '0 * * * *',  -- Cada hora
    $$SELECT update_trending_posts()$$
);
```

**Opción 2: Desde el Frontend**

```typescript
// En App.tsx o similar
useEffect(() => {
    const interval = setInterval(async () => {
        await api.updateTrendingPosts();
    }, 3600000); // 1 hora

    return () => clearInterval(interval);
}, []);
```

### Desactivar Triggers (Si usas Job Programado)

```sql
-- Los triggers actualizan trending en cada interacción
-- Esto puede ser pesado. Si usas job programado:

DROP TRIGGER IF EXISTS trigger_likes_trending ON public.likes;
DROP TRIGGER IF EXISTS trigger_shares_trending ON public.shares;
DROP TRIGGER IF EXISTS trigger_comments_trending ON public.comments;
```

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: "Function get_smart_feed does not exist"

**Solución**: Ejecuta `algoritmo_distribucion_universitaria.sql` completo

### Problema: Reposts no se agrupan

**Solución**: 
1. Verifica que usas `getSmartFeed()` en lugar de `getPosts()`
2. Verifica que el componente `RepostersHeader` está importado

### Problema: Trending no se actualiza

**Solución**:
```sql
-- Ejecutar manualmente:
SELECT update_trending_posts();

-- Verificar:
SELECT * FROM trending_posts;
```

### Problema: Scores parecen incorrectos

**Solución**:
```sql
-- Ver scores calculados:
SELECT 
    id,
    content,
    relevance_score,
    is_trending
FROM get_smart_feed()
LIMIT 10;
```

## 📈 MÉTRICAS CLAVE

### Diversidad de Facultades

```sql
-- Ver cuántas facultades interactúan con cada post
SELECT 
    p.id,
    p.content,
    count(DISTINCT pr.faculty) as faculty_diversity,
    calculate_viral_score(p.id) as viral_score
FROM posts p
LEFT JOIN likes l ON p.id = l.post_id
LEFT JOIN profiles pr ON l.user_id = pr.id
GROUP BY p.id
ORDER BY faculty_diversity DESC
LIMIT 10;
```

### Posts Más Compartidos

```sql
SELECT 
    p.id,
    p.content,
    count(s.id) as share_count,
    array_agg(DISTINCT pr.faculty) as faculties
FROM posts p
JOIN shares s ON p.id = s.post_id
JOIN profiles pr ON s.user_id = pr.id
GROUP BY p.id
ORDER BY share_count DESC
LIMIT 10;
```

## 🎨 PERSONALIZACIÓN

### Ajustar Pesos del Scoring

En `algoritmo_distribucion_universitaria.sql`, líneas 180-210:

```sql
-- Cambiar estos valores según tus necesidades:
CASE WHEN pr.faculty = my_faculty THEN 50.0 ELSE 0.0 END  -- Misma facultad
CASE WHEN EXISTS(...) THEN 30.0 ELSE 0.0 END              -- Usuario seguido
CASE WHEN ... THEN 10.0 ELSE 0.0 END                      -- Otra facultad
```

### Cambiar Límite de Posts

```sql
-- Línea final de get_smart_feed():
LIMIT 100;  -- Cambiar a 50, 200, etc.
```

### Ajustar Decaimiento Temporal

```sql
-- Líneas 195-201:
WHEN p.created_at > now() - INTERVAL '4 hours' THEN 40.0   -- Cambiar intervalos
WHEN p.created_at > now() - INTERVAL '12 hours' THEN 30.0
-- etc.
```

## ✅ CHECKLIST FINAL

- [ ] Ejecutado `algoritmo_distribucion_universitaria.sql`
- [ ] Actualizado `FeedContext.tsx` para usar `getSmartFeed()`
- [ ] Compilación sin errores (`npm start`)
- [ ] Reposts se agrupan correctamente
- [ ] Badge de trending aparece
- [ ] Posts de misma facultad aparecen primero
- [ ] Posts eliminados no rompen el feed

---

**¿Listo para probar?** Ejecuta el SQL y recarga tu aplicación!

**Documentación completa**: Ver `ALGORITMO_DISTRIBUCION_DOCS.md`
