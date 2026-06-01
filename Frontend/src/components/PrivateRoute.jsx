import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultRouteForRole } from '../utils/roleRouting';

const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false';

const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (USE_MOCK_BACKEND) {
    return <Outlet />;
  }

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const RoleGuard = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (USE_MOCK_BACKEND) {
    return children;
  }

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!USE_MOCK_BACKEND && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
  }

  return children;
};

export default PrivateRoute;
