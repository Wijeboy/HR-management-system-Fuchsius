import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { leaveService } from '../../services/leaveService';
import { recruitmentService } from '../../services/recruitmentService';
import { userService } from '../../services/userService';
import { attendanceService } from '../../services/attendanceService';
import apiClient from '../../services/api';
import UserAvatar from '../../components/UserAvatar';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Data
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [openPositions, setOpenPositions] = useState(0);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, onLeave: 0 });
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [performanceReviews, setPerformanceReviews] = useState([]);
  const [actionLoading, setActionLoading] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [usersRes, pendingRes, approvedRes, rejectedRes, jobsRes, statsRes, dailyRes, perfRes] =
        await Promise.allSettled([
          userService.getUsers(),
          leaveService.getPending(1, 100),
          leaveService.getApproved(1, 100),
          leaveService.getRejected(1, 100),
          recruitmentService.getAllJobs(),
          attendanceService.getDailyStats(today),
          attendanceService.getDailyAttendance({ date: today, page: 1, limit: 10 }),
          apiClient.get('/performance/reviews').catch(() => ({ data: [] })),
        ]);

      // Users — filter team members by department
      if (usersRes.status === 'fulfilled') {
        const allUsers = usersRes.value?.data?.users || [];
        setTotalEmployees(usersRes.value?.data?.total ?? allUsers.length);
        const myDept = user?.department;
        const team = myDept
          ? allUsers.filter((u) => u.department === myDept && u.employeeId !== user?.employeeId)
          : [];
        setTeamMembers(team);
      }

      // Leave
      if (pendingRes.status === 'fulfilled') {
        setPendingLeaves((pendingRes.value?.data?.records || []).slice(0, 5));
        setPendingCount(pendingRes.value?.data?.total || 0);
      }
      if (approvedRes.status === 'fulfilled') setApprovedCount(approvedRes.value?.data?.total || 0);
      if (rejectedRes.status === 'fulfilled') setRejectedCount(rejectedRes.value?.data?.total || 0);

      // Recruitment
      if (jobsRes.status === 'fulfilled') {
        const jobs = jobsRes.value?.data?.records || jobsRes.value?.data?.jobs || jobsRes.value?.data?.data || [];
        setOpenPositions(Array.isArray(jobs) ? jobs.length : 0);
      }

      // Attendance
      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value?.data || {};
        setAttendanceStats({
          present: s.present || 0,
          absent: s.absent || 0,
          late: s.late || 0,
          onLeave: s.onLeave || 0,
        });
      }
      if (dailyRes.status === 'fulfilled') {
        const records = dailyRes.value?.data?.records || dailyRes.value?.data?.data || [];
        setTodayAttendance(Array.isArray(records) ? records.slice(0, 6) : []);
      }

      // Performance
      if (perfRes.status === 'fulfilled') {
        const reviews = perfRes.value?.data?.reviews || perfRes.value?.data?.data || perfRes.value?.data || [];
        setPerformanceReviews(Array.isArray(reviews) ? reviews.slice(0, 4) : []);
      }

      setLastUpdated(new Date());
    } catch {
      // Silent
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium">Loading manager dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 1 — Welcome Banner
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 p-8 text-white shadow-lg">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full"></div>
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full"></div>

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl">
                <span className="material-symbols-outlined text-2xl">supervisor_account</span>
              </div>
              <div>
                <p className="text-amber-100 text-sm font-medium">{greeting}</p>
                <h1 className="text-2xl font-bold">{user?.name || 'Manager'}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium">
                <span className="material-symbols-outlined text-sm">apartment</span>
                {user?.department || 'Department'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium">
                <span className="material-symbols-outlined text-sm">group</span>
                {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium">
                <span className="material-symbols-outlined text-sm">pending_actions</span>
                {pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs text-amber-200 uppercase tracking-wider font-semibold">Last Updated</p>
            <p className="text-sm text-amber-100">{lastUpdated ? formatRelativeTime(lastUpdated) : '...'}</p>
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
          <span className="text-xs text-gray-500">Team reports</span>
        </Link>

        <Link to="/employees" className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:border-indigo-400 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500 text-white group-hover:bg-indigo-600 transition-colors">
            <span className="material-symbols-outlined text-xl">group</span>
          </div>
          <span className="text-sm font-semibold text-indigo-700">Team</span>
          <span className="text-xs text-gray-500">{totalEmployees} employees</span>
        </Link>

        <Link to="/dashboard/performance/reviews" className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500 text-white group-hover:bg-emerald-600 transition-colors">
            <span className="material-symbols-outlined text-xl">trending_up</span>
          </div>
          <span className="text-sm font-semibold text-emerald-700">Performance</span>
          <span className="text-xs text-gray-500">Reviews & goals</span>
        </Link>

        <Link to="/recruitment/jobs" className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-purple-200 bg-purple-50 hover:border-purple-400 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500 text-white group-hover:bg-purple-600 transition-colors">
            <span className="material-symbols-outlined text-xl">work</span>
          </div>
          <span className="text-sm font-semibold text-purple-700">Recruitment</span>
          <span className="text-xs text-gray-500">{openPositions} open</span>
        </Link>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 3 — KPI Cards
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* My Team */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">My Team</p>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100">
              <span className="material-symbols-outlined text-xl text-orange-600">group</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{teamMembers.length}</p>
          <p className="mt-1 text-xs text-gray-500">{user?.department || 'Department'} members</p>
        </div>

        {/* Pending Approvals */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
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
            <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100">
              <span className="material-symbols-outlined text-xl text-emerald-600">how_to_reg</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{attendanceRate}%</p>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${attendanceRate}%` }}></div>
          </div>
          <p className="mt-1.5 text-xs text-gray-500">{attendanceStats.present} present today</p>
        </div>

        {/* Open Positions */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Open Positions</p>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100">
              <span className="material-symbols-outlined text-xl text-purple-600">person_add</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{openPositions}</p>
          <p className="mt-1 text-xs text-gray-500">Active job postings</p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 4 — Pending Approvals + Team Attendance
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Approvals */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pending Approvals</h2>
              <p className="text-xs text-gray-500 mt-0.5">{pendingCount} request{pendingCount !== 1 ? 's' : ''} awaiting review</p>
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
              <p className="text-xs text-gray-400 mt-1">No pending leave requests.</p>
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

        {/* Today's Attendance Overview */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Today's Attendance</h2>
              <p className="text-xs text-gray-500 mt-0.5">Who's in today</p>
            </div>
            <Link to="/attendance/reports" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Full Report</Link>
          </div>

          {/* Attendance summary strip */}
          <div className="grid grid-cols-4 gap-0 border-b border-gray-100">
            {[
              { label: 'Present', value: attendanceStats.present, color: 'emerald' },
              { label: 'Late', value: attendanceStats.late, color: 'amber' },
              { label: 'Absent', value: attendanceStats.absent, color: 'rose' },
              { label: 'Leave', value: attendanceStats.onLeave, color: 'blue' },
            ].map((stat) => {
              const colors = {
                emerald: 'text-emerald-600 bg-emerald-50',
                amber: 'text-amber-600 bg-amber-50',
                rose: 'text-rose-600 bg-rose-50',
                blue: 'text-blue-600 bg-blue-50',
              };
              return (
                <div key={stat.label} className={`flex flex-col items-center py-3 ${colors[stat.color]}`}>
                  <p className={`text-xl font-bold ${colors[stat.color].split(' ')[0]}`}>{stat.value}</p>
                  <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Attendance list */}
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
                        {record.checkIn ? `In: ${formatTime(record.checkIn)}` : 'Not checked in'}
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
          SECTION 5 — Team Members + Performance
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">My Team — {user?.department || 'Department'}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}</p>
            </div>
            <Link to="/employees" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</Link>
          </div>

          {teamMembers.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">group</span>
              <p className="text-sm text-gray-400">No team members found in your department</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {teamMembers.slice(0, 6).map((member, idx) => (
                <div key={idx} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <UserAvatar name={member.name} image={member.profileImage} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.jobTitle || member.role || '—'} · {member.employeeId}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    member.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {member.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Performance Reviews */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Performance Overview</h2>
              <p className="text-xs text-gray-500 mt-0.5">Recent reviews & ratings</p>
            </div>
            <Link to="/dashboard/performance/reviews" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</Link>
          </div>

          {performanceReviews.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">trending_up</span>
              <p className="text-sm text-gray-400">No performance reviews available</p>
              <Link to="/dashboard/performance/reviews" className="inline-flex items-center gap-1 mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Go to Performance
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {performanceReviews.map((review, idx) => {
                const rating = review.rating || review.score || 0;
                const maxRating = 5;
                return (
                  <div key={idx} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <UserAvatar name={review.employeeName || review.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{review.employeeName || review.name || '—'}</p>
                      <p className="text-xs text-gray-500">{review.period || review.reviewPeriod || '—'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: maxRating }, (_, i) => (
                        <span
                          key={i}
                          className={`material-symbols-outlined text-lg ${
                            i < Math.round(rating) ? 'text-amber-400' : 'text-gray-200'
                          }`}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 6 — Announcements
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Announcements</h2>
        <div className="space-y-3">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600">campaign</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">Company All-Hands Meeting</h3>
                <p className="text-sm text-gray-600 mt-1">Join us this Friday at 3 PM for our quarterly company update.</p>
                <p className="text-xs text-gray-500 mt-2">Posted 2 days ago</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-green-600">celebration</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">New Employee Benefits</h3>
                <p className="text-sm text-gray-600 mt-1">We&apos;re excited to announce enhanced health insurance and wellness programs.</p>
                <p className="text-xs text-gray-500 mt-2">Posted 1 week ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
