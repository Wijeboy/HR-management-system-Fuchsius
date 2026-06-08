import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendanceService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
    year: 'numeric',
  });
};

const formatHours = (decimalHours) => {
  if (!decimalHours && decimalHours !== 0) return '—';
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

const pad = (n) => String(n).padStart(2, '0');

// ─── Component ────────────────────────────────────────────────────────────────
const AttendanceList = () => {
  const { user } = useAuth();

  // Clock state
  const [now, setNow] = useState(new Date());
  const clockRef = useRef(null);

  // Check-in/out state
  const [todayRecord, setTodayRecord] = useState(null);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinError, setCheckinError] = useState('');

  // Weekly state
  const [weekData, setWeekData] = useState({ days: [], totalWeekHours: 0 });

  // History state
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Get employeeId from user context
  // TODO: When real auth exists, user.employeeId will be from DB
  const employeeId = user?.employeeId || 'EMP004';

  // Live clock
  useEffect(() => {
    clockRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockRef.current);
  }, []);

  // Fetch today status
  useEffect(() => {
    if (!employeeId) return;
    attendanceService
      .getTodayStatus(employeeId)
      .then((res) => setTodayRecord(res.data.record))
      .catch(() => {});
  }, [employeeId]);

  // Fetch weekly attendance
  useEffect(() => {
    if (!employeeId) return;
    attendanceService
      .getWeekly(employeeId)
      .then((res) => setWeekData(res.data))
      .catch(() => {});
  }, [employeeId, todayRecord]);

  // Fetch history
  const fetchHistory = useCallback((page = 1) => {
    setHistoryLoading(true);
    attendanceService
      .getHistory(employeeId, page, 10)
      .then((res) => {
        setHistory(res.data.records);
        setHistoryTotal(res.data.total);
        setHistoryTotalPages(res.data.totalPages);
        setHistoryPage(page);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) fetchHistory(1);
  }, [employeeId, fetchHistory, todayRecord]);

  // Check-in / Check-out handler
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
    } catch (err) {
      setCheckinError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setCheckinLoading(false);
    }
  };

  const isCheckedIn = todayRecord?.checkIn && !todayRecord?.checkOut;
  const isCheckedOut = todayRecord?.checkIn && todayRecord?.checkOut;

  const currentDateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const today = new Date();
  const todayDateStr = today.toISOString().split('T')[0];

  return (
    <div className="space-y-8">
      {/* ── Page Title ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-gray-500 mt-1">Track your daily attendance and work hours</p>
      </div>

      {/* ── Top Section: Clock + Weekly Overview ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Clock & Check-in Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-start justify-center gap-4">
          {/* Clock icon + time */}
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-xl">
              <span className="material-symbols-outlined text-3xl text-indigo-600">schedule</span>
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Live Clock</span>
          </div>

          {/* Time display */}
          <div className="font-mono">
            <span className="text-5xl font-bold text-gray-900 tabular-nums">
              {pad(now.getHours())}:{pad(now.getMinutes())}
            </span>
            <span className="text-3xl font-bold text-indigo-500 tabular-nums ml-1">
              :{pad(now.getSeconds())}
            </span>
          </div>

          {/* Date */}
          <p className="text-sm text-gray-500 font-medium">{currentDateStr}</p>

          {/* Status badge */}
          {isCheckedOut ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-sm font-medium text-blue-700">
                Checked out at {formatTime(todayRecord.checkOut)}
              </span>
            </div>
          ) : isCheckedIn ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm font-medium text-green-700">
                Checked in at {formatTime(todayRecord.checkIn)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              <span className="text-sm font-medium text-gray-500">Not checked in yet</span>
            </div>
          )}

          {/* Check-in / Check-out button */}
          {!isCheckedOut && (
            <button
              onClick={handleCheckInOut}
              disabled={checkinLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                isCheckedIn
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <span className="material-symbols-outlined text-xl">
                {isCheckedIn ? 'logout' : 'login'}
              </span>
              {checkinLoading ? 'Processing...' : isCheckedIn ? 'Check Out' : 'Check In'}
            </button>
          )}

          {isCheckedOut && (
            <div className="w-full py-3 px-6 rounded-xl bg-gray-100 text-gray-500 text-sm text-center font-medium">
              ✓ Attendance recorded for today
            </div>
          )}

          {checkinError && (
            <p className="text-red-600 text-sm">{checkinError}</p>
          )}
        </div>

        {/* Weekly Attendance Overview */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Weekly Attendance Overview</h2>
              <p className="text-xs text-gray-500 mt-0.5">Mon – Sun, current week</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total This Week</p>
              <p className="text-2xl font-bold text-indigo-600">
                {formatHours(weekData.totalWeekHours)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekData.days.map((day, idx) => {
              const isToday = day.date === todayDateStr;
              const hasHours = day.hours > 0;
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                    isToday
                      ? 'border-indigo-300 bg-indigo-50'
                      : hasHours
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    isToday ? 'text-indigo-600' : 'text-gray-400'
                  }`}>
                    {day.label}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    hasHours
                      ? 'bg-green-500'
                      : isToday
                      ? 'bg-indigo-200'
                      : 'bg-gray-200'
                  }`}>
                    <span className="material-symbols-outlined text-sm text-white">
                      {hasHours ? 'check' : 'remove'}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold text-center leading-tight ${
                    hasHours ? 'text-green-700' : 'text-gray-400'
                  }`}>
                    {hasHours ? formatHours(day.hours) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── My Attendance History ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">My Attendance History</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your past attendance records</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Date', 'Check In', 'Check Out', 'Total Hours', 'Status'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {historyLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    <span className="material-symbols-outlined animate-spin text-2xl">refresh</span>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                history.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatDate(rec.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatTime(rec.checkIn)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatTime(rec.checkOut)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatHours(rec.totalHours)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rec.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {historyTotal === 0 ? 0 : (historyPage - 1) * 10 + 1} to{' '}
            {Math.min(historyPage * 10, historyTotal)} of {historyTotal} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchHistory(historyPage - 1)}
              disabled={historyPage <= 1}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: historyTotalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - historyPage) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => fetchHistory(p)}
                  className={`w-9 h-9 text-sm rounded-lg font-medium transition-colors ${
                    p === historyPage
                      ? 'bg-indigo-600 text-white'
                      : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            <button
              onClick={() => fetchHistory(historyPage + 1)}
              disabled={historyPage >= historyTotalPages}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    present: 'bg-green-100 text-green-700',
    late: 'bg-yellow-100 text-yellow-700',
    absent: 'bg-red-100 text-red-700',
    on_leave: 'bg-blue-100 text-blue-700',
  };
  const labels = { present: 'Present', late: 'Late', absent: 'Absent', on_leave: 'On Leave' };
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
};

export default AttendanceList;
