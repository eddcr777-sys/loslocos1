import React, { useEffect, useState } from 'react';
import { 
    History as HistoryIcon,
    Shield, Users, Activity, MessageSquare, Trash2, 
    BarChart3, AlertTriangle, RefreshCw, Zap, Server, 
    Bell, Search, UserCheck, ShieldOff, Filter, Download
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AdminPage from '../../components/auth/AdminPage';
import { api, Post } from '../../services/api';
import './CEODashboard.css';

const CEODashboard = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'moderation' | 'system'>('overview');
    const [stats, setStats] = useState({ usersCount: 0, postsCount: 0, commentsCount: 0 });
    const [recentPosts, setRecentPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [serverStatus, setServerStatus] = useState('online');
    const [maintenance, setMaintenance] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsResult, postsResult] = await Promise.all([
                api.getSystemStats(),
                api.getPosts()
            ]);

            if (statsResult) setStats(statsResult);
            if (postsResult.data) setRecentPosts(postsResult.data.slice(0, 15));
        } catch (error) {
            console.error("Error loading admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este post permanentemente?')) return;
        
        const { error } = await api.deletePost(postId);
        if (error) {
            alert('Error al eliminar: ' + error.message);
        } else {
            setRecentPosts(prev => prev.filter(p => p.id !== postId));
            setStats(prev => ({ ...prev, postsCount: prev.postsCount - 1 }));
        }
    };

    return (
        <div className="master-admin-root animate-fade-in">
            {/* Top Insight Bar */}
            <div className="admin-top-bar">
                <div className="system-indicators">
                    <div className="indicator">
                        <div className={`dot ${serverStatus}`}></div>
                        <span>Servidor: {serverStatus.toUpperCase()}</span>
                    </div>
                    <div className="indicator">
                        <Zap size={14} className="icon-pulse" />
                        <span>Latencia: 24ms</span>
                    </div>
                </div>
                <div className="admin-quick-actions">
                    <button onClick={() => setMaintenance(!maintenance)} className={`maint-btn ${maintenance ? 'active' : ''}`}>
                        <ShieldOff size={16} /> {maintenance ? 'Mantenimiento ON' : 'Modo Operativo'}
                    </button>
                    <button onClick={loadData} className="refresh-circular">
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            <header className="master-header">
                <div className="master-header-content">
                    <div className="master-title">
                        <div className="master-logo-bg">
                            <Shield size={32} />
                        </div>
                        <div>
                            <h1>Control Center Master</h1>
                            <p>Gestión de infraestructura, usuarios y moderación global.</p>
                        </div>
                    </div>
                </div>

                <nav className="master-nav">
                    <button className={activeTab === 'overview' ? 'm-nav-item active' : 'm-nav-item'} onClick={() => setActiveTab('overview')}>
                        <BarChart3 size={20} /> <span>Análisis</span>
                    </button>
                    <button className={activeTab === 'users' ? 'm-nav-item active' : 'm-nav-item'} onClick={() => setActiveTab('users')}>
                        <Users size={20} /> <span>Usuarios</span>
                    </button>
                    <button className={activeTab === 'moderation' ? 'm-nav-item active' : 'm-nav-item'} onClick={() => setActiveTab('moderation')}>
                        <AlertTriangle size={20} /> <span>Moderación</span>
                    </button>
                    <button className={activeTab === 'system' ? 'm-nav-item active' : 'm-nav-item'} onClick={() => setActiveTab('system')}>
                        <Server size={20} /> <span>Sistema</span>
                    </button>
                </nav>
            </header>

            <main className="master-content">
                {activeTab === 'overview' && (
                    <div className="overview-view">
                        <div className="stats-row-expanded">
                            <Card className="m-stat-card users-g">
                                <div className="m-stat-header">
                                    <Users size={20} />
                                    <span>Usuarios Totales</span>
                                </div>
                                <div className="m-stat-body">
                                    <h2>{stats.usersCount.toLocaleString()}</h2>
                                    <div className="trend-up">+12% este mes</div>
                                </div>
                                <div className="m-stat-track"><div className="fill" style={{ width: '70%' }}></div></div>
                            </Card>

                            <Card className="m-stat-card posts-g">
                                <div className="m-stat-header">
                                    <MessageSquare size={20} />
                                    <span>Contenido Generado</span>
                                </div>
                                <div className="m-stat-body">
                                    <h2>{stats.postsCount.toLocaleString()}</h2>
                                    <div className="trend-up">+5.4% semanal</div>
                                </div>
                                <div className="m-stat-track"><div className="fill" style={{ width: '45%' }}></div></div>
                            </Card>

                            <Card className="m-stat-card traffic-g">
                                <div className="m-stat-header">
                                    <Activity size={20} />
                                    <span>Trafico de Datos</span>
                                </div>
                                <div className="m-stat-body">
                                    <h2>{stats.commentsCount.toLocaleString()}</h2>
                                    <div className="trend-neutral">Estable</div>
                                </div>
                                <div className="m-stat-track"><div className="fill" style={{ width: '85%' }}></div></div>
                            </Card>
                        </div>

                        <div className="activity-section">
                            <div className="section-header-row">
                                <h3><HistoryIcon size={18} /> Logs de Actividad Global</h3>
                                <div className="filter-pills">
                                    <button className="pill active">Todos</button>
                                    <button className="pill">Nuevos</button>
                                    <button className="pill">Alertas</button>
                                </div>
                            </div>

                            <Card className="activity-log-card">
                                {loading ? (
                                    <div className="skeleton-loader">Recuperando registros...</div>
                                ) : (
                                    <div className="log-list">
                                        {recentPosts.map((post, i) => (
                                            <div key={post.id} className="log-row" style={{ animationDelay: `${i * 0.05}s` }}>
                                                <div className="log-user">
                                                    <img src={post.profiles.avatar_url || 'https://via.placeholder.com/32'} alt="" />
                                                    <div className="log-info">
                                                        <strong>{post.profiles.full_name}</strong>
                                                        <span>@{post.profiles.username || 'user'}</span>
                                                    </div>
                                                </div>
                                                <div className="log-content">
                                                    Publicó: "{post.content.substring(0, 80)}..."
                                                </div>
                                                <div className="log-meta">
                                                    <span className="log-time">{new Date(post.created_at).toLocaleTimeString()}</span>
                                                    <button className="log-action" onClick={() => handleDeletePost(post.id)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="users-view-enhanced">
                        <div className="users-control-header">
                            <h2>Directorio Administrativo de Usuarios</h2>
                            <div className="btn-actions">
                                <Button variant="outline" size="small"><Download size={14} /> Exportar CSV</Button>
                                <Button size="small"><UserCheck size={14} /> Invitación Staff</Button>
                            </div>
                        </div>
                        <AdminPage />
                    </div>
                )}

                {activeTab === 'moderation' && (
                    <div className="moderation-view-enhanced">
                        <div className="mod-header-box">
                            <div>
                                <h2>Moderación de Contenido</h2>
                                <p>Revisa reportes y actividad visual de la plataforma.</p>
                            </div>
                            <div className="mod-filters">
                                <button className="mod-f-item active">Visuales</button>
                                <button className="mod-f-item">Texto Largo</button>
                                <button className="mod-f-item">Reportados</button>
                            </div>
                        </div>

                        <div className="mod-masonry">
                            {recentPosts.filter(p => p.image_url || p.content.length > 40).map(post => (
                                <Card key={post.id} className="mod-premium-card">
                                    <div className="mod-user-top">
                                        <img src={post.profiles.avatar_url} alt="" />
                                        <span>{post.profiles.full_name}</span>
                                    </div>
                                    <div className="mod-body">
                                        <p>{post.content}</p>
                                        {post.image_url && (
                                            <div className="mod-img-container">
                                                <img src={post.image_url} alt="" />
                                                <div className="img-overlay"><Search size={20} /></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mod-footer">
                                        <div className="mod-stats-inline">
                                            <span>❤️ {post.likes?.count || 0}</span>
                                            <span>💬 {post.comments?.count || 0}</span>
                                        </div>
                                        <Button variant="danger" size="small" fullWidth onClick={() => handleDeletePost(post.id)}>
                                            <ShieldOff size={14} /> Eliminar Prohibido
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div className="system-view animate-fade-in">
                        <div className="system-grid">
                            <Card className="system-card info">
                                <h3><Server size={20} /> Estado de Infraestructura</h3>
                                <div className="sys-metrics">
                                    <div className="sys-m">
                                        <span>CPU Usage</span>
                                        <div className="m-bar"><div className="fill" style={{ width: '42%', background: '#10b981' }}></div></div>
                                    </div>
                                    <div className="sys-m">
                                        <span>RAM Usage</span>
                                        <div className="m-bar"><div className="fill" style={{ width: '68%', background: '#f59e0b' }}></div></div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="system-card settings">
                                <h3><Zap size={20} /> Configuraciones Rápidas</h3>
                                <div className="sys-toggles">
                                    <div className="toggle-item">
                                        <span>Nuevos Registros</span>
                                        <label className="switch">
                                            <input type="checkbox" defaultChecked />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    <div className="toggle-item">
                                        <span>Métricas Públicas</span>
                                        <label className="switch">
                                            <input type="checkbox" />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CEODashboard;
