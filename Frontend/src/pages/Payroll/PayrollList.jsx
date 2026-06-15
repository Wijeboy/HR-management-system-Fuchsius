import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api';
import PayrollSectionTabs from '../../components/PayrollSectionTabs';
import { useAuth } from '../../context/AuthContext';

const defaultSummary = {
  totalGross: 0,
  totalDeductions: 0,
  totalNet: 0,
  pending: 0,
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const getStatusClass = (status) => {
  if (status === 'Processed') return 'bg-green-100 text-green-700';
  if (status === 'Pending') return 'bg-amber-100 text-amber-700';
  if (status === 'On Hold') return 'bg-blue-100 text-blue-700';
  return 'bg-red-100 text-red-700';
};

const inputClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500';

const sectionCardClass = 'rounded-xl border border-gray-200 bg-white p-6 shadow-sm';

const PayrollList = () => {
  const { user } = useAuth();
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [summary, setSummary] = useState(defaultSummary);
  const [periods, setPeriods] = useState(['All Periods']);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [periodFilter, setPeriodFilter] = useState('All Periods');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadPeriods = useCallback(async () => {
    try {
      const response = await apiClient.get('/payroll/records');
      const list = response.data?.data || [];
      const nextPeriods = ['All Periods', ...new Set(list.map((record) => record.period || record.month))];
      setPeriods(nextPeriods);
    } catch (_error) {
      setPeriods(['All Periods']);
    }
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== 'All Status') params.status = statusFilter;
      if (periodFilter !== 'All Periods') params.period = periodFilter;

      const response = await apiClient.get('/payroll/records', { params });
      setPayrollRecords(response.data?.data || []);
      setSummary(response.data?.summary || defaultSummary);
    } catch (requestError) {
      setPayrollRecords([]);
      setSummary(defaultSummary);
      setError(requestError.response?.data?.message || 'Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  }, [periodFilter, searchTerm, statusFilter]);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadRecords();
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [loadRecords]);

  const handleDelete = async (id) => {
    setActionLoading(`delete_${id}`);
    setError('');
    try {
      await apiClient.delete(`/payroll/records/${encodeURIComponent(id)}`);
      setDeleteConfirm(null);
      loadRecords();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete payroll record');
    } finally {
      setActionLoading('');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setActionLoading(`status_${id}`);
    setError('');
    try {
      await apiClient.patch(`/payroll/records/${encodeURIComponent(id)}/status`, { status: newStatus });
      setPayrollRecords((prev) =>
        prev.map((r) => (r.id === id || r._id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading('');
    }
  };

  const filteredCountLabel = useMemo(() => {
    if (loading) return 'Loading payroll records...';
    if (payrollRecords.length === 0) return 'No payroll records found';
    return `Showing ${payrollRecords.length} payroll records`;
  }, [loading, payrollRecords.length]);

  const displayRecords = useMemo(() => {
    if (user?.role === 'employee') {
      return payrollRecords.filter(
        (record) =>
          (record.employeeId?.empID || record.employeeId) === user.employeeId
      );
    }
    return payrollRecords;
  }, [payrollRecords, user]);

  const isAdmin = user?.role === 'admin' || user?.role === 'hr';

  return (
    <div className="space-y-6">
      <PayrollSectionTabs
        title="Payroll Records"
        description="Review payroll runs with clearer totals, payment details, and a faster path to the right payslip."
        helper="Use Generate Payroll for a new run, then open Payslips when you need the employee-facing statement."
        action={
          isAdmin && (
            <Link
              to="/dashboard/payroll/generate"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              <span className="material-symbols-outlined text-xl">add</span>
              Generate Payroll
            </Link>
          )
        }
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 flex-shrink-0">
                <span className="material-symbols-outlined text-2xl text-red-600">warning</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Delete Payroll Record</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Are you sure you want to delete payroll record <strong>{deleteConfirm.id}</strong> for <strong>{deleteConfirm.name}</strong>? This will also delete the linked payslip. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={actionLoading === `delete_${deleteConfirm.id}`}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === `delete_${deleteConfirm.id}` ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={sectionCardClass}>
              <p className="text-sm text-gray-500">Gross Payroll</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(summary.totalGross)}</p>
              <p className="mt-2 text-xs text-gray-500">Total earnings before deductions in this view.</p>
            </div>
            <div className={sectionCardClass}>
              <p className="text-sm text-gray-500">Total Deductions</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(summary.totalDeductions)}</p>
              <p className="mt-2 text-xs text-gray-500">Tax, statutory, insurance, leave, and other deductions.</p>
            </div>
            <div className={sectionCardClass}>
              <p className="text-sm text-gray-500">Net Pay</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(summary.totalNet)}</p>
              <p className="mt-2 text-xs text-gray-500">Combined take-home salary for the filtered records.</p>
            </div>
            <div className={sectionCardClass}>
              <p className="text-sm text-gray-500">Pending Runs</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{summary.pending}</p>
              <p className="mt-2 text-xs text-gray-500">Runs that still need final review or processing.</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className={sectionCardClass}>
              <p className="text-sm font-semibold text-gray-900">1. Find the payroll run</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Search by employee, payroll ID, status, or period to narrow the list quickly.
              </p>
            </div>
            <div className={sectionCardClass}>
              <p className="text-sm font-semibold text-gray-900">2. Review the salary totals</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Compare gross pay, deductions, and net salary before opening the detailed payslip.
              </p>
            </div>
            <div className={sectionCardClass}>
              <p className="text-sm font-semibold text-gray-900">3. Take the next action</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Open the payslip, change the status, or delete records that are no longer needed.
              </p>
            </div>
          </div>

          <div className={sectionCardClass}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Filter Payroll Records</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Search by employee, employee ID, or payroll ID, then narrow the list by pay period and status.
                </p>
                <p className="mt-2 text-sm font-medium text-indigo-700">{filteredCountLabel}</p>
              </div>
              <div className="grid flex-1 gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm font-medium text-gray-700">
                  <span>Search</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Employee, employee ID, or payroll ID"
                    className={inputClassName}
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-gray-700">
                  <span>Pay Period</span>
                  <select
                    value={periodFilter}
                    onChange={(event) => setPeriodFilter(event.target.value)}
                    className={inputClassName}
                  >
                    {periods.map((period) => (
                      <option key={period}>{period}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-gray-700">
                  <span>Status</span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className={inputClassName}
                  >
                    <option>All Status</option>
                    <option>Processed</option>
                    <option>Pending</option>
                    <option>On Hold</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {user?.role === 'employee' ? 'My Payslips' : 'Payroll Register'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'employee'
              ? 'View your personal salary statements and pay history.'
              : 'Each row shows the employee, payment period, attendance context, and salary totals.'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {user?.role !== 'employee' && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                )}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Payroll Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Attendance</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Pay Summary</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  {user?.role !== 'employee' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-900">{record.employeeId?.name || record.employeeName}</p>
                      <p className="text-xs text-gray-500">
                        {record.employeeId?.empID || record.employeeId} · {record.employeeId?.department || record.department}
                      </p>
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <p className="font-medium text-gray-900">{record.month || record.period}</p>
                    <p className="text-xs text-gray-500">
                      Payroll ID: {record.payrollID || record.id} · Paid: {record.paidDate || record.paymentDate}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <p>{record.attendance?.present ?? record.attendanceDays} days present</p>
                    <p className="text-xs text-gray-500">{record.attendance?.lopLeaves ?? record.leaveDays} leave days</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">Gross {formatCurrency(record.gross)}</p>
                    <p className="text-xs text-gray-500">Deductions {formatCurrency(record.deductions)}</p>
                    <p className="mt-1 font-bold text-indigo-700">Net {formatCurrency(record.netPay !== undefined ? record.netPay : record.net)}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isAdmin ? (
                      <select
                        value={record.status}
                        onChange={(e) => handleStatusChange(record.id, e.target.value)}
                        disabled={!!actionLoading}
                        className={`rounded-full px-3 py-1 text-xs font-medium border-0 cursor-pointer ${getStatusClass(record.status)} disabled:opacity-50`}
                      >
                        <option value="Processed">Processed</option>
                        <option value="Pending">Pending</option>
                        <option value="On Hold">On Hold</option>
                      </select>
                    ) : (
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(record.status)}`}>
                        {record.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        to={`/dashboard/payroll/payslip/${record.id}`}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                      >
                        View Payslip
                      </Link>
                      {isAdmin && (
                        <>
                          <Link
                            to={`/dashboard/payroll/generate?employee=${record.employeeId?.empID || record.employeeId}`}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                          >
                            Recalculate
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm({ id: record.id, name: record.employeeName || record.employeeId?.name || record.employeeId })}
                            disabled={!!actionLoading}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {loading && displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'employee' ? "5" : "6"} className="px-6 py-8 text-center text-sm text-gray-500">
                    Loading payroll records...
                  </td>
                </tr>
              ) : null}

              {!loading && displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'employee' ? "5" : "6"} className="px-6 py-8 text-center text-sm text-gray-500">
                    No payroll records available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <p className="text-sm text-gray-600">
            {user?.role === 'employee'
              ? `Showing ${displayRecords.length} payslip${displayRecords.length === 1 ? '' : 's'}`
              : filteredCountLabel}
          </p>
          {isAdmin && (
            <Link to="/dashboard/payroll/generate" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              Run New Payroll
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollList;
