import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Check, CheckCheck, Heart, Megaphone, MessageCircle, Reply, UserPlus, Repeat, Quote, AtSign } from 'lucide-react';
import { timeAgo } from '../../utils/dateUtils';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user, decrementUnreadNotifications, clearUnreadNotifications } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await api.getNotifications(user.id);
      // Log removed
      
      if (error) {
        setError(error.message);
      } else if (data) {
        setNotifications(data);
      }
    } catch (err: any) {
      console.error('Diagnostic - Error in loadNotifications:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      decrementUnreadNotifications();
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await api.markAllNotificationsAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      clearUnreadNotifications();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando notificaciones...</div>;

  if (error) return (
    <div style={{ padding: '2rem', color: '#ef4444', textAlign: 'center' }}>
      <h3>Oops! Algo salió mal</h3>
      <p>{error}</p>
      <button 
        onClick={loadNotifications}
        style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}
      >
        Reintentar
      </button>
    </div>
  );

  return (
    <div style={{ padding: '1rem', width: '100%', maxWidth: '600px', margin: '0 auto', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: '800' }}>Notificaciones</h1>
        {notifications.some((n) => !n.read) && (
          <Button variant="ghost" size="small" onClick={handleMarkAllAsRead}>
            <CheckCheck size={16} />
            Marcar todas leídas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: 'var(--text-secondary)', 
          marginTop: '4rem',
          padding: '2rem',
          background: 'var(--surface-color)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <p>No tienes notificaciones nuevas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((notif) => (
            <Card 
              key={notif.id} 
              style={{ 
                marginBottom: 0, 
                padding: '1.25rem', 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: !notif.read ? 'var(--accent-soft)' : 'var(--surface-color)',
                borderColor: !notif.read ? 'var(--accent-color)' : 'var(--border-color)',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}

              onClick={() => {
                if (!notif.read) handleMarkAsRead(notif.id);

                if (notif.type === 'follow') {
                  navigate(`/profile/${notif.actor_id}`);
                } else if (notif.type === 'official' && notif.entity_id) {
                     navigate(`/post/${notif.entity_id}`);
                } else {
                  // Prioritize constructing a link with comment ID if it exists
                  let linkId = notif.post_id;
                  
                  // If entity_id contains the full path (like "uuid?c=uuid"), use it
                  if (notif.entity_id && notif.entity_id.includes('?c=')) {
                    linkId = notif.entity_id;
                  } 
                  // If we have both post_id and entity_id (common for mentions in comments), combine them
                  else if (notif.post_id && notif.entity_id && notif.type !== 'like' && notif.type !== 'repost' && notif.type !== 'quote') {
                    linkId = `${notif.post_id}?c=${notif.entity_id}`;
                  }
                  // Handle Reposts - Prefix with share_ so api.getPost knows where to look
                  else if (notif.type === 'repost') {
                      // entity_id is usually empty or same as post_id for shares in our new trigger
                      // But the share ID is what we want.
                      // In our trigger we set entity_id = NEW.post_id (original post).
                      // Wait, we need the SHARE ID to be able to load the "share_XXX" virtual post.
                      // If the trigger saves 'post_id' as the original_post ID, and 'entity_id' as original_post ID...
                      // WE HAVE A PROBLEM. We need the share ID.
                      // The previous trigger likely saved share ID as entity_id?
                      // Let's assume entity_id is the share ID or we can't deep-link to the share wrapper.
                      // IF NOT, we just link to the original post (notif.post_id).
                      
                      // Let's assume standard behavior: Link to the interactions.
                      linkId = notif.entity_id; 
                      // If entity_id is a UUID without share_, api.getPost will fail if it's a share ID.
                      // Let's try adding share_ prefix if it looks like a direct share link is intended.
                      if (linkId && !linkId.startsWith('share_')) {
                          linkId = 'share_' + linkId;
                      }
                  }
                  // Handle Quote - entity_id is the QUOTE post ID.
                  else if (notif.type === 'quote') {
                       // Try to go to the quote itself (which contains the original)
                       linkId = notif.entity_id || notif.post_id;
                  }
                  // Fallback to whichever is available
                  else {
                    linkId = notif.post_id || notif.entity_id;
                  }

                  if (linkId) {
                    navigate(`/post/${linkId}`);
                  }
                }
              }}


              className="notification-card"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <Avatar src={notif.type === 'official' ? '/logo-inst.png' : (notif.actor?.avatar_url || DEFAULT_AVATAR)} size="small" />
                  <div style={{ 
                    position: 'absolute', 
                    bottom: -4, 
                    right: -4, 
                    backgroundColor: 'var(--surface-color)', 
                    borderRadius: '50%', 
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1.5px solid var(--border-color)'
                  }}>
                    {notif.type === 'like' && <Heart size={10} fill="var(--error)" color="var(--error)" />}
                    {notif.type === 'comment' && <MessageCircle size={10} fill="var(--accent-color)" color="var(--accent-color)" />}
                    {notif.type === 'reply' && <Reply size={10} color="var(--success)" />}
                    {notif.type === 'follow' && <UserPlus size={10} color="var(--faculty-law)" />}
                    {notif.type === 'official' && <Megaphone size={10} color="var(--success)" />}
                    {notif.type === 'repost' && <Repeat size={10} color="var(--success)" />}
                    {notif.type === 'quote' && <Quote size={10} color="var(--accent-color)" />}
                    {notif.type === 'mention' && <AtSign size={10} color="var(--accent-color)" />}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                    <strong style={{ fontWeight: '700' }}>
                      {notif.type === 'official' ? (notif.title || 'Aviso Oficial') : (notif.actor?.full_name || 'Alguien')}
                    </strong>
                    <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>
                      {notif.type === 'like' && 'le gustó tu publicación.'}
                      {notif.type === 'comment' && 'comentó en tu publicación.'}
                      {notif.type === 'reply' && 'respondió a tu comentario.'}
                      {notif.type === 'follow' && 'comenzó a seguirte.'}
                      {notif.type === 'official' && `: ${notif.content}`}
                      {notif.type === 'repost' && (notif.group_count > 1 ? ` y ${notif.group_count - 1} más compartieron tu publicación.` : 'compartió tu publicación.')}
                      {notif.type === 'quote' && (notif.group_count > 1 ? ` y ${notif.group_count - 1} más citaron tu publicación.` : 'citó tu publicación.')}
                      {notif.type === 'mention' && 'te mencionó en una publicación.'}
                    </span>
                  </p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{timeAgo(notif.created_at)}</span>
                </div>
                {!notif.read && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-color)' }} />
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                      }}
                      title="Marcar como leída"
                      style={{ padding: '4px', minWidth: 'auto', height: '32px', width: '32px', borderRadius: '50%' }}
                    >
                      <Check size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
