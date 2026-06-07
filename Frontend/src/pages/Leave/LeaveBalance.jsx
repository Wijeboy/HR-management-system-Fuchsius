import { useEffect, useState } from 'react';
import { leaveService } from '../../services/leaveService';
import { useAuth } from '../../context/AuthContext';

const LeaveBalance = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBalance = async () => {
      try {
        setLoading(true);
        setError('');
        const employeeId = user?.employeeId;
        if (!employeeId) {
          setError('Employee ID is missing for the current user.');
          return;
        }
        const response = await leaveService.getBalance(employeeId);
        setBalance(response?.data?.balance || null);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch leave balance');
      } finally {
        setLoading(false);
      }
    };

    loadBalance();
  }, [user?.employeeId]);

  if (loading) {
    return <div className="text-gray-600">Loading leave balance...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Leave Balance</h1>
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {!error && balance && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900">Medical Leave</h2>
              <p className="text-sm text-gray-500 mt-1">Used {balance.medicalUsed} days</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{balance.medical} days left</p>
              <div className="mt-3 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, ((balance.medicalUsed || 0) / ((balance.medical || 0) + (balance.medicalUsed || 0) || 1)) * 100)}%` }}></div>
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900">Vacation Leave</h2>
              <p className="text-sm text-gray-500 mt-1">Used {balance.vacationUsed} days</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{balance.vacation} days left</p>
              <div className="mt-3 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, ((balance.vacationUsed || 0) / ((balance.vacation || 0) + (balance.vacationUsed || 0) || 1)) * 100)}%` }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveBalance;
