import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../../services/api';
import PerformanceSectionTabs from '../../components/PerformanceSectionTabs';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const statusBadge = (status) => {
  if (status === 'Achieved') return 'bg-green-100 text-green-700';
  if (status === 'On Track') return 'bg-blue-100 text-blue-700';
  return 'bg-red-100 text-red-700';
};

const progressBarClass = (status) => {
  if (status === 'Achieved') return 'bg-green-500';
  if (status === 'On Track') return 'bg-blue-500';
  return 'bg-red-500';
};

const defaultSummary = {
  activeGoals: 0,
  achieved: 0,
  atRisk: 0,
  weightedPerformance: 0,
};

const inputClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500';

const sectionCardClass = 'rounded-xl border border-gray-200 bg-white p-6 shadow-sm';

const formatDateLabel = (value) => {
  if (!value) return 'No due date';

  const [year, month, day] = String(value)
    .split('-')
    .map((part) => Number(part));

  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(year, month - 1, day));
};

const GoalsKPIs = () => {
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(defaultSummary);
  const [employeeLabels, setEmployeeLabels] = useState([]);
  const [employeeFilter, setEmployeeFilter] = useState('All Employees');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [allUsers, setAllUsers] = useState([]);

  const [form, setForm] = useState({
    employeeName: '',
    employeeId: '',
    goal: '',
    metric: '',
    target: 0,
    current: 0,
    weight: 10,
    dueDate: '',
    lowerIsBetter: false,
  });

  const [draftCurrent, setDraftCurrent] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingGoalId, setUpdatingGoalId] = useState('');
  const [error, setError] = useState('');

  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {};
      if (employeeFilter !== 'All Employees') params.employee = employeeFilter;
      if (statusFilter !== 'All Status') params.status = statusFilter;

      const response = await apiClient.get('/performance/goals', { params });
      setGoals(response.data?.data || []);
      setSummary(response.data?.summary || defaultSummary);
      setEmployeeLabels(response.data?.employees || []);
    } catch (requestError) {
      setGoals([]);
      setSummary(defaultSummary);
      setEmployeeLabels([]);
      setError(requestError.response?.data?.message || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, [employeeFilter, statusFilter]);

  useEffect(() => {
    loadGoals();
    const loadUsers = async () => {
      try {
        const response = await apiClient.get('/users');
        setAllUsers(response.data?.users || []);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };
    loadUsers();
  }, [loadGoals]);

  const employeeOptions = useMemo(() => ['All Employees', ...employeeLabels], [employeeLabels]);
  const visibleGoalsLabel = loading
    ? 'Loading goals...'
    : `${goals.length} goal${goals.length === 1 ? '' : 's'} in this view`;

  const handleAddGoal = async (event) => {
    event.preventDefault();

    if (!form.employeeName || !form.employeeId || !form.goal || !form.metric || !form.dueDate) {
      setError('Please fill all required goal fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await apiClient.post('/performance/goals', {
        employeeName: form.employeeName,
        employeeId: form.employeeId,
        goal: form.goal,
        metric: form.metric,
        target: toNumber(form.target),
        current: toNumber(form.current),
        weight: toNumber(form.weight),
        dueDate: form.dueDate,
        lowerIsBetter: form.lowerIsBetter,
      });

      setForm({
        employeeName: '',
        employeeId: '',
        goal: '',
        metric: '',
        target: 0,
        current: 0,
        weight: 10,
        dueDate: '',
        lowerIsBetter: false,
      });

      await loadGoals();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to add goal');
    } finally {
      setSubmitting(false);
    }
  };

  const updateCurrentValue = async (goalId) => {
    if (!(goalId in draftCurrent)) return;

    const inputValue = toNumber(draftCurrent[goalId]);
    const targetGoal = goals.find((goal) => goal.id === goalId);

    if (!targetGoal || inputValue === toNumber(targetGoal.current)) {
      setDraftCurrent((prev) => {
        const next = { ...prev };
        delete next[goalId];
        return next;
      });
      return;
    }

    setUpdatingGoalId(goalId);
    setError('');

    try {
      await apiClient.patch(`/performance/goals/${goalId}/current`, {
        current: inputValue,
      });

      setDraftCurrent((prev) => {
        const next = { ...prev };
        delete next[goalId];
        return next;
      });

      await loadGoals();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update KPI current value');
    } finally {
      setUpdatingGoalId('');
    }
  };

  return (
    <div className="space-y-6">
      <PerformanceSectionTabs
        title="Goals & KPI Tracking"
        description="Define measurable goals, compare current values against targets, and keep performance progress easy to read."
        helper="Use this page during the review cycle, then switch to Performance Reviews to complete the appraisal."
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={sectionCardClass}>
          <p className="text-sm text-gray-500">Active Goals</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.activeGoals}</p>
          <p className="mt-2 text-xs text-gray-500">Goals currently visible in this filtered view.</p>
        </div>
        <div className={sectionCardClass}>
          <p className="text-sm text-gray-500">Achieved</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.achieved}</p>
          <p className="mt-2 text-xs text-gray-500">Goals that reached or exceeded the target.</p>
        </div>
        <div className={sectionCardClass}>
          <p className="text-sm text-gray-500">At Risk</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.atRisk}</p>
          <p className="mt-2 text-xs text-gray-500">Goals below the safe progress threshold.</p>
        </div>
        <div className={sectionCardClass}>
          <p className="text-sm text-gray-500">Weighted Performance</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.weightedPerformance.toFixed(1)}%</p>
          <p className="mt-2 text-xs text-gray-500">Progress weighted by each goal&apos;s importance.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={sectionCardClass}>
          <p className="text-sm font-semibold text-gray-900">1. Define the goal</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Add who owns the goal, what metric matters, and what target should be reached.
          </p>
        </div>
        <div className={sectionCardClass}>
          <p className="text-sm font-semibold text-gray-900">2. Keep the current value updated</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Update the latest KPI number as work progresses so the status stays accurate.
          </p>
        </div>
        <div className={sectionCardClass}>
          <p className="text-sm font-semibold text-gray-900">3. Watch the status</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Achieved means 100%+, On Track means 75%+, and At Risk means it needs attention.
          </p>
        </div>
      </div>

      <form onSubmit={handleAddGoal} className={`${sectionCardClass} space-y-6`}>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Add New Goal or KPI</h2>
          <p className="mt-1 text-sm text-gray-500">
            The form is split into employee information, goal definition, and tracking rules.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Employee Details</h3>
                <p className="mt-1 text-sm text-gray-500">Identify the owner of the KPI or goal.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-gray-700">
                  <span>Employee</span>
                  <select
                    value={form.employeeId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedUser = allUsers.find((u) => u.employeeId === selectedId);
                      setForm((prev) => ({
                        ...prev,
                        employeeId: selectedId,
                        employeeName: selectedUser ? selectedUser.name : '',
                      }));
                    }}
                    className={inputClassName}
                  >
                    <option value="">Select an employee...</option>
                    {allUsers.map((user) => (
                      <option key={user.employeeId} value={user.employeeId}>
                        {user.name} ({user.employeeId})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-gray-700">
                  <span>Goal Title</span>
                  <input
                    value={form.goal}
                    onChange={(event) => setForm((prev) => ({ ...prev, goal: event.target.value }))}
                    placeholder="Reduce payroll processing time"
                    className={inputClassName}
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Goal Definition</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Explain what should be measured and the target the employee should reach.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <label className="space-y-2 text-sm font-medium text-gray-700 xl:col-span-2">
                  <span>Metric</span>
                  <input
                    value={form.metric}
                    onChange={(event) => setForm((prev) => ({ ...prev, metric: event.target.value }))}
                    placeholder="Average processing hours"
                    className={inputClassName}
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-gray-700">
                  <span>Target</span>
                  <input
                    type="number"
                    value={form.target}
                    onChange={(event) => setForm((prev) => ({ ...prev, target: event.target.value }))}
                    className={inputClassName}
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-gray-700">
                  <span>Starting Current Value</span>
                  <input
                    type="number"
                    value={form.current}
                    onChange={(event) => setForm((prev) => ({ ...prev, current: event.target.value }))}
                    className={inputClassName}
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-gray-700">
                  <span>Weight %</span>
                  <input
                    type="number"
                    value={form.weight}
                    onChange={(event) => setForm((prev) => ({ ...prev, weight: event.target.value }))}
                    className={inputClassName}
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Tracking Rules</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Set the due date and whether a smaller number means better performance.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-gray-700">
                  <span>Due Date</span>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                    className={inputClassName}
                  />
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.lowerIsBetter}
                    onChange={(event) => setForm((prev) => ({ ...prev, lowerIsBetter: event.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Lower is better</p>
                    <p className="text-xs text-gray-500">
                      Turn this on for metrics like defect count, response time, or processing hours.
                    </p>
                  </div>
                </label>
              </div>
            </section>
          </div>

          <aside className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-semibold text-gray-900">Status Guide</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Progress is based on current value vs target. Results above 100% mean the goal is exceeded.
            </p>
            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-800">Achieved</p>
                <p className="mt-1 text-xs leading-5 text-green-700">Progress is at least 100% of target.</p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-800">On Track</p>
                <p className="mt-1 text-xs leading-5 text-blue-700">Progress is between 75% and 99.9%.</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">At Risk</p>
                <p className="mt-1 text-xs leading-5 text-red-700">Progress is below 75% and may need follow-up.</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Goal'}
          </button>
        </div>
      </form>

      <div className={sectionCardClass}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Filter Goals</h2>
            <p className="mt-1 text-sm text-gray-500">
              Narrow the list by employee and status to focus on the right KPIs quickly.
            </p>
            <p className="mt-2 text-sm font-medium text-indigo-700">{visibleGoalsLabel}</p>
          </div>
          <div className="grid flex-1 gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Employee</span>
              <select
                value={employeeFilter}
                onChange={(event) => setEmployeeFilter(event.target.value)}
                className={inputClassName}
              >
                {employeeOptions.map((employee) => (
                  <option key={employee}>{employee}</option>
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
                <option>Achieved</option>
                <option>On Track</option>
                <option>At Risk</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Goal Tracker</h2>
          <p className="mt-1 text-sm text-gray-500">Update the current value and click Save to refresh KPI progress.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Goal / KPI</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Progress</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Due Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Current Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {goals.map((goal) => {
                const hasPendingChange =
                  draftCurrent[goal.id] !== undefined && toNumber(draftCurrent[goal.id]) !== toNumber(goal.current);

                return (
                  <tr key={goal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-900">{goal.employeeName}</p>
                      <p className="text-xs text-gray-500">{goal.employeeId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{goal.goal}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {goal.metric} · Target: {goal.target} · Weight: {goal.weight}% ·{' '}
                        {goal.lowerIsBetter ? 'Lower is better' : 'Higher is better'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-56">
                        <div className="flex items-center justify-between">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(goal.status)}`}>
                            {goal.status}
                          </span>
                          <span className="text-xs font-medium text-gray-700">{(goal.progress || 0).toFixed(1)}%</span>
                        </div>
                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-2.5 ${progressBarClass(goal.status)}`}
                            style={{ width: `${Math.min(goal.progress || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-700">{formatDateLabel(goal.dueDate)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          value={draftCurrent[goal.id] ?? goal.current}
                          onChange={(event) =>
                            setDraftCurrent((prev) => ({
                              ...prev,
                              [goal.id]: event.target.value,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              updateCurrentValue(goal.id);
                            }
                          }}
                          disabled={updatingGoalId === goal.id}
                          className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-right text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => updateCurrentValue(goal.id)}
                          disabled={!hasPendingChange || updatingGoalId === goal.id}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingGoalId === goal.id ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Press Enter or Save after editing.</p>
                    </td>
                  </tr>
                );
              })}

              {loading && goals.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                    Loading KPI goals...
                  </td>
                </tr>
              ) : null}

              {!loading && goals.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                    No KPI goals found.
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

export default GoalsKPIs;
