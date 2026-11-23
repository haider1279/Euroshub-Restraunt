import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageSpinner } from '../ui/Spinner';

export const RequireAdmin: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageSpinner label="Checking your session" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/account" replace />;
  }

  return <>{children ? children : <Outlet />}</>;
};
