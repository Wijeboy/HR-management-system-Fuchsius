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
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    attendanceRate: 0,
    totalPayroll: 0,
    turnoverRate: 0,
  });
  const [prevMetrics, setPrevMetrics] = useState(null);
  const [users, setUsers] = useState([]);

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

  const generateReport = () => {
    const id = `RPT-${String(reports.length + 1).padStart(3, '0')}`;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const item = {
      id,
      name: `Auto Report ${id}`,
      type: 'General',
      date,
      size: '1.2 MB',
      status: 'Ready',
    };
    setReports((prev) => [item, ...prev]);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-500 mt-1">Automated insights and data visualization</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <span className="material-symbols-outlined text-xl">calendar_today</span>
            Last 30 Days
          </button>
          <button onClick={exportReportList} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <span className="material-symbols-outlined text-xl">download</span>
            Export
          </button>
          <button onClick={generateReport} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
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
                    <button onClick={exportReportList} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100">
                      <span className="material-symbols-outlined text-xl">download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
