import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children, type }: { children: React.ReactElement, type: 'any' | 'admin' | 'inst' }) => {
  const { profile, loading, isAdmin, isInstitutional } = useAuth();

  if (loading) return <div>Cargando...</div>;
  
  if (!profile) return <Navigate to="/home" replace />;

  if (type === 'admin' && !isAdmin) return <Navigate to="/home" replace />;
  if (type === 'inst' && !isInstitutional) return <Navigate to="/home" replace />;
  if (type === 'any' && !isAdmin && !isInstitutional) return <Navigate to="/home" replace />;

  return children;
};

export default AdminRoute;