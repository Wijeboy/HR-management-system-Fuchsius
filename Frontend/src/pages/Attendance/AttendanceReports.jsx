import React, { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/UserAvatar';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatHours = (decimal) => {
  if (!decimal && decimal !== 0) return '—';
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

const formatDisplayDate = (dateStr) => {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
};

const toInputDate = (date) => date.toISOString().split('T')[0];

const isTodayDate = (dateStr) => dateStr === toInputDate(new Date());

const computeLiveHours = (record, now = new Date()) => {
  if (!record?.checkIn) return 0;
  if (record?.checkOut) return Number(record.totalHours || 0);

  const diffMs = now.getTime() - new Date(record.checkIn).getTime();
  const hours = Math.max(0, diffMs / 3600000);
  return Number(hours.toFixed(2));
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    present: 'bg-green-100 text-green-700 border border-green-200',
    late: 'bg-amber-100 text-amber-700 border border-amber-200',
    absent: 'bg-red-100 text-red-700 border border-red-200',
    on_leave: 'bg-blue-100 text-blue-700 border border-blue-200',
  };
  const labels = { present: 'Present', late: 'Late Arrival', absent: 'Absent', on_leave: 'On Leave' };
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, pct, icon, color }) => {
  const colorMap = {
    green: { bg: 'bg-green-50', icon: 'text-green-600', pct: 'text-green-600 bg-green-100' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', pct: 'text-red-600 bg-red-100' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', pct: 'text-blue-600 bg-blue-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', pct: 'text-amber-600 bg-amber-100' },
  };
  const c = colorMap[color] || colorMap.green;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`flex items-center justify-center w-12 h-12 ${c.bg} rounded-xl`}>
          <span className={`material-symbols-outlined text-2xl ${c.icon}`}>{icon}</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.pct}`}>{pct}%</span>
      </div>
      <p className="text-sm text-gray-500 mt-4 font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AttendanceReports = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(toInputDate(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [myRecord, setMyRecord] = useState(null);
  const [myAttendanceBusy, setMyAttendanceBusy] = useState(false);
  const [myAttendanceError, setMyAttendanceError] = useState('');
  const [rowActionBusy, setRowActionBusy] = useState({});
  const [liveNow, setLiveNow] = useState(new Date());

  const myEmployeeId = user?.employeeId || '';

  // Fetch stats
  const fetchStats = useCallback(() => {
    attendanceService.getDailyStats(selectedDate).then((res) => {
      setStats(res.data.stats);
      setDepartments(res.data.departments || []);
    }).catch(() => {});
  }, [selectedDate]);

  // Fetch records
  const fetchRecords = useCallback((pg = 1) => {
    setLoading(true);
    attendanceService.getDailyAttendance({
      date: selectedDate,
      department: filterDept || undefined,
      status: filterStatus || undefined,
      page: pg,
      limit: 10,
    }).then((res) => {
      setRecords(res.data.records || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      setPage(pg);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedDate, filterDept, filterStatus]);

  const fetchMyStatus = useCallback(() => {
    if (!myEmployeeId) {
      setMyRecord(null);
      return;
    }

    attendanceService
      .getTodayStatus(myEmployeeId)
      .then((res) => setMyRecord(res.data?.record || null))
      .catch(() => setMyRecord(null));
  }, [myEmployeeId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchRecords(1); }, [fetchRecords]);
  useEffect(() => { fetchMyStatus(); }, [fetchMyStatus]);

  useEffect(() => {
    const id = setInterval(() => setLiveNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const refreshDashboard = useCallback(() => {
    fetchStats();
    fetchRecords(page);
    fetchMyStatus();
  }, [fetchStats, fetchRecords, fetchMyStatus, page]);

  const handleMyAttendanceToggle = async () => {
    if (!myEmployeeId) return;
    setMyAttendanceError('');
    setMyAttendanceBusy(true);

    try {
      if (myRecord?.checkIn && !myRecord?.checkOut) {
        await attendanceService.checkOut(myEmployeeId);
      } else {
        await attendanceService.checkIn(myEmployeeId);
      }
      refreshDashboard();
    } catch (error) {
      setMyAttendanceError(error?.response?.data?.message || 'Failed to update attendance');
    } finally {
      setMyAttendanceBusy(false);
    }
  };

  const handleManageEmployeeAttendance = async (employeeId, action) => {
    setRowActionBusy((prev) => ({ ...prev, [employeeId]: true }));
    try {
      if (action === 'checkout') {
        await attendanceService.checkOut(employeeId);
      } else {
        await attendanceService.checkIn(employeeId);
      }
      refreshDashboard();
    } catch {
      // Keep table usable even when one row action fails.
    } finally {
      setRowActionBusy((prev) => ({ ...prev, [employeeId]: false }));
    }
  };

  // Filter records by search
  const filteredRecords = records.filter((r) => {
    if (!search) return true;
    return (
      r.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeId?.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Export PDF (simple print-based)
  const handleExport = () => {
    setExportLoading(true);
    const printContent = buildPdfContent(selectedDate, stats, records);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      setExportLoading(false);
    }, 500);
  };

  const buildPdfContent = (dateStr, statsData, recs) => `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Attendance Report - ${dateStr}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #fff; padding: 40px; }
        .header { border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 28px; }
        .company { font-size: 24px; font-weight: 800; color: #4f46e5; }
        .title { font-size: 18px; font-weight: 600; color: #374151; margin-top: 4px; }
        .meta { font-size: 13px; color: #6b7280; margin-top: 6px; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
        .stat-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-value { font-size: 28px; font-weight: 800; color: #111827; margin-top: 4px; }
        .stat-pct { font-size: 12px; color: #4f46e5; font-weight: 600; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #f9fafb; padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
        td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #f3f4f6; color: #374151; }
        tr:nth-child(even) td { background: #f9fafb; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
        .present { background: #d1fae5; color: #065f46; }
        .late { background: #fef3c7; color: #92400e; }
        .absent { background: #fee2e2; color: #991b1b; }
        .on_leave { background: #dbeafe; color: #1e40af; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company">HRMS — Attendance Report</div>
        <div class="title">Daily Attendance Summary</div>
        <div class="meta">
          Date: ${new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()}
        </div>
      </div>
      ${statsData ? `
      <div class="stats">
        <div class="stat-card"><div class="stat-label">Present</div><div class="stat-value">${statsData.present}</div><div class="stat-pct">${statsData.presentPct}% of total</div></div>
        <div class="stat-card"><div class="stat-label">Absent</div><div class="stat-value">${statsData.absent}</div><div class="stat-pct">${statsData.absentPct}% of total</div></div>
        <div class="stat-card"><div class="stat-label">On Leave</div><div class="stat-value">${statsData.onLeave}</div><div class="stat-pct">${statsData.onLeavePct}% of total</div></div>
        <div class="stat-card"><div class="stat-label">Late Arrivals</div><div class="stat-value">${statsData.late}</div><div class="stat-pct">${statsData.latePct}% of total</div></div>
      </div>` : ''}
      <table>
        <thead>
          <tr>
            <th>Employee</th><th>Department</th><th>Check In</th><th>Check Out</th><th>Work Hours</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${recs.map((r) => `
            <tr>
              <td>${r.employeeName} (${r.employeeId})</td>
              <td>${r.department}</td>
              <td>${r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
              <td>${r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
              <td>${r.totalHours ? (Math.floor(r.totalHours) + 'h ' + Math.round((r.totalHours % 1) * 60) + 'min') : '—'}</td>
              <td><span class="badge ${r.status}">${{ present: 'Present', late: 'Late', absent: 'Absent', on_leave: 'On Leave' }[r.status] || r.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        <span>HRMS — Confidential Attendance Report</span>
        <span>Total Employees: ${statsData?.total || recs.length}</span>
      </div>
    </body>
    </html>
  `;

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Daily Attendance Management</h1>
          <p className="text-gray-500 mt-1">Track employee attendance &amp; work hours</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-xl">download</span>
          {exportLoading ? 'Generating...' : 'Export PDF'}
        </button>
      </div>

      {/* ── Date Selector ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-3 px-5 py-3 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <span className="material-symbols-outlined text-xl text-indigo-600">calendar_today</span>
              <span className="text-lg font-bold text-gray-900">{formatDisplayDate(selectedDate)}</span>
              <span className="material-symbols-outlined text-sm text-indigo-400">expand_more</span>
            </button>
            {showDatePicker && (
              <div className="absolute top-full mt-2 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
                <input
                  type="date"
                  value={selectedDate}
                  max={toInputDate(new Date())}
                  onChange={(e) => { setSelectedDate(e.target.value); setShowDatePicker(false); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">My Attendance</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {myRecord?.checkOut
              ? `Checked out at ${formatTime(myRecord.checkOut)}`
              : myRecord?.checkIn
                ? `Checked in at ${formatTime(myRecord.checkIn)} • Live: ${formatHours(computeLiveHours(myRecord, liveNow))}`
                : 'Not checked in yet'}
          </p>
          {myAttendanceError ? <p className="text-xs text-red-600 mt-1">{myAttendanceError}</p> : null}
        </div>
        <button
          onClick={handleMyAttendanceToggle}
          disabled={myAttendanceBusy || !!myRecord?.checkOut || !myEmployeeId}
          className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
            myRecord?.checkIn && !myRecord?.checkOut ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {myAttendanceBusy ? 'Please wait...' : myRecord?.checkIn && !myRecord?.checkOut ? 'My Check Out' : 'My Check In'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Present" value={stats?.present ?? '—'} pct={stats?.presentPct ?? '—'} icon="check_circle" color="green" />
        <StatCard label="Absent" value={stats?.absent ?? '—'} pct={stats?.absentPct ?? '—'} icon="cancel" color="red" />
        <StatCard label="On Leave" value={stats?.onLeave ?? '—'} pct={stats?.onLeavePct ?? '—'} icon="event_busy" color="blue" />
        <StatCard label="Late Arrivals" value={stats?.late ?? '—'} pct={stats?.latePct ?? '—'} icon="alarm" color="amber" />
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee name or ID..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="on_leave">On Leave</option>
            <option value="late">Late Arrivals</option>
          </select>
        </div>
      </div>

      {/* ── Attendance Table ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Employee', 'Department', 'Check In', 'Check Out', 'Work Hours', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                  <span className="material-symbols-outlined animate-spin text-2xl">refresh</span>
                </td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No records found for selected date / filters.
                </td></tr>
              ) : (
                filteredRecords.map((rec, idx) => (
                  <tr key={rec.employeeId || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={rec.employeeName}
                          image={rec.profileImage}
                          size="md"
                        />
                        <span className="text-sm font-semibold text-gray-900">{rec.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{rec.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatTime(rec.checkIn)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatTime(rec.checkOut)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatHours(computeLiveHours(rec, liveNow))}</td>
                    <td className="px-6 py-4"><StatusBadge status={rec.status} /></td>
                    <td className="px-6 py-4">
                      {!isTodayDate(selectedDate) || rec.status === 'on_leave' || rec.checkOut ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : rec.checkIn ? (
                        <button
                          onClick={() => handleManageEmployeeAttendance(rec.employeeId, 'checkout')}
                          disabled={!!rowActionBusy[rec.employeeId]}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                        >
                          {rowActionBusy[rec.employeeId] ? 'Working...' : 'Check Out'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleManageEmployeeAttendance(rec.employeeId, 'checkin')}
                          disabled={!!rowActionBusy[rec.employeeId]}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {rowActionBusy[rec.employeeId] ? 'Working...' : 'Check In'}
                        </button>
                      )}
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
            Showing {total === 0 ? 0 : (page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} employees
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchRecords(page - 1)} disabled={page <= 1}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => Math.abs(p - page) <= 2).map((p) => (
              <button key={p} onClick={() => fetchRecords(p)}
                className={`w-9 h-9 text-sm rounded-lg font-medium ${p === page ? 'bg-indigo-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => fetchRecords(page + 1)} disabled={page >= totalPages}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReports;
