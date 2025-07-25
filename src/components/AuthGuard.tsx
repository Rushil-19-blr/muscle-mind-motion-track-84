import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingAnimation } from '@/components/LoadingAnimation';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingAnimation message="Authenticating..." />;
  }

  if (!user) {
    return fallback || <div>Please sign in to access this page.</div>;
  }

  return <>{children}</>;
};