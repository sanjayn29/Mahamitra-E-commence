import { useAdmin } from '@/context/AdminContext';
import { useAuth } from '@/context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'sonner';

const ProtectedAdminRoute = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin" replace />;
  }

  if (!isAdmin) {
    toast.error('Access Denied', {
      description: 'You do not have administrator privileges.',
    });
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedAdminRoute;
