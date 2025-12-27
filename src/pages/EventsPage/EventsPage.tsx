import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, ChevronRight, Plus, X, Image as ImageIcon, Loader } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { supabase } from '../../utils/supabaseClient';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './EventsPage.css';

interface EventData {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  image_url: string;
  attendees: number;
  created_by: string;
}

const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    category: 'Académico',
    image: null as File | null
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      if (data) setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);

    try {
      let imageUrl = 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=400'; // Default

      if (formData.image) {
        const { data: url, error: uploadError } = await api.uploadImage(formData.image, 'posts'); // Reusing posts bucket
        if (uploadError) throw uploadError;
        if (url) imageUrl = url;
      }

      const { error } = await supabase.from('events').insert({
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        category: formData.category,
        image_url: imageUrl,
        created_by: user.id,
        attendees: 0
      });

      if (error) throw error;

      setIsModalOpen(false);
      setFormData({ title: '', date: '', time: '', location: '', category: 'Académico', image: null });
      fetchEvents(); // Refresh list
    } catch (error: any) {
      alert('Error al crear evento: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'Deportes': return '#10b981';
      case 'Tecnología': return '#8b5cf6';
      case 'Social': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleString('es-ES', { month: 'short' }).toUpperCase()
    };
  };

  return (
    <div className="events-container animate-fade-in">
      <header className="events-header">
        <div>
          <h1 className="events-title">
            <Calendar className="text-accent" size={32} /> Eventos Universitarios
          </h1>
          <p className="events-subtitle">Descubre lo que está pasando en el campus.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Crear Evento
        </Button>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <Loader className="spin" size={32} style={{ marginBottom: '1rem', color: 'var(--accent-color)' }} />
            <p>Cargando eventos...</p>
        </div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
          <Calendar size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3>No hay eventos próximos</h3>
          <p>¡Sé el primero en crear uno para tu comunidad!</p>
        </div>
      ) : (
      <div className="events-grid">
        {events.map(event => {
          const { day, month } = formatDate(event.date);
          return (
          <div key={event.id} className="event-card">
            <div className="event-image-wrapper">
              <img 
                src={event.image_url} 
                alt={event.title} 
                className="event-image"
              />
              <div className="category-tag" style={{ borderBottom: `3px solid ${getCategoryColor(event.category)}` }}>
                {event.category}
              </div>
            </div>
            
            <div className="event-content">
              <div className="event-date-row">
                <div className="event-date-box">
                  <span className="date-day">{day}</span>
                  <span className="date-month">{month}</span>
                </div>
                <div className="event-info">
                  <h3 className="event-title">{event.title}</h3>

                  <div className="event-meta">
                    <div className="meta-item">
                      <Clock size={16} /> {event.time.substring(0, 5)}
                    </div>
                    <div className="meta-item">
                      <MapPin size={16} /> {event.location}
                    </div>
                  </div>
                </div>
              </div>

              <div className="event-footer">
                <div className="attendees-count">
                  <Users size={16} /> {event.attendees || 0} Asistirán
                </div>
                <button className="view-details-btn">
                  Ver Detalles <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
      )}

      {/* Modal de Creación */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Nuevo Evento</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Título del Evento</label>
                <input 
                  type="text" required className="modal-input" placeholder="Ej. Torneo de Fútbol"
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Fecha</label>
                  <input 
                    type="date" required className="modal-input"
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Hora</label>
                  <input 
                    type="time" required className="modal-input"
                    value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Ubicación</label>
                <input 
                  type="text" required className="modal-input" placeholder="Ej. Auditorio, Cancha 2..."
                  value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Categoría</label>
                <select 
                  className="modal-input"
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Académico">Académico</option>
                  <option value="Deportes">Deportes</option>
                  <option value="Social">Social</option>
                  <option value="Tecnología">Tecnología</option>
                  <option value="Arte">Arte</option>
                </select>
              </div>

              <div className="form-group">
                <label>Imagen Promocional</label>
                <div style={{ border: '2px dashed var(--border-color)', padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-color)' }}>
                  <input 
                    type="file" accept="image/*" id="event-img" style={{ display: 'none' }}
                    onChange={e => setFormData({...formData, image: e.target.files ? e.target.files[0] : null})}
                  />
                  <label htmlFor="event-img" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                    <ImageIcon size={32} style={{ color: 'var(--accent-color)' }} />
                    <span style={{ fontWeight: 500 }}>{formData.image ? formData.image.name : 'Click para subir imagen o arrastra aquí'}</span>
                  </label>
                </div>
              </div>

              <Button type="submit" disabled={creating} style={{ marginTop: '1rem', width: '100%' }}>
                {creating ? <><Loader className="spin" size={20} /> Publicando...</> : 'Publicar Evento'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


export default EventsPage;