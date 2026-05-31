import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/api';
import PayrollSectionTabs from '../../components/PayrollSectionTabs';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount || 0);

const inputClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500';

const sectionCardClass = 'rounded-xl border border-gray-200 bg-white p-6 shadow-sm';

const PayslipView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payslips, setPayslips] = useState([]);
  const [directPayslip, setDirectPayslip] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadPayslipData = async () => {
      setLoading(true);
      setError('');

      try {
        const listResponse = await apiClient.get('/payroll/payslips');
        const list = listResponse.data?.data || [];

        let single = null;
        if (id) {
          try {
            const byIdResponse = await apiClient.get(`/payroll/payslips/${id}`);
            single = byIdResponse.data?.data || null;
          } catch (_error) {
            single = list.find((item) => item.id === id) || null;
          }
        }

        if (!isActive) return;

        setPayslips(list);
        setDirectPayslip(single);

        const initial = single || list[0] || null;
        setSelectedEmployeeId(initial?.employeeId || '');
        setSelectedPeriod(initial?.period || '');
      } catch (requestError) {
        if (!isActive) return;
        setError(requestError.response?.data?.message || 'Failed to load payslips');
        setPayslips([]);
        setDirectPayslip(null);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadPayslipData();

    return () => {
      isActive = false;
    };
  }, [id]);

  const employeeOptions = useMemo(() => {
    const unique = new Map();
    payslips.forEach((item) => {
      if (!unique.has(item.employeeId)) {
        unique.set(item.employeeId, {
          employeeId: item.employeeId,
          employeeName: item.employeeName,
        });
      }
    });
    return Array.from(unique.values());
  }, [payslips]);

  const periodOptions = useMemo(() => {
    return payslips
      .filter((item) => item.employeeId === selectedEmployeeId)
      .map((item) => ({ period: item.period, label: item.periodLabel }))
      .filter((item, index, self) => self.findIndex((entry) => entry.period === item.period) === index);
  }, [payslips, selectedEmployeeId]);

  const activePayslip = useMemo(() => {
    const selected = payslips.find(
      (item) => item.employeeId === selectedEmployeeId && item.period === selectedPeriod
    );

    if (selected) return selected;
    if (directPayslip) return directPayslip;
    return payslips[0] || null;
  }, [directPayslip, payslips, selectedEmployeeId, selectedPeriod]);

  const totalEarnings = useMemo(() => {
    if (!activePayslip) return 0;
    return activePayslip.earnings.reduce((sum, item) => sum + item.amount, 0);
  }, [activePayslip]);

  const totalDeductions = useMemo(() => {
    if (!activePayslip) return 0;
    return activePayslip.deductions.reduce((sum, item) => sum + item.amount, 0);
  }, [activePayslip]);

  const netSalary = totalEarnings - totalDeductions;

  const handleEmployeeChange = (event) => {
    const nextEmployeeId = event.target.value;
    setSelectedEmployeeId(nextEmployeeId);

    const firstForEmployee = payslips.find((item) => item.employeeId === nextEmployeeId);
    setSelectedPeriod(firstForEmployee?.period || '');
  };

  const handleViewPayslip = () => {
    const selected = payslips.find(
      (item) => item.employeeId === selectedEmployeeId && item.period === selectedPeriod
    );

    if (selected) {
      navigate(`/payroll/payslip/${selected.id}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PayrollSectionTabs
          title="Payslips"
          description="Open employee salary statements with a cleaner selection flow and a clearer document layout."
          helper="Use Payroll Records to review the run first, then open the payslip when you need the employee-facing breakdown."
        />
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-8 text-sm text-gray-600 shadow-sm">
          Loading payslips...
        </div>
      </div>
    );
  }

  if (!activePayslip) {
    return (
      <div className="space-y-6">
        <PayrollSectionTabs
          title="Payslips"
          description="Open employee salary statements with a cleaner selection flow and a clearer document layout."
          helper="Use Payroll Records to review the run first, then open the payslip when you need the employee-facing breakdown."
          action={
            <Link
              to="/payroll/generate"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              <span className="material-symbols-outlined text-xl">receipt_long</span>
              Generate Payroll
            </Link>
          }
        />
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-8 text-sm text-gray-600 shadow-sm">
          No payslips available.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PayrollSectionTabs
        title="Payslips"
        description="View salary statements, compare earnings and deductions, and open the right employee document faster."
        helper="Use Payroll Records to compare runs at a high level, then use this page for the detailed employee-facing statement."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              <span className="material-symbols-outlined text-xl">print</span>
              Print
            </button>
            <button
              type="button"
              onClick={() => alert('PDF export can be connected to backend/document service.')}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              <span className="material-symbols-outlined text-xl">download</span>
              Download PDF
            </button>
          </div>
        }
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={sectionCardClass}>
          <p className="text-sm text-gray-500">Gross Pay</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(activePayslip.gross)}</p>
          <p className="mt-2 text-xs text-gray-500">Total earnings before deductions.</p>
        </div>
        <div className={sectionCardClass}>
          <p className="text-sm text-gray-500">Total Deductions</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(totalDeductions)}</p>
          <p className="mt-2 text-xs text-gray-500">Tax, insurance, statutory, leave, and other deductions.</p>
        </div>
        <div className={sectionCardClass}>
          <p className="text-sm text-gray-500">Take-Home Pay</p>
          <p className="mt-1 text-2xl font-bold text-indigo-700">{formatCurrency(netSalary)}</p>
          <p className="mt-2 text-xs text-gray-500">Final net salary paid to the employee.</p>
        </div>
        <div className={sectionCardClass}>
          <p className="text-sm text-gray-500">Payment Date</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{activePayslip.paymentDate}</p>
          <p className="mt-2 text-xs text-gray-500">Paid via {activePayslip.paymentMethod}.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={sectionCardClass}>
          <p className="text-sm font-semibold text-gray-900">1. Choose the employee</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Start with the employee selector so the correct set of available pay periods appears.
          </p>
        </div>
        <div className={sectionCardClass}>
          <p className="text-sm font-semibold text-gray-900">2. Pick the month</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Choose the pay period you want to inspect, then open the payslip document below.
          </p>
        </div>
        <div className={sectionCardClass}>
          <p className="text-sm font-semibold text-gray-900">3. Share or print</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Once the document looks right, print it or connect the PDF export action to your document workflow.
          </p>
        </div>
      </div>

      <div className={sectionCardClass}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Select Payslip</h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose the employee and month, then open the exact payslip you want to review.
            </p>
          </div>
          <div className="grid flex-1 gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Employee</span>
              <select value={selectedEmployeeId} onChange={handleEmployeeChange} className={inputClassName}>
                {employeeOptions.map((employee) => (
                  <option key={employee.employeeId} value={employee.employeeId}>
                    {employee.employeeName} ({employee.employeeId})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Month</span>
              <select
                value={selectedPeriod}
                onChange={(event) => setSelectedPeriod(event.target.value)}
                className={inputClassName}
              >
                {periodOptions.map((period) => (
                  <option key={period.period} value={period.period}>
                    {period.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleViewPayslip}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                View Payslip
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm xl:p-12">
        <div className="mb-8 flex items-start justify-between border-b border-gray-200 pb-6">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <span className="material-symbols-outlined text-2xl">hexagon</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">FUCHSIUS Corporation</h1>
                <p className="text-sm text-gray-500">Human Resource Management</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-indigo-600">PAYSLIP</h2>
            <p className="mt-2 text-sm text-gray-500">{activePayslip.periodLabel}</p>
            <p className="text-sm text-gray-500">Payment Date: {activePayslip.paymentDate}</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-8">
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase text-gray-600">Employee Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name:</span>
                <span className="font-semibold">{activePayslip.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Employee ID:</span>
                <span className="font-semibold">{activePayslip.employeeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Department:</span>
                <span className="font-semibold">{activePayslip.department}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase text-gray-600">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Bank Name:</span>
                <span className="font-semibold">{activePayslip.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account No:</span>
                <span className="font-semibold">{activePayslip.accountNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Method:</span>
                <span className="font-semibold">{activePayslip.paymentMethod}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-indigo-600">
                <th className="py-3 text-left text-sm font-semibold text-gray-900">Earnings</th>
                <th className="py-3 text-right text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-6" />
                <th className="py-3 text-left text-sm font-semibold text-gray-900">Deductions</th>
                <th className="py-3 text-right text-sm font-semibold text-gray-900">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.from({
                length: Math.max(activePayslip.earnings.length, activePayslip.deductions.length),
              }).map((_, index) => {
                const earning = activePayslip.earnings[index];
                const deduction = activePayslip.deductions[index];

                return (
                  <tr key={`${earning?.label || 'e'}-${deduction?.label || 'd'}-${index}`}>
                    <td className="py-3 text-sm text-gray-600">{earning?.label || '-'}</td>
                    <td className="py-3 text-right text-sm font-medium">
                      {earning ? formatCurrency(earning.amount) : '-'}
                    </td>
                    <td className="px-6" />
                    <td className="py-3 text-sm text-gray-600">{deduction?.label || '-'}</td>
                    <td className="py-3 text-right text-sm font-medium">
                      {deduction ? formatCurrency(deduction.amount) : '-'}
                    </td>
                  </tr>
                );
              })}

              <tr className="border-t-2 border-indigo-600 font-bold">
                <td className="py-4 text-sm">Total Earnings</td>
                <td className="py-4 text-right text-sm">{formatCurrency(totalEarnings)}</td>
                <td className="px-6" />
                <td className="py-4 text-sm">Total Deductions</td>
                <td className="py-4 text-right text-sm">{formatCurrency(totalDeductions)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-xl bg-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Net Salary (Take Home)</p>
              <p className="mt-1 text-4xl font-bold">{formatCurrency(netSalary)}</p>
              <p className="mt-1 text-xs opacity-75">
                Paid via {activePayslip.paymentMethod} on {activePayslip.paymentDate}
              </p>
            </div>
            <span className="material-symbols-outlined text-5xl opacity-20">payments</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipView;
