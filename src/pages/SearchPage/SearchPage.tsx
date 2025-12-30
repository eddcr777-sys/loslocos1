import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import VerificationBadge from '../../components/ui/VerificationBadge';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 1) {
        setLoading(true);
        const { data } = await api.searchUsers(query);
        if (data) setResults(data);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

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
      `}</style>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontWeight: '800' }}>Explorar</h1>
      <div className="search-input-wrapper">
      <input
        type="text"
        placeholder="Buscar personas..."
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
          marginBottom: '2rem',
          outline: 'none',
          boxSizing: 'border-box',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s ease'
        }}
      />
      </div>

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Buscando...</p>}

      {!loading && results.length === 0 && query.length > 1 && (
        <p style={{ color: 'var(--text-secondary)' }}>No se encontraron usuarios.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {results.map((user) => (
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
        ))}
      </div>
    </div>

  );
};

export default SearchPage;
