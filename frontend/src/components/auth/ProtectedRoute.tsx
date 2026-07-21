import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth.context';
import { Role } from '../../types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

/**
 * Redirects unauthenticated users to /login.
 * Optionally restricts access by role.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowSlowNotice(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowSlowNotice(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-foreground text-sm font-semibold">Starting StudyLib...</p>
            <p className="text-muted-foreground text-xs mt-1">Connecting to server</p>
          </div>

          {showSlowNotice && (
            <div className="mt-2 space-y-2 animate-fade-in">
              <p className="text-amber-500 text-xs font-medium">
                Connection is taking longer than expected.
              </p>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login', { replace: true });
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-medium shadow-md transition-all touch-manipulation"
              >
                Go to Login Page
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
