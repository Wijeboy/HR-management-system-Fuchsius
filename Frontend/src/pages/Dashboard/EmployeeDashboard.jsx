import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import { leaveService } from '../../services/leaveService';
import { recruitmentService } from '../../services/recruitmentService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');

const formatTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const formatHours = (decimalHours) => {
  if (!decimalHours && decimalHours !== 0) return '0h';
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  if (h === 0 && m === 0) return '0h';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
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

// ─── Status badge component ──────────────────────────────────────────────────

const LeaveStatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  const labels = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {labels[status] || status}
    </span>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const employeeId = user?.employeeId || '';

  // Clock
  const [now, setNow] = useState(new Date());
  const clockRef = useRef(null);

  // Data states
  const [todayRecord, setTodayRecord] = useState(null);
  const [weekData, setWeekData] = useState({ days: [], totalWeekHours: 0 });
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinError, setCheckinError] = useState('');

  // Live clock
  useEffect(() => {
    clockRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockRef.current);
  }, []);

  // Fetch all data
  const fetchDashboardData = useCallback(async () => {
    if (!employeeId) return;
    try {
      const [todayRes, weekRes, balanceRes, historyRes, schedulesRes] = await Promise.allSettled([
        attendanceService.getTodayStatus(employeeId),
        attendanceService.getWeekly(employeeId),
        leaveService.getBalance(employeeId),
        leaveService.getHistory(employeeId, 1, 5),
        recruitmentService.getEmployeeSchedules(employeeId),
      ]);

      if (todayRes.status === 'fulfilled') setTodayRecord(todayRes.value.data?.record || null);
      if (weekRes.status === 'fulfilled') setWeekData(weekRes.value.data || { days: [], totalWeekHours: 0 });
      if (balanceRes.status === 'fulfilled') {
        const raw = balanceRes.value.data?.balance || balanceRes.value.data || null;
        // Transform flat backend balance { medical, vacation, medicalUsed, vacationUsed }
        // into the array format the dashboard UI expects
        if (raw && (raw.medical !== undefined || raw.vacation !== undefined)) {
          setLeaveBalance({
            balances: [
              { type: 'vacation', remaining: raw.vacation ?? 0, used: raw.vacationUsed ?? 0 },
              { type: 'medical', remaining: raw.medical ?? 0, used: raw.medicalUsed ?? 0 },
            ],
          });
        } else if (raw?.balances) {
          setLeaveBalance(raw);
        } else {
          setLeaveBalance(null);
        }
      }
      if (historyRes.status === 'fulfilled') setLeaveHistory(historyRes.value.data?.records || []);
      if (schedulesRes.status === 'fulfilled') {
        const raw = schedulesRes.value.data;
        setSchedules(Array.isArray(raw) ? raw : raw?.schedules || raw?.data || []);
      }
    } catch {
      // Silently handle errors
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchDashboardData();
    const poll = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(poll);
  }, [fetchDashboardData]);

  // Check-in / Check-out
  const handleCheckInOut = async () => {
    setCheckinError('');
    setCheckinLoading(true);
    try {
      if (!todayRecord || !todayRecord.checkIn) {
        const res = await attendanceService.checkIn(employeeId);
        setTodayRecord(res.data.record);
      } else if (!todayRecord.checkOut) {
        const res = await attendanceService.checkOut(employeeId);
        setTodayRecord(res.data.record);
      }
      // Refresh week data after check action
      attendanceService.getWeekly(employeeId).then((res) => setWeekData(res.data)).catch(() => {});
    } catch (err) {
      setCheckinError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setCheckinLoading(false);
    }
  };

  const isCheckedIn = todayRecord?.checkIn && !todayRecord?.checkOut;
  const isCheckedOut = todayRecord?.checkIn && todayRecord?.checkOut;

  // Compute leave balance totals
  const totalLeaveRemaining = leaveBalance?.balances
    ? leaveBalance.balances.reduce((sum, b) => sum + (b.remaining ?? 0), 0)
    : 0;
  const totalLeaveUsed = leaveBalance?.balances
    ? leaveBalance.balances.reduce((sum, b) => sum + (b.used ?? 0), 0)
    : 0;

  const todayDateStr = new Date().toISOString().split('T')[0];

  const currentDateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 1 — Welcome Banner + Clock
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-8 text-white shadow-lg">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full"></div>
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full"></div>

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left — Greeting */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl">
                <span className="material-symbols-outlined text-2xl">waving_hand</span>
              </div>
              <div>
                <p className="text-indigo-200 text-sm font-medium">{greeting}</p>
                <h1 className="text-2xl font-bold">{user?.name || 'Employee'}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium">
                <span className="material-symbols-outlined text-sm">badge</span>
                {user?.employeeId || '—'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium">
                <span className="material-symbols-outlined text-sm">apartment</span>
                {user?.department || '—'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium">
                <span className="material-symbols-outlined text-sm">work</span>
                {user?.jobTitle || 'Employee'}
              </span>
            </div>
          </div>

          {/* Right — Live Clock */}
          <div className="flex flex-col items-end gap-1">
            <div className="font-mono">
              <span className="text-4xl font-bold tabular-nums">
                {pad(now.getHours())}:{pad(now.getMinutes())}
              </span>
              <span className="text-2xl font-bold text-indigo-300 tabular-nums ml-1">
                :{pad(now.getSeconds())}
              </span>
            </div>
            <p className="text-indigo-200 text-sm">{currentDateStr}</p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 2 — Quick Actions
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Check In / Out */}
        <button
          onClick={!isCheckedOut ? handleCheckInOut : undefined}
          disabled={isCheckedOut || checkinLoading}
          className={`group relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 ${
            isCheckedOut
              ? 'border-gray-200 bg-gray-50 cursor-default'
              : isCheckedIn
              ? 'border-red-200 bg-red-50 hover:border-red-400 hover:shadow-md cursor-pointer'
              : 'border-indigo-200 bg-indigo-50 hover:border-indigo-400 hover:shadow-md cursor-pointer'
          }`}
        >
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${
            isCheckedOut
              ? 'bg-gray-200'
              : isCheckedIn
              ? 'bg-red-500 text-white group-hover:bg-red-600'
              : 'bg-indigo-600 text-white group-hover:bg-indigo-700'
          }`}>
            <span className="material-symbols-outlined text-xl">
              {isCheckedOut ? 'check_circle' : isCheckedIn ? 'logout' : 'login'}
            </span>
          </div>
          <span className={`text-sm font-semibold ${
            isCheckedOut ? 'text-gray-500' : isCheckedIn ? 'text-red-700' : 'text-indigo-700'
          }`}>
            {checkinLoading ? 'Processing...' : isCheckedOut ? 'Done for Today' : isCheckedIn ? 'Check Out' : 'Check In'}
          </span>
          {todayRecord?.checkIn && (
            <span className="text-xs text-gray-500">
              In: {formatTime(todayRecord.checkIn)}
              {todayRecord.checkOut ? ` · Out: ${formatTime(todayRecord.checkOut)}` : ''}
            </span>
          )}
        </button>

        {/* Apply Leave */}
        <Link
          to="/leave/apply"
          className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500 text-white group-hover:bg-emerald-600 transition-colors">
            <span className="material-symbols-outlined text-xl">calendar_add_on</span>
          </div>
          <span className="text-sm font-semibold text-emerald-700">Apply Leave</span>
          <span className="text-xs text-gray-500">{totalLeaveRemaining} days remaining</span>
        </Link>

        {/* View Payslip */}
        <Link
          to="/dashboard/payroll/payslips"
          className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-amber-200 bg-amber-50 hover:border-amber-400 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500 text-white group-hover:bg-amber-600 transition-colors">
            <span className="material-symbols-outlined text-xl">receipt_long</span>
          </div>
          <span className="text-sm font-semibold text-amber-700">View Payslip</span>
          <span className="text-xs text-gray-500">Salary statements</span>
        </Link>

        {/* My Attendance */}
        <Link
          to="/attendance"
          className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-purple-200 bg-purple-50 hover:border-purple-400 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500 text-white group-hover:bg-purple-600 transition-colors">
            <span className="material-symbols-outlined text-xl">schedule</span>
          </div>
          <span className="text-sm font-semibold text-purple-700">My Attendance</span>
          <span className="text-xs text-gray-500">Full history</span>
        </Link>
      </div>

      {checkinError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <span className="material-symbols-outlined text-lg">error</span>
          {checkinError}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 3 — KPI Cards
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today's Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Today's Status</p>
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
              isCheckedOut ? 'bg-blue-100' : isCheckedIn ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <span className={`material-symbols-outlined text-xl ${
                isCheckedOut ? 'text-blue-600' : isCheckedIn ? 'text-green-600' : 'text-gray-500'
              }`}>
                {isCheckedOut ? 'task_alt' : isCheckedIn ? 'radio_button_checked' : 'radio_button_unchecked'}
              </span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {isCheckedOut ? 'Completed' : isCheckedIn ? 'Working' : 'Not In'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {todayRecord?.checkIn ? `Since ${formatTime(todayRecord.checkIn)}` : 'No check-in recorded'}
          </p>
        </div>

        {/* Leave Balance */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Leave Balance</p>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100">
              <span className="material-symbols-outlined text-xl text-emerald-600">event_available</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalLeaveRemaining} <span className="text-base font-medium text-gray-500">days</span></p>
          <p className="mt-1 text-xs text-gray-500">{totalLeaveUsed} days used this year</p>
        </div>

        {/* Hours This Week */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Hours This Week</p>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100">
              <span className="material-symbols-outlined text-xl text-indigo-600">timer</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatHours(weekData.totalWeekHours)}</p>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((weekData.totalWeekHours / 40) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="mt-1 text-xs text-gray-500">of 40h target</p>
        </div>

        {/* Upcoming Interviews */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Interviews</p>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100">
              <span className="material-symbols-outlined text-xl text-purple-600">event</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
          <p className="mt-1 text-xs text-gray-500">
            {schedules.length > 0 ? 'scheduled interview(s)' : 'No upcoming interviews'}
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 4 — Weekly Attendance Chart + Leave Balance Breakdown
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Attendance Visual */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Weekly Attendance</h2>
              <p className="text-xs text-gray-500 mt-0.5">Mon – Sun, current week</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total</p>
              <p className="text-xl font-bold text-indigo-600">{formatHours(weekData.totalWeekHours)}</p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end gap-3 h-44">
            {weekData.days.length > 0 ? weekData.days.map((day, idx) => {
              const maxHours = 10;
              const heightPct = Math.min((day.hours / maxHours) * 100, 100);
              const isToday = day.date === todayDateStr;
              const hasHours = day.hours > 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  {/* Hours label */}
                  <span className={`text-xs font-semibold ${hasHours ? 'text-gray-700' : 'text-gray-300'}`}>
                    {hasHours ? formatHours(day.hours) : '—'}
                  </span>
                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isToday
                        ? 'bg-gradient-to-t from-indigo-600 to-indigo-400'
                        : hasHours
                        ? 'bg-gradient-to-t from-emerald-500 to-emerald-300'
                        : 'bg-gray-100'
                    }`}
                    style={{ height: hasHours ? `${Math.max(heightPct, 8)}%` : '8%' }}
                  ></div>
                  {/* Day label */}
                  <span className={`text-xs font-bold uppercase ${
                    isToday ? 'text-indigo-600' : 'text-gray-400'
                  }`}>
                    {day.label}
                  </span>
                </div>
              );
            }) : (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                No weekly data available
              </div>
            )}
          </div>
        </div>

        {/* Leave Balance Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Leave Balance</h2>
            <Link to="/leave/balance" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {leaveBalance?.balances && leaveBalance.balances.length > 0 ? (
              leaveBalance.balances.map((balance, idx) => {
                const total = (balance.remaining ?? 0) + (balance.used ?? 0);
                const usedPct = total > 0 ? (balance.used / total) * 100 : 0;
                const typeColors = {
                  annual: { bar: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
                  sick: { bar: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700' },
                  personal: { bar: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
                  casual: { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
                };
                const colors = typeColors[balance.type?.toLowerCase()] || { bar: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700' };

                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm font-medium capitalize ${colors.text}`}>{balance.type || 'Other'}</span>
                      <span className="text-sm text-gray-600 font-semibold">
                        {balance.remaining ?? 0} <span className="text-gray-400 font-normal">/ {total}</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`${colors.bar} h-2.5 rounded-full transition-all duration-500`}
                        style={{ width: `${100 - usedPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-400">No leave balance data</p>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 5 — Recent Leave Requests + Upcoming Interviews
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leave Requests */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Leave Requests</h2>
              <p className="text-xs text-gray-500 mt-0.5">Your latest submissions</p>
            </div>
            <Link to="/leave/requests" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View All
            </Link>
          </div>

          {leaveHistory.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">event_busy</span>
              <p className="text-sm text-gray-400">No leave requests found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {leaveHistory.map((leave, idx) => (
                <div key={idx} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                    leave.status === 'approved' ? 'bg-emerald-100' :
                    leave.status === 'rejected' ? 'bg-rose-100' : 'bg-amber-100'
                  }`}>
                    <span className={`material-symbols-outlined text-lg ${
                      leave.status === 'approved' ? 'text-emerald-600' :
                      leave.status === 'rejected' ? 'text-rose-600' : 'text-amber-600'
                    }`}>
                      {leave.status === 'approved' ? 'check_circle' :
                       leave.status === 'rejected' ? 'cancel' : 'schedule'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 capitalize">{leave.leaveType} Leave</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                    </p>
                  </div>
                  <LeaveStatusBadge status={leave.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Interviews */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Interview Schedule</h2>
              <p className="text-xs text-gray-500 mt-0.5">Your upcoming sessions</p>
            </div>
            <Link to="/recruitment/applicants" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View All
            </Link>
          </div>

          {schedules.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">event</span>
              <p className="text-sm text-gray-400">No upcoming interviews</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {schedules.slice(0, 5).map((schedule, idx) => (
                <div key={idx} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100">
                    <span className="material-symbols-outlined text-lg text-purple-600">videocam</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{schedule.jobTitle || schedule.title || 'Interview'}</p>
                    <p className="text-xs text-gray-500">
                      {schedule.date ? formatDate(schedule.date) : '—'}
                      {schedule.time ? ` at ${schedule.time}` : ''}
                    </p>
                  </div>
                  {schedule.type && (
                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 border border-purple-200 capitalize">
                      {schedule.type}
                    </span>
                  )}
                </div>
              ))}
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

export default EmployeeDashboard;
