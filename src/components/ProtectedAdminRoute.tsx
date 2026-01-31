import { useAdmin } from '@/context/AdminContext';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedAdminRoute = () => {
  const { isLoggedIn } = useAdmin();

  if (!isLoggedIn) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default ProtectedAdminRoute;
