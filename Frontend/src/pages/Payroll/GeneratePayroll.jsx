import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import PayrollSectionTabs from '../../components/PayrollSectionTabs';

const defaultPayPeriod = new Date().toISOString().slice(0, 7);

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount || 0);

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const inputClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500';

const sectionCardClass = 'rounded-xl border border-gray-200 bg-white p-6 shadow-sm';

const formatPeriodLabel = (period) => {
  if (!period) return '-';

  const [year, month] = String(period)
    .split('-')
    .map((part) => Number(part));

  if (!year || !month) return period;

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
  }).format(new Date(year, month - 1, 1));
};

const GeneratePayroll = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const preselectedEmployeeId = searchParams.get('employee');

  const [activeEmployees, setActiveEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [payPeriod, setPayPeriod] = useState(defaultPayPeriod);

  const [attendanceDays, setAttendanceDays] = useState(22);
  const [unpaidLeaveDays, setUnpaidLeaveDays] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(4);
  const [overtimeRate, setOvertimeRate] = useState(35);
  const [performanceBonus, setPerformanceBonus] = useState(500);
  const [otherAllowance, setOtherAllowance] = useState(0);

  const [taxRate, setTaxRate] = useState(12);
  const [insuranceDeduction, setInsuranceDeduction] = useState(220);
  const [statutoryDeduction, setStatutoryDeduction] = useState(180);
  const [otherDeductions, setOtherDeductions] = useState(0);

  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editData, setEditData] = useState({
    baseSalary: '',
    fixedAllowance: '',
    paymentMethod: 'Bank Transfer',
    bankName: '',
    accountNo: '',
  });
  const [newEmployee, setNewEmployee] = useState({
    id: '',
    name: '',
    department: '',
    baseSalary: '',
    fixedAllowance: '0',
    paymentMethod: 'Bank Transfer',
    bankName: '',
    accountNo: '',
  });

  useEffect(() => {
    const loadEmployees = async () => {
      setLoadingEmployees(true);
      setError('');

      try {
        // Fetch both user list and payroll employee data
        const [usersRes, payrollRes] = await Promise.all([
          apiClient.get('/users'),
          apiClient.get('/payroll/employees').catch(() => ({ data: { data: [] } })),
        ]);

        const list = usersRes.data?.users || [];
        const payrollEmployees = payrollRes.data?.data || [];

        // Build a lookup map from payroll employees by their _id (which is employeeId)
        const payrollMap = {};
        payrollEmployees.forEach((pe) => {
          payrollMap[pe.id || pe._id] = pe;
        });

        const mappedList = list.map((emp) => {
          const empId = emp.employeeId || emp.id;
          const pe = payrollMap[empId]; // match payroll record

          // Remove matched from payrollMap so we know what's left
          if (pe) {
            delete payrollMap[empId];
          }

          return {
            ...emp,
            _id: emp.id || emp.employeeId,
            empID: empId,
            baseSalary: pe?.baseSalary ?? emp.baseSalary ?? 5000,
            fixedAllowance: pe?.fixedAllowance ?? emp.fixedAllowance ?? 1000,
            paymentMethod: pe?.paymentMethod ?? emp.paymentMethod ?? 'Bank Transfer',
            bankName: pe?.bankName ?? emp.bankName ?? '',
            accountNo: pe?.accountNo ?? emp.accountNo ?? '',
          };
        });

        // Add any remaining payroll employees that weren't in the User list
        Object.values(payrollMap).forEach((pe) => {
          mappedList.push({
            ...pe,
            _id: pe.id || pe._id,
            empID: pe.id || pe._id,
            baseSalary: pe.baseSalary ?? 5000,
            fixedAllowance: pe.fixedAllowance ?? 1000,
            paymentMethod: pe.paymentMethod ?? 'Bank Transfer',
            bankName: pe.bankName ?? '',
            accountNo: pe.accountNo ?? '',
          });
        });

        setActiveEmployees(mappedList);

        if (mappedList.length > 0) {
          const selectedId =
            preselectedEmployeeId && mappedList.some((emp) => emp.empID === preselectedEmployeeId)
              ? mappedList.find((emp) => emp.empID === preselectedEmployeeId)?._id
              : mappedList[0]._id;
          setEmployeeId(selectedId);
        }
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load employees');
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, [preselectedEmployeeId]);

  const selectedEmployee = useMemo(
    () => activeEmployees.find((employee) => employee._id === employeeId) || null,
    [employeeId, activeEmployees]
  );

  const payroll = useMemo(() => {
    if (!selectedEmployee) {
      return {
        attendanceEarning: 0,
        leaveDeduction: 0,
        overtimePay: 0,
        gross: 0,
        taxDeduction: 0,
        totalDeductions: 0,
        netSalary: 0,
      };
    }

    const workingDays = 22;
    const dayRate = selectedEmployee.baseSalary / workingDays;

    const attendanceEarning = dayRate * toNumber(attendanceDays);
    const leaveDeduction = dayRate * toNumber(unpaidLeaveDays);
    const overtimePay = toNumber(overtimeHours) * toNumber(overtimeRate);
    const totalAllowance =
      selectedEmployee.fixedAllowance + toNumber(performanceBonus) + toNumber(otherAllowance) + overtimePay;

    const gross = attendanceEarning + totalAllowance;
    const taxDeduction = gross * (toNumber(taxRate) / 100);
    const totalDeductions =
      taxDeduction +
      toNumber(insuranceDeduction) +
      toNumber(statutoryDeduction) +
      toNumber(otherDeductions) +
      leaveDeduction;

    const netSalary = gross - totalDeductions;

    return {
      attendanceEarning,
      leaveDeduction,
      overtimePay,
      gross,
      taxDeduction,
      totalDeductions,
      netSalary,
    };
  }, [
    attendanceDays,
    insuranceDeduction,
    otherAllowance,
    otherDeductions,
    overtimeHours,
    overtimeRate,
    performanceBonus,
    selectedEmployee,
    statutoryDeduction,
    taxRate,
    unpaidLeaveDays,
  ]);

  const payrollHighlights = useMemo(
    () => [
      { label: 'Attendance Salary', value: formatCurrency(payroll.attendanceEarning) },
      { label: 'Overtime Pay', value: formatCurrency(payroll.overtimePay) },
      { label: 'Gross Pay', value: formatCurrency(payroll.gross) },
      { label: 'Total Deductions', value: formatCurrency(payroll.totalDeductions) },
    ],
    [payroll.attendanceEarning, payroll.gross, payroll.overtimePay, payroll.totalDeductions]
  );

  const handleGenerate = async () => {
    if (!selectedEmployee) return;

    setIsGenerating(true);
    setError('');

    try {
      const payload = {
        employeeId: selectedEmployee.empID || selectedEmployee.employeeId || selectedEmployee.id,
        payPeriod,
        attendanceDays: toNumber(attendanceDays),
        unpaidLeaveDays: toNumber(unpaidLeaveDays),
        overtimeHours: toNumber(overtimeHours),
        overtimeRate: toNumber(overtimeRate),
        performanceBonus: toNumber(performanceBonus),
        otherAllowance: toNumber(otherAllowance),
        taxRate: toNumber(taxRate),
        insuranceDeduction: toNumber(insuranceDeduction),
        statutoryDeduction: toNumber(statutoryDeduction),
        otherDeductions: toNumber(otherDeductions),
        status: 'Processed',
      };

      const response = await apiClient.post('/payroll/calculate', payload);
      const payslipId = response.data?.data?.payslip?.id;

      if (payslipId) {
        navigate(`/dashboard/payroll/payslip/${payslipId}`);
        return;
      }

      navigate('/dashboard/payroll/records');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateEmployee = async (event) => {
    event.preventDefault();
    setError('');

    if (!newEmployee.id || !newEmployee.name || !newEmployee.department || !newEmployee.baseSalary) {
      setError('Employee ID, name, department, and base salary are required.');
      return;
    }

    setIsCreatingEmployee(true);

    try {
      const response = await apiClient.post('/payroll/employees', {
        id: newEmployee.id.trim(),
        name: newEmployee.name.trim(),
        department: newEmployee.department.trim(),
        baseSalary: toNumber(newEmployee.baseSalary),
        fixedAllowance: toNumber(newEmployee.fixedAllowance),
        paymentMethod: newEmployee.paymentMethod,
        bankName: newEmployee.bankName.trim(),
        accountNo: newEmployee.accountNo.trim(),
      });

      const created = response.data?.data;
      if (!created) {
        setError('Failed to create employee');
        return;
      }

      const mappedCreated = {
        ...created,
        _id: created.id,
        empID: created.id,
      };
      setActiveEmployees((prev) => [...prev, mappedCreated].sort((a, b) => a.name.localeCompare(b.name)));
      setEmployeeId(mappedCreated._id);
      setNewEmployee({
        id: '',
        name: '',
        department: '',
        baseSalary: '',
        fixedAllowance: '0',
        paymentMethod: 'Bank Transfer',
        bankName: '',
        accountNo: '',
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to create employee');
    } finally {
      setIsCreatingEmployee(false);
    }
  };

  const handleStartEdit = () => {
    if (!selectedEmployee) return;
    setEditData({
      baseSalary: selectedEmployee.baseSalary ?? '',
      fixedAllowance: selectedEmployee.fixedAllowance ?? '',
      paymentMethod: selectedEmployee.paymentMethod || 'Bank Transfer',
      bankName: selectedEmployee.bankName || '',
      accountNo: selectedEmployee.accountNo || '',
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEmployee) return;
    setIsSavingEdit(true);
    setError('');

    const empId = selectedEmployee.empID || selectedEmployee.employeeId || selectedEmployee._id;

    try {
      const response = await apiClient.put(`/payroll/employees/${encodeURIComponent(empId)}`, {
        name: selectedEmployee.name,
        department: selectedEmployee.department,
        baseSalary: toNumber(editData.baseSalary),
        fixedAllowance: toNumber(editData.fixedAllowance),
        paymentMethod: editData.paymentMethod,
        bankName: editData.bankName,
        accountNo: editData.accountNo,
      });

      const updated = response.data?.data;
      if (updated) {
        setActiveEmployees((prev) =>
          prev.map((emp) =>
            emp._id === selectedEmployee._id
              ? { ...emp, baseSalary: updated.baseSalary, fixedAllowance: updated.fixedAllowance, paymentMethod: updated.paymentMethod, bankName: updated.bankName, accountNo: updated.accountNo }
              : emp
          )
        );
      }
      setIsEditing(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update employee salary');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      <PayrollSectionTabs
        title="Generate Payroll"
        description="Build a payroll run with employee details, attendance inputs, allowances, and deductions in a clearer step-by-step layout."
        helper="Create or select the payroll employee, confirm the pay inputs, then review the preview before generating the payslip."
        action={
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !selectedEmployee || loadingEmployees}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-xl">receipt_long</span>
            {isGenerating ? 'Generating...' : 'Generate Payslip'}
          </button>
        }
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={sectionCardClass}>
          <p className="text-sm font-semibold text-gray-900">1. Pick the employee and period</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Select the payroll employee first so the salary preview and payment details stay grounded in real data.
          </p>
        </div>
        <div className={sectionCardClass}>
          <p className="text-sm font-semibold text-gray-900">2. Enter earnings and deductions</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Update attendance, overtime, bonuses, tax, insurance, and any manual adjustments for the pay run.
          </p>
        </div>
        <div className={sectionCardClass}>
          <p className="text-sm font-semibold text-gray-900">3. Review before generating</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            The preview panel shows gross pay, deductions, and final take-home salary before you create the payslip.
          </p>
        </div>
      </div>

      {!loadingEmployees ? (
        <div className={`${sectionCardClass} space-y-6`}>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Payroll Employee</h2>
            <p className="mt-1 text-sm text-gray-600">
              {activeEmployees.length === 0
                ? 'No payroll employees found. Create one below to start entering payroll inputs.'
                : 'Create a new payroll employee if the person is not in the list.'}
            </p>
          </div>

          <form onSubmit={handleCreateEmployee} className="space-y-4">
            <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
              <div className="space-y-6">
                <section className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Employee Basics</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Add the minimum details needed to run payroll for this employee.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-4">
                    <label className="space-y-2 text-sm font-medium text-gray-700">
                      <span>Employee ID</span>
                      <input
                        value={newEmployee.id}
                        onChange={(event) => setNewEmployee((prev) => ({ ...prev, id: event.target.value }))}
                        placeholder="EMP-0001"
                        className={inputClassName}
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-gray-700">
                      <span>Employee Name</span>
                      <input
                        value={newEmployee.name}
                        onChange={(event) => setNewEmployee((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="Jane Perera"
                        className={inputClassName}
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-gray-700">
                      <span>Department</span>
                      <input
                        value={newEmployee.department}
                        onChange={(event) => setNewEmployee((prev) => ({ ...prev, department: event.target.value }))}
                        placeholder="Finance"
                        className={inputClassName}
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-gray-700">
                      <span>Base Salary</span>
                      <input
                        type="number"
                        min="0"
                        value={newEmployee.baseSalary}
                        onChange={(event) => setNewEmployee((prev) => ({ ...prev, baseSalary: event.target.value }))}
                        className={inputClassName}
                      />
                    </label>
                  </div>
                </section>

                <section className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Payment Details</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Set the default allowance and payment method used on the payslip.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-4">
                    <label className="space-y-2 text-sm font-medium text-gray-700">
                      <span>Fixed Allowance</span>
                      <input
                        type="number"
                        min="0"
                        value={newEmployee.fixedAllowance}
                        onChange={(event) => setNewEmployee((prev) => ({ ...prev, fixedAllowance: event.target.value }))}
                        className={inputClassName}
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-gray-700">
                      <span>Payment Method</span>
                      <select
                        value={newEmployee.paymentMethod}
                        onChange={(event) => setNewEmployee((prev) => ({ ...prev, paymentMethod: event.target.value }))}
                        className={inputClassName}
                      >
                        <option>Bank Transfer</option>
                        <option>Direct Deposit</option>
                        <option>Cash</option>
                      </select>
                    </label>
                    <label className="space-y-2 text-sm font-medium text-gray-700">
                      <span>Bank Name</span>
                      <input
                        value={newEmployee.bankName}
                        onChange={(event) => setNewEmployee((prev) => ({ ...prev, bankName: event.target.value }))}
                        placeholder="Commercial Bank"
                        className={inputClassName}
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-gray-700">
                      <span>Account No</span>
                      <input
                        value={newEmployee.accountNo}
                        onChange={(event) => setNewEmployee((prev) => ({ ...prev, accountNo: event.target.value }))}
                        placeholder="1023567890"
                        className={inputClassName}
                      />
                    </label>
                  </div>
                </section>
              </div>

              <aside className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-sm font-semibold text-gray-900">Employee Setup Guide</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Add the employee here if payroll has not been prepared for them yet. They will appear in the selector immediately after saving.
                </p>
                <div className="mt-5 space-y-3">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-semibold text-gray-900">Required</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Employee ID, name, department, and base salary are required before payroll can be generated.
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-semibold text-gray-900">Optional</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Bank name and account number can be added now so the payslip is ready to share.
                    </p>
                  </div>
                </div>
              </aside>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCreatingEmployee}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isCreatingEmployee ? 'Adding Employee...' : 'Add Employee'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <div className={`${sectionCardClass} space-y-6`}>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Payroll Inputs</h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter the pay-period inputs below. The preview card updates instantly as you change values.
            </p>
          </div>

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Employee & Pay Period</h3>
              <p className="mt-1 text-sm text-gray-500">Choose who is being paid and which month the payroll run belongs to.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Employee</span>
                <select
                  value={employeeId}
                  onChange={(event) => setEmployeeId(event.target.value)}
                  disabled={loadingEmployees || activeEmployees.length === 0}
                  className={inputClassName}
                >
                  {activeEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.empID})
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Pay Period</span>
                <input
                  type="month"
                  value={payPeriod}
                  onChange={(event) => setPayPeriod(event.target.value)}
                  className={inputClassName}
                />
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Attendance & Earnings</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add the attendance numbers and extra earnings that affect this month&apos;s payroll.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Attendance Days</span>
                <input
                  type="number"
                  min="0"
                  value={attendanceDays}
                  onChange={(event) => setAttendanceDays(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Unpaid Leave Days</span>
                <input
                  type="number"
                  min="0"
                  value={unpaidLeaveDays}
                  onChange={(event) => setUnpaidLeaveDays(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Overtime Hours</span>
                <input
                  type="number"
                  min="0"
                  value={overtimeHours}
                  onChange={(event) => setOvertimeHours(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Overtime Rate ($/hour)</span>
                <input
                  type="number"
                  min="0"
                  value={overtimeRate}
                  onChange={(event) => setOvertimeRate(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Performance Bonus</span>
                <input
                  type="number"
                  min="0"
                  value={performanceBonus}
                  onChange={(event) => setPerformanceBonus(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Other Allowances</span>
                <input
                  type="number"
                  min="0"
                  value={otherAllowance}
                  onChange={(event) => setOtherAllowance(event.target.value)}
                  className={inputClassName}
                />
              </label>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-200 pt-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Deductions</h3>
              <p className="mt-1 text-sm text-gray-500">
                Update tax, insurance, statutory amounts, and any one-off deductions before finalizing.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Tax Rate (%)</span>
                <input
                  type="number"
                  min="0"
                  value={taxRate}
                  onChange={(event) => setTaxRate(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Insurance</span>
                <input
                  type="number"
                  min="0"
                  value={insuranceDeduction}
                  onChange={(event) => setInsuranceDeduction(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Statutory</span>
                <input
                  type="number"
                  min="0"
                  value={statutoryDeduction}
                  onChange={(event) => setStatutoryDeduction(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Other Deductions</span>
                <input
                  type="number"
                  min="0"
                  value={otherDeductions}
                  onChange={(event) => setOtherDeductions(event.target.value)}
                  className={inputClassName}
                />
              </label>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <div className={`${sectionCardClass} space-y-4`}>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Calculation Preview</h2>
              <p className="mt-1 text-sm text-gray-500">
                This panel summarizes the current payroll run before it becomes a payslip.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Employee</span>
                <span className="font-semibold text-gray-900">{selectedEmployee?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Department</span>
                <span className="font-semibold text-gray-900">{selectedEmployee?.department || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pay Period</span>
                <span className="font-semibold text-gray-900">{formatPeriodLabel(payPeriod)}</span>
              </div>
            </div>

            <div className="grid gap-3">
              {payrollHighlights.map((item) => (
                <div key={item.label} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-indigo-600 p-4 text-white">
              <p className="text-sm opacity-90">Estimated Net Salary</p>
              <p className="mt-1 text-3xl font-bold">{formatCurrency(payroll.netSalary)}</p>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !selectedEmployee || loadingEmployees}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isGenerating ? 'Generating Payroll...' : 'Generate Payroll & Payslip'}
            </button>
          </div>

          <div className={`${sectionCardClass} space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Selected Employee Snapshot</p>
                <p className="text-sm leading-6 text-gray-600">
                  {isEditing ? 'Edit salary and payment details below.' : 'Use this card to sanity-check the payroll setup.'}
                </p>
              </div>
              {selectedEmployee && !isEditing && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Edit Salary
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <label className="space-y-1 text-sm font-medium text-gray-700">
                  <span>Base Salary</span>
                  <input
                    type="number"
                    min="0"
                    value={editData.baseSalary}
                    onChange={(e) => setEditData((p) => ({ ...p, baseSalary: e.target.value }))}
                    className={inputClassName}
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-gray-700">
                  <span>Fixed Allowance</span>
                  <input
                    type="number"
                    min="0"
                    value={editData.fixedAllowance}
                    onChange={(e) => setEditData((p) => ({ ...p, fixedAllowance: e.target.value }))}
                    className={inputClassName}
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-gray-700">
                  <span>Payment Method</span>
                  <select
                    value={editData.paymentMethod}
                    onChange={(e) => setEditData((p) => ({ ...p, paymentMethod: e.target.value }))}
                    className={inputClassName}
                  >
                    <option>Bank Transfer</option>
                    <option>Direct Deposit</option>
                    <option>Cash</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium text-gray-700">
                  <span>Bank Name</span>
                  <input
                    value={editData.bankName}
                    onChange={(e) => setEditData((p) => ({ ...p, bankName: e.target.value }))}
                    className={inputClassName}
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-gray-700">
                  <span>Account No</span>
                  <input
                    value={editData.accountNo}
                    onChange={(e) => setEditData((p) => ({ ...p, accountNo: e.target.value }))}
                    className={inputClassName}
                  />
                </label>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSavingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Base Salary</span>
                  <span className="font-semibold text-gray-900">
                    {selectedEmployee ? formatCurrency(selectedEmployee.baseSalary) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fixed Allowance</span>
                  <span className="font-semibold text-gray-900">
                    {selectedEmployee ? formatCurrency(selectedEmployee.fixedAllowance) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-semibold text-gray-900">{selectedEmployee?.paymentMethod || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bank Name</span>
                  <span className="font-semibold text-gray-900">{selectedEmployee?.bankName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account No</span>
                  <span className="font-semibold text-gray-900">{selectedEmployee?.accountNo || '-'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratePayroll;
