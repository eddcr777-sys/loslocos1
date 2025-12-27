import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, ChevronRight, Plus, X, Image as ImageIcon, Loader } from 'lucide-react';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import { supabase } from './utils/supabaseClient';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
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
    <div className="events-container animate-fade-in" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar className="text-blue-600" /> Eventos Universitarios
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Descubre lo que está pasando en el campus.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Crear Evento
        </Button>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>Cargando eventos...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          No hay eventos próximos. ¡Sé el primero en crear uno!
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {events.map(event => {
          const { day, month } = formatDate(event.date);
          return (
          <Card key={event.id} className="event-card" style={{ overflow: 'hidden', transition: 'transform 0.2s', cursor: 'pointer' }}>
            <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
              <img 
                src={event.image_url} 
                alt={event.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div className="category-tag" style={{ 
                position: 'absolute', top: '10px', right: '10px', 
                color: getCategoryColor(event.category)
              }}>
                {event.category}
              </div>
            </div>
            
            <div style={{ padding: '1.2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', 
                  background: 'var(--surface-hover)', padding: '8px 12px', borderRadius: 'var(--radius-md)',
                  height: 'fit-content', minWidth: '50px'
                }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--error)' }}>{day}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{month}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', lineHeight: '1.3', color: 'var(--text-primary)' }}>{event.title}</h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <Clock size={14} /> {event.time.substring(0, 5)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <MapPin size={14} /> {event.location}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <Users size={14} /> {event.attendees || 0} Asistirán
                </div>
                <button style={{ 
                  background: 'none', border: 'none', color: 'var(--accent-color)', 
                  fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  Ver Detalles <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </Card>
          );
        })}
      </div>
      )}

      {/* Modal de Creación */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Nuevo Evento</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Título del Evento</label>
                <input 
                  type="text" required className="modal-input"
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
                <div style={{ border: '2px dashed var(--border-color)', padding: '1rem', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>
                  <input 
                    type="file" accept="image/*" id="event-img" style={{ display: 'none' }}
                    onChange={e => setFormData({...formData, image: e.target.files ? e.target.files[0] : null})}
                  />
                  <label htmlFor="event-img" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <ImageIcon size={24} />
                    <span>{formData.image ? formData.image.name : 'Click para subir imagen'}</span>
                  </label>
                </div>
              </div>

              <Button type="submit" disabled={creating} style={{ marginTop: '1rem' }}>
                {creating ? <><Loader className="spin" size={18} /> Creando...</> : 'Publicar Evento'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;