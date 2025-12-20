import React from 'react';
import Card from './Card';
import Button from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <Card style={{ maxWidth: '400px', width: '90%', margin: '0 1rem', padding: 0 }}>
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>{title}</h3>
          <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>{message}</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={onConfirm}
              style={{ backgroundColor: '#ef4444', color: 'white', border: 'none' }}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmationModal;