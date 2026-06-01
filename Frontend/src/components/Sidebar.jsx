import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../utils/roleAccess';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const role = user?.role;

  const mainMenuItems = [
    {
      path: '/dashboard',
      icon: 'dashboard',
      label: 'Dashboard',
      visible: canAccess(role, 'dashboard'),
    },
    {
      path: '/employees',
      icon: 'group',
      label: 'Employees',
      visible: canAccess(role, 'employeesView'),
    },
    {
      path: user?.role === 'employee' ? '/attendance' : '/attendance/reports',
      icon: 'schedule',
      label: 'Attendance',
      visible: canAccess(role, 'attendanceSelf') || canAccess(role, 'attendanceReports'),
    },
    {
      path: user?.role === 'employee' ? '/payroll/payslips' : '/payroll',
      icon: 'payments',
      label: 'Payroll',
      visible: canAccess(role, 'payrollView') || canAccess(role, 'payrollPayslip'),
    },
    {
      path: '/departments',
      icon: 'domain',
      label: 'Departments',
      visible: canAccess(role, 'departmentsView') || canAccess(role, 'departments'),
    },
    {
      path: user?.role === 'employee' ? '/leave/requests' : '/leave/manage',
      icon: 'event',
      label: 'Leave Management',
      visible: canAccess(role, 'leaveRequests') || canAccess(role, 'leaveManage'),
    },
    {
      path: user?.role === 'employee' ? '/recruitment/applicants' : '/recruitment/jobs',
      icon: 'work',
      label: 'Recruitment',
      visible: canAccess(role, 'recruitmentApplicants') || canAccess(role, 'recruitmentJobs'),
    },
    {
      path: canAccess(role, 'performanceReviews') ? '/performance/reviews' : '/performance/goals',
      icon: 'trending_up',
      label: 'Performance',
      visible: canAccess(role, 'performanceReviews') || canAccess(role, 'performanceGoals'),
    },
  ].filter((item) => item.visible);

  const managementItems = [
    {
      path: '/reports',
      icon: 'bar_chart',
      label: 'Reports',
      visible: canAccess(role, 'reports'),
    },
    {
      path: '/settings',
      icon: 'settings',
      label: 'Settings',
      visible: canAccess(role, 'settings'),
    },
  ].filter((item) => item.visible);

  const isActive = (path) => {
    // Attendance tab: highlight for both role paths
    if (path === '/attendance' || path === '/attendance/reports') {
      return location.pathname.startsWith('/attendance');
    }
    // Leave tab: highlight for both role paths
    if (path === '/leave/requests' || path === '/leave/manage') {
      return location.pathname.startsWith('/leave');
    }
    // Recruitment tab: highlight for both role paths
    if (path === '/recruitment/applicants' || path === '/recruitment/jobs') {
      return location.pathname.startsWith('/recruitment');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className="flex h-screen w-64 flex-col overflow-hidden border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-12 items-center gap-2 border-b border-gray-200 px-4.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <span className="material-symbols-outlined text-[18px]">hexagon</span>
        </div>
        <h1 className="text-base font-bold tracking-tight text-gray-900">HRMS</h1>
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col justify-between overflow-hidden px-3 py-3">
        <div className="flex flex-col gap-3">
          {/* User Profile */}
          <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold leading-4 text-gray-900">{user?.name || 'Guest User'}</span>
              <span className="text-[11px] text-gray-500 capitalize">{user?.role || 'Guest'}</span>
            </div>
          </div>

          {/* Main Menu */}
          <nav className="flex flex-col gap-0.5">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">Main Menu</p>
            {mainMenuItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 transition-colors ${
                  isActive(item.path)
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                <span className="text-[12px] font-medium leading-4">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Management Section */}
          {managementItems.length > 0 && (
            <nav className="flex flex-col gap-0.5">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">Management</p>
              {managementItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 transition-colors ${
                    isActive(item.path)
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                  <span className="text-[12px] font-medium leading-4">{item.label}</span>
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 shadow-sm">
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <span className="material-symbols-outlined text-[17px]">shield</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-4 text-slate-900">Security Status</p>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-500">System audit completed successfully. No vulnerabilities found.</p>
            </div>
          </div>
          <button className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-100">
            View Report
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;