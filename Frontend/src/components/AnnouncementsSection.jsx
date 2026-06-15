import { useCallback, useEffect, useState } from 'react';
import { announcementService } from '../services/announcementService';
import { useAuth } from '../context/AuthContext';

const typeConfig = {
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'campaign', iconColor: 'text-blue-600' },
  success: { bg: 'bg-green-50', border: 'border-green-200', icon: 'celebration', iconColor: 'text-green-600' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'warning', iconColor: 'text-amber-600' },
  urgent: { bg: 'bg-red-50', border: 'border-red-200', icon: 'error', iconColor: 'text-red-600' },
};

const inputClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none';

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'employee', label: 'Employees' },
  { value: 'hr', label: 'HR Managers' },
  { value: 'manager', label: 'Managers' },
  { value: 'admin', label: 'Admins' },
];

const formatRelativeTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const emptyForm = {
  title: '',
  message: '',
  type: 'info',
  targetRoles: ['all'],
};

const AnnouncementsSection = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'hr';

  const loadAnnouncements = useCallback(async () => {
    try {
      const res = await announcementService.getAll(user?.role || 'all');
      setAnnouncements(res.data?.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Title and message are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingId) {
        await announcementService.update(editingId, formData);
      } else {
        await announcementService.create({
          ...formData,
          createdBy: user?.employeeId || user?.id || '',
          createdByName: user?.name || '',
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      loadAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ann) => {
    setFormData({
      title: ann.title,
      message: ann.message,
      type: ann.type || 'info',
      targetRoles: ann.targetRoles || ['all'],
    });
    setEditingId(ann.id || ann._id);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await announcementService.remove(id);
      setDeleteConfirm(null);
      loadAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setError('');
  };

  const toggleRole = (role) => {
    setFormData((prev) => {
      if (role === 'all') return { ...prev, targetRoles: ['all'] };
      let next = prev.targetRoles.filter((r) => r !== 'all');
      if (next.includes(role)) {
        next = next.filter((r) => r !== role);
      } else {
        next = [...next, role];
      }
      return { ...prev, targetRoles: next.length === 0 ? ['all'] : next };
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
        {canManage && !showForm && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData(emptyForm);
              setError('');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Announcement
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && canManage && (
        <form onSubmit={handleSave} className="mb-6 space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
          <p className="text-sm font-semibold text-gray-900">
            {editingId ? 'Edit Announcement' : 'Create New Announcement'}
          </p>

          <label className="block space-y-1 text-sm font-medium text-gray-700">
            <span>Title</span>
            <input
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Company All-Hands Meeting"
              className={inputClassName}
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-gray-700">
            <span>Message</span>
            <textarea
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
              placeholder="Write the announcement details..."
              className={`${inputClassName} resize-none`}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-sm font-medium text-gray-700">
              <span>Type</span>
              <select
                value={formData.type}
                onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                className={inputClassName}
              >
                <option value="info">ℹ️ Info</option>
                <option value="success">✅ Success</option>
                <option value="warning">⚠️ Warning</option>
                <option value="urgent">🚨 Urgent</option>
              </select>
            </label>

            <div className="space-y-1 text-sm font-medium text-gray-700">
              <span>Visible To</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {roleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleRole(opt.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      formData.targetRoles.includes(opt.value)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update' : 'Publish'}
            </button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 flex-shrink-0">
                <span className="material-symbols-outlined text-xl text-red-600">warning</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900">Delete Announcement</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Delete <strong>{deleteConfirm.title}</strong>? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-2 text-sm text-gray-500">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-8 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300">campaign</span>
            <p className="mt-2 text-sm text-gray-400">No announcements yet</p>
          </div>
        ) : (
          announcements.map((ann) => {
            const cfg = typeConfig[ann.type] || typeConfig.info;
            return (
              <div key={ann.id || ann._id} className={`p-4 ${cfg.bg} border ${cfg.border} rounded-lg`}>
                <div className="flex items-start gap-3">
                  <span className={`material-symbols-outlined ${cfg.iconColor} mt-0.5`}>{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{ann.title}</h3>
                      {canManage && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(ann)}
                            className="p-1 rounded-md hover:bg-white/60 transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-base text-gray-500">edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: ann.id || ann._id, title: ann.title })}
                            className="p-1 rounded-md hover:bg-white/60 transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-base text-red-500">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{ann.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-xs text-gray-500">
                        {ann.createdByName ? `By ${ann.createdByName}` : ''}
                        {ann.createdAt ? ` · ${formatRelativeTime(ann.createdAt)}` : ''}
                      </p>
                      {ann.targetRoles && !ann.targetRoles.includes('all') && (
                        <div className="flex gap-1">
                          {ann.targetRoles.map((r) => (
                            <span
                              key={r}
                              className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-white/70 text-gray-500 capitalize"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AnnouncementsSection;
