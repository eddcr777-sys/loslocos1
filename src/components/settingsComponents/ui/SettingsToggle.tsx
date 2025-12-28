import React from 'react';

interface SettingsToggleProps {
    title: string;
    description?: string;
    checked: boolean;
    onChange: () => void;
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({ title, description, checked, onChange }) => {
    return (
        <div className="settings-toggle-row" onClick={onChange}>
            <div className="settings-toggle-info">
                <h4>{title}</h4>
                {description && <p>{description}</p>}
            </div>
            <div className={`settings-toggle-button ${checked ? 'active' : ''}`}>
                <div className="settings-toggle-handle"></div>
            </div>
        </div>
    );
};

export default SettingsToggle;
