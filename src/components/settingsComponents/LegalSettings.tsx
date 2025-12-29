import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Shield, Users, ExternalLink, Info } from 'lucide-react';
import SettingsCard from './ui/SettingsCard';
import './SettingsPage.css';

const LegalSettings = () => {
  const navigate = useNavigate();

  const legalLinks = [
    {
      title: 'Términos y Condiciones',
      description: 'Lee los términos legales de uso de UniFeed.',
      icon: <FileText size={20} />,
      path: '/legal/terms'
    },
    {
      title: 'Política de Privacidad',
      description: 'Cómo protegemos y manejamos tus datos personales.',
      icon: <Shield size={20} />,
      path: '/legal/privacy'
    },
    {
      title: 'Normas de la Comunidad',
      description: 'Nuestra guía para una convivencia sana y respetuosa.',
      icon: <Users size={20} />,
      path: '/legal/guidelines'
    }
  ];

  return (
    <div className="settings-section animate-fade-in">
      <div className="settings-section-header">
        <h2>Legal e Información</h2>
        <p>Consulta nuestras políticas, términos y normas de convivencia.</p>
      </div>

      <div className="legal-settings-list">
        {legalLinks.map((link, index) => (
          <SettingsCard 
            key={index} 
            title={link.title}
            description={link.description}
            icon={link.icon}
            className="legal-card-item"
            onClick={() => navigate(link.path)}
          >
            <div className="legal-item-content">
              <div className="legal-item-info">
              </div>
              <ExternalLink size={18} className="external-icon" />
            </div>
          </SettingsCard>
        ))}
      </div>

      <div className="settings-info-box">
        <Info size={20} />
        <div>
          <h4>Versión de la Aplicación</h4>
          <p>UniFeed v2.4.0 (Build 2025.12.29)</p>
          <p className="copyright">© 2025 UniFeed. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default LegalSettings;
