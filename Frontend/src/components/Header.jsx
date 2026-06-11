import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { searchService } from '../services/searchService';
import UserAvatar from './UserAvatar';

const DEBOUNCE_MS = 300;

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ─── Search State ────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const pollRef = useRef(null);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // ─── Notifications (unchanged) ──────────────────────────────────────────────
  const fetchNotifications = useCallback(() => {
    if (!user?.id) return;

    notificationService
      .getNotifications(user.id)
      .then((res) => {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();

    pollRef.current = setInterval(fetchNotifications, 30000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [fetchNotifications]);

  // ─── Click-outside handler ──────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ─── Debounced Search ───────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = searchQuery.trim();

    if (trimmed.length < 2) {
      setSearchResults(null);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceRef.current = setTimeout(() => {
      searchService
        .search(trimmed)
        .then((res) => {
          setSearchResults(res.data);
          setShowSearchResults(true);
        })
        .catch(() => {
          setSearchResults(null);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  // ─── Keyboard handler (Escape closes search) ───────────────────────────────
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSearchResults(false);
      e.target.blur();
    }
  };

  // ─── Navigation helpers ─────────────────────────────────────────────────────
  const handleEmployeeClick = (emp) => {
    setShowSearchResults(false);
    setSearchQuery('');
    navigate(`/employees/${emp.employeeId}`);
  };

  const handleLeaveClick = () => {
    setShowSearchResults(false);
    setSearchQuery('');
    navigate('/leave/requests');
  };

  const handleDepartmentClick = (dept) => {
    setShowSearchResults(false);
    setSearchQuery('');
    navigate(`/employees?department=${encodeURIComponent(dept.name)}`);
  };

  // ─── Notification helpers (unchanged) ───────────────────────────────────────
  const handleOpenNotifications = () => {
    setShowNotifications((prev) => !prev);
    setShowDropdown(false);

    if (!showNotifications && unreadCount > 0 && user?.id) {
      notificationService
        .markAllRead(user.id)
        .then(() => {
          setUnreadCount(0);
          setNotifications((prev) =>
            prev.map((notification) => ({
              ...notification,
              read: true,
            }))
          );
        })
        .catch(() => {});
    }
  };

  const handleOpenDropdown = () => {
    setShowDropdown((prev) => !prev);
    setShowNotifications(false);
  };

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
  };

  const formatNotifTime = (dateStr) => {
    if (!dateStr) return '';

    const createdTime = new Date(dateStr).getTime();

    if (Number.isNaN(createdTime)) {
      return '';
    }

    const diff = Date.now() - createdTime;
    const mins = Math.floor(diff / 60000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;

    const hrs = Math.floor(mins / 60);

    if (hrs < 24) {
      return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    }

    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // ─── Compute whether results are empty ──────────────────────────────────────
  const hasResults =
    searchResults &&
    (searchResults.employees?.length > 0 ||
      searchResults.leaveRequests?.length > 0 ||
      searchResults.departments?.length > 0);

  // ─── Status badge color helper ──────────────────────────────────────────────
  const statusColor = (status) => {
    switch (String(status).toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 md:px-8 sticky top-0 z-10">
      <div className="flex flex-1 items-center gap-4">
        {/* ─── Search Input + Dropdown ─────────────────────────────────── */}
        <div className="relative hidden sm:flex w-full max-w-md items-center" ref={searchRef}>
          <span className="absolute left-3 text-gray-500 material-symbols-outlined">
            search
          </span>
          <input
            id="global-search-input"
            className="h-10 w-full rounded-lg border-none bg-slate-100 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-600 outline-none"
            placeholder="Search employees, departments, or requests..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults && searchQuery.trim().length >= 2) {
                setShowSearchResults(true);
              }
            }}
            onKeyDown={handleSearchKeyDown}
            autoComplete="off"
          />

          {/* Loading indicator */}
          {isSearching && (
            <span className="absolute right-3 text-indigo-500">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </span>
          )}

          {/* ─── Search Results Dropdown ──────────────────────────────── */}
          {showSearchResults && searchQuery.trim().length >= 2 && (
            <div
              id="search-results-dropdown"
              className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-[420px] overflow-y-auto"
            >
              {!hasResults && !isSearching && (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  <span className="material-symbols-outlined text-3xl block mb-2 text-gray-200">
                    search_off
                  </span>
                  No results found for &ldquo;{searchQuery.trim()}&rdquo;
                </div>
              )}

              {/* ── Employees Section ──────────────────────────────────── */}
              {searchResults?.employees?.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-indigo-500">group</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Employees
                    </span>
                    <span className="text-xs text-gray-400">({searchResults.employees.length})</span>
                  </div>
                  {searchResults.employees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => handleEmployeeClick(emp)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-indigo-50 transition-colors text-left"
                      type="button"
                    >
                      <UserAvatar name={emp.name} image={emp.profileImage} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {emp.employeeId} · {emp.department}
                          {emp.jobTitle ? ` · ${emp.jobTitle}` : ''}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-gray-300 text-base flex-shrink-0">
                        arrow_forward
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Leave Requests Section ─────────────────────────────── */}
              {searchResults?.leaveRequests?.length > 0 && (
                <div>
                  {searchResults?.employees?.length > 0 && (
                    <div className="mx-4 border-t border-gray-100 my-1" />
                  )}
                  <div className="px-4 py-1.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-amber-500">event_busy</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Leave Requests
                    </span>
                    <span className="text-xs text-gray-400">({searchResults.leaveRequests.length})</span>
                  </div>
                  {searchResults.leaveRequests.map((lr) => (
                    <button
                      key={lr.id}
                      onClick={handleLeaveClick}
                      className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-amber-50 transition-colors text-left"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg text-amber-400 flex-shrink-0">
                        description
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {lr.employeeName}
                          <span className="ml-1.5 text-xs text-gray-400 font-normal capitalize">{lr.leaveType}</span>
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {lr.department} · {lr.durationDays} day{lr.durationDays > 1 ? 's' : ''}
                          {lr.startDate ? ` · ${new Date(lr.startDate).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${statusColor(lr.status)}`}>
                        {lr.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Departments Section ────────────────────────────────── */}
              {searchResults?.departments?.length > 0 && (
                <div>
                  {(searchResults?.employees?.length > 0 || searchResults?.leaveRequests?.length > 0) && (
                    <div className="mx-4 border-t border-gray-100 my-1" />
                  )}
                  <div className="px-4 py-1.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-emerald-500">apartment</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Departments
                    </span>
                    <span className="text-xs text-gray-400">({searchResults.departments.length})</span>
                  </div>
                  {searchResults.departments.map((dept) => (
                    <button
                      key={dept.name}
                      onClick={() => handleDepartmentClick(dept)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-emerald-50 transition-colors text-left"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg text-emerald-400 flex-shrink-0">
                        domain
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{dept.name}</p>
                        <p className="text-xs text-gray-500">
                          {dept.employeeCount} employee{dept.employeeCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-gray-300 text-base flex-shrink-0">
                        arrow_forward
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Link
          to="/leave/apply"
          className="hidden md:flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Create Request</span>
        </Link>

        <div className="hidden md:block h-6 w-px bg-gray-200" />

        <div className="relative" ref={notificationRef}>
          <button
            onClick={handleOpenNotifications}
            className="relative flex w-10 h-10 items-center justify-center rounded-lg text-gray-600 hover:bg-slate-100 hover:text-gray-900 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">
              notifications
            </span>

            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] rounded-full bg-red-500 ring-2 ring-white text-[10px] text-white flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Notifications
                </h3>

                {unreadCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    <span className="material-symbols-outlined text-3xl block mb-2 text-gray-200">
                      notifications_none
                    </span>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id || notif.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 ${
                        !notif.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`material-symbols-outlined text-base mt-0.5 flex-shrink-0 ${
                            notif.type === 'leave_approved'
                              ? 'text-green-500'
                              : notif.type === 'leave_rejected'
                                ? 'text-red-500'
                                : 'text-indigo-500'
                          }`}
                        >
                          {notif.type === 'leave_approved'
                            ? 'check_circle'
                            : notif.type === 'leave_rejected'
                              ? 'cancel'
                              : 'mail'}
                        </span>

                        <div>
                          <p className="text-sm text-gray-800">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatNotifTime(notif.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          className="hidden sm:flex w-10 h-10 items-center justify-center rounded-lg text-gray-600 hover:bg-slate-100 hover:text-gray-900 transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[24px]">help</span>
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleOpenDropdown}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            type="button"
          >
            <UserAvatar
              name={user?.name}
              image={user?.profileImage}
              size="md"
            />

            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-gray-900 line-clamp-1">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role || 'Role'}
              </p>
            </div>

            <span className="hidden md:block material-symbols-outlined text-gray-400 text-[20px]">
              expand_more
            </span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || ''}
                </p>
              </div>

              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                onClick={() => setShowDropdown(false)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  person
                </span>
                <span>My Profile</span>
              </Link>

              <Link
                to="/leave/apply"
                className="md:hidden flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                onClick={() => setShowDropdown(false)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  add
                </span>
                <span>Create Request</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left text-sm"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">
                  logout
                </span>
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
