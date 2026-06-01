import  { useState } from 'react';

const DepartmentDirectory = () => {
  const [departments] = useState([
    {
      id: 1,
      name: 'Engineering',
      description: 'Responsible for product development and infrastructure.',
      headName: 'Sarah Chen',
      headAvatar: 'https://i.pravatar.cc/150?u=sarah',
      members: 45,
      bgColor: 'bg-indigo-600',
      textColor: 'text-indigo-600',
      icon: 'code',
    },
    {
      id: 2,
      name: 'Human Resources',
      description: 'Employee relations, benefits, and hiring.',
      headName: 'Marcus Johnson',
      headAvatar: 'https://i.pravatar.cc/150?u=marcus',
      members: 12,
      bgColor: 'bg-rose-500',
      textColor: 'text-rose-500',
      icon: 'groups',
    },
    {
      id: 3,
      name: 'Marketing',
      description: 'Brand management, advertising, and market research.',
      headName: 'Elena Rodriguez',
      headAvatar: 'https://i.pravatar.cc/150?u=elena',
      members: 28,
      bgColor: 'bg-amber-500',
      textColor: 'text-amber-500',
      icon: 'campaign',
    },
    {
      id: 4,
      name: 'Sales',
      description: 'Global sales strategy, client acquisition, and revenue.',
      headName: 'David Kim',
      headAvatar: 'https://i.pravatar.cc/150?u=david',
      members: 62,
      bgColor: 'bg-emerald-500',
      textColor: 'text-emerald-500',
      icon: 'payments',
    },
    {
      id: 5,
      name: 'Legal & Compliance',
      description: 'Corporate governance, risk management, and compliance.',
      headName: 'Amara Okafor',
      headAvatar: 'https://i.pravatar.cc/150?u=amara',
      members: 5,
      bgColor: 'bg-slate-800',
      textColor: 'text-slate-800',
      icon: 'gavel',
    },
    {
      id: 6,
      name: 'Product Design',
      description: 'UX/UI design, user research, and prototyping.',
      headName: 'Sofia Rossi',
      headAvatar: 'https://i.pravatar.cc/150?u=sofia',
      members: 14,
      bgColor: 'bg-purple-600',
      textColor: 'text-purple-600',
      icon: 'design_services',
    },
  ]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans">
      
      {/* Breadcrumb */}
      <div className="mb-2 text-sm text-slate-500 font-medium">
        Home / <span className="text-slate-900">Departments</span>
      </div>

      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-tight text-slate-900">Department Directory</h1>
          <p className="mt-1 text-slate-500 text-[15px]">
            Manage your organizational structure and department details across the enterprise.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <button className="rounded bg-indigo-50 p-1.5 text-indigo-600">
              <span className="material-symbols-outlined text-[18px] block">grid_view</span>
            </button>
            <button className="rounded p-1.5 text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined text-[18px] block">list</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="mb-8 flex flex-wrap gap-3">
        <button className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all">
          All Departments
        </button>
        {['Engineering (12)', 'Human Resources (4)', 'Marketing (8)', 'Sales (24)', 'Product (6)'].map((filter) => (
          <button key={filter} className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
            {filter}
          </button>
        ))}
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 mb-10">
        {departments.map((dept) => (
          <div key={dept.id} className="flex flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
            
            {/* Top Color Section */}
            <div className={`${dept.bgColor} relative h-24 w-full p-4 flex justify-between`}>
              <div className="absolute -bottom-5 left-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                <span className={`material-symbols-outlined text-[24px] ${dept.textColor}`}>
                  {dept.icon}
                </span>
              </div>
              <div className="ml-auto">
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </div>
            </div>

            {/* Bottom Content Section */}
            <div className="flex flex-1 flex-col p-6 pt-8">
              <h3 className="text-xl font-bold text-slate-900">{dept.name}</h3>
              <p className="mt-2 text-sm text-slate-500 min-h-[40px] leading-relaxed">
                {dept.description}
              </p>

              {/* Head & Team Row */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                <div>
                  <p className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Head</p>
                  <div className="flex items-center gap-2">
                    <img src={dept.headAvatar} alt={dept.headName} className="h-6 w-6 rounded-full bg-slate-200 object-cover" />
                    <span className="text-sm font-bold text-slate-900">{dept.headName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Team</p>
                  <span className="text-sm font-bold text-slate-900">{dept.members} Members</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  Details
                </button>
                <button className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create New Department (Dashed Box) */}
      <div className="flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 text-center transition-all hover:bg-slate-50">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100">
          <span className="material-symbols-outlined text-[28px] text-slate-400">domain_add</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900">Create New Department</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm mb-6">
          Expand your organization by adding a new department structure.
        </p>
        <button className="rounded-lg bg-white border border-slate-200 shadow-sm px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
          Add Department
        </button>
      </div>

    </div>
  );
};

export default DepartmentDirectory;