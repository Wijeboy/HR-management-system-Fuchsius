import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

// ─── Main Component ──────────────────────────────────────────────────────────

const HRDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Metrics
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [monthlyPayroll, setMonthlyPayroll] = useState(0);
  const [openPositions, setOpenPositions] = useState(0);
  const [applicants, setApplicants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, onLeave: 0 });
  const [actionLoading, setActionLoading] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [usersRes, pendingRes, approvedRes, rejectedRes, payrollRes, jobsRes, applicantsRes, statsRes] =
        await Promise.allSettled([
          userService.getUsers(),
          leaveService.getPending(1, 100),
          leaveService.getApproved(1, 100),
          leaveService.getRejected(1, 100),
          apiClient.get('/payroll/records', { params: { page: 1, limit: 300 } }),
          recruitmentService.getAllJobs(),
          recruitmentService.getAllApplicants(),
          attendanceService.getDailyStats(today),
        ]);

      // Users & departments
      if (usersRes.status === 'fulfilled') {
        const users = usersRes.value?.data?.users || [];
        setTotalEmployees(usersRes.value?.data?.total ?? users.length);

        const departmentMap = users.reduce((acc, u) => {
          const key = u.department || 'Unassigned';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        const deptColors = ['indigo', 'blue', 'green', 'purple', 'orange', 'rose', 'amber'];
        setDepartments(
          Object.entries(departmentMap)
            .map(([name, count], idx) => ({ name, count, color: deptColors[idx % deptColors.length] }))
            .sort((a, b) => b.count - a.count)
        );
      }

      // Leave data
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

      // Attendance stats
      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value?.data || {};
        setAttendanceStats({
          present: s.present || 0,
          absent: s.absent || 0,
          late: s.late || 0,
          onLeave: s.onLeave || 0,
        });
      }

      setLastUpdated(new Date());
    } catch {
      // Silent fail
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
    try {
      await leaveService.approveLeave(id, user?.id);
      fetchDashboard();
    } catch {
      // Silent
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id + '_reject');
    try {
      await leaveService.rejectLeave(id, user?.id);
      fetchDashboard();
    } catch {
      // Silent
    } finally {
      setActionLoading('');
    }
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
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium">Loading HR dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 1 — Welcome Banner
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 p-8 text-white shadow-lg">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full"></div>
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full"></div>

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl">
                <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
              </div>
              <div>
                <p className="text-teal-200 text-sm font-medium">{greeting}</p>
                <h1 className="text-2xl font-bold">{user?.name || 'HR Manager'}</h1>
              </div>
            </div>
            <p className="text-teal-100 text-sm mt-3 max-w-lg">
              Here's your HR overview. You have <strong className="text-white">{pendingCount} pending leave request{pendingCount !== 1 ? 's' : ''}</strong> and <strong className="text-white">{openPositions} open position{openPositions !== 1 ? 's' : ''}</strong> to manage.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs text-teal-200 uppercase tracking-wider font-semibold">Last Updated</p>
            <p className="text-sm text-teal-100">{lastUpdated ? formatRelativeTime(lastUpdated) : '...'}</p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 2 — Quick Actions
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Link to="/leave/manage" className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-amber-200 bg-amber-50 hover:border-amber-400 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500 text-white group-hover:bg-amber-600 transition-colors">
            <span className="material-symbols-outlined text-xl">pending_actions</span>
          </div>
          <span className="text-sm font-semibold text-amber-700">Approve Leave</span>
          <span className="text-xs text-gray-500">{pendingCount} pending</span>
        </Link>

        <Link to="/attendance/reports" className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500 text-white group-hover:bg-blue-600 transition-colors">
            <span className="material-symbols-outlined text-xl">schedule</span>
          </div>
          <span className="text-sm font-semibold text-blue-700">Attendance</span>
          <span className="text-xs text-gray-500">Daily reports</span>
        </Link>

        <Link to="/dashboard/payroll/records" className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500 text-white group-hover:bg-emerald-600 transition-colors">
            <span className="material-symbols-outlined text-xl">payments</span>
          </div>
          <span className="text-sm font-semibold text-emerald-700">Payroll</span>
          <span className="text-xs text-gray-500">Records & payslips</span>
        </Link>

        <Link to="/recruitment/jobs" className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-purple-200 bg-purple-50 hover:border-purple-400 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500 text-white group-hover:bg-purple-600 transition-colors">
            <span className="material-symbols-outlined text-xl">work</span>
          </div>
          <span className="text-sm font-semibold text-purple-700">Recruitment</span>
          <span className="text-xs text-gray-500">{openPositions} open</span>
        </Link>

        <Link to="/employees" className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:border-indigo-400 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500 text-white group-hover:bg-indigo-600 transition-colors">
            <span className="material-symbols-outlined text-xl">group</span>
          </div>
          <span className="text-sm font-semibold text-indigo-700">Employees</span>
          <span className="text-xs text-gray-500">{totalEmployees} total</span>
        </Link>
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
          <p className="mt-1 text-xs text-gray-500">{departments.length} departments</p>
        </div>

        {/* Pending Leaves */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Pending Requests</p>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100">
              <span className="material-symbols-outlined text-xl text-amber-600">pending_actions</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="text-emerald-600 font-medium">{approvedCount} approved</span>
            <span className="text-gray-300">·</span>
            <span className="text-rose-600 font-medium">{rejectedCount} rejected</span>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Today's Attendance</p>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100">
              <span className="material-symbols-outlined text-xl text-emerald-600">how_to_reg</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{attendanceRate}%</p>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            ></div>
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            {attendanceStats.present} present · {attendanceStats.late} late · {attendanceStats.absent} absent
          </p>
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
          <p className="mt-1 text-xs text-gray-500">Total net payroll this period</p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 4 — Pending Leave Approvals + Department Overview
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Leave Approvals */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pending Leave Approvals</h2>
              <p className="text-xs text-gray-500 mt-0.5">{pendingCount} request{pendingCount !== 1 ? 's' : ''} awaiting your review</p>
            </div>
            <Link to="/leave/manage" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View All
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="material-symbols-outlined text-5xl text-gray-200 mb-3">task_alt</span>
              <p className="text-sm text-gray-500 font-medium">All caught up!</p>
              <p className="text-xs text-gray-400 mt-1">No pending leave requests to review.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingLeaves.map((leave) => (
                <div key={leave._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <UserAvatar name={leave.employeeName} image={leave.profileImage} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{leave.employeeName}</p>
                    <p className="text-xs text-gray-500">
                      <span className="capitalize">{leave.leaveType}</span> · {formatDateRange(leave.startDate, leave.endDate)} · {leave.durationDays} day{leave.durationDays !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleApprove(leave._id)}
                      disabled={!!actionLoading}
                      className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                      title="Approve"
                    >
                      {actionLoading === leave._id + '_approve'
                        ? <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
                        : <span className="material-symbols-outlined text-lg">check</span>}
                    </button>
                    <button
                      onClick={() => handleReject(leave._id)}
                      disabled={!!actionLoading}
                      className="flex items-center justify-center w-9 h-9 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors disabled:opacity-50"
                      title="Reject"
                    >
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

        {/* Department Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Departments</h2>
            <Link to="/employees" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</Link>
          </div>

          {departments.length === 0 ? (
            <p className="text-sm text-gray-400">No department data</p>
          ) : (
            <div className="space-y-4">
              {departments.map((dept, idx) => {
                const pct = totalEmployees > 0 ? Math.round((dept.count / totalEmployees) * 100) : 0;
                const barColors = {
                  indigo: 'bg-indigo-500',
                  blue: 'bg-blue-500',
                  green: 'bg-green-500',
                  purple: 'bg-purple-500',
                  orange: 'bg-orange-500',
                  rose: 'bg-rose-500',
                  amber: 'bg-amber-500',
                };
                const dotColors = {
                  indigo: 'bg-indigo-500',
                  blue: 'bg-blue-500',
                  green: 'bg-green-500',
                  purple: 'bg-purple-500',
                  orange: 'bg-orange-500',
                  rose: 'bg-rose-500',
                  amber: 'bg-amber-500',
                };
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${dotColors[dept.color] || 'bg-gray-400'}`}></div>
                        <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{dept.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`${barColors[dept.color] || 'bg-gray-400'} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 5 — Today's Attendance Breakdown + Recent Applicants
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Today's Attendance</h2>
              <p className="text-xs text-gray-500 mt-0.5">Real-time overview</p>
            </div>
            <Link to="/attendance/reports" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Full Report</Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Present', value: attendanceStats.present, icon: 'check_circle', color: 'emerald' },
              { label: 'Late', value: attendanceStats.late, icon: 'schedule', color: 'amber' },
              { label: 'Absent', value: attendanceStats.absent, icon: 'cancel', color: 'rose' },
              { label: 'On Leave', value: attendanceStats.onLeave, icon: 'event_busy', color: 'blue' },
            ].map((stat) => {
              const bgColors = { emerald: 'bg-emerald-50', amber: 'bg-amber-50', rose: 'bg-rose-50', blue: 'bg-blue-50' };
              const iconBg = { emerald: 'bg-emerald-100', amber: 'bg-amber-100', rose: 'bg-rose-100', blue: 'bg-blue-100' };
              const iconColor = { emerald: 'text-emerald-600', amber: 'text-amber-600', rose: 'text-rose-600', blue: 'text-blue-600' };
              const textColor = { emerald: 'text-emerald-700', amber: 'text-amber-700', rose: 'text-rose-700', blue: 'text-blue-700' };

              return (
                <div key={stat.label} className={`${bgColors[stat.color]} rounded-xl p-4 border border-${stat.color}-100`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${iconBg[stat.color]}`}>
                      <span className={`material-symbols-outlined text-xl ${iconColor[stat.color]}`}>{stat.icon}</span>
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${textColor[stat.color]}`}>{stat.value}</p>
                      <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Applicants */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Applicants</h2>
              <p className="text-xs text-gray-500 mt-0.5">Latest job applications</p>
            </div>
            <Link to="/recruitment/jobs" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</Link>
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
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 6 — Announcements
          ════════════════════════════════════════════════════════════════════════ */}
      <AnnouncementsSection />
    </div>
  );
};

export default HRDashboard;
