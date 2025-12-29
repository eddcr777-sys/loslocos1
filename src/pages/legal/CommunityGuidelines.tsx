import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Heart, MessageCircle, ShieldAlert, Zap, GraduationCap, Scale } from 'lucide-react';
import Button from '../../components/ui/Button';
import './Legal.css';

const CommunityGuidelines = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-container animate-fade-in">
      <div className="back-button-container">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Volver
        </Button>
      </div>

      <div className="legal-header">
        <div className="legal-icon-wrapper">
          <Users size={32} />
        </div>
        <h1 className="legal-title">Normas de la Comunidad</h1>
        <p className="legal-date">Nuestra guía para una convivencia universitaria ejemplar</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2><Heart size={22} /> 1. Convivencia y Respeto Académico</h2>
          <p>
            UniFeed es una extensión digital de su campus. Mantenga el mismo nivel de respeto que tendría en un aula o auditorio.
          </p>
          <ul>
            <li>No se tolerará el acoso, la discriminación por facultad, ni las campañas de difamación contra compañeros o docentes.</li>
            <li>El "Doxing" (publicar datos privados de otros) resulta en expulsión inmediata.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2><GraduationCap size={22} /> 2. Integridad Académica (Crítico)</h2>
          <p>
            Esta red social apoya el estudio, no la deshonestidad. Está estrictamente prohibido:
          </p>
          <ul>
            <li>La venta o distribución de exámenes, bancos de respuestas o material de evaluación confidencial.</li>
            <li>Promover servicios de realización de tareas o tesis.</li>
            <li>Compartir propiedad intelectual de docentes sin su autorización expresa.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2><Zap size={22} /> 3. Autenticidad y Juego Limpio</h2>
          <p>
            Nuestros algoritmos (Smart Feed y Trends) detectan comportamientos inusuales:
          </p>
          <ul>
            <li><strong>No Bots:</strong> Queda prohibido el uso de software para automatizar publicaciones, likes o seguir usuarios de forma masiva.</li>
            <li><strong>No Shilling:</strong> No utilice la plataforma para spam comercial no relacionado con la vida universitaria.</li>
            <li><strong>Verificación Oficial:</strong> Suplantar cuentas institucionales o alegar ser una autoridad universitaria es una falta grave.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2><ShieldAlert size={22} /> 4. Uso de Medios y Privacidad</h2>
          <p>
            Al subir imágenes o videos, asegúrese de tener los derechos correspondientes. No se permite contenido violento, sexualmente explícito o que incite a actividades ilegales dentro o fuera del campus.
          </p>
        </section>

        <section className="legal-section">
          <h2><Scale size={22} /> 5. Moderación Transparente</h2>
          <p>
            Las faltas se gestionan de forma progresiva. Los administradores registran cada acción para evitar arbitrariedades. Si su contenido es eliminado, recibirá una notificación explicando qué norma fue infringida.
          </p>
        </section>
      </div>
    </div>
  );
};

export default CommunityGuidelines;