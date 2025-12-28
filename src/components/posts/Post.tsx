import React, { useState } from 'react';
import { api, Post as PostType } from '../../services/api';
import CommentSection from './comments/CommentSection';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PostHeader from './components/PostHeader';
import { usePost } from '../../hooks/usePost';
import ConfirmationModal from '../ui/ConfirmationModal';
import { formatCount } from '../../utils/formatters';
import { Heart, MessageCircle, Share2, Trash2, Megaphone, X, Copy, Repeat } from 'lucide-react';
import './Post.css';
import ShareModal from './ShareModal';
import EmbeddedPost from './EmbeddedPost';
import RepostersHeader from './RepostersHeader';
import Avatar from '../ui/Avatar';


const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

interface PostProps {
  post: PostType;
  onPostDeleted?: () => void;
  showCommentsByDefault?: boolean;
  highlightCommentId?: string;
  onRepost?: (post: PostType) => void; 
  reposters?: { full_name: string }[]; // New prop for aggregation
}

const Post: React.FC<PostProps> = ({ 
  post, 
  onPostDeleted, 
  showCommentsByDefault = false,
  highlightCommentId,
  onRepost,
  reposters
}) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Get user profile with faculty
  React.useEffect(() => {
    if (user) {
      api.getProfile(user.id).then(({ data }) => {
        if (data) setUserProfile(data);
      });
    }
  }, [user]);
  
  const {
    likes,
    commentsCount,
    liked,
    showComments,
    setShowComments,
    handleLike,
    handleCommentsUpdate
  } = usePost(post, user, showCommentsByDefault || !!highlightCommentId);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [userHasReposted, setUserHasReposted] = useState(false);

  // Check if current user has reposted this post
  React.useEffect(() => {
    const checkRepost = async () => {
      if (user && post.id) {
        const { data } = await supabase
          .from('shares')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', (post as any).is_repost_from_shares ? (post as any).original_post_id : post.id)
          .maybeSingle();
        
        setUserHasReposted(!!data);
      }
    };
    checkRepost();
  }, [user, post.id]);

  // LOGIC:
  // Is Repost: Either has original_post AND content is empty/null, OR is_repost_from_shares flag
  // Is Quote: Has original_post AND content is NOT empty
  const isRepost = (post as any).is_repost_from_shares || (post as any).is_repost_wrapper || (post as any).is_repost || (!!post.original_post && !post.content);
  const isQuote = (post as any).is_quote || (!!post.original_post && !!post.content && !(post as any).is_repost_from_shares && !(post as any).is_repost_wrapper);

  // Header Logic for Reposters
  let repostHeader = null;
  
  // Check if current user is in the reposters list
  const repostersData = (post as any)._reposters;
  const currentUserInReposters = repostersData?.some((r: any) => r.user_id === user?.id);
  
  if (currentUserInReposters) {
    // Current user reposted this
    repostHeader = "Lo compartiste";
  } else if (reposters && reposters.length > 0) {
      const names = reposters.map(r => r.full_name);
      if (names.length === 1) {
          repostHeader = `${names[0]} compartió esto`;
      } else if (names.length === 2) {
           repostHeader = `${names[0]} y ${names[1]} compartieron esto`;
      } else {
           repostHeader = `${names[0]} y ${names.length - 1} personas más compartieron esto`;
      }
  } else if (isRepost) {
      // Fallback for old-style reposts
      if (post.user_id === user?.id) {
        repostHeader = "Lo compartiste";
      } else {
        repostHeader = `${post.profiles?.full_name} compartió esto`;
      }
  } else if (userHasReposted && !isRepost) {
    // User has reposted this post (but we're showing the original)
    repostHeader = "Lo compartiste";
  }

  const renderContentWithMentions = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} style={{ color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer' }}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const handleConfirmDelete = async () => {
    setIsDeleteModalOpen(false);
    // Use soft delete if available, otherwise fallback to hard delete (though we prefer soft)
    // The user requirement says: "mostrar un placeholder de 'Este contenido ya no está disponible'"
    // So we should assume standard delete might have integrity issues if not cascading, 
    // but we implemented Soft Delete RPC.
    const { error } = await api.softDeletePost(post.id); 
    if (error) {
      alert('Error al eliminar la publicación: ' + error.message);
    } else {
      if (onPostDeleted) onPostDeleted();
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShareModalOpen(true);
  };
  
  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    setIsShareModalOpen(false);
    alert('Enlace copiado al portapapeles');
    api.sharePost(post.id); 
  };

  const handleRepostAction = async () => {
    setIsShareModalOpen(false);
    
    // Tik Tok / IG Style: Toggle logic
    const { data: isAdded, error } = await api.toggleRepost(post.id);
    
    if (error) {
        alert("Error al procesar repost: " + error.message);
    } else {
        if (isAdded) {
            alert("¡Publicación compartida con éxito!");
        } else {
            alert("Has quitado esta publicación de tus compartidos.");
        }
        // If we are on Profile Shared tab, we might want to refresh.
        // For now, simple alert is standard for this architecture.
    }
  };

  const handleQuoteAction = () => {
    setIsShareModalOpen(false);
    if (onRepost) {
        onRepost(post); 
    } else {
        alert("Función de citar disponible pronto en el feed principal.");
    }
  };

  return (
    <>
      <Card className="post-card">
        {/* Banner de Repost / Compartido (Diseño Compacto) */}
        {(post as any)._reposters && (post as any)._reposters.length > 0 ? (
          <RepostersHeader 
            repostersData={(post as any)._reposters}
            currentUserFaculty={userProfile?.faculty}
            currentUserId={user?.id}
            isTrending={(post as any)._is_trending}
            trendingPeriod={(post as any)._trending_period}
          />
        ) : repostHeader ? (
             <div style={{ 
               padding: '0.5rem 0.75rem', 
               display: 'flex', 
               alignItems: 'center', 
               gap: '0.5rem', 
               color: 'var(--text-secondary)', 
               fontSize: '0.85rem', 
               fontWeight: 700,
               borderBottom: '1px solid var(--border-color)',
               backgroundColor: 'var(--surface-color)',
               borderTopLeftRadius: 'var(--radius-xl)',
               borderTopRightRadius: 'var(--radius-xl)'
             }}>
                <Repeat size={14} strokeWidth={3} color="var(--success)" style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', overflow: 'hidden' }}>
                    {isRepost && post.profiles?.avatar_url && (
                        <Avatar src={post.profiles.avatar_url} size="small" style={{ width: '20px', height: '20px', border: '1px solid var(--success)' }} />
                    )}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {repostHeader}
                    </span>
                </div>
             </div>
        ) : null}
        
        <div className="post-padded-content">
          <div className="post-header-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             {/* If it's a Repost, we show the ORIGINAL post's author in the main header slot, or do we show the Reposter? 
                 Standard: Reposter is usually at top (implemented above). 
                 So here inside the card we show the ORIGINAL post author if it is a repost. 
                 If it is a normal post/quote, we show the post author. 
             */}
             
            <PostHeader 
              userId={isRepost ? (post.original_post?.profiles?.id || post.user_id) : post.user_id}
              avatarUrl={isRepost ? (post.original_post?.profiles?.avatar_url || DEFAULT_AVATAR) : (post.profiles?.avatar_url || DEFAULT_AVATAR)}
              fullName={isRepost ? (post.original_post?.profiles?.full_name || "Usuario") : (post.profiles?.full_name || "Usuario")}
              userType={isRepost ? post.original_post?.profiles?.user_type : post.profiles?.user_type}
              createdAt={isRepost ? (post.original_post?.created_at || post.created_at) : post.created_at}
            />

            {/* Delete button only if CURRENT user owns the actual entry. 
                If Repost: post.user_id is current user.
                If Normal: post.user_id is current user.
            */}
            {user?.id === post.user_id && (
              <Button variant="ghost" size="small" onClick={() => setIsDeleteModalOpen(true)} style={{ padding: '8px', color: '#ef4444' }} title="Eliminar publicación">
                <Trash2 size={18} />
              </Button>
            )}
          </div>

          <div className="post-content-text">
            {post.is_official && !isRepost && (
              <span className="official-post-badge" style={{ 
                display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--success-soft)', 
                color: 'var(--success)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-full)', 
                fontSize: '0.75rem', fontWeight: '800', marginBottom: '1rem', border: '1px solid var(--success)', letterSpacing: '0.05em'
              }}>
                <Megaphone size={14} /> AVISO OFICIAL
              </span>
            )}

            {/* Main Content Logic */}
            <div style={{ marginBottom: '1rem' }}>
                {isRepost 
                    ? renderContentWithMentions(post.original_post!.content) 
                    : renderContentWithMentions(post.content)
                }
            </div>

            {/* QUOTE UI */}
            {isQuote && post.original_post_id && (
                <div style={{ marginTop: '1rem' }}>
                    <EmbeddedPost 
                        post={post.original_post || null}
                        isDeleted={!post.original_post || !!post.original_post.deleted_at}
                    />
                </div>
            )}
          </div>
        </div>

        {/* Image for Repost (Original Image) or Normal Post */}
        {(isRepost ? post.original_post?.image_url : post.image_url) && !isQuote && (
          <img 
            src={isRepost ? post.original_post!.image_url! : post.image_url!} 
            alt="Contenido del post" 
            className="post-image" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsLightboxOpen(true); }}
            style={{ cursor: 'zoom-in', width: '100%', display: 'block' }}
          />
        )}

        <div className="post-actions" style={{ display: 'flex', padding: '0.5rem', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)' }}>
          <div className="action-item" onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: liked ? 'var(--error)' : 'var(--text-secondary)', fontSize: '0.95rem', cursor: 'pointer', padding: '0.75rem', borderRadius: 'var(--radius-md)', flex: 1, justifyContent: 'center', transition: 'all 0.2s ease' }}>
            <Heart size={22} fill={liked ? "var(--error)" : "none"} />
            <span style={{ fontWeight: '600' }}>{formatCount(likes)}</span>
          </div>
          <div className="action-item" onClick={() => setShowComments(!showComments)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem', cursor: 'pointer', padding: '0.75rem', borderRadius: 'var(--radius-md)', flex: 1, justifyContent: 'center', transition: 'all 0.2s ease' }}>
            <MessageCircle size={22} />
            <span style={{ fontWeight: '600' }}>{formatCount(commentsCount)}</span>
          </div>
          <div className="action-item" onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem', cursor: 'pointer', padding: '0.75rem', borderRadius: 'var(--radius-md)', flex: 1, justifyContent: 'center', transition: 'all 0.2s ease' }}>
            <Share2 size={22} />
            <span style={{ fontWeight: '600' }}>Compartir</span>
          </div>
        </div>


      {showComments && (
        <CommentSection 
          postId={post.id} 
          postOwnerId={post.user_id} 
          onCommentsChange={handleCommentsUpdate}
          highlightCommentId={highlightCommentId}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar publicación"
        message="¿Estás seguro de que quieres eliminar esta publicación?"
      />
    </Card>

    {isShareModalOpen && (
        <div style={{
            position: 'fixed', bottom: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }} onClick={() => setIsShareModalOpen(false)}>
            <div style={{
                background: 'var(--bg-color)', width: '100%', maxWidth: '500px',
                borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                padding: '2rem', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: 'var(--shadow-xl)'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ width: '40px', height: '4px', background: 'var(--border-color)', borderRadius: '2px', margin: '-1rem auto 1.5rem', opacity: 0.5 }}></div>
                <h3 style={{ margin: '0 0 1.5rem', textAlign: 'center', fontSize: '1.1rem' }}>Compartir</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                     {/* COPY LINK */}
                     <div onClick={handleCopyLink} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '56px', height: '56px', background: 'var(--surface-color)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                            <Copy size={24} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Copiar Link</span>
                    </div>

                    {/* REPOST */}
                     <div onClick={handleRepostAction} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '56px', height: '56px', background: 'var(--surface-color)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', fontSize: '1.2rem', color: 'var(--success)' }}>
                            <Repeat size={24} />
                        </div>
                         <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Republicar</span>
                    </div>

                    {/* QUOTE */}
                     <div onClick={handleQuoteAction} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '56px', height: '56px', background: 'var(--surface-color)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', fontSize: '1.2rem', color: 'var(--accent-color)' }}>
                            <MessageCircle size={24} />
                        </div>
                         <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Citar</span>
                    </div>
                </div>
            </div>
        </div>
    )}

    {isLightboxOpen && (
         <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.95)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out', padding: '1rem' }}
          onClick={() => setIsLightboxOpen(false)}
        >
          <img 
            src={isRepost ? post.original_post!.image_url! : post.image_url!} 
            alt="Vista completa" 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} 
           />
           <button style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
               <X size={24} />
           </button>
        </div>
      )}
    </>
  );
};

export default Post;
