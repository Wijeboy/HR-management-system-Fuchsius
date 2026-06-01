/* eslint-disable react/prop-types */
import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
const formatCurrencyCompact = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

const formatCount = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));

const mockDashboard = {
  metrics: [
    { label: 'Total Employees', value: 1248, change: '+12%', icon: 'group', tone: 'emerald' },
    { label: 'Monthly Payroll', value: 4200000, change: '+2.4%', icon: 'attach_money', tone: 'emerald', format: 'currency' },
    { label: 'Active Requests', value: 145, change: '-5%', icon: 'pending_actions', tone: 'rose' },
    { label: 'Open Positions', value: 12, change: '0%', icon: 'person_add', tone: 'slate' },
  ],
  departments: [
    { name: 'Eng', count: 42, height: 54, tone: 'indigo' },
    { name: 'Sales', count: 58, height: 78, tone: 'purple' },
    { name: 'Mkt', count: 24, height: 36, tone: 'violet' },
    { name: 'Ops', count: 67, height: 96, tone: 'purpleDark' },
    { name: 'HR', count: 81, height: 120, tone: 'indigoDeep' },
  ],
  payrollTrend: [
    { month: 'Jan', value: 28 },
    { month: 'Feb', value: 27 },
    { month: 'Mar', value: 30 },
    { month: 'Apr', value: 33 },
    { month: 'May', value: 35 },
    { month: 'Jun', value: 36 },
  ],
  requests: [
    { initials: 'SJ', name: 'Sarah Jenkins', type: 'Time Off', department: 'Engineering', date: 'Oct 24, 2023', status: 'Pending', action: 'Review' },
    { initials: 'MR', name: 'Michael Ross', type: 'Expense', department: 'Sales', date: 'Oct 23, 2023', status: 'Approved', action: 'Details' },
    { initials: 'AC', name: 'Anika Chen', type: 'Shift Change', department: 'Operations', date: 'Oct 22, 2023', status: 'Pending', action: 'Review' },
    { initials: 'DP', name: 'Daniel Park', type: 'Leave', department: 'HR', date: 'Oct 21, 2023', status: 'Approved', action: 'Details' },
  ],
};

const statusPillClass = (status) => {
  if (status === 'Approved') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Pending') return 'bg-amber-100 text-amber-700';
  if (status === 'Rejected') return 'bg-rose-100 text-rose-700';
  return 'bg-slate-100 text-slate-700';
};

const MetricCard = ({ label, value, change, icon, tone, format }) => {
  const toneClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
    slate: 'bg-slate-50 text-slate-700 ring-slate-100',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_1px_rgba(15,23,42,0.03)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div className="mt-3 flex items-end gap-3">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {format === 'currency' ? formatCurrencyCompact(value) : formatCount(value)}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClasses[tone] || toneClasses.slate}`}>
              {change}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">vs. last month</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  const dashboard = useMemo(() => mockDashboard, []);
  const welcomeName = user?.name || 'Admin';
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Admin';

  const payrollPath = dashboard.payrollTrend;
  const chartHeight = 180;
  const chartWidth = 620;
  const padding = 20;
  const maxTrend = Math.max(...payrollPath.map((point) => point.value));
  const minTrend = Math.min(...payrollPath.map((point) => point.value));
  const trendRange = Math.max(maxTrend - minTrend, 1);
  const pointStep = (chartWidth - padding * 2) / (payrollPath.length - 1);

  const linePoints = payrollPath
    .map((point, index) => {
      const x = padding + index * pointStep;
      const normalized = (point.value - minTrend) / trendRange;
      const y = chartHeight - padding - normalized * (chartHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${padding},${chartHeight - padding} ${linePoints} ${chartWidth - padding},${chartHeight - padding}`;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white/70 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard Overview</h1>
            <p className="mt-2 text-sm text-slate-500">Welcome back, {welcomeName}. Here&apos;s what&apos;s happening today.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {roleLabel} workspace active
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboard.metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.35fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Department Headcount</h2>
              <p className="mt-1 text-sm text-slate-500">Live distribution across the company</p>
            </div>
            <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <span className="material-symbols-outlined text-[18px] align-middle">more_horiz</span>
            </button>
          </div>

          <div className="mt-8 grid h-[280px] grid-cols-5 items-end gap-1 px-1 sm:gap-2">
            {dashboard.departments.map((dept) => (
              <div key={dept.name} className="flex flex-col items-center justify-end gap-1.5">
                <div className="flex h-7 items-end">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold leading-none text-slate-600">
                    {dept.count}
                  </span>
                </div>
                <div className="relative flex w-full justify-center">
                  <div
                    className={`w-full max-w-[44px] rounded-t-[18px] bg-gradient-to-t shadow-[0_10px_24px_rgba(99,102,241,0.12)] ${
                      dept.tone === 'indigo'
                        ? 'from-indigo-200 to-indigo-300'
                        : dept.tone === 'purple'
                          ? 'from-violet-300 to-indigo-500'
                          : dept.tone === 'violet'
                            ? 'from-violet-100 to-violet-200'
                            : dept.tone === 'purpleDark'
                              ? 'from-indigo-400 to-indigo-500'
                              : 'from-indigo-500 to-violet-600'
                    }`}
                    style={{ height: `${dept.height}px` }}
                  />
                </div>
                      <p className="text-xs font-semibold tracking-tight text-slate-500">{dept.name}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Payroll Trends (YTD)</h2>
              <p className="mt-1 text-sm text-slate-500">Total Spend: $38,402,000</p>
            </div>
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <option>Last 6 Months</option>
            </select>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-50/70 to-white p-4">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[240px] w-full">
              <defs>
                <linearGradient id="payrollArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="20" y1="160" x2="600" y2="160" stroke="#e2e8f0" strokeDasharray="4 6" />
              <line x1="20" y1="115" x2="600" y2="115" stroke="#eef2ff" />
              <polygon points={areaPoints} fill="url(#payrollArea)" />
              <polyline points={linePoints} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {payrollPath.map((point, index) => {
                const x = padding + index * pointStep;
                const normalized = (point.value - minTrend) / trendRange;
                const y = chartHeight - padding - normalized * (chartHeight - padding * 2);
                return <circle key={point.month} cx={x} cy={y} r="3.5" fill="#fff" stroke="#6366f1" strokeWidth="2" />;
              })}
              {payrollPath.map((point, index) => (
                <text key={point.month} x={padding + index * pointStep} y={chartHeight - 4} textAnchor="middle" className="fill-slate-500 text-[11px] font-medium">
                  {point.month}
                </text>
              ))}
            </svg>
          </div>
        </section>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Requests</h2>
            <p className="mt-1 text-sm text-slate-500">Latest activity across the organization</p>
          </div>
          <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View All</button>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-6 gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            <span className="col-span-2">Employee</span>
            <span>Type</span>
            <span>Department</span>
            <span>Date</span>
            <span>Status</span>
          </div>
          {dashboard.requests.map((request) => (
            <div key={`${request.name}-${request.date}`} className="grid grid-cols-6 items-center gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0 hover:bg-slate-50/60">
              <div className="col-span-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {request.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{request.name}</p>
                </div>
              </div>
              <div className="text-sm text-slate-600">{request.type}</div>
              <div className="text-sm text-slate-600">{request.department}</div>
              <div className="text-sm text-slate-600">{request.date}</div>
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(request.status)}`}>{request.status}</span>
                <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">{request.action}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
