import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Works from './pages/Works';
import WorkDetail from './pages/WorkDetail';
import Employees from './pages/Employees';
import Clients from './pages/Clients';
import Services from './pages/Services';
import NewWork from './pages/NewWork';
import AdminGestorDashboard from './pages/dashboard/AdminGestorDashboard';
import ClienteDashboard from './pages/dashboard/ClienteDashboard';
import EmpleadoDashboard from './pages/dashboard/EmpleadoDashboard';
import ClientProfile from './pages/ClientProfile';
import EmployeeProfile from './pages/EmployeeProfile';
import StaffUsers from './pages/StaffUsers';

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'admin' || user.role === 'gestor') return <AdminGestorDashboard />;
  if (user.role === 'empleado') return <EmpleadoDashboard />;
  return <ClienteDashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard — content depends on role */}
          <Route path="dashboard" element={<DashboardRouter />} />

          {/* Admin & Gestor routes */}
          <Route
            path="works"
            element={
              <ProtectedRoute roles={['admin', 'gestor']}>
                <Works />
              </ProtectedRoute>
            }
          />
          <Route
            path="works/:id"
            element={
              <ProtectedRoute roles={['admin', 'gestor']}>
                <WorkDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="employees"
            element={
              <ProtectedRoute roles={['admin', 'gestor']}>
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="clients"
            element={
              <ProtectedRoute roles={['admin', 'gestor']}>
                <Clients />
              </ProtectedRoute>
            }
          />

          {/* Admin only routes */}
          <Route
            path="services"
            element={
              <ProtectedRoute roles={['admin']}>
                <Services />
              </ProtectedRoute>
            }
          />
          <Route
            path="staff-users"
            element={
              <ProtectedRoute roles={['admin']}>
                <StaffUsers />
              </ProtectedRoute>
            }
          />

          {/* Cliente routes */}
          <Route
            path="new-work"
            element={
              <ProtectedRoute roles={['cliente']}>
                <NewWork />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute roles={['cliente']}>
                <ClientProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="employee-profile"
            element={
              <ProtectedRoute roles={['empleado']}>
                <EmployeeProfile />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
