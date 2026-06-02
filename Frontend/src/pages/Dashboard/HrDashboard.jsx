
const HRDashboard = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">HR Workspace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage employee data, run payroll, and oversee recruitment.
        </p>
      </div>

      {/* 3 Main Focus Areas (Employee, Payroll, Recruitment) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
        
        {/* 1. Employee Data Card */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <span className="material-symbols-outlined text-[24px]">badge</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">Employee Data</h3>
          <p className="mt-2 text-sm text-slate-500 flex-1">
            Manage employee profiles, update records, and monitor attendance.
          </p>
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-2xl font-bold text-slate-900">1,248</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Staff</span>
          </div>
          <button className="mt-4 w-full rounded-lg bg-indigo-50 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors">
            Manage Employees
          </button>
        </div>

        {/* 2. Payroll Card */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <span className="material-symbols-outlined text-[24px]">payments</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">Payroll Processing</h3>
          <p className="mt-2 text-sm text-slate-500 flex-1">
            Calculate salaries, generate payslips, and manage compensations.
          </p>
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-2xl font-bold text-slate-900">$4.2M</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">This Month</span>
          </div>
          <button className="mt-4 w-full rounded-lg bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
            Run Payroll
          </button>
        </div>

        {/* 3. Recruitment Card */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <span className="material-symbols-outlined text-[24px]">work</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">Recruitment</h3>
          <p className="mt-2 text-sm text-slate-500 flex-1">
            Post job vacancies, review applications, and schedule interviews.
          </p>
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-2xl font-bold text-slate-900">12</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Roles</span>
          </div>
          <button className="mt-4 w-full rounded-lg bg-rose-50 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors">
            View Applicants
          </button>
        </div>

      </div>

      {/* Quick Actions / Recent Activity Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">Pending HR Actions</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <span className="material-symbols-outlined text-[20px]">event_busy</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">24 Pending Leave Requests</p>
                <p className="text-xs text-slate-500">Requires HR approval</p>
              </div>
            </div>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Review</button>
          </div>
          
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <span className="material-symbols-outlined text-[20px]">person_add</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">5 New Candidate Applications</p>
                <p className="text-xs text-slate-500">For Senior Frontend Developer role</p>
              </div>
            </div>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Screen</button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HRDashboard;