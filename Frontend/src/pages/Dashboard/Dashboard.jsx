import React, { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { leaveService } from '../../services/leaveService';
import { recruitmentService } from '../../services/recruitmentService';
import { userService } from '../../services/userService';

const POLL_INTERVAL_MS = 30000;

const formatCurrencyCompact = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

const formatCount = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));

const buildDelta = (current, previous) => {
  const curr = Number(current || 0);
  const prev = Number(previous || 0);
  if (prev <= 0) {
    return { pct: 0, direction: 'flat' };
  }

  const raw = ((curr - prev) / prev) * 100;
  const pct = Number(Math.abs(raw).toFixed(1));
  const direction = raw > 0 ? 'up' : raw < 0 ? 'down' : 'flat';
  return { pct, direction };
};

const formatRelativeTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentMetrics, setCurrentMetrics] = useState({
    totalEmployees: 0,
    monthlyPayroll: 0,
    activeRequests: 0,
    openPositions: 0,
  });
  const [previousMetrics, setPreviousMetrics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [departments, setDepartments] = useState([]);

  const activityColorClasses = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
  };

  const deptDotClasses = {
    indigo: 'bg-indigo-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  const fetchDashboard = useCallback(async () => {
    try {
      const [usersRes, payrollRes, pendingRes, approvedRes, rejectedRes, jobsRes] = await Promise.all([
        userService.getUsers(),
        apiClient.get('/payroll/records', { params: { page: 1, limit: 300 } }),
        leaveService.getPending(1, 100),
        leaveService.getApproved(1, 100),
        leaveService.getRejected(1, 100),
        recruitmentService.getAllJobs().catch(() => ({ data: { records: [], jobs: [] } })),
      ]);

      const users = usersRes?.data?.users || [];
      const totalEmployees = usersRes?.data?.total ?? users.length;

      const payrollSummary = payrollRes?.data?.summary || {};
      const monthlyPayroll = Number(payrollSummary.totalNet || 0);

      const pending = pendingRes?.data || {};
      const approved = approvedRes?.data || {};
      const rejected = rejectedRes?.data || {};

      const pendingTotal = Number(pending.total || 0);
      const activeRequests = pendingTotal;

      const jobs = jobsRes?.data?.records || jobsRes?.data?.jobs || jobsRes?.data?.data || [];
      const openPositions = Array.isArray(jobs) ? jobs.length : 0;

      const metricSnapshot = {
        totalEmployees,
        monthlyPayroll,
        activeRequests,
        openPositions,
      };

      setPreviousMetrics((prev) => prev || metricSnapshot);
      setCurrentMetrics(metricSnapshot);

      const departmentMap = users.reduce((acc, user) => {
        const key = user.department || 'Unassigned';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const deptRows = Object.entries(departmentMap)
        .map(([name, count], idx) => ({
          name,
          count,
          color: ['indigo', 'blue', 'green', 'purple', 'orange'][idx % 5],
          change: '+0',
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setDepartments(deptRows);

      const leaveActivities = [
        ...(pending.records || []).map((item) => ({
          user: item.employeeName,
          action: `submitted a ${item.leaveType} leave request`,
          time: formatRelativeTime(item.createdAt),
          sortTime: item.createdAt,
          icon: 'calendar_today',
          color: 'blue',
        })),
        ...(approved.records || []).map((item) => ({
          user: item.employeeName,
          action: `leave request approved`,
          time: formatRelativeTime(item.reviewedAt || item.updatedAt),
          sortTime: item.reviewedAt || item.updatedAt,
          icon: 'check_circle',
          color: 'green',
        })),
        ...(rejected.records || []).map((item) => ({
          user: item.employeeName,
          action: `leave request rejected`,
          time: formatRelativeTime(item.reviewedAt || item.updatedAt),
          sortTime: item.reviewedAt || item.updatedAt,
          icon: 'cancel',
          color: 'orange',
        })),
      ]
        .sort((a, b) => new Date(b.sortTime || 0) - new Date(a.sortTime || 0))
        .slice(0, 4);

      setActivities(leaveActivities);
      setLastUpdated(new Date());
      setLoadError('');
    } catch {
      setLoadError('Unable to load real-time dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const poll = setInterval(fetchDashboard, POLL_INTERVAL_MS);
    return () => clearInterval(poll);
  }, [fetchDashboard]);

  const deltas = useMemo(() => {
    const previous = previousMetrics || currentMetrics;
    return {
      totalEmployees: buildDelta(currentMetrics.totalEmployees, previous.totalEmployees),
      monthlyPayroll: buildDelta(currentMetrics.monthlyPayroll, previous.monthlyPayroll),
      activeRequests: buildDelta(currentMetrics.activeRequests, previous.activeRequests),
      openPositions: buildDelta(currentMetrics.openPositions, previous.openPositions),
    };
  }, [currentMetrics, previousMetrics]);

  const deltaBadge = (delta) => {
    if (delta.direction === 'up') {
      return {
        className: 'bg-emerald-100 text-emerald-800',
        icon: 'trending_up',
        label: `${delta.pct}%`,
      };
    }
    if (delta.direction === 'down') {
      return {
        className: 'bg-rose-100 text-rose-800',
        icon: 'trending_down',
        label: `${delta.pct}%`,
      };
    }
    return {
      className: 'bg-slate-100 text-slate-800',
      icon: 'remove',
      label: '0%',
    };
  };

  const totalEmployeesDelta = deltaBadge(deltas.totalEmployees);
  const payrollDelta = deltaBadge(deltas.monthlyPayroll);
  const requestsDelta = deltaBadge(deltas.activeRequests);
  const positionsDelta = deltaBadge(deltas.openPositions);

  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500">Welcome back, {user?.name || roleLabel}. Here&apos;s what&apos;s happening for {roleLabel} today.</p>
        <p className="text-xs text-gray-400">
          {lastUpdated ? `Last updated ${formatRelativeTime(lastUpdated)}` : 'Loading...'}
          {loadError ? ` • ${loadError}` : ''}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 - Total Employees */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Total Employees</p>
            <span className="material-symbols-outlined text-gray-500">group</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{isLoading ? '...' : formatCount(currentMetrics.totalEmployees)}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${totalEmployeesDelta.className}`}>
              <span className="material-symbols-outlined text-[14px] mr-0.5">{totalEmployeesDelta.icon}</span>
              {totalEmployeesDelta.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">vs. previous refresh</p>
        </div>

        {/* Card 2 - Monthly Payroll */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Monthly Payroll</p>
            <span className="material-symbols-outlined text-gray-500">attach_money</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{isLoading ? '...' : formatCurrencyCompact(currentMetrics.monthlyPayroll)}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${payrollDelta.className}`}>
              <span className="material-symbols-outlined text-[14px] mr-0.5">{payrollDelta.icon}</span>
              {payrollDelta.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">sum of payroll records</p>
        </div>

        {/* Card 3 - Active Requests */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Active Requests</p>
            <span className="material-symbols-outlined text-gray-500">pending_actions</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{isLoading ? '...' : formatCount(currentMetrics.activeRequests)}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${requestsDelta.className}`}>
              <span className="material-symbols-outlined text-[14px] mr-0.5">{requestsDelta.icon}</span>
              {requestsDelta.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">pending leave requests</p>
        </div>

        {/* Card 4 - Open Positions */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Open Positions</p>
            <span className="material-symbols-outlined text-gray-500">person_add</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{isLoading ? '...' : formatCount(currentMetrics.openPositions)}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${positionsDelta.className}`}>
              <span className="material-symbols-outlined text-[14px] mr-0.5">{positionsDelta.icon}</span>
              {positionsDelta.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">live recruitment jobs</p>
        </div>
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Recent Activities</h2>
            <button className="text-sm text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400">No recent activity data</p>
            ) : activities.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${activityColorClasses[activity.color]?.bg || 'bg-slate-50'}`}>
                  <span className={`material-symbols-outlined ${activityColorClasses[activity.color]?.text || 'text-slate-600'}`}>{activity.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                  <p className="text-xs text-gray-500">{activity.action}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Department Overview</h2>
            <button className="text-sm text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="space-y-4">
            {departments.length === 0 ? (
              <p className="text-sm text-gray-400">No department data available</p>
            ) : departments.map((dept, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${deptDotClasses[dept.color] || 'bg-slate-500'}`}></div>
                  <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">{dept.count}</span>
                  <span className="text-xs text-green-600 font-medium">{dept.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Announcements</h2>
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

export default Dashboard;
