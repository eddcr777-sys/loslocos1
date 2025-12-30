import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './SubPageHeader.css';

interface SubPageHeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

const SubPageHeader: React.FC<SubPageHeaderProps> = ({ 
  title, 
  onBack, 
  showBackButton = true 
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="subpage-header">
      <div className="subpage-header-content">
        {showBackButton && (
          <button onClick={handleBack} className="subpage-back-button" aria-label="Volver">
            <ArrowLeft size={24} />
          </button>
        )}
        <h1 className="header-title">{title}</h1>
      </div>
    </div>
  );
};

export default SubPageHeader;
