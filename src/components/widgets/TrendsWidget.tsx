import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import { Link } from 'react-router-dom';


const TrendsWidget = () => {
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        loadTrends();
    }, []);

    const loadTrends = async () => {
        // En una app real, esto traería los posts con más likes de las últimas 24h
        const { data } = await api.getTrendingPosts(); 
        if (data) setPosts(data.slice(0, 3)); // Mostrar top 3 recientes como "Tendencia"
    };

    return (
        <div style={{ width: '100%', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: 800, color: '#64748b' }}>Tendencias para ti</h3>
            <Card style={{ padding: '0' }}>
                {posts.length === 0 && <p style={{ padding: '15px', color: '#64748b' }}>No hay tendencias aún.</p>}
                
                {posts.map((post, index) => (
                    <Link key={post.id} to={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                        
                     <div style={{ 
                         padding: '15px', 
                         borderBottom: index < posts.length - 1 ? '1px solid #e2e8f0' : 'none',
                         cursor: 'pointer'
                     }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                             <Avatar src={post.profiles?.avatar_url} size="small" />
                             <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{post.profiles?.full_name}</span>
                        </div>
                        <p style={{ 
                            fontSize: '0.9rem', 
                            color: '#334155', 
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {post.content}
                        </p>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '5px', display: 'block' }}>
                            {post.likes && post.likes[0]?.count ? `${post.likes[0].count} likes` : 'Nuevo'}
                        </span>
                     </div>
                    </Link>
                ))}
            </Card>
        </div>
    );
};

export default TrendsWidget;
