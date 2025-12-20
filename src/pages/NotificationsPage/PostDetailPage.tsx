import React from 'react';
import { useParams } from 'react-router-dom';

const PostDetailPage = () => {
  const { postId } = useParams();

  return (
    <div style={{ padding: '2rem', background: 'white', borderRadius: '12px', maxWidth: '700px', margin: '0 auto' }}>
      <h1>Detalle de la Publicación</h1>
      <p>Mostrando detalles para el post con ID: <strong>{postId}</strong></p>
      <p>Aquí se cargaría y mostraría la publicación completa con sus comentarios.</p>
    </div>
  );
};

export default PostDetailPage;