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
      <h1 className="search-title">Explorar</h1>
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Buscar personas o grupos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {loading && <p className="search-status">Buscando...</p>}

      {!loading && results.length === 0 && query.length > 1 && (
        <p className="search-status">No se encontraron usuarios.</p>
      )}

      <div className="search-results">
        {results.map((user) => (
          <Link to={`/profile/${user.id}`} key={user.id} className="search-result-link">
            <Card className="search-result-card">
              <Avatar src={user.avatar_url} size="medium" />
              <div className="search-result-info">
                <strong className="search-result-name">
                  {user.full_name}
                  <VerificationBadge type={user.user_type} />
                </strong>
                <span className="search-result-meta">Ver perfil</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <style>{`
        .search-page-container {
          padding: 1rem;
          max-width: 600px;
          margin: 0 auto;
          animation: fadeIn 0.4s ease-out;
        }
        .search-title {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 2rem;
          color: var(--text-primary);
        }
        .search-input-wrapper {
          position: relative;
          margin-bottom: 2rem;
        }
        .search-input {
          width: 100%;
          padding: 1rem 1.5rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
          background: var(--surface-color);
          color: var(--text-primary);
          font-size: 1rem;
          outline: none;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-sm);
        }
        .search-input:focus {
          border-color: var(--accent-color);
          box-shadow: 0 0 0 4px var(--accent-soft);
          transform: translateY(-2px);
        }
        .search-status {
          color: var(--text-secondary);
          text-align: center;
          margin: 2rem 0;
        }
        .search-results {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .search-result-link {
          text-decoration: none;
        }
        .search-result-card {
          padding: 1rem !important;
          display: flex !important;
          align-items: center !important;
          gap: 1rem !important;
          transition: all 0.2s ease !important;
          border: 1px solid var(--border-color) !important;
        }
        .search-result-card:hover {
          background: var(--surface-hover) !important;
          transform: scale(1.02);
          border-color: var(--accent-color) !important;
        }
        .search-result-info {
          display: flex;
          flex-direction: column;
        }
        .search-result-name {
          display: flex;
          align-items: center;
          color: var(--text-primary);
          font-size: 1.05rem;
          gap: 4px;
        }
        .search-result-meta {
          color: var(--text-secondary);
          font-size: 0.85rem;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};


export default SearchPage;
