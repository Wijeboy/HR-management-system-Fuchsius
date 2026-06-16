import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../../services/api';
import PerformanceSectionTabs from '../../components/PerformanceSectionTabs';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

const getDefaultCycle = () => {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return `Q${quarter} ${now.getFullYear()}`;
};

const getRatingBand = (rating) => {
  if (rating >= 4.5) return { label: 'Outstanding', className: 'bg-green-100 text-green-700' };
  if (rating >= 4.0) return { label: 'Exceeds', className: 'bg-blue-100 text-blue-700' };
  if (rating >= 3.0) return { label: 'Meets', className: 'bg-amber-100 text-amber-700' };
  return { label: 'Needs Improvement', className: 'bg-red-100 text-red-700' };
};

const recommendationClass = (recommendation) => {
  if (recommendation === 'Promotion') return 'bg-emerald-100 text-emerald-700';
  if (recommendation === 'Bonus') return 'bg-indigo-100 text-indigo-700';
  if (recommendation === 'Performance Plan') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const defaultSummary = {
  totalReviews: 0,
  completed: 0,
  promotions: 0,
  bonuses: 0,
  avgRating: 0,
};

const inputClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500';

const sectionCardClass = 'rounded-xl border border-gray-200 bg-white p-6 shadow-sm';

const PerformanceReviews = () => {
  const { user } = useAuth();
  const currentUserRole = user?.role;
  const isManagement = ['admin', 'hr', 'manager'].includes(currentUserRole);

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(defaultSummary);
  const [cycles, setCycles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [cycleFilter, setCycleFilter] = useState('All Cycles');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const [form, setForm] = useState({
    employeeName: '',
    employeeId: '',
    department: '',
    reviewer: '',
    cycle: getDefaultCycle(),
    goalsScore: 3.5,
    competencyScore: 3.5,
    behaviorScore: 3.5,
    recommendation: 'No Change',
    status: 'In Progress',
    bonusAmount: 500,
  });

  const [loading, setLoading] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [employeeLoadError, setEmployeeLoadError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentReviewId, setCurrentReviewId] = useState(null);
  const [clearing, setClearing] = useState(false);

  const safeDisplayReviews = useMemo(() => {
    if (!Array.isArray(reviews)) return [];
    if (isManagement) return reviews;
    return reviews.filter(
      (review) => review.employeeId === user?.employeeId || review.email === user?.email
    );
  }, [reviews, user, isManagement]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (cycleFilter !== 'All Cycles') params.cycle = cycleFilter;
      if (statusFilter !== 'All Status') params.status = statusFilter;

      if (!isManagement && user?.employeeId) {
        params.employeeId = user.employeeId;
      }

      const response = await apiClient.get('/performance/reviews', { params });

      setReviews(response.data?.data || []);
      setSummary(response.data?.summary || defaultSummary);
      setCycles(response.data?.cycles || []);
    } catch (requestError) {
      setReviews([]);
      setSummary(defaultSummary);
      setCycles([]);
      setError(requestError.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [cycleFilter, searchTerm, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadReviews();
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [loadReviews]);

  useEffect(() => {
    let isActive = true;

    const loadEmployees = async () => {
      setLoadingEmployees(true);
      setEmployeeLoadError('');

      try {
        const response = await userService.getUsers();
        if (!isActive) return;
        setEmployees(response.data?.users || []);
      } catch (requestError) {
        if (!isActive) return;
        setEmployees([]);
        setEmployeeLoadError(requestError.response?.data?.message || 'Failed to load employees');
      } finally {
        if (isActive) setLoadingEmployees(false);
      }
    };

    loadEmployees();

    return () => {
      isActive = false;
    };
  }, []);

  // Auto-select the first review for employee on load
  useEffect(() => {
    if (!isManagement && safeDisplayReviews.length > 0 && !selectedReview) {
      setSelectedReview(safeDisplayReviews[0]);
    }
  }, [safeDisplayReviews, isManagement, selectedReview]);

  const cycleOptions = useMemo(() => {
    const set = new Set(cycles);
    if (form.cycle) set.add(form.cycle);
    return ['All Cycles', ...set];
  }, [cycles, form.cycle]);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.employeeId === form.employeeId) || null,
    [employees, form.employeeId]
  );

  const calculatedRating = useMemo(() => {
    return Number(
      ((toNumber(form.goalsScore) + toNumber(form.competencyScore) + toNumber(form.behaviorScore)) / 3).toFixed(1)
    );
  }, [form.behaviorScore, form.competencyScore, form.goalsScore]);

  const calculatedBand = getRatingBand(calculatedRating);

  const latestReview = useMemo(() => {
    return safeDisplayReviews[0] || null;
  }, [safeDisplayReviews]);

  const visibleReviewsLabel = loading
    ? 'Loading reviews...'
    : `${safeDisplayReviews.length} review${safeDisplayReviews.length === 1 ? '' : 's'} in this view`;

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();

    // 1. Check if an Employee is selected
    if (!form.employeeId) { 
      alert("Please select an Employee before saving the review!");
      return;
    }

    // 2. Check if the Reviewer Name is entered
    if (!form.reviewer) {
      alert("Please enter the Reviewer Name before saving the review!");
      return;
    }

    if (!form.employeeName || !form.department || !form.reviewer || !form.cycle) {
      setError('Please fill all required review fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      employeeName: form.employeeName,
      employeeId: form.employeeId,
      department: form.department,
      reviewer: form.reviewer,
      cycle: form.cycle,
      goalsScore: toNumber(form.goalsScore),
      competencyScore: toNumber(form.competencyScore),
      behaviorScore: toNumber(form.behaviorScore),
      finalRating: calculatedRating,
      recommendation: form.recommendation,
      status: form.status,
      bonusAmount: form.recommendation === 'Bonus' ? toNumber(form.bonusAmount) : 0,
    };

    try {
      if (isEditing) {
        await apiClient.put(`/performance/reviews/${currentReviewId}`, payload);
        showSuccess('Performance review updated successfully.');
      } else {
        await apiClient.post('/performance/reviews', payload);
        showSuccess('Performance review saved successfully.');
      }

      setForm((prev) => ({
        ...prev,
        employeeName: '',
        employeeId: '',
        department: '',
        reviewer: '',
        goalsScore: 3.5,
        competencyScore: 3.5,
        behaviorScore: 3.5,
        recommendation: 'No Change',
        status: 'In Progress',
        bonusAmount: 500,
      }));

      setIsEditing(false);
      setCurrentReviewId(null);
      await loadReviews();
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} review`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmployeeSelect = (event) => {
    const nextEmployeeId = event.target.value;
    const employee = employees.find((item) => item.employeeId === nextEmployeeId) || null;

    setForm((prev) => ({
      ...prev,
      employeeId: nextEmployeeId,
      employeeName: employee?.name || '',
      department: employee?.department || '',
    }));
  };

  const handleRowClick = (review) => {
    if (!isManagement) {
      setSelectedReview(review);
      return;
    }
    setForm({
      employeeName: review.employeeName,
      employeeId: review.employeeId,
      department: review.department,
      reviewer: review.reviewer,
      cycle: review.cycle,
      goalsScore: review.goalsScore,
      competencyScore: review.competencyScore,
      behaviorScore: review.behaviorScore,
      recommendation: review.recommendation,
      status: review.status,
      bonusAmount: review.bonusAmount || 500,
    });
    setIsEditing(true);
    setCurrentReviewId(review.id);
  };

  return (
    <div className="space-y-6">
      <PerformanceSectionTabs
        title="Performance Reviews"
        description="Review employees with a clear score breakdown, cycle context, and manager recommendation in one place."
        helper="Track progress during the quarter in Goals & KPIs, then use this page to complete the appraisal."
      />

      {successMsg && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-5 py-3 rounded-xl text-sm font-medium">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          {successMsg}
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          {isManagement ? 'All Appraisals' : 'My Performance Appraisal Summary'}
        </h2>
        {isManagement ? (
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <div className={sectionCardClass}>
              <p className="text-sm text-gray-500">Total Reviews</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{summary.totalReviews}</p>
              <p className="mt-2 text-xs text-gray-500">All records in the current filtered list.</p>
            </div>
            <div className={sectionCardClass}>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{summary.completed}</p>
              <p className="mt-2 text-xs text-gray-500">Reviews that are ready for decision making.</p>
            </div>
            <div className={sectionCardClass}>
              <p className="text-sm text-gray-500">Average Rating</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{summary.avgRating.toFixed(1)} / 5</p>
              <p className="mt-2 text-xs text-gray-500">Based on completed reviews only.</p>
            </div>
            <div className={sectionCardClass}>
              <p className="text-sm text-gray-500">Promotion Suggested</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{summary.promotions}</p>
              <p className="mt-2 text-xs text-gray-500">Employees marked for promotion review.</p>
            </div>
            <div className={sectionCardClass}>
              <p className="text-sm text-gray-500">Bonus Suggested</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{summary.bonuses}</p>
              <p className="mt-2 text-xs text-gray-500">Employees recommended for incentive payout.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div className={sectionCardClass}>
              <p className="text-sm text-gray-500">Total Score / Rating</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {latestReview ? `${latestReview.finalRating.toFixed(1)} / 5` : 'N/A'}
              </p>
              {latestReview && (
                <span className={`inline-block mt-2 rounded-full px-3 py-1 text-xs font-medium ${getRatingBand(latestReview.finalRating).className}`}>
                  {getRatingBand(latestReview.finalRating).label}
                </span>
              )}
            </div>
            <div className={sectionCardClass}>
              <p className="text-sm text-gray-500">Competency Score</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {latestReview ? `${toNumber(latestReview.competencyScore).toFixed(1)} / 5` : 'N/A'}
              </p>
              <p className="mt-2 text-xs text-gray-500">Core skills and competencies evaluation.</p>
            </div>
            <div className={sectionCardClass}>
              <p className="text-sm text-gray-500">Behavior Score</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {latestReview ? `${toNumber(latestReview.behaviorScore).toFixed(1)} / 5` : 'N/A'}
              </p>
              <p className="mt-2 text-xs text-gray-500">Workplace behaviour and teamwork evaluation.</p>
            </div>
          </div>
        )}
      </div>

      {isManagement && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className={sectionCardClass}>
            <p className="text-sm font-semibold text-gray-900">1. Select the employee</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Choose the employee from the existing list so the appraisal uses the correct ID and department automatically.
            </p>
          </div>
          <div className={sectionCardClass}>
            <p className="text-sm font-semibold text-gray-900">2. Score the review areas</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Enter goals, competency, and behavior scores from 0 to 5. The final rating is averaged automatically.
            </p>
          </div>
          <div className={sectionCardClass}>
            <p className="text-sm font-semibold text-gray-900">3. Confirm the decision</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Set the recommendation and review status so leaders can quickly understand the outcome.
            </p>
          </div>
        </div>
      )}

      {isManagement && (
        <form onSubmit={handleSubmit} className={`${sectionCardClass} space-y-6`}>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create New Appraisal</h2>
              <p className="mt-1 text-sm text-gray-500">
                Fill in the review information below. Required fields are grouped so the form is easier to follow.
              </p>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              Final rating preview: <span className="font-semibold">{calculatedRating.toFixed(1)} / 5</span>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Employee Details</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select the employee first, then add the reviewer responsible for the appraisal.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    <span>Employee</span>
                    <select
                      value={form.employeeId}
                      onChange={handleEmployeeSelect}
                      disabled={loadingEmployees || employees.length === 0}
                      className={inputClassName}
                    >
                      <option value="">
                        {loadingEmployees ? 'Loading employees...' : employees.length === 0 ? 'No employees found' : 'Select employee'}
                      </option>
                      {employees.map((employee) => (
                        <option key={employee.id || employee.employeeId} value={employee.employeeId}>
                          {employee.name} ({employee.employeeId})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    <span>Employee ID</span>
                    <input
                      value={form.employeeId}
                      readOnly
                      placeholder="Select employee first"
                      className={inputClassName}
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    <span>Department</span>
                    <input
                      value={form.department}
                      readOnly
                      placeholder="Department will appear here"
                      className={inputClassName}
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    <span>Reviewer</span>
                    <input
                      value={form.reviewer}
                      onChange={(event) => setForm((prev) => ({ ...prev, reviewer: event.target.value }))}
                      placeholder="Nimal Fernando"
                      className={inputClassName}
                    />
                  </label>
                </div>
                {employeeLoadError ? <p className="text-sm text-red-600">{employeeLoadError}</p> : null}
                {selectedEmployee ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    Reviewing <span className="font-semibold text-gray-900">{selectedEmployee.name}</span> from{' '}
                    <span className="font-semibold text-gray-900">{selectedEmployee.department}</span>.
                  </div>
                ) : null}
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Review Inputs</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Use scores between 0 and 5. The preview card on the right updates automatically.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    <span>Review Cycle</span>
                    <input
                      value={form.cycle}
                      onChange={(event) => setForm((prev) => ({ ...prev, cycle: event.target.value }))}
                      placeholder="Q1 2026"
                      className={inputClassName}
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    <span>Goals Score</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={form.goalsScore}
                      onChange={(event) => setForm((prev) => ({ ...prev, goalsScore: event.target.value }))}
                      className={inputClassName}
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    <span>Competency Score</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={form.competencyScore}
                      onChange={(event) => setForm((prev) => ({ ...prev, competencyScore: event.target.value }))}
                      className={inputClassName}
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    <span>Behavior Score</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={form.behaviorScore}
                      onChange={(event) => setForm((prev) => ({ ...prev, behaviorScore: event.target.value }))}
                      className={inputClassName}
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Decision</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select the outcome and whether the review is still in progress or complete.
                  </p>
                </div>
                <div className={`grid gap-4 ${form.recommendation === 'Bonus' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    <span>Recommendation</span>
                    <select
                      value={form.recommendation}
                      onChange={(event) => setForm((prev) => ({ ...prev, recommendation: event.target.value }))}
                      className={inputClassName}
                    >
                      <option>No Change</option>
                      <option>Bonus</option>
                      <option>Promotion</option>
                      <option>Performance Plan</option>
                    </select>
                  </label>
                  {form.recommendation === 'Bonus' && (
                    <label className="space-y-2 text-sm font-medium text-gray-700">
                      <span>Bonus Amount ($)</span>
                      <input
                        type="number"
                        min="0"
                        value={form.bonusAmount}
                        onChange={(event) => setForm((prev) => ({ ...prev, bonusAmount: event.target.value }))}
                        placeholder="500"
                        className={inputClassName}
                      />
                    </label>
                  )}
                  <label className="space-y-2 text-sm font-medium text-gray-700">
                    <span>Review Status</span>
                    <select
                      value={form.status}
                      onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                      className={inputClassName}
                    >
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                  </label>
                </div>
              </section>
            </div>

            <aside className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-900">Rating Preview</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                The final rating is the average of goals, competency, and behavior scores.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Final Rating</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{calculatedRating.toFixed(1)} / 5</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${calculatedBand.className}`}>
                  {calculatedBand.label}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  { label: 'Goals', value: form.goalsScore },
                  { label: 'Competency', value: form.competencyScore },
                  { label: 'Behavior', value: form.behaviorScore },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{item.label}</span>
                      <span className="font-semibold text-gray-900">{toNumber(item.value).toFixed(1)} / 5</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${Math.min((toNumber(item.value) / 5) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 text-xs leading-6 text-gray-600">
                Rating guide: 4.5+ Outstanding, 4.0+ Exceeds, 3.0+ Meets, below 3.0 Needs Improvement.
              </div>
            </aside>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Review'}
            </button>
          </div>
        </form>
      )}

      {!isManagement && selectedReview && (
        <div className={`${sectionCardClass} space-y-6 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-indigo-100`}>
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Appraisal Details — {selectedReview.cycle}</h3>
              <p className="text-sm text-gray-500">Detailed feedback and scores from your reviewer.</p>
            </div>
            <button
              onClick={() => setSelectedReview(null)}
              className="text-gray-400 hover:text-gray-600 text-sm font-medium"
            >
              Close
            </button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reviewer / Manager</p>
              <p className="text-sm font-medium text-gray-900">{selectedReview.reviewer}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recommendation</p>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${recommendationClass(selectedReview.recommendation)}`}>
                {selectedReview.recommendation}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${selectedReview.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {selectedReview.status === 'Completed' ? 'Finalized / Approved' : 'In Progress'}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Detailed Score Breakdown</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Goals Score', value: selectedReview.goalsScore },
                { label: 'Competency Score', value: selectedReview.competencyScore },
                { label: 'Behavior Score', value: selectedReview.behaviorScore },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{item.label}</span>
                    <span className="font-semibold text-gray-900">{toNumber(item.value).toFixed(1)} / 5</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${(toNumber(item.value) / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={sectionCardClass}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Find Reviews</h2>
            <p className="mt-1 text-sm text-gray-500">
              Search by employee, department, or ID, then narrow the list by cycle and status.
            </p>
            <p className="mt-2 text-sm font-medium text-indigo-700">{visibleReviewsLabel}</p>
          </div>
          <div className="grid flex-1 gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Employee, department, or ID"
                className={inputClassName}
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Review Cycle</span>
              <select
                value={cycleFilter}
                onChange={(event) => setCycleFilter(event.target.value)}
                className={inputClassName}
              >
                {cycleOptions.map((cycle) => (
                  <option key={cycle}>{cycle}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className={inputClassName}
              >
                <option>All Status</option>
                <option>Completed</option>
                <option>In Progress</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Review History</h2>
            <p className="mt-1 text-sm text-gray-500">Each row shows the employee, review context, score summary, and outcome.</p>
          </div>
          {isManagement && (
            <button
              type="button"
              disabled={clearing || safeDisplayReviews.length === 0}
              onClick={async () => {
                const confirmed = window.confirm(
                  'Are you sure you want to clear all unprocessed test review history?\n\nThis will delete all reviews that have NOT been processed by payroll, and rollback any promotion salary bumps. This action cannot be undone.'
                );
                if (!confirmed) return;

                setClearing(true);
                setError('');
                try {
                  const response = await apiClient.delete('/performance/reviews/clear-test');
                  const msg = response.data?.message || 'Test history cleared successfully.';
                  showSuccess(msg);
                  await loadReviews();
                } catch (err) {
                  setError(err.response?.data?.message || 'Failed to clear test history');
                } finally {
                  setClearing(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">delete_sweep</span>
              {clearing ? 'Clearing...' : 'Clear Test History'}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Review Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Score Summary</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Decision</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {safeDisplayReviews.map((review) => {
                const hasRating = review.finalRating !== null && review.finalRating !== undefined;
                const ratingBand = hasRating ? getRatingBand(review.finalRating) : null;

                return (
                  <tr key={review.id} onClick={() => handleRowClick(review)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{review.employeeName}</p>
                      <p className="text-xs text-gray-500">
                        {review.employeeId} · {review.department}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{review.cycle}</p>
                      <p className="text-xs text-gray-500">Reviewed by {review.reviewer}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-bold text-gray-900">
                          {hasRating ? review.finalRating.toFixed(1) : 'Pending'}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            ratingBand ? ratingBand.className : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {ratingBand ? ratingBand.label : 'Not Rated'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Goals {toNumber(review.goalsScore).toFixed(1)} · Competency{' '}
                        {toNumber(review.competencyScore).toFixed(1)} · Behavior{' '}
                        {toNumber(review.behaviorScore).toFixed(1)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${recommendationClass(
                          review.recommendation
                        )}`}
                      >
                        {review.recommendation}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          review.status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {review.status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {loading && reviews.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                    Loading performance reviews...
                  </td>
                </tr>
              ) : null}

              {!loading && reviews.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                    No performance reviews found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default PerformanceReviews;
