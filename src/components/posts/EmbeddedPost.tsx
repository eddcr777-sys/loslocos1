import React from 'react';
import Avatar from '../ui/Avatar';
import VerificationBadge from '../ui/VerificationBadge';
import { AlertCircle } from 'lucide-react';
import { Post as PostType } from '../../services/api';

interface EmbeddedPostProps {
    post: PostType | null;
    isDeleted?: boolean;
}

const EmbeddedPost: React.FC<EmbeddedPostProps> = ({ post, isDeleted }) => {
    // Si el post fue borrado o no existe
    if (!post || isDeleted || post.deleted_at) {
        return (
            <div style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                backgroundColor: 'var(--surface-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                opacity: 0.7
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--error-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <AlertCircle size={24} color="var(--error)" />
                </div>
                <div style={{
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                }}>
                    <div style={{
                        fontWeight: '600',
                        fontSize: '1rem',
                        marginBottom: '0.25rem'
                    }}>
                        Contenido no disponible
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>
                        Esta publicación fue eliminada
                    </div>
                </div>
            </div>
        );
    }

    // Post normal embebido
    return (
        <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            backgroundColor: 'var(--bg-color)',
            cursor: 'pointer',
            transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-color)';
        }}
        onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/post/${post.id}`;
        }}
        >
            {/* Header del post embebido */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
            }}>
                <Avatar 
                    src={post.profiles?.avatar_url} 
                    size="small"
                    style={{ width: '32px', height: '32px' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {post.profiles?.full_name || 'Usuario'}
                        </span>
                        {post.profiles?.user_type && (
                            <VerificationBadge type={post.profiles.user_type} size={14} />
                        )}
                    </div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)'
                    }}>
                        {new Date(post.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        })}
                    </div>
                </div>
            </div>

            {/* Contenido del post */}
            {post.content && (
                <p style={{
                    margin: '0 0 0.75rem 0',
                    fontSize: '0.95rem',
                    lineHeight: '1.5',
                    color: 'var(--text-primary)',
                    wordBreak: 'break-word'
                }}>
                    {post.content.length > 200 
                        ? post.content.substring(0, 200) + '...' 
                        : post.content
                    }
                </p>
            )}

            {/* Imagen si existe */}
            {post.image_url && (
                <img
                    src={post.image_url}
                    alt="Post content"
                    style={{
                        width: '100%',
                        maxHeight: '200px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-md)',
                        marginTop: '0.5rem'
                    }}
                />
            )}
        </div>
    );
};

export default EmbeddedPost;
