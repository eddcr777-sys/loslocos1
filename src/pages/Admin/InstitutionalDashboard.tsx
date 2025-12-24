import React, { useState, useEffect } from 'react';
import { 
    Megaphone, Users, BarChart, History as HistoryIcon, Plus, Trash2, 
    Calendar, CheckCircle, Info, ExternalLink, Send, 
    Layout, Eye, Type, AlertTriangle, Bookmark, Sparkles 
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useFeed } from '../../context/FeedContext';
import { api, Post, Profile } from '../../services/api';
import './InstitutionalDashboard.css';

const TEMPLATES = [
    { id: 'academic', title: 'Aviso Académico', content: 'Se les informa a los estudiantes que las fechas de exámenes parciales han sido actualizadas. Por favor revisar el portal.', icon: <Layout size={18} /> },
    { id: 'event', title: 'Evento Cultural', content: '¡No te pierdas nuestra próxima feria universitaria! Tendremos música, comida y muchas sorpresas.', icon: <Sparkles size={18} /> },
    { id: 'urgent', title: 'Aviso Urgente', content: 'Suspensión de actividades por motivos de fuerza mayor. Estén atentos al portal oficial.', icon: <AlertTriangle size={18} /> }
];

const InstitutionalDashboard = () => {
    const { createPost } = useFeed();
    const [activeTab, setActiveTab] = useState<'create' | 'my-posts' | 'audience'>('create');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('general');
    const [loading, setLoading] = useState(false);
    const [posted, setPosted] = useState(false);
    const [myPosts, setMyPosts] = useState<Post[]>([]);
    const [facultyUsers, setFacultyUsers] = useState<Profile[]>([]);
    const [stats, setStats] = useState({ totalOfficial: 0, totalEngagement: 0 });
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        loadInstitutionalData();
    }, []);

    const loadInstitutionalData = async () => {
        setLoading(true);
        const { data: posts } = await api.getOfficialPosts();
        const { data: profiles } = await api.getAllProfiles();

        if (posts) {
            setMyPosts(posts);
            const engagement = posts.reduce((acc, p) => acc + (p.likes?.count || 0) + (p.comments?.count || 0), 0);
            setStats({ totalOfficial: posts.length, totalEngagement: engagement });
        }
        
        if (profiles) {
            setFacultyUsers(profiles.slice(0, 20));
        }
        setLoading(false);
    };

    const handleApplyTemplate = (template: typeof TEMPLATES[0]) => {
        setTitle(template.title);
        setContent(template.content);
        if (template.id === 'urgent') setCategory('urgente');
        else setCategory('academico');
    };

    const handlePostAviso = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const prefix = category === 'urgente' ? '🚨 URGENTE: ' : '📢 ';
            const fullContent = `${prefix}${title.toUpperCase()}\n\n${content}\n\n🏷️ #${category}`;
            const result = await createPost(fullContent, null, true);
            
            if (result.error) throw result.error;

            await api.broadcastNotification(title, content);

            setLoading(false);
            setPosted(true);
            setTitle('');
            setContent('');
            setCategory('general');
            setShowPreview(false);
            setTimeout(() => setPosted(false), 3000);
            loadInstitutionalData();
        } catch (error: any) {
            alert('Error al publicar: ' + error.message);
            setLoading(false);
        }
    };

    const handleDeleteAviso = async (id: string) => {
        if (!window.confirm('¿Eliminar este aviso oficial?')) return;
        const { error } = await api.deletePost(id);
        if (!error) loadInstitutionalData();
    };

    return (
        <div className="inst-dashboard-container animate-fade-in">
            <header className="inst-header-glass">
                <div className="inst-brand-wrapper">
                    <div className="inst-icon-glow"><Megaphone size={32} /></div>
                    <div>
                        <h1>Panel Institucional <span className="badge-official">Verificado</span></h1>
                        <p>Gestión de comunicación oficial y alcance académico.</p>
                    </div>
                </div>
                
                <nav className="inst-tab-navigation">
                    <button className={activeTab === 'create' ? 'nav-tab active' : 'nav-tab'} onClick={() => setActiveTab('create')}>
                        <Plus size={20} /> <span>Comunicar</span>
                    </button>
                    <button className={activeTab === 'my-posts' ? 'nav-tab active' : 'nav-tab'} onClick={() => setActiveTab('my-posts')}>
                        <HistoryIcon size={20} /> <span>Historial</span>
                    </button>
                    <button className={activeTab === 'audience' ? 'nav-tab active' : 'nav-tab'} onClick={() => setActiveTab('audience')}>
                        <Users size={20} /> <span>Comunidad</span>
                    </button>
                </nav>
            </header>

            <main className="inst-dashboard-body">
                {activeTab === 'create' && (
                    <div className="inst-creation-layout">
                        <section className="inst-editor-section">
                            <Card className="professional-card">
                                <div className="card-top">
                                    <h3><Type size={20} /> Nuevo Comunicado</h3>
                                    <div className="priority-selectors">
                                        <button className={category === 'general' ? 'prio-btn active' : 'prio-btn'} onClick={() => setCategory('general')}>Estándar</button>
                                        <button className={category === 'urgente' ? 'prio-btn urgent active' : 'prio-btn urgent'} onClick={() => setCategory('urgente')}>Urgente</button>
                                    </div>
                                </div>

                                <form onSubmit={handlePostAviso} className="premium-form">
                                    <div className="input-group-custom">
                                        <label>Asunto del Mensaje</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ej: Suspensión de actividades académicas..." 
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="custom-input-field"
                                            required
                                        />
                                    </div>

                                    <div className="input-group-custom">
                                        <label>Cuerpo Detallado</label>
                                        <textarea 
                                            placeholder="Redacta el contenido oficial aquí..." 
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            className="custom-textarea-field"
                                            required
                                        />
                                    </div>

                                    <div className="form-actions-row">
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => setShowPreview(!showPreview)}
                                            style={{ flex: 1 }}
                                        >
                                            <Eye size={18} /> {showPreview ? 'Ocultar Previsualización' : 'Ver Previsualización'}
                                        </Button>
                                        <Button type="submit" fullWidth disabled={loading} style={{ flex: 2 }}>
                                            <Send size={18} /> {loading ? 'Enviando...' : 'Publicar Comunicado'}
                                        </Button>
                                    </div>

                                    {posted && (
                                        <div className="success-notif bounce-in">
                                            <CheckCircle size={20} /> ¡Aviso publicado y notificado a toda la comunidad!
                                        </div>
                                    )}
                                </form>
                            </Card>

                            {showPreview && (
                                <div className="post-preview-area slide-up">
                                    <div className="preview-label">Vista Previa Mobile</div>
                                    <div className="mock-phone">
                                        <div className="mock-post">
                                            <div className="mock-header">
                                                <div className="mock-avatar"></div>
                                                <div className="mock-user">
                                                    <strong>Institución Oficial</strong>
                                                    <span>Ahora mismo • 🌎</span>
                                                </div>
                                            </div>
                                            <div className="mock-content">
                                                <strong>{category === 'urgente' ? '🚨 URGENTE: ' : '📢 '}{title.toUpperCase()}</strong>
                                                <p>{content}</p>
                                                <span className="mock-tag">#{category}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        <aside className="inst-resources-aside">
                            <Card className="resource-card templates">
                                <h4><Bookmark size={18} /> Plantillas Rápidas</h4>
                                <div className="template-list">
                                    {TEMPLATES.map(t => (
                                        <button key={t.id} className="template-item" onClick={() => handleApplyTemplate(t)}>
                                            {t.icon}
                                            <span>{t.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </Card>

                            <div className="metric-cards-compact">
                                <Card className="compact-stat-card glass-teal">
                                    <BarChart size={24} />
                                    <div className="stat-data">
                                        <span className="count">{stats.totalOfficial}</span>
                                        <span className="label">Activos</span>
                                    </div>
                                </Card>
                                <Card className="compact-stat-card glass-blue">
                                    <Sparkles size={24} />
                                    <div className="stat-data">
                                        <span className="count">{stats.totalEngagement}</span>
                                        <span className="label">Interacciones</span>
                                    </div>
                                </Card>
                            </div>

                            <div className="inst-guide-card">
                                <h5>ℹ️ Consejos de Comunicación</h5>
                                <p>Usa títulos cortos y llamativos. Los avisos urgentes envían notificaciones push de alta prioridad.</p>
                            </div>
                        </aside>
                    </div>
                )}

                {activeTab === 'my-posts' && (
                    <div className="inst-history-view animate-fade-in">
                        <div className="view-header">
                            <h2>Historial de Comunicados</h2>
                            <Button variant="outline" size="small" onClick={loadInstitutionalData}>Refrescar</Button>
                        </div>
                        <div className="history-grid">
                            {myPosts.length === 0 ? (
                                <div className="empty-placeholder">
                                    <HistoryIcon size={48} />
                                    <p>Aún no has publicado ningún aviso oficial.</p>
                                </div>
                            ) : (
                                myPosts.map(post => (
                                    <Card key={post.id} className="history-item-card">
                                        <div className="h-card-date">{new Date(post.created_at).toLocaleString()}</div>
                                        <div className="h-card-body">
                                            <p>{post.content.substring(0, 180)}{post.content.length > 180 ? '...' : ''}</p>
                                        </div>
                                        <div className="h-card-footer">
                                            <div className="h-card-stats">
                                                <span><BarChart size={14} /> {post.likes?.count || 0}</span>
                                                <span><Users size={14} /> {post.comments?.count || 0}</span>
                                            </div>
                                            <button className="h-delete-btn" onClick={() => handleDeleteAviso(post.id)}>
                                                <Trash2 size={16} /> <span>Eliminar</span>
                                            </button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'audience' && (
                    <div className="inst-audience-view animate-fade-in">
                        <div className="audience-header">
                            <div>
                                <h2>Directorio de la Comunidad</h2>
                                <p>Usuarios activos que reciben tus notificaciones e interactúan con la facultad.</p>
                            </div>
                        </div>
                        <div className="audience-table-container">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Facultad / Carrera</th>
                                        <th>Interacción</th>
                                        <th>Panel de Perfil</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {facultyUsers.map((user, i) => (
                                        <tr key={user.id} style={{ animationDelay: `${i * 0.05}s` }}>
                                            <td className="user-cell">
                                                <img src={user.avatar_url || 'https://via.placeholder.com/40'} alt="" />
                                                <div className="user-details-mini">
                                                    <strong>{user.full_name}</strong>
                                                    <span>@{user.username || 'usuario'}</span>
                                                </div>
                                            </td>
                                            <td><span className="faculty-label">{user.faculty || 'General'}</span></td>
                                            <td>
                                                <div className="interaction-meter">
                                                    <div className="meter-bar" style={{ width: `${Math.random() * 60 + 40}%` }}></div>
                                                </div>
                                            </td>
                                            <td>
                                                <Button variant="outline" size="small" onClick={() => window.location.href=`/profile/${user.id}`}>
                                                    <ExternalLink size={14} /> Ver más
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default InstitutionalDashboard;
