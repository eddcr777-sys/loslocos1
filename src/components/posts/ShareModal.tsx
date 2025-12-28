import React from 'react';
import { X, Repeat, Quote } from 'lucide-react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface ShareModalProps {
    postId: string;
    isOpen: boolean;
    onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ postId, isOpen, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleRepost = async () => {
        try {
            const { data: isAdded, error } = await api.toggleRepost(postId);
            
            if (error) {
                alert('Error al procesar repost: ' + error.message);
            } else {
                if (isAdded) {
                    alert('¡Publicación compartida con éxito!');
                } else {
                    alert('Has quitado esta publicación de tus compartidos.');
                }
                onClose();
            }
        } catch (err) {
            console.error('Error en repost:', err);
            alert('Error al procesar repost');
        }
    };

    const handleQuote = () => {
        // Navegar a la página de crear post con el ID del post original
        navigate(`/crear-post?quote=${postId}`);
        onClose();
    };

    return (
        <>
            {/* Overlay */}
            <div 
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    zIndex: 9998,
                    backdropFilter: 'blur(4px)'
                }}
            />
            
            {/* Modal */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'var(--surface-color)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                zIndex: 9999,
                minWidth: '400px',
                maxWidth: '90vw',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border-color)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)'
                    }}>
                        Compartir publicación
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                        <X size={24} color="var(--text-secondary)" />
                    </button>
                </div>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Repost Option */}
                    <button
                        onClick={handleRepost}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1.25rem',
                            border: '2px solid var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--bg-color)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            width: '100%'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--success)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--success-soft)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Repeat size={24} color="var(--success)" />
                        </div>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                            <div style={{
                                fontWeight: '700',
                                fontSize: '1.1rem',
                                color: 'var(--text-primary)',
                                marginBottom: '0.25rem'
                            }}>
                                Repost
                            </div>
                            <div style={{
                                fontSize: '0.9rem',
                                color: 'var(--text-secondary)'
                            }}>
                                Compartir rápidamente en tu perfil
                            </div>
                        </div>
                    </button>

                    {/* Quote Option */}
                    <button
                        onClick={handleQuote}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1.25rem',
                            border: '2px solid var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--bg-color)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            width: '100%'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-color)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--accent-soft)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Quote size={24} color="var(--accent-color)" />
                        </div>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                            <div style={{
                                fontWeight: '700',
                                fontSize: '1.1rem',
                                color: 'var(--text-primary)',
                                marginBottom: '0.25rem'
                            }}>
                                Citar
                            </div>
                            <div style={{
                                fontSize: '0.9rem',
                                color: 'var(--text-secondary)'
                            }}>
                                Añade tu comentario a esta publicación
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </>
    );
};

export default ShareModal;
