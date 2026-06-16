import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { attendanceService } from '../../services/attendanceService';
import apiClient from '../../services/api';
import { userService } from '../../services/userService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

const Reports = () => {
  const [timePeriod, setTimePeriod] = useState('30');
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    attendanceRate: 0,
    totalPayroll: 0,
    turnoverRate: 0,
  });
  const [prevMetrics, setPrevMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [reportType, setReportType] = useState('General');
  const [reportName, setReportName] = useState('');

  const [reports, setReports] = useState([
    { id: 'RPT-001', name: 'Q1 Employee Performance', type: 'Performance', date: 'Mar 1, 2026', size: '2.4 MB', status: 'Ready' },
    { id: 'RPT-002', name: 'February Attendance Report', type: 'Attendance', date: 'Feb 28, 2026', size: '1.8 MB', status: 'Ready' },
    { id: 'RPT-003', name: 'Department Budget Analysis', type: 'Financial', date: 'Feb 15, 2026', size: '3.1 MB', status: 'Ready' },
  ]);

  const fetchReportData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [usersRes, statsRes, payrollRes] = await Promise.all([
        userService.getUsers(),
        attendanceService.getDailyStats(today),
        apiClient.get('/payroll/records', { params: { page: 1, limit: 500 } }),
      ]);

      const usersList = usersRes?.data?.users || [];
      setUsers(usersList);

      const totalEmployees = Number(usersRes?.data?.total || usersList.length || 0);

      const dailyStats = statsRes?.data?.stats || {};
      const present = Number(dailyStats.present || 0);
      const late = Number(dailyStats.late || 0);
      const total = Number(dailyStats.total || totalEmployees || 0);
      const attendanceRate = total > 0 ? Number((((present + late) / total) * 100).toFixed(1)) : 0;

      const payrollSummary = payrollRes?.data?.summary || {};
      const totalPayroll = Number(payrollSummary.totalNet || 0);

      const inactiveCount = usersList.filter((user) => String(user.status).toLowerCase() === 'inactive').length;
      const turnoverRate = totalEmployees > 0 ? Number(((inactiveCount / totalEmployees) * 100).toFixed(1)) : 0;

      const snapshot = { totalEmployees, attendanceRate, totalPayroll, turnoverRate };
      setPrevMetrics((prev) => prev || snapshot);
      setMetrics(snapshot);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const pctDelta = (current, previous) => {
    const prev = Number(previous || 0);
    const curr = Number(current || 0);
    if (prev <= 0) return 0;
    return Number((((curr - prev) / prev) * 100).toFixed(1));
  };

  const deltas = useMemo(() => {
    const prev = prevMetrics || metrics;
    return {
      employees: pctDelta(metrics.totalEmployees, prev.totalEmployees),
      attendance: pctDelta(metrics.attendanceRate, prev.attendanceRate),
      payroll: pctDelta(metrics.totalPayroll, prev.totalPayroll),
      turnover: pctDelta(metrics.turnoverRate, prev.turnoverRate),
    };
  }, [metrics, prevMetrics]);

  const formatDelta = (value) => `${value > 0 ? '+' : ''}${value}%`;
  const deltaClass = (value) => (value >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100');

  const employeeGrowthData = useMemo(() => {
    const labels = [];
    const data = [];
    const now = new Date();

    for (let offset = 5; offset >= 0; offset -= 1) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
      labels.push(monthDate.toLocaleString('en-US', { month: 'short' }));

      const count = users.filter((user) => {
        if (!user.createdAt) return true;
        return new Date(user.createdAt).getTime() <= monthEnd.getTime();
      }).length;

      data.push(count);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Total Employees',
          data,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.15)',
          fill: true,
          tension: 0.35,
        },
      ],
    };
  }, [users]);

  const departmentDistributionData = useMemo(() => ({
    labels: (() => {
      const counts = users.reduce((acc, user) => {
        const key = user.department || 'Unassigned';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      return Object.keys(counts).length > 0 ? Object.keys(counts) : ['No Data'];
    })(),
    datasets: [
      {
        data: (() => {
          const counts = users.reduce((acc, user) => {
            const key = user.department || 'Unassigned';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});
          return Object.keys(counts).length > 0 ? Object.values(counts) : [1];
        })(),
        backgroundColor: ['#4f46e5', '#3b82f6', '#22c55e', '#a855f7', '#f97316'],
        borderWidth: 0,
      },
    ],
  }), [users]);

  const handleOpenModal = () => {
    setReportType('General');
    setReportName('');
    setShowModal(true);
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    const id = `RPT-${String(reports.length + 1).padStart(3, '0')}`;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const item = {
      id,
      name: reportName.trim() || `Auto Report ${id}`,
      type: reportType,
      date,
      size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
      status: 'Ready',
    };
    setReports((prev) => [item, ...prev]);
    setShowModal(false);
  };

  const exportReportList = () => {
    const header = 'Report ID,Report Name,Type,Generated,Size,Status';
    const rows = reports.map((r) => [r.id, r.name, r.type, r.date, r.size, r.status].join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-reports.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadReportData = async (report) => {
    try {
      let csv = '';
      let filename = `${report.name.replace(/\s+/g, '_').toLowerCase()}.csv`;

      if (report.type === 'General') {
        const header = 'Employee ID,Name,Email,Department,Role,Status,Join Date\n';
        const rows = users.map(u => `${u.employeeId || ''},${u.name || ''},${u.email || ''},${u.department || ''},${u.role || ''},${u.status || ''},${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}`);
        csv = header + rows.join('\n');
      } else if (report.type === 'Attendance') {
        // Fetch actual attendance data
        const res = await apiClient.get('/attendance/daily', { params: { limit: 100 } });
        const records = res.data?.data || [];
        const header = 'Date,Employee,Status,Check In,Check Out,Work Hours\n';
        const rows = records.map(r => `${r.date || ''},${r.employeeName || ''},${r.status || ''},${r.checkIn || ''},${r.checkOut || ''},${r.workHours || ''}`);
        csv = header + rows.join('\n');
      } else if (report.type === 'Financial') {
        // Fetch actual payroll data
        const res = await apiClient.get('/payroll/records', { params: { limit: 100 } });
        const records = res.data?.data || [];
        const header = 'Payroll ID,Employee,Period,Gross Pay,Deductions,Net Pay,Status\n';
        const rows = records.map(r => `${r.id || ''},${r.employeeName || ''},${r.payPeriod || ''},${r.gross || ''},${r.deductions || ''},${r.net || ''},${r.status || ''}`);
        csv = header + rows.join('\n');
      } else if (report.type === 'Performance') {
        // Fetch actual performance data
        const res = await apiClient.get('/performance/goals');
        const goals = res.data?.data || [];
        const header = 'Employee,Goal,Metric,Target,Current,Progress %,Status\n';
        const rows = goals.map(g => `${g.employeeName || ''},${g.goal || ''},${g.metric || ''},${g.target || ''},${g.current || ''},${g.progress || 0},${g.status || ''}`);
        csv = header + rows.join('\n');
      } else {
        // Fallback
        const header = 'Report ID,Report Name,Type,Generated,Size,Status\n';
        csv = header + `${report.id},${report.name},${report.type},${report.date},${report.size},${report.status}`;
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report data:', err);
      alert('Failed to generate the report data. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-500 mt-1">Automated insights and data visualization</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="appearance-none flex items-center gap-2 pl-10 pr-8 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white text-sm font-medium outline-none cursor-pointer"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">This Year</option>
            </select>
            <span className="material-symbols-outlined text-xl absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              calendar_today
            </span>
          </div>
          <button onClick={exportReportList} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <span className="material-symbols-outlined text-xl">download</span>
            Export
          </button>
          <button onClick={handleOpenModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <span className="material-symbols-outlined text-xl">add</span>
            Generate Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg">
              <span className="material-symbols-outlined text-2xl text-blue-600">group</span>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${deltaClass(deltas.employees)}`}>{formatDelta(deltas.employees)}</span>
          </div>
          <p className="text-sm font-medium text-gray-500 mt-4">Total Employees</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{isLoading ? '...' : metrics.totalEmployees}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-lg">
              <span className="material-symbols-outlined text-2xl text-green-600">trending_up</span>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${deltaClass(deltas.attendance)}`}>{formatDelta(deltas.attendance)}</span>
          </div>
          <p className="text-sm font-medium text-gray-500 mt-4">Attendance Rate</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{isLoading ? '...' : `${metrics.attendanceRate}%`}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-50 rounded-lg">
              <span className="material-symbols-outlined text-2xl text-purple-600">payments</span>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${deltaClass(deltas.payroll)}`}>{formatDelta(deltas.payroll)}</span>
          </div>
          <p className="text-sm font-medium text-gray-500 mt-4">Total Payroll</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{isLoading ? '...' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(metrics.totalPayroll)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-50 rounded-lg">
              <span className="material-symbols-outlined text-2xl text-orange-600">person_off</span>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${deltaClass(deltas.turnover)}`}>{formatDelta(deltas.turnover)}</span>
          </div>
          <p className="text-sm font-medium text-gray-500 mt-4">Turnover Rate</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{isLoading ? '...' : `${metrics.turnoverRate}%`}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Growth Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Employee Growth Trend</h2>
              <p className="text-sm text-gray-500">Year-over-year comparison</p>
            </div>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <span className="material-symbols-outlined text-xl">more_vert</span>
            </button>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <Line
              data={employeeGrowthData}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: false },
                },
              }}
            />
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Department Distribution</h2>
              <p className="text-sm text-gray-500">Employee allocation by department</p>
            </div>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <span className="material-symbols-outlined text-xl">more_vert</span>
            </button>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <Doughnut
              data={departmentDistributionData}
              options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
        </div>
      </div>

      {/* Recent Reports Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Generated Reports</h2>
          <p className="text-sm text-gray-500">Recently created analytics reports</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Report Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Generated</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Size</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg">
                        <span className="material-symbols-outlined text-xl text-blue-600">description</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{report.name}</p>
                        <p className="text-xs text-gray-500">{report.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                      {report.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{report.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{report.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => downloadReportData(report)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100">
                      <span className="material-symbols-outlined text-xl">download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Report Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Generate New Report</h3>
            <form onSubmit={handleGenerate} className="space-y-4">
              <label className="block space-y-1 text-sm font-medium text-gray-700">
                <span>Report Name (Optional)</span>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g. Q3 Performance Summary"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </label>
              <label className="block space-y-1 text-sm font-medium text-gray-700">
                <span>Report Type</span>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="General">General Data Report</option>
                  <option value="Attendance">Attendance & Time-Off</option>
                  <option value="Performance">Performance & KPIs</option>
                  <option value="Financial">Payroll & Financial</option>
                </select>
              </label>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
