import React, { useState, useEffect, useCallback } from 'react';
import { 
    PlusCircle, 
    History, 
    Users, 
    Bell, 
    Calendar,
    Send,
    Eye,
    Trash2,
    RefreshCw,
    Award
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './InstitutionalDashboard.css';
import AdminHeader from '../../components/admin/layout/AdminHeader';
import DashboardTabs from '../../components/admin/layout/DashboardTabs';
import StatCard from '../../components/admin/widgets/StatCard';
import Button from '../../components/ui/Button';

const InstitutionalDashboard = () => {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('create');
    const [stats, setStats] = useState({ totalOfficial: 0, totalEngagement: 0, reach: 0 });
    const [myPosts, setMyPosts] = useState<any[]>([]);
    const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
    const [audience, setAudience] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [postContent, setPostContent] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [priority, setPriority] = useState('normal');
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (!profile) return;
            const [posts, scheduled, profiles] = await Promise.all([
                api.getOfficialPosts(),
                api.getScheduledPosts(profile.id),
                api.getAllProfiles()
            ]);

            if (posts.data) {
                setMyPosts(posts.data);
                const engagement = posts.data.reduce((acc: number, p: any) => acc + (p.likes?.[0]?.count || 0) + (p.comments?.[0]?.count || 0), 0);
                setStats({ 
                    totalOfficial: posts.data.length, 
                    totalEngagement: engagement, 
                    reach: profiles.data ? profiles.data.length : 0 
                });
            }
            if (scheduled.data) setScheduledPosts(scheduled.data);
            if (profiles.data) setAudience(profiles.data.slice(0, 50));
        } catch (error) {
            console.error('Error loading institutional data:', error);
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postContent) return;

        if (!profile) return;
        let res;
        if (scheduledDate) {
            res = await api.schedulePost(profile.id, postContent, scheduledDate, true);
        } else {
            res = await api.createPost(postContent, profile.id, null, true);
        }

        if (res.error) {
            alert('Error: ' + res.error.message);
        } else {
            alert(scheduledDate ? 'Aviso programado con éxito' : 'Aviso publicado correctamente');
            setPostContent('');
            setScheduledDate('');
            loadData();
        }
    };

    const handleDeletePost = async (id: string) => {
        if (!window.confirm('¿Eliminar este aviso oficial?')) return;
        const { error } = await api.deletePost(id);
        if (error) alert('Error: ' + error.message);
        else loadData();
    };

    const handleDeleteScheduled = async (id: string) => {
        if (!window.confirm('¿Cancelar este aviso programado?')) return;
        const { error } = await api.deleteScheduledPost(id);
        if (error) alert('Error: ' + error.message);
        else loadData();
    };

    const institutionalTabs = [
        { id: 'create', label: 'Nuevo Aviso', icon: PlusCircle },
        { id: 'history', label: 'Historial', icon: History },
        { id: 'scheduled', label: 'Programados', icon: Calendar },
        { id: 'audience', label: 'Comunidad', icon: Users }
    ];

    return (
        <div className="inst-dashboard-container">
            <AdminHeader 
                title={'Panel Institucional'}
                subtitle="Comunicación oficial y gestión de comunidad universitaria"
                icon={<Award size={32} />}
            >
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="outline" size="small" onClick={loadData}>
                        <RefreshCw size={16} className={loading ? 'spin' : ''} /> Actualizar
                    </Button>
                </div>
            </AdminHeader>

            <div className="master-content">
                <div className="metric-cards-compact" style={{ marginBottom: '2rem' }}>
                    <StatCard 
                        title="Avisos Oficiales"
                        value={stats.totalOfficial}
                        icon={<Send size={18} />}
                        className="glass-teal"
                    />
                    <StatCard 
                        title="Interacciones"
                        value={stats.totalEngagement}
                        icon={<Bell size={18} />}
                        className="glass-indigo"
                    />
                    <StatCard 
                        title="Alcance Total"
                        value={stats.reach}
                        icon={<Eye size={18} />}
                        className="glass-blue"
                    />
                </div>

                <DashboardTabs 
                    tabs={institutionalTabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className="view-container" style={{ marginTop: '2rem' }}>
                    {activeTab === 'create' && (
                        <div className="inst-creation-layout animate-fade-in">
                            <section className="professional-card">
                                <div className="card-top">
                                    <h3><PlusCircle size={20} /> Crear Comunicado Oficial</h3>
                                    <div className="priority-selectors">
                                        <button className={`prio-btn ${priority === 'normal' ? 'active' : ''}`} onClick={() => setPriority('normal')}>Normal</button>
                                        <button className={`prio-btn urgent ${priority === 'urgent' ? 'active' : ''}`} onClick={() => setPriority('urgent')}>Urgente</button>
                                    </div>
                                </div>

                                <form onSubmit={handleCreatePost} className="premium-form">
                                    <div className="input-group-custom">
                                        <label>Contenido del Mensaje</label>
                                        <textarea 
                                            value={postContent}
                                            onChange={(e) => setPostContent(e.target.value)}
                                            placeholder="Escribe el mensaje institucional aquí..."
                                            className="custom-textarea-field"
                                            required
                                        />
                                    </div>

                                    <div className="input-group-custom">
                                        <label>Programar Publicación (Opcional)</label>
                                        <input 
                                            type="datetime-local"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            className="custom-input-field"
                                        />
                                    </div>

                                    <div className="form-actions-row">
                                        <Button type="submit" size="large" fullWidth>
                                            {scheduledDate ? 'Programar Aviso' : 'Publicar Ahora'}
                                        </Button>
                                    </div>
                                </form>
                            </section>

                            <aside className="inst-resources-aside">
                                <div className="resource-card">
                                    <h4>Plantillas Rápidas</h4>
                                    <div className="template-list">
                                        <button className="template-item" onClick={() => setPostContent('📢 COMUNICADO: Se informa a la comunidad universitaria que...')}>
                                            Aviso General
                                        </button>
                                        <button className="template-item" onClick={() => setPostContent('⚠️ URGENTE: Por motivos de fuerza mayor...')}>
                                            Emergencia
                                        </button>
                                        <button className="template-item" onClick={() => setPostContent('🎓 EVENTO: Los invitamos a participar en...')}>
                                            Invitación
                                        </button>
                                    </div>
                                </div>
                                <div className="inst-guide-card">
                                    <h5>Guía Institucional</h5>
                                    <p>Los avisos oficiales aparecen con la insignia de verificación y se notifican a los miembros de la red.</p>
                                </div>
                            </aside>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="history-view animate-fade-in">
                            <div className="view-header">
                                <h2>Historial de Comunicados</h2>
                                <Button variant="outline" size="small" onClick={loadData}><RefreshCw size={14} /> Refrescar</Button>
                            </div>
                            <div className="history-grid">
                                {myPosts.map(post => (
                                    <div key={post.id} className="history-item-card">
                                        <div className="h-card-date">{new Date(post.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</div>
                                        <div className="h-card-body">
                                            <p>{post.content}</p>
                                        </div>
                                        <div className="h-card-footer">
                                            <div className="h-card-stats">
                                                <span>❤️ {post.likes?.[0]?.count || 0}</span>
                                                <span>💬 {post.comments?.[0]?.count || 0}</span>
                                            </div>
                                            <button className="h-delete-btn" onClick={() => handleDeletePost(post.id)}>
                                                <Trash2 size={16} /> Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {myPosts.length === 0 && <p style={{ textAlign: 'center', gridColumn: '1/-1', padding: '3rem', color: 'var(--text-secondary)' }}>Aún no has publicado avisos oficiales.</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'scheduled' && (
                        <div className="scheduled-view animate-fade-in">
                            <div className="view-header">
                                <h2>Avisos Programados</h2>
                            </div>
                            <div className="history-grid">
                                {scheduledPosts.map(post => (
                                    <div key={post.id} className="history-item-card" style={{ borderLeft: '4px solid var(--accent-color)' }}>
                                        <div className="h-card-date">Para: {new Date(post.scheduled_for).toLocaleString('es-ES')}</div>
                                        <div className="h-card-body">
                                            <p>{post.content}</p>
                                        </div>
                                        <div className="h-card-footer">
                                            <span className="badge-official" style={{ background: 'var(--accent-soft)', color: 'var(--accent-color)' }}>{post.status.toUpperCase()}</span>
                                            <button className="h-delete-btn" onClick={() => handleDeleteScheduled(post.id)}>
                                                <Trash2 size={16} /> Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {scheduledPosts.length === 0 && <p style={{ textAlign: 'center', gridColumn: '1/-1', padding: '3rem', color: 'var(--text-secondary)' }}>No hay avisos programados.</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'audience' && (
                        <div className="audience-view animate-fade-in">
                            <div className="view-header">
                                <h2>Directorio de la Comunidad</h2>
                                <p>Cerrca de {stats.reach} miembros registrados</p>
                            </div>
                            <div className="audience-table-container">
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Facultad</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {audience.map(u => (
                                            <tr key={u.id}>
                                                <td>
                                                    <div className="user-cell">
                                                        <img src={u.avatar_url || DEFAULT_AVATAR} alt="" />
                                                        <div className="user-details-mini">
                                                            <strong>{u.full_name || 'Miembro'}</strong>
                                                            <span>@{u.username || 'sin_usuario'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><span className="faculty-label">{u.faculty || 'General'}</span></td>
                                                <td><span className="badge-official">Miembro</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default InstitutionalDashboard;
