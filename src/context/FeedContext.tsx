import React, { createContext, useState, ReactNode, FC, useContext, useEffect, useCallback } from 'react';
import { api, Post } from '../services/api';

interface FeedContextType {
  posts: Post[];
  loading: boolean;
  refreshFeed: () => Promise<void>;
  createPost: (content: string, image: File | null) => Promise<{ error: any }>;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const FeedProvider: FC<{children: ReactNode}> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshFeed = useCallback(async () => {
    setLoading(true);
    const { data } = await api.getPosts();
    if (data) {
      setPosts(data as any);
    }
    setLoading(false);
  }, []);

  const createPost = async (content: string, image: File | null) => {
    let imageUrl = null;
    if (image) {
      const { data, error } = await api.uploadImage(image);
      if (error) return { error };
      imageUrl = data;
    }

    const { error } = await api.createPost(content, imageUrl);
    if (!error) {
      await refreshFeed();
    }
    return { error };
  };

  useEffect(() => {
    refreshFeed();
  }, [refreshFeed]);

  const value = { posts, loading, refreshFeed, createPost };

  return (
    <FeedContext.Provider value={value}>{children}</FeedContext.Provider>
  );
};

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
};