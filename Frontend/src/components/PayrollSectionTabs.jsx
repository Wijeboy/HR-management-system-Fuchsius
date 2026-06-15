import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const sections = [
  {
    to: '/dashboard/payroll/records',
    label: 'Payroll Records',
    description: 'Review processed runs, totals, and payroll status by period.',
    match: '/records',
  },
  {
    to: '/dashboard/payroll/generate',
    label: 'Generate Payroll',
    description: 'Create a new payroll run using attendance, allowances, and deductions.',
    match: '/generate',
  },
  {
    to: '/dashboard/payroll/payslips',
    label: 'Payslips',
    description: 'Open salary statements and compare earnings, deductions, and take-home pay.',
    match: '/payslips',
  }
];

const PayrollSectionTabs = ({ title, description, helper, action }) => {
  const { user } = useAuth();
  const location = useLocation();
  const canManagePayroll = user?.role === 'admin' || user?.role === 'hr';

  const visibleSections = sections.filter((section) => {
    if (section.match === '/records' || section.match === '/generate') {
      return canManagePayroll;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-800 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100">Payroll Hub</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">{description}</p>
            {helper ? <p className="mt-4 text-sm text-cyan-100">{helper}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
        <div className={`grid gap-2 ${visibleSections.length > 1 ? 'md:grid-cols-3' : 'grid-cols-1'}`}>
          {visibleSections.map((section) => {
            const isActive = location.pathname.includes(section.match) || (section.match === '/payslips' && location.pathname.includes('/payslip/'));

            return (
              <Link
                key={section.to}
                to={section.to}
                className={`flex items-center justify-between rounded-lg border px-4 py-4 transition-colors ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold">{section.label}</p>
                  <p className="mt-1 text-xs leading-5 text-inherit opacity-80">{section.description}</p>
                </div>
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PayrollSectionTabs;
