import React from 'react';

interface SettingsCardProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    variant?: 'default' | 'danger';
    className?: string;
    onClick?: () => void;
}

const SettingsCard: React.FC<SettingsCardProps> = ({ 
    title, 
    description, 
    icon, 
    children, 
    variant = 'default',
    className = '',
    onClick
}) => {
    return (
        <div 
            className={`settings-card ${variant} ${className} ${onClick ? 'clickable' : ''}`}
            onClick={onClick}
        >
            <div className="settings-card-header">
                {icon && <div className="settings-card-icon">{icon}</div>}
                <div className="settings-card-info">
                    <h3>{title}</h3>
                    {description && <p>{description}</p>}
                </div>
            </div>
            <div className="settings-card-content">
                {children}
            </div>
        </div>
    );
};

export default SettingsCard;
