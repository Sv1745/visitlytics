
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/integrations/firebase/client';
import { signOut } from 'firebase/auth';

export const AuthHeader = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Visit Tracker</h1>
        <p className="text-lg text-muted-foreground">Manage your business visits, companies, and customer relationships</p>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {isAuthenticated && (
          <button
            onClick={() => signOut(auth)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
};
