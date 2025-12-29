import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Lock, Eye, Database, Share2, UserCheck, HardDrive } from 'lucide-react';
import Button from '../../components/ui/Button';
import './Legal.css';

const PrivacyPolicy = () => {
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
          <Shield size={32} />
        </div>
        <h1 className="legal-title">Política de Privacidad</h1>
        <p className="legal-date">Última actualización: 29 de Diciembre, 2025</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2><Database size={22} /> 1. Datos que Procesamos</h2>
          <p>
            UniFeed recopila datos esenciales para validar su estatus universitario y personalizar su experiencia:
          </p>
          <ul>
            <li><strong>Identidad Académica:</strong> Nombre completo, correo institucional (@universidad.edu), facultad y carrera.</li>
            <li><strong>Interacciones Sociales:</strong> Publicaciones, comentarios, 'likes', y a quién sigue. Esto se procesa mediante nuestro algoritmo de 'Smart Feed' para mostrarle contenido relevante.</li>
            <li><strong>Datos Técnicos:</strong> Dirección IP, registros de acceso (logs) y metadatos de las imágenes que sube a nuestros servidores.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2><Eye size={22} /> 2. Finalidad y Bases Legales</h2>
          <p>Tratamos su información basándonos en la ejecución del servicio y el interés legítimo de la comunidad:</p>
          <ul>
            <li><strong>Autenticidad:</strong> Para asegurar que solo miembros reales de la universidad participen.</li>
            <li><strong>Seguridad:</strong> Los administradores tienen acceso a logs de actividad para investigar reportes de acoso o fraude.</li>
            <li><strong>Personalización:</strong> Analizamos sus interacciones para mejorar el alcance de sus publicaciones mediante tendencias y algoritmos.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2><HardDrive size={22} /> 3. Almacenamiento y Proveedores</h2>
          <p>
            Sus datos no se venden a terceros. Utilizamos <strong>Supabase</strong> como nuestro proveedor principal de infraestructura de base de datos y almacenamiento de archivos, bajo estrictos estándares de cifrado y seguridad. Los archivos (fotos de perfil y posts) se alojan en 'buckets' protegidos con políticas de acceso granulares.
          </p>
        </section>

        <section className="legal-section">
          <h2><UserCheck size={22} /> 4. Sus Derechos y Control</h2>
          <p>
            Usted tiene el control total sobre su información:
          </p>
          <ul>
            <li><strong>Acceso y Rectificación:</strong> Puede editar su perfil en cualquier momento, sujeto a la limitación de 30 días para campos críticos como medida antifraude.</li>
            <li><strong>Eliminación Definitiva:</strong> Ofrecemos una función de "Eliminar Cuenta" que borra de forma permanente su perfil y datos asociados de nuestra base de datos activa.</li>
            <li><strong>Portabilidad:</strong> Puede solicitar un resumen de sus datos de actividad contactando al soporte técnico.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2><Lock size={22} /> 5. Seguridad de las Comunicaciones</h2>
          <p>
            Toda la transmisión de datos se realiza bajo el protocolo HTTPS/TLS. Recomendamos no compartir información sensible (contraseñas externas, datos financieros) dentro de las publicaciones o comentarios públicos.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;