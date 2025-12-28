# 🎓 ALGORITMO AVANZADO DE DISTRIBUCIÓN UNIVERSITARIA

## 📊 SISTEMA DE SCORING INTELIGENTE

### 1. **Puntuación por Relevancia Académica**

El algoritmo calcula un score para cada publicación basado en múltiples factores:

#### **Prioridad Máxima (+50 puntos)**
```typescript
Condición: autor.faculty === usuario.faculty
Ejemplo: Juan (Ingeniería) ve post de María (Ingeniería) → +50 pts
```

#### **Prioridad Alta (+30 puntos)**
```typescript
Condición: usuario sigue al autor
Ejemplo: Juan sigue a Pedro → Posts de Pedro +30 pts
```

#### **Prioridad Media (+10 puntos)**
```typescript
Condición: misma universidad, diferente facultad
Ejemplo: Juan (Ingeniería) ve post de Ana (Medicina) → +10 pts
```

#### **Factor de Frescura (Decaimiento Temporal)**
```typescript
< 4 horas:   +40 puntos
< 12 horas:  +30 puntos
< 24 horas:  +20 puntos
< 2 días:    +10 puntos
< 7 días:    +5 puntos
> 7 días:    +1 punto
```

#### **Bonus por Engagement**
```typescript
Likes:     +0.5 puntos cada uno
Comments:  +1.0 punto cada uno
Shares:    +2.0 puntos cada uno
```

### 2. **Agrupamiento Anti-Spam**

Cuando múltiples personas comparten el mismo post:

```typescript
// Antes (Spam):
[Post Original] - Compartido por Juan
[Post Original] - Compartido por María  
[Post Original] - Compartido por Pedro

// Después (Agrupado):
[Post Original] - "A Juan y 2 personas más de tu facultad les interesó esto"
```

**Implementación**:
- Los reposts se agrupan por `post_id` en el RPC
- Se usa `jsonb_agg()` para consolidar los reposters
- El frontend muestra un solo card con header dinámico

### 3. **Sistema de Trending (Viralidad Cross-Facultad)**

#### **Tabla `trending_posts`**
```sql
post_id              | UUID
period               | 'day' | 'week' | 'month' | 'year'
score                | DECIMAL (calculado)
cross_faculty_count  | INTEGER (diversidad)
total_interactions   | INTEGER
```

#### **Fórmula de Viralidad**
```typescript
viral_score = 
    (likes × 1.0) + 
    (shares × 3.0) + 
    (comments × 2.0) + 
    (faculty_diversity × 10.0)
```

**Ejemplo**:
```
Post de Ingeniería:
- 50 likes de Ingeniería
- 30 likes de Medicina
- 20 likes de Derecho
→ faculty_diversity = 3
→ Bonus = 3 × 10 = +30 puntos
→ Post se vuelve trending y "rompe la burbuja"
```

### 4. **Integridad del Feed**

#### **Verificación de Posts Eliminados**

```typescript
// Repost de post eliminado:
if (original_post.deleted_at !== null) {
    // NO mostrar nada
    return null;
}

// Quote de post eliminado:
if (original_post.deleted_at !== null) {
    // Mostrar comentario del usuario + placeholder
    return <QuoteWithDeletedOriginal />;
}
```

## 🔧 FUNCIONES RPC IMPLEMENTADAS

### 1. `get_smart_feed()`
**Propósito**: Feed principal con algoritmo completo de scoring

**Retorna**:
- Posts normales
- Quotes
- Reposts agrupados
- Score de relevancia
- Flag de trending
- Datos de reposters (para agrupamiento)

**Orden**:
1. Trending primero
2. Por score de relevancia
3. Por fecha

### 2. `calculate_viral_score(post_id)`
**Propósito**: Calcular score de viralidad de un post

**Factores**:
- Total de likes
- Total de shares
- Total de comments
- Diversidad de facultades que interactuaron

### 3. `update_trending_posts()`
**Propósito**: Actualizar tabla de trending

**Ejecuta**:
- Calcula viral_score para posts recientes
- Actualiza trending_posts para cada período
- Limpia trending antiguos

### 4. `get_trending_posts(period)`
**Propósito**: Obtener posts trending de un período

**Parámetros**:
- `period`: 'day' | 'week' | 'month' | 'year'

**Retorna**: Top 20 posts por score

## 📱 INTEGRACIÓN FRONTEND

### Usar Smart Feed

```typescript
// En FeedContext.tsx o donde se cargue el feed
import { api } from '../services/api';

const loadFeed = async () => {
    const { data, error } = await api.getSmartFeed();
    
    if (!error && data) {
        setPosts(data);
    }
};
```

### Mostrar Agrupamiento de Reposts

```typescript
// En Post.tsx
const repostersData = (post as any)._reposters;

if (repostersData && repostersData.length > 1) {
    const fromMyFaculty = repostersData.filter(
        r => r.faculty === currentUser.faculty
    );
    
    const header = fromMyFaculty.length > 0
        ? `A ${fromMyFaculty[0].full_name} y ${fromMyFaculty.length - 1} personas más de tu facultad les interesó esto`
        : `A ${repostersData[0].full_name} y ${repostersData.length - 1} personas más les interesó esto`;
}
```

### Mostrar Badge de Trending

```typescript
// En Post.tsx
const isTrending = (post as any)._is_trending;
const trendingPeriod = (post as any)._trending_period;

{isTrending && (
    <div className="trending-badge">
        🔥 Trending {trendingPeriod === 'day' ? 'del día' : 
                     trendingPeriod === 'week' ? 'de la semana' :
                     trendingPeriod === 'month' ? 'del mes' : 'del año'}
    </div>
)}
```

## 🚀 INSTRUCCIONES DE DESPLIEGUE

### Paso 1: Ejecutar SQL
```bash
# En Supabase SQL Editor:
# 1. Ejecutar init_sharing_complete.sql (si no lo has hecho)
# 2. Ejecutar algoritmo_distribucion_universitaria.sql
```

### Paso 2: Actualizar FeedContext

```typescript
// src/context/FeedContext.tsx
const refreshFeed = async () => {
    setLoading(true);
    // Cambiar de getPosts() a getSmartFeed()
    const { data, error } = await api.getSmartFeed();
    if (!error && data) {
        setPosts(data);
    }
    setLoading(false);
};
```

### Paso 3: Actualizar Trending (Opcional)

Crear un job programado o ejecutar manualmente:

```typescript
// Actualizar trending cada hora
setInterval(async () => {
    await api.updateTrendingPosts();
}, 3600000); // 1 hora
```

## 📈 MÉTRICAS Y MONITOREO

### Verificar Scoring

```sql
-- Ver posts con sus scores
SELECT 
    p.id,
    p.content,
    pr.full_name,
    pr.faculty,
    (SELECT * FROM get_smart_feed() WHERE id = p.id LIMIT 1) as score_data
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
LIMIT 10;
```

### Verificar Trending

```sql
-- Ver trending del día
SELECT * FROM get_trending_posts('day');

-- Ver trending de la semana
SELECT * FROM get_trending_posts('week');
```

### Verificar Agrupamiento

```sql
-- Ver cuántos reposts tiene cada post
SELECT 
    post_id,
    count(*) as repost_count,
    array_agg(user_id) as reposters
FROM shares
GROUP BY post_id
HAVING count(*) > 1
ORDER BY repost_count DESC;
```

## 🎯 CASOS DE USO

### Caso 1: Usuario de Ingeniería

```
Juan (Ingeniería) abre el feed:

1. Post de María (Ingeniería, hace 2 horas) → Score: 50 + 30 = 80
2. Post de Pedro (Medicina, hace 1 hora, trending) → Score: 10 + 40 + trending_bonus = 50+
3. Post de Ana (Ingeniería, hace 3 días) → Score: 50 + 5 = 55
4. Post de Luis (Derecho, hace 1 día) → Score: 10 + 20 = 30

Orden final:
1. Pedro (trending)
2. María (score 80)
3. Ana (score 55)
4. Luis (score 30)
```

### Caso 2: Viralidad Cross-Facultad

```
Post original de Ingeniería:
- 10 likes de Ingeniería
- 15 likes de Medicina
- 8 likes de Derecho
- 12 shares totales

Viral Score = (33 × 1) + (12 × 3) + (3 facultades × 10) = 99 puntos
→ Se vuelve trending
→ Aparece en feeds de todas las facultades
```

### Caso 3: Agrupamiento

```
Post compartido por:
- Juan (Ingeniería) hace 2 horas
- María (Ingeniería) hace 1 hora
- Pedro (Medicina) hace 30 min

En feed de usuario de Ingeniería:
"A María y 2 personas más de tu facultad les interesó esto"

En feed de usuario de Medicina:
"A Pedro y 2 personas más les interesó esto"
```

## ⚠️ CONSIDERACIONES DE PERFORMANCE

### Optimizaciones Implementadas

1. **Índices**:
   ```sql
   CREATE INDEX idx_trending_period_score ON trending_posts(period, score DESC);
   ```

2. **Límites**:
   - Feed: 100 posts máximo
   - Trending: 20 posts por período

3. **Caché** (Recomendado):
   ```typescript
   // Cachear trending posts por 1 hora
   const cachedTrending = useMemo(() => {
       return getTrendingPosts('day');
   }, [hourlyRefresh]);
   ```

### Triggers vs Jobs Programados

**Actual**: Triggers en cada interacción (puede ser pesado)
**Recomendado**: Job programado cada hora

```sql
-- Desactivar triggers si usas jobs
DROP TRIGGER IF EXISTS trigger_likes_trending ON public.likes;
DROP TRIGGER IF EXISTS trigger_shares_trending ON public.shares;
DROP TRIGGER IF EXISTS trigger_comments_trending ON public.comments;

-- Ejecutar manualmente o con cron job
SELECT update_trending_posts();
```

## 🔐 SEGURIDAD

Todas las funciones RPC usan `SECURITY DEFINER` y verifican:
- `auth.uid()` para usuario actual
- RLS habilitado en todas las tablas
- Validación de permisos en cada query

---

**Versión**: 1.0.0
**Fecha**: 2025-12-28
**Arquitecto**: Senior Fullstack Expert
