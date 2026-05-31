import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { notificationService } from '../services/notificationService';

const Header = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef(null);

  // Fetch notifications for current user
  const fetchNotifications = useCallback(() => {
    if (!user?.id) return;
    notificationService.getNotifications(user.id)
      .then((res) => {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    pollRef.current = setInterval(fetchNotifications, 30000);
    return () => clearInterval(pollRef.current);
  }, [fetchNotifications]);

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0 && user?.id) {
      notificationService.markAllRead(user.id).then(() => {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }).catch(() => {});
    }
  };

  const formatNotifTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? 's' : ''} ago`;
  };

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-8 sticky top-0 z-10">
      <div className="flex flex-1 items-center gap-4">
        {/* Search Bar */}
        <div className="relative flex w-full max-w-md items-center">
          <span className="absolute left-3 text-gray-500 material-symbols-outlined">search</span>
          <input
            className="h-10 w-full rounded-lg border-none bg-slate-100 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-600"
            placeholder="Search employees, departments, or requests..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Create Request Button */}
        <Link
          to="/leave/apply"
          className="flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Create Request</span>
        </Link>

        <div className="h-6 w-px bg-gray-200"></div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={handleOpenNotifications}
            className="relative flex w-10 h-10 items-center justify-center rounded-lg text-gray-600 hover:bg-slate-100 hover:text-gray-900 transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    <span className="material-symbols-outlined text-3xl block mb-2 text-gray-200">notifications_none</span>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 ${
                        !notif.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`material-symbols-outlined text-base mt-0.5 flex-shrink-0 ${
                          notif.type === 'leave_approved' ? 'text-green-500' :
                          notif.type === 'leave_rejected' ? 'text-red-500' :
                          'text-indigo-500'
                        }`}>
                          {notif.type === 'leave_approved' ? 'check_circle' :
                           notif.type === 'leave_rejected' ? 'cancel' : 'mail'}
                        </span>
                        <div>
                          <p className="text-sm text-gray-800">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatNotifTime(notif.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Help Button */}
        <button className="flex w-10 h-10 items-center justify-center rounded-lg text-gray-600 hover:bg-slate-100 hover:text-gray-900 transition-colors">
          <span className="material-symbols-outlined text-[24px]">help</span>
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setShowDropdown(false)}
              >
                <span className="material-symbols-outlined text-[20px]">person</span>
                <span>My Profile</span>
              </Link>
              <button
                onClick={() => { setShowDropdown(false); logout(); }}
                className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
