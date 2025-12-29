import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, CheckCircle, AlertTriangle, UserX, ShieldCheck, Scale, Globe } from 'lucide-react';
import Button from '../../components/ui/Button';
import './Legal.css';

const TermsOfService = () => {
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
          <FileText size={32} />
        </div>
        <h1 className="legal-title">Términos y Condiciones</h1>
        <p className="legal-date">Última actualización: 29 de Diciembre, 2025</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2><CheckCircle size={22} /> 1. Vínculo Contractual</h2>
          <p>
            Al registrarse o utilizar UniFeed, usted celebra un contrato legalmente vinculante. Este servicio es operado para la comunidad universitaria y su uso implica la aceptación total de estas condiciones. Si actúa en representación de una organización institucional, garantiza que tiene la autoridad para vincular a dicha entidad a estos términos.
          </p>
        </section>

        <section className="legal-section">
          <h2><ShieldCheck size={22} /> 2. Elegibilidad Institucional</h2>
          <p>
            El acceso está restringido estrictamente a miembros verificados de la comunidad académica (estudiantes, docentes, egresados y personal administrativo). 
          </p>
          <ul>
            <li><strong>Autenticidad:</strong> Debe utilizar su identidad real. El uso de pseudónimos que induzcan a error sobre su identidad académica está prohibido.</li>
            <li><strong>Actualización de Perfil:</strong> Por motivos de integridad y seguridad, los cambios en campos críticos (Nombre, Usuario, Facultad) están limitados por sistema a una vez cada 30 días.</li>
            <li><strong>Cuentas Institucionales:</strong> Las cuentas con insignias de verificación oficial tienen una responsabilidad mayor y sus publicaciones pueden considerarse comunicados institucionales.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2><AlertTriangle size={22} /> 3. Propiedad Intelectual y Licencias</h2>
          <p>Usted es el dueño de su contenido, pero nos otorga permisos para hacerlo funcionar:</p>
          <ul>
            <li><strong>Licencia de Usuario:</strong> Al publicar contenido (texto, imágenes), otorga a UniFeed una licencia gratuita, mundial y no exclusiva para alojar, mostrar y distribuir dicho contenido para el funcionamiento normal de la plataforma.</li>
            <li><strong>Respeto al Autor:</strong> Queda prohibido compartir material bibliográfico, exámenes o guías protegidas por derechos de autor de la universidad sin la debida autorización.</li>
            <li><strong>Propiedad de la Plataforma:</strong> El software, diseño y los algoritmos de recomendación son propiedad exclusiva de UniFeed.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2><Scale size={22} /> 4. Moderación y Administración</h2>
          <p>
            Para garantizar un ambiente seguro, contamos con herramientas de administración:
          </p>
          <ul>
            <li><strong>Logs de Auditoría:</strong> Todas las acciones administrativas (moderación de posts, cambios de rol) quedan registradas internamente para asegurar la transparencia.</li>
            <li><strong>Derecho de Remoción:</strong> Nos reservamos el derecho de eliminar cualquier contenido que viole las Normas de la Comunidad o la integridad académica.</li>
            <li><strong>Suspensión:</strong> El incumplimiento grave de estos términos resultará en la inhabilitación permanente de su acceso mediante correo institucional.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2><Globe size={22} /> 5. Descargo de Responsabilidad</h2>
          <p>
            UniFeed no se hace responsable de las opiniones vertidas por los usuarios. La plataforma se proporciona "tal cual". No garantizamos que los archivos subidos estén libres de errores. La veracidad de la información académica compartida es responsabilidad exclusiva de quien la publica.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;