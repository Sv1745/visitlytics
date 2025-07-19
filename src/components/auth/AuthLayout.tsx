
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseAuthUI } from '@/components/FirebaseAuthUI';

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md">
          <FirebaseAuthUI />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
