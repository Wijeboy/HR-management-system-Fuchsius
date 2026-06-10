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
      // Employee → /attendance (check-in/out + own history)
      // HR / Admin / Manager → /attendance/reports (daily overview of all employees)
      path: user?.role === 'employee' ? '/attendance' : '/attendance/reports',
      icon: 'schedule',
      label: 'Attendance',
      visible: canAccess(role, 'attendanceSelf') || canAccess(role, 'attendanceReports'),
    },
    {
      // Employee → /leave/requests (balance cards + own history)
      // HR → /leave/manage (approval inbox)
      path: user?.role === 'employee' ? '/leave/requests' : '/leave/manage',
      icon: 'event',
      label: 'Leave Management',
      visible: canAccess(role, 'leaveRequests') || canAccess(role, 'leaveManage'),
    },
    {
      path: user?.role === 'employee' ? '/payroll/payslips' : '/payroll',
      icon: 'payments',
      label: 'Payroll',
      visible: canAccess(role, 'payrollView') || canAccess(role, 'payrollPayslip'),
    },
    {
      // Employee → /recruitment/applicants (job postings + apply + meeting calendar)
      // HR / Admin / Manager → /recruitment/jobs (job vacancy portal + manage applicants)
      path: user?.role === 'employee' ? '/recruitment/applicants' : '/recruitment/jobs',
      icon: 'work',
      label: 'Recruitment',
      visible: canAccess(role, 'recruitmentApplicants') || canAccess(role, 'recruitmentJobs'),
    },
    {
      path: canAccess(role, 'performanceReviews') ? '/dashboard/performance/reviews' : '/dashboard/performance/goals',
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
    // Dashboard tab: exact match only, do not highlight for sub-routes
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
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
    // Performance tab: highlight for both /performance and /dashboard/performance paths
    if (path.includes('/performance/')) {
      return location.pathname.startsWith('/dashboard/performance') || location.pathname.startsWith('/performance');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className="flex w-72 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-xl">hexagon</span>
        </div>
        <h1 className="text-lg font-bold tracking-tight text-gray-900">HRMS</h1>
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          {/* User Profile */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900">{user?.name || 'Guest User'}</span>
              <span className="text-xs text-gray-500 capitalize">{user?.role || 'Guest'}</span>
            </div>
          </div>

          {/* Main Menu */}
          <nav className="flex flex-col gap-1">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Main Menu</p>
            {mainMenuItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                  isActive(item.path)
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Management Section */}
          {managementItems.length > 0 && (
            <nav className="flex flex-col gap-1">
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Management</p>
              {managementItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isActive(item.path)
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;