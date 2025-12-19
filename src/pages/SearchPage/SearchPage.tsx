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
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Explorar</h1>
      <input
        type="text"
        placeholder="Buscar personas..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '999px',
          border: '1px solid #e2e8f0',
          fontSize: '1rem',
          marginBottom: '2rem',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />

      {loading && <p style={{ color: '#64748b' }}>Buscando...</p>}

      {!loading && results.length === 0 && query.length > 1 && (
        <p style={{ color: '#64748b' }}>No se encontraron usuarios.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {results.map((user) => (
          <Link to={`/profile/${user.id}`} key={user.id} style={{ textDecoration: 'none' }}>
            <Card style={{ marginBottom: 0, padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Avatar src={user.avatar_url} size="medium" />
              <div>
                <strong style={{ display: 'flex', alignItems: 'center', color: '#0f172a' }}>
                  {user.full_name}
                  <VerificationBadge type={user.user_type} />
                </strong>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Ver perfil</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SearchPage;
