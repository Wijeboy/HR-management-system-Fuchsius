import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [workTime, setWorkTime] = useState(0);

  // Live Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Work duration counter
  useEffect(() => {
    let interval;
    if (isPunchedIn) {
      interval = setInterval(() => setWorkTime((prev) => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPunchedIn]);

  const formatWorkTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name || 'Employee'}! 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Here is what&apos;s happening today.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Attendance Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">schedule</span>
                Time & Attendance
              </h2>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500">{currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{currentTime.toLocaleTimeString()}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="mb-4 sm:mb-0 text-center sm:text-left">
                <p className="text-sm text-gray-500 font-medium mb-1">Current Shift</p>
                <p className="text-4xl font-bold text-indigo-600 font-mono tracking-wider">{formatWorkTime(workTime)}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/attendance')}
                  className="px-6 py-3 rounded-lg font-medium text-sm transition-all shadow-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                  View Attendance
                </button>
                <button
                  onClick={() => setIsPunchedIn(!isPunchedIn)}
                  className={`px-8 py-3 rounded-lg font-medium text-sm transition-all shadow-sm flex items-center gap-2 ${
                    isPunchedIn
                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isPunchedIn ? 'stop_circle' : 'play_circle'}
                  </span>
                  {isPunchedIn ? 'Check Out' : 'Check In'}
                </button>
              </div>
            </div>
          </div>

          {/* Leave Balance */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600">event_available</span>
              Leave Balances
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-teal-50 border border-teal-100 rounded-xl">
                <p className="text-sm font-medium text-teal-800 mb-1">Annual Leave</p>
                <p className="text-3xl font-bold text-teal-900">12<span className="text-sm font-medium text-teal-700 ml-1">days</span></p>
              </div>
              <div className="p-5 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-sm font-medium text-amber-800 mb-1">Sick Leave</p>
                <p className="text-3xl font-bold text-amber-900">5<span className="text-sm font-medium text-amber-700 ml-1">days</span></p>
              </div>
              <div className="p-5 bg-rose-50 border border-rose-100 rounded-xl">
                <p className="text-sm font-medium text-rose-800 mb-1">Unpaid Leave</p>
                <p className="text-3xl font-bold text-rose-900">0<span className="text-sm font-medium text-rose-700 ml-1">days</span></p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">bolt</span>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link to="/leave/apply" className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-xl transition-colors group">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-600 group-hover:scale-110 transition-transform mb-3">
                  <span className="material-symbols-outlined text-[24px]">flight_takeoff</span>
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Apply Leave</span>
              </Link>
              <Link to="/payroll" className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-200 rounded-xl transition-colors group">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-green-600 group-hover:scale-110 transition-transform mb-3">
                  <span className="material-symbols-outlined text-[24px]">payments</span>
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">Payslips</span>
              </Link>
              <Link to="/attendance" className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 rounded-xl transition-colors group">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-orange-600 group-hover:scale-110 transition-transform mb-3">
                  <span className="material-symbols-outlined text-[24px]">history</span>
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">Timesheet</span>
              </Link>
              <Link to="/profile" className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 rounded-xl transition-colors group">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-purple-600 group-hover:scale-110 transition-transform mb-3">
                  <span className="material-symbols-outlined text-[24px]">person</span>
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Profile</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          
          {/* Announcements & Holidays would typically go here */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center py-12">
             <span className="material-symbols-outlined text-[48px] text-gray-300 mb-3">inbox</span>
             <p className="text-gray-500 font-medium">No new announcements</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;