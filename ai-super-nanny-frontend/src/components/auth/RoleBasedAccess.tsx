'use client';

import { useAuth } from '../../app/providers';

interface RoleBasedAccessProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

/**
 * A component that conditionally renders content based on user roles
 * If the user has one of the allowed roles, the children will be rendered
 * Otherwise, the fallback will be rendered (if provided)
 */
export default function RoleBasedAccess({ 
  children, 
  allowedRoles, 
  fallback = null 
}: RoleBasedAccessProps) {
  const { user } = useAuth();

  // If there's no user, don't render anything
  if (!user) {
    return fallback;
  }

  // Get user roles from metadata
  const userRoles = user.app_metadata?.roles || [];
  
  // Check if user has any of the allowed roles
  const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));

  // If user has an allowed role, render children, otherwise render fallback
  return hasAllowedRole ? <>{children}</> : <>{fallback}</>;
}
