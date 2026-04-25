import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';

// Employee
import EmployeeDashboard from './pages/employee/Dashboard';
import GoalSetting from './pages/employee/GoalSetting';
import MidYearReview from './pages/employee/MidYearReview';
import SelfAppraisal from './pages/employee/SelfAppraisal';

// Officer
import OfficerDashboard from './pages/officer/Dashboard';
import GoalApproval from './pages/officer/GoalApproval';
import OfficerMidYear from './pages/officer/OfficerMidYear';
import RatingPage from './pages/officer/RatingPage';

// HR
import AdminDashboard from './pages/hr/AdminDashboard';
import CycleManagement from './pages/hr/CycleManagement';
import UserManagement from './pages/hr/UserManagement';
import Reports from './pages/hr/Reports';
import AttributeManagement from './pages/hr/AttributeManagement';

const EMP = ['EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'];
const OFF = ['REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'];
const OFF_RO = ['REPORTING_OFFICER'];
const HR = ['HR'];

export default function App() {
  return (
    <AuthProvider>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus {
          outline: 2px solid #3b82f6;
          border-color: #3b82f6;
        }
        button:hover:not(:disabled) { opacity: 0.88; }
        a:hover { opacity: 0.8; }
      `}</style>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Employee */}
          <Route path="/employee/dashboard" element={<ProtectedRoute roles={EMP}><EmployeeDashboard /></ProtectedRoute>} />
          <Route path="/employee/goals" element={<ProtectedRoute roles={EMP}><GoalSetting /></ProtectedRoute>} />
          <Route path="/employee/mid-year" element={<ProtectedRoute roles={EMP}><MidYearReview /></ProtectedRoute>} />
          <Route path="/employee/appraisal" element={<ProtectedRoute roles={EMP}><SelfAppraisal /></ProtectedRoute>} />

          {/* Officers */}
          <Route path="/officer/dashboard" element={<ProtectedRoute roles={OFF}><OfficerDashboard /></ProtectedRoute>} />
          <Route path="/officer/goals" element={<ProtectedRoute roles={OFF_RO}><GoalApproval /></ProtectedRoute>} />
          <Route path="/officer/mid-year" element={<ProtectedRoute roles={OFF_RO}><OfficerMidYear /></ProtectedRoute>} />
          <Route path="/officer/ratings" element={<ProtectedRoute roles={OFF}><RatingPage /></ProtectedRoute>} />

          {/* HR */}
          <Route path="/hr/dashboard" element={<ProtectedRoute roles={HR}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/hr/cycles" element={<ProtectedRoute roles={HR}><CycleManagement /></ProtectedRoute>} />
          <Route path="/hr/users" element={<ProtectedRoute roles={HR}><UserManagement /></ProtectedRoute>} />
          <Route path="/hr/reports" element={<ProtectedRoute roles={HR}><Reports /></ProtectedRoute>} />
          <Route path="/hr/attributes" element={<ProtectedRoute roles={HR}><AttributeManagement /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
