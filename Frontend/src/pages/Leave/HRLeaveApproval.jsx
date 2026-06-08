import React, { useState, useEffect, useCallback } from 'react';
import { leaveService } from '../../services/leaveService';
import { useAuth } from '../../context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDateRange = (startDate, endDate) => {
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  const start = new Date(startDate).toLocaleDateString('en-US', opts);
  if (!endDate) return start;
  const end = new Date(endDate).toLocaleDateString('en-US', opts);
  return `${start} – ${end}`;
};

// ─── View Document Modal ──────────────────────────────────────────────────────
const ViewModal = ({ record, onClose }) => {
  const docUrl = record.supportingDocument
    ? `http://localhost:5050/uploads/${record.supportingDocument}`
    : null;
  const isImage = record.documentMimeType?.startsWith('image/');
  const isPdf = record.documentMimeType === 'application/pdf';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Leave Request Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-xl text-gray-500">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 font-medium">Employee</p>
              <p className="font-bold text-gray-900 mt-0.5">{record.employeeName}</p>
              <p className="text-gray-500 text-xs">{record.employeeId}</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Leave Type</p>
              <span className={`inline-block mt-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                record.leaveType === 'medical' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {record.leaveType}
              </span>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Duration</p>
              <p className="font-semibold text-gray-900 mt-0.5">{formatDateRange(record.startDate, record.endDate)}</p>
              <p className="text-gray-400 text-xs">{record.durationDays} day{record.durationDays !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Department</p>
              <p className="font-semibold text-gray-900 mt-0.5">{record.department}</p>
            </div>
          </div>

          <div>
            <p className="text-gray-400 font-medium text-sm mb-1">Reason</p>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-100">
              {record.reason}
            </div>
          </div>

          {docUrl && (
            <div>
              <p className="text-gray-400 font-medium text-sm mb-2">Supporting Document</p>
              {isImage ? (
                <img src={docUrl} alt="Supporting document" className="max-h-64 rounded-lg border border-gray-200 object-contain w-full" />
              ) : isPdf ? (
                <a href={docUrl} download target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
                  <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                  Download PDF Document
                </a>
              ) : null}
            </div>
          )}
          {!docUrl && (
            <p className="text-sm text-gray-400 italic">No supporting document uploaded.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Pagination Component ─────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, total, onPageChange }) => (
  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
    <p className="text-sm text-gray-500">
      Showing {total === 0 ? 0 : (page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} entries
    </p>
    <div className="flex items-center gap-2">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
        className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
        Previous
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => Math.abs(p - page) <= 2).map((p) => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`w-9 h-9 text-sm rounded-lg font-medium ${p === page ? 'bg-indigo-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
          {p}
        </button>
      ))}
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
        className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
        Next
      </button>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const HRLeaveApproval = () => {
  const { user } = useAuth();
  const HR_ID = user?.id;

  const [activeTab, setActiveTab] = useState('pending');

  // Pending
  const [pending, setPending] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingTotalPages, setPendingTotalPages] = useState(1);

  // Approved
  const [approved, setApproved] = useState([]);
  const [approvedTotal, setApprovedTotal] = useState(0);
  const [approvedPage, setApprovedPage] = useState(1);
  const [approvedTotalPages, setApprovedTotalPages] = useState(1);

  // Rejected
  const [rejected, setRejected] = useState([]);
  const [rejectedTotal, setRejectedTotal] = useState(0);
  const [rejectedPage, setRejectedPage] = useState(1);
  const [rejectedTotalPages, setRejectedTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [actionLoading, setActionLoading] = useState('');

  const fetchPending = useCallback((pg = 1) => {
    setLoading(true);
    leaveService.getPending(pg, 10).then((res) => {
      setPending(res.data.records || []);
      setPendingTotal(res.data.total || 0);
      setPendingTotalPages(res.data.totalPages || 1);
      setPendingPage(pg);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fetchApproved = useCallback((pg = 1) => {
    leaveService.getApproved(pg, 10).then((res) => {
      setApproved(res.data.records || []);
      setApprovedTotal(res.data.total || 0);
      setApprovedTotalPages(res.data.totalPages || 1);
      setApprovedPage(pg);
    }).catch(() => {});
  }, []);

  const fetchRejected = useCallback((pg = 1) => {
    leaveService.getRejected(pg, 10).then((res) => {
      setRejected(res.data.records || []);
      setRejectedTotal(res.data.total || 0);
      setRejectedTotalPages(res.data.totalPages || 1);
      setRejectedPage(pg);
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchPending(1); fetchApproved(1); fetchRejected(1); }, []);

  const handleApprove = async (id) => {
    setActionLoading(id + '_approve');
    try {
      await leaveService.approveLeave(id, HR_ID);
      fetchPending(pendingPage);
      fetchApproved(1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve.');
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id + '_reject');
    try {
      await leaveService.rejectLeave(id, HR_ID);
      fetchPending(pendingPage);
      fetchRejected(1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject.');
    } finally {
      setActionLoading('');
    }
  };

  const tabs = [
    { key: 'pending', label: 'Pending', count: pendingTotal, color: 'amber' },
    { key: 'approved', label: 'Approved', count: approvedTotal, color: 'green' },
    { key: 'rejected', label: 'Rejected', count: rejectedTotal, color: 'red' },
  ];

  const renderTable = (data, total, page, totalPages, onPageChange, showActions) => (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['Employee', 'Leave Type', 'Dates', 'Duration', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                <span className="material-symbols-outlined animate-spin text-2xl">refresh</span>
              </td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-200 block mb-2">inbox</span>
                <p className="text-sm text-gray-400">No requests found.</p>
              </td></tr>
            ) : (
              data.map((rec) => (
                <tr key={rec._id} className="hover:bg-gray-50 transition-colors">
                  {/* Employee */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                        {rec.employeeName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{rec.employeeId}</p>
                        <p className="text-sm font-bold text-gray-900">{rec.employeeName}</p>
                      </div>
                    </div>
                  </td>
                  {/* Leave type */}
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                      rec.leaveType === 'medical'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      {rec.leaveType.charAt(0).toUpperCase() + rec.leaveType.slice(1)}
                    </span>
                  </td>
                  {/* Dates */}
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatDateRange(rec.startDate, rec.endDate)}
                  </td>
                  {/* Duration */}
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {rec.durationDays} day{rec.durationDays !== 1 ? 's' : ''}
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {showActions && (
                        <>
                          <button
                            onClick={() => handleApprove(rec._id)}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
                          >
                            {actionLoading === rec._id + '_approve'
                              ? <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                              : <span className="material-symbols-outlined text-sm">check</span>}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(rec._id)}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
                          >
                            {actionLoading === rec._id + '_reject'
                              ? <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                              : <span className="material-symbols-outlined text-sm">close</span>}
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setViewRecord(rec)}
                        title="View details"
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">visibility</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={onPageChange} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* View Modal */}
      {viewRecord && <ViewModal record={viewRecord} onClose={() => setViewRecord(null)} />}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leave Approval Inbox</h1>
        <p className="text-gray-500 mt-1 text-sm">Review and manage pending leave requests</p>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => {
          const countColors = {
            amber: activeTab === tab.key ? 'bg-white text-amber-600' : 'bg-amber-100 text-amber-600',
            green: activeTab === tab.key ? 'bg-white text-green-600' : 'bg-green-100 text-green-600',
            red: activeTab === tab.key ? 'bg-white text-red-600' : 'bg-red-100 text-red-600',
          };
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${countColors[tab.color]}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tables ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {activeTab === 'pending' ? 'Pending Leave Requests' : activeTab === 'approved' ? 'Approved Leave Requests' : 'Rejected Leave Requests'}
          </h2>
        </div>
        {activeTab === 'pending' && renderTable(pending, pendingTotal, pendingPage, pendingTotalPages, fetchPending, true)}
        {activeTab === 'approved' && renderTable(approved, approvedTotal, approvedPage, approvedTotalPages, fetchApproved, false)}
        {activeTab === 'rejected' && renderTable(rejected, rejectedTotal, rejectedPage, rejectedTotalPages, fetchRejected, false)}
      </div>
    </div>
  );
};

export default HRLeaveApproval;