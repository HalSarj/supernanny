'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../app/providers';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * A component that protects routes requiring authentication
 * If the user is not authenticated, they will be redirected to the login page
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If authentication is still loading, do nothing yet
    if (isLoading) return;
    
    // If user is not authenticated, redirect to login
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If not authenticated, don't render children (will redirect in useEffect)
  if (!user) {
    return null;
  }

  // If authenticated, render the children
  return <>{children}</>;
}
