import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { leaveService } from '../../services/leaveService';
import { recruitmentService } from '../../services/recruitmentService';
import { userService } from '../../services/userService';
import { attendanceService } from '../../services/attendanceService';
import apiClient from '../../services/api';
import UserAvatar from '../../components/UserAvatar';
import AnnouncementsSection from '../../components/AnnouncementsSection';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrencyCompact = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

const formatRelativeTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const formatDateRange = (startDate, endDate) => {
  const opts = { day: 'numeric', month: 'short' };
  const start = new Date(startDate).toLocaleDateString('en-US', opts);
  if (!endDate) return start;
  const end = new Date(endDate).toLocaleDateString('en-US', opts);
  return `${start} – ${end}`;
};

const formatTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// ─── Main Component ──────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Data
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [allUsers, setAllUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roleCounts, setRoleCounts] = useState({ admin: 0, hr: 0, manager: 0, employee: 0 });
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [monthlyPayroll, setMonthlyPayroll] = useState(0);
  const [openPositions, setOpenPositions] = useState(0);
  const [applicants, setApplicants] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, onLeave: 0 });
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [actionLoading, setActionLoading] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [usersRes, pendingRes, approvedRes, rejectedRes, payrollRes, jobsRes, applicantsRes, statsRes, dailyRes] =
        await Promise.allSettled([
          userService.getUsers(),
          leaveService.getPending(1, 100),
          leaveService.getApproved(1, 100),
          leaveService.getRejected(1, 100),
          apiClient.get('/payroll/records', { params: { page: 1, limit: 300 } }),
          recruitmentService.getAllJobs(),
          recruitmentService.getAllApplicants(),
          attendanceService.getDailyStats(today),
          attendanceService.getDailyAttendance({ date: today, page: 1, limit: 8 }),
        ]);

      // Users
      if (usersRes.status === 'fulfilled') {
        const users = usersRes.value?.data?.users || [];
        setAllUsers(users);
        setTotalEmployees(usersRes.value?.data?.total ?? users.length);
        setActiveEmployees(users.filter((u) => u.isActive !== false).length);

        // Role counts
        const roles = { admin: 0, hr: 0, manager: 0, employee: 0 };
        users.forEach((u) => { if (roles[u.role] !== undefined) roles[u.role]++; });
        setRoleCounts(roles);

        // Department breakdown
        const departmentMap = users.reduce((acc, u) => {
          const key = u.department || 'Unassigned';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        const deptColors = ['indigo', 'blue', 'emerald', 'purple', 'orange', 'rose', 'amber', 'teal'];
        setDepartments(
          Object.entries(departmentMap)
            .map(([name, count], idx) => ({ name, count, color: deptColors[idx % deptColors.length] }))
            .sort((a, b) => b.count - a.count)
        );
      }

      // Leave
      if (pendingRes.status === 'fulfilled') {
        setPendingLeaves((pendingRes.value?.data?.records || []).slice(0, 5));
        setPendingCount(pendingRes.value?.data?.total || 0);
      }
      if (approvedRes.status === 'fulfilled') setApprovedCount(approvedRes.value?.data?.total || 0);
      if (rejectedRes.status === 'fulfilled') setRejectedCount(rejectedRes.value?.data?.total || 0);

      // Payroll
      if (payrollRes.status === 'fulfilled') {
        const summary = payrollRes.value?.data?.summary || {};
        setMonthlyPayroll(Number(summary.totalNet || 0));
      }

      // Recruitment
      if (jobsRes.status === 'fulfilled') {
        const jobs = jobsRes.value?.data?.records || jobsRes.value?.data?.jobs || jobsRes.value?.data?.data || [];
        setOpenPositions(Array.isArray(jobs) ? jobs.length : 0);
      }
      if (applicantsRes.status === 'fulfilled') {
        const apps = applicantsRes.value?.data?.applicants || applicantsRes.value?.data?.data || applicantsRes.value?.data || [];
        setApplicants(Array.isArray(apps) ? apps.slice(0, 5) : []);
      }

      // Attendance
      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value?.data || {};
        setAttendanceStats({ present: s.present || 0, absent: s.absent || 0, late: s.late || 0, onLeave: s.onLeave || 0 });
      }
      if (dailyRes.status === 'fulfilled') {
        const records = dailyRes.value?.data?.records || dailyRes.value?.data?.data || [];
        setTodayAttendance(Array.isArray(records) ? records.slice(0, 8) : []);
      }

      setLastUpdated(new Date());
    } catch {
      // Silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const poll = setInterval(fetchDashboard, 30000);
    return () => clearInterval(poll);
  }, [fetchDashboard]);

  // Leave actions
  const handleApprove = async (id) => {
    setActionLoading(id + '_approve');
    try { await leaveService.approveLeave(id, user?.id); fetchDashboard(); } catch {} finally { setActionLoading(''); }
  };
  const handleReject = async (id) => {
    setActionLoading(id + '_reject');
    try { await leaveService.rejectLeave(id, user?.id); fetchDashboard(); } catch {} finally { setActionLoading(''); }
  };

  const totalAttendance = attendanceStats.present + attendanceStats.absent + attendanceStats.late + attendanceStats.onLeave;
  const attendanceRate = totalAttendance > 0 ? Math.round((attendanceStats.present / totalAttendance) * 100) : 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 1 — Welcome Banner
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 p-8 text-white shadow-xl">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full"></div>
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full"></div>
        <div className="absolute top-4 right-6 w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
                <span className="material-symbols-outlined text-2xl">shield_person</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">{greeting}</p>
                <h1 className="text-2xl font-bold">{user?.name || 'Administrator'}</h1>
              </div>
            </div>
            <p className="text-slate-300 text-sm mt-3 max-w-lg">
              System-wide control center. <strong className="text-white">{totalEmployees} employees</strong> across <strong className="text-white">{departments.length} departments</strong>. <strong className="text-amber-400">{pendingCount} pending request{pendingCount !== 1 ? 's' : ''}</strong> need attention.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600/30 border border-indigo-500/30 rounded-full text-xs font-medium text-indigo-300">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              System Admin
            </span>
            <p className="text-xs text-slate-500">{lastUpdated ? `Updated ${formatRelativeTime(lastUpdated)}` : 'Loading...'}</p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 2 — Quick Actions
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { to: '/employees', icon: 'group', label: 'Employees', sub: `${totalEmployees} total`, border: 'border-indigo-200', bg: 'bg-indigo-50', iconBg: 'bg-indigo-600', text: 'text-indigo-700', hover: 'hover:border-indigo-400' },
          { to: '/leave/manage', icon: 'pending_actions', label: 'Leave Mgmt', sub: `${pendingCount} pending`, border: 'border-amber-200', bg: 'bg-amber-50', iconBg: 'bg-amber-500', text: 'text-amber-700', hover: 'hover:border-amber-400' },
          { to: '/attendance/reports', icon: 'schedule', label: 'Attendance', sub: `${attendanceRate}% present`, border: 'border-blue-200', bg: 'bg-blue-50', iconBg: 'bg-blue-500', text: 'text-blue-700', hover: 'hover:border-blue-400' },
          { to: '/dashboard/payroll/records', icon: 'payments', label: 'Payroll', sub: formatCurrencyCompact(monthlyPayroll), border: 'border-emerald-200', bg: 'bg-emerald-50', iconBg: 'bg-emerald-500', text: 'text-emerald-700', hover: 'hover:border-emerald-400' },
          { to: '/recruitment/jobs', icon: 'work', label: 'Recruitment', sub: `${openPositions} open`, border: 'border-purple-200', bg: 'bg-purple-50', iconBg: 'bg-purple-500', text: 'text-purple-700', hover: 'hover:border-purple-400' },
          { to: '/settings', icon: 'settings', label: 'Settings', sub: 'System config', border: 'border-slate-200', bg: 'bg-slate-50', iconBg: 'bg-slate-700', text: 'text-slate-700', hover: 'hover:border-slate-400' },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={`group flex flex-col items-center gap-3 p-5 rounded-xl border-2 ${action.border} ${action.bg} ${action.hover} hover:shadow-md transition-all duration-200`}
          >
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${action.iconBg} text-white group-hover:scale-105 transition-transform`}>
              <span className="material-symbols-outlined text-xl">{action.icon}</span>
            </div>
            <span className={`text-sm font-semibold ${action.text}`}>{action.label}</span>
            <span className="text-xs text-gray-500">{action.sub}</span>
          </Link>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 3 — KPI Cards
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Employees */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Total Employees</p>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100">
              <span className="material-symbols-outlined text-xl text-indigo-600">group</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalEmployees}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs text-gray-500">{activeEmployees} active</span>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Leave Requests</p>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100">
              <span className="material-symbols-outlined text-xl text-amber-600">pending_actions</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="text-emerald-600 font-medium">{approvedCount} ✓</span>
            <span className="text-rose-600 font-medium">{rejectedCount} ✕</span>
            <span className="text-amber-600 font-medium">{pendingCount} pending</span>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100">
              <span className="material-symbols-outlined text-xl text-emerald-600">how_to_reg</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{attendanceRate}%</p>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${attendanceRate}%` }}></div>
          </div>
          <p className="mt-1.5 text-xs text-gray-500">{attendanceStats.present} present · {attendanceStats.late} late · {attendanceStats.absent} absent</p>
        </div>

        {/* Monthly Payroll */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Monthly Payroll</p>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-100">
              <span className="material-symbols-outlined text-xl text-teal-600">attach_money</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrencyCompact(monthlyPayroll)}</p>
          <p className="mt-1 text-xs text-gray-500">Total net payroll</p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 4 — User Roles Distribution + Department Breakdown
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-5">User Roles</h2>
          <div className="space-y-4">
            {[
              { role: 'Admin', count: roleCounts.admin, icon: 'shield_person', color: 'slate', barColor: 'bg-slate-700' },
              { role: 'HR Manager', count: roleCounts.hr, icon: 'admin_panel_settings', color: 'teal', barColor: 'bg-teal-500' },
              { role: 'Manager', count: roleCounts.manager, icon: 'supervisor_account', color: 'amber', barColor: 'bg-amber-500' },
              { role: 'Employee', count: roleCounts.employee, icon: 'person', color: 'indigo', barColor: 'bg-indigo-500' },
            ].map((item) => {
              const pct = totalEmployees > 0 ? Math.round((item.count / totalEmployees) * 100) : 0;
              return (
                <div key={item.role}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-lg text-${item.color}-600`}>{item.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{item.role}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{item.count}</span>
                      <span className="text-xs text-gray-400">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${item.barColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Leave Approvals */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pending Approvals</h2>
              <p className="text-xs text-gray-500 mt-0.5">{pendingCount} request{pendingCount !== 1 ? 's' : ''} awaiting action</p>
            </div>
            <Link to="/leave/manage" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Manage All
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="material-symbols-outlined text-5xl text-gray-200 mb-3">task_alt</span>
              <p className="text-sm text-gray-500 font-medium">No pending requests</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingLeaves.map((leave) => (
                <div key={leave._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <UserAvatar name={leave.employeeName} image={leave.profileImage} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{leave.employeeName}</p>
                    <p className="text-xs text-gray-500">
                      <span className="capitalize">{leave.leaveType}</span> · {formatDateRange(leave.startDate, leave.endDate)} · {leave.durationDays}d
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleApprove(leave._id)} disabled={!!actionLoading}
                      className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors disabled:opacity-50" title="Approve">
                      {actionLoading === leave._id + '_approve'
                        ? <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
                        : <span className="material-symbols-outlined text-lg">check</span>}
                    </button>
                    <button onClick={() => handleReject(leave._id)} disabled={!!actionLoading}
                      className="flex items-center justify-center w-9 h-9 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors disabled:opacity-50" title="Reject">
                      {actionLoading === leave._id + '_reject'
                        ? <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
                        : <span className="material-symbols-outlined text-lg">close</span>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 5 — Department Breakdown + Today's Attendance
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Department Distribution</h2>
            <Link to="/employees" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</Link>
          </div>

          {departments.length === 0 ? (
            <p className="text-sm text-gray-400">No department data</p>
          ) : (
            <div className="space-y-4">
              {departments.map((dept, idx) => {
                const pct = totalEmployees > 0 ? Math.round((dept.count / totalEmployees) * 100) : 0;
                const barColors = {
                  indigo: 'bg-indigo-500', blue: 'bg-blue-500', emerald: 'bg-emerald-500', purple: 'bg-purple-500',
                  orange: 'bg-orange-500', rose: 'bg-rose-500', amber: 'bg-amber-500', teal: 'bg-teal-500',
                };
                const dotColors = {
                  indigo: 'bg-indigo-500', blue: 'bg-blue-500', emerald: 'bg-emerald-500', purple: 'bg-purple-500',
                  orange: 'bg-orange-500', rose: 'bg-rose-500', amber: 'bg-amber-500', teal: 'bg-teal-500',
                };
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${dotColors[dept.color] || 'bg-gray-400'}`}></div>
                        <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{dept.count}</span>
                        <span className="text-xs text-gray-400">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${barColors[dept.color] || 'bg-gray-400'} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's Attendance Feed */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Today's Attendance</h2>
              <p className="text-xs text-gray-500 mt-0.5">Latest check-in/out activity</p>
            </div>
            <Link to="/attendance/reports" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Full Report</Link>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-4 gap-0 border-b border-gray-100">
            {[
              { label: 'Present', value: attendanceStats.present, bg: 'bg-emerald-50', text: 'text-emerald-600' },
              { label: 'Late', value: attendanceStats.late, bg: 'bg-amber-50', text: 'text-amber-600' },
              { label: 'Absent', value: attendanceStats.absent, bg: 'bg-rose-50', text: 'text-rose-600' },
              { label: 'Leave', value: attendanceStats.onLeave, bg: 'bg-blue-50', text: 'text-blue-600' },
            ].map((stat) => (
              <div key={stat.label} className={`flex flex-col items-center py-3 ${stat.bg}`}>
                <p className={`text-xl font-bold ${stat.text}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          {todayAttendance.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">schedule</span>
              <p className="text-sm text-gray-400">No attendance records yet today</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todayAttendance.map((record, idx) => {
                const statusStyles = {
                  present: 'bg-emerald-100 text-emerald-700',
                  late: 'bg-amber-100 text-amber-700',
                  absent: 'bg-rose-100 text-rose-700',
                  on_leave: 'bg-blue-100 text-blue-700',
                };
                const statusLabels = { present: 'Present', late: 'Late', absent: 'Absent', on_leave: 'On Leave' };
                return (
                  <div key={idx} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                    <UserAvatar name={record.employeeName} image={record.profileImage} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{record.employeeName || record.employeeId}</p>
                      <p className="text-xs text-gray-500">
                        {record.checkIn ? `In: ${formatTime(record.checkIn)}` : '—'}
                        {record.checkOut ? ` · Out: ${formatTime(record.checkOut)}` : ''}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${statusStyles[record.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabels[record.status] || record.status || '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 6 — Recent Applicants + Announcements
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applicants */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Applicants</h2>
              <p className="text-xs text-gray-500 mt-0.5">{openPositions} open position{openPositions !== 1 ? 's' : ''}</p>
            </div>
            <Link to="/recruitment/jobs" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Manage</Link>
          </div>

          {applicants.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">person_search</span>
              <p className="text-sm text-gray-400">No applicants yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {applicants.map((app, idx) => (
                <div key={idx} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100">
                    <span className="material-symbols-outlined text-lg text-purple-600">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{app.applicantName || app.name || '—'}</p>
                    <p className="text-xs text-gray-500 truncate">{app.jobTitle || app.position || '—'}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border capitalize ${
                    app.status === 'shortlisted' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                    app.status === 'rejected' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                    app.status === 'interviewed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {app.status || 'applied'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements */}
        <AnnouncementsSection />
      </div>
    </div>
  );
};

export default AdminDashboard;
