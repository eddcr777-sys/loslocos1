import React from 'react';

interface SettingsInputProps {
    label: string;
    description?: string;
    type?: string;
    name?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    placeholder?: string;
    multiline?: boolean;
    error?: string;
}

const SettingsInput: React.FC<SettingsInputProps> = ({ 
    label, 
    description, 
    type = 'text', 
    name, 
    value, 
    onChange, 
    placeholder, 
    multiline = false,
    error 
}) => {
    return (
        <div className="settings-input-group">
            <label className="settings-input-label">{label}</label>
            {description && <p className="settings-input-description">{description}</p>}
            
            {multiline ? (
                <textarea 
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`settings-input-field textarea ${error ? 'error' : ''}`}
                />
            ) : (
                <input 
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`settings-input-field ${error ? 'error' : ''}`}
                />
            )}
            
            {error && <span className="settings-input-error">{error}</span>}
        </div>
    );
};

export default SettingsInput;
