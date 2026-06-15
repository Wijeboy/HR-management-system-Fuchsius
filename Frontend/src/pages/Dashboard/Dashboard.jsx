import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import HRDashboard from './HRDashboard';
import ManagerDashboard from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'employee':
      return <EmployeeDashboard />;
    case 'hr':
      return <HRDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'admin':
    default:
      return <AdminDashboard />;
  }
};

export default Dashboard;
