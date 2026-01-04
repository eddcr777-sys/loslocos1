import React, { useState, useEffect } from 'react';
import Avatar from '../ui/Avatar';
import VerificationBadge from '../ui/VerificationBadge';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Post as PostType, api } from '../../services/api';

interface EmbeddedPostProps {
    post: PostType | null;
    originalPostId?: string; // New: Accept ID to fetch if post is missing
    isDeleted?: boolean;
}

const EmbeddedPost: React.FC<EmbeddedPostProps> = ({ post: initialPost, originalPostId, isDeleted: initialIsDeleted }) => {
    const [post, setPost] = useState<PostType | null>(initialPost || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    // Sync prop changes
    useEffect(() => {
        if (initialPost) {
            setPost(initialPost);
        }
    }, [initialPost]);

    // Self-Healing: Fetch data if missing but ID is available
    useEffect(() => {
        let isMounted = true;
        const loadPost = async () => {
            if (!post && !initialPost && originalPostId) {
                setLoading(true);
                try {
                    console.log('🔄 Lazy Loading EmbeddedPost:', originalPostId);
                    const { data, error } = await api.getPost(originalPostId);
                    if (isMounted) {
                        if (data) {
                            console.log('✅ Lazy Load Success:', data.id);
                            setPost(data);
                        } else {
                            console.warn('⚠️ Lazy Load Failed:', error); // RLS or truly deleted
                            setError(true);
                        }
                    }
                } catch (err) {
                    console.error('❌ Lazy Load Error:', err);
                    if (isMounted) setError(true);
                } finally {
                    if (isMounted) setLoading(false);
                }
            }
        };

        // Only try to fetch if we have NO data, but we DO have an ID
        if ((!post && !initialPost) && originalPostId) {
            loadPost();
        }
    }, [originalPostId, post, initialPost]);

    if (loading) {
        return (
            <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'var(--bg-color)',
                opacity: 0.6
            }}>
                <Loader2 size={24} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    const isDeleted = initialIsDeleted || error || (post && post.deleted_at);

    // If completely missing or deleted
    if (!post || isDeleted) {
        return (
            <div style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                backgroundColor: 'var(--surface-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: 0.7
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--error-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <AlertCircle size={20} color="var(--error)" />
                </div>
                <div style={{
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                }}>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                        Contenido no disponible
                    </div>
                    {/* Only show "deleted" message if we actually know it was deleted, otherwise it might just be loading error */}
                    {isDeleted && (
                        <div style={{ fontSize: '0.875rem' }}>
                            Esta publicación no está disponible
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Normal Render
    return (
        <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            backgroundColor: 'var(--bg-color)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
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
            {/* Header */}
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

            {/* Content */}
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

            {/* Image */}
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
