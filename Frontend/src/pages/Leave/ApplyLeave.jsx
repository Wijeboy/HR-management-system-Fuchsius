import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { leaveService } from '../../services/leaveService';

const ApplyLeave = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If editing, location.state contains the existing request
  const editRecord = location.state?.editRecord || null;
  const isEdit = !!editRecord;

  const employeeId = user?.employeeId || 'EMP004';

  const [form, setForm] = useState({
    leaveType: editRecord?.leaveType || '',
    startDate: editRecord?.startDate ? editRecord.startDate.split('T')[0] : '',
    endDate: editRecord?.endDate ? editRecord.endDate.split('T')[0] : '',
    reason: editRecord?.reason || '',
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    leaveService.getBalance(employeeId).then((res) => setBalance(res.data.balance)).catch(() => {});
  }, [employeeId]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFileError('');
    if (!f) { setFile(null); return; }
    if (f.size > 2 * 1024 * 1024) {
      setFileError('File size must be under 2MB.');
      setFile(null);
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowed.includes(f.type)) {
      setFileError('Only images (JPG, PNG, GIF) and PDF files are allowed.');
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.leaveType) { setError('Please select a leave type.'); return; }
    if (!form.startDate) { setError('Start date is required.'); return; }
    if (!form.reason.trim()) { setError('Reason for leave is required.'); return; }

    // Validate end date >= start date
    if (form.endDate && form.endDate < form.startDate) {
      setError('End date cannot be before start date.');
      return;
    }

    const fd = new FormData();
    fd.append('employeeId', employeeId);
    fd.append('leaveType', form.leaveType);
    fd.append('startDate', form.startDate);
    if (form.endDate) fd.append('endDate', form.endDate);
    fd.append('reason', form.reason);
    if (file) fd.append('supportingDocument', file);

    setSubmitting(true);
    try {
      if (isEdit) {
        await leaveService.updateLeave(editRecord._id, fd);
      } else {
        await leaveService.submitLeave(fd);
      }
      navigate('/leave/requests', { state: { success: true } });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit request.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const remainingDays = form.leaveType === 'medical'
    ? balance?.medical
    : form.leaveType === 'vacation'
    ? balance?.vacation
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/leave/requests')}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Update Leave Request' : 'Apply for Leave'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isEdit ? 'Modify your pending leave request' : 'Submit a new leave request'}
          </p>
        </div>
      </div>

      {/* Balance hint */}
      {remainingDays !== null && balance && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium ${
          remainingDays === 0
            ? 'bg-red-50 border-red-200 text-red-700'
            : remainingDays <= 3
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : 'bg-indigo-50 border-indigo-200 text-indigo-700'
        }`}>
          <span className="material-symbols-outlined text-xl">info</span>
          <span>
            You have <strong>{remainingDays}</strong> {form.leaveType} day{remainingDays !== 1 ? 's' : ''} remaining.
          </span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Leave Type */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              name="leaveType"
              value={form.leaveType}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
            >
              <option value="">Select leave type…</option>
              <option value="medical">Medical</option>
              <option value="vacation">Vacation</option>
            </select>
          </div>

          {/* Date fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-800">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-800">End Date</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Select a date if you apply leave for a specific time period.
              </p>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Reason for Leave <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Please describe the reason for your leave request..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
            />
          </div>

          {/* Supporting Document */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Supporting Documents <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center hover:border-indigo-300 transition-colors">
              <input
                type="file"
                id="doc-upload"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="doc-upload" className="cursor-pointer">
                <span className="material-symbols-outlined text-3xl text-gray-300 block mb-2">upload_file</span>
                {file ? (
                  <p className="text-sm font-medium text-indigo-600">{file.name}</p>
                ) : isEdit && editRecord?.supportingDocument ? (
                  <p className="text-sm text-gray-500">Current file: {editRecord.supportingDocument} (upload new to replace)</p>
                ) : (
                  <p className="text-sm text-gray-500">Click to upload an image or PDF <span className="text-gray-400">(max 2MB)</span></p>
                )}
              </label>
            </div>
            {fileError && <p className="text-red-600 text-xs mt-1">{fileError}</p>}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <span className="material-symbols-outlined text-xl flex-shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-xl">send</span>
              {submitting ? 'Submitting...' : isEdit ? 'Update Request' : 'Submit Request'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/leave/requests')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeave;