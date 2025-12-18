import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import { timeAgo } from '../../utils/dateUtils';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    const { data } = await api.getNotifications(user.id);
    if (data) setNotifications(data);
    setLoading(false);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando notificaciones...</div>;

  return (
    <div style={{ padding: '1rem', width: '100%', maxWidth: '600px', margin: '0 auto', boxSizing: 'border-box' }}>
      <h1>Notificaciones</h1>
      
      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem' }}>
          <p>No tienes notificaciones nuevas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((notif) => (
            <Card key={notif.id} style={{ marginBottom: 0, padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Avatar src={notif.actor?.avatar_url} size="small" />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>
                    <strong>{notif.actor?.full_name || 'Alguien'}</strong>
                    {notif.type === 'like' && ' le gustó tu publicación.'}
                    {notif.type === 'comment' && ' comentó en tu publicación.'}
                    {notif.type === 'follow' && ' comenzó a seguirte.'}
                  </p>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{timeAgo(notif.created_at)}</span>
                </div>
                {!notif.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
