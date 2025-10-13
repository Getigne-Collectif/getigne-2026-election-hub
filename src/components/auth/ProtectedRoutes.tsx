import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import LoadingSpinner from '@/components/ui/loading';
import { Routes } from '@/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function AuthenticatedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, authChecked } = useAuth();

  if (loading || !authChecked) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to={Routes.AUTH} replace />;
  }

  return <>{children}</>;
}

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAdmin, loading, authChecked } = useAuth();

  if (loading || !authChecked) {
    return <LoadingSpinner />;
  }

  if (!user || !isAdmin) {
    return <Navigate to={Routes.AUTH} replace />;
  }

  return <>{children}</>;
}

interface RoleRouteProps {
  children: React.ReactNode;
  roles: string[];
  requireAll?: boolean;
}

export function RoleRoute({ children, roles, requireAll = false }: RoleRouteProps) {
  const { user, userRoles, loading, authChecked } = useAuth();

  if (loading || !authChecked) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to={Routes.AUTH} replace />;
  }

  const hasRequiredRole = requireAll
    ? roles.every(role => userRoles.includes(role))
    : roles.some(role => userRoles.includes(role));

  if (!hasRequiredRole) {
    return <Navigate to={Routes.HOME} replace />;
  }

  return <>{children}</>;
}

interface ModeratorRouteProps {
  children: React.ReactNode;
}

export function ModeratorRoute({ children }: ModeratorRouteProps) {
  const { user, isModerator, loading, authChecked } = useAuth();

  if (loading || !authChecked) {
    return <LoadingSpinner />;
  }

  if (!user || !isModerator) {
    return <Navigate to={Routes.AUTH} replace />;
  }

  return <>{children}</>;
}

interface MemberRouteProps {
  children: React.ReactNode;
}

export function MemberRoute({ children }: MemberRouteProps) {
  const { user, isMember, loading, authChecked } = useAuth();

  if (loading || !authChecked) {
    return <LoadingSpinner />;
  }

  if (!user || !isMember) {
    return <Navigate to={Routes.HOME} replace />;
  }

  return <>{children}</>;
}

