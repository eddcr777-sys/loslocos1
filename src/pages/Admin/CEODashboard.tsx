import React, { useState, useEffect } from 'react';
import { DEFAULT_AVATAR_URL } from '../../utils/constants';
import { 
    Users, 
    MessageSquare, 
    Zap, 
    Shield, 
    Activity, 
    Trash2, 
    RefreshCw, 
    Bell, 
    Search,
    AlertTriangle,
    CheckCircle,
    LayoutDashboard,
    Eye
} from 'lucide-react';
import { api } from '../../services/api';
import './CEODashboard.css';
import AdminHeader from '../../components/admin/layout/AdminHeader';
import DashboardTabs from '../../components/admin/layout/DashboardTabs';
import StatCard from '../../components/admin/widgets/StatCard';
import Button from '../../components/ui/Button';

const CEODashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ users: 0, posts: 0, comments: 0 });
    const [statsError, setStatsError] = useState<string | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [maintenance, setMaintenance] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        setStatsError(null);
        try {
            const [sysStats, adminLogs, recentPosts] = await Promise.all([
                api.getSystemStats(),
                api.getAdminLogs(20),
                api.getPosts()
            ]);

            if (sysStats.error) {
                setStatsError(sysStats.error.message);
            } else if (sysStats) {
                setStats({ 
                    users: sysStats.usersCount, 
                    posts: sysStats.postsCount, 
                    comments: sysStats.commentsCount 
                });
            }

            if (adminLogs.data) setLogs(adminLogs.data);
            if (recentPosts.data) setPosts(recentPosts.data);
        } catch (error: any) {
            console.error('Error loading dashboard data:', error);
            setStatsError('Fallo en la conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAction = async (action: string) => {
        switch (action) {
            case 'broadcast':
                const msg = prompt('Mensaje para la Alerta Global:');
                if (msg) {
                    await api.broadcastNotification('Alerta Master', msg);
                    alert('Notificación enviada a todos los miembros.');
                }
                break;
            case 'purge_cache':
                window.location.reload();
                break;
            case 'lockdown':
                setMaintenance(!maintenance);
                break;
            default:
                break;
        }
    };

    const handleDeletePost = async (id: string) => {
        if (!window.confirm('¿Borrar este contenido permanentemente?')) return;
        const { error } = await api.deletePost(id);
        if (error) alert('Error: ' + error.message);
        else loadDashboardData();
    };

    const dashboardTabs = [
        { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
        { id: 'activity', label: 'Actividad', icon: Activity },
        { id: 'moderation', label: 'Moderación', icon: Shield },
        { id: 'system', label: 'Sistema', icon: Zap }
    ];

    return (
        <div className="master-admin-root">
            <div className="admin-top-bar">
                <div className="system-indicators">
                    <div className="indicator">
                        <div className="dot online"></div>
                        <span>API: OK</span>
                    </div>
                    <div className="indicator">
                        <Activity size={14} className="icon-pulse" />
                        <span>TPS: OK</span>
                    </div>
                </div>
                <div className="admin-quick-actions">
                    <button 
                        className={`maint-btn ${maintenance ? 'active' : ''}`}
                        onClick={() => handleQuickAction('lockdown')}
                    >
                        <Shield size={16} />
                        {maintenance ? 'Mantenimiento: ON' : 'Poner en Mantenimiento'}
                    </button>
                    <button className="refresh-circular" onClick={loadDashboardData}>
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            <AdminHeader 
                title="Panel Maestro CEO"
                subtitle="Gestión global de la infraestructura y comunidad"
                icon={<Shield size={32} />}
            >
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="outline" size="small" onClick={() => handleQuickAction('broadcast')}>
                        <Bell size={16} /> Alerta Global
                    </Button>
                    <Button variant="primary" size="small" onClick={loadDashboardData}>
                        <RefreshCw size={16} /> Actualizar
                    </Button>
                </div>
            </AdminHeader>

            <div className="master-content">
                <DashboardTabs 
                    tabs={dashboardTabs} 
                    activeTab={activeTab} 
                    onTabChange={setActiveTab} 
                />

                <div className="view-container">
                    {activeTab === 'overview' && (
                        <div className="overview-view animate-fade-in">
                            {statsError && (
                                <div className="admin-error-banner" style={{ 
                                    backgroundColor: 'var(--error-soft)', 
                                    color: 'var(--error)', 
                                    padding: '1rem', 
                                    borderRadius: '12px', 
                                    marginBottom: '1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    border: '1px solid var(--error)'
                                }}>
                                    <AlertTriangle size={20} />
                                    <span><strong>Error de Acceso:</strong> {statsError}</span>
                                </div>
                            )}
                            <div className="stats-row-expanded">
                                <StatCard 
                                    title="Usuarios Totales"
                                    value={statsError ? '---' : stats.users.toLocaleString()}
                                    subtext="Registrados en la plataforma"
                                    icon={<Users size={20} />}
                                    className="users-g"
                                />
                                <StatCard 
                                    title="Posteos"
                                    value={statsError ? '---' : stats.posts.toLocaleString()}
                                    subtext="Contenido publicado"
                                    icon={<MessageSquare size={20} />}
                                    className="posts-g"
                                />
                                <StatCard 
                                    title="Interacciones"
                                    value={statsError ? '---' : stats.comments.toLocaleString()}
                                    subtext="Comentarios totales"
                                    icon={<Activity size={20} />}
                                    className="eng-g"
                                />
                            </div>

                            <section className="quick-actions-panel">
                                <h3>Acciones Inmediatas</h3>
                                <div className="qa-grid">
                                    <div className="qa-card danger" onClick={() => handleQuickAction('lockdown')}>
                                        <div className="qa-icon"><Shield /></div>
                                        <span>Modo Emergencia</span>
                                    </div>
                                    <div className="qa-card info" onClick={() => handleQuickAction('broadcast')}>
                                        <div className="qa-icon"><Bell /></div>
                                        <span>Alerta Miembros</span>
                                    </div>
                                    <div className="qa-card" onClick={() => handleQuickAction('purge_cache')}>
                                        <div className="qa-icon"><RefreshCw /></div>
                                        <span>Reiniciar Caché</span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="activity-section animate-fade-in">
                            <div className="section-header-row">
                                <h3><Activity size={20} /> Registros de Auditoría</h3>
                                <div className="filter-pills">
                                    <button className="pill active">Todos los Eventos</button>
                                </div>
                            </div>
                            <div className="activity-log-card">
                                {logs.length > 0 ? logs.map((log) => (
                                    <div key={log.id} className="log-row">
                                        <div className="log-user">
                                            <div className="log-info">
                                                <strong>ID Admin: {log.admin_id.substring(0, 8)}</strong>
                                                <span>Acción: {log.action}</span>
                                            </div>
                                        </div>
                                        <div className="log-content">{log.details}</div>
                                        <div className="log-time">{new Date(log.created_at).toLocaleString('es-ES')}</div>
                                    </div>
                                )) : (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No hay registros disponibles en este momento.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'moderation' && (
                        <div className="moderation-view animate-fade-in">
                            <div className="section-header-row">
                                <h3>Cola de Moderación</h3>
                                <div className="filter-pills">
                                    <button className="pill active">Recientes</button>
                                </div>
                            </div>

                            <div className="mod-masonry">
                                {posts.map((post) => (
                                    <div key={post.id} className="mod-premium-card">
                                        <div className="mod-user-top">
                                            <img src={post.profiles?.avatar_url || DEFAULT_AVATAR_URL} alt="A" />
                                            <span>{post.profiles?.full_name || 'Usuario'}</span>
                                        </div>
                                        <div className="mod-body">
                                            <p>{post.content}</p>
                                            {post.image_url && (
                                                <div className="mod-img-container">
                                                    <img src={post.image_url} alt="Post Media" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="mod-footer">
                                            <div className="mod-stats-inline">
                                                <span>❤️ {post.likes?.count || 0}</span>
                                                <span>💬 {post.comments?.count || 0}</span>
                                            </div>
                                            <Button variant="danger" size="small" fullWidth onClick={() => handleDeletePost(post.id)}>
                                                <Trash2 size={14} /> Eliminar Permanente
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="system-view animate-fade-in">
                            <h3>Infraestructura y Configuración</h3>
                            <div className="system-grid">
                                <div className="system-card">
                                    <h3><Zap size={20} /> Servicios Cloud</h3>
                                    <div className="sys-m">
                                        <span>Base de Datos (Supabase)</span>
                                        <div className="m-bar"><div className="fill" style={{ width: '100%', background: 'var(--success)' }}></div></div>
                                    </div>
                                    <div className="sys-m">
                                        <span>Almacenamiento (Bucket)</span>
                                        <div className="m-bar"><div className="fill" style={{ width: '60%', background: 'var(--accent-color)' }}></div></div>
                                    </div>
                                </div>
                                <div className="system-card">
                                    <h3>Ajustes Maestros</h3>
                                    <div className="toggle-item">
                                        <span>Nuevos Registros</span>
                                        <CheckCircle color="var(--success)" size={20} />
                                    </div>
                                    <div className="toggle-item">
                                        <span>Mantenimiento General</span>
                                        <AlertTriangle color={maintenance ? 'var(--error)' : 'var(--text-muted)'} size={20} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};



export default CEODashboard;
