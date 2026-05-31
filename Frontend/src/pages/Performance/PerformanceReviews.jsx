import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../../services/api';
import PerformanceSectionTabs from '../../components/PerformanceSectionTabs';

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
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(defaultSummary);
  const [cycles, setCycles] = useState([]);
  const [employees, setEmployees] = useState([]);

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
  });

  const [loading, setLoading] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [employeeLoadError, setEmployeeLoadError] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (cycleFilter !== 'All Cycles') params.cycle = cycleFilter;
      if (statusFilter !== 'All Status') params.status = statusFilter;

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
        const response = await apiClient.get('/payroll/employees');
        if (!isActive) return;
        setEmployees(response.data?.data || []);
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

  const cycleOptions = useMemo(() => {
    const set = new Set(cycles);
    if (form.cycle) set.add(form.cycle);
    return ['All Cycles', ...set];
  }, [cycles, form.cycle]);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === form.employeeId) || null,
    [employees, form.employeeId]
  );

  const calculatedRating = useMemo(() => {
    return Number(
      ((toNumber(form.goalsScore) + toNumber(form.competencyScore) + toNumber(form.behaviorScore)) / 3).toFixed(1)
    );
  }, [form.behaviorScore, form.competencyScore, form.goalsScore]);

  const calculatedBand = getRatingBand(calculatedRating);
  const visibleReviewsLabel = loading
    ? 'Loading reviews...'
    : `${reviews.length} review${reviews.length === 1 ? '' : 's'} in this view`;

  const handleCreateReview = async (event) => {
    event.preventDefault();

    if (!form.employeeName || !form.employeeId || !form.department || !form.reviewer || !form.cycle) {
      setError('Please fill all required review fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await apiClient.post('/performance/reviews', {
        employeeName: form.employeeName,
        employeeId: form.employeeId,
        department: form.department,
        reviewer: form.reviewer,
        cycle: form.cycle,
        goalsScore: toNumber(form.goalsScore),
        competencyScore: toNumber(form.competencyScore),
        behaviorScore: toNumber(form.behaviorScore),
        recommendation: form.recommendation,
        status: form.status,
      });

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
      }));

      await loadReviews();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to create review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmployeeSelect = (event) => {
    const nextEmployeeId = event.target.value;
    const employee = employees.find((item) => item.id === nextEmployeeId) || null;

    setForm((prev) => ({
      ...prev,
      employeeId: nextEmployeeId,
      employeeName: employee?.name || '',
      department: employee?.department || '',
    }));
  };

  return (
    <div className="space-y-6">
      <PerformanceSectionTabs
        title="Performance Reviews"
        description="Review employees with a clear score breakdown, cycle context, and manager recommendation in one place."
        helper="Track progress during the quarter in Goals & KPIs, then use this page to complete the appraisal."
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

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

      <form onSubmit={handleCreateReview} className={`${sectionCardClass} space-y-6`}>
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
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.id})
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
              <div className="grid gap-4 md:grid-cols-2">
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
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Review History</h2>
          <p className="mt-1 text-sm text-gray-500">Each row shows the employee, review context, score summary, and outcome.</p>
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
              {reviews.map((review) => {
                const hasRating = review.finalRating !== null && review.finalRating !== undefined;
                const ratingBand = hasRating ? getRatingBand(review.finalRating) : null;

                return (
                  <tr key={review.id} className="hover:bg-gray-50 transition-colors">
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
