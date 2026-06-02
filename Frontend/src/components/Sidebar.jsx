import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Determine correct dashboard path based on role
  const getDashboardPath = () => {
    switch (user?.role) {
      case 'hr': return '/hr-dashboard';
      case 'manager': return '/manager-dashboard';
      case 'employee': return '/employee-dashboard';
      default: return '/dashboard';
    }
  };

  // Centralized menu item configuration controlling role visibility
  const mainMenuItems = [
    {
      name: 'Dashboard',
      path: getDashboardPath(),
      icon: 'dashboard',
      visible: ['admin', 'hr', 'manager', 'employee'].includes(user?.role),
    },
    {
      name: 'My Leaves',
      path: '/leave/requests',
      icon: 'event_note',
      visible: ['employee'].includes(user?.role),
    },
    {
      name: 'My Payslips',
      path: '/payroll/payslips',
      icon: 'request_quote',
      visible: ['employee'].includes(user?.role),
    },
    {
      name: 'Team Directory',
      path: '/employees',
      icon: 'groups',
      visible: ['admin', 'hr', 'manager'].includes(user?.role),
    },
    {
      name: 'Attendance',
      path: user?.role === 'employee' ? '/attendance' : '/attendance/reports',
      icon: 'fact_check',
      visible: ['admin', 'hr', 'manager', 'employee'].includes(user?.role),
    },
    {
      name: 'Leave Approvals',
      path: '/leave/manage',
      icon: 'event_available',
      visible: ['admin', 'hr', 'manager'].includes(user?.role),
    },
    {
      name: 'Performance',
      path: '/performance/reviews',
      icon: 'assessment',
      visible: ['admin', 'manager'].includes(user?.role),
    },
    {
      name: 'Payroll',
      path: '/payroll',
      icon: 'payments',
      visible: ['admin', 'hr'].includes(user?.role),
    },
    {
      name: 'Recruitment',
      path: '/recruitment/jobs',
      icon: 'work',
      visible: ['admin', 'hr'].includes(user?.role),
    },
    {
      name: 'Departments',
      path: '/departments',
      icon: 'domain',
      visible: ['admin'].includes(user?.role),
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: 'bar_chart',
      visible: ['admin', 'hr', 'manager'].includes(user?.role),
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: 'settings',
      visible: ['admin'].includes(user?.role),
    },
  ].filter(item => item.visible);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800">FUCHSIUS HRMS</h2>
        <p className="text-xs text-gray-500 mt-1 capitalize">{user?.role} Workspace</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {mainMenuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link key={item.name} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}>
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;