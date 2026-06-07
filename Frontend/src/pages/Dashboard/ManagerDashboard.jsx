import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const ManagerDashboard = () => {
  const { user } = useAuth();

  // Dummy Data for the UI
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 1, name: 'Alice Smith', type: 'Annual Leave', date: 'Oct 25 - Oct 27', reason: 'Family vacation' },
    { id: 2, name: 'Bob Jones', type: 'Sick Leave', date: 'Oct 24', reason: 'Flu/Fever' },
    { id: 3, name: 'Charlie Brown', type: 'Personal', date: 'Oct 28', reason: 'Doctor appointment' },
  ]);

  const [teamStatus] = useState([
    { id: 1, name: 'Alice Smith', role: 'Frontend Dev', status: 'Present' },
    { id: 2, name: 'Bob Jones', role: 'Backend Dev', status: 'On Leave' },
    { id: 3, name: 'Charlie Brown', role: 'UI/UX Designer', status: 'Present' },
    { id: 4, name: 'Diana Prince', role: 'QA Engineer', status: 'Absent' },
    { id: 5, name: 'Evan Wright', role: 'DevOps', status: 'Present' },
  ]);

  // Handlers for dummy actions
  const handleApprove = (id) => {
    setLeaveRequests(leaveRequests.filter((req) => req.id !== id));
  };

  const handleReject = (id) => {
    setLeaveRequests(leaveRequests.filter((req) => req.id !== id));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-700 border-green-200';
      case 'On Leave': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Absent': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Manager Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.name || 'Manager'}! Here is an overview of your team&apos;s activity.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">pending_actions</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pending Leave Requests</p>
              <p className="text-2xl font-bold text-gray-900">{leaveRequests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">group_add</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Team Attendance Today</p>
              <p className="text-2xl font-bold text-gray-900">14 / 16</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">fact_check</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Column - Leave Requests */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Pending Leave Requests</h2>
                <p className="text-sm text-gray-500 mt-0.5">Review and approve team time-off</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-sm">No pending leave requests.</td>
                    </tr>
                  ) : (
                    leaveRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{req.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-[150px]">{req.reason}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => handleApprove(req.id)} className="inline-flex items-center justify-center p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Approve">
                            <span className="material-symbols-outlined text-[20px]">check</span>
                          </button>
                          <button onClick={() => handleReject(req.id)} className="inline-flex items-center justify-center p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Reject">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Column - Team Status */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">groups</span>
              Team Status
            </h2>
            <div className="space-y-4">
              {teamStatus.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(member.status)}`}>
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;