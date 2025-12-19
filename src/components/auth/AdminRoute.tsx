import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }: { children: React.ReactElement }) => {
  const { profile, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;
  
  if (!profile || profile.user_type !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default AdminRoute;