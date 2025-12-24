import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Check, CheckCheck, Heart, Megaphone, MessageCircle, Reply, UserPlus } from 'lucide-react';
import { timeAgo } from '../../utils/dateUtils';

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
      console.log('Diagnostic - Notifications result:', { data, error });
      
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Notificaciones</h1>
        {notifications.some((n) => !n.read) && (
          <Button variant="ghost" size="small" onClick={handleMarkAllAsRead}>
            <CheckCheck size={16} />
            Marcar todas leídas
          </Button>
        )}
      </div>


















      
      
      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem' }}>
          <p>No tienes notificaciones nuevas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((notif) => (
            <Card 
              key={notif.id} 
              style={{ 
                marginBottom: 0, 
                padding: '1rem', 
                cursor: (notif.type === 'like' || notif.type === 'comment' || notif.type === 'reply' || notif.type === 'official') ? 'pointer' : 'default',
                transition: 'background-color 0.2s',
                backgroundColor: !notif.read ? '#f8fafc' : 'white'
              }}
              onClick={() => {
                if (notif.type === 'like' || notif.type === 'comment' || notif.type === 'reply' || notif.type === 'official') {
                  if (!notif.read) handleMarkAsRead(notif.id);
                  if (notif.entity_id) {
                    navigate(`/post/${notif.entity_id}`);
                  }
                }
              }}
              className="notification-card"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <Avatar src={notif.type === 'official' ? '/logo-inst.png' : notif.actor?.avatar_url} size="small" />
                  <div style={{ 
                    position: 'absolute', 
                    bottom: -4, 
                    right: -4, 
                    backgroundColor: 'white', 
                    borderRadius: '50%', 
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    {notif.type === 'like' && <Heart size={12} fill="#ef4444" color="#ef4444" />}
                    {notif.type === 'comment' && <MessageCircle size={12} fill="#3b82f6" color="#3b82f6" />}
                    {notif.type === 'reply' && <Reply size={12} color="#10b981" />}
                    {notif.type === 'follow' && <UserPlus size={12} color="#8b5cf6" />}
                    {notif.type === 'official' && <Megaphone size={12} color="#10b981" />}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>
                    <strong style={{ color: '#1e293b' }}>
                      {notif.type === 'official' ? (notif.title || 'Aviso Oficial') : (notif.actor?.full_name || 'Alguien')}
                    </strong>
                    <span style={{ color: '#475569' }}>
                      {notif.type === 'like' && ' le gustó tu publicación.'}
                      {notif.type === 'comment' && ' comentó en tu publicación.'}
                      {notif.type === 'reply' && ' respondió a tu comentario.'}
                      {notif.type === 'follow' && ' comenzó a seguirte.'}
                      {notif.type === 'official' && `: ${notif.content}`}
                    </span>
                  </p>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{timeAgo(notif.created_at)}</span>
                </div>
                {!notif.read && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => handleMarkAsRead(notif.id)}
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
