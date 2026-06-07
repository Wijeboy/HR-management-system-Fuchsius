import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import { RoleGuard } from './components/PrivateRoute';
// eslint-disable-next-line no-unused-vars
import { getDefaultRouteForRole } from './utils/roleRouting';
import { ROLE_ACCESS } from './utils/roleAccess';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';

// Dashboard Pages
import Dashboard from './pages/Dashboard/Dashboard';
import HrDashboard from './pages/Dashboard/HrDashboard';
import EmployeeDashboard from './pages/Dashboard/EmployeeDashboard';
import ManagerDashboard from './pages/Dashboard/ManagerDashboard';

// Departments
import DepartmentDirectory from './pages/Departments/DepartmentDirectory';

// Employee Pages
import EmployeeList from './pages/Employees/EmployeeList';
import EmployeeDetails from './pages/Employees/EmployeeDetails';
import AddEmployee from './pages/Employees/AddEmployee';
import EditEmployee from './pages/Employees/EditEmployee';

// Attendance Pages
import AttendanceList from './pages/Attendance/AttendanceList';
import AttendanceReports from './pages/Attendance/AttendanceReports';

// Leave Pages
import LeaveRequests from './pages/Leave/LeaveRequests';
import LeaveBalance from './pages/Leave/LeaveBalance';
import ApplyLeave from './pages/Leave/ApplyLeave';
import HRLeaveApproval from './pages/Leave/HRLeaveApproval';

// Payroll Pages
import PayrollList from './pages/Payroll/PayrollList';
import GeneratePayroll from './pages/Payroll/GeneratePayroll';
import PayslipView from './pages/Payroll/PayslipView';

// Recruitment Pages
import JobPostings from './pages/Recruitment/JobPostings';
import Applicants from './pages/Recruitment/Applicants';
import OnboardingTasks from './pages/Recruitment/OnboardingTasks';

// Performance Pages
import PerformanceReviews from './pages/Performance/PerformanceReviews';
import GoalsKPIs from './pages/Performance/GoalsKPIs';

// Reports Pages
import Reports from './pages/Reports/Reports';

// Settings Pages
import Profile from './pages/Settings/Profile';
import Settings from './pages/Settings/Settings';

// 404 Page
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />

              {/* Dashboard */}
              <Route path="dashboard" element={<RoleGuard allowedRoles={ROLE_ACCESS.dashboard}><Dashboard /></RoleGuard>} />
              
              {/* HR Dashboard Route */}
              <Route path="hr-dashboard" element={<RoleGuard allowedRoles={ROLE_ACCESS.dashboard}><HrDashboard /></RoleGuard>} />
              
              {/* Employee Dashboard Route (புதிதாக இணைக்கப்பட்டது) */}
              <Route path="employee-dashboard" element={<RoleGuard allowedRoles={ROLE_ACCESS.dashboard}><EmployeeDashboard /></RoleGuard>} />

              {/* Manager Dashboard Route */}
              <Route path="manager-dashboard" element={<RoleGuard allowedRoles={ROLE_ACCESS.dashboard}><ManagerDashboard /></RoleGuard>} />

              <Route path="departments" element={<RoleGuard allowedRoles={ROLE_ACCESS.departmentsView}><DepartmentDirectory /></RoleGuard>} />

              {/* Employees */}
              <Route path="employees" element={<RoleGuard allowedRoles={ROLE_ACCESS.employeesView}><EmployeeList /></RoleGuard>} />
              <Route path="employees/:id" element={<RoleGuard allowedRoles={ROLE_ACCESS.employeesView}><EmployeeDetails /></RoleGuard>} />
              <Route path="employees/add" element={<RoleGuard allowedRoles={ROLE_ACCESS.employeesEdit}><AddEmployee /></RoleGuard>} />
              <Route path="employees/edit/:id" element={<RoleGuard allowedRoles={ROLE_ACCESS.employeesEdit}><EditEmployee /></RoleGuard>} />

              {/* Attendance */}
              <Route path="attendance" element={<RoleGuard allowedRoles={ROLE_ACCESS.attendanceSelf}><AttendanceList /></RoleGuard>} />
              <Route path="attendance/reports" element={<RoleGuard allowedRoles={ROLE_ACCESS.attendanceReports}><AttendanceReports /></RoleGuard>} />

              {/* Leave */}
              <Route path="leave/requests" element={<RoleGuard allowedRoles={ROLE_ACCESS.leaveRequests}><LeaveRequests /></RoleGuard>} />
              <Route path="leave/balance" element={<RoleGuard allowedRoles={ROLE_ACCESS.leaveBalance}><LeaveBalance /></RoleGuard>} />
              <Route path="leave/apply" element={<RoleGuard allowedRoles={ROLE_ACCESS.leaveApply}><ApplyLeave /></RoleGuard>} />
              <Route path="leave/manage" element={<RoleGuard allowedRoles={ROLE_ACCESS.leaveManage}><HRLeaveApproval /></RoleGuard>} />

              {/* Payroll */}
              <Route path="payroll" element={<RoleGuard allowedRoles={ROLE_ACCESS.payrollView}><PayrollList /></RoleGuard>} />
              <Route path="payroll/generate" element={<RoleGuard allowedRoles={ROLE_ACCESS.payrollGenerate}><GeneratePayroll /></RoleGuard>} />
              <Route path="payroll/payslips" element={<RoleGuard allowedRoles={ROLE_ACCESS.payrollPayslip}><PayslipView /></RoleGuard>} />
              <Route path="payroll/payslip/:id" element={<RoleGuard allowedRoles={ROLE_ACCESS.payrollPayslip}><PayslipView /></RoleGuard>} />

              {/* Recruitment */}
              <Route path="recruitment/jobs" element={<RoleGuard allowedRoles={ROLE_ACCESS.recruitmentJobs}><JobPostings /></RoleGuard>} />
              <Route path="recruitment/applicants" element={<RoleGuard allowedRoles={ROLE_ACCESS.recruitmentApplicants}><Applicants /></RoleGuard>} />
              <Route path="recruitment/onboarding" element={<RoleGuard allowedRoles={ROLE_ACCESS.recruitmentOnboarding}><OnboardingTasks /></RoleGuard>} />

              {/* Performance */}
              <Route path="performance/reviews" element={<RoleGuard allowedRoles={ROLE_ACCESS.performanceReviews}><PerformanceReviews /></RoleGuard>} />
              <Route path="performance/goals" element={<RoleGuard allowedRoles={ROLE_ACCESS.performanceGoals}><GoalsKPIs /></RoleGuard>} />

              {/* Reports */}
              <Route path="reports" element={<RoleGuard allowedRoles={ROLE_ACCESS.reports}><Reports /></RoleGuard>} />

              {/* Settings */}
              <Route path="profile" element={<RoleGuard allowedRoles={ROLE_ACCESS.profile}><Profile /></RoleGuard>} />
              <Route path="settings" element={<RoleGuard allowedRoles={ROLE_ACCESS.settings}><Settings /></RoleGuard>} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;