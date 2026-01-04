import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import VerificationBadge from '../../components/ui/VerificationBadge';
import Post from '../../components/posts/Post';
import { useFeed } from '../../context/FeedContext';
import { Users, FileText } from 'lucide-react';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [postResults, setPostResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'people' | 'posts'>('people');
  const { refreshFeed } = useFeed();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        if (activeTab === 'people') {
          const { data } = await api.searchUsers(query);
          if (data) setUserResults(data);
          setPostResults([]);
        } else {
          const { data } = await api.searchPosts(query);
          if (data) setPostResults(data);
          setUserResults([]);
        }
        setLoading(false);
      } else {
        setUserResults([]);
        setPostResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, activeTab]);

  return (
    <div className="search-page-container">
      <style>{`
        .search-page-container {
          padding: 1rem;
          max-width: 600px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .search-page-container {
            padding: 1rem 0;
          }
          .search-page-container h1,
          .search-page-container .search-input-wrapper {
            padding: 0 1rem;
          }
          .user-search-card {
            border-left: none !important;
            border-right: none !important;
            border-radius: 0 !important;
          }
        }
        .search-tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            border-bottom: 1px solid var(--border-color);
            padding: 0 1rem;
        }
        .search-tab {
            padding: 0.75rem 1rem;
            cursor: pointer;
            color: var(--text-secondary);
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
            border-bottom: 2px solid transparent;
        }
        .search-tab.active {
            color: var(--accent-color);
            border-bottom-color: var(--accent-color);
        }
      `}</style>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontWeight: '800' }}>Explorar</h1>
      <div className="search-input-wrapper">
      <input
        type="text"
        placeholder={activeTab === 'people' ? "Buscar personas..." : "Buscar publicaciones..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 20px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-color)',
          background: 'var(--surface-color)',
          color: 'var(--text-primary)',
          fontSize: '1rem',
          marginBottom: '1.5rem',
          outline: 'none',
          boxSizing: 'border-box',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s ease'
        }}
      />
      </div>

      <div className="search-tabs">
        <div 
            className={`search-tab ${activeTab === 'people' ? 'active' : ''}`}
            onClick={() => setActiveTab('people')}
        >
            <Users size={18} />
            Personas
        </div>
        <div 
            className={`search-tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
        >
            <FileText size={18} />
            Publicaciones
        </div>
      </div>

      {!loading && query.length > 1 && userResults.length === 0 && postResults.length === 0 && (
        <p style={{ color: 'var(--text-secondary)', padding: '0 1rem' }}>No se encontraron resultados.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {activeTab === 'people' ? (
            userResults.map((user) => (
                <Link to={`/profile/${user.id}`} key={user.id} style={{ textDecoration: 'none' }}>
                    <Card style={{ marginBottom: 0, padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s ease' }} className="user-search-card">
                    <Avatar src={user.avatar_url} size="medium" />
                    <div>
                        <strong style={{ display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}>
                        {user.full_name}
                        <VerificationBadge type={user.user_type} />
                        </strong>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Ver perfil</span>
                    </div>
                    </Card>
                </Link>
            ))
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {postResults.map((post) => (
                    <Post 
                        key={post.id} 
                        post={post} 
                        onPostDeleted={() => {
                            setPostResults(prev => prev.filter(p => p.id !== post.id));
                            refreshFeed();
                        }}
                    />
                ))}
            </div>
        )}
      </div>
    </div>

  );
};

export default SearchPage;
