import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { recruitmentService } from '../../services/recruitmentService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

const workModeIcon = { 'on-site': 'location_on', remote: 'home', hybrid: 'sync_alt' };
const jobTypeIcon = { 'full-time': 'work', 'part-time': 'schedule', intern: 'school' };

// ─── Employee Job Card ────────────────────────────────────────────────────────
const EmployeeJobCard = ({ job, onApply, onDownload }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
    {/* Top bar */}
    <div className="flex items-center justify-end px-4 pt-4 pb-2">
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
          <span className="material-symbols-outlined text-[14px] text-indigo-400">{workModeIcon[job.workMode] || 'place'}</span>
          <span className="capitalize">{job.workMode}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span className="material-symbols-outlined text-[14px] text-indigo-400">{jobTypeIcon[job.jobType] || 'work'}</span>
          <span className="capitalize">{job.jobType}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
        <span className="material-symbols-outlined text-[14px] text-red-400">calendar_today</span>
        <span>Closing date: <span className="font-semibold text-gray-700">{formatDate(job.closingDate)}</span></span>
      </div>

      {/* Buttons row */}
      <div className="mt-3 flex gap-2">
        <button onClick={() => onDownload(job._id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors">
          <span className="material-symbols-outlined text-[14px]">download</span>
          View Details
        </button>
        <button onClick={() => onApply(job)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm">
          <span className="material-symbols-outlined text-[14px]">send</span>
          Apply
        </button>
      </div>
    </div>
  </div>
);

// ─── Apply Form Modal ─────────────────────────────────────────────────────────
const ApplyModal = ({ job, employeeId, onClose, onSuccess }) => {
  const [form, setForm] = useState({ applicantName: '', email: '' });
  const [cvFile, setCvFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFileError('');
    if (!f) { setCvFile(null); return; }
    if (f.size > 5 * 1024 * 1024) { setFileError('File must be under 5MB.'); return; }
    if (f.type !== 'application/pdf') { setFileError('Only PDF files are allowed.'); return; }
    setCvFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!cvFile) { setError('Please attach your CV as a PDF.'); return; }

    const fd = new FormData();
    fd.append('applicantName', form.applicantName);
    fd.append('email', form.email);
    fd.append('employeeId', employeeId);
    fd.append('cv', cvFile);

    setLoading(true);
    try {
      await recruitmentService.applyForJob(job._id, fd);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Submit Your Application</h2>
            <p className="text-xs text-gray-500 mt-0.5">Applying for: <span className="font-semibold text-indigo-600">{job.jobTitle}</span> · {job.uniqueCode}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <span className="material-symbols-outlined text-xl text-gray-500">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">Full Name <span className="text-red-500">*</span></label>
            <input name="applicantName" value={form.applicantName} onChange={handleChange} required
              placeholder="Enter your full name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">Email Address <span className="text-red-500">*</span></label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required
              placeholder="your.email@example.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">Attach CV (PDF) <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-colors">
              <input type="file" id="cv-upload" accept=".pdf,application/pdf" onChange={handleFile} className="hidden" />
              <label htmlFor="cv-upload" className="cursor-pointer">
                <span className="material-symbols-outlined text-2xl text-gray-300 block mb-1">picture_as_pdf</span>
                {cvFile ? (
                  <p className="text-sm font-medium text-indigo-600">{cvFile.name}</p>
                ) : (
                  <p className="text-sm text-gray-400">Click to upload your CV <span className="text-gray-300">(max 5MB)</span></p>
                )}
              </label>
            </div>
            {fileError && <p className="text-red-600 text-xs">{fileError}</p>}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <span className="material-symbols-outlined text-lg">error</span>{error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-60">
              <span className="material-symbols-outlined text-[18px]">send</span>
              {loading ? 'Submitting…' : 'Apply Now'}
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

// ─── Main Component ───────────────────────────────────────────────────────────
const Applicants = () => {
  const { user } = useAuth();
  const employeeId = user?.employeeId || 'EMP004';

  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [applyTarget, setApplyTarget] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [schedSearch, setSchedSearch] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchJobs = useCallback(() => {
    setLoading(true);
    recruitmentService.getAllJobs(search)
      .then((res) => setJobs(res.data.jobs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  const fetchSchedules = useCallback(() => {
    recruitmentService.getEmployeeSchedules(employeeId, schedSearch)
      .then((res) => setSchedules(res.data.schedules || []))
      .catch(() => {});
  }, [employeeId, schedSearch]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const handleDownload = (jobId) => window.open(recruitmentService.getJobAttachmentUrl(jobId), '_blank');

  const handleApplySuccess = () => {
    setApplyTarget(null);
    setSuccessMsg('Your application has been submitted successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleCopyLink = (link, id) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="space-y-8">
      {/* Apply modal */}
      {applyTarget && (
        <ApplyModal job={applyTarget} employeeId={employeeId} onClose={() => setApplyTarget(null)} onSuccess={handleApplySuccess} />
      )}

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-5 py-3 rounded-xl text-sm font-medium">
          <span className="material-symbols-outlined text-xl">check_circle</span>{successMsg}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-700">Job Vacancy Postings</h1>
        <p className="text-gray-500 mt-1.5 text-sm">Browse and apply for open positions within the organization</p>
      </div>

      {/* ── Search ────────────────────────────────────────────────────────── */}
      <div className="relative max-w-md mx-auto">
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
          <p className="text-gray-400 text-sm">No open positions available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <EmployeeJobCard key={job._id} job={job}
              onApply={(j) => setApplyTarget(j)}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* ── Meeting Calendar ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">My Meeting Calendar</h2>
            <p className="text-sm text-gray-500 mt-0.5">Scheduled interviews and meeting details</p>
          </div>
          {/* Schedule search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
            <input type="text" value={schedSearch} onChange={(e) => setSchedSearch(e.target.value)}
              placeholder="Filter by code…"
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm w-48" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Code', 'Date', 'Time', 'Duration', 'Meeting Link'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {schedules.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                  <span className="material-symbols-outlined text-4xl block mb-2 text-gray-200">event_busy</span>
                  No scheduled interviews yet.
                </td></tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{s.jobCode}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{formatDate(s.interviewDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatTime(s.interviewTime)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{s.duration}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleCopyLink(s.meetingLink, s._id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          copiedId === s._id
                            ? 'bg-green-50 border border-green-200 text-green-700'
                            : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'
                        }`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {copiedId === s._id ? 'check' : 'link'}
                        </span>
                        {copiedId === s._id ? 'Copied!' : 'Copy Link'}
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
  );
};

export default Applicants;