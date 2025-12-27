import React, { useEffect, useState } from 'react';
import { 
    History as HistoryIcon,
    Shield, Users, Activity, MessageSquare, Trash2, 
    BarChart3, AlertTriangle, RefreshCw, Zap, Server, 
    Bell, Search, UserCheck, ShieldOff, Filter, Download, Megaphone
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AdminPage from '../../components/auth/AdminPage';
import { api, Post } from '../../services/api';
import './CEODashboard.css';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const CEODashboard = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'moderation' | 'system'>('overview');
    const [stats, setStats] = useState<{ usersCount: number; postsCount: number; commentsCount: number }>({ usersCount: 0, postsCount: 0, commentsCount: 0 });
    const [recentPosts, setRecentPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [serverStatus, setServerStatus] = useState('online');
    const [maintenance, setMaintenance] = useState(false);
    const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
    
    // Real Data States
    const [logs, setLogs] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    
    // Mock data for charts (These will likely be replaced by analytics data later)
    const userGrowthData = [40, 45, 60, 75, 85, 100, 110, 120, 140, 155, 180, 200];
    const activityData = [20, 35, 30, 45, 60, 55, 70, 65, 80, 75, 90, 85];

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // 1. System Stats
            const sysStats = await api.getSystemStats();
            setStats({
                usersCount: sysStats.usersCount || 0,
                postsCount: sysStats.postsCount || 0,
                commentsCount: sysStats.commentsCount || 0
            });

            // 2. Recent Posts for Moderation
            const { data: posts } = await api.getPosts();
            if (posts) setRecentPosts(posts.slice(0, 12));

            // 3. Real Admin Logs
            const { data: adminLogs } = await api.getAdminLogs(10);
            if (adminLogs) setLogs(adminLogs);

            // 4. Analytics (RPC)
            const { data: analyticsData } = await api.getDashboardAnalytics();
            if (analyticsData) setAnalytics(analyticsData);

        } catch (error) {
            console.error('Dash load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async (ids: string[]) => {
        const msg = ids.length === 1 
            ? '¿Eliminar este post definitivamente?' 
            : `¿Eliminar ${ids.length} posts seleccionados?`;
            
        if (!window.confirm(msg)) return;

        // Optimistic update
        setRecentPosts(prev => prev.filter(p => !ids.includes(p.id)));
        setStats(prev => ({ ...prev, postsCount: (prev.postsCount || 0) - ids.length }));
        setSelectedPosts([]);

        // Execute deletions
        const promises = ids.map(id => api.deletePost(id));
        const results = await Promise.all(promises);
        
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
            alert('Algunos posts no se pudieron eliminar.');
            loadDashboardData();
        }
    };

    const handleDeletePost = (id: string) => confirmDelete([id]);

    const handleBulkAction = async (action: string) => {
        if (selectedPosts.length === 0) return;
        if (action === 'delete') {
            await confirmDelete(selectedPosts);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedPosts(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleQuickAction = async (action: string) => {
        if (!window.confirm(`¿Confirmar acción: ${action}?`)) return;
        
        // Log action to DB
        await api.logAdminAction(action.toUpperCase(), 'Executed via Quick Actions Panel');
        
        switch (action) {
            case 'broadcast':
                alert('📢 Sistema de alerta iniciado. (Simulado)');
                break;
            case 'purge_cache':
                alert('🧹 Caché del servidor purgada.');
                break;
            case 'lockdown':
                alert('🔒 Modo mantenimiento activado.');
                break;
        }
        
        // Reload logs to show new action
        const { data } = await api.getAdminLogs(10);
        if (data) setLogs(data);
    };

    return (
        <div className="master-admin-root animate-fade-in">
            <header className="admin-top-bar">
                <div className="system-indicators">
                    <div className="indicator">
                        <div className={`dot ${serverStatus === 'online' ? 'online' : 'offline'}`}></div>
                        <span>SISTEMA: {serverStatus.toUpperCase()}</span>
                    </div>
                    <div className="indicator">
                        <Activity size={16} className="icon-pulse" />
                        <span>TPS: 24.5</span>
                    </div>
                </div>
                
                <div className="admin-quick-actions">
                    <button 
                        className={`maint-btn ${maintenance ? 'active' : ''}`}
                        onClick={() => setMaintenance(!maintenance)}
                    >
                        <ShieldOff size={16} /> {maintenance ? 'Mantenimiento ON' : 'Modo Operativo'}      
                    </button>
                    <button onClick={loadDashboardData} className="refresh-circular">
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </header>

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
                                {/* Simple SVG Line Chart */}
                                <div className="m-stat-chart">
                                    <svg viewBox="0 0 100 25" className="sparkline">
                                        <polyline 
                                            points={userGrowthData.map((v, i) => `${i * 9},${25 - (v/200)*25}`).join(' ')} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2"
                                        />
                                    </svg>
                                </div>
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
                                <div className="m-stat-chart">
                                    <svg viewBox="0 0 100 25" className="sparkline">
                                        <polyline 
                                            points={activityData.map((v, i) => `${i * 9},${25 - (v/100)*25}`).join(' ')} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2"
                                        />
                                    </svg>
                                </div>
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

                        <div className="quick-actions-panel">
                            <h3>⚡ Acciones Rápidas</h3>
                            <div className="qa-grid">
                                <button className="qa-card" onClick={() => handleQuickAction('broadcast')}>
                                    <div className="qa-icon"><Megaphone size={24} /></div>
                                    <span>Alerta Global</span>
                                </button>
                                <button className="qa-card danger" onClick={() => handleQuickAction('purge_cache')}>
                                    <div className="qa-icon"><Trash2 size={24} /></div>
                                    <span>Purgar Caché</span>
                                </button>
                                <button className="qa-card info" onClick={() => window.location.reload()}>
                                    <div className="qa-icon"><RefreshCw size={24} /></div>
                                    <span>Reiniciar Dash</span>
                                </button>
                            </div>
                        </div>

                        <div className="activity-section">
                            <div className="section-header-row">
                                <h3><HistoryIcon size={18} /> Logs de Actividad Real</h3>
                                <div className="filter-pills">
                                    <button className="pill active">Todos</button>
                                    <button className="pill">Seguridad</button>
                                    <button className="pill">Usuarios</button>
                                </div>
                            </div>
                            
                            <Card className="activity-log-card">
                                <div className="log-list">
                                    {logs.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            No hay registros de actividad recientes.
                                        </div>
                                    ) : (
                                        logs.map((log) => (
                                            <div key={log.id} className="log-row">
                                                <div className="log-user">
                                                    <div className="dot online"></div>
                                                    <div className="log-info">
                                                        <strong>Admin Action</strong>
                                                        <span>ID: ...{log.admin_id.slice(-4)}</span>
                                                    </div>
                                                </div>
                                                <div className="log-content">
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.action}</span>: {log.details}
                                                </div>
                                                <div className="log-meta">
                                                    <span className="log-time">{new Date(log.created_at).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
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
                            <div className="mod-actions-right">
                                {selectedPosts.length > 0 && (
                                    <Button variant="danger" size="small" onClick={() => handleBulkAction('delete')}>
                                        <Trash2 size={14} /> Eliminar Seleccionados ({selectedPosts.length})
                                    </Button>
                                )}
                                <div className="mod-filters">
                                    <button className="mod-f-item active">Visuales</button>
                                    <button className="mod-f-item">Texto Largo</button>
                                    <button className="mod-f-item">Reportados</button>
                                </div>
                            </div>
                        </div>

                        <div className="mod-masonry">
                            {recentPosts.filter(p => p.image_url || p.content.length > 40).map(post => (
                                <Card key={post.id} className={`mod-premium-card ${selectedPosts.includes(post.id) ? 'selected' : ''}`}>
                                    <div className="mod-selection-overlay" onClick={() => toggleSelection(post.id)}>
                                        <div className={`checkbox ${selectedPosts.includes(post.id) ? 'checked' : ''}`}></div>
                                    </div>
                                    <div className="mod-user-top">
                                        <img src={post.profiles.avatar_url || DEFAULT_AVATAR} alt="" />
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
                                            <ShieldOff size={14} /> Eliminar
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
