import React from 'react';

interface PostContentProps {
  content?: string;
  imageUrl?: string | null;
}

const PostContent: React.FC<PostContentProps> = ({ content, imageUrl }) => {
  return (
    <>
      {content && (
        <div className="post-padded-content">
          <div className="post-content-text">
            <p>{content}</p>
          </div>
        </div>
      )}

      {imageUrl && (
        <img 
          src={imageUrl} 
          alt="Contenido de la publicación" 
          className="post-image" 
        />
      )}
    </>
  );
};

export default PostContent;