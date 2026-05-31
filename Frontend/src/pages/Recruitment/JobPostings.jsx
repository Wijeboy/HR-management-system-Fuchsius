import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { recruitmentService } from '../../services/recruitmentService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const hr12 = hr % 12 || 12;
  return `${hr12}:${m} ${ampm}`;
};

const workModeIcon = { 'on-site': 'location_on', remote: 'home', hybrid: 'sync_alt' };
const jobTypeIcon = { 'full-time': 'work', 'part-time': 'schedule', intern: 'school' };

// ─── Job Card (HR) ────────────────────────────────────────────────────────────
const HRJobCard = ({ job, onEdit, onDelete, onDownload }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
    {/* Card top bar */}
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      {/* Edit / Delete */}
      <div className="flex items-center gap-1">
        <button onClick={() => onEdit(job)}
          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Edit posting">
          <span className="material-symbols-outlined text-[18px]">edit</span>
        </button>
        <button onClick={() => onDelete(job._id)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete posting">
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
      {/* Code + Active */}
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs font-bold text-indigo-500 tracking-wider">{job.uniqueCode}</span>
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700 border border-green-200">
          ACTIVE
        </span>
      </div>
    </div>

    {/* Body */}
    <div className="px-4 pb-4 flex flex-col gap-2 flex-1">
      <h3 className="text-base font-bold text-gray-900 leading-tight">{job.jobTitle}</h3>
      <p className="text-sm text-gray-600">{job.department}</p>

      <div className="flex items-center gap-3 mt-1">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span className="material-symbols-outlined text-[14px] text-indigo-400">
            {workModeIcon[job.workMode] || 'place'}
          </span>
          <span className="capitalize">{job.workMode}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span className="material-symbols-outlined text-[14px] text-indigo-400">
            {jobTypeIcon[job.jobType] || 'work'}
          </span>
          <span className="capitalize">{job.jobType}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
        <span className="material-symbols-outlined text-[14px] text-red-400">calendar_today</span>
        <span>Closing date: <span className="font-semibold text-gray-700">{formatDate(job.closingDate)}</span></span>
      </div>

      <button
        onClick={() => onDownload(job._id)}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">download</span>
        View Details
      </button>
    </div>
  </div>
);

// ─── Job Form Modal ───────────────────────────────────────────────────────────
const JobFormModal = ({ editJob, onClose, onSuccess }) => {
  const isEdit = !!editJob;
  const [form, setForm] = useState({
    jobTitle: editJob?.jobTitle || '',
    department: editJob?.department || '',
    jobType: editJob?.jobType || '',
    workMode: editJob?.workMode || '',
    closingDate: editJob?.closingDate ? new Date(editJob.closingDate).toISOString().split('T')[0] : '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isEdit && !file) { setError('Please attach a PDF file.'); return; }
    if (form.closingDate <= today) { setError('Closing date must be a future date.'); return; }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('attachment', file);

    setLoading(true);
    try {
      if (isEdit) await recruitmentService.updateJob(editJob._id, fd);
      else await recruitmentService.createJob(fd);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save job posting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Job Posting' : 'Create New Job Posting'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{isEdit ? 'Update the vacancy details below' : 'Fill in the details to post a new vacancy'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-xl text-gray-500">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Job Title */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">Job Title <span className="text-red-500">*</span></label>
            <input name="jobTitle" value={form.jobTitle} onChange={handleChange} required
              pattern="[A-Za-z\s]+" title="Letters and spaces only"
              placeholder="e.g. Software Engineer"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">Department <span className="text-red-500">*</span></label>
            <input name="department" value={form.department} onChange={handleChange} required
              pattern="[A-Za-z\s]+" title="Letters and spaces only"
              placeholder="e.g. Engineering"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
          </div>

          {/* Job Type */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">Job Type <span className="text-red-500">*</span></label>
            <select name="jobType" value={form.jobType} onChange={handleChange} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white">
              <option value="">Select job type…</option>
              <option value="full-time">Full-Time</option>
              <option value="part-time">Part-Time</option>
              <option value="intern">Intern</option>
            </select>
          </div>

          {/* Work Mode */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">Work Mode <span className="text-red-500">*</span></label>
            <select name="workMode" value={form.workMode} onChange={handleChange} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white">
              <option value="">Select work mode…</option>
              <option value="on-site">On-Site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          {/* Closing Date */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">Closing Date <span className="text-red-500">*</span></label>
            <input type="date" name="closingDate" value={form.closingDate} min={today} onChange={handleChange} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
          </div>

          {/* Attachment */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Attachment (PDF) {!isEdit && <span className="text-red-500">*</span>}
              {isEdit && <span className="text-gray-400 font-normal"> (upload new to replace)</span>}
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-colors">
              <input type="file" id="job-pdf" accept=".pdf,application/pdf" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
              <label htmlFor="job-pdf" className="cursor-pointer">
                <span className="material-symbols-outlined text-2xl text-gray-300 block mb-1">picture_as_pdf</span>
                {file ? (
                  <p className="text-sm font-medium text-indigo-600">{file.name}</p>
                ) : isEdit && editJob?.attachmentFile ? (
                  <p className="text-sm text-gray-400">Current: {editJob.attachmentFile}</p>
                ) : (
                  <p className="text-sm text-gray-400">Click to upload PDF <span className="text-gray-300">(max 5MB)</span></p>
                )}
              </label>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-60">
              <span className="material-symbols-outlined text-[18px]">{isEdit ? 'save' : 'post_add'}</span>
              {loading ? 'Saving…' : isEdit ? 'Update Post' : 'Post Vacancy'}
            </button>
            <button type="button" onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Schedule Form Modal ──────────────────────────────────────────────────────
const ScheduleModal = ({ applicant, onClose, onSuccess }) => {
  const [form, setForm] = useState({ interviewDate: '', interviewTime: '', meetingLink: '', duration: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.interviewDate <= today) { setError('Please select a future date.'); return; }
    setLoading(true);
    try {
      await recruitmentService.scheduleInterview(applicant._id, {
        ...form,
        employeeId: applicant.submittedBy || 'EMP004',
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule interview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Schedule Interview</h2>
            <p className="text-xs text-gray-500 mt-0.5">Set up a meeting for <span className="font-semibold">{applicant.applicantName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <span className="material-symbols-outlined text-xl text-gray-500">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">Interview Date <span className="text-red-500">*</span></label>
            <input type="date" name="interviewDate" value={form.interviewDate} min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              onChange={handleChange} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">Interview Time <span className="text-red-500">*</span></label>
            <input type="time" name="interviewTime" value={form.interviewTime} onChange={handleChange} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">Meeting Link <span className="text-red-500">*</span></label>
            <input type="text" name="meetingLink" value={form.meetingLink} onChange={handleChange} required
              placeholder="e.g. https://meet.google.com/abc-xyz"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">Duration <span className="text-red-500">*</span></label>
            <select name="duration" value={form.duration} onChange={handleChange} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
              <option value="">Select duration…</option>
              <option value="20 min">20 min</option>
              <option value="30 min">30 min</option>
              <option value="60 min">60 min</option>
            </select>
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <span className="material-symbols-outlined text-lg">error</span>{error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60">
              <span className="material-symbols-outlined text-[18px]">event</span>
              {loading ? 'Scheduling…' : 'Schedule'}
            </button>
            <button type="button" onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Delete Confirm ───────────────────────────────────────────────────────────
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-sm w-full text-center">
      <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-xl mx-auto mb-4">
        <span className="material-symbols-outlined text-2xl text-red-500">warning</span>
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-2">Confirm Action</h3>
      <p className="text-sm text-gray-500 mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50">Cancel</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700">Confirm</button>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const JobPostings = () => {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [showJobForm, setShowJobForm] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchJobs = useCallback(() => {
    setLoading(true);
    recruitmentService.getAllJobs(search)
      .then((res) => setJobs(res.data.jobs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  const fetchApplicants = useCallback(() => {
    recruitmentService.getAllApplicants()
      .then((res) => setApplicants(res.data.applicants || []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { fetchApplicants(); }, [fetchApplicants]);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3500); };

  const handleDownload = (jobId) => {
    window.open(recruitmentService.getJobAttachmentUrl(jobId), '_blank');
  };

  const handleDeleteJob = async () => {
    try {
      await recruitmentService.deleteJob(deleteTarget);
      setDeleteTarget(null);
      fetchJobs();
      fetchApplicants();
      showSuccess('Job posting deleted successfully.');
    } catch { alert('Failed to delete.'); }
  };

  const handleCancelApplicant = async () => {
    try {
      await recruitmentService.cancelApplicant(cancelTarget);
      setCancelTarget(null);
      fetchApplicants();
      showSuccess('Applicant removed.');
    } catch { alert('Failed to remove applicant.'); }
  };

  const handleScheduleSuccess = () => {
    setScheduleTarget(null);
    fetchApplicants();
    showSuccess('Interview scheduled successfully.');
  };

  return (
    <div className="space-y-8">
      {/* Modals */}
      {(showJobForm || editJob) && (
        <JobFormModal
          editJob={editJob}
          onClose={() => { setShowJobForm(false); setEditJob(null); }}
          onSuccess={() => { setShowJobForm(false); setEditJob(null); fetchJobs(); showSuccess(editJob ? 'Job updated.' : 'Job posted successfully.'); }}
        />
      )}
      {deleteTarget && (
        <ConfirmModal message="This will permanently delete the job posting and all related applicants." onConfirm={handleDeleteJob} onCancel={() => setDeleteTarget(null)} />
      )}
      {scheduleTarget && (
        <ScheduleModal applicant={scheduleTarget} onClose={() => setScheduleTarget(null)} onSuccess={handleScheduleSuccess} />
      )}
      {cancelTarget && (
        <ConfirmModal message="This will remove the applicant record permanently." onConfirm={handleCancelApplicant} onCancel={() => setCancelTarget(null)} />
      )}

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-5 py-3 rounded-xl text-sm font-medium">
          <span className="material-symbols-outlined text-xl">check_circle</span>{successMsg}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex-1 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Job Vacancy Portal</h1>
          <p className="text-gray-500 mt-1.5 text-sm">Manage organizational growth and track open positions in real-time</p>
        </div>
        <button onClick={() => setShowJobForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm flex-shrink-0">
          <span className="material-symbols-outlined text-xl">add</span>
          Create Job Posting
        </button>
      </div>

      {/* ── Search ────────────────────────────────────────────────────────── */}
      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by vacancy code (e.g. JV-482910)…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
      </div>

      {/* ── Job Cards ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <span className="material-symbols-outlined animate-spin text-3xl block mb-2">refresh</span>
          Loading vacancies…
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <span className="material-symbols-outlined text-5xl text-gray-200 block mb-3">work_off</span>
          <p className="text-gray-400 text-sm">No job postings yet. Click "Create Job Posting" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <HRJobCard key={job._id} job={job}
              onEdit={(j) => setEditJob(j)}
              onDelete={(id) => setDeleteTarget(id)}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* ── Manage Applicants ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Manage Applicants</h2>
          <p className="text-sm text-gray-500 mt-0.5">Review and schedule interviews for submitted applications</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Code', 'Applicant Name', 'Email', 'CV', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {applicants.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                  <span className="material-symbols-outlined text-4xl block mb-2 text-gray-200">inbox</span>
                  No applications received yet.
                </td></tr>
              ) : (
                applicants.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{app.jobCode}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{app.applicantName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{app.email}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => window.open(recruitmentService.getApplicantCvUrl(app._id), '_blank')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        View CV
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setScheduleTarget(app)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">
                          <span className="material-symbols-outlined text-[14px]">event</span>
                          Schedule
                        </button>
                        <button onClick={() => setCancelTarget(app._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JobPostings;