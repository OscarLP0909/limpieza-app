import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import Works from './pages/Works';
import WorkDetail from './pages/WorkDetail';
import NewWork from './pages/NewWork';
import Clients from './pages/Clients';
import Employees from './pages/Employees';
import Services from './pages/Services';
import Frequencies from './pages/Frequencies';
import StaffUsers from './pages/StaffUsers';
import AdminGestorDashboard from './pages/dashboard/AdminGestorDashboard';
import ClienteDashboard from './pages/dashboard/ClienteDashboard';
import EmpleadoDashboard from './pages/dashboard/EmpleadoDashboard';

function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'cliente') return <ClienteDashboard />;
  if (user?.role === 'empleado') return <EmpleadoDashboard />;
  return <AdminGestorDashboard />;
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/works" element={
              <ProtectedRoute roles={['admin', 'gestor']}>
                <Works />
              </ProtectedRoute>
            } />
            <Route path="/works/:id" element={<WorkDetail />} />
            <Route path="/new-work" element={
              <ProtectedRoute roles={['cliente']}>
                <NewWork />
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute roles={['admin', 'gestor']}>
                <Clients />
              </ProtectedRoute>
            } />
            <Route path="/employees" element={
              <ProtectedRoute roles={['admin', 'gestor']}>
                <Employees />
              </ProtectedRoute>
            } />
            <Route path="/services" element={
              <ProtectedRoute roles={['admin', 'gestor']}>
                <Services />
              </ProtectedRoute>
            } />
            <Route path="/frequencies" element={
              <ProtectedRoute roles={['admin']}>
                <Frequencies />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute roles={['admin']}>
                <StaffUsers />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
