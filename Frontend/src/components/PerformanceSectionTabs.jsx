import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';

const sections = [
  {
    to: '/performance/reviews',
    label: 'Performance Reviews',
    description: 'Finalize ratings, recommendations, and review status by cycle.',
  },
  {
    to: '/performance/goals',
    label: 'Goals & KPIs',
    description: 'Track progress against targets and keep KPI updates current.',
  },
];

const PerformanceSectionTabs = ({ title, description, helper }) => {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-6 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-100">Performance Hub</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">{description}</p>
        {helper ? <p className="mt-4 text-sm text-indigo-100">{helper}</p> : null}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
        <div className="grid gap-2 md:grid-cols-2">
          {sections.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg border px-4 py-4 transition-colors ${
                  isActive
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <div>
                <p className="text-sm font-semibold">{section.label}</p>
                <p className="mt-1 text-xs leading-5 text-inherit opacity-80">{section.description}</p>
              </div>
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

PerformanceSectionTabs.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  helper: PropTypes.node,
};

export default PerformanceSectionTabs;
