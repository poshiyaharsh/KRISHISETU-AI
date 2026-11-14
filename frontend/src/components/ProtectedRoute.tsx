import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { KrishiLoader } from '@/components/Loader/KrishiLoader';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-16">
        <KrishiLoader />
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectParam}`} replace />;
  }

  return <>{children}</>;
};
