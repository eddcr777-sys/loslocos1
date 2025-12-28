import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Sparkles, X } from 'lucide-react';
import Button from '../ui/Button';

const WelcomeModal = () => {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (user) {
            checkWelcomeStatus();
        }
    }, [user]);

    const checkWelcomeStatus = async () => {
        const { data } = await api.getSettings(user!.id);
        if (data && data.has_seen_welcome === false) {
            setIsVisible(true);
        }
    };

    const handleClose = async () => {
        setIsVisible(false);
        if (user) {
            await api.updateSettings(user.id, { has_seen_welcome: true });
        }
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div className="animate-fade-in" style={{
                background: 'var(--surface-color)',
                width: '90%',
                maxWidth: '500px',
                borderRadius: '24px',
                padding: '2rem',
                textAlign: 'center',
                position: 'relative',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    color: 'white'
                }}>
                    <Sparkles size={40} />
                </div>
                
                <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    ¡Bienvenido a UniFeed!
                </h2>
                
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2rem' }}>
                    Nos alegra tenerte aquí. UniFeed es tu espacio para conectar con tu comunidad universitaria, compartir ideas y estar al día con todo lo que sucede en el campus.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Button onClick={handleClose} size="large" fullWidth>
                        ¡Empezar a explorar!
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeModal;
