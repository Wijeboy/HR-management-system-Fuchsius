import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { leaveService } from '../../services/leaveService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDateRange = (startDate, endDate) => {
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  const start = new Date(startDate).toLocaleDateString('en-US', opts);
  if (!endDate) return start;
  const end = new Date(endDate).toLocaleDateString('en-US', opts);
  return `${start} – ${end}`;
};

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-amber-100 text-amber-700 border border-amber-200',
    approved: 'bg-green-100 text-green-700 border border-green-200',
    rejected: 'bg-red-100 text-red-700 border border-red-200',
  };
  const labels = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
};

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
const ConfirmDeleteModal = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-sm w-full">
      <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-xl mx-auto mb-4">
        <span className="material-symbols-outlined text-2xl text-red-600">delete</span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 text-center">Delete Leave Request?</h3>
      <p className="text-sm text-gray-500 text-center mt-2">
        This action cannot be undone. The request will be permanently removed.
      </p>
      <div className="flex gap-3 mt-6">
        <button onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm}
          className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors">
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── Balance Card ─────────────────────────────────────────────────────────────
const BalanceCard = ({ type, remaining, total, icon, color }) => {
  const used = total - remaining;
  const pct = total > 0 ? (used / total) * 100 : 0;
  const colorMap = {
    indigo: { icon: 'bg-indigo-50 text-indigo-600', bar: 'bg-indigo-500', dot: 'bg-indigo-500', num: 'text-indigo-600' },
    teal: { icon: 'bg-teal-50 text-teal-600', bar: 'bg-teal-500', dot: 'bg-teal-500', num: 'text-teal-600' },
  };
  const c = colorMap[color] || colorMap.indigo;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center flex flex-col items-center gap-3">
      <div className={`flex items-center justify-center w-14 h-14 rounded-2xl ${c.icon.split(' ')[0]}`}>
        <span className={`material-symbols-outlined text-3xl ${c.icon.split(' ')[1]}`}>{icon}</span>
      </div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{type}</h3>
      <div>
        <span className={`text-5xl font-black ${c.num}`}>{remaining}</span>
        <span className="text-lg text-gray-400 font-medium ml-1">days left</span>
      </div>
      <div className="w-full">
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${c.bar} rounded-full transition-all duration-700`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{used} used of {total} total days</p>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const LeaveRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const employeeId = user?.employeeId || 'EMP004';

  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Show success message after redirect from ApplyLeave
  useEffect(() => {
    if (location.state?.success) {
      setSuccessMsg('Your leave request has been submitted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      // Clear state
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const fetchBalance = useCallback(() => {
    leaveService.getBalance(employeeId)
      .then((res) => setBalance(res.data.balance))
      .catch(() => {});
  }, [employeeId]);

  const fetchHistory = useCallback((pg = 1) => {
    setHistoryLoading(true);
    leaveService.getHistory(employeeId, pg, 10)
      .then((res) => {
        setHistory(res.data.records || []);
        setHistoryTotal(res.data.total || 0);
        setHistoryTotalPages(res.data.totalPages || 1);
        setHistoryPage(pg);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [employeeId]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);
  useEffect(() => { fetchHistory(1); }, [fetchHistory]);

  const handleDelete = async (id) => {
    try {
      await leaveService.deleteLeave(id, employeeId);
      setDeleteTarget(null);
      fetchBalance();
      fetchHistory(historyPage);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete request.');
    }
  };

  const handleUpdate = (record) => {
    navigate('/leave/apply', { state: { editRecord: record } });
  };

  return (
    <div className="space-y-8">
      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDeleteModal
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Success Toast */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-5 py-3 rounded-xl text-sm font-medium">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          {successMsg}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Leave Management Portal</h1>
          <p className="text-gray-500 mt-1.5 text-sm max-w-lg mx-auto">
            Monitor your leave balance, request leaves and track approval status
          </p>
        </div>
        <button
          onClick={() => navigate('/leave/apply')}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm flex-shrink-0"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Apply Leave
        </button>
      </div>

      {/* ── Balance Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
        <BalanceCard
          type="Medical"
          remaining={balance?.medical ?? 12}
          total={12}
          icon="local_hospital"
          color="indigo"
        />
        <BalanceCard
          type="Vacation"
          remaining={balance?.vacation ?? 18}
          total={18}
          icon="beach_access"
          color="teal"
        />
      </div>

      {/* ── My Leave History ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">My Leave History</h2>
          <p className="text-sm text-gray-500 mt-0.5">All your submitted leave requests</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Leave Type', 'Duration', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {historyLoading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                  <span className="material-symbols-outlined animate-spin text-2xl">refresh</span>
                </td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-gray-200 block mb-2">event_busy</span>
                  <p className="text-sm text-gray-400">No leave requests found.</p>
                </td></tr>
              ) : (
                history.map((rec) => (
                  <tr key={rec._id} className="hover:bg-gray-50 transition-colors">
                    {/* Leave Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${rec.leaveType === 'medical' ? 'bg-blue-500' : 'bg-orange-400'}`} />
                        <span className="text-sm font-medium text-gray-800 capitalize">{rec.leaveType}</span>
                      </div>
                    </td>
                    {/* Duration */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-800">{formatDateRange(rec.startDate, rec.endDate)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{rec.durationDays} day{rec.durationDays !== 1 ? 's' : ''}</p>
                    </td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={rec.status} />
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {/* Update - only if pending */}
                        <button
                          onClick={() => rec.status === 'pending' && handleUpdate(rec)}
                          disabled={rec.status !== 'pending'}
                          title={rec.status !== 'pending' ? 'Can only update pending requests' : 'Update request'}
                          className={`p-2 rounded-lg transition-colors ${
                            rec.status === 'pending'
                              ? 'text-indigo-600 hover:bg-indigo-50'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                        {/* Delete - all statuses */}
                        <button
                          onClick={() => setDeleteTarget(rec._id)}
                          title="Delete request"
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
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
            Showing {historyTotal === 0 ? 0 : (historyPage - 1) * 10 + 1} to {Math.min(historyPage * 10, historyTotal)} of {historyTotal} entries
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchHistory(historyPage - 1)} disabled={historyPage <= 1}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Previous
            </button>
            {Array.from({ length: historyTotalPages }, (_, i) => i + 1).filter((p) => Math.abs(p - historyPage) <= 2).map((p) => (
              <button key={p} onClick={() => fetchHistory(p)}
                className={`w-9 h-9 text-sm rounded-lg font-medium transition-colors ${p === historyPage ? 'bg-indigo-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => fetchHistory(historyPage + 1)} disabled={historyPage >= historyTotalPages}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequests;